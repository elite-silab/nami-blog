import type { Metadata } from "next";
import Script from "next/script";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DEFAULT_THEME, isThemeId, THEME_INIT_SCRIPT } from "@/lib/theme";
import { getPublicSettings } from "@/lib/site-settings";
import "@/styles/global.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nami-blog.codeelite.workers.dev";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = settings.site_name || "Nami Blog";
  const description = settings.seo_description || settings.site_description || settings.site_subtitle || "在 Cloudflare 边缘网络上记录技术、生活与长期主义。";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: siteName, template: `%s — ${siteName}` },
    description,
    icons: { icon: "/favicon.svg" },
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "zh_CN", siteName, url: siteUrl, description },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();
  const theme = isThemeId(settings.site_theme) ? settings.site_theme : DEFAULT_THEME;
  const siteName = settings.site_name || "Nami Blog";
  return (
    <html lang="zh-CN" data-theme={theme} suppressHydrationWarning>
      <head><Script id="nami-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
      <body className="site-shell relative min-h-screen overflow-x-clip antialiased">
        <a className="skip-link" href="#main-content">跳到主要内容</a>
        <SiteHeader />
        <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
        <SiteFooter siteName={siteName} />
      </body>
    </html>
  );
}
