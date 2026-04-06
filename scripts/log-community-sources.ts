import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceGroup = {
  label: string;
  feeds: Array<{ label: string; url: string; keywords: string[] }>;
};

const groups: SourceGroup[] = [
  {
    label: "Reddit / 社区讨论",
    feeds: [
      {
        label: "r/MachineLearning top(日)",
        url: "https://www.reddit.com/r/MachineLearning/top/?t=day",
        keywords: ["agent", "GPT", "model routing", "Altman"],
      },
      {
        label: "r/ArtificialIntelligence top(日)",
        url: "https://www.reddit.com/r/ArtificialIntelligence/top/?t=day",
        keywords: ["governance", "AI coding", "Copilot", "policy"],
      },
    ],
  },
  {
    label: "Hacker News",
    feeds: [
      {
        label: "news.ycombinator.com/news",
        url: "https://news.ycombinator.com/news",
        keywords: ["AI", "Copilot", "governance", "model release"],
      },
      {
        label: "news.ycombinator.com/newest",
        url: "https://news.ycombinator.com/newest",
        keywords: ["enterprise AI", "agentic", "OpenAI", "GitHub"],
      },
    ],
  },
  {
    label: "主流科技媒体",
    feeds: [
      {
        label: "TechCrunch AI",
        url: "https://techcrunch.com/tag/ai",
        keywords: ["agent", "startups", "Copilot", "policy"],
      },
      {
        label: "The Verge AI",
        url: "https://www.theverge.com/ai",
        keywords: ["OpenAI", "AI coding", "governance", "products"],
      },
      {
        label: "Axios AI",
        url: "https://www.axios.com/tag/ai",
        keywords: ["Altman", "enterprise", "budget", "policy"],
      },
      {
        label: "Business Insider AI",
        url: "https://www.businessinsider.com/tag/ai",
        keywords: ["leadership", "Sam Altman", "perception", "AI coding"],
      },
      {
        label: "Wired AI",
        url: "https://www.wired.com/tag/ai",
        keywords: ["social impact", "policy", "agent", "model migration"],
      },
      {
        label: "Reuters Technology",
        url: "https://www.reuters.com/technology/",
        keywords: ["regulation", "compliance", "enterprise AI", "open source"],
      },
    ],
  },
];

async function main(): Promise<void> {
  const repoRoot = path.resolve(new URL(import.meta.url).pathname, "..", "..");
  const outputDir = path.join(repoRoot, "prompts", "ai-industry");
  const outputPath = path.join(outputDir, "community-source-template.md");
  const header = [
    "# 社区与科技媒体采集模版",
    "",
    "按组填写每天的采集记录：记录采集时间、命中条目、摘要、关键词、抓取源 URL 与确认级别。",
    "",
  ];

  const sections = groups.flatMap((group) => {
    const lines: string[] = [`## ${group.label}`, ""];
    group.feeds.forEach((feed, idx) => {
      lines.push(
        `${idx + 1}. ${feed.label}`,
        "",
        `- URL：${feed.url}`,
        `- 关键词：${feed.keywords.join(" / ")}`,
        "- 记录：",
        "  - 采集时间：",
        "  - 命中标题：",
        "  - 简要摘要（100字以内）：",
        "  - 关联主题（agent / coding / governance / leader）：",
        "  - 来源等级（P0/P1/P2/P3）：",
        "",
      );
    });
    return lines;
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, [...header, ...sections].join("\n"), "utf8");
  console.log(`更新社区与媒体采集模版：${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
