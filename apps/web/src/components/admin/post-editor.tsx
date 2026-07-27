"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-session";
import {
  applyMarkdownAction,
  getContentStats,
  slugifyTitle,
  type MarkdownAction,
} from "@/lib/editor";
import { readJson, type ApiErrorResult } from "@/lib/json";
import { publicationMessage } from "@/lib/publication";

type Category = { id: number; name: string };
type Tag = { id: number; name: string };
type FormState = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_url: string;
  category_id: string;
  tag_ids: number[];
  is_pinned: boolean;
  is_public: boolean;
  status: string;
};
type StoredPost = {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_url?: string;
  categories?: Category[];
  tags?: Tag[];
  is_pinned?: number;
  is_public?: number;
  status?: string;
};
type MutationResult = {
  data?: { id?: number; publication?: { status?: string } };
} & ApiErrorResult;

const empty: FormState = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  cover_url: "",
  category_id: "",
  tag_ids: [],
  is_pinned: false,
  is_public: true,
  status: "draft",
};

const toolbarActions = [
  ["heading", "H2"],
  ["bold", "B"],
  ["quote", "❝"],
  ["link", "↗"],
  ["code", "</>"],
] as const;

export function PostEditor({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const params = useSearchParams();
  const id = params?.get("id");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [notice, setNotice] = useState("");
  const [saveStatus, setSaveStatus] = useState(
    mode === "edit" ? "正在载入文章…" : "尚未保存",
  );
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedDraft, setSavedDraft] = useState<FormState | null>(null);
  const hydrated = useRef(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (hydrated.current) {
      setDirty(true);
      setSaveStatus("有未保存的修改");
    }
  };

  useEffect(() => {
    Promise.all([
      adminFetch("/api/admin/categories").then((response) =>
        readJson<{ data?: Category[] }>(response),
      ),
      adminFetch("/api/admin/tags").then((response) =>
        readJson<{ data?: Tag[] }>(response),
      ),
    ]).then(([categoryResult, tagResult]) => {
      setCategories(categoryResult.data || []);
      setTags(tagResult.data || []);
    });

    if (mode === "create") {
      const raw = sessionStorage.getItem("nami-new-post-draft");
      if (raw) {
        try {
          setSavedDraft(JSON.parse(raw));
        } catch {}
      }
      hydrated.current = true;
      return;
    }

    if (!id || !/^\d+$/.test(id)) {
      setNotice("编辑地址缺少有效的文章 ID，请从文章列表重新进入。");
      return;
    }

    adminFetch(`/api/admin/posts/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("文章不存在或已经删除");
        const { data: post } = await readJson<{ data: StoredPost }>(response);
        setForm({
          title: post.title || "",
          slug: post.slug || "",
          content: post.content || "",
          excerpt: post.excerpt || "",
          cover_url: post.cover_url || "",
          category_id: String(post.categories?.[0]?.id || ""),
          tag_ids: (post.tags || []).map((tag) => tag.id),
          is_pinned: post.is_pinned === 1,
          is_public: post.is_public === 1,
          status: post.status || "draft",
        });
        hydrated.current = true;
        setSaveStatus("已载入，修改后请保存");
      })
      .catch((error) => setNotice(error.message));
  }, [id, mode]);

  useEffect(() => {
    if (mode !== "create" || !dirty) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("nami-new-post-draft", JSON.stringify(form));
      setSaveStatus(
        `已暂存 ${new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [dirty, form, mode]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        void save(mode === "create" ? "draft" : form.status);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  function markdown(action: MarkdownAction) {
    const element = textarea.current;
    if (!element) return;
    const result = applyMarkdownAction(
      form.content,
      element.selectionStart,
      element.selectionEnd,
      action,
    );
    update("content", result.value);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  async function save(status: string) {
    if (!form.title.trim()) {
      setNotice("请先填写文章标题。");
      return;
    }
    setBusy(true);
    setNotice("");
    setSaveStatus(status === "published" ? "正在发布…" : "正在保存…");
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || slugifyTitle(form.title),
      cover_url: form.cover_url.trim() || null,
      category_id: form.category_id || null,
      is_pinned: form.is_pinned ? 1 : 0,
      is_public: form.is_public ? 1 : 0,
      status,
    };
    try {
      const response = await adminFetch(
        mode === "edit" ? `/api/admin/posts/${id}` : "/api/admin/posts",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await readJson<MutationResult>(response);
      if (!response.ok) {
        throw new Error(result.error?.message || "保存失败");
      }
      setDirty(false);
      sessionStorage.removeItem("nami-new-post-draft");
      const message = publicationMessage(result.data?.publication?.status);
      setNotice(`✓ ${message}`);
      setSaveStatus(message);
      if (mode === "create" && result.data?.id) {
        router.replace(`/admin/posts/edit?id=${result.data.id}`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败");
      setSaveStatus("保存失败，页面内容仍保留");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !confirm(`确认删除文章「${form.title || "未命名文章"}」？`)) {
      return;
    }
    setBusy(true);
    const response = await adminFetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setDirty(false);
      router.replace("/admin/posts");
    } else {
      setNotice("删除失败，请稍后重试");
      setBusy(false);
    }
  }

  const stats = getContentStats(form.content);
  const field =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-base outline-none focus:border-[var(--color-primary)] sm:text-sm";

  return (
    <div className="mx-auto max-w-7xl pb-24 lg:pb-0">
      <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)] sm:text-[11px] sm:tracking-[0.24em]">
            Editorial desk
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {mode === "edit" ? "打磨这篇文章" : "写下新的故事"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Markdown 写作台 · 支持快捷格式、字数统计与离开保护
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="self-start rounded-lg py-1 text-sm text-[var(--color-text-secondary)] sm:self-auto"
        >
          ← 返回文章列表
        </Link>
      </header>

      {notice && (
        <div className="mb-5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] px-4 py-3 text-sm leading-6">
          {notice}
        </div>
      )}

      {savedDraft && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            发现当前标签页里未提交的草稿
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              onClick={() => {
                sessionStorage.removeItem("nami-new-post-draft");
                setSavedDraft(null);
              }}
              className="min-h-10 rounded-lg px-3 py-1.5 text-xs"
            >
              丢弃
            </button>
            <button
              onClick={() => {
                setForm(savedDraft);
                setSavedDraft(null);
                setDirty(true);
              }}
              className="min-h-10 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs text-white"
            >
              恢复草稿
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm">
          <input
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((current) => ({
                ...current,
                title,
                slug: current.slug || slugifyTitle(title),
              }));
              setDirty(true);
            }}
            placeholder="输入文章标题…"
            aria-label="文章标题"
            maxLength={255}
            className="w-full border-0 bg-transparent px-4 py-4 font-display text-2xl font-bold outline-none placeholder:text-[var(--color-text-tertiary)] sm:px-7 sm:py-5 sm:text-3xl"
          />
          <div className="flex items-center gap-1 overflow-x-auto border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-2 sm:px-4">
            {toolbarActions.map(([action, label]) => (
              <button
                key={action}
                type="button"
                onClick={() => markdown(action)}
                className="grid h-10 min-w-10 shrink-0 place-items-center rounded-lg text-xs hover:bg-[var(--color-bg-tertiary)]"
              >
                {label}
              </button>
            ))}
            <span className="ml-auto hidden shrink-0 text-xs text-[var(--color-text-tertiary)] sm:inline">
              ⌘/Ctrl + S 保存
            </span>
          </div>
          <textarea
            ref={textarea}
            value={form.content}
            onChange={(event) => update("content", event.target.value)}
            rows={28}
            placeholder="# 从这里开始…"
            aria-label="文章正文"
            className="min-h-[28rem] w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-base leading-7 outline-none sm:min-h-[34rem] sm:px-7 sm:py-5 sm:text-[15px]"
          />
          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-xs text-[var(--color-text-tertiary)] sm:px-7">
            <span>
              {stats.characters} 字 · 预计阅读 {stats.readingMinutes} 分钟
            </span>
            <span>Markdown</span>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold">发布设置</h3>
            {mode === "edit" && (
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
                className={`${field} mt-4`}
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="flex min-h-11 items-center rounded-xl border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(event) => update("is_pinned", event.target.checked)}
                />{" "}
                置顶
              </label>
              <label className="flex min-h-11 items-center rounded-xl border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(event) => update("is_public", event.target.checked)}
                />{" "}
                公开
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5">
            <h3 className="text-sm font-semibold">文章信息</h3>
            <input
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder="URL Slug"
              aria-label="URL Slug"
              className={field}
            />
            <textarea
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="文章摘要"
              aria-label="文章摘要"
              className={field}
            />
            <select
              value={form.category_id}
              onChange={(event) => update("category_id", event.target.value)}
              aria-label="文章分类"
              className={field}
            >
              <option value="">暂不分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="flex min-h-11 flex-wrap gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5">
              {tags.length ? (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={form.tag_ids.includes(tag.id)}
                      onChange={(event) =>
                        update(
                          "tag_ids",
                          event.target.checked
                            ? [...form.tag_ids, tag.id]
                            : form.tag_ids.filter((value) => value !== tag.id),
                        )
                      }
                    />{" "}
                    {tag.name}
                  </label>
                ))
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  暂无标签
                </span>
              )}
            </div>
            <input
              value={form.cover_url}
              onChange={(event) => update("cover_url", event.target.value)}
              placeholder="封面图 URL"
              aria-label="封面图 URL"
              className={field}
            />
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-3 bottom-2 z-30 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/94 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur sm:inset-x-6 sm:flex sm:items-center sm:justify-between lg:sticky lg:inset-x-auto lg:bottom-3 lg:mt-5">
        <p className="mb-2 min-w-0 truncate text-xs text-[var(--color-text-secondary)] sm:mb-0 sm:text-sm">
          {saveStatus}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {mode === "edit" ? (
            <>
              <button
                disabled={busy}
                onClick={() => void remove()}
                className="min-h-11 rounded-xl px-4 py-2.5 text-sm text-[var(--color-danger)] disabled:opacity-50"
              >
                删除
              </button>
              <button
                disabled={busy}
                onClick={() => void save(form.status)}
                className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                保存修改
              </button>
            </>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => void save("draft")}
                className="min-h-11 rounded-xl border px-4 py-2.5 text-sm disabled:opacity-50"
              >
                保存草稿
              </button>
              <button
                disabled={busy}
                onClick={() => void save("published")}
                className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                发布文章
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
