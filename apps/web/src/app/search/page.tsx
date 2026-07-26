import { Suspense } from "react";
import { SearchClient } from "@/components/search-client";
export const metadata = { title: "搜索", alternates: { canonical: "/search" } };
export default function SearchPage() { return <section className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-2xl font-bold">搜索文章</h1><Suspense fallback={<p className="mt-6 text-sm text-[var(--color-text-secondary)]">正在准备搜索…</p>}><SearchClient /></Suspense></section>; }
