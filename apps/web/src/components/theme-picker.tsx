"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  THEMES,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  readThemePreference,
  type ThemeId,
  type ThemePreference,
} from "@/lib/theme";

type ThemePickerProps = {
  defaultTheme: ThemeId;
  variant?: "desktop" | "mobile";
};

function storedPreference(): ThemePreference {
  try {
    return readThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "site";
  }
}

function ThemeDots({ theme }: { theme: ThemeId }) {
  const meta = THEMES.find((item) => item.id === theme)!;
  return (
    <span className="flex -space-x-1" aria-hidden="true">
      <i
        className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-bg)]"
        style={{ background: meta.colors.primary }}
      />
      <i
        className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-bg)]"
        style={{ background: meta.colors.accent }}
      />
    </span>
  );
}

export function ThemePicker({
  defaultTheme,
  variant = "desktop",
}: ThemePickerProps) {
  const [preference, setPreference] = useState<ThemePreference>("site");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const activeTheme = preference === "site" ? defaultTheme : preference;
  const activeMeta = THEMES.find((theme) => theme.id === activeTheme)!;
  const defaultMeta = THEMES.find((theme) => theme.id === defaultTheme)!;

  useEffect(() => {
    setPreference(storedPreference());
    const sync = (event: Event) => {
      if (event instanceof CustomEvent) {
        setPreference(readThemePreference(event.detail));
      } else if (
        event instanceof StorageEvent &&
        event.key !== THEME_STORAGE_KEY
      ) {
        return;
      } else {
        setPreference(storedPreference());
      }
    };
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!open || variant !== "desktop") return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, variant]);

  function choose(next: ThemePreference) {
    setPreference(next);
    document.documentElement.dataset.theme =
      next === "site" ? defaultTheme : next;
    try {
      if (next === "site") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 隐私模式禁用存储时，当前页面仍可正常预览。
    }
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: next }),
    );
    if (variant === "desktop") {
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  const options = (
    <div
      className="grid grid-cols-2 gap-2"
      role="radiogroup"
      aria-label="选择站点主题"
    >
      <button
        type="button"
        role="radio"
        aria-checked={preference === "site"}
        onClick={() => choose("site")}
        className={`theme-option ${preference === "site" ? "is-selected" : ""}`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">跟随站点</span>
          <ThemeDots theme={defaultTheme} />
        </span>
        <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
          当前默认：{defaultMeta.name}
        </span>
      </button>
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={preference === theme.id}
          onClick={() => choose(theme.id)}
          className={`theme-option ${preference === theme.id ? "is-selected" : ""}`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-semibold">
              {theme.emoji} {theme.name}
            </span>
            <ThemeDots theme={theme.id} />
          </span>
          <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
            {theme.description.split("，")[1] || theme.description}
          </span>
        </button>
      ))}
    </div>
  );

  if (variant === "mobile") {
    return (
      <section className="col-span-2 mt-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-sm font-semibold">阅读主题</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              当前显示：{activeMeta.name}
            </p>
          </div>
          <ThemeDots theme={activeTheme} />
        </div>
        {options}
      </section>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        aria-label={`选择阅读主题，当前为${activeMeta.name}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <ThemeDots theme={activeTheme} />
        <span>主题</span>
      </button>
      {open && (
        <section
          id={panelId}
          className="theme-picker-popover"
          aria-label="阅读主题"
        >
          <div className="mb-4">
            <p className="font-display text-lg font-semibold">选一种阅读氛围</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
              只保存在你的浏览器，不会影响其他访客。
            </p>
          </div>
          {options}
        </section>
      )}
    </div>
  );
}
