import { defineConfig } from "vitest/config";
import { cloudflarePool } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  test: {
    globals: true,
    pool: cloudflarePool({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: {
          JWT_SECRET: "test-secret-key-for-testing-only",
          SITE_NAME: "Test Blog",
          CORS_ORIGIN: "http://localhost:4321",
        },
      },
    }),
  },
});
