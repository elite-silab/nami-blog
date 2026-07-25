# Dashboard 一次性生产管理员初始化设计

## 目标

让第一次使用 Cloudflare 的用户无需在终端执行远程 seed，也能安全创建生产管理员。用户在 Workers Dashboard 将 `ADMIN_INITIAL_PASSWORD` 设置为自己选择的一次性 Secret，然后使用固定用户名 `admin` 首次登录。成功后在后台修改密码并从 Dashboard 删除该 Secret。

## 安全边界

- 数据库没有任何未删除管理员时才允许初始化，已有账号永不覆盖或重置。
- 本地 `localhost` / `127.0.0.1` 继续允许模板值 `nami-local-admin`。
- 非本地请求必须提供至少 12 个字符的自定义 Secret，并明确拒绝公开的本地模板密码。
- 输入密码必须与 Workers Secret 完全一致；密码使用 bcrypt cost 12 哈希保存。
- 数据库初始化仍使用参数绑定，响应和日志不输出密码或哈希。
- 首次登录后应修改数据库密码并删除 `ADMIN_INITIAL_PASSWORD` Secret，缩短一次性凭据的有效期。

## 文档与部署流程

README 和 Cloudflare 指南统一采用 Dashboard/Git 集成部署：Workers 设置三个 Secret，Pages 和 CORS 地址始终复制 Cloudflare 实际显示的 URL，不拼接用户名。Workers 部署命令删除不存在的 shared build，Pages 只构建 Web。生产登录使用用户自己设置的一次性密码，不再公开固定密码。

本地开发继续只需在编辑器复制根目录 `.env.example`，执行 `pnpm install` 和 `pnpm dev`；`predev` 自动完成 D1 migration。默认 Web URL 统一为 `http://localhost:4322`。

## 验证

- 生产域名拒绝本地模板密码和过短密码。
- 生产域名在空管理员库中接受合格的一次性 Secret。
- 本地模板密码仍可初始化。
- 已有管理员不受环境变量变化影响。
- README 中的脚本、端口、文档链接和 Pages URL 与项目配置一致。
- 类型检查、Lint、全部测试和生产构建通过。
