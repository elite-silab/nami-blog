/**
 * 管理后台路由 — 全部需要 adminAuth 鉴权
 */
import { Hono } from "hono";
import type { Env } from "../index";
import { adminAuth } from "../middleware/auth";
import { parsePagination } from "../lib/pagination";
import {
  noPublicContentChange,
  publicContentChanged,
} from "../lib/publication";
import {
  exportSiteBackup,
  importSiteBackup,
  MAX_BACKUP_BYTES,
  validateSiteBackup,
} from "../lib/site-backup";

export const adminRoutes = new Hono<Env>();

// 所有 /api/admin/* 路由需要鉴权
adminRoutes.use("*", adminAuth);

function isPublicPost(status: string, isPublic: number) {
  return status === "published" && isPublic === 1;
}

// ═══════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════
adminRoutes.get("/dashboard", async (c) => {
  const DB = c.env.DB;
  const [
    postsCount,
    draftsCount,
    commentsCount,
    pendingComments,
    totalViews,
    categoriesCount,
    tagsCount,
  ] =
    await Promise.all([
      DB.prepare(
        "SELECT COUNT(*) as c FROM posts WHERE status = 'published' AND deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COUNT(*) as c FROM posts WHERE status = 'draft' AND deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COUNT(*) as c FROM comments WHERE deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COUNT(*) as c FROM comments WHERE status = 'pending' AND deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COALESCE(SUM(view_count), 0) as c FROM posts WHERE status = 'published' AND is_public = 1 AND deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COUNT(*) as c FROM categories WHERE deleted_at IS NULL",
      ).first<{ c: number }>(),
      DB.prepare(
        "SELECT COUNT(*) as c FROM tags WHERE deleted_at IS NULL",
      ).first<{ c: number }>(),
    ]);

  const recentPosts = await DB.prepare(
    "SELECT id, title, status, updated_at FROM posts WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 5",
  ).all<{ id: number; title: string; status: string; updated_at: string }>();

  const recentComments = await DB.prepare(
    `SELECT c.id, c.author_name, c.content, c.created_at, p.title as post_title
     FROM comments c JOIN posts p ON c.post_id = p.id
     WHERE c.status = 'pending' AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC LIMIT 5`,
  ).all<{
    id: number;
    author_name: string;
    content: string;
    created_at: string;
    post_title: string;
  }>();

  return c.json({
    data: {
      posts: { published: postsCount?.c ?? 0, draft: draftsCount?.c ?? 0 },
      comments: {
        total: commentsCount?.c ?? 0,
        pending: pendingComments?.c ?? 0,
      },
      views: { total: totalViews?.c ?? 0 },
      taxonomies: {
        categories: categoriesCount?.c ?? 0,
        tags: tagsCount?.c ?? 0,
      },
      recentPosts: recentPosts.results,
      recentComments: recentComments.results,
    },
  });
});

