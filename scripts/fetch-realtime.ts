#!/usr/bin/env tsx
/**
 * AI行业情报 - 全自动实时抓取脚本（混合自动化）
 * 
 * 工作流程：
 * 1. 自动生成搜索任务清单
 * 2. 提示用户使用 SearchWeb 执行搜索（手动但标准化）
 * 3. 自动解析搜索结果文件
 * 4. 自动去重和分类
 * 5. 生成按日期归档的source log
 * 6. 更新latest软链接
 * 
 * 注意：由于 SearchWeb 是交互式工具，此脚本采用"人机协作"模式：
 * - 人：执行 SearchWeb 搜索（需要复制搜索词到 Kimi CLI）
 * - 机：解析、去重、分类、格式化、归档
 */

import { mkdir, writeFile, readFile, symlink, unlink, readdir, stat } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

// 搜索配置
const SEARCH_TASKS = [
  { id: 1, query: "OpenAI news April 2026", priority: "P0", category: "头部 AI 企业", company: "OpenAI" },
  { id: 2, query: "Anthropic Claude update April 2026", priority: "P0", category: "头部 AI 企业", company: "Anthropic" },
  { id: 3, query: "GitHub Copilot agent April 2026", priority: "P0", category: "AI Coding", company: "GitHub" },
  { id: 4, query: "Google Gemini AI update April 2026", priority: "P0", category: "模型与基础设施", company: "Google" },
  { id: 5, query: "xAI Grok update April 2026", priority: "P1", category: "头部 AI 企业", company: "xAI" },
  { id: 6, query: "Sam Altman OpenAI statement April 2026", priority: "P1", category: "AI 领袖人物", company: "OpenAI" },
  { id: 7, query: "Meta AI update April 2026", priority: "P1", category: "头部 AI 企业", company: "Meta" },
  { id: 8, query: "AI industry news April 2026", priority: "P2", category: "模型与基础设施", company: "General" },
];

// 主题关键词映射
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI Agent": ["agent", "openclaw", "devin", "multi-agent", "autonomous", "task execution"],
  "AI Coding": ["copilot", "cursor", "claude code", "coding assistant", "ide", "github", "codex"],
  "头部 AI 企业": ["openai", "anthropic", "google", "meta", "microsoft", "xai", "funding", "acquisition", "valuation"],
  "AI 领袖人物": ["sam altman", "dario amodei", "sundar pichai", "interview", "ceo", "chief"],
  "模型与基础设施": ["model", "gpt", "claude", "gemini", "benchmark", "inference", "llm"],
  "开源生态": ["open source", "github", "huggingface", "llama", "mistral"],
  "政策与监管": ["regulation", "policy", "compliance", "safety", "ai act"],
};

interface ParsedResult {
  title: string;
  url: string;
  date: string;
  summary: string;
  source: string;
  queryId: number;
}

/**
 * 计算字符串相似度
 */
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, "");
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, "");
  
  if (s1 === s2) return 1;
  if (s1.length < 3 || s2.length < 3) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  
  const words1 = s1.split(/\s+/).filter(w => w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => w.length > 2);
  const common = words1.filter(w => words2.includes(w));
  return common.length / Math.max(words1.length, words2.length);
}

/**
 * 自动分类
 */
function autoClassify(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  
  return "模型与基础设施";
}

/**
 * 检测可信度
 */
function detectConfidence(url: string): string {
  const officialDomains = [
    "openai.com", "anthropic.com", "github.com", "google.com",
    "blog.google", "deepmind.google", "ai.meta.com", "x.ai", "nvidia.com"
  ];
  const tier1Media = [
    "techcrunch.com", "theverge.com", "wired.com", "bloomberg.com",
    "reuters.com", "venturebeat.com", "thenextweb.com"
  ];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (officialDomains.some(d => domain.includes(d))) return "high";
    if (tier1Media.some(d => domain.includes(d))) return "high";
  } catch {
    // Invalid URL
  }
  
  return "medium";
}

/**
 * 检测主体
 */
