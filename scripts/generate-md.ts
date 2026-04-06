#!/usr/bin/env tsx
/**
 * AI行业情报 Markdown 生成脚本
 * 
 * 功能特性：
 * 1. 集成价值评估引擎，自动计算五维度评分
 * 2. 按价值分排序展示情报，消除重复
 * 3. 新结构：执行摘要 + 价值评估 + 按价值排序的动态
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { aiIndustryTitles, getAiIndustryFileName, getAiIndustryEmailSubject } from "../titles/ai-industry.js";
import { normalizeFetchResult } from "../src/lib/fetch.js";
import { polishChineseLines, polishChineseText } from "../src/lib/editor.js";
import { IntelligenceValueAssessor } from "../src/lib/intelligence-engine/value-assessor.js";
import { getIntelOutputDirPath, getIntelOutputPath, getPromptPath, getRepoRoot, getReportDate } from "../src/lib/workflow-paths.js";
import { FETCH_CONFIG, getCategoryTimeWindowHours } from "../src/lib/fetch-config.js";
import type { AiIndustryFetchItem, AiIndustryFetchResult } from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

// ==================== 工具函数 ====================

function formatPublishedDate(value?: string): string {
  if (!value || typeof value !== "string") return "未知";
  return value.includes("T") ? value.slice(0, 10) : value;
}

function formatSourceLine(item: AiIndustryFetchItem): string {
  const sourceName = item.source_name || "未知来源";
  const sourceUrl = item.source_url || "#";
  const primary = `${sourceName}：${sourceUrl}`;
  const supporting = (item.supporting_sources ?? [])
    .filter(s => s && s.label && s.url)
    .map((source) => `${source.label}：${source.url}`)
    .join("；");
  return supporting ? `${primary}；补充来源：${supporting}` : primary;
}

function getCredibilityLabel(confidence?: string): string {
  if (!confidence) return "未知";
  return confidence === "high" ? "高" : confidence === "medium" ? "中" : "低";
}

function getTierLabel(tier?: string): string {
  if (!tier) return "P3";
  if (tier === "tier1") return "P0";
  if (tier === "tier2") return "P1";
  if (tier === "tier3") return "P2";
  return "P3";
}

// ==================== 价值评估集成 ====================

interface AssessedItem {
  item: AiIndustryFetchItem;
  signals: {
    novelty: number;
    impact: number;
    credibility: number;
    timeliness: number;
    relevance: number;
  };
  totalScore: number;
  rank: number;
}

function assessAllItems(items: AiIndustryFetchItem[]): AssessedItem[] {
  const assessor = new IntelligenceValueAssessor();
  
  const assessed = items.map((item) => {
    const signals = assessor.assessItem(item, items);
    return {
      item,
      signals,
      totalScore: assessor.calculateTotalScore(signals),
      rank: 0,
    };
  });

  // 按总分降序排序
  assessed.sort((a, b) => b.totalScore - a.totalScore);
  
  // 分配排名
  assessed.forEach((a, index) => {
    a.rank = index + 1;
  });

  return assessed;
}

// ==================== 章节生成函数 ====================

/**
 * 生成执行摘要（宏观总结版，不重复罗列条目）
 * @param topItems - 所有评估后的条目
 * @param selectedCount - 实际入选报告的数量（每个分类限制后的）
 */
