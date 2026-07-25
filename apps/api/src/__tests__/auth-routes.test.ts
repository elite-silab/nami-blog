import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import app from "../index";
import { seedDatabase } from "./helpers";

async function apiFetch(path: string, init?: RequestInit) {
  return app.fetch(new Request(`http://localhost${path}`, init), env as any);
}

async function login() {
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "testpass123" }),
  });
  const json = (await response.json()) as {
    data: { accessToken: string; refreshToken: string };
  };
  return { response, ...json.data };
}

beforeAll(async () => {
  await seedDatabase();
});

describe("管理员会话", () => {
  it("登录应同时返回两种令牌并设置 HttpOnly Cookie", async () => {
    const { response, accessToken, refreshToken } = await login();

    expect(response.status).toBe(200);
    expect(accessToken.split(".")).toHaveLength(3);
    expect(refreshToken.split(".")).toHaveLength(3);
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
  });

  it("应轮换刷新令牌，且旧令牌不能再次使用", async () => {
    const { refreshToken } = await login();
    const firstRefresh = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const firstJson = (await firstRefresh.json()) as {
      data: { accessToken: string; refreshToken: string };
    };

    expect(firstRefresh.status).toBe(200);
    expect(firstJson.data.refreshToken).not.toBe(refreshToken);

    const replay = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(replay.status).toBe(401);
  });

  it("退出应吊销当前刷新令牌", async () => {
    const { refreshToken } = await login();
    const logout = await apiFetch("/api/v1/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(logout.status).toBe(200);

    const refresh = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refresh.status).toBe(401);
  });

  it("无效刷新令牌应返回 401", async () => {
    const response = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid" }),
    });

    expect(response.status).toBe(401);
  });

  it("修改密码后应清除 Cookie 并吊销已有刷新令牌", async () => {
    const { accessToken, refreshToken } = await login();
    const changePassword = await apiFetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPassword: "testpass123",
        newPassword: "changedpass123",
      }),
    });

    expect(changePassword.status).toBe(200);
    expect(changePassword.headers.get("Set-Cookie")).toContain("Max-Age=0");

    const refresh = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refresh.status).toBe(401);
  });
});
