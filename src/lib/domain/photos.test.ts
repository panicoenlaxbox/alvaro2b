import { describe, expect, it } from "vitest";
import { groupBySession } from "./photos";

const photo = (id: string, session: { id: string; date: string } | null) => ({ id, session });

describe("groupBySession", () => {
  it("puts the Album first, then the Sessions, newest first", () => {
    const groups = groupBySession([
      photo("a1", null),
      photo("p1", { id: "s1", date: "2026-09-21" }),
      photo("p2", { id: "s2", date: "2026-10-12" }),
      photo("p3", { id: "s1", date: "2026-09-21" }),
    ]);
    expect(groups.map((g) => [g.session?.id ?? "album", g.photos.map((p) => p.id)])).toEqual([
      ["album", ["a1"]],
      ["s2", ["p2"]],
      ["s1", ["p1", "p3"]],
    ]);
  });

  it("leaves out the Album when every Photo has a Session", () => {
    expect(groupBySession([photo("p1", { id: "s1", date: "2026-09-21" })]).map((g) => g.session?.id)).toEqual(["s1"]);
  });
});
