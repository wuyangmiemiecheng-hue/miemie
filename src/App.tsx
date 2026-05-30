import {
  ArrowLeft,
  Beaker,
  Calculator,
  Clipboard,
  FileText,
  Home,
  Info,
  Moon,
  Ruler,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { pipeFormulas, pipeMaterials, plasticPipeReference } from "./data/pipes";
import { getSourcesByIds, sources } from "./data/sources";
import { surveyFormulas } from "./data/survey";
import { unitCategories } from "./data/units";
import { decimalToDms, dmsToDecimal, evaluateExpression, type AngleMode } from "./lib/calculatorEngine";
import { numberToChineseUpper } from "./lib/numberToChineseUpper";
import { calculatePipe } from "./lib/pipeCalculations";
import { formatNumber } from "./lib/precision";
import { calculateSurvey } from "./lib/surveyCalculations";
import { convertUnit } from "./lib/unitConverter";
import type { CalculationResult, FormulaItem, InputField, NumericRecord } from "./types";

type Page = "home" | "calculator" | "pipes" | "survey" | "units" | "about" | "sources";
type Theme = "light" | "dark";

const pageTitles: Record<Page, string> = {
  home: "建工计算器",
  calculator: "计算器",
  pipes: "管材计算",
  survey: "工程测量计算",
  units: "单位换算",
  about: "关于",
  sources: "所有公式数据来源"
};

const iconMap = {
  calculator: Calculator,
  pipes: Wrench,
  survey: Ruler,
  units: Shuffle
};

const safeCopy = async (text: string) => {
  await navigator.clipboard?.writeText(text);
};

type AngleDisplayMode = "decimal" | "dms";

const formatAngle = (value: number, mode: AngleDisplayMode) => {
  if (mode === "decimal") return `${formatNumber(value, 10)}°`;
  const dms = decimalToDms(value);
  return `${dms.deg}° ${dms.min}′ ${formatNumber(dms.sec, 4)}″`;
};

const formatOutputValue = (value: number, unit?: string, angleMode: AngleDisplayMode = "decimal") => {
  if (unit === "deg") return formatAngle(value, angleMode);
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
};

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("jg-theme") as Theme) || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("jg-theme", theme);
  }, [theme]);
  return { theme, setTheme };
}

function App() {
  const { theme, setTheme } = useTheme();
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="app-shell">
      <AnimatedBackground />
      <header className="topbar">
        <button className="icon-button" onClick={() => setPage(page === "home" ? "home" : "home")} title="返回首页">
          {page === "home" ? <Home size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div className="brand">
          <span>{pageTitles[page]}</span>
        </div>
        <nav className="top-actions">
          <button className="glass-button compact" onClick={() => setPage("about")}>关于</button>
          <button
            className="icon-button"
            title="切换主题"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </nav>
      </header>
      <main className="page-wrap">
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "calculator" && <CalculatorPage />}
        {page === "pipes" && <PipePage />}
        {page === "survey" && <SurveyPage />}
        {page === "units" && <UnitsPage />}
        {page === "about" && <AboutPage setPage={setPage} />}
        {page === "sources" && <SourcesPage />}
      </main>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      <div />
      <div />
      <div />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}

