import Link from "next/link";
import { PostCard } from "@/components/post-card";
import type { PostSummary } from "@/lib/types";

export function BlogArchive({
  posts,
  page,
  total,
}: {
  posts: PostSummary[];
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / 10));
  const pageHref = (value: number) =>
    value === 1 ? "/blog" : `/blog/page/${value}`;

  return (
    <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-12 sm:py-16">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-60" />
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8 sm:pb-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
            第 {page} 页 · 共 {total} 篇
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            所有文章，
            <span className="text-[var(--color-primary)]">按时间靠岸。</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            这里收录技术实践、阅读笔记与生活观察。挑一篇感兴趣的，慢慢读就好。
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          搜索文章 <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      </header>

      {posts.length ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={(page - 1) * 10 + index}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold">还没有文章靠岸</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            第一篇公开文章发布后，就会立即出现在这里。
          </p>
        </div>
      )}

      {pages > 1 && (
        <nav
          aria-label="文章分页"
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="archive-page-link">
              ← 上一页
            </Link>
          ) : (
            <span className="archive-page-link cursor-not-allowed opacity-40">
              ← 上一页
            </span>
          )}
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (value) =>
              value === page ? (
                <span
                  key={value}
                  aria-current="page"
                  className="grid min-h-10 min-w-10 place-items-center rounded-full bg-[var(--color-primary)] px-3 text-sm font-semibold text-white"
                >
                  {value}
                </span>
              ) : (
                <Link
                  key={value}
                  href={pageHref(value)}
                  className="grid min-h-10 min-w-10 place-items-center rounded-full border border-[var(--color-border)] px-3 text-sm transition hover:border-[var(--color-primary)]"
                >
                  {value}
                </Link>
              ),
          )}
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="archive-page-link">
              下一页 →
            </Link>
          ) : (
            <span className="archive-page-link cursor-not-allowed opacity-40">
              下一页 →
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
