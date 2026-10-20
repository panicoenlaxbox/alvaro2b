import { describe, expect, it } from "vitest";
import { paginate, parsePage } from "./paginate";

const items = Array.from({ length: 23 }, (_, i) => i + 1);

describe("paginate", () => {
  it("returns the requested page", () => {
    expect(paginate(items, 1, 10)).toEqual({ items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], page: 1, pageCount: 3 });
    expect(paginate(items, 3, 10)).toEqual({ items: [21, 22, 23], page: 3, pageCount: 3 });
  });
  it("clamps pages out of range", () => {
    expect(paginate(items, 9, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
  });
  it("has one empty page without items", () => expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, pageCount: 1 }));
});

describe("parsePage", () => {
  it("reads a positive integer and defaults to 1", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage(["4", "5"])).toBe(4);
  });
});
