import { describe, expect, it } from "vitest";
import { fitWithin } from "./image-size";

describe("fitWithin", () => {
  it("keeps small images", () => expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 }));
  it("scales landscape by width", () => expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 }));
  it("scales portrait by height", () => expect(fitWithin(3024, 4032, 2000)).toEqual({ width: 1500, height: 2000 }));
  it("never returns zero", () => expect(fitWithin(10000, 1, 400)).toEqual({ width: 400, height: 1 }));
});
