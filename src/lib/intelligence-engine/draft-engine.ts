/**
 * 智能成稿引擎
 * 
 * 核心功能：
 * 1. 上下文感知的决策建议生成（替代模板化输出）
 * 2. 趋势关联分析（发现跨事件模式）
 * 3. 个性化内容生成（基于读者画像）
 */

import type { AiIndustryFetchItem, AiIndustryFetchResult } from "../../types/ai-industry.js";
import type { AssessedIntelligence } from "./value-assessor.js";

export interface ReaderProfile {
  id: string;
  role: "executive" | "product_manager" | "engineer" | "investor" | "researcher";
  focus: string[];
  expertise: "beginner" | "intermediate" | "expert";
  interests: string[];
}

export interface DraftContext {
  item: AiIndustryFetchItem;
  relatedItems: AiIndustryFetchItem[];
  historicalTrends?: TrendPattern[];
  readerProfile: ReaderProfile;
  assessment: AssessedIntelligence;
}

export interface TrendPattern {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  strength: "emerging" | "growing" | "mature" | "declining";
}

export interface GeneratedContent {
  decisionImplication: string;
  watchouts: string[];
  relatedTrends: string[];
  actionItems: string[];
  confidence: number;
}

// 角色特定的决策框架
const ROLE_FRAMEWORKS: Record<ReaderProfile["role"], {
  perspective: string;
  concerns: string[];
  actionVerbs: string[];
}> = {
  executive: {
    perspective: "战略与组织",
    concerns: ["竞争态势", "预算投入", "组织变革", "风险管理", "投资回报"],
    actionVerbs: ["评估", "决策", "授权", "监督", "调整"],
  },
  product_manager: {
    perspective: "产品与用户体验",
    concerns: ["功能优先级", "用户需求", "竞品差异", "上线节奏", "用户反馈"],
    actionVerbs: ["规划", "验证", "迭代", "协调", "发布"],
  },
  engineer: {
    perspective: "技术与实现",
    concerns: ["技术选型", "集成复杂度", "性能影响", "维护成本", "技术债务"],
    actionVerbs: ["调研", "原型", "实现", "测试", "部署"],
  },
  investor: {
    perspective: "市场与估值",
    concerns: ["市场机会", "竞争壁垒", "增长潜力", "风险因素", "退出路径"],
    actionVerbs: ["分析", "调研", "评估", "监控", "配置"],
  },
  researcher: {
    perspective: "学术与技术前沿",
    concerns: ["技术突破", "研究价值", "可复现性", "学术影响", "合作机会"],
    actionVerbs: ["阅读", "实验", "验证", "撰写", "分享"],
  },
};

// 事件类型到决策含义的映射模板（动态填充）
const EVENT_TYPE_TEMPLATES: Record<string, {
  contexts: string[];
  implications: string[];
}> = {
  "模型发布": {
    contexts: ["能力边界扩展", "应用场景拓宽", "竞争格局变化"],
    implications: [
      "评估新能力对现有产品的增强或替代可能",
      "规划技术团队的模型评估和集成工作",
      "关注竞品跟进节奏和技术路线选择",
    ],
  },
  "API 变更": {
    contexts: ["集成稳定性", "迁移成本", "功能调整"],
    implications: [
      "评估现有集成受影响范围和迁移成本",
      "建立版本兼容性测试和监控机制",
      "规划用户沟通和过渡方案",
    ],
  },
  "产品发布": {
    contexts: ["市场定位", "用户需求", "竞争差异"],
    implications: [
      "分析目标用户群与自身产品的重叠度",
      "评估功能差异点和竞争应对策略",
      "考虑合作或集成的可能性",
    ],
  },
  "安全公告": {
    contexts: ["风险暴露", "合规要求", "用户信任"],
    implications: [
      "立即评估自身系统的潜在风险暴露",
      "制定安全加固和漏洞修复计划",
      "准备对外沟通和用户安抚方案",
    ],
  },
  "政策发布": {
    contexts: ["合规成本", "市场准入", "运营模式"],
    implications: [
      "评估政策对现有业务模式的合规影响",
      "规划合规调整的时间表和资源投入",
      "关注政策执行细则和过渡安排",
    ],
  },
  "人事变动": {
    contexts: ["战略调整", "技术方向", "组织稳定"],
    implications: [
      "关注新任负责人的背景和过往观点",
      "评估战略方向调整的可能性和影响",
      "监控后续的组织变动和团队稳定性",
    ],
  },
  "融资": {
    contexts: ["资本热度", "估值水平", "竞争加剧"],
    implications: [
      "分析融资方的战略意图和资源投向",
      "评估赛道竞争加剧对获客成本的影响",
      "关注后续的产品和市场动作",
    ],
  },
};

