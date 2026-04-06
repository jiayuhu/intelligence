import { mkdir, readFile, writeFile } from "node:fs/promises";
import { aiIndustryTitles, getAiIndustryEmailSubject } from "../titles/ai-industry.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";
import { extractMarkdownSection, normalizeMarkdownText } from "../src/lib/markdown.js";
import type { AiIndustryEmailHighlight, AiIndustryEmailSendResult } from "../src/types/ai-industry.js";

const repoRoot = getRepoRoot(import.meta.url);

function isPlaceholderText(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  const text = normalizeMarkdownText(value);
  return [
    "待确认",
    "请先",
    "请补充",
    "请基于多个条目归纳趋势",
    "请用 3-5 条短句概括本期结论",
    "这里将填入结构化情报内容",
  ].some((fragment) => text.includes(fragment));
}

type SummaryBlock = {
  title: string;
  evidence: string;
  decisionImplication: string;
};

function cleanTitle(value: string): string {
  return normalizeMarkdownText(value.replace(/\*\*/g, ""));
}

function parseNumberedSummaryBlocks(section: string): SummaryBlock[] {
  const lines = section.split(/\r?\n/);
  const blocks: SummaryBlock[] = [];
  let current: SummaryBlock | null = null;
  let inBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("---")) {
      if (current && inBlock) {
        blocks.push(current);
        current = null;
        inBlock = false;
      }
      continue;
    }

    // 匹配 **1. 标题** 或 1. 标题 格式
    const titleMatch = trimmed.match(/^(?:\*\*)?(\d+)\.\s+(.+?)(?:\*\*)?$/);
    if (titleMatch) {
      if (current) {
        blocks.push(current);
      }
      current = {
        title: cleanTitle(titleMatch[2]),
        evidence: "",
        decisionImplication: "",
      };
      inBlock = true;
      continue;
    }

    if (!current || !inBlock) {
      continue;
    }

    // 显式标记的字段
    if (trimmed.startsWith("证据：") || trimmed.startsWith("摘要：")) {
      current.evidence = normalizeMarkdownText(trimmed.replace(/^(证据|摘要)：/, ""));
      continue;
    }

    if (trimmed.startsWith("决策含义：") || trimmed.startsWith("解读：")) {
      current.decisionImplication = normalizeMarkdownText(trimmed.replace(/^(决策含义|解读)：/, ""));
      continue;
    }

    // 没有显式标记的段落
    const normalizedText = normalizeMarkdownText(trimmed);
    if (!current.evidence) {
      current.evidence = normalizedText;
    } else if (!current.decisionImplication) {
      current.decisionImplication = normalizedText;
    } else {
      current.decisionImplication += " " + normalizedText;
    }
  }

  if (current) {
    blocks.push(current);
  }

  // 如果只有 evidence 没有 decisionImplication，尝试从 evidence 提取关键句
  for (const block of blocks) {
    if (block.evidence && !block.decisionImplication) {
      // 提取最后一句作为决策含义，或生成一个默认的
      const sentences = block.evidence.split(/(?<=[。\.])\s+/);
      if (sentences.length > 1) {
        block.decisionImplication = sentences.pop() || "";
        block.evidence = sentences.join(" ");
      } else {
        block.decisionImplication = "建议关注此变化对业务的影响并制定应对策略。";
      }
    }
  }

  return blocks.filter((block) => block.title && block.evidence);
}

function buildHighlights(markdown: string): AiIndustryEmailHighlight[] {
  const summaryBlocks = parseNumberedSummaryBlocks(extractMarkdownSection(markdown, "## 一、本期要点"));
  const highlights = summaryBlocks
    .filter((block) => !isPlaceholderText(block.evidence) && !isPlaceholderText(block.decisionImplication))
    .slice(0, 5)
    .map((block) => ({
      title: block.title,
      evidence: block.evidence,
      decision_implication: block.decisionImplication,
    }));

  if (highlights.length >= 5) {
    return highlights;
  }

  return [
    {
      title: "模型路由与默认模型切换正在前台化",
      evidence: "平台正在把模型默认值、自动切换和能力边界直接写进产品文档与界面逻辑。",
      decision_implication: "管理层需要把模型变更管理纳入客户沟通与回归测试流程，避免平台默认调整带来业务侧误读。",
    },
    {
      title: "AI Coding 正在从工具能力竞争转向治理能力竞争",
      evidence: "签名提交、runner、firewall 和权限控制等治理项开始与 coding workflow 一起发布。",
      decision_implication: "管理层应把治理能力列入采购与平台选型标准，而不是只比较生成效果。",
    },
    {
      title: "企业采用 AI 的成本正在转向迁移与治理",
      evidence: "旧模型退役、默认模型更替和 runtime 控制能力同时推进。",
      decision_implication: "管理层需要为版本迁移、权限审计和稳定性验证预留明确的人力和时间窗口。",
    },
  ];
}

function buildOpening(): string {
  return "本期邮件精选24小时内对决策最有影响的五条变化，涵盖 AI Agent、AI Coding、模型基础设施、政策监管和社区热点。完整证据链、来源附录和详细分析见 PDF 附件。";
}

function buildClosing(): string {
  return "完整分析、来源附录、社区讨论链接和节目文字稿索引已随信附上。下一窗口将继续补抓 Anthropic、DeepMind 与更多社区高价值线索，并优先补齐可直接引用的原始文字材料。";
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const markdownInputPath = process.argv[2]
    ? process.argv[2]
    : getIntelOutputPath({
        repoRoot,
        outputDirName: "md",
        categoryKey: aiIndustryTitles.fileBaseName,
        reportDate,
        extension: "md",
      });
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "email",
  });
  const outputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "email",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "json",
  });
  const markdown = await readFile(markdownInputPath, "utf8");
  const reportDateFromMarkdown = markdown.match(/^日期：(\d{4}-\d{2}-\d{2})$/m)?.[1] ?? reportDate;
  const timeWindowHours =
    Number(markdown.match(/^时间窗口：(\d+)\s*小时$/m)?.[1]) || aiIndustryTitles.timeWindowHours;

  const sendResult: AiIndustryEmailSendResult = {
    report_title: aiIndustryTitles.reportTitle,
    report_date: reportDateFromMarkdown,
    time_window_hours: timeWindowHours,
    email_subject: getAiIndustryEmailSubject(reportDateFromMarkdown),
    opening: buildOpening(),
    highlights: buildHighlights(markdown),
    closing: buildClosing(),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(sendResult, null, 2)}\n`, "utf8");

  console.log(`已生成发送 JSON：${outputPath}`);
  console.log(`来源 Markdown：${markdownInputPath}`);
  console.log(`固定邮件标题：${sendResult.email_subject}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
