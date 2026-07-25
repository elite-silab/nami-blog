# Friends, Backup, and RSS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify friend links, add safe Dashboard-based D1 content backup/restore, and produce valid RSS XML.

**Architecture:** Existing D1 tables remain compatible while friend-link status becomes an unused legacy detail. Authenticated backup endpoints serialize an allowlisted, non-secret JSON format and validate all relationships before a transactional D1 batch restore; Astro RSS explicitly declares its content namespace.

**Tech Stack:** Cloudflare Workers, Hono, D1, Astro, TypeScript, Vitest, `@astrojs/rss`

---

### Task 1: Simplify friend links

**Files:**
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/routes/public.ts`
- Modify: `apps/web/src/pages/admin/friends/index.astro`
- Test: `apps/api/src/__tests__/public-routes.test.ts`

1. Change the public test to expect all active friend links.
2. Make admin creation explicitly approved and always trigger a Pages rebuild.
3. Make update/delete always rebuild and remove approval behavior from the UI.
4. Run API and Web checks.

### Task 2: Add allowlisted backup validation and endpoints

**Files:**
- Create: `apps/api/src/lib/site-backup.ts`
- Create: `apps/api/src/__tests__/backup-friends.test.ts`
- Modify: `apps/api/src/routes/admin.ts`

1. Write integration tests for secret-free export, successful restore, invalid-format rejection, and direct friend publication.
2. Define versioned backup types and relational validation.
3. Export active content from allowlisted columns only.
4. Validate the complete JSON before deleting anything, restore in dependency order, and trigger one Pages rebuild.
5. Run all Workers integration tests.

### Task 3: Add beginner-friendly backup controls

**Files:**
- Modify: `apps/web/src/pages/admin/settings/index.astro`

1. Add a clear data-backup section describing included and excluded data.
2. Download authenticated export responses as dated JSON files.
3. Let the user choose a JSON file, confirm replacement, import it, and display errors without exposing secrets.
4. Reload settings after success and retain the Pages update notice.

### Task 4: Fix and test RSS namespace

**Files:**
- Create: `apps/web/src/lib/rss.ts`
- Create: `apps/web/src/lib/rss.test.ts`
- Modify: `apps/web/src/pages/rss.xml.ts`

1. Write a failing regression test using an empty `content` string.
2. Add the standard RSS content namespace and use it in the endpoint.
3. Assert the generated XML contains both the namespace and `content:encoded`.

### Task 5: Documentation and verification

**Files:**
- Modify: `README.md`
- Modify: `docs/管理后台功能与设计文档.md`
- Modify: `docs/部署运维文档.md`
- Modify: `docs/变更记录.md`
- Modify: `openapi/nami-blog.yaml`

1. Document backup scope, restore warning, friend simplification, and RSS fix.
2. Run `git diff --check`, `pnpm check`, all tests, and a full build.
3. Parse the generated RSS and inspect the backup controls before commit and push.
