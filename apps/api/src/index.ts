/**
 * Nami Blog Workers API — Hono 入口
 */
import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { commentRoutes } from "./routes/comments";
import { adminRoutes } from "./routes/admin";
import { publicRoutes } from "./routes/public";

export type Bindings = {
  DB: D1Database;
  CACHE?: KVNamespace;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  SITE_NAME: string;
};

export type Env = {
  Bindings: Bindings;
  Variables: {
    user: { sub: string; username: string; role: string };
  };
};

const app = new Hono<Env>();

app.onError((error, c) => {
  console.error("Unhandled API error", {
    method: c.req.method,
    path: c.req.path,
    error: error instanceof Error ? error.message : String(error),
  });
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试" } },
    500,
  );
});

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "接口不存在" } }, 404),
);

// ── 基础安全响应头 ──
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
});

// ── 健康检查 ──
app.get("/", (c) => c.json({ status: "ok", service: "nami-blog" }));
app.get("/healthz", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ status: "ok", service: "nami-blog" });
});
app.get("/api/v1/healthz", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ status: "ok", service: "nami-blog" });
});

// ── 路由挂载 ──
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/comments", commentRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/v1", publicRoutes);

export default app;
