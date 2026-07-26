export function publicationMessage(status?: string) {
  return status === "live" ? "已保存，前台已实时生效。" : "已保存。";
}
