import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { fetchBuildApi, handleBuildApiError } from "@/lib/build-api";
import { RSS_NAMESPACES } from "@/lib/rss";

export async function GET(context: APIContext) {
  const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:8788";

  let posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    content_html?: string;
    published_at: string | null;
    created_at: string;
  }> = [];

  try {
    const res = await fetchBuildApi(apiUrl, "/api/v1/posts?limit=50");
    if (res.ok) {
      const json = await res.json();
      posts = json.data || [];
    }
  } catch (error) {
    handleBuildApiError("RSS 文章列表", error);
  }

  // 获取每篇文章的详情（content_html）
  const detailPosts = await Promise.all(
    posts.map(async (p) => {
      try {
        const res = await fetchBuildApi(apiUrl, `/api/v1/posts/${p.slug}`);
        if (res.ok) {
          const json = await res.json();
          return {
            ...p,
            content_html: json.data?.content_html || p.content_html,
          };
        }
      } catch (error) {
        handleBuildApiError(`RSS 文章 ${p.slug}`, error);
      }
      return p;
    }),
  );

  return rss({
    title: "Nami Blog",
    description: "记录技术与生活",
    site: context.site?.toString() || "https://example.com",
    xmlns: RSS_NAMESPACES,
    items: detailPosts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.published_at || post.created_at),
      description: post.excerpt || "",
      link: `/blog/${post.slug}/`,
      content: post.content_html || "",
    })),
    customData: `<language>zh-CN</language>`,
  });
}
