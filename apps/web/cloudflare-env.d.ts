interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  SITE_NAME: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ASSETS: Fetcher;
}
