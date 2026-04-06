/**
 * AI行业情报 - 统一来源配置（RSS 优先策略）
 * 
 * 设计原则：
 * 1. RSS 是主要抓取方式（最快、最稳定、资源消耗最低）
 * 2. Cheerio 作为第二选择（静态 HTML 解析）
 * 3. Playwright 作为最后手段（最慢但最能处理反爬虫）
 * 
 * 优先级：rss > cheerio > playwright
 */

export type FetchStrategy = "rss" | "cheerio" | "playwright";

export interface SourceConfig {
  /** 来源唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 来源层级 */
  tier: "tier1" | "tier2" | "tier3";
  /** 主要抓取策略 */
  primaryStrategy: FetchStrategy;
  /** 备选策略（按优先级排序） */
  fallbackStrategies: FetchStrategy[];
  /** 网站 URL */
  siteUrl: string;
  /** RSS 地址（如有） */
  rssUrl?: string;
  /** 分类 */
  category: string;
  /** 是否启用 */
  enabled: boolean;
  /** 选择器配置（用于 Cheerio/Playwright） */
  selectors?: {
    container: string;
    title: string;
    link: string;
    date?: string;
    summary?: string;
  };
  /** 请求头（特殊配置） */
  headers?: Record<string, string>;
  /** 备注 */
  notes?: string;
}

/**
 * Tier 1: 官方源（P0 优先级）
 */
export const TIER1_SOURCES: SourceConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://openai.com/news",
    rssUrl: "https://openai.com/blog/rss.xml",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: "article, .blog-card",
      title: "h2, h3",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
  },
  {
    id: "anthropic",
    name: "Anthropic",
    tier: "tier1",
    primaryStrategy: "cheerio",
    fallbackStrategies: ["playwright"],
    siteUrl: "https://www.anthropic.com/news",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: "article, [data-testid='news-card']",
      title: "h2, h3",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
    notes: "无 RSS，Cheerio 优先",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://github.blog",
    rssUrl: "https://github.blog/feed/",
    category: "AI Coding",
    enabled: true,
    selectors: {
      container: "article",
      title: "h2",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
  },
  {
    id: "github-changelog",
    name: "GitHub Changelog",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://github.blog/changelog/",
    rssUrl: "https://github.blog/changelog/feed/",
    category: "AI Coding",
    enabled: true,
    notes: "Copilot 更新在这里发布",
  },
  {
    id: "google-ai",
    name: "Google AI",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://ai.googleblog.com",
    rssUrl: "https://ai.googleblog.com/feeds/posts/default",
    category: "模型与基础设施",
    enabled: true,
  },
  {
    id: "deepmind",
    name: "DeepMind",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://deepmind.google/blog",
    rssUrl: "https://deepmind.google/blog/rss.xml",
    category: "模型与基础设施",
    enabled: true,
  },
  {
    id: "meta-ai",
    name: "Meta AI",
    tier: "tier1",
    primaryStrategy: "cheerio",
    fallbackStrategies: ["playwright"],
    siteUrl: "https://ai.meta.com/blog",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: "article",
      title: "h2, h3",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
    notes: "RSS 不稳定，Cheerio 优先",
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    tier: "tier1",
    primaryStrategy: "cheerio",
    fallbackStrategies: ["playwright"],
    siteUrl: "https://blogs.nvidia.com/ai/",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: ".post, article",
      title: "h2",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://huggingface.co/blog",
    rssUrl: "https://huggingface.co/blog/feed.xml",
    category: "开源生态",
    enabled: true,
  },
  {
    id: "vercel",
    name: "Vercel",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://vercel.com/changelog",
    rssUrl: "https://vercel.com/changelog/atom",
    category: "AI Coding",
    enabled: true,
    notes: "Vercel AI SDK 更新",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://blog.cloudflare.com",
    rssUrl: "https://blog.cloudflare.com/rss/",
    category: "模型与基础设施",
    enabled: true,
  },
  {
    id: "cohere",
    name: "Cohere",
    tier: "tier1",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://cohere.com/blog",
    rssUrl: "https://cohere.com/blog/rss.xml",
    category: "模型与基础设施",
    enabled: true,
  },
];

