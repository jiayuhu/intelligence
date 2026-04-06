/**
 * 情报价值评估引擎
 * 
 * 核心功能：
 * 1. 多维度情报价值评分（新颖度、影响度、可信度、时效性、相关性）
 * 2. 情报去重与相似度检测
 * 3. 动态阈值筛选
 */

import type { AiIndustryFetchItem, AiIndustryFetchResult } from "../../types/ai-industry.js";

export interface ValueSignal {
  /** 新颖度：0-100，与历史情报的相似度反向 */
  novelty: number;
  /** 影响度：0-100，基于来源权重和事件类型 */
  impact: number;
  /** 可信度：0-100，基于来源等级 */
  credibility: number;
  /** 时效性：0-100，基于发布时间衰减 */
  timeliness: number;
  /** 相关性：0-100，与当前关注主题的匹配 */
  relevance: number;
}

export interface AssessedIntelligence {
  item: AiIndustryFetchItem;
  signals: ValueSignal;
  totalScore: number;
  rank: number;
  reason: string; // 评分理由
}

export interface AssessorConfig {
  weights: {
    novelty: number;
    impact: number;
    credibility: number;
    timeliness: number;
    relevance: number;
  };
  thresholds: {
    minScore: number;      // 最低入选分数
    minCredibility: number; // 最低可信度
    maxAgeHours: number;    // 最大时间跨度
  };
  focusTopics: string[];    // 当前关注主题
}

// 默认配置
export const DEFAULT_ASSESSOR_CONFIG: AssessorConfig = {
  weights: {
    novelty: 0.25,
    impact: 0.30,
    credibility: 0.20,
    timeliness: 0.15,
    relevance: 0.10,
  },
  thresholds: {
    minScore: 60,
    minCredibility: 50,
    maxAgeHours: 48,
  },
  focusTopics: ["AI Agent", "AI Coding", "模型更新", "企业采用"],
};

// 来源影响度权重
const SOURCE_IMPACT_WEIGHTS: Record<string, number> = {
  // P0 级官方来源
  "OpenAI": 100,
  "Anthropic": 100,
  "Google DeepMind": 95,
  "Meta AI": 95,
  "Microsoft": 90,
  "GitHub": 90,
  "NVIDIA": 85,
  "xAI": 85,
  // P1 级重要来源
  "Cursor": 80,
  "LangChain": 75,
  "LlamaIndex": 70,
  "Hugging Face": 70,
  // P2 级媒体
  "TechCrunch": 60,
  "The Information": 65,
  "Bloomberg": 60,
  "Reuters": 60,
  // 社区来源
  "Reddit": 40,
  "Hacker News": 45,
  // 领袖个人
  "Sam Altman": 85,
  "Andrej Karpathy": 80,
  "Yann LeCun": 80,
};

// 事件类型影响权重
const EVENT_TYPE_WEIGHTS: Record<string, number> = {
  "产品发布": 100,
  "模型更新": 95,
  "API 变更": 90,
  "融资": 85,
  "收购": 85,
  "战略合作": 80,
  "人事变动": 75,
  "政策发布": 90,
  "安全公告": 85,
  "研究论文": 70,
  "博客文章": 60,
  "社区讨论": 40,
};

export class IntelligenceValueAssessor {
  private config: AssessorConfig;
  private historicalEmbeddings: Map<string, number[]> = new Map();

  constructor(config: Partial<AssessorConfig> = {}) {
    this.config = { ...DEFAULT_ASSESSOR_CONFIG, ...config };
  }

  /**
   * 评估单条情报的价值
   */
  assessItem(item: AiIndustryFetchItem, allItems: AiIndustryFetchItem[]): ValueSignal {
    return {
      novelty: this.calculateNovelty(item, allItems),
      impact: this.calculateImpact(item),
      credibility: this.calculateCredibility(item),
      timeliness: this.calculateTimeliness(item),
      relevance: this.calculateRelevance(item),
    };
  }

