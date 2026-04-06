#!/usr/bin/env tsx
/**
 * 情报引擎演示脚本
 * 
 * 展示情报价值评估、智能成稿、趋势分析的功能
 */

import {
  IntelligenceEngine,
  IntelligenceValueAssessor,
  IntelligenceDeduplicator,
  SmartDraftEngine,
  TrendAnalyzer,
  getIntelConfig,
  listIntelTypes,
} from "../src/lib/intelligence-engine/index.js";

// 模拟情报数据
const mockAIResult = {
  intel_type: "ai-industry",
  report_title: "AI行业情报",
  report_date: "2026-04-05",
  time_window_hours: 48,
  generated_at: new Date().toISOString(),
  groups: [
    {
      category: "AI Agent",
      summary: "治理控制面成为重点",
      items: [
        {
          id: "1",
          title: "GitHub Copilot 推出组织级 firewall 设置",
          summary: "GitHub 为 Copilot cloud agent 增加 organization 级别的 firewall 设置",
          impact: "提升企业级 AI 的安全治理能力",
          classification: "AI Agent",
          subject: "GitHub",
          primary_source: {
            name: "GitHub Changelog",
            url: "https://github.blog/changelog/...",
            published_at: "2026-04-05T10:00:00Z",
          },
          confidence: "high" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
        {
          id: "2",
          title: "LangChain 发布 LangGraph 0.2",
          summary: "LangGraph 新版本支持更复杂的多 Agent 编排",
          impact: "简化企业级 Agent 工作流开发",
          classification: "AI Agent",
          subject: "LangChain",
          primary_source: {
            name: "LangChain Blog",
            url: "https://blog.langchain.dev/...",
            published_at: "2026-04-04T15:00:00Z",
          },
          confidence: "medium" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
      ],
    },
    {
      category: "AI Coding",
      summary: "模型退役与默认路由更新",
      items: [
        {
          id: "3",
          title: "GitHub 退役 GPT-5.1 Codex 系列",
          summary: "GitHub 宣布 GPT-5.1 Codex 模型退役，推动新的默认模型路径",
          impact: "开发者需要迁移到新的模型体系",
          classification: "AI Coding",
          subject: "GitHub",
          primary_source: {
            name: "GitHub Changelog",
            url: "https://github.blog/changelog/...",
            published_at: "2026-04-05T08:00:00Z",
          },
          confidence: "high" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
        {
          id: "4",
          title: "Cursor 发布多文件编辑功能",
          summary: "Cursor 支持跨文件的 AI 辅助编辑",
          impact: "提升大型项目开发效率",
          classification: "AI Coding",
          subject: "Cursor",
          primary_source: {
            name: "Cursor Blog",
            url: "https://cursor.com/blog/...",
            published_at: "2026-04-04T12:00:00Z",
          },
          confidence: "high" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
      ],
    },
    {
      category: "头部 AI 企业",
      summary: "OpenAI 模型路由调整",
      items: [
        {
          id: "5",
          title: "OpenAI 将 GPT-5.3 设为默认模型",
          summary: "OpenAI 调整 ChatGPT 默认模型为 GPT-5.3",
          impact: "用户体验将由平台统一路由调度",
          classification: "头部 AI 企业",
          subject: "OpenAI",
          primary_source: {
            name: "OpenAI Help Center",
            url: "https://help.openai.com/...",
            published_at: "2026-04-05T14:00:00Z",
          },
          confidence: "high" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
      ],
    },
    {
      category: "AI 领袖人物",
      summary: "Sam Altman 谈企业 AI 采用",
      items: [
        {
          id: "6",
          title: "Sam Altman 向 CEO 强调尽快推进 AI 采用",
          summary: "Altman 表示未来 6-12 个月是企业推进 AI 采用的关键窗口",
          impact: "企业管理层需要加快决策节奏",
          classification: "AI 领袖人物",
          subject: "Sam Altman",
          primary_source: {
            name: "Axios",
            url: "https://axios.com/...",
            published_at: "2026-04-04T18:00:00Z",
          },
          confidence: "medium" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
        {
          id: "7",
          title: "Sam Altman 谈政府合作与公众信任",
          summary: "Altman 承认低估了公众对 AI 与政府合作议题的敏感度",
          impact: "AI 公司对外表述转向更谨慎的治理语气",
          classification: "AI 领袖人物",
          subject: "Sam Altman",
          primary_source: {
            name: "Business Insider",
            url: "https://businessinsider.com/...",
            published_at: "2026-04-03T20:00:00Z",
          },
          confidence: "medium" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
      ],
    },
  ],
};

// 模拟半导体情报
const mockSemiResult = {
  intel_type: "semiconductor",
  report_title: "半导体情报",
  report_date: "2026-04-05",
  time_window_hours: 48,
  generated_at: new Date().toISOString(),
  groups: [
    {
      category: "先进制程",
      summary: "台积电 2nm 进展",
      items: [
        {
          id: "s1",
          title: "台积电宣布 2nm 工艺良率突破 60%",
          summary: "台积电在 2nm 工艺上取得重要进展，良率提升至 60%",
          impact: "为 2025 年量产奠定基础",
          classification: "先进制程",
          subject: "TSMC",
          primary_source: {
            name: "TSMC News",
            url: "https://tsmc.com/...",
            published_at: "2026-04-05T09:00:00Z",
          },
          confidence: "high" as const,
          status: "confirmed" as const,
          within_time_window: true,
        },
      ],
    },
  ],
};

// 读者画像示例
const readerProfiles = [
  {
    id: "exec-1",
    role: "executive" as const,
    focus: ["战略", "竞争", "投资"],
    expertise: "intermediate" as const,
    interests: ["AI Agent", "企业采用"],
    preferredLength: "short" as const,
    preferredDepth: "summary" as const,
  },
  {
    id: "pm-1",
    role: "product_manager" as const,
    focus: ["产品", "用户需求", "竞品"],
    expertise: "expert" as const,
    interests: ["AI Coding", "Agent"],
    preferredLength: "medium" as const,
    preferredDepth: "detailed" as const,
  },
  {
    id: "eng-1",
    role: "engineer" as const,
    focus: ["技术", "集成", "性能"],
    expertise: "expert" as const,
    interests: ["AI Coding", "模型", "API"],
    preferredLength: "long" as const,
    preferredDepth: "technical" as const,
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("情报引擎功能演示");
  console.log("=".repeat(60));
  
  // 1. 展示情报类型注册表
  console.log("\n📋 已注册的情报类型:");
  const intelTypes = listIntelTypes();
  for (const type of intelTypes) {
    console.log(`  - ${type.name} (${type.id}): ${type.description}`);
    console.log(`    分类: ${type.classifications.slice(0, 4).join(", ")}...`);
  }
  
  // 2. 展示完整处理流程
  console.log("\n" + "=".repeat(60));
  console.log("🚀 完整情报处理流程 (AI 行业情报)");
  console.log("=".repeat(60));
  
  const engine = new IntelligenceEngine();
  
  // 2.1 无读者画像的处理
  console.log("\n--- 基础处理（无读者画像）---");
  const basicResult = engine.process(mockAIResult as any, {
    enableDeduplication: true,
    enableScoring: true,
    enableTrendAnalysis: true,
    maxItems: 10,
  });
  
  console.log(`\n处理统计:`);
  console.log(`  - 原始条目: ${basicResult.summary.totalItems}`);
  console.log(`  - 最终条目: ${basicResult.summary.finalItems}`);
  console.log(`  - 平均评分: ${basicResult.summary.avgScore}`);
  console.log(`  - 处理时间: ${basicResult.summary.processingTimeMs}ms`);
  
  // 2.2 趋势分析结果
  if (basicResult.trends) {
    console.log(`\n🔍 识别到的趋势:`);
    for (const insight of basicResult.trends.insights.slice(0, 3)) {
      console.log(`  - ${insight.title} (${insight.confidence})`);
      console.log(`    ${insight.description.slice(0, 80)}...`);
    }
  }
  
  // 2.3 高价值条目
  console.log(`\n⭐ 高价值情报 (Top 5):`);
  for (const assessed of basicResult.highValue.slice(0, 5)) {
    console.log(`  [${assessed.totalScore}分] ${assessed.item.title}`);
    console.log(`      来源: ${assessed.item.primary_source.name} | 可信度: ${assessed.signals.credibility}`);
  }
  
  // 3. 个性化成稿演示
  console.log("\n" + "=".repeat(60));
  console.log("✍️ 个性化成稿演示");
  console.log("=".repeat(60));
  
  for (const profile of readerProfiles) {
    console.log(`\n--- 读者画像: ${profile.role} ---`);
    
    const personalizedResult = engine.process(mockAIResult as any, {
      enableDeduplication: true,
      enableScoring: true,
      enableTrendAnalysis: true,
      readerProfile: profile as any,
      maxItems: 5,
    });
    
    if (personalizedResult.draft) {
      console.log(`\n核心建议:`);
      console.log(`  ${personalizedResult.draft.highlights[0]?.slice(0, 100)}...`);
      
      console.log(`\n行动建议:`);
      for (const action of personalizedResult.draft.actions.slice(0, 2)) {
        console.log(`  • ${action}`);
      }
      
      console.log(`\n需关注:`);
      for (const watchout of personalizedResult.draft.watchouts.slice(0, 2)) {
        console.log(`  ⚠️ ${watchout}`);
      }
    }
  }
  
  // 4. 去重演示
  console.log("\n" + "=".repeat(60));
  console.log("🔄 去重功能演示");
  console.log("=".repeat(60));
  
  const deduplicator = new IntelligenceDeduplicator();
  const allItems = mockAIResult.groups.flatMap(g => g.items);
  
  // 添加一些重复内容
  const duplicateItems = [...allItems];
  duplicateItems.push({
    ...allItems[0],
    id: "dup-1",
    title: "GitHub Copilot 推出企业 firewall 功能", // 类似但不完全相同
  } as any);
  
  const dedupResult = deduplicator.deduplicateBatch(duplicateItems as any);
  
  console.log(`\n去重统计:`);
  console.log(`  - 原始数量: ${duplicateItems.length}`);
  console.log(`  - 去重后: ${dedupResult.unique.length}`);
  console.log(`  - 重复数量: ${dedupResult.duplicates.length}`);
  
  if (dedupResult.duplicates.length > 0) {
    console.log(`\n检测到的重复:`);
    for (const dup of dedupResult.duplicates) {
      console.log(`  - "${dup.item.title}"`);
      console.log(`    原因: ${dup.result.reason}`);
    }
  }
  
  // 5. 半导体情报演示
  console.log("\n" + "=".repeat(60));
  console.log("🔧 半导体情报类型演示");
  console.log("=".repeat(60));
  
  const semiConfig = getIntelConfig("semiconductor");
  console.log(`\n配置信息:`);
  console.log(`  - 名称: ${semiConfig.name}`);
  console.log(`  - 时间窗口: ${semiConfig.timeWindowHours}小时`);
  console.log(`  - 分类: ${semiConfig.classifications.join(", ")}`);
  console.log(`  - 关注主题: ${semiConfig.focusTopics.join(", ")}`);
  
  const semiResult = engine.process(mockSemiResult as any, {
    enableDeduplication: true,
    enableScoring: true,
    enableTrendAnalysis: true,
  });
  
  console.log(`\n处理结果:`);
  console.log(`  - 条目数: ${semiResult.summary.finalItems}`);
  console.log(`  - 平均评分: ${semiResult.summary.avgScore}`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ 演示完成");
  console.log("=".repeat(60));
}

main().catch(console.error);
