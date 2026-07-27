import Link from "next/link";
import { PostCard } from "@/components/post-card";
import type { PostSummary } from "@/lib/types";

export function TaxonomyPage({
  kind,
  name,
  posts,
}: {
  kind: string;
  name: string;
  posts: PostSummary[];
}) {
  return (
    <section className="relative mx-auto min-h-[calc(100dvh-12rem)] max-w-6xl overflow-hidden px-4 py-12 sm:py-16">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <Link
        href="/blog"
        className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        ← 回到全部文章
      </Link>
      <header className="mt-7 border-b border-[var(--color-border)] pb-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
          按{kind}阅读
        </p>
        <h1 className="mt-3 break-words font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {name}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          这条航线上共收录 {posts.length} 篇文章
        </p>
      </header>
      {posts.length ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-6 py-14 text-center">
          <h2 className="font-display text-xl font-semibold">这条航线还是空的</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            有相关文章发布后，就会出现在这里。
          </p>
        </div>
      )}
    </section>
  );
}
