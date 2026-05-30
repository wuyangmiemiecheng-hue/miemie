import { describe, expect, it } from "vitest";
import { calculateSurvey, norm360 } from "./surveyCalculations";

describe("surveyCalculations", () => {
  it("normalizes azimuths", () => {
    expect(norm360(-10)).toBe(350);
    expect(norm360(370)).toBe(10);
  });

  it("calculates coordinate inverse", () => {
    const result = calculateSurvey("coordinate-inverse", {
      xA: 0,
      yA: 0,
      xB: 3,
      yB: 4
    });
    expect(result.values.deltaX).toBeCloseTo(3, 8);
    expect(result.values.deltaY).toBeCloseTo(4, 8);
    expect(result.values.distance).toBeCloseTo(5, 8);
    expect(result.values.azimuth).toBeCloseTo(53.13010235, 8);
  });

  it("calculates point to line distance", () => {
    const result = calculateSurvey("point-line-distance", {
      xA: 0,
      yA: 0,
      xB: 10,
      yB: 0,
      xP: 5,
      yP: 3
    });
    expect(result.values.distance).toBeCloseTo(3, 8);
  });
});
