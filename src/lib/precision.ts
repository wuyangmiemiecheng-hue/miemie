export const roundValue = (value: number, digits = 8): number => {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e8 || abs < 1e-6)) {
    return Number(value.toPrecision(10));
  }
  return Number(value.toFixed(digits));
};

export const formatNumber = (value: number | undefined, digits = 8): string => {
  if (value === undefined || Number.isNaN(value)) return "-";
  if (!Number.isFinite(value)) return String(value);
  return String(roundValue(value, digits));
};

export const requireFinite = (value: number, message: string) => {
  if (!Number.isFinite(value)) throw new Error(message);
};

export const positive = (value: number, message: string) => {
  requireFinite(value, message);
  if (value <= 0) throw new Error(message);
};
