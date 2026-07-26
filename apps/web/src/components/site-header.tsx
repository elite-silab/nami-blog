"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["/blog", "文章"],
  ["/friends", "友链"],
  ["/about", "关于"],
] as const;

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="返回首页"><Logo /></Link>
        <div className="hidden items-center gap-4 sm:flex">
          {links.map(([href, label]) => <Link key={href} href={href} className={`text-sm hover:text-[var(--color-text)] ${pathname.startsWith(href) ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"}`}>{label}</Link>)}
          <Link href="/search" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]" aria-label="搜索文章">🔍</Link>
          <Link href="/rss.xml" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]" aria-label="RSS 订阅">📡</Link>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 sm:hidden"><ThemeToggle /><button type="button" onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" aria-label="菜单" aria-expanded={open}>☰</button></div>
      </nav>
      {open && <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] sm:hidden"><div className="flex flex-col gap-1 px-4 py-3">{links.map(([href, label]) => <Link key={href} onClick={() => setOpen(false)} href={href} className="rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]">{label}</Link>)}<Link href="/search" className="rounded-lg px-3 py-2 text-sm">🔍 搜索</Link><Link href="/rss.xml" className="rounded-lg px-3 py-2 text-sm">📡 RSS</Link></div></div>}
    </header>
  );
}
