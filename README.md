<div align="center">
  <br>
  <img width="280" style="max-width:80%" src="apps/web/public/images/logo.svg" title="Nami Blog 娜美博客">
  <br><br>
  <p><b>一个运行在 Cloudflare 边缘的轻量级个人博客系统。</b></p>
  <p>Astro SSG 静态生成 · Hono Workers API · D1 数据库 · 三套二次元主题</p>
  <p><b>MVP 阶段完全零成本运行</b> — Cloudflare Pages + Workers + D1 均在免费额度内。</p>
  <br>
  <a href="#-快速开始">快速开始</a> · <a href="#-文档">文档</a> · <a href="https://github.com/elite-silab/nami-blog/issues">反馈</a>
  <br><br>
</div>

## ✨ 特色

| | |
|---|---|
| 🌸 **三套二次元主题** | 樱花 / 海洋 / 星空，管理后台一键切换，独立 Dark 模式 |
| ⚡ **边缘渲染** | Astro SSG 静态生成 + Cloudflare CDN 全球分发，毫秒级响应 |
| 💬 **自建评论系统** | 嵌套回复、敏感词过滤、管理员审核，无第三方依赖 |
| 🔐 **可轮换 JWT 会话** | HttpOnly Cookie + 标签页令牌回退 |
| 📱 **响应式交互** | 阅读进度条、TOC 目录、代码块复制、移动端汉堡菜单 |
| 📡 **RSS + SEO** | RSS 订阅、Open Graph、Twitter Card、JSON-LD 结构化数据 |
| 🩺 **健康检查** | `/healthz` 端点、统一错误响应、公开 API 缓存策略 |

## 📸 截图

| 前台首页 | 管理后台 |
|---|---|
| ![前台](.github/screenshot-frontend.png) | ![后台](.github/screenshot-admin.png) |

> 📷 请在 `.github/` 目录放置截图文件

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端 | **Astro 5** | Static 模式 (SSG)，构建时预渲染 |
| API | **Cloudflare Workers** | Hono 框架，RESTful API |
| 数据库 | **Cloudflare D1** | SQLite 兼容，边缘分布式 |
| 样式 | **Tailwind CSS 4** | CSS-first 配置，CSS 变量主题 |
| 认证 | **JWT** (jose + bcryptjs) | HttpOnly Cookie + Bearer Header |
| Monorepo | **pnpm workspace** | `apps/api` + `apps/web` + `packages/shared` |
| 测试 | **Vitest** | 63 个测试用例，含 Workers 集成测试 |

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 20+ / [pnpm](https://pnpm.io/) 9+
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/) (最新)
- Cloudflare 账号（免费）

### 安装

```bash
git clone https://github.com/elite-silab/nami-blog.git
cd nami-blog
pnpm install

# 复制环境变量模板
cp .env.example .env
```

### 启动开发环境

```bash
pnpm dev
# → API:  http://localhost:8788
# → Web:  http://localhost:4321
```

打开 `http://localhost:4321/admin/login` 登录管理后台：

- 用户名：`admin`
- 密码：`.env` 中的 `ADMIN_INITIAL_PASSWORD`（默认 `nami-local-admin`）

### 常用命令

```bash
pnpm dev              # 启动 API + Web 开发服务器
pnpm build            # 构建 API + Web
pnpm deploy:api       # 部署 Workers API
pnpm deploy:web       # 部署前端到 Pages
pnpm test             # 运行全部测试 (63 tests)
pnpm test:watch       # 测试监听模式
pnpm db:migrate       # 执行本地 D1 迁移
pnpm db:seed          # 交互式创建管理员
pnpm db:reset         # 重置本地数据库
pnpm typecheck        # 类型检查
pnpm lint             # ESLint 检查
```

## 🏗 项目结构

```
nami-blog/
├── apps/
│   ├── api/                      # Cloudflare Workers API (Hono + D1)
│   │   ├── src/
│   │   │   ├── index.ts          # Hono 入口
│   │   │   ├── routes/           # API 路由 (auth, admin, public, comments)
│   │   │   ├── middleware/       # 鉴权中间件
│   │   │   ├── lib/              # auth.ts, pagination.ts
│   │   │   └── __tests__/        # Vitest 测试 (30 tests)
│   │   ├── wrangler.toml         # Workers 配置 (多环境: production + staging)
│   │   └── vitest.config.ts      # 测试配置 (cloudflarePool)
│   └── web/                      # Astro SSG 静态前端
│       ├── src/
│       │   ├── pages/            # 页面 (blog, admin, about, friends, search...)
│       │   ├── components/       # Astro 组件
│       │   ├── layouts/          # 布局组件 (BaseLayout)
│       │   ├── lib/              # api-client.ts, theme.ts
│       │   └── styles/           # 全局样式 + CSS 变量主题
│       └── astro.config.mjs      # Astro 配置 (output: "static")
├── packages/
│   └── shared/                   # @nami/shared (Zod schemas + 类型)
├── migrations/                   # D1 数据库迁移 SQL
├── docs/                         # 项目文档
└── pnpm-workspace.yaml           # Monorepo workspace
```