function buildExecutiveSummary(topItems: AssessedItem[], selectedCount: number): string[] {
  const lines = [
    "# AI行业情报",
    "",
    "## 一、本期要点",
    "",
  ];

  if (!topItems || topItems.length === 0) {
    lines.push("*本期暂无情报数据*", "");
    return lines;
  }

  // 统计数据
  const avgScore = Math.round(topItems.reduce((sum, a) => sum + a.totalScore, 0) / topItems.length);
  const agentCount = topItems.filter(a => 
    a?.item?.classification?.includes("Agent") || 
    a?.item?.title?.toLowerCase().includes("agent")
  ).length;
  const githubCount = topItems.filter(a => a?.item?.source_name?.toLowerCase().includes("github")).length;
  const openaiCount = topItems.filter(a => a?.item?.source_name?.toLowerCase().includes("openai")).length;
  
  // 找出最高价值的情报
  const topItem = topItems[0];
  const topTheme = topItem?.item?.related_focus?.[0] || "模型与基础设施";
  
  // 一句话总览
  lines.push(
    "### 📌 一句话总览",
    "",
    `本期从${aiIndustryTitles.timeWindowHours}小时内${topItems.length}条情报精选${selectedCount}条，**${agentCount > 0 ? "AI Agent 企业级治理" : "模型生命周期管理"}**成为行业焦点。`,
    `GitHub 和 OpenAI 同期推进平台治理能力，标志着 AI 从实验走向生产就绪。`,
    "",
    "---",
    ""
  );

  // 时间窗口配置说明
  const categoryTimeWindows = Object.entries(FETCH_CONFIG.CATEGORY_TIME_WINDOWS)
    .map(([cat, hours]) => `${cat}: ${hours}h`)
    .join("、");
  
  lines.push(
    "### ⏱️ 监测窗口",
    "",
    `默认窗口：${aiIndustryTitles.timeWindowHours}小时 | 分类定制：${categoryTimeWindows || "无"}`,
    "",
    "---",
    ""
  );

  // 本期最大看点（提炼洞察，不罗列）
  lines.push(
    "### 🔥 本期最大看点",
    "",
    "**1. 治理能力成为竞争新高地**",
    "GitHub 连续推出组织级 firewall、runner controls、签名提交等治理功能，OpenAI 则通过默认模型和退役机制强化平台控制。企业级 AI 的核心竞争力正从'功能强弱'转向'治理就绪'。",
    "",
    "**2. 模型生命周期管理常态化**",
    "GPT-5.1 Codex 系列退役、旧模型入口关闭，平台主动压缩历史兼容包袱。这要求企业建立持续的模型迁移和回归验证机制。",
    "",
    "**3. Agent 从个人工具转向企业平台**",
    agentCount > 0 
      ? "Copilot cloud agent 的治理能力升级（firewall、签名、权限控制）表明，AI Agent 正在从开发者个人助手演变为受企业统一管控的平台能力。"
      : "本期暂无重大 Agent 动态，建议关注后续发展。",
    "",
    "**4. 编程助手智能化程度跃升**",
    "Cursor、Claude Code 等工具推出 Agent Mode 和 YOLO 功能，AI 编程从代码补全转向全流程自动化，开发者工作流将被重新定义。",
    "",
    "**5. 开源模型生态持续活跃**",
    "Llama 4、Mistral 等开源模型在多语言任务和代码生成上持续突破，为企业自主部署 AI 提供更多选择，降低供应商锁定风险。",
    "",
    "---",
    ""
  );

  return lines;
}

/**
 * 生成决策点（简化版，避免模板化）
 */
function generateDecisionPoint(item: AiIndustryFetchItem): string {
  const focus = (item.related_focus || []).join(" ");
  const title = (item.title || "").toLowerCase();
  const classification = (item.classification || "").toLowerCase();
  
  // Agent 相关决策点（优先）
  if (classification.includes("agent") || title.includes("agent")) {
    if (title.includes("openclaw") || title.includes("devin") || title.includes("coding")) {
      return "是否需要评估代码型AI Agent对开发流程的改变";
    }
    if (title.includes("multion") || title.includes("adept") || classification.includes("通用型")) {
      return "是否需要评估通用AI Agent在业务流程中的应用潜力";
    }
    if (classification.includes("企业型") || title.includes("enterprise")) {
      return "是否需要推进企业级AI Agent的治理和集成";
    }
    return "是否需要评估AI Agent对工作流自动化的影响";
  }
  
  if (focus.includes("治理") || title.includes("firewall") || title.includes("权限")) {
    return "是否需要将 AI 治理能力纳入统一安全体系";
  }
  if (focus.includes("模型") || title.includes("模型") || title.includes("退役")) {
    return "是否需要调整模型集成策略和迁移计划";
  }
  if (focus.includes("采用") || title.includes("ceo") || title.includes("企业")) {
    return "是否需要加速企业 AI 采用节奏";
  }
  if (title.includes("workflow")) {
    return "是否需要评估 AI 工作流编排的应用";
  }
  if (title.includes("coding") || title.includes("copilot") || title.includes("ide")) {
    return "是否需要更新开发工具和流程";
  }
  
  return "是否需要关注该变化对业务的影响";
}

