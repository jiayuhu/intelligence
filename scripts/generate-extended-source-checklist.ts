import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const entries = [
  {
    title: "Reddit / Social News",
    description:
      "扫描 /r/MachineLearning、/r/ArtificialIntelligence，每天取 top 20 热帖，记录标题、作者、发布时间、链接，标记是否有 agent、GPT、Altman、governance 关键词。",
    links: [
      "https://www.reddit.com/r/MachineLearning/top/?t=day",
      "https://www.reddit.com/r/ArtificialIntelligence/top/?t=day",
    ],
  },
  {
    title: "Hacker News",
    description:
      "关注 `AI`、`Machine Learning`、`Software` 分类，优先采集前三页热帖，记录 href 与简要摘要，重点追踪 Copilot、OpenAI、GitHub、Altman、governance 相关内容。",
    links: ["https://news.ycombinator.com/news", "https://news.ycombinator.com/newest"],
  },
  {
    title: "Tech Media",
    description:
      "每日查 TechCrunch、The Verge、Axios Tech、Business Insider、Reuters Tech、Wired 等的 latest/AI 页面，提取涉及 agent、AI coding、治理或领袖人物的报道链接，并记录摘要与发布时间。",
    links: [
      "https://techcrunch.com/tag/ai/",
      "https://www.theverge.com/ai",
      "https://www.axios.com/tag/ai",
      "https://www.businessinsider.com/tag/ai",
      "https://www.reuters.com/technology/",
      "https://www.wired.com/tag/ai/",
    ],
  },
];

async function main(): Promise<void> {
  const repoRoot = path.resolve(new URL(import.meta.url).pathname, "..", "..");
  const outputDir = path.join(repoRoot, "prompts", "ai-industry");
  const outputPath = path.join(outputDir, "extended-source-checklist.md");
  const lines = [
    "# 扩展采集清单",
    "",
    "此清单用于日常抓取的补充源，按来源类别列出优先关注的页面、关键词和落盘格式，便于形成更广的舆论视角。",
    "",
    ...entries.flatMap((entry, index) => [
      `## ${index + 1}. ${entry.title}`,
      "",
      `${entry.description}`,
      "",
      ...entry.links.map((link) => `- ${link}`),
      "",
    ]),
    "## 使用建议",
    "",
    "- 每日按顺序扫表中链接，补充标题/发布时间/摘要/关联主题（agent、governance、leader、model、coding 等）。",
    "- 若发现高价值热帖，将链接及抓取时间写入 `prompts/ai-industry/first-run-source-log.md`，标注`source_tier`（P0/P1/P2）。",
    "- 把新增链接同步到 `prompts/ai-industry/source-sites.md` 以避免重复覆盖。",
    "",
  ];

  await mkdir(path.join(repoRoot, "prompts", "ai-industry"), { recursive: true });
  await writeFile(outputPath, lines.join("\n"), "utf8");
  console.log(`已更新扩展采集清单：${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
