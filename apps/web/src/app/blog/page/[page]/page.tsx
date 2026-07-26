import { notFound } from "next/navigation";
import { BlogArchive } from "@/components/blog-archive";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, PostSummary } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function PaginatedBlogPage({ params }: { params: Promise<{ page: string }> }) {
  const value = Number((await params).page);
  if (!Number.isInteger(value) || value < 2) notFound();
  const result = await apiJson<ApiResponse<PostSummary[]>>(`/api/v1/posts?page=${value}&limit=10`);
  const total = result.meta?.total ?? 0;
  if (value > Math.max(1, Math.ceil(total / 10))) notFound();
  return <BlogArchive posts={result.data} page={value} total={total} />;
}