function HomePage({ setPage }: { setPage: (page: Page) => void }) {
  const entries: Array<{ page: Page; title: string; desc: string; icon: keyof typeof iconMap }> = [
    { page: "calculator", title: "计算器", desc: "普通、科学、度分秒", icon: "calculator" },
    { page: "pipes", title: "管材计算", desc: "PE 到无缝钢管", icon: "pipes" },
    { page: "survey", title: "工程测量计算", desc: "坐标、放样、交会、高程", icon: "survey" },
    { page: "units", title: "单位换算", desc: "十类工程常用单位", icon: "units" }
  ];
  return (
    <div className="home-page">
      <div className="hero">
        <h1>建工计算器</h1>
      </div>
      <div className="entry-grid">
        {entries.map((entry) => {
          const Icon = iconMap[entry.icon];
          return (
            <button key={entry.page} className="entry-card" onClick={() => setPage(entry.page)}>
              <Icon size={30} />
              <strong>{entry.title}</strong>
              <span>{entry.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalculatorPage() {
  const [mode, setMode] = useState<"normal" | "scientific" | "dms">("normal");
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem("jg-calc-history") || "[]"));
  const [dms, setDms] = useState({ deg: 30, min: 15, sec: 30 });

  useEffect(() => localStorage.setItem("jg-calc-history", JSON.stringify(history.slice(0, 20))), [history]);

  const append = (token: string) => setExpression((value) => value + token);
  const run = () => {
    try {
      const value = evaluateExpression(expression, angleMode);
      const text = formatNumber(value, 12);
      setResult(text);
      setError("");
      setHistory((items) => [`${expression} = ${text}`, ...items].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "表达式不合法。");
    }
  };
  const upper = () => {
    try {
      setResult(numberToChineseUpper(Number(result || expression)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法转换中文大写。");
    }
  };
  const dmsDecimal = dmsToDecimal(dms.deg, dms.min, dms.sec);
  const dmsBack = decimalToDms(Number(result || 0));

  const normalKeys = ["大写", "历史", "C", "退格", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];
  const scientificKeys = ["角度", "C", "退格", "sin", "cos", "tan", "asin", "acos", "atan", "x^y", "x²", "√", "π", "(", ")", "%", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];
  const dmsKeys = ["度分秒", "C", "退格", "sin", "cos", "tan", "°", "′", "″", "π", "(", ")", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];
  const keys = mode === "normal" ? normalKeys : mode === "scientific" ? scientificKeys : dmsKeys;

  const press = (key: string) => {
    if (key === "C") {
      setExpression("");
      setResult("");
      setError("");
    } else if (key === "退格") {
      setExpression((value) => value.slice(0, -1));
    } else if (key === "=") {
      run();
    } else if (key === "大写") {
      upper();
    } else if (key === "历史") {
      setResult(history[0] || "暂无历史");
    } else if (key === "角度") {
      setAngleMode((current) => (current === "deg" ? "rad" : "deg"));
    } else if (key === "x^y") append("^");
    else if (key === "x²") append("^2");
    else if (key === "√") append("sqrt(");
    else if (["sin", "cos", "tan", "asin", "acos", "atan"].includes(key)) append(`${key}(`);
    else if (key === "π") append("pi");
    else if (["°", "′", "″", "度分秒"].includes(key)) {
      setResult(`${formatNumber(dmsDecimal, 10)}°`);
    } else append(key);
  };

  return (
    <div className="stack">
      <Tabs options={[["normal", "普通计算"], ["scientific", "科学计算"], ["dms", "度分秒"]]} value={mode} onChange={(v) => setMode(v as typeof mode)} />
      <div className="calculator-layout">
        <GlassCard className="calculator-panel">
          <div className="calc-display">
            <span>当前角度模式：{angleMode === "deg" ? "角度" : angleMode === "rad" ? "弧度" : "度分秒"}</span>
            <div className="expression">{expression || "0"}</div>
            <div className="calc-result">{result || "结果"}</div>
            {error && <p className="error-text">{error}</p>}
          </div>
          <div className={`key-grid ${mode !== "normal" ? "scientific" : ""}`}>
            {keys.map((key) => (
              <button key={key} className="calc-key" onClick={() => press(key)}>{key}</button>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h3><Sparkles size={18} /> 度分秒工具</h3>
          <div className="inline-fields">
            {(["deg", "min", "sec"] as const).map((key) => (
              <label key={key}>
                {key === "deg" ? "度" : key === "min" ? "分" : "秒"}
                <input value={dms[key]} type="number" onChange={(event) => setDms({ ...dms, [key]: Number(event.target.value) })} />
              </label>
            ))}
          </div>
          <p className="result-line">十进制度：{formatNumber(dmsDecimal, 10)}°</p>
          <p className="muted">当前结果转 DMS：{dmsBack.deg}° {dmsBack.min}′ {formatNumber(dmsBack.sec, 4)}″</p>
          <div className="history-list">
            <strong>历史记录</strong>
            {history.slice(0, 6).map((item) => <button key={item} onClick={() => setExpression(item.split("=")[0].trim())}>{item}</button>)}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Tabs({ options, value, onChange }: { options: Array<[string, string]>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="tabs">
      {options.map(([id, label]) => (
        <button key={id} className={value === id ? "active" : ""} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

function FormulaRunner({
  formulas,
  selectedId,
  onSelectedId,
  calculate
}: {
  formulas: FormulaItem[];
  selectedId: string;
  onSelectedId: (id: string) => void;
  calculate: (id: string, input: NumericRecord) => CalculationResult;
}) {
  const formula = formulas.find((item) => item.id === selectedId) || formulas[0];
  const initialValues = useMemo(() => {
    const values: NumericRecord = {};
    for (const input of formula.inputs) values[input.key] = input.defaultValue ?? "";
    return values;
  }, [formula]);
  const [values, setValues] = useState<NumericRecord>(initialValues);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues(initialValues);
    setResult(null);
    setError("");
  }, [initialValues]);

  const categories = [...new Set(formulas.map((item) => item.category))];
  const run = () => {
    try {
      setResult(calculate(formula.id, values));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "计算失败，请检查输入。");
    }
  };

  return (
    <div className="tool-layout">
      <GlassCard className="side-list">
        {categories.map((category) => (
          <div key={category}>
            <strong>{category}</strong>
            {formulas.filter((item) => item.category === category).map((item) => (
              <button key={item.id} className={item.id === formula.id ? "selected" : ""} onClick={() => onSelectedId(item.id)}>
                {item.name}
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
        ))}
      </GlassCard>
      <div className="stack">
        <GlassCard>
          <div className="section-title">
            <h2>{formula.name}</h2>
            <StatusBadge status={formula.status} />
          </div>
          {formula.notes && <p className="warning-text">{formula.notes}</p>}
          {formula.inputs.length ? (
            <div className="form-grid">
              {formula.inputs.map((input) => (
                <FieldControl
                  key={input.key}
                  input={input}
                  value={values[input.key] ?? input.defaultValue ?? ""}
                  onChange={(next) => setValues({ ...values, [input.key]: next })}
                />
              ))}
            </div>
          ) : (
            <p className="muted">此项为资料表，不需要输入参数。</p>
          )}
          <div className="button-row">
            {formula.inputs.length > 0 && <button className="glass-button" onClick={run}>计算</button>}
            <button className="glass-button secondary" onClick={() => setResult(null)}>清空结果</button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </GlassCard>
        <ResultPanel formula={formula} result={result} />
      </div>
    </div>
  );
}

function FieldControl({ input, value, onChange }: { input: InputField; value: number | string; onChange: (value: number | string) => void }) {
  const isAngle = input.type === "angle";
  if (isAngle) return <AngleField input={input} value={value} onChange={onChange} />;
  if (input.type === "density" || input.key === "rho" || input.key === "rho201") {
    return <DensityField input={input} value={value} onChange={onChange} />;
  }
  return (
    <label>
      {input.label}{input.unit ? ` (${input.unit})` : ""}
      {input.type === "select" ? (
        <select value={String(value)} onChange={(event) => onChange(event.target.value)}>
          {input.options?.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input type="number" value={String(value)} onChange={(event) => onChange(Number(event.target.value))} />
      )}
      {input.hint && <span>{input.hint}</span>}
    </label>
  );
}

function AngleField({ input, value, onChange }: { input: InputField; value: number | string; onChange: (value: number | string) => void }) {
  const [mode, setMode] = useState<AngleDisplayMode>("decimal");
  const decimal = Number(value) || 0;
  const dms = decimalToDms(decimal);
  const updateDms = (part: "deg" | "min" | "sec", nextValue: number) => {
    const next = { ...dms, [part]: nextValue };
    onChange(dmsToDecimal(next.deg, next.min, next.sec));
  };
  return (
    <label className="angle-field">
      <span className="field-title">
        {input.label}{input.unit ? " (°)" : ""}
        <span className="mini-toggle">
          <button type="button" className={mode === "decimal" ? "selected" : ""} onClick={() => setMode("decimal")}>角度</button>
          <button type="button" className={mode === "dms" ? "selected" : ""} onClick={() => setMode("dms")}>度分秒</button>
        </span>
      </span>
      {mode === "decimal" ? (
        <input type="number" value={String(value)} onChange={(event) => onChange(Number(event.target.value))} />
      ) : (
        <div className="dms-grid">
          <input aria-label={`${input.label}度`} type="number" value={dms.deg} onChange={(event) => updateDms("deg", Number(event.target.value))} />
          <input aria-label={`${input.label}分`} type="number" value={dms.min} onChange={(event) => updateDms("min", Number(event.target.value))} />
          <input aria-label={`${input.label}秒`} type="number" value={formatNumber(dms.sec, 6)} onChange={(event) => updateDms("sec", Number(event.target.value))} />
        </div>
      )}
      {input.hint && <span>{input.hint}</span>}
    </label>
  );
}

function DensityField({ input, value, onChange }: { input: InputField; value: number | string; onChange: (value: number | string) => void }) {
  const current = Number(value) || Number(input.defaultValue) || 0;
  const options = [
    { label: `当前材料默认 ${Number(input.defaultValue || current)} kg/m3`, value: Number(input.defaultValue || current) },
    ...pipeMaterials.map((material) => ({ label: `${material.name} ${material.density} kg/m3`, value: material.density }))
  ];
  return (
    <label className="density-field">
      {input.label}{input.unit ? ` (${input.unit})` : ""}
      <select value={String(current)} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={String(current)}>自定义 / 当前值 {current}</option>
        {options.map((option) => <option key={`${option.label}-${option.value}`} value={option.value}>{option.label}</option>)}
      </select>
      <input type="number" value={String(current)} onChange={(event) => onChange(Number(event.target.value))} />
      {input.hint && <span>{input.hint}</span>}
    </label>
  );
}

function ResultPanel({ formula, result }: { formula: FormulaItem; result: CalculationResult | null }) {
  const [angleMode, setAngleMode] = useState<AngleDisplayMode>("decimal");
  const hasAngleOutput = formula.outputs.some((output) => output.unit === "deg");
  const outputText = result
    ? formula.outputs.map((output) => `${output.label}: ${formatOutputValue(Number(result.values[output.key]), output.unit, angleMode)}`).join("\n")
    : "";
  return (
    <GlassCard>
      <div className="section-title">
        <h3><Clipboard size={18} /> 结果与来源</h3>
        {result && <button className="icon-button small" onClick={() => safeCopy(outputText)} title="复制结果"><Clipboard size={16} /></button>}
      </div>
      {result ? (
        <>
        {hasAngleOutput && (
          <div className="result-toolbar">
            <span>角度结果显示</span>
            <span className="mini-toggle">
              <button type="button" className={angleMode === "decimal" ? "selected" : ""} onClick={() => setAngleMode("decimal")}>角度</button>
              <button type="button" className={angleMode === "dms" ? "selected" : ""} onClick={() => setAngleMode("dms")}>度分秒</button>
            </span>
          </div>
        )}
        <div className="result-grid">
          {formula.outputs.map((output) => (
            <div key={output.key} className="result-item">
              <span>{output.label}</span>
              <strong>{formatOutputValue(Number(result.values[output.key]), output.unit, angleMode)}</strong>
            </div>
          ))}
        </div>
        </>
      ) : (
        <p className="muted">输入参数后点击计算，结果会显示公式说明和来源。</p>
      )}
      <div className="formula-box">
        <strong>公式说明</strong>
        <p>{formula.formulaText}</p>
      </div>
      {formula.module === "survey" && <SurveyDiagram formula={formula} />}
      {formula.module === "pipes" && <PipeDiagram formula={formula} />}
      <SourceList ids={formula.sourceIds} />
    </GlassCard>
  );
}

function PipeDiagram({ formula }: { formula: FormulaItem }) {
  const markerId = `pipe-arrow-${formula.id}`;
  const type = getPipeDiagramType(formula.id);
  return (
    <div className="diagram-box">
      <div className="diagram-head">
        <strong>图例 / 示意图</strong>
      </div>
      <svg viewBox="0 0 420 210" role="img" aria-label={`${formula.name} 图例`}>
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" />
          </marker>
        </defs>
        {type === "reference" && <PipeReferenceDiagram />}
        {type === "round" && <RoundPipeDiagram markerId={markerId} />}
        {type === "square" && <SquarePipeDiagram />}
        {type === "rectangular" && <RectangularPipeDiagram />}
        {type === "flatOval" && <FlatOvalPipeDiagram />}
      </svg>
      <p className="muted">{getPipeDiagramCaption(formula.id)}</p>
    </div>
  );
}

function getPipeDiagramType(id: string) {
  if (id === "plastic-reference") return "reference";
  if (id === "square") return "square";
  if (id === "rectangular") return "rectangular";
  if (id === "flat-oval") return "flatOval";
  return "round";
}

function getPipeDiagramCaption(id: string) {
  if (id === "plastic-reference") return "资料表只展示适用范围、密度和标准号，不参与计算。";
  if (id === "square" || id === "rectangular" || id === "flat-oval") return "按截图中的自定义法输入截面尺寸、壁厚、长度和密度，计算截面积、理论重量和表面积。";
  return "圆形管材按外径 D、壁厚 t、总长度和材料密度计算，查表法入口不参与本版实现。";
}

function SurveyDiagram({ formula }: { formula: FormulaItem }) {
  const markerId = `arrow-${formula.id}`;
  return (
    <div className="diagram-box">
      <div className="diagram-head">
        <strong>图例 / 示意图</strong>
      </div>
      <svg viewBox="0 0 420 210" role="img" aria-label={`${formula.name} 图例`}>
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" />
          </marker>
        </defs>
        <SurveyDiagramContent id={formula.id} markerId={markerId} />
      </svg>
      <p className="muted">{getSurveyDiagramCaption(formula)}</p>
    </div>
  );
}

function SurveyDiagramContent({ id, markerId }: { id: string; markerId: string }) {
  switch (id) {
    case "coordinate-forward":
    case "coordinate-inverse":
    case "coordinate-forward-inverse":
      return <CoordinateForwardInverseDiagram markerId={markerId} />;
    case "reverse-azimuth":
      return <ReverseAzimuthDiagram markerId={markerId} />;
    case "azimuth-deduction":
      return <AzimuthDeductionDiagram markerId={markerId} />;
    case "coordinate-transform":
      return <CoordinateTransformDiagram markerId={markerId} />;
    case "point-line-distance":
      return <PointLineDistanceDiagram />;
    case "line-intersection":
      return <LineIntersectionSurveyDiagram />;
    case "point-along-line":
      return <PointAlongLineSurveyDiagram markerId={markerId} />;
    case "tangent-from-point":
      return <TangentFromPointSurveyDiagram />;
    case "circle-from-three-points":
      return <ThreePointCircleSurveyDiagram />;
    case "polygon-area":
      return <PolygonAreaSurveyDiagram />;
    case "circle-intersections":
      return <CircleIntersectionsSurveyDiagram />;
    case "arc-coordinate":
      return <ArcCoordinateSurveyDiagram markerId={markerId} />;
    case "sphere-center":
      return <SphereCenterSurveyDiagram />;
    case "traverse":
      return <TraverseSurveyDiagram markerId={markerId} />;
    case "culvert":
      return <CulvertSurveyDiagram markerId={markerId} />;
    case "centerline-stake":
      return <CenterlineStakeSurveyDiagram markerId={markerId} />;
    case "forward-intersection":
      return <ForwardIntersectionSurveyDiagram />;
    case "side-angle-intersection":
      return <SideAngleIntersectionSurveyDiagram />;
    case "distance-intersection":
      return <DistanceIntersectionSurveyDiagram />;
    case "resection-1":
      return <ResectionOneSurveyDiagram />;
    case "resection-2":
      return <ResectionTwoSurveyDiagram />;
    case "trig-leveling":
      return <TrigLevelingSurveyDiagram />;
    case "foresight-reading":
      return <ForesightReadingSurveyDiagram />;
    default:
      return <CoordinateForwardInverseDiagram markerId={markerId} />;
  }
}

function CoordinateForwardInverseDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="axis" x1="64" y1="172" x2="64" y2="30" markerEnd={`url(#${markerId})`} />
      <line className="axis" x1="64" y1="172" x2="374" y2="172" markerEnd={`url(#${markerId})`} />
      <text x="44" y="34">X</text>
      <text x="360" y="194">Y</text>
      <line className="guide" x1="122" y1="142" x2="122" y2="72" />
      <line className="guide" x1="122" y1="72" x2="312" y2="72" />
      <line className="main-line" x1="122" y1="142" x2="312" y2="72" markerEnd={`url(#${markerId})`} />
      <path className="guide no-fill" d="M122 112 A30 30 0 0 1 150 131" />
      <circle cx="122" cy="142" r="5" />
      <circle cx="312" cy="72" r="5" />
      <text x="104" y="160">A(xA,yA)</text>
      <text x="318" y="72">B(xB,yB)</text>
      <text x="134" y="100">αAB</text>
      <text x="212" y="118">DAB</text>
      <text x="86" y="110">ΔXAB</text>
      <text x="204" y="62">ΔYAB</text>
    </>
  );
}

function ReverseAzimuthDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="axis" x1="102" y1="160" x2="102" y2="44" markerEnd={`url(#${markerId})`} />
      <line className="axis" x1="300" y1="160" x2="300" y2="44" markerEnd={`url(#${markerId})`} />
      <line className="guide" x1="70" y1="134" x2="340" y2="84" />
      <line className="main-line" x1="102" y1="128" x2="300" y2="92" markerEnd={`url(#${markerId})`} />
      <path className="guide no-fill" d="M102 90 A38 38 0 0 1 136 121" />
      <path className="guide no-fill" d="M300 54 A58 58 0 0 1 246 101" />
      <circle cx="102" cy="128" r="5" />
      <circle cx="300" cy="92" r="5" />
      <text x="78" y="150">P1</text>
      <text x="308" y="112">P2</text>
      <text x="72" y="58">坐标北</text>
      <text x="310" y="58">坐标北</text>
      <text x="130" y="102">α正</text>
      <text x="252" y="72">α反</text>
    </>
  );
}

function AzimuthDeductionDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="axis" x1="114" y1="154" x2="114" y2="48" markerEnd={`url(#${markerId})`} />
      <polyline className="main-line no-fill" points="78,150 188,112 324,134" />
      <line className="guide" x1="188" y1="112" x2="188" y2="54" markerEnd={`url(#${markerId})`} />
      <path className="guide no-fill" d="M144 126 A48 48 0 0 1 114 86" />
      <path className="guide no-fill" d="M236 120 A48 48 0 0 0 198 66" />
      <path className="accent-line no-fill" d="M198 66 A56 56 0 0 1 248 122" />
      <circle cx="78" cy="150" r="5" />
      <circle cx="188" cy="112" r="5" />
      <circle cx="324" cy="134" r="5" />
      <text x="62" y="168">A</text>
      <text x="192" y="132">B</text>
      <text x="326" y="152">C</text>
      <text x="106" y="82">A点后视方位角</text>
      <text x="238" y="78">B点后视方位角</text>
      <text x="214" y="106">β</text>
    </>
  );
}

function CoordinateTransformDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="axis" x1="82" y1="164" x2="82" y2="44" markerEnd={`url(#${markerId})`} />
      <line className="axis" x1="82" y1="164" x2="210" y2="164" markerEnd={`url(#${markerId})`} />
      <line className="main-line" x1="210" y1="146" x2="342" y2="84" markerEnd={`url(#${markerId})`} />
      <line className="main-line" x1="210" y1="146" x2="282" y2="196" markerEnd={`url(#${markerId})`} />
      <line className="guide" x1="210" y1="146" x2="312" y2="118" />
      <circle cx="210" cy="146" r="5" />
      <circle cx="312" cy="118" r="5" />
      <path className="guide no-fill" d="M120 164 A64 64 0 0 1 166 121" />
      <text x="64" y="48">X</text>
      <text x="198" y="186">Y</text>
      <text x="336" y="84">x′</text>
      <text x="282" y="204">y′</text>
      <text x="186" y="142">O′</text>
      <text x="316" y="116">P</text>
      <text x="142" y="132">偏角</text>
      <text x="92" y="88">大地坐标</text>
      <text x="274" y="62">施工坐标</text>
    </>
  );
}

function PointLineDistanceDiagram() {
  return (
    <>
      <line className="main-line" x1="72" y1="154" x2="338" y2="70" />
      <circle cx="214" cy="109" r="5" />
      <circle cx="192" cy="54" r="5" />
      <line className="accent-line" x1="192" y1="54" x2="214" y2="109" />
      <path className="guide no-fill" d="M204 112 L216 106 L220 118" />
      <text x="58" y="170">A</text>
      <text x="342" y="70">B</text>
      <text x="170" y="48">外点 P</text>
      <text x="224" y="116">垂点 O</text>
      <text x="168" y="92">垂距 d</text>
      <text x="96" y="122">OA</text>
      <text x="272" y="88">OB</text>
    </>
  );
}

function LineIntersectionSurveyDiagram() {
  return (
    <>
      <line className="main-line" x1="66" y1="52" x2="344" y2="162" />
      <line className="accent-line" x1="72" y1="162" x2="334" y2="54" />
      <circle cx="207" cy="108" r="6" />
      <path className="guide no-fill" d="M176 96 A36 36 0 0 0 188 130" />
      <text x="52" y="48">A</text>
      <text x="350" y="174">B</text>
      <text x="62" y="180">C</text>
      <text x="338" y="54">D</text>
      <text x="218" y="104">交点</text>
      <text x="152" y="134">夹角</text>
    </>
  );
}

function PointAlongLineSurveyDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="main-line" x1="68" y1="150" x2="344" y2="66" markerEnd={`url(#${markerId})`} />
      <circle cx="68" cy="150" r="5" />
      <circle cx="344" cy="66" r="5" />
      <circle cx="206" cy="108" r="5" />
      <line className="accent-line" x1="206" y1="108" x2="188" y2="52" />
      <line className="accent-line" x1="206" y1="108" x2="224" y2="164" />
      <circle cx="188" cy="52" r="5" />
      <circle cx="224" cy="164" r="5" />
      <path className="guide no-fill" d="M200 110 L210 104 L214 116" />
      <text x="54" y="168">A</text>
      <text x="348" y="66">B</text>
      <text x="214" y="102">O</text>
      <text x="166" y="46">C</text>
      <text x="230" y="178">C′</text>
      <text x="122" y="118">l</text>
      <text x="172" y="88">d</text>
    </>
  );
}

function TangentFromPointSurveyDiagram() {
  return (
    <>
      <circle className="big-circle" cx="252" cy="110" r="58" />
      <circle cx="252" cy="110" r="5" />
      <circle cx="122" cy="150" r="5" />
      <line className="main-line" x1="122" y1="150" x2="216" y2="72" />
      <line className="main-line" x1="122" y1="150" x2="286" y2="158" />
      <line className="guide" x1="252" y1="110" x2="216" y2="72" />
      <line className="guide" x1="252" y1="110" x2="286" y2="158" />
      <circle cx="216" cy="72" r="5" />
      <circle cx="286" cy="158" r="5" />
      <text x="96" y="168">外点 P</text>
      <text x="260" y="106">圆心 O</text>
      <text x="196" y="66">切点1</text>
      <text x="292" y="174">切点2</text>
      <text x="262" y="92">R</text>
      <text x="166" y="126">切线长</text>
    </>
  );
}

function ThreePointCircleSurveyDiagram() {
  return (
    <>
      <circle className="big-circle" cx="210" cy="112" r="82" />
      <circle className="big-circle secondary" cx="214" cy="118" r="34" />
      <polygon className="polygon-fill" points="206,34 118,156 318,154" />
      <polyline className="main-line no-fill" points="206,34 118,156 318,154 206,34" />
      <circle cx="210" cy="112" r="5" />
      <circle cx="214" cy="118" r="5" />
      <text x="208" y="28">A</text>
      <text x="98" y="170">B</text>
      <text x="324" y="168">C</text>
      <text x="220" y="108">外接圆心O</text>
      <text x="226" y="128">内切圆心I</text>
      <text x="292" y="98">外接R</text>
    </>
  );
}

function PolygonAreaSurveyDiagram() {
  return (
    <>
      <polygon className="polygon-fill" points="76,150 132,60 236,70 344,138 230,174" />
      <polyline className="main-line no-fill" points="76,150 132,60 236,70 344,138 230,174 76,150" />
      {[[76,150,"P1"],[132,60,"P2"],[236,70,"P3"],[344,138,"P4"],[230,174,"Pn"]].map(([x, y, label]) => (
        <g key={String(label)}>
          <circle cx={Number(x)} cy={Number(y)} r="5" />
          <text x={Number(x) + 8} y={Number(y) - 6}>{label}</text>
        </g>
      ))}
      <text x="184" y="126">面积 S</text>
      <text x="190" y="148">周长 L</text>
    </>
  );
}

function CircleIntersectionsSurveyDiagram() {
  return (
    <>
      <circle className="big-circle" cx="156" cy="108" r="66" />
      <circle className="big-circle secondary" cx="262" cy="108" r="72" />
      <line className="main-line" x1="156" y1="108" x2="262" y2="108" />
      <line className="guide" x1="156" y1="108" x2="208" y2="56" />
      <line className="guide" x1="262" y1="108" x2="208" y2="56" />
      <circle cx="156" cy="108" r="5" />
      <circle cx="262" cy="108" r="5" />
      <circle cx="208" cy="56" r="5" />
      <circle cx="208" cy="160" r="5" />
      <text x="138" y="104">A</text>
      <text x="268" y="104">B</text>
      <text x="214" y="54">C</text>
      <text x="214" y="176">C′</text>
      <text x="176" y="92">R1</text>
      <text x="238" y="92">R2</text>
      <text x="190" y="126">AB距离</text>
    </>
  );
}

function ArcCoordinateSurveyDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <path className="main-line no-fill" d="M92 158 A132 132 0 0 1 322 152" markerEnd={`url(#${markerId})`} />
      <circle cx="206" cy="62" r="5" />
      <line className="guide" x1="206" y1="62" x2="92" y2="158" />
      <line className="guide" x1="206" y1="62" x2="322" y2="152" />
      <line className="guide" x1="206" y1="62" x2="222" y2="102" />
      <circle cx="92" cy="158" r="5" />
      <circle cx="322" cy="152" r="5" />
      <circle cx="222" cy="102" r="5" />
      <text x="78" y="176">A</text>
      <text x="328" y="168">B</text>
      <text x="214" y="60">O</text>
      <text x="232" y="104">C</text>
      <text x="146" y="116">R</text>
      <text x="244" y="128">弧长 L</text>
    </>
  );
}

function SphereCenterSurveyDiagram() {
  return (
    <>
      <ellipse className="big-circle" cx="210" cy="110" rx="88" ry="58" />
      <ellipse className="guide no-fill" cx="210" cy="110" rx="88" ry="20" />
      <line className="axis" x1="210" y1="110" x2="210" y2="34" />
      <line className="axis" x1="210" y1="110" x2="310" y2="146" />
      <line className="axis" x1="210" y1="110" x2="114" y2="150" />
      <circle cx="210" cy="110" r="5" />
      <circle cx="206" cy="42" r="5" />
      <circle cx="290" cy="136" r="5" />
      <circle cx="120" cy="146" r="5" />
      <circle cx="220" cy="166" r="5" />
      <text x="220" y="106">球心 O</text>
      <text x="190" y="36">A</text>
      <text x="296" y="138">B</text>
      <text x="96" y="156">C</text>
      <text x="226" y="180">D</text>
      <text x="250" y="86">半径 R</text>
    </>
  );
}

function TraverseSurveyDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <polyline className="main-line no-fill" points="78,70 148,142 242,112 320,166" />
      <line className="accent-line" x1="112" y1="150" x2="78" y2="70" />
      <circle cx="78" cy="70" r="5" />
      <circle cx="112" cy="150" r="5" />
      <circle cx="148" cy="142" r="7" />
      <circle cx="242" cy="112" r="7" />
      <circle cx="320" cy="166" r="5" />
      <path className="guide no-fill" d="M126 120 A34 34 0 0 1 164 112" markerEnd={`url(#${markerId})`} />
      <path className="guide no-fill" d="M222 96 A34 34 0 0 1 262 126" />
      <text x="54" y="66">B(已知)</text>
      <text x="92" y="168">A(已知)</text>
      <text x="146" y="164">T1</text>
      <text x="238" y="98">T2</text>
      <text x="324" y="184">T3</text>
      <text x="156" y="122">βT1</text>
      <text x="248" y="134">βT2</text>
      <text x="190" y="122">D1</text>
      <text x="282" y="146">D2</text>
    </>
  );
}

function CulvertSurveyDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <rect className="diagram-panel-fill" x="72" y="70" width="274" height="88" rx="4" />
      <line className="main-line" x1="58" y1="114" x2="362" y2="114" markerEnd={`url(#${markerId})`} />
      <line className="accent-line" x1="210" y1="42" x2="196" y2="178" />
      <path className="guide no-fill" d="M210 84 A38 38 0 0 1 238 58" />
      <text x="196" y="108">中心点</text>
      <text x="164" y="62">前进方位角</text>
      <text x="236" y="62">偏角</text>
      <text x="84" y="92">1</text>
      <text x="330" y="92">3</text>
      <text x="84" y="150">4</text>
      <text x="330" y="150">6</text>
      <text x="98" y="134">左边距离</text>
      <text x="248" y="134">右边距离</text>
      <text x="184" y="174">设计宽度</text>
    </>
  );
}

function CenterlineStakeSurveyDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <polyline className="guide no-fill" points="70,150 150,88 224,74 344,134" />
      <path className="main-line no-fill" d="M86 144 C140 94 174 86 220 82 C268 82 300 104 334 128" markerEnd={`url(#${markerId})`} />
      <circle cx="70" cy="150" r="5" />
      <circle cx="150" cy="88" r="5" />
      <circle cx="224" cy="74" r="5" />
      <circle cx="344" cy="134" r="5" />
      <path className="guide no-fill" d="M150 88 A70 70 0 0 1 224 74" />
      <text x="52" y="168">JD1</text>
      <text x="132" y="84">ZY</text>
      <text x="226" y="68">QZ</text>
      <text x="348" y="150">JD3</text>
      <text x="184" y="52">R / Ls</text>
      <text x="240" y="112">逐桩点 S</text>
    </>
  );
}

