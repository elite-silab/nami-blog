export const SITE_BACKUP_FORMAT = "nami-blog-backup";
export const SITE_BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10_000_000;
const MAX_BACKUP_RECORDS = 10_000;

type BackupValue = string | number | null;
export type BackupRow = Record<string, BackupValue>;

export type SiteBackup = {
  format: typeof SITE_BACKUP_FORMAT;
  version: typeof SITE_BACKUP_VERSION;
  exported_at: string;
  data: {
    posts: BackupRow[];
    categories: BackupRow[];
    tags: BackupRow[];
    post_categories: BackupRow[];
    post_tags: BackupRow[];
    comments: BackupRow[];
    friends: BackupRow[];
    settings: BackupRow[];
  };
};

type BackupTable = keyof SiteBackup["data"];

const TABLE_LIMITS: Record<BackupTable, number> = {
  posts: 5_000,
  categories: 1_000,
  tags: 2_000,
  post_categories: 20_000,
  post_tags: 20_000,
  comments: 50_000,
  friends: 5_000,
  settings: 1_000,
};

const TABLE_FIELDS: Record<BackupTable, string[]> = {
  posts: [
    "id", "title", "slug", "content", "content_html", "excerpt",
    "cover_url", "status", "is_pinned", "is_public", "view_count",
    "word_count", "published_at", "created_at", "updated_at",
  ],
  categories: [
    "id", "parent_id", "name", "slug", "description", "sort_order",
    "icon", "created_at", "updated_at",
  ],
  tags: ["id", "name", "slug", "color", "created_at", "updated_at"],
  post_categories: ["post_id", "category_id"],
  post_tags: ["post_id", "tag_id"],
  comments: [
    "id", "post_id", "parent_id", "author_name", "author_email",
    "author_url", "content", "status", "created_at", "updated_at",
  ],
  friends: [
    "id", "name", "url", "avatar_url", "description", "sort_order",
    "created_at", "updated_at",
  ],
  settings: ["key", "value", "updated_at"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowId(row: BackupRow, key = "id") {
  return row[key] as number;
}

function uniqueNumbers(rows: BackupRow[], key: string) {
  const values = rows.map((row) => rowId(row, key));
  return values.length === new Set(values).size;
}

function uniqueStrings(rows: BackupRow[], key: string) {
  const values = rows.map((row) => row[key]);
  return values.length === new Set(values).size;
}

function validateRows(
  value: unknown,
  table: BackupTable,
): { rows?: BackupRow[]; error?: string } {
  if (!Array.isArray(value)) return { error: `${table} 必须是数组` };
  if (value.length > TABLE_LIMITS[table]) {
    return { error: `${table} 数据量超过当前轻量备份上限` };
  }

  const fields = TABLE_FIELDS[table];
  const rows: BackupRow[] = [];
  for (const item of value) {
    if (!isRecord(item)) return { error: `${table} 包含无效记录` };
    const row: BackupRow = {};
    for (const field of fields) {
      if (!(field in item)) return { error: `${table}.${field} 缺失` };
      const fieldValue = item[field];
      if (
        fieldValue !== null &&
        typeof fieldValue !== "string" &&
        typeof fieldValue !== "number"
      ) {
        return { error: `${table}.${field} 类型无效` };
      }
      if (typeof fieldValue === "number" && !Number.isFinite(fieldValue)) {
        return { error: `${table}.${field} 数值无效` };
      }
      row[field] = fieldValue;
    }
    rows.push(row);
  }
  return { rows };
}

function requirePositiveIntegers(
  table: string,
  rows: BackupRow[],
  fields: string[],
) {
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field];
      if (!Number.isInteger(value) || (value as number) <= 0) {
        return `${table}.${field} 必须是正整数`;
      }
    }
  }
  return null;
}

function requireStrings(table: string, rows: BackupRow[], fields: string[]) {
  for (const row of rows) {
    for (const field of fields) {
      if (typeof row[field] !== "string") return `${table}.${field} 必须是文本`;
    }
  }
  return null;
}

function requireNonNegativeIntegers(
  table: string,
  rows: BackupRow[],
  fields: string[],
) {
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field];
      if (!Number.isInteger(value) || (value as number) < 0) {
        return `${table}.${field} 必须是非负整数`;
      }
    }
  }
  return null;
}

