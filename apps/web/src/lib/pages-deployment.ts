export type PagesDeployStatus =
  | "queued"
  | "not_configured"
  | "failed"
  | "not_needed";

export type PagesDeployNotice = {
  kind: "success" | "warning" | "error";
  message: string;
};

const NOTICE_KEY = "nami-pages-deployment";

export function getPagesDeployNotice(
  status: string | null | undefined,
): PagesDeployNotice | null {
  if (status === "queued") {
    return {
      kind: "success",
      message: "已保存，前台正在自动更新，通常需要 1–2 分钟。",
    };
  }
  if (status === "not_configured") {
    return {
      kind: "warning",
      message:
        "已保存；尚未配置自动更新，请在 Cloudflare 设置 Pages Deploy Hook。",
    };
  }
  if (status === "failed") {
    return {
      kind: "error",
      message:
        "已保存，但自动更新前台失败，请检查 Deploy Hook 后手动重新部署。",
    };
  }
  return null;
}

function storage() {
  return typeof sessionStorage === "undefined" ? null : sessionStorage;
}

export function rememberPagesDeployStatus(status: string | null | undefined) {
  if (!getPagesDeployNotice(status)) return;
  storage()?.setItem(NOTICE_KEY, status as string);
}

export function consumePagesDeployNotice() {
  const saved = storage()?.getItem(NOTICE_KEY);
  storage()?.removeItem(NOTICE_KEY);
  return getPagesDeployNotice(saved);
}
