/**
 * GET /api/v1/auth/logout — 管理员登出
 */

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async () => {
  // 清除 access_token cookie
  const response = new Response(null, { status: 302 });
  response.headers.set("Location", "/admin/login");
  response.headers.append(
    "Set-Cookie",
    "access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  );

  return response;
};
