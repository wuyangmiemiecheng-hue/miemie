import { describe, expect, it } from "vitest";
import { calcFlatOvalPipe, calcRectangularPipe, calcRoundPipe, calcSquarePipe } from "./pipeCalculations";

describe("pipeCalculations", () => {
  it("calculates steel round pipe weight with documented shortcut", () => {
    const result = calcRoundPipe({ D: 100, t: 4, rho: 7850, L: 6, pricePerTon: 4500 });
    expect(result.weightPerMeter).toBeCloseTo(0.0246615 * 4 * (100 - 4), 3);
    expect(result.totalWeight).toBeCloseTo(Number(result.weightPerMeter) * 6, 8);
  });

  it("calculates square pipe area", () => {
    const result = calcSquarePipe({ w: 80, t: 4, rho: 7850, L: 6, pricePerTon: 4500 });
    expect(result.areaCm2).toBeCloseTo((80 * 80 - 72 * 72) / 100, 8);
  });

  it("calculates rectangular pipe area", () => {
    const result = calcRectangularPipe({ w: 100, h: 60, t: 4, rho: 7850, L: 6, pricePerTon: 4500 });
    expect(result.areaCm2).toBeCloseTo((100 * 60 - 92 * 52) / 100, 8);
  });

  it("calculates flat oval pipe area", () => {
    const result = calcFlatOvalPipe({ a: 120, b: 60, t: 4, rho: 7850, L: 6, pricePerTon: 4500 });
    expect(result.areaCm2).toBeCloseTo((2 * 4 * (120 - 60) + Math.PI * (60 * 4 - 4 * 4)) / 100, 8);
  });
});