  /**
   * 计算新颖度（基于文本相似度）
   * 0 = 与历史内容几乎相同，100 = 全新内容
   */
  private calculateNovelty(item: AiIndustryFetchItem, allItems: AiIndustryFetchItem[]): number {
    const itemText = `${item.title} ${item.event_summary}`.toLowerCase();
    const itemTokens = this.tokenize(itemText);
    
    let maxSimilarity = 0;
    
    for (const other of allItems) {
      if (other === item) continue;
      
      const otherText = `${other.title} ${other.event_summary}`.toLowerCase();
      const similarity = this.calculateJaccardSimilarity(itemTokens, this.tokenize(otherText));
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    // 相似度 0 = 100分，相似度 1 = 0分
    return Math.round((1 - maxSimilarity) * 100);
  }

  /**
   * 计算影响度
   */
  private calculateImpact(item: AiIndustryFetchItem): number {
    // 来源权重（支持两种格式：source_name 或 primary_source.name）
    const sourceName = item.source_name || (item as any).primary_source?.name || "";
    const subject = item.subject || "";
    
    let sourceWeight = 50; // 默认
    for (const [source, weight] of Object.entries(SOURCE_IMPACT_WEIGHTS)) {
      if (sourceName.includes(source) || subject.includes(source)) {
        sourceWeight = Math.max(sourceWeight, weight);
      }
    }

    // 事件类型权重
    let eventWeight = 50;
    const text = `${item.title} ${item.event_summary}`.toLowerCase();
    for (const [eventType, weight] of Object.entries(EVENT_TYPE_WEIGHTS)) {
      if (text.includes(eventType.toLowerCase())) {
        eventWeight = Math.max(eventWeight, weight);
      }
    }

    // 来源等级调整
    const tierBonus = item.source_tier === "tier1" ? 10 : item.source_tier === "tier2" ? 5 : 0;

    return Math.min(100, Math.round((sourceWeight + eventWeight) / 2 + tierBonus));
  }

  /**
   * 计算可信度
   */
  private calculateCredibility(item: AiIndustryFetchItem): number {
    const baseScore = item.source_tier === "tier1" ? 90 : 
                      item.source_tier === "tier2" ? 70 : 
                      item.source_tier === "tier3" ? 50 : 40;
    
    // 有补充来源验证加分
    const verificationBonus = item.supporting_sources && item.supporting_sources.length > 0 ? 10 : 0;
    
    // 已确认状态加分
    const confirmedBonus = item.status === "confirmed" ? 5 : 0;
    
    return Math.min(100, baseScore + verificationBonus + confirmedBonus);
  }

  /**
   * 计算时效性（时间衰减函数）
   */
  private calculateTimeliness(item: AiIndustryFetchItem): number {
    const now = new Date();
    const published = new Date(item.published_at);
    const ageHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    
    if (ageHours < 0) return 100; // 未来时间，可能是预告
    if (ageHours > 48) return 30; // 超过48小时
    
    // 指数衰减：0h=100, 6h=95, 24h=70, 48h=30
    return Math.round(100 * Math.exp(-ageHours / 30));
  }

  /**
   * 计算相关性（与关注主题匹配）
   */
  private calculateRelevance(item: AiIndustryFetchItem): number {
    const relatedFocus = Array.isArray(item.related_focus) ? item.related_focus.join(" ") : "";
    const text = `${item.classification} ${item.title} ${item.event_summary || ""} ${relatedFocus}`.toLowerCase();
    
    let matchCount = 0;
    for (const topic of this.config.focusTopics) {
      if (text.includes(topic.toLowerCase())) {
        matchCount++;
      }
    }
    
    // AI Agent 细分类别权重提升（重点关注）
    if (item.classification?.startsWith("AI Agent")) {
      matchCount += 5; // Agent相关内容高权重
      // 代码型Agent额外加分（OpenClaw、Devin等）
      if (item.classification === "AI Agent" &&
          (text.includes("openclaw") || 
           text.includes("devin") ||
           text.includes("coding agent"))) {
        matchCount += 3;
      }
    }
    // AI Coding 保持高权重
    if (item.classification === "AI Coding") {
      matchCount += 3;
    }
    
    return Math.min(100, matchCount * 15 + 20);
  }

  /**
   * 计算总分
   */
  calculateTotalScore(signals: ValueSignal): number {
    const { weights } = this.config;
    return Math.round(
      signals.novelty * weights.novelty +
      signals.impact * weights.impact +
      signals.credibility * weights.credibility +
      signals.timeliness * weights.timeliness +
      signals.relevance * weights.relevance
    );
  }

  /**
   * 批量评估并筛选情报
   */
  assessBatch(items: AiIndustryFetchItem[]): AssessedIntelligence[] {
    const assessed = items.map((item) => {
      const signals = this.assessItem(item, items);
      const totalScore = this.calculateTotalScore(signals);
      
      return {
        item,
        signals,
        totalScore,
        rank: 0, // 稍后计算
        reason: this.generateReason(signals, totalScore),
      };
    });

    // 按分数排序
    assessed.sort((a, b) => b.totalScore - a.totalScore);
    
    // 分配排名
    assessed.forEach((a, index) => {
      a.rank = index + 1;
    });

    return assessed;
  }

  /**
   * 筛选高价值情报
   */
  filterHighValue(assessed: AssessedIntelligence[]): AssessedIntelligence[] {
    const { thresholds } = this.config;
    
    return assessed.filter((a) => 
      a.totalScore >= thresholds.minScore &&
      a.signals.credibility >= thresholds.minCredibility
    );
  }

  /**
   * 生成评分理由
   */
  private generateReason(signals: ValueSignal, totalScore: number): string {
    const parts: string[] = [];
    
    if (signals.impact > 80) parts.push("高影响度");
    if (signals.novelty > 80) parts.push("高新颖度");
    if (signals.credibility > 80) parts.push("高可信度");
    if (signals.timeliness > 90) parts.push("时效性强");
    if (signals.relevance > 80) parts.push("高度相关");
    
    if (parts.length === 0) {
      return `综合评分 ${totalScore}，各项指标均衡`;
    }
    
    return `${parts.join("、")}，综合评分 ${totalScore}`;
  }

  /**
   * 文本分词（简化版）
   */
  private tokenize(text: string): Set<string> {
    // 移除标点，分词
    const cleaned = text.replace(/[^\w\s]/g, " ").toLowerCase();
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);
    return new Set(words);
  }

