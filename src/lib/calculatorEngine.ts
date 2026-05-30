export type AngleMode = "deg" | "rad" | "dms";

type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: string }
  | { type: "function"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "constant"; value: "pi" | "e" };

const functions = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log", "abs"]);
const constants = { pi: Math.PI, e: Math.E };
const precedence: Record<string, number> = { "u-": 5, "^": 4, "*": 3, "/": 3, "%": 3, "+": 2, "-": 2 };
const rightAssociative = new Set(["^", "u-"]);

export const dmsToDecimal = (deg: number, min = 0, sec = 0) => {
  const sign = deg < 0 ? -1 : 1;
  return sign * (Math.abs(deg) + min / 60 + sec / 3600);
};

export const decimalToDms = (decimal: number) => {
  const sign = decimal < 0 ? -1 : 1;
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minutesFloat = (abs - deg) * 60;
  const min = Math.floor(minutesFloat);
  const sec = (minutesFloat - min) * 60;
  return { deg: deg * sign, min, sec };
};

const normalizeExpression = (expression: string) =>
  expression
    .replace(/π/g, "pi")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/√/g, "sqrt")
    .replace(/（/g, "(")
    .replace(/）/g, ")");

const tokenize = (expression: string): Token[] => {
  const input = normalizeExpression(expression).replace(/\s+/g, "");
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/[0-9.]/.test(char)) {
      let raw = char;
      i += 1;
      while (i < input.length && /[0-9.eE]/.test(input[i])) {
        raw += input[i];
        i += 1;
        if ((input[i - 1] === "e" || input[i - 1] === "E") && /[+-]/.test(input[i])) {
          raw += input[i];
          i += 1;
        }
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error("表达式中包含无效数字。");
      tokens.push({ type: "number", value });
      continue;
    }
    if (/[a-zA-Z]/.test(char)) {
      let word = char;
      i += 1;
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        word += input[i];
        i += 1;
      }
      if (word in constants) tokens.push({ type: "constant", value: word as "pi" | "e" });
      else if (functions.has(word)) tokens.push({ type: "function", value: word });
      else throw new Error(`未知函数或常量：${word}`);
      continue;
    }
    if ("+-*/^%".includes(char)) {
      const prev = tokens[tokens.length - 1];
      const isUnary = char === "-" && (!prev || prev.type === "operator" || (prev.type === "paren" && prev.value === "("));
      tokens.push({ type: "operator", value: isUnary ? "u-" : char });
      i += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      i += 1;
      continue;
    }
    throw new Error(`不支持的字符：${char}`);
  }
  return tokens;
};

const toRpn = (tokens: Token[]) => {
  const output: Token[] = [];
  const stack: Token[] = [];
  for (const token of tokens) {
    if (token.type === "number" || token.type === "constant") output.push(token);
    else if (token.type === "function") stack.push(token);
    else if (token.type === "operator") {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === "function") {
          output.push(stack.pop()!);
          continue;
        }
        if (top.type !== "operator") break;
        const shouldPop = rightAssociative.has(token.value)
          ? precedence[token.value] < precedence[top.value]
          : precedence[token.value] <= precedence[top.value];
        if (!shouldPop) break;
        output.push(stack.pop()!);
      }
      stack.push(token);
    } else if (token.value === "(") {
      stack.push(token);
    } else {
      while (stack.length && !(stack[stack.length - 1].type === "paren" && stack[stack.length - 1].value === "(")) {
        output.push(stack.pop()!);
      }
      if (!stack.length) throw new Error("括号不匹配。");
      stack.pop();
      if (stack[stack.length - 1]?.type === "function") output.push(stack.pop()!);
    }
  }
  while (stack.length) {
    const token = stack.pop()!;
    if (token.type === "paren") throw new Error("括号不匹配。");
    output.push(token);
  }
  return output;
};

const applyFunction = (name: string, value: number, angleMode: AngleMode) => {
  const toRad = (x: number) => angleMode === "rad" ? x : x * Math.PI / 180;
  const fromRad = (x: number) => angleMode === "rad" ? x : x * 180 / Math.PI;
  switch (name) {
    case "sin": return Math.sin(toRad(value));
    case "cos": return Math.cos(toRad(value));
    case "tan": return Math.tan(toRad(value));
    case "asin": return fromRad(Math.asin(value));
    case "acos": return fromRad(Math.acos(value));
    case "atan": return fromRad(Math.atan(value));
    case "sqrt": return Math.sqrt(value);
    case "ln": return Math.log(value);
    case "log": return Math.log10(value);
    case "abs": return Math.abs(value);
    default: throw new Error(`未知函数：${name}`);
  }
};

const evaluateRpn = (tokens: Token[], angleMode: AngleMode) => {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token.type === "number") stack.push(token.value);
    else if (token.type === "constant") stack.push(constants[token.value]);
    else if (token.type === "function") {
      const value = stack.pop();
      if (value === undefined) throw new Error("函数参数缺失。");
      stack.push(applyFunction(token.value, value, angleMode));
    } else if (token.type === "operator") {
      if (token.value === "u-") {
        const value = stack.pop();
        if (value === undefined) throw new Error("负号缺少操作数。");
        stack.push(-value);
        continue;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("运算符缺少操作数。");
      switch (token.value) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/":
          if (Math.abs(b) < 1e-15) throw new Error("除数不能为 0。");
          stack.push(a / b);
          break;
        case "%": stack.push(a % b); break;
        case "^": stack.push(Math.pow(a, b)); break;
      }
    }
  }
  if (stack.length !== 1) throw new Error("表达式不合法，请检查括号或运算符。");
  return stack[0];
};

export const evaluateExpression = (expression: string, angleMode: AngleMode = "deg") => {
  if (!expression.trim()) throw new Error("请输入表达式。");
  return evaluateRpn(toRpn(tokenize(expression)), angleMode);
};
