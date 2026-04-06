# 情报引擎 v2.0 使用指南

## 概述

情报引擎 v2.0 是项目的核心升级，引入了三大能力：

1. **情报价值评估引擎** - 多维度自动评分，智能筛选高价值情报
2. **智能成稿引擎** - 上下文感知的决策建议，替代模板化输出
3. **多情报类型扩展** - 可配置的多领域情报支持

## 快速开始

### 运行演示

```bash
npm run demo:intel-engine
```

这将展示：
- 情报类型注册表
- 价值评估流程
- 个性化成稿
- 去重功能
- 趋势分析

## 核心模块

### 1. 情报价值评估 (Value Assessment)

```typescript
import { IntelligenceValueAssessor, assessIntelligenceResult } from "./src/lib/intelligence-engine/index.js";

// 方式1：使用便捷函数
const { assessed, highValue, summary } = assessIntelligenceResult(intelResult, {
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
});

// 方式2：使用类实例
const assessor = new IntelligenceValueAssessor(config);
const signals = assessor.assessItem(item, allItems);
const score = assessor.calculateTotalScore(signals);
```

**评估维度：**
- **新颖度 (Novelty)** - 与历史情报的文本相似度（基于 Jaccard）
- **影响度 (Impact)** - 来源权重 + 事件类型权重
- **可信度 (Credibility)** - 来源等级 + 验证状态
- **时效性 (Timeliness)** - 时间衰减函数
- **相关性 (Relevance)** - 与关注主题匹配度

### 2. 智能去重 (Deduplication)

```typescript
import { IntelligenceDeduplicator, quickDeduplicate } from "./src/lib/intelligence-engine/index.js";

const { unique, duplicates, stats } = quickDeduplicate(items, {
  similarityThreshold: 0.75,
  titleSimilarityWeight: 0.6,
  contentSimilarityWeight: 0.4,
});

console.log(`去重率: ${stats.duplicateRate}`);
```

**特性：**
- 基于 Levenshtein 距离的相似度计算
- 事件聚类（同一事件的多方报道）
- 可配置的时间窗口

### 3. 智能成稿 (Smart Draft)

```typescript
import { SmartDraftEngine } from "./src/lib/intelligence-engine/index.js";

const engine = new SmartDraftEngine();

const content = engine.generateFullContent({
  item,
  relatedItems,
  readerProfile: {
    role: "executive", // 或 "product_manager", "engineer", "investor", "researcher"
    focus: ["战略", "竞争"],
    expertise: "intermediate",
  },
  assessment,
});

// 输出
console.log(content.decisionImplication); // 个性化决策建议
console.log(content.watchouts);           // 需观察清单
console.log(content.actionItems);         // 行动建议
console.log(content.relatedTrends);       // 相关趋势
```

**读者画像角色：**
- `executive` - 战略与组织视角
- `product_manager` - 产品与用户体验视角
- `engineer` - 技术与实现视角
- `investor` - 市场与估值视角
- `researcher` - 学术与技术前沿视角

### 4. 趋势分析 (Trend Analysis)

```typescript
import { TrendAnalyzer, quickAnalyzeTrends } from "./src/lib/intelligence-engine/index.js";

const { insights, patterns, emergingTopics, decliningTopics } = quickAnalyzeTrends(intelResult);

// 趋势洞察
for (const insight of insights) {
  console.log(`${insight.title} (${insight.confidence})`);
  console.log(insight.description);
}
```

**预定义趋势模式：**
- AI Agent 治理成为标配
- 模型生命周期管理常态化
- 企业级 AI 采用加速
- AI Agent 能力边界扩展
- AI Coding 向全栈发展

### 5. 多情报类型 (Multi-Type Support)

```typescript
import { 
  intelRegistry, 
  getIntelType, 
  getIntelConfig, 
  listIntelTypes,
  AI_INDUSTRY_CONFIG,
  SEMICONDUCTOR_CONFIG,
  BIOTECH_CONFIG,
} from "./src/lib/intelligence-engine/index.js";

// 列出所有情报类型
const types = listIntelTypes();

// 获取特定类型配置
const config = getIntelConfig("ai-industry");

// 使用类型实例
const aiType = getIntelType("ai-industry");
const normalized = aiType.normalizeResult(rawData);
```

**内置情报类型：**
- `ai-industry` - AI 行业情报
- `semiconductor` - 半导体情报
- `biotech` - 生物科技情报

## 完整处理流程

