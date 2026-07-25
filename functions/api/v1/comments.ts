/**
 * POST /api/v1/comments — 发表评论
 * GET  /api/v1/comments — 获取文章评论
 */

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  const url = new URL(context.request.url);
  const postId = Number(url.searchParams.get("post_id"));

  if (!postId) {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: "post_id is required" } },
      { status: 400 },
    );
  }

  const { results } = await context.env.DB.prepare(
    `SELECT id, post_id, parent_id, author_name, content, created_at
       FROM comments
       WHERE post_id = ? AND status = 'approved' AND deleted_at IS NULL
       ORDER BY created_at ASC`,
  )
    .bind(postId)
    .all();

  return Response.json({ data: results });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  const body = (await context.request.json()) as Record<string, unknown>;

  // 基础校验
  if (!body.postId || !body.authorName || !body.content) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "postId, authorName and content are required",
        },
      },
      { status: 422 },
    );
  }

  const ip = context.request.headers.get("CF-Connecting-IP") || "";
  const ua = context.request.headers.get("User-Agent") || "";

  const result = await context.env.DB.prepare(
    `INSERT INTO comments (post_id, parent_id, author_name, author_email, author_url, content, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      body.postId,
      body.parentId || null,
      body.authorName,
      body.authorEmail || null,
      body.authorUrl || null,
      body.content,
      ip,
      ua,
    )
    .run();

  return Response.json(
    { data: { id: result.meta.last_row_id } },
    { status: 201 },
  );
};
