import { describe, it, expect, beforeEach } from "vitest";
import { 
  FETCH_CONFIG, 
  getTimeWindowMs, 
  getCategoryTimeWindowHours,
  getWindowStartDate 
} from "../src/lib/fetch-config.js";
import { autoClassify } from "../src/lib/fetch-utils.js";
import type { AiIndustryClassification } from "../src/types/ai-industry.js";

/**
 * 集成测试 - 验证完整管道的关键功能
 * 
 * 这些测试确保各个模块协同工作，验证：
 * 1. 分类系统一致性
 * 2. 时间窗口配置正确应用
 * 3. 数据流完整性
 */

describe("集成测试 - 分类系统", () => {
  it("所有分类都有有效的时间窗口配置", () => {
    const validClassifications: AiIndustryClassification[] = [
      "AI Agent",
      "AI Coding",
      "模型与基础设施",
      "政策与监管",
      "社区热点",
    ];

    for (const category of validClassifications) {
      const hours = getCategoryTimeWindowHours(category);
      expect(hours).toBeGreaterThan(0);
      expect(hours).toBeLessThanOrEqual(168); // 最多7天
    }
  });

  it("已删除的分类不应再被使用", () => {
    const deletedCategories = ["AI 公司", "AI 领袖人物", "开源生态", "待确认线索"];
    
    // 这些分类的自动分类应该映射到现有分类
    for (const deleted of deletedCategories) {
      const result = autoClassify(`${deleted} related content`);
      expect(deletedCategories).not.toContain(result);
    }
  });

  it("社区热点使用24小时窗口，政策使用72小时窗口", () => {
    expect(getCategoryTimeWindowHours("社区热点")).toBe(24);
    expect(getCategoryTimeWindowHours("政策与监管")).toBe(72);
    expect(getCategoryTimeWindowHours("AI Agent")).toBe(FETCH_CONFIG.TIME_WINDOW_HOURS); // 默认48
  });
});

describe("集成测试 - 时间窗口", () => {
  it("getTimeWindowMs 应返回正确的毫秒数", () => {
    expect(getTimeWindowMs()).toBe(FETCH_CONFIG.TIME_WINDOW_HOURS * 60 * 60 * 1000);
    expect(getTimeWindowMs("社区热点")).toBe(24 * 60 * 60 * 1000);
    expect(getTimeWindowMs("政策与监管")).toBe(72 * 60 * 60 * 1000);
  });

  it("getWindowStartDate 应根据分类返回不同的时间", () => {
    const now = Date.now();
    const defaultStart = getWindowStartDate();
    const communityStart = getWindowStartDate("社区热点");
    const policyStart = getWindowStartDate("政策与监管");

    // 社区热点窗口最短（24h），所以开始时间应该最晚（最接近现在）
    expect(communityStart.getTime()).toBeGreaterThan(defaultStart.getTime());
    
    // 政策窗口最长（72h），所以开始时间应该最早
    expect(policyStart.getTime()).toBeLessThan(defaultStart.getTime());

    // 所有时间都应该在过去
    expect(communityStart.getTime()).toBeLessThan(now);
    expect(defaultStart.getTime()).toBeLessThan(now);
    expect(policyStart.getTime()).toBeLessThan(now);
  });
});

describe("集成测试 - 配置一致性", () => {
  it("FETCH_CONFIG 应该包含所有必要的配置", () => {
    expect(FETCH_CONFIG.TIME_WINDOW_HOURS).toBeDefined();
    expect(FETCH_CONFIG.CATEGORY_TIME_WINDOWS).toBeDefined();
    expect(FETCH_CONFIG.TRUNCATE).toBeDefined();
    expect(FETCH_CONFIG.DEDUPLICATION).toBeDefined();
  });

  it("分类时间窗口应该是 FETCH_CONFIG 的子集", () => {
    const configCategories = Object.keys(FETCH_CONFIG.CATEGORY_TIME_WINDOWS);
    const validCategories = ["AI Agent", "AI Coding", "模型与基础设施", "政策与监管", "社区热点"];
    
    for (const cat of configCategories) {
      expect(validCategories).toContain(cat);
    }
  });
});

describe("集成测试 - 自动分类", () => {
  const testCases: Array<{ input: string; expected: AiIndustryClassification }> = [
    { input: "OpenAI GPT-5 release", expected: "模型与基础设施" },
    { input: "Sam Altman interview about AI", expected: "模型与基础设施" },
    { input: "GitHub Copilot new features", expected: "AI Coding" },
    { input: "AutoGPT autonomous agent", expected: "AI Agent" },
    { input: "EU AI Act policy update", expected: "政策与监管" },
    { input: "Reddit discussion on LLM", expected: "模型与基础设施" },
    { input: "Hacker News trending AI", expected: "模型与基础设施" },
    { input: "Open source LLM release", expected: "模型与基础设施" },
  ];

  for (const { input, expected } of testCases) {
    it(`"${input}" 应该分类为 "${expected}"`, () => {
      expect(autoClassify(input)).toBe(expected);
    });
  }
});