```typescript
import { IntelligenceEngine, processIntelligence } from "./src/lib/intelligence-engine/index.js";

const engine = new IntelligenceEngine();

const result = engine.process(intelResult, {
  enableDeduplication: true,
  enableScoring: true,
  enableTrendAnalysis: true,
  readerProfile: {
    role: "executive",
    focus: ["战略", "竞争"],
    expertise: "intermediate",
  },
  minScore: 60,
  maxItems: 15,
});

// 结果包含
console.log(result.summary);        // 处理统计
console.log(result.assessed);       // 所有评分
console.log(result.highValue);      // 高价值情报
console.log(result.deduplication);  // 去重信息
console.log(result.trends);         // 趋势分析
console.log(result.draft);          // 生成内容
```

## 添加新情报类型

### 1. 创建配置

```typescript
// src/lib/intelligence-engine/intel-registry.ts

export const MY_NEW_CONFIG: IntelTypeConfig = {
  id: "my-intel",
  name: "我的情报",
  slug: "my-intel",
  description: "描述",
  timeWindowHours: 48,
  classifications: ["分类1", "分类2", "待确认线索"],
  sources: [
    {
      name: "Source Name",
      tier: "tier1",
      category: "分类1",
      urls: ["https://example.com"],
      priority: 1,
    },
  ],
  focusTopics: ["主题1", "主题2"],
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
    reportTitle: "我的情报",
    reportSubtitle: "48小时监测",
    emailSubjectPrefix: "【我的情报】",
    fileBaseName: "my-intel",
  },
};
```

### 2. 创建类型类

```typescript
export class MyNewIntelType extends BaseIntelType {
  constructor() {
    super(MY_NEW_CONFIG);
  }
  
  getEventTypeWeight(eventText: string): number {
    // 自定义事件权重逻辑
    const weights: Record<string, number> = {
      "事件1": 100,
      "事件2": 80,
    };
    // ...
    return 60;
  }
}
```

### 3. 注册类型

```typescript
// 在 IntelTypeRegistry 构造函数中添加
this.register(new MyNewIntelType());
```

## 自定义评分权重

```typescript
const customConfig = {
  weights: {
    novelty: 0.20,      // 降低新颖度权重
    impact: 0.40,       // 提高影响度权重
    credibility: 0.25,  // 提高可信度权重
    timeliness: 0.10,   // 降低时效性权重
    relevance: 0.05,    // 降低相关性权重
  },
  focusTopics: ["AI Agent", "自定义主题"],
};

const assessor = new IntelligenceValueAssessor(customConfig);
```

## 与现有系统集成

情报引擎设计为向后兼容，可逐步替换现有功能：

```typescript
// 旧方式（模板化决策含义）
// scripts/generate-md.ts 中的硬编码逻辑

// 新方式（智能生成）
import { SmartDraftEngine } from "../src/lib/intelligence-engine/index.js";

const draftEngine = new SmartDraftEngine();

// 替换原有的 buildCoreDecisionImplication 函数
function buildCoreDecisionImplication(item, profile) {
  const content = draftEngine.generateFullContent({
    item,
    relatedItems: [],
    readerProfile: profile,
    assessment: { /* ... */ },
  });
  return content.decisionImplication;
}
```

## 性能优化建议

1. **缓存历史数据** - 去重和新颖度计算依赖历史数据，建议缓存到 SQLite
2. **批量处理** - 使用 `assessBatch` 而非循环调用 `assessItem`
3. **异步趋势分析** - 趋势分析可异步执行，不阻塞主流程
4. **增量更新** - 只处理新到达的情报，而非全量重算

## 测试

```bash
# 运行演示（包含基础测试）
npm run demo:intel-engine

# 类型检查
npm run build

# 完整测试
npm test
```

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Intelligence Engine                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Value      │  │  Dedupli-    │  │    Draft     │      │
│  │  Assessor    │  │   cator      │  │   Engine     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Intelligence Engine                      │  │
│  │  (process() - 整合所有模块的完整流程)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                               │
│                             ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Intel Registry                        │  │
│  │  - AI Industry    - Semiconductor    - Biotech       │  │
│  │  (可扩展的情报类型注册表)                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 下一步计划

1. [ ] RSS 自动抓取集成
2. [ ] 历史数据持久化（SQLite）
3. [ ] Web UI 配置界面
4. [ ] 邮件反馈收集系统
5. [ ] 更多情报类型（金融科技、新能源等）
