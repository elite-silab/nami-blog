/**
 * 测试辅助 — D1 数据库初始化与测试数据种子
 */
import { env } from "cloudflare:workers";
import bcrypt from "bcryptjs";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL,
    email        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url   TEXT,
    bio          TEXT,
    role         TEXT NOT NULL DEFAULT 'admin',
    status       TEXT NOT NULL DEFAULT 'active',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
);
CREATE TABLE IF NOT EXISTS posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id     INTEGER NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    slug          TEXT NOT NULL,
    content       TEXT NOT NULL,
    content_html  TEXT,
    excerpt       TEXT,
    cover_url     TEXT,
    status        TEXT NOT NULL DEFAULT 'draft',
    is_pinned     INTEGER NOT NULL DEFAULT 0,
    is_public     INTEGER NOT NULL DEFAULT 1,
    view_count    INTEGER NOT NULL DEFAULT 0,
    word_count    INTEGER NOT NULL DEFAULT 0,
    published_at  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
);
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id   INTEGER REFERENCES categories(id),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    icon        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT
);
CREATE TABLE IF NOT EXISTS post_categories (
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);
CREATE TABLE IF NOT EXISTS tags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL,
    color      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
CREATE TABLE IF NOT EXISTS comments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id    INTEGER REFERENCES comments(id),
    author_name  TEXT NOT NULL,
    author_email TEXT,
    author_url   TEXT,
    content      TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    ip_address   TEXT,
    user_agent   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
);
CREATE TABLE IF NOT EXISTS friends (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    url          TEXT NOT NULL,
    avatar_url   TEXT,
    description  TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    check_url_ok INTEGER,
    checked_at   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    family     TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    action     TEXT NOT NULL,
    target     TEXT,
    metadata   TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

/** 初始化 D1 数据库 schema + 种子数据 */
export async function seedDatabase() {
  const DB = (env as any).DB as D1Database;

  // 执行 schema
  for (const stmt of SCHEMA_SQL.split(";").filter((s) => s.trim())) {
    await DB.prepare(stmt).run();
  }

  // 种子用户（密码: testpass123）
  const passwordHash = await bcrypt.hash("testpass123", 10);
  await DB.prepare(
    `INSERT OR IGNORE INTO users (id, username, email, password_hash, role, status)
     VALUES (1, 'admin', 'admin@test.com', ?, 'admin', 'active')`,
  )
    .bind(passwordHash)
    .run();

  // 种子分类
  await DB.prepare(
    `INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order)
     VALUES (1, '技术', 'tech', '技术文章', 1)`,
  ).run();

  // 种子标签
  await DB.prepare(
    `INSERT OR IGNORE INTO tags (id, name, slug, color)
     VALUES (1, 'JavaScript', 'javascript', '#f7df1e')`,
  ).run();

  // 种子文章
  await DB.prepare(
    `INSERT OR IGNORE INTO posts (id, author_id, title, slug, content, status, is_pinned, published_at)
     VALUES (1, 1, '测试文章', 'test-post', '# Hello\n这是测试内容', 'published', 0, '2026-01-15 10:00:00')`,
  ).run();

  await DB.prepare(
    `INSERT OR IGNORE INTO posts (id, author_id, title, slug, content, status, is_pinned, published_at)
     VALUES (2, 1, '置顶文章', 'pinned-post', '# 置顶\n置顶内容', 'published', 1, '2026-01-16 10:00:00')`,
  ).run();

  await DB.prepare(
    `INSERT OR IGNORE INTO posts (id, author_id, title, slug, content, status, is_pinned, published_at)
     VALUES (3, 1, '草稿文章', 'draft-post', '# 草稿\n草稿内容', 'draft', 0, NULL)`,
  ).run();

  // 关联分类和标签
  await DB.prepare(
    "INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (1, 1)",
  ).run();
  await DB.prepare(
    "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (1, 1)",
  ).run();

  // 种子友链
  await DB.prepare(
    `INSERT OR IGNORE INTO friends (id, name, url, avatar_url, description, status)
     VALUES (1, '测试友链', 'https://example.com', 'https://example.com/avatar.png', '一个友链', 'approved')`,
  ).run();
  await DB.prepare(
    `INSERT OR IGNORE INTO friends (id, name, url, description, status)
     VALUES (2, '待审核友链', 'https://pending.com', '待审核', 'pending')`,
  ).run();

  // 种子站点设置
  await DB.prepare(
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('site_name', '"Nami Blog"')`,
  ).run();
  await DB.prepare(
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('site_description', '"测试站点描述"')`,
  ).run();
  await DB.prepare(
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('social_links', '{"github":"https://github.com/test-user"}')`,
  ).run();
}
