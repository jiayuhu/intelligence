import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderTemplate } from "../src/lib/template.js";
import { aiIndustryTitles, getAiIndustryFileName } from "../titles/ai-industry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main(): Promise<void> {
  const reportDate = new Date().toISOString().slice(0, 10);
  const basePath = path.join(repoRoot, "prompts", aiIndustryTitles.slug, "base.md");
  const stagePath = path.join(repoRoot, "prompts", aiIndustryTitles.slug, "collect.md");
  const outputDir = path.join(repoRoot, "outputs", "prompts");
  const outputPath = path.join(outputDir, getAiIndustryFileName({ reportDate, extension: "md" }));
  const base = await readFile(basePath, "utf8");
  const stage = await readFile(stagePath, "utf8");
  const prompt = renderTemplate(renderTemplate(stage, { base }), {
    promptTitle: aiIndustryTitles.promptTitle,
    reportTitle: aiIndustryTitles.reportTitle,
    reportDate,
    timeWindowHours: String(aiIndustryTitles.timeWindowHours),
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, prompt, "utf8");

  console.log(`已生成提示词文件：${outputPath}`);
  console.log(`固定标题：${aiIndustryTitles.promptTitle}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
