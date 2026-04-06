/**
 * 请求缓存模块
 * 
 * 功能：
 * 1. 缓存 RSS/HTTP 请求结果，避免重复请求
 * 2. 设置 TTL（生存时间），过期自动失效
 * 3. 内存限制，防止无限增长
 * 
 * 配置来源：FETCH_CONFIG.CACHE (2小时TTL，适合每日运行场景)
 */

import { FETCH_CONFIG } from "../fetch-config.js";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  defaultTtl: number; // 默认缓存时间（毫秒）
  maxSize: number; // 最大缓存条目数
  cleanupInterval: number; // 清理间隔（毫秒）
}

/** 默认缓存配置 - 从 FETCH_CONFIG 读取（2小时TTL） */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTtl: FETCH_CONFIG.CACHE.TTL_MS, // 2小时（适合每日运行）
  maxSize: FETCH_CONFIG.CACHE.MAX_SIZE, // 100条
  cleanupInterval: FETCH_CONFIG.CACHE.CLEANUP_INTERVAL_MS, // 30分钟
};

export class RequestCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * 获取缓存
   */
  get<R = T>(key: string): R | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as unknown as R;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTtl,
    });
  }

  /**
   * 检查是否有缓存
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // 简化实现，实际应该统计命中率
      missRate: 0,
    };
  }

  /**
   * 删除最旧的条目（LRU策略简化版）
   */
  private evictOldest(): void {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 启动定时清理
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止定时清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// 全局缓存实例（单例）- 使用 FETCH_CONFIG 的2小时TTL
let globalCache: RequestCache<unknown> | undefined;

export function getGlobalCache<T = unknown>(): RequestCache<T> {
  if (!globalCache) {
    globalCache = new RequestCache<T>(DEFAULT_CACHE_CONFIG);
  }
  return globalCache as RequestCache<T>;
}

export function clearGlobalCache(): void {
  globalCache?.clear();
}