## ☁️ 部署到 Cloudflare

本项目部署为两个独立的 Cloudflare 服务：

| 服务 | 类型 | 说明 |
|---|---|---|
| `nami-blog-api` | Workers | RESTful API + D1 数据库 |
| `nami-blog-web` | Pages | Astro SSG 静态前端 |

### 1. 部署 API

```bash
# 创建 D1 数据库，记录返回的 database_id
wrangler d1 create nami-blog

# 将 database_id 填入 apps/api/wrangler.toml

# 执行远程迁移 + 创建管理员
pnpm db:migrate:prod
pnpm db:seed -- --remote

# 在 Cloudflare Dashboard → Workers → Settings 添加 Secrets：
# JWT_SECRET、JWT_REFRESH_SECRET（使用不同的随机值）

# 部署
pnpm deploy:api
```

### 2. 部署前端

在 Cloudflare Pages → Settings → Environment variables 中填写：

| 变量 | 值 |
|---|---|
| `PUBLIC_API_URL` | `https://your-api.workers.dev` |
| `SITE_URL` | `https://your-site.pages.dev` |

```bash
pnpm deploy:web
```

> 📖 完整部署指南（含 CI/CD、DNS、WAF、灾难恢复）请参阅 [部署运维文档](docs/部署运维文档.md)。

## 🎨 主题系统

三套二次元风格主题 + 独立 Dark 模式，通过 CSS 变量实现，管理后台可视化切换：

| 主题 | 风格 | 主色调 |
|---|---|---|
| 🌸 樱花 Sakura | 温柔浪漫，粉色系 | `#ec4899` |
| 🌊 海洋 Ocean | 清凉通透，蓝绿色 | `#0891b2` |
| ✨ 星空 Starry | 深邃宇宙，紫蓝色 | `#8b5cf6` |

每套主题支持明/暗两种模式，`data-theme` + `data-dark` 属性独立控制，任意组合。

## 📖 文档

| 文档 | 说明 |
|---|---|
| [部署运维文档](docs/部署运维文档.md) | CI/CD、监控、灾难恢复 |
| [小白上手指南](docs/小白上手指南.md) | 零基础本地启动指南 |
| [前端功能文档](docs/前端功能与交互设计文档.md) | 页面结构、交互规范 |
| [管理后台文档](docs/管理后台功能与设计文档.md) | 后台架构、安全设计 |
| [OpenAPI 契约](openapi/nami-blog.yaml) | API 路径、字段和响应 |
| [Git 工作规范](docs/Git工作规范.md) | 分支模型、提交规范 |

## 🤝 参与贡献

欢迎贡献！

1. Fork 本仓库并创建功能分支：`nami-feat/your-feature`
2. 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 提交规范
3. 确保 `pnpm lint` + `pnpm typecheck` + `pnpm test` 全部通过
4. 提交 Pull Request

## 📜 许可

[MIT](LICENSE)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=elite-silab/nami-blog&type=Date)](https://star-history.com/#elite-silab/nami-blog&Date)
# Nami Blog — 娜美 CF 博客

一个采用 **Monorepo** 架构的编辑感个人博客。前端基于 **Astro 5 SSG** 静态生成，后端使用 **Cloudflare Workers API**（Hono 框架），D1 数据库存储。追求简洁、快速和良好的阅读体验。

MVP 阶段 **完全零成本运行** — Cloudflare Pages、Workers、D1、DNS 均在免费额度内。

## ✨ 特色

- 🌸 **三套二次元主题** — 樱花 / 海洋 / 星空，管理后台一键切换
- ⚡ **边缘渲染** — Astro SSG 静态生成 + Cloudflare CDN 全球分发，毫秒级响应
- 💬 **自建评论系统** — 支持嵌套回复、敏感词过滤、管理员审核
- 🔐 **可轮换 JWT 会话** — HttpOnly Cookie + 标签页令牌回退，兼容 Pages/Workers 默认域名
- 📱 **响应式交互** — 前台阅读进度、评论反馈、移动端菜单与后台抽屉导航
- 🩺 **边缘可观测性** — `/healthz` 健康检查、统一错误响应、公开 API 缓存策略

## 技术栈

| 层级     | 技术                      | 说明                                        |
| -------- | ------------------------- | ------------------------------------------- |
| 前端     | **Astro 5**               | Static 模式（SSG），构建时预渲染            |
| API      | **Cloudflare Workers**    | Hono 框架，独立部署，RESTful API            |
| 数据库   | **Cloudflare D1**         | SQLite 兼容，边缘分布式                     |
| 样式     | **Tailwind CSS 4**        | CSS-first 配置，CSS 变量主题系统            |
| 认证     | **JWT** (jose + bcryptjs) | HttpOnly Cookie + Authorization Header      |
| 部署     | **Pages + Workers**       | 前端 Pages CDN，API Workers 独立部署        |
| 共享校验 | **Zod**                   | `packages/shared` 工作空间包                |
| Monorepo | **pnpm workspace**        | `apps/api` + `apps/web` + `packages/shared` |

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/) (最新)
- Cloudflare 账号

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/elite-silab/nami-blog.git
cd nami-blog

