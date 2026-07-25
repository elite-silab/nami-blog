import { describe, expect, it, vi } from "vitest";
import { triggerPagesRebuild } from "../lib/pages-deploy";

const VALID_HOOK =
  "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/test-hook-id";

describe("Pages deploy hook", () => {
  it("returns not_configured without sending a request", async () => {
    const fetcher = vi.fn();
    await expect(triggerPagesRebuild(undefined, fetcher)).resolves.toEqual({
      status: "not_configured",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects non-Cloudflare hook URLs", async () => {
    const fetcher = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      triggerPagesRebuild("https://example.com/deploy", fetcher),
    ).resolves.toEqual({ status: "failed" });
    expect(fetcher).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("queues a Pages deployment with POST", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }));

    await expect(triggerPagesRebuild(VALID_HOOK, fetcher)).resolves.toEqual({
      status: "queued",
    });
    expect(fetcher).toHaveBeenCalledWith(VALID_HOOK, { method: "POST" });
  });

  it("keeps the article saved when the hook request fails", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(triggerPagesRebuild(VALID_HOOK, fetcher)).resolves.toEqual({
      status: "failed",
    });
    consoleSpy.mockRestore();
  });
});
