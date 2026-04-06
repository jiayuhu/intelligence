#!/usr/bin/env tsx
/**
 * AI行业情报 - RSS 源自动抓取脚本
 * 
 * 工作流程：
 * 1. 读取 sources/ai-industry-feeds.ts 中的 RSS 源列表
 * 2. 并发抓取所有启用的 RSS 源
 * 3. 过滤 48 小时内的新内容
 * 4. 去重（基于 URL）
 * 5. 自动分类（基于关键词规则）
 * 6. 输出标准 fetch JSON 格式
 */

import Parser from "rss-parser";
import { mkdir, writeFile } from "node:fs/promises";
import { aiIndustryTitles } from "../titles/ai-industry.js";
import {
  ALL_ENABLED_FEEDS,
  type FeedSource,
} from "../sources/ai-industry-feeds.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";
import type { AiIndustryFetchItem, AiIndustryFetchResult, AiIndustryClassification, AiIndustryConfidence, AiIndustryItemStatus } from "../src/types/ai-industry.js";

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "AI-Intel-Bot/1.0 (Research Purpose)",
  },
});

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
 * 解析 RSS 日期
 */
function parseRssDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 是否在 48 小时内
 */
function isWithin48Hours(date: Date): boolean {
  const { start } = getTimeWindow();
  return date >= start;
}

/**
 * 基于关键词自动分类
 */
