import { describe, expect, it } from "vitest";
import {
  applyMarkdownAction,
  getContentStats,
  slugifyTitle,
} from "./editor";

describe("文章编辑器工具", () => {
  it("应把中英文标题转为小写英文 slug", () => {
    expect(slugifyTitle("  Hello，Cloudflare 博客！ ")).toBe(
      "hello-cloudflare-bo-ke",
    );
  });

  it("应把纯中文标题转为无声调拼音", () => {
    expect(slugifyTitle("成功部署")).toBe("cheng-gong-bu-shu");
  });

  it("空内容阅读时间应为 0", () => {
    expect(getContentStats("  \n")).toEqual({
      characters: 0,
      readingMinutes: 0,
    });
  });

  it("应按每分钟 400 字估算阅读时间", () => {
    expect(getContentStats("字".repeat(401)).readingMinutes).toBe(2);
  });

  it("应包裹选中的 Markdown 内容", () => {
    expect(applyMarkdownAction("hello", 0, 5, "bold").value).toBe(
      "**hello**",
    );
  });

  it("没有选区时应插入可继续编辑的占位内容", () => {
    const result = applyMarkdownAction("", 0, 0, "link");
    expect(result.value).toBe("[链接文字](https://)");
    expect(result.selectionEnd).toBeGreaterThan(result.selectionStart);
  });
});
