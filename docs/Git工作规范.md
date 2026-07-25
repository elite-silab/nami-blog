# Nami 娜美 CF 博客项目 Git 工作规范

> 文档版本：v2.2
> 更新日期：2026-07-25
> 适用范围：Nami 娜美 CF 博客 (Astro + Cloudflare Pages)

> **适合谁读**：所有贡献者。本文档定义了分支策略、提交规范和 PR 流程，确保协作顺畅。

## 1. 仓库模式

项目采用单一仓库，前端、API 路由、数据库迁移、OpenAPI 和文档统一版本管理：

```text
apps/web/src/          # Astro 前端源码 (pages/layouts/components)
apps/api/src/          # Cloudflare Workers API (Hono + D1)
packages/shared/       # 前后端共享类型、校验 schema (Zod)
migrations/            # D1 数据库迁移
openapi/               # API 事实契约
docs/                  # 产品和工程文档
apps/web/public/_headers # Cloudflare Pages 安全响应头
```

前端以 Astro SSG 部署到 Cloudflare Pages，API 以 Hono Worker 独立部署到 Cloudflare Workers。前端通过 `PUBLIC_API_URL` 跨域调用 API，API 使用 `CORS_ORIGIN` 限制来源；客户端代码不得直连 D1，所有数据库访问必须通过 Workers API。

## 2. 分支模型

采用轻量主干开发，不设置长期 `develop` 分支。

| 分支             | 用途                           |
| ---------------- | ------------------------------ |
| `main`           | 受保护主干，始终可构建、可部署 |
| `feature/<name>` | 短生命周期功能或文档变更       |
| `fix/<name>`     | 常规缺陷修复                   |
| `hotfix/<name>`  | 从生产版本点创建的紧急修复     |

分支名使用小写英文和短横线，例如 `feature/comment-system`、`fix/refresh-token-rotation`。功能分支原则上在数天内合并；大型功能使用 feature flag 拆成可独立验证的小变更，避免长期分叉。

`main` 保护规则：

- 禁止直接推送和强制推送。
- 至少一名非作者审查通过。
- 必需 CI 检查全部通过。
- 合并前分支必须基于最新 `main`，仓库统一采用 squash merge。
- 安全、鉴权、迁移和管理权限改动应指定对应领域审查人。

## 3. Git Worktree

worktree 用于同时维护两个独立分支，不是每个小改动的强制步骤。

```bash
# 在仓库主目录创建功能 worktree
git fetch origin
git worktree add -b feature/comment-system ../nami-comment-system origin/main

# 查看 worktree
git worktree list

# 合并后清理
git worktree remove ../nami-comment-system
git branch -d feature/comment-system
git worktree prune
```

规则：

- 一个分支只能被一个 worktree 检出。
- worktree 统一放在主仓库同级目录，命名为 `nami-<feature>`。
- 删除前确认分支已经推送或合并，且目录没有未提交修改。
- 根目录 `.env` 按 worktree 单独创建，不使用软链接共享秘密。
- D1 migration 版本号可能冲突；合并主干后必须重新检查顺序并运行全量迁移测试。

## 4. 提交规范

使用 Conventional Commits：

```text
<type>(<scope>): <简要描述>

<可选正文：为什么改、重要约束、迁移或兼容说明>
```

### 4.1 type

| type       | 用途                 |
| ---------- | -------------------- |
| `feat`     | 新功能               |
| `fix`      | 缺陷修复             |
| `refactor` | 不改变外部行为的重构 |
| `perf`     | 性能优化             |
| `docs`     | 文档修改             |
| `style`    | 纯格式调整           |
| `test`     | 测试修改             |
| `build`    | 构建、依赖或镜像     |
| `ci`       | CI/CD                |
| `chore`    | 其他维护工作         |

常用 scope：`web`、`api`、`auth`、`post`、`comment`、`image`、`db`、`openapi`、`deploy`、`docs`。

示例：

```text
feat(post): add markdown editor with live preview

- integrate Milkdown editor in admin panel
- support image reference via public/images/
- auto-save draft every 30 seconds
```

```text
fix(auth): revoke token family on refresh reuse
```

### 4.2 原子提交

- 一次提交只表达一个可解释、可验证的变化。
- 提交必须保持工作区可构建；不要提交调试日志、临时绕过或已知失败测试。
- API 变化应在同一提交中包含 OpenAPI、Workers 实现和消费方修改。
- schema 变化应包含 D1 migration 和相关测试。
- 生成文件必须通过标准命令产生，不允许为了“让 diff 好看”手改。
- 不把无关格式化与业务修改混在一起。

## 5. Pull Request 规范

PR 描述至少包含：

```markdown
## 目的

解决什么问题，为什么现在需要。

## 变化

- 用户可感知变化
- API / schema / 配置变化

## 验证

- 执行过的命令与结果
- UI 截图或录屏（如适用）

## 风险与回滚

- 数据兼容、缓存、权限和部署风险
- 如何关闭功能或回滚应用
```

涉及破坏性变化时增加 `BREAKING CHANGE:`，但 MVP 阶段仍应优先通过兼容迁移避免破坏性发布。

## 6. Migration 工作流

迁移采用 Cloudflare D1 内置迁移机制，SQL 文件按序号放置在 `migrations/` 目录：

```text
migrations/0001_init_schema.sql
migrations/0002_add_post_cover_url.sql
migrations/0003_create_comments_table.sql
```