export class SmartDraftEngine {
  private trends: Map<string, TrendPattern> = new Map();

  /**
   * 生成个性化的决策建议
   */
  generateDecisionImplication(context: DraftContext): string {
    const { item, readerProfile, relatedItems } = context;
    const framework = ROLE_FRAMEWORKS[readerProfile.role];
    
    // 1. 识别事件类型
    const eventType = this.identifyEventType(item);
    const template = EVENT_TYPE_TEMPLATES[eventType] || EVENT_TYPE_TEMPLATES["产品发布"];
    
    // 2. 构建上下文
    const relatedContext = relatedItems.length > 0 
      ? `，同时考虑 ${relatedItems.length} 条相关动态` 
      : "";
    
    // 3. 选择最相关的关注点
    const relevantConcerns = framework.concerns.filter(concern =>
      this.isRelevantToItem(concern, item)
    ).slice(0, 2);
    
    if (relevantConcerns.length === 0) {
      relevantConcerns.push(...framework.concerns.slice(0, 2));
    }

    // 4. 动态生成决策建议
    const implication = this.composeImplication({
      role: readerProfile.role,
      perspective: framework.perspective,
      concerns: relevantConcerns,
      eventType,
      item,
      relatedContext,
    });

    return implication;
  }

  /**
   * 生成需观察清单
   */
  generateWatchouts(context: DraftContext): string[] {
    const { item, relatedItems, assessment } = context;
    const watchouts: string[] = [];

    // 基于可信度
    if (assessment.signals.credibility < 70) {
      watchouts.push("等待更高可信度来源的验证或官方确认");
    }

    // 基于补充来源
    if (item.supporting_sources && item.supporting_sources.length > 0) {
      watchouts.push("关注补充来源的后续发展和多方验证");
    }

    // 基于相关焦点
    for (const focus of item.related_focus) {
      if (focus.includes("模型") || focus.includes("路由") || focus.includes("迁移")) {
        watchouts.push("监控默认模型与迁移路径是否继续变化");
        break;
      }
      if (focus.includes("治理") || focus.includes("审计") || focus.includes("部署")) {
        watchouts.push("观察治理能力是否扩展到更多组织级控制项");
        break;
      }
    }

    // 基于相关情报
    if (relatedItems.length > 0) {
      const hasLeadershipSignal = relatedItems.some(i => 
        i.classification === "AI 领袖人物"
      );
      if (hasLeadershipSignal) {
        watchouts.push("关注是否出现更多面向 CEO/CFO/合规负责人的公开表态");
      }
    }

    // 基于时效性
    if (assessment.signals.timeliness > 90) {
      watchouts.push("密切跟踪未来 24 小时内是否有更多细节披露");
    }

    // 默认观察
    if (watchouts.length === 0) {
      watchouts.push("下一窗口需继续跟踪该主题是否出现更强的一手证据");
    }

    return watchouts;
  }

  /**
   * 识别相关趋势
   */
  identifyRelatedTrends(context: DraftContext): string[] {
    const { item } = context;
    const relatedTrends: string[] = [];
    const text = `${item.title} ${item.event_summary}`.toLowerCase();

    for (const [trendId, trend] of this.trends) {
      const matchCount = trend.keywords.filter(kw => 
        text.includes(kw.toLowerCase())
      ).length;
      
      if (matchCount >= 2) {
        relatedTrends.push(`${trend.name}（${trend.strength === "emerging" ? "新兴" : trend.strength === "growing" ? "增长中" : "成熟"}趋势）`);
      }
    }

    return relatedTrends.slice(0, 3);
  }

