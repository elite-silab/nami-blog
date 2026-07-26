import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";
import { seedDatabase } from "./helpers";
import { publicCacheKeys } from "../lib/public-cache";

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
  it("发布公开文章后应清除公开列表缓存", async () => {
    const key = publicCacheKeys.posts(1, 99, "", "");
    await (env as any).CACHE.delete(key);

    const first = await apiFetch("/api/v1/posts?page=1&limit=99");
    const cached = await apiFetch("/api/v1/posts?page=1&limit=99");
    expect(first.headers.get("X-Nami-Cache")).toBe("MISS");
    expect(cached.headers.get("X-Nami-Cache")).toBe("HIT");

    const create = await apiFetch("/api/admin/posts", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "KV 缓存失效测试",
        slug: "kv-cache-invalidation-test",
        content: "公开正文",
        status: "published",
        is_public: 1,
      }),
    });
    expect(create.status).toBe(200);

    const refreshed = await apiFetch("/api/v1/posts?page=1&limit=99");
    const payload = (await refreshed.json()) as { data: Array<{ slug: string }> };
    expect(refreshed.headers.get("X-Nami-Cache")).toBe("MISS");
    expect(payload.data.some((post) => post.slug === "kv-cache-invalidation-test")).toBe(true);
  });

  it("仅保存草稿时不应清除公开列表缓存", async () => {
    const key = publicCacheKeys.posts(1, 98, "", "");
    await (env as any).CACHE.delete(key);
    await apiFetch("/api/v1/posts?page=1&limit=98");
    const cached = await apiFetch("/api/v1/posts?page=1&limit=98");
    expect(cached.headers.get("X-Nami-Cache")).toBe("HIT");

    const create = await apiFetch("/api/admin/posts", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "KV 草稿测试",
        slug: "kv-cache-draft-test",
        content: "草稿正文",
        status: "draft",
      }),
    });
    expect(create.status).toBe(200);

    const afterDraft = await apiFetch("/api/v1/posts?page=1&limit=98");
    expect(afterDraft.headers.get("X-Nami-Cache")).toBe("HIT");
  });

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
    const created = (await create.json()) as {
      data: { id: number; publication: { status: string } };
    };
    expect(created.data.publication.status).toBe("not_needed");

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

  it("发布公开文章时应返回前台更新状态", async () => {
    const response = await apiFetch("/api/admin/posts", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "自动更新测试文章",
        slug: "pages-deploy-status-test",
        content: "公开正文",
        status: "published",
        is_public: 1,
      }),
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      data: { publication: { status: string } };
    };
    expect(result.data.publication.status).toBe("live");
  });

  it("仪表盘应返回真实总浏览量和分类标签数量", async () => {
    await (env as any).DB.prepare(
      "UPDATE posts SET view_count = CASE id WHEN 1 THEN 3 WHEN 2 THEN 4 ELSE 0 END",
    ).run();

    const response = await apiFetch("/api/admin/dashboard", {
      headers: { Authorization: authorization },
    });
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      data: {
        views: { total: number };
        taxonomies: { categories: number; tags: number };
      };
    };

    expect(result.data.views.total).toBe(7);
    expect(result.data.taxonomies).toEqual({ categories: 1, tags: 1 });
  });
});
