import { describe, expect, it } from "vitest";
import { isValidStars, starsText, summarizeRatings } from "./ratings";

const names = new Map([
  ["a", "Ana"],
  ["b", "Bruno"],
  ["c", "Carla"],
]);

describe("summarizeRatings", () => {
  it("has no average without ratings", () => {
    expect(summarizeRatings([], names)).toEqual({ average: null, count: 0, breakdown: [] });
  });

  it("averages to one decimal and sorts the breakdown by name, so changing a rating never moves its row", () => {
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
    expect(summary.breakdown.map((r) => r.name)).toEqual(["Ana", "Bruno", "Carla"]);
  });
});

describe("starsText", () => {
  it("renders five positions", () => {
    expect(starsText(3)).toBe("★★★☆☆");
    expect(starsText(0)).toBe("☆☆☆☆☆");
    expect(starsText(7)).toBe("★★★★★");
  });
});

describe("isValidStars", () => {
  it("accepts whole stars from 0 to 5", () => {
    for (const stars of [0, 1, 3, 5]) expect(isValidStars(stars)).toBe(true);
  });
  it("rejects anything else", () => {
    for (const stars of [-1, 6, 2.5, NaN]) expect(isValidStars(stars)).toBe(false);
  });
});
