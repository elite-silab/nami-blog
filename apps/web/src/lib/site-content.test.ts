import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOME_CONTENT,
  buildDefaultAboutMarkdown,
  resolveHomeContent,
} from "./site-content";

describe("页面内容默认配置", () => {
  it("未配置首页时应保持当前文案", () => {
    expect(resolveHomeContent({})).toEqual(DEFAULT_HOME_CONTENT);
  });

  it("没有独立首页简介时应继续使用站点副标题", () => {
    expect(resolveHomeContent({ site_subtitle: "一间安静的数字花园" }).description)
      .toBe("一间安静的数字花园");
  });

  it("应允许站长隐藏首页顶部标语和简介", () => {
    const content = resolveHomeContent({
      home_eyebrow: "",
      home_description: "",
    });

    expect(content.eyebrow).toBe("");
    expect(content.description).toBe("");
  });

  it("关于页默认 Markdown 应使用当前站点信息", () => {
    const markdown = buildDefaultAboutMarkdown({
      siteName: "海风手记",
      subtitle: "记录沿途的技术与生活",
      github: "https://github.com/example/blog",
      email: "hello@example.com",
    });

    expect(markdown).toContain("**海风手记**");
    expect(markdown).toContain("记录沿途的技术与生活");
    expect(markdown).toContain("[https://github.com/example/blog](https://github.com/example/blog)");
    expect(markdown).toContain("[hello@example.com](mailto:hello@example.com)");
  });
});
