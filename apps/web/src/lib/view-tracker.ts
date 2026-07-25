type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type ViewStorage = Pick<Storage, "getItem" | "setItem">;

const VIEW_KEY_PREFIX = "nami-view-counted:";

function browserSessionStorage(): ViewStorage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export async function trackPostView(
  apiBase: string,
  slug: string,
  fetcher: Fetcher = fetch,
  initialStorage: ViewStorage | null = browserSessionStorage(),
): Promise<number | null> {
  if (!apiBase || !slug) return null;

  const key = `${VIEW_KEY_PREFIX}${slug}`;
  let storage = initialStorage;
  try {
    if (storage?.getItem(key) === "1") return null;
  } catch {
    storage = null;
  }

  try {
    const base = apiBase.replace(/\/+$/, "");
    const response = await fetcher(
      `${base}/api/v1/posts/${encodeURIComponent(slug)}/view`,
      { method: "POST", cache: "no-store" },
    );
    if (!response.ok) return null;

    const result = (await response.json()) as {
      data?: { view_count?: unknown };
    };
    const viewCount = result.data?.view_count;
    if (typeof viewCount !== "number" || !Number.isFinite(viewCount)) {
      return null;
    }

    try {
      storage?.setItem(key, "1");
    } catch {
      // 隐私模式禁用 sessionStorage 时，阅读统计仍然可以完成。
    }
    return viewCount;
  } catch {
    // 统计失败不能影响文章阅读体验。
    return null;
  }
}
