"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-text-tertiary)]">
      © 2026 娜美博客 · 由 Next.js 与 Cloudflare Workers 驱动
    </footer>
  );
}
