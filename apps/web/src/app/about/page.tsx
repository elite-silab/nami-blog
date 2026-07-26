import type { Metadata } from "next";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, SiteSettings } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "关于", alternates: { canonical: "/about" } };
function safeUrl(value: unknown) { try { const url = new URL(String(value)); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; } }
export default async function AboutPage() {
  const { data } = await apiJson<ApiResponse<SiteSettings>>("/api/v1/settings");
  const github = safeUrl(data.social_links?.github) || "https://github.com/elite-silab/nami-blog";
  const email = typeof data.social_links?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.social_links.email) ? data.social_links.email : null;
  return <article className="mx-auto max-w-prose px-4 py-16"><h1 className="text-3xl font-bold tracking-tight">关于</h1><section className="prose mt-8">{data.site_about ? <div dangerouslySetInnerHTML={{ __html: data.site_about }} /> : <><p>你好，这里是 <strong>{data.site_name || "Nami Blog"}</strong> —— 一个运行在单个 Cloudflare Worker 上的轻量博客。</p><p>{data.site_subtitle || data.site_description || data.seo_description || "这里记录技术学习和生活思考，追求简洁、快速和良好的阅读体验。"}</p><h2>技术栈</h2><ul><li><strong>Next.js</strong> — App Router 与服务端渲染</li><li><strong>Hono</strong> — 类型友好的 API</li><li><strong>Cloudflare Workers + D1</strong> — 边缘运行与数据存储</li><li><strong>Tailwind CSS</strong> — 主题与响应式界面</li></ul><h2>联系</h2><ul><li>GitHub：<a href={github} target="_blank" rel="noopener noreferrer">elite-silab/nami-blog</a></li>{email && <li>Email：<a href={`mailto:${email}`}>{email}</a></li>}</ul></>}</section></article>;
}
