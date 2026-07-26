import { getCloudflareContext } from "@opennextjs/cloudflare";
import api, { type Bindings } from "@nami/api";

export async function getApiRuntime() {
  const runtime = await getCloudflareContext({ async: true });
  const source = runtime.env;
  const env: Bindings = {
    DB: source.DB,
    JWT_SECRET: source.JWT_SECRET || process.env.JWT_SECRET || "",
    JWT_REFRESH_SECRET:
      source.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET,
    ADMIN_INITIAL_PASSWORD:
      source.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD,
    SITE_NAME: source.SITE_NAME || process.env.SITE_NAME || "Nami Blog",
  };

  return { env, ctx: runtime.ctx };
}

export async function handleApiRequest(request: Request) {
  const { env, ctx } = await getApiRuntime();
  return api.fetch(request, env, ctx);
}

export async function fetchInternalApi(path: string, init?: RequestInit) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://nami-blog.codeelite.workers.dev";
  return handleApiRequest(new Request(new URL(path, siteUrl), init));
}

export async function apiJson<T>(path: string): Promise<T> {
  const response = await fetchInternalApi(path);
  if (!response.ok) {
    throw new Error(`API returned ${response.status} for ${path}`);
  }
  return response.json() as Promise<T>;
}
