import { surveyFormulas } from "../data/survey";
import type { CalculationResult, NumericRecord } from "../types";
import { positive } from "./precision";

type Point = { x: number; y: number };
type Point3 = Point & { z: number };

const get = (input: NumericRecord, key: string, fallback = 0) => {
  const value = Number(input[key]);
  return Number.isFinite(value) ? value : fallback;
};
const p = (input: NumericRecord, prefix: string): Point => ({ x: get(input, `x${prefix}`), y: get(input, `y${prefix}`) });
const degToRad = (deg: number) => deg * Math.PI / 180;
const radToDeg = (rad: number) => rad * 180 / Math.PI;
export const norm360 = (angle: number) => ((angle % 360) + 360) % 360;
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s });
const az = (a: Point, b: Point) => norm360(radToDeg(Math.atan2(b.y - a.y, b.x - a.x)));
const dir = (angle: number): Point => ({ x: Math.cos(degToRad(angle)), y: Math.sin(degToRad(angle)) });
const unit = (a: Point, b: Point): Point => {
  const d = dist(a, b);
  positive(d, "两点不能重合。");
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};
const leftNormal = (e: Point): Point => ({ x: e.y, y: -e.x });
const rotate = (v: Point, angleDeg: number): Point => {
  const c = Math.cos(degToRad(angleDeg));
  const s = Math.sin(degToRad(angleDeg));
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

const lineIntersection = (a: Point, b: Point, c: Point, d: Point) => {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = cross(r, s);
  if (Math.abs(den) < 1e-12) throw new Error("两直线平行或重合，无法求唯一交点。");
  const t = cross(sub(c, a), s) / den;
  return add(a, scale(r, t));
};

const rayIntersection = (a: Point, angleA: number, b: Point, angleB: number) =>
  lineIntersection(a, add(a, dir(angleA)), b, add(b, dir(angleB)));

const circleIntersections = (a: Point, b: Point, r1: number, r2: number) => {
  positive(r1, "半径必须大于 0。");
  positive(r2, "半径必须大于 0。");
  const d = dist(a, b);
  if (d <= 0) throw new Error("两圆圆心不能重合。");
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) throw new Error("两圆无实交点。");
  const u = unit(a, b);
  const n = leftNormal(u);
  const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - x * x;
  if (h2 < -1e-9) throw new Error("两圆无实交点。");
  const h = Math.sqrt(Math.max(0, h2));
  const base = add(a, scale(u, x));
  return [add(base, scale(n, h)), add(base, scale(n, -h))];
};

const solve3 = (m: number[][], b: number[]) => {
  const a = m.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < 3; i += 1) {
    let pivot = i;
    for (let r = i + 1; r < 3; r += 1) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    if (Math.abs(a[pivot][i]) < 1e-12) throw new Error("线性方程组病态，无法求唯一球心。");
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const div = a[i][i];
    for (let c = i; c < 4; c += 1) a[i][c] /= div;
    for (let r = 0; r < 3; r += 1) {
      if (r === i) continue;
      const factor = a[r][i];
      for (let c = i; c < 4; c += 1) a[r][c] -= factor * a[i][c];
    }
  }
  return [a[0][3], a[1][3], a[2][3]];
};

