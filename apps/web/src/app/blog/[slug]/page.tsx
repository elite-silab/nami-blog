import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeSlugParam } from "@nami/shared/slug";
import { ShareButton, ViewCounter } from "@/components/article-enhancements";
import { Comments } from "@/components/comments";
import { fetchInternalApi } from "@/lib/cloudflare";
import { renderMarkdown } from "@/lib/markdown";
import { getPublicSettings } from "@/lib/site-settings";
import type { ApiResponse, PostDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const decodedSlug = decodeSlugParam(slug);
  const response = await fetchInternalApi(
    `/api/v1/posts/${encodeURIComponent(decodedSlug)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`文章读取失败：${response.status}`);
  return ((await response.json()) as ApiResponse<PostDetail>).data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await getPost(slug);
  if (!post) return { title: "文章不存在" };
  return {
    title: post.title,
    description: post.excerpt || post.title,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || post.title,
      publishedTime: post.published_at || post.created_at,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const [post, settings] = await Promise.all([
    getPost(slug),
    getPublicSettings(),
  ]);
  if (!post) notFound();

  const displayDate = post.published_at || post.created_at;
  const date = new Date(displayDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const contentHtml = renderMarkdown(post.content);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://nami-blog.codeelite.workers.dev";

  return (
    <>
      <article className="relative overflow-hidden pb-8">
        <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] opacity-60" />
        <header className="mx-auto max-w-4xl px-4 pb-9 pt-10 text-center sm:pb-12 sm:pt-16">
          <Link
            href="/blog"
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <span aria-hidden="true" className="mr-1">←</span> 回到全部文章
          </Link>
          <h1 className="mx-auto mt-7 max-w-3xl break-words font-display text-4xl font-semibold leading-[1.15] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              {post.excerpt}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[var(--color-text-tertiary)]">
            <time dateTime={displayDate}>{date}</time>
            <span aria-hidden="true">·</span>
            <span>{post.word_count || "—"} 字</span>
            <span aria-hidden="true">·</span>
            <span>
              <ViewCounter slug={post.slug} initialViews={post.view_count} /> 次阅读
            </span>
          </div>
          {(post.categories?.length > 0 || post.tags?.length > 0) && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {post.categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog/category/${category.slug}`}
                  className="rounded-full bg-[var(--color-primary-light)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:brightness-95"
                >
                  {category.name}
                </Link>
              ))}
              {post.tags?.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {post.cover_url && (
          <div className="mx-auto max-w-5xl px-4">
            <img
              src={post.cover_url}
              alt={post.title}
              className="aspect-[16/9] w-full rounded-[1.5rem] border border-[var(--color-border)] object-cover shadow-2xl shadow-[var(--theme-glow)] sm:rounded-[2rem]"
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4 pb-4 pt-10 sm:pt-14">
          <div
            id="post-content"
            className="prose"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <div className="mt-12 flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-display text-lg font-semibold">把这篇文章分享给朋友</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                如果它对你有帮助，也许也会帮到别人。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareButton />
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${siteUrl}/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 text-sm font-semibold transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                分享到 X
              </a>
            </div>
          </div>

          {(post.prev || post.next) && (
            <nav
              aria-label="相邻文章"
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              {post.prev ? (
                <Link
                  href={`/blog/${post.prev.slug}`}
                  className="group min-w-0 rounded-[1.25rem] border border-[var(--color-border)] p-5 transition hover:border-[var(--color-primary)]"
                >
                  <small className="text-[var(--color-text-tertiary)]">← 上一篇</small>
                  <div className="mt-2 line-clamp-2 break-words font-display text-lg font-semibold group-hover:text-[var(--color-primary)]">
                    {post.prev.title}
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {post.next && (
                <Link
                  href={`/blog/${post.next.slug}`}
                  className="group min-w-0 rounded-[1.25rem] border border-[var(--color-border)] p-5 text-left transition hover:border-[var(--color-primary)] sm:text-right"
                >
                  <small className="text-[var(--color-text-tertiary)]">下一篇 →</small>
                  <div className="mt-2 line-clamp-2 break-words font-display text-lg font-semibold group-hover:text-[var(--color-primary)]">
                    {post.next.title}
                  </div>
                </Link>
              )}
            </nav>
          )}
        </div>
      </article>
      {settings.comment_enabled !== false && <Comments postId={post.id} />}
    </>
  );
}
