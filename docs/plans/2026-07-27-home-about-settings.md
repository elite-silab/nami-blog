# 首页与关于页配置 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让站长在后台配置首页核心文案和关于页 Markdown，并以当前页面内容作为默认值，保存后立即更新前台。

**Architecture:** 继续使用现有 `site_settings` 键值表，不增加页面搭建器或新数据表。首页读取结构化字段以保持固定版式，关于页读取 Markdown 并复用安全渲染器；公开设置继续通过 KV 缓存，后台保存成功后统一失效。

**Tech Stack:** Hono、Cloudflare D1/KV、Next.js App Router、React、TypeScript、Vitest、marked、sanitize-html。

---

### Task 1: 定义页面内容默认值

**Files:**
- Create: `apps/web/src/lib/site-content.ts`
- Create: `apps/web/src/lib/site-content.test.ts`
- Modify: `apps/web/src/lib/types.ts`

**Steps:**
1. 编写测试，覆盖当前首页文案、站点副标题回退和关于页默认 Markdown。
2. 运行 `pnpm --filter @nami/web test`，确认测试先失败。
3. 增加结构化首页默认值、解析函数与关于页默认 Markdown 生成函数。
4. 扩展 `SiteSettings` 类型并再次运行 Web 测试。

### Task 2: 扩展设置 API 与备份

**Files:**
- Create: `apps/api/src/__tests__/settings.test.ts`
- Modify: `apps/api/src/routes/public.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/lib/site-backup.ts`

**Steps:**
1. 编写后台保存页面内容、公开读取和缓存失效测试。
2. 运行 API 定向测试并确认新字段尚未返回。
3. 将首页字段与 `site_about` 加入后台保存和公开读取允许列表。
4. 将新设置键加入备份导出允许列表。
5. 再次运行 API 测试并确认通过。

### Task 3: 接入公开首页和关于页

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/about/page.tsx`

**Steps:**
1. 首页通过解析函数读取标语、标题、强调文字、简介和两个按钮文案。
2. 未保存新字段时保持当前页面文案与原有回退行为。
3. 关于页将 `site_about` 作为 Markdown；未保存时生成与当前页面等价的默认 Markdown。
4. 关于页复用 `renderMarkdown`，不直接输出未清理 HTML。

### Task 4: 增加后台编辑入口

**Files:**
- Modify: `apps/web/src/app/admin/settings/page.tsx`

**Steps:**
1. 扩展设置状态、加载映射和保存请求。
2. 新增“首页内容”结构化表单和“关于页”Markdown 文本框。
3. 增加恢复当前默认内容按钮，恢复只修改表单，仍需点击保存。
4. 保留主题、评论、备份和密码功能。

### Task 5: 文档与完整验证

**Files:**
- Modify: `docs/前端功能与交互设计文档.md`
- Modify: `docs/管理后台功能与设计文档.md`
- Modify: `docs/变更记录.md`

**Steps:**
1. 记录首页结构化配置、关于页 Markdown、安全和即时生效边界。
2. 运行 `git diff --check`、`pnpm check` 和 `pnpm test`。
3. 运行 `pnpm --filter @nami/web build:worker`。
4. 运行 Wrangler `deploy --dry-run` 并检查 D1、KV 与 Assets 绑定。
5. 检查构建副作用，提交并推送 `main`。
