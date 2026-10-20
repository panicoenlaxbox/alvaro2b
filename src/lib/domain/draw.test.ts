import { describe, expect, it } from "vitest";
import { drawTicks } from "./draw";

describe("drawTicks", () => {
  const ticks = drawTicks(2800, 16);

  it("has one delay per step", () => expect(ticks).toHaveLength(16));
  it("adds up to the total time", () => expect(ticks.reduce((a, b) => a + b, 0)).toBeCloseTo(2800, -1));
  it("slows down towards the end", () => {
    for (let i = 1; i < ticks.length; i++) expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]!);
    expect(ticks.at(-1)).toBeGreaterThan(ticks[0]! * 5);
  });
});
