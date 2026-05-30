import type { PipeFormula, PipeMaterial } from "../types";

export const pipeMaterials: PipeMaterial[] = [
  { name: "钢密度", density: 7850 },
  { name: "铝密度", density: 2702 },
  { name: "铜密度", density: 8900 },
  { name: "锌板", density: 7200 },
  { name: "低碳钢（碳0.1%）", density: 7850 },
  { name: "中碳钢（碳0.4%）", density: 7820 },
  { name: "高碳钢（碳1%）", density: 7810 },
  { name: "高速钢（钨9%）", density: 8300 },
  { name: "高速钢（钨18%）", density: 8700 },
  { name: "不锈钢（含铬13%）", density: 7750 },
  { name: "不锈钢（316L）", density: 7980 },
  { name: "不锈钢（1Cr18Ni9）", density: 7930, note: "工程上常作为 304 近似密度。" },
  { name: "不锈钢（1Cr13）", density: 7750 },
  { name: "不锈钢（1Cr17）", density: 7700 },
  { name: "紫铜", density: 8930 },
  { name: "黄铜", density: 8500 },
  { name: "超硬铝", density: 2850 },
  { name: "压铸铝合金", density: 2660 },
  { name: "铅板", density: 11340 },
  { name: "铸钢", density: 7800 },
  { name: "灰铸铁（<=HT200）", density: 7200 },
  { name: "灰铸铁（>=HT250）", density: 7350 },
  { name: "工业纯铁", density: 7870 },
  { name: "有机玻璃", density: 1180 },
  { name: "水泥", density: 1200 }
];

export const plasticPipeReference = [
  {
    name: "给水用聚乙烯（PE）",
    material: "聚乙烯",
    usage: "燃气管道、给水系统、农业灌溉及化工流体输送",
    density: "PE80: 926-940；PE100: 941-965",
    standard: "GB/T 13663.2-2018"
  },
  {
    name: "冷热水用耐热聚乙烯（PE-RT）",
    material: "耐热聚乙烯",
    usage: "地暖系统、温泉管道",
    density: "935-965",
    standard: "GB/T 28799.2-2020"
  },
  {
    name: "给水用硬聚氯乙烯（PVC-U）",
    material: "硬聚氯乙烯",
    usage: "冷水、温水供应系统、污水排放系统以及工业领域",
    density: "给水管: 1350-1460；排水管: 1350-1550",
    standard: "GB/T 10002.1-2023"
  },
  {
    name: "冷热水用氯化聚氯乙烯（PVC-C）",
    material: "氯化聚氯乙烯",
    usage: "饮用水和热水管道、化学品输送和高温废水排放",
    density: "1450-1580",
    standard: "GB/T 18993.2-2020"
  },
  {
    name: "给水用抗冲改性聚氯乙烯（PVC-M）",
    material: "抗冲改性聚氯乙烯",
    usage: "寒冷地区或易受外力冲击的环境",
    density: "1350-1460",
    standard: "GB/T 32018.1-2015"
  },
  {
    name: "压力输水用取向硬聚氯乙烯（PVC-O）",
    material: "取向硬聚氯乙烯",
    usage: "特别适用于高压水的输送",
    density: "1350-1460",
    standard: "GB/T 41422-2022"
  },
  {
    name: "冷热水用聚丙烯（PP-R）",
    material: "无规共聚聚丙烯",
    usage: "长期使用的冷、热水管道系统",
    density: "900",
    standard: "GB/T 18742.2-2017"
  },
  {
    name: "冷热水用聚丁烯（PB）",
    material: "聚丁烯",
    usage: "高端市场",
    density: "930",
    standard: "GB/T 19473.2-2020"
  }
];

const modeInput = {
  key: "mode",
  label: "计算模式",
  type: "select" as const,
  defaultValue: "weight",
  options: [
    { label: "求总重", value: "weight" },
    { label: "求总长", value: "length" }
  ]
};

const roundInputs = [
  modeInput,
  { key: "rho", label: "材料密度", unit: "kg/m3", required: true, defaultValue: 7850 },
  { key: "D", label: "外径 D", unit: "mm", required: true, defaultValue: 100 },
  { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 4 },
  { key: "L", label: "总长度 L（求总重）", unit: "m", defaultValue: 6 },
  { key: "M", label: "总重量 M（求总长）", unit: "kg", defaultValue: 50 },
  { key: "pricePerTon", label: "市场价", unit: "元/t", defaultValue: 4500 }
];

const roundOutputs = [
  { key: "d", label: "内径 d", unit: "mm" },
  { key: "areaCm2", label: "截面面积 A", unit: "cm2" },
  { key: "weightPerMeter", label: "理论重量 W", unit: "kg/m" },
  { key: "length", label: "总长度 L", unit: "m" },
  { key: "totalWeight", label: "总重量 M", unit: "kg" },
  { key: "pricePerMeter", label: "换算单价", unit: "元/m" },
  { key: "totalPrice", label: "总价", unit: "元" }
];