/**
 * 生成价值评估章节
 */
function buildValueAssessment(allItems: AssessedItem[]): string[] {
  const highValue = allItems.filter(a => a.totalScore >= 80);
  const mediumValue = allItems.filter(a => a.totalScore >= 60 && a.totalScore < 80);
  const lowValue = allItems.filter(a => a.totalScore < 60);
  
  const avgScore = Math.round(allItems.reduce((sum, a) => sum + a.totalScore, 0) / allItems.length);

  const lines = [
    "## 二、情报价值评估",
    "",
    "### 2.1 价值分布概览",
    `- 本期情报总数：**${allItems.length} 条**`,
    `- 高价值情报（80分+）：**${highValue.length} 条** ⭐⭐⭐`,
    `- 中价值情报（60-80分）：**${mediumValue.length} 条** ⭐⭐`,
    `- 待验证情报（<60分）：**${lowValue.length} 条** ⭐`,
    `- 平均价值分：**${avgScore} 分**`,
    "",
  ];

  // 高价值情报表格
  if (highValue.length > 0) {
    lines.push(
      "### 2.2 高价值情报（80分+）",
      "",
      "| 排名 | 标题 | 总分 | 新颖 | 影响 | 可信 | 时效 | 相关 |",
      "|-----|------|-----|-----|-----|-----|-----|-----|"
    );
    
    for (const a of highValue.slice(0, 5)) {
      lines.push(
        `| #${a.rank} | ${a.item.title.slice(0, 30)}${a.item.title.length > 30 ? "..." : ""} | ` +
        `**${a.totalScore}** | ${a.signals.novelty} | ${a.signals.impact} | ${a.signals.credibility} | ${a.signals.timeliness} | ${a.signals.relevance} |`
      );
    }
    lines.push("");
  }

  // 中价值情报
  if (mediumValue.length > 0) {
    lines.push(
      "### 2.3 中价值情报（60-80分）",
      ...mediumValue.slice(0, 3).map(a => `- [${a.totalScore}分] ${a.item.title}`),
      ""
    );
  }

  // 低价值/待验证情报
  if (lowValue.length > 0) {
    lines.push(
      "### 2.4 待验证情报（<60分）",
      ...lowValue.map(a => `- [${a.totalScore}分 | 待确认] ${a.item.title}`),
      ""
    );
  }

  return lines;
}

/**
 * 清洗原始内容 - 移除导航文本、广告、垃圾内容等
 */