function ForwardIntersectionSurveyDiagram() {
  return (
    <>
      <line className="main-line" x1="86" y1="156" x2="330" y2="156" />
      <line className="guide" x1="86" y1="156" x2="210" y2="50" />
      <line className="guide" x1="330" y1="156" x2="210" y2="50" />
      <circle cx="86" cy="156" r="5" />
      <circle cx="330" cy="156" r="5" />
      <circle cx="210" cy="50" r="6" />
      <path className="accent-line no-fill" d="M116 156 A30 30 0 0 1 108 132" />
      <path className="accent-line no-fill" d="M302 156 A30 30 0 0 0 312 132" />
      <text x="68" y="178">A(已知)</text>
      <text x="314" y="178">B(已知)</text>
      <text x="214" y="44">P</text>
      <text x="118" y="142">α</text>
      <text x="292" y="142">β</text>
    </>
  );
}

function SideAngleIntersectionSurveyDiagram() {
  return (
    <>
      <line className="main-line" x1="82" y1="160" x2="334" y2="160" />
      <line className="guide" x1="82" y1="160" x2="218" y2="54" />
      <line className="accent-line" x1="218" y1="54" x2="334" y2="160" />
      <circle cx="82" cy="160" r="5" />
      <circle cx="334" cy="160" r="5" />
      <circle cx="218" cy="54" r="6" />
      <path className="accent-line no-fill" d="M116 160 A34 34 0 0 1 108 132" />
      <path className="guide no-fill" d="M198 70 A32 32 0 0 0 238 72" />
      <text x="62" y="182">A(已知)</text>
      <text x="318" y="182">B(已知)</text>
      <text x="222" y="48">P</text>
      <text x="118" y="142">侧方α</text>
      <text x="224" y="82">∠P</text>
    </>
  );
}

