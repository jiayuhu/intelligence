/**
 * 健康监控模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  HealthMonitor,
  getGlobalHealthMonitor,
  resetGlobalHealthMonitor,
} from "../src/lib/fetch/health-monitor.js";
import fs from "node:fs";
import path from "node:path";

const TEST_HISTORY_DIR = "outputs/test-health";

describe("HealthMonitor", () => {
  beforeEach(() => {
    resetGlobalHealthMonitor();
    // 清理测试目录
    if (fs.existsSync(TEST_HISTORY_DIR)) {
      fs.rmSync(TEST_HISTORY_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(TEST_HISTORY_DIR)) {
      fs.rmSync(TEST_HISTORY_DIR, { recursive: true });
    }
  });

  describe("基础功能", () => {
    it("应该能记录成功的尝试", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      
      monitor.recordAttempt({
        sourceId: "test-source",
        sourceName: "Test Source",
        success: true,
        itemsFetched: 5,
        responseTime: 1000,
      });

      const stats = monitor.getSourceStats("test-source");
      expect(stats).not.toBeNull();
      expect(stats?.successCount).toBe(1);
      expect(stats?.failureCount).toBe(0);
      expect(stats?.isHealthy).toBe(true);
    });

    it("应该能记录失败的尝试", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      
      monitor.recordAttempt({
        sourceId: "test-source",
        sourceName: "Test Source",
        success: false,
        error: "Connection timeout",
      });

      const stats = monitor.getSourceStats("test-source");
      expect(stats?.successCount).toBe(0);
      expect(stats?.failureCount).toBe(1);
      expect(stats?.failureRate).toBe(1);
    });

    it("应该正确计算失败率", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      
      // 记录 3 次成功，2 次失败
      for (let i = 0; i < 3; i++) {
        monitor.recordAttempt({
          sourceId: "test-source",
          sourceName: "Test Source",
          success: true,
        });
      }
      for (let i = 0; i < 2; i++) {
        monitor.recordAttempt({
          sourceId: "test-source",
          sourceName: "Test Source",
          success: false,
          error: "Error",
        });
      }

      const stats = monitor.getSourceStats("test-source");
      expect(stats?.totalAttempts).toBe(5);
      expect(stats?.successCount).toBe(3);
      expect(stats?.failureCount).toBe(2);
      expect(stats?.failureRate).toBe(0.4);
    });

    it("应该能跟踪多个源", () => {
      const monitor = new HealthMonitor(
        { minAttempts: 1 }, // 降低最小尝试次数以便测试
        TEST_HISTORY_DIR
      );
      
      monitor.recordAttempt({
        sourceId: "source-1",
        sourceName: "Source 1",
        success: true,
      });
      // source-2: 3次失败，达到 minAttempts=1
      for (let i = 0; i < 3; i++) {
        monitor.recordAttempt({
          sourceId: "source-2",
          sourceName: "Source 2",
          success: false,
          error: "Error",
        });
      }

      const allStats = monitor.getAllStats();
      expect(allStats).toHaveLength(2);
      
      const stats1 = monitor.getSourceStats("source-1");
      const stats2 = monitor.getSourceStats("source-2");
      
      expect(stats1?.isHealthy).toBe(true);
      expect(stats2?.isHealthy).toBe(false);
    });
  });

  describe("健康状态判断", () => {
    it("失败率超过阈值应该标记为不健康", () => {
      const monitor = new HealthMonitor(
        { failureRateThreshold: 0.5, minAttempts: 3 },
        TEST_HISTORY_DIR
      );
      
      // 记录 1 次成功，3 次失败 (75% 失败率)
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: true });
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: false, error: "e" });
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: false, error: "e" });
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: false, error: "e" });

      const stats = monitor.getSourceStats("test");
      expect(stats?.isHealthy).toBe(false);
    });

    it("未达到最小尝试次数不计算健康状态", () => {
      const monitor = new HealthMonitor(
        { failureRateThreshold: 0.1, minAttempts: 5 },
        TEST_HISTORY_DIR
      );
      
      // 只记录 2 次失败，未达到 minAttempts=5
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: false, error: "e" });
      monitor.recordAttempt({ sourceId: "test", sourceName: "Test", success: false, error: "e" });

      const stats = monitor.getSourceStats("test");
      // 虽然失败率是 100%，但因为未达到 minAttempts，isHealthy 仍为 true
      expect(stats?.isHealthy).toBe(true);
    });
  });

  describe("报告生成", () => {
    it("应该生成完整的健康报告", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      
      monitor.recordAttempt({ sourceId: "healthy", sourceName: "Healthy Source", success: true });
      monitor.recordAttempt({ sourceId: "unhealthy", sourceName: "Unhealthy Source", success: false, error: "e" });
      monitor.recordAttempt({ sourceId: "unhealthy", sourceName: "Unhealthy Source", success: false, error: "e" });
      monitor.recordAttempt({ sourceId: "unhealthy", sourceName: "Unhealthy Source", success: false, error: "e" });

      const report = monitor.generateReport();
      
      expect(report.summary.totalSources).toBe(2);
      expect(report.summary.healthySources).toBe(1);
      expect(report.summary.unhealthySources).toBe(1);
      expect(report.sources).toHaveLength(2);
      expect(report.alerts.length).toBeGreaterThan(0);
    });

    it("空记录应该生成空报告", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      const report = monitor.generateReport();
      
      expect(report.summary.totalSources).toBe(0);
      expect(report.summary.overallSuccessRate).toBe(0);
      expect(report.sources).toHaveLength(0);
    });
  });

  describe("数据持久化", () => {
    it("应该能保存每日记录", () => {
      const monitor = new HealthMonitor({}, TEST_HISTORY_DIR);
      
      monitor.recordAttempt({
        sourceId: "test",
        sourceName: "Test",
        success: true,
      });

      monitor.saveDailyRecords();

      const today = new Date().toISOString().split("T")[0];
      const filePath = path.join(TEST_HISTORY_DIR, `${today}.json`);
      
      expect(fs.existsSync(filePath)).toBe(true);
      
      const saved = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(saved).toHaveLength(1);
      expect(saved[0].sourceId).toBe("test");
    });
  });

  describe("单例模式", () => {
    it("getGlobalHealthMonitor 应该返回同一个实例", () => {
      const monitor1 = getGlobalHealthMonitor();
      const monitor2 = getGlobalHealthMonitor();
      
      expect(monitor1).toBe(monitor2);
    });

    it("resetGlobalHealthMonitor 应该清除单例", () => {
      const monitor1 = getGlobalHealthMonitor();
      resetGlobalHealthMonitor();
      const monitor2 = getGlobalHealthMonitor();
      
      expect(monitor1).not.toBe(monitor2);
    });
  });
});
