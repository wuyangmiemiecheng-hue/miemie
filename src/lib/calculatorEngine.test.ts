import { describe, expect, it } from "vitest";
import { decimalToDms, dmsToDecimal, evaluateExpression } from "./calculatorEngine";

describe("calculatorEngine", () => {
  it("evaluates arithmetic without eval", () => {
    expect(evaluateExpression("2+3*4")).toBe(14);
    expect(evaluateExpression("sqrt(9)+2^3")).toBe(11);
  });

  it("honors degree trigonometry", () => {
    expect(evaluateExpression("sin(30)", "deg")).toBeCloseTo(0.5, 10);
  });

  it("converts DMS values", () => {
    expect(dmsToDecimal(30, 15, 30)).toBeCloseTo(30.2583333333, 10);
    const dms = decimalToDms(30.2583333333);
    expect(dms.deg).toBe(30);
    expect(dms.min).toBe(15);
    expect(dms.sec).toBeCloseTo(30, 6);
  });
});
