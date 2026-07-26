# Next.js 单 Worker 迁移记录

## 目标

将 Astro Pages 前端迁移到 Next.js App Router，并与现有 Hono API 一起部署到同一个 Cloudflare Worker。迁移后，用户只需维护一个项目、一个网址和一份 Cloudflare 配置。

## 总体方案

- Next.js 通过 OpenNext 运行在 Cloudflare Workers 上。
- 公开页面在服务端读取 Hono 和 D1，不向自己的公网地址发请求。
- 管理后台、搜索、评论和主题切换保留浏览器交互。
- `/api/*` 继续交给 Hono 处理，不重写已经验证的认证和数据库逻辑。
- 正式地址为 `https://nami-blog.codeelite.workers.dev`。

## 迁移内容

### 前台

- 迁移首页、文章列表、文章详情、分类、标签、搜索、友链和关于页。
- 保留阅读统计、评论、代码复制、分享和上一篇/下一篇。
- RSS、Sitemap、搜索引擎标准地址和分享地址统一使用 `NEXT_PUBLIC_SITE_URL`。
- 文章不存在时正确返回 404。

### 管理后台

- 迁移登录、仪表盘、文章、分类、标签、评论、友链和站点设置。
- 保留 Markdown 快捷工具、本地草稿、未保存提醒、数据备份和密码修改。
- 弹窗改为视口居中，并保留键盘焦点和移动端操作。
- 内容保存后直接生效，不再显示 Pages 重新部署提示。

### 配置与部署

- 根目录只保留 `wrangler.jsonc`。
- 删除 Pages、独立 API Worker、跨域配置和 Deploy Hook。
- 本地开发只读取根目录 `.env`，端口统一为 `4322`。
- 生产密码和 JWT 密钥只保存在 Cloudflare 控制台。
- 构建期间临时隔离本地 `.env`，防止本地密钥进入 Worker 产物。

## 验证结果

- 前台、后台和 API 从同一个 Worker 正常访问。
- 文章、分类、标签、友链和站点设置保存后立即可见。
- 登录、草稿、备份、RSS 和 Sitemap 正常。
- 类型检查、全部测试、Worker 构建和 Wrangler 部署预检通过。
- 构建产物不包含本地密钥。
