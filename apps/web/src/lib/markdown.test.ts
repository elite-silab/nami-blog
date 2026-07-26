import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("Markdown 渲染", () => {
  it("应渲染常用 Markdown 与 GFM 表格", () => {
    const html = renderMarkdown(`# 标题

**加粗**与[链接](https://example.com)

- 第一项
- 第二项

| 名称 | 状态 |
| --- | --- |
| Nami | 正常 |

\`\`\`ts
const ready = true;
\`\`\``);

    expect(html).toContain("<h1>标题</h1>");
    expect(html).toContain("<strong>加粗</strong>");
    expect(html).toContain('<a href="https://example.com">链接</a>');
    expect(html).toContain("<ul>");
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
  });

  it("应保留普通换行，方便中文写作", () => {
    expect(renderMarkdown("第一行\n第二行")).toContain("第一行<br />第二行");
  });

  it("应移除脚本、事件属性和危险链接", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)">[危险链接](javascript:alert(1))',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('<img src="https://example.com/a.png" />');
  });

  it("空内容应返回空字符串", () => {
    expect(renderMarkdown("  \n")).toBe("");
  });
});
