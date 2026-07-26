export const PUBLIC_CACHE_PREFIX = "nami:public:v1:";

export const PUBLIC_CACHE_TTL = {
  posts: 120,
  post: 300,
  taxonomy: 300,
  friends: 300,
  settings: 300,
} as const;

export type PublicCacheStatus = "HIT" | "MISS" | "BYPASS";

type ReadThroughOptions<T> = {
  cache?: KVNamespace;
  key: string;
  expirationTtl: number;
  loader: () => Promise<T>;
};

type InvalidationResult = {
  status: "cleared" | "disabled" | "failed";
  deleted: number;
};

function logCacheFailure(operation: "read" | "write" | "invalidate", error: unknown) {
  console.warn("Public KV cache operation failed", {
    operation,
    error: error instanceof Error ? error.name : "UnknownError",
  });
}

export function publicCacheKey(segment: string) {
  return `${PUBLIC_CACHE_PREFIX}${segment}`;
}

export const publicCacheKeys = {
  posts: (page: number, limit: number, category: string, tag: string) =>
    publicCacheKey(
      `posts:${page}:${limit}:${encodeURIComponent(category)}:${encodeURIComponent(tag)}`,
    ),
  post: (slug: string) => publicCacheKey(`post:${encodeURIComponent(slug)}`),
  categories: publicCacheKey("categories"),
  tags: publicCacheKey("tags"),
  friends: publicCacheKey("friends"),
  settings: publicCacheKey("settings"),
} as const;

export async function readThroughPublicCache<T>({
  cache,
  key,
  expirationTtl,
  loader,
}: ReadThroughOptions<T>): Promise<{ value: T; status: PublicCacheStatus }> {
  if (!cache) {
    return { value: await loader(), status: "BYPASS" };
  }

  try {
    const cached = await cache.get<T>(key, "json");
    if (cached !== null) {
      return { value: cached, status: "HIT" };
    }
  } catch (error) {
    logCacheFailure("read", error);
  }

  const value = await loader();
  try {
    await cache.put(key, JSON.stringify(value), { expirationTtl });
  } catch (error) {
    logCacheFailure("write", error);
  }

  return { value, status: "MISS" };
}

export async function invalidatePublicCache(
  cache?: KVNamespace,
): Promise<InvalidationResult> {
  if (!cache) return { status: "disabled", deleted: 0 };

  let deleted = 0;
  let cursor: string | undefined;

  try {
    do {
      const page = await cache.list({
        prefix: PUBLIC_CACHE_PREFIX,
        ...(cursor ? { cursor } : {}),
      });

      for (let index = 0; index < page.keys.length; index += 32) {
        const batch = page.keys.slice(index, index + 32);
        await Promise.all(batch.map(({ name }) => cache.delete(name)));
        deleted += batch.length;
      }

      if (page.list_complete) break;
      cursor = page.cursor;
    } while (cursor);

    return { status: "cleared", deleted };
  } catch (error) {
    logCacheFailure("invalidate", error);
    return { status: "failed", deleted };
  }
}
