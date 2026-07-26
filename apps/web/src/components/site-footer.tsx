"use client";
import { usePathname } from "next/navigation";
export function SiteFooter({ siteName }: { siteName: string }) { const pathname = usePathname() || "/"; if (pathname.startsWith("/admin")) return null; return <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-tertiary)]">© {new Date().getFullYear()} {siteName} · 由 Next.js 与 Cloudflare Workers 驱动</footer>; }
