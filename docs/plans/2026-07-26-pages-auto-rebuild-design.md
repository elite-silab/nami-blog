# Pages 公开内容自动更新设计

## 目标

Nami 前台保持 Astro SSG 的静态性能，但管理员不应在每次发布文章或修改站点设置后手动进入 Cloudflare 重新部署。公开内容变更后应自动请求 Pages 重建，并在后台告知实际状态。

## 方案

- Pages 项目创建指向 `main` 的 Deploy Hook。
- Hook URL 作为 Workers Secret `PAGES_DEPLOY_HOOK_URL` 保存，不写入 GitHub、Pages 变量或浏览器代码。
- 已鉴权的 Worker 在公开文章、分类、标签、友链、站点设置或数据备份导入后调用 Hook。
- 草稿、非公开文章和运行时读取的评论不触发重建。
- Hook 结果只返回 `queued`、`not_configured`、`failed` 或 `not_needed`，不返回 Secret URL。
- 文章或设置已成功写入 D1 后，Hook 失败不回滚数据；后台显示可操作的失败提示。

## 构建可靠性

Pages 构建请求会附加每次构建唯一的查询参数，避免读到发布前的公开 API 缓存。Cloudflare Pages 生产构建中，API 无法访问或返回错误时直接使构建失败，不再产生“部署成功但内容为空”的静态站点。本地未启动 API 时仍允许生成空状态，便于前端开发。

## 验收

- 发布、修改或删除公开文章会请求 Deploy Hook。
- 修改分类、标签、友链、站点设置或导入备份会请求 Deploy Hook。
- 后台明确展示前台正在更新、尚未配置或触发失败。
- `/blog/` 使用 API 允许的分页上限，可正常显示已发布文章。
