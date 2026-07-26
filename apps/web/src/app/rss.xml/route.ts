import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, PostDetail, PostSummary } from "@/lib/types";
export const dynamic = "force-dynamic";
function xml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function cdata(value: string) { return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`; }
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nami-blog.codeelite.workers.dev";
  const list = await apiJson<ApiResponse<PostSummary[]>>("/api/v1/posts?limit=50");
  const details = await Promise.all(list.data.map((post) => apiJson<ApiResponse<PostDetail>>(`/api/v1/posts/${encodeURIComponent(post.slug)}`).then((result) => result.data)));
  const items = details.map((post) => `<item><title>${xml(post.title)}</title><link>${xml(`${site}/blog/${post.slug}`)}</link><guid>${xml(`${site}/blog/${post.slug}`)}</guid><pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate><description>${cdata(post.excerpt || "")}</description><content:encoded>${cdata(post.content_html || post.content || "")}</content:encoded></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Nami Blog</title><link>${xml(site)}</link><description>记录技术与生活</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