  /**
   * 生成行动建议
   */
  generateActionItems(context: DraftContext): string[] {
    const { item, readerProfile } = context;
    const framework = ROLE_FRAMEWORKS[readerProfile.role];
    const actions: string[] = [];

    // 基于角色和事件类型的行动建议
    const eventType = this.identifyEventType(item);
    
    // 添加个性化行动建议
    switch (readerProfile.role) {
      case "executive":
        if (eventType === "模型发布" || eventType === "产品发布") {
          actions.push("召集产品和技术负责人评估战略影响");
          actions.push("更新季度路线图和资源配置计划");
        }
        if (eventType === "安全公告") {
          actions.push("启动安全应急响应小组");
          actions.push("准备向董事会汇报风险状况");
        }
        break;
        
      case "product_manager":
        if (item.classification?.startsWith("AI Agent") || item.classification === "AI Coding") {
          actions.push("组织用户调研验证新功能的市场需求");
          actions.push("更新竞品功能矩阵和差异化策略");
        }
        break;
        
      case "engineer":
        if (item.source_url.includes("docs") || item.source_url.includes("api")) {
          actions.push("创建技术原型验证集成可行性");
          actions.push("更新技术文档和最佳实践");
        }
        break;
        
      case "investor":
        actions.push("整理该事件的产业链上下游影响分析");
        actions.push("更新被投企业的竞争态势评估");
        break;
        
      case "researcher":
        actions.push("下载原始论文或技术报告深入阅读");
        actions.push("设计实验验证该技术在自身场景的效果");
        break;
    }

    // 通用行动建议
    if (actions.length < 2) {
      actions.push(`${framework.actionVerbs[0]}该变化对${framework.concerns[0]}的影响`);
      actions.push(`将观察结果同步给${readerProfile.role === "executive" ? "执行团队" : "相关 stakeholders"}`);
    }

    return actions.slice(0, 3);
  }

  /**
   * 批量生成完整内容
   */
  generateFullContent(context: DraftContext): GeneratedContent {
    return {
      decisionImplication: this.generateDecisionImplication(context),
      watchouts: this.generateWatchouts(context),
      relatedTrends: this.identifyRelatedTrends(context),
      actionItems: this.generateActionItems(context),
      confidence: context.assessment.totalScore / 100,
    };
  }

  /**
   * 识别事件类型
   */
  private identifyEventType(item: AiIndustryFetchItem): string {
    const text = `${item.title} ${item.event_summary}`.toLowerCase();
    
    if (text.includes("模型") && (text.includes("发布") || text.includes("推出") || text.includes("上线"))) {
      return "模型发布";
    }
    if (text.includes("api") && (text.includes("更新") || text.includes("变更") || text.includes("废弃"))) {
      return "API 变更";
    }
    if (text.includes("融资") || text.includes("投资") || text.includes("估值")) {
      return "融资";
    }
    if (text.includes("安全") || text.includes("漏洞") || text.includes("风险")) {
      return "安全公告";
    }
    if (text.includes("政策") || text.includes("监管") || text.includes("合规")) {
      return "政策发布";
    }
    if (text.includes("人事") || text.includes("离职") || text.includes("加入") || text.includes("任命")) {
      return "人事变动";
    }
    
    return "产品发布";
  }

  /**
   * 判断关注点是否与情报相关
   */
  private isRelevantToItem(concern: string, item: AiIndustryFetchItem): boolean {
    const text = `${item.title} ${item.event_summary} ${item.classification}`.toLowerCase();
    
    const concernKeywords: Record<string, string[]> = {
      "竞争态势": ["竞争", "领先", "落后", "对手", "market"],
      "预算投入": ["成本", "价格", "费用", "预算", "投资"],
      "组织变革": ["团队", "组织", "结构", "调整", "变革"],
      "风险管理": ["风险", "安全", "合规", "监管", "政策"],
      "投资回报": ["收益", "回报", "roi", "价值"],
      "功能优先级": ["功能", "特性", "feature", "能力"],
      "用户需求": ["用户", "客户", "需求", "体验"],
      "竞品差异": ["差异", "优势", "劣势", "对比"],
      "技术选型": ["技术", "架构", "选型", "方案"],
      "集成复杂度": ["集成", "对接", "兼容性", "迁移"],
      "市场机会": ["市场", "机会", "增长", "规模"],
      "技术突破": ["突破", "创新", " novel", "advance"],
    };

    const keywords = concernKeywords[concern] || [concern];
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  }

