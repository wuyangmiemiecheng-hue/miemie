import type { UnitCategory } from "../types";

export const convertUnit = (
  category: UnitCategory,
  value: number,
  fromSymbol: string,
  toSymbol: string
) => {
  const source = category.units.find((unit) => unit.symbol === fromSymbol);
  const target = category.units.find((unit) => unit.symbol === toSymbol);
  if (!source || !target) throw new Error("请选择有效的源单位和目标单位。");
  if (!Number.isFinite(value)) throw new Error("请输入有效数值。");
  return value * source.toBaseFactor / target.toBaseFactor;
};
