import { describe, expect, it } from "vitest";
import {
  decodeSlugParam,
  isValidSlug,
  normalizeSlug,
} from "./slug";

describe("Slug 公共规则", () => {
  it("只接受小写英文、数字和单个连字符分段", () => {
    expect(isValidSlug("my-first-post-2026")).toBe(true);
    expect(isValidSlug("我的文章")).toBe(false);
    expect(isValidSlug("My-Post")).toBe(false);
    expect(isValidSlug("my--post")).toBe(false);
  });

  it("应把手动输入整理成标准 slug", () => {
    expect(normalizeSlug("  My First Post!  ")).toBe("my-first-post");
  });

  it("应兼容已编码和已解码的旧中文路由参数", () => {
    expect(decodeSlugParam("%E6%88%90%E5%8A%9F%E9%83%A8%E7%BD%B2")).toBe(
      "成功部署",
    );
    expect(decodeSlugParam("成功部署")).toBe("成功部署");
  });
});
