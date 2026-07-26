/**
 * 公开 API 路由 — 前台博客数据（无需鉴权）
 */
import { Hono } from "hono";
import type { Env } from "../index";
import { parsePagination } from "../lib/pagination";
import {
  PUBLIC_CACHE_TTL,
  publicCacheKeys,
  readThroughPublicCache,
} from "../lib/public-cache";

export const publicRoutes = new Hono<Env>();

publicRoutes.use("*", async (c, next) => {
  await next();
  if (c.req.method === "GET" && c.res.ok) {
    c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  }
});

// ── GET /posts — 已发布文章列表（分页 + 筛选 + 搜索） ──
publicRoutes.get("/posts", async (c) => {
  const DB = c.env.DB;
  const pagination = parsePagination(c.req.query("page"), c.req.query("limit"));
  if (!pagination) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "分页参数无效，limit 最大为 100" } },
      400,
    );
  }
  const { page, limit, offset } = pagination;
  const category = c.req.query("category") || "";
  const tag = c.req.query("tag") || "";
  const q = c.req.query("q") || "";

  if (category.length > 100 || tag.length > 100 || q.length > 200) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "筛选条件过长" } },
      400,
    );
  }

  let whereClause = "WHERE p.status = 'published' AND p.is_public = 1 AND p.deleted_at IS NULL";
  const bindings: (string | number)[] = [];

  if (category) {
    whereClause +=
      " AND p.id IN (SELECT pc.post_id FROM post_categories pc JOIN categories c ON c.id = pc.category_id WHERE c.slug = ? AND c.deleted_at IS NULL)";
    bindings.push(category);
  }

  if (tag) {
    whereClause +=
      " AND p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.slug = ? AND t.deleted_at IS NULL)";
    bindings.push(tag);
  }

  if (q) {
    whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
    const like = `%${q}%`;
    bindings.push(like, like);
  }

  const result = await readThroughPublicCache({
    cache: q ? undefined : c.env.CACHE,
    key: publicCacheKeys.posts(page, limit, category, tag),
    expirationTtl: PUBLIC_CACHE_TTL.posts,
    loader: async () => {
      const [posts, countResult] = await Promise.all([
        DB.prepare(
          `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_url, p.status, p.is_pinned, p.published_at, p.created_at
           FROM posts p ${whereClause}
           ORDER BY p.is_pinned DESC, p.published_at DESC LIMIT ? OFFSET ?`,
        )
          .bind(...bindings, limit, offset)
          .all(),
        DB.prepare(`SELECT COUNT(*) as total FROM posts p ${whereClause}`)
          .bind(...bindings)
          .first<{ total: number }>(),
      ]);

      return {
        data: posts.results,
        meta: { page, limit, total: countResult?.total ?? 0 },
      };
    },
  });

  c.header("X-Nami-Cache", result.status);
  return c.json(result.value);
});

// ── GET /posts/:slug — 文章详情（+浏览计数 + 分类标签 + 前后篇） ──
publicRoutes.get("/posts/:slug", async (c) => {
  const DB = c.env.DB;
  const slug = c.req.param("slug");

  try {
    const result = await readThroughPublicCache({
      cache: c.env.CACHE,
      key: publicCacheKeys.post(slug),
      expirationTtl: PUBLIC_CACHE_TTL.post,
      loader: async () => {
        const post = await DB.prepare(
          "SELECT id, title, content, content_html, excerpt, cover_url, view_count, word_count, published_at, created_at, updated_at FROM posts WHERE slug = ? AND status = 'published' AND is_public = 1 AND deleted_at IS NULL LIMIT 1",
        )
          .bind(slug)
          .first();

        if (!post) throw new PublicPostNotFoundError();
        const postId = (post as { id: number }).id;
        const [categories, tags, prevPost, nextPost] = await Promise.all([
          DB.prepare(
            `SELECT c.id, c.name, c.slug FROM categories c
             JOIN post_categories pc ON pc.category_id = c.id
             WHERE pc.post_id = ?`,
          )
            .bind(postId)
            .all(),
          DB.prepare(
            `SELECT t.id, t.name, t.slug, t.color FROM tags t
             JOIN post_tags pt ON pt.tag_id = t.id
             WHERE pt.post_id = ?`,
          )
            .bind(postId)
            .all(),
          DB.prepare(
            `SELECT id, title, slug FROM posts
             WHERE status = 'published' AND is_public = 1 AND deleted_at IS NULL AND published_at < (SELECT published_at FROM posts WHERE id = ?)
             ORDER BY published_at DESC LIMIT 1`,
          )
            .bind(postId)
            .first(),
          DB.prepare(
            `SELECT id, title, slug FROM posts
             WHERE status = 'published' AND is_public = 1 AND deleted_at IS NULL AND published_at > (SELECT published_at FROM posts WHERE id = ?)
             ORDER BY published_at ASC LIMIT 1`,
          )
            .bind(postId)
            .first(),
        ]);

        return {
          data: {
            ...post,
            categories: categories.results,
            tags: tags.results,
            prev: prevPost || null,
            next: nextPost || null,
          },
        };
      },
    });

    c.header("X-Nami-Cache", result.status);
    return c.json(result.value);
  } catch (error) {
    if (error instanceof PublicPostNotFoundError) {
      return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);
    }
    throw error;
  }
});

