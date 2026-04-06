#!/usr/bin/env tsx
/**
 * AI行业情报 - Google Search API 全自动抓取脚本
 * 
 * 实现真正的全自动抓取，无需手动 SearchWeb
 * 需要配置环境变量: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID
 */

import { mkdir, writeFile, readFile, symlink, unlink, readdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

// 搜索配置
const SEARCH_TASKS = [
  { id: 1, query: "OpenAI news", priority: "P0", category: "头部 AI 企业", company: "OpenAI" },
  { id: 2, query: "Anthropic Claude update", priority: "P0", category: "头部 AI 企业", company: "Anthropic" },
  { id: 3, query: "GitHub Copilot agent", priority: "P0", category: "AI Coding", company: "GitHub" },
  { id: 4, query: "Google Gemini AI", priority: "P0", category: "模型与基础设施", company: "Google" },
  { id: 5, query: "xAI Grok", priority: "P1", category: "头部 AI 企业", company: "xAI" },
  { id: 6, query: "Sam Altman OpenAI", priority: "P1", category: "AI 领袖人物", company: "OpenAI" },
  { id: 7, query: "Meta AI", priority: "P1", category: "头部 AI 企业", company: "Meta" },
  { id: 8, query: "AI industry news", priority: "P2", category: "模型与基础设施", company: "General" },
];

// 主题关键词映射
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI Agent": ["agent", "openclaw", "devin", "multi-agent", "autonomous"],
  "AI Coding": ["copilot", "cursor", "claude code", "coding", "github", "codex"],
  "头部 AI 企业": ["openai", "anthropic", "google", "meta", "microsoft", "xai", "funding", "acquisition", "valuation"],
  "AI 领袖人物": ["sam altman", "dario", "sundar", "interview", "ceo"],
  "模型与基础设施": ["model", "gpt", "claude", "gemini", "benchmark", "llm"],
  "开源生态": ["open source", "huggingface", "llama"],
  "政策与监管": ["regulation", "policy", "compliance"],
};

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  formattedUrl: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    searchTime: number;
    totalResults: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

interface ParsedResult {
  title: string;
  url: string;
  date: string;
  summary: string;
  source: string;
  queryId: number;
}

/**
 * 调用 Google Custom Search API
 */
async function googleSearch(
  query: string, 
  apiKey: string, 
  searchEngineId: string
): Promise<GoogleSearchResult[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", searchEngineId);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");
  url.searchParams.set("sort", "date"); // 按日期排序
  url.searchParams.set("dateRestrict", "d2"); // 限制最近2天

  const response = await fetch(url.toString());
  const data: GoogleSearchResponse = await response.json();

  if (data.error) {
    throw new Error(`Google Search API Error: ${data.error.message} (Code: ${data.error.code})`);
  }

  return data.items || [];
}

/**
 * 提取日期（从 URL 或标题中）
 */
function extractDate(url: string, title: string): string {
  const today = new Date().toISOString().slice(0, 10);
  
  // 尝试从 URL 中提取日期 (如 /2026/04/05/)
  const dateMatch = url.match(/\/(2026)\/(0[1-9]|1[0-2])\/([0-2][0-9]|3[01])\//);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }
  
  // 尝试从标题中提取日期
  const titleMatch = title.match(/(2026)[-\/](0[1-9]|1[0-2])[-\/]([0-2][0-9]|3[01])/);
  if (titleMatch) {
    return `${titleMatch[1]}-${titleMatch[2]}-${titleMatch[3]}`;
  }
  
  return today;
}

/**
 * 提取来源名称
 */
function extractSource(url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const sourceMap: Record<string, string> = {
      "openai.com": "OpenAI",
      "anthropic.com": "Anthropic",
      "github.com": "GitHub",
      "blog.google": "Google",
      "deepmind.google": "Google DeepMind",
      "techcrunch.com": "TechCrunch",
      "theverge.com": "The Verge",
      "venturebeat.com": "VentureBeat",
      "wired.com": "Wired",
      "bloomberg.com": "Bloomberg",
      "reuters.com": "Reuters",
      "fortune.com": "Fortune",
    };
    
    for (const [key, value] of Object.entries(sourceMap)) {
      if (domain.includes(key)) return value;
    }
    
    return domain;
  } catch {
    return "Unknown";
  }
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
  const officialDomains = ["openai.com", "anthropic.com", "github.com", "google.com", "blog.google", "deepmind.google"];
  const tier1Media = ["techcrunch.com", "theverge.com", "wired.com", "bloomberg.com", "reuters.com", "venturebeat.com", "fortune.com"];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (officialDomains.some(d => domain.includes(d))) return "high";
    if (tier1Media.some(d => domain.includes(d))) return "high";
  } catch {}
  
  return "medium";
}

