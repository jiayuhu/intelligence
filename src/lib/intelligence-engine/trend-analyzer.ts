/**
 * 趋势关联分析模块
 * 
 * 功能：
 * 1. 跨事件模式识别
 * 2. 趋势强度评估
 * 3. 预测性洞察生成
 */

import type { AiIndustryFetchItem, AiIndustryFetchResult } from "../../types/ai-industry.js";

export interface TrendInsight {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  impact: "strategic" | "tactical" | "observational";
  timeframe: "immediate" | "short_term" | "medium_term";
  relatedItems: string[]; // source_url 列表
}

export interface CrossEventPattern {
  pattern: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  consistency: number; // 0-100，模式一致性
}

export interface TrendAnalysisResult {
  insights: TrendInsight[];
  patterns: CrossEventPattern[];
  emergingTopics: string[];
  decliningTopics: string[];
}

// 预定义的趋势模式识别规则
const TREND_PATTERNS: Array<{
  id: string;
  name: string;
  keywords: string[];
  minMatches: number;
  relatedKeywords: string[][]; // 需要同时满足的关键词组合
}> = [
  {
    id: "governance-focus",
    name: "治理控制面成为 AI 产品标配",
    keywords: ["firewall", "runner", "控制", "治理", "审计", "权限", "组织级"],
    minMatches: 3,
    relatedKeywords: [["organization", "enterprise"], ["control", "governance"]],
  },
  {
    id: "model-lifecycle",
    name: "模型生命周期管理常态化",
    keywords: ["退役", "默认模型", "路由", "切换", "迁移", "旧版本"],
    minMatches: 3,
    relatedKeywords: [["deprecat", "退役"], ["默认", "路由"]],
  },
  {
    id: "enterprise-adoption",
    name: "企业级 AI 采用加速",
    keywords: ["企业", "CEO", "采用", "部署", "生产", "管理层", "预算"],
    minMatches: 3,
    relatedKeywords: [["企业", "enterprise"], ["CEO", "管理层"]],
  },
  {
    id: "agent-capabilities",
    name: "AI Agent 能力边界扩展",
    keywords: ["agent", "workflow", "工具调用", "多步骤", "自动化", "编排"],
    minMatches: 3,
    relatedKeywords: [["agent", "工作流"], ["工具", "自动化"]],
  },
  {
    id: "coding-assistant-evolution",
    name: "AI Coding 向全栈发展",
    keywords: ["coding", "IDE", "多文件", "代码生成", "review", "调试"],
    minMatches: 3,
    relatedKeywords: [["coding", "IDE"], ["多文件", "全栈"]],
  },
];

export class TrendAnalyzer {
  private historicalData: AiIndustryFetchItem[] = [];

  /**
   * 分析情报结果中的趋势
   */
  analyze(result: AiIndustryFetchResult): TrendAnalysisResult {
    const allItems = result.groups.flatMap(g => g.items);
    
    // 更新历史数据
    this.addToHistory(allItems);

    return {
      insights: this.generateInsights(allItems),
      patterns: this.identifyPatterns(allItems),
      emergingTopics: this.identifyEmergingTopics(allItems),
      decliningTopics: this.identifyDecliningTopics(allItems),
    };
  }

  /**
   * 生成趋势洞察
   */
  private generateInsights(items: AiIndustryFetchItem[]): TrendInsight[] {
    const insights: TrendInsight[] = [];

    for (const pattern of TREND_PATTERNS) {
      const matches = items.filter(item => 
        this.matchesPattern(item, pattern)
      );

      if (matches.length >= pattern.minMatches) {
        const insight = this.createInsight(pattern, matches);
        if (insight) {
          insights.push(insight);
        }
      }
    }

    // 按置信度排序
    insights.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    return insights.slice(0, 5); // 最多返回 5 条洞察
  }

  /**
   * 判断情报是否匹配模式
   */
  private matchesPattern(
    item: AiIndustryFetchItem, 
    pattern: typeof TREND_PATTERNS[0]
  ): boolean {
    const text = `${item.title} ${item.event_summary} ${item.classification}`.toLowerCase();
    
    // 基础关键词匹配
    const keywordMatches = pattern.keywords.filter(kw => 
      text.includes(kw.toLowerCase())
    ).length;

    if (keywordMatches < 2) return false;

    // 相关关键词组合匹配
    const hasRelatedCombo = pattern.relatedKeywords.some(combo =>
      combo.every(kw => text.includes(kw.toLowerCase()))
    );

    return hasRelatedCombo || keywordMatches >= 3;
  }

