"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { readJson, type ApiErrorResult } from "@/lib/json";

type Comment = { id: number; parent_id: number | null; author_name: string; author_url: string | null; content: string; created_at: string };

export function Comments({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [reply, setReply] = useState<{ id: number; name: string } | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => { try { const response = await fetch(`/api/v1/comments/${postId}`); if (!response.ok) throw new Error(); const result = await readJson<{ data?: Comment[] }>(response); setComments(result.data || []); } catch { setComments(null); } }, [postId]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setStatus("");
    const form = new FormData(event.currentTarget);
    if (form.get("website")) { setSending(false); return; }
    const payload = { post_id: postId, parent_id: reply?.id || null, author_name: form.get("author_name"), author_email: form.get("author_email") || null, author_url: form.get("author_url") || null, content };
    try { const response = await fetch("/api/v1/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await readJson<{ data: { message: string; status: string } } & ApiErrorResult>(response); if (!response.ok) throw new Error(result.error?.message || "提交失败"); setStatus(`✓ ${result.data.message}`); setContent(""); setReply(null); if (result.data.status === "approved") await load(); }
    catch (error) { setStatus(error instanceof Error ? error.message : "提交失败，请稍后重试"); }
    finally { setSending(false); }
  }
  const roots = comments?.filter((comment) => !comment.parent_id) || [];
  const render = (comment: Comment, nested = false): React.ReactNode => <div key={comment.id} className={nested ? "ml-8 border-l-2 border-[var(--color-border)] pl-4" : "rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"}><div className="flex justify-between text-sm"><strong>{comment.author_name}</strong><time className="text-xs text-[var(--color-text-tertiary)]">{new Date(comment.created_at).toLocaleString("zh-CN")}</time></div><p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p><button type="button" onClick={() => setReply({ id: comment.id, name: comment.author_name })} className="mt-2 text-xs text-[var(--color-primary)]">回复</button><div className="mt-3 space-y-3">{comments?.filter((item) => item.parent_id === comment.id).map((child) => render(child, true))}</div></div>;
  return <section className="mx-auto mt-12 max-w-[680px] px-4"><h2 className="mb-6 text-xl font-bold">评论</h2><div className="space-y-4">{comments === null ? <p className="py-6 text-center text-sm text-[var(--color-text-tertiary)]">评论加载失败，<button onClick={() => void load()} className="text-[var(--color-primary)]">点击重试</button></p> : roots.length ? roots.map((comment) => render(comment)) : <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">还没有评论，来说两句吧。</p>}</div><form onSubmit={submit} className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm"><h3 className="font-semibold">发表评论</h3><p className="mb-5 mt-1 text-sm text-[var(--color-text-secondary)]">留下你的想法，友善交流会让这里更有温度。</p>{reply && <button type="button" onClick={() => setReply(null)} className="mb-4 rounded-lg bg-[var(--color-primary-light)] px-3 py-2 text-sm text-[var(--color-primary)]">正在回复 {reply.name} · 点击取消</button>}<div className="grid gap-4 sm:grid-cols-2"><input name="author_name" required maxLength={50} placeholder="昵称（必填）" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /><input name="author_email" type="email" maxLength={100} placeholder="邮箱（不会公开）" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /></div><input name="author_url" type="url" maxLength={200} placeholder="个人网址（选填）" className="mt-4 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /><textarea value={content} onChange={(event) => setContent(event.target.value)} required maxLength={2000} rows={4} placeholder="写下你的评论…" className="mt-4 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" /><input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden="true" /><div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]"><span>{status}</span><span>{content.length} / 2000</span></div><button disabled={sending} className="mt-4 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{sending ? "提交中…" : "提交评论"}</button></form></section>;
}