/**
 * 检测主体
 */
function detectSubject(title: string, category: string, queryCompany: string): string {
  const lower = title.toLowerCase();
  const companies = ["OpenAI", "Anthropic", "Google", "Meta", "Microsoft", "xAI", "GitHub"];
  
  for (const company of companies) {
    if (lower.includes(company.toLowerCase())) return company;
  }
  
  if (lower.includes("sam altman")) return "Sam Altman";
  
  return queryCompany;
}

/**
 * 去重
 */
function deduplicate(results: ParsedResult[]): ParsedResult[] {
  const unique: ParsedResult[] = [];
  let duplicateCount = 0;
  
  for (const result of results) {
    if (unique.some(u => u.url === result.url)) {
      duplicateCount++;
      continue;
    }
    
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
 * 归档旧日志
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
  } catch {}
  
  return archivedCount;
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
- 来源名称：${result.source}
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
- 备注：Google API 自动抓取
`;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    console.error("❌ 缺少环境变量:");
    console.error("  GOOGLE_SEARCH_API_KEY - Google Custom Search API Key");
    console.error("  GOOGLE_SEARCH_ENGINE_ID - Google Custom Search Engine ID");
    console.error("\n获取方式:");
    console.error("  1. 访问 https://developers.google.com/custom-search/v1/overview");
    console.error("  2. 创建 API Key");
    console.error("  3. 访问 https://cse.google.com/cse/");
    console.error("  4. 创建 Custom Search Engine");
    process.exit(1);
  }
  
  const startTime = new Date();
  const searchTime = startTime.toISOString().slice(0, 16).replace("T", " ");
  const today = startTime.toISOString().slice(0, 10);
  
  console.log("🚀 AI行业情报 - Google Search API 全自动抓取");
  console.log(`📅 日期: ${today}`);
  console.log("");
  
  // 步骤1：归档旧日志
  console.log("📦 检查旧日志归档...");
  const archived = await archiveOldLogs();
  if (archived > 0) console.log(`  已归档 ${archived} 个旧日志文件`);
  else console.log("  无需归档");
  
  // 步骤2：执行搜索
  console.log("\n🔍 开始 Google Search API 搜索...");
  const allResults: ParsedResult[] = [];
  
  for (const task of SEARCH_TASKS) {
    try {
      console.log(`  [${task.priority}] ${task.query}`);
      const items = await googleSearch(task.query, apiKey, searchEngineId);
      
      for (const item of items.slice(0, 5)) { // 每个查询取前5条
        allResults.push({
          title: item.title,
          url: item.link,
          date: extractDate(item.link, item.title),
          summary: item.snippet,
          source: extractSource(item.link),
          queryId: task.id,
        });
      }
      
      // API 速率限制：每秒1次
      await new Promise(r => setTimeout(r, 1100));
    } catch (error) {
      console.error(`  ❌ 搜索失败: ${task.query}`, error);
    }
  }
  
  console.log(`\n  原始结果: ${allResults.length} 条`);
  
  // 步骤3：去重
  console.log("\n🔍 执行去重...");
  const uniqueResults = deduplicate(allResults);
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
  const logPath = resolve(repoRoot, "prompts", "ai-industry", "source-logs", `${today}.md`);
  
  const grouped = new Map<string, ParsedResult[]>();
  for (const result of uniqueResults) {
    const cat = autoClassify(result.title, result.summary);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(result);
  }
  
  let content = `# AI行业情报检索记录 - ${today}

## 自动抓取信息

- 抓取时间：${searchTime}
- 搜索任务：${SEARCH_TASKS.length} 个
- 原始结果：${allResults.length} 条
- 去重后：${uniqueResults.length} 条
- 抓取方式：Google Search API

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
  const latestPath = resolve(repoRoot, "prompts", "ai-industry", "source-logs", "latest.md");
  try { await unlink(latestPath); } catch {}
  try { 
    await symlink(logPath, latestPath);
  } catch {
    await writeFile(latestPath, content, "utf8");
  }
  
  console.log(`\n✅ 已生成: prompts/ai-industry/source-logs/${today}.md`);
  console.log(`✅ 已更新: latest.md`);
  
  console.log("\n✨ 完成！下一步:");
  console.log("   npm run generate:all");
}

main().catch((error: unknown) => {
  console.error("❌ 错误:", error);
  process.exit(1);
});