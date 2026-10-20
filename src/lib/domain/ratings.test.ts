import { describe, expect, it } from "vitest";
import { starsText, summarizeRatings } from "./ratings";

const names = new Map([
  ["a", "Ana"],
  ["b", "Bruno"],
  ["c", "Carla"],
]);

describe("summarizeRatings", () => {
  it("has no average without ratings", () => {
    expect(summarizeRatings([], names)).toEqual({ average: null, count: 0, breakdown: [] });
  });

  it("averages to one decimal and sorts the breakdown by stars, then name", () => {
    const summary = summarizeRatings(
      [
        { playerId: "c", stars: 4 },
        { playerId: "a", stars: 4 },
        { playerId: "b", stars: 5 },
      ],
      names,
    );
    expect(summary.average).toBe(4.3);
    expect(summary.count).toBe(3);
    expect(summary.breakdown.map((r) => r.name)).toEqual(["Bruno", "Ana", "Carla"]);
  });
});

describe("starsText", () => {
  it("renders five positions", () => {
    expect(starsText(3)).toBe("★★★☆☆");
    expect(starsText(0)).toBe("☆☆☆☆☆");
    expect(starsText(7)).toBe("★★★★★");
  });
});
