# Nami Blog

一个运行在单个 Cloudflare Worker 上的轻量个人博客。前台、管理后台和 API 使用同一个域名；D1 保存真实数据，Workers KV 加速公开读取。

生产站点：[https://nami-blog.codeelite.workers.dev](https://nami-blog.codeelite.workers.dev)
开源仓库：[elite-silab/nami-blog](https://github.com/elite-silab/nami-blog)

## 特点

- Next.js 16 App Router，支持服务端渲染与优秀的开源生态
- OpenNext for Cloudflare，整个项目只部署为一个 Worker
- Hono API 与 Web 同源，无需配置 CORS、Pages 或 Deploy Hook
- Cloudflare D1 保存文章、分类、标签、评论、友链和站点设置
- Workers KV 缓存公开文章与站点元数据，异常时自动回退 D1
- 完整管理后台：Markdown 写作、草稿保护、主题、评论和备份
- 文章发布、修改设置后实时生效，无需重新部署
- RSS、Sitemap、SEO 元数据、阅读统计和响应式界面
- 本地只使用根目录 `.env`，不再维护 `.dev.vars` 或多个环境文件

## 架构

```text
浏览器
  └─ https://nami-blog.codeelite.workers.dev
       └─ 一个 Cloudflare Worker
            ├─ Next.js 前台与管理后台
            ├─ /api/* → Hono API
            ├─ 静态资源
            ├─ Cloudflare D1（真实数据）
            └─ Workers KV（公开读缓存）
```

| 部分 | 技术 |
| --- | --- |
| Web | Next.js 16、React 19、Tailwind CSS 4 |
| API | Hono |
| 数据库 | Cloudflare D1（SQLite） |
| 公开缓存 | Cloudflare Workers KV |
| Cloudflare 适配 | OpenNext for Cloudflare |
| 包管理 | pnpm Workspace |

## 本地开发

需要 Node.js 22+ 和 pnpm 9+。

```bash
git clone https://github.com/elite-silab/nami-blog.git && cd nami-blog
pnpm install && cp .env.example .env
pnpm dev
```

然后访问：

- 博客：`http://localhost:4322`
- 管理后台：`http://localhost:4322/admin/login`
- 用户名：`admin`
- 初始密码：根目录 `.env` 中的 `ADMIN_INITIAL_PASSWORD`
- API 健康检查：`http://localhost:4322/api/v1/healthz`

第一次执行 `pnpm dev` 会自动应用本地 D1 迁移。想修改密码或本地密钥时，直接用编辑器打开根目录 `.env`；不需要创建 `.dev.vars`，也不需要执行 `echo` 命令。

> `.env` 只用于本机，已被 Git 忽略。不要把真实生产密码或密钥写进 `.env.example`、`wrangler.jsonc` 或提交到 GitHub。

常用命令：

```bash
pnpm check          # 类型检查和代码规范
pnpm test           # 完整测试
pnpm build:worker   # 生成单 Worker 产物
pnpm preview        # 本地预览 Worker 产物
pnpm deploy         # 迁移远程 D1 并部署
```

## 部署到 Cloudflare

这里只需要一个 Worker 和一个 D1，不需要创建 Cloudflare Pages。根配置中的 `CACHE` KV 会在部署时由 Wrangler 自动配置，不需要复制 KV ID 或执行额外命令。

### 1. Fork 仓库并创建 D1

在 Cloudflare Dashboard 打开 **Storage & databases → D1 SQL database → Create**，数据库名称填写 `nami-blog`。创建完成后复制 Database ID。

在自己 Fork 的 GitHub 仓库中直接编辑根目录 `wrangler.jsonc`：

- `name`：你的 Worker 名称
- `database_id`：刚复制的 D1 Database ID
- `NEXT_PUBLIC_SITE_URL`：第一次可以暂时保留，拿到实际地址后再修改

`database_id`、Worker 名称和公开网址都不是密码，可以提交到公开仓库。JWT 密钥和管理员密码绝不能写在这个文件中。

`kv_namespaces` 中只保留名为 `CACHE` 的绑定即可。Wrangler 会按 Worker 名称自动配置缓存空间，新手不需要到 KV 页面手动创建。

### 2. 从 Git 连接一个 Worker

在 Cloudflare Dashboard 打开 **Workers & Pages → Create → Import a repository**，选择 Fork 后的仓库。

构建设置：

| 项目 | 填写内容 |
| --- | --- |
| Root directory | 留空（仓库根目录） |
| Build command | `pnpm build:worker` |
| Deploy command | `pnpm db:migrate:prod && pnpm exec wrangler deploy --config wrangler.jsonc` |

如果界面要求 Node 版本，填写 `22`。项目不使用 Build output directory；那个输入框属于 Pages 静态站点流程。

### 3. 添加生产 Secret

在 Worker 的 **Settings → Variables and Secrets** 中新增三个 Secret：

| 名称 | 用途 |
| --- | --- |
| `ADMIN_INITIAL_PASSWORD` | 空数据库首次登录密码 |
| `JWT_SECRET` | 登录访问令牌签名 |
| `JWT_REFRESH_SECRET` | 刷新令牌签名 |

三者使用不同的长随机字符串。Secret 只保存在 Cloudflare，不写入 GitHub。

### 4. 确认正式地址

第一次部署后，复制 Cloudflare 实际显示的 Worker 地址。官方实例使用：

```text
https://nami-blog.codeelite.workers.dev
```

把根目录 `wrangler.jsonc` 中的 `NEXT_PUBLIC_SITE_URL` 改成自己的实际地址，提交后让 Cloudflare 再部署一次。这个公开变量用于 canonical、RSS、Sitemap 和分享链接。

如果绑定自己的域名，例如 `https://blog.example.com`，请把 `NEXT_PUBLIC_SITE_URL` 改为该自定义域名并重新部署。不要带 `/admin` 等路径，末尾不要加 `/`。

完整截图式步骤见 [Cloudflare 部署指南](docs/Cloudflare部署指南.md)。

## 第一次登录

访问“正式站点地址 + `/admin/login`”，例如：

```text
https://nami-blog.codeelite.workers.dev/admin/login
```

用户名为 `admin`，密码为 Cloudflare Secret `ADMIN_INITIAL_PASSWORD`。空数据库首次成功登录时会自动创建管理员；随后建议在后台 **站点设置 → 修改密码** 中换成自己的密码。

## 内容与配置什么时候生效

- 发布、修改或删除文章：保存成功后自动清理公开缓存，不需要重新部署
- 分类、标签和友链：保存成功后自动清理公开缓存
- 网站名称、SEO、主题和评论开关：保存成功后自动清理公开缓存
- 修改 `NEXT_PUBLIC_SITE_URL`、代码或 Worker 绑定：需要重新部署

文章和站点设置始终以 D1 为准，不需要为了内容变化重新构建网站。KV 在全球采用最终一致同步，通常会立即更新；极少数地区可能短时间读到旧缓存，最迟会在缓存到期后恢复。

## 自定义域名

在 Worker 的 **Settings → Domains & Routes → Add → Custom Domain** 绑定域名，然后：

1. 将 `wrangler.jsonc` 的 `NEXT_PUBLIC_SITE_URL` 改为新域名；
2. 提交修改并等待一次部署；
3. 检查 `/robots.txt`、`/sitemap.xml` 和 `/rss.xml` 中的域名。

旧 `workers.dev` 地址仍可访问，但 SEO 标准地址会以自定义域名为准。

## 项目结构

```text
.
├── apps/
│   ├── api/                 # Hono API、认证、测试、数据库脚本
│   └── web/                 # Next.js App Router 与管理后台
├── migrations/              # D1 数据库迁移
├── packages/shared/         # 共享校验与类型
├── docs/                    # 使用、部署、运维和设计文档
├── openapi/                 # OpenAPI 接口说明
├── .env.example             # 本地配置模板
└── wrangler.jsonc           # 唯一 Cloudflare Worker 配置
```

## 文档

- [小白上手指南](docs/小白上手指南.md)
- [Cloudflare 部署指南](docs/Cloudflare部署指南.md)
- [部署运维文档](docs/部署运维文档.md)
- [管理后台功能与设计](docs/管理后台功能与设计文档.md)
- [前端功能与交互设计](docs/前端功能与交互设计文档.md)
- [数据库设计](docs/数据库设计文档.md)
- [Git 工作规范](docs/Git工作规范.md)
- [OpenAPI](openapi/nami-blog.yaml)
- [单 Worker 架构决策](docs/adr/0002-adopt-nextjs-single-worker.md)
- [KV 公开缓存架构决策](docs/adr/0003-use-kv-public-read-cache.md)

## 安全提醒

- 公开仓库中只提交 `.env.example`，绝不提交 `.env`
- Secret 只填写在 Cloudflare Dashboard
- 不要在 Issue、日志或截图中公开密码、JWT 密钥和 Cookie
- 导入备份会替换网站内容，操作前先导出一份当前备份
- 上线前执行 `pnpm check && pnpm test && pnpm build:worker`

## License

MIT
