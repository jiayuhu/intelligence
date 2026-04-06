/**
 * 抓取工具函数库
 * 
 * 统一封装：
 * - 日期解析
 * - 文本分类
 * - 相似度计算
 * - 文本截断
 */

import type {
  AiIndustryClassification,
  AiIndustryConfidence,
  AiIndustryItemStatus,
} from "../types/ai-industry.js";

/**
 * 计算时间窗口（48小时）
 */
export function getTimeWindow(hours: number = 48): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start, end };
}

/**
 * 检查日期是否在指定时间窗口内
 */
export function isWithinTimeWindow(date: Date, hours: number = 48): boolean {
  return date >= getTimeWindow(hours).start;
}

/**
 * 解析日期字符串
 * 支持：ISO 格式、RFC 2822、相对时间（如 "2 hours ago"）
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // 尝试直接解析
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // 相对时间解析
  const relativeMatch = dateStr.match(
    /(\d+)\s+(minute|hour|day|week)s?\s+ago/i
  );
  if (relativeMatch) {
    const num = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const now = new Date();

    const multipliers: Record<string, number> = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    if (multipliers[unit]) {
      return new Date(now.getTime() - num * multipliers[unit]);
    }
  }

  return null;
}

/**
 * 基于关键词自动分类
 */
export function autoClassify(
  title: string,
  content?: string
): AiIndustryClassification {
  const text = `${title} ${content || ""}`.toLowerCase();

  // AI Agent 关键词
  if (
    /\bagent\b|autonomous|openclaw|devin|multi-agent|task execution|langchain|llamaindex/.test(
      text
    )
  ) {
    return "AI Agent";
  }

  // AI Coding 关键词
  if (
    /\bcopilot\b|\bcursor\b|claude code|coding|ide|github|codex|code generation/.test(
      text
    )
  ) {
    return "AI Coding";
  }

  // 开源模型关键词（并入模型与基础设施）
  if (/\bopen source\b|huggingface|\bllama\b|\bmistral\b|github release/.test(text)) {
    return "模型与基础设施";
  }

  // 模型与基础设施关键词
  if (
    /\bmodel\b|\bgpt\b|\bclaude\b|\bgemini\b|benchmark|inference|\bmllm\b|api|infrastructure/.test(
      text
    )
  ) {
    return "模型与基础设施";
  }

  // 政策与监管关键词
  if (/\bregulation\b|policy|compliance|safety|ai act|government/.test(text)) {
    return "政策与监管";
  }

  // 默认分类
  return "模型与基础设施";
}

/**
 * 检测可信度
 */
export function detectConfidence(
  tier: string,
  date: Date | null
): AiIndustryConfidence {
  if (!date) return "low";
  if (tier === "tier1" && isWithinTimeWindow(date)) return "high";
  if (tier === "tier2" && isWithinTimeWindow(date)) return "medium";
  return "low";
}

/**
 * 获取状态（基于可信度）
 */
export function getStatusFromConfidence(
  confidence: AiIndustryConfidence
): AiIndustryItemStatus {
  return confidence === "high" ? "confirmed" : "tentative";
}

/**
 * 计算两个字符串的 Jaccard 相似度
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, "").trim();

  // 完全匹配
  if (s1 === s2) return 1;

  // 包含关系
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // 分词计算 Jaccard 相似度
  const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * 截断文本到指定长度
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * 智能截断（优先在句子边界截断）
 */
export function truncateSmart(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";

  // 尝试在句号处截断
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf("。");

  if (lastPeriod > maxLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated.trim() + "...";
}

/**
 * 处理相对链接为绝对链接
 */
export function resolveLink(link: string, baseUrl: string): string {
  if (!link) return "";
  if (link.startsWith("http")) return link;

  const base = new URL(baseUrl);

  if (link.startsWith("/")) {
    return `${base.protocol}//${base.host}${link}`;
  }

  return `${baseUrl.replace(/\/$/, "")}/${link}`;
}
