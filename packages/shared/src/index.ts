import { z } from "zod";
import { SLUG_PATTERN } from "./slug";

export * from "./slug";

// ── 文章状态枚举 ──
export const PostStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

// ── 评论状态枚举 ──
export const CommentStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type CommentStatus =
  (typeof CommentStatus)[keyof typeof CommentStatus];

// ── 文章 Schema ──
export const PostSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(SLUG_PATTERN),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  coverUrl: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]),
  isPinned: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export type PostInput = z.infer<typeof PostSchema>;

// ── 评论 Schema ──
export const CommentSchema = z.object({
  postId: z.number().int().positive(),
  parentId: z.number().int().positive().optional(),
  authorName: z.string().min(1).max(64),
  authorEmail: z.string().email().optional(),
  authorUrl: z.string().url().max(512).optional(),
  content: z.string().min(1).max(5000),
});

export type CommentInput = z.infer<typeof CommentSchema>;

// ── 登录 Schema ──
export const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ── 分页 Schema ──
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ── API 响应通用结构 ──
export type ApiResponse<T> = {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};
