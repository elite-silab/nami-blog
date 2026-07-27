"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-session";
import { readJson } from "@/lib/json";

type Dashboard = {
  posts: { published: number; draft: number };
  comments: { total: number; pending: number };
  views: { total: number };
  taxonomies: { categories: number; tags: number };
  recentPosts: Array<{
    id: number;
    title: string;
    status: string;
    updated_at: string;
  }>;
  recentComments: Array<{
    id: number;
    author_name: string;
    content: string;
    post_title: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard")
      .then((response) => readJson<{ data: Dashboard }>(response))
      .then((result) => setData(result.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
        加载中…
      </p>
    );
  }

  const cards = [
    [
      "文章总数",
      data.posts.published + data.posts.draft,
      `已发布 ${data.posts.published} · 草稿 ${data.posts.draft}`,
    ],
    [
      "评论总数",
      data.comments.total,
      `${data.comments.pending} 条待审核`,
    ],
    ["总浏览量", data.views.total.toLocaleString("zh-CN"), "公开文章累计阅读"],
    [
      "分类与标签",
      data.taxonomies.categories + data.taxonomies.tags,
      `${data.taxonomies.categories} 个分类 · ${data.taxonomies.tags} 个标签`,
    ],
  ];

  const shortcuts = [
    ["/admin/posts/new", "📝", "写新文章"],
    ["/admin/comments", "💬", "审核评论"],
    ["/admin/friends", "🔗", "友链管理"],
  ];

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="grid gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map(([title, value, note]) => (
          <div
            key={title}
            className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5"
          >
            <p className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
              {title}
            </p>
            <p className="mt-1 truncate text-2xl font-bold sm:text-3xl">
              {value}
            </p>
            <p className="mt-2 truncate text-[11px] text-[var(--color-text-tertiary)] sm:text-xs">
              {note}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">快捷操作</h2>
        <div className="mt-4 grid gap-2 min-[360px]:grid-cols-3 sm:gap-4">
          {shortcuts.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-16 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 hover:border-[var(--color-primary)] sm:min-h-0 sm:gap-3 sm:p-4"
            >
              <span className="text-xl sm:text-2xl" aria-hidden="true">
                {icon}
              </span>
              <strong className="text-sm sm:text-base">{label}</strong>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <h3 className="border-b border-[var(--color-border)] px-4 py-3 font-semibold sm:px-5 sm:py-4">
            最近文章
          </h3>
          <div className="divide-y divide-[var(--color-border)]">
            {data.recentPosts.length ? (
              data.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm sm:px-5"
                >
                  <span className="min-w-0 break-words">{post.title}</span>
                  <time className="shrink-0 text-xs text-[var(--color-text-tertiary)]">
                    {new Date(post.updated_at).toLocaleDateString("zh-CN")}
                  </time>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm">暂无文章</p>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <h3 className="border-b border-[var(--color-border)] px-4 py-3 font-semibold sm:px-5 sm:py-4">
            待审核评论
          </h3>
          <div className="divide-y divide-[var(--color-border)]">
            {data.recentComments.length ? (
              data.recentComments.map((comment) => (
                <div key={comment.id} className="px-4 py-3 text-sm sm:px-5">
                  <p className="break-words">
                    <strong>{comment.author_name}</strong> 在{" "}
                    <span className="text-[var(--color-primary)]">
                      {comment.post_title}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-[var(--color-text-secondary)]">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm">暂无待审核评论</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
