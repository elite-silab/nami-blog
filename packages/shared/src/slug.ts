export const SLUG_MAX_LENGTH = 255;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function isValidSlug(value: string) {
  return value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}

/**
 * Next.js/OpenNext 与 Hono 在不同运行时中可能返回已解码或未解码的动态路由参数。
 * 只尝试解码一次，让旧的中文 Slug 也能继续被读取。
 */
export function decodeSlugParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
