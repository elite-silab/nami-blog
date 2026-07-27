"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoIcon } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminFetch, logoutAdminSession } from "@/lib/admin-session";

const items = [
  ["/admin", "仪表盘", "📊"],
  ["/admin/posts", "文章管理", "📝"],
  ["/admin/categories", "分类管理", "📁"],
  ["/admin/tags", "标签管理", "🏷️"],
  ["/admin/comments", "评论管理", "💬"],
  ["/admin/friends", "友链管理", "🔗"],
  ["/admin/settings", "站点设置", "⚙️"],
] as const;

const titles: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/posts": "文章管理",
  "/admin/categories": "分类管理",
  "/admin/tags": "标签管理",
  "/admin/comments": "评论管理",
  "/admin/friends": "友链管理",
  "/admin/settings": "站点设置",
};

function pageTitle(pathname: string) {
  if (pathname === "/admin/posts/new") return "新建文章";
  if (pathname === "/admin/posts/edit") return "编辑文章";

  const section = Object.keys(titles)
    .filter((path) =>
      path === "/admin" ? pathname === path : pathname.startsWith(path),
    )
    .sort((a, b) => b.length - a.length)[0];

  return titles[section] || "管理后台";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(pathname === "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    adminFetch("/api/admin/dashboard")
      .then((response) => {
        if (!response.ok) router.replace("/admin/login");
        else setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
        正在验证登录状态…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-[var(--color-bg-secondary)]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl transition-transform duration-200 lg:w-60 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 pt-[env(safe-area-inset-top)]">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <LogoIcon size={28} />
            <span className="rounded bg-[var(--color-primary-light)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] text-xl lg:hidden"
            aria-label="关闭管理菜单"
          >
            ×
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          {items.map(([href, label, icon]) => {
            const active =
              href === "/admin"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? "bg-[var(--color-primary-light)] font-medium text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"}`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          <Link
            href="/"
            className="block min-h-11 rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-secondary)]"
          >
            ← 返回前台
          </Link>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden"
          aria-label="点击遮罩关闭管理菜单"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/92 px-3 pt-[env(safe-area-inset-top)] backdrop-blur sm:min-h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] lg:hidden"
              aria-label="打开管理菜单"
              aria-expanded={open}
            >
              ☰
            </button>
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {pageTitle(pathname)}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <span className="hidden text-sm text-[var(--color-text-secondary)] md:inline">
              Admin
            </span>
            <button
              type="button"
              onClick={async () => {
                await logoutAdminSession();
                router.replace("/admin/login");
              }}
              className="grid h-10 min-w-10 place-items-center rounded-xl border border-[var(--color-border)] px-2 text-sm sm:px-3"
              aria-label="退出管理后台"
              title="退出管理后台"
            >
              <span className="hidden min-[360px]:inline">退出</span>
              <span className="min-[360px]:hidden" aria-hidden="true">
                ↪
              </span>
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
