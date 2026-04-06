/**
 * Playwright 动态抓取策略
 */

import { chromium, type Browser, type Page } from "playwright";
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

/**
 * 浏览器管理器 - 确保正确关闭
 */
class BrowserManager {
  private browser: Browser | null = null;
  private isClosing = false;

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser && !this.isClosing) {
      this.isClosing = true;
      await this.browser.close();
      this.browser = null;
      this.isClosing = false;
    }
  }

  isOpen(): boolean {
    return this.browser !== null;
  }
}

export const browserManager = new BrowserManager();

export async function fetchWithPlaywright(source: SourceConfig): Promise<AiIndustryFetchItem[]> {
  if (!source.selectors) {
    throw new Error("Playwright requires selectors");
  }

  const items: AiIndustryFetchItem[] = [];
  const page = await (await browserManager.getBrowser()).newPage({
    viewport: {
      width: FETCH_CONFIG.VIEWPORT.WIDTH,
      height: FETCH_CONFIG.VIEWPORT.HEIGHT,
    },
  });

  try {
    await page.goto(source.siteUrl, {
      waitUntil: "networkidle",
      timeout: FETCH_CONFIG.TIMEOUT.PLAYWRIGHT.PAGE_GOTO,
    });
    await page.waitForSelector(source.selectors.container, {
      timeout: FETCH_CONFIG.TIMEOUT.PLAYWRIGHT.WAIT_SELECTOR,
    });

    const articles = await page.evaluate((sel) => {
      const results: Array<{
        title: string;
        link: string;
        date: string;
        summary: string;
      }> = [];

      document.querySelectorAll(sel.container).forEach((el) => {
        const title = el.querySelector(sel.title)?.textContent?.trim();
        let link = el.querySelector(sel.link)?.getAttribute("href");
        const date =
          el.querySelector(sel.date || "time")?.textContent?.trim() ||
          el.querySelector(sel.date || "time")?.getAttribute("datetime");
        const summary = sel.summary
          ? el.querySelector(sel.summary)?.textContent?.trim()
          : "";

        if (title && link) {
          // 处理相对链接
          if (!link.startsWith("http")) {
            const base = new URL(window.location.href);
            link = link.startsWith("/")
              ? `${base.protocol}//${base.host}${link}`
              : `${base.href}/${link}`;
          }
          results.push({ title, link, date: date || "", summary: summary || "" });
        }
      });

      return results;
    }, source.selectors);

    for (const a of articles) {
      const pubDate = parseDate(a.date);
      if (!pubDate || !isWithinTimeWindow(pubDate)) continue;

      const classification = autoClassify(a.title, a.summary);
      items.push({
        title: a.title,
        published_at: pubDate.toISOString(),
        source_name: source.name,
        source_url: a.link,
        subject: source.name.split(" ")[0],
        classification,
        event_summary: truncate(a.summary || a.title, FETCH_CONFIG.TRUNCATE.EVENT_SUMMARY),
        why_it_matters: truncate(a.summary || a.title, FETCH_CONFIG.TRUNCATE.WHY_IT_MATTERS),
        confidence: detectConfidence(source.tier, pubDate),
        related_focus: [classification],
        within_48h: true,
        status: getStatusFromConfidence(detectConfidence(source.tier, pubDate)),
        source_tier: source.tier,
        notes: `Fetched via Playwright`,
      });
    }
  } finally {
    await page.close();
  }

  return items;
}
