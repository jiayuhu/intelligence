#!/usr/bin/env tsx
/**
 * AI行业情报 - 统一抓取脚本（重构版）
 * 
 * 工作流程：
 * 1. 选择器健康检查
 * 2. 按策略优先级抓取（RSS → Cheerio → Playwright）
 * 3. 全局去重
 * 4. 输出标准 JSON
 */

import { mkdir, writeFile } from "node:fs/promises";
import { aiIndustryTitles } from "../titles/ai-industry.js";
import { ALL_SOURCES, type SourceConfig } from "../sources/ai-industry-sources.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";
import {
  fetchWithStrategy,
  browserManager,
  FETCH_CONFIG,
  checkAllSelectorsHealth,
  printHealthSummary,
} from "../src/lib/fetch/index.js";
import { IntelligenceDeduplicator } from "../src/lib/intelligence-engine/deduplicator.js";
import type {
  AiIndustryFetchItem,
  AiIndustryFetchResult,
  FetchStrategy,
} from "../src/lib/fetch/index.js";

const repoRoot = getRepoRoot(import.meta.url);

interface SourceStatus {
  id: string;
  name: string;
  success: boolean;
  primaryStrategy: FetchStrategy;
  usedStrategy?: FetchStrategy;
  itemCount: number;
  attempts: Array<{ strategy: FetchStrategy; success: boolean; error?: string }>;
  duration: number;
}

interface SourceFetchResult {
  items: AiIndustryFetchItem[];
  strategy: FetchStrategy;
  success: boolean;
  attempts: Array<{ strategy: FetchStrategy; success: boolean; error?: string }>;
}

/**
 * 抓取单个源（带自动降级）
 */
async function fetchSource(source: SourceConfig): Promise<SourceFetchResult> {
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
      console.log(`     ⚠️ ${strategy} 失败: ${msg.substring(0, 80)}`);
      continue;
    }
  }

  return { items: [], strategy: source.primaryStrategy, success: false, attempts };
}

/**
 * 全局去重
 */
function deduplicate(items: AiIndustryFetchItem[]): {
  unique: AiIndustryFetchItem[];
  duplicates: Array<{ item: AiIndustryFetchItem; result: { reason: string } }>;
} {
  const deduplicator = new IntelligenceDeduplicator({
    similarityThreshold: FETCH_CONFIG.DEDUPLICATION.SIMILARITY_THRESHOLD,
    titleSimilarityWeight: FETCH_CONFIG.DEDUPLICATION.TITLE_WEIGHT,
    contentSimilarityWeight: FETCH_CONFIG.DEDUPLICATION.CONTENT_WEIGHT,
    timeWindowHours: FETCH_CONFIG.TIME_WINDOW_HOURS,
  });

  const result = deduplicator.deduplicateBatch(items);
  return {
    unique: result.unique,
    duplicates: result.duplicates.map((d) => ({ item: d.item, result: { reason: d.result.reason } })),
  };
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const reportDate = getReportDate();
  console.log(`\n🚀 AI行业情报统一抓取 (${reportDate})`);
  console.log(`   策略: RSS → Cheerio → Playwright（资源优化顺序）\n`);

  // 选择器健康检查
  const healthReports = checkAllSelectorsHealth(ALL_SOURCES);
  printHealthSummary(healthReports);
  console.log();

  console.log(`📊 源统计:`);
  console.log(`   Tier 1: ${ALL_SOURCES.filter((s) => s.tier === "tier1").length}`);
  console.log(`   Tier 2: ${ALL_SOURCES.filter((s) => s.tier === "tier2").length}`);
  console.log(`   Tier 3: ${ALL_SOURCES.filter((s) => s.tier === "tier3").length}`);
  console.log();

  console.log(`🎭 Chromium 准备就绪（按需启动）\n`);

  const allItems: AiIndustryFetchItem[] = [];
  const sourceStatuses: SourceStatus[] = [];

  try {
    for (const source of ALL_SOURCES) {
      const startTime = Date.now();
      console.log(`  📡 ${source.name} ...`);

      const { items, strategy, success, attempts } = await fetchSource(source);
      const duration = Date.now() - startTime;

      const status: SourceStatus = {
        id: source.id,
        name: source.name,
        success,
        primaryStrategy: source.primaryStrategy,
        usedStrategy: success ? strategy : undefined,
        itemCount: items.length,
        attempts,
        duration,
      };
      sourceStatuses.push(status);

      if (success) {
        console.log(`     ✓ ${strategy} | ${items.length} 条 (${duration}ms)`);
        allItems.push(...items);
      } else {
        const failedAttempts = attempts.filter((a) => !a.success);
        const lastError = failedAttempts[failedAttempts.length - 1]?.error;
        console.log(`     ✗ 失败: ${lastError?.substring(0, 60) || "未知错误"}`);
      }

      // 延迟避免被封
      await new Promise((r) => setTimeout(r, FETCH_CONFIG.DELAY.BETWEEN_SOURCES));
    }
  } finally {
    // 确保浏览器正确关闭
    if (browserManager.isOpen()) {
      console.log(`\n🎭 关闭浏览器...`);
      await browserManager.closeBrowser();
    }
  }

  // 输出详细统计
  const successCount = sourceStatuses.filter((s) => s.success).length;
  const strategyCount: Record<string, number> = {};
  sourceStatuses.forEach((s) => {
    if (s.usedStrategy) {
      strategyCount[s.usedStrategy] = (strategyCount[s.usedStrategy] || 0) + 1;
    }
  });

  console.log(`\n📊 抓取统计:`);
  console.log(`   成功: ${successCount}/${ALL_SOURCES.length}`);
  console.log(`   失败: ${ALL_SOURCES.length - successCount}/${ALL_SOURCES.length}`);
  console.log(`   策略分布:`, strategyCount);

  // 输出失败的源详情
  const failedSources = sourceStatuses.filter((s) => !s.success);
  if (failedSources.length > 0) {
    console.log(`\n⚠️ 失败的源详情:`);
    for (const s of failedSources) {
      console.log(`   - ${s.name}:`);
      for (const attempt of s.attempts) {
        console.log(
          `     ${attempt.success ? "✓" : "✗"} ${attempt.strategy}${
            attempt.error ? `: ${attempt.error.substring(0, 50)}` : ""
          }`
        );
      }
    }
  }

  console.log(`\n📈 去重...`);
  const { unique: uniqueItems, duplicates } = deduplicate(allItems);
  console.log(`   ${allItems.length} → ${uniqueItems.length} 条 (移除 ${duplicates.length} 条重复)`);

  // 输出重复信息
  if (duplicates.length > 0) {
    for (const dup of duplicates.slice(0, 3)) {
      console.log(`     🔍 "${dup.item.title.substring(0, 40)}..." - ${dup.result.reason}`);
    }
    if (duplicates.length > 3) {
      console.log(`     ... 还有 ${duplicates.length - 3} 条重复`);
    }
  }

  // 分组
  const groups = new Map<string, AiIndustryFetchItem[]>();
  for (const item of uniqueItems) {
    const cat = item.classification;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }

  const result: AiIndustryFetchResult = {
    report_title: aiIndustryTitles.reportTitle,
    report_date: reportDate,
    time_window_hours: FETCH_CONFIG.TIME_WINDOW_HOURS,
    generated_at: new Date().toISOString(),
    groups: Array.from(groups.entries()).map(([category, items]) => ({
      category,
      summary: `${category}: ${items.length} 条`,
      items,
    })),
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
  console.log(`   ${uniqueItems.length} 条情报, ${groups.size} 个分类`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