function hasParentCycle(rows: BackupRow[]) {
  const parents = new Map<number, number | null>(
    rows.map((row) => [rowId(row), row.parent_id as number | null]),
  );
  for (const id of parents.keys()) {
    const seen = new Set<number>();
    let current: number | null = id;
    while (current !== null) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = parents.get(current) ?? null;
    }
  }
  return false;
}

function uniquePairs(rows: BackupRow[], first: string, second: string) {
  const pairs = rows.map((row) => `${row[first]}:${row[second]}`);
  return pairs.length === new Set(pairs).size;
}

function referencesOnly(
  rows: BackupRow[],
  field: string,
  ids: Set<number>,
) {
  return rows.every((row) => {
    const value = row[field];
    return value === null || ids.has(value as number);
  });
}

export function validateSiteBackup(
  input: unknown,
): { backup?: SiteBackup; error?: string } {
  if (!isRecord(input)) return { error: "备份文件不是有效对象" };
  if (input.format !== SITE_BACKUP_FORMAT || input.version !== SITE_BACKUP_VERSION) {
    return { error: "备份格式或版本不受支持" };
  }
  if (typeof input.exported_at !== "string" || !isRecord(input.data)) {
    return { error: "备份元数据不完整" };
  }

  const data = {} as SiteBackup["data"];
  for (const table of Object.keys(TABLE_FIELDS) as BackupTable[]) {
    const result = validateRows(input.data[table], table);
    if (result.error) return { error: result.error };
    data[table] = result.rows || [];
  }
  const totalRecords = Object.values(data).reduce(
    (total, rows) => total + rows.length,
    0,
  );
  if (totalRecords > MAX_BACKUP_RECORDS) {
    return { error: "备份总记录数超过当前轻量恢复上限" };
  }

  const integerRequirements: Array<[BackupTable, string[]]> = [
    ["posts", ["id"]],
    ["categories", ["id"]],
    ["tags", ["id"]],
    ["post_categories", ["post_id", "category_id"]],
    ["post_tags", ["post_id", "tag_id"]],
    ["comments", ["id", "post_id"]],
    ["friends", ["id"]],
  ];
  for (const [table, fields] of integerRequirements) {
    const error = requirePositiveIntegers(table, data[table], fields);
    if (error) return { error };
  }

  const stringRequirements: Array<[BackupTable, string[]]> = [
    ["posts", ["title", "slug", "content", "status", "created_at", "updated_at"]],
    ["categories", ["name", "slug", "created_at", "updated_at"]],
    ["tags", ["name", "slug", "created_at", "updated_at"]],
    ["comments", ["author_name", "content", "status", "created_at", "updated_at"]],
    ["friends", ["name", "url", "created_at", "updated_at"]],
    ["settings", ["key", "value", "updated_at"]],
  ];
  for (const [table, fields] of stringRequirements) {
    const error = requireStrings(table, data[table], fields);
    if (error) return { error };
  }

  const integerError = [
    requireNonNegativeIntegers("posts", data.posts,
      ["is_pinned", "is_public", "view_count", "word_count"]),
    requireNonNegativeIntegers("categories", data.categories, ["sort_order"]),
    requireNonNegativeIntegers("friends", data.friends, ["sort_order"]),
  ].find(Boolean);
  if (integerError) return { error: integerError };

  for (const [table, rows] of [
    ["categories", data.categories], ["comments", data.comments],
  ] as Array<[string, BackupRow[]]>) {
    if (rows.some((row) => row.parent_id !== null &&
      (!Number.isInteger(row.parent_id) || (row.parent_id as number) <= 0))) {
      return { error: `${table}.parent_id 必须为空或正整数` };
    }
  }
  if (data.posts.some((row) => !["draft", "published", "archived"].includes(row.status as string))) {
    return { error: "文章状态无效" };
  }
  if (data.posts.some((row) =>
    ![0, 1].includes(row.is_pinned as number) ||
    ![0, 1].includes(row.is_public as number))) {
    return { error: "文章公开或置顶标记无效" };
  }
  if (data.comments.some((row) => !["pending", "approved", "rejected"].includes(row.status as string))) {
    return { error: "评论状态无效" };
  }

  for (const [table, key] of [
    ["posts", "id"], ["categories", "id"], ["tags", "id"],
    ["comments", "id"], ["friends", "id"],
  ] as Array<[BackupTable, string]>) {
    if (!uniqueNumbers(data[table], key)) return { error: `${table} 存在重复 ID` };
  }
  if (!uniqueStrings(data.posts, "slug")) return { error: "文章 Slug 重复" };
  if (!uniqueStrings(data.categories, "slug")) return { error: "分类 Slug 重复" };
  if (!uniqueStrings(data.tags, "slug")) return { error: "标签 Slug 重复" };
  if (!uniqueStrings(data.settings, "key")) return { error: "设置键重复" };
  if (!uniquePairs(data.post_categories, "post_id", "category_id")) {
    return { error: "文章分类关联重复" };
  }
  if (!uniquePairs(data.post_tags, "post_id", "tag_id")) {
    return { error: "文章标签关联重复" };
  }
  if (hasParentCycle(data.categories) || hasParentCycle(data.comments)) {
    return { error: "父级关联存在循环" };
  }

  const postIds = new Set(data.posts.map((row) => rowId(row)));
  const categoryIds = new Set(data.categories.map((row) => rowId(row)));
  const tagIds = new Set(data.tags.map((row) => rowId(row)));
  const commentIds = new Set(data.comments.map((row) => rowId(row)));

  if (!referencesOnly(data.categories, "parent_id", categoryIds)) {
    return { error: "分类父级引用不存在" };
  }
  if (!referencesOnly(data.post_categories, "post_id", postIds) ||
      !referencesOnly(data.post_categories, "category_id", categoryIds)) {
    return { error: "文章分类关联无效" };
  }
  if (!referencesOnly(data.post_tags, "post_id", postIds) ||
      !referencesOnly(data.post_tags, "tag_id", tagIds)) {
    return { error: "文章标签关联无效" };
  }
  if (!referencesOnly(data.comments, "post_id", postIds) ||
      !referencesOnly(data.comments, "parent_id", commentIds)) {
    return { error: "评论关联无效" };
  }

  return {
    backup: {
      format: SITE_BACKUP_FORMAT,
      version: SITE_BACKUP_VERSION,
      exported_at: input.exported_at,
      data,
    },
  };
}

