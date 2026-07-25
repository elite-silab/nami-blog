/**
 * JWT 认证 helper — 签发与验证
 * 使用 jose 库，兼容 Cloudflare Workers (Edge Runtime)
 */
import { SignJWT, jwtVerify } from "jose";

export type JwtPayload = {
  sub: string;
  username: string;
  role: string;
  token_use?: "access" | "refresh";
};

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const JWT_ISSUER = "nami-blog-api";
const JWT_AUDIENCE = "nami-blog";

function getSigningKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: JwtPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({ ...payload, token_use: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .sign(getSigningKey(secret));
}

export async function signRefreshToken(
  payload: JwtPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({ ...payload, token_use: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .sign(getSigningKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string,
  expectedUse?: "access" | "refresh",
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(secret), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const verified = payload as unknown as JwtPayload;
    if (expectedUse && verified.token_use !== expectedUse) return null;
    return verified;
  } catch {
    return null;
  }
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function extractToken(request: Request): string | null {
  const bearer = extractBearerToken(request);
  if (bearer) return bearer;

  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
