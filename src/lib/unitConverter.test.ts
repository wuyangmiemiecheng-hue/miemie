import { describe, expect, it } from "vitest";
import { unitCategories } from "../data/units";
import { convertUnit } from "./unitConverter";

describe("unitConverter", () => {
  it("converts length by source and target base factors", () => {
    const length = unitCategories.find((category) => category.id === "length")!;
    expect(convertUnit(length, 10, "ft", "m")).toBeCloseTo(3.048, 10);
  });

  it("keeps energy marked as sourced but requiring review", () => {
    const energy = unitCategories.find((category) => category.id === "energy")!;
    expect(energy.status).toBe("需复核");
    expect(convertUnit(energy, 1, "kWh", "J")).toBeCloseTo(3600000, 6);
  });
});
