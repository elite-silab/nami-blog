import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";

const LOCAL_PASSWORD = "nami-local-admin";
const PRODUCTION_PASSWORD = "production-only-admin-password";

async function login(
  url: string,
  password: string,
  initialPassword = LOCAL_PASSWORD,
) {
  return app.fetch(
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password }),
    }),
    { ...env, ADMIN_INITIAL_PASSWORD: initialPassword } as any,
  );
}

beforeAll(async () => {
  const DB = (env as any).DB as D1Database;
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `).run();
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      family TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
});

beforeEach(async () => {
  const DB = (env as any).DB as D1Database;
  await DB.prepare("DELETE FROM refresh_tokens").run();
  await DB.prepare("DELETE FROM users").run();
});

describe("管理员首次登录初始化", () => {
  it("本地空数据库可使用模板密码创建一次，且不会被环境变量重置", async () => {
    const DB = (env as any).DB as D1Database;
    const localLogin = await login(
      "http://localhost/api/v1/auth/login",
      LOCAL_PASSWORD,
    );
    expect(localLogin.status).toBe(200);

    const admin = await DB.prepare(
      "SELECT username, email, password_hash, status FROM users LIMIT 1",
    ).first<{
      username: string;
      email: string;
      password_hash: string;
      status: string;
    }>();
    expect(admin).toMatchObject({
      username: "admin",
      email: "admin@local.test",
      status: "active",
    });
    expect(admin?.password_hash).not.toBe(LOCAL_PASSWORD);
    expect(admin?.password_hash).toMatch(/^\$2[aby]\$12\$/);

    const changedEnvAttempt = await login(
      "http://127.0.0.1/api/v1/auth/login",
      "different-local-password",
      "different-local-password",
    );
    expect(changedEnvAttempt.status).toBe(401);
  });

  it("生产域名拒绝本地模板密码、过短密码和非 HTTPS 请求", async () => {
    const attempts = await Promise.all([
      login("https://api.example.com/api/v1/auth/login", LOCAL_PASSWORD),
      login("https://api.example.com/api/v1/auth/login", "too-short", "too-short"),
      login(
        "http://api.example.com/api/v1/auth/login",
        PRODUCTION_PASSWORD,
        PRODUCTION_PASSWORD,
      ),
    ]);
    expect(attempts.map((response) => response.status)).toEqual([401, 401, 401]);

    const DB = (env as any).DB as D1Database;
    const count = await DB.prepare(
      "SELECT COUNT(*) AS count FROM users",
    ).first<{ count: number }>();
    expect(count?.count).toBe(0);
  });

  it("生产 HTTPS 空数据库可使用自定义一次性 Secret 创建管理员", async () => {
    const productionLogin = await login(
      "https://api.example.com/api/v1/auth/login",
      PRODUCTION_PASSWORD,
      PRODUCTION_PASSWORD,
    );
    expect(productionLogin.status).toBe(200);

    const DB = (env as any).DB as D1Database;
    const admin = await DB.prepare(
      "SELECT username, email, password_hash, status FROM users LIMIT 1",
    ).first<{
      username: string;
      email: string;
      password_hash: string;
      status: string;
    }>();
    expect(admin).toMatchObject({
      username: "admin",
      email: "admin@nami.invalid",
      status: "active",
    });
    expect(admin?.password_hash).not.toBe(PRODUCTION_PASSWORD);
    expect(admin?.password_hash).toMatch(/^\$2[aby]\$12\$/);

    const resetAttempt = await login(
      "https://api.example.com/api/v1/auth/login",
      "another-production-password",
      "another-production-password",
    );
    expect(resetAttempt.status).toBe(401);
  });
});