// ═══════════════════════════════════════════
// Posts CRUD
// ═══════════════════════════════════════════
adminRoutes.get("/posts", async (c) => {
  const DB = c.env.DB;
  const pagination = parsePagination(c.req.query("page"), c.req.query("limit"));
  if (!pagination) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "分页参数无效，limit 最大为 100" } },
      400,
    );
  }
  const { page, limit, offset } = pagination;
  const status = c.req.query("status") || "";

  let whereClause = "WHERE p.deleted_at IS NULL";
  const bindings: (string | number)[] = [];
  if (status) {
    whereClause += " AND p.status = ?";
    bindings.push(status);
  }

  const [posts, countResult] = await Promise.all([
    DB.prepare(
      `SELECT p.id, p.title, p.slug, p.status, p.is_pinned, p.view_count, p.created_at, p.updated_at
       FROM posts p ${whereClause} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, limit, offset)
      .all(),
    DB.prepare(`SELECT COUNT(*) as total FROM posts p ${whereClause}`)
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);

  return c.json({
    data: posts.results,
    meta: { page, limit, total: countResult?.total ?? 0 },
  });
});

adminRoutes.get("/posts/:id", async (c) => {
  const DB = c.env.DB;
  const id = c.req.param("id");
  const post = await DB.prepare(
    "SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(id)
    .first();

  if (!post)
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);

  // 获取关联分类
  const categories = await DB.prepare(
    `SELECT c.id, c.name, c.slug FROM categories c
     JOIN post_categories pc ON pc.category_id = c.id
     WHERE pc.post_id = ?`,
  )
    .bind(id)
    .all();

  // 获取关联标签
  const tags = await DB.prepare(
    `SELECT t.id, t.name, t.slug, t.color FROM tags t
     JOIN post_tags pt ON pt.tag_id = t.id
     WHERE pt.post_id = ?`,
  )
    .bind(id)
    .all();

  return c.json({
    data: {
      ...post,
      categories: categories.results,
      tags: tags.results,
    },
  });
});

adminRoutes.post("/posts", async (c) => {
  const DB = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json<Record<string, unknown>>();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title)
    return c.json(
      { error: { code: "BAD_REQUEST", message: "标题不能为空" } },
      400,
    );

  const slug =
    (typeof body.slug === "string" ? body.slug.trim() : "") ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "") ||
    `post-${crypto.randomUUID().slice(0, 8)}`;
  if (slug.length > 255) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "URL Slug 最长为 255 个字符" } },
      400,
    );
  }
  const postStatus = typeof body.status === "string" ? body.status : "draft";
  if (!["draft", "published", "archived"].includes(postStatus)) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "文章状态无效" } },
      400,
    );
  }
  const duplicate = await DB.prepare(
    "SELECT id FROM posts WHERE slug = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(slug)
    .first();
  if (duplicate) {
    return c.json(
      { error: { code: "CONFLICT", message: "URL Slug 已被其他文章使用" } },
      409,
    );
  }

  const postContent = String(body.content || "");
  const isPublic =
    body.is_public !== undefined ? (Number(body.is_public) === 1 ? 1 : 0) : 1;

  const result = await DB.prepare(
    `INSERT INTO posts (author_id, title, slug, content, excerpt, cover_url, status, is_pinned, is_public, word_count, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      parseInt(user.sub),
      title,
      slug,
      postContent,
      body.excerpt || null,
      body.cover_url || null,
      postStatus,
      body.is_pinned || 0,
      isPublic,
      postContent.replace(/\s/g, "").length,
      postStatus === "published" ? new Date().toISOString() : null,
    )
    .run();

  const postId = result.meta.last_row_id;

  // 关联分类
  if (body.category_id) {
    await DB.prepare(
      "INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)",
    )
      .bind(postId, body.category_id)
      .run();
  }

  // 关联标签
  if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
    for (const tagId of body.tag_ids) {
      await DB.prepare(
        "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)",
      )
        .bind(postId, tagId)
        .run();
    }
  }

  const publication = isPublicPost(postStatus, isPublic)
    ? publicContentChanged()
    : noPublicContentChange();

  return c.json({ data: { id: postId, publication } });
});

