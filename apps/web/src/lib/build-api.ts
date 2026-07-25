const BUILD_TOKEN = Date.now().toString(36);

/**
 * Adds a per-build query token so a fresh Pages build never reuses a cached
 * public API response from before the latest content mutation.
 */
export function buildApiUrl(apiBase: string, path: string) {
  const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  url.searchParams.set("_nami_build", BUILD_TOKEN);
  return url.toString();
}

export async function fetchBuildApi(apiBase: string, path: string) {
  const response = await fetch(buildApiUrl(apiBase, path));
  if (!response.ok) {
    throw new Error(`API returned ${response.status} for ${path}`);
  }
  return response;
}

export function handleBuildApiError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[build-api] ${context}: ${message}`);
  if (import.meta.env.CF_PAGES === "1") {
    throw new Error(`Cloudflare Pages 构建无法读取 ${context}: ${message}`);
  }
}
