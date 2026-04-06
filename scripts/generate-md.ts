import { mkdir, readFile, writeFile } from "node:fs/promises";
import { aiIndustryTitles, getAiIndustryFileName } from "../titles/ai-industry.js";
import { normalizeFetchResult } from "../src/lib/fetch.js";
import { polishChineseLines, polishChineseText } from "../src/lib/editor.js";
import { getIntelOutputDirPath, getIntelOutputPath, getPromptPath, getRepoRoot, getReportDate } from "../src/lib/workflow-paths.js";
import type { AiIndustryClassification, AiIndustryFetchItem, AiIndustryFetchResult } from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

const CATEGORY_TITLES: Record<Exclude<AiIndustryClassification, "待确认线索">, string> = {
  "AI Agent": "2.1 AI Agent",
  "AI Coding": "2.2 AI Coding",
  "头部 AI 企业": "2.5 头部 AI 企业",
  "AI 领袖人物": "2.6 AI 领袖人物",
  "模型与基础设施": "2.7 模型 / 基础设施 / 开源生态",
  "开源生态": "2.7 模型 / 基础设施 / 开源生态",
  "政策与监管": "2.8 政策 / 监管 / 合规",
};

const SOURCE_KIND_LABELS = {
  official: "官方来源",
  media: "媒体报道",
  community: "社区讨论",
  podcast: "播客节目页",
  transcript: "文字稿",
} as const;

function compareItems(left: AiIndustryFetchItem, right: AiIndustryFetchItem): number {
  const confidenceRank = { high: 3, medium: 2, low: 1 };
  const sourceTierRank = { tier1: 3, tier2: 2, tier3: 1, undefined: 0 };
  return (
    confidenceRank[right.confidence] - confidenceRank[left.confidence]
    || sourceTierRank[right.source_tier ?? "undefined"] - sourceTierRank[left.source_tier ?? "undefined"]
    || right.published_at.localeCompare(left.published_at)
  );
}

function formatPublishedDate(value: string): string {
  return value.includes("T") ? value.slice(0, 10) : value;
}

function pickTopItems(fetchResult: AiIndustryFetchResult): AiIndustryFetchItem[] {
  const categoryPriority: AiIndustryClassification[] = [
    "AI Agent",
    "AI Coding",
    "头部 AI 企业",
    "AI 领袖人物",
    "模型与基础设施",
    "政策与监管",
    "开源生态",
  ];

  const selected: AiIndustryFetchItem[] = [];

  for (const category of categoryPriority) {
    const group = fetchResult.groups.find((entry) => entry.category === category);
    const candidate = group?.items.slice().sort(compareItems)[0];
    if (candidate) {
      selected.push(candidate);
    }
    if (selected.length === 4) {
      break;
    }
  }

  return selected;
}

function joinFocus(item: AiIndustryFetchItem): string {
  return item.related_focus.join(" / ");
}

function summarizeSupportingSources(item: AiIndustryFetchItem): string {
  if (!item.supporting_sources?.length) {
    return "";
  }

  return item.supporting_sources
    .map((source) => `${source.label}（${SOURCE_KIND_LABELS[source.kind]}${source.note ? `，${source.note}` : ""}）`)
    .join("；");
}

function formatSourceLine(item: AiIndustryFetchItem): string {
  const primary = `${item.source_name}：${item.source_url}`;
  const supporting = (item.supporting_sources ?? [])
    .map((source) => `${source.label}：${source.url}`)
    .join("；");

  return supporting ? `${primary}；补充来源：${supporting}` : primary;
}

function buildCoreConclusion(item: AiIndustryFetchItem): string {
  return polishChineseText(item.title);
}

function buildCoreEvidence(item: AiIndustryFetchItem): string {
  const support = summarizeSupportingSources(item);
  const supportText = support ? `补充信号包括 ${support}。` : "";
  return polishChineseText(`主来源为 ${item.source_name}（${formatPublishedDate(item.published_at)}），核心事实是：${item.event_summary} ${supportText}`.trim());
}

function buildCoreDecisionImplication(item: AiIndustryFetchItem): string {
  const focus = joinFocus(item);
  if (focus.includes("治理") || focus.includes("企业部署") || focus.includes("审计")) {
    return "需要把权限边界、网络访问、签名提交和责任归属纳入统一治理，不应继续把此类能力视为单点试验。";
  }
  if (focus.includes("模型退役") || focus.includes("默认模型") || focus.includes("版本迁移") || focus.includes("模型路由")) {
    return "需要把模型迁移、兼容性回归和客户预期管理作为正式项目推进，而不是由单个团队临时响应。";
  }
  if (focus.includes("经营决策") || focus.includes("企业采用") || focus.includes("AI 领袖人物")) {
    return "需要把 AI 采用节奏、预算与治理责任提到管理层议程，避免组织响应继续滞后于平台变化。";
  }

  return "需要根据这条变化调整平台选型、回归测试与治理边界，避免后续窗口被动响应。";
}

function buildCoreWatchouts(item: AiIndustryFetchItem): string {
  const lines: string[] = [];
  if (item.supporting_sources?.length) {
    lines.push("补充信号后续是否继续升温");
  }
  if (item.source_tier !== "tier1") {
    lines.push("是否出现更高等级的一手来源或原始转写");
  }
  if (item.related_focus.some((entry) => entry.includes("模型") || entry.includes("路由") || entry.includes("迁移"))) {
    lines.push("默认模型与迁移路径是否继续变化");
  }
  if (item.related_focus.some((entry) => entry.includes("治理") || entry.includes("审计") || entry.includes("部署"))) {
    lines.push("治理能力是否扩展到更多组织级控制项");
  }
  if (item.related_focus.some((entry) => entry.includes("经营决策") || entry.includes("企业采用"))) {
    lines.push("是否出现更多面向 CEO / CFO / 合规负责人的公开表态");
  }

  return polishChineseText(lines.length ? lines.join("；") : "下一窗口需继续跟踪该主题是否出现更强的一手证据。");
}

