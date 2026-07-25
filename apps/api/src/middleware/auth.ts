/**
 * 管理员鉴权中间件 — Hono 版
 */
import { createMiddleware } from "hono/factory";
import type { Env } from "../index";
import { extractToken, verifyToken } from "../lib/auth";

export const adminAuth = createMiddleware<Env>(async (c, next) => {
  const token = extractToken(c.req.raw);
  if (!token) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "请先登录" } },
      401,
    );
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET, "access");
  if (!payload || payload.role !== "admin" || !/^\d+$/.test(payload.sub)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "登录已过期" } },
      401,
    );
  }

  const activeUser = await c.env.DB.prepare(
    "SELECT id FROM users WHERE id = ? AND role = 'admin' AND status = 'active' AND deleted_at IS NULL LIMIT 1",
  )
    .bind(payload.sub)
    .first<{ id: number }>();
  if (!activeUser) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "账号不可用" } },
      401,
    );
  }

  c.set("user", payload);
  await next();
});
