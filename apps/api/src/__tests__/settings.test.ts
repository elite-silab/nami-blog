import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";
import { seedDatabase } from "./helpers";
import { publicCacheKeys } from "../lib/public-cache";

async function apiFetch(path: string, init?: RequestInit) {
  return app.fetch(new Request(`http://localhost${path}`, init), env as never);
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

describe("首页与关于页设置", () => {
  it("后台保存后应立即通过公开设置返回", async () => {
    await (env as never as { CACHE: KVNamespace }).CACHE.delete(
      publicCacheKeys.settings,
    );
    await apiFetch("/api/v1/settings");

    const response = await apiFetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        home_eyebrow: "From the Grand Line",
        home_title: "写给新的航程",
        home_title_highlight: "风与海。",
        home_description: "记录一路上的发现。",
        home_primary_label: "阅读新文章",
        home_secondary_label: "关于这里",
        site_about: "## 关于这里\n\n这是一段 **Markdown**。",
      }),
    });

    expect(response.status).toBe(200);
    const saved = (await response.json()) as {
      data: { publication: { status: string } };
    };
    expect(saved.data.publication.status).toBe("live");

    const publicResponse = await apiFetch("/api/v1/settings");
    const result = (await publicResponse.json()) as {
      data: Record<string, string>;
    };
    expect(publicResponse.headers.get("X-Nami-Cache")).toBe("MISS");
    expect(result.data).toMatchObject({
      home_eyebrow: "From the Grand Line",
      home_title: "写给新的航程",
      home_title_highlight: "风与海。",
      home_description: "记录一路上的发现。",
      home_primary_label: "阅读新文章",
      home_secondary_label: "关于这里",
      site_about: "## 关于这里\n\n这是一段 **Markdown**。",
    });
  });

  it.each([
    ["错误类型", { home_title: 123 }, "首页主标题必须是文本"],
    [
      "超长内容",
      { site_about: "海".repeat(50_001) },
      "关于页内容不能超过 50000 个字符",
    ],
  ])("应拒绝%s", async (_name, body, message) => {
    const response = await apiFetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "BAD_REQUEST", message },
    });
  });
});
