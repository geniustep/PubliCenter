import Redis from 'ioredis';
import { logger } from './logger';

/**
 * Redis client singleton
 */
class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to Redis
   */
  private connect(): void {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        logger.warn('REDIS_URL not configured, using in-memory cache instead');
        return;
      }

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000); // Exponential backoff
        },
        reconnectOnError: (err) => {
          logger.warn(`Redis reconnect on error: ${err.message}`);
          return true;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', { error });
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis', { error });
    }
  }

  /**
   * Get value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis GET error for key: ${key}`, { error });
      return null;
    }
  }

  /**
   * Set value in Redis
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      logger.error(`Redis SET error for key: ${key}`, { error });
      return false;
    }
  }

  /**
   * Delete key from Redis
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DELETE error for key: ${key}`, { error });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key: ${key}`, { error });
      return false;
    }
  }

  /**
   * Clear all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Redis DELETE PATTERN error for pattern: ${pattern}`, { error });
      return 0;
    }
  }

  /**
   * Increment value
   */
  async increment(key: string, by: number = 1): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      if (by === 1) {
        return await this.client.incr(key);
      } else {
        return await this.client.incrby(key, by);
      }
    } catch (error) {
      logger.error(`Redis INCREMENT error for key: ${key}`, { error });
      return null;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key: ${key}`, { error });
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Redis TTL error for key: ${key}`, { error });
      return null;
    }
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushall();
      logger.warn('⚠️ Redis FLUSHALL executed - all data cleared');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHALL error', { error });
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Get connection status
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Ping Redis
   */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const redis = new RedisClient();

// Export class for testing
export { RedisClient };
