/**
 * 抓取模块统一入口
 * 
 * 重构后的抓取系统：
 * - strategies/: 各种抓取策略（RSS/Cheerio/Playwright）
 * - utils/: 工具函数（由 fetch-utils.ts 提供）
 * - fetch-config.ts: 配置常量
 * - selector-health.ts: 选择器健康检查
 */

export { fetchWithRss, fetchWithCheerio, fetchWithPlaywright, fetchWithStrategy, fetchSource, browserManager } from "./strategies/index.js";
export type { SourceFetchResult } from "./strategies/index.js";
export { FETCH_CONFIG, getTimeWindowMs, getWindowStartDate } from "../fetch-config.js";
export {
  parseDate,
  autoClassify,
  detectConfidence,
  getStatusFromConfidence,
  calculateSimilarity,
  truncate,
  truncateSmart,
  resolveLink,
  isWithinTimeWindow,
  getTimeWindow,
} from "../fetch-utils.js";
export { checkAllSelectorsHealth, printHealthSummary, SELECTOR_VERSIONS } from "../selector-health.js";

// 重新导出类型
export type { AiIndustryFetchItem, AiIndustryFetchResult } from "../../types/ai-industry.js";
export type { FetchStrategy } from "../../../sources/ai-industry-sources.js";