function buildTrendSection(fetchResult: AiIndustryFetchResult): string[] {
  const lines = [
    "## 三、行业趋势",
    "1. **治理控制面正在成为 AI Agent 与 AI Coding 的默认竞争要素**",
    `依据：${polishChineseText("GitHub 在同一时间窗口内连续发布组织级 firewall、runner controls、签名提交与模型退役说明，说明平台方正在把权限、网络边界、审计和迁移控制直接嵌入产品。")}`,
    `解读：${polishChineseText("企业不再只比较模型效果，而会同时比较运行边界、可审计性和回滚能力。")}`,
    "2. **默认模型与自动路由正在替代用户手动选型**",
    `依据：${polishChineseText("OpenAI 把 GPT-5.3 与 GPT-5.2 Thinking 的路由写进帮助中心，GitHub 则用退役公告和替代模型建议推进平台统一调度。")}`,
    `解读：${polishChineseText("模型生命周期管理会成为企业侧的常规工作，版本回归和工作流兼容测试需要前置。")}`,
  ];

  if (fetchResult.groups.some((group) => group.category === "AI 领袖人物")) {
    lines.push(
      "3. **AI 采用讨论正在从技术试验进入管理层议程**",
      `依据：${polishChineseText("Axios、Business Insider 与节目页文字说明都把 Sam Altman 的最新表达指向企业预算、治理压力和社会信任，而不只是模型能力本身。")}`,
      `解读：${polishChineseText("后续情报不能只写产品升级，还要同步追踪 CEO、法务、合规和采购层面的动作。")}`,
    );
  }

  return lines;
}

function buildBusinessSection(): string[] {
  return [
    "## 四、对业务的含义",
    `- ${polishChineseText("对产品团队而言，模型默认值、路由策略和权限边界需要显式展示，否则用户会把平台级调整误读为能力退化。")}`,
    `- ${polishChineseText("对研发团队而言，旧模型退役与新默认模型切换将持续发生，必须把回归测试、权限审计和工作流稳定性校验纳入日常流程。")}`,
    `- ${polishChineseText("对管理层而言，AI 采用的真正摩擦已经从单点试用转向治理、预算、采购与责任归属。")}`,
  ];
}

function buildSourceAppendix(fetchResult: AiIndustryFetchResult): string[] {
  const rows = fetchResult.groups
    .flatMap((group) => group.items)
    .sort(compareItems)
    .map((item) => {
      const support = (item.supporting_sources ?? []).map((source) => `${source.label} ${source.url}`).join("；");
      return `| ${item.title} | ${item.source_url} | ${support || "无"} | ${item.confidence.toUpperCase()} | ${formatPublishedDate(item.published_at)} |`;
    });

  return [
    "## 五、来源附录",
    "| 结论 | 原始链接 | 补充信号 | 证据等级 | 发布时间 |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ];
}

async function loadFetchResult(reportDate: string): Promise<AiIndustryFetchResult> {
  const fetchPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "fetch",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "json",
  });

  try {
    const content = await readFile(fetchPath, "utf8");
    return normalizeFetchResult(JSON.parse(content) as AiIndustryFetchResult);
  } catch {
    const fallbackPath = getPromptPath(repoRoot, "ai-industry", "collect-output-example-latest.json");
    const content = await readFile(fallbackPath, "utf8");
    return normalizeFetchResult(JSON.parse(content) as AiIndustryFetchResult);
  }
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const fetchResult = await loadFetchResult(reportDate);
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "md",
  });
  const outputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "md",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "md",
  });

  const keyPoints = pickTopItems(fetchResult);
  const lines: string[] = [
    "## 一、本期要点",
    ...keyPoints.flatMap((item, index) => [
      `${index + 1}. **${polishChineseText(item.title)}**`,
      `结论：${buildCoreConclusion(item)}`,
      `证据：${buildCoreEvidence(item)}`,
      `决策含义：${buildCoreDecisionImplication(item)}`,
      `需观察：${buildCoreWatchouts(item)}`,
    ]),
    "",
    "## 二、核心动态",
  ];

  for (const group of fetchResult.groups) {
    if (group.category === "待确认线索") {
      continue;
    }
    lines.push(`### ${CATEGORY_TITLES[group.category as Exclude<AiIndustryClassification, "待确认线索">]}`);
    group.items
      .slice()
      .sort(compareItems)
      .forEach((item, index) => {
        lines.push(
          `${index + 1}. **${polishChineseText(item.title)}**`,
          `结论：${buildCoreConclusion(item)}`,
          `证据：${buildCoreEvidence(item)}`,
          `决策含义：${buildCoreDecisionImplication(item)}`,
          `需观察：${buildCoreWatchouts(item)}`,
          `可信度：${item.confidence === "high" ? "高" : item.confidence === "medium" ? "中" : "低"}｜发布时间：${formatPublishedDate(item.published_at)}`,
          `信息源：${formatSourceLine(item)}`,
        );
      });
    lines.push("");
  }

  lines.push(
    ...buildTrendSection(fetchResult),
    "",
    ...buildBusinessSection(),
    "",
    ...buildSourceAppendix(fetchResult),
    "",
  );

  const content = polishChineseLines(lines).join("\n");

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, content, "utf8");

  console.log(`已生成 Markdown 情报文件：${outputPath}`);
  console.log(`固定文件名：${getAiIndustryFileName({ reportDate, extension: "md" })}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
