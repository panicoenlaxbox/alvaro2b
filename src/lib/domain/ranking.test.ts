import { describe, expect, it } from "vitest";
import { competitionRanks } from "./ranking";

describe("competitionRanks", () => {
  const ranks = (values: number[], better: (a: number, b: number) => number) => {
    const map = competitionRanks(values.map((v, i) => ({ i, v })), (x) => x.v, better);
    return [...map.entries()].sort((a, b) => a[0].i - b[0].i).map(([, rank]) => rank);
  };

  it("shares positions on ties and skips the next ones", () => {
    expect(ranks([10, 20, 20, 5], (a, b) => b - a)).toEqual([3, 1, 1, 4]);
  });

  it("ranks ascending when lower is better", () => {
    expect(ranks([10, 20, 20, 5], (a, b) => a - b)).toEqual([2, 3, 3, 1]);
  });

  it("keeps the input order among ties", () => {
    const items = [{ name: "b", v: 1 }, { name: "a", v: 1 }];
    expect([...competitionRanks(items, (x) => x.v, (a, b) => b - a).keys()].map((x) => x.name)).toEqual(["b", "a"]);
  });

  it("handles no items", () => expect(competitionRanks([], () => 0, () => 0).size).toBe(0));
});
