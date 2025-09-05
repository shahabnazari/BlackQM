import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheEntry } from '../types';

/**
 * Enterprise-Grade Caching Service for Q-Analytics
 * Provides high-performance caching for analysis results
 * Implements Redis with automatic expiration and LRU eviction
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis | null = null;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private readonly MAX_MEMORY_CACHE_SIZE = 100; // Maximum items in memory cache

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisEnabled = this.configService.get<boolean>(
      'REDIS_ENABLED',
      false,
    );

    if (redisEnabled) {
      try {
        this.redisClient = new Redis({
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
          retryStrategy: (times: number) => {
            if (times > 3) {
              console.error(
                'Redis connection failed after 3 retries, falling back to memory cache',
              );
              this.redisClient = null;
              return null;
            }
            return Math.min(times * 200, 2000);
          },
        });

        this.redisClient.on('connect', () => {
          console.log('✅ Redis cache connected successfully');
        });

        this.redisClient.on('error', (err: Error) => {
          console.error('Redis cache error:', err);
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.redisClient = null;
      }
    } else {
      console.log('📦 Using in-memory cache (Redis disabled)');
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          const entry = JSON.parse(value) as CacheEntry<T>;

          // Update hit counter
          entry.hits++;
          await this.redisClient.set(
            key,
            JSON.stringify(entry),
            'EX',
            entry.ttl,
          );

          return entry.value;
        }
      } catch (error) {
        console.error(`Redis get error for key ${key}:`, error);
      }
    }

    // Fallback to memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      const now = Date.now();
      const entryAge = now - new Date(memoryEntry.timestamp).getTime();

      if (entryAge < memoryEntry.ttl * 1000) {
        memoryEntry.hits++;
        return memoryEntry.value;
      } else {
        // Expired
        this.memoryCache.delete(key);
      }
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: new Date(),
      ttl,
      hits: 0,
    };

    // Store in Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(entry), 'EX', ttl);
      } catch (error) {
        console.error(`Redis set error for key ${key}:`, error);
      }
    }

    // Also store in memory cache
    this.memoryCache.set(key, entry);

    // Implement LRU eviction for memory cache
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error(`Redis delete error for key ${key}:`, error);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate Redis entries
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.error(
          `Redis pattern invalidation error for ${pattern}:`,
          error,
        );
      }
    }

    // Invalidate memory cache entries
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    type: string;
    size: number;
    memoryUsage?: number;
    hitRate?: number;
  }> {
    if (this.redisClient) {
      try {
        const info = await this.redisClient.info('memory');
        const dbSize = await this.redisClient.dbsize();

        return {
          type: 'redis',
          size: dbSize,
          memoryUsage: parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0'),
        };
      } catch (error) {
        console.error('Redis stats error:', error);
      }
    }

    // Memory cache stats
    let totalHits = 0;
    let totalAccesses = 0;

    for (const entry of this.memoryCache.values()) {
      totalHits += entry.hits;
      totalAccesses += entry.hits + 1; // +1 for the initial set
    }

    return {
      type: 'memory',
      size: this.memoryCache.size,
      memoryUsage: process.memoryUsage().heapUsed,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(
    keys: string[],
    computeFn: (key: string) => Promise<any>,
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      const cached = await this.get(key);
      if (!cached) {
        const value = await computeFn(key);
        await this.set(key, value);
      }
    });

    await Promise.all(promises);
  }
}
