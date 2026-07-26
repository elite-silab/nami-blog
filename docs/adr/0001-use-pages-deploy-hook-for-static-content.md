# ADR-0001: 使用 Pages Deploy Hook 更新静态前台

> **状态：已废弃。** 该方案已被 [ADR-0002：采用 Next.js 单 Worker 架构](./0002-adopt-nextjs-single-worker.md) 取代。

## Status

Superseded by ADR-0002

## Context

Nami 的前台是 Astro SSG，文章、分类、标签、友链和站点设置在 Pages 构建时从 Workers API 读取。D1 变更不会自动改写已部署的 HTML，手动重新部署不符合小白友好的产品目标。

## Decision

保留 SSG，由 Workers API 在已鉴权的公开内容变更成功后请求 Cloudflare Pages Deploy Hook。Hook URL 只作为 Workers Secret 保存，并仅接受 Cloudflare 官方 HTTPS Hook 域名。

## Consequences

### Positive

- 管理员只需保存或发布，无需手动进入 Pages。
- 保留静态 HTML、CDN 性能、SEO 和低运行成本。
- Hook Secret 不进入浏览器或仓库。

### Negative

- 前台更新不是瞬时的，需要等待 Pages 构建完成。
- 多次连续保存公开内容可能产生多次构建。主题选择因此改为先预览、统一保存。

### Neutral

- Hook 失败不回滚已写入 D1 的内容，管理后台负责告知失败状态。

## Alternatives Considered

- **浏览器直接请求 Deploy Hook**：会暴露 Hook URL，拒绝。
- **Astro SSR / 统一 Workers 动态渲染**：可即时更新，但显著增加运行时和部署复杂度，不符合当前轻量目标。
- **继续手动重新部署**：操作容易遗忘，用户体验差，拒绝。