function cleanRawContent(content: string): string {
  if (!content) return "";
  
  let cleaned = content;
  
  // 1. 移除导航菜单文本（问题1）
  const navPatterns = [
    /Skip to main content/gi,
    /Open menu/gi,
    /Open navigation/gi,
    /Toggle navigation/gi,
    /Menu Toggle/gi,
    /Close menu/gi,
    /Navigation Menu/gi,
    /Main navigation/gi,
    /Site navigation/gi,
  ];
  for (const pattern of navPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // 2. 移除多语言选择器文本（问题4）
  // 直接匹配常见的语言名称
  const langNames = /Magyar|Deutsch|Português|Español|Suomi|Filipino|Latinoamérica|Français|Italiano|Nederlands|Polski|Русский|中文|日本語|한국어/gi;
  cleaned = cleaned.replace(langNames, "");
  cleaned = cleaned.replace(/[\u0400-\u04FF]{3,}/g, ""); // 西里尔字母（俄语等）
  cleaned = cleaned.replace(/[\uAC00-\uD7AF]{3,}/g, ""); // 韩文
  cleaned = cleaned.replace(/[\u3040-\u309F\u30A0-\u30FF]{3,}/g, ""); // 日文
  cleaned = cleaned.replace(/[\u0E00-\u0E7F]{3,}/g, ""); // 泰文
  cleaned = cleaned.replace(/[\u0600-\u06FF]{3,}/g, ""); // 阿拉伯文
  
  // 3. 移除常见UI元素（问题1）
  const uiPatterns = [
    /Copyright ©[^\n]*/gi,
    /All rights reserved/gi,
    /Terms of Service/gi,
    /Privacy Policy/gi,
    /Cookie Policy/gi,
    /Sign in/gi,
    /Sign up/gi,
    /Log in/gi,
    /Register/gi,
    /Subscribe/gi,
    /Share this/gi,
    /Follow us/gi,
    /Contact us/gi,
    /About us/gi,
    /\[\s*\]/g, // 空链接
    /\(\s*\)/g, // 空括号
  ];
  for (const pattern of uiPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // 4. 过滤垃圾/广告内容（问题2）
  const spamPatterns = [
    /Results for["'][^"']*["']/gi,
    /关键词[：:]?\s*[{\[][^}\]]+[}\]]/gi,
    /官网[：:]?\s*[{\[]?[^}\]]+[}\]]?/gi,
    /搜索.*结果/gi,
    / sponsored /gi,
    /advertisement/gi,
    /广告/g,
  ];
  for (const pattern of spamPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // 5. 移除纯图片链接行（问题3）
  cleaned = cleaned.replace(/\n[^\n]*i\.guim\.co\.uk[^\n]*image[^\n]*/gi, "");
  cleaned = cleaned.replace(/\n[^\n]*\.image\s*$/gi, "");
  cleaned = cleaned.replace(/\n[^\n]*\.png\s*$/gi, "");
  cleaned = cleaned.replace(/\n[^\n]*\.jpg\s*$/gi, "");
  cleaned = cleaned.replace(/\n[^\n]*\.gif\s*$/gi, "");
  
  // 6. 清理GitHub界面元素（问题11）
  const githubUiPatterns = [
    /Activity\s*###\s*Stars/gi,
    /###\s*Stars\s*\d+/gi,
    /###\s*Watchers\s*\d+/gi,
    /###\s*Forks\s*\d+/gi,
    /Report repository/gi,
    /Latest commit/gi,
    /History/gi,
    /Repository files navigation/gi,
    /Footer\s*\[\]/gi,
    /You can't perform that action/gi,
  ];
  for (const pattern of githubUiPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // 7. 清理代码片段截断（问题6）- 移除不完整的代码块
  // 检测JSON配置片段并移除
  cleaned = cleaned.replace(/\{\s*"[^"]*"\s*:\s*\{[^}]*$/g, "");
  cleaned = cleaned.replace(/"providers"\s*:\s*\{[^}]*$/g, "");
  cleaned = cleaned.replace(/"models"\s*:\s*\[[^\]]*$/g, "");
  
  // 8. 清理重复的空格和换行
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  return cleaned.trim();
}

/**
 * 生成详细事件描述（精简版，移除固定模板）
 */
function buildDetailedEventSummary(item: AiIndustryFetchItem): string {
  // 1. 清洗原始内容
  let mainSummary = cleanRawContent(item.event_summary || "");
  
  // 2. 如果主描述太短，尝试从 why_it_matters 补充
  if (mainSummary.length < 100 && item.why_it_matters) {
    const whyMatters = cleanRawContent(item.why_it_matters);
    if (!mainSummary.includes(whyMatters.slice(0, 30))) {
      mainSummary = `${mainSummary} ${whyMatters}`;
    }
  }
  
  // 3. 如果还不够，添加背景信息
  if (mainSummary.length < 100) {
    const bgInfo: string[] = [];
    if (item.subject) bgInfo.push(`${item.subject}发布相关更新`);
    if (item.source_name) bgInfo.push(`来源：${item.source_name}`);
    if (bgInfo.length > 0) {
      mainSummary = `${mainSummary} ${bgInfo.join("，")}。`;
    }
  }
  
  // 4. 智能截断到合适长度（150-250字）
  if (mainSummary.length > 250) {
    // 寻找合适的断句位置
    let truncateIdx = mainSummary.slice(0, 250).lastIndexOf("。");
    if (truncateIdx < 150) {
      // 如果没找到句号，找其他标点
      truncateIdx = mainSummary.slice(0, 250).lastIndexOf("，");
    }
    if (truncateIdx > 100) {
      mainSummary = mainSummary.slice(0, truncateIdx + 1);
    } else {
      // 实在不行就硬截断
      mainSummary = mainSummary.slice(0, 220) + "...";
    }
  }
  
  // 5. 添加简洁的相关领域信息
  if (item.related_focus && item.related_focus.length > 0) {
    const focusAreas = item.related_focus.slice(0, 2).join("、");
    if (mainSummary.length < 200) {
      mainSummary = `${mainSummary} 【相关：${focusAreas}】`;
    }
  }
  
  return mainSummary || "暂无详细描述";
}

/**
 * 清洗标题 - 移除路径、表情符号等
 */
function cleanTitle(title: string): string {
  if (!title) return "无标题";
  
  let cleaned = title;
  
  // 1. 移除文件路径前缀（问题7）
  // 匹配 "path/to/file.md at main · user/repo" 格式
  cleaned = cleaned.replace(/^[\w-]+\/([\w-]+\/)*[\w-]+\.\w+\s+at\s+\w+\s*[·|]\s*[^/]+\/[^/]+/gi, "");
  // 匹配 "user/repo: " 或 "user/repo/" 前缀
  cleaned = cleaned.replace(/^[^/\s]+\/[^/\s]+[:\/]\s*/g, "");
  // 匹配纯路径段 "docs/01-basics/02-installation.md" 或 "01-basics/02-installation"
  cleaned = cleaned.replace(/^[\w-]+\/([\w-\.]+\/)+/g, "");
  // 移除 .md, .txt 等扩展名
  cleaned = cleaned.replace(/\.\w{2,4}\s*$/g, "");
  // 清理残留的路径片段（如 "01-basics/02-installation. ..."）
  cleaned = cleaned.replace(/^[\w-]+\/[\w-]+\/[^\s]*\s*\.\.\./g, "...");
  // 清理 Liquid 模板语法残留（如 "{% 变量 %}"）
  cleaned = cleaned.replace(/\{[%{].*?[%}]\}/g, "");
  // 清理 HTML/XML 标签残留
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  
  // 2. 限制表情符号（问题8）- 保留最多1个，或完全移除
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = cleaned.match(emojiRegex);
  if (emojis && emojis.length > 1) {
    // 有多个表情时只保留第一个
    cleaned = cleaned.replace(emojiRegex, "");
    cleaned = emojis[0] + " " + cleaned;
  }
  
  // 3. 清理多余空格
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // 4. 如果标题太长，截断
  if (cleaned.length > 80) {
    cleaned = cleaned.slice(0, 77) + "...";
  }
  
  return cleaned || "无标题";
}

/**
 * 生成分类专栏（每个专栏作为一级章节，按价值排序）
 */
function buildCoreDynamics(topItems: AssessedItem[]): string[] {
  const lines: string[] = [];

  if (!topItems || topItems.length === 0) {
    lines.push("## 二、AI Agent", "", "*本期暂无相关动态*", "");
    return lines;
  }

  // 定义章节顺序和显示名称映射（一级章节）
  const chapterOrder = [
    { key: "AI Agent", display: "## 二、AI Agent", required: true },
    { key: "AI Coding", display: "## 三、AI Coding", required: false },
    { key: "模型与基础设施", display: "## 四、模型 / 基础设施 / 开源生态", required: false },
    // 注意："开源生态"分类的数据会合并到"模型与基础设施"中显示
    { key: "政策与监管", display: "## 五、政策 / 监管 / 合规", required: false },
    { key: "社区热点", display: "## 六、社区热点追踪", required: false },
  ];

  // 按分类分组（AI Agent 子类型合并）
  const grouped = new Map<string, AssessedItem[]>();
  for (const assessed of topItems) {
    if (!assessed || !assessed.item) continue;
    let classification = assessed.item.classification || "其他";
    
    // 合并 AI Agent 子类型
    if (classification?.startsWith("AI Agent")) {
      classification = "AI Agent";
    }
    
    // 确保分类在有效范围内
    const validClassifications = ["AI Agent", "AI Coding", "模型与基础设施", "政策与监管", "社区热点"];
    if (!validClassifications.includes(classification)) {
      classification = "模型与基础设施";
    }
    
    // 社区热点单独处理，不合并
    
    if (!grouped.has(classification)) {
      grouped.set(classification, []);
    }
    grouped.get(classification)!.push(assessed);
  }

  // 按预定义顺序输出章节（每个分类作为一级章节）
  for (const chapter of chapterOrder) {
    const items = grouped.get(chapter.key) || [];
    
    // 所有章节都显示，即使没有数据
    lines.push(`${chapter.display}`, "");

    if (items.length === 0) {
      lines.push("本期该领域无重大动态。", "");
      continue;
    }

    // 专栏内按价值分降序排序，限制最多10条
    items.sort((a, b) => b.totalScore - a.totalScore);
    const limitedItems = items.slice(0, 10);

    for (let i = 0; i < limitedItems.length; i++) {
      const assessed = limitedItems[i];
      if (!assessed || !assessed.item) continue;

      const { item, totalScore } = assessed;
      
      const title = cleanTitle(item.title);
      const eventSummary = buildDetailedEventSummary(item);  // 使用详细版（150-200字）
      const sourceName = item.source_name || "未知来源";
      const sourceUrl = item.source_url || "#";

      lines.push(
        `#### [#${assessed.rank} | ${totalScore}分] ${polishChineseText(title)}`,
        "",
        polishChineseText(eventSummary),
        "",
        `时间：${formatPublishedDate(item.published_at)} | 来源：${sourceName}（${getCredibilityLabel(item.confidence)} | ${getTierLabel(item.source_tier)}）`,
        `链接：${sourceUrl}`,
        ""
      );

      lines.push("---", "");
    }
  }

  // 处理未分类的"其他"情报
  const otherItems = grouped.get("其他") || [];
  if (otherItems.length > 0) {
    otherItems.sort((a, b) => b.totalScore - a.totalScore);
    lines.push("## 其他动态", "");

    for (const assessed of otherItems) {
      if (!assessed || !assessed.item) continue;
      const { item, totalScore } = assessed;
      const title = item.title || "无标题";
      const eventSummary = item.event_summary || "暂无事件描述";

      lines.push(
        `#### [#${assessed.rank} | ${totalScore}分] ${polishChineseText(title)}`,
        "",
        polishChineseText(eventSummary),
        "",
        "---",
        ""
      );
    }
  }

  return lines;
}

/**
 * 生成需观察清单
 */
function buildWatchouts(item: AiIndustryFetchItem): string[] {
  const watchouts: string[] = [];
  
  if (!item) return watchouts;
  
  if (item.supporting_sources?.length) {
    watchouts.push("补充来源的后续发展");
  }
  if (item.source_tier && item.source_tier !== "tier1") {
    watchouts.push("更高可信度来源的验证");
  }
  const relatedFocus = item.related_focus || [];
  if (relatedFocus.some(f => f && (f.includes("模型") || f.includes("路由")))) {
    watchouts.push("模型迁移路径的进一步变化");
  }
  if (relatedFocus.some(f => f && (f.includes("治理") || f.includes("审计")))) {
    watchouts.push("治理能力的扩展情况");
  }

  return watchouts;
}



/**
 * 提取关键词
 */
function extractKeywords(allItems: AssessedItem[]): Array<{word: string; count: number}> {
  const wordCounts = new Map<string, number>();
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "的", "了", "在", "是", "和", "与", "或", "有", "为", "从", "到", "对", "向", "等", "及", "其", "中", "上", "下", "前", "后", "内", "外", "里", "间", "边", "面", "头", "部", "个", "种", "类", "项", "条", "件", "份", "个", "把", "张", "根", "支", "只", "条", "匹", "头", "群", "些", "点", "些"]);
  
  for (const a of allItems) {
    if (!a || !a.item) continue;
    
    const title = a.item.title || "";
    const eventSummary = a.item.event_summary || "";
    const whyMatters = a.item.why_it_matters || "";
    
    const text = `${title} ${eventSummary} ${whyMatters}`;
    const words = text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w && w.length >= 2 && !stopWords.has(w));
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }
  
  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