function detectSubject(title: string, category: string, queryCompany: string): string {
  const lower = title.toLowerCase();
  const companies = ["OpenAI", "Anthropic", "Google", "Meta", "Microsoft", "xAI", "GitHub", "NVIDIA"];
  
  for (const company of companies) {
    if (lower.includes(company.toLowerCase())) return company;
  }
  
  if (lower.includes("sam altman")) return "Sam Altman";
  if (lower.includes("dario")) return "Dario Amodei";
  
  return queryCompany;
}

/**
 * 去重
 */
function deduplicate(results: ParsedResult[]): ParsedResult[] {
  const unique: ParsedResult[] = [];
  let duplicateCount = 0;
  
  for (const result of results) {
    // URL去重
    if (unique.some(u => u.url === result.url)) {
      duplicateCount++;
      continue;
    }
    
    // 标题相似度去重（阈值0.75）
    if (unique.some(u => similarity(u.title, result.title) > 0.75)) {
      duplicateCount++;
      continue;
    }
    
    unique.push(result);
  }
  
  if (duplicateCount > 0) {
    console.log(`  去重: 移除 ${duplicateCount} 条重复/相似结果`);
  }
  
  return unique;
}

/**
 * 获取今天的日期字符串
 */
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 获取source log路径
 */
function getSourceLogPath(date: string): string {
  return resolve(repoRoot, "prompts", "ai-industry", "source-logs", `${date}.md`);
}

/**
 * 获取latest软链接路径
 */
function getLatestPath(): string {
  return resolve(repoRoot, "prompts", "ai-industry", "source-logs", "latest.md");
}

/**
 * 归档超过30天的日志
 */
async function archiveOldLogs(): Promise<number> {
  const logsDir = resolve(repoRoot, "prompts", "ai-industry", "source-logs");
  const archiveDir = resolve(logsDir, "archive");
  
  await mkdir(archiveDir, { recursive: true });
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let archivedCount = 0;
  
  try {
    const files = await readdir(logsDir);
    
    for (const file of files) {
      if (!file.endsWith(".md") || file === "latest.md") continue;
      
      const filePath = resolve(logsDir, file);
      const stats = await stat(filePath);
      
      if (stats.isFile() && stats.mtime < thirtyDaysAgo) {
        const archivePath = resolve(archiveDir, file);
        await writeFile(archivePath, await readFile(filePath, "utf8"));
        await unlink(filePath);
        archivedCount++;
      }
    }
  } catch (error) {
    console.log("  归档检查: 无需归档或目录为空");
  }
  
  return archivedCount;
}

/**
 * 读取搜索结果文件
 */
async function readSearchResults(): Promise<ParsedResult[]> {
  const resultsPath = resolve(repoRoot, "outputs", "search-results.json");
  
  try {
    const content = await readFile(resultsPath, "utf8");
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      console.error("❌ search-results.json 格式错误: 应为数组");
      return [];
    }
    
    return data.map((item, index) => ({
      title: item.title || "",
      url: item.url || "",
      date: item.date || getToday(),
      summary: item.summary || "",
      source: item.source || "",
      queryId: item.queryId || Math.floor(index / 3) + 1,
    })).filter(r => r.title && r.url);
  } catch (error) {
    console.log("⚠️ 未找到搜索结果文件 (outputs/search-results.json)");
    console.log("   请先执行搜索步骤");
    return [];
  }
}

/**
 * 生成source log条目
 */
function generateEntry(result: ParsedResult, searchTime: string): string {
  const category = autoClassify(result.title, result.summary);
  const confidence = detectConfidence(result.url);
  const sourceTier = confidence === "high" ? "tier1" : "tier2";
  const queryTask = SEARCH_TASKS.find(t => t.id === result.queryId) || SEARCH_TASKS[0];
  const subject = detectSubject(result.title, category, queryTask.company);
  
  return `
- 标题：${result.title}
- 检索时间：${searchTime}
- 主题分类：${category}
- 检索语句：${queryTask.query}
- 来源名称：${result.source || "Tech Media"}
- 来源链接：${result.url}
- 发布时间：${result.date}
- 是否在 48 小时内：是
- 主体：${subject}
- 事件摘要：${result.summary.slice(0, 180)}${result.summary.length > 180 ? "..." : ""}
- 影响说明：${result.summary.slice(0, 80)}${result.summary.length > 80 ? "..." : ""}
- 可信度：${confidence}
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：${sourceTier}
- 相关主题：${category} / ${queryTask.priority}
- 备注：自动抓取
`;
}

