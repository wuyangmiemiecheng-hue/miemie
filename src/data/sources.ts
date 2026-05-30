import type { SourceItem } from "../types";

export const sources: SourceItem[] = [
  {
    id: "prd-v15",
    module: "calculator",
    title: "建工计算器 网站开发 PRD V1.5",
    file: "建工计算器_网站开发PRD_V1.5.pdf / .md",
    status: "已核对",
    detail: "产品范围、信息架构、交互、数据结构、验收标准。"
  },
  {
    id: "survey-part-1",
    module: "survey",
    title: "工程测量计算公式汇总 第一部分",
    file: "工程测量计算公式汇总_第一部分.docx / 可直接查看版.html",
    status: "已核对",
    detail: "工程测量 23 个计算项、统一坐标约定、公式、图例说明与需复核事项。"
  },
  {
    id: "survey-review",
    module: "survey",
    title: "工程测量需复核项",
    file: "工程测量计算公式汇总_可直接查看版.html",
    status: "需复核",
    detail: "方位角推算、支导线、涵洞放样等方向约定需按原公式页或样例复核。"
  },
  {
    id: "pipe-part-2",
    module: "pipes",
    title: "各类管材计算公式与数据汇总 第二部分修正版",
    file: "各类管材计算公式与数据汇总_第二部分_修正版_可直接查看版.pdf",
    status: "已核对",
    detail: "从塑料管材选用表到无缝钢管为止的自定义法公式、材料密度、来源与边界校验。"
  },
  {
    id: "pipe-review",
    module: "pipes",
    title: "管材计算待复核项",
    file: "各类管材计算公式与数据汇总_第二部分_修正版_可直接查看版.pdf",
    status: "需复核",
    detail: "PVC-U 10Mpa/12.5Mpa 名称、不锈钢 201 密度、镀锌层重量系数 c 需按最终资料确认。"
  },
  {
    id: "gb-steel",
    module: "pipes",
    title: "钢管理论重量与相关国家标准",
    file: "第二部分公式来源说明",
    status: "已核对",
    detail: "GB/T 17395、GB/T 3091、GB/T 6728、GB/T 12771 等用于标准依据方向。"
  },
  {
    id: "unit-part-3",
    module: "units",
    title: "单位转化关系调研汇总 第三部分",
    file: "单位转化关系调研汇总_第三部分_可直接查看版.pdf / .html",
    status: "已核对",
    detail: "十类单位及 to_base_factor 通用换算公式。"
  },
  {
    id: "unit-review",
    module: "units",
    title: "单位换算高风险复核项",
    file: "单位转化关系调研汇总_第三部分_可直接查看版.html",
    status: "需复核",
    detail: "力单位 MN/mN 冲突、能量单位未见截图、市制和年等默认约定需在 UI 标注。"
  },
  {
    id: "unit-authorities",
    module: "units",
    title: "单位换算权威资料",
    file: "第三部分资料来源说明",
    status: "已核对",
    detail: "BIPM SI Brochure、NIST SP 811、GB 3100-1993 等。"
  }
];

export const getSourcesByIds = (ids: string[]) =>
  ids.map((id) => sources.find((source) => source.id === id)).filter(Boolean) as SourceItem[];
