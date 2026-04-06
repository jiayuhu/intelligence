import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderTemplate } from "../src/lib/template.js";
import { aiIndustryTitles, getAiIndustryEmailSubject, getAiIndustryFileName } from "../titles/ai-industry.js";
import { getIntelOutputDirPath, getPromptPath, getRepoRoot, getReportDate } from "../src/lib/workflow-paths.js";

const repoRoot = getRepoRoot(import.meta.url);

function getSendPromptFileName(reportDate: string): string {
  return getAiIndustryFileName({ reportDate, extension: "md" }).replace(/\.md$/, "-send.md");
}

async function main(): Promise<void> {
  const reportDate = getReportDate();
  const basePath = getPromptPath(repoRoot, aiIndustryTitles.slug, "base.md");
  const stagePath = getPromptPath(repoRoot, aiIndustryTitles.slug, "send.md");
  const outputDir = getIntelOutputDirPath({
    repoRoot,
    outputDirName: "prompts",
  });
  const outputPath = path.join(outputDir, getSendPromptFileName(reportDate));
  const base = await readFile(basePath, "utf8");
  const stage = await readFile(stagePath, "utf8");
  const prompt = renderTemplate(renderTemplate(stage, { base }), {
    promptTitle: aiIndustryTitles.promptTitle,
    reportTitle: aiIndustryTitles.reportTitle,
    reportDate,
    timeWindowHours: String(aiIndustryTitles.timeWindowHours),
    emailSubject: getAiIndustryEmailSubject(reportDate),
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, prompt, "utf8");

  console.log(`已生成发送提示词文件：${outputPath}`);
  console.log(`固定邮件标题：${getAiIndustryEmailSubject(reportDate)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
