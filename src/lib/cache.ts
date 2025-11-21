interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * In-memory cache implementation
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set cache value
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Get cache value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  /**
   * Destroy cache and stop cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Unified cache interface that works with both Redis and Memory
 */
interface CacheAdapter {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, data: T, ttl?: number): Promise<boolean | void> | void;
  delete(key: string): Promise<boolean | void> | void;
  has(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
}

/**
 * Hybrid cache that uses Redis in production and Memory in development
 */
class HybridCache implements CacheAdapter {
  private memoryCache: MemoryCache;
  private redisCache: any = null; // Will be imported dynamically
  private useRedis: boolean = false;

  constructor() {
    this.memoryCache = new MemoryCache();
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Only use Redis in production
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      try {
        const { redis } = await import('./redis');
        this.redisCache = redis;

        // Check if Redis is connected
        const isConnected = await redis.ping();
        if (isConnected) {
          this.useRedis = true;
          console.log('✅ Using Redis for caching');
        } else {
          console.log('⚠️ Redis not available, using memory cache');
        }
      } catch (error) {
        console.error('Failed to initialize Redis, using memory cache:', error);
      }
    } else {
      console.log('📦 Using in-memory cache (development mode)');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis && this.redisCache) {
      return await this.redisCache.get<T>(key);
    }
    return this.memoryCache.get<T>(key);
  }

  async set<T>(key: string, data: T, ttlMs: number = 300000): Promise<void> {
    if (this.useRedis && this.redisCache) {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.redisCache.set(key, data, ttlSeconds);
    } else {
      this.memoryCache.set(key, data, ttlMs);
    }
  }

  async delete(key: string): Promise<void> {
    if (this.useRedis && this.redisCache) {
      await this.redisCache.delete(key);
    } else {
      this.memoryCache.delete(key);
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.useRedis && this.redisCache) {
      return await this.redisCache.exists(key);
    }
    return this.memoryCache.has(key);
  }

  async clear(): Promise<void> {
    if (this.useRedis && this.redisCache) {
      await this.redisCache.flushAll();
    } else {
      this.memoryCache.clear();
    }
  }

  // Additional helper methods
  size(): number {
    // Only available for memory cache
    return this.memoryCache.size();
  }

  destroy(): void {
    this.memoryCache.destroy();
    if (this.redisCache) {
      this.redisCache.disconnect();
    }
  }
}

// Export singleton instance
export const cache = new HybridCache();

// Export class for testing
export { MemoryCache, HybridCache };
