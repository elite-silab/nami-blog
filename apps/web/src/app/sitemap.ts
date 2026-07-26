import type { MetadataRoute } from "next";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, Category, PostSummary, Tag } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nami-blog.codeelite.workers.dev";
  const [posts, categories, tags] = await Promise.all([
    apiJson<ApiResponse<PostSummary[]>>("/api/v1/posts?limit=100"),
    apiJson<ApiResponse<Category[]>>("/api/v1/categories"),
    apiJson<ApiResponse<Tag[]>>("/api/v1/tags"),
  ]);
  return ["", "/blog", "/about", "/friends", "/search"].map((path) => ({ url: `${site}${path}`, changeFrequency: "weekly" as const }))
    .concat(posts.data.map((post) => ({ url: `${site}/blog/${post.slug}`, lastModified: post.updated_at || post.published_at || post.created_at, changeFrequency: "weekly" as const })))
    .concat(categories.data.map((item) => ({ url: `${site}/blog/category/${item.slug}`, changeFrequency: "weekly" as const })))
    .concat(tags.data.map((item) => ({ url: `${site}/blog/tag/${item.slug}`, changeFrequency: "weekly" as const })));
}