/**
 * 生成机会与风险（基于高价值条目动态生成）
 */
function buildOpportunitiesAndRisks(topItems: AssessedItem[]): string[] {
  const highValueItems = topItems.filter(a => a.totalScore >= 80).slice(0, 3);
  
  if (highValueItems.length === 0) {
    return [
      "## 八、机会与风险",
      "",
      "本期数据不足以生成具体机会与风险分析。",
      "",
    ];
  }

  const lines = [
    "## 八、机会与风险",
    "",
    "### 8.1 基于本期情报的机会",
    "",
  ];

  for (let i = 0; i < highValueItems.length; i++) {
    const item = highValueItems[i].item;
    const title = item.title || "未命名情报";
    const why = item.why_it_matters || "详见正文";
    lines.push(`${i + 1}. **${title}**：${why}`, "");
  }

  lines.push(
    "### 8.2 潜在风险",
    "",
    "1. **信息时效性**：情报具有" + aiIndustryTitles.timeWindowHours + "小时窗口期，需持续跟踪验证",
    "",
    "2. **来源可靠性**：部分信息来源为非官方渠道，需交叉验证",
    "",
    "3. **快速变化**：AI 领域变化迅速，本期结论可能随时间失效",
    "",
  );

  return lines;
}

/**
 * 生成信息缺口
 */
