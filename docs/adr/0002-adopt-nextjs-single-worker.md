# ADR-0002：采用 Next.js 单 Worker 架构

## 状态

已接受

## 背景

Nami Blog 面向个人站长和开源使用者。原项目使用 Astro SSG 托管在 Cloudflare Pages，Hono API 单独运行在 Workers。公开内容写入 D1 后需要 Pages Deploy Hook 重新构建，用户还要维护两个 Cloudflare 项目、两个地址、跨域和多组环境变量。

项目希望只使用一个 Cloudflare Worker，并扩大开源项目的可理解性、贡献者范围和前端生态兼容性。现有 Hono API、D1 数据、备份格式、认证和业务行为已经稳定，不应为了更换前端框架全部重写。

## 决策

使用 Next.js App Router 与 `@opennextjs/cloudflare`，部署到一个名为 `nami-blog` 的 Cloudflare Worker，默认生产地址为 `https://nami-blog.codeelite.workers.dev`。

- Next.js Server Components 负责公开页面的服务端渲染。
- Client Components 负责管理后台、评论、搜索、阅读统计和主题交互。
- Next.js Catch-all Route Handler 将 `/api/*` 请求交给现有 Hono 应用。
- Hono 继续负责认证、公开 API、管理 API和 D1 数据访问。
- 静态资源由同一个 Worker 的 Assets 绑定提供。
- 页面在服务端直接调用 Hono，不对 Worker 自身发起网络请求。
- 浏览器统一使用同源 `/api/*`，删除 CORS、`PUBLIC_API_URL` 和 Pages Deploy Hook。
- Canonical、RSS、Sitemap 和分享链接以 `https://nami-blog.codeelite.workers.dev` 为默认生产地址；绑定自定义域名后只需修改公开变量 `NEXT_PUBLIC_SITE_URL`。

## 后果

### 正面影响

- Cloudflare 只需维护一个 Worker、一个 D1 绑定、一个自动配置的 KV 缓存和一组密钥。
- 文章及站点设置写入成功后立即可见，不需要重新部署。
- Next.js 的社区、组件生态和开发者认知更广，有利于开源贡献。
- 保留 Hono 业务层可降低迁移风险，也便于 API 独立测试。
- Server Components 保留 SEO、RSS、Sitemap 和无 JavaScript 阅读能力。

### 负面影响

- 现有 Astro 页面与组件需要一次性迁移为 React/Next.js。
- Next.js Worker 构建体积和运行时开销高于 Astro 静态站点。
- 项目依赖 OpenNext 适配层，需要跟随 Next.js 与 Cloudflare 兼容矩阵升级。

### 中性影响

- `apps/web` 仍是 Web 应用目录，但内部框架从 Astro 改为 Next.js。
- `apps/api` 与 `packages/shared` 保留，形成一个部署、多个内部模块的模块化单体。
- 现有 Pages 项目不会由代码自动删除；新 Worker 验证成功后再由站长在 Dashboard 删除。

## 备选方案

### Astro SSR + Cloudflare Adapter

运行更轻，但对扩大 Next.js 开源贡献者群体的帮助有限，因此不采用。

### 全量改写为 Next.js Route Handlers

技术栈更单一，但会重复改写已验证的认证、校验、备份与 D1 逻辑，迁移风险高且没有用户收益，因此不采用。

### Next.js 前端 + 独立 Hono Worker

迁移最直接，但继续存在两个项目、两个地址和跨域配置，与单 Worker 目标冲突，因此不采用。

## 非功能要求

- 安全：JWT、管理员初始密码只作为 Worker Secret；前端包不得包含密钥。
- 性能：公开页面使用服务端渲染与合理缓存；静态资源使用长缓存；后台页面禁止公开缓存。
- 可靠性：D1 写入成功即内容生效；不依赖外部部署 Hook。
- 可维护性：根目录只保留一份 Wrangler 配置、一条部署命令和一份 `.env` 本地配置。
- 可访问性：保留键盘操作、焦点样式、ARIA 状态和移动端管理导航。
- 成本：不新增第二个 Worker；KV 仅作为 ADR-0003 定义的可降级公开缓存，不承载主数据。
