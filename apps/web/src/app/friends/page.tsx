import type { Metadata } from "next";
import { FriendCard } from "@/components/friend-card";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, Friend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "友情链接",
  description: "Nami Blog 的朋友们",
  alternates: { canonical: "/friends" },
};

export default async function FriendsPage() {
  const { data } = await apiJson<ApiResponse<Friend[]>>("/api/v1/friends");

  return (
    <section className="relative mx-auto min-h-[calc(100dvh-12rem)] max-w-5xl overflow-hidden px-4 py-12 sm:py-16">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-60" />
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
          Friends of Nami
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          在互联网的海上，
          <span className="text-[var(--color-primary)]">和朋友打个招呼。</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          这里收藏我喜欢的博客与网站。每一条链接，都是通往另一片有趣世界的航线。
        </p>
      </header>

      {data.length ? (
        <div className="mt-10 grid min-w-0 gap-4 md:grid-cols-2 sm:mt-12 sm:gap-5">
          {data.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[1.75rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 px-6 py-16 text-center sm:mt-12">
          <span className="text-4xl" aria-hidden="true">
            🔗
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            航线还在整理中
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            站长添加友链后，它们会立即出现在这里。
          </p>
        </div>
      )}
    </section>
  );
}
