import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { resolve } from "node:path";
import { renderHtmlDocument } from "../src/lib/html.js";
import { escapeHtml, renderEmailHighlightsHtml } from "../src/lib/email.js";
import type { AiIndustryEmailSendResult } from "../src/types/ai-industry.js";
import { aiIndustryTitles, getAiIndustryEmailSubject, getAiIndustryFileName } from "../titles/ai-industry.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
  getTemplatePath,
} from "../src/lib/workflow-paths.js";

const repoRoot = getRepoRoot(import.meta.url);

function createDefaultSendResult(reportDate: string): AiIndustryEmailSendResult {
  return {
    report_title: aiIndustryTitles.reportTitle,
    report_date: reportDate,
    time_window_hours: aiIndustryTitles.timeWindowHours,
    email_subject: getAiIndustryEmailSubject(reportDate),
    opening: "本期聚焦模型路由、AI Coding 治理与企业采用节奏三条主线，完整证据链和来源附录请查看 PDF 附件。",
    highlights: [
      {
        title: "模型默认值与自动路由正在成为产品层决策",
        evidence: "平台把默认模型、思考时长和工具权限直接前置到产品文档与界面策略中。",
        decision_implication: "管理层需要把模型变更管理纳入客户沟通与回归测试流程，避免平台默认调整带来业务侧误读。",
      },
      {
        title: "AI Coding 平台正在强化治理与审计能力",
        evidence: "签名提交、运行环境控制和组织级策略与 coding workflow 一起发布。",
        decision_implication: "管理层应把治理能力列入采购与平台选型标准，而不是只比较生成效果。",
      },
      {
        title: "迁移与治理成本正在替代单纯训练成本成为隐性负担",
        evidence: "旧模型退役、默认模型切换和 runtime 控制能力同时推进。",
        decision_implication: "管理层需要为版本迁移、权限审计和稳定性验证预留明确的人力和时间窗口。",
      },
    ],
    closing: "完整分析、来源附录和后续跟踪建议已随信附上，建议优先核对 PDF 中的证据链后再做对外引用。",
  };
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const generatedSendOutputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "email",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "json",
  });
  const hasGeneratedSendOutput = await access(generatedSendOutputPath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);
  const sendInputPath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : hasGeneratedSendOutput
      ? generatedSendOutputPath
      : "";
  const baseTemplatePath = getTemplatePath(repoRoot, "html-base.html");
  const headerTemplatePath = getTemplatePath(repoRoot, "email-header.html");
  const bodyTemplatePath = getTemplatePath(repoRoot, "email-body.html");
  const reportHtmlPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "html",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "html",
  });
  const emailOutputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "email",
  });
  const emailOutputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "email",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "html",
  });
  const expectedEmailSubject = getAiIndustryEmailSubject(reportDate);
  const baseTemplate = await readFile(baseTemplatePath, "utf8");
  const headerTemplate = await readFile(headerTemplatePath, "utf8");
  const bodyTemplate = await readFile(bodyTemplatePath, "utf8");
  const sendResult = sendInputPath
    ? (JSON.parse(await readFile(sendInputPath, "utf8")) as AiIndustryEmailSendResult)
    : createDefaultSendResult(reportDate);

  if (sendInputPath) {
    if (sendResult.report_title !== aiIndustryTitles.reportTitle) {
      throw new Error(`发送 JSON 的 report_title 不匹配：${sendResult.report_title}`);
    }
    if (sendResult.report_date !== reportDate) {
      throw new Error(`发送 JSON 的 report_date 不匹配：${sendResult.report_date}`);
    }
    if (sendResult.time_window_hours !== aiIndustryTitles.timeWindowHours) {
      throw new Error(`发送 JSON 的 time_window_hours 不匹配：${sendResult.time_window_hours}`);
    }
    if (sendResult.email_subject !== expectedEmailSubject) {
      throw new Error(`发送 JSON 的 email_subject 不匹配：${sendResult.email_subject}`);
    }
  }

  const emailHtml = renderHtmlDocument({
    baseTemplate,
    headerTemplate,
    bodyTemplate,
    values: {
      subject: escapeHtml(sendResult.email_subject),
      subtitle: escapeHtml(aiIndustryTitles.reportSubtitle),
      reportDate,
      pdfAttachmentName: escapeHtml(getAiIndustryFileName({ reportDate, extension: "pdf" })),
      timeWindowHours: String(aiIndustryTitles.timeWindowHours),
      opening: escapeHtml(sendResult.opening),
      highlightsHtml: renderEmailHighlightsHtml(sendResult.highlights),
      closing: escapeHtml(sendResult.closing),
    },
  });

  await mkdir(emailOutputDir, { recursive: true });
  await writeFile(emailOutputPath, emailHtml, "utf8");

  console.log(`已生成邮件 HTML 预览：${emailOutputPath}`);
  console.log(`邮件主题：${sendResult.email_subject}`);
  console.log(`收件组：${aiIndustryTitles.recipientGroup}`);
  console.log(`邮件正文母版：${baseTemplatePath}`);
  console.log(`邮件正文头部：${headerTemplatePath}`);
  console.log(`邮件正文内容：${bodyTemplatePath}`);
  console.log(`邮件正文 JSON：${sendInputPath || "内置预览数据"}`);
  console.log(`HTML 成品：${reportHtmlPath}`);
  console.log(`发送日期：${reportDate}`);
  console.log(`固定文件名：${getAiIndustryFileName({ reportDate, extension: "html" })}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
