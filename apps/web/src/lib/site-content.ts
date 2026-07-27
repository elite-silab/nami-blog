export type HomeContent = {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export type HomeContentSource = {
  home_eyebrow?: string;
  home_title?: string;
  home_title_highlight?: string;
  home_description?: string;
  home_primary_label?: string;
  home_secondary_label?: string;
  site_subtitle?: string;
  site_description?: string;
};

const LEGACY_HOME_DESCRIPTION =
  "Nami 是一个运行在 Cloudflare 边缘网络上的个人博客。这里记录工程实践、阅读笔记，也保留那些值得慢慢想的片刻。";

export const DEFAULT_HOME_CONTENT: HomeContent = {
  eyebrow: "来自航线上的新记录",
  title: "写给正在路上的",
  titleHighlight: "技术与生活。",
  description:
    "这里记录工程实践、阅读笔记，也保留那些值得慢慢想的片刻。愿每次阅读，都能带回一点新的启发。",
  primaryLabel: "阅读最新文章",
  secondaryLabel: "认识 Nami",
};

export function resolveHomeContent(settings: HomeContentSource): HomeContent {
  const fallbackDescription =
    settings.site_subtitle ||
    settings.site_description ||
    DEFAULT_HOME_CONTENT.description;

  return {
    eyebrow:
      settings.home_eyebrow === "Field notes from the edge"
        ? DEFAULT_HOME_CONTENT.eyebrow
        : (settings.home_eyebrow ?? DEFAULT_HOME_CONTENT.eyebrow),
    title: settings.home_title || DEFAULT_HOME_CONTENT.title,
    titleHighlight:
      settings.home_title_highlight || DEFAULT_HOME_CONTENT.titleHighlight,
    description:
      settings.home_description === LEGACY_HOME_DESCRIPTION
        ? DEFAULT_HOME_CONTENT.description
        : (settings.home_description ?? fallbackDescription),
    primaryLabel:
      settings.home_primary_label || DEFAULT_HOME_CONTENT.primaryLabel,
    secondaryLabel:
      settings.home_secondary_label || DEFAULT_HOME_CONTENT.secondaryLabel,
  };
}

type AboutDefaults = {
  siteName?: string;
  subtitle?: string;
  github?: string | null;
  email?: string | null;
};

export function buildDefaultAboutMarkdown({
  siteName = "Nami Blog",
  subtitle = "这里记录技术学习和生活思考，追求简洁、快速和良好的阅读体验。",
  github = "https://github.com/elite-silab/nami-blog",
  email,
}: AboutDefaults = {}) {
  const contacts = [
    github ? `- GitHub：[${github}](${github})` : "",
    email ? `- Email：[${email}](mailto:${email})` : "",
  ].filter(Boolean);

  return `你好，这里是 **${siteName}** —— 一间收集技术、阅读与生活片刻的线上小屋。

${subtitle}

## 技术栈

- **Next.js** — App Router 与服务端渲染
- **Hono** — 类型友好的 API
- **Cloudflare Workers + D1** — 边缘运行与数据存储
- **Tailwind CSS** — 主题与响应式界面

## 联系

${contacts.join("\n")}`;
}
