import { describe, expect, it } from "vitest";
import { parsePagination } from "../lib/pagination";

describe("parsePagination", () => {
  it("uses safe defaults", () => {
    expect(parsePagination()).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it("accepts bounded values", () => {
    expect(parsePagination("3", "100")).toEqual({ page: 3, limit: 100, offset: 200 });
  });

  it("rejects invalid and oversized values", () => {
    expect(parsePagination("0", "20")).toBeNull();
    expect(parsePagination("1", "101")).toBeNull();
    expect(parsePagination("NaN", "20")).toBeNull();
  });
});
