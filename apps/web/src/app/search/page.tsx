import { Suspense } from "react";
import { SearchClient } from "@/components/search-client";

export const metadata = {
  title: "搜索",
  description: "搜索 Nami Blog 的公开文章",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <section className="relative mx-auto min-h-[calc(100dvh-12rem)] max-w-4xl overflow-hidden px-4 py-12 sm:py-16">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
          找到那篇记录
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          从文字里，
          <span className="text-[var(--color-primary)]">找一个答案。</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          输入标题或正文中的关键词，查找曾经写下的技术、阅读与生活片段。
        </p>
      </header>
      <Suspense
        fallback={
          <p className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-sm text-[var(--color-text-secondary)]">
            正在准备搜索…
          </p>
        }
      >
        <SearchClient />
      </Suspense>
    </section>
  );
}
