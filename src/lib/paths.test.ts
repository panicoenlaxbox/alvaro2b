import { describe, expect, it } from "vitest";
import { isPublicPath, safeNextPath } from "./paths";

describe("isPublicPath", () => {
  it.each(["/login", "/privacy", "/auth/callback", "/auth/signout", "/api/keep-alive", "/dev-login"])(
    "lets signed-out visitors open %s",
    (path) => expect(isPublicPath(path)).toBe(true),
  );

  it.each(["/", "/sessions", "/games/1", "/loginx", "/privacy-other", "/api/export"])("protects %s", (path) =>
    expect(isPublicPath(path)).toBe(false),
  );
});

describe("safeNextPath", () => {
  it("keeps relative paths", () => expect(safeNextPath("/sessions/1?tab=poll")).toBe("/sessions/1?tab=poll"));
  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example"])(
    "falls back to / for %s",
    (value) => expect(safeNextPath(value)).toBe("/"),
  );
});
