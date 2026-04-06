/**
 * 情报框架核心类型定义
 * 
 * 支持多情报类型的抽象类型系统
 */

// ==================== 基础类型 ====================

export type IntelClassification = 
  | string  // 允许各情报类型自定义分类
  | "待确认线索";

export type IntelConfidence = "high" | "medium" | "low";

export type IntelStatus = "confirmed" | "tentative";

export type IntelSourceTier = "tier1" | "tier2" | "tier3";

export type IntelSourceKind = "official" | "media" | "community" | "podcast" | "transcript";

// ==================== 情报条目 ====================

export interface IntelSource {
  name: string;
  url: string;
  tier?: IntelSourceTier;
  published_at: string;
}

export interface IntelItem {
  id: string;
  title: string;
  summary: string;
  impact: string;
  classification: IntelClassification;
  subject: string; // 主体（公司、人物等）
  
  // 来源信息
  primary_source: IntelSource;
  supporting_sources?: IntelSource[];
  
  // 元数据
  confidence: IntelConfidence;
  status: IntelStatus;
  within_time_window: boolean;
  
  // 扩展字段（各情报类型自定义）
  metadata?: Record<string, unknown>;
}

// ==================== 情报分组 ====================

export interface IntelGroup {
  category: string;
  summary: string;
  items: IntelItem[];
}

// ==================== 情报结果 ====================

export interface IntelResult {
  intel_type: string;        // 情报类型标识
  report_title: string;
  report_date: string;
  time_window_hours: number;
  generated_at: string;
  groups: IntelGroup[];
  
  // 类型特定元数据
  metadata?: Record<string, unknown>;
}

// ==================== 情报类型配置 ====================

export interface IntelTypeConfig {
  // 基础标识
  id: string;
  name: string;
  slug: string;
  description: string;
  
  // 时间窗口
  timeWindowHours: number;
  
  // 分类体系
  classifications: string[];
  
  // 来源配置
  sources: IntelSourceConfig[];
  
  // 关注主题
  focusTopics: string[];
  
  // 评分权重
  scoringWeights: {
    novelty: number;
    impact: number;
    credibility: number;
    timeliness: number;
    relevance: number;
  };
  
  // 阈值配置
  thresholds: {
    minScore: number;
    minCredibility: number;
    maxAgeHours: number;
  };
  
  // 输出配置
  output: {
    reportTitle: string;
    reportSubtitle: string;
    emailSubjectPrefix: string;
    fileBaseName: string;
  };
}

export interface IntelSourceConfig {
  name: string;
  tier: IntelSourceTier;
  category: string;
  urls: string[];
  rss?: string;
  priority: number;
}

// ==================== 读者画像 ====================

export interface ReaderProfile {
  id: string;
  role: "executive" | "product_manager" | "engineer" | "investor" | "researcher" | string;
  focus: string[];
  expertise: "beginner" | "intermediate" | "expert";
  interests: string[];
  preferredLength: "short" | "medium" | "long";
  preferredDepth: "summary" | "detailed" | "technical" | "analytical";
}

// ==================== 评估结果 ====================

export interface AssessedIntel {
  item: IntelItem;
  signals: {
    novelty: number;
    impact: number;
    credibility: number;
    timeliness: number;
    relevance: number;
  };
  totalScore: number;
  rank: number;
  reason: string;
}

// ==================== 趋势分析 ====================

export interface IntelTrend {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  strength: "emerging" | "growing" | "mature" | "declining";
}

export interface IntelInsight {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  impact: "strategic" | "tactical" | "observational";
  timeframe: "immediate" | "short_term" | "medium_term";
}

// ==================== 成稿内容 ====================

export interface GeneratedSection {
  title: string;
  content: string;
  priority: number;
}

export interface IntelDraft {
  sections: GeneratedSection[];
  highlights: string[];
  trends: IntelInsight[];
  actions: string[];
  watchouts: string[];
}

// ==================== 邮件发送 ====================

export interface IntelEmailPayload {
  report_title: string;
  report_date: string;
  time_window_hours: number;
  email_subject: string;
  opening: string;
  highlights: Array<{
    title: string;
    evidence: string;
    decision_implication: string;
  }>;
  closing: string;
}

// ==================== 框架接口 ====================

export interface IIntelType {
  readonly config: IntelTypeConfig;
  
  // 数据转换
  normalizeSourceTier(value: string | undefined): IntelSourceTier | undefined;
  normalizeClassification(value: string | undefined): IntelClassification;
  normalizeResult(input: unknown): IntelResult;
  
  // 分类特定逻辑
  isClassificationMatch(item: IntelItem, filter: string): boolean;
  getClassificationPriority(classification: IntelClassification): number;
  
  // 来源特定逻辑
  getSourceImpactWeight(sourceName: string): number;
  getEventTypeWeight(eventText: string): number;
}

export interface IValueAssessor {
  assessItem(item: IntelItem, allItems: IntelItem[], config: IntelTypeConfig): AssessedIntel;
  filterHighValue(assessed: AssessedIntel[], config: IntelTypeConfig): AssessedIntel[];
}

export interface IDraftEngine {
  generateDecisionImplication(
    item: IntelItem, 
    context: {
      relatedItems: IntelItem[];
      readerProfile: ReaderProfile;
      assessed: AssessedIntel;
    },
    config: IntelTypeConfig
  ): string;
  
  generateWatchouts(
    item: IntelItem,
    context: {
      assessed: AssessedIntel;
    }
  ): string[];
  
  generateActionItems(
    item: IntelItem,
    readerProfile: ReaderProfile,
    config: IntelTypeConfig
  ): string[];
}

export interface ITrendAnalyzer {
  analyze(result: IntelResult): {
    insights: IntelInsight[];
    trends: IntelTrend[];
    patterns: Array<{
      pattern: string;
      occurrences: number;
      consistency: number;
    }>;
  };
}