// ── POST /posts/:slug/view — 记录一次真实的文章阅读 ──
publicRoutes.post("/posts/:slug/view", async (c) => {
  c.header("Cache-Control", "no-store");
  const slug = c.req.param("slug");
  if (!slug || slug.length > 200) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "文章 Slug 无效" } },
      400,
    );
  }

  const result = await c.env.DB.prepare(
    `UPDATE posts SET view_count = view_count + 1
     WHERE slug = ? AND status = 'published' AND is_public = 1 AND deleted_at IS NULL`,
  )
    .bind(slug)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: { code: "NOT_FOUND", message: "文章不存在" } }, 404);
  }

  const post = await c.env.DB.prepare(
    "SELECT view_count FROM posts WHERE slug = ? LIMIT 1",
  )
    .bind(slug)
    .first<{ view_count: number }>();

  return c.json({ data: { view_count: post?.view_count ?? 0 } });
});

// ── GET /categories — 分类列表 ──
publicRoutes.get("/categories", async (c) => {
  const result = await readThroughPublicCache({
    cache: c.env.CACHE,
    key: publicCacheKeys.categories,
    expirationTtl: PUBLIC_CACHE_TTL.taxonomy,
    loader: async () => {
      const categories = await c.env.DB.prepare(
        `SELECT c.id, c.name, c.slug, c.description, c.sort_order,
           (SELECT COUNT(*) FROM post_categories pc JOIN posts p ON p.id = pc.post_id
            WHERE pc.category_id = c.id AND p.status = 'published' AND p.is_public = 1 AND p.deleted_at IS NULL) as post_count
         FROM categories c WHERE c.deleted_at IS NULL ORDER BY c.sort_order, c.id`,
      ).all();
      return { data: categories.results };
    },
  });

  c.header("X-Nami-Cache", result.status);
  return c.json(result.value);
});

// ── GET /tags — 标签列表 ──
publicRoutes.get("/tags", async (c) => {
  const result = await readThroughPublicCache({
    cache: c.env.CACHE,
    key: publicCacheKeys.tags,
    expirationTtl: PUBLIC_CACHE_TTL.taxonomy,
    loader: async () => {
      const tags = await c.env.DB.prepare(
        `SELECT t.id, t.name, t.slug, t.color,
           (SELECT COUNT(*) FROM post_tags pt JOIN posts p ON p.id = pt.post_id
            WHERE pt.tag_id = t.id AND p.status = 'published' AND p.is_public = 1 AND p.deleted_at IS NULL) as post_count
         FROM tags t WHERE t.deleted_at IS NULL ORDER BY t.name`,
      ).all();
      return { data: tags.results };
    },
  });

  c.header("X-Nami-Cache", result.status);
  return c.json(result.value);
});

// ── GET /friends — 友链列表 ──
publicRoutes.get("/friends", async (c) => {
  const result = await readThroughPublicCache({
    cache: c.env.CACHE,
    key: publicCacheKeys.friends,
    expirationTtl: PUBLIC_CACHE_TTL.friends,
    loader: async () => {
      const friends = await c.env.DB.prepare(
        "SELECT id, name, url, avatar_url, description FROM friends WHERE deleted_at IS NULL ORDER BY sort_order, created_at DESC",
      ).all();
      return { data: friends.results };
    },
  });

  c.header("X-Nami-Cache", result.status);
  return c.json(result.value);
});

// ── GET /settings — 公开站点设置（仅返回安全的非敏感配置） ──
publicRoutes.get("/settings", async (c) => {
  const result = await readThroughPublicCache({
    cache: c.env.CACHE,
    key: publicCacheKeys.settings,
    expirationTtl: PUBLIC_CACHE_TTL.settings,
    loader: async () => {
      const publicKeys = [
        "site_name",
        "site_subtitle",
        "site_description",
        "seo_description",
        "site_about",
        "site_theme",
        "comment_enabled",
        "icp_number",
        "social_links",
      ];
      const rows = await c.env.DB.prepare(
        `SELECT key, value FROM site_settings WHERE key IN (${publicKeys.map(() => "?").join(",")})`,
      )
        .bind(...publicKeys)
        .all<{ key: string; value: string }>();

      const settings: Record<string, unknown> = {};
      for (const row of rows.results) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
      return { data: settings };
    },
  });

  c.header("X-Nami-Cache", result.status);
  return c.json(result.value);
});

class PublicPostNotFoundError extends Error {}
