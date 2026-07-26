import { describe, expect, it, vi } from "vitest";
import {
  PUBLIC_CACHE_PREFIX,
  invalidatePublicCache,
  publicCacheKey,
  readThroughPublicCache,
} from "../lib/public-cache";

class FakeKV {
  readonly values = new Map<string, string>();
  failGet = false;
  failPut = false;
  failList = false;

  async get(key: string, type?: string) {
    if (this.failGet) throw new Error("KV get failed");
    const value = this.values.get(key);
    if (value === undefined) return null;
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key: string, value: string) {
    if (this.failPut) throw new Error("KV put failed");
    this.values.set(key, value);
  }

  async delete(key: string) {
    this.values.delete(key);
  }

  async list({ prefix = "" }: { prefix?: string } = {}) {
    if (this.failList) throw new Error("KV list failed");
    return {
      keys: [...this.values.keys()]
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name })),
      list_complete: true,
      cacheStatus: null,
    };
  }
}

describe("公开 KV 缓存", () => {
  it("未配置 KV 时应直接读取 D1 loader", async () => {
    const loader = vi.fn(async () => ({ data: ["fresh"] }));

    const result = await readThroughPublicCache({
      cache: undefined,
      key: publicCacheKey("categories"),
      expirationTtl: 300,
      loader,
    });

    expect(result).toEqual({ value: { data: ["fresh"] }, status: "BYPASS" });
    expect(loader).toHaveBeenCalledOnce();
  });

  it("第一次 MISS 写入 KV，第二次应直接 HIT", async () => {
    const cache = new FakeKV();
    const loader = vi.fn(async () => ({ data: ["from-d1"] }));
    const options = {
      cache: cache as unknown as KVNamespace,
      key: publicCacheKey("tags"),
      expirationTtl: 300,
      loader,
    };

    const first = await readThroughPublicCache(options);
    const second = await readThroughPublicCache(options);

    expect(first.status).toBe("MISS");
    expect(second).toEqual({ value: { data: ["from-d1"] }, status: "HIT" });
    expect(loader).toHaveBeenCalledOnce();
  });

  it("KV 读取或写入失败时仍应返回 D1 数据", async () => {
    const cache = new FakeKV();
    cache.failGet = true;
    cache.failPut = true;

    const result = await readThroughPublicCache({
      cache: cache as unknown as KVNamespace,
      key: publicCacheKey("friends"),
      expirationTtl: 300,
      loader: async () => ({ data: ["available"] }),
    });

    expect(result).toEqual({ value: { data: ["available"] }, status: "MISS" });
  });

  it("失效时只清除当前版本的公开缓存", async () => {
    const cache = new FakeKV();
    cache.values.set(publicCacheKey("posts:1"), "{}");
    cache.values.set(publicCacheKey("settings"), "{}");
    cache.values.set("another-feature:key", "keep");

    const result = await invalidatePublicCache(cache as unknown as KVNamespace);

    expect(result).toEqual({ status: "cleared", deleted: 2 });
    expect([...cache.values.keys()]).toEqual(["another-feature:key"]);
  });

  it("KV 未配置或清理失败时不应抛出异常", async () => {
    const disabled = await invalidatePublicCache(undefined);
    const cache = new FakeKV();
    cache.failList = true;
    const failed = await invalidatePublicCache(cache as unknown as KVNamespace);

    expect(disabled).toEqual({ status: "disabled", deleted: 0 });
    expect(failed).toEqual({ status: "failed", deleted: 0 });
  });

  it("所有 key 应使用固定版本前缀", () => {
    expect(publicCacheKey("post:test-post")).toBe(
      `${PUBLIC_CACHE_PREFIX}post:test-post`,
    );
  });
});