adminRoutes.put("/posts/:id", async (c) => {
  const DB = c.env.DB;
  const body = await c.req.json<Record<string, unknown>>();
  const id = c.req.param("id");

  const existing = await DB.prepare(
    "SELECT id, status, is_public FROM posts WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(id)
    .first<{ id: number; status: string; is_public: number }>();
  if (!existing)
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);

  const updates: string[] = [];
  const bindings: (string | number | null)[] = [];
  let finalStatus = existing.status;
  let finalIsPublic = existing.is_public;
  const setField = (field: string, value: string | number | null) => {
    updates.push(`${field} = ?`);
    bindings.push(value);
  };

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return c.json(
        { error: { code: "BAD_REQUEST", message: "标题不能为空" } },
        400,
      );
    }
    setField("title", title);
  }
  if (body.slug !== undefined) {
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug || slug.length > 255) {
      return c.json(
        { error: { code: "BAD_REQUEST", message: "URL Slug 格式无效" } },
        400,
      );
    }
    const duplicate = await DB.prepare(
      "SELECT id FROM posts WHERE slug = ? AND id != ? AND deleted_at IS NULL LIMIT 1",
    )
      .bind(slug, id)
      .first();
    if (duplicate) {
      return c.json(
        { error: { code: "CONFLICT", message: "URL Slug 已被其他文章使用" } },
        409,
      );
    }
    setField("slug", slug);
  }
  if (body.content !== undefined) {
    const content = String(body.content);
    setField("content", content);
    setField("word_count", content.replace(/\s/g, "").length);
  }
  if (body.excerpt !== undefined) {
    setField("excerpt", body.excerpt ? String(body.excerpt) : null);
  }
  if (body.cover_url !== undefined) {
    setField("cover_url", body.cover_url ? String(body.cover_url) : null);
  }
  if (body.is_pinned !== undefined) {
    setField("is_pinned", Number(body.is_pinned) === 1 ? 1 : 0);
  }
  if (body.is_public !== undefined) {
    finalIsPublic = Number(body.is_public) === 1 ? 1 : 0;
    setField("is_public", finalIsPublic);
  }
  if (body.status !== undefined) {
    const status = typeof body.status === "string" ? body.status : "";
    if (!["draft", "published", "archived"].includes(status)) {
      return c.json(
        { error: { code: "BAD_REQUEST", message: "文章状态无效" } },
        400,
      );
    }
    finalStatus = status;
    setField("status", status);
    if (status === "published" && existing.status !== "published") {
      setField("published_at", new Date().toISOString());
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    await DB.prepare(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...bindings, id)
      .run();
  }

  // 更新分类关联
  if (body.category_id !== undefined) {
    await DB.prepare("DELETE FROM post_categories WHERE post_id = ?")
      .bind(id)
      .run();
    if (body.category_id) {
      await DB.prepare(
        "INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)",
      )
        .bind(id, body.category_id)
        .run();
    }
  }

  // 更新标签关联
  if (Array.isArray(body.tag_ids)) {
    await DB.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id).run();
    for (const tagId of body.tag_ids) {
      await DB.prepare(
        "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)",
      )
        .bind(id, tagId)
        .run();
    }
  }

  const affectsPublicSite =
    isPublicPost(existing.status, existing.is_public) ||
    isPublicPost(finalStatus, finalIsPublic);
  const publication = affectsPublicSite
    ? publicContentChanged()
    : noPublicContentChange();

  return c.json({ data: { message: "更新成功", publication } });
});

adminRoutes.delete("/posts/:id", async (c) => {
  const existing = await c.env.DB.prepare(
    "SELECT status, is_public FROM posts WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .first<{ status: string; is_public: number }>();
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);
  }

  const result = await c.env.DB.prepare(
    "UPDATE posts SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);

  const publication = isPublicPost(existing.status, existing.is_public)
    ? publicContentChanged()
    : noPublicContentChange();
  return c.json({ data: { message: "文章已删除", publication } });
});

