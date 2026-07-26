# KV 公开读缓存实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 Nami Blog 增加 Cloudflare KV 公开读缓存，降低热门页面的重复 D1 查询，同时保留 D1 真数据源、内容写入可靠性和无 KV 降级能力。

**Architecture:** 单 Worker 增加 `CACHE` KV binding。公开文章、非搜索列表、分类、标签、友链和公开设置使用 cache-aside；后台产生公开内容变更后统一清除 `nami:public:v1:` 前缀缓存。KV 缺失、读取、写入或清理失败时记录脱敏日志并回退 D1，不影响前台读取和后台保存。

**Tech Stack:** Cloudflare Workers KV、D1、Hono、Next.js、TypeScript、Vitest、Wrangler。

---

### Task 1：实现可降级的 KV 缓存模块

**Files:**
- Create: `apps/api/src/lib/public-cache.ts`
- Create: `apps/api/src/__tests__/public-cache.test.ts`

**Steps:**

1. 为命中、未命中、未启用、读取失败、写入失败和前缀清理编写失败测试。
2. 运行 `pnpm --filter @nami/api test -- public-cache.test.ts`，确认测试先失败。
3. 实现版本化 key、JSON cache-aside、TTL 和分页式前缀清理。
4. 确保 KV 异常只输出变量名与操作类型，不输出缓存正文、Token 或访客数据。
5. 再次运行定向测试并确认通过。

### Task 2：接入公开 API 读路径

**Files:**
- Modify: `apps/api/src/routes/public.ts`
- Modify: `apps/api/src/__tests__/public-routes.test.ts`

**Steps:**

1. 增加 `X-Nami-Cache` 的 `HIT`、`MISS`、`BYPASS` 集成测试。
2. 文章列表仅在没有 `q` 搜索参数时缓存；搜索始终直读 D1。
3. 缓存公开文章详情、分类、标签、友链和公开设置。
4. 不缓存 404、草稿、浏览量写入、评论、后台或认证响应。
5. 运行公开路由测试，确认响应结构和原有缓存头保持兼容。

### Task 3：后台公开内容变更后失效缓存

**Files:**
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/__tests__/admin-posts.test.ts`

**Steps:**

1. 写入“先缓存列表，再发布文章，下一次读取必须 MISS 且包含新文章”的集成测试。
2. 在管理路由中识别 `publication.status = live` 的成功响应。
3. 等待 KV 前缀清理完成后再返回；清理异常不得将成功写入改成失败。
4. 草稿保存的 `not_needed` 响应不触发清理。
5. 运行管理端与公开端测试。

### Task 4：增加 Worker KV binding 与类型

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/__tests__/cloudflare-test.d.ts`
- Modify: `apps/web/cloudflare-env.d.ts`
- Modify: `apps/web/src/lib/cloudflare.ts`

**Steps:**

1. 在根 Wrangler 配置增加自动配置的 `CACHE` KV namespace。
2. API Binding 将 `CACHE` 声明为可选，缺失时自动直读 D1。
3. Next 内嵌 Hono 运行环境透传 `source.CACHE`。
4. 更新本地和测试 Worker 类型。
5. 运行类型检查与 Wrangler dry-run，确认 D1、Assets、KV 均被识别。

### Task 5：更新架构和新手文档

**Files:**
- Create: `docs/adr/0003-use-kv-public-read-cache.md`
- Modify: `docs/adr/0002-adopt-nextjs-single-worker.md`
- Modify: `README.md`
- Modify: `docs/Cloudflare部署指南.md`
- Modify: `docs/小白上手指南.md`
- Modify: `docs/部署运维文档.md`
- Modify: `docs/数据库设计文档.md`
- Modify: `docs/变更记录.md`
- Modify: `openapi/nami-blog.yaml`

**Steps:**

1. 记录 D1 为真数据源、KV 为可丢弃公开缓存的决策和一致性取舍。
2. 明确 KV 不保存 Secret、草稿、评论隐私、浏览量或备份。
3. 新手文档说明 Wrangler 自动配置 KV，本地开发不需要新建 `.env` 变量。
4. 自定义部署和故障排查说明 KV 可删除重建，故障时系统回退 D1。
5. OpenAPI 补充 `X-Nami-Cache` 响应头语义。

### Task 6：完整验证

**Files:**
- Verify: all modified files

**Steps:**

1. 运行 `pnpm check`，期望类型检查与 ESLint 全部通过。
2. 运行 `pnpm test`，期望共享、API 和 Web 测试全部通过。
3. 运行 `pnpm build:worker`，期望 OpenNext 构建和密钥扫描通过。
4. 运行 `pnpm exec wrangler deploy --dry-run --config wrangler.jsonc`，确认 `CACHE`、`DB` 和 `ASSETS` 绑定。
5. 运行 `git diff --check` 与本地密钥扫描。
6. 本地启动 `4322`，检查健康接口、首次 MISS、二次 HIT、搜索 BYPASS 和后台发布后失效。
