import type { Metadata } from "next";
import { apiJson } from "@/lib/cloudflare";
import { renderMarkdown } from "@/lib/markdown";
import { buildDefaultAboutMarkdown } from "@/lib/site-content";
import type { ApiResponse, SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "关于",
  description: "了解 Nami Blog 与这里记录的故事",
  alternates: { canonical: "/about" },
};

function safeUrl(value: unknown) {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const { data } = await apiJson<ApiResponse<SiteSettings>>("/api/v1/settings");
  const github =
    safeUrl(data.social_links?.github) ||
    "https://github.com/elite-silab/nami-blog";
  const email =
    typeof data.social_links?.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.social_links.email)
      ? data.social_links.email
      : null;
  const aboutMarkdown =
    data.site_about ??
    buildDefaultAboutMarkdown({
      siteName: data.site_name,
      subtitle:
        data.site_subtitle ||
        data.site_description ||
        data.seo_description,
      github,
      email,
    });

  return (
    <article className="relative mx-auto max-w-4xl overflow-hidden px-4 py-12 sm:py-16">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-primary)]">
          关于这里
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          每一段记录，
          <span className="text-[var(--color-primary)]">都有它的来处。</span>
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          关于 Nami、关于写作，也关于这片小小空间想要留下的东西。
        </p>
      </header>
      <section className="mt-10 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl shadow-[var(--theme-glow)] sm:p-10">
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(aboutMarkdown) }}
        />
      </section>
    </article>
  );
}