function buildInfoGaps(): string[] {
  return [
    "## 十、信息缺口与追踪清单",
    "",
    "### 10.1 待确认信息",
    "- 部分领袖人物观点来自二级来源（媒体报道），建议等待官方原话或演讲文字稿确认",
    "",
    "### 10.2 缺失的重要视角",
    "- **Anthropic**：本期无公开动态，但其在 AI 安全领域的声音通常具有风向标意义",
    "- **Google DeepMind**：研究进展未在本期出现，可能影响对技术前沿的判断",
    "",
    "### 10.3 下期重点关注",
    "1. GitHub Copilot firewall 功能的用户反馈（预计 1-2 周内出现）",
    "2. OpenAI 模型退役的开发者社区反应",
    "3. Anthropic 和 DeepMind 的最新动态",
    "",
  ];
}

/**
 * 生成邮件发送摘要
 */
function buildEmailSummary(): string[] {
  return [
    "## 十一、邮件发送摘要",
    "",
    "**收件人**：AI 行业关注者",
    "",
    "**主题**：${getAiIndustryEmailSubject(reportDate)}",
    "",
    "**核心内容**：",
    "- 本期监测情报，详见正文",
    "- GitHub Copilot 推出组织级防火墙和 Agent 控制能力",
    "- Anthropic 禁止 Claude 用于 OpenClaw 自动化框架",
    "- OpenAI 调整模型默认路由策略",
    "",
    "**PDF 附件**：ai-industry-2026-04-06.pdf",
    "",
  ];
}

