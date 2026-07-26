/**
 * 认证路由 — login / logout / change-password
 */
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import type { Env } from "../index";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  type JwtPayload,
  verifyToken,
} from "../lib/auth";
import { adminAuth } from "../middleware/auth";

export const authRoutes = new Hono<Env>();

const LOCAL_DEFAULT_ADMIN_PASSWORD = "nami-local-admin";
const LEGACY_DEFAULT_ADMIN_HASH =
  "$2b$10$nyhhqa07kaOJOHNGeEQxIu6cxauFp608ZqJwQuxO7mFEMZH/ICWhu";

type AdminUser = {
  id: number;
  username: string;
  password_hash: string;
  role: string;
};

function isLocalRequest(requestUrl: string) {
  const hostname = new URL(requestUrl).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function canUseInitialPassword(requestUrl: string, configuredPassword?: string) {
  if (!configuredPassword) return false;
  if (isLocalRequest(requestUrl)) return true;

  const url = new URL(requestUrl);
  return (
    url.protocol === "https:" &&
    configuredPassword !== LOCAL_DEFAULT_ADMIN_PASSWORD &&
    configuredPassword.length >= 12 &&
    configuredPassword.length <= 128
  );
}

function appendAccessCookie(response: Response, token: string, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `access_token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=900${secure}`,
  );
  return response;
}

function appendClearedAccessCookie(response: Response, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `access_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  );
  return response;
}

// ── POST /login — 管理员登录 ──
authRoutes.post("/login", async (c) => {
  const DB = c.env.DB;
  const JWT_SECRET = c.env.JWT_SECRET;

  const body = await c.req.json<{
    username?: string;
    password?: string;
  }>();

  if (!body.username || !body.password) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "username and password are required",
        },
      },
      400,
    );
  }

  let user = await DB.prepare(
    `SELECT id, username, password_hash, role FROM users WHERE username = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
  )
    .bind(body.username)
    .first<AdminUser>();

  const canBootstrapAdmin =
    !user &&
    body.username === "admin" &&
    canUseInitialPassword(c.req.url, c.env.ADMIN_INITIAL_PASSWORD) &&
    body.password === c.env.ADMIN_INITIAL_PASSWORD;

  if (canBootstrapAdmin) {
    const existingAdmin = await DB.prepare(
      `SELECT id, password_hash, status FROM users
       WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1`,
    ).first<{ id: number; password_hash: string; status: string }>();

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(body.password, 12);
      const bootstrapEmail = isLocalRequest(c.req.url)
        ? "admin@local.test"
        : "admin@nami.invalid";
      await DB.prepare(
        `INSERT OR IGNORE INTO users
         (username, email, password_hash, display_name, role, status)
         VALUES ('admin', ?, ?, 'Admin', 'admin', 'active')`,
      )
        .bind(bootstrapEmail, passwordHash)
        .run();

      user = await DB.prepare(
        `SELECT id, username, password_hash, role FROM users
         WHERE username = 'admin' AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      ).first<AdminUser>();
    } else if (
      existingAdmin.status === "disabled" &&
      existingAdmin.password_hash === LEGACY_DEFAULT_ADMIN_HASH
    ) {
      // Migration 0004 disabled the historic public default account. Allow the
      // owner to replace that exact known hash with the configured one-time
      // Secret, without making arbitrary disabled administrators resettable.
      const passwordHash = await bcrypt.hash(body.password, 12);
      await DB.prepare(
        `UPDATE users SET password_hash = ?, status = 'active', updated_at = datetime('now')
         WHERE id = ? AND password_hash = ? AND status = 'disabled'`,
      )
        .bind(passwordHash, existingAdmin.id, LEGACY_DEFAULT_ADMIN_HASH)
        .run();
      user = await DB.prepare(
        `SELECT id, username, password_hash, role FROM users
         WHERE id = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      )
        .bind(existingAdmin.id)
        .first<AdminUser>();
    }
  }

  if (!user) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      401,
    );
  }

  const passwordValid = await bcrypt.compare(body.password, user.password_hash);
  if (!passwordValid) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      401,
    );
  }

  const payload: JwtPayload = {
    sub: String(user.id),
    username: user.username,
    role: user.role,
  };

  const accessToken = await signAccessToken(payload, JWT_SECRET);
  const refreshToken = await signRefreshToken(
    payload,
    c.env.JWT_REFRESH_SECRET || JWT_SECRET,
  );

  const tokenHash = await hashToken(refreshToken);

  await DB.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at)
     VALUES (?, ?, ?, datetime('now', '+7 days'))`,
  )
    .bind(user.id, tokenHash, crypto.randomUUID())
    .run();

  const response = c.json({ data: { accessToken, refreshToken } });
  return appendAccessCookie(response, accessToken, c.req.url);
});

// ── POST /refresh — 轮换 Refresh Token 并签发新会话 ──
authRoutes.post("/refresh", async (c) => {
  const body = await c.req
    .json<{ refreshToken?: string }>()
    .catch(() => ({ refreshToken: undefined }));
  if (!body.refreshToken) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "缺少刷新令牌" } },
      401,
    );
  }

  const refreshSecret = c.env.JWT_REFRESH_SECRET || c.env.JWT_SECRET;
  const payload = await verifyToken(body.refreshToken, refreshSecret, "refresh");
  if (!payload || payload.role !== "admin" || !/^\d+$/.test(payload.sub)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "登录已过期，请重新登录" } },
      401,
    );
  }

  const tokenHash = await hashToken(body.refreshToken);
  const session = await c.env.DB.prepare(
    `SELECT rt.id, rt.family, u.id as user_id, u.username, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ? AND rt.user_id = ? AND rt.revoked_at IS NULL
       AND rt.expires_at > datetime('now') AND u.status = 'active'
       AND u.deleted_at IS NULL AND u.role = 'admin'
     LIMIT 1`,
  )
    .bind(tokenHash, payload.sub)
    .first<{
      id: number;
      family: string;
      user_id: number;
      username: string;
      role: string;
    }>();

  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "登录已过期，请重新登录" } },
      401,
    );
  }

  const revoked = await c.env.DB.prepare(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ? AND revoked_at IS NULL",
  )
    .bind(session.id)
    .run();
  if (revoked.meta.changes === 0) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "刷新令牌已使用" } },
      401,
    );
  }

  const nextPayload: JwtPayload = {
    sub: String(session.user_id),
    username: session.username,
    role: session.role,
  };
  const accessToken = await signAccessToken(nextPayload, c.env.JWT_SECRET);
  const refreshToken = await signRefreshToken(nextPayload, refreshSecret);
  await c.env.DB.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at)
     VALUES (?, ?, ?, datetime('now', '+7 days'))`,
  )
    .bind(
      session.user_id,
      await hashToken(refreshToken),
      session.family,
    )
    .run();

  const response = c.json({ data: { accessToken, refreshToken } });
  return appendAccessCookie(response, accessToken, c.req.url);
});

