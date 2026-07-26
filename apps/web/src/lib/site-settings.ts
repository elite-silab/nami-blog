import { cache } from "react";
import { apiJson } from "@/lib/cloudflare";
import type { ApiResponse, SiteSettings } from "@/lib/types";

/** One request-scoped read shared by layouts and pages. */
export const getPublicSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const result = await apiJson<ApiResponse<SiteSettings>>("/api/v1/settings");
    return result.data;
  } catch {
    // Keep the public shell and admin login usable while a fresh D1 is being
    // migrated. API-backed pages will still expose their own useful errors.
    return {};
  }
});
