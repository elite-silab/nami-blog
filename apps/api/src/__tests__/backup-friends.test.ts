import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";
import { seedDatabase } from "./helpers";

async function apiFetch(path: string, init?: RequestInit) {
  return app.fetch(new Request(`http://localhost${path}`, init), env as any);
}

let authorization = "";

beforeAll(async () => {
  await seedDatabase();
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "testpass123" }),
  });
  const result = (await response.json()) as { data: { accessToken: string } };
  authorization = `Bearer ${result.data.accessToken}`;
});

function adminHeaders() {
  return { Authorization: authorization, "Content-Type": "application/json" };
}

describe("友链简化流程", () => {
  it("后台添加友链后应立即公开并触发前台更新", async () => {
    const create = await apiFetch("/api/admin/friends", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: "新朋友",
        url: "https://friend.example.com",
        description: "无需审核",
      }),
    });
    expect(create.status).toBe(200);
    const created = (await create.json()) as any;
    expect(created.data.deployment.status).toBe("not_configured");

    const publicList = await apiFetch("/api/v1/friends");
    const result = (await publicList.json()) as any;
    expect(result.data.map((friend: any) => friend.name)).toContain("新朋友");
  });
});

describe("网站数据备份", () => {
  it("未登录访客不能导出或导入备份", async () => {
    const exported = await apiFetch("/api/admin/backup");
    const imported = await apiFetch("/api/admin/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    expect(exported.status).toBe(401);
    expect(imported.status).toBe(401);
  });

  it("导出应包含内容数据但不包含账号与访问隐私", async () => {
    const response = await apiFetch("/api/admin/backup", {
      headers: { Authorization: authorization },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Disposition")).toContain(
      "nami-blog-backup-",
    );

    const text = await response.text();
    const backup = JSON.parse(text);
    expect(backup.format).toBe("nami-blog-backup");
    expect(backup.version).toBe(1);
    expect(backup.data.posts.length).toBe(3);
    expect(backup.data.friends.length).toBe(3);
    expect(text).not.toContain("password_hash");
    expect(text).not.toContain("refresh_tokens");
    expect(text).not.toContain("ip_address");
    expect(text).not.toContain("user_agent");
  });

  it("关联关系无效时应在清空现有数据前拒绝导入", async () => {
    const exported = await apiFetch("/api/admin/backup", {
      headers: { Authorization: authorization },
    });
    const backup = (await exported.json()) as any;
    backup.data.post_categories = [{ post_id: 999, category_id: 1 }];

    const response = await apiFetch("/api/admin/backup/import", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(backup),
    });
    expect(response.status).toBe(400);

    const posts = await apiFetch("/api/v1/posts");
    const result = (await posts.json()) as any;
    expect(result.data.length).toBe(2);
  });

  it("应从 JSON 备份恢复文章、关联数据和友链", async () => {
    const exported = await apiFetch("/api/admin/backup", {
      headers: { Authorization: authorization },
    });
    const backup = await exported.json();

    await (env as any).DB.prepare(
      "UPDATE posts SET deleted_at = datetime('now') WHERE id = 1",
    ).run();

    const response = await apiFetch("/api/admin/backup/import", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(backup),
    });
    expect(response.status).toBe(200);
    const result = (await response.json()) as any;
    expect(result.data.deployment.status).toBe("not_configured");

    const posts = await apiFetch("/api/v1/posts");
    const postList = (await posts.json()) as any;
    expect(postList.data.map((post: any) => post.slug)).toContain("test-post");

    const friends = await apiFetch("/api/v1/friends");
    const friendList = (await friends.json()) as any;
    expect(friendList.data.map((friend: any) => friend.name)).toContain("新朋友");
  });
});
