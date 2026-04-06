/**
 * 健康监控和告警模块
 * 
 * 功能：
 * 1. 跟踪每个源的健康状态
 * 2. 计算失败率并触发告警
 * 3. 记录历史统计数据
 * 4. 支持多种通知方式（日志、邮件、Webhook）
 */

import { FETCH_CONFIG } from "../fetch-config.js";
import fs from "node:fs";
import path from "node:path";

export interface SourceHealthRecord {
  sourceId: string;
  sourceName: string;
  timestamp: string;
  success: boolean;
  error?: string;
  responseTime?: number;
  itemsFetched?: number;
}

export interface SourceHealthStats {
  sourceId: string;
  sourceName: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  failureRate: number;
  lastAttempt: string;
  lastSuccess?: string;
  lastFailure?: string;
  avgResponseTime?: number;
  isHealthy: boolean;
}

export interface AlertConfig {
  failureRateThreshold: number;
  minAttempts: number;
  emailAlert: boolean;
  emailRecipients?: string[];
  webhookAlert: boolean;
  webhookUrl?: string;
}

export interface HealthReport {
  generatedAt: string;
  summary: {
    totalSources: number;
    healthySources: number;
    unhealthySources: number;
    totalAttempts: number;
    overallSuccessRate: number;
  };
  sources: SourceHealthStats[];
  alerts: string[];
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  failureRateThreshold: FETCH_CONFIG.HEALTH.FAILURE_RATE_THRESHOLD,
  minAttempts: FETCH_CONFIG.HEALTH.MIN_ATTEMPTS,
  emailAlert: false,
  webhookAlert: false,
};

export class HealthMonitor {
  private records: SourceHealthRecord[] = [];
  private alertConfig: AlertConfig;
  private historyDir: string;

  constructor(
    alertConfig: Partial<AlertConfig> = {},
    historyDir: string = "outputs/health"
  ) {
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...alertConfig };
    this.historyDir = historyDir;
    this.ensureHistoryDir();
    this.loadHistory();
  }

  private ensureHistoryDir(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  private loadHistory(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FETCH_CONFIG.HEALTH.HISTORY_DAYS);

    try {
      const files = fs.readdirSync(this.historyDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        
        const filePath = path.join(this.historyDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Array.isArray(data)) {
          this.records.push(...data);
        }
      }
    } catch (error) {
      console.warn("加载健康历史记录失败:", error);
    }
  }

  recordAttempt(record: Omit<SourceHealthRecord, "timestamp">): void {
    const fullRecord: SourceHealthRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };
    
    this.records.push(fullRecord);
    this.checkAlert(fullRecord);
  }

  private checkAlert(record: SourceHealthRecord): void {
    const stats = this.getSourceStats(record.sourceId);
    if (!stats) return;
    if (stats.totalAttempts < this.alertConfig.minAttempts) return;
    
    if (stats.failureRate >= this.alertConfig.failureRateThreshold) {
      const alertMessage = `告警: 源 "${record.sourceName}" 失败率 ${(stats.failureRate * 100).toFixed(1)}%`;
      console.error(alertMessage);
      
      if (this.alertConfig.emailAlert && this.alertConfig.emailRecipients) {
        this.sendEmailAlert(alertMessage, stats);
      }
      
      if (this.alertConfig.webhookAlert && this.alertConfig.webhookUrl) {
        this.sendWebhookAlert(alertMessage, stats);
      }
    }
  }

  private async sendEmailAlert(message: string, stats: SourceHealthStats): Promise<void> {
    console.log(`[邮件告警] 收件人: ${this.alertConfig.emailRecipients?.join(", ")}`);
    console.log(`[邮件告警] 内容: ${message}`);
  }

  private async sendWebhookAlert(message: string, stats: SourceHealthStats): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;
    
    try {
      const response = await fetch(this.alertConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stats, timestamp: new Date().toISOString() }),
      });
      
      if (!response.ok) {
        console.error(`Webhook 告警发送失败: ${response.status}`);
      }
    } catch (error) {
      console.error("Webhook 告警发送失败:", error);
    }
  }

  getSourceStats(sourceId: string): SourceHealthStats | null {
    const sourceRecords = this.records.filter((r) => r.sourceId === sourceId);
    if (sourceRecords.length === 0) return null;
    
    const totalAttempts = sourceRecords.length;
    const successCount = sourceRecords.filter((r) => r.success).length;
    const failureCount = totalAttempts - successCount;
    const failureRate = failureCount / totalAttempts;
    
    const successRecords = sourceRecords.filter((r) => r.success && r.responseTime);
    const avgResponseTime = successRecords.length > 0
      ? successRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successRecords.length
      : undefined;
    
    const lastAttempt = sourceRecords[sourceRecords.length - 1];
    const lastSuccess = sourceRecords.filter((r) => r.success).pop();
    const lastFailure = sourceRecords.filter((r) => !r.success).pop();
    
    // 未达到最小尝试次数时，默认为健康状态
    const isHealthy = totalAttempts < this.alertConfig.minAttempts 
      ? true 
      : failureRate < this.alertConfig.failureRateThreshold;
    
    return {
      sourceId,
      sourceName: lastAttempt.sourceName,
      totalAttempts,
      successCount,
      failureCount,
      failureRate,
      lastAttempt: lastAttempt.timestamp,
      lastSuccess: lastSuccess?.timestamp,
      lastFailure: lastFailure?.timestamp,
      avgResponseTime,
      isHealthy,
    };
  }

  getAllStats(): SourceHealthStats[] {
    const sourceIds = [...new Set(this.records.map((r) => r.sourceId))];
    return sourceIds
      .map((id) => this.getSourceStats(id))
      .filter((stats): stats is SourceHealthStats => stats !== null);
  }

  generateReport(): HealthReport {
    const allStats = this.getAllStats();
    const totalAttempts = allStats.reduce((sum, s) => sum + s.totalAttempts, 0);
    const totalSuccesses = allStats.reduce((sum, s) => sum + s.successCount, 0);
    
    const alerts: string[] = [];
    for (const stats of allStats) {
      if (!stats.isHealthy && stats.totalAttempts >= this.alertConfig.minAttempts) {
        alerts.push(`源 "${stats.sourceName}" 不健康，失败率 ${(stats.failureRate * 100).toFixed(1)}%`);
      }
    }
    
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalSources: allStats.length,
        healthySources: allStats.filter((s) => s.isHealthy).length,
        unhealthySources: allStats.filter((s) => !s.isHealthy).length,
        totalAttempts,
        overallSuccessRate: totalAttempts > 0 ? totalSuccesses / totalAttempts : 0,
      },
      sources: allStats,
      alerts,
    };
  }

  saveDailyRecords(): void {
    const today = new Date().toISOString().split("T")[0];
    const filePath = path.join(this.historyDir, `${today}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.records, null, 2));
      console.log(`健康记录已保存: ${filePath}`);
    } catch (error) {
      console.error("保存健康记录失败:", error);
    }
  }

  clearRecords(): void {
    this.records = [];
  }
}

let globalMonitor: HealthMonitor | undefined;

export function getGlobalHealthMonitor(alertConfig?: Partial<AlertConfig>): HealthMonitor {
  if (!globalMonitor) {
    globalMonitor = new HealthMonitor(alertConfig);
  }
  return globalMonitor;
}

export function resetGlobalHealthMonitor(): void {
  globalMonitor = undefined;
}