通过 Wrangler CLI 执行迁移：

```bash
# 本地开发数据库
wrangler d1 migrations apply nami-blog --local

# 远程 preview 数据库
wrangler d1 migrations apply nami-blog-preview --remote

# 远程生产数据库（谨慎）
wrangler d1 migrations apply nami-blog --remote
```

规则：

- 已进入远程环境的 migration 永不修改；修正必须新增 migration。
- CI 在本地空库执行全量迁移验证；涉及数据回填时增加测试用例。
- 生产采用"扩展 → 应用切换 → 收缩"：先增加兼容字段/表，部署读写新旧结构的 Workers，最后在后续版本移除旧结构。
- D1 不支持 `ALTER TABLE DROP COLUMN`（部分版本），删除列需重建表或使用兼容方案。
- 禁止通过 Cloudflare Dashboard 控制台手工改变生产 schema。

## 7. OpenAPI 契约

`openapi/nami-blog.yaml` 是 HTTP 契约的机器可读事实来源，《API 接口设计文档》解释业务语义。二者必须保持一致。

标准流程：

1. 先修改 OpenAPI 和契约测试。
2. 修改 Workers handler 和前端消费方。
3. CI 重新生成并检查 `git diff --exit-code`，发现手工改生成文件即失败。
4. 使用 OpenAPI diff 工具阻止未声明的破坏性变化。

## 8. `.gitignore` 与秘密

根目录 `.gitignore` 至少覆盖：

```gitignore
.DS_Store
.env
.env.*
.dev.vars
!.env.example
node_modules/
.astro/
dist/
.wrangler/
.mf/
coverage/
tmp/
*.log
```

- 仓库只提交根目录 `.env.example`，值使用明显的占位符。
- 禁止提交密码、token、私钥、真实邮箱列表、生产数据库快照或含个人信息的日志。
- 即使秘密随后从 Git 删除，也应视为已泄露并立即轮换。
- CI 启用秘密扫描；依赖 bot 的升级 PR 仍需通过完整测试。

## 9. 合并前检查清单

### 通用

- [ ] 变更范围聚焦，PR 描述说明了风险和回滚。
- [ ] 没有调试代码、临时注释、秘密或用户隐私数据。
- [ ] 文档、OpenAPI、migration 和实现保持一致。
- [ ] 新行为有测试，修复包含可复现问题的回归测试。
- [ ] 日志不包含 Authorization、Cookie、密码或一次性 token。

### Cloudflare Workers API (TypeScript)

- [ ] lint（ESLint）、类型检查（`tsc --noEmit`）和测试（Vitest）通过。
- [ ] Worker 路由不把 D1 逻辑泄露到前端，公开读写边界清晰。
- [ ] 写接口考虑权限、幂等、限流、审计和缓存失效。
- [ ] D1 binding 正确使用 prepared statement，防止 SQL 注入。
- [ ] D1 操作校验参数类型和大小，错误路径有明确返回。

### Astro 前端

- [ ] lint、类型检查（`astro check`）、生产构建通过。
- [ ] 公共缓存没有包含 Cookie、Authorization 或用户个性化字段。
- [ ] 页面元数据、键盘操作、焦点状态、错误/空/加载状态完整。
- [ ] Cloudflare Pages Edge Runtime 兼容性已验证。

### D1 数据库与部署

- [ ] migration 在本地空库与远程 preview 环境验证通过。
- [ ] 索引适合目标数据规模，查询使用 prepared statement。
- [ ] 新配置已记录到对应应用的 `.example` 模板和 `wrangler.toml`。
- [ ] 部署和回滚不会依赖不可逆的 schema 变更。

## 10. Release 与 hotfix

- 合并 `main` 后 CI 自动运行测试和构建检查。
- 前端由 Cloudflare Pages 自动构建部署（Astro SSG），API 由 Cloudflare Workers 独立部署。
- 以 Git SHA 标记，preview 环境自动分配。
- 生产发布使用带变更说明的版本标签；D1 迁移状态和备份纳入发布检查。
- hotfix 从当前生产标签创建，合并回 `main` 后正常发布，不维护独立长期分支。
- 回滚：Pages 在 Dashboard 一键回滚上一部署；Workers 使用 `wrangler rollback` 回退到上一版本。

## 11. 项目状态

项目核心功能已实现，持续迭代中。当前进度：

- ✅ Astro 5 + Cloudflare Pages 架构配置完成
- ✅ Tailwind CSS 4 + CSS 变量主题系统就绪
- ✅ 三套二次元主题（樱花/海洋/星空）已实现
- ✅ D1 数据库 Schema + 迁移工具链就位
- ✅ Hono Workers API + JWT 认证完成
- ✅ 自建评论系统（提交/审核/删除）已实现
- ✅ 管理员改密码功能已实现
- ✅ 管理后台页面骨架完成（仪表盘/文章/分类/标签/评论/友链/设置）
- 🔲 文章编辑器富文本功能待完善
- ✅ 前台搜索功能（Workers API 模糊搜索 + 客户端交互）已实现
- 🔲 CI/CD 流水线配置待完成

开始贡献时，请参考 README.md 的快速开始指南搭建本地环境。本地空数据库可使用 `.env` 模板密码首次登录；生产管理员必须通过受控 bootstrap 创建，不使用本地默认密码。
