# Cloudflare 部署指南（零域名 · 纯网页操作）

这份指南面向第一次使用 Cloudflare 的用户。部署过程通过 GitHub 和 Cloudflare Dashboard 完成，不要求安装 Wrangler，也不要求在终端生成密钥或初始化管理员。

部署后会得到两个免费地址：

| 服务 | 地址示例 |
| ---- | -------- |
| API | `https://nami-blog-api.<账号子域>.workers.dev` |
| 前端 | `https://nami-blog.pages.dev` |

> 地址以 Cloudflare 部署完成页面实际显示的值为准。Pages 默认地址是“项目名 + `.pages.dev`”，不要自行拼接 GitHub 或 Cloudflare 用户名。

## 准备工作

1. 注册 [GitHub](https://github.com/) 和 [Cloudflare](https://dash.cloudflare.com/sign-up) 免费账号。
2. 在 GitHub 打开本项目，点击右上角 **Fork → Create fork**。
3. 后续编辑配置时都在自己的 Fork 中操作，不要把任何真实 Secret 写入仓库。

## 第一步：创建 D1 数据库

1. 打开 Cloudflare Dashboard。
2. 进入 **Storage & Databases → D1 → Create database**。
3. 数据库名称填写 `nami-blog`。
4. 创建完成后复制 **Database ID**。

## 第二步：填写数据库配置

在 GitHub 打开 `apps/api/wrangler.toml`，点击铅笔按钮编辑：

```toml
database_id = "粘贴你的 Database ID"
```

此时还不知道最终的前端地址，`CORS_ORIGIN` 先不用改，第六步再回填。点击 **Commit changes** 保存。

## 第三步：连接并部署 Workers API

1. Cloudflare Dashboard 进入 **Workers & Pages → Create → Import from Git**。
2. 授权 GitHub，并选择刚才 Fork 的仓库。
3. 填写以下构建配置：

| 配置项 | 值 |
| ------ | -- |
| Project name | `nami-blog-api` |
| Build command | `pnpm --filter @nami/api build` |
| Deploy command | `pnpm --filter @nami/api deploy:full` |
| Node version | `22` |

点击 **Save and Deploy**。`deploy:full` 会先应用远程 D1 migration，再部署 Worker。成功后复制 Cloudflare 显示的完整 Worker 地址。

## 第四步：设置 Workers Secrets

进入 `nami-blog-api` 的 **Settings → Variables and Secrets**，添加：

| 类型 | 名称 | 填写内容 |
| ---- | ---- | -------- |
| Secret | `JWT_SECRET` | 密码管理器生成的随机长字符串 |
| Secret | `JWT_REFRESH_SECRET` | 另一个不同的随机长字符串 |
| Secret | `ADMIN_INITIAL_PASSWORD` | 自己设置的一次性管理员密码，至少 12 个字符 |

注意：

- 三个值不能相同，也不要写进 GitHub、聊天或截图。
- 生产环境不能使用本地模板密码 `nami-local-admin`。
- 保存后在 Deployments 页面重新部署一次，让 Secrets 生效。

## 第五步：连接并部署 Pages 前端

1. Cloudflare Dashboard 进入 **Workers & Pages → Create → Pages → Connect to Git**。
2. 选择同一个 GitHub 仓库。
3. 填写：

| 配置项 | 值 |
| ------ | -- |
| Project name | `nami-blog` |
| Build command | `pnpm --filter @nami/web build` |
| Build output directory | `apps/web/dist` |

> 如果你只看到 **Deploy command**，没有 **Build output directory**，说明当前是 Workers 导入 Git 页面。返回创建入口，选择 **Pages → Connect to Git**。如果看到上传文件区域，则进入了 Direct Upload，也需要返回选择 Git 集成。

首次部署只添加一个 Pages 环境变量：

| 名称 | 值 |
| ---- | -- |
| `PUBLIC_API_URL` | 第三步复制的完整 Worker 地址 |

此时还没有最终 Pages 地址，`SITE_URL` 先留空。Pages 中也不要填写 JWT 或管理员密码。点击 **Save and Deploy**，完成后复制 Cloudflare 实际显示的 Pages 地址。

## 第六步：回填正式前端地址

第一次部署成功后，先确定访客以后真正使用的前端地址：

- 使用 Cloudflare 免费域名：复制 Cloudflare 实际显示的 Pages 地址，例如 `https://nami-blog.pages.dev`。
- 已绑定自己的前端域名：使用实际对外访问的正式域名，例如 `https://blog.example.com`，不再使用 `.pages.dev` 地址。

选好后必须完成：

1. 在 Pages **Settings → Environment variables** 新增 `SITE_URL`，填写上面确定的完整前端地址，然后重新部署 Pages。
2. 在 GitHub 编辑 `apps/api/wrangler.toml`，将 `CORS_ORIGIN` 改成同一个前端地址并提交。
3. Workers Git 集成自动重新部署后，再开始登录测试。

使用默认域名时，两处都填 `https://你的项目.pages.dev`；使用自定义域名时，两处都填 `https://blog.example.com`。地址不要带 `/admin` 等页面路径，也不要在末尾加 `/`。

`SITE_URL` 用于生成 SEO 标准链接、Sitemap、RSS 和分享链接；`CORS_ORIGIN` 用于允许该前端访问 API。第一次 Pages 部署只是为了获得真实地址；第二次部署才会使正式的 `SITE_URL` 生效。

## 第七步：开启后台内容自动更新

Pages 已经部署完成，现在创建一个专门用于内容更新的 Deploy Hook：

1. 进入 Pages 项目的 **Settings → Builds & deployments → Deploy hooks**。
2. 点击 **Add deploy hook**。
3. 名称填写 `Nami Publish`，分支选择 `main`，然后创建。
4. 复制 Cloudflare 生成的完整 Hook URL。
5. 进入 `nami-blog-api` Worker 的 **Settings → Variables and Secrets**。
6. 点击新增变量，类型选择 **Secret**，名称填写 `PAGES_DEPLOY_HOOK_URL`，值粘贴 Hook URL。
7. 保存后重新部署一次 Worker，让 Secret 生效。

不要把 Hook URL 写入 GitHub、Pages 环境变量、`.env.example` 或截图。它相当于一个只用于触发 Pages 构建的密码。

配置成功后，以下操作会自动重建前台：发布、修改、取消公开或删除公开文章；修改分类、标签、已通过的友链；保存站点设置。后台会显示“前台正在自动更新”，一般等待 1–2 分钟即可。草稿、非公开文章、待审核友链和评论不会触发重建。

## 第八步：首次登录管理员

打开“实际 Pages 地址 + `/admin/login`”：

- 用户名：`admin`
- 密码：第四步设置的 `ADMIN_INITIAL_PASSWORD`

该密码只在数据库没有管理员时用于首次创建，系统会用 bcrypt cost 12 保存哈希，不会保存明文。成功登录后立即：

1. 进入 **后台设置 → 安全设置** 修改密码。
2. 回到 Workers **Variables and Secrets** 删除 `ADMIN_INITIAL_PASSWORD`。

删除或修改这个 Secret 不会重置已经创建的管理员。

## 第九步：验证自动更新

1. 打开 Pages 地址，确认首页正常。
2. 登录后台，发布一篇公开文章。
3. 确认后台出现“前台正在自动更新”的提示。
4. 等待 Pages 完成部署，再打开 `/blog/`，确认文章已经显示。
5. 在 GitHub 提交一次文档修改，确认 Workers/Pages 的 Git 集成也能自动触发部署。

仓库内的 GitHub Actions 负责 Lint、类型检查、测试和构建验证；实际发布由 Cloudflare 的 Git 集成完成，不需要配置 GitHub API Token。

## 常见问题

### Pages 提示 `Failed building Pages Functions`

请先确认使用了仓库最新版本，且根目录不存在旧的 `functions/` 目录。Nami 的 API 由 `apps/api` 中的独立 Worker 提供，Pages 只负责部署 `apps/web/dist` 静态前端，不需要 Pages Functions。

### 登录提示凭据错误

确认 `ADMIN_INITIAL_PASSWORD` 是 Workers 的 **Secret**、长度至少 12 个字符，并且没有使用 `nami-local-admin`。如果数据库已经存在管理员，Secret 不会覆盖旧密码。

### 页面能打开但 API 请求失败

核对三处地址是否完全一致：浏览器实际访问的前端地址、`wrangler.toml` 的 `CORS_ORIGIN`、Pages 的 `SITE_URL`。地址末尾不要额外添加路径或 `/`。

### 后台有文章，但前台看不到

先确认文章状态是“已发布”且“公开”开关已打开。再查看后台保存后的提示：

- “前台正在自动更新”：等待 Pages 构建完成，通常需要 1–2 分钟。
- “尚未配置自动更新”：按第七步设置 `PAGES_DEPLOY_HOOK_URL`。
- “自动更新前台失败”：重新复制 Deploy Hook URL，并确认它作为 Worker 的 Secret 保存。

如果 Cloudflare 显示部署成功但 `/blog/` 仍为空，请确认仓库已更新到包含文章列表修复的最新版本，然后重新部署 Pages。

### Pages 项目名被占用

使用 Cloudflare 分配或你重新选择的项目名。如果使用默认域名，把实际 `.pages.dev` 地址回填到 `CORS_ORIGIN` 和 `SITE_URL`；如果已绑定自定义域名，两处均填自定义域名。

### 想使用自己的域名

在 Pages 的 **Custom domains** 绑定前端域名后，将 Pages 的 `SITE_URL` 和 `apps/api/wrangler.toml` 的 `CORS_ORIGIN` 一起改为该正式域名，然后分别重新部署 Pages 和 Worker。

如果 Workers API 也绑定了自己的 API 域名，例如 `https://api.example.com`，还要将 Pages 的 `PUBLIC_API_URL` 改为该地址并重新部署 Pages。
