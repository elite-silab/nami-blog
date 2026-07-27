<p align="center">
  <img src="apps/web/public/images/logo-icon.svg" width="80" alt="Nami" />
</p>

<h1 align="center">Nami 娜美博客</h1>

<p align="center">
  <strong>一个 Cloudflare Worker，即可拥有轻量、完整、内容实时生效的个人博客</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/Frontend-Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/API-Hono-E36002?logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/Database-D1-0052CC?logo=sqlite&logoColor=white" alt="D1" />
  <a href="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml"><img src="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 为什么选择 Nami？

- **只部署一个 Worker**：博客前台、管理后台、API 和静态资源共用一个地址与一份配置。
- **不需要购买服务器**：Next.js、Hono、D1 和 KV 全部运行在 Cloudflare。
- **发布内容立即可见**：文章和站点设置保存到 D1 后直接生效，不需要重新部署。
- **读取快且能自动降级**：KV 加速公开内容，不可用时自动回退到 D1。
- **写作体验完整**：Markdown 工具栏、草稿保护、快捷保存、分类标签和阅读统计已内置。
- **轻量易维护**：自动数据库迁移、网站备份恢复、完整测试和单 Worker 部署。

## 功能

- 文章、分类、标签、置顶、草稿、归档与公开状态管理
- Markdown 快捷工具、字数统计、预计阅读时间和未保存离开提醒
- 评论审核、自动批准、敏感词与基础反垃圾逻辑
- 友链、首页文案、安全 Markdown 关于页、社交链接与管理员密码修改
- 樱花、海洋、星空三套主题：后台设置默认风格，访客可在前台自由选择，并支持独立明暗模式
- 阅读量、搜索、RSS、Sitemap、SEO 和分享元数据
- 网站内容 JSON 备份导出与导入
- 响应式前台与移动端可用的管理后台

## 截图

### 博客首页

![Nami 博客首页](.github/screenshot-frontend.png)

### 管理后台

![Nami 管理后台](.github/screenshot-admin.png)

## 架构

```text
浏览器 ──────────────┐
                     ▼
               nami-blog Worker
               ├─ Next.js 博客前台 / 管理后台
               ├─ Hono API
               ├─ D1 文章 / 评论 / 站点设置
               └─ KV 公开内容缓存
```

唯一生产地址同时提供：

- 博客：`https://nami-blog.codeelite.workers.dev`
- 管理后台：`https://nami-blog.codeelite.workers.dev/admin/login`
- 健康检查：`https://nami-blog.codeelite.workers.dev/api/v1/healthz`
- API：同一域名下的 `/api/*`

## 技术栈

| 层级 | 技术 | 作用 |
|:---|:---|:---|
| 全栈 Worker | Cloudflare Workers + OpenNext | 单 Worker 运行完整应用 |
| 前端 | Next.js App Router + React + Tailwind CSS | 博客前台与管理后台 |
| API | Hono | 认证、内容、评论、设置与备份接口 |
| 数据 | Cloudflare D1 + KV | 持久数据与公开内容缓存 |
| 工程 | TypeScript + pnpm Workspace + Vitest | 类型、依赖与测试 |

## 快速部署

> 你只需要 GitHub 和 Cloudflare 账号。生产部署可以全部在网页中完成。

### 1. Fork 仓库

Fork 本仓库到你自己的 GitHub 账号。

### 2. 创建 D1 与 KV

在 Cloudflare 控制台创建：

| 资源 | 名称 | 复制内容 |
|---|---|---|
| D1 | `nami-blog` | Database ID |
| KV | `nami-blog-cache` | Namespace ID |

### 3. 编辑唯一配置

在 GitHub 网页打开根目录 `wrangler.jsonc`，点击铅笔按钮，修改：

- `database_id`：刚创建的 D1 ID；
- KV 的 `id`：刚创建的 KV ID。

此时还没有 Worker 地址，`NEXT_PUBLIC_SITE_URL` 暂时保持原样，第一次部署完成后再修改。

### 4. 创建唯一 Worker

进入 **Cloudflare → Workers & Pages → Create → Import from Git**，选择 Fork 后的仓库：

