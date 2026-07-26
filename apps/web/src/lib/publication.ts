export function publicationMessage(status?: string) {
  return status === "live" ? "已保存，前台无需重新部署。" : "已保存。";
}
