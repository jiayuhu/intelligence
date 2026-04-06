import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { resolve } from "node:path";
import { sendEmailViaAgentMail } from "../src/lib/agentmail.js";
import { loadRepoEnv } from "../src/lib/env.js";
import { buildEmailMimeMessage, renderEmailTextBody } from "../src/lib/email.js";
import { renderHtmlDocument } from "../src/lib/html.js";
import { renderEmailHighlightsHtml, escapeHtml } from "../src/lib/email.js";
import { sendEmailViaSmtp } from "../src/lib/smtp.js";
import type { AiIndustryEmailSendResult } from "../src/types/ai-industry.js";
import { aiIndustryTitles, getAiIndustryEmailSubject, getAiIndustryFileName } from "../titles/ai-industry.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
} from "../src/lib/workflow-paths.js";

const repoRoot = getRepoRoot(import.meta.url);

function getRecipientList(): string[] {
  const configured = process.env.AI_INDUSTRY_EMAIL_TO?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured && configured.length > 0 ? configured : [`${aiIndustryTitles.recipientGroup}@example.com`];
}

function getSmtpConfig():
  | {
      host: string;
      port: number;
      secure: boolean;
      starttls: boolean;
      username?: string;
      password?: string;
      heloHost: string;
    }
  | null {
  const host = process.env.AI_INDUSTRY_SMTP_HOST;
  if (!host) {
    return null;
  }

  return {
    host,
    port: Number(process.env.AI_INDUSTRY_SMTP_PORT ?? "587"),
    secure: process.env.AI_INDUSTRY_SMTP_SECURE === "true",
    starttls: process.env.AI_INDUSTRY_SMTP_STARTTLS !== "false",
    username: process.env.AI_INDUSTRY_SMTP_USER,
    password: process.env.AI_INDUSTRY_SMTP_PASS,
    heloHost: process.env.AI_INDUSTRY_SMTP_HELO ?? "localhost",
  };
}

function getAgentMailConfig():
  | {
      apiKey: string;
      inboxId: string;
      baseUrl: string;
    }
  | null {
  const apiKey = process.env.AI_INDUSTRY_AGENTMAIL_API_KEY;
  const inboxId = process.env.AI_INDUSTRY_AGENTMAIL_INBOX_ID;
  if (!apiKey || !inboxId) {
    return null;
  }

  return {
    apiKey,
    inboxId,
    baseUrl: process.env.AI_INDUSTRY_AGENTMAIL_BASE_URL ?? "https://api.agentmail.to",
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main(): Promise<void> {
  const repoRoot = getRepoRoot(import.meta.url);
  await loadRepoEnv([resolve(repoRoot, ".env"), resolve(repoRoot, ".env.local")]);
  const reportDate = getReportDate();
  const sendJsonPath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : getIntelOutputPath({
      repoRoot,
        outputDirName: "email",
        categoryKey: aiIndustryTitles.fileBaseName,
        reportDate,
        extension: "json",
      });
  const htmlPreviewPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "email",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "html",
  });
  const emlOutputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "email",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "eml",
  });
  const pdfPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "pdf",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "pdf",
  });
  const expectedEmailSubject = getAiIndustryEmailSubject(reportDate);
  const previewExists = await access(htmlPreviewPath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);
  const pdfExists = await access(pdfPath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);

  const sendResult = JSON.parse(await readFile(sendJsonPath, "utf8")) as AiIndustryEmailSendResult;
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
  if (!pdfExists) {
    throw new Error(`找不到 PDF 附件：${pdfPath}`);
  }

  const htmlPreview = previewExists
    ? await readFile(htmlPreviewPath, "utf8")
    : renderHtmlDocument({
        baseTemplate: await readFile(resolve(repoRoot, "templates", "html-base.html"), "utf8"),
        headerTemplate: await readFile(resolve(repoRoot, "templates", "email-header.html"), "utf8"),
        bodyTemplate: await readFile(resolve(repoRoot, "templates", "email-body.html"), "utf8"),
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
  const pdfAttachment = await readFile(pdfPath);
  const pdfSize = (await stat(pdfPath)).size;
  const agentMailConfig = getAgentMailConfig();

  if (!previewExists) {
    await mkdir(getIntelOutputDirPath({ repoRoot, outputDirName: "email" }), { recursive: true });
    await writeFile(htmlPreviewPath, htmlPreview, "utf8");
  }

  const mimeMessage = buildEmailMimeMessage({
    from: "noreply@example.com",
    to: getRecipientList(),
    subject: sendResult.email_subject,
    htmlBody: htmlPreview,
    attachments: [
      {
        filename: getAiIndustryFileName({ reportDate, extension: "pdf" }),
        contentType: "application/pdf",
        content: pdfAttachment,
      },
    ],
  });

  await mkdir(getIntelOutputDirPath({ repoRoot, outputDirName: "email" }), { recursive: true });
  await writeFile(emlOutputPath, mimeMessage, "utf8");

  const agentMailAttachments = [
    {
      filename: getAiIndustryFileName({ reportDate, extension: "pdf" }),
      contentType: "application/pdf",
      contentBase64: pdfAttachment.toString("base64"),
    },
  ];

  const smtpConfig = getSmtpConfig();
  if (agentMailConfig) {
    await sendEmailViaAgentMail({
      config: agentMailConfig,
      to: getRecipientList(),
      subject: sendResult.email_subject,
      html: htmlPreview,
      text: renderEmailTextBody(htmlPreview),
      attachments: agentMailAttachments,
    });
  } else if (smtpConfig) {
    await sendEmailViaSmtp({
      ...smtpConfig,
      from: process.env.AI_INDUSTRY_EMAIL_FROM ?? "noreply@example.com",
      to: getRecipientList(),
      rawMessage: mimeMessage,
    });
  }

  console.log(`已生成邮件包：${emlOutputPath}`);
  console.log(`发送 JSON：${sendJsonPath}`);
  console.log(`HTML 预览：${htmlPreviewPath}`);
  console.log(`PDF 附件：${pdfPath} (${formatFileSize(pdfSize)})`);
  console.log(`邮件主题：${sendResult.email_subject}`);
  console.log(`收件人：${getRecipientList().join(", ")}`);
  console.log(`发件人：${process.env.AI_INDUSTRY_EMAIL_FROM ?? "noreply@example.com"}`);
  console.log(`发送模式：HTML 正文 + PDF 附件`);
  console.log(
    `发送通道：${agentMailConfig ? `AgentMail(${agentMailConfig.baseUrl}, inbox=${agentMailConfig.inboxId})` : smtpConfig ? `${smtpConfig.host}:${smtpConfig.port}` : "未配置，仅生成邮件包"}`,
  );
  console.log(
    `发送状态：${agentMailConfig ? "已通过 AgentMail 实发" : smtpConfig ? "已通过 SMTP 实发" : "未实发，仅生成邮件包"}`,
  );
  console.log(`固定文件名：${getAiIndustryFileName({ reportDate, extension: "html" })}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
