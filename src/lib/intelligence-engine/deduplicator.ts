/**
 * 情报去重与相似度检测模块
 * 
 * 功能：
 * 1. 基于文本相似度的情报去重
 * 2. 事件聚类（同一事件的不同报道）
 * 3. 增量更新检测
 */

import type { AiIndustryFetchItem } from "../../types/ai-industry.js";

export interface SimilarityResult {
  isDuplicate: boolean;
  similarity: number;
  matchedItem?: AiIndustryFetchItem;
  reason: string;
}

export interface EventCluster {
  id: string;
  title: string;
  items: AiIndustryFetchItem[];
  representative: AiIndustryFetchItem; // 最具代表性的条目
  firstSeen: string;
  lastUpdated: string;
}

export interface DeduplicationConfig {
  similarityThreshold: number;      // 相似度阈值，超过则视为重复
  titleSimilarityWeight: number;    // 标题相似度权重
  contentSimilarityWeight: number;  // 内容相似度权重
  timeWindowHours: number;          // 时间窗口
}

export const DEFAULT_DEDUPLICATION_CONFIG: DeduplicationConfig = {
  similarityThreshold: 0.75,
  titleSimilarityWeight: 0.6,
  contentSimilarityWeight: 0.4,
  timeWindowHours: 48,
};

