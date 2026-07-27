"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-session";
import { readJson, type ApiErrorResult } from "@/lib/json";

type Post = {
  id: number;
  title: string;
  status: string;
  is_pinned: number;
  view_count: number;
  updated_at: string;
};
type PostsResult = {
  data: Post[];
  meta: { total: number; limit: number };
};

const statusOptions = [
  ["", "全部"],
  ["published", "已发布"],
  ["draft", "草稿"],
] as const;
const statusLabels: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  archived: "已归档",
};

function PostsList() {
  const params = useSearchParams();
  const status = params?.get("status") || "";
  const page = Number(params?.get("page") || 1);
  const [result, setResult] = useState<PostsResult | null>(null);

  const load = useCallback(() => {
    const query = new URLSearchParams({ page: String(page) });
    if (status) query.set("status", status);
    adminFetch(`/api/admin/posts?${query}`)
      .then((response) => readJson<PostsResult>(response))
      .then(setResult);
  }, [page, status]);

  useEffect(load, [load]);

  async function remove(post: Post) {
    if (!confirm(`确认删除文章「${post.title}」？`)) return;
    const response = await adminFetch(`/api/admin/posts/${post.id}`, {
      method: "DELETE",
    });
    const data = await readJson<ApiErrorResult>(response);
    if (!response.ok) return alert(data.error?.message || "删除失败");
    load();
  }

  const totalPages = Math.ceil(
    (result?.meta.total || 0) / (result?.meta.limit || 20),
  );
  const pageHref = (target: number) =>
    `/admin/posts?page=${target}${status ? `&status=${status}` : ""}`;

  return (
    <div>
      <div className="flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
        <nav
          className="flex min-w-0 gap-1 overflow-x-auto rounded-xl bg-[var(--color-bg-tertiary)] p-1"
          aria-label="文章状态筛选"
        >
          {statusOptions.map(([value, label]) => (
            <Link
              key={value}
              href={value ? `/admin/posts?status=${value}` : "/admin/posts"}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm ${status === value ? "bg-[var(--color-primary)] font-medium text-white" : "text-[var(--color-text-secondary)]"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/admin/posts/new"
          className="min-h-11 shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-white"
        >
          + 新建文章
        </Link>
      </div>

      <div className="mt-4">
        {!result ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-12 text-center text-sm">
            加载中…
          </p>
        ) : result.data.length ? (
          <>
            <div className="space-y-3 md:hidden">
              {result.data.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 break-words font-semibold leading-6">
                      {post.is_pinned ? "📌 " : ""}
                      {post.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-xs">
                      {statusLabels[post.status] || post.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--color-text-secondary)]">
                    <div>
                      <dt className="text-[var(--color-text-tertiary)]">浏览量</dt>
                      <dd className="mt-1 text-sm text-[var(--color-text)]">
                        {post.view_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--color-text-tertiary)]">更新时间</dt>
                      <dd className="mt-1 text-sm text-[var(--color-text)]">
                        {new Date(post.updated_at).toLocaleDateString("zh-CN")}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                    <Link
                      href={`/admin/posts/edit?id=${post.id}`}
                      className="min-h-10 rounded-lg px-3 py-2.5 text-sm text-[var(--color-primary)]"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => void remove(post)}
                      className="min-h-10 rounded-lg px-3 text-sm text-[var(--color-danger)]"
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-[var(--color-bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left">标题</th>
                    <th className="px-4 py-3 text-left">状态</th>
                    <th className="px-4 py-3 text-left">浏览</th>
                    <th className="px-4 py-3 text-left">更新时间</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {result.data.map((post) => (
                    <tr key={post.id}>
                      <td className="px-4 py-3 font-medium">
                        {post.is_pinned ? "📌 " : ""}
                        {post.title}
                      </td>
                      <td className="px-4 py-3">
                        {statusLabels[post.status] || post.status}
                      </td>
                      <td className="px-4 py-3">{post.view_count}</td>
                      <td className="px-4 py-3">
                        {new Date(post.updated_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/posts/edit?id=${post.id}`}
                          className="text-[var(--color-primary)]"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => void remove(post)}
                          className="ml-3 text-[var(--color-danger)]"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-12 text-center text-[var(--color-text-tertiary)]">
            暂无文章
          </p>
        )}
      </div>

      {result && totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 text-sm min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
          <span>
            共 {result.meta.total} 篇，第 {page}/{totalPages} 页
          </span>
          <div className="grid grid-cols-2 gap-2 min-[360px]:flex">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border px-3 py-2 text-center"
              >
                上一页
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border px-3 py-2 text-center"
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<p>加载中…</p>}>
      <PostsList />
    </Suspense>
  );
}
