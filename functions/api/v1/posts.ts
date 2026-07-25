/**
 * GET /api/v1/posts — 文章列表
 */

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  const url = new URL(context.request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit")) || 20),
  );
  const offset = (page - 1) * limit;

  const { results } = await context.env.DB.prepare(
    `SELECT id, title, slug, excerpt, cover_url, status, is_pinned, view_count, published_at, created_at
       FROM posts
       WHERE status = 'published' AND deleted_at IS NULL
       ORDER BY is_pinned DESC, published_at DESC
       LIMIT ? OFFSET ?`,
  )
    .bind(limit, offset)
    .all();

  const countResult = await context.env.DB.prepare(
    `SELECT COUNT(*) as total FROM posts WHERE status = 'published' AND deleted_at IS NULL`,
  ).first<{ total: number }>();

  return Response.json({
    data: results,
    meta: { page, limit, total: countResult?.total ?? 0 },
  });
};
