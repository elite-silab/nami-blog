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
  <img src="https://img.shields.io/badge/Data-D1%20%2B%20KV-0052CC?logo=cloudflare&logoColor=white" alt="D1 and KV" />
  <a href="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml"><img src="https://github.com/elite-silab/nami-blog/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

<p align="center">
  <a href="https://nami-blog.codeelite.workers.dev">在线站点</a>
  ·
  <a href="docs/Cloudflare部署指南.md">部署指南</a>
  ·
  <a href="docs/小白上手指南.md">使用指南</a>
</p>

## 为什么选择 Nami？

- **只部署一个 Worker**：博客前台、管理后台、API 和静态资源共用一个地址。
- **不需要购买服务器**：Next.js、Hono、D1 和 KV 全部运行在 Cloudflare。
- **发布内容立即可见**：文章和站点设置保存到 D1 后直接生效，不需要重新部署。
- **新手配置更简单**：根目录只有一份 `wrangler.jsonc`，本地只使用一份 `.env`。
- **读取快且能自动降级**：KV 加速公开内容，不可用时自动回退到 D1。
- **完整的写作和管理体验**：Markdown 编辑、草稿保护、评论、友链、主题和网站备份都已内置。

## 功能

- 文章、分类、标签、置顶、草稿、归档与公开状态管理
- Markdown 快捷工具、字数统计、预计阅读时间和未保存离开提醒
- 评论审核、自动批准、敏感词与基础反垃圾逻辑
- 站长直接管理的友链，无多余审核和链接检查流程
- 樱花、海洋、星空三套主题与独立明暗模式
- 阅读量、搜索、RSS、Sitemap、SEO 和分享元数据
- 网站内容 JSON 备份导出与导入
- 响应式前台与移动端可用的管理后台

## 截图

| 博客首页 | 管理后台 |
|:---:|:---:|
| ![Nami 博客首页](.github/screenshot-frontend.png) | ![Nami 管理后台](.github/screenshot-admin.png) |

## 架构

```text
访客 / 站长
      │
      ▼
nami-blog Cloudflare Worker
├─ Next.js 博客前台 / 管理后台
├─ /api/* → Hono API
├─ Assets 静态资源
├─ D1 文章、评论与站点设置
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
| 全栈 Worker | Cloudflare Workers + OpenNext | 在一个 Worker 中运行完整应用 |
| 前端 | Next.js 16 + React 19 + Tailwind CSS 4 | 博客前台与管理后台 |
| API | Hono | 认证、内容、评论、设置与备份接口 |
| 数据 | Cloudflare D1 | 网站真实数据 |
| 缓存 | Cloudflare Workers KV | 公开内容加速 |
| 工程 | TypeScript + pnpm Workspace + Vitest | 类型、依赖与测试 |

## 快速部署

> 你只需要 GitHub 和 Cloudflare 账号。整个生产部署可以在网页中完成，不需要创建 Pages。

### 1. Fork 仓库并创建 D1

1. Fork 本仓库。
2. 打开 Cloudflare 的 **Storage & databases → D1 SQL database → Create**。
3. 数据库名称填写 `nami-blog`。
4. 创建完成后复制 **Database ID**。

KV 不需要手动创建，Wrangler 第一次部署时会自动配置。

### 2. 编辑唯一配置

在 GitHub 网页打开根目录 `wrangler.jsonc`，点击铅笔按钮：

- 将 `database_id` 替换为刚创建的 D1 Database ID。
- `name` 保持 `nami-blog`，不需要修改。
- `CACHE` 保持原样，不需要填写 KV ID。
- `NEXT_PUBLIC_SITE_URL` 第一次部署时先保持原样，拿到自己的网址后再修改。

Fork 用户在首次部署前，真正必须替换的只有 `database_id`。

### 3. 创建唯一 Worker

进入 **Cloudflare → Workers & Pages → Create → Import a repository**，选择 Fork 后的仓库：

| 设置 | 填写内容 |
|:---|:---|
| Project name | `nami-blog` |
| Production branch | `main` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `pnpm build:worker` |
| Deploy command | `pnpm db:migrate:prod && pnpm exec wrangler deploy --config wrangler.jsonc` |
| Node.js | `22` 或更新的 22.x |

这里必须创建 **Worker**，不要选择 Pages，也不需要填写 Build output directory。

Worker 名称保持 `nami-blog` 时，默认地址通常是：

```text
https://nami-blog.你的Workers子域.workers.dev
```

### 4. 填写生产密钥

进入 Worker 的 **Settings → Variables and Secrets**，添加三个加密 Secret：

| 名称 | 内容 |
|:---|:---|
| `ADMIN_INITIAL_PASSWORD` | 管理后台首次登录密码 |
| `JWT_SECRET` | 密码管理器生成的随机长字符串 |
| `JWT_REFRESH_SECRET` | 另一个不同的随机长字符串 |

不要把这三个值写入 `wrangler.jsonc`、`.env.example` 或 GitHub。

### 5. 确认网址并首次登录

1. 第一次部署后，复制 Cloudflare 显示的完整 `workers.dev` 地址。
2. 将 `NEXT_PUBLIC_SITE_URL` 改为这个地址并提交一次。
3. 打开“站点地址 + `/admin/login`”。
4. 用户名使用 `admin`，密码使用 `ADMIN_INITIAL_PASSWORD`。
5. 登录后在 **站点设置 → 修改密码** 中换成新密码。

绑定自己的域名后，记得将 `NEXT_PUBLIC_SITE_URL` 改为该自定义域名并重新部署一次。

完整网页步骤和常见问题见 [Cloudflare 部署指南](docs/Cloudflare部署指南.md)。

## 本地开发

需要 Node.js 22+ 和 pnpm 9+。

```bash
git clone https://github.com/elite-silab/nami-blog.git
cd nami-blog
pnpm install && cp .env.example .env
pnpm dev
```

直接用编辑器打开根目录 `.env`，即可修改本地密码。不需要 `.dev.vars`，也不需要用 `echo` 命令写配置。

`pnpm dev` 会自动执行本地 D1 迁移。启动后访问：

- 博客：`http://localhost:4322`
- 管理后台：`http://localhost:4322/admin/login`
- 用户名：`admin`
- 初始密码：根目录 `.env` 中的 `ADMIN_INITIAL_PASSWORD`
- 健康检查：`http://localhost:4322/api/v1/healthz`

