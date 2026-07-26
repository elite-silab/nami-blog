// Cloudflare Workers 测试运行时类型声明
declare module "cloudflare:test" {
  export const env: {
    DB: D1Database;
    JWT_SECRET: string;
    SITE_NAME: string;
  };
}

declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    JWT_SECRET: string;
    SITE_NAME: string;
  };
}
