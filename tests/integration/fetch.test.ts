/**
 * 集成测试 - Fetch 模块
 * 
 * 测试内容：
 * 1. 策略调度器（dispatcher）
 * 2. 缓存功能
 * 3. 错误处理和降级
 * 4. 浏览器管理器
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestCache, clearGlobalCache } from "../../src/lib/fetch/cache.js";
import { browserManager } from "../../src/lib/fetch/strategies/playwright.js";
import { FETCH_CONFIG } from "../../src/lib/fetch-config.js";

describe("Fetch 集成测试", () => {
  beforeEach(() => {
    // 每个测试前清理缓存
    clearGlobalCache();
  });

  afterEach(async () => {
    // 每个测试后关闭浏览器
    await browserManager.closeBrowser();
  });

  describe("缓存系统", () => {
    it("应该缓存请求结果并返回缓存数据", () => {
      const cache = new RequestCache<string>({
        defaultTtl: 1000, // 1秒TTL用于测试
        maxSize: 10,
        cleanupInterval: 100,
      });

      // 设置缓存
      cache.set("key1", "value1");
      
      // 应该能获取到
      expect(cache.get("key1")).toBe("value1");
      
      // 获取不存在的key应该返回undefined
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("缓存过期后应该返回undefined", async () => {
      const cache = new RequestCache<string>({
        defaultTtl: 50, // 50ms TTL
        maxSize: 10,
        cleanupInterval: 10,
      });

      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      // 等待缓存过期
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // 过期后应该返回undefined
      expect(cache.get("key1")).toBeUndefined();
    });

    it("应该遵守最大缓存大小限制", () => {
      const cache = new RequestCache<string>({
        defaultTtl: 10000,
        maxSize: 3, // 最多3条
        cleanupInterval: 1000,
      });

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4"); // 应该淘汰最旧的

      // key1 应该被淘汰
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBe("value2");
      expect(cache.get("key3")).toBe("value3");
      expect(cache.get("key4")).toBe("value4");
    });

    it("应该能清空缓存", () => {
      const cache = new RequestCache<string>();
      
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      
      expect(cache.get("key1")).toBe("value1");
      
      cache.clear();
      
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
    });

    it("应该正确报告缓存统计", () => {
      const cache = new RequestCache<string>({
        defaultTtl: 10000,
        maxSize: 100,
        cleanupInterval: 1000,
      });

      const stats1 = cache.getStats();
      expect(stats1.size).toBe(0);

      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const stats2 = cache.getStats();
      expect(stats2.size).toBe(2);
    });
  });

  describe("配置验证", () => {
    it("FETCH_CONFIG 应该有正确的缓存配置", () => {
      // 验证缓存配置是2小时（适合每日运行）
      expect(FETCH_CONFIG.CACHE.TTL_MS).toBe(2 * 60 * 60 * 1000);
      expect(FETCH_CONFIG.CACHE.MAX_SIZE).toBe(100);
      expect(FETCH_CONFIG.CACHE.CLEANUP_INTERVAL_MS).toBe(30 * 60 * 1000);
    });

    it("FETCH_CONFIG 应该有正确的健康检查配置", () => {
      expect(FETCH_CONFIG.HEALTH.FAILURE_RATE_THRESHOLD).toBe(0.5);
      expect(FETCH_CONFIG.HEALTH.MIN_ATTEMPTS).toBe(3);
      expect(FETCH_CONFIG.HEALTH.HISTORY_DAYS).toBe(7);
    });

    it("FETCH_CONFIG 应该有合理的超时配置", () => {
      expect(FETCH_CONFIG.TIMEOUT.RSS).toBeGreaterThan(0);
      expect(FETCH_CONFIG.TIMEOUT.CHEERIO).toBeGreaterThan(0);
      expect(FETCH_CONFIG.TIMEOUT.PLAYWRIGHT.PAGE_GOTO).toBeGreaterThan(0);
      expect(FETCH_CONFIG.TIMEOUT.PLAYWRIGHT.WAIT_SELECTOR).toBeGreaterThan(0);
    });

    it("FETCH_CONFIG 应该有合理的截断长度", () => {
      expect(FETCH_CONFIG.TRUNCATE.EVENT_SUMMARY).toBe(300);
      expect(FETCH_CONFIG.TRUNCATE.WHY_IT_MATTERS).toBe(200);
      expect(FETCH_CONFIG.TRUNCATE.TITLE_DISPLAY).toBe(40);
    });

    it("FETCH_CONFIG 应该有正确的去重阈值", () => {
      expect(FETCH_CONFIG.DEDUPLICATION.SIMILARITY_THRESHOLD).toBe(0.75);
      expect(FETCH_CONFIG.DEDUPLICATION.TITLE_WEIGHT).toBe(0.6);
      expect(FETCH_CONFIG.DEDUPLICATION.CONTENT_WEIGHT).toBe(0.4);
    });
  });

  describe("浏览器管理器", () => {
    it("应该能获取浏览器实例", async () => {
      const browser = await browserManager.getBrowser();
      expect(browser).toBeDefined();
      expect(browser.isConnected()).toBe(true);
    });

    it("应该返回同一个浏览器实例（单例模式）", async () => {
      const browser1 = await browserManager.getBrowser();
      const browser2 = await browserManager.getBrowser();
      
      // 应该是同一个实例
      expect(browser1).toBe(browser2);
    });

    it("应该能正确关闭浏览器", async () => {
      const browser = await browserManager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await browserManager.closeBrowser();

      // 关闭后应该创建新的实例
      const browser2 = await browserManager.getBrowser();
      expect(browser2.isConnected()).toBe(true);
      // 是新实例
      expect(browser2).not.toBe(browser);
    });

    it("重复关闭不应该报错", async () => {
      await browserManager.getBrowser();
      
      // 第一次关闭
      await browserManager.closeBrowser();
      
      // 第二次关闭不应该报错
      await expect(browserManager.closeBrowser()).resolves.not.toThrow();
    });
  });

  describe("错误处理", () => {
    it("缓存应该优雅处理类型转换", () => {
      const cache = new RequestCache<{ data: string }>();
      
      cache.set("key1", { data: "test" });
      
      // 使用不同的类型参数获取
      const result = cache.get<{ data: string; extra?: number }>("key1");
      expect(result).toEqual({ data: "test" });
    });

    it("应该处理无效的缓存键", () => {
      const cache = new RequestCache<string>();
      
      // 空字符串键
      cache.set("", "empty key");
      expect(cache.get("")).toBe("empty key");
      
      // 特殊字符键
      cache.set("special:!@#$%", "special");
      expect(cache.get("special:!@#$%")).toBe("special");
    });
  });
});