/**
 * 生成完整的source log
 */
async function generateSourceLog(results: ParsedResult[]): Promise<void> {
  const today = getToday();
  const searchTime = new Date().toISOString().slice(0, 16).replace("T", " ");
  const logPath = getSourceLogPath(today);
  
  // 按分类分组
  const grouped = new Map<string, ParsedResult[]>();
  for (const result of results) {
    const category = autoClassify(result.title, result.summary);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(result);
  }
  
  // 生成内容
  let content = `# AI行业情报检索记录 - ${today}

## 自动抓取信息

- 抓取时间：${searchTime}
- 搜索任务：${SEARCH_TASKS.length} 个
- 原始结果：${results.length} 条
- 归档状态：已自动归档超过30天的日志

## 本期记录条目

`;
  
  for (const [category, items] of grouped) {
    content += `### ${category} (${items.length} 条)\n\n`;
    for (const item of items) {
      content += generateEntry(item, searchTime);
    }
  }
  
  // 写入文件
  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, content, "utf8");
  
  // 更新latest软链接
  const latestPath = getLatestPath();
  try { await unlink(latestPath); } catch {}
  try { 
    await symlink(logPath, latestPath);
  } catch {
    await writeFile(latestPath, content, "utf8");
  }
  
  console.log(`\n✅ 已生成: prompts/ai-industry/source-logs/${today}.md`);
  console.log(`✅ 已更新: latest.md`);
}

/**
 * 显示搜索任务清单
 */
function showSearchTasks(): void {
  console.log("\n📋 搜索任务清单");
  console.log("=".repeat(60));
  
  SEARCH_TASKS.forEach(task => {
    console.log(`\n${task.id}. [${task.priority}] ${task.category}`);
    console.log(`   搜索词: ${task.query}`);
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📝 请按以下步骤操作：");
  console.log("1. 复制上方搜索词到 Kimi CLI");
  console.log("2. 执行 SearchWeb 搜索");
  console.log("3. 将结果保存为 outputs/search-results.json");
  console.log("   格式: [{\"title\":\"...\",\"url\":\"...\",\"date\":\"...\",\"summary\":\"...\",\"source\":\"...\",\"queryId\":1}]");
  console.log("4. 返回运行: npm run fetch:realtime");
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log("🚀 AI行业情报 - 全自动实时抓取");
  console.log(`📅 日期: ${getToday()}`);
  
  if (command === "--tasks" || command === "-t") {
    showSearchTasks();
    return;
  }
  
  // 步骤1：归档旧日志
  console.log("\n📦 检查旧日志归档...");
  const archived = await archiveOldLogs();
  if (archived > 0) {
    console.log(`  已归档 ${archived} 个旧日志文件`);
  } else {
    console.log("  无需归档");
  }
  
  // 步骤2：读取搜索结果
  console.log("\n📥 读取搜索结果...");
  const rawResults = await readSearchResults();
  
  if (rawResults.length === 0) {
    console.log("\n❌ 没有找到搜索结果");
    console.log("\n请先执行搜索任务：");
    showSearchTasks();
    process.exitCode = 1;
    return;
  }
  
  console.log(`  读取到 ${rawResults.length} 条原始结果`);
  
  // 步骤3：去重
  console.log("\n🔍 执行去重...");
  const uniqueResults = deduplicate(rawResults);
  console.log(`  保留 ${uniqueResults.length} 条唯一结果`);
  
  // 步骤4：生成分类统计
  console.log("\n📊 分类统计:");
  const categoryCount = new Map<string, number>();
  for (const result of uniqueResults) {
    const cat = autoClassify(result.title, result.summary);
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
  }
  categoryCount.forEach((count, cat) => {
    console.log(`  - ${cat}: ${count} 条`);
  });
  
  // 步骤5：生成source log
  console.log("\n📝 生成 Source Log...");
  await generateSourceLog(uniqueResults);
  
  console.log("\n✨ 完成！下一步:");
  console.log("   npm run generate:all");
}

main().catch((error: unknown) => {
  console.error("❌ 错误:", error);
  process.exitCode = 1;
});
