import { notFound } from "next/navigation";
import { decodeSlugParam } from "@nami/shared/slug";
import { TaxonomyPage } from "@/components/taxonomy-page";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, Category, PostSummary } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeSlugParam((await params).slug);
  const [postResult, categoryResult] = await Promise.all([
    apiJson<ApiResponse<PostSummary[]>>(`/api/v1/posts?category=${encodeURIComponent(slug)}&limit=100`),
    apiJson<ApiResponse<Category[]>>("/api/v1/categories"),
  ]);
  const category = categoryResult.data.find((item) => item.slug === slug);
  if (!category) notFound();
  return <TaxonomyPage kind="分类" name={category.name} posts={postResult.data} />;
}
