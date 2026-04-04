import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { intelTitles } from "../titles/intel-titles.js";
import { buildIntelPrompt } from "../src/lib/prompt.js";
import { renderTemplate } from "../src/lib/template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main(): Promise<void> {
  const title = intelTitles.industry;
  const reportDate = new Date().toISOString().slice(0, 10);
  const htmlTemplatePath = path.join(repoRoot, "templates", "report.html");
  const outputDir = path.join(repoRoot, "outputs", "html");
  const outputPath = path.join(outputDir, `${title.categoryKey}-${reportDate}.html`);
  const promptTemplatePath = path.join(repoRoot, "prompts", "intel-prompt-template.md");
  const htmlTemplate = await readFile(htmlTemplatePath, "utf8");
  const promptTemplate = await readFile(promptTemplatePath, "utf8");
  const prompt = buildIntelPrompt(title.categoryName, promptTemplate);
  const html = renderTemplate(htmlTemplate, {
    title: title.fileTitle,
    categoryName: title.categoryName,
    reportDate,
    content: prompt,
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, html, "utf8");

  console.log(`已生成 HTML 情报文件：${outputPath}`);
  console.log(`建议使用提示词模板：${promptTemplatePath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