# 2. 安装依赖
pnpm install
```

接下来只需要在编辑器里准备一个配置文件：

1. 在项目根目录找到 `.env.example`。
2. 复制一份，重命名为 `.env`。
3. 本地使用默认端口时，模板内容可以直接使用；生产密钥必须在 Cloudflare Dashboard 中单独设置。

API 和 Web 都读取根目录 `.env`。只有 `PUBLIC_` 前缀变量会进入浏览器，JWT 密钥仍只供 Workers 使用。

然后回到终端执行：

```bash
# 3. 启动开发环境（会自动初始化本地 D1，API + 前端并行）
pnpm run dev
# → API:  http://localhost:8788
# → 前端: http://localhost:4321
```

> 第一次接触 Cloudflare？请直接阅读 [小白上手指南](docs/小白上手指南.md)，里面按“点哪里、改哪个文件、看到什么算成功”逐步说明。

### 创建管理员账号

首次本地启动后，打开 `http://localhost:4321/admin/login`，直接使用：

- 用户名：`admin`
- 密码：根目录 `.env` 中的 `ADMIN_INITIAL_PASSWORD`（模板默认是 `nami-local-admin`）

只有本机地址和空管理员数据库会触发首次创建。密码以 bcrypt 哈希保存；首次登录后建议在“后台设置 → 安全设置”中修改。以后改动 `.env` 不会重置已有账号。

生产环境不使用这一本地初始密码，也不会自动创建管理员。部署者仍使用 `pnpm run db:seed -- --remote` 的受控流程创建生产管理员；程序会要求输入确认文字，避免误操作生产数据。本地需要额外管理员时，也可手动运行 `pnpm run db:seed`。

如需手工管理数据库，请参阅 [部署运维文档](docs/部署运维文档.md)。

### 常用命令

```bash
pnpm run dev              # 启动 API + 前端开发服务器
pnpm run dev:api          # 仅启动 Workers API (localhost:8788)
pnpm run dev:web          # 仅启动 Astro 前端 (localhost:4321)
pnpm run build            # 构建 API + 前端
pnpm run build:api        # 构建 Workers API
pnpm run build:web        # 构建 Astro 前端（SSG 预渲染）
pnpm run deploy:api       # 部署 Workers API
pnpm run deploy:web       # 部署前端到 Pages
pnpm run db:migrate       # 手动执行本地 D1 迁移（pnpm run dev 已自动执行）
pnpm run db:seed          # 高级：交互式创建/更新管理员
pnpm run db:migrate:prod  # 生产 D1 迁移
pnpm run lint             # ESLint 检查
pnpm run typecheck        # 类型检查
pnpm run check            # typecheck + lint
```

