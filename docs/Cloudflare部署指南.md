# Cloudflare 部署指南（零域名 · 纯免费）

本文档手把手教你把 Nami Blog 部署到 Cloudflare，**不需要域名、不需要花钱**。
部署完成后你会获得两个免费地址：

| 服务 | 免费地址                                       |
| ---- | ---------------------------------------------- |
| API  | `https://nami-blog-api.你的用户名.workers.dev` |
| 前端 | `https://nami-blog.你的用户名.pages.dev`       |

---

## 前置准备

1. 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费）
2. 本地已安装 [Node.js 22+](https://nodejs.org/) 和 [pnpm 9+](https://pnpm.io/)
3. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```
4. 登录 Cloudflare：
   ```bash
   wrangler login
   ```
   浏览器会弹出授权页面，点 **Allow** 即可。

---

## 第一步：创建 D1 数据库

在终端执行：

```bash
wrangler d1 create nami-blog
```

你会看到类似这样的输出：

```
✅ Successfully created DB 'nami-blog'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**复制 `database_id` 的值**，下一步要用。

---

## 第二步：填写 database_id

打开 `apps/api/wrangler.toml`，找到这行：

```toml
database_id = "<replace-with-production-d1-id>"
```

替换为刚才复制的 ID：

```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## 第三步：执行数据库迁移

```bash
wrangler d1 migrations apply nami-blog --remote --config apps/api/wrangler.toml
```

这会创建所有数据表。看到 `All migrations applied successfully` 就成功了。

---

## 第四步：部署 API（Workers）

```bash
cd apps/api
wrangler deploy
```

部署成功后会显示：

```
Published nami-blog-api
  https://nami-blog-api.你的用户名.workers.dev
```

**记下这个 URL**，下一步要用。

---

## 第五步：设置 API 密钥

打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → 点击 `nami-blog-api` → **Settings** → **Variables and Secrets**

点击 **Add variable**，添加两个 Secret：

| Type   | Name                 | Value                          |
| ------ | -------------------- | ------------------------------ |
| Secret | `JWT_SECRET`         | 随机生成一个长字符串（见下方） |
| Secret | `JWT_REFRESH_SECRET` | 随机生成另一个长字符串         |

生成随机字符串的方法（在终端执行）：

```bash
openssl rand -hex 32
```

执行两次，把两个不同的结果分别填入。

然后添加一个普通变量：

| Type      | Name          | Value                                    |
| --------- | ------------- | ---------------------------------------- |
| Plaintext | `CORS_ORIGIN` | `https://nami-blog.你的用户名.pages.dev` |

> 💡 把 `你的用户名` 替换成你 Cloudflare 账号的实际用户名。

---

## 第六步：创建管理员账号

```bash
# 回到项目根目录
cd ../..

# 创建生产环境管理员
pnpm db:seed -- --remote
```

按提示输入确认文字和密码。

---

## 第七步：部署前端（Pages）

### 7.1 创建 Pages 项目

打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**

- Project name：`nami-blog`
- 先不上传文件，点 **Create project**

### 7.2 构建前端

```bash
# 在项目根目录执行
PUBLIC_API_URL=https://nami-blog-api.你的用户名.workers.dev \
SITE_URL=https://nami-blog.你的用户名.pages.dev \
pnpm --filter @nami/web build
```

> 💡 把 `你的用户名` 替换为实际值。

### 7.3 上传部署

```bash
PUBLIC_API_URL=https://nami-blog-api.你的用户名.workers.dev \
SITE_URL=https://nami-blog.你的用户名.pages.dev \
pnpm exec wrangler pages deploy apps/web/dist --project-name=nami-blog
```

部署成功后会显示：

```
✨ Deployment complete!
🌎 https://nami-blog.你的用户名.pages.dev
```

**打开这个 URL 就能看到你的博客了！**

---

## 第八步：验证

1. 打开 `https://nami-blog.你的用户名.pages.dev` → 看到博客首页 ✅
2. 打开 `https://nami-blog.你的用户名.pages.dev/admin/login` → 用刚才设的密码登录 ✅
3. 在后台设置里修改站点名称、主题等 ✅

---

## 可选：配置 GitHub 自动部署

每次 push 代码自动部署，不用手动执行命令。

### 1. 获取 Cloudflare API Token

打开 [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → 选择 **Edit Cloudflare Workers** 模板 → 确认创建 → **复制 Token**

### 2. 获取 Account ID

打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)，右侧栏可以看到 **Account ID**，复制它。

### 3. 设置 GitHub Secrets

打开你的 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加两个：

| Name                    | Value                   |
| ----------------------- | ----------------------- |
| `CLOUDFLARE_API_TOKEN`  | 第一步复制的 Token      |
| `CLOUDFLARE_ACCOUNT_ID` | 第二步复制的 Account ID |

### 4. 完成

以后每次 push 到 `main` 分支，GitHub Actions 会自动构建并部署前端到 Cloudflare Pages。

---

## 常见问题

### Q: 页面显示空白或 API 报错？

检查 CORS_ORIGIN 是否正确设置了 Pages 的 URL（第五步）。

### Q: 想绑定自己的域名？

在 Cloudflare Dashboard → Pages → `nami-blog` → **Custom domains** 添加域名。
Workers 同理：**Workers & Pages** → `nami-blog-api` → **Settings** → **Domains & Routes**。

### Q: 如何更新 API？

```bash
cd apps/api
wrangler deploy
```

### Q: 数据库迁移报错？

确认 `wrangler.toml` 里的 `database_id` 是否和 Dashboard 里 D1 数据库的 ID 一致。
