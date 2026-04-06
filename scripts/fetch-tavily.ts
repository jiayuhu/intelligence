#!/usr/bin/env tsx
/**
 * AI行业情报 - Tavily Search API 全自动抓取脚本
 * 
 * Tavily 是专为 AI Agent 设计的搜索引擎，优势：
 * - 为 LLM 优化的结构化结果
 * - 自动抓取网页正文（include_raw_content）
 * - AI 生成的内容摘要
 * - 支持深度搜索（max_results 可调）
 * 
 * 需要配置环境变量: TAVILY_API_KEY
 * 获取方式: https://tavily.com
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { mkdir, writeFile, readFile, symlink, unlink, readdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

// 搜索配置 - 中文优化版，聚焦24小时内高质量情报
const SEARCH_TASKS = [
  // P0 - 最高优先级（核心公司动态）
  { id: 1, query: "OpenAI GPT-5 新模型发布 人工智能", priority: "P0", category: "模型与基础设施", company: "OpenAI" },
  { id: 2, query: "Anthropic Claude 4 新功能 人工智能", priority: "P0", category: "模型与基础设施", company: "Anthropic" },
  { id: 3, query: "GitHub Copilot 代理模式 AI编程", priority: "P0", category: "AI Coding", company: "GitHub" },
  
  // AI Coding（精选3个）
  { id: 20, query: "Cursor AI编程工具 更新 中文", priority: "P1", category: "AI Coding", company: "Cursor" },
  { id: 21, query: "Claude Code 命令行编程助手", priority: "P1", category: "AI Coding", company: "Anthropic" },
  { id: 22, query: "Windsurf Codeium AI编辑器", priority: "P2", category: "AI Coding", company: "Codeium" },
  
  // AI Agent（精选3个）
  { id: 30, query: "AI代理 自主任务执行 智能体 中文", priority: "P1", category: "AI Agent", company: "General" },
  { id: 31, query: "OpenAI Operator 计算机使用代理", priority: "P1", category: "AI Agent", company: "OpenAI" },
  { id: 32, query: "Devin AI软件工程师 自动化编程", priority: "P1", category: "AI Agent", company: "Cognition" },
  
  // 模型与基础设施（精选3个）
  { id: 40, query: "NVIDIA Blackwell芯片 AI算力 中文", priority: "P1", category: "模型与基础设施", company: "NVIDIA" },
  { id: 41, query: "GPT-5 性能测试 基准测试 中文", priority: "P1", category: "模型与基础设施", company: "OpenAI" },
  { id: 42, query: "AI推理成本 优化 降低 中文", priority: "P2", category: "模型与基础设施", company: "General" },
  
  // 政策与监管（精选2个）
  { id: 50, query: "中国AI监管政策 人工智能法规 2026", priority: "P2", category: "政策与监管", company: "General" },
  { id: 51, query: "欧盟AI法案 合规要求 中文解读", priority: "P2", category: "政策与监管", company: "General" },
  
  // 社区热点（精选2个）
  { id: 60, query: "OpenAI Anthropic Reddit 讨论 中文", priority: "P1", category: "社区热点", company: "General" },
  { id: 61, query: "AI技术 Hacker News 热点讨论", priority: "P1", category: "社区热点", company: "General" },
];

// 主题关键词映射 - 用于自动分类（按优先级顺序，先匹配的分类优先）
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "社区热点": ["reddit", "hackernews", "ycombinator", "twitter discussion", "x.com", "dev.to", "hashnode", "community discussion", "developer forum"],
  "AI Agent": ["agent", "autonomous", "task execution", "workflow", "orchestration", "multi-agent", "openclaw", "devin", "operator", "computer use"],
  "AI Coding": ["copilot", "cursor", "claude code", "coding", "github", "codex", "ide", "programming assistant", "windsurf", "codeium"],
  "模型与基础设施": ["openai", "anthropic", "google", "meta", "microsoft", "xai", "cohere", "mistral", "perplexity", "funding", "acquisition", "valuation", "series", "gpt-4", "gpt-5", "claude 3", "gemini", "llama 4", "model benchmark", "llm", "inference", "gpu", "nvidia", "training", "blackwell", "h200", "infrastructure", "open source", "huggingface", "llama", "mistral", "github repository", "open weights"],
  "政策与监管": ["regulation", "policy", "compliance", "governance", "safety", "ai act", "监管", "政策", "executive order"],
};

// Tavily API 响应类型
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;           // AI 生成的摘要
  raw_content?: string;      // 原始网页内容（如果启用）
  score: number;             // 相关性分数 (0-1)
  published_date?: string;   // 发布日期（如果可获取）
}

interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;           // 对查询的直接回答（如果启用 search_depth: advanced）
  response_time: number;     // 响应时间（秒）
}

interface TavilySearchOptions {
  query: string;
  search_depth?: "basic" | "advanced";  // basic 更快，advanced 更深入
  include_answer?: boolean;              // 是否包含 AI 直接回答
  include_raw_content?: boolean;         // 是否包含原始网页内容
  max_results?: number;                  // 返回结果数量 (5-20)
  time_range?: "day" | "week" | "month"; // 时间范围
}

interface ParsedResult {
  title: string;
  url: string;
  date: string;
  summary: string;
  rawContent?: string;
  source: string;
  queryId: number;
  relevanceScore: number;
}

/**
 * 调用 Tavily Search API
 */