export async function exportSiteBackup(DB: D1Database): Promise<SiteBackup> {
  const [posts, categories, tags, postCategories, postTags, comments, friends, settings] =
    await Promise.all([
      DB.prepare(`SELECT id, title, slug, content, content_html, excerpt, cover_url,
        status, is_pinned, is_public, view_count, word_count, published_at,
        created_at, updated_at FROM posts WHERE deleted_at IS NULL ORDER BY id`).all<BackupRow>(),
      DB.prepare(`SELECT id, parent_id, name, slug, description, sort_order, icon,
        created_at, updated_at FROM categories WHERE deleted_at IS NULL
        ORDER BY parent_id IS NOT NULL, id`).all<BackupRow>(),
      DB.prepare(`SELECT id, name, slug, color, created_at, updated_at
        FROM tags WHERE deleted_at IS NULL ORDER BY id`).all<BackupRow>(),
      DB.prepare(`SELECT pc.post_id, pc.category_id FROM post_categories pc
        JOIN posts p ON p.id = pc.post_id AND p.deleted_at IS NULL
        JOIN categories c ON c.id = pc.category_id AND c.deleted_at IS NULL
        ORDER BY pc.post_id, pc.category_id`).all<BackupRow>(),
      DB.prepare(`SELECT pt.post_id, pt.tag_id FROM post_tags pt
        JOIN posts p ON p.id = pt.post_id AND p.deleted_at IS NULL
        JOIN tags t ON t.id = pt.tag_id AND t.deleted_at IS NULL
        ORDER BY pt.post_id, pt.tag_id`).all<BackupRow>(),
      DB.prepare(`SELECT c.id, c.post_id, c.parent_id, c.author_name, c.author_email,
        c.author_url, c.content, c.status, c.created_at, c.updated_at
        FROM comments c JOIN posts p ON p.id = c.post_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL ORDER BY c.parent_id IS NOT NULL, c.id`).all<BackupRow>(),
      DB.prepare(`SELECT id, name, url, avatar_url, description, sort_order,
        created_at, updated_at FROM friends WHERE deleted_at IS NULL ORDER BY id`).all<BackupRow>(),
      DB.prepare(`SELECT key, value, updated_at FROM site_settings
        WHERE key IN ('site_name', 'site_subtitle', 'site_description', 'site_about',
          'home_eyebrow', 'home_title', 'home_title_highlight', 'home_description',
          'home_primary_label', 'home_secondary_label',
          'seo_description', 'site_theme', 'icp_number', 'comment_enabled',
          'comment_auto_approve', 'social_links', 'sensitive_words')
        ORDER BY key`).all<BackupRow>(),
    ]);

  return {
    format: SITE_BACKUP_FORMAT,
    version: SITE_BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      posts: posts.results,
      categories: categories.results,
      tags: tags.results,
      post_categories: postCategories.results,
      post_tags: postTags.results,
      comments: comments.results,
      friends: friends.results,
      settings: settings.results,
    },
  };
}

