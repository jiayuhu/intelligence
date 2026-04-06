/**
 * 抓取配置常量
 * 
 * 集中管理所有抓取相关的配置参数，避免硬编码
 */

export const FETCH_CONFIG = {
  /** 默认时间窗口：48小时 */
  TIME_WINDOW_HOURS: 48,

  /** 分类级别时间窗口（小时）- 未指定的分类使用默认 */
  CATEGORY_TIME_WINDOWS: {
    // 实时性要求高的社区讨论：24小时
    "社区热点": 24,
    // 政策变化较慢：72小时
    "政策与监管": 72,
    // 其他分类使用默认48小时
  } as Record<string, number>,

  /** 文本截断长度 */
  TRUNCATE: {
    EVENT_SUMMARY: 300,
    WHY_IT_MATTERS: 200,
    TITLE_DISPLAY: 40,
  },

  /** 去重配置 */
  DEDUPLICATION: {
    SIMILARITY_THRESHOLD: 0.75,
    TITLE_WEIGHT: 0.6,
    CONTENT_WEIGHT: 0.4,
  },

  /** 请求超时（毫秒） */
  TIMEOUT: {
    RSS: 10000,
    CHEERIO: 10000,
    PLAYWRIGHT: {
      PAGE_GOTO: 30000,
      WAIT_SELECTOR: 10000,
    },
  },

  /** 请求间隔（毫秒） */
  DELAY: {
    BETWEEN_SOURCES: 1000,
    PLAYWRIGHT_RETRY: 2000,
  },

  /** 并发控制 */
  CONCURRENCY: {
    BATCH_SIZE: 3,
  },

  /** 来源层级权重 */
  TIER: {
    HIGH_CONFIDENCE: "tier1" as const,
    MEDIUM_CONFIDENCE: "tier2" as const,
    LOW_CONFIDENCE: "tier3" as const,
  },

  /** 请求头 */
  HEADERS: {
    USER_AGENT:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ACCEPT:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    ACCEPT_LANGUAGE: "en-US,en;q=0.5",
  },

  /** 浏览器视窗 */
  VIEWPORT: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },

  /** 缓存配置 - 每日运行场景下设置2小时TTL */
  CACHE: {
    /** 缓存生存时间 (毫秒) - 2小时 */
    TTL_MS: 2 * 60 * 60 * 1000,
    /** 最大缓存条目数 */
    MAX_SIZE: 100,
    /** 清理间隔 (毫秒) - 每30分钟检查一次过期 */
    CLEANUP_INTERVAL_MS: 30 * 60 * 1000,
  },

  /** 健康检查配置 */
  HEALTH: {
    /** 失败率阈值 - 超过此值标记为不健康 */
    FAILURE_RATE_THRESHOLD: 0.5,
    /** 最小检查次数 - 少于此次数不计算失败率 */
    MIN_ATTEMPTS: 3,
    /** 健康检查历史保留天数 */
    HISTORY_DAYS: 7,
  },
} as const;

/**
 * 获取时间窗口的毫秒数
 * @param category 可选分类，如果提供则返回该分类的时间窗口
 */
export function getTimeWindowMs(category?: string): number {
  const hours = category && FETCH_CONFIG.CATEGORY_TIME_WINDOWS[category] 
    ? FETCH_CONFIG.CATEGORY_TIME_WINDOWS[category] 
    : FETCH_CONFIG.TIME_WINDOW_HOURS;
  return hours * 60 * 60 * 1000;
}

/**
 * 获取当前时间窗口的开始时间
 * @param category 可选分类，如果提供则返回该分类的时间窗口开始时间
 */
export function getWindowStartDate(category?: string): Date {
  return new Date(Date.now() - getTimeWindowMs(category));
}

/**
 * 获取分类的时间窗口（小时）
 * @param category 分类名称
 */
export function getCategoryTimeWindowHours(category: string): number {
  return FETCH_CONFIG.CATEGORY_TIME_WINDOWS[category] || FETCH_CONFIG.TIME_WINDOW_HOURS;
}