/**
 * Tier 2: 媒体源
 */
export const TIER2_SOURCES: SourceConfig[] = [
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    tier: "tier2",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://techcrunch.com/category/artificial-intelligence/",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "模型与基础设施",
    enabled: true,
  },
  {
    id: "the-verge-ai",
    name: "The Verge AI",
    tier: "tier2",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://www.theverge.com/ai-artificial-intelligence",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: ".duet--content-cards--content-card",
      title: "h2",
      link: "a[href]",
      date: "time",
      summary: ".font-text-01",
    },
    notes: "RSS 经常失效，Cheerio 备用",
  },
  {
    id: "wired-ai",
    name: "WIRED AI",
    tier: "tier2",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://www.wired.com/tag/artificial-intelligence/",
    category: "模型与基础设施",
    enabled: true,
    selectors: {
      container: ".summary-item",
      title: ".summary-item__hed",
      link: "a[href]",
      date: "time",
      summary: ".summary-item__dek",
    },
  },
  {
    id: "mit-tech-review",
    name: "MIT Technology Review",
    tier: "tier2",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://www.technologyreview.com/topic/artificial-intelligence/",
    rssUrl: "https://www.technologyreview.com/feed/",
    category: "模型与基础设施",
    enabled: true,
  },
];

/**
 * Tier 3: 开发者社区
 */
export const TIER3_SOURCES: SourceConfig[] = [
  {
    id: "langchain",
    name: "LangChain",
    tier: "tier3",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://blog.langchain.dev",
    rssUrl: "https://blog.langchain.dev/rss/",
    category: "AI Agent",
    enabled: true,
  },
  {
    id: "llamaindex",
    name: "LlamaIndex",
    tier: "tier3",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://blog.llamaindex.ai",
    rssUrl: "https://blog.llamaindex.ai/feed",
    category: "AI Agent",
    enabled: true,
  },
  {
    id: "pinecone",
    name: "Pinecone",
    tier: "tier3",
    primaryStrategy: "rss",
    fallbackStrategies: ["cheerio", "playwright"],
    siteUrl: "https://www.pinecone.io/blog",
    rssUrl: "https://www.pinecone.io/blog/feed/",
    category: "AI Agent",
    enabled: true,
  },
  {
    id: "cursor",
    name: "Cursor",
    tier: "tier3",
    primaryStrategy: "cheerio",
    fallbackStrategies: ["playwright"],
    siteUrl: "https://cursor.com/changelog",
    category: "AI Coding",
    enabled: true,
    selectors: {
      container: ".changelog-item",
      title: "h2",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
    notes: "无 RSS，Cheerio 优先",
  },
];

/**
 * 所有启用的源
 */
export const ALL_SOURCES: SourceConfig[] = [
  ...TIER1_SOURCES,
  ...TIER2_SOURCES,
  ...TIER3_SOURCES,
].filter(s => s.enabled);

/**
 * 按策略分组的源
 */
export function getSourcesByStrategy(strategy: FetchStrategy): SourceConfig[] {
  return ALL_SOURCES.filter(s => s.primaryStrategy === strategy);
}

/**
 * 统计
 */
export const SOURCE_STATS = {
  total: ALL_SOURCES.length,
  byStrategy: {
    rss: ALL_SOURCES.filter(s => s.primaryStrategy === "rss").length,
    cheerio: ALL_SOURCES.filter(s => s.primaryStrategy === "cheerio").length,
    playwright: ALL_SOURCES.filter(s => s.primaryStrategy === "playwright").length,
  },
  byTier: {
    tier1: TIER1_SOURCES.filter(s => s.enabled).length,
    tier2: TIER2_SOURCES.filter(s => s.enabled).length,
    tier3: TIER3_SOURCES.filter(s => s.enabled).length,
  },
};
