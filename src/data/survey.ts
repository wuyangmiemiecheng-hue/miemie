import type { FormulaItem, InputField } from "../types";

const pointA: InputField[] = [
  { key: "xA", label: "A 点 X/北坐标", unit: "m", required: true, defaultValue: 0 },
  { key: "yA", label: "A 点 Y/东坐标", unit: "m", required: true, defaultValue: 0 }
];

const pointB: InputField[] = [
  { key: "xB", label: "B 点 X/北坐标", unit: "m", required: true, defaultValue: 100 },
  { key: "yB", label: "B 点 Y/东坐标", unit: "m", required: true, defaultValue: 60 }
];

const pointC: InputField[] = [
  { key: "xC", label: "C 点 X/北坐标", unit: "m", defaultValue: 40 },
  { key: "yC", label: "C 点 Y/东坐标", unit: "m", defaultValue: 90 }
];

const pointD: InputField[] = [
  { key: "xD", label: "D 点 X/北坐标", unit: "m", defaultValue: 120 },
  { key: "yD", label: "D 点 Y/东坐标", unit: "m", defaultValue: 0 }
];

const formula = (
  id: string,
  category: string,
  name: string,
  inputs: InputField[],
  outputs: Array<{ key: string; label: string; unit?: string }>,
  formulaText: string,
  status: "已核对" | "需复核" = "已核对",
  notes?: string
): FormulaItem => ({
  id,
  module: "survey",
  category,
  name,
  inputs,
  outputs,
  formulaText,
  sourceIds: status === "需复核" ? ["survey-part-1", "survey-review"] : ["survey-part-1"],
  status,
  notes
});