export class IntelligenceDeduplicator {
  private config: DeduplicationConfig;
  private history: AiIndustryFetchItem[] = [];
  private clusters: Map<string, EventCluster> = new Map();

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = { ...DEFAULT_DEDUPLICATION_CONFIG, ...config };
  }

  /**
   * 检查单条情报是否与历史记录重复
   */
  checkDuplicate(item: AiIndustryFetchItem): SimilarityResult {
    // 首先检查 URL 是否完全相同
    const exactMatch = this.history.find(h => h.source_url === item.source_url);
    if (exactMatch) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchedItem: exactMatch,
        reason: "来源链接完全相同",
      };
    }

    // 检查标题是否高度相似
    for (const historyItem of this.history) {
      const titleSim = this.calculateStringSimilarity(
        item.title.toLowerCase(),
        historyItem.title.toLowerCase()
      );
      
      if (titleSim > 0.9) {
        return {
          isDuplicate: true,
          similarity: titleSim,
          matchedItem: historyItem,
          reason: "标题高度相似",
        };
      }
    }

    // 综合相似度计算
    let maxSimilarity = 0;
    let bestMatch: AiIndustryFetchItem | undefined;

    for (const historyItem of this.history) {
      // 检查时间窗口
      const timeDiff = Math.abs(
        new Date(item.published_at).getTime() - new Date(historyItem.published_at).getTime()
      ) / (1000 * 60 * 60); // 小时

      if (timeDiff > this.config.timeWindowHours * 2) {
        continue; // 时间差距太大，不太可能是同一事件
      }

      const similarity = this.calculateCompositeSimilarity(item, historyItem);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = historyItem;
      }
    }

    if (maxSimilarity >= this.config.similarityThreshold) {
      return {
        isDuplicate: true,
        similarity: maxSimilarity,
        matchedItem: bestMatch,
        reason: `综合相似度 ${(maxSimilarity * 100).toFixed(1)}%`,
      };
    }

    return {
      isDuplicate: false,
      similarity: maxSimilarity,
      matchedItem: bestMatch,
      reason: maxSimilarity > 0.5 
        ? `相似度 ${(maxSimilarity * 100).toFixed(1)}%，低于阈值`
        : "无明显重复",
    };
  }

  /**
   * 批量去重
   */
  deduplicateBatch(items: AiIndustryFetchItem[]): {
    unique: AiIndustryFetchItem[];
    duplicates: Array<{ item: AiIndustryFetchItem; result: SimilarityResult }>;
  } {
    const unique: AiIndustryFetchItem[] = [];
    const duplicates: Array<{ item: AiIndustryFetchItem; result: SimilarityResult }> = [];

    // 先按时间排序
    const sorted = [...items].sort(
      (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );

    for (const item of sorted) {
      const result = this.checkDuplicate(item);
      
      if (result.isDuplicate) {
        duplicates.push({ item, result });
      } else {
        unique.push(item);
        this.addToHistory(item);
      }
    }

    return { unique, duplicates };
  }

  /**
   * 事件聚类
   * 将相似的情报聚合成事件
   */
  clusterEvents(items: AiIndustryFetchItem[]): EventCluster[] {
    const clusters: EventCluster[] = [];
    const assigned = new Set<string>();

    for (const item of items) {
      if (assigned.has(item.source_url)) continue;

      const clusterItems: AiIndustryFetchItem[] = [item];
      assigned.add(item.source_url);

      // 寻找相似条目
      for (const other of items) {
        if (assigned.has(other.source_url)) continue;
        if (item === other) continue;

        const similarity = this.calculateCompositeSimilarity(item, other);
        if (similarity >= 0.6) { // 聚类阈值比去重阈值低
          clusterItems.push(other);
          assigned.add(other.source_url);
        }
      }

      if (clusterItems.length > 1) {
        clusters.push(this.createCluster(clusterItems));
      }
    }

    return clusters;
  }

  /**
   * 计算综合相似度
   */
  private calculateCompositeSimilarity(a: AiIndustryFetchItem, b: AiIndustryFetchItem): number {
    const titleSim = this.calculateStringSimilarity(
      a.title.toLowerCase(),
      b.title.toLowerCase()
    );

    const contentSim = this.calculateStringSimilarity(
      `${a.event_summary} ${a.why_it_matters}`.toLowerCase(),
      `${b.event_summary} ${b.why_it_matters}`.toLowerCase()
    );

    const subjectSim = a.subject === b.subject ? 1.0 : 0.3;

    return (
      titleSim * this.config.titleSimilarityWeight +
      contentSim * this.config.contentSimilarityWeight +
      subjectSim * 0.1 // 主体相同加分
    );
  }

  /**
   * 计算字符串相似度（Levenshtein 距离）
   */
  private calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const distance = this.levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein 距离计算
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * 创建事件聚类
   */
  private createCluster(items: AiIndustryFetchItem[]): EventCluster {
    // 选择最具代表性的条目（来源等级最高、时间最早）
    const representative = items
      .filter(i => i.source_tier === "tier1")
      .sort((a, b) => 
        new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
      )[0] || items[0];

    const sortedByTime = [...items].sort(
      (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );

    return {
      id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: representative.title,
      items,
      representative,
      firstSeen: sortedByTime[0].published_at,
      lastUpdated: sortedByTime[sortedByTime.length - 1].published_at,
    };
  }

  /**
   * 添加到历史记录
   */
  addToHistory(item: AiIndustryFetchItem): void {
    this.history.push(item);
    
    // 清理过期历史（保留7天）
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    
    this.history = this.history.filter(
      h => new Date(h.published_at) > cutoff
    );
  }

  /**
   * 批量添加到历史
   */
  addBatchToHistory(items: AiIndustryFetchItem[]): void {
    for (const item of items) {
      this.addToHistory(item);
    }
  }

  /**
   * 获取历史记录统计
   */
  getHistoryStats(): {
    totalHistory: number;
    clusterCount: number;
  } {
    return {
      totalHistory: this.history.length,
      clusterCount: this.clusters.size,
    };
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.history = [];
    this.clusters.clear();
  }
}

/**
 * 便捷函数：快速去重
 */
export function quickDeduplicate(
  items: AiIndustryFetchItem[],
  config?: Partial<DeduplicationConfig>
): {
  unique: AiIndustryFetchItem[];
  duplicates: Array<{ item: AiIndustryFetchItem; result: SimilarityResult }>;
  stats: {
    total: number;
    unique: number;
    duplicate: number;
    duplicateRate: string;
  };
} {
  const deduplicator = new IntelligenceDeduplicator(config);
  const result = deduplicator.deduplicateBatch(items);
  
  return {
    ...result,
    stats: {
      total: items.length,
      unique: result.unique.length,
      duplicate: result.duplicates.length,
      duplicateRate: `${((result.duplicates.length / items.length) * 100).toFixed(1)}%`,
    },
  };
}