  /**
   * 组合决策建议
   */
  private composeImplication(params: {
    role: string;
    perspective: string;
    concerns: string[];
    eventType: string;
    item: AiIndustryFetchItem;
    relatedContext: string;
  }): string {
    const { role, perspective, concerns, eventType, item, relatedContext } = params;
    
    // 基于事件类型的基础含义
    const template = EVENT_TYPE_TEMPLATES[eventType];
    const baseImplication = template?.implications[0] || "评估该变化对当前业务的影响";
    
    // 根据角色定制
    let implication = baseImplication;
    
    if (role === "executive") {
      implication = `从${perspective}角度，${concerns.join("和")}需要纳入管理层议程。${baseImplication}，避免组织响应滞后于市场变化${relatedContext}。`;
    } else if (role === "product_manager") {
      implication = `针对${concerns.join("和")}，${baseImplication}，确保产品决策基于最新市场动态${relatedContext}。`;
    } else if (role === "engineer") {
      implication = `在${perspective}层面，需重点关注${concerns.join("和")}。${baseImplication}，提前识别技术债务风险${relatedContext}。`;
    } else if (role === "investor") {
      implication = `从${perspective}看，${concerns.join("和")}可能发生变化。${baseImplication}，及时调整估值模型${relatedContext}。`;
    } else {
      implication = `基于${perspective}，${baseImplication}，推进相关${concerns.join("和")}的深入研究${relatedContext}。`;
    }

    return implication;
  }

  /**
   * 更新趋势库
   */
  updateTrends(items: AiIndustryFetchItem[]): void {
    // 简单的趋势提取逻辑
    const trendKeywords: Record<string, string[]> = {
      "AI Agent 治理": ["firewall", "runner", "控制", "治理", "审计", "权限"],
      "模型路由统一": ["默认模型", "路由", "自动选择", "模型切换"],
      "旧模型退役": ["退役", "废弃", "deprecat", "旧版本"],
      "企业采用加速": ["企业", "CEO", "采用", "部署", "生产环境"],
      "开源模型竞争": ["开源", "Llama", "Mistral", "社区"],
    };

    for (const [trendName, keywords] of Object.entries(trendKeywords)) {
      let matchCount = 0;
      let firstSeen = new Date();
      let lastSeen = new Date(0);

      for (const item of items) {
        const text = `${item.title} ${item.event_summary}`.toLowerCase();
        if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
          matchCount++;
          const date = new Date(item.published_at);
          if (date < firstSeen) firstSeen = date;
          if (date > lastSeen) lastSeen = date;
        }
      }

      if (matchCount >= 2) {
        const existing = this.trends.get(trendName);
        const strength: TrendPattern["strength"] = 
          matchCount > 5 ? "mature" : matchCount > 3 ? "growing" : "emerging";

        this.trends.set(trendName, {
          id: `trend-${trendName}`,
          name: trendName,
          description: `${trendName}趋势在过去 48 小时内出现 ${matchCount} 次`,
          keywords,
          occurrences: matchCount + (existing?.occurrences || 0),
          firstSeen: existing?.firstSeen || firstSeen.toISOString(),
          lastSeen: lastSeen.toISOString(),
          strength: existing?.strength === "mature" ? "mature" : strength,
        });
      }
    }
  }

  /**
   * 获取所有趋势
   */
  getTrends(): TrendPattern[] {
    return Array.from(this.trends.values());
  }
}

/**
 * 便捷函数：快速生成内容
 */
export function quickGenerateContent(
  item: AiIndustryFetchItem,
  profile: ReaderProfile,
  assessment: AssessedIntelligence,
  relatedItems: AiIndustryFetchItem[] = []
): GeneratedContent {
  const engine = new SmartDraftEngine();
  return engine.generateFullContent({
    item,
    relatedItems,
    readerProfile: profile,
    assessment,
  });
}
