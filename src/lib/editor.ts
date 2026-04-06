const TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bblind-merge\b/gi, "无审阅合并"],
  [/\bruntime\b/gi, "运行时"],
  [/\bgovernance\b/gi, "治理"],
  [/\bfoundation\b/gi, "基础底座"],
  [/\bshow notes\b/gi, "节目说明"],
  [/\btranscript\b/gi, "文字稿"],
  [/\benterprise\b/gi, "企业级"],
];

function protectUrls(value: string): { protectedText: string; urls: string[] } {
  const urls: string[] = [];
  const protectedText = value.replace(/https?:\/\/\S+/g, (match) => {
    urls.push(match);
    return `__URL_${urls.length - 1}__`;
  });

  return { protectedText, urls };
}

function restoreUrls(value: string, urls: string[]): string {
  return value.replace(/__URL_(\d+)__/g, (_, index) => urls[Number(index)] ?? "");
}

export function polishChineseText(value: string): string {
  const { protectedText, urls } = protectUrls(value);
  let text = protectedText;

  text = text.replace(/[\u0E00-\u0E7F]+/g, "");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\s+([，。；：！？])/g, "$1");
  text = text.replace(/([（【])\s+/g, "$1");
  text = text.replace(/\s+([）】])/g, "$1");

  for (const [pattern, replacement] of TERM_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\s{2,}/g, " ").trim();

  return restoreUrls(text, urls);
}

export function polishChineseLines(lines: string[]): string[] {
  return lines.map((line) => {
    if (/^https?:\/\//.test(line.trim())) {
      return line;
    }

    const markerMatch = line.match(/^(\s*(?:\d+\.\s+|-+\s+|[A-Za-z\u4e00-\u9fa5]+：\s*))(.+)$/);
    if (!markerMatch) {
      return polishChineseText(line);
    }

    return `${markerMatch[1]}${polishChineseText(markerMatch[2])}`;
  });
}
