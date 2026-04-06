#!/usr/bin/env tsx
/**
 * AI行业情报 - Playwright 动态网页抓取脚本
 * 
 * 适用场景：
 * 1. 网站有强反爬虫保护（Cloudflare, DataDome 等）
 * 2. 内容是 JavaScript 动态渲染的
 * 3. 需要模拟真实用户行为（滚动、点击等）
 * 4. Cheerio 无法获取内容时
 * 
 * 优势：
 * - 真实 Chromium 浏览器，更难被检测
 * - 自动等待元素出现
 * - 支持 JavaScript 执行
 * - 支持截图调试
 * 
 * 劣势：
 * - 资源消耗更大（内存、CPU）
 * - 速度较慢（需要等待页面加载）
 * - 需要安装浏览器二进制文件
 */

import { chromium, type Page, type Browser } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { aiIndustryTitles } from "../titles/ai-industry.js";
import {
  ALL_ENABLED_HTML_SOURCES,
  type HtmlSource,
} from "../sources/ai-industry-html.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";
import type {
  AiIndustryFetchItem,
  AiIndustryFetchResult,
  AiIndustryClassification,
  AiIndustryConfidence,
  AiIndustryItemStatus,
} from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

/**
 * 计算时间窗口（48小时）
 */
function getTimeWindow(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - 48 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * 是否在 48 小时内
 */
function isWithin48Hours(date: Date): boolean {
  const { start } = getTimeWindow();
  return date >= start;
}

/**
 * 解析日期
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // 相对时间
  const relativeMatch = dateStr.match(/(\d+)\s+(minute|hour|day|week)s?\s+ago/i);
  if (relativeMatch) {
    const num = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const now = new Date();
    
    switch (unit) {
      case "minute": return new Date(now.getTime() - num * 60 * 1000);
      case "hour": return new Date(now.getTime() - num * 60 * 60 * 1000);
      case "day": return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case "week": return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
    }
  }
  
  return null;
}

/**
 * 基于关键词自动分类
 */
function autoClassify(title: string, content?: string): AiIndustryClassification {
  const text = `${title} ${content || ""}`.toLowerCase();
  
  if (/\bagent\b|autonomous|openclaw|devin|multi-agent|task execution|langchain|llamaindex/.test(text)) {
    return "AI Agent";
  }
  if (/\bcopilot\b|\bcursor\b|claude code|coding|ide|github|codex|code generation/.test(text)) {
    return "AI Coding";
  }
  if (/\bsam altman\b|\bdario amodei\b|\bsundar pichai\b|ceo|founder|interview/.test(text)) {
    return "模型与基础设施";
  }
  if (/\bmodel\b|gpt|claude|gemini|benchmark|inference|llm|api|infrastructure/.test(text)) {
    return "模型与基础设施";
  }
  if (/\bopen source\b|github|huggingface|llama|mistral|release/.test(text)) {
    return "模型与基础设施";
  }
  if (/\bregulation\b|policy|compliance|safety|ai act|government/.test(text)) {
    return "政策与监管";
  }
  
  return "模型与基础设施";
}

/**
 * 检测可信度
 */
function detectConfidence(sourceTier: string, date: Date | null): AiIndustryConfidence {
  if (!date) return "low";
  if (sourceTier === "tier1" && isWithin48Hours(date)) return "high";
  if (sourceTier === "tier2" && isWithin48Hours(date)) return "medium";
  return "low";
}

/**
 * 截断文本
 */
function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * 计算相似度
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, "").trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 去重
 */
