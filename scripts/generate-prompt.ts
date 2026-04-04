import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { intelTitles } from "../titles/intel-titles.js";
import { buildIntelPrompt } from "../src/lib/prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main(): Promise<void> {
  const title = intelTitles.industry;
  const reportDate = new Date().toISOString().slice(0, 10);
  const templatePath = path.join(repoRoot, "prompts", "intel-prompt-template.md");
  const outputDir = path.join(repoRoot, "outputs", "prompts");
  const outputPath = path.join(outputDir, `${title.categoryKey}-${reportDate}.md`);
  const template = await readFile(templatePath, "utf8");
  const prompt = buildIntelPrompt(title.categoryName, template);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, prompt, "utf8");

  console.log(`已生成提示词文件：${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