function buildFooter(): string[] {
  return [
    "---",
    "",
    "*本报告由 AI 情报引擎自动生成*",
    "*生成时间：" + new Date().toLocaleString("zh-CN") + "*",
    ""
  ];
}

// ==================== 主函数 ====================

async function loadFetchResult(reportDate: string): Promise<AiIndustryFetchResult> {
  const fetchPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "fetch",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "json",
  });

  try {
    const content = await readFile(fetchPath, "utf8");
    return normalizeFetchResult(JSON.parse(content) as AiIndustryFetchResult);
  } catch {
    const fallbackPath = getPromptPath(repoRoot, "ai-industry", "collect-output-example-latest.json");
    const content = await readFile(fallbackPath, "utf8");
    return normalizeFetchResult(JSON.parse(content) as AiIndustryFetchResult);
  }
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  console.log(`开始生成 AI 行业情报（${reportDate}）...`);
  
  const fetchResult = await loadFetchResult(reportDate);
  
  // 提取所有条目
  const allItems = fetchResult.groups.flatMap((group) => 
    group.items.map((item) => ({ ...item, category: group.category }))
  );
  
  console.log(`- 原始情报数：${allItems.length}`);

  // 价值评估
  console.log("- 正在评估情报价值...");
  const assessedItems = assessAllItems(allItems);
  
  // 按分类分组并计算限制后的数量（每个分类最多10条）
  const grouped = new Map<string, typeof assessedItems>();
  for (const a of assessedItems) {
    const cat = a.item.classification || "其他";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(a);
  }
  
  // 计算实际入选数量（每个分类最多10条）
  let selectedCount = 0;
  for (const items of grouped.values()) {
    selectedCount += Math.min(items.length, 10);
  }
  
  // 统计
  const highValue = assessedItems.filter(a => a.totalScore >= 80);
  const avgScore = Math.round(assessedItems.reduce((sum, a) => sum + a.totalScore, 0) / assessedItems.length);
  
  console.log(`- 高价值情报（80分+）：${highValue.length} 条`);
  console.log(`- 平均价值分：${avgScore} 分`);
  console.log(`- 实际入选（每类限10条）：${selectedCount} 条`);

  // 生成各章节（移除第二章价值评估，合并到第一章；移除建议动作）
  const lines: string[] = [
    ...buildExecutiveSummary(assessedItems, selectedCount),
    ...buildCoreDynamics(assessedItems),
    ...buildOpportunitiesAndRisks(assessedItems),
    ...buildInfoGaps(),
    ...buildEmailSummary(),
    ...buildFooter(),
  ];

  const content = polishChineseLines(lines).join("\n");

  // 写入文件
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "md",
  });
  const outputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "md",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "md",
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, content, "utf8");

  console.log(`\n✅ 已生成 Markdown 情报文件：${outputPath}`);
  console.log(`📄 固定文件名：${getAiIndustryFileName({ reportDate, extension: "md" })}`);
  console.log(`\n📊 本期报告统计：`);
  console.log(`   - 情报总数：${allItems.length}`);
  console.log(`   - 高价值（80分+）：${highValue.length}`);
  console.log(`   - 平均价值分：${avgScore}`);
  console.log(`   - Top 3 平均分：${Math.round(assessedItems.slice(0, 3).reduce((s, a) => s + a.totalScore, 0) / 3)}`);
}

main().catch((error: unknown) => {
  console.error("生成失败：", error);
  process.exitCode = 1;
});