const calc = (id: string, input: NumericRecord): Record<string, number> => {
  const A = p(input, "A");
  const B = p(input, "B");
  const C = p(input, "C");
  const D = p(input, "D");

  switch (id) {
    case "coordinate-forward":
    case "coordinate-forward-inverse": {
      const e = dir(get(input, "alpha"));
      const target = add(A, scale(e, get(input, "distance")));
      return { x: target.x, y: target.y };
    }
    case "coordinate-inverse":
      return { deltaX: B.x - A.x, deltaY: B.y - A.y, distance: dist(A, B), azimuth: az(A, B) };
    case "reverse-azimuth":
      return { reverse: norm360(get(input, "alpha") + 180) };
    case "azimuth-deduction": {
      const alpha = get(input, "alpha");
      const beta = get(input, "beta");
      const right = input.turn !== "left";
      const nextAzimuth = input.mode === "interior"
        ? norm360(right ? alpha - 180 + beta : alpha + 180 - beta)
        : norm360(alpha + (right ? beta : -beta));
      return { nextAzimuth };
    }
    case "coordinate-transform": {
      const a = degToRad(get(input, "angle"));
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x0 = get(input, "x0");
      const y0 = get(input, "y0");
      const xp = get(input, "xp");
      const yp = get(input, "yp");
      const dx = get(input, "xP") - x0;
      const dy = get(input, "yP") - y0;
      return {
        globalX: x0 + xp * c - yp * s,
        globalY: y0 + xp * s + yp * c,
        localX: dx * c + dy * s,
        localY: -dx * s + dy * c
      };
    }
    case "point-line-distance": {
      const P = { x: get(input, "xP"), y: get(input, "yP") };
      const r = sub(B, A);
      const w = sub(P, A);
      const rr = dot(r, r);
      positive(rr, "直线两点不能重合。");
      const t = dot(w, r) / rr;
      const foot = add(A, scale(r, t));
      return {
        footX: foot.x,
        footY: foot.y,
        distance: Math.abs(cross(r, w)) / Math.sqrt(rr),
        distanceToA: dist(foot, A),
        distanceToB: dist(foot, B)
      };
    }
    case "line-intersection": {
      const P = lineIntersection(A, B, C, D);
      const r = sub(B, A);
      const s = sub(D, C);
      const angle = radToDeg(Math.acos(Math.min(1, Math.abs(dot(r, s)) / (Math.hypot(r.x, r.y) * Math.hypot(s.x, s.y)))));
      return { x: P.x, y: P.y, angle };
    }
    case "point-along-line": {
      const e = unit(A, B);
      const foot = add(A, scale(e, get(input, "l")));
      const nL = leftNormal(e);
      const nR = scale(nL, -1);
      const left = add(foot, scale(nL, get(input, "offset")));
      const right = add(foot, scale(nR, get(input, "offset")));
      return { footX: foot.x, footY: foot.y, leftX: left.x, leftY: left.y, rightX: right.x, rightY: right.y };
    }
    case "tangent-from-point": {
      const O = { x: get(input, "xO"), y: get(input, "yO") };
      const P = { x: get(input, "xP"), y: get(input, "yP") };
      const R = get(input, "R");
      positive(R, "半径必须大于 0。");
      const d = dist(O, P);
      if (d < R) throw new Error("外点在圆内，无实切点。");
      const u = unit(O, P);
      const n = leftNormal(u);
      const m = R * R / d;
      const h = R * Math.sqrt(Math.max(0, d * d - R * R)) / d;
      const t1 = add(O, add(scale(u, m), scale(n, h)));
      const t2 = add(O, add(scale(u, m), scale(n, -h)));
      return { t1x: t1.x, t1y: t1.y, t2x: t2.x, t2y: t2.y, length: Math.sqrt(d * d - R * R) };
    }
    case "circle-from-three-points": {
      const area2 = cross(sub(B, A), sub(C, A));
      if (Math.abs(area2) < 1e-12) throw new Error("三点共线，无法求唯一圆心。");
      const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
      const ux = ((A.x ** 2 + A.y ** 2) * (B.y - C.y) + (B.x ** 2 + B.y ** 2) * (C.y - A.y) + (C.x ** 2 + C.y ** 2) * (A.y - B.y)) / d;
      const uy = ((A.x ** 2 + A.y ** 2) * (C.x - B.x) + (B.x ** 2 + B.y ** 2) * (A.x - C.x) + (C.x ** 2 + C.y ** 2) * (B.x - A.x)) / d;
      const a = dist(B, C), b = dist(C, A), c = dist(A, B);
      const S = Math.abs(area2) / 2;
      const inX = (a * A.x + b * B.x + c * C.x) / (a + b + c);
      const inY = (a * A.y + b * B.y + c * C.y) / (a + b + c);
      return { circumX: ux, circumY: uy, circumR: dist(A, { x: ux, y: uy }), inX, inY, inR: S / ((a + b + c) / 2), area: S };
    }
    case "polygon-area": {
      const points = [A, B, C, D];
      let twice = 0, perimeter = 0;
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i], b = points[(i + 1) % points.length];
        twice += a.x * b.y - b.x * a.y;
        perimeter += dist(a, b);
      }
      return { area: Math.abs(twice) / 2, perimeter };
    }
    case "circle-intersections":
    case "distance-intersection": {
      const [c1, c2] = circleIntersections(A, B, get(input, "R1"), get(input, "R2"));
      if (id === "distance-intersection") return { c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y };
      const v1 = sub(c1, A);
      const v2 = sub(B, A);
      const angle = radToDeg(Math.acos(Math.min(1, Math.max(-1, dot(v1, v2) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))))));
      return { c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, centerDistance: dist(A, B), angle };
    }
    case "arc-coordinate": {
      const R = get(input, "R");
      const c = dist(A, B);
      if (c > 2 * R) throw new Error("弦长大于直径，无法构成圆弧。");
      const e = unit(A, B);
      const n = leftNormal(e);
      const q = Math.sqrt(R * R - (c / 2) ** 2);
      const mid = scale(add(A, B), 0.5);
      const center = input.turn === "right" ? add(mid, scale(n, -q)) : add(mid, scale(n, q));
      const OA = sub(A, center);
      const sign = input.turn === "right" ? -1 : 1;
      const OC = rotate(OA, sign * radToDeg(get(input, "arcLength") / R));
      const P = add(center, OC);
      return { centerX: center.x, centerY: center.y, tangentLength: q, x: P.x, y: P.y };
    }
    case "sphere-center": {
      const A3: Point3 = { ...A, z: get(input, "zA") };
      const B3: Point3 = { ...B, z: get(input, "zB") };
      const C3: Point3 = { ...C, z: get(input, "zC") };
      const D3: Point3 = { ...D, z: get(input, "zD") };
      const rows = [B3, C3, D3].map((pt) => [2 * (pt.x - A3.x), 2 * (pt.y - A3.y), 2 * (pt.z - A3.z)]);
      const rhs = [B3, C3, D3].map((pt) => pt.x ** 2 + pt.y ** 2 + pt.z ** 2 - A3.x ** 2 - A3.y ** 2 - A3.z ** 2);
      const [x, y, z] = solve3(rows, rhs);
      return { x, y, z, R: Math.hypot(A3.x - x, A3.y - y, A3.z - z) };
    }
    case "traverse": {
      const alphaBA = az(B, A);
      const next = norm360(alphaBA + (input.turn === "left" ? -get(input, "beta") : get(input, "beta")));
      const P = add(B, scale(dir(next), get(input, "distance")));
      return { azimuth: next, x: P.x, y: P.y };
    }
    case "culvert": {
      const C0 = { x: get(input, "xC"), y: get(input, "yC") };
      const e = dir(get(input, "alpha"));
      const n = leftNormal(e);
      const L = add(C0, scale(e, -get(input, "leftLength")));
      const R = add(C0, scale(e, get(input, "rightLength")));
      const half = get(input, "width") / 2;
      const p1 = add(L, scale(n, half));
      const p4 = add(L, scale(n, -half));
      const p3 = add(R, scale(n, half));
      const p6 = add(R, scale(n, -half));
      return { p1x: p1.x, p1y: p1.y, p3x: p3.x, p3y: p3.y, p4x: p4.x, p4y: p4.y, p6x: p6.x, p6y: p6.y };
    }
    case "centerline-stake": {
      const alpha1 = az(A, B);
      const alpha2 = az(B, C);
      const deflection = Math.abs(norm360(alpha2 - alpha1));
      const bisector = norm360((alpha1 + alpha2) / 2);
      const P = add(B, scale(dir(bisector), get(input, "stakeOffset")));
      return { alpha1, alpha2, deflection: deflection > 180 ? 360 - deflection : deflection, x: P.x, y: P.y };
    }
    case "forward-intersection": {
      const P = rayIntersection(A, get(input, "alphaA"), B, get(input, "alphaB"));
      return { x: P.x, y: P.y };
    }
    case "side-angle-intersection": {
      const alphaB = norm360(get(input, "alphaA") + 180 - get(input, "angleP"));
      const P = rayIntersection(A, get(input, "alphaA"), B, alphaB);
      return { x: P.x, y: P.y, alphaB };
    }
    case "resection-1": {
      const [c1, c2] = circleIntersections(A, B, get(input, "R1"), get(input, "R2"));
      const r3 = get(input, "R3");
      const chosen = Math.abs(dist(c1, C) - r3) <= Math.abs(dist(c2, C) - r3) ? c1 : c2;
      return { x: chosen.x, y: chosen.y, residual: dist(chosen, C) - r3 };
    }
    case "resection-2": {
      const P = rayIntersection(A, norm360(get(input, "alphaA") + 180), B, norm360(get(input, "alphaB") + 180));
      return { x: P.x, y: P.y, checkAzimuthC: az(P, C) };
    }
    case "trig-leveling": {
      const deltaH = get(input, "distance") * Math.tan(degToRad(get(input, "verticalAngle"))) + get(input, "instrumentHeight") - get(input, "targetHeight");
      return { deltaH, H: get(input, "H0") + deltaH };
    }
    case "foresight-reading": {
      const instrumentHorizon = get(input, "H0") + get(input, "backReading") / 1000;
      return { instrumentHorizon, frontReading: (instrumentHorizon - get(input, "HB")) * 1000 };
    }
    default:
      throw new Error("该工程测量计算项尚未实现。");
  }
};

export const calculateSurvey = (formulaId: string, input: NumericRecord): CalculationResult => {
  const formula = surveyFormulas.find((item) => item.id === formulaId);
  if (!formula) throw new Error("未找到工程测量计算项。");
  return {
    values: calc(formulaId, input),
    formulaName: formula.name,
    status: formula.status,
    sourceIds: formula.sourceIds,
    messages: formula.notes ? [formula.notes] : []
  };
};
