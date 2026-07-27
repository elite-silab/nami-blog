"use client";

import { useState } from "react";
import type { Friend } from "@/lib/types";

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "访问网站";
  }
}

export function FriendCard({ friend }: { friend: Friend }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(friend.avatar_url) && !avatarFailed;

  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl hover:shadow-[var(--theme-glow)] sm:p-6"
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary-light)] opacity-55 blur-2xl transition group-hover:scale-125" />
      <div className="relative flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-light)] font-display text-xl font-bold text-[var(--color-primary)] shadow-sm">
            {showAvatar ? (
              <img
                src={friend.avatar_url || ""}
                alt={`${friend.name} 的头像`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true">{friend.name.trim().charAt(0) || "友"}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="break-words font-display text-xl font-semibold leading-tight transition group-hover:text-[var(--color-primary)]">
              {friend.name}
            </h2>
            <p className="mt-1 break-all font-mono text-[11px] text-[var(--color-text-tertiary)]">
              {hostLabel(friend.url)}
            </p>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] transition group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white"
        >
          ↗
        </span>
      </div>

      <p className="relative mt-5 flex-1 break-words text-sm leading-7 text-[var(--color-text-secondary)]">
        {friend.description || "去看看这个值得认识的网站。"}
      </p>

      <div className="relative mt-5 flex items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs font-semibold text-[var(--color-primary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        打开朋友的网站
      </div>
    </a>
  );
}
