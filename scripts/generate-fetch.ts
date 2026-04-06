import { mkdir, readFile, writeFile, access, constants as fsConstants } from "node:fs/promises";
import path from "node:path";
import { aiIndustryTitles } from "../titles/ai-industry.js";
import { buildFetchResultFromSourceLog, normalizeFetchResult } from "../src/lib/fetch.js";
import { getIntelOutputDirPath, getIntelOutputPath, getPromptPath, getRepoRoot, getReportDate } from "../src/lib/workflow-paths.js";
import type { AiIndustryFetchResult } from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadFallbackFetchResult(reportDate: string): Promise<AiIndustryFetchResult> {
  const candidates = [
    getPromptPath(repoRoot, "ai-industry", "collect-output-example-latest.json"),
    getPromptPath(repoRoot, "ai-industry", "collect-output-example.json"),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, "utf8");
      const parsed = JSON.parse(content) as AiIndustryFetchResult;
      return normalizeFetchResult({
        ...parsed,
        report_date: reportDate,
      });
    } catch {
      continue;
    }
  }

  throw new Error("未找到可用的抓取示例 JSON。");
}

/**
 * 按优先级查找可用的 source log
 * 1. source-logs/latest.md (软链接，指向今天)
 * 2. source-logs/YYYY-MM-DD.md (今天的日期)
 * 3. first-run-source-log.md (旧版兼容)
 */
async function findSourceLog(reportDate: string): Promise<{ path: string; source: string } | null> {
  // 尝试 latest.md
  const latestPath = getPromptPath(repoRoot, "ai-industry", "source-logs", "latest.md");
  if (await fileExists(latestPath)) {
    return { path: latestPath, source: "source-logs/latest.md" };
  }
  
  // 尝试今天的日期文件
  const datedPath = getPromptPath(repoRoot, "ai-industry", "source-logs", `${reportDate}.md`);
  if (await fileExists(datedPath)) {
    return { path: datedPath, source: `source-logs/${reportDate}.md` };
  }
  
  // 回退到旧版 source log
  const legacyPath = getPromptPath(repoRoot, "ai-industry", "first-run-source-log.md");
  if (await fileExists(legacyPath)) {
    return { path: legacyPath, source: "first-run-source-log.md (legacy)" };
  }
  
  return null;
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "fetch",
  });
  const outputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "fetch",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "json",
  });

  // 查找可用的 source log
  const sourceLogInfo = await findSourceLog(reportDate);
  
  if (!sourceLogInfo) {
    console.log("⚠️ 未找到 source log，使用 fallback 数据");
    const fallbackResult = await loadFallbackFetchResult(reportDate);
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(fallbackResult, null, 2)}\n`, "utf8");
    console.log(`已生成抓取结果 JSON：${outputPath}`);
    console.log(`来源：fallback 示例 JSON`);
    console.log(`分组数量：${fallbackResult.groups.length}`);
    return;
  }

  const sourceLog = await readFile(sourceLogInfo.path, "utf8");
  const fromLog = buildFetchResultFromSourceLog({
    markdown: sourceLog,
    reportDate,
    reportTitle: aiIndustryTitles.reportTitle,
    timeWindowHours: aiIndustryTitles.timeWindowHours,
  });

  const fetchResult = fromLog.groups.length > 0 ? fromLog : await loadFallbackFetchResult(reportDate);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(fetchResult, null, 2)}\n`, "utf8");

  console.log(`已生成抓取结果 JSON：${outputPath}`);
  console.log(`来源：${path.relative(repoRoot, sourceLogInfo.path)} (${sourceLogInfo.source})`);
  console.log(`分组数量：${fetchResult.groups.length}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
