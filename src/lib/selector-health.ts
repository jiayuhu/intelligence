/**
 * 选择器健康检查
 * 
 * 检测 CSS 选择器是否过时，提供验证和建议
 */

import type { SourceConfig } from "../../sources/ai-industry-sources.js";

export interface SelectorHealthReport {
  sourceId: string;
  sourceName: string;
  status: "healthy" | "warning" | "broken" | "unknown";
  lastChecked: string;
  issues: string[];
  suggestions: string[];
  selectorVersion?: string; // 选择器配置版本
}

/**
 * 选择器配置版本管理
 * 当网站结构变化时，更新版本号
 */
export const SELECTOR_VERSIONS: Record<string, { version: string; lastUpdated: string; notes: string }> = {
  "anthropic-news": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "初始版本" },
  "meta-ai-blog": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "Meta AI 博客" },
  "nvidia": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "NVIDIA 博客" },
  "the-verge-ai": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "The Verge AI" },
  "wired-ai": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "WIRED AI" },
  "cursor-changelog": { version: "1.0.0", lastUpdated: "2026-04-06", notes: "Cursor 更新日志" },
};

/**
 * 检查选择器是否需要更新
 */
export function checkSelectorHealth(source: SourceConfig): SelectorHealthReport {
  const report: SelectorHealthReport = {
    sourceId: source.id,
    sourceName: source.name,
    status: "unknown",
    lastChecked: new Date().toISOString(),
    issues: [],
    suggestions: [],
  };

  // 检查是否有选择器配置
  if (!source.selectors) {
    if (source.primaryStrategy === "cheerio" || source.primaryStrategy === "playwright") {
      report.status = "broken";
      report.issues.push("缺少选择器配置但主要策略需要选择器");
      report.suggestions.push("添加 selectors 配置或更改主要策略");
    } else {
      report.status = "healthy";
    }
    return report;
  }

  const version = SELECTOR_VERSIONS[source.id];
  if (!version) {
    report.status = "warning";
    report.issues.push("选择器未在版本管理中注册");
    report.suggestions.push("在 selector-health.ts 中添加版本信息");
  } else {
    report.selectorVersion = version.version;
    
    // 检查版本是否超过 90 天未更新
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(version.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate > 90) {
      report.status = "warning";
      report.issues.push(`选择器已 ${daysSinceUpdate} 天未更新，可能已过时`);
      report.suggestions.push("手动验证选择器是否仍然有效");
    }
  }

  // 检查必需的字段
  const requiredFields = ["container", "title", "link"] as const;
  for (const field of requiredFields) {
    if (!source.selectors[field]) {
      report.status = "broken";
      report.issues.push(`缺少必需的选择器字段: ${field}`);
    }
  }

  // 警告未使用的可选字段
  const optionalFields = ["date", "summary"] as const;
  const missingOptional = optionalFields.filter(f => !source.selectors![f]);
  if (missingOptional.length > 0) {
    report.suggestions.push(`考虑添加可选字段: ${missingOptional.join(", ")}`);
  }

  if (report.issues.length === 0) {
    report.status = "healthy";
  }

  return report;
}

/**
 * 批量检查所有源的选择器健康状态
 */
export function checkAllSelectorsHealth(sources: SourceConfig[]): SelectorHealthReport[] {
  return sources.map(checkSelectorHealth);
}

/**
 * 输出健康报告摘要
 */
export function printHealthSummary(reports: SelectorHealthReport[]): void {
  const healthy = reports.filter(r => r.status === "healthy").length;
  const warning = reports.filter(r => r.status === "warning").length;
  const broken = reports.filter(r => r.status === "broken").length;
  const unknown = reports.filter(r => r.status === "unknown").length;

  console.log(`\n🔍 选择器健康检查:`);
  console.log(`   ✅ 健康: ${healthy}`);
  console.log(`   ⚠️  警告: ${warning}`);
  console.log(`   ❌ 损坏: ${broken}`);
  console.log(`   ❓ 未知: ${unknown}`);

  const problematic = reports.filter(r => r.status !== "healthy" && r.status !== "unknown");
  if (problematic.length > 0) {
    console.log(`\n⚠️  需要注意的源:`);
    for (const r of problematic) {
      console.log(`   - ${r.sourceName} (${r.status})`);
      for (const issue of r.issues) {
        console.log(`     • ${issue}`);
      }
    }
  }
}
