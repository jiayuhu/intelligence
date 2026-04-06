/**
 * 情报引擎核心模块
 * 
 * 整合：
 * - 情报价值评估
 * - 智能去重
 * - 智能成稿
 * - 趋势分析
 * - 情报类型注册
 */

export * from "./value-assessor.js";
export * from "./deduplicator.js";
export * from "./draft-engine.js";
export * from "./trend-analyzer.js";
export * from "./intel-registry.js";

import { IntelligenceValueAssessor, assessIntelligenceResult } from "./value-assessor.js";
import { IntelligenceDeduplicator, quickDeduplicate } from "./deduplicator.js";
import { SmartDraftEngine } from "./draft-engine.js";
import { TrendAnalyzer, quickAnalyzeTrends } from "./trend-analyzer.js";
import { intelRegistry, getIntelType, getIntelConfig, listIntelTypes } from "./intel-registry.js";
import type { IIntelType } from "../../types/intel-framework.js";
import type { 
  IntelResult, 
  IntelItem,
  ReaderProfile,
  AssessedIntel,
  IntelDraft,
} from "../../types/intel-framework.js";

export interface ProcessingOptions {
  enableDeduplication: boolean;
  enableScoring: boolean;
  enableTrendAnalysis: boolean;
  readerProfile?: ReaderProfile;
  minScore?: number;
  maxItems?: number;
}

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  enableDeduplication: true,
  enableScoring: true,
  enableTrendAnalysis: true,
  minScore: 60,
  maxItems: 15,
};

export interface ProcessingResult {
  result: IntelResult;
  assessed: AssessedIntel[];
  highValue: AssessedIntel[];
  deduplication?: {
    removed: number;
    duplicates: Array<{ item: IntelItem; reason: string }>;
  };
  trends?: {
    insights: Array<{
      title: string;
      description: string;
      confidence: string;
    }>;
    patterns: Array<{
      pattern: string;
      occurrences: number;
    }>;
  };
  draft?: IntelDraft;
  summary: {
    totalItems: number;
    finalItems: number;
    avgScore: number;
    processingTimeMs: number;
  };
}

/**
 * 情报处理引擎
 * 
 * 整合完整的情报处理流程
 */
export class IntelligenceEngine {
  private assessor: IntelligenceValueAssessor;
  private deduplicator: IntelligenceDeduplicator;
  private draftEngine: SmartDraftEngine;
  private trendAnalyzer: TrendAnalyzer;
  
  constructor() {
    this.assessor = new IntelligenceValueAssessor();
    this.deduplicator = new IntelligenceDeduplicator();
    this.draftEngine = new SmartDraftEngine();
    this.trendAnalyzer = new TrendAnalyzer();
  }
  
  /**
   * 处理情报结果
   */
  process(
    result: IntelResult,
    options: Partial<ProcessingOptions> = {}
  ): ProcessingResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
    
    // 1. 获取情报类型配置
    const config = getIntelType(result.intel_type).config;
    
    // 2. 获取所有条目
    let items = result.groups.flatMap(g => 
      g.items.map(i => ({ ...i, classification: g.category }))
    ) as IntelItem[];
    
    let dedupInfo: ProcessingResult["deduplication"];
    
    // 3. 去重
    if (opts.enableDeduplication) {
      const dedupResult = this.deduplicator.deduplicateBatch(items as any);
      items = dedupResult.unique as any;
      dedupInfo = {
        removed: dedupResult.duplicates.length,
        duplicates: dedupResult.duplicates.map(d => ({
          item: d.item as any,
          reason: d.result.reason,
        })),
      };
    }
    
    // 4. 评分和筛选
    let assessed: AssessedIntel[] = [];
    let highValue: AssessedIntel[] = [];
    
    if (opts.enableScoring) {
      // 转换为通用格式进行评估
      assessed = items.map(item => {
        const signals = this.assessor.assessItem(item as any, items as any);
        return {
          item,
          signals,
          totalScore: this.assessor.calculateTotalScore(signals),
          rank: 0,
          reason: "",
        };
      });
      
      // 排序和筛选
      assessed.sort((a, b) => b.totalScore - a.totalScore);
      assessed.forEach((a, i) => { a.rank = i + 1; });
      
      highValue = assessed.filter(a => a.totalScore >= (opts.minScore || 60));
      
      // 限制数量
      if (opts.maxItems && highValue.length > opts.maxItems) {
        highValue = highValue.slice(0, opts.maxItems);
      }
      
      items = highValue.map(a => a.item);
    }
    
    // 5. 趋势分析
    let trendInfo: ProcessingResult["trends"];
    if (opts.enableTrendAnalysis) {
      const trendResult = this.trendAnalyzer.analyze(result as any);
      trendInfo = {
        insights: trendResult.insights.map(i => ({
          title: i.title,
          description: i.description,
          confidence: i.confidence,
        })),
        patterns: trendResult.patterns.map(p => ({
          pattern: p.pattern,
          occurrences: p.occurrences,
        })),
      };
    }
    
    // 6. 生成草稿（如果有读者画像）
    let draft: IntelDraft | undefined;
    if (opts.readerProfile && highValue.length > 0) {
      const topItem = highValue[0];
      const content = this.draftEngine.generateFullContent({
        item: topItem.item as any,
        relatedItems: highValue.slice(1, 4).map(a => a.item as any),
        readerProfile: opts.readerProfile as any,
        assessment: topItem as any,
      });
      
      draft = {
        sections: [{
          title: "核心建议",
          content: content.decisionImplication,
          priority: 1,
        }],
        highlights: [content.decisionImplication],
        trends: [],
        actions: content.actionItems,
        watchouts: content.watchouts,
      };
    }
    
    // 7. 构建最终结果
    const processingTime = Date.now() - startTime;
    
    // 重新组织分组
    const groupedItems = this.regroupItems(items);
    
    return {
      result: {
        ...result,
        groups: groupedItems,
      },
      assessed,
      highValue,
      deduplication: dedupInfo,
      trends: trendInfo,
      draft,
      summary: {
        totalItems: result.groups.flatMap(g => g.items).length,
        finalItems: items.length,
        avgScore: assessed.length > 0 
          ? Math.round(assessed.reduce((sum, a) => sum + a.totalScore, 0) / assessed.length)
          : 0,
        processingTimeMs: processingTime,
      },
    };
  }
  
  /**
   * 重新分组条目
   */
  private regroupItems(items: IntelItem[]): Array<{ category: string; summary: string; items: IntelItem[] }> {
    const groups = new Map<string, IntelItem[]>();
    
    for (const item of items) {
      const category = item.classification as string || "未分类";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    }
    
    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      summary: `${items.length} 条关于 ${category} 的情报`,
      items,
    }));
  }
}

/**
   * 便捷函数：一键处理情报
   */
export function processIntelligence(
  result: IntelResult,
  options?: Partial<ProcessingOptions>
): ProcessingResult {
  const engine = new IntelligenceEngine();
  return engine.process(result, options);
}

// 重新导出注册表相关
export { intelRegistry, getIntelType, getIntelConfig, listIntelTypes };
export type { IIntelType };

// 导出默认实例
export const defaultEngine = new IntelligenceEngine();
