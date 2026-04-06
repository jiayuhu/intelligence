/**
 * RSS 抓取策略
 */

import Parser from "rss-parser";
import type { SourceConfig } from "../../../../sources/ai-industry-sources.js";
import type { AiIndustryFetchItem } from "../../../types/ai-industry.js";
import { FETCH_CONFIG } from "../../fetch-config.js";
import {
  parseDate,
  autoClassify,
  detectConfidence,
  getStatusFromConfidence,
  truncate,
  isWithinTimeWindow,
} from "../../fetch-utils.js";
import { getGlobalCache } from "../../fetch/cache.js";

const rssParser = new Parser({ timeout: FETCH_CONFIG.TIMEOUT.RSS });
const cache = getGlobalCache();

export async function fetchWithRss(source: SourceConfig): Promise<AiIndustryFetchItem[]> {
  if (!source.rssUrl) {
    throw new Error("No RSS URL configured");
  }

  // 检查缓存
  const cacheKey = `rss:${source.rssUrl}`;
  const cached = cache.get<AiIndustryFetchItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const items: AiIndustryFetchItem[] = [];
  const feed = await rssParser.parseURL(source.rssUrl);

  for (const item of feed.items || []) {
    const pubDate = parseDate(item.pubDate || item.isoDate || "");
    if (!pubDate || !isWithinTimeWindow(pubDate)) {
      continue;
    }

    const classification = autoClassify(item.title || "", item.contentSnippet);
    items.push({
      title: item.title || "无标题",
      published_at: pubDate.toISOString(),
      source_name: source.name,
      source_url: item.link || source.siteUrl,
      subject: source.name.split(" ")[0],
      classification,
      event_summary: truncate(item.contentSnippet || item.title || "", FETCH_CONFIG.TRUNCATE.EVENT_SUMMARY),
      why_it_matters: truncate(item.contentSnippet || "", FETCH_CONFIG.TRUNCATE.WHY_IT_MATTERS),
      confidence: detectConfidence(source.tier, pubDate),
      related_focus: [classification],
      within_48h: true,
      status: getStatusFromConfidence(detectConfidence(source.tier, pubDate)),
      source_tier: source.tier,
      notes: `Fetched via RSS`,
    });
  }

  // 缓存结果
  cache.set(cacheKey, items);

  return items;
}
