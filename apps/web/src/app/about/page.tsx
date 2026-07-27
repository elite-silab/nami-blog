import type { Metadata } from "next";
import { apiJson } from "@/lib/cloudflare";
import { renderMarkdown } from "@/lib/markdown";
import { buildDefaultAboutMarkdown } from "@/lib/site-content";
import type { ApiResponse, SiteSettings } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "关于", alternates: { canonical: "/about" } };
function safeUrl(value: unknown) { try { const url = new URL(String(value)); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; } }
export default async function AboutPage() {
  const { data } = await apiJson<ApiResponse<SiteSettings>>("/api/v1/settings");
  const github = safeUrl(data.social_links?.github) || "https://github.com/elite-silab/nami-blog";
  const email = typeof data.social_links?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.social_links.email) ? data.social_links.email : null;
  const aboutMarkdown = data.site_about ?? buildDefaultAboutMarkdown({ siteName: data.site_name, subtitle: data.site_subtitle || data.site_description || data.seo_description, github, email });
  return <article className="mx-auto max-w-prose px-4 py-16"><h1 className="text-3xl font-bold tracking-tight">关于</h1><section className="prose mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(aboutMarkdown) }} /></article>;
}
