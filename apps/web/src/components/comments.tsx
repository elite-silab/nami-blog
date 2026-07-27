"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { readJson, type ApiErrorResult } from "@/lib/json";

type Comment = {
  id: number;
  parent_id: number | null;
  author_name: string;
  author_url: string | null;
  content: string;
  created_at: string;
};

export function Comments({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [reply, setReply] = useState<{ id: number; name: string } | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/comments/${postId}`);
      if (!response.ok) throw new Error();
      const result = await readJson<{ data?: Comment[] }>(response);
      setComments(result.data || []);
    } catch {
      setComments(null);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      setSending(false);
      return;
    }
    const payload = {
      post_id: postId,
      parent_id: reply?.id || null,
      author_name: form.get("author_name"),
      author_email: form.get("author_email") || null,
      author_url: form.get("author_url") || null,
      content,
    };
    try {
      const response = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await readJson<
        { data: { message: string; status: string } } & ApiErrorResult
      >(response);
      if (!response.ok) {
        throw new Error(result.error?.message || "提交失败");
      }
      setStatus(`✓ ${result.data.message}`);
      setContent("");
      setReply(null);
      if (result.data.status === "approved") await load();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "提交失败，请稍后重试",
      );
    } finally {
      setSending(false);
    }
  }

  const roots = comments?.filter((comment) => !comment.parent_id) || [];
  const render = (comment: Comment, nested = false): React.ReactNode => (
    <div
      key={comment.id}
      className={
        nested
          ? "ml-3 border-l-2 border-[var(--color-border)] pl-3 sm:ml-8 sm:pl-4"
          : "rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <strong>{comment.author_name}</strong>
        <time
          className="text-xs text-[var(--color-text-tertiary)]"
          dateTime={comment.created_at}
        >
          {new Date(comment.created_at).toLocaleString("zh-CN")}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
        {comment.content}
      </p>
      <button
        type="button"
        onClick={() => setReply({ id: comment.id, name: comment.author_name })}
        className="mt-3 text-xs font-semibold text-[var(--color-primary)]"
      >
        回复这条评论
      </button>
      <div className="mt-3 space-y-3">
        {comments
          ?.filter((item) => item.parent_id === comment.id)
          .map((child) => render(child, true))}
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pb-20">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
            留下你的声音
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            评论与交流
          </h2>
        </div>
        {comments && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {comments.length} 条评论
          </span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {comments === null ? (
          <div className="rounded-[1.25rem] border border-dashed border-[var(--color-border-strong)] py-8 text-center text-sm text-[var(--color-text-tertiary)]">
            评论暂时没有加载成功，
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold text-[var(--color-primary)]"
            >
              点击重试
            </button>
          </div>
        ) : roots.length ? (
          roots.map((comment) => render(comment))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-[var(--color-border-strong)] py-8 text-center">
            <p className="font-display text-lg font-semibold">还没有评论</p>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
              如果你愿意，就来留下第一个想法吧。
            </p>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-xl shadow-[var(--theme-glow)] sm:p-7"
      >
        <h3 className="font-display text-xl font-semibold">写下你的想法</h3>
        <p className="mb-5 mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
          留下真诚、友善的评论，让这里多一点交流的温度。
        </p>
        {reply && (
          <button
            type="button"
            onClick={() => setReply(null)}
            className="mb-4 rounded-xl bg-[var(--color-primary-light)] px-3 py-2 text-sm text-[var(--color-primary)]"
          >
            正在回复 {reply.name} · 点击取消
          </button>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="author_name" required maxLength={50} placeholder="昵称（必填）" aria-label="昵称" className="public-input" />
          <input name="author_email" type="email" maxLength={100} placeholder="邮箱（不会公开）" aria-label="邮箱" className="public-input" />
        </div>
        <input name="author_url" type="url" maxLength={200} placeholder="个人网址（选填）" aria-label="个人网址" className="public-input mt-4 w-full" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} required maxLength={2000} rows={5} placeholder="写下你的评论…" aria-label="评论内容" className="public-input mt-4 w-full resize-y" />
        <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden="true" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]" aria-live="polite">
          <span>{status}</span>
          <span>{content.length} / 2000</span>
        </div>
        <button disabled={sending} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
          {sending ? "正在提交…" : "提交评论"}
        </button>
      </form>
    </section>
  );
}
