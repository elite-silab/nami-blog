export type MarkdownAction = "heading" | "bold" | "quote" | "link" | "code";

export function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

export function getContentStats(content: string) {
  const characters = content.replace(/\s/g, "").length;
  return {
    characters,
    readingMinutes: characters === 0 ? 0 : Math.max(1, Math.ceil(characters / 400)),
  };
}

export function applyMarkdownAction(
  value: string,
  start: number,
  end: number,
  action: MarkdownAction,
) {
  const selected = value.slice(start, end);
  const actions: Record<MarkdownAction, [string, string, string]> = {
    heading: ["## ", "", "小标题"],
    bold: ["**", "**", "重点文字"],
    quote: ["> ", "", "引用内容"],
    link: ["[", "](https://)", "链接文字"],
    code: ["\n```\n", "\n```\n", "代码"],
  };
  const [before, after, placeholder] = actions[action];
  const content = selected || placeholder;
  const replacement = `${before}${content}${after}`;

  return {
    value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + content.length,
  };
}