// ── POST /logout — 管理员登出 ──
authRoutes.post("/logout", async (c) => {
  const body = await c.req
    .json<{ refreshToken?: string }>()
    .catch(() => ({ refreshToken: undefined }));
  if (body.refreshToken) {
    await c.env.DB.prepare(
      "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ? AND revoked_at IS NULL",
    )
      .bind(await hashToken(body.refreshToken))
      .run();
  }

  const response = c.json({ data: { message: "已登出" } });
  return appendClearedAccessCookie(response, c.req.url);
});

// ── POST /change-password — 修改密码（需登录） ──
authRoutes.post("/change-password", adminAuth, async (c) => {
  const DB = c.env.DB;
  const user = c.get("user");

  const body = await c.req.json<{
    oldPassword?: string;
    newPassword?: string;
  }>();

  if (!body.oldPassword || !body.newPassword) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "请填写旧密码和新密码" } },
      400,
    );
  }

  if (body.newPassword.length < 8) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "新密码至少 8 个字符" } },
      400,
    );
  }

  const dbUser = await DB.prepare(
    "SELECT id, password_hash FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL",
  )
    .bind(user.sub)
    .first<{ id: number; password_hash: string }>();

  if (!dbUser) {
    return c.json({ error: { code: "NOT_FOUND", message: "用户不存在" } }, 404);
  }

  const oldValid = await bcrypt.compare(body.oldPassword, dbUser.password_hash);
  if (!oldValid) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "旧密码不正确" } },
      400,
    );
  }

  const newHash = await bcrypt.hash(body.newPassword, 10);
  await DB.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(newHash, dbUser.id)
    .run();
  await DB.prepare(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL",
  )
    .bind(dbUser.id)
    .run();

  const response = c.json({ data: { message: "密码修改成功" } });
  return appendClearedAccessCookie(response, c.req.url);
});
