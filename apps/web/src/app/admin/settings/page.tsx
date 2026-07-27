"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, clearAdminSession } from "@/lib/admin-session";
import { readJson, type ApiErrorResult } from "@/lib/json";
import { publicationMessage } from "@/lib/publication";
import {
  DEFAULT_HOME_CONTENT,
  buildDefaultAboutMarkdown,
  resolveHomeContent,
} from "@/lib/site-content";
import { DEFAULT_THEME, THEMES, type ThemeId } from "@/lib/theme";

type Settings = {
  site_name: string;
  site_subtitle: string;
  seo_description: string;
  social_github: string;
  social_twitter: string;
  social_email: string;
  home_eyebrow: string;
  home_title: string;
  home_title_highlight: string;
  home_description: string;
  home_primary_label: string;
  home_secondary_label: string;
  site_about: string;
  site_theme: ThemeId;
  comment_enabled: boolean;
  comment_auto_approve: boolean;
  sensitive_words: string;
};

type StoredSettings = {
  site_name?: string;
  site_subtitle?: string;
  site_description?: string;
  seo_description?: string;
  social_links?: { github?: string; twitter?: string; email?: string };
  home_eyebrow?: string;
  home_title?: string;
  home_title_highlight?: string;
  home_description?: string;
  home_primary_label?: string;
  home_secondary_label?: string;
  site_about?: string;
  site_theme?: ThemeId;
  comment_enabled?: boolean | string;
  comment_auto_approve?: boolean | string;
  sensitive_words?: unknown;
};

type MutationResult = {
  data?: { publication?: { status?: string } };
} & ApiErrorResult;

const PROJECT_GITHUB = "https://github.com/elite-silab/nami-blog";

const defaults: Settings = {
  site_name: "Nami Blog",
  site_subtitle: "记录技术与生活",
  seo_description: "",
  social_github: "",
  social_twitter: "",
  social_email: "",
  home_eyebrow: DEFAULT_HOME_CONTENT.eyebrow,
  home_title: DEFAULT_HOME_CONTENT.title,
  home_title_highlight: DEFAULT_HOME_CONTENT.titleHighlight,
  home_description: DEFAULT_HOME_CONTENT.description,
  home_primary_label: DEFAULT_HOME_CONTENT.primaryLabel,
  home_secondary_label: DEFAULT_HOME_CONTENT.secondaryLabel,
  site_about: buildDefaultAboutMarkdown(),
  site_theme: DEFAULT_THEME,
  comment_enabled: true,
  comment_auto_approve: false,
  sensitive_words: "",
};

