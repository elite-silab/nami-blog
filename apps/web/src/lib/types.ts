export type ApiResponse<T> = { data: T; meta?: { page: number; limit: number; total: number } };

export type PostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  status?: string;
  is_pinned: number;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type Category = { id: number; name: string; slug: string; description?: string | null; post_count: number };
export type Tag = { id: number; name: string; slug: string; color?: string | null; post_count: number };
export type Friend = { id: number; name: string; url: string; avatar_url: string | null; description: string | null };
export type SiteSettings = {
  site_name?: string;
  site_subtitle?: string;
  site_description?: string;
  seo_description?: string;
  site_about?: string;
  home_eyebrow?: string;
  home_title?: string;
  home_title_highlight?: string;
  home_description?: string;
  home_primary_label?: string;
  home_secondary_label?: string;
  site_theme?: "sakura" | "ocean" | "starry";
  comment_enabled?: boolean;
  icp_number?: string;
  social_links?: {
    github?: string | null;
    twitter?: string | null;
    email?: string | null;
  };
};

export type PostDetail = PostSummary & {
  content: string;
  content_html: string | null;
  view_count: number;
  word_count: number;
  categories: Category[];
  tags: Tag[];
  prev: Pick<PostSummary, "id" | "title" | "slug"> | null;
  next: Pick<PostSummary, "id" | "title" | "slug"> | null;
};