function autoClassify(title: string, content?: string): AiIndustryClassification {
  const text = `${title} ${content || ""}`.toLowerCase();
  
  // AI Agent 关键词
  if (/\bagent\b|autonomous|openclaw|devin|multi-agent|task execution|langchain|llamaindex/.test(text)) {
    return "AI Agent";
  }
  
  // AI Coding 关键词
  if (/\bcopilot\b|\bcursor\b|claude code|coding|ide|github|codex|code generation/.test(text)) {
    return "AI Coding";
  }
  
  // 领袖人物关键词
  if (/\bsam altman\b|\bdario amodei\b|\bsundar pichai\b|ceo|founder|interview/.test(text)) {
    return "模型与基础设施";
  }
  
  // 模型与基础设施关键词
  if (/\bmodel\b|gpt|claude|gemini|benchmark|inference|llm|api|infrastructure/.test(text)) {
    return "模型与基础设施";
  }
  
  // 开源模型关键词（并入模型与基础设施）
  if (/\bopen source\b|github|huggingface|llama|mistral|release/.test(text)) {
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
function detectConfidence(sourceTier: string, date: Date | null): AiIndustryConfidence {
  if (!date) return "low";
  
  // Tier 1 来源且 48 小时内 = high
  if (sourceTier === "tier1" && isWithin48Hours(date)) {
    return "high";
  }
  
  // Tier 2 来源且 48 小时内 = medium
  if (sourceTier === "tier2" && isWithin48Hours(date)) {
    return "medium";
  }
  
  return "low";
}

/**
 * 清理 HTML 标签
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 截断摘要到指定长度
 */
function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * 抓取单个 RSS 源
 */
async function fetchFeed(feed: FeedSource): Promise<AiIndustryFetchItem[]> {
  const items: AiIndustryFetchItem[] = [];
  
  try {
    console.log(`  📡 ${feed.name} ...`);
    const feedResult = await rssParser.parseURL(feed.feedUrl);
    
    for (const item of feedResult.items || []) {
      const pubDate = parseRssDate(item.pubDate || item.isoDate || "");
      
      // 只保留 48 小时内的内容
      if (!pubDate || !isWithin48Hours(pubDate)) {
        continue;
      }
      
      const title = item.title || "无标题";
      const content = stripHtml(item.content || item["content:encoded"] || item.summary || "");
      const classification = autoClassify(title, content);
      const confidence: AiIndustryConfidence = detectConfidence(feed.tier, pubDate);
      const status: AiIndustryItemStatus = confidence === "high" ? "confirmed" : "tentative";
      
      items.push({
        title,
        published_at: pubDate.toISOString(),
        source_name: feed.name,
        source_url: item.link || feed.siteUrl,
        subject: feed.name.split(" ")[0], // 简单提取
        classification: classification as AiIndustryClassification,
        event_summary: truncate(content, 300),
        why_it_matters: truncate(content, 200),
        confidence,
        related_focus: [classification],
        within_48h: true,
        status,
        source_tier: feed.tier,
        notes: `Auto-fetched from RSS: ${feed.id}`,
      });
    }
    
    console.log(`     ✓ 获取 ${items.length} 条`);
  } catch (error) {
    console.log(`     ✗ 失败: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return items;
}

/**
 * 计算两个字符串的相似度（余弦相似度简化版）
 * 返回 0-1 之间的值，1 表示完全相同
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, "").trim();
  
  // 完全匹配
  if (s1 === s2) return 1;
  
  // 包含关系
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // 分词并计算 Jaccard 相似度
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 去重（基于 URL + 标题相似度）
 * 相似度阈值：0.75（可调整）
 */
function deduplicate(items: AiIndustryFetchItem[]): AiIndustryFetchItem[] {
  const SIMILARITY_THRESHOLD = 0.75;
  const uniqueItems: AiIndustryFetchItem[] = [];
  const seenUrls = new Set<string>();
  
  // 先按 URL 去重
  const urlUniqueItems = items.filter(item => {
    const url = item.source_url;
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
  
  // 再按标题相似度去重
  for (const item of urlUniqueItems) {
    const title = item.title || "";
    let isDuplicate = false;
    
    for (const existing of uniqueItems) {
      const similarity = calculateSimilarity(title, existing.title || "");
      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        console.log(`     🔍 相似度 ${(similarity * 100).toFixed(0)}%: "${truncate(title, 40)}" ≈ "${truncate(existing.title || "", 40)}"`);
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
  console.log(`\n🚀 AI行业情报 RSS 自动抓取 (${reportDate})`);
  console.log(`   时间窗口: 过去 48 小时\n`);
  
  // 统计
  console.log(`📊 源统计:`);
  console.log(`   Tier 1 (官方): ${ALL_ENABLED_FEEDS.filter(f => f.tier === "tier1").length}`);
  console.log(`   Tier 2 (媒体): ${ALL_ENABLED_FEEDS.filter(f => f.tier === "tier2").length}`);
  console.log(`   Tier 3 (社区): ${ALL_ENABLED_FEEDS.filter(f => f.tier === "tier3").length}`);
  console.log();
  
  // 并发抓取所有源
  console.log(`📡 开始抓取 RSS 源...\n`);
  const allItems: AiIndustryFetchItem[] = [];
  
  // 分批抓取，避免并发过高
  const batchSize = 3;
  for (let i = 0; i < ALL_ENABLED_FEEDS.length; i += batchSize) {
    const batch = ALL_ENABLED_FEEDS.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchFeed));
    allItems.push(...results.flat());
  }
  
  // 去重
  console.log(`\n📈 开始去重...`);
  const uniqueItems = deduplicate(allItems);
  const removedCount = allItems.length - uniqueItems.length;
  console.log(`   去重前: ${allItems.length} 条, 去重后: ${uniqueItems.length} 条, 移除: ${removedCount} 条`);
  
  // 按分类分组
  const groups = groupByCategory(uniqueItems);
  console.log(`📁 分类统计:`);
  for (const g of groups) {
    console.log(`   ${g.category}: ${g.items.length} 条`);
  }
  
  // 构建结果
  const result: AiIndustryFetchResult = {
    report_title: aiIndustryTitles.reportTitle,
    report_date: reportDate,
    time_window_hours: 48,
    generated_at: new Date().toISOString(),
    groups,
  };
  
  // 输出文件
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
