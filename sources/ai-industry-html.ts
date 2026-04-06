/**
 * AI行业情报 - 需要直接抓取 HTML 的来源
 * 
 * 适用场景：
 * 1. 网站没有 RSS 源
 * 2. RSS 源失效或不完整
 * 3. 需要抓取特定页面而非整站
 * 
 * 注意：HTML 抓取需要定期更新 selector，因为网站结构会变化
 */

export interface HtmlSource {
  /** 来源唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 来源层级 */
  tier: "tier1" | "tier2" | "tier3";
  /** 要抓取的 URL */
  url: string;
  /** 官网链接（用于展示） */
  siteUrl: string;
  /** CSS 选择器配置 */
  selectors: {
    /** 文章列表容器 */
    container: string;
    /** 标题 */
    title: string;
    /** 链接 */
    link: string;
    /** 发布时间（可选） */
    date?: string;
    /** 摘要（可选） */
    summary?: string;
  };
  /** 日期解析格式 */
  dateFormat?: "iso" | "rfc2822" | "relative" | "custom";
  /** 自定义日期解析函数（如有） */
  dateParser?: (text: string) => Date | null;
  /** 默认分类 */
  defaultCategory: string;
  /** 是否启用 */
  enabled: boolean;
  /** 请求头（如需特殊配置） */
  headers?: Record<string, string>;
  /** 备注 */
  notes?: string;
}

/**
 * Tier 1: 官方源（需要 HTML 抓取的）
 */
