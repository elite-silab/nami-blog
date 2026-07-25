import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminFetch,
  clearAdminSession,
  readAdminSession,
  saveAdminSession,
} from "./admin-session";

function createSessionStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

beforeEach(() => {
  vi.stubGlobal("sessionStorage", createSessionStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("管理端会话", () => {
  it("应在当前标签页保存和清除令牌", () => {
    saveAdminSession({ accessToken: "access", refreshToken: "refresh" });
    expect(readAdminSession()).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
    });

    clearAdminSession();
    expect(readAdminSession()).toBeNull();
  });

  it("应为管理请求附加 Bearer Token", async () => {
    saveAdminSession({ accessToken: "access", refreshToken: "refresh" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("https://api.example.com/api/admin/posts");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access");
    expect(init.credentials).toBe("include");
  });

  it("遇到 401 时应刷新一次并重试原请求", async () => {
    saveAdminSession({ accessToken: "old-access", refreshToken: "old-refresh" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({
          data: { accessToken: "new-access", refreshToken: "new-refresh" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await adminFetch("https://api.example.com/api/admin/posts");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retriedInit = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(retriedInit.headers).get("Authorization")).toBe(
      "Bearer new-access",
    );
  });
});
