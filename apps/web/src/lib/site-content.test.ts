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

  it("应将旧版英文默认标语升级为新文案", () => {
    expect(
      resolveHomeContent({ home_eyebrow: "Field notes from the edge" }).eyebrow,
    ).toBe("来自航线上的新记录");
  });

  it("应隐去旧版首页默认简介中的运行环境", () => {
    const content = resolveHomeContent({
      home_description:
        "Nami 是一个运行在 Cloudflare 边缘网络上的个人博客。这里记录工程实践、阅读笔记，也保留那些值得慢慢想的片刻。",
    });

    expect(content.description).toBe(DEFAULT_HOME_CONTENT.description);
    expect(content.description).not.toContain("Cloudflare");
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