function normalizeSettings(data: StoredSettings): Settings {
  const social = data.social_links || {};
  const home = resolveHomeContent(data);
  const siteName = data.site_name || defaults.site_name;
  const subtitle =
    data.site_subtitle ||
    data.site_description ||
    data.seo_description ||
    defaults.site_subtitle;

  return {
    ...defaults,
    site_name: siteName,
    site_subtitle: data.site_subtitle || defaults.site_subtitle,
    seo_description: data.seo_description || "",
    social_github: social.github || "",
    social_twitter: social.twitter || "",
    social_email: social.email || "",
    home_eyebrow: home.eyebrow,
    home_title: home.title,
    home_title_highlight: home.titleHighlight,
    home_description: home.description,
    home_primary_label: home.primaryLabel,
    home_secondary_label: home.secondaryLabel,
    site_about:
      data.site_about ??
      buildDefaultAboutMarkdown({
        siteName,
        subtitle,
        github: social.github || PROJECT_GITHUB,
        email: social.email,
      }),
    site_theme: data.site_theme || DEFAULT_THEME,
    comment_enabled:
      data.comment_enabled === true || data.comment_enabled === "true",
    comment_auto_approve:
      data.comment_auto_approve === true ||
      data.comment_auto_approve === "true",
    sensitive_words: Array.isArray(data.sensitive_words)
      ? data.sensitive_words.join("\n")
      : "",
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState("");
  const [backup, setBackup] = useState<File | null>(null);
  const [backupStatus, setBackupStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((response) => readJson<{ data: StoredSettings }>(response))
      .then(({ data }) => setSettings(normalizeSettings(data)));
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );

  function resetHomeContent() {
    if (!settings) return;
    const home = resolveHomeContent({ site_subtitle: settings.site_subtitle });
    setSettings({
      ...settings,
      home_eyebrow: home.eyebrow,
      home_title: home.title,
      home_title_highlight: home.titleHighlight,
      home_description: home.description,
      home_primary_label: home.primaryLabel,
      home_secondary_label: home.secondaryLabel,
    });
    setStatus("已恢复首页默认内容，点击保存后生效。");
  }

  function resetAboutContent() {
    if (!settings) return;
    set("site_about", buildDefaultAboutMarkdown({
      siteName: settings.site_name,
      subtitle: settings.site_subtitle || settings.seo_description,
      github: settings.social_github || PROJECT_GITHUB,
      email: settings.social_email,
    }));
    setStatus("已恢复关于页默认内容，点击保存后生效。");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setStatus("保存中…");
    const response = await adminFetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_name: settings.site_name,
        site_subtitle: settings.site_subtitle,
        seo_description: settings.seo_description,
        home_eyebrow: settings.home_eyebrow,
        home_title: settings.home_title,
        home_title_highlight: settings.home_title_highlight,
        home_description: settings.home_description,
        home_primary_label: settings.home_primary_label,
        home_secondary_label: settings.home_secondary_label,
        site_about: settings.site_about,
        social_links: {
          github: settings.social_github || null,
          twitter: settings.social_twitter || null,
          email: settings.social_email || null,
        },
        site_theme: settings.site_theme,
        comment_enabled: settings.comment_enabled,
        comment_auto_approve: settings.comment_auto_approve,
        sensitive_words: settings.sensitive_words
          .split("\n")
          .map((word) => word.trim())
          .filter(Boolean),
      }),
    });
    const result = await readJson<MutationResult>(response);
    setStatus(
      response.ok
        ? `✓ ${publicationMessage(result.data?.publication?.status)}`
        : result.error?.message || "保存失败",
    );
    if (response.ok) {
      localStorage.setItem("nami-theme", settings.site_theme);
    }
  }

  async function exportBackup() {
    setBackupStatus("正在整理备份…");
    const response = await adminFetch("/api/admin/backup");
    if (!response.ok) return setBackupStatus("导出失败");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nami-blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupStatus("备份已下载，请妥善保存。");
  }

  async function importBackup() {
    if (!backup) return;
    if (backup.size > 10_000_000) {
      return setBackupStatus("备份文件不能超过 10MB");
    }
    if (!confirm("导入会替换当前网站数据，管理员账号不会改变。确认继续？")) {
      return;
    }
    setBackupStatus("正在校验并恢复数据…");
    try {
      const text = await backup.text();
      JSON.parse(text);
      const response = await adminFetch("/api/admin/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const result = await readJson<ApiErrorResult>(response);
      if (!response.ok) {
        throw new Error(result.error?.message || "导入失败");
      }
      setBackupStatus("导入成功，前台无需重新部署。");
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : "导入失败");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const oldPassword = String(form.get("old_password") || "");
    const newPassword = String(form.get("new_password") || "");
    if (newPassword !== form.get("confirm_password")) {
      return setPasswordStatus("两次密码不一致");
    }
    const response = await adminFetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const result = await readJson<ApiErrorResult>(response);
    if (!response.ok) {
      return setPasswordStatus(result.error?.message || "修改失败");
    }
    clearAdminSession();
    setPasswordStatus("密码已修改，请重新登录");
    setTimeout(() => router.replace("/admin/login"), 1000);
  }

  if (!settings) {
    return (
      <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
        加载中…
      </p>
    );
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm";
  const card =
    "space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6";

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={save} className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">基础设置</h2>
          <div className={card}>
            <label className="block text-sm font-medium">
              站点名称
              <input
                required
                maxLength={100}
                value={settings.site_name}
                onChange={(event) => set("site_name", event.target.value)}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              副标题
              <input
                maxLength={200}
                value={settings.site_subtitle}
                onChange={(event) => set("site_subtitle", event.target.value)}
                className={field}
              />
            </label>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">首页内容</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                只调整文案，首页布局和按钮去向保持稳定。
              </p>
            </div>
            <button
              type="button"
              onClick={resetHomeContent}
              className="shrink-0 rounded-lg border px-3 py-2 text-xs"
            >
              恢复默认
            </button>
          </div>
          <div className={card}>
            <label className="block text-sm font-medium">
              顶部小标语
              <input
                maxLength={80}
                value={settings.home_eyebrow}
                onChange={(event) => set("home_eyebrow", event.target.value)}
                placeholder="留空则隐藏"
                className={field}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                主标题
                <input
                  required
                  maxLength={120}
                  value={settings.home_title}
                  onChange={(event) => set("home_title", event.target.value)}
                  className={field}
                />
              </label>
              <label className="block text-sm font-medium">
                强调文字
                <input
                  required
                  maxLength={120}
                  value={settings.home_title_highlight}
                  onChange={(event) =>
                    set("home_title_highlight", event.target.value)
                  }
                  className={field}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              首页简介
              <textarea
                maxLength={1000}
                rows={4}
                value={settings.home_description}
                onChange={(event) =>
                  set("home_description", event.target.value)
                }
                placeholder="留空则隐藏"
                className={field}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                主按钮文案
                <input
                  required
                  maxLength={40}
                  value={settings.home_primary_label}
                  onChange={(event) =>
                    set("home_primary_label", event.target.value)
                  }
                  className={field}
                />
              </label>
              <label className="block text-sm font-medium">
                关于页按钮文案
                <input
                  required
                  maxLength={40}
                  value={settings.home_secondary_label}
                  onChange={(event) =>
                    set("home_secondary_label", event.target.value)
                  }
                  className={field}
                />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">关于页</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                支持与文章相同的 Markdown，保存后会安全渲染。
              </p>
            </div>
            <button
              type="button"
              onClick={resetAboutContent}
              className="shrink-0 rounded-lg border px-3 py-2 text-xs"
            >
              恢复默认
            </button>
          </div>
          <div className={card}>
            <label className="block text-sm font-medium">
              关于页正文
              <textarea
                maxLength={50_000}
                rows={16}
                value={settings.site_about}
                onChange={(event) => set("site_about", event.target.value)}
                className={`${field} font-mono leading-7`}
              />
            </label>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              支持标题、列表、引用、链接、图片、表格和代码块。
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">SEO 与社交链接</h2>
          <div className={card}>
            <label className="block text-sm font-medium">
              默认 Meta Description
              <textarea
                maxLength={500}
                value={settings.seo_description}
                onChange={(event) =>
                  set("seo_description", event.target.value)
                }
                rows={3}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              GitHub
              <input
                type="url"
                value={settings.social_github}
                onChange={(event) =>
                  set("social_github", event.target.value)
                }
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              Twitter / X
              <input
                type="url"
                value={settings.social_twitter}
                onChange={(event) =>
                  set("social_twitter", event.target.value)
                }
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              邮箱
              <input
                type="email"
                value={settings.social_email}
                onChange={(event) => set("social_email", event.target.value)}
                className={field}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">主题外观</h2>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            点击主题会立即预览，保存后自动更新前台缓存。
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  set("site_theme", theme.id);
                  document.documentElement.dataset.theme = theme.id;
                }}
                className={`overflow-hidden rounded-xl border-2 text-left ${settings.site_theme === theme.id ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-[var(--color-border)]"}`}
              >
                <div
                  className="h-24 p-4"
                  style={{ background: theme.colors.bg }}
                >
                  <div className="flex gap-2">
                    <i
                      className="h-3 w-3 rounded-full"
                      style={{ background: theme.colors.primary }}
                    />
                    <i
                      className="h-3 w-3 rounded-full"
                      style={{ background: theme.colors.accent }}
                    />
                  </div>
                </div>
                <div className="bg-[var(--color-bg)] px-4 py-3">
                  <strong>
                    {theme.emoji} {theme.name}
                  </strong>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {theme.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">评论</h2>
          <div className={card}>
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.comment_enabled}
                onChange={(event) =>
                  set("comment_enabled", event.target.checked)
                }
              />
              启用评论
            </label>
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.comment_auto_approve}
                onChange={(event) =>
                  set("comment_auto_approve", event.target.checked)
                }
              />
              自动批准评论
            </label>
            <label className="block text-sm font-medium">
              敏感词（每行一个）
              <textarea
                value={settings.sensitive_words}
                onChange={(event) =>
                  set("sensitive_words", event.target.value)
                }
                rows={4}
                className={field}
              />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <span
            aria-live="polite"
            className="text-sm text-[var(--color-success)]"
          >
            {status}
          </span>
          <button className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white">
            保存设置
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-lg font-semibold">网站数据备份</h2>
        <div className={card}>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            导出文章、分类、标签、评论、友链和设置；不包含管理员密码、令牌、IP、日志和仓库图片。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void exportBackup()}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              导出备份
            </button>
            <label className="cursor-pointer rounded-lg border px-4 py-2 text-sm">
              选择备份文件
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setBackup(event.target.files?.[0] || null)
                }
                className="hidden"
              />
            </label>
            <button
              disabled={!backup}
              onClick={() => void importBackup()}
              className="rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              导入并替换数据
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {backup?.name || "尚未选择文件"}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {backupStatus}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">修改密码</h2>
        <form onSubmit={changePassword} className={card}>
          <input
            name="old_password"
            type="password"
            required
            placeholder="当前密码"
            className={field}
          />
          <input
            name="new_password"
            type="password"
            required
            minLength={8}
            placeholder="新密码（至少 8 位）"
            className={field}
          />
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            placeholder="确认新密码"
            className={field}
          />
          <div className="flex items-center gap-4">
            <button className="rounded-lg border px-4 py-2 text-sm">
              修改密码
            </button>
            <span className="text-sm">{passwordStatus}</span>
          </div>
        </form>
      </section>
    </div>
  );
}
