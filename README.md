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

<p align="center">
  <a href="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml"><img src="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/elite-silab/nami-blog/actions/workflows/deploy.yml"><img src="https://github.com/elite-silab/nami-blog/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="https://github.com/elite-silab/nami-blog/blob/main/LICENSE"><img src="https://img.shields.io/github/license/elite-silab/nami-blog" alt="License"></a>
</p>

## ✨ 特色

|                        |                                                          |
| ---------------------- | -------------------------------------------------------- |
| 🌸 **三套二次元主题**  | 樱花 / 海洋 / 星空，管理后台一键切换，独立 Dark 模式     |
| ⚡ **边缘渲染**        | Astro SSG 静态生成 + Cloudflare CDN 全球分发，毫秒级响应 |
| 💬 **自建评论系统**    | 嵌套回复、敏感词过滤、管理员审核，无第三方依赖           |
| 🔐 **可轮换 JWT 会话** | HttpOnly Cookie + 标签页令牌回退                         |
| 📱 **响应式交互**      | 阅读进度条、TOC 目录、代码块复制、移动端汉堡菜单         |
| 📡 **RSS + SEO**       | RSS 订阅、Open Graph、Twitter Card、JSON-LD 结构化数据   |
| 🩺 **健康检查**        | `/healthz` 端点、统一错误响应、公开 API 缓存策略         |

## 📸 截图

| 前台首页                                 | 管理后台                              |
| ---------------------------------------- | ------------------------------------- |
| ![前台](.github/screenshot-frontend.png) | ![后台](.github/screenshot-admin.png) |

## 🛠 技术栈

| 层级     | 技术                      | 说明                                         |
| -------- | ------------------------- | -------------------------------------------- |
| 前端     | **Astro 5**               | Static 模式 (SSG)，构建时预渲染              |
| API      | **Cloudflare Workers**    | Hono 框架，RESTful API                       |
| 数据库   | **Cloudflare D1**         | SQLite 兼容，边缘分布式                      |
| 样式     | **Tailwind CSS 4**        | CSS-first 配置，CSS 变量主题                 |
| 认证     | **JWT** (jose + bcryptjs) | HttpOnly Cookie + Bearer Header              |
| Monorepo | **pnpm workspace**        | `apps/api` + `apps/web` + `packages/shared`  |
| 测试     | **Vitest**                | 63 个测试用例，含 Workers 集成测试           |
| CI/CD    | **GitHub Actions**        | 自动 lint / test / build / 部署到 Cloudflare |

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
├── .github/
│   └── workflows/                # CI/CD GitHub Actions
├── docs/                         # 项目文档
└── pnpm-workspace.yaml           # Monorepo workspace
```

## ☁️ 部署到 Cloudflare（零域名 · 纯免费）

**不需要域名、不需要花钱**，Cloudflare 免费提供 `.workers.dev` 和 `.pages.dev` 子域名。

### 第一步：Fork 仓库

打开 https://github.com/elite-silab/nami-blog ，点击右上角 **Fork** 按钮。

### 第二步：创建 D1 数据库

在本地终端执行：

```bash
npm install -g wrangler
wrangler login    # 浏览器弹出授权页面，点 Allow
wrangler d1 create nami-blog
```

输出中会显示 `database_id = "xxxx-xxxx-xxxx"` ，**复制这个 ID**。

### 第三步：填写 database_id 并提交

在你 Fork 的仓库中，编辑 `apps/api/wrangler.toml`，把这行：

```toml
database_id = "<replace-with-production-d1-id>"
```

替换为你复制的 ID，然后 commit。

### 第四步：执行数据库迁移

```bash
wrangler d1 migrations apply nami-blog --remote --config apps/api/wrangler.toml
```

### 第五步：部署 API

```bash
cd apps/api && wrangler deploy
```

记下 API 地址：`https://nami-blog-api.你的用户名.workers.dev`

### 第六步：设置 API 密钥

打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → `nami-blog-api` → **Settings** → **Variables and Secrets**

添加两个 **Secret**：

| Name | Value |
|---|---|
| `JWT_SECRET` | 运行 `openssl rand -hex 32` 生成 |
| `JWT_REFRESH_SECRET` | 再运行一次 `openssl rand -hex 32` 生成 |

添加一个 **Plaintext** 变量：

| Name | Value |
|---|---|
| `CORS_ORIGIN` | `https://nami-blog.pages.dev` |

### 第七步：创建管理员账号

```bash
cd ../.. && pnpm db:seed -- --remote
```

### 第八步：Connect to Git 部署前端

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择你 Fork 的 `nami-blog` 仓库
3. 填写配置：

| 配置项 | 值 |
|---|---|
| Project name | `nami-blog` |
| Production branch | `main` |
| Build command | `pnpm --filter @nami/web build` |
| Build output directory | `apps/web/dist` |

4. 点击 **Environment variables**，添加：

| 变量 | 值 |
|---|---|
| `PUBLIC_API_URL` | `https://nami-blog-api.你的用户名.workers.dev` |
| `SITE_URL` | `https://nami-blog.pages.dev` |

5. 点击 **Save and Deploy** ☕

### 第九步：验证 ✅

部署完成后打开 `https://nami-blog.pages.dev` 看到博客首页，再打开 `/admin/login` 用密码登录后台。

**以后每次 push 到 `main`，Cloudflare Pages 会自动重新构建和部署！**

---

## 🔄 CI/CD

本项目内置 GitHub Actions CI（`.github/workflows/ci.yml`），每次 push 或 PR 自动运行：

**Lint → TypeCheck → Test → Build**

> CI 只负责检查代码质量，部署由 Cloudflare Pages 的 Connect to Git 自动完成。

## 🎨 主题系统

三套二次元风格主题 + 独立 Dark 模式，通过 CSS 变量实现，管理后台可视化切换：

| 主题           | 风格             | 主色调    |
| -------------- | ---------------- | --------- |
| 🌸 樱花 Sakura | 温柔浪漫，粉色系 | `#ec4899` |
| 🌊 海洋 Ocean  | 清凉通透，蓝绿色 | `#0891b2` |
| ✨ 星空 Starry | 深邃宇宙，紫蓝色 | `#8b5cf6` |

每套主题支持明/暗两种模式，`data-theme` + `data-dark` 属性独立控制，任意组合。

## 📖 文档

| 文档                                           | 说明                  |
| ---------------------------------------------- | --------------------- |
| [部署运维文档](docs/部署运维文档.md)           | CI/CD、监控、灾难恢复 |
| [小白上手指南](docs/小白上手指南.md)           | 零基础本地启动指南    |
| [前端功能文档](docs/前端功能与交互设计文档.md) | 页面结构、交互规范    |
| [管理后台文档](docs/管理后台功能与设计文档.md) | 后台架构、安全设计    |
| [OpenAPI 契约](openapi/nami-blog.yaml)         | API 路径、字段和响应  |
| [Git 工作规范](docs/Git工作规范.md)            | 分支模型、提交规范    |

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
