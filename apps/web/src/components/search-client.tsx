"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiResponse, PostSummary } from "@/lib/types";

export function SearchClient() {
  const params = useSearchParams();
  const initialQuery = params?.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const search = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setPosts(null);
      setSearchedQuery("");
      setError("");
      window.history.replaceState(null, "", "/search");
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setSearchedQuery(normalized);
    try {
      const response = await fetch(
        `/api/v1/posts?q=${encodeURIComponent(normalized)}&limit=50`,
      );
      if (!response.ok) throw new Error();
      const result = (await response.json()) as ApiResponse<PostSummary[]>;
      if (currentRequest !== requestId.current) return;
      setPosts(result.data);
      window.history.replaceState(
        null,
        "",
        `/search?q=${encodeURIComponent(normalized)}`,
      );
    } catch {
      if (currentRequest === requestId.current) {
        setError("搜索暂时没有回应，请稍后再试。");
        setPosts(null);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) void search(initialQuery);
  }, [initialQuery, search]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void search(query);
  }

  return (
    <>
      <form
        onSubmit={submit}
        role="search"
        className="mt-8 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-xl shadow-[var(--theme-glow)] sm:flex sm:gap-3"
      >
        <label htmlFor="search-input" className="sr-only">
          文章关键词
        </label>
        <input
          id="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-12 w-full min-w-0 rounded-xl border border-transparent bg-[var(--color-bg-secondary)] px-4 text-base placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] sm:flex-1"
          placeholder="例如：Cloudflare、阅读、写作…"
          autoComplete="off"
        />
        <button
          disabled={loading || !query.trim()}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
        >
          {loading ? "正在查找…" : "搜索文章"}
        </button>
      </form>
      <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
        提示：按 <kbd className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono">Ctrl / ⌘ + K</kbd> 可快速聚焦搜索框。
      </p>

      <div className="mt-10" aria-live="polite" aria-busy={loading}>
        {error && (
          <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-bg)] px-5 py-8 text-center">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
            <button
              type="button"
              onClick={() => void search(query)}
              className="mt-4 text-sm font-semibold text-[var(--color-primary)]"
            >
              重新搜索
            </button>
          </div>
        )}
        {!error && posts?.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-6 py-12 text-center">
            <h2 className="font-display text-xl font-semibold">还没找到相关文章</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              试试更短的关键词，或者去文章归档慢慢逛。
            </p>
            <Link
              href="/blog"
              className="mt-5 inline-flex min-h-10 items-center rounded-full border border-[var(--color-border-strong)] px-4 text-sm font-semibold text-[var(--color-primary)]"
            >
              查看全部文章 →
            </Link>
          </div>
        )}
        {!error && posts && posts.length > 0 && (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold">搜索结果</h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                “{searchedQuery}”找到 {posts.length} 篇
              </p>
            </div>
            <div className="space-y-3">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex min-w-0 gap-4 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--theme-glow)]"
                >
                  <span className="font-display text-2xl text-[var(--color-primary)]/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-display text-xl font-semibold group-hover:text-[var(--color-primary)]">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-[var(--color-text-secondary)]">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="hidden self-center text-[var(--color-primary)] sm:block" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