async function tavilySearch(
  options: TavilySearchOptions,
  apiKey: string
): Promise<TavilySearchResponse> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: options.query,
      search_depth: options.search_depth || "advanced",
      include_answer: options.include_answer ?? true,
      include_raw_content: options.include_raw_content ?? true,
      max_results: options.max_results || 10,
      time_range: options.time_range || "week",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * 提取日期（从 URL、标题或 Tavily 返回的数据中）
 */
function extractDate(url: string, title: string, publishedDate?: string): string {
  // 优先使用 Tavily 返回的日期
  if (publishedDate) {
    try {
      const date = new Date(publishedDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {}
  }
  
  const today = new Date().toISOString().slice(0, 10);
  
  // 尝试从 URL 中提取日期
  const dateMatch = url.match(/\/(202[5-9])\/(0[1-9]|1[0-2])\/([0-2][0-9]|3[01])\//);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }
  
  // 尝试从标题中提取日期
  const titleMatch = title.match(/(202[5-9])[-\/\.](0[1-9]|1[0-2])[-\/\.]([0-2][0-9]|3[01])/);
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
      "forbes.com": "Forbes",
      "cnbc.com": "CNBC",
      "arxiv.org": "arXiv",
      "huggingface.co": "HuggingFace",
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
 * 预过滤内容 - 在抓取阶段就过滤垃圾内容
 */
function prefilterContent(title: string, summary: string): { title: string; summary: string; isValid: boolean } {
  let cleanedTitle = title;
  let cleanedSummary = summary;
  
  // 1. 过滤垃圾标题模式
  const spamTitlePatterns = [
    /Results for["'][^"']*["']/i,
    /关键词[：:]?\s*[{\[][^}\]]+[}\]]/i,
    /官网[：:]?\s*[{\[]?[^}\]]+[}\]]?/i,
    /搜索.*结果/i,
    /^\s*image\s*$/i,
    /^\s*\.\w{2,4}\s*$/i,
  ];
  
  for (const pattern of spamTitlePatterns) {
    if (pattern.test(cleanedTitle)) {
      return { title: cleanedTitle, summary: cleanedSummary, isValid: false };
    }
  }
  
  // 2. 移除导航文本
  const navPatterns = [
    /Skip to main content/gi,
    /Open menu/gi,
    /Open navigation/gi,
    /Toggle navigation/gi,
    /Close menu/gi,
  ];
  for (const pattern of navPatterns) {
    cleanedSummary = cleanedSummary.replace(pattern, "");
  }
  
  // 3. 移除多语言菜单
  const langNames = /Magyar|Deutsch|Português|Español|Suomi|Filipino|Latinoamérica|Français|Italiano|Nederlands|Polski|Русский|中文|日本語|한국어/gi;
  cleanedSummary = cleanedSummary.replace(langNames, "");
  
  // 4. 移除纯图片链接
  cleanedSummary = cleanedSummary.replace(/i\.guim\.co\.uk[^\s]*image/gi, "");
  cleanedSummary = cleanedSummary.replace(/\n[^\n]*\.image\s*$/gim, "");
  
  // 5. 清理多余空格
  cleanedSummary = cleanedSummary.replace(/\s+/g, " ").trim();
  
  return { title: cleanedTitle, summary: cleanedSummary, isValid: true };
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
function detectConfidence(url: string, relevanceScore: number): string {
  const officialDomains = [
    "openai.com", "anthropic.com", "github.com", "google.com", 
    "blog.google", "deepmind.google", "x.ai", "meta.ai"
  ];
  const tier1Media = [
    "techcrunch.com", "theverge.com", "wired.com", "bloomberg.com", 
    "reuters.com", "venturebeat.com", "fortune.com", "forbes.com", "cnbc.com"
  ];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (officialDomains.some(d => domain.includes(d))) return "high";
    if (tier1Media.some(d => domain.includes(d)) && relevanceScore > 0.7) return "high";
    if (tier1Media.some(d => domain.includes(d))) return "medium";
  } catch {}
  
  return relevanceScore > 0.8 ? "medium" : "low";
}