export const surveyFormulas: FormulaItem[] = [
  formula(
    "coordinate-forward-inverse",
    "基础坐标计算",
    "坐标正反算",
    [
      { key: "mode", label: "计算模式", type: "select", defaultValue: "forward", options: [{ label: "坐标正算", value: "forward" }, { label: "坐标反算", value: "inverse" }] },
      ...pointA,
      ...pointB,
      { key: "distance", label: "距离 D（正算）", unit: "m", defaultValue: 120 },
      { key: "alpha", label: "方位角 alpha（正算）", unit: "deg", defaultValue: 35 }
    ],
    [
      { key: "x", label: "目标点 X", unit: "m" },
      { key: "y", label: "目标点 Y", unit: "m" },
      { key: "distance", label: "距离 DAB", unit: "m" },
      { key: "azimuth", label: "方位角 alphaAB", unit: "deg" }
    ],
    "正算: xB=xA+D*cos(alpha), yB=yA+D*sin(alpha). 反算: D=sqrt(dx^2+dy^2), alpha=norm360(atan2(dy,dx))."
  ),
  formula(
    "reverse-azimuth",
    "基础坐标计算",
    "正反坐标方位角",
    [{ key: "alpha", label: "已知方位角", unit: "deg", required: true, defaultValue: 35 }],
    [{ key: "reverse", label: "另一方向方位角", unit: "deg" }],
    "alpha反 = norm360(alpha正 + 180 deg)；alpha正 = norm360(alpha反 + 180 deg)。"
  ),
  formula(
    "azimuth-deduction",
    "基础坐标计算",
    "方位角推算",
    [
      { key: "mode", label: "角度定义", type: "select", defaultValue: "deflection", options: [{ label: "按偏角/转折角", value: "deflection" }, { label: "按水平内角", value: "interior" }] },
      { key: "turn", label: "转向", type: "select", defaultValue: "right", options: [{ label: "右转/右角", value: "right" }, { label: "左转/左角", value: "left" }] },
      { key: "alpha", label: "上一边方位角", unit: "deg", required: true, defaultValue: 80 },
      { key: "beta", label: "转折角 beta", unit: "deg", required: true, defaultValue: 35 }
    ],
    [{ key: "nextAzimuth", label: "下一边方位角", unit: "deg" }],
    "偏角: 左转 alpha'=alpha-beta, 右转 alpha'=alpha+beta；内角: alpha'=alpha+180-beta左 或 alpha-180+beta右。",
    "需复核",
    "资料建议用样例复核后视方位角和左右角定义。"
  ),
  formula(
    "coordinate-transform",
    "基础坐标计算",
    "大地坐标与施工坐标转换",
    [
      { key: "x0", label: "施工原点大地 X0", unit: "m", required: true, defaultValue: 1000 },
      { key: "y0", label: "施工原点大地 Y0", unit: "m", required: true, defaultValue: 2000 },
      { key: "xp", label: "施工坐标 x'", unit: "m", required: true, defaultValue: 20 },
      { key: "yp", label: "施工坐标 y'", unit: "m", required: true, defaultValue: 10 },
      { key: "xP", label: "大地坐标 X（反算）", unit: "m", defaultValue: 1010 },
      { key: "yP", label: "大地坐标 Y（反算）", unit: "m", defaultValue: 2020 },
      { key: "angle", label: "夹角 a", unit: "deg", required: true, defaultValue: 15 }
    ],
    [
      { key: "globalX", label: "施工转大地 X", unit: "m" },
      { key: "globalY", label: "施工转大地 Y", unit: "m" },
      { key: "localX", label: "大地转施工 x'", unit: "m" },
      { key: "localY", label: "大地转施工 y'", unit: "m" }
    ],
    "施工->大地: x=x0+xp*cosa-yp*sina, y=y0+xp*sina+yp*cosa；大地->施工使用逆旋转。"
  ),
  formula(
    "point-line-distance",
    "基础坐标计算",
    "点到线距离",
    [...pointA, ...pointB, { key: "xP", label: "外点 P 的 X", unit: "m", defaultValue: 60 }, { key: "yP", label: "外点 P 的 Y", unit: "m", defaultValue: 40 }],
    [
      { key: "footX", label: "垂足 X", unit: "m" },
      { key: "footY", label: "垂足 Y", unit: "m" },
      { key: "distance", label: "垂距 d", unit: "m" },
      { key: "station", label: "沿线参数 t" }
    ],
    "r=B-A, w=P-A, t=dot(w,r)/dot(r,r), O=A+t*r, d=|cross(r,w)|/|r|。"
  ),
  formula(
    "line-intersection",
    "基础坐标计算",
    "两直线求交点",
    [...pointA, ...pointB, ...pointC, ...pointD],
    [
      { key: "x", label: "交点 X", unit: "m" },
      { key: "y", label: "交点 Y", unit: "m" },
      { key: "angle", label: "锐夹角", unit: "deg" }
    ],
    "r=B-A, s=D-C, den=cross(r,s)；t=cross(C-A,s)/den；P=A+t*r。"
  ),
  formula(
    "point-along-line",
    "基础坐标计算",
    "沿直线求坐标",
    [...pointA, ...pointB, { key: "l", label: "沿 AB 长度 l", unit: "m", defaultValue: 30 }, { key: "offset", label: "垂距 d", unit: "m", defaultValue: 8 }],
    [
      { key: "footX", label: "垂足 O 的 X", unit: "m" },
      { key: "footY", label: "垂足 O 的 Y", unit: "m" },
      { key: "leftX", label: "左侧点 X", unit: "m" },
      { key: "leftY", label: "左侧点 Y", unit: "m" },
      { key: "rightX", label: "右侧点 X", unit: "m" },
      { key: "rightY", label: "右侧点 Y", unit: "m" }
    ],
    "e=(B-A)/|B-A|, O=A+l*e, nL=(ey,-ex), nR=(-ey,ex), C=O+d*n。"
  ),
  formula(
    "tangent-from-point",
    "基础坐标计算",
    "点到圆切点",
    [{ key: "xO", label: "圆心 X", unit: "m", defaultValue: 0 }, { key: "yO", label: "圆心 Y", unit: "m", defaultValue: 0 }, { key: "xP", label: "外点 X", unit: "m", defaultValue: 30 }, { key: "yP", label: "外点 Y", unit: "m", defaultValue: 20 }, { key: "R", label: "半径 R", unit: "m", defaultValue: 10 }],
    [
      { key: "t1x", label: "切点 T1 X", unit: "m" },
      { key: "t1y", label: "切点 T1 Y", unit: "m" },
      { key: "t2x", label: "切点 T2 X", unit: "m" },
      { key: "t2y", label: "切点 T2 Y", unit: "m" },
      { key: "length", label: "切线长", unit: "m" }
    ],
    "d=|P-O|, m=R^2/d, h=R*sqrt(d^2-R^2)/d, T=O+m*u±h*n。"
  ),
  formula(
    "circle-from-three-points",
    "基础坐标计算",
    "三点求圆心",
    [...pointA, ...pointB, ...pointC],
    [
      { key: "circumX", label: "外接圆心 X", unit: "m" },
      { key: "circumY", label: "外接圆心 Y", unit: "m" },
      { key: "circumR", label: "外接圆半径", unit: "m" },
      { key: "inX", label: "内切圆心 X", unit: "m" },
      { key: "inY", label: "内切圆心 Y", unit: "m" },
      { key: "inR", label: "内切圆半径", unit: "m" },
      { key: "area", label: "三角形面积", unit: "m2" }
    ],
    "S=|cross(B-A,C-A)|/2；外接圆心由垂直平分线求交；内心为边长加权平均。"
  ),
  formula(
    "polygon-area",
    "基础坐标计算",
    "多点求面积",
    [...pointA, ...pointB, ...pointC, ...pointD],
    [
      { key: "area", label: "面积", unit: "m2" },
      { key: "perimeter", label: "周长", unit: "m" }
    ],
    "S = 1/2 * |SUM(xi*y(i+1)-x(i+1)*yi)|；L = SUM |P(i+1)-Pi|。"
  ),
  formula(
    "circle-intersections",
    "基础坐标计算",
    "两圆求交点",
    [...pointA, ...pointB, { key: "R1", label: "A 圆半径 R1", unit: "m", defaultValue: 80 }, { key: "R2", label: "B 圆半径 R2", unit: "m", defaultValue: 70 }],
    [
      { key: "c1x", label: "交点 C X", unit: "m" },
      { key: "c1y", label: "交点 C Y", unit: "m" },
      { key: "c2x", label: "交点 C' X", unit: "m" },
      { key: "c2y", label: "交点 C' Y", unit: "m" },
      { key: "centerDistance", label: "圆心距", unit: "m" }
    ],
    "d=|B-A|, a=(R1^2-R2^2+d^2)/(2d), h=sqrt(R1^2-a^2), C=A+a*u±h*n。"
  ),
  formula(
    "arc-coordinate",
    "基础坐标计算",
    "沿圆弧求坐标",
    [...pointA, ...pointB, { key: "R", label: "圆弧半径 R", unit: "m", defaultValue: 80 }, { key: "arcLength", label: "到 C 点弧长 L", unit: "m", defaultValue: 30 }, { key: "offset", label: "偏距 d", unit: "m", defaultValue: 5 }, { key: "turn", label: "圆弧方向", type: "select", defaultValue: "left", options: [{ label: "左转", value: "left" }, { label: "右转", value: "right" }] }],
    [
      { key: "centerX", label: "圆心 X", unit: "m" },
      { key: "centerY", label: "圆心 Y", unit: "m" },
      { key: "x", label: "圆弧点 C X", unit: "m" },
      { key: "y", label: "圆弧点 C Y", unit: "m" },
      { key: "offsetX", label: "偏距点 X", unit: "m" },
      { key: "offsetY", label: "偏距点 Y", unit: "m" }
    ],
    "由弦长和半径求圆心候选，按左/右转选择；theta=L/R，旋转 OA 得 OC，偏距沿径向。",
    "需复核",
    "左转/右转与旋转正方向需和原图例保持一致。"
  ),
  formula(
    "sphere-center",
    "基础坐标计算",
    "球心坐标计算",
    [...pointA, ...pointB, ...pointC, ...pointD, { key: "zA", label: "A 点 Z", unit: "m", defaultValue: 0 }, { key: "zB", label: "B 点 Z", unit: "m", defaultValue: 0 }, { key: "zC", label: "C 点 Z", unit: "m", defaultValue: 30 }, { key: "zD", label: "D 点 Z", unit: "m", defaultValue: 40 }],
    [
      { key: "x", label: "球心 X", unit: "m" },
      { key: "y", label: "球心 Y", unit: "m" },
      { key: "z", label: "球心 Z", unit: "m" },
      { key: "R", label: "半径 R", unit: "m" }
    ],
    "将 B/C/D 球面方程分别减去 A 方程，解 3*3 线性方程组得球心。"
  ),
  formula(
    "traverse",
    "基础坐标计算",
    "支导线",
    [...pointA, ...pointB, { key: "beta", label: "转折角 beta", unit: "deg", defaultValue: 60 }, { key: "distance", label: "下一边边长 D", unit: "m", defaultValue: 80 }, { key: "turn", label: "转向", type: "select", defaultValue: "right", options: [{ label: "右角", value: "right" }, { label: "左角", value: "left" }] }],
    [
      { key: "azimuth", label: "前视方位角", unit: "deg" },
      { key: "x", label: "下一点 X", unit: "m" },
      { key: "y", label: "下一点 Y", unit: "m" }
    ],
    "alphaBA=az(B->A)；左角 alpha=norm360(alphaBA-beta)，右角 alpha=norm360(alphaBA+beta)；坐标递推。",
    "需复核",
    "资料要求左右角方向后续用样例或原 App 公式页复核。"
  ),
  formula(
    "culvert",
    "测量放样",
    "涵洞放样",
    [{ key: "xC", label: "中心点 X", unit: "m", defaultValue: 0 }, { key: "yC", label: "中心点 Y", unit: "m", defaultValue: 0 }, { key: "alpha", label: "前进方位角", unit: "deg", defaultValue: 30 }, { key: "delta", label: "偏角 delta", unit: "deg", defaultValue: 20 }, { key: "width", label: "设计宽度 W", unit: "m", defaultValue: 8 }, { key: "leftLength", label: "左边距离", unit: "m", defaultValue: 20 }, { key: "rightLength", label: "右边距离", unit: "m", defaultValue: 25 }],
    [
      { key: "p1x", label: "1 号点 X", unit: "m" },
      { key: "p1y", label: "1 号点 Y", unit: "m" },
      { key: "p3x", label: "3 号点 X", unit: "m" },
      { key: "p3y", label: "3 号点 Y", unit: "m" },
      { key: "p4x", label: "4 号点 X", unit: "m" },
      { key: "p4y", label: "4 号点 Y", unit: "m" },
      { key: "p6x", label: "6 号点 X", unit: "m" },
      { key: "p6y", label: "6 号点 Y", unit: "m" }
    ],
    "e=(cos alpha,sin alpha), nL=(ey,-ex)；左右端中心加减半宽得到 1/3/4/6 点。",
    "需复核",
    "若原 App 对左右距离定义不同，需按原公式页修正。"
  ),
  formula(
    "centerline-stake",
    "测量放样",
    "中线逐桩求坐标",
    [...pointA, ...pointB, ...pointC, { key: "stakeOffset", label: "相对 JD2 里程差", unit: "m", defaultValue: 20 }, { key: "R", label: "圆曲线半径 R", unit: "m", defaultValue: 300 }, { key: "Ls", label: "缓和曲线长 Ls", unit: "m", defaultValue: 60 }],
    [
      { key: "alpha1", label: "JD1-JD2 方位角", unit: "deg" },
      { key: "alpha2", label: "JD2-JD3 方位角", unit: "deg" },
      { key: "deflection", label: "转角", unit: "deg" },
      { key: "x", label: "简化桩点 X", unit: "m" },
      { key: "y", label: "简化桩点 Y", unit: "m" }
    ],
    "资料列出主点和中桩坐标计算要素。本站第一版给出方位角、转角，并按 JD2 沿角平分线简化示意输出。",
    "需复核",
    "完整缓和曲线逐桩需按原 App 样例进一步复核。"
  ),
  formula(
    "forward-intersection",
    "交会定点",
    "前方交会",
    [...pointA, ...pointB, { key: "alphaA", label: "A 点观测方位角", unit: "deg", defaultValue: 35 }, { key: "alphaB", label: "B 点观测方位角", unit: "deg", defaultValue: 320 }],
    [
      { key: "x", label: "交会点 X", unit: "m" },
      { key: "y", label: "交会点 Y", unit: "m" }
    ],
    "由 A 点和 B 点出发的两条射线求交点。"
  ),
  formula(
    "side-angle-intersection",
    "交会定点",
    "侧方（测角）交会",
    [...pointA, ...pointB, { key: "alphaA", label: "A 点观测方位角", unit: "deg", defaultValue: 40 }, { key: "angleP", label: "P 点夹角", unit: "deg", defaultValue: 70 }],
    [
      { key: "x", label: "交会点 X", unit: "m" },
      { key: "y", label: "交会点 Y", unit: "m" },
      { key: "alphaB", label: "推算 B 点方位角", unit: "deg" }
    ],
    "按已知一侧方向和交会角推算另一侧方向，再求两射线交点。",
    "需复核",
    "测角方向需结合原图例复核。"
  ),
  formula(
    "distance-intersection",
    "交会定点",
    "侧边（距离）交会",
    [...pointA, ...pointB, { key: "R1", label: "到 A 距离", unit: "m", defaultValue: 80 }, { key: "R2", label: "到 B 距离", unit: "m", defaultValue: 70 }],
    [
      { key: "c1x", label: "候选点 1 X", unit: "m" },
      { key: "c1y", label: "候选点 1 Y", unit: "m" },
      { key: "c2x", label: "候选点 2 X", unit: "m" },
      { key: "c2y", label: "候选点 2 Y", unit: "m" }
    ],
    "距离交会等同两圆求交点。"
  ),
  formula(
    "resection-1",
    "交会定点",
    "后方交会 1",
    [...pointA, ...pointB, ...pointC, { key: "R1", label: "到 A 距离", unit: "m", defaultValue: 70 }, { key: "R2", label: "到 B 距离", unit: "m", defaultValue: 80 }, { key: "R3", label: "到 C 距离", unit: "m", defaultValue: 65 }],
    [
      { key: "x", label: "后方交会点 X", unit: "m" },
      { key: "y", label: "后方交会点 Y", unit: "m" },
      { key: "residual", label: "第三距离残差", unit: "m" }
    ],
    "本实现按三边距离后方交会：先由 A/B 两圆求候选，再选择更接近 C 距离的点。",
    "需复核",
    "资料中的后方交会截图公式需用原样例确认。"
  ),
  formula(
    "resection-2",
    "交会定点",
    "后方交会 2",
    [...pointA, ...pointB, ...pointC, { key: "alphaA", label: "由未知点至 A 方位角", unit: "deg", defaultValue: 210 }, { key: "alphaB", label: "由未知点至 B 方位角", unit: "deg", defaultValue: 300 }],
    [
      { key: "x", label: "后方交会点 X", unit: "m" },
      { key: "y", label: "后方交会点 Y", unit: "m" },
      { key: "checkAzimuthC", label: "至 C 点校核方位角", unit: "deg" }
    ],
    "本实现按两条反向观测方位线求交，并输出第三点方位角校核。",
    "需复核",
    "需结合原后方交会 2 公式页复核角度定义。"
  ),
  formula(
    "trig-leveling",
    "视镜高程",
    "三角高程",
    [{ key: "H0", label: "已知点高程", unit: "m", defaultValue: 100 }, { key: "distance", label: "平距/斜距投影", unit: "m", defaultValue: 120 }, { key: "verticalAngle", label: "竖直角", unit: "deg", defaultValue: 5 }, { key: "instrumentHeight", label: "仪器高", unit: "m", defaultValue: 1.5 }, { key: "targetHeight", label: "棱镜高", unit: "m", defaultValue: 1.8 }],
    [
      { key: "deltaH", label: "高差", unit: "m" },
      { key: "H", label: "目标点高程", unit: "m" }
    ],
    "H = H0 + D*tan(v) + i - l。"
  ),
  formula(
    "foresight-reading",
    "视镜高程",
    "前视读数反算",
    [{ key: "H0", label: "后视点高程", unit: "m", defaultValue: 100 }, { key: "HB", label: "目标点高程", unit: "m", defaultValue: 101.2 }, { key: "backReading", label: "后视读数", unit: "mm", defaultValue: 1500 }],
    [
      { key: "instrumentHorizon", label: "视线高", unit: "m" },
      { key: "frontReading", label: "前视读数", unit: "mm" }
    ],
    "视线高 = H0 + 后视读数/1000；前视读数 = (视线高 - HB) * 1000。"
  )
];
