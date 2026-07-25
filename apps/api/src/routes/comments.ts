/**
 * 评论路由 — 公开提交 + 查询
 */
import { Hono } from "hono";
import type { Env } from "../index";

export const commentRoutes = new Hono<Env>();

function parseStoredBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "boolean" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeExternalUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// ── GET /:postId — 获取文章的已批准评论 ──
commentRoutes.get("/:postId", async (c) => {
  const postId = c.req.param("postId");
  if (!postId) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "缺少文章 ID" } },
      400,
    );
  }

  const comments = await c.env.DB.prepare(
    `SELECT id, parent_id, author_name, author_url, content, created_at
     FROM comments
     WHERE post_id = ? AND status = 'approved' AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(postId)
    .all<{
      id: number;
      parent_id: number | null;
      author_name: string;
      author_url: string | null;
      content: string;
      created_at: string;
    }>();

  return c.json({ data: comments.results });
});

// ── POST / — 访客提交评论 ──
commentRoutes.post("/", async (c) => {
  const DB = c.env.DB;

  const body = await c.req.json<{
    post_id?: number;
    parent_id?: number | null;
    author_name?: string;
    author_email?: string;
    author_url?: string;
    content?: string;
    website?: string;
  }>();

  if (typeof body.website === "string" && body.website.trim()) {
    return c.json({ error: { code: "BAD_REQUEST", message: "提交失败" } }, 400);
  }

  if (
    typeof body.post_id !== "number" ||
    !Number.isInteger(body.post_id) ||
    body.post_id < 1 ||
    typeof body.author_name !== "string" ||
    typeof body.content !== "string" ||
    !body.author_name.trim() ||
    !body.content.trim()
  ) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "请填写昵称和评论内容" } },
      400,
    );
  }

  const postId = body.post_id;

  if (body.content.length > 2000) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "评论内容不能超过 2000 字" } },
      400,
    );
  }

  if (body.author_name.length > 50) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "昵称不能超过 50 个字符" } },
      400,
    );
  }

  if (body.author_email !== undefined && body.author_email !== null && typeof body.author_email !== "string") {
    return c.json({ error: { code: "BAD_REQUEST", message: "邮箱格式不正确" } }, 400);
  }
  if (body.author_url !== undefined && body.author_url !== null && typeof body.author_url !== "string") {
    return c.json({ error: { code: "BAD_REQUEST", message: "网址格式不正确" } }, 400);
  }
  const authorUrl = safeExternalUrl(body.author_url?.trim());
  if (body.author_url?.trim() && !authorUrl) {
    return c.json({ error: { code: "BAD_REQUEST", message: "网址只允许使用 http 或 https" } }, 400);
  }
  if (body.parent_id !== undefined && body.parent_id !== null && (!Number.isInteger(body.parent_id) || body.parent_id < 1)) {
    return c.json({ error: { code: "BAD_REQUEST", message: "回复目标无效" } }, 400);
  }

  const post = await DB.prepare(
    "SELECT id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
  )
    .bind(postId)
    .first<{ id: number }>();

  if (!post) {
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);
  }

  const settingsRows = await DB.prepare(
    "SELECT key, value FROM site_settings WHERE key IN ('comment_enabled', 'comment_auto_approve', 'sensitive_words')",
  ).all<{ key: string; value: string }>();

  const settings: Record<string, string> = {};
  for (const row of settingsRows.results) {
    settings[row.key] = row.value;
  }

  const commentEnabled = parseStoredBoolean(settings.comment_enabled, true);
  if (!commentEnabled) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "评论功能已关闭" } },
      403,
    );
  }

  let sensitiveWords: string[] = [];
  try {
    const parsed = JSON.parse(settings.sensitive_words || "[]");
    if (Array.isArray(parsed)) sensitiveWords = parsed.filter((word): word is string => typeof word === "string");
  } catch {
    sensitiveWords = [];
  }
  const lowerContent = (body.content + body.author_name).toLowerCase();
  const hitWord = sensitiveWords.find((w) =>
    lowerContent.includes(w.toLowerCase()),
  );
  if (hitWord) {
    return c.json(
      {
        error: { code: "BAD_REQUEST", message: "内容包含敏感词，请修改后重试" },
      },
      400,
    );
  }

  const autoApprove =
    parseStoredBoolean(settings.comment_auto_approve, false);
  const status = autoApprove ? "approved" : "pending";

  const ipAddress =
    c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "";
  const userAgent = c.req.header("User-Agent") || "";

  const result = await DB.prepare(
    `INSERT INTO comments (post_id, parent_id, author_name, author_email, author_url, content, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      postId,
      body.parent_id || null,
      body.author_name.trim(),
      body.author_email?.trim() || null,
      authorUrl,
      body.content.trim(),
      status,
      ipAddress,
      userAgent,
    )
    .run();

  return c.json({
    data: {
      id: result.meta.last_row_id,
      status,
      message: status === "approved" ? "评论已发布" : "评论已提交，等待审核",
    },
  });
});