function DistanceIntersectionSurveyDiagram() {
  return (
    <>
      <circle className="big-circle" cx="128" cy="150" r="86" />
      <circle className="big-circle secondary" cx="304" cy="150" r="86" />
      <line className="main-line" x1="128" y1="150" x2="304" y2="150" />
      <circle cx="128" cy="150" r="5" />
      <circle cx="304" cy="150" r="5" />
      <circle cx="216" cy="86" r="6" />
      <line className="guide" x1="128" y1="150" x2="216" y2="86" />
      <line className="guide" x1="304" y1="150" x2="216" y2="86" />
      <text x="108" y="172">A</text>
      <text x="312" y="172">B</text>
      <text x="222" y="82">P</text>
      <text x="158" y="116">R1</text>
      <text x="260" y="116">R2</text>
    </>
  );
}

function ResectionOneSurveyDiagram() {
  return (
    <>
      <polygon className="polygon-fill" points="86,158 326,158 212,52" />
      <polyline className="main-line no-fill" points="86,158 326,158 212,52 86,158" />
      <circle cx="210" cy="114" r="6" />
      <line className="guide" x1="210" y1="114" x2="86" y2="158" />
      <line className="guide" x1="210" y1="114" x2="326" y2="158" />
      <line className="guide" x1="210" y1="114" x2="212" y2="52" />
      <circle cx="86" cy="158" r="5" />
      <circle cx="326" cy="158" r="5" />
      <circle cx="212" cy="52" r="5" />
      <text x="64" y="180">A</text>
      <text x="334" y="180">B</text>
      <text x="216" y="46">C</text>
      <text x="218" y="118">P</text>
      <text x="134" y="130">Ra</text>
      <text x="270" y="130">Rb</text>
      <text x="218" y="88">Rc</text>
    </>
  );
}

