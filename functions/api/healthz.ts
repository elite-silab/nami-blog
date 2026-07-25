/**
 * 健康检查端点
 * GET /api/healthz
 */

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  let dbStatus = "ok";
  try {
    await context.env.DB.prepare("SELECT 1").first();
  } catch {
    dbStatus = "error";
  }

  return new Response(
    JSON.stringify({
      status: dbStatus === "ok" ? "ok" : "degraded",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    }),
    {
      status: dbStatus === "ok" ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    },
  );
};