function deduplicate(items: AiIndustryFetchItem[]): AiIndustryFetchItem[] {
  const SIMILARITY_THRESHOLD = 0.75;
  const uniqueItems: AiIndustryFetchItem[] = [];
  const seenUrls = new Set<string>();
  
  const urlUniqueItems = items.filter(item => {
    if (seenUrls.has(item.source_url)) return false;
    seenUrls.add(item.source_url);
    return true;
  });
  
  for (const item of urlUniqueItems) {
    let isDuplicate = false;
    for (const existing of uniqueItems) {
      if (calculateSimilarity(item.title, existing.title) >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) uniqueItems.push(item);
  }
  
  return uniqueItems;
}

/**
 * 使用 Playwright 抓取单个源
 */
async function fetchWithPlaywright(
  browser: Browser,
  source: HtmlSource
): Promise<AiIndustryFetchItem[]> {
  const items: AiIndustryFetchItem[] = [];
  let page: Page | null = null;
  
  try {
    console.log(`  🎭 ${source.name} ...`);
    
    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    
    // 设置额外请求头
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    });
    
    // 访问页面，等待网络空闲
    await page.goto(source.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    // 等待内容加载
    await page.waitForSelector(source.selectors.container, { timeout: 10000 });
    
    // 提取数据
    const articles = await page.evaluate((selectors) => {
      const results: Array<{
        title: string;
        link: string;
        date: string;
        summary: string;
      }> = [];
      
      const containers = document.querySelectorAll(selectors.container);
      
      containers.forEach((el) => {
        try {
          const titleEl = el.querySelector(selectors.title);
          const linkEl = el.querySelector(selectors.link);
          const dateEl = selectors.date ? el.querySelector(selectors.date) : null;
          const summaryEl = selectors.summary ? el.querySelector(selectors.summary) : null;
          
          const title = titleEl?.textContent?.trim() || "";
          let link = linkEl?.getAttribute("href") || "";
          const date = dateEl?.textContent?.trim() || 
                      dateEl?.getAttribute("datetime") || "";
          const summary = summaryEl?.textContent?.trim() || "";
          
          if (title && link) {
            results.push({ title, link, date, summary });
          }
        } catch {
          // 忽略单个条目错误
        }
      });
      
      return results;
    }, source.selectors);
    
    // 处理提取的数据
    for (const article of articles) {
      const pubDate = parseDate(article.date);
      
      // 只保留 48 小时内的
      if (!pubDate || !isWithin48Hours(pubDate)) {
        continue;
      }
      
      // 处理相对链接
      let link = article.link;
      if (link && !link.startsWith("http")) {
        const baseUrl = new URL(source.url);
        link = link.startsWith("/") 
          ? `${baseUrl.protocol}//${baseUrl.host}${link}`
          : `${source.url}/${link}`;
      }
      
      const classification = autoClassify(article.title, article.summary);
      const confidence = detectConfidence(source.tier, pubDate);
      
      items.push({
        title: article.title,
        published_at: pubDate.toISOString(),
        source_name: source.name,
        source_url: link,
        subject: source.name.split(" ")[0],
        classification,
        event_summary: truncate(article.summary, 300) || article.title,
        why_it_matters: truncate(article.summary, 200) || article.title,
        confidence,
        related_focus: [classification],
        within_48h: true,
        status: confidence === "high" ? "confirmed" : "tentative",
        source_tier: source.tier,
        notes: `Fetched via Playwright: ${source.id}`,
      });
    }
    
    console.log(`     ✓ 获取 ${items.length} 条`);
  } catch (error) {
    console.log(`     ✗ 失败: ${error instanceof Error ? error.message : String(error)}`);
    
    // 截图调试（可选）
    if (page) {
      const screenshotPath = `debug-${source.id}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`     📸 已保存调试截图: ${screenshotPath}`);
    }
  } finally {
    if (page) await page.close();
  }
  
  return items;
}

/**
 * 按分类分组
 */
function groupByCategory(items: AiIndustryFetchItem[]): AiIndustryFetchResult["groups"] {
  const groups = new Map<string, AiIndustryFetchItem[]>();
  
  for (const item of items) {
    const cat = item.classification || "其他";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }
  
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    summary: `${category}领域本期有 ${items.length} 条新动态`,
    items,
  }));
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const reportDate = getReportDate();
  console.log(`\n🚀 AI行业情报 Playwright 抓取 (${reportDate})`);
  console.log(`   时间窗口: 过去 48 小时\n`);
  
  // 只抓取那些 Cheerio 失败的源
  const TARGET_SOURCES = [
    "anthropic-news",
    "the-verge-ai", 
    "wired-ai",
    "cursor-changelog",
  ];
  
  const sourcesToFetch = ALL_ENABLED_HTML_SOURCES.filter(s => 
    TARGET_SOURCES.includes(s.id)
  );
  
  console.log(`📊 目标源: ${sourcesToFetch.length} 个`);
  console.log(`   ${sourcesToFetch.map(s => s.name).join(", ")}\n`);
  
  console.log(`🎭 启动 Chromium...`);
  const browser = await chromium.launch({
    headless: true, // 无头模式
  });
  console.log(`   ✓ 浏览器已启动\n`);
  
  try {
    const allItems: AiIndustryFetchItem[] = [];
    
    // 串行抓取（避免并发过高）
    for (const source of sourcesToFetch) {
      const items = await fetchWithPlaywright(browser, source);
      allItems.push(...items);
      
      // 延迟
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`\n📈 去重...`);
    const uniqueItems = deduplicate(allItems);
    console.log(`   去重前: ${allItems.length}, 去重后: ${uniqueItems.length}`);
    
    const groups = groupByCategory(uniqueItems);
    console.log(`\n📁 分类:`);
    groups.forEach(g => console.log(`   ${g.category}: ${g.items.length}`));
    
    // 保存
    const result: AiIndustryFetchResult = {
      report_title: aiIndustryTitles.reportTitle,
      report_date: reportDate,
      time_window_hours: 48,
      generated_at: new Date().toISOString(),
      groups,
    };
    
    const outputDir = getIntelOutputDirPath({ repoRoot, outputDirName: "fetch" });
    const outputPath = getIntelOutputPath({
      repoRoot,
      outputDirName: "fetch",
      categoryKey: aiIndustryTitles.fileBaseName,
      reportDate,
      extension: "json",
    });
    
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, JSON.stringify(result, null, 2), "utf8");
    
    console.log(`\n✅ 已保存: ${outputPath}`);
    console.log(`   总计: ${uniqueItems.length} 条`);
  } finally {
    await browser.close();
    console.log(`\n🎭 浏览器已关闭`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