function ResectionTwoSurveyDiagram() {
  return (
    <>
      <polyline className="main-line no-fill" points="86,162 196,52 330,162" />
      <line className="guide" x1="196" y1="52" x2="126" y2="132" />
      <line className="guide" x1="196" y1="52" x2="278" y2="132" />
      <circle cx="86" cy="162" r="5" />
      <circle cx="330" cy="162" r="5" />
      <circle cx="196" cy="52" r="6" />
      <circle cx="126" cy="132" r="5" />
      <circle cx="278" cy="132" r="5" />
      <path className="accent-line no-fill" d="M164 70 A42 42 0 0 0 128 110" />
      <path className="accent-line no-fill" d="M226 70 A42 42 0 0 1 272 112" />
      <text x="64" y="184">A(已知)</text>
      <text x="314" y="184">B(已知)</text>
      <text x="200" y="46">P</text>
      <text x="120" y="150">M</text>
      <text x="282" y="150">N</text>
      <text x="142" y="96">α</text>
      <text x="250" y="96">β</text>
    </>
  );
}

function TrigLevelingSurveyDiagram() {
  return (
    <>
      <line className="axis" x1="54" y1="164" x2="366" y2="164" />
      <line className="main-line" x1="92" y1="164" x2="92" y2="86" />
      <line className="accent-line" x1="320" y1="164" x2="320" y2="104" />
      <line className="guide" x1="92" y1="86" x2="320" y2="104" />
      <path className="guide no-fill" d="M136 90 A44 44 0 0 1 132 116" />
      <text x="64" y="184">已知点 H0</text>
      <text x="288" y="184">目标点 H</text>
      <text x="100" y="126">仪器高 i</text>
      <text x="252" y="128">棱镜高 l</text>
      <text x="146" y="108">竖直角 v</text>
      <text x="190" y="154">平距 D</text>
    </>
  );
}

