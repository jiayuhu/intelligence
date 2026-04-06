#!/usr/bin/env tsx
/**
 * AI行业情报 - 完整抓取流程
 * 
 * 整合多个抓取源：
 * 1. RSS/Atom 源（fetch-feeds.ts）
 * 2. HTML 源（fetch-html.ts）
 * 3. 合并去重
 * 4. 统一输出
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { aiIndustryTitles } from "../titles/ai-industry.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";
import type { AiIndustryFetchItem, AiIndustryFetchResult } from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

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
 * 全局去重（跨所有来源）
 */
function globalDeduplicate(items: AiIndustryFetchItem[]): AiIndustryFetchItem[] {
  const SIMILARITY_THRESHOLD = 0.75;
  const uniqueItems: AiIndustryFetchItem[] = [];
  const seenUrls = new Set<string>();
  
  // URL 去重
  const urlUniqueItems = items.filter(item => {
    const url = item.source_url;
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
  
  // 标题相似度去重
  for (const item of urlUniqueItems) {
    const title = item.title || "";
    let isDuplicate = false;
    
    for (const existing of uniqueItems) {
      const similarity = calculateSimilarity(title, existing.title || "");
      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
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
  
  // 按分类分组
  for (const item of items) {
    const cat = item.classification || "其他";
    if (!groups.has(cat)) {
      groups.set(cat, []);
    }
    groups.get(cat)!.push(item);
  }
  
  // 排序：按发布时间倒序
  for (const [, groupItems] of groups) {
    groupItems.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }
  
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    summary: `${category}领域本期有 ${items.length} 条新动态`,
    items,
  }));
}

/**
 * 执行抓取脚本
 */
async function runFetcher(name: string, command: string): Promise<AiIndustryFetchItem[]> {
  console.log(`\n📡 执行 ${name}...`);
  
  try {
    const { execSync } = await import("child_process");
    execSync(command, { 
      cwd: repoRoot, 
      stdio: "pipe",
      encoding: "utf8",
      timeout: 120000,
    });
    
    // 读取生成的 JSON
    const reportDate = getReportDate();
    const outputPath = getIntelOutputPath({
      repoRoot,
      outputDirName: "fetch",
      categoryKey: aiIndustryTitles.fileBaseName,
      reportDate,
      extension: "json",
    });
    
    const content = await readFile(outputPath, "utf8");
    const result = JSON.parse(content) as AiIndustryFetchResult;
    
    return result.groups.flatMap(g => g.items);
  } catch (error) {
    console.log(`   ⚠️ ${name} 执行失败或没有数据`);
    return [];
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const reportDate = getReportDate();
  console.log(`\n🚀 AI行业情报完整抓取流程 (${reportDate})`);
  console.log(`   时间窗口: 过去 48 小时\n`);
  
  const allItems: AiIndustryFetchItem[] = [];
  
  // 1. RSS 抓取
  const rssItems = await runFetcher("RSS/Atom 源", "npm run fetch:feeds");
  console.log(`   ✓ RSS 抓取: ${rssItems.length} 条`);
  allItems.push(...rssItems);
  
  // 2. HTML 抓取
  const htmlItems = await runFetcher("HTML 源", "npm run fetch:html");
  console.log(`   ✓ HTML 抓取: ${htmlItems.length} 条`);
  allItems.push(...htmlItems);
  
  console.log(`\n📊 汇总:`);
  console.log(`   原始总量: ${allItems.length} 条`);
  
  // 3. 全局去重
  console.log(`\n🔍 全局去重...`);
  const uniqueItems = globalDeduplicate(allItems);
  const removedCount = allItems.length - uniqueItems.length;
  console.log(`   去重后: ${uniqueItems.length} 条, 移除重复: ${removedCount} 条`);
  
  // 4. 按分类分组
  const groups = groupByCategory(uniqueItems);
  console.log(`\n📁 分类统计:`);
  for (const g of groups) {
    console.log(`   ${g.category}: ${g.items.length} 条`);
  }
  
  // 5. 保存结果
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
  console.log(`   来源: RSS(${rssItems.length}) + HTML(${htmlItems.length}) - 重复(${removedCount})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
