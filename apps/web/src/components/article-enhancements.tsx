"use client";
import { useEffect, useState } from "react";
import { readJson } from "@/lib/json";

export function ViewCounter({ slug, initialViews }: { slug: string; initialViews: number }) {
  const [views, setViews] = useState(initialViews);
  useEffect(() => {
    const key = `nami-view-counted:${slug}`;
    if (sessionStorage.getItem(key) !== "1") {
      fetch(`/api/v1/posts/${encodeURIComponent(slug)}/view`, { method: "POST", cache: "no-store" })
        .then((response) => response.ok ? readJson<{ data?: { view_count?: number } }>(response) : null)
        .then((result) => { if (typeof result?.data?.view_count === "number") { setViews(result.data.view_count); sessionStorage.setItem(key, "1"); } })
        .catch(() => {});
    }
    document.querySelectorAll<HTMLElement>("#post-content pre").forEach((pre) => {
      if (pre.querySelector("[data-copy-code]")) return;
      pre.style.position = "relative";
      const button = document.createElement("button");
      button.dataset.copyCode = "true";
      button.className = "absolute right-2 top-2 rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20";
      button.textContent = "复制";
      button.onclick = async () => { await navigator.clipboard.writeText(pre.textContent || ""); button.textContent = "已复制 ✓"; setTimeout(() => { button.textContent = "复制"; }, 1600); };
      pre.appendChild(button);
    });
  }, [slug]);
  return <span id="post-view-count">{views}</span>;
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function copyLink() { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  return <button type="button" onClick={copyLink} className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 text-sm font-semibold transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">{copied ? "✓ 链接已复制" : "复制文章链接"}</button>;
}
