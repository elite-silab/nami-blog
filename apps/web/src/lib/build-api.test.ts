import { describe, expect, it } from "vitest";
import { buildApiUrl } from "./build-api";

describe("buildApiUrl", () => {
  it("preserves API paths and existing query parameters", () => {
    const url = new URL(
      buildApiUrl(
        "https://nami-blog-api.example.workers.dev",
        "/api/v1/posts?limit=10",
      ),
    );

    expect(url.origin).toBe("https://nami-blog-api.example.workers.dev");
    expect(url.pathname).toBe("/api/v1/posts");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("_nami_build")).toBeTruthy();
  });
});
