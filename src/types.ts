export type FormulaStatus = "已核对" | "需复核" | "暂缺权威来源" | "待完善";

export type ModuleId = "calculator" | "survey" | "pipes" | "units";

export type FieldType = "number" | "select";

export interface SourceItem {
  id: string;
  module: ModuleId;
  title: string;
  file: string;
  status: FormulaStatus;
  detail: string;
  url?: string;
}

export interface InputField {
  key: string;
  label: string;
  unit?: string;
  required?: boolean;
  type?: FieldType;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: string | number;
  hint?: string;
}

export interface OutputField {
  key: string;
  label: string;
  unit?: string;
}

export interface FormulaItem {
  id: string;
  module: ModuleId;
  category: string;
  name: string;
  inputs: InputField[];
  outputs: OutputField[];
  formulaText: string;
  sourceIds: string[];
  status: FormulaStatus;
  notes?: string;
}

export interface UnitItem {
  name: string;
  symbol: string;
  toBaseFactor: number;
  note?: string;
  status?: FormulaStatus;
}

export interface UnitCategory {
  id: string;
  name: string;
  baseUnit: string;
  sourceIds: string[];
  status: FormulaStatus;
  note?: string;
  units: UnitItem[];
}

export interface PipeMaterial {
  name: string;
  density: number;
  note?: string;
}

export interface PipeFormula extends FormulaItem {
  pipeKind:
    | "round"
    | "roundSurface"
    | "galvanized"
    | "square"
    | "stainless"
    | "rectangular"
    | "flatOval"
    | "referenceTable";
  defaultDensity?: number;
}

export type NumericRecord = Record<string, number | string>;

export interface CalculationResult {
  values: Record<string, number>;
  formulaName: string;
  status: FormulaStatus;
  sourceIds: string[];
  messages?: string[];
}
