import { describe, expect, it, vi } from "vitest";
import { trackPostView } from "./view-tracker";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("文章阅读统计", () => {
  it("首次打开文章时应上报并返回最新浏览量", async () => {
    const storage = createStorage();
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ data: { view_count: 7 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      trackPostView(
        "https://api.example.com/",
        "中文 slug",
        fetcher,
        storage,
      ),
    ).resolves.toBe(7);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/posts/%E4%B8%AD%E6%96%87%20slug/view",
      { method: "POST", cache: "no-store" },
    );
  });

  it("同一标签页内不应重复上报同一文章", async () => {
    const storage = createStorage();
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ data: { view_count: 1 } }), {
        status: 200,
      }),
    );

    await trackPostView("https://api.example.com", "same-post", fetcher, storage);
    await expect(
      trackPostView("https://api.example.com", "same-post", fetcher, storage),
    ).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("上报失败时不应标记已统计，以便稍后重试", async () => {
    const storage = createStorage();
    const fetcher = vi.fn(async () => new Response(null, { status: 503 }));

    await expect(
      trackPostView("https://api.example.com", "retry-post", fetcher, storage),
    ).resolves.toBeNull();
    await trackPostView(
      "https://api.example.com",
      "retry-post",
      fetcher,
      storage,
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
