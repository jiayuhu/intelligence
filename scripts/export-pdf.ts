import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderMarkdownReportToPdf } from "../src/lib/pdf.js";
import { aiIndustryTitles, getAiIndustryFileName, getAiIndustryPdfTitle } from "../titles/ai-industry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main(): Promise<void> {
  const reportDate = new Date().toISOString().slice(0, 10);
  const htmlPath = path.join(repoRoot, "outputs", "html", getAiIndustryFileName({ reportDate, extension: "html" }));
  const pdfPath = path.join(repoRoot, "outputs", "pdf", getAiIndustryFileName({ reportDate, extension: "pdf" }));
  const htmlExists = await access(htmlPath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!htmlExists) {
    throw new Error(`找不到 HTML 成品：${htmlPath}`);
  }

  await renderMarkdownReportToPdf({
    htmlPath,
    outputPath: pdfPath,
    pdfTitle: getAiIndustryPdfTitle(reportDate),
    reportDate,
  });

  console.log(`已导出 PDF：${pdfPath}`);
  console.log(`输入 HTML：${htmlPath}`);
  console.log(`PDF 标题：${getAiIndustryPdfTitle(reportDate)}`);
  console.log(`固定文件名：${getAiIndustryFileName({ reportDate, extension: "pdf" })}`);
  console.log(`模板标题：${aiIndustryTitles.reportTitle}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