function parentsFirst(rows: BackupRow[]) {
  const remaining = [...rows];
  const inserted = new Set<number>();
  const sorted: BackupRow[] = [];
  while (remaining.length > 0) {
    const index = remaining.findIndex((row) =>
      row.parent_id === null || inserted.has(row.parent_id as number));
    if (index < 0) throw new Error("Backup parent relationship cannot be restored");
    const [row] = remaining.splice(index, 1);
    sorted.push(row);
    inserted.add(rowId(row));
  }
  return sorted;
}

export async function importSiteBackup(
  DB: D1Database,
  backup: SiteBackup,
  adminId: number,
) {
  const statements: D1PreparedStatement[] = [
    DB.prepare("DELETE FROM post_categories"),
    DB.prepare("DELETE FROM post_tags"),
    DB.prepare("DELETE FROM comments"),
    DB.prepare("DELETE FROM posts"),
    DB.prepare("DELETE FROM categories"),
    DB.prepare("DELETE FROM tags"),
    DB.prepare("DELETE FROM friends"),
    DB.prepare("DELETE FROM site_settings"),
  ];
  for (const row of backup.data.posts) {
    statements.push(DB.prepare(`INSERT INTO posts
      (id, author_id, title, slug, content, content_html, excerpt, cover_url,
       status, is_pinned, is_public, view_count, word_count, published_at,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(row.id, adminId, row.title, row.slug, row.content, row.content_html,
        row.excerpt, row.cover_url, row.status, row.is_pinned, row.is_public,
        row.view_count, row.word_count, row.published_at, row.created_at, row.updated_at));
  }
  for (const row of parentsFirst(backup.data.categories)) {
    statements.push(DB.prepare(`INSERT INTO categories
      (id, parent_id, name, slug, description, sort_order, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(row.id, row.parent_id, row.name, row.slug, row.description,
        row.sort_order, row.icon, row.created_at, row.updated_at));
  }
  for (const row of backup.data.tags) {
    statements.push(DB.prepare(`INSERT INTO tags
      (id, name, slug, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(row.id, row.name, row.slug, row.color, row.created_at, row.updated_at));
  }
  for (const row of backup.data.post_categories) {
    statements.push(DB.prepare(
      "INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)",
    ).bind(row.post_id, row.category_id));
  }
  for (const row of backup.data.post_tags) {
    statements.push(DB.prepare(
      "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
    ).bind(row.post_id, row.tag_id));
  }
  for (const row of parentsFirst(backup.data.comments)) {
    statements.push(DB.prepare(`INSERT INTO comments
      (id, post_id, parent_id, author_name, author_email, author_url, content,
       status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(row.id, row.post_id, row.parent_id, row.author_name, row.author_email,
        row.author_url, row.content, row.status, row.created_at, row.updated_at));
  }
  for (const row of backup.data.friends) {
    statements.push(DB.prepare(`INSERT INTO friends
      (id, name, url, avatar_url, description, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'approved', ?, ?, ?)`)
      .bind(row.id, row.name, row.url, row.avatar_url, row.description,
        row.sort_order, row.created_at, row.updated_at));
  }
  for (const row of backup.data.settings) {
    statements.push(DB.prepare(
      "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)",
    ).bind(row.key, row.value, row.updated_at));
  }

  // D1 batch 以事务执行：任意 INSERT 失败时会回滚前面的清空操作。
  await DB.batch(statements);
}