// ═══════════════════════════════════════════
// Categories CRUD
// ═══════════════════════════════════════════
adminRoutes.get("/categories", async (c) => {
  const categories = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.slug, c.description, c.sort_order, c.parent_id,
       (SELECT COUNT(*) FROM post_categories WHERE category_id = c.id) as post_count
     FROM categories c WHERE c.deleted_at IS NULL ORDER BY c.sort_order, c.id`,
  ).all();

  return c.json({ data: categories.results });
});

adminRoutes.post("/categories", async (c) => {
  const body = await c.req.json<{
    name?: string;
    slug?: string;
    description?: string;
    sort_order?: number;
  }>();
  if (!body.name || !body.slug)
    return c.json(
      { error: { code: "BAD_REQUEST", message: "名称和 slug 必填" } },
      400,
    );

  const result = await c.env.DB.prepare(
    "INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)",
  )
    .bind(body.name, body.slug, body.description || null, body.sort_order || 0)
    .run();

  return c.json({ data: { id: result.meta.last_row_id, publication: publicContentChanged() } });
});

adminRoutes.put("/categories/:id", async (c) => {
  const body = await c.req.json<{
    name?: string;
    slug?: string;
    description?: string;
    sort_order?: number;
  }>();
  await c.env.DB.prepare(
    "UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), sort_order = COALESCE(?, sort_order), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(
      body.name || null,
      body.slug || null,
      body.description ?? null,
      body.sort_order ?? null,
      c.req.param("id"),
    )
    .run();

  return c.json({ data: { message: "更新成功", publication: publicContentChanged() } });
});

adminRoutes.delete("/categories/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "UPDATE categories SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "分类不存在" } }, 404);
  return c.json({ data: { message: "分类已删除", publication: publicContentChanged() } });
});

// ═══════════════════════════════════════════
// Tags CRUD
// ═══════════════════════════════════════════
adminRoutes.get("/tags", async (c) => {
  const tags = await c.env.DB.prepare(
    `SELECT t.id, t.name, t.slug, t.color,
       (SELECT COUNT(*) FROM post_tags WHERE tag_id = t.id) as post_count
     FROM tags t WHERE t.deleted_at IS NULL ORDER BY t.name`,
  ).all();

  return c.json({ data: tags.results });
});

adminRoutes.post("/tags", async (c) => {
  const body = await c.req.json<{
    name?: string;
    slug?: string;
    color?: string;
  }>();
  if (!body.name || !body.slug)
    return c.json(
      { error: { code: "BAD_REQUEST", message: "名称和 slug 必填" } },
      400,
    );

  const result = await c.env.DB.prepare(
    "INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)",
  )
    .bind(body.name, body.slug, body.color || null)
    .run();

  return c.json({ data: { id: result.meta.last_row_id, publication: publicContentChanged() } });
});

adminRoutes.put("/tags/:id", async (c) => {
  const body = await c.req.json<{
    name?: string;
    slug?: string;
    color?: string;
  }>();
  await c.env.DB.prepare(
    "UPDATE tags SET name = COALESCE(?, name), slug = COALESCE(?, slug), color = COALESCE(?, color), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(
      body.name || null,
      body.slug || null,
      body.color ?? null,
      c.req.param("id"),
    )
    .run();

  return c.json({ data: { message: "更新成功", publication: publicContentChanged() } });
});

adminRoutes.delete("/tags/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "UPDATE tags SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "标签不存在" } }, 404);
  return c.json({ data: { message: "标签已删除", publication: publicContentChanged() } });
});

// ═══════════════════════════════════════════
// Comments (admin)
// ═══════════════════════════════════════════
adminRoutes.get("/comments", async (c) => {
  const DB = c.env.DB;
  const tab = c.req.query("status") || c.req.query("tab") || "all";
  const pagination = parsePagination(c.req.query("page"), c.req.query("limit"));
  if (!pagination) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "分页参数无效，limit 最大为 100" } },
      400,
    );
  }
  const { page, limit, offset } = pagination;

  let whereClause = "WHERE c.deleted_at IS NULL";
  const bindings: (string | number)[] = [];
  if (tab === "pending") whereClause += " AND c.status = 'pending'";
  if (tab === "approved") whereClause += " AND c.status = 'approved'";

  const [comments, countResult] = await Promise.all([
    DB.prepare(
      `SELECT c.id, c.author_name, c.author_email, c.content, c.status, c.created_at, p.title as post_title, c.post_id
       FROM comments c JOIN posts p ON c.post_id = p.id ${whereClause}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings, limit, offset)
      .all(),
    DB.prepare(`SELECT COUNT(*) as total FROM comments c ${whereClause}`)
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);

  return c.json({
    data: comments.results,
    meta: { page, limit, total: countResult?.total ?? 0 },
  });
});

adminRoutes.patch("/comments/:id/status", async (c) => {
  const body = await c.req.json<{ status?: string }>();
  if (!body.status || !["approved", "rejected"].includes(body.status)) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "status 必须为 approved 或 rejected",
        },
      },
      400,
    );
  }

  const result = await c.env.DB.prepare(
    "UPDATE comments SET status = ?, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(body.status, c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "评论不存在" } }, 404);
  return c.json({
    data: { message: `评论已${body.status === "approved" ? "批准" : "拒绝"}` },
  });
});

adminRoutes.delete("/comments/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "UPDATE comments SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "评论不存在" } }, 404);
  return c.json({ data: { message: "评论已删除" } });
});

// ═══════════════════════════════════════════
// Friends CRUD
// ═══════════════════════════════════════════
adminRoutes.get("/friends", async (c) => {
  const friends = await c.env.DB.prepare(
    "SELECT id, name, url, avatar_url, description, sort_order, created_at, updated_at FROM friends WHERE deleted_at IS NULL ORDER BY sort_order, created_at DESC",
  ).all();

  return c.json({ data: friends.results });
});