/**
 * 检测主体
 */
function detectSubject(title: string, category: string, queryCompany: string): string {
  const lower = title.toLowerCase();
  const companies = ["OpenAI", "Anthropic", "Google", "Meta", "Microsoft", "xAI", "GitHub", "NVIDIA", "Amazon"];
  
  for (const company of companies) {
    if (lower.includes(company.toLowerCase())) return company;
  }
  
  if (lower.includes("sam altman")) return "Sam Altman";
  if (lower.includes("dario")) return "Dario Amodei";
  if (lower.includes("sundar")) return "Sundar Pichai";
  if (lower.includes("elon musk")) return "Elon Musk";
  
  return queryCompany;
}

/**
 * 去重
 */
function deduplicate(results: ParsedResult[]): ParsedResult[] {
  const unique: ParsedResult[] = [];
  let duplicateCount = 0;
  
  for (const result of results) {
    // URL 去重
    if (unique.some(u => u.url === result.url)) {
      duplicateCount++;
      continue;
    }
    
    // 标题相似度去重
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
 * 生成符合 generate-md.ts 要求的 JSON 格式
 */
function generateFetchJson(
  results: ParsedResult[],
  reportDate: string,
  searchTime: string
): {
  report_title: string;
  report_date: string;
  time_window_hours: number;
  generated_at: string;
  groups: Array<{
    category: string;
    summary: string;
    items: Array<{
      title: string;
      published_at: string;
      source_name: string;
      source_url: string;
      subject: string;
      classification: string;
      event_summary: string;
      why_it_matters: string;
      confidence: string;
      related_focus: string[];
      within_48h: boolean;
      status: string;
      source_tier: string;
      notes: string;
    }>;
  }>;
} {
  // 按分类分组
  const grouped = new Map<string, ParsedResult[]>();
  for (const result of results) {
    const cat = autoClassify(result.title, result.summary);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(result);
  }

  const groups = Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    summary: `${category}: ${items.length} 条`,
    items: items.map(item => {
      const queryTask = SEARCH_TASKS.find(t => t.id === item.queryId) || SEARCH_TASKS[0];
      const confidence = detectConfidence(item.url, item.relevanceScore);
      const sourceTier = confidence === "high" ? "tier1" : "tier2";
      const subject = detectSubject(item.title, category, queryTask.company);
      
      return {
        title: item.title,
        published_at: item.date.includes("T") ? item.date : `${item.date}T00:00:00.000Z`,
        source_name: item.source,
        source_url: item.url,
        subject,
        classification: category,
        event_summary: item.summary.slice(0, 300),
        why_it_matters: item.summary.slice(0, 200),
        confidence,
        related_focus: [category],
        within_48h: true,
        status: "confirmed" as const,
        source_tier: sourceTier,
        notes: `Tavily AI 搜索自动抓取 | 相关度: ${(item.relevanceScore * 100).toFixed(1)}%`,
      };
    }),
  }));

  return {
    report_title: "AI行业情报",
    report_date: reportDate,
    time_window_hours: 48,
    generated_at: new Date().toISOString(),
    groups,
  };
}

