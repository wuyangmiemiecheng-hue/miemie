import { pipeFormulas } from "../data/pipes";
import type { CalculationResult, NumericRecord } from "../types";
import { positive } from "./precision";

const pi = Math.PI;

const get = (input: NumericRecord, key: string, fallback = 0) => {
  const value = Number(input[key]);
  return Number.isFinite(value) ? value : fallback;
};

type NumberValues = Record<string, number>;

const withLengthWeight = (W: number, input: NumericRecord) => {
  const mode = input.mode === "length" ? "length" : "weight";
  const MInput = get(input, "M");
  const LInput = get(input, "L");
  const L = mode === "length" ? MInput / W : LInput;
  const M = mode === "length" ? MInput : W * LInput;
  return { length: L, totalWeight: M };
};

const pricing = (W: number, M: number, pricePerTon: number) => ({
  pricePerMeter: W / 1000 * pricePerTon,
  totalPrice: M / 1000 * pricePerTon
});

const surface = (D: number, d: number, L: number) => {
  const outerUnitArea = pi * D / 1000;
  const innerUnitArea = pi * d / 1000;
  return {
    outerUnitArea,
    innerUnitArea,
    outerTotalArea: outerUnitArea * L,
    innerTotalArea: innerUnitArea * L,
    totalArea: (outerUnitArea + innerUnitArea) * L
  };
};

