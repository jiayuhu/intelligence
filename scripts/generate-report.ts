import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderHtmlDocument } from "../src/lib/html.js";
import { renderMarkdownReportHtml } from "../src/lib/markdown.js";
import { aiIndustryTitles, getAiIndustryFileName } from "../titles/ai-industry.js";
import {
  getIntelOutputDirPath,
  getIntelOutputPath,
  getRepoRoot,
  getReportDate,
  getTemplatePath,
} from "../src/lib/workflow-paths.js";

const repoRoot = getRepoRoot(import.meta.url);

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const markdownPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "md",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "md",
  });
  const baseTemplatePath = getTemplatePath(repoRoot, "html-base.html");
  const headerTemplatePath = getTemplatePath(repoRoot, "report-header.html");
  const bodyTemplatePath = getTemplatePath(repoRoot, "report-body.html");
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "html",
  });
  const outputPath = getIntelOutputPath({
    repoRoot,
    outputDirName: "html",
    categoryKey: aiIndustryTitles.fileBaseName,
    reportDate,
    extension: "html",
  });
  const baseTemplate = await readFile(baseTemplatePath, "utf8");
  const headerTemplate = await readFile(headerTemplatePath, "utf8");
  const bodyTemplate = await readFile(bodyTemplatePath, "utf8");
  const markdown = await readFile(markdownPath, "utf8");
  const contentHtml = renderMarkdownReportHtml(markdown);
  const html = renderHtmlDocument({
    baseTemplate,
    headerTemplate,
    bodyTemplate,
    values: {
      title: aiIndustryTitles.reportTitle,
      categoryName: aiIndustryTitles.reportTitle,
      subtitle: aiIndustryTitles.reportSubtitle,
      reportDate,
      contentHtml,
    },
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, html, "utf8");

  console.log(`已生成 HTML 情报文件：${outputPath}`);
  console.log(`来源 Markdown 文件：${markdownPath}`);
  console.log(`使用母版：${baseTemplatePath}`);
  console.log(`固定文件名：${getAiIndustryFileName({ reportDate, extension: "html" })}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
