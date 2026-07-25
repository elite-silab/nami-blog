/**
 * Pages Functions 全局中间件
 * 处理 CORS、错误捕获、请求日志
 */

export const onRequest: PagesFunction = async (context) => {
  try {
    const response = await context.next();

    // CORS headers（同源部署后通常不需要，保留以备独立 API 调用）
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (context.request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: response.headers });
    }

    return response;
  } catch (err) {
    console.error("[Pages Function Error]", err);
    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
