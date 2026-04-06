/**
 * AI行业情报 - 可信来源 RSS/Atom 源列表
 * 
 * 维护原则：
 * 1. 优先官方源（公司博客、开发者文档）
 * 2. 其次可信媒体（TechCrunch、The Verge 等）
 * 3. 定期验证链接有效性
 * 4. 标记失效源，不直接删除（保留历史记录）
 */

export interface FeedSource {
  /** 来源唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 来源层级 */
  tier: "tier1" | "tier2" | "tier3";
  /** 来源类型 */
  type: "rss" | "atom" | "json";
  /** RSS/Atom 订阅地址 */
  feedUrl: string;
  /** 官网链接（用于展示） */
  siteUrl: string;
  /** 默认分类 */
  defaultCategory: string;
  /** 是否启用 */
  enabled: boolean;
  /** 最后验证时间 */
  lastVerified?: string;
  /** 备注 */
  notes?: string;
}

/**
 * Tier 1: 官方源（P0 优先级）
 * 公司官方博客、开发者文档、GitHub 发布
 */
export const TIER1_OFFICIAL_FEEDS: FeedSource[] = [
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://openai.com/blog/rss.xml",
    siteUrl: "https://openai.com/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "anthropic-news",
    name: "Anthropic News",
    tier: "tier1",
    type: "rss",
    // Anthropic 没有公开 RSS，使用其 news 页面作为备用
    feedUrl: "https://www.anthropic.com/news",
    siteUrl: "https://www.anthropic.com/news",
    defaultCategory: "模型与基础设施",
    enabled: false, // 需 HTML 解析
    notes: "Anthropic 无公开 RSS，需用 HTML 解析器抓取",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://github.blog/feed/",
    siteUrl: "https://github.blog",
    defaultCategory: "AI Coding",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "github-changelog",
    name: "GitHub Changelog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://github.blog/changelog/feed/",
    siteUrl: "https://github.blog/changelog/",
    defaultCategory: "AI Coding",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "GitHub 产品更新，包含 Copilot 相关",
  },
  {
    id: "google-ai-blog",
    name: "Google AI Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://ai.googleblog.com/feeds/posts/default",
    siteUrl: "https://ai.googleblog.com",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "deepmind-blog",
    name: "DeepMind Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://deepmind.google/blog/rss.xml",
    siteUrl: "https://deepmind.google/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "meta-ai-blog",
    name: "Meta AI Blog",
    tier: "tier1",
    type: "rss",
    // Meta 的 RSS 经常变动，使用备用地址
    feedUrl: "https://ai.meta.com/blog/",
    siteUrl: "https://ai.meta.com/blog",
    defaultCategory: "模型与基础设施",
    enabled: false, // 需 HTML 解析
    notes: "Meta RSS 不稳定，建议用 HTML 解析或 Atom 备用",
  },
  {
    id: "nvidia-blog",
    name: "NVIDIA Blog",
    tier: "tier1",
    type: "rss",
    // NVIDIA 博客 RSS 结构复杂
    feedUrl: "https://blogs.nvidia.com/blog/",
    siteUrl: "https://blogs.nvidia.com",
    defaultCategory: "模型与基础设施",
    enabled: false, // 需 HTML 解析
    notes: "NVIDIA RSS 需特殊处理，建议用 HTML 解析",
  },
  {
    id: "xai-blog",
    name: "xAI",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://x.ai/blog/rss.xml",
    siteUrl: "https://x.ai",
    defaultCategory: "模型与基础设施",
    enabled: false,
    notes: "xAI RSS 待验证",
  },
  {
    id: "huggingface-blog",
    name: "Hugging Face Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://huggingface.co/blog/feed.xml",
    siteUrl: "https://huggingface.co/blog",
    defaultCategory: "开源生态",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "vercel-ai",
    name: "Vercel AI",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://vercel.com/changelog/atom",
    siteUrl: "https://vercel.com/changelog",
    defaultCategory: "AI Coding",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "Vercel AI SDK 更新",
  },
  {
    id: "cloudflare-blog",
    name: "Cloudflare Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://blog.cloudflare.com/rss/",
    siteUrl: "https://blog.cloudflare.com",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "Cloudflare Workers AI 相关",
  },
  {
    id: "replicate-blog",
    name: "Replicate Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://replicate.com/blog/rss.xml",
    siteUrl: "https://replicate.com/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "cohere-blog",
    name: "Cohere Blog",
    tier: "tier1",
    type: "rss",
    feedUrl: "https://cohere.com/blog/rss.xml",
    siteUrl: "https://cohere.com/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
];

/**
 * Tier 2: 可信媒体（P1 优先级）
 * 主流科技媒体、行业分析
 */
