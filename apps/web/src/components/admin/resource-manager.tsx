"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-session";
import { slugifyTitle } from "@/lib/editor";
import { readJson, type ApiErrorResult } from "@/lib/json";
import { publicationMessage } from "@/lib/publication";

type Kind = "categories" | "tags" | "friends";
type Row = Record<string, unknown> & {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  post_count?: number;
  color?: string;
  url?: string;
  avatar_url?: string;
  sort_order?: number;
};

const labels = { categories: "分类", tags: "标签", friends: "友链" };
const defaults = {
  categories: { name: "", slug: "", description: "", sort_order: 0 },
  tags: { name: "", slug: "", color: "#3b82f6" },
  friends: { name: "", url: "", avatar_url: "", description: "" },
};
type MutationResult = {
  data?: { publication?: { status?: string } };
} & ApiErrorResult;

function Detail({ kind, row }: { kind: Kind; row: Row }) {
  if (kind === "tags") {
    return (
      <span className="inline-flex items-center gap-2">
        <i
          className="h-3 w-3 rounded-full"
          style={{ background: row.color || "#3b82f6" }}
        />
        {row.color}
      </span>
    );
  }
  return <>{row.description || "暂无描述"}</>;
}

export function ResourceManager({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [notice, setNotice] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function openEditor(row: Partial<Row>) {
    setSlugManuallyEdited(Boolean(row.id));
    setEditing(row);
  }

  const load = useCallback(async () => {
    const response = await adminFetch(`/api/admin/${kind}`);
    const result = await readJson<{ data?: Row[] }>(response);
    setRows(response.ok ? result.data || [] : []);
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      payload[key] = key === "sort_order" ? Number(value) || 0 : value || null;
    }
    if (kind !== "friends") {
      payload.slug = slugifyTitle(String(payload.slug || payload.name || ""));
      if (!payload.slug) return alert("请填写有效的 Slug。");
    }
    const response = await adminFetch(
      `/api/admin/${kind}${editing?.id ? `/${editing.id}` : ""}`,
      {
        method: editing?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = await readJson<MutationResult>(response);
    if (!response.ok) return alert(result.error?.message || "保存失败");
    setNotice(publicationMessage(result.data?.publication?.status));
    setEditing(null);
    await load();
  }

  async function remove(row: Row) {
    if (kind === "categories" && Number(row.post_count) > 0) {
      return alert(`分类「${row.name}」下仍有文章，请先迁移文章`);
    }
    if (!confirm(`确认删除${labels[kind]}「${row.name}」？`)) return;
    const response = await adminFetch(`/api/admin/${kind}/${row.id}`, {
      method: "DELETE",
    });
    const result = await readJson<MutationResult>(response);
    if (!response.ok) return alert(result.error?.message || "删除失败");
    setNotice(publicationMessage(result.data?.publication?.status));
    await load();
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-base sm:text-sm";

  return (
    <div>
      <div className="flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{labels[kind]}列表</h2>
          {notice && (
            <p className="mt-1 text-sm text-[var(--color-success)]">
              ✓ {notice}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => openEditor(defaults[kind])}
          className="min-h-11 shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          + 新建{labels[kind]}
        </button>
      </div>

      <div className="mt-4">
        {rows === null ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-12 text-center text-sm text-[var(--color-text-tertiary)]">
            加载中…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-12 text-center text-[var(--color-text-tertiary)]">
            暂无{labels[kind]}
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{row.name}</h3>
                      <p className="mt-1 break-all text-xs text-[var(--color-text-tertiary)]">
                        {kind === "friends" ? row.url : row.slug}
                      </p>
                    </div>
                    {kind !== "friends" && (
                      <span className="shrink-0 rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-xs">
                        {row.post_count || 0} 篇
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    <Detail kind={kind} row={row} />
                  </p>
                  <div className="mt-4 flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                    <button
                      onClick={() => openEditor(row)}
                      className="min-h-10 rounded-lg px-3 text-sm text-[var(--color-primary)]"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => void remove(row)}
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
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left">名称</th>
                    <th className="px-4 py-3 text-left">
                      {kind === "friends" ? "URL" : "Slug"}
                    </th>
                    <th className="px-4 py-3 text-left">
                      {kind === "tags" ? "颜色" : "描述"}
                    </th>
                    {kind !== "friends" && (
                      <th className="px-4 py-3 text-center">文章数</th>
                    )}
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {kind === "friends" ? row.url : row.slug}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        <Detail kind={kind} row={row} />
                      </td>
                      {kind !== "friends" && (
                        <td className="px-4 py-3 text-center">
                          {row.post_count || 0}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditor(row)}
                          className="text-[var(--color-primary)]"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => void remove(row)}
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
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <form
            onSubmit={save}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)] sm:text-xs">
                  Content manager
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  {editing.id ? "编辑" : "新建"}
                  {labels[kind]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-xl"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <label className="block text-sm font-medium">
              名称 *
              <input
                name="name"
                required
                value={String(editing.name || "")}
                onChange={(event) => {
                  const name = event.target.value;
                  setEditing((current) =>
                    current
                      ? {
                          ...current,
                          name,
                          ...(!slugManuallyEdited && kind !== "friends"
                            ? { slug: slugifyTitle(name) }
                            : {}),
                        }
                      : current,
                  );
                }}
                autoFocus
                className={field}
              />
            </label>
            {kind !== "friends" && (
              <label className="block text-sm font-medium">
                Slug *
                <input
                  name="slug"
                  required
                  value={String(editing.slug || "")}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setEditing((current) =>
                      current ? { ...current, slug: event.target.value } : current,
                    );
                  }}
                  className={field}
                />
                <small className="text-[var(--color-text-tertiary)]">
                  名称会自动转为小写拼音，例如 dev-log
                </small>
              </label>
            )}
            {kind === "categories" && (
              <>
                <label className="block text-sm font-medium">
                  描述
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={String(editing.description || "")}
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  排序权重
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={Number(editing.sort_order || 0)}
                    className={field}
                  />
                </label>
              </>
            )}
            {kind === "tags" && (
              <label className="block text-sm font-medium">
                颜色
                <input
                  name="color"
                  type="color"
                  defaultValue={String(editing.color || "#3b82f6")}
                  className={`${field} h-11`}
                />
              </label>
            )}
            {kind === "friends" && (
              <>
                <label className="block text-sm font-medium">
                  URL *
                  <input
                    name="url"
                    type="url"
                    required
                    defaultValue={String(editing.url || "")}
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  头像 URL
                  <input
                    name="avatar_url"
                    type="url"
                    defaultValue={String(editing.avatar_url || "")}
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  描述
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={String(editing.description || "")}
                    className={field}
                  />
                </label>
              </>
            )}
            <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:static sm:m-0 sm:border-0 sm:p-0">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-11 rounded-xl border px-4 py-2 text-sm"
              >
                取消
              </button>
              <button className="min-h-11 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white">
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
