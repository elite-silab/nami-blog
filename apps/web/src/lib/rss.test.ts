import { describe, expect, it } from "vitest";
import { getRssString } from "@astrojs/rss";
import { RSS_NAMESPACES } from "./rss";

describe("RSS XML", () => {
  it("正文为空时也应声明 content:encoded 命名空间", async () => {
    const xml = await getRssString({
      title: "Nami Blog",
      description: "测试订阅",
      site: "https://blog.example.com",
      xmlns: RSS_NAMESPACES,
      items: [
        {
          title: "测试文章",
          link: "/blog/test/",
          content: "",
        },
      ],
    });

    expect(xml).toContain(
      'xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    );
    expect(xml).toContain("<content:encoded/>");
  });
});
