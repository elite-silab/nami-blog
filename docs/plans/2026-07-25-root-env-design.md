# 根目录统一环境配置设计

## 目标

本地开发只保留根目录 `.env`，用户无需理解 Astro 的 `.env` 与 Wrangler 的 `.dev.vars` 差异。根目录 `.env.example` 同时列出 API 私密变量和 Web 公开变量，并用注释明确安全边界。

## 读取方式

- Workers：`apps/api` 的开发脚本通过 `wrangler dev --env-file ../../.env` 显式加载根目录文件。
- Web：Astro 的 Vite 配置使用 `envDir: "../../"`，因此 `import.meta.env.PUBLIC_API_URL` 和 `import.meta.env.SITE_URL` 来自根目录。
- 浏览器安全边界不变：只有 `PUBLIC_` 前缀变量会进入客户端包；`JWT_SECRET` 和 `JWT_REFRESH_SECRET` 只供 Workers 使用。
- 生产环境不依赖仓库中的 `.env`，仍在 Cloudflare Workers/Pages Dashboard 配置 Secret 和构建变量。

## 迁移与兼容

现有 `apps/api/.dev.vars` 与 `apps/web/.env` 的有效值合并到根目录 `.env`，随后删除旧文件和分散模板。Git 继续忽略真实 `.env`，只跟踪根目录 `.env.example`。文档不再要求用户在应用子目录中复制配置。

## 验证

- Wrangler 启动输出确认使用根目录 `.env`，API 健康检查成功。
- Astro 在没有 `apps/web/.env` 时构建成功，并从根目录读取公开变量。
- 检查客户端构建产物不包含 JWT 密钥或示例秘密。
- 执行 `pnpm check`、`pnpm test`、`pnpm build` 与配置引用搜索。
