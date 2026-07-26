import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(appDir, "../..");
const outputDir = path.join(appDir, ".open-next");
const envNames = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.development",
  ".env.development.local",
  ".env.test",
  ".env.test.local",
];
const envPaths = [rootDir, appDir].flatMap((directory) =>
  envNames.map((name) => path.join(directory, name)),
);
const movedEnvFiles = [];
const localSecretValues = new Map();

function rememberLocalSecrets(filePath) {
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^(JWT_SECRET|JWT_REFRESH_SECRET)=(.*)$/);
    if (match?.[2] && match[2].length >= 8) {
      localSecretValues.set(match[1], match[2]);
    }
  }
}

function hideEnvFiles() {
  for (const filePath of envPaths) {
    const backupPath = `${filePath}.opennext-build-backup`;

    if (existsSync(backupPath) && existsSync(filePath)) {
      throw new Error(
        `同时发现 ${path.basename(filePath)} 和它的构建备份，请先确认文件内容后再构建。`,
      );
    }

    if (existsSync(backupPath)) {
      renameSync(backupPath, filePath);
    }

    if (!existsSync(filePath)) continue;
    rememberLocalSecrets(filePath);
    renameSync(filePath, backupPath);
    movedEnvFiles.push([filePath, backupPath]);
  }
}

function restoreEnvFiles() {
  for (const [filePath, backupPath] of movedEnvFiles.reverse()) {
    if (existsSync(backupPath)) {
      renameSync(backupPath, filePath);
    }
  }
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function verifyBundleDoesNotContainLocalSecrets() {
  const nextEnvPath = path.join(outputDir, "cloudflare", "next-env.mjs");
  const nextEnv = existsSync(nextEnvPath) ? readFileSync(nextEnvPath, "utf8") : "";
  const forbiddenKeys = [
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "ADMIN_INITIAL_PASSWORD",
  ];
  const leakedKeys = forbiddenKeys.filter((key) => nextEnv.includes(`\"${key}\"`));
  if (leakedKeys.length > 0) {
    throw new Error(`Worker 环境文件包含本地私密变量：${leakedKeys.join(", ")}`);
  }

  for (const filePath of walkFiles(outputDir)) {
    const content = readFileSync(filePath);
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    for (const [key, value] of localSecretValues) {
      if (text.includes(value)) {
        throw new Error(
          `Worker 产物包含本地 ${key}，已终止构建：${path.relative(rootDir, filePath)}`,
        );
      }
    }
  }
}

let buildResult;
try {
  hideEnvFiles();
  rmSync(outputDir, { recursive: true, force: true });

  const childEnv = { ...process.env, NODE_ENV: "production" };
  delete childEnv.ADMIN_INITIAL_PASSWORD;
  delete childEnv.JWT_SECRET;
  delete childEnv.JWT_REFRESH_SECRET;

  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  buildResult = spawnSync(
    pnpm,
    ["exec", "opennextjs-cloudflare", "build", "--config", "../../wrangler.jsonc"],
    {
      cwd: appDir,
      env: childEnv,
      stdio: "inherit",
    },
  );

  if (buildResult.error) throw buildResult.error;
  if (buildResult.status === 0) {
    verifyBundleDoesNotContainLocalSecrets();
    console.log("Worker 安全检查通过：生产产物未包含本地开发密钥。");
  }
} finally {
  restoreEnvFiles();
}

if (buildResult?.status !== 0) {
  process.exitCode = buildResult?.status ?? 1;
}
