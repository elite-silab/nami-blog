/**
 * API Client — 客户端 fetch 封装
 * 用于管理后台和评论区与 Workers API 通信
 */
export const API_BASE =
  import.meta.env.PUBLIC_API_URL || "http://localhost:8788";

/** 拼接完整 API URL 的辅助函数 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<{
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (res.status === 401) {
    window.location.href = "/admin/login";
    return { ok: false, error: { code: "UNAUTHORIZED", message: "请先登录" } };
  }

  return { ok: res.ok, ...json };
}

export const apiClient = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: unknown) => request("POST", path, body),
  put: (path: string, body?: unknown) => request("PUT", path, body),
  patch: (path: string, body?: unknown) => request("PATCH", path, body),
  delete: (path: string) => request("DELETE", path),
};