  /**
   * Jaccard 相似度计算
   */
  private calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AssessorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): AssessorConfig {
    return { ...this.config };
  }
}

/**
 * 便捷函数：快速评估情报结果
 */
export function assessIntelligenceResult(
  result: AiIndustryFetchResult,
  config?: Partial<AssessorConfig>
): { 
  assessed: AssessedIntelligence[]; 
  highValue: AssessedIntelligence[];
  summary: {
    total: number;
    highValueCount: number;
    avgScore: number;
    topCategory: string;
  };
} {
  const assessor = new IntelligenceValueAssessor(config);
  const allItems = result.groups.flatMap(g => g.items);
  
  const assessed = assessor.assessBatch(allItems);
  const highValue = assessor.filterHighValue(assessed);
  
  // 计算统计
  const total = allItems.length;
  const highValueCount = highValue.length;
  const avgScore = Math.round(assessed.reduce((sum, a) => sum + a.totalScore, 0) / total);
  
  // 统计各分类的高价值情报数
  const categoryCount: Record<string, number> = {};
  for (const a of highValue) {
    categoryCount[a.item.classification] = (categoryCount[a.item.classification] || 0) + 1;
  }
  const topCategory = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  
  return {
    assessed,
    highValue,
    summary: {
      total,
      highValueCount,
      avgScore,
      topCategory,
    },
  };
}
