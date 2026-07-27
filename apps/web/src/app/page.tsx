import Link from "next/link";
import { apiJson } from "@/lib/cloudflare";
import { resolveHomeContent } from "@/lib/site-content";
import type {
  ApiResponse,
  Category,
  PostSummary,
  SiteSettings,
  Tag,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postResult, categoryResult, tagResult, settingsResult] =
    await Promise.all([
      apiJson<ApiResponse<PostSummary[]>>("/api/v1/posts?limit=10"),
      apiJson<ApiResponse<Category[]>>("/api/v1/categories"),
      apiJson<ApiResponse<Tag[]>>("/api/v1/tags"),
      apiJson<ApiResponse<SiteSettings>>("/api/v1/settings"),
    ]);
  const posts = postResult.data;
  const categories = categoryResult.data;
  const tags = tagResult.data;
  const settings = settingsResult.data;
  const home = resolveHomeContent(settings);
  const featured = posts.find((post) => post.is_pinned === 1) || posts[0];
  const primaryLabel =
    settings.home_primary_label ||
    (featured ? home.primaryLabel : "浏览文章");
  const feed = posts.filter((post) => post.id !== featured?.id).slice(0, 6);
  const date = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "尚未发布";

  return (
    <>
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-70" />
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-16 lg:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            {home.eyebrow && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--color-primary)] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                {home.eyebrow}
              </p>
            )}
            <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">
              {home.title}
              <br />
              <span className="text-[var(--color-primary)]">
                {home.titleHighlight}
              </span>
            </h1>
            {home.description && (
              <p className="mt-7 max-w-xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
                {home.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={featured ? `/blog/${featured.slug}` : "/blog"}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--theme-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)]"
              >
                {primaryLabel} <span aria-hidden="true" className="ml-1">→</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)]/65 px-5 py-3 text-sm font-semibold transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {home.secondaryLabel}
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-[var(--color-border)] border-y border-[var(--color-border)] py-4">
              <div className="pr-4">
                <dt className="text-xs text-[var(--color-text-tertiary)]">
                  文章
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {postResult.meta?.total ?? posts.length}
                </dd>
              </div>
              <div className="px-4">
                <dt className="text-xs text-[var(--color-text-tertiary)]">
                  分类
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {categories.length}
                </dd>
              </div>
              <div className="pl-4">
                <dt className="text-xs text-[var(--color-text-tertiary)]">
                  标签
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {tags.length}
                </dd>
              </div>
            </dl>
          </div>

          {featured ? (
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl shadow-[var(--theme-glow)] transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]"
            >
              <div className="absolute inset-x-0 top-0 z-10 flex justify-between px-5 py-4 text-xs font-semibold text-white">
                <span className="rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">
                  本期推荐
                </span>
                <span className="rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">
                  {date(featured.published_at || featured.created_at)}
                </span>
              </div>
              {featured.cover_url ? (
                <img
                  src={featured.cover_url}
                  alt=""
                  className="h-72 w-full object-cover sm:h-96"
                />
              ) : (
                <div className="theme-header h-72 sm:h-96" />
              )}
              <div className="relative -mt-16 rounded-t-[1.5rem] bg-[var(--color-bg)] p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
                  值得慢慢读
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                    {featured.excerpt}
                  </p>
                )}
                <span className="mt-5 inline-flex text-sm font-semibold text-[var(--color-primary)]">
                  继续阅读 →
                </span>
              </div>
            </Link>
          ) : (
            <div className="theme-header flex min-h-[25rem] items-end rounded-[2rem] border p-8">
              <h2 className="font-display text-4xl font-semibold">
                下一篇故事，很快见。
              </h2>
            </div>
          )}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
              沿途新章
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              最近写了什么
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-[var(--color-text-secondary)]"
          >
            查看全部 <span aria-hidden="true">→</span>
          </Link>
        </div>
        {feed.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {feed.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex min-w-0 gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--theme-glow)]"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-bg-secondary)]">
                  {post.cover_url ? (
                    <img
                      src={post.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-4xl text-[var(--color-primary)]/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {date(post.published_at || post.created_at)}
                  </p>
                  <h3 className="mt-2 line-clamp-2 font-display text-xl font-semibold">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-10 text-center">
            <p className="font-display text-xl font-semibold">新的故事正在路上</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              第一篇文章发布后，就会出现在这里。
            </p>
          </div>
        )}
        {categories.length > 0 && (
          <div className="mt-14 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-8">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {category.name}{" "}
                <span className="text-xs opacity-60">
                  {category.post_count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
