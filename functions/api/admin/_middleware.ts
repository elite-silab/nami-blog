/**
 * Admin API 鉴权中间件
 * 拦截 /api/admin/* 请求，校验 JWT
 */

import { verifyToken, extractToken } from "@/lib/auth";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const ADMIN_AUTH_EXEMPTIONS = ["/api/v1/auth/login"];

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // 放行登录接口
  if (ADMIN_AUTH_EXEMPTIONS.some((path) => url.pathname.startsWith(path))) {
    return context.next();
  }

  // 只拦截 admin 相关 API
  if (!url.pathname.startsWith("/api/admin/")) {
    return context.next();
  }

  // 提取并验证 token
  const token = extractToken(context.request);
  if (!token) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Missing authentication" } },
      { status: 401 },
    );
  }

  const payload = await verifyToken(token, context.env.JWT_SECRET);
  if (!payload) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      { status: 401 },
    );
  }

  // 将用户信息注入 request context
  context.locals = {
    ...context.locals,
    user: payload,
  };

  return context.next();
};