| 设置 | 值 |
|---|---|
| Project name | `nami-blog` |
| Production branch | `main` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `pnpm --filter @nami/web build:worker` |
| Deploy command | `pnpm --filter @nami/web deploy:worker` |
| Node.js | `22.12.0` 或更新的 22.x |

这里必须创建 **Worker**，不要选择 Pages，也不要填写 Build output directory。

### 5. 填写实际网站地址

第一次部署完成后，Cloudflare 会显示你的 `workers.dev` 地址。复制这个完整地址，再回 GitHub 编辑 `wrangler.jsonc`：

```json
"NEXT_PUBLIC_SITE_URL": "https://nami-blog.你的Workers子域.workers.dev"
```

提交后 Cloudflare 会自动重新部署。如果以后使用自己的域名，也要把这里改成自定义域名并重新部署一次。

### 6. 填写生产密钥

进入这个 Worker 的 **Settings → Variables and Secrets**，添加三个加密 Secret：

| 名称 | 内容 |
|---|---|
| `JWT_SECRET` | 密码管理器生成的随机长字符串 |
| `JWT_REFRESH_SECRET` | 另一个不同的随机长字符串 |
| `ADMIN_INITIAL_PASSWORD` | 管理后台初始密码 |

保存后重新部署一次。不要把这些生产密钥写入仓库。

### 7. 登录并发布文章

1. 打开 Worker 地址的 `/admin/login`。
2. 用户名使用 `admin`，密码使用刚设置的 `ADMIN_INITIAL_PASSWORD`。
3. 进入「文章管理」并创建文章。
4. 确认状态为“已发布”且已勾选“公开”。
5. 发布后返回前台，文章会立即显示，不需要重新部署。

完整网页步骤和常见问题见 [Cloudflare 部署指南](docs/Cloudflare部署指南.md)。

## 本地开发

```bash
git clone https://github.com/elite-silab/nami-blog.git
cd nami-blog
pnpm install && cp .env.example .env
pnpm dev
```

直接编辑根目录 `.env` 即可调整本地密码和站点地址。`pnpm dev` 会通过 `predev` 自动执行本地 D1 migration。

- 博客：`http://localhost:4322`
- 管理后台：`http://localhost:4322/admin/login`
- 健康检查：`http://localhost:4322/api/v1/healthz`
- API：同一地址下的 `/api/*`

## 项目结构

```text
wrangler.jsonc       # 唯一生产配置
apps/
├── api/             # Hono API、认证、备份与测试
└── web/             # Next.js App Router 前台与管理后台
packages/shared/     # TypeScript 共享类型与校验
migrations/          # D1 数据库迁移
docs/                # 使用、部署、运维与设计文档
```

## 安全

- 生产密码和 JWT 密钥只保存在 Cloudflare Secret 中。
- 真实 `.env` 已被 Git 忽略，仓库只提交 `.env.example`。
- 构建期间会隔离本地 `.env`，并检查 Worker 产物中是否出现本地密钥。
- 管理接口验证 JWT，登录令牌支持刷新、轮换和吊销。
- 网站备份不包含管理员密码、JWT、Cookie、IP 和日志。

## 文档

| 文档 | 说明 |
|:---|:---|
| [小白上手指南](docs/小白上手指南.md) | 本地运行、日常写作和常见问题 |
| [Cloudflare 部署指南](docs/Cloudflare部署指南.md) | 纯网页生产部署 |
| [部署运维文档](docs/部署运维文档.md) | 开发者构建、备份、回滚和排障 |
| [前端功能与交互设计](docs/前端功能与交互设计文档.md) | 前台功能、响应式与无障碍规范 |
| [管理后台功能与设计](docs/管理后台功能与设计文档.md) | 内容、评论、友链、设置与备份 |
| [数据库设计](docs/数据库设计文档.md) | D1 Schema、迁移与 KV 缓存边界 |
| [Git 工作规范](docs/Git工作规范.md) | 分支、提交、密钥和仓库维护 |
| [OpenAPI](openapi/nami-blog.yaml) | Hono API 接口契约 |

## 质量检查

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build:worker
```

## 协议

[MIT](LICENSE) — 欢迎使用、修改、Issue 和 Pull Request。
