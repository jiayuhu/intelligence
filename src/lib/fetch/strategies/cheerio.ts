/**
 * Cheerio HTML 抓取策略
 */

import * as cheerio from "cheerio";
import type { SourceConfig } from "../../../../sources/ai-industry-sources.js";
import type { AiIndustryFetchItem } from "../../../types/ai-industry.js";
import { FETCH_CONFIG } from "../../fetch-config.js";
import {
  parseDate,
  autoClassify,
  detectConfidence,
  getStatusFromConfidence,
  truncate,
  resolveLink,
  isWithinTimeWindow,
} from "../../fetch-utils.js";
import { getGlobalCache } from "../../fetch/cache.js";

const cache = getGlobalCache();

export async function fetchWithCheerio(source: SourceConfig): Promise<AiIndustryFetchItem[]> {
  if (!source.selectors) {
    throw new Error("Cheerio requires selectors");
  }

  // 检查缓存
  const cacheKey = `cheerio:${source.siteUrl}`;
  const cached = cache.get<AiIndustryFetchItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const items: AiIndustryFetchItem[] = [];

  const response = await fetch(source.siteUrl, {
    headers: {
      "User-Agent": FETCH_CONFIG.HEADERS.USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const sel = source.selectors;

  $(sel.container).each((_, el) => {
    const $el = $(el);
    const title = $el.find(sel.title).first().text().trim();
    let link = resolveLink(
      $el.find(sel.link).first().attr("href") || "",
      source.siteUrl
    );
    const dateText = sel.date
      ? $el.find(sel.date).first().text().trim()
      : "";
    const summary = sel.summary
      ? $el.find(sel.summary).first().text().trim()
      : "";

    if (!title || !link) return;

    const pubDate = parseDate(dateText);
    if (!pubDate || !isWithinTimeWindow(pubDate)) return;

    const classification = autoClassify(title, summary);
    items.push({
      title,
      published_at: pubDate.toISOString(),
      source_name: source.name,
      source_url: link,
      subject: source.name.split(" ")[0],
      classification,
      event_summary: truncate(summary || title, FETCH_CONFIG.TRUNCATE.EVENT_SUMMARY),
      why_it_matters: truncate(summary, FETCH_CONFIG.TRUNCATE.WHY_IT_MATTERS),
      confidence: detectConfidence(source.tier, pubDate),
      related_focus: [classification],
      within_48h: true,
      status: getStatusFromConfidence(detectConfidence(source.tier, pubDate)),
      source_tier: source.tier,
      notes: `Fetched via Cheerio`,
    });
  });

  return items;
}