> 📖 更多运维命令请参阅 [部署运维文档 §11](docs/部署运维文档.md#11-常用运维命令)。

## 项目结构

```
nami-blog/
├── apps/
│   ├── api/                    # Cloudflare Workers API (Hono + D1)
│   │   ├── src/
│   │   │   ├── index.ts        # Hono 入口
│   │   │   ├── routes/         # API 路由 (auth, comments, admin, public)
│   │   │   ├── middleware/     # 鉴权中间件
│   │   │   └── lib/            # auth.ts, pagination.ts
│   │   ├── wrangler.toml       # Workers 配置 (D1 binding + JWT_SECRET)
│   │   └── package.json
│   └── web/                    # Astro SSG 静态前端
│       ├── src/
│       │   ├── pages/          # 静态页面 + 客户端 JS
│       │   │   ├── admin/      # 管理后台（静态 HTML + 客户端 fetch）
│       │   │   ├── blog/       # 博客页面（SSG getStaticPaths）
│       │   │   ├── about.astro
│       │   │   └── index.astro
│       │   ├── components/     # Astro 组件
│       │   ├── layouts/        # 布局组件
│       │   ├── lib/            # api-client.ts, theme.ts
│       │   └── styles/         # 全局样式 + CSS 变量主题
│       ├── astro.config.mjs    # Astro 配置 (output: "static")
│       └── package.json
├── packages/
│   └── shared/                 # @nami/shared 共享包 (Zod schemas + 类型)
├── migrations/                 # D1 数据库迁移 SQL
├── openapi/                    # API 契约 (OpenAPI 3.1)
├── docs/                       # 项目文档
├── pnpm-workspace.yaml         # Monorepo workspace 配置
└── package.json                # 根 package.json (workspace scripts)
```

## 部署到 Cloudflare

本项目部署为两个独立的 Cloudflare 项目：

| 项目            | 类型    | 域名示例                    |
| --------------- | ------- | --------------------------- |
| `nami-blog-api` | Workers | `api.nami-blog.workers.dev` |
| `nami-blog-web` | Pages   | `nami-blog.pages.dev`       |

### 部署 API (Workers)

```bash
# 1. 创建 D1 数据库
wrangler d1 create nami-blog
# 记录返回的 database_id，填入 apps/api/wrangler.toml

# 2. 执行远程迁移
pnpm run db:migrate:prod

# 3. 在 Cloudflare Dashboard 的 Workers 设置中添加两个 Secret：
# JWT_SECRET、JWT_REFRESH_SECRET（使用不同的随机值）

# 4. 部署 API
pnpm run deploy:api
```

### 部署前端 (Pages)

在 Cloudflare Pages 的 Settings → Environment variables 中填写：

| 变量 | 示例 |
| ---- | ---- |
| `PUBLIC_API_URL` | `https://api.nami-blog.workers.dev` |
| `SITE_URL` | `https://nami-blog.pages.dev` |

然后执行：

```bash
pnpm run deploy:web
```

> 📖 更详细的部署指南（含 CI/CD、缓存规则、WAF、DNS 配置、灾难恢复等）请参阅 [部署运维文档](docs/部署运维文档.md)。

## 管理后台

访问 `/admin/login` 登录管理后台，功能包括：

- **仪表盘** — 文章/评论统计、快捷操作
- **文章管理** — Markdown 快捷工具、标签页草稿恢复、离开保护、分类/标签、草稿/发布
- **分类管理** — 树形分类 CRUD
- **标签管理** — 标签 CRUD + 颜色标记
- **评论管理** — 审核/批准/拒绝/删除（自建评论系统）
- **友链管理** — 审核与排序
- **站点设置** — 基础配置、SEO、社交链接、主题切换（樱花/海洋/星空 + Dark 模式）、修改密码

## 🎨 主题系统

内置三套二次元风格主题 + 独立 Dark 模式开关，通过 CSS 变量实现，管理后台可视化切换：

| 主题           | 风格             | 主色调    |
| -------------- | ---------------- | --------- |
| 🌸 樱花 Sakura | 温柔浪漫，粉色系 | `#ec4899` |
| 🌊 海洋 Ocean  | 清凉通透，蓝绿色 | `#0891b2` |
| ✨ 星空 Starry | 深邃宇宙，紫蓝色 | `#8b5cf6` |

每套主题均支持明/暗两种模式，通过 `data-theme` + `data-dark` 属性独立控制，任意组合。

主题切换支持：`localStorage` 持久化 → 防闪烁内联脚本 → 导航栏 🌙/☀️ 按钮即时切换。

## 文档

| 文档                                           | 说明                            |
| ---------------------------------------------- | ------------------------------- |
| [部署运维文档](docs/部署运维文档.md)           | 环境配置、CI/CD、监控、灾难恢复 |
| [小白上手指南](docs/小白上手指南.md)           | 零基础本地启动与 Cloudflare 配置 |
| [前端功能文档](docs/前端功能与交互设计文档.md) | 页面结构、核心功能、交互规范    |
| [管理后台文档](docs/管理后台功能与设计文档.md) | 后台架构、功能设计、安全设计    |
| [OpenAPI 契约](openapi/nami-blog.yaml)           | Workers API 路径、字段和响应      |
| [变更记录](docs/变更记录.md)                  | 版本变更、迁移与验证结果          |
| [Git 工作规范](docs/Git工作规范.md)            | 分支模型、提交规范、PR 流程     |

## 参与贡献

欢迎贡献！请阅读以下指南：

1. Fork 本仓库并创建功能分支：`feature/your-feature`
2. 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 提交规范
3. 确保 `pnpm run lint`、`pnpm run typecheck`、`pnpm run test` 全部通过
4. 提交 Pull Request，描述变更内容和动机

详细规范请参阅 [Git 工作规范](docs/Git工作规范.md)。

## 许可

[MIT](LICENSE)
