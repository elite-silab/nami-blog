import Link from "next/link";
import { PostCard } from "@/components/post-card";
import type { PostSummary } from "@/lib/types";

export function BlogArchive({ posts, page, total }: { posts: PostSummary[]; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / 10));
  const pageHref = (value: number) => value === 1 ? "/blog" : `/blog/page/${value}`;
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">The archive · page {page}</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">全部文章</h1><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)]">按时间整理的技术实践、阅读笔记与生活观察。慢慢读，不必一次看完。</p></div>
        <Link href="/search" className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">搜索文章 ↗</Link>
      </div>
      {posts.length ? <div className="mt-8 grid gap-4 lg:grid-cols-2">{posts.map((post, index) => <PostCard key={post.id} post={post} index={(page - 1) * 10 + index} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] p-10 text-center"><p className="font-display text-2xl">暂无文章</p><p className="mt-2 text-sm text-[var(--color-text-secondary)]">发布第一篇公开文章后，它会立即出现在这里。</p></div>}
      {pages > 1 && <nav aria-label="文章分页" className="mt-12 flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">← 上一页</Link> : <span className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm opacity-40">← 上一页</span>}
        {Array.from({ length: pages }, (_, index) => index + 1).map((value) => value === page ? <span key={value} className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white">{value}</span> : <Link key={value} href={pageHref(value)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-primary)]">{value}</Link>)}
        {page < pages ? <Link href={pageHref(page + 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">下一页 →</Link> : <span className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm opacity-40">下一页 →</span>}
      </nav>}
      <p className="mt-5 text-center text-xs text-[var(--color-text-tertiary)]">第 {page} / {pages} 页，共 {total} 篇文章</p>
    </section>
  );
}