## 哪些修改需要重新部署？

不需要重新部署：

- 文章、分类、标签、评论和友链
- 网站名称、副标题、SEO 文案、主题和评论设置
- 网站备份导入

需要重新部署：

- 修改项目代码或依赖
- 修改 D1、KV 或静态资源绑定
- 更换 `NEXT_PUBLIC_SITE_URL`
- 绑定新域名后更新 SEO 正式地址

## 项目结构

```text
wrangler.jsonc       # 唯一 Cloudflare Worker 配置
.env.example         # 唯一本地配置模板
apps/
├── api/             # Hono API、认证、备份与测试
└── web/             # Next.js App Router 前台与管理后台
packages/shared/     # 共享类型与校验
migrations/          # D1 数据库迁移
docs/                # 使用、部署、运维与设计文档
openapi/             # API 接口说明
```

## 安全

- 生产密码和 JWT 密钥只保存在 Cloudflare Secret 中。
- 真实 `.env` 已被 Git 忽略，仓库只提交 `.env.example`。
- 构建期间会隔离本地 `.env`，并检查 Worker 产物中是否出现本地密钥。
- 管理接口验证 JWT，登录令牌支持刷新、轮换和吊销。
- 网站备份不包含管理员密码、JWT、Cookie、IP 和日志。
- 导入备份会替换当前内容，操作前应先导出一份当前备份。

## 文档

| 文档 | 说明 |
|:---|:---|
| [小白上手指南](docs/小白上手指南.md) | 本地运行、日常写作和常见问题 |
| [Cloudflare 部署指南](docs/Cloudflare部署指南.md) | 从 Fork 到首次登录的网页步骤 |
| [部署运维文档](docs/部署运维文档.md) | 构建、迁移、备份、回滚与排障 |
| [前端功能与交互设计](docs/前端功能与交互设计文档.md) | 前台功能、响应式与无障碍规范 |
| [管理后台功能与设计](docs/管理后台功能与设计文档.md) | 内容、评论、友链、设置与备份 |
| [数据库设计](docs/数据库设计文档.md) | D1 表、索引、迁移与 KV 缓存边界 |
| [Git 工作规范](docs/Git工作规范.md) | 分支、提交、密钥和仓库维护 |
| [OpenAPI](openapi/nami-blog.yaml) | Hono API 接口契约 |

## 质量检查

```bash
pnpm check
pnpm test
pnpm build:worker
pnpm exec wrangler deploy --dry-run --config wrangler.jsonc
```

## 协议

[MIT](LICENSE) — 欢迎使用、修改、Issue 和 Pull Request。
