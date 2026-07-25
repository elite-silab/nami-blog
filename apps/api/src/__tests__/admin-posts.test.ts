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

describe("管理端文章写作流程", () => {
  it("应创建中文 slug 文章并允许清空可选字段", async () => {
    const create = await apiFetch("/api/admin/posts", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Cloudflare 轻量博客",
        slug: "cloudflare-轻量博客",
        content: "初始正文",
        excerpt: "初始摘要",
        cover_url: "https://example.com/cover.webp",
        status: "draft",
      }),
    });
    expect(create.status).toBe(200);
    const created = (await create.json()) as { data: { id: number } };

    const update = await apiFetch(`/api/admin/posts/${created.data.id}`, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Cloudflare 轻量博客",
        slug: "cloudflare-轻量博客",
        content: "更新 后 的 正文",
        excerpt: "",
        cover_url: null,
      }),
    });
    expect(update.status).toBe(200);

    const detail = await apiFetch(`/api/admin/posts/${created.data.id}`, {
      headers: { Authorization: authorization },
    });
    const post = (await detail.json()) as {
      data: { excerpt: string | null; cover_url: string | null; word_count: number };
    };
    expect(post.data.excerpt).toBeNull();
    expect(post.data.cover_url).toBeNull();
    expect(post.data.word_count).toBe(6);
  });

  it("重复 slug 应返回明确的冲突错误", async () => {
    const response = await apiFetch("/api/admin/posts", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "重复文章",
        slug: "test-post",
        content: "正文",
        status: "draft",
      }),
    });

    expect(response.status).toBe(409);
    const result = (await response.json()) as { error: { code: string } };
    expect(result.error.code).toBe("CONFLICT");
  });
});
