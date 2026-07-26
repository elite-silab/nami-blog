# Git 工作规范

## 仓库结构

```text
apps/api/              Hono API、认证、测试和数据库脚本
apps/web/              Next.js App Router、组件和 OpenNext 配置
packages/shared/       共享校验逻辑
migrations/            D1 迁移
docs/                  用户、部署、设计和运维文档
openapi/               API 契约
wrangler.jsonc         唯一 Worker 配置
```

Web、API 和静态资源最终部署为一个 Cloudflare Worker。

## 分支

- `main`：可部署分支，必须通过完整检查
- 功能分支：`feat/<short-name>`
- 修复分支：`fix/<short-name>`
- 文档分支：`docs/<short-name>`

个人小项目可直接在 `main` 工作，但提交前仍执行验收命令。

## 提交格式

推荐 Conventional Commits：

```text
feat: add backup restore flow
fix: keep published posts visible immediately
docs: simplify worker deployment guide
refactor: share response json parsing
test: cover public theme settings
chore: update dependencies
```

一个提交只表达一个可回滚意图。功能与相应测试、文档可以放在同一提交中。

## 提交前检查

```bash
pnpm check
pnpm test
pnpm build:worker
pnpm exec wrangler deploy --dry-run --config wrangler.jsonc
```

涉及 UI 时额外完成桌面和移动端人工检查。涉及 D1 时验证新旧数据库路径。

## 不应提交的文件

- 根目录 `.env`
- 任意 `.dev.vars`
- `node_modules/`
- `.next/`
- `.open-next/`
- `*.tsbuildinfo`
- `.wrangler/`
- 日志、截图和本地数据库产物
- 导出的站点备份

仓库只提交 `.env.example`。提交前运行：

```bash
git status --short
git diff --cached
```

重点搜索：密码、JWT、Authorization、Cookie、Cloudflare API Token 和 Deploy Token。

## Wrangler 配置

根目录只保留一份 `wrangler.jsonc`。它可以公开提交，因为只包含：

- Worker 和数据库名称
- D1 Database ID
- 兼容日期与 Flags
- Assets 路径
- 正式公开网址

D1 Database ID 不是访问凭据。真正的 Secret 只在 Cloudflare Dashboard 中维护。

不要在 `apps/api` 或 `apps/web` 再创建 `wrangler.toml`、`.dev.vars` 或第二份生产配置。

## 数据库迁移

迁移文件命名：

```text
0001_init_schema.sql
0002_theme_settings.sql
0003_add_example.sql
```

规则：

1. 已合并迁移不修改，只追加新迁移。
2. 尽量使用向后兼容的加列/加表步骤。
3. 删除或改名需要数据迁移和回滚说明。
4. 测试 Fixture 与真实迁移的默认配置保持一致。
5. PR 中说明是否需要远程 D1 迁移。

## API 变更

- 同步修改 Hono Route、测试与 `openapi/nami-blog.yaml`
- 公开接口不得返回敏感站点设置
- 管理接口统一走 `/api/admin/*`
- 内容写入返回 `publication.status`，当前单 Worker 正常值为 `live`
- 客户端不直接访问 D1

## 前端变更

- 优先使用 Server Components
- 需要浏览器状态或事件时才添加 `"use client"`
- `useSearchParams` 和 `usePathname` 兼容可能的 null 类型
- Cloudflare `Response.json()` 返回 `unknown`，通过统一解析边界声明类型
- 新增交互必须包含加载、失败和空状态
- 弹窗使用居中固定遮罩，并验证移动端

## 文档变更

以下改动必须同步更新文档：

- 部署命令、Cloudflare UI 流程
- 环境变量或 Secret
- 默认端口和正式地址
- D1 绑定或迁移步骤
- 后台可见功能
- API 契约

当前文档只能把 Pages 和旧独立 Worker 当作历史架构提及，不能让用户按旧流程部署。

## Pull Request 描述

至少包含：

```text
## 改了什么
## 为什么这样改
## 如何验证
## 数据库/配置影响
## 截图（UI 改动）
## 回滚方式
```

## 发布

Cloudflare Git 集成监听 `main`。推荐设置：

- Build：`pnpm --filter @nami/web build:worker`
- Deploy：`pnpm --filter @nami/web deploy:worker`

发布成功后检查首页、登录、文章、RSS、Sitemap 和健康检查。

## 回滚

- 代码：Git revert 后重新部署，或选择 Cloudflare 上一个 Worker 版本
- 数据：不要假设代码回滚会回滚 D1；使用修复迁移或经过验证的后台备份
- 域名：恢复 `NEXT_PUBLIC_SITE_URL` 后重新构建部署
