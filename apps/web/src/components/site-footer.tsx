"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter({ siteName }: { siteName: string }) {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-[var(--color-text)]">
            {siteName}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
            记录技术、阅读与日常。愿每次相遇，都能带走一点新的启发。
          </p>
        </div>
        <div className="sm:text-right">
          <nav aria-label="页脚导航" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/blog" className="footer-link">文章</Link>
            <Link href="/friends" className="footer-link">友链</Link>
            <Link href="/about" className="footer-link">关于</Link>
            <Link href="/rss.xml" className="footer-link">RSS 订阅</Link>
          </nav>
          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
            © {new Date().getFullYear()} {siteName} · 保持好奇，慢慢写下去
          </p>
        </div>
      </div>
    </footer>
  );
}
