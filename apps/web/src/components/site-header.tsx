"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemePicker } from "@/components/theme-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ThemeId } from "@/lib/theme";

const links = [
  ["/blog", "文章"],
  ["/friends", "友链"],
  ["/about", "关于"],
] as const;

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader({ defaultTheme }: { defaultTheme: ThemeId }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const active = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/86 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="主导航">
        <Link href="/" aria-label="返回首页" className="shrink-0">
          <Logo />
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm transition ${
                active(href)
                  ? "bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />
          <Link
            href="/search"
            aria-current={pathname === "/search" ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] ${pathname === "/search" ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}
            aria-label="搜索文章"
          >
            <SearchIcon />
            <span>搜索</span>
            <kbd className="font-mono text-[10px] opacity-60">⌘K</kbd>
          </Link>
          <Link
            href="/rss.xml"
            className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
            aria-label="RSS 订阅"
            title="RSS 订阅"
          >
            RSS
          </Link>
          <ThemePicker defaultTheme={defaultTheme} />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            aria-controls="mobile-site-menu"
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span className={`absolute left-0 top-0.5 h-px w-5 bg-current transition ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[7px] h-px w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-[13px] h-px w-5 bg-current transition ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-site-menu" className="border-t border-[var(--color-border)] bg-[var(--color-bg)] lg:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-4">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`rounded-xl px-4 py-3 text-sm ${
                  active(href)
                    ? "bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link href="/search" className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              搜索文章
            </Link>
            <Link href="/rss.xml" className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              RSS 订阅
            </Link>
            <ThemePicker defaultTheme={defaultTheme} variant="mobile" />
          </div>
        </div>
      )}
    </header>
  );
}
