# Cloudflare 部署指南

本文面向第一次使用 Cloudflare 的用户。Nami Blog 只需要：

- 一个 GitHub 仓库
- 一个 Cloudflare D1 数据库
- 一个 Cloudflare Worker
- 一个由 Wrangler 自动配置的 KV 缓存

不需要购买服务器，不需要创建 Pages，也不需要配置跨域或 Deploy Hook。

KV 不需要手动创建，也不需要复制空间 ID。根目录 `wrangler.jsonc` 只声明名为 `CACHE` 的绑定，第一次部署时 Wrangler 会自动配置。

官方实例地址：`https://nami-blog.codeelite.workers.dev`

## 部署前准备

1. 登录 GitHub，Fork [elite-silab/nami-blog](https://github.com/elite-silab/nami-blog)。
2. 登录 Cloudflare Dashboard。
3. 确认仓库根目录存在 `wrangler.jsonc`。

所有可以公开的 Cloudflare 配置集中在根目录 `wrangler.jsonc`。生产密码和 JWT 密钥稍后填写在 Cloudflare 控制台，不会出现在 GitHub。

## 第一步：创建 D1 数据库

1. 在 Cloudflare 左侧打开 **Storage & databases**。
2. 进入 **D1 SQL database**。
3. 点击 **Create**。
4. 数据库名称填写 `nami-blog`。
5. 创建完成后复制 **Database ID**。

Database ID 看起来像一串 UUID。它只是数据库绑定标识，不是密码。

## 第二步：编辑公开配置

回到自己的 GitHub 仓库，打开根目录 `wrangler.jsonc`，点击铅笔按钮编辑。

这一步只需要替换 D1 ID。Worker 名称和 `CACHE` 保持原样，正式网址等第一次部署完成后再修改：

```json
{
  "name": "nami-blog",
  "vars": {
    "NEXT_PUBLIC_SITE_URL": "https://nami-blog.codeelite.workers.dev"
  },
  "kv_namespaces": [
    { "binding": "CACHE" }
  ],
  "d1_databases": [
    {
      "database_id": "你的-D1-Database-ID"
    }
  ]
}
```

- `name`：保持 `nami-blog`，不需要修改。
- `database_id`：替换为第一步复制的值。
- `NEXT_PUBLIC_SITE_URL`：第一次部署时先保持原样；部署完成后再换成自己的实际地址。
- `CACHE`：公开内容缓存，保持现有写法，不填写 ID。

不同 Cloudflare 账号有各自的 Workers 子域，所以大家都使用 `nami-blog` 不会互相冲突。Fork 用户在首次部署前，真正必须替换的只有 `database_id`。

不要向文件中添加 `ADMIN_INITIAL_PASSWORD`、`JWT_SECRET` 或 `JWT_REFRESH_SECRET`。

## 第三步：连接 GitHub 仓库

1. 打开 **Workers & Pages**。
2. 点击 **Create**。
3. 选择导入 Git 仓库的入口，例如 **Import a repository**。
4. 授权 GitHub，并选择自己的 `nami-blog` 仓库。
5. 选择生产分支 `main`。

填写构建设置：

| 设置 | 值 |
| --- | --- |
| Project name | `nami-blog` |
| Root directory | 留空 |
| Build command | `pnpm build:worker` |
| Deploy command | `pnpm db:migrate:prod && pnpm exec wrangler deploy --config wrangler.jsonc` |

项目使用 Node.js 22。如果页面提供 Node 版本变量，可添加 `NODE_VERSION=22`。

Worker 名称保持 `nami-blog` 时，地址通常是：

```text
https://nami-blog.你的Workers子域.workers.dev
```

第一次部署时，日志可能会显示 Wrangler 正在自动配置 KV，这是正常现象。它只会为当前 Worker 准备缓存空间，不会保存密码、草稿、评论隐私或网站备份。

### 找不到 Build output directory 正常吗？

正常。Nami 现在部署为 Worker，不是 Pages 静态站点，因此不填写 `apps/web/dist`，也不需要 Build output directory。OpenNext 会自动生成 Worker 和静态资源产物。

## 第四步：添加生产 Secret

第一次构建后，进入刚创建的 Worker：

**Settings → Variables and Secrets → Add**

依次新增并选择 Secret 类型：

| Secret | 建议 |
| --- | --- |
| `ADMIN_INITIAL_PASSWORD` | 你自己的强密码，至少 12 位 |
| `JWT_SECRET` | 随机长字符串 |
| `JWT_REFRESH_SECRET` | 与 JWT_SECRET 不同的随机长字符串 |

保存后重新部署一次。不要把这些值写入 `wrangler.jsonc`、`.env.example`、GitHub Issue 或截图。

## 第五步：确认实际网址

部署完成后，Cloudflare 会显示实际的 `workers.dev` 地址。不要凭用户名猜测地址，直接复制页面显示的完整 URL。

官方项目使用：

```text
https://nami-blog.codeelite.workers.dev
```

Fork 用户需要回 GitHub 编辑 `wrangler.jsonc`，把 `NEXT_PUBLIC_SITE_URL` 改为刚复制的地址，再提交一次。Cloudflare 会自动重新部署。

这个变量是公开配置，不是 Secret。它用于：

- SEO canonical 地址
- Open Graph 分享链接
- `/sitemap.xml`
- `/rss.xml`
- `/robots.txt`

## 第六步：第一次登录

打开：

```text
你的站点地址/admin/login
```

例如：

```text
https://nami-blog.codeelite.workers.dev/admin/login
```

- 用户名：`admin`
- 密码：第四步设置的 `ADMIN_INITIAL_PASSWORD`

如果 D1 还是空数据库，第一次成功登录会自动创建管理员。登录后进入 **站点设置 → 修改密码**，可以换成新的密码。

## 第七步：发布测试文章

1. 进入 **文章管理 → 新建文章**。
2. 填写标题和正文。
3. 保持“公开”勾选。
4. 点击“发布文章”。
5. 返回前台，文章应立即出现。

这里不需要点击重新部署。文章、分类、标签、友链、主题和站点设置都保存在 D1，后台保存成功后还会自动清理 KV 公开缓存。

## 绑定自己的域名

1. 进入 Worker 的 **Settings → Domains & Routes**。
2. 点击 **Add → Custom Domain**。
3. 选择或输入域名，例如 `blog.example.com`。
4. 回 GitHub 将 `NEXT_PUBLIC_SITE_URL` 改为 `https://blog.example.com`。
5. 提交并等待一次部署。

地址不要带 `/admin`、`/blog` 等路径，末尾不要添加 `/`。

以后发布文章或修改后台站点设置仍然不需要部署；只有更换正式域名、修改代码或 Worker 绑定时才需要部署。

## 更新项目

自己修改代码后，推送到 `main`，Cloudflare Git 集成会自动构建并部署。

部署命令会先执行尚未应用的 D1 migrations，再上传 Worker。已执行过的迁移不会重复破坏数据。重要升级前仍建议在后台先导出备份。

## 常见问题

### 登录提示“服务暂时不可用”

依次检查：

1. `wrangler.jsonc` 的 `database_id` 是否属于当前 Cloudflare 账号；
2. 部署日志中 `pnpm db:migrate:prod` 是否成功；
3. 三个 Secret 是否存在且名称完全正确；
4. 打开 `/api/v1/healthz` 是否返回 `{"status":"ok","service":"nami-blog"}`。

健康检查成功但登录仍失败时，查看 Worker Logs 中第一条实际异常，不要公开日志里的 Cookie 或 Token。

### 发布后前台没有文章

检查文章是否同时满足：

- 状态是“已发布”
- 已勾选“公开”

现在是动态单 Worker 架构，不需要重新部署或等待静态构建。如果需要进一步排查，可在浏览器开发者工具中查看公开 API 的 `X-Nami-Cache`：`HIT` 表示本次来自 KV，`MISS` 表示本次从 D1 读取，`BYPASS` 表示该请求不使用 KV。KV 全球同步可能有短暂延迟，刷新后仍异常时再检查 Worker 日志。

### RSS 显示 XML 错误

确认使用仓库最新版本，然后访问 `/rss.xml`。当前实现已经声明 `content:encoded` 命名空间，并对正文使用 CDATA 编码。

### 为什么不需要修改 Worker 名称？

Worker 的默认地址还包含你自己的 Workers 子域。不同 Cloudflare 账号都可以使用 `nami-blog` 这个名称，不会与官方项目冲突。只有你自己的账号中已经存在另一个同名 Worker，并且确实想保留两个时，才需要另外改名。

### 使用自定义域名后分享地址仍是旧地址

`NEXT_PUBLIC_SITE_URL` 属于构建期公开变量。修改 `wrangler.jsonc` 并部署一次；之后普通内容更新不需要部署。

### 可以删除旧 Pages 项目吗？

确认新 Worker 的首页、后台登录、文章、RSS 和 Sitemap 都正常后，可以在 Cloudflare Dashboard 删除旧 Pages 项目和旧的独立 API Worker。删除前先确认它们没有仍在使用的自定义域名。

## 部署验收清单

- [ ] 只有一个生产 Worker
- [ ] D1 绑定名称为 `DB`
- [ ] KV 绑定名称为 `CACHE`
- [ ] 三个 Secret 已设置
- [ ] 首页和 `/api/v1/healthz` 可访问
- [ ] `/admin/login` 可以登录
- [ ] 发布文章后前台立即可见
- [ ] `/rss.xml` 与 `/sitemap.xml` 可打开
- [ ] `NEXT_PUBLIC_SITE_URL` 等于访客实际使用的正式域名
