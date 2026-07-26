import { BlogArchive } from "@/components/blog-archive";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, PostSummary } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata = { title: "文章列表", alternates: { canonical: "/blog" } };
export default async function BlogPage() {
  const result = await apiJson<ApiResponse<PostSummary[]>>("/api/v1/posts?page=1&limit=10");
  return <BlogArchive posts={result.data} page={1} total={result.meta?.total ?? result.data.length} />;
}