export const TIER1_HTML_SOURCES: HtmlSource[] = [
  {
    id: "anthropic-news",
    name: "Anthropic News",
    tier: "tier1",
    url: "https://www.anthropic.com/news",
    siteUrl: "https://www.anthropic.com/news",
    selectors: {
      container: "article, .news-item, [data-testid='news-card']",
      title: "h2, h3, .title",
      link: "a[href]",
      date: "time, .date, [data-testid='date']",
      summary: "p, .description, [data-testid='summary']",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "Anthropic 无公开 RSS，需解析 HTML",
  },
  {
    id: "openai-newsroom",
    name: "OpenAI Newsroom",
    tier: "tier1",
    url: "https://openai.com/news",
    siteUrl: "https://openai.com/news",
    selectors: {
      container: "article, .blog-card, [data-testid='article-card']",
      title: "h2, h3, .title, [data-testid='title']",
      link: "a[href]",
      date: "time, .date",
      summary: "p, .description",
    },
    defaultCategory: "模型与基础设施",
    enabled: false, // OpenAI 有 RSS，优先使用 RSS
    notes: "备用源，RSS 失效时启用",
  },
  {
    id: "meta-ai-blog",
    name: "Meta AI Blog",
    tier: "tier1",
    url: "https://ai.meta.com/blog/",
    siteUrl: "https://ai.meta.com/blog",
    selectors: {
      container: "article, .blog-post, [data-testid='blog-card']",
      title: "h2, h3, .blog-title",
      link: "a[href]",
      date: "time, .publish-date",
      summary: "p, .excerpt",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "Meta RSS 不稳定，使用 HTML 抓取",
  },
  {
    id: "nvidia-blog",
    name: "NVIDIA Blog",
    tier: "tier1",
    url: "https://blogs.nvidia.com/ai/",
    siteUrl: "https://blogs.nvidia.com",
    selectors: {
      container: ".post, article, .blog-card",
      title: "h2, h3, .entry-title",
      link: "a[href]",
      date: "time, .published",
      summary: ".excerpt, p",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "NVIDIA RSS 需特殊处理，使用 HTML 抓取",
  },
  {
    id: "xai-blog",
    name: "xAI Blog",
    tier: "tier1",
    url: "https://x.ai/blog",
    siteUrl: "https://x.ai",
    selectors: {
      container: "article, .post, [data-testid='post']",
      title: "h1, h2, .title",
      link: "a[href]",
      date: "time, .date",
      summary: "p, .summary",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "xAI 博客，需验证 selector",
  },
];

/**
 * Tier 2: 媒体源（需要 HTML 抓取的）
 */
export const TIER2_HTML_SOURCES: HtmlSource[] = [
  {
    id: "the-verge-ai",
    name: "The Verge AI",
    tier: "tier2",
    url: "https://www.theverge.com/ai-artificial-intelligence",
    siteUrl: "https://www.theverge.com",
    selectors: {
      container: ".duet--content-cards--content-card, article",
      title: "h2, .font-polysans",
      link: "a[href]",
      date: "time",
      summary: ".font-text-01",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "The Verge AI 频道，RSS 经常失效",
  },
  {
    id: "wired-ai",
    name: "WIRED AI",
    tier: "tier2",
    url: "https://www.wired.com/tag/artificial-intelligence/",
    siteUrl: "https://www.wired.com",
    selectors: {
      container: ".summary-item, article",
      title: ".summary-item__hed, h2",
      link: "a[href]",
      date: "time",
      summary: ".summary-item__dek",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "WIRED AI 标签页",
  },
  {
    id: "mit-tech-review",
    name: "MIT Technology Review - AI",
    tier: "tier2",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/",
    siteUrl: "https://www.technologyreview.com",
    selectors: {
      container: ".story-item, article",
      title: ".story-title, h2",
      link: "a[href]",
      date: "time, .date",
      summary: ".story-deck, .summary",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "MIT Tech Review AI 专题",
  },
];

/**
 * Tier 3: 社区和工具（需要 HTML 抓取的）
 */
export const TIER3_HTML_SOURCES: HtmlSource[] = [
  {
    id: "cursor-changelog",
    name: "Cursor Changelog",
    tier: "tier3",
    url: "https://cursor.com/changelog",
    siteUrl: "https://cursor.com",
    selectors: {
      container: ".changelog-item, [data-testid='changelog-entry']",
      title: "h2, h3, .version",
      link: "a[href]",
      date: "time, .date",
      summary: "p, .changes",
    },
    defaultCategory: "AI Coding",
    enabled: true,
    notes: "Cursor 更新日志，开发者关注",
  },
  {
    id: "llamaindex-blog",
    name: "LlamaIndex Blog",
    tier: "tier3",
    url: "https://blog.llamaindex.ai",
    siteUrl: "https://www.llamaindex.ai/blog",
    selectors: {
      container: "article, .post-card",
      title: "h2, .post-title",
      link: "a[href]",
      date: "time, .post-date",
      summary: "p, .post-excerpt",
    },
    defaultCategory: "AI Agent",
    enabled: true,
    notes: "LlamaIndex 官方博客，RSS 备用",
  },
  {
    id: "phind-blog",
    name: "Phind Blog",
    tier: "tier3",
    url: "https://www.phind.com/blog",
    siteUrl: "https://www.phind.com/blog",
    selectors: {
      container: "article, .blog-post",
      title: "h2, h1",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
    defaultCategory: "AI Coding",
    enabled: true,
    notes: "Phind AI 搜索更新",
  },
  {
    id: "modal-blog",
    name: "Modal Blog",
    tier: "tier3",
    url: "https://modal.com/blog",
    siteUrl: "https://modal.com/blog",
    selectors: {
      container: "article, .blog-card",
      title: "h2, .title",
      link: "a[href]",
      date: "time",
      summary: "p, .excerpt",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "Modal Serverless GPU 博客，RSS 备用",
  },
  {
    id: "fireworks-blog",
    name: "Fireworks AI Blog",
    tier: "tier3",
    url: "https://fireworks.ai/blog",
    siteUrl: "https://fireworks.ai/blog",
    selectors: {
      container: "article, .blog-post",
      title: "h2, h1",
      link: "a[href]",
      date: "time",
      summary: "p",
    },
    defaultCategory: "模型与基础设施",
    enabled: true,
    notes: "Fireworks AI 博客，RSS 备用",
  },
];

/**
 * 所有启用的 HTML 源
 */
export const ALL_ENABLED_HTML_SOURCES: HtmlSource[] = [
  ...TIER1_HTML_SOURCES,
  ...TIER2_HTML_SOURCES,
  ...TIER3_HTML_SOURCES,
].filter(source => source.enabled);

/**
 * 验证 HTML 源配置
 */
export function validateHtmlSourceConfig(): { valid: HtmlSource[]; invalid: HtmlSource[] } {
  const valid: HtmlSource[] = [];
  const invalid: HtmlSource[] = [];
  
  for (const source of ALL_ENABLED_HTML_SOURCES) {
    if (!source.url || !source.url.startsWith("http")) {
      invalid.push({ ...source, notes: `Invalid URL: ${source.url}` });
    } else if (!source.selectors.container || !source.selectors.title || !source.selectors.link) {
      invalid.push({ ...source, notes: "Missing required selectors (container/title/link)" });
    } else if (!source.id || !source.name) {
      invalid.push({ ...source, notes: "Missing id or name" });
    } else {
      valid.push(source);
    }
  }
  
  return { valid, invalid };
}

// 统计信息
export const HTML_SOURCE_STATS = {
  total: TIER1_HTML_SOURCES.length + TIER2_HTML_SOURCES.length + TIER3_HTML_SOURCES.length,
  enabled: ALL_ENABLED_HTML_SOURCES.length,
  tier1: TIER1_HTML_SOURCES.filter(s => s.enabled).length,
  tier2: TIER2_HTML_SOURCES.filter(s => s.enabled).length,
  tier3: TIER3_HTML_SOURCES.filter(s => s.enabled).length,
};
