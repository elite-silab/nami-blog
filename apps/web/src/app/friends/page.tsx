import type { Metadata } from "next";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, Friend } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "友情链接", description: "Nami Blog 的朋友们", alternates: { canonical: "/friends" } };
export default async function FriendsPage() {
  const { data } = await apiJson<ApiResponse<Friend[]>>("/api/v1/friends");
  return <section className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold">友情链接</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">这些是我喜欢的博客和网站，欢迎交换友链。</p>{data.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{data.map((friend) => <a key={friend.id} href={friend.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:border-[var(--color-primary)]">{friend.avatar_url ? <img src={friend.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] font-bold text-[var(--color-primary)]">{friend.name.charAt(0)}</div>}<div className="min-w-0"><h2 className="truncate font-semibold group-hover:text-[var(--color-primary)]">{friend.name}</h2>{friend.description && <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{friend.description}</p>}</div></a>)}</div> : <div className="mt-8 rounded-xl border py-16 text-center text-[var(--color-text-secondary)]">🔗 暂无友链</div>}</section>;
}
