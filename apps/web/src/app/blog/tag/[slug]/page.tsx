import { notFound } from "next/navigation";
import { TaxonomyPage } from "@/components/taxonomy-page";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, PostSummary, Tag } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [postResult, tagResult] = await Promise.all([
    apiJson<ApiResponse<PostSummary[]>>(`/api/v1/posts?tag=${encodeURIComponent(slug)}&limit=100`),
    apiJson<ApiResponse<Tag[]>>("/api/v1/tags"),
  ]);
  const tag = tagResult.data.find((item) => item.slug === slug);
  if (!tag) notFound();
  return <TaxonomyPage kind="标签" name={tag.name} posts={postResult.data} />;
}
