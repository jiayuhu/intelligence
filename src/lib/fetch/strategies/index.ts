/**
 * 抓取策略统一入口
 */

import type { SourceConfig, FetchStrategy } from "../../../../sources/ai-industry-sources.js";
import type { AiIndustryFetchItem } from "../../../types/ai-industry.js";
import { fetchWithRss } from "./rss.js";
import { fetchWithCheerio } from "./cheerio.js";
import { fetchWithPlaywright, browserManager } from "./playwright.js";

export { fetchWithRss, fetchWithCheerio, fetchWithPlaywright, browserManager };

/**
 * 根据策略类型分发到对应的抓取函数
 */
export async function fetchWithStrategy(
  source: SourceConfig,
  strategy: FetchStrategy
): Promise<AiIndustryFetchItem[]> {
  switch (strategy) {
    case "rss":
      return fetchWithRss(source);
    case "cheerio":
      return fetchWithCheerio(source);
    case "playwright":
      return fetchWithPlaywright(source);
    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}

/**
 * 抓取单个源（带自动降级）
 */
export interface SourceFetchResult {
  items: AiIndustryFetchItem[];
  strategy: FetchStrategy;
  success: boolean;
  attempts: Array<{ strategy: FetchStrategy; success: boolean; error?: string }>;
}

export async function fetchSource(source: SourceConfig): Promise<SourceFetchResult> {
  const strategies = [source.primaryStrategy, ...source.fallbackStrategies];
  const attempts: Array<{ strategy: FetchStrategy; success: boolean; error?: string }> = [];

  for (const strategy of strategies) {
    // 检查策略可行性
    if (strategy === "rss" && !source.rssUrl) {
      attempts.push({ strategy, success: false, error: "未配置 RSS URL" });
      continue;
    }
    if ((strategy === "playwright" || strategy === "cheerio") && !source.selectors) {
      attempts.push({ strategy, success: false, error: "未配置选择器" });
      continue;
    }

    try {
      const items = await fetchWithStrategy(source, strategy);
      attempts.push({ strategy, success: true });
      return { items, strategy, success: true, attempts };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attempts.push({ strategy, success: false, error: msg });
      throw error; // 向上传递，由调用方处理日志
    }
  }

  return { items: [], strategy: source.primaryStrategy, success: false, attempts };
}
