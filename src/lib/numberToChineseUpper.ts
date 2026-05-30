const digits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const units = ["", "拾", "佰", "仟"];
const sections = ["", "万", "亿", "兆"];

const integerToUpper = (num: number) => {
  if (num === 0) return "零";
  const parts: string[] = [];
  let sectionIndex = 0;
  let needZero = false;
  while (num > 0) {
    const section = num % 10000;
    if (section === 0) {
      needZero = parts.length > 0;
    } else {
      let sectionText = "";
      let unitIndex = 0;
      let zeroInSection = false;
      let temp = section;
      while (temp > 0) {
        const d = temp % 10;
        if (d === 0) {
          if (sectionText) zeroInSection = true;
        } else {
          if (zeroInSection) {
            sectionText = digits[0] + sectionText;
            zeroInSection = false;
          }
          sectionText = digits[d] + units[unitIndex] + sectionText;
        }
        unitIndex += 1;
        temp = Math.floor(temp / 10);
      }
      if (needZero) {
        sectionText = digits[0] + sectionText;
        needZero = false;
      }
      parts.unshift(sectionText + sections[sectionIndex]);
    }
    sectionIndex += 1;
    num = Math.floor(num / 10000);
  }
  return parts.join("").replace(/零+/g, "零").replace(/零$/g, "");
};

export const numberToChineseUpper = (value: number) => {
  if (!Number.isFinite(value)) throw new Error("当前结果不是有效数字，无法转换。");
  const sign = value < 0 ? "负" : "";
  const abs = Math.abs(value);
  const integer = Math.floor(abs);
  const decimal = Math.round((abs - integer) * 1000000);
  const decimalText = decimal
    ? `点${String(decimal).padStart(6, "0").replace(/0+$/g, "").split("").map((n) => digits[Number(n)]).join("")}`
    : "";
  return sign + integerToUpper(integer) + decimalText;
};