function ForesightReadingSurveyDiagram() {
  return (
    <>
      <line className="axis" x1="54" y1="166" x2="366" y2="166" />
      <line className="guide" x1="76" y1="86" x2="346" y2="86" />
      <line className="main-line" x1="86" y1="166" x2="86" y2="64" />
      <line className="accent-line" x1="330" y1="166" x2="330" y2="78" />
      <circle cx="206" cy="86" r="7" />
      <text x="70" y="188">后视点 H0</text>
      <text x="304" y="188">前视点 HB</text>
      <text x="102" y="74">后视读数</text>
      <text x="238" y="74">前视读数</text>
      <text x="184" y="108">视线高</text>
      <text x="196" y="60">仪器</text>
    </>
  );
}

function getSurveyDiagramType(id: string, category: string) {
  if (id.includes("circle") || id.includes("tangent") || id.includes("resection") || id.includes("distance-intersection")) return "circle";
  if (id.includes("intersection") || category === "交会定点") return "intersection";
  if (id.includes("arc") || id.includes("centerline") || id.includes("culvert")) return "arc";
  if (category === "视镜高程") return "level";
  if (id.includes("polygon") || id.includes("sphere")) return "polygon";
  return "coordinate";
}

function getSurveyDiagramCaption(formula: FormulaItem) {
  if (formula.status === "需复核") return "图例根据参考截图和公式关系重新绘制；涉及左右转、顺逆时针、后视方向等约定时仍按来源状态提示复核。";
  return "图例根据参考截图中的点、线、角度、距离和结果关系重新绘制，用于辅助核对输入字段和公式逻辑。";
}

function CoordinateDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <line className="axis" x1="54" y1="170" x2="54" y2="32" markerEnd={`url(#${markerId})`} />
      <line className="axis" x1="54" y1="170" x2="372" y2="170" markerEnd={`url(#${markerId})`} />
      <text x="36" y="38">X/N</text>
      <text x="355" y="192">Y/E</text>
      <line className="main-line" x1="96" y1="145" x2="308" y2="70" markerEnd={`url(#${markerId})`} />
      <path className="guide" d="M132 145 A44 44 0 0 1 150 112" />
      <text x="90" y="164">A</text>
      <text x="312" y="70">B</text>
      <text x="168" y="112">D, alpha</text>
      <circle cx="96" cy="145" r="5" />
      <circle cx="308" cy="70" r="5" />
    </>
  );
}

function IntersectionDiagram() {
  return (
    <>
      <line className="main-line" x1="58" y1="150" x2="360" y2="54" />
      <line className="accent-line" x1="78" y1="48" x2="340" y2="162" />
      <circle cx="211" cy="101" r="6" />
      <text x="46" y="166">A</text>
      <text x="360" y="52">B</text>
      <text x="66" y="44">C</text>
      <text x="342" y="178">D</text>
      <text x="222" y="96">P</text>
      <path className="guide" d="M187 109 A34 34 0 0 1 207 135" />
      <text x="172" y="146">theta</text>
    </>
  );
}

function CircleDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <circle className="big-circle" cx="142" cy="106" r="58" />
      <circle className="big-circle secondary" cx="250" cy="106" r="72" />
      <line className="main-line" x1="142" y1="106" x2="250" y2="106" markerEnd={`url(#${markerId})`} />
      <circle cx="142" cy="106" r="5" />
      <circle cx="250" cy="106" r="5" />
      <circle cx="190" cy="53" r="5" />
      <circle cx="190" cy="159" r="5" />
      <text x="126" y="101">O1</text>
      <text x="256" y="101">O2/P</text>
      <text x="198" y="50">T/C</text>
      <text x="198" y="174">T'/C'</text>
      <text x="176" y="126">R, d</text>
    </>
  );
}

function ArcDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <path className="main-line no-fill" d="M92 152 A130 130 0 0 1 318 150" markerEnd={`url(#${markerId})`} />
      <line className="guide" x1="205" y1="172" x2="205" y2="64" />
      <line className="guide" x1="205" y1="64" x2="92" y2="152" />
      <line className="guide" x1="205" y1="64" x2="318" y2="150" />
      <circle cx="92" cy="152" r="5" />
      <circle cx="318" cy="150" r="5" />
      <circle cx="205" cy="64" r="5" />
      <circle cx="212" cy="97" r="5" />
      <text x="78" y="170">A</text>
      <text x="324" y="166">B</text>
      <text x="214" y="62">O</text>
      <text x="222" y="96">C</text>
      <text x="230" y="132">L / R / d</text>
    </>
  );
}

function LevelDiagram() {
  return (
    <>
      <line className="axis" x1="48" y1="162" x2="370" y2="162" />
      <line className="guide" x1="92" y1="132" x2="320" y2="84" />
      <line className="main-line" x1="92" y1="162" x2="92" y2="70" />
      <line className="accent-line" x1="320" y1="162" x2="320" y2="94" />
      <text x="72" y="184">已知点 H0</text>
      <text x="288" y="184">目标点 H</text>
      <text x="102" y="112">仪器高 i</text>
      <text x="230" y="88">竖直角 v</text>
      <text x="326" y="122">棱镜高 l</text>
    </>
  );
}

function PolygonDiagram() {
  return (
    <>
      <polygon className="polygon-fill" points="92,146 154,58 278,72 332,154 202,172" />
      <polyline className="main-line no-fill" points="92,146 154,58 278,72 332,154 202,172 92,146" />
      {[[92,146,"P1"],[154,58,"P2"],[278,72,"P3"],[332,154,"P4"],[202,172,"Pn"]].map(([x, y, label]) => (
        <g key={String(label)}>
          <circle cx={Number(x)} cy={Number(y)} r="5" />
          <text x={Number(x) + 8} y={Number(y) - 6}>{label}</text>
        </g>
      ))}
      <text x="180" y="126">S / L</text>
    </>
  );
}

function RoundPipeDiagram({ markerId }: { markerId: string }) {
  return (
    <>
      <rect className="diagram-panel-fill" x="46" y="28" width="328" height="154" rx="8" />
      <circle className="pipe-outer" cx="210" cy="105" r="58" />
      <circle className="pipe-inner" cx="210" cy="105" r="38" />
      <line className="guide" x1="210" y1="105" x2="268" y2="105" markerEnd={`url(#${markerId})`} />
      <line className="accent-line" x1="270" y1="85" x2="270" y2="105" />
      <line className="accent-line" x1="270" y1="105" x2="250" y2="105" />
      <text x="236" y="98">R</text>
      <text x="280" y="99">t</text>
      <line className="main-line" x1="152" y1="176" x2="268" y2="176" />
      <text x="192" y="196">D</text>
      <text x="66" y="58">外径 D</text>
      <text x="66" y="78">壁厚 t</text>
      <text x="66" y="98">长度 L</text>
      <text x="66" y="118">密度 ρ</text>
    </>
  );
}

function SquarePipeDiagram() {
  return (
    <>
      <rect className="diagram-panel-fill" x="58" y="30" width="304" height="150" rx="8" />
      <rect className="pipe-outer" x="154" y="50" width="112" height="112" />
      <rect className="pipe-inner" x="180" y="76" width="60" height="60" />
      <line className="main-line" x1="154" y1="174" x2="266" y2="174" />
      <line className="accent-line" x1="278" y1="50" x2="278" y2="76" />
      <text x="202" y="196">w</text>
      <text x="288" y="68">t</text>
      <text x="74" y="68">方管</text>
      <text x="74" y="94">边长 w</text>
      <text x="74" y="120">壁厚 t</text>
      <text x="74" y="146">密度 ρ</text>
    </>
  );
}

function RectangularPipeDiagram() {
  return (
    <>
      <rect className="diagram-panel-fill" x="48" y="34" width="324" height="142" rx="8" />
      <rect className="pipe-outer" x="128" y="62" width="164" height="86" />
      <rect className="pipe-inner" x="156" y="88" width="108" height="34" />
      <line className="main-line" x1="128" y1="164" x2="292" y2="164" />
      <line className="accent-line" x1="306" y1="62" x2="306" y2="148" />
      <line className="guide" x1="292" y1="62" x2="264" y2="88" />
      <text x="206" y="190">w</text>
      <text x="316" y="110">h</text>
      <text x="266" y="80">t</text>
      <text x="66" y="70">矩形管</text>
      <text x="66" y="96">宽 w</text>
      <text x="66" y="122">高 h</text>
      <text x="66" y="148">壁厚 t</text>
    </>
  );
}

function FlatOvalPipeDiagram() {
  return (
    <>
      <rect className="diagram-panel-fill" x="42" y="34" width="336" height="142" rx="8" />
      <path className="pipe-outer no-fill" d="M146 70 H274 A36 36 0 0 1 274 142 H146 A36 36 0 0 1 146 70" />
      <path className="pipe-inner no-fill" d="M154 91 H266 A15 15 0 0 1 266 121 H154 A15 15 0 0 1 154 91" />
      <line className="main-line" x1="146" y1="164" x2="274" y2="164" />
      <line className="accent-line" x1="324" y1="70" x2="324" y2="142" />
      <line className="guide" x1="274" y1="70" x2="266" y2="91" />
      <text x="202" y="190">a</text>
      <text x="334" y="110">b</text>
      <text x="284" y="88">t</text>
      <text x="62" y="72">平椭圆管</text>
      <text x="62" y="100">长尺寸 a</text>
      <text x="62" y="128">短尺寸 b</text>
      <text x="62" y="154">壁厚 t</text>
    </>
  );
}

