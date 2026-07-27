"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-session";
import { readJson } from "@/lib/json";

type Comment = {
  id: number;
  author_name: string;
  author_email?: string;
  content: string;
  status: string;
  created_at: string;
  post_title: string;
};
type CommentResult = {
  data: Comment[];
  meta: { total: number; limit: number };
};

const filters = [
  ["all", "全部"],
  ["pending", "待审核"],
  ["approved", "已批准"],
] as const;

function CommentList() {
  const params = useSearchParams();
  const tab = params?.get("tab") || "all";
  const page = Number(params?.get("page") || 1);
  const [result, setResult] = useState<CommentResult | null>(null);

  const load = useCallback(() => {
    const query = new URLSearchParams({ page: String(page) });
    if (tab !== "all") query.set("status", tab);
    adminFetch(`/api/admin/comments?${query}`)
      .then((response) => readJson<CommentResult>(response))
      .then(setResult);
  }, [page, tab]);

  useEffect(load, [load]);

  async function act(
    id: number,
    action: "approved" | "rejected" | "delete",
  ) {
    if (action === "delete" && !confirm("确认删除这条评论？")) return;
    const response = await adminFetch(
      action === "delete"
        ? `/api/admin/comments/${id}`
        : `/api/admin/comments/${id}/status`,
      {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:
          action === "delete" ? undefined : JSON.stringify({ status: action }),
      },
    );
    if (!response.ok) return alert("操作失败");
    load();
  }

  const pages = Math.ceil(
    (result?.meta.total || 0) / (result?.meta.limit || 20),
  );

  return (
    <div>
      <nav
        className="flex gap-1 overflow-x-auto rounded-xl bg-[var(--color-bg-tertiary)] p-1"
        aria-label="评论状态筛选"
      >
        {filters.map(([value, label]) => (
          <Link
            key={value}
            href={
              value === "all" ? "/admin/comments" : `/admin/comments?tab=${value}`
            }
            className={`shrink-0 rounded-lg px-3 py-2 text-sm ${tab === value ? "bg-[var(--color-primary)] font-medium text-white" : "text-[var(--color-text-secondary)]"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        {!result ? (
          <p className="py-12 text-center">加载中…</p>
        ) : result.data.length ? (
          result.data.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                <div className="min-w-0">
                  <strong>{comment.author_name}</strong>
                  <span className="ml-2 rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs">
                    {comment.status}
                  </span>
                </div>
                <time className="text-xs text-[var(--color-text-tertiary)]">
                  {new Date(comment.created_at).toLocaleString("zh-CN")}
                </time>
              </div>
              <p className="mt-3 break-words text-sm leading-6">
                {comment.content}
              </p>
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 break-words">
                  文章：
                  <span className="text-[var(--color-primary)]">
                    {comment.post_title}
                  </span>
                </span>
                <div className="flex min-h-10 items-center justify-end gap-1">
                  {comment.status !== "approved" && (
                    <button
                      onClick={() => void act(comment.id, "approved")}
                      className="rounded-lg px-3 py-2 text-[var(--color-success)]"
                    >
                      批准
                    </button>
                  )}
                  {comment.status !== "rejected" && (
                    <button
                      onClick={() => void act(comment.id, "rejected")}
                      className="rounded-lg px-3 py-2 text-[var(--color-warning)]"
                    >
                      拒绝
                    </button>
                  )}
                  <button
                    onClick={() => void act(comment.id, "delete")}
                    className="rounded-lg px-3 py-2 text-[var(--color-danger)]"
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-12 text-center">
            暂无评论
          </p>
        )}
      </div>

      {result && pages > 1 && (
        <div className="mt-4 flex flex-col gap-3 text-sm min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
          <span>
            共 {result.meta.total} 条，第 {page}/{pages} 页
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/comments?page=${page - 1}&tab=${tab}`}
                className="rounded-lg border px-3 py-2"
              >
                上一页
              </Link>
            )}
            {page < pages && (
              <Link
                href={`/admin/comments?page=${page + 1}&tab=${tab}`}
                className="rounded-lg border px-3 py-2"
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

export default function CommentsPage() {
  return (
    <Suspense fallback={<p>加载中…</p>}>
      <CommentList />
    </Suspense>
  );
}
