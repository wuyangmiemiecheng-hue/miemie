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
import type { CalculationResult, FormulaItem, NumericRecord } from "./types";

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
                <label key={input.key}>
                  {input.label}{input.unit ? ` (${input.unit})` : ""}
                  {input.type === "select" ? (
                    <select value={String(values[input.key] ?? input.defaultValue ?? "")} onChange={(event) => setValues({ ...values, [input.key]: event.target.value })}>
                      {input.options?.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={String(values[input.key] ?? "")} onChange={(event) => setValues({ ...values, [input.key]: Number(event.target.value) })} />
                  )}
                  {input.hint && <span>{input.hint}</span>}
                </label>
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

function ResultPanel({ formula, result }: { formula: FormulaItem; result: CalculationResult | null }) {
  const outputText = result
    ? formula.outputs.map((output) => `${output.label}: ${formatNumber(Number(result.values[output.key]))}${output.unit ? ` ${output.unit}` : ""}`).join("\n")
    : "";
  return (
    <GlassCard>
      <div className="section-title">
        <h3><Clipboard size={18} /> 结果与来源</h3>
        {result && <button className="icon-button small" onClick={() => safeCopy(outputText)} title="复制结果"><Clipboard size={16} /></button>}
      </div>
      {result ? (
        <div className="result-grid">
          {formula.outputs.map((output) => (
            <div key={output.key} className="result-item">
              <span>{output.label}</span>
              <strong>{formatNumber(Number(result.values[output.key]))}</strong>
              {output.unit && <em>{output.unit}</em>}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">输入参数后点击计算，结果会显示公式说明和来源。</p>
      )}
      <div className="formula-box">
        <strong>公式说明</strong>
        <p>{formula.formulaText}</p>
      </div>
      {formula.module === "survey" && <SurveyDiagram formula={formula} />}
      <SourceList ids={formula.sourceIds} />
    </GlassCard>
  );
}

function SurveyDiagram({ formula }: { formula: FormulaItem }) {
  const diagramType = getSurveyDiagramType(formula.id, formula.category);
  return (
    <div className="diagram-box">
      <div className="diagram-head">
        <strong>图例 / 示意图</strong>
        {formula.status === "需复核" && <span>方向约定请按公式来源复核</span>}
      </div>
      <svg viewBox="0 0 420 210" role="img" aria-label={`${formula.name} 图例`}>
        <defs>
          <marker id={`arrow-${formula.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" />
          </marker>
        </defs>
        {diagramType === "circle" && <CircleDiagram markerId={`arrow-${formula.id}`} />}
        {diagramType === "intersection" && <IntersectionDiagram />}
        {diagramType === "arc" && <ArcDiagram markerId={`arrow-${formula.id}`} />}
        {diagramType === "level" && <LevelDiagram />}
        {diagramType === "polygon" && <PolygonDiagram />}
        {diagramType === "coordinate" && <CoordinateDiagram markerId={`arrow-${formula.id}`} />}
      </svg>
      <p className="muted">{getSurveyDiagramCaption(formula)}</p>
    </div>
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
  if (formula.status === "需复核") return "该图例用于说明点线关系，涉及左右转、顺逆时针、后视方向等约定时，以公式来源和复核样例为准。";
  return "示意图按资料中的点、线、角度、距离关系抽象绘制，用于辅助复核输入字段和输出结果。";
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
          <span>版本</span><strong>V1.5</strong>
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
