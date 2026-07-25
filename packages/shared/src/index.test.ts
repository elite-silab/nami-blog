/**
 * Shared 包 Schema 验证测试
 */
import { describe, it, expect } from "vitest";
import {
  PostSchema,
  CommentSchema,
  LoginSchema,
  PaginationSchema,
  PostStatus,
  CommentStatus,
} from "./index";

describe("PostSchema", () => {
  it("应接受有效的文章输入", () => {
    const result = PostSchema.safeParse({
      title: "测试文章",
      slug: "test-post",
      content: "# Hello World",
      status: "published",
    });
    expect(result.success).toBe(true);
  });

  it("标题不能为空", () => {
    const result = PostSchema.safeParse({
      title: "",
      slug: "test",
      content: "content",
      status: "draft",
    });
    expect(result.success).toBe(false);
  });

  it("slug 必须是 kebab-case 格式", () => {
    const result = PostSchema.safeParse({
      title: "test",
      slug: "Invalid Slug",
      content: "content",
      status: "draft",
    });
    expect(result.success).toBe(false);
  });

  it("slug 接受多段 kebab-case", () => {
    const result = PostSchema.safeParse({
      title: "test",
      slug: "my-first-post-2026",
      content: "content",
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("status 必须是有效枚举值", () => {
    const result = PostSchema.safeParse({
      title: "test",
      slug: "test",
      content: "content",
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("应接受可选字段", () => {
    const result = PostSchema.safeParse({
      title: "test",
      slug: "test",
      content: "content",
      status: "published",
      excerpt: "摘要内容",
      coverUrl: "https://example.com/cover.png",
      isPinned: true,
      isPublic: false,
      categoryIds: [1, 2],
      tagIds: [3],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPinned).toBe(true);
      expect(result.data.categoryIds).toEqual([1, 2]);
    }
  });

  it("coverUrl 必须是有效 URL", () => {
    const result = PostSchema.safeParse({
      title: "test",
      slug: "test",
      content: "content",
      status: "draft",
      coverUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("CommentSchema", () => {
  it("应接受有效的评论输入", () => {
    const result = CommentSchema.safeParse({
      postId: 1,
      authorName: "读者",
      content: "好文章！",
    });
    expect(result.success).toBe(true);
  });

  it("postId 必须是正整数", () => {
    const result = CommentSchema.safeParse({
      postId: -1,
      authorName: "读者",
      content: "评论",
    });
    expect(result.success).toBe(false);
  });

  it("authorName 不能为空", () => {
    const result = CommentSchema.safeParse({
      postId: 1,
      authorName: "",
      content: "评论",
    });
    expect(result.success).toBe(false);
  });

  it("content 不能超过 5000 字符", () => {
    const result = CommentSchema.safeParse({
      postId: 1,
      authorName: "读者",
      content: new Array(5001).fill("a").join(""),
    });
    expect(result.success).toBe(false);
  });

  it("应接受有效的 authorEmail", () => {
    const result = CommentSchema.safeParse({
      postId: 1,
      authorName: "读者",
      content: "评论",
      authorEmail: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("无效的 authorEmail 应被拒绝", () => {
    const result = CommentSchema.safeParse({
      postId: 1,
      authorName: "读者",
      content: "评论",
      authorEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("应接受有效的登录输入", () => {
    const result = LoginSchema.safeParse({
      username: "admin",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("密码至少 8 个字符", () => {
    const result = LoginSchema.safeParse({
      username: "admin",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("用户名不能为空", () => {
    const result = LoginSchema.safeParse({
      username: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("PaginationSchema", () => {
  it("应设置默认值", () => {
    const result = PaginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("应接受字符串数字并转换", () => {
    const result = PaginationSchema.parse({ page: "3", limit: "10" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it("limit 不能超过 100", () => {
    const result = PaginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("page 必须是正整数", () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe("PostStatus 枚举", () => {
  it("应包含所有状态", () => {
    expect(PostStatus.DRAFT).toBe("draft");
    expect(PostStatus.PUBLISHED).toBe("published");
    expect(PostStatus.ARCHIVED).toBe("archived");
  });
});

describe("CommentStatus 枚举", () => {
  it("应包含所有状态", () => {
    expect(CommentStatus.PENDING).toBe("pending");
    expect(CommentStatus.APPROVED).toBe("approved");
    expect(CommentStatus.REJECTED).toBe("rejected");
  });
});
