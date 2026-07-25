/**
 * JWT 认证工具函数测试
 */
import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  extractBearerToken,
  extractToken,
  hashToken,
  type JwtPayload,
} from "../lib/auth";

const TEST_SECRET = "test-secret-key-for-testing-only";
const TEST_PAYLOAD: JwtPayload = {
  sub: "1",
  username: "admin",
  role: "admin",
};

describe("JWT 认证工具", () => {
  describe("signAccessToken", () => {
    it("应返回有效的 JWT 字符串", async () => {
      const token = await signAccessToken(TEST_PAYLOAD, TEST_SECRET);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT 格式: header.payload.signature
      expect(token.split(".")).toHaveLength(3);
    });

    it("签发的 token 应可被验证", async () => {
      const token = await signAccessToken(TEST_PAYLOAD, TEST_SECRET);
      const verified = await verifyToken(token, TEST_SECRET);
      expect(verified).not.toBeNull();
      expect(verified!.sub).toBe("1");
      expect(verified!.username).toBe("admin");
      expect(verified!.role).toBe("admin");
      expect(verified!.token_use).toBe("access");
    });
  });

  describe("signRefreshToken", () => {
    it("应返回有效的 JWT 字符串", async () => {
      const token = await signRefreshToken(TEST_PAYLOAD, TEST_SECRET);
      expect(token).toBeDefined();
      expect(token.split(".")).toHaveLength(3);
    });

    it("签发的 refresh token 应可被验证", async () => {
      const token = await signRefreshToken(TEST_PAYLOAD, TEST_SECRET);
      const verified = await verifyToken(token, TEST_SECRET);
      expect(verified).not.toBeNull();
      expect(verified!.sub).toBe("1");
      expect(verified!.token_use).toBe("refresh");
    });

    it("refresh token 不应被当作 access token 接受", async () => {
      const token = await signRefreshToken(TEST_PAYLOAD, TEST_SECRET);
      const verified = await verifyToken(token, TEST_SECRET, "access");
      expect(verified).toBeNull();
    });
  });

  describe("verifyToken", () => {
    it("错误密钥应返回 null", async () => {
      const token = await signAccessToken(TEST_PAYLOAD, TEST_SECRET);
      const verified = await verifyToken(token, "wrong-secret");
      expect(verified).toBeNull();
    });

    it("无效 token 应返回 null", async () => {
      const verified = await verifyToken("not-a-jwt", TEST_SECRET);
      expect(verified).toBeNull();
    });

    it("空字符串应返回 null", async () => {
      const verified = await verifyToken("", TEST_SECRET);
      expect(verified).toBeNull();
    });
  });

  describe("extractBearerToken", () => {
    it("应从 Authorization header 提取 Bearer token", () => {
      const req = new Request("http://localhost", {
        headers: { Authorization: "Bearer my-token-123" },
      });
      expect(extractBearerToken(req)).toBe("my-token-123");
    });

    it("非 Bearer 格式应返回 null", () => {
      const req = new Request("http://localhost", {
        headers: { Authorization: "Basic dXNlcjpwYXNz" },
      });
      expect(extractBearerToken(req)).toBeNull();
    });

    it("缺少 Authorization header 应返回 null", () => {
      const req = new Request("http://localhost");
      expect(extractBearerToken(req)).toBeNull();
    });
  });

  describe("extractToken", () => {
    it("优先从 Bearer header 提取", () => {
      const req = new Request("http://localhost", {
        headers: {
          Authorization: "Bearer bearer-token",
          Cookie: "access_token=cookie-token",
        },
      });
      expect(extractToken(req)).toBe("bearer-token");
    });

    it("无 Bearer 时从 Cookie 提取", () => {
      const req = new Request("http://localhost", {
        headers: { Cookie: "access_token=cookie-token; other=value" },
      });
      expect(extractToken(req)).toBe("cookie-token");
    });

    it("URL 编码的 Cookie 值应被解码", () => {
      const req = new Request("http://localhost", {
        headers: { Cookie: "access_token=encoded%3D%3Dtoken" },
      });
      expect(extractToken(req)).toBe("encoded==token");
    });

    it("无任何 token 应返回 null", () => {
      const req = new Request("http://localhost");
      expect(extractToken(req)).toBeNull();
    });
  });

  describe("hashToken", () => {
    it("应稳定生成不可逆的 SHA-256 十六进制摘要", async () => {
      const first = await hashToken("refresh-token");
      const second = await hashToken("refresh-token");

      expect(first).toBe(second);
      expect(first).toMatch(/^[a-f0-9]{64}$/);
      expect(first).not.toContain("refresh-token");
    });
  });
});
