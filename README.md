<p align="center">
  <img src="apps/web/public/images/logo.svg" width="80" alt="Nami Blog" />
</p>

<h1 align="center">Nami 娜美博客</h1>

<p align="center">
  <strong>Cloudflare 原生 · 零服务器成本 · 二次元风格个人博客系统</strong>
</p>

<p align="center">
  <a href="#-快速开始">快速开始</a> •
  <a href="#-截图">截图</a> •
  <a href="#-主题系统">主题</a> •
  <a href="https://github.com/elite-silab/nami-blog/wiki">文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Astro%205-BC52EE?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/API-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white" alt="Workers" />
  <img src="https://img.shields.io/badge/Database-D1-0052CC?logo=sqlite&logoColor=white" alt="D1" />
  <img src="https://img.shields.io/badge/Style-Tailwind%204-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Test-87%20passed-brightgreen?logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## ✨ 为什么选择 Nami Blog？

| 特性 | Nami Blog | WordPress | Ghost | Hexo / Hugo |
|:---|:---:|:---:|:---:|:---:|
| **需要服务器** | ❌ 不需要 | ✅ 需要 | ✅ 需要 | ❌ 不需要 |
| **运行成本** | $0（CF 免费版） | VPS 费用 | VPS / $9+ | $0 |
| **全球 CDN 加速** | ✅ 边缘节点 | ❌ 需配置 | ❌ 需配置 | 取决于托管 |
| **管理后台** | ✅ 内置 | ✅ 内置 | ✅ 内置 | ❌ 无 |
| **评论系统** | ✅ 自建 | 插件 | 付费 | 第三方 |
| **主题系统** | 3 套 + Dark 模式 | 海量主题 | 少量主题 | 海量主题 |
| **SEO / RSS** | ✅ 内置 | 插件 | ✅ 内置 | ✅ 内置 |
| **数据库** | D1（全球分布） | MySQL | MySQL/SQLite | 无 |

> **核心差异**：传统博客要么需要 VPS（WordPress/Ghost），要么没有管理后台（Hexo/Hugo）。Nami Blog 的控制面完全运行在 Cloudflare 边缘网络上——D1 数据库、Workers API、Pages 前端——全部免费，自带完整管理后台。

## 🚀 特性一览

- 🌸 **三套二次元主题** — 樱花 / 海洋 / 星空，管理后台一键切换，独立 Dark 模式
- ⚡ **边缘渲染** — Astro SSG 静态生成 + Cloudflare CDN 全球分发，毫秒级响应
- 💬 **自建评论系统** — 嵌套回复、敏感词过滤、管理员审核，无第三方依赖
- 🔐 **可轮换 JWT 会话** — HttpOnly Cookie + 标签页令牌回退
- 📱 **响应式交互** — 阅读进度条、TOC 目录、代码块复制、移动端汉堡菜单
- 📡 **RSS + SEO** — RSS 订阅、Open Graph、Twitter Card、JSON-LD 结构化数据
- 🩺 **健康检查** — `/healthz` 端点、统一错误响应、公开 API 缓存策略
- ☁️ **Cloudflare 原生** — Workers + D1 + Pages，零服务器运维，全球边缘加速

## 📸 截图

| 前台首页 | 管理后台 |
|:---:|:---:|
| ![](.github/screenshot-frontend.png) | ![](.github/screenshot-admin.png) |

## 🏗️ 架构

```text
                        ┌──────────────────────────┐
 浏览器 ── Pages ──────▶│ Cloudflare Worker / Hono │
                        │ 鉴权 · 文章 · 评论 · API │
                        └────────────┬─────────────┘
                                     │
                              ┌──────┴──────┐
                              │     D1      │
                              └─────────────┘
                                     ▲
                                     │
                        Astro SSG 静态生成
                        构建时预渲染全部页面
```

- **控制面**（Cloudflare）：Workers 处理 API、D1 存数据、Pages 托管前端
- **前端**（Astro SSG）：构建时预渲染为静态 HTML，Pages CDN 全球分发

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端 | **Astro 5** | Static 模式（SSG），构建时预渲染 |
| API | **Cloudflare Workers** | Hono 框架，RESTful API |
| 数据库 | **Cloudflare D1** | SQLite 兼容，边缘分布式 |
| 样式 | **Tailwind CSS 4** | CSS-first 配置，CSS 变量主题 |
| 认证 | **JWT** (jose + bcryptjs) | HttpOnly Cookie + Bearer Header |
| Monorepo | **pnpm workspace** | `apps/api` + `apps/web` + `packages/shared` |
| 测试 | **Vitest** | 87 个测试用例，含 Workers 集成测试 |

## 🚀 快速开始

> **你需要**：一个 Cloudflare 账号（免费）。不需要域名，Cloudflare 会给你免费的 `workers.dev` 和 `pages.dev` 地址。

### 第一步：Fork 仓库

打开本仓库 → 右上角 **Fork** → **Create fork**

### 第二步：创建 D1 数据库

Cloudflare 控制台 → **Storage & Databases** → **D1** → **Create database**

- 名称：`nami-blog`
- 创建后复制 **Database ID**

### 第三步：编辑配置

GitHub 打开 `apps/api/wrangler.toml` → 点铅笔 ✏️ → 改两处：

```toml
# 粘贴第二步复制的 Database ID
database_id = "xxxx-xxxx-xxxx-xxxx"

# CORS_ORIGIN 改为你的 Pages 地址（第六步创建后会知道，先填占位符）
CORS_ORIGIN = "https://nami-blog.你的用户名.pages.dev"
```

