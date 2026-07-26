# Nami Blog Next.js 单 Worker 迁移 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Astro Pages 前端迁移到 Next.js App Router，并与现有 Hono API 一起部署到一个 Cloudflare Worker。

**Architecture:** Next.js 通过 OpenNext 运行在 Cloudflare Workers。公开页面用 Server Components 服务端读取 Hono/D1，管理功能用 Client Components 调用同源 `/api/*`；Catch-all Route Handler 复用现有 Hono 应用，不重写数据库业务层。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind CSS 4、Hono、`@opennextjs/cloudflare`、Cloudflare Workers、D1、Vitest、pnpm。

---

### Task 1：搭建 Next.js 与 OpenNext 基础

**Files:**

- Replace: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/open-next.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Replace: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/api/[[...route]]/route.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/index.ts`

**Steps:**

1. 安装兼容版本的 Next.js、React、OpenNext 和类型依赖。
2. 创建 App Router 根布局并复用现有主题 Design Tokens。
3. 从 OpenNext Cloudflare context 读取 D1 和 Secrets。
4. 将所有 API 方法交给 Hono `app.fetch()`，验证 `/api/v1/healthz`。
5. 新增服务端内部 API helper，避免自请求和跨域。
6. 运行类型检查与最小构建，修复运行时边界问题。

### Task 2：迁移公开页面与 SEO

**Files:**

- Create: `apps/web/src/components/site/*`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/blog/page.tsx`
- Create: `apps/web/src/app/blog/page/[page]/page.tsx`
- Create: `apps/web/src/app/blog/[slug]/page.tsx`
- Create: `apps/web/src/app/blog/category/[slug]/page.tsx`
- Create: `apps/web/src/app/blog/tag/[slug]/page.tsx`
- Create: `apps/web/src/app/about/page.tsx`
- Create: `apps/web/src/app/friends/page.tsx`
- Create: `apps/web/src/app/search/page.tsx`
- Create: `apps/web/src/app/rss.xml/route.ts`
- Create: `apps/web/src/app/sitemap.ts`
- Create: `apps/web/src/app/not-found.tsx`

**Steps:**

1. 迁移 Logo、导航、主题切换、文章卡片与编辑风格排版。
2. 公开页面服务端读取最新 D1 内容，文章不存在时返回 404。
3. 数字分页使用 `/blog/page/:page`，避免与文章 Slug 冲突。
4. 文章页保留目录、代码复制、分享、评论和阅读统计。
5. RSS 显式声明 `content:encoded` namespace，Sitemap 实时枚举公开内容。
6. 添加 Metadata、canonical、Open Graph 和 JSON-LD。

### Task 3：迁移管理后台

**Files:**

- Create: `apps/web/src/components/admin/*`
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/login/page.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/posts/page.tsx`
- Create: `apps/web/src/app/admin/posts/new/page.tsx`
- Create: `apps/web/src/app/admin/posts/edit/page.tsx`
- Create: `apps/web/src/app/admin/categories/page.tsx`
- Create: `apps/web/src/app/admin/tags/page.tsx`
- Create: `apps/web/src/app/admin/comments/page.tsx`
- Create: `apps/web/src/app/admin/friends/page.tsx`
- Create: `apps/web/src/app/admin/settings/page.tsx`
- Migrate: `apps/web/src/lib/admin-session.ts`
- Migrate: `apps/web/src/lib/editor.ts`

**Steps:**

1. 建立后台 Shell、鉴权守卫、移动端侧栏、退出和主题切换。
2. 迁移仪表盘、文章列表、分类、标签、评论、友链与设置页。
3. 把原生 Dialog 与编辑器逻辑改为 React state，保留焦点、关闭和错误反馈。
4. 迁移新建/编辑文章、标签选择、Markdown 快捷键、本地草稿与离开保护。
5. 将 Pages 部署提示改为“已保存，前台已实时生效”。
6. 验证导入/导出备份和修改密码流程。

### Task 4：删除 Pages 与 Astro 运行逻辑

**Files:**

- Modify: `apps/api/src/routes/admin.ts`
- Delete: `apps/api/src/lib/pages-deploy.ts`
- Delete: `apps/api/src/__tests__/pages-deploy.test.ts`
- Delete: `apps/web/src/**/*.astro`
- Delete: Astro-only libraries and configuration
- Modify: API and Web tests

**Steps:**

1. 删除 Deploy Hook Secret、校验和外部网络请求。
2. API 公开内容变更返回 `publication.status = "live"`，草稿返回 `not_needed`。
3. 删除 CORS 与生产 API 地址变量，所有浏览器请求使用相对路径。
4. 移除 Astro、MDX、Sitemap adapter 与 Pages `_headers`。
5. 更新 Vitest 断言并确认现有 Hono API 行为不变。

### Task 5：统一配置、脚本与环境变量

**Files:**

- Create: `wrangler.jsonc`
- Delete: `apps/api/wrangler.toml`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `apps/api/vitest.config.ts`

**Steps:**

1. Worker 名称设为 `nami-blog`，OpenNext 入口指向 `apps/web/.open-next/worker.js`。
2. 根目录配置现有 D1 binding 与静态 Assets，只保留一份 Wrangler 文件。
3. 根脚本统一为 `pnpm dev`、`pnpm build`、`pnpm deploy` 与数据库命令。
4. 本地 Next.js 继续读取根目录 `.env`；生产 Secrets 只在 Cloudflare Dashboard 设置。
5. 生产地址固定为 `https://nami-blog.codeelite.workers.dev`，自定义域名只需修改公开站点地址变量。

### Task 6：重写文档

**Files:**

- Modify: `README.md`
- Modify: `docs/Cloudflare部署指南.md`
- Modify: `docs/小白上手指南.md`
- Modify: `docs/部署运维文档.md`
- Modify: `docs/前端功能与交互设计文档.md`
- Modify: `docs/数据库设计文档.md`
- Modify: `docs/Git工作规范.md`
- Modify: `docs/变更记录.md`
- Modify: `openapi/nami-blog.yaml` when response field changes

**Steps:**

1. 所有新手流程改为创建一个 Worker，不出现 Pages 和 Deploy Hook。
2. 本地开发保持 `pnpm install && cp .env.example .env`、迁移、启动四步。
3. 说明 Dashboard 中 D1 binding、三个 Secrets、Git 构建命令和自定义域名。
4. 说明 `NEXT_PUBLIC_SITE_URL` 是公开地址而非密钥，使用自定义域名时应修改。
5. 更新架构图、目录结构、回滚、缓存与故障排查。

### Task 7：完整验证与交付

**Steps:**

1. 运行共享、Web 与 API 测试。
2. 运行 TypeScript、Next.js 构建、ESLint 与 OpenAPI YAML 校验。
3. 运行 OpenNext 构建和 Wrangler dry-run，确认只生成一个 Worker。
4. 本地启动生产构建，验收首页、文章、分类、标签、RSS、Sitemap、登录与全部后台 CRUD。
5. 检查构建包不包含 `.env`、JWT 和管理员密码。
6. 提交并推送 `main`。
