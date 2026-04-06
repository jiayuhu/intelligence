#!/usr/bin/env tsx
/**
 * AI行业情报 - HTML 页面自动抓取脚本
 * 
 * 工作流程：
 * 1. 读取 sources/ai-industry-html.ts 中的 HTML 源列表
 * 2. 使用 cheerio 解析 HTML 提取文章
 * 3. 过滤 48 小时内的新内容
 * 4. 去重（URL + 标题相似度）
 * 5. 自动分类
 * 6. 输出标准 fetch JSON 格式
 */

import * as cheerio from "cheerio";
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
 * 请求头配置
 */
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

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
 * 解析日期字符串
 */
function parseDate(dateStr: string, format?: string): Date | null {
  if (!dateStr) return null;
  
  // 尝试直接解析
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // 尝试相对时间（如 "2 hours ago"）
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
 * 计算相似度（用于去重）
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
 * 去重（URL + 标题相似度）
 */
function deduplicate(items: AiIndustryFetchItem[]): AiIndustryFetchItem[] {
  const SIMILARITY_THRESHOLD = 0.75;
  const uniqueItems: AiIndustryFetchItem[] = [];
  const seenUrls = new Set<string>();
  
  const urlUniqueItems = items.filter(item => {
    const url = item.source_url;
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
  
  for (const item of urlUniqueItems) {
    const title = item.title || "";
    let isDuplicate = false;
    
    for (const existing of uniqueItems) {
      const similarity = calculateSimilarity(title, existing.title || "");
      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        console.log(`     🔍 相似度 ${(similarity * 100).toFixed(0)}%: "${truncate(title, 40)}"`);
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems;
}

/**
 * 抓取单个 HTML 源
 */
async function fetchHtmlSource(source: HtmlSource): Promise<AiIndustryFetchItem[]> {
  const items: AiIndustryFetchItem[] = [];
  
  try {
    console.log(`  🌐 ${source.name} ...`);
    
    const headers = { ...DEFAULT_HEADERS, ...source.headers };
    const response = await fetch(source.url, { headers });
    
    if (!response.ok) {
      console.log(`     ✗ HTTP ${response.status}`);
      return items;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $(source.selectors.container).each((_, element) => {
      try {
        const $el = $(element);
        
        // 提取标题
        const title = $el.find(source.selectors.title).first().text().trim();
        if (!title) return;
        
        // 提取链接
        let link = $el.find(source.selectors.link).first().attr("href") || "";
        // 处理相对链接
        if (link && !link.startsWith("http")) {
          const baseUrl = new URL(source.url);
          link = link.startsWith("/") 
            ? `${baseUrl.protocol}//${baseUrl.host}${link}`
            : `${source.url}/${link}`;
        }
        
        // 提取日期
        let pubDate: Date | null = null;
        if (source.selectors.date) {
          const dateText = $el.find(source.selectors.date).first().text().trim() ||
                          $el.find(source.selectors.date).first().attr("datetime") || "";
          pubDate = parseDate(dateText, source.dateFormat);
        }
        
        // 如果没有日期或不在 48 小时内，跳过
        if (!pubDate || !isWithin48Hours(pubDate)) {
          return;
        }
        
        // 提取摘要
        const summary = source.selectors.summary 
          ? $el.find(source.selectors.summary).first().text().trim()
          : "";
        
        const classification = autoClassify(title, summary);
        const confidence: AiIndustryConfidence = detectConfidence(source.tier, pubDate);
        const status: AiIndustryItemStatus = confidence === "high" ? "confirmed" : "tentative";
        
        items.push({
          title,
          published_at: pubDate.toISOString(),
          source_name: source.name,
          source_url: link,
          subject: source.name.split(" ")[0],
          classification,
          event_summary: truncate(summary, 300) || title,
          why_it_matters: truncate(summary, 200) || title,
          confidence,
          related_focus: [classification],
          within_48h: true,
          status,
          source_tier: source.tier,
          notes: `Auto-fetched from HTML: ${source.id}`,
        });
      } catch (err) {
        // 单个条目解析失败，继续
      }
    });
    
    console.log(`     ✓ 获取 ${items.length} 条`);
  } catch (error) {
    console.log(`     ✗ 失败: ${error instanceof Error ? error.message : String(error)}`);
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
    if (!groups.has(cat)) {
      groups.set(cat, []);
    }
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
  console.log(`\n🚀 AI行业情报 HTML 自动抓取 (${reportDate})`);
  console.log(`   时间窗口: 过去 48 小时\n`);
  
  console.log(`📊 源统计:`);
  console.log(`   Tier 1 (官方): ${ALL_ENABLED_HTML_SOURCES.filter(s => s.tier === "tier1").length}`);
  console.log(`   Tier 2 (媒体): ${ALL_ENABLED_HTML_SOURCES.filter(s => s.tier === "tier2").length}`);
  console.log(`   Tier 3 (社区): ${ALL_ENABLED_HTML_SOURCES.filter(s => s.tier === "tier3").length}`);
  console.log();
  
  console.log(`🌐 开始抓取 HTML 源...\n`);
  const allItems: AiIndustryFetchItem[] = [];
  
  // 分批抓取
  const batchSize = 3;
  for (let i = 0; i < ALL_ENABLED_HTML_SOURCES.length; i += batchSize) {
    const batch = ALL_ENABLED_HTML_SOURCES.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchHtmlSource));
    allItems.push(...results.flat());
    
    // 延迟避免被封
    if (i + batchSize < ALL_ENABLED_HTML_SOURCES.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n📈 开始去重...`);
  const uniqueItems = deduplicate(allItems);
  const removedCount = allItems.length - uniqueItems.length;
  console.log(`   去重前: ${allItems.length} 条, 去重后: ${uniqueItems.length} 条, 移除: ${removedCount} 条`);
  
  const groups = groupByCategory(uniqueItems);
  console.log(`📁 分类统计:`);
  for (const g of groups) {
    console.log(`   ${g.category}: ${g.items.length} 条`);
  }
  
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
  console.log(`   总计: ${uniqueItems.length} 条情报, ${groups.length} 个分类`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