function PipeReferenceDiagram() {
  return (
    <>
      <rect className="diagram-panel-fill" x="48" y="38" width="324" height="134" rx="8" />
      {["PE", "PE-RT", "PB", "PVC-U"].map((label, index) => (
        <g key={label}>
          <rect className="pipe-chip" x={72 + index * 78} y="64" width="52" height="28" rx="14" />
          <text x={82 + index * 78} y="83">{label}</text>
          <line className="guide" x1={98 + index * 78} y1="96" x2={98 + index * 78} y2="132" />
        </g>
      ))}
      <line className="main-line" x1="72" y1="134" x2="326" y2="134" />
      <text x="74" y="158">名称 / 材料 / 密度 / 标准号</text>
    </>
  );
}

function SourceList({ ids }: { ids: string[] }) {
  return (
    <div className="source-list">
      <strong>来源</strong>
      {getSourcesByIds(ids).map((source) => (
        <div key={source.id} className="source-item">
          <span>{source.title}</span>
          <StatusBadge status={source.status} />
          <small>{source.file}</small>
        </div>
      ))}
    </div>
  );
}

function PipePage() {
  const [selectedId, setSelectedId] = useState("pe");
  const formulas = pipeFormulas;
  return (
    <div className="stack">
      <FormulaRunner formulas={formulas} selectedId={selectedId} onSelectedId={setSelectedId} calculate={calculatePipe} />
      <div className="table-grid">
        <GlassCard>
          <h3><Wrench size={18} /> 塑料管材选用表</h3>
          <DataTable rows={plasticPipeReference} />
        </GlassCard>
        <GlassCard>
          <h3><Beaker size={18} /> 材料密度表</h3>
          <DataTable rows={pipeMaterials} />
        </GlassCard>
      </div>
    </div>
  );
}

function SurveyPage() {
  const [selectedId, setSelectedId] = useState(surveyFormulas[0].id);
  return <FormulaRunner formulas={surveyFormulas} selectedId={selectedId} onSelectedId={setSelectedId} calculate={calculateSurvey} />;
}

function UnitsPage() {
  const [categoryId, setCategoryId] = useState("length");
  const category = unitCategories.find((item) => item.id === categoryId)!;
  const [value, setValue] = useState(10);
  const [from, setFrom] = useState(category.units[0].symbol);
  const [to, setTo] = useState(category.units[1]?.symbol || category.units[0].symbol);

  useEffect(() => {
    setFrom(category.units[0].symbol);
    setTo(category.units[1]?.symbol || category.units[0].symbol);
  }, [category]);

  const converted = useMemo(() => {
    try {
      return convertUnit(category, value, from, to);
    } catch {
      return NaN;
    }
  }, [category, value, from, to]);

  return (
    <div className="tool-layout">
      <GlassCard className="side-list">
        {unitCategories.map((item) => (
          <button key={item.id} className={item.id === category.id ? "selected" : ""} onClick={() => setCategoryId(item.id)}>
            {item.name}
            <StatusBadge status={item.status} />
          </button>
        ))}
      </GlassCard>
      <div className="stack">
        <GlassCard>
          <div className="section-title">
            <h2>{category.name}</h2>
            <StatusBadge status={category.status} />
          </div>
          {category.note && <p className="warning-text">{category.note}</p>}
          <div className="converter-grid">
            <label>
              输入值
              <input type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} />
            </label>
            <label>
              源单位
              <select value={from} onChange={(event) => setFrom(event.target.value)}>
                {category.units.map((unit) => <option key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</option>)}
              </select>
            </label>
            <button className="icon-button swap-button" onClick={() => { setFrom(to); setTo(from); }} title="交换单位"><Shuffle size={18} /></button>
            <label>
              目标单位
              <select value={to} onChange={(event) => setTo(event.target.value)}>
                {category.units.map((unit) => <option key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</option>)}
              </select>
            </label>
          </div>
          <div className="big-result">{formatNumber(converted, 12)} <span>{to}</span></div>
          <button className="glass-button" onClick={() => safeCopy(`${formatNumber(converted, 12)} ${to}`)}>复制结果</button>
        </GlassCard>
        <GlassCard>
          <h3>单位关系表</h3>
          <DataTable rows={category.units.map((unit) => ({ name: unit.name, symbol: unit.symbol, toBaseFactor: unit.toBaseFactor, note: unit.note || unit.status || "" }))} />
          <SourceList ids={category.sourceIds} />
        </GlassCard>
      </div>
    </div>
  );
}

function DataTable({ rows }: { rows: object[] }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0] as Record<string, unknown>);
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{keys.map((key) => <th key={key}>{key}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {keys.map((key) => <td key={key}>{String((row as Record<string, unknown>)[key] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AboutPage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <div className="narrow">
      <GlassCard>
        <div className="about-title">
          <Info size={28} />
          <h1>建工计算器</h1>
        </div>
        <div className="about-grid">
          <span>版本</span><strong>V1.8</strong>
          <span>作者</span><strong>五羊咩咩成</strong>
          <span>联系邮箱</span><strong>2136408486@qq.com</strong>
        </div>
        <button className="glass-button" onClick={() => setPage("sources")}><FileText size={18} /> 所有公式数据来源</button>
      </GlassCard>
    </div>
  );
}

function SourcesPage() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const formulas = [...surveyFormulas, ...pipeFormulas];
  const filteredSources = sources.filter((source) => {
    const hitModule = module === "all" || source.module === module;
    const text = `${source.title}${source.file}${source.detail}`.toLowerCase();
    return hitModule && text.includes(query.toLowerCase());
  });
  return (
    <div className="stack">
      <GlassCard>
        <div className="source-toolbar">
          <label>
            <Search size={16} />
            <input placeholder="搜索来源、标准、文件名" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select value={module} onChange={(event) => setModule(event.target.value)}>
            <option value="all">全部模块</option>
            <option value="survey">工程测量</option>
            <option value="pipes">管材计算</option>
            <option value="units">单位换算</option>
            <option value="calculator">计算器/PRD</option>
          </select>
        </div>
      </GlassCard>
      <div className="sources-grid">
        {filteredSources.map((source) => (
          <GlassCard key={source.id}>
            <div className="section-title">
              <h3>{source.title}</h3>
              <StatusBadge status={source.status} />
            </div>
            <p>{source.detail}</p>
            <small>{source.file}</small>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <h3>公式绑定清单</h3>
        <DataTable rows={formulas.map((item) => ({ module: item.module, category: item.category, name: item.name, status: item.status, sourceIds: item.sourceIds.join(", ") }))} />
      </GlassCard>
    </div>
  );
}

export default App;
