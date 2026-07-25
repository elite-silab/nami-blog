# Reading Statistics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace misleading dashboard placeholders with lightweight real reading statistics and taxonomy counts.

**Architecture:** A dedicated public POST endpoint increments D1 only for published public posts. The static article page calls it at runtime and uses session-scoped client deduplication; the authenticated dashboard aggregates D1 counters and taxonomy rows.

**Tech Stack:** Cloudflare Workers, Hono, D1, Astro SSG, TypeScript, Vitest

---

### Task 1: Correct the view-count API semantics

**Files:**
- Modify: `apps/api/src/routes/public.ts`
- Test: `apps/api/src/__tests__/public-routes.test.ts`

1. Add failing tests proving GET does not mutate and POST increments only a published public article.
2. Run the public route test and confirm the new expectations fail.
3. Remove the GET-side increment and implement `POST /api/v1/posts/:slug/view` with a no-store response.
4. Run the public route test and confirm it passes.

### Task 2: Add session-scoped browser tracking

**Files:**
- Create: `apps/web/src/lib/view-tracker.ts`
- Create: `apps/web/src/lib/view-tracker.test.ts`
- Modify: `apps/web/src/pages/blog/[slug].astro`

1. Add tests for first-view POST, same-session deduplication, safe failure, and Slug encoding.
2. Implement a small dependency-injected tracking helper.
3. Mark the visible counter with article and API data attributes, call the helper after page load, and update the number on success.
4. Run Web tests and type checking.

### Task 3: Replace dashboard placeholders

**Files:**
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/__tests__/admin-posts.test.ts`
- Modify: `apps/web/src/pages/admin/index.astro`

1. Add an authenticated dashboard test for total views and taxonomy counts.
2. Aggregate public post views, undeleted categories, and undeleted tags in the dashboard query.
3. Render “总浏览量” and “分类与标签” using API data, with safe zero fallbacks.
4. Run API integration tests.

### Task 4: Synchronize documentation and verify

**Files:**
- Modify: `docs/管理后台功能与设计文档.md`
- Modify: `docs/前端功能与交互设计文档.md`
- Modify: `docs/变更记录.md`

1. Document the lightweight view definition and taxonomy card.
2. Run `git diff --check`, `pnpm check`, `pnpm test`, and `pnpm build`.
3. Inspect the generated article page for the runtime tracking hook and review the staged diff before commit.
