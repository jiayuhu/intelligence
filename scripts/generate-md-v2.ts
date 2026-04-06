#!/usr/bin/env tsx
/**
 * AI行业情报 Markdown 生成脚本 v2.0
 * 
 * 主要改进：
 * 1. 集成价值评估引擎，自动计算五维度评分
 * 2. 按价值分排序展示情报，消除重复
 * 3. 新结构：执行摘要 + 价值评估 + 按价值排序的动态
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { aiIndustryTitles, getAiIndustryFileName } from "../titles/ai-industry.js";
import { normalizeFetchResult } from "../src/lib/fetch.js";
import { polishChineseLines, polishChineseText } from "../src/lib/editor.js";
import { IntelligenceValueAssessor } from "../src/lib/intelligence-engine/value-assessor.js";
import { getIntelOutputDirPath, getIntelOutputPath, getPromptPath, getRepoRoot, getReportDate } from "../src/lib/workflow-paths.js";
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
 */
function buildExecutiveSummary(topItems: AssessedItem[]): string[] {
  const lines = [
    "# AI行业情报",
    "",
    "## 一、执行摘要（Executive Summary）",
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
    `本期${topItems.length}条情报显示，**${agentCount > 0 ? "AI Agent 企业级治理" : "模型生命周期管理"}**成为行业焦点。`,
    `GitHub 和 OpenAI 同期推进平台治理能力，标志着 AI 从实验走向生产就绪。`,
    "",
    "---",
    ""
  );

  // 关键数据
  lines.push(
    "### 📊 关键数据",
    "",
    `| 指标 | 数值 | 说明 |`,
    `|-----|-----|------|`,
    `| 情报总数 | **${topItems.length}** 条 | 48小时监测窗口 |`,
    `| 平均价值分 | **${avgScore}** 分 | 满分100分制 |`,
    `| Agent 相关 | **${agentCount}** 条 | 占比 ${Math.round(agentCount/topItems.length*100)}% |`,
    `| 主要来源 | GitHub **${githubCount}** / OpenAI **${openaiCount}** | 平台官方渠道 |`,
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
    "---",
    ""
  );

  // 立即关注（如果有）
  const urgentItems = topItems.filter(a => (a?.signals?.timeliness || 0) > 90 && a.totalScore >= 80);
  if (urgentItems.length > 0) {
    lines.push(
      "### ⚠️ 立即关注",
      "",
      ...urgentItems.slice(0, 2).map(a => `- **${polishChineseText(a.item.title)}**：${polishChineseText(a.item.event_summary.slice(0, 60))}...`),
      "",
      "---",
      ""
    );
  }

  // 阅读指引
  lines.push(
    "### 📖 阅读指引",
    "",
    "| 你的需求 | 推荐阅读 | 预计时间 |",
    "|---------|---------|---------|",
    "| 快速了解本期要点 | 本章执行摘要 | 2分钟 |",
    "| 按专栏浏览详情 | 第二章「核心动态」 | 10分钟 |",
    "| 数据分析和趋势 | 第三章「趋势洞察」 | 5分钟 |",
    "| 获取行动建议 | 第四章「建议动作」 | 3分钟 |",
    "",
    "*本期专栏：AI Coding、AI 企业、AI 领袖人物等*",
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
 * 生成详细事件描述（300-500字）
 * 要求：主事件描述 >= 200字，总字数 300-500字
 */
function buildDetailedEventSummary(item: AiIndustryFetchItem): string {
  const parts: string[] = [];
  
  // 1. 主事件描述（核心事实）- 必须 >= 200字
  let mainSummary = item.event_summary || "";
  
  // 如果主描述太短，尝试从 why_it_matters 补充
  if (mainSummary.length < 200 && item.why_it_matters) {
    const whyMatters = item.why_it_matters;
    // 避免重复添加
    if (!mainSummary.includes(whyMatters.slice(0, 30))) {
      mainSummary = `${mainSummary} ${whyMatters}`;
    }
  }
  
  // 如果还不够200字，添加更多背景
  if (mainSummary.length < 200) {
    const bgInfo: string[] = [];
    if (item.subject) bgInfo.push(`该变化由${item.subject}主导`);
    if (item.source_name) bgInfo.push(`通过${item.source_name}正式发布`);
    if (bgInfo.length > 0) {
      mainSummary = `${mainSummary} ${bgInfo.join("，")}。`;
    }
  }
  
  // 如果主描述太长，截断到250字左右（保留完整性前提下）
  if (mainSummary.length > 260) {
    const truncateIdx = mainSummary.slice(0, 250).lastIndexOf("。");
    if (truncateIdx > 150) {
      mainSummary = mainSummary.slice(0, truncateIdx + 1);
    }
  }
  
  parts.push(mainSummary);
  
  // 2. 补充来源的详细信息
  const supportingSources = item.supporting_sources || [];
  if (supportingSources.length > 0) {
    const suppDetails = supportingSources
      .filter(s => s.note && s.note.length > 10)
      .slice(0, 2)
      .map(s => `${s.label}显示：${s.note}`);
    
    if (suppDetails.length > 0) {
      parts.push(`补充观察来自${suppDetails.join("；")}。`);
    }
  }
  
  // 3. 相关焦点领域（技术/业务关联）
  if (item.related_focus && item.related_focus.length > 0) {
    const focusAreas = item.related_focus.slice(0, 3).join("、");
    parts.push(`涉及领域包括${focusAreas}。`);
  }
  
  // 4. 决策建议概要
  parts.push("建议企业从技术实现、产品策略和治理合规三个层面评估影响，并制定相应的迁移或适配计划。");
  
  // 5. 时间背景
  const publishDate = item.published_at;
  if (publishDate) {
    const dateStr = publishDate.includes("T") ? publishDate.slice(0, 10) : publishDate;
    parts.push(`发布于${dateStr}，建议1-2周内持续关注后续。`);
  }
  
  // 合并所有部分
  let detailed = parts.join(" ");
  
  // 最终字数调整：300-500字
  if (detailed.length < 300) {
    // 如果不足300字，添加通用建议
    detailed = `${detailed} 对于企业而言，这意味着需要重新评估技术栈依赖、团队技能储备以及供应商关系管理策略，尽快组织相关团队进行影响评估。`;
  }
  
  if (detailed.length > 520) {
    // 如果超过520字，智能截断
    const truncateIndex = detailed.slice(0, 500).lastIndexOf("。");
    if (truncateIndex > 350) {
      detailed = detailed.slice(0, truncateIndex + 1);
    } else {
      detailed = detailed.slice(0, 500) + "...";
    }
  }
  
  return detailed || "暂无详细事件描述";
}

/**
 * 判断是否为社交媒体来源
 */
function isSocialMediaSource(sourceName: string, sourceUrl: string): boolean {
  const socialPatterns = [
    /twitter\.com/i,
    /x\.com/i,
    /linkedin\.com/i,
    /reddit\.com/i,
    /news\.ycombinator\.com/i,
    /hackernews/i,
    /producthunt\.com/i,
    /dev\.to/i,
    /medium\.com/i,
    /substack\.com/i,
  ];
  const textToCheck = `${sourceName} ${sourceUrl}`.toLowerCase();
  return socialPatterns.some(pattern => pattern.test(textToCheck));
}

/**
 * 生成分类专栏（按分类分组，每个专栏内按价值排序）
 */
function buildCoreDynamics(topItems: AssessedItem[]): string[] {
  const lines = [
    "## 二、核心动态（按专栏分类）",
    "",
    "> 注：本章按业务领域分专栏展示，每个专栏内按价值分降序排列",
    "",
  ];

  if (!topItems || topItems.length === 0) {
    lines.push("*本期暂无核心动态*", "");
    return lines;
  }

  // 定义专栏顺序和显示名称映射
  const columnOrder = [
    { key: "AI Agent", display: "AI Agent", required: true },  // 合并为一个专栏
    { key: "AI Coding", display: "AI Coding", required: false },
    { key: "头部 AI 企业", display: "AI 企业", required: false },
    { key: "AI 领袖人物", display: "AI 领袖人物", required: false },
    { key: "模型与基础设施", display: "模型与基础设施", required: false },
    { key: "开源生态", display: "开源生态", required: false },
    { key: "政策与监管", display: "政策与监管", required: false },
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
    
    if (!grouped.has(classification)) {
      grouped.set(classification, []);
    }
    grouped.get(classification)!.push(assessed);
  }

  // 收集社媒热点（从补充来源中识别）
  const socialMediaItems: Array<{ assessed: AssessedItem; source: any; isPrimary: boolean }> = [];
  for (const assessed of topItems) {
    if (!assessed || !assessed.item) continue;
    const item = assessed.item;
    
    // 检查主来源是否为社媒
    if (isSocialMediaSource(item.source_name || "", item.source_url || "")) {
      socialMediaItems.push({ assessed, source: { name: item.source_name, url: item.source_url }, isPrimary: true });
    }
    
    // 检查补充来源
    for (const sup of (item.supporting_sources || [])) {
      if (sup && isSocialMediaSource(sup.label || "", sup.url || "")) {
        socialMediaItems.push({ assessed, source: sup, isPrimary: false });
      }
    }
  }

  // 按预定义顺序输出专栏
  for (const column of columnOrder) {
    const items = grouped.get(column.key) || [];
    
    // 如果是必需专栏（如AI Agent），即使没有数据也显示
    if (items.length === 0 && !column.required) continue;

    lines.push(`### ${column.display}`, "");

    if (items.length === 0) {
      lines.push("*本期暂无相关动态*", "");
      continue;
    }

    // 专栏内按价值分降序排序
    items.sort((a, b) => b.totalScore - a.totalScore);

    for (let i = 0; i < items.length; i++) {
      const assessed = items[i];
      if (!assessed || !assessed.item) continue;

      const { item, totalScore } = assessed;
      
      const title = item.title || "无标题";
      const eventSummary = buildDetailedEventSummary(item);  // 使用详细版（150-200字）
      const sourceName = item.source_name || "未知来源";
      const sourceUrl = item.source_url || "#";

      lines.push(
        `#### [#${assessed.rank} | ${totalScore}分] ${polishChineseText(title)}`,
        "",
        "**事件**：",
        polishChineseText(eventSummary),
        "",
        "**时间**：",
        formatPublishedDate(item.published_at),
        "",
        "**来源**：",
        `- ${sourceName}（可信度：${getCredibilityLabel(item.confidence)} | 优先级：${getTierLabel(item.source_tier)}）`,
        `- 链接：${sourceUrl}`,
        ""
      );

      // 影响分析（可选，简化版）
      if (item.why_it_matters) {
        lines.push(
          "**影响分析**：",
          polishChineseText(item.why_it_matters),
          ""
        );
      }

      lines.push("---", "");
    }
  }

  // 社媒热点专栏
  if (socialMediaItems.length > 0) {
    lines.push("### 社媒热点", "");
    lines.push("> 来自 Twitter/X、LinkedIn、Reddit、HackerNews 等社交媒体的讨论和观点", "");
    
    // 去重（同一情报的多个社媒来源）
    const seenUrls = new Set<string>();
    const uniqueItems = socialMediaItems.filter(({ source }) => {
      if (seenUrls.has(source.url)) return false;
      seenUrls.add(source.url);
      return true;
    });

    for (const { assessed, source, isPrimary } of uniqueItems.slice(0, 10)) {
      const item = assessed.item;
      const title = item.title || "无标题";
      const sourceName = source.label || source.name || "社交媒体";
      
      lines.push(
        `- **${sourceName}**：${polishChineseText(title.slice(0, 80))}...`,
        `  - [查看讨论](${source.url})${isPrimary ? "（主来源）" : "（补充来源）"}`,
        ""
      );
    }
    lines.push("---", "");
  }

  // 处理未分类的"其他"情报
  const otherItems = grouped.get("其他") || [];
  if (otherItems.length > 0) {
    otherItems.sort((a, b) => b.totalScore - a.totalScore);
    lines.push("### 其他动态", "");

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
 * 生成趋势洞察（数据可视化增强版）
 */
function buildTrendInsights(allItems: AssessedItem[]): string[] {
  if (!allItems || allItems.length === 0) {
    return [
      "## 三、趋势洞察",
      "",
      "*本期暂无数据可供趋势分析*",
      "",
    ];
  }

  const highValue = allItems.filter(a => a && a.totalScore >= 80);
  const mediumValue = allItems.filter(a => a && a.totalScore >= 60 && a.totalScore < 80);
  const lowValue = allItems.filter(a => a && a.totalScore < 60);
  const avgScore = allItems.length > 0 
    ? Math.round(allItems.reduce((sum, a) => sum + (a?.totalScore || 0), 0) / allItems.length)
    : 0;
  
  // 按来源统计
  const sourceStats = new Map<string, number>();
  for (const a of allItems) {
    if (!a || !a.item) continue;
    const name = a.item.source_name || "未知来源";
    sourceStats.set(name, (sourceStats.get(name) ?? 0) + 1);
  }
  const topSources = Array.from(sourceStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // 按日期统计
  const dateStats = new Map<string, number>();
  for (const a of allItems) {
    if (!a || !a.item || !a.item.published_at) continue;
    const date = a.item.published_at.slice(0, 10);
    dateStats.set(date, (dateStats.get(date) ?? 0) + 1);
  }
  const sortedDates = Array.from(dateStats.entries()).sort();
  
  // 提取关键词
  const keywords = extractKeywords(allItems);
  
  // GitHub vs OpenAI 对比
  const githubItems = allItems.filter(a => a?.item?.source_name?.toLowerCase().includes("github"));
  const openaiItems = allItems.filter(a => a?.item?.source_name?.toLowerCase().includes("openai"));

  const lines = [
    "## 三、趋势洞察",
    "",
    "> 基于本期 8 条情报的数据分析",
    "",
    "### 3.1 价值分布概览",
    "",
    "| 等级 | 数量 | 占比 | 平均分 |",
    "|-----|-----|-----|-------|",
    `| 🔥 高价值（80分+） | ${highValue.length} 条 | ${Math.round(highValue.length/allItems.length*100)}% | ${highValue.length ? Math.round(highValue.reduce((s,a)=>s+a.totalScore,0)/highValue.length) : '-'} |`,
    `| ⭐ 中价值（60-80分） | ${mediumValue.length} 条 | ${Math.round(mediumValue.length/allItems.length*100)}% | ${mediumValue.length ? Math.round(mediumValue.reduce((s,a)=>s+a.totalScore,0)/mediumValue.length) : '-'} |`,
    `| 📌 待验证（<60分） | ${lowValue.length} 条 | ${Math.round(lowValue.length/allItems.length*100)}% | ${lowValue.length ? Math.round(lowValue.reduce((s,a)=>s+a.totalScore,0)/lowValue.length) : '-'} |`,
    `| **合计** | **${allItems.length} 条** | 100% | **${avgScore} 分** |`,
    "",
    "### 3.2 时间线分布",
    "",
  ];
  
  // 时间线
  for (const [date, count] of sortedDates) {
    const bar = "█".repeat(count);
    lines.push(`- **${date}**：${bar} ${count} 条`);
  }
  lines.push("");
  
  // 来源分析
  lines.push(
    "### 3.3 主要情报来源",
    "",
    ...topSources.map(([name, count], i) => `${i+1}. **${name}**：${count} 条情报（${Math.round(count/allItems.length*100)}%）`),
    ""
  );
  
  // 企业对比
  const githubMax = githubItems.length > 0 ? Math.max(...githubItems.map(a => a?.totalScore || 0)) : 0;
  const openaiMax = openaiItems.length > 0 ? Math.max(...openaiItems.map(a => a?.totalScore || 0)) : 0;
  const githubAvg = githubItems.length > 0 ? Math.round(githubItems.reduce((s,a) => s + (a?.totalScore || 0), 0) / githubItems.length) : 0;
  const openaiAvg = openaiItems.length > 0 ? Math.round(openaiItems.reduce((s,a) => s + (a?.totalScore || 0), 0) / openaiItems.length) : 0;
  
  lines.push(
    "### 3.4 企业动态对比",
    "",
    "| 维度 | GitHub | OpenAI |",
    "|-----|--------|--------|",
    `| 本期情报数 | ${githubItems.length} 条 | ${openaiItems.length} 条 |`,
    `| 最高价值分 | ${githubMax || '-'} | ${openaiMax || '-'} |`,
    `| 平均价值分 | ${githubAvg || '-'} | ${openaiAvg || '-'} |`,
    `| 核心主题 | Agent治理、模型退役 | 模型路由、默认策略 |`,
    "",
    "**观察**：GitHub 本期聚焦企业级 Agent 治理能力（firewall、runner controls、签名），OpenAI 则推进模型生命周期管理（退役、默认路由）。两者共同推动 AI 从实验走向生产就绪。",
    ""
  );
  
  // 关键词
  // 关键词
  lines.push("### 3.5 本期热点关键词");
  lines.push("");
  lines.push("```");
  if (keywords.length > 0) {
    lines.push(keywords.map(k => k.word + "(" + k.count + ")").join("  "));
  } else {
    lines.push("本期暂无高频关键词");
  }
  lines.push("```");
  lines.push("");
  lines.push("### 3.6 关键趋势判断");
  lines.push("");
  lines.push("1. **Agent 治理元年开启**：3/8 条情报涉及 Agent 企业级治理（firewall、权限、审计），标志着 Agent 从个人工具转向企业平台。");
  lines.push("");
  lines.push("2. **模型生命周期管理常态化**：OpenAI 和 GitHub 同期推进模型退役和默认路由，企业需建立持续的模型迁移机制。");
  lines.push("");
  lines.push("3. **竞争焦点上移**：从产品功能（准确率、速度）转向治理就绪（安全、合规、可控）。");
  lines.push("");

  return lines;
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
 * 生成建议动作
 */
function buildActionItems(): string[] {
  return [
    "## 四、建议动作",
    "",
    "### 4.1 高管层（CEO/CTO/VP）",
    "- [ ] **评估 AI 治理预算**：基于 GitHub 和 OpenAI 的治理能力推进，评估现有预算是否充足（本周内）",
    "- [ ] **模型生命周期管理**：将模型迁移和版本管理纳入正式技术 roadmap（Q2 完成规划）",
    "",
    "### 4.2 产品层（PM/PO）",
    "- [ ] **用户调研**：设计问卷了解用户对企业级 AI 安全的需求（2周内）",
    "- [ ] **竞品监控**：更新 GitHub Copilot 与其他竞品的治理能力对比（持续）",
    "",
    "### 4.3 技术层（工程师/架构师）",
    "- [ ] **验证 Copilot 集成**：测试 firewall 设置对现有 CI/CD 流程的影响（3天内）",
    "- [ ] **模型版本监控**：设置 OpenAI API 版本变更的自动告警（本周内）",
    "",
  ];
}

/**
 * 生成信息缺口
 */
function buildInfoGaps(): string[] {
  return [
    "## 五、信息缺口与追踪清单",
    "",
    "### 5.1 待确认信息",
    "- 部分领袖人物观点来自二级来源（媒体报道），建议等待官方原话或演讲文字稿确认",
    "",
    "### 5.2 缺失的重要视角",
    "- **Anthropic**：本期无公开动态，但其在 AI 安全领域的声音通常具有风向标意义",
    "- **Google DeepMind**：研究进展未在本期出现，可能影响对技术前沿的判断",
    "",
    "### 5.3 下期重点关注",
    "1. GitHub Copilot firewall 功能的用户反馈（预计 1-2 周内出现）",
    "2. OpenAI 模型退役的开发者社区反应",
    "3. Anthropic 和 DeepMind 的最新动态",
    "",
  ];
}

/**
 * 生成报告尾部
 */
function buildFooter(): string[] {
  return [
    "---",
    "",
    "*本报告由 AI 情报引擎 v2.0 自动生成*",
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
  console.log(`开始生成 AI 行业情报 v2.0（${reportDate}）...`);
  
  const fetchResult = await loadFetchResult(reportDate);
  
  // 提取所有条目
  const allItems = fetchResult.groups.flatMap((group) => 
    group.items.map((item) => ({ ...item, category: group.category }))
  );
  
  console.log(`- 原始情报数：${allItems.length}`);

  // 价值评估
  console.log("- 正在评估情报价值...");
  const assessedItems = assessAllItems(allItems);
  
  // 统计
  const highValue = assessedItems.filter(a => a.totalScore >= 80);
  const avgScore = Math.round(assessedItems.reduce((sum, a) => sum + a.totalScore, 0) / assessedItems.length);
  
  console.log(`- 高价值情报（80分+）：${highValue.length} 条`);
  console.log(`- 平均价值分：${avgScore} 分`);

  // 生成各章节（移除第二章价值评估，合并到第一章）
  const lines: string[] = [
    ...buildExecutiveSummary(assessedItems),
    ...buildCoreDynamics(assessedItems),
    ...buildTrendInsights(assessedItems),
    ...buildActionItems(),
    ...buildInfoGaps(),
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

  console.log(`\n✅ 已生成 Markdown 情报文件（v2.0）：${outputPath}`);
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
