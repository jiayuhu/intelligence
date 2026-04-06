/**
 * 去重模块单元测试
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  IntelligenceDeduplicator,
  DEFAULT_DEDUPLICATION_CONFIG,
} from "../src/lib/intelligence-engine/deduplicator.js";
import type { AiIndustryFetchItem } from "../src/types/ai-industry.js";

// 创建测试数据的辅助函数
function createItem(overrides: Partial<AiIndustryFetchItem> = {}): AiIndustryFetchItem {
  return {
    title: "Test Title",
    published_at: new Date().toISOString(),
    source_name: "Test Source",
    source_url: "https://example.com/test",
    subject: "Test",
    classification: "模型与基础设施",
    event_summary: "Test summary",
    why_it_matters: "Test why",
    confidence: "high",
    related_focus: ["模型与基础设施"],
    within_48h: true,
    status: "confirmed",
    ...overrides,
  };
}

describe("IntelligenceDeduplicator", () => {
  let deduplicator: IntelligenceDeduplicator;

  beforeEach(() => {
    deduplicator = new IntelligenceDeduplicator();
  });

  describe("checkDuplicate", () => {
    it("应该识别完全相同的 URL 为重复", () => {
      const item1 = createItem({ source_url: "https://example.com/same" });
      const item2 = createItem({ source_url: "https://example.com/same" });

      deduplicator.addToHistory(item1);
      const result = deduplicator.checkDuplicate(item2);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(1.0);
      expect(result.reason).toContain("来源链接完全相同");
    });

    it("应该识别高度相似的标题为重复", () => {
      const item1 = createItem({ title: "OpenAI releases GPT-5 today" });
      const item2 = createItem({
        title: "OpenAI releases GPT-5 today",
        source_url: "https://example.com/different",
      });

      deduplicator.addToHistory(item1);
      const result = deduplicator.checkDuplicate(item2);

      expect(result.isDuplicate).toBe(true);
      expect(result.reason).toContain("标题高度相似");
    });

    it("应该不将完全不同的内容识别为重复", () => {
      const item1 = createItem({
        title: "OpenAI news",
        event_summary: "OpenAI summary",
      });
      const item2 = createItem({
        title: "Google news",
        event_summary: "Google summary",
        source_url: "https://example.com/google",
      });

      deduplicator.addToHistory(item1);
      const result = deduplicator.checkDuplicate(item2);

      expect(result.isDuplicate).toBe(false);
    });

    it("应该识别相似内容（综合相似度）", () => {
      const item1 = createItem({
        title: "OpenAI GPT-5 Release",
        event_summary: "OpenAI announced GPT-5 with new features",
        source_url: "https://openai.com/news",
      });
      const item2 = createItem({
        title: "OpenAI launches GPT-5",
        event_summary: "OpenAI announced GPT-5 with new capabilities",
        source_url: "https://techcrunch.com/openai-gpt5",
      });

      deduplicator.addToHistory(item1);
      const result = deduplicator.checkDuplicate(item2);

      // 相似度应该较高但不一定是重复（取决于阈值）
      expect(result.similarity).toBeGreaterThan(0.5);
    });
  });

  describe("deduplicateBatch", () => {
    it("应该正确批量去重", () => {
      const items = [
        createItem({ source_url: "https://example.com/1", title: "OpenAI GPT-5 Release Announcement" }),
        createItem({ source_url: "https://example.com/2", title: "Google Gemini Ultra Update" }),
        createItem({ source_url: "https://example.com/1", title: "OpenAI GPT-5 Release Announcement" }), // URL 重复
      ];

      const result = deduplicator.deduplicateBatch(items);

      expect(result.unique.length).toBe(2);
      expect(result.duplicates.length).toBe(1);
    });

    it("空数组应该返回空结果", () => {
      const result = deduplicator.deduplicateBatch([]);

      expect(result.unique.length).toBe(0);
      expect(result.duplicates.length).toBe(0);
    });

    it("单元素数组应该返回原元素", () => {
      const items = [createItem()];
      const result = deduplicator.deduplicateBatch(items);

      expect(result.unique.length).toBe(1);
      expect(result.duplicates.length).toBe(0);
    });
  });

  describe("clusterEvents", () => {
    it("应该将相似事件聚类", () => {
      const items = [
        createItem({
          title: "OpenAI GPT-5",
          source_url: "https://openai.com",
          published_at: "2026-04-06T10:00:00Z",
        }),
        createItem({
          title: "OpenAI releases GPT-5",
          source_url: "https://techcrunch.com",
          published_at: "2026-04-06T11:00:00Z",
        }),
        createItem({
          title: "Unrelated news",
          source_url: "https://other.com",
          published_at: "2026-04-06T12:00:00Z",
        }),
      ];

      const clusters = deduplicator.clusterEvents(items);

      // 应该有一个聚类包含前两个相似项
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.some((c) => c.items.length >= 2)).toBe(true);
    });
  });

  describe("addToHistory", () => {
    it("应该添加项目到历史", () => {
      const item = createItem();
      deduplicator.addToHistory(item);

      const result = deduplicator.checkDuplicate(item);
      expect(result.isDuplicate).toBe(true);
    });

    it("应该支持批量添加", () => {
      const items = [createItem(), createItem({ source_url: "https://example.com/other" })];
      deduplicator.addBatchToHistory(items);

      for (const item of items) {
        const result = deduplicator.checkDuplicate(item);
        expect(result.isDuplicate).toBe(true);
      }
    });
  });
});

describe("DEFAULT_DEDUPLICATION_CONFIG", () => {
  it("应该有正确的默认配置", () => {
    expect(DEFAULT_DEDUPLICATION_CONFIG.similarityThreshold).toBe(0.75);
    expect(DEFAULT_DEDUPLICATION_CONFIG.titleSimilarityWeight).toBe(0.6);
    expect(DEFAULT_DEDUPLICATION_CONFIG.contentSimilarityWeight).toBe(0.4);
    expect(DEFAULT_DEDUPLICATION_CONFIG.timeWindowHours).toBe(48);
  });
});
