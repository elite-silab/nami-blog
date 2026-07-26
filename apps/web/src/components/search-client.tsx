"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiResponse, PostSummary } from "@/lib/types";
export function SearchClient() {
  const params = useSearchParams();
  const initialQuery = params?.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const search = useCallback(async (value: string) => {
    if (!value.trim()) { setPosts([]); return; }
    setLoading(true); setError("");
    try { const response = await fetch(`/api/v1/posts?q=${encodeURIComponent(value)}&limit=50`); if (!response.ok) throw new Error(); const result = await response.json() as ApiResponse<PostSummary[]>; setPosts(result.data); window.history.replaceState(null, "", `/search?q=${encodeURIComponent(value)}`); }
    catch { setError("搜索失败，请稍后重试"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (initialQuery) void search(initialQuery); }, [initialQuery, search]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === "k") { event.preventDefault(); document.getElementById("search-input")?.focus(); } }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, []);
  function submit(event: FormEvent) { event.preventDefault(); void search(query); }
  return <><form onSubmit={submit} className="mt-6 flex gap-2"><input id="search-input" value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm" placeholder="输入关键词搜索…" aria-label="搜索关键词" /><button disabled={loading} className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "搜索中…" : "搜索"}</button></form><div className="mt-8" aria-live="polite">{error && <p className="text-center text-[var(--color-danger)]">{error}</p>}{posts?.length === 0 && <p className="py-12 text-center text-[var(--color-text-secondary)]">没有找到相关文章</p>}{posts && posts.length > 0 && <div className="space-y-4">{posts.map((post) => <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]"><h2 className="text-lg font-semibold">{post.title}</h2>{post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{post.excerpt}</p>}</Link>)}</div>}</div></>;
}