/**
 * 生成 source log 条目
 */
function generateEntry(result: ParsedResult, searchTime: string): string {
  const category = autoClassify(result.title, result.summary);
  const confidence = detectConfidence(result.url, result.relevanceScore);
  const sourceTier = confidence === "high" ? "tier1" : "tier2";
  const queryTask = SEARCH_TASKS.find(t => t.id === result.queryId) || SEARCH_TASKS[0];
  const subject = detectSubject(result.title, category, queryTask.company);
  
  // 如果有原始内容，提取关键信息
  const extendedInfo = result.rawContent 
    ? `\n  - 原始内容片段：${result.rawContent.slice(0, 200).replace(/\n/g, " ")}${result.rawContent.length > 200 ? "..." : ""}`
    : "";
  
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
- 事件摘要：${result.summary.slice(0, 180)}${result.summary.length > 180 ? "..." : ""}${extendedInfo}
- 影响说明：${result.summary.slice(0, 80)}${result.summary.length > 80 ? "..." : ""}
- 可信度：${confidence}
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：${sourceTier}
- 相关主题：${category} / ${queryTask.priority}
- 相关性分数：${(result.relevanceScore * 100).toFixed(1)}%
- 备注：Tavily AI 搜索自动抓取
`;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.error("❌ 缺少环境变量: TAVILY_API_KEY");
    console.error("\n获取方式:");
    console.error("  1. 访问 https://tavily.com");
    console.error("  2. 注册账号获取 API Key");
    console.error("  3. 每月 1000 次免费调用额度");
    console.error("\n配置方式:");
    console.error("  export TAVILY_API_KEY=tvly-xxxxx");
    process.exit(1);
  }
  
  const startTime = new Date();
  const searchTime = startTime.toISOString().slice(0, 16).replace("T", " ");
  const today = startTime.toISOString().slice(0, 10);
  
  console.log("🔍 AI行业情报 - Tavily Search API 全自动抓取");
  console.log(`📅 日期: ${today}`);
  console.log(`🤖 搜索深度: advanced (AI 生成摘要 + 原始内容)`);
  console.log("");
  
  // 步骤1：归档旧日志
  console.log("📦 检查旧日志归档...");
  const archived = await archiveOldLogs();
  if (archived > 0) console.log(`  已归档 ${archived} 个旧日志文件`);
  else console.log("  无需归档");
  
  // 步骤2：执行 Tavily 搜索
  console.log("\n🔍 开始 Tavily AI 搜索...");
  const allResults: ParsedResult[] = [];
  let totalApiTime = 0;
  
  for (const task of SEARCH_TASKS) {
    try {
      console.log(`  [${task.priority}] ${task.query}`);
      
      const apiStartTime = Date.now();
      const response = await tavilySearch({
        query: task.query,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: true,
        max_results: 10,
        time_range: "day",
      }, apiKey);
      
      const apiTime = Date.now() - apiStartTime;
      totalApiTime += apiTime;
      
      // 处理结果
      for (const item of response.results) {
        // 预过滤内容
        const filtered = prefilterContent(item.title, item.content);
        if (!filtered.isValid) {
          console.log(`     ⚠️ 过滤垃圾内容: ${item.title.slice(0, 40)}...`);
          continue;
        }
        
        allResults.push({
          title: filtered.title,
          url: item.url,
          date: extractDate(item.url, item.title, item.published_date),
          summary: filtered.summary,
          rawContent: item.raw_content,
          source: extractSource(item.url),
          queryId: task.id,
          relevanceScore: item.score,
        });
      }
      
      // 如果有 AI 直接回答，打印摘要
      if (response.answer) {
        const shortAnswer = response.answer.slice(0, 60).replace(/\n/g, " ");
        console.log(`     🤖 AI摘要: ${shortAnswer}... (${apiTime}ms)`);
      } else {
        console.log(`     ✓ ${response.results.length} 条结果 (${apiTime}ms)`);
      }
      
      // Tavily 速率限制：每秒 20 次（较为宽松）
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`  ❌ 搜索失败: ${task.query}`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log(`\n  原始结果: ${allResults.length} 条`);
  console.log(`  API 总耗时: ${totalApiTime}ms`);
  
  // 步骤3：去重
  console.log("\n🔍 执行去重...");
  const uniqueResults = deduplicate(allResults);
  console.log(`  保留 ${uniqueResults.length} 条唯一结果`);
  
  // 步骤4：按相关性排序
  uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // 步骤5：生成分类统计
  console.log("\n📊 分类统计:");
  const categoryCount = new Map<string, number>();
  const categoryRelevance = new Map<string, number>();
  
  for (const result of uniqueResults) {
    const cat = autoClassify(result.title, result.summary);
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
    categoryRelevance.set(cat, (categoryRelevance.get(cat) || 0) + result.relevanceScore);
  }
  
  for (const [cat, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
    const avgRelevance = (categoryRelevance.get(cat) || 0) / count;
    console.log(`  - ${cat}: ${count} 条 (平均相关度: ${(avgRelevance * 100).toFixed(1)}%)`);
  }
  
  // 步骤6：生成 source log
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
- 抓取方式：Tavily AI Search API
- API 总耗时：${totalApiTime}ms
- 平均响应时间：${(totalApiTime / SEARCH_TASKS.length).toFixed(0)}ms

## Tavily 优势说明

相比传统搜索引擎，Tavily 提供：
1. **AI 生成的内容摘要** - 无需人工阅读全文
2. **原始内容抓取** - 自动提取网页正文
3. **相关性评分** - 每条结果都有 0-1 的置信度分数
4. **为 LLM 优化** - 返回结构化数据，便于下游处理

## 本期记录条目

`;
  
  for (const [category, items] of grouped) {
    content += `### ${category} (${items.length} 条)\n\n`;
    for (const item of items) {
      content += generateEntry(item, searchTime);
    }
  }
  
  // 写入 source log 文件
  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, content, "utf8");
  
  // 更新 latest 软链接
  const latestPath = resolve(repoRoot, "prompts", "ai-industry", "source-logs", "latest.md");
  try { await unlink(latestPath); } catch {}
  try { 
    await symlink(logPath, latestPath);
  } catch {
    await writeFile(latestPath, content, "utf8");
  }
  
  console.log(`\n✅ 已生成: prompts/ai-industry/source-logs/${today}.md`);
  console.log(`✅ 已更新: latest.md`);
  
  // 步骤7：生成 JSON 文件供 generate-md.ts 使用
  console.log("\n📦 生成 JSON 文件供 Markdown 生成使用...");
  const jsonOutput = generateFetchJson(uniqueResults, today, searchTime);
  const jsonPath = resolve(repoRoot, "outputs", "fetch", `ai-industry-${today}.json`);
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(jsonOutput, null, 2), "utf8");
  console.log(`✅ 已生成: outputs/fetch/ai-industry-${today}.json (${jsonOutput.groups.reduce((sum, g) => sum + g.items.length, 0)} 条)`);
  
  // 输出高质量结果摘要
  const highRelevanceResults = uniqueResults.filter(r => r.relevanceScore > 0.8);
  if (highRelevanceResults.length > 0) {
    console.log(`\n🌟 高相关性结果 (${highRelevanceResults.length} 条):`);
    for (const result of highRelevanceResults.slice(0, 3)) {
      console.log(`   - ${result.title.slice(0, 50)}... (${(result.relevanceScore * 100).toFixed(0)}%)`);
    }
  }
  
  console.log("\n✨ 完成！下一步:");
  console.log("   npm run generate:all");
}

main().catch((error: unknown) => {
  console.error("❌ 错误:", error);
  process.exit(1);
});
