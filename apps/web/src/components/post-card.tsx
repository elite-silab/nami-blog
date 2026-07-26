import Link from "next/link";
import type { PostSummary } from "@/lib/types";

export function PostCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  const date = new Date(post.published_at || post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--theme-glow)]">
      <div className="flex gap-5">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-bg-secondary)] sm:h-32 sm:w-32">
          {post.cover_url ? <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="font-display text-4xl text-[var(--color-primary)]/30">{String(index + 1).padStart(2, "0")}</span>}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">{post.is_pinned === 1 && <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-1 font-semibold text-[var(--color-primary)]">📌 置顶</span>}<time dateTime={post.published_at || post.created_at}>{date}</time></div>
          <h2 className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-tight tracking-[-0.015em] group-hover:text-[var(--color-primary)]">{post.title}</h2>
          {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{post.excerpt}</p>}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] opacity-0 transition group-hover:opacity-100">阅读全文 →</span>
        </div>
      </div>
    </Link>
  );
}