adminRoutes.post("/friends", async (c) => {
  const body = await c.req.json<{
    name?: string;
    url?: string;
    avatar_url?: string;
    description?: string;
  }>();
  if (!body.name || !body.url)
    return c.json(
      { error: { code: "BAD_REQUEST", message: "站名和 URL 必填" } },
      400,
    );

  const result = await c.env.DB.prepare(
    "INSERT INTO friends (name, url, avatar_url, description, status) VALUES (?, ?, ?, ?, 'approved')",
  )
    .bind(
      body.name,
      body.url,
      body.avatar_url || null,
      body.description || null,
    )
    .run();

  return c.json({ data: { id: result.meta.last_row_id, publication: publicContentChanged() } });
});

adminRoutes.put("/friends/:id", async (c) => {
  const body = await c.req.json<{
    name?: string;
    url?: string;
    avatar_url?: string;
    description?: string;
  }>();
  const result = await c.env.DB.prepare(
    "UPDATE friends SET name = COALESCE(?, name), url = COALESCE(?, url), avatar_url = COALESCE(?, avatar_url), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(
      body.name || null,
      body.url || null,
      body.avatar_url ?? null,
      body.description ?? null,
      c.req.param("id"),
    )
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: { code: "NOT_FOUND", message: "友链不存在" } }, 404);
  }
  return c.json({ data: { message: "更新成功", publication: publicContentChanged() } });
});

adminRoutes.delete("/friends/:id", async (c) => {
  const result = await c.env.DB.prepare(
    "UPDATE friends SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(c.req.param("id"))
    .run();

  if (result.meta.changes === 0)
    return c.json({ error: { code: "NOT_FOUND", message: "友链不存在" } }, 404);
  return c.json({ data: { message: "友链已删除", publication: publicContentChanged() } });
});

// ═══════════════════════════════════════════
// Site backup
// ═══════════════════════════════════════════
adminRoutes.get("/backup", async (c) => {
  const backup = await exportSiteBackup(c.env.DB);
  const date = backup.exported_at.slice(0, 10);
  c.header("Cache-Control", "no-store");
  c.header(
    "Content-Disposition",
    `attachment; filename="nami-blog-backup-${date}.json"`,
  );
  return c.json(backup);
});

adminRoutes.post("/backup/import", async (c) => {
  const contentLength = Number(c.req.header("Content-Length") || 0);
  if (contentLength > MAX_BACKUP_BYTES) {
    return c.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "备份文件不能超过 10MB" } },
      413,
    );
  }

  const raw = await c.req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) {
    return c.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "备份文件不能超过 10MB" } },
      413,
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "备份文件不是有效 JSON" } },
      400,
    );
  }

  const validation = validateSiteBackup(input);
  if (!validation.backup) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: validation.error || "备份文件格式无效",
        },
      },
      400,
    );
  }

  const adminId = Number(c.get("user").sub);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "管理员身份无效" } },
      401,
    );
  }

  await importSiteBackup(c.env.DB, validation.backup, adminId);
  return c.json({ data: { message: "备份已导入", publication: publicContentChanged() } });
});

// ═══════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════
adminRoutes.get("/settings", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT key, value, updated_at FROM site_settings ORDER BY key",
  ).all<{ key: string; value: string; updated_at: string }>();

  const settings: Record<string, unknown> = {};
  for (const row of rows.results) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return c.json({ data: settings });
});

adminRoutes.put("/settings", async (c) => {
  const DB = c.env.DB;
  const body = await c.req.json<Record<string, unknown>>();

  const mappings: Record<string, string> = {
    site_name: "site_name",
    site_subtitle: "site_subtitle",
    seo_description: "seo_description",
    site_theme: "site_theme",
    comment_enabled: "comment_enabled",
    comment_auto_approve: "comment_auto_approve",
  };

  for (const [bodyKey, dbKey] of Object.entries(mappings)) {
    if (body[bodyKey] !== undefined) {
      const value =
        typeof body[bodyKey] === "string"
          ? JSON.stringify(body[bodyKey])
          : JSON.stringify(body[bodyKey]);
      await DB.prepare(
        "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
      )
        .bind(dbKey, value)
        .run();
    }
  }

  if (body.social_links !== undefined) {
    await DB.prepare(
      "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    )
      .bind("social_links", JSON.stringify(body.social_links))
      .run();
  }

  if (body.sensitive_words !== undefined) {
    await DB.prepare(
      "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    )
      .bind("sensitive_words", JSON.stringify(body.sensitive_words))
      .run();
  }

  return c.json({ data: { message: "设置已保存", publication: publicContentChanged() } });
});
