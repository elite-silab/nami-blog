/**
 * 公开 API 路由集成测试
 * 使用 @cloudflare/vitest-pool-workers 提供的 D1 绑定
 */
import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";
import { seedDatabase } from "./helpers";

// 测试辅助: 创建带 env 绑定的请求
function createRequest(path: string, init?: RequestInit) {
  const url = `http://localhost${path}`;
  return new Request(url, init);
}

// 模拟 app.fetch 带 env
async function apiFetch(path: string, init?: RequestInit) {
  const req = createRequest(path, init);
  return app.fetch(req, env as any);
}

beforeAll(async () => {
  await seedDatabase();
});

describe("GET / — 健康检查", () => {
  it("应返回 status ok", async () => {
    const res = await apiFetch("/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe("ok");
    expect(json.service).toBe("nami-blog");
  });
});

describe("GET /api/v1/posts — 文章列表", () => {
  it("应返回已发布的文章（不含草稿）", async () => {
    const res = await apiFetch("/api/v1/posts");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;

    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBe(true);

    // 应有 2 篇已发布文章，不含草稿
    expect(json.data.length).toBe(2);
    const slugs = json.data.map((p: any) => p.slug);
    expect(slugs).toContain("test-post");
    expect(slugs).toContain("pinned-post");
    expect(slugs).not.toContain("draft-post");
  });

  it("置顶文章应排在前面", async () => {
    const res = await apiFetch("/api/v1/posts");
    const json = (await res.json()) as any;
    expect(json.data[0].is_pinned).toBe(1);
    expect(json.data[0].slug).toBe("pinned-post");
  });

  it("应返回分页 meta 信息", async () => {
    const res = await apiFetch("/api/v1/posts?page=1&limit=1");
    const json = (await res.json()) as any;
    expect(json.meta).toBeDefined();
    expect(json.meta.page).toBe(1);
    expect(json.meta.limit).toBe(1);
    expect(json.meta.total).toBe(2);
    expect(json.data.length).toBe(1);
  });

  it("按分类筛选", async () => {
    const res = await apiFetch("/api/v1/posts?category=tech");
    const json = (await res.json()) as any;
    expect(json.data.length).toBe(1);
    expect(json.data[0].slug).toBe("test-post");
  });

  it("按标签筛选", async () => {
    const res = await apiFetch("/api/v1/posts?tag=javascript");
    const json = (await res.json()) as any;
    expect(json.data.length).toBe(1);
    expect(json.data[0].slug).toBe("test-post");
  });

  it("关键词搜索", async () => {
    const res = await apiFetch("/api/v1/posts?q=置顶");
    const json = (await res.json()) as any;
    expect(json.data.length).toBe(1);
    expect(json.data[0].slug).toBe("pinned-post");
  });

  it("搜索无结果应返回空数组", async () => {
    const res = await apiFetch("/api/v1/posts?q=不存在的关键词");
    const json = (await res.json()) as any;
    expect(json.data.length).toBe(0);
    expect(json.meta.total).toBe(0);
  });
});

describe("GET /api/v1/posts/:slug — 文章详情", () => {
  it("应返回文章详情 + 分类 + 标签", async () => {
    const res = await apiFetch("/api/v1/posts/test-post");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;

    expect(json.data.title).toBe("测试文章");
    expect(json.data.content).toBeDefined();
    expect(json.data.categories).toBeDefined();
    expect(json.data.tags).toBeDefined();
    expect(json.data.categories.length).toBe(1);
    expect(json.data.categories[0].name).toBe("技术");
    expect(json.data.tags.length).toBe(1);
    expect(json.data.tags[0].name).toBe("JavaScript");
  });

  it("不存在的文章应返回 404", async () => {
    const res = await apiFetch("/api/v1/posts/nonexistent");
    expect(res.status).toBe(404);
    const json = (await res.json()) as any;
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("草稿文章不应被公开访问", async () => {
    const res = await apiFetch("/api/v1/posts/draft-post");
    expect(res.status).toBe(404);
  });

  it("读取文章详情不应增加浏览量", async () => {
    const first = await apiFetch("/api/v1/posts/test-post");
    const firstJson = (await first.json()) as any;
    const second = await apiFetch("/api/v1/posts/test-post");
    const secondJson = (await second.json()) as any;

    expect(secondJson.data.view_count).toBe(firstJson.data.view_count);
  });
});

describe("POST /api/v1/posts/:slug/view — 阅读统计", () => {
  it("应只为已发布公开文章增加一次浏览量", async () => {
    const detail = await apiFetch("/api/v1/posts/pinned-post");
    const before = (await detail.json()) as any;

    const response = await apiFetch("/api/v1/posts/pinned-post/view", {
      method: "POST",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const result = (await response.json()) as any;
    expect(result.data.view_count).toBe(before.data.view_count + 1);
  });

  it("草稿或不存在的文章不能增加浏览量", async () => {
    const draft = await apiFetch("/api/v1/posts/draft-post/view", {
      method: "POST",
    });
    const missing = await apiFetch("/api/v1/posts/not-found/view", {
      method: "POST",
    });

    expect(draft.status).toBe(404);
    expect(missing.status).toBe(404);
  });
});

describe("GET /api/v1/categories — 分类列表", () => {
  it("应返回所有分类", async () => {
    const res = await apiFetch("/api/v1/categories");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toBeDefined();
    expect(json.data.length).toBe(1);
    expect(json.data[0].name).toBe("技术");
    expect(json.data[0].slug).toBe("tech");
  });
});

describe("GET /api/v1/tags — 标签列表", () => {
  it("应返回所有标签", async () => {
    const res = await apiFetch("/api/v1/tags");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toBeDefined();
    expect(json.data.length).toBe(1);
    expect(json.data[0].name).toBe("JavaScript");
  });
});

describe("GET /api/v1/friends — 友链列表", () => {
  it("应返回全部未删除友链，不再要求审核", async () => {
    const res = await apiFetch("/api/v1/friends");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.length).toBe(2);
    expect(json.data.map((friend: any) => friend.name)).toEqual(
      expect.arrayContaining(["测试友链", "待审核友链"]),
    );
    expect(json.data[0].status).toBeUndefined(); // 不返回 status 字段
  });
});

describe("GET /api/v1/settings — 公开站点设置", () => {
  it("应返回公开的站点配置", async () => {
    const res = await apiFetch("/api/v1/settings");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toBeDefined();
    expect(json.data.site_name).toBe("Nami Blog");
    expect(json.data.site_description).toBe("测试站点描述");
    expect(json.data.comment_enabled).toBe(true);
    expect(json.data.site_theme).toBe("sakura");
    expect(json.data.social_links).toEqual({
      github: "https://github.com/test-user",
    });
  });

  it("不应返回敏感配置", async () => {
    const res = await apiFetch("/api/v1/settings");
    const json = (await res.json()) as any;
    // 不在 publicKeys 中的 key 不应被返回
    expect(json.data.comment_auto_approve).toBeUndefined();
    expect(json.data.sensitive_words).toBeUndefined();
  });
});
