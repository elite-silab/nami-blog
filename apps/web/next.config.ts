import path from "node:path";
import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const rootDir = path.resolve(process.cwd(), "../..");
if (process.env.NODE_ENV === "development") {
  loadEnvConfig(rootDir, true, console, true);
  initOpenNextCloudflareForDev({
    configPath: "../../wrangler.jsonc",
    envFiles: [".env"],
    persist: { path: path.join(rootDir, ".wrangler/state/v3") },
  });
}

// Local development reads the root .env. Production builds use the public URL
// committed in wrangler.jsonc, so a developer's localhost URL cannot leak into
// canonical links, RSS, Sitemap, or share links.
if (process.env.NODE_ENV === "production") {
  const wrangler = JSON.parse(readFileSync(path.join(rootDir, "wrangler.jsonc"), "utf8")) as {
    vars?: { NEXT_PUBLIC_SITE_URL?: string };
  };
  if (wrangler.vars?.NEXT_PUBLIC_SITE_URL) {
    process.env.NEXT_PUBLIC_SITE_URL = wrangler.vars.NEXT_PUBLIC_SITE_URL;
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@nami/api", "@nami/shared"],
  serverExternalPackages: [],
};

export default nextConfig;
