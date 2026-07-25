import { describe, expect, it } from "vitest";
import { getPagesDeployNotice } from "./pages-deployment";

describe("Pages deployment notices", () => {
  it("应明确区分排队、未配置和失败", () => {
    expect(getPagesDeployNotice("queued")?.kind).toBe("success");
    expect(getPagesDeployNotice("not_configured")?.kind).toBe("warning");
    expect(getPagesDeployNotice("failed")?.kind).toBe("error");
    expect(getPagesDeployNotice("not_needed")).toBeNull();
  });
});