点 **Commit changes** 保存。

### 第四步：部署 API（Worker）

Workers & Pages → Create → **Import from Git** → 选你 Fork 的仓库，填写：

| 配置项 | 值 |
|---|---|
| Project name | `nami-blog-api` |
| Build command | `pnpm --filter @nami/shared build` |
| Deploy command | `pnpm --filter @nami/api deploy:full` |
| Node version | `22` |

点 **Save and Deploy**，部署成功后复制 Worker 地址（如 `https://nami-blog-api.xxx.workers.dev`）。

然后进入 Worker **Settings → Variables and Secrets**，添加 2 个 Secret：

| 变量 | 值 |
|---|---|
| `JWT_SECRET` | 随机长字符串（`openssl rand -hex 32`） |
| `JWT_REFRESH_SECRET` | 另一个随机长字符串 |

保存后再 Deploy 一次 ☕

### 第五步：部署前端（Pages）

Workers & Pages → Create → **Pages** → **Connect to Git** → 选你 Fork 的仓库，填写：

| 配置项 | 值 |
|---|---|
| Project name | `nami-blog` |
| Build command | `pnpm --filter @nami/shared build && pnpm --filter @nami/web build` |
| Build output directory | `apps/web/dist` |

Environment variables 添加：

| 变量 | 值 |
|---|---|
| `PUBLIC_API_URL` | `https://nami-blog-api.xxx.workers.dev`（第四步的地址） |
| `SITE_URL` | `https://nami-blog.你的用户名.pages.dev` |

点 **Save and Deploy** ☕

### 第六步：回填 CORS 地址

回 GitHub 再编辑 `wrangler.toml`，把 `CORS_ORIGIN` 改为 Pages 的实际地址：

```toml
CORS_ORIGIN = "https://nami-blog.你的用户名.pages.dev"
```

Commit 后自动重新部署。

### 第七步：登录

打开 `https://nami-blog.你的用户名.pages.dev/admin/login`

- 用户名：`admin`
- 密码：`nami-local-admin`（默认密码，登录后立即修改！）

### ✅ 完成

以后每次 push 到 `main`，API 和前端都会自动重新部署！

## 🎨 主题系统

三套二次元风格主题 + 独立 Dark 模式，CSS 变量实现，管理后台可视化切换：

| 主题 | 风格 | 主色调 |
|---|---|---|
| 🌸 樱花 Sakura | 温柔浪漫，粉色系 | `#ec4899` |
| 🌊 海洋 Ocean | 清凉通透，蓝绿色 | `#0891b2` |
| ✨ 星空 Starry | 深邃宇宙，紫蓝色 | `#8b5cf6` |

每套主题支持明/暗两种模式，`data-theme` + `data-dark` 属性独立控制，任意组合。

## 💻 本地开发

```bash
git clone https://github.com/你的用户名/nami-blog.git
cd nami-blog
pnpm install
cp .env.example .env

pnpm dev
# → API:  http://localhost:8788
# → Web:  http://localhost:4321
```

常用命令：

```bash
pnpm dev              # 启动 API + Web
pnpm build            # 构建
pnpm test             # 运行测试 (87 tests)
pnpm typecheck        # 类型检查
pnpm lint             # ESLint
pnpm db:migrate       # 本地 D1 迁移
pnpm db:seed          # 创建管理员
pnpm db:reset         # 重置本地数据库
```

## 🏗 项目结构

```
nami-blog/
├── apps/
│   ├── api/                      # Cloudflare Workers API (Hono + D1)
│   │   ├── src/
│   │   │   ├── index.ts          # Hono 入口
│   │   │   ├── routes/           # API 路由
│   │   │   ├── middleware/       # 鉴权中间件
│   │   │   ├── lib/              # auth.ts, pagination.ts
│   │   │   └── __tests__/        # 测试
│   │   └── wrangler.toml         # Workers 配置
│   └── web/                      # Astro SSG 前端
│       ├── src/
│       │   ├── pages/            # 页面
│       │   ├── components/       # 组件
│       │   ├── layouts/          # 布局
│       │   ├── lib/              # 工具函数
│       │   └── styles/           # CSS 变量主题
│       └── astro.config.mjs
├── packages/
│   └── shared/                   # @nami/shared (Zod schemas)
├── migrations/                   # D1 迁移 SQL
├── .github/workflows/            # CI
└── docs/                         # 文档
```

## 📖 文档

| 文档 | 说明 |
|---|---|
| [部署运维文档](docs/部署运维文档.md) | CI/CD、监控、灾难恢复 |
| [小白上手指南](docs/小白上手指南.md) | 零基础本地启动指南 |
| [前端功能文档](docs/前端功能与交互设计文档.md) | 页面结构、交互规范 |
| [管理后台文档](docs/管理后台功能与设计文档.md) | 后台架构、安全设计 |
| [Git 工作规范](docs/Git工作规范.md) | 分支模型、提交规范 |

## 🔄 CI/CD

GitHub Actions 每次 push/PR 自动运行：**Lint → TypeCheck → Test → Build**

部署由 Cloudflare Git 集成自动完成，无需额外配置。

## 🤝 参与贡献

1. Fork → 创建功能分支 `nami-feat/your-feature`
2. 遵循 [Conventional Commits](https://www.conventionalcommits.org/)
3. 确保 `pnpm lint` + `pnpm typecheck` + `pnpm test` 全部通过
4. 提交 PR

## 📜 许可

[MIT](LICENSE)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=elite-silab/nami-blog&type=Date)](https://star-history.com/#elite-silab/nami-blog&Date)
