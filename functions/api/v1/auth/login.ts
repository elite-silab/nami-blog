/**
 * POST /api/v1/auth/login — 管理员登录
 */

import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken, type JwtPayload } from "@/lib/auth";

export const onRequestPost: PagesFunction<{
  DB: D1Database;
  JWT_SECRET: string;
}> = async (context) => {
  const body = (await context.request.json()) as {
    username?: string;
    password?: string;
  };

  if (!body.username || !body.password) {
    return Response.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "username and password are required",
        },
      },
      { status: 400 },
    );
  }

  // 查找用户
  const user = await context.env.DB.prepare(
    `SELECT id, username, password_hash, role FROM users WHERE username = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
  )
    .bind(body.username)
    .first<{
      id: number;
      username: string;
      password_hash: string;
      role: string;
    }>();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      { status: 401 },
    );
  }

  // bcrypt 密码验证
  const passwordValid = await bcrypt.compare(body.password, user.password_hash);

  if (!passwordValid) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      { status: 401 },
    );
  }

  // 签发 JWT
  const payload: JwtPayload = {
    sub: String(user.id),
    username: user.username,
    role: user.role,
  };

  const accessToken = await signAccessToken(payload, context.env.JWT_SECRET);
  const refreshToken = await signRefreshToken(payload, context.env.JWT_SECRET);

  // 存储 refresh token hash 到数据库
  const tokenHash = await crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(refreshToken))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );

  await context.env.DB.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at)
     VALUES (?, ?, ?, datetime('now', '+7 days'))`,
  )
    .bind(user.id, tokenHash, crypto.randomUUID())
    .run();

  // 返回 token + HttpOnly Cookie
  const response = Response.json({
    data: { accessToken, refreshToken },
  });

  response.headers.append(
    "Set-Cookie",
    `access_token=${encodeURIComponent(accessToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900`,
  );

  return response;
};