  /**
   * 创建趋势洞察
   */
  private createInsight(
    pattern: typeof TREND_PATTERNS[0],
    matches: AiIndustryFetchItem[]
  ): TrendInsight | null {
    if (matches.length === 0) return null;

    // 收集证据
    const evidence = matches.slice(0, 3).map(m => 
      `${m.source_name}：${m.title}`
    );

    // 判断时间跨度
    const dates = matches.map(m => new Date(m.published_at).getTime());
    const timeSpan = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60); // 小时

    // 确定置信度
    const confidence: TrendInsight["confidence"] = 
      matches.length >= 5 && timeSpan <= 24 ? "high" :
      matches.length >= 3 ? "medium" : "low";

    // 确定影响级别
    const impact: TrendInsight["impact"] = 
      pattern.id === "governance-focus" || pattern.id === "enterprise-adoption" 
        ? "strategic" : "tactical";

    // 确定时间框架
    const timeframe: TrendInsight["timeframe"] = 
      timeSpan <= 12 ? "immediate" :
      timeSpan <= 48 ? "short_term" : "medium_term";

    return {
      id: `insight-${pattern.id}-${Date.now()}`,
      title: pattern.name,
      description: this.generateInsightDescription(pattern, matches, timeSpan),
      evidence,
      confidence,
      impact,
      timeframe,
      relatedItems: matches.map(m => m.source_url),
    };
  }

  /**
   * 生成洞察描述
   */
  private generateDescription(
    pattern: typeof TREND_PATTERNS[0],
    matches: AiIndustryFetchItem[],
    timeSpan: number
  ): string {
    const companies = [...new Set(matches.map(m => m.subject))].slice(0, 3);
    const timeDesc = timeSpan <= 24 ? "24小时内" : "48小时内";
    
    return `在${timeDesc}，${companies.join("、")}等多家主体的动态均指向${pattern.name}这一方向，表明该趋势正在从个案向行业共识演进。`;
  }

  /**
   * 识别跨事件模式
   */
  private identifyPatterns(items: AiIndustryFetchItem[]): CrossEventPattern[] {
    const patterns: CrossEventPattern[] = [];

    // 按时间窗口分析
    const timeWindows = this.groupByTimeWindow(items, 12); // 12小时窗口

    for (const window of timeWindows) {
      // 检查是否有相似主题
      const topicGroups = this.groupByTopic(window.items);
      
      for (const [topic, topicItems] of topicGroups) {
        if (topicItems.length >= 2) {
          const dates = topicItems.map(i => new Date(i.published_at).getTime());
          patterns.push({
            pattern: topic,
            occurrences: topicItems.length,
            firstSeen: topicItems[0].published_at,
            lastSeen: topicItems[topicItems.length - 1].published_at,
            consistency: this.calculateConsistency(topicItems),
          });
        }
      }
    }

    return patterns.sort((a, b) => b.occurrences - a.occurrences).slice(0, 5);
  }

  /**
   * 识别新兴主题
   */
  private identifyEmergingTopics(items: AiIndustryFetchItem[]): string[] {
    const topicFrequency: Record<string, number> = {};

    for (const item of items) {
      // 提取关键词作为主题
      const words = `${item.title} ${item.event_summary}`
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);

      for (const word of words) {
        if (this.isSignificantTopic(word)) {
          topicFrequency[word] = (topicFrequency[word] || 0) + 1;
        }
      }
    }

    // 返回出现频率较高的新主题
    return Object.entries(topicFrequency)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * 识别衰退主题
   */
  private identifyDecliningTopics(items: AiIndustryFetchItem[]): string[] {
    // 对比历史数据，识别出现频率下降的主题
    if (this.historicalData.length === 0) return [];

    const recentTopics = this.extractTopics(items);
    const historicalTopics = this.extractTopics(this.historicalData);

    return historicalTopics
      .filter(topic => !recentTopics.includes(topic))
      .slice(0, 3);
  }

  /**
   * 提取主题
   */
  private extractTopics(items: AiIndustryFetchItem[]): string[] {
    const topics = new Set<string>();
    for (const item of items) {
      topics.add(item.classification);
      item.related_focus.forEach(f => topics.add(f));
    }
    return Array.from(topics);
  }

  /**
   * 判断是否为主题词
   */
  private isSignificantTopic(word: string): boolean {
    const stopWords = new Set(["about", "with", "from", "have", "this", "that", "will", "your"]);
    if (stopWords.has(word)) return false;
    
    // 检查是否包含技术关键词
    const techKeywords = ["model", "agent", "api", "cloud", "code", "data", "ai", "llm"];
    return techKeywords.some(kw => word.includes(kw));
  }

  /**
   * 按时间窗口分组
   */
  private groupByTimeWindow(
    items: AiIndustryFetchItem[], 
    windowHours: number
  ): Array<{ start: Date; items: AiIndustryFetchItem[] }> {
    const sorted = [...items].sort(
      (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );

    const windows: Array<{ start: Date; items: AiIndustryFetchItem[] }> = [];
    let currentWindow: AiIndustryFetchItem[] = [];
    let windowStart: Date | null = null;

    for (const item of sorted) {
      const itemTime = new Date(item.published_at);
      
      if (!windowStart || (itemTime.getTime() - windowStart.getTime()) / (1000 * 60 * 60) > windowHours) {
        if (currentWindow.length > 0) {
          windows.push({ start: windowStart!, items: currentWindow });
        }
        windowStart = itemTime;
        currentWindow = [item];
      } else {
        currentWindow.push(item);
      }
    }

    if (currentWindow.length > 0 && windowStart) {
      windows.push({ start: windowStart, items: currentWindow });
    }

    return windows;
  }

  /**
   * 按主题分组
   */
  private groupByTopic(items: AiIndustryFetchItem[]): Map<string, AiIndustryFetchItem[]> {
    const groups = new Map<string, AiIndustryFetchItem[]>();
    
    for (const item of items) {
      const key = item.classification;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return groups;
  }

  /**
   * 计算一致性
   */
  private calculateConsistency(items: AiIndustryFetchItem[]): number {
    // 计算来源等级的一致性
    const tiers = items.map(i => i.source_tier || "tier3");
    const tierCounts: Record<string, number> = {};
    for (const tier of tiers) {
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }
    
    const maxTierCount = Math.max(...Object.values(tierCounts));
    return Math.round((maxTierCount / items.length) * 100);
  }

  /**
   * 添加到历史数据
   */
  private addToHistory(items: AiIndustryFetchItem[]): void {
    this.historicalData.push(...items);
    
    // 保留最近 30 天的数据
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    
    this.historicalData = this.historicalData.filter(
      i => new Date(i.published_at) > cutoff
    );
  }

  /**
   * 生成洞察描述
   */
  private generateInsightDescription(
    pattern: typeof TREND_PATTERNS[0],
    matches: AiIndustryFetchItem[],
    timeSpan: number
  ): string {
    const companies = [...new Set(matches.map(m => m.subject))].slice(0, 3);
    const timeDesc = timeSpan <= 24 ? "24小时内" : "48小时内";
    
    const descriptions: Record<string, string> = {
      "governance-focus": `在${timeDesc}，${companies.join("、")}等多家主体的动态均指向治理控制面成为 AI 产品标配这一方向，表明企业级 AI 的安全与治理正在从可选项变为必选项。`,
      "model-lifecycle": `在${timeDesc}，${companies.join("、")}等持续推动模型路由和生命周期管理，预示着模型版本管理和迁移将成为企业 AI 基础设施的标准能力。`,
      "enterprise-adoption": `在${timeDesc}，${companies.join("、")}等多方表态显示，企业级 AI 采用正在从技术试验转向管理层战略议程，意味着采购和部署节奏将显著加快。`,
      "agent-capabilities": `在${timeDesc}，${companies.join("、")}等在 AI Agent 能力上的持续投入，表明自动化工作流和工具调用正成为下一代 AI 产品的核心差异点。`,
      "coding-assistant-evolution": `在${timeDesc}，${companies.join("、")}等在 AI Coding 领域的动作显示，编程助手正从代码补全向全栈开发协作演进。`,
    };

    return descriptions[pattern.id] || 
      `在${timeDesc}，${companies.join("、")}等多家主体的动态均指向${pattern.name}这一方向，表明该趋势正在从个案向行业共识演进。`;
  }
}

/**
 * 便捷函数：快速分析趋势
 */
export function quickAnalyzeTrends(result: AiIndustryFetchResult): TrendAnalysisResult {
  const analyzer = new TrendAnalyzer();
  return analyzer.analyze(result);
}
