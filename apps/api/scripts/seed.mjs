import { spawnSync } from "node:child_process";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";

const isRemote = process.argv.includes("--remote");

function escapeSql(value) {
  return value.replaceAll("'", "''");
}

async function askHidden(label) {
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (buffer) => {
      // 终端粘贴可能一次送入整段文本和回车，因此需要逐字符处理。
      const input = buffer
        .toString("utf8")
        .replaceAll(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");

      for (const key of input) {
        if (key === "\u0003" || key === "\u0004") {
          cleanup();
          stdout.write("\n");
          reject(new Error("已取消"));
          return;
        }
        if (key === "\r" || key === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (key === "\u007f" || key === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (key !== "\u001b") value += key;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("请在 VS Code、Cursor 或系统的交互式终端中运行此命令");
  }

  console.log(`\nNami Blog 管理员初始化（${isRemote ? "远程 D1" : "本地 D1"}）\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  let username;
  let email;
  try {
    if (isRemote) {
      const confirmation = await rl.question("这是生产/远程数据库。输入 CREATE 确认继续：");
      if (confirmation.trim() !== "CREATE") {
        throw new Error("确认文字不匹配，已取消");
      }
    }

    username = (await rl.question("管理员用户名 [admin]：")).trim() || "admin";
    email = (await rl.question("管理员邮箱：")).trim();
  } finally {
    rl.close();
  }

  const password = await askHidden("管理员密码（至少 8 个字符，输入不会显示）：");
  const passwordAgain = await askHidden("再次输入密码：");

  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(username)) {
    throw new Error("用户名只能包含字母、数字、点、下划线或短横线，最长 64 个字符");
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255) {
    throw new Error("邮箱格式不正确");
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error("密码长度必须为 8–128 个字符");
  }
  if (password !== passwordAgain) throw new Error("两次输入的密码不一致");

  console.log("正在生成密码哈希并写入 D1…");
  const passwordHash = await bcrypt.hash(password, 12);
  const sql = `INSERT INTO users (username, email, password_hash, display_name, role, status) VALUES ('${escapeSql(username)}', '${escapeSql(email)}', '${escapeSql(passwordHash)}', '${escapeSql(username)}', 'admin', 'active');`;

  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const args = [
    "exec",
    "wrangler",
    "d1",
    "execute",
    "nami-blog",
    isRemote ? "--remote" : "--local",
    "--config",
    "../../wrangler.jsonc",
    "--command",
    sql,
  ];
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("D1 写入失败，请查看上方 Wrangler 错误信息");

  console.log(`\n管理员 ${username} 创建成功。${isRemote ? "" : "现在可以启动项目并访问 http://localhost:4322/admin/login。"}\n`);
}

main().catch((error) => {
  console.error(`\n创建失败：${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
