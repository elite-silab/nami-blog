export type PagesDeployStatus =
  | "queued"
  | "not_configured"
  | "failed"
  | "not_needed";

export type PagesDeployResult = { status: PagesDeployStatus };

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function isCloudflarePagesDeployHook(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "api.cloudflare.com" &&
      url.pathname.startsWith("/client/v4/pages/webhooks/deploy_hooks/")
    );
  } catch {
    return false;
  }
}

export async function triggerPagesRebuild(
  hookUrl: string | undefined,
  fetcher: Fetcher = fetch,
): Promise<PagesDeployResult> {
  const configuredUrl = hookUrl?.trim();
  if (!configuredUrl) return { status: "not_configured" };

  if (!isCloudflarePagesDeployHook(configuredUrl)) {
    console.error("Pages deploy hook configuration is invalid");
    return { status: "failed" };
  }

  try {
    const response = await fetcher(configuredUrl, { method: "POST" });
    if (!response.ok) {
      console.error("Pages deploy hook request failed", {
        status: response.status,
      });
      return { status: "failed" };
    }
    return { status: "queued" };
  } catch (error) {
    console.error("Pages deploy hook request failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: "failed" };
  }
}

export function noPagesRebuildNeeded(): PagesDeployResult {
  return { status: "not_needed" };
}