const surfaceOutputs = [
  ...roundOutputs,
  { key: "innerUnitArea", label: "管内单位面积 Si", unit: "m2/m" },
  { key: "outerUnitArea", label: "管外单位面积 So", unit: "m2/m" },
  { key: "innerTotalArea", label: "管内总面积", unit: "m2" },
  { key: "outerTotalArea", label: "管外总面积", unit: "m2" },
  { key: "totalArea", label: "总面积", unit: "m2" }
];

export const pipeFormulas: PipeFormula[] = [
  {
    id: "plastic-reference",
    module: "pipes",
    category: "塑料管材选用表",
    name: "塑料管材选用表",
    pipeKind: "referenceTable",
    inputs: [],
    outputs: [],
    formulaText: "资料表按截图抄录名称、材料、适用场景、密度、标准号，不参与计算。",
    sourceIds: ["pipe-part-2"],
    status: "已核对" as const
  },
  ...[
    ["pe", "给水用聚乙烯（PE）管", 933, "PE80 默认 933 kg/m3；PE100 可自定义。"],
    ["pert", "冷热水用耐热聚乙烯（PE-RT）管", 950, "建议密度 935-965 kg/m3，可自定义。"],
    ["pb", "冷热水用聚丁烯（PB）管", 930, "默认 930 kg/m3。"],
    ["pvcu10", "给水用硬聚氯乙烯（PVC-U）管 10Mpa", 1400, "名称按截图保留，压力等级写法需复核。"],
    ["pvcu125", "给水用硬聚氯乙烯（PVC-U）管 12.5Mpa", 1400, "名称按截图保留，压力等级写法需复核。"]
  ].map(([id, name, density, note]) => ({
    id: String(id),
    module: "pipes" as const,
    category: "塑料圆管自定义法",
    name: String(name),
    pipeKind: "round" as const,
    defaultDensity: Number(density),
    inputs: roundInputs.map((input) => (input.key === "rho" ? { ...input, defaultValue: Number(density) } : input)),
    outputs: roundOutputs,
    formulaText: "d = D - 2t；A = pi * (D*t - t^2) / 100；W = rho * pi * (D*t - t^2) / 1000000；M = W * L；L = M / W。",
    sourceIds: String(id).startsWith("pvcu") ? ["pipe-part-2", "pipe-review"] : ["pipe-part-2"],
    status: (String(id).startsWith("pvcu") ? "需复核" : "已核对") as "需复核" | "已核对",
    notes: String(note)
  })),
  {
    id: "normal-steel",
    module: "pipes",
    category: "金属圆管自定义法",
    name: "普通钢管",
    pipeKind: "roundSurface",
    defaultDensity: 7850,
    inputs: roundInputs,
    outputs: surfaceOutputs,
    formulaText: "圆形空心管通用公式，另计算 Si = pi*d/1000、So = pi*D/1000 及总表面积。",
    sourceIds: ["pipe-part-2", "gb-steel"],
    status: "已核对" as const
  },
  {
    id: "galvanized",
    module: "pipes",
    category: "金属圆管自定义法",
    name: "镀锌钢管",
    pipeKind: "galvanized",
    inputs: [
      modeInput,
      { key: "D", label: "外径 D", unit: "mm", required: true, defaultValue: 100 },
      { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 4 },
      { key: "L", label: "总长度 L（求总重）", unit: "m", defaultValue: 6 },
      { key: "M", label: "总重量 M（求总长）", unit: "kg", defaultValue: 50 },
      { key: "pricePerTon", label: "市场价", unit: "元/t", defaultValue: 4500 },
      { key: "zincCoefficient", label: "镀锌层重量系数 c", required: true, defaultValue: 1.06, hint: "默认可改，严格做法需查 c 表。" }
    ],
    outputs: surfaceOutputs,
    formulaText: "W0 = 0.0246615 * t * (D - t)；W = c * W0；其余金额和表面积按圆管公式。",
    sourceIds: ["pipe-part-2", "pipe-review", "gb-steel"],
    status: "需复核" as const,
    notes: "不做查表法，c 作为可修改默认系数。"
  },
  {
    id: "square",
    module: "pipes",
    category: "型材自定义法",
    name: "方管",
    pipeKind: "square",
    defaultDensity: 7850,
    inputs: [
      modeInput,
      { key: "rho", label: "材料密度", unit: "kg/m3", required: true, defaultValue: 7850 },
      { key: "w", label: "外边长 w", unit: "mm", required: true, defaultValue: 80 },
      { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 4 },
      { key: "L", label: "总长度 L（求总重）", unit: "m", defaultValue: 6 },
      { key: "M", label: "总重量 M（求总长）", unit: "kg", defaultValue: 50 },
      { key: "pricePerTon", label: "市场价", unit: "元/t", defaultValue: 4500 }
    ],
    outputs: surfaceOutputs,
    formulaText: "wi = w - 2t；A = w^2 - wi^2；W = rho*A/1000000；So = 4w/1000；Si = 4wi/1000。",
    sourceIds: ["pipe-part-2", "gb-steel"],
    status: "已核对" as const
  },
  {
    id: "stainless",
    module: "pipes",
    category: "金属圆管自定义法",
    name: "不锈钢管",
    pipeKind: "stainless",
    inputs: [
      { key: "D", label: "外径 D", unit: "mm", required: true, defaultValue: 100 },
      { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 3 },
      { key: "L", label: "总长度 L", unit: "m", required: true, defaultValue: 6 },
      { key: "pricePerMeter", label: "市场价", unit: "元/m", defaultValue: 40 },
      { key: "rho201", label: "201 密度", unit: "kg/m3", defaultValue: 7930, hint: "资料未完整显示，允许自定义。" }
    ],
    outputs: [
      { key: "areaCm2", label: "截面面积 A", unit: "cm2" },
      { key: "weight316", label: "316/316L 理论重量", unit: "kg/m" },
      { key: "weight304", label: "304 理论重量", unit: "kg/m" },
      { key: "weight201", label: "201 理论重量", unit: "kg/m" },
      { key: "total316", label: "316/316L 总重量", unit: "kg" },
      { key: "total304", label: "304 总重量", unit: "kg" },
      { key: "total201", label: "201 总重量", unit: "kg" },
      { key: "totalPrice", label: "总价", unit: "元" }
    ],
    formulaText: "A = pi*(D*t - t^2)；W_grade = rho_grade*A/1000000；M_grade = W_grade*L；C_total = P_m*L。",
    sourceIds: ["pipe-part-2", "pipe-review", "gb-steel"],
    status: "需复核" as const,
    notes: "201 密度来源不完整，不写死为唯一值。"
  },
  {
    id: "rectangular",
    module: "pipes",
    category: "型材自定义法",
    name: "矩形管",
    pipeKind: "rectangular",
    defaultDensity: 7850,
    inputs: [
      modeInput,
      { key: "rho", label: "材料密度", unit: "kg/m3", required: true, defaultValue: 7850 },
      { key: "w", label: "外宽 w", unit: "mm", required: true, defaultValue: 100 },
      { key: "h", label: "外高 h", unit: "mm", required: true, defaultValue: 60 },
      { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 4 },
      { key: "L", label: "总长度 L（求总重）", unit: "m", defaultValue: 6 },
      { key: "M", label: "总重量 M（求总长）", unit: "kg", defaultValue: 50 },
      { key: "pricePerTon", label: "市场价", unit: "元/t", defaultValue: 4500 }
    ],
    outputs: surfaceOutputs,
    formulaText: "wi = w - 2t；hi = h - 2t；A = w*h - wi*hi；W = rho*A/1000000；So = 2(w+h)/1000；Si = 2(wi+hi)/1000。",
    sourceIds: ["pipe-part-2", "gb-steel"],
    status: "已核对" as const
  },
  {
    id: "flat-oval",
    module: "pipes",
    category: "型材自定义法",
    name: "平椭圆管",
    pipeKind: "flatOval",
    defaultDensity: 7850,
    inputs: [
      modeInput,
      { key: "rho", label: "材料密度", unit: "kg/m3", required: true, defaultValue: 7850 },
      { key: "a", label: "外部长尺寸 a", unit: "mm", required: true, defaultValue: 120 },
      { key: "b", label: "外部短尺寸 b", unit: "mm", required: true, defaultValue: 60 },
      { key: "t", label: "壁厚 t", unit: "mm", required: true, defaultValue: 4 },
      { key: "L", label: "总长度 L（求总重）", unit: "m", defaultValue: 6 },
      { key: "M", label: "总重量 M（求总长）", unit: "kg", defaultValue: 50 },
      { key: "pricePerTon", label: "市场价", unit: "元/t", defaultValue: 4500 }
    ],
    outputs: surfaceOutputs,
    formulaText: "A = 2t(a-b) + pi(bt - t^2)；P_outer = 2(a-b)+pi*b；P_inner = 2(a-b)+pi(b-2t)。",
    sourceIds: ["pipe-part-2"],
    status: "已核对" as const
  },
  {
    id: "seamless",
    module: "pipes",
    category: "金属圆管自定义法",
    name: "无缝钢管",
    pipeKind: "roundSurface",
    defaultDensity: 7850,
    inputs: roundInputs,
    outputs: surfaceOutputs,
    formulaText: "无缝钢管为本阶段最后一项，公式与普通圆形钢管一致，默认钢密度 7850 kg/m3 且可自定义。",
    sourceIds: ["pipe-part-2", "gb-steel"],
    status: "已核对" as const
  }
];