export const calcRoundPipe = (input: NumericRecord, includeSurfaceArea = false): NumberValues => {
  const D = get(input, "D");
  const t = get(input, "t");
  const rho = get(input, "rho", 7850);
  positive(D, "外径必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  positive(rho, "材料密度必须大于 0。");
  if (2 * t >= D) throw new Error("壁厚必须小于外径的一半。");
  const d = D - 2 * t;
  const areaMm2 = pi * (D * t - t * t);
  const areaCm2 = areaMm2 / 100;
  const weightPerMeter = rho * areaMm2 / 1000000;
  const totals = withLengthWeight(weightPerMeter, input);
  const values: NumberValues = {
    d,
    areaCm2,
    weightPerMeter,
    ...totals,
    ...pricing(weightPerMeter, totals.totalWeight, get(input, "pricePerTon"))
  };
  if (includeSurfaceArea) Object.assign(values, surface(D, d, totals.length));
  return values;
};

export const calcGalvanizedPipe = (input: NumericRecord): NumberValues => {
  const D = get(input, "D");
  const t = get(input, "t");
  const c = get(input, "zincCoefficient", 1.06);
  positive(D, "外径必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  positive(c, "镀锌层重量系数必须大于 0。");
  if (2 * t >= D) throw new Error("壁厚必须小于外径的一半。");
  const d = D - 2 * t;
  const weightPerMeter = c * 0.0246615 * t * (D - t);
  const areaCm2 = pi * (D * t - t * t) / 100;
  const totals = withLengthWeight(weightPerMeter, input);
  return {
    d,
    areaCm2,
    weightPerMeter,
    ...totals,
    ...pricing(weightPerMeter, totals.totalWeight, get(input, "pricePerTon")),
    ...surface(D, d, totals.length)
  };
};

export const calcSquarePipe = (input: NumericRecord): NumberValues => {
  const w = get(input, "w");
  const t = get(input, "t");
  const rho = get(input, "rho", 7850);
  positive(w, "外边长必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  if (2 * t >= w) throw new Error("壁厚必须小于外边长的一半。");
  const wi = w - 2 * t;
  const areaMm2 = w * w - wi * wi;
  const weightPerMeter = rho * areaMm2 / 1000000;
  const totals = withLengthWeight(weightPerMeter, input);
  const outerUnitArea = 4 * w / 1000;
  const innerUnitArea = 4 * wi / 1000;
  return {
    d: wi,
    areaCm2: areaMm2 / 100,
    weightPerMeter,
    ...totals,
    ...pricing(weightPerMeter, totals.totalWeight, get(input, "pricePerTon")),
    outerUnitArea,
    innerUnitArea,
    outerTotalArea: outerUnitArea * totals.length,
    innerTotalArea: innerUnitArea * totals.length,
    totalArea: (outerUnitArea + innerUnitArea) * totals.length
  };
};

export const calcRectangularPipe = (input: NumericRecord): NumberValues => {
  const w = get(input, "w");
  const h = get(input, "h");
  const t = get(input, "t");
  const rho = get(input, "rho", 7850);
  positive(w, "外宽必须大于 0。");
  positive(h, "外高必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  if (2 * t >= w || 2 * t >= h) throw new Error("壁厚必须小于宽和高的一半。");
  const wi = w - 2 * t;
  const hi = h - 2 * t;
  const areaMm2 = w * h - wi * hi;
  const weightPerMeter = rho * areaMm2 / 1000000;
  const totals = withLengthWeight(weightPerMeter, input);
  const outerUnitArea = 2 * (w + h) / 1000;
  const innerUnitArea = 2 * (wi + hi) / 1000;
  return {
    areaCm2: areaMm2 / 100,
    weightPerMeter,
    ...totals,
    ...pricing(weightPerMeter, totals.totalWeight, get(input, "pricePerTon")),
    outerUnitArea,
    innerUnitArea,
    outerTotalArea: outerUnitArea * totals.length,
    innerTotalArea: innerUnitArea * totals.length,
    totalArea: (outerUnitArea + innerUnitArea) * totals.length
  };
};

export const calcFlatOvalPipe = (input: NumericRecord): NumberValues => {
  const a = get(input, "a");
  const b = get(input, "b");
  const t = get(input, "t");
  const rho = get(input, "rho", 7850);
  positive(a, "外部长尺寸必须大于 0。");
  positive(b, "外部短尺寸必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  if (a <= b || b <= 2 * t) throw new Error("平椭圆管需满足 a > b 且 b > 2t。");
  const bi = b - 2 * t;
  const areaMm2 = 2 * t * (a - b) + pi * (b * t - t * t);
  const weightPerMeter = rho * areaMm2 / 1000000;
  const totals = withLengthWeight(weightPerMeter, input);
  const outerUnitArea = (2 * (a - b) + pi * b) / 1000;
  const innerUnitArea = (2 * (a - b) + pi * bi) / 1000;
  return {
    areaCm2: areaMm2 / 100,
    weightPerMeter,
    ...totals,
    ...pricing(weightPerMeter, totals.totalWeight, get(input, "pricePerTon")),
    outerUnitArea,
    innerUnitArea,
    outerTotalArea: outerUnitArea * totals.length,
    innerTotalArea: innerUnitArea * totals.length,
    totalArea: (outerUnitArea + innerUnitArea) * totals.length
  };
};

export const calcStainlessPipe = (input: NumericRecord): NumberValues => {
  const D = get(input, "D");
  const t = get(input, "t");
  const L = get(input, "L");
  positive(D, "外径必须大于 0。");
  positive(t, "壁厚必须大于 0。");
  if (2 * t >= D) throw new Error("壁厚必须小于外径的一半。");
  const areaMm2 = pi * (D * t - t * t);
  const weight316 = 7980 * areaMm2 / 1000000;
  const weight304 = 7930 * areaMm2 / 1000000;
  const weight201 = get(input, "rho201", 7930) * areaMm2 / 1000000;
  return {
    areaCm2: areaMm2 / 100,
    weight316,
    weight304,
    weight201,
    total316: weight316 * L,
    total304: weight304 * L,
    total201: weight201 * L,
    totalPrice: get(input, "pricePerMeter") * L
  };
};

export const calculatePipe = (formulaId: string, input: NumericRecord): CalculationResult => {
  const formula = pipeFormulas.find((item) => item.id === formulaId);
  if (!formula) throw new Error("未找到管材计算项。");
  const normalized = { ...input, mode: input.mode };
  let values: NumberValues;
  switch (formula.pipeKind) {
    case "round":
      values = calcRoundPipe(normalized, false);
      break;
    case "roundSurface":
      values = calcRoundPipe(normalized, true);
      break;
    case "galvanized":
      values = calcGalvanizedPipe(normalized);
      break;
    case "square":
      values = calcSquarePipe(normalized);
      break;
    case "stainless":
      values = calcStainlessPipe(normalized);
      break;
    case "rectangular":
      values = calcRectangularPipe(normalized);
      break;
    case "flatOval":
      values = calcFlatOvalPipe(normalized);
      break;
    default:
      values = {};
  }
  return {
    values,
    formulaName: formula.name,
    status: formula.status,
    sourceIds: formula.sourceIds,
    messages: formula.notes ? [formula.notes] : []
  };
};