export const TIER2_MEDIA_FEEDS: FeedSource[] = [
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    tier: "tier2",
    type: "rss",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    siteUrl: "https://techcrunch.com/category/artificial-intelligence/",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "mit-tech-review",
    name: "MIT Technology Review",
    tier: "tier2",
    type: "rss",
    feedUrl: "https://www.technologyreview.com/feed/",
    siteUrl: "https://www.technologyreview.com",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    tier: "tier2",
    type: "rss",
    feedUrl: "https://venturebeat.com/category/ai/feed/",
    siteUrl: "https://venturebeat.com/category/ai/",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "arstechnica-ai",
    name: "Ars Technica AI",
    tier: "tier2",
    type: "rss",
    feedUrl: "https://arstechnica.com/tag/artificial-intelligence/feed/",
    siteUrl: "https://arstechnica.com/tag/artificial-intelligence/",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "zdnet-ai",
    name: "ZDNET AI",
    tier: "tier2",
    type: "rss",
    feedUrl: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml",
    siteUrl: "https://www.zdnet.com/topic/artificial-intelligence/",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
];

/**
 * Tier 3: 开发者社区与开源（P2 优先级）
 */
export const TIER3_COMMUNITY_FEEDS: FeedSource[] = [
  {
    id: "langchain-blog",
    name: "LangChain Blog",
    tier: "tier3",
    type: "rss",
    feedUrl: "https://blog.langchain.dev/rss/",
    siteUrl: "https://blog.langchain.dev",
    defaultCategory: "AI Agent",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "注意：有 308 重定向到 /rss",
  },
  {
    id: "llamaindex-blog",
    name: "LlamaIndex Blog",
    tier: "tier3",
    type: "rss",
    // LlamaIndex 的 RSS 经常变动
    feedUrl: "https://blog.llamaindex.ai/feed",
    siteUrl: "https://www.llamaindex.ai/blog",
    defaultCategory: "AI Agent",
    enabled: false, // 需验证
    notes: "RSS 链接待验证，备用: https://blog.llamaindex.ai/feed",
  },
  {
    id: "pinecone-blog",
    name: "Pinecone Blog",
    tier: "tier3",
    type: "rss",
    feedUrl: "https://www.pinecone.io/blog/feed/",
    siteUrl: "https://www.pinecone.io/blog",
    defaultCategory: "AI Agent",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "向量数据库与 RAG",
  },
  {
    id: "weaviate-blog",
    name: "Weaviate Blog",
    tier: "tier3",
    type: "rss",
    feedUrl: "https://weaviate.io/blog/rss.xml",
    siteUrl: "https://weaviate.io/blog",
    defaultCategory: "AI Agent",
    enabled: true,
    lastVerified: "2026-04-06",
  },
  {
    id: "modal-blog",
    name: "Modal Blog",
    tier: "tier3",
    type: "rss",
    feedUrl: "https://modal.com/blog/rss.xml",
    siteUrl: "https://modal.com/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
    notes: "Serverless GPU 与 AI 基础设施",
  },
  {
    id: "fireworks-ai",
    name: "Fireworks AI",
    tier: "tier3",
    type: "rss",
    feedUrl: "https://fireworks.ai/blog/rss.xml",
    siteUrl: "https://fireworks.ai/blog",
    defaultCategory: "模型与基础设施",
    enabled: true,
    lastVerified: "2026-04-06",
  },
];

/**
 * 所有启用的源
 */
export const ALL_ENABLED_FEEDS: FeedSource[] = [
  ...TIER1_OFFICIAL_FEEDS,
  ...TIER2_MEDIA_FEEDS,
  ...TIER3_COMMUNITY_FEEDS,
].filter(feed => feed.enabled);

/**
 * 按分类分组的源
 */
export function getFeedsByCategory(category: string): FeedSource[] {
  return ALL_ENABLED_FEEDS.filter(feed => feed.defaultCategory === category);
}

/**
 * 验证源配置有效性
 */
export function validateFeedConfig(): { valid: FeedSource[]; invalid: FeedSource[] } {
  const valid: FeedSource[] = [];
  const invalid: FeedSource[] = [];
  
  for (const feed of ALL_ENABLED_FEEDS) {
    // 基础验证
    if (!feed.feedUrl || !feed.feedUrl.startsWith("http")) {
      invalid.push({ ...feed, notes: `Invalid URL: ${feed.feedUrl}` });
    } else if (!feed.id || !feed.name) {
      invalid.push({ ...feed, notes: "Missing id or name" });
    } else {
      valid.push(feed);
    }
  }
  
  return { valid, invalid };
}

// 统计信息
export const FEED_STATS = {
  total: TIER1_OFFICIAL_FEEDS.length + TIER2_MEDIA_FEEDS.length + TIER3_COMMUNITY_FEEDS.length,
  enabled: ALL_ENABLED_FEEDS.length,
  tier1: TIER1_OFFICIAL_FEEDS.filter(f => f.enabled).length,
  tier2: TIER2_MEDIA_FEEDS.filter(f => f.enabled).length,
  tier3: TIER3_COMMUNITY_FEEDS.filter(f => f.enabled).length,
};
