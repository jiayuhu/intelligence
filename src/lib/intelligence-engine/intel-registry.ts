/**
 * 情报类型注册表与工厂
 * 
 * 功能：
 * 1. 情报类型注册与发现
 * 2. 配置加载与管理
 * 3. 跨类型通用逻辑
 */

import type { 
  IntelTypeConfig, 
  IntelItem, 
  IntelClassification, 
  IntelSourceTier,
  IntelResult,
  IIntelType,
} from "../../types/intel-framework.js";

// ==================== AI 行业情报配置 ====================

export const AI_INDUSTRY_CONFIG: IntelTypeConfig = {
  id: "ai-industry",
  name: "AI行业情报",
  slug: "ai-industry",
  description: "人工智能行业最新动态、技术突破与企业战略",
  timeWindowHours: 48,
  
  classifications: [
    "AI Agent",
    "AI Coding", 
    "模型与基础设施",
    "政策与监管",
    "社区热点",
  ],
  
  sources: [
    {
      name: "OpenAI",
      tier: "tier1",
      category: "模型与基础设施",
      urls: ["https://openai.com/blog", "https://openai.com/news"],
      priority: 1,
    },
    {
      name: "Anthropic",
      tier: "tier1", 
      category: "模型与基础设施",
      urls: ["https://anthropic.com/news", "https://anthropic.com/research"],
      priority: 2,
    },
    {
      name: "Google DeepMind",
      tier: "tier1",
      category: "模型与基础设施", 
      urls: ["https://deepmind.google/discover/blog"],
      priority: 3,
    },
    {
      name: "GitHub",
      tier: "tier1",
      category: "AI Coding",
      urls: ["https://github.blog", "https://github.com/features/copilot"],
      priority: 4,
    },
    {
      name: "Cursor",
      tier: "tier1",
      category: "AI Coding",
      urls: ["https://cursor.com/changelog"],
      priority: 5,
    },
    {
      name: "LangChain",
      tier: "tier2",
      category: "AI Agent",
      urls: ["https://blog.langchain.dev"],
      priority: 10,
    },
    {
      name: "LlamaIndex",
      tier: "tier2",
      category: "AI Agent",
      urls: ["https://blog.llamaindex.ai"],
      priority: 11,
    },
  ],
  
  focusTopics: [
    "AI Agent",
    "AI Coding",
    "模型更新",
    "企业采用",
    "开源生态",
    "安全治理",
  ],
  
  scoringWeights: {
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
  
  output: {
    reportTitle: "AI行业情报",
    reportSubtitle: "48小时滚动监测",
    emailSubjectPrefix: "【AI行业情报】",
    fileBaseName: "ai-industry",
  },
};

// ==================== 半导体情报配置 ====================

export const SEMICONDUCTOR_CONFIG: IntelTypeConfig = {
  id: "semiconductor",
  name: "半导体情报",
  slug: "semiconductor",
  description: "半导体产业链动态、工艺进展与市场变化",
  timeWindowHours: 48,
  
  classifications: [
    "先进制程",
    "封装测试",
    "设备材料",
    "芯片设计",
    "产能动态",
    "供应链",
    "政策投资",
    "待确认线索",
  ],
  
  sources: [
    {
      name: "TSMC",
      tier: "tier1",
      category: "先进制程",
      urls: ["https://www.tsmc.com/news-events"],
      priority: 1,
    },
    {
      name: "ASML",
      tier: "tier1",
      category: "设备材料",
      urls: ["https://www.asml.com/en/news"],
      priority: 2,
    },
    {
      name: "NVIDIA",
      tier: "tier1",
      category: "芯片设计",
      urls: ["https://nvidia.com/news"],
      priority: 3,
    },
    {
      name: "Intel",
      tier: "tier1",
      category: "先进制程",
      urls: ["https://intel.com/newsroom"],
      priority: 4,
    },
    {
      name: "Samsung",
      tier: "tier1",
      category: "先进制程",
      urls: ["https://news.samsung.com"],
      priority: 5,
    },
  ],
  
  focusTopics: [
    "先进制程",
    "光刻机",
    "产能扩张",
    "供应链",
    "AI芯片",
    "地缘政治",
  ],
  
  scoringWeights: {
    novelty: 0.20,
    impact: 0.35,
    credibility: 0.25,
    timeliness: 0.10,
    relevance: 0.10,
  },
  
  thresholds: {
    minScore: 65,
    minCredibility: 60,
    maxAgeHours: 48,
  },
  
  output: {
    reportTitle: "半导体情报",
    reportSubtitle: "48小时产业监测",
    emailSubjectPrefix: "【半导体情报】",
    fileBaseName: "semiconductor",
  },
};

// ==================== 生物科技情报配置 ====================

export const BIOTECH_CONFIG: IntelTypeConfig = {
  id: "biotech",
  name: "生物科技情报",
  slug: "biotech",
  description: "生物科技领域突破、药物研发与监管动态",
  timeWindowHours: 48,
  
  classifications: [
    "药物研发",
    "基因编辑",
    "AI制药",
    "临床试验",
    "监管批准",
    "投融资",
    "科研突破",
    "待确认线索",
  ],
  
  sources: [
    {
      name: "FDA",
      tier: "tier1",
      category: "监管批准",
      urls: ["https://fda.gov/news-events"],
      priority: 1,
    },
    {
      name: "Nature",
      tier: "tier1",
      category: "科研突破",
      urls: ["https://nature.com/news"],
      priority: 2,
    },
    {
      name: "Science",
      tier: "tier1",
      category: "科研突破",
      urls: ["https://science.org/news"],
      priority: 3,
    },
  ],
  
  focusTopics: [
    "AI制药",
    "基因编辑",
    "临床试验",
    "监管批准",
    "投融资",
  ],
  
  scoringWeights: {
    novelty: 0.25,
    impact: 0.30,
    credibility: 0.25,
    timeliness: 0.10,
    relevance: 0.10,
  },
  
  thresholds: {
    minScore: 65,
    minCredibility: 60,
    maxAgeHours: 72, // 生物科技节奏较慢，延长至72小时
  },
  
  output: {
    reportTitle: "生物科技情报",
    reportSubtitle: "48小时创新监测",
    emailSubjectPrefix: "【生物科技情报】",
    fileBaseName: "biotech",
  },
};

// ==================== 情报类型实现基类 ====================

export abstract class BaseIntelType implements IIntelType {
  readonly config: IntelTypeConfig;
  
  constructor(config: IntelTypeConfig) {
    this.config = config;
  }
  
  normalizeSourceTier(value: string | undefined): IntelSourceTier | undefined {
    const normalized = (value ?? "").trim().toLowerCase();
    if (["tier1", "p0", "p1"].includes(normalized)) return "tier1";
    if (["tier2", "p2"].includes(normalized)) return "tier2";
    if (["tier3", "p3"].includes(normalized)) return "tier3";
    return undefined;
  }
  
  normalizeClassification(value: string | undefined): IntelClassification {
    const normalized = (value ?? "").trim();
    if (this.config.classifications.includes(normalized)) {
      return normalized;
    }
    return "待确认线索";
  }
  
  normalizeResult(input: unknown): IntelResult {
    const result = input as Partial<IntelResult>;
    return {
      intel_type: result.intel_type || this.config.id,
      report_title: result.report_title || this.config.output.reportTitle,
      report_date: result.report_date || new Date().toISOString().slice(0, 10),
      time_window_hours: result.time_window_hours || this.config.timeWindowHours,
      generated_at: result.generated_at || new Date().toISOString(),
      groups: (result.groups || []).map(g => ({
        category: g.category,
        summary: g.summary,
        items: g.items.map(i => this.normalizeItem(i)),
      })),
    };
  }
  
  private normalizeItem(item: Partial<IntelItem> | IntelItem): IntelItem {
    const classValue = typeof item.classification === 'string' ? item.classification : undefined;
    const confidenceValue = typeof item.confidence === 'string' ? item.confidence : "medium";
    const statusValue = typeof item.status === 'string' ? item.status : "tentative";
    const withinWindow = typeof item.within_time_window === 'boolean' ? item.within_time_window : true;
    
    return {
      id: typeof item.id === 'string' ? item.id : `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: typeof item.title === 'string' ? item.title : "未命名情报",
      summary: typeof item.summary === 'string' ? item.summary : "",
      impact: typeof item.impact === 'string' ? item.impact : "",
      classification: this.normalizeClassification(classValue),
      subject: typeof item.subject === 'string' ? item.subject : "未知主体",
      primary_source: {
        name: typeof item.primary_source === 'object' && item.primary_source && 'name' in item.primary_source 
          ? String(item.primary_source.name) 
          : "未知来源",
        url: typeof item.primary_source === 'object' && item.primary_source && 'url' in item.primary_source 
          ? String(item.primary_source.url) 
          : "",
        published_at: typeof item.primary_source === 'object' && item.primary_source && 'published_at' in item.primary_source 
          ? String(item.primary_source.published_at) 
          : new Date().toISOString(),
      },
      supporting_sources: Array.isArray(item.supporting_sources) ? item.supporting_sources : undefined,
      confidence: (confidenceValue as "high" | "medium" | "low") || "medium",
      status: (statusValue as "confirmed" | "tentative") || "tentative",
      within_time_window: withinWindow,
      metadata: typeof item.metadata === 'object' ? item.metadata : undefined,
    };
  }
  
  isClassificationMatch(item: IntelItem, filter: string): boolean {
    const hasTag = Array.isArray(item.metadata?.tags) && item.metadata.tags.includes(filter);
    return item.classification === filter || 
           hasTag ||
           item.title.includes(filter) ||
           item.summary.includes(filter);
  }
  
  getClassificationPriority(classification: IntelClassification): number {
    const index = this.config.classifications.indexOf(classification as string);
    return index === -1 ? 999 : index;
  }
  
  getSourceImpactWeight(sourceName: string): number {
    const source = this.config.sources.find(s => 
      sourceName.includes(s.name) || s.name.includes(sourceName)
    );
    if (!source) return 50;
    return source.tier === "tier1" ? 100 : source.tier === "tier2" ? 70 : 40;
  }
  
  abstract getEventTypeWeight(eventText: string): number;
}

// ==================== 具体情报类型实现 ====================

export class AIIndustryIntelType extends BaseIntelType {
  constructor() {
    super(AI_INDUSTRY_CONFIG);
  }
  
  getEventTypeWeight(eventText: string): number {
    const weights: Record<string, number> = {
      "模型发布": 95,
      "API 变更": 90,
      "产品发布": 85,
      "安全公告": 85,
      "融资": 80,
      "人事变动": 70,
      "研究论文": 70,
    };
    
    const text = eventText.toLowerCase();
    for (const [event, weight] of Object.entries(weights)) {
      if (text.includes(event.toLowerCase())) return weight;
    }
    return 60;
  }
}

export class SemiconductorIntelType extends BaseIntelType {
  constructor() {
    super(SEMICONDUCTOR_CONFIG);
  }
  
  getEventTypeWeight(eventText: string): number {
    const weights: Record<string, number> = {
      "工艺突破": 100,
      "产能扩张": 90,
      "设备交付": 85,
      "财报": 80,
      "订单": 80,
      "技术合作": 75,
      "政策": 85,
    };
    
    const text = eventText.toLowerCase();
    for (const [event, weight] of Object.entries(weights)) {
      if (text.includes(event.toLowerCase())) return weight;
    }
    return 60;
  }
}

export class BiotechIntelType extends BaseIntelType {
  constructor() {
    super(BIOTECH_CONFIG);
  }
  
  getEventTypeWeight(eventText: string): number {
    const weights: Record<string, number> = {
      "监管批准": 100,
      "临床试验": 95,
      "突破": 90,
      "投融资": 75,
      "合作": 70,
    };
    
    const text = eventText.toLowerCase();
    for (const [event, weight] of Object.entries(weights)) {
      if (text.includes(event.toLowerCase())) return weight;
    }
    return 60;
  }
}

// ==================== 注册表 ====================

class IntelTypeRegistry {
  private types: Map<string, IIntelType> = new Map();
  private configs: Map<string, IntelTypeConfig> = new Map();
  
  constructor() {
    // 注册默认情报类型
    this.register(new AIIndustryIntelType());
    this.register(new SemiconductorIntelType());
    this.register(new BiotechIntelType());
  }
  
  register(intelType: IIntelType): void {
    this.types.set(intelType.config.id, intelType);
    this.configs.set(intelType.config.id, intelType.config);
  }
  
  get(id: string): IIntelType | undefined {
    return this.types.get(id);
  }
  
  getConfig(id: string): IntelTypeConfig | undefined {
    return this.configs.get(id);
  }
  
  getAll(): IIntelType[] {
    return Array.from(this.types.values());
  }
  
  getAllConfigs(): IntelTypeConfig[] {
    return Array.from(this.configs.values());
  }
  
  has(id: string): boolean {
    return this.types.has(id);
  }
  
  unregister(id: string): boolean {
    return this.types.delete(id) && this.configs.delete(id);
  }
}

// 全局单例
export const intelRegistry = new IntelTypeRegistry();

// ==================== 便捷函数 ====================

export function getIntelType(id: string): IIntelType {
  const type = intelRegistry.get(id);
  if (!type) {
    throw new Error(`未知的情报类型: ${id}`);
  }
  return type;
}

export function getIntelConfig(id: string): IntelTypeConfig {
  const config = intelRegistry.getConfig(id);
  if (!config) {
    throw new Error(`未找到情报类型配置: ${id}`);
  }
  return config;
}

export function listIntelTypes(): IntelTypeConfig[] {
  return intelRegistry.getAllConfigs();
}
