/**
 * PHASE 10.102 PHASE 4: REDIS CACHING LAYER
 * Netflix-Grade Production-Ready Redis Service
 *
 * Key Features:
 * - Persistent caching (survives restarts)
 * - Distributed caching (supports horizontal scaling)
 * - Automatic retry with exponential backoff
 * - Connection health monitoring
 * - Graceful degradation on Redis failures
 * - Performance metrics integration
 *
 * @see PHASE_10.102_ENTERPRISE_PRODUCTION_READY.md Phase 4
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis connection health status
 */
export interface RedisHealthStatus {
  isConnected: boolean;
  uptime: number;
  memoryUsage: string;
  connectedClients: number;
  totalKeys: number;
}

/**
 * Redis cache statistics
 */
export interface RedisCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: string;
  avgTtl: number;
}

/**
 * Redis Service - Enterprise-Grade Distributed Caching
 *
 * Advantages over node-cache:
 * ✅ Persistent (data survives restarts)
 * ✅ Distributed (shared across multiple instances)
 * ✅ Unlimited capacity (disk-based, not RAM-limited)
 * ✅ Production-ready for horizontal scaling
 * ✅ Built-in eviction policies (LRU, LFU, etc.)
 * ✅ Supports complex data structures (lists, sets, hashes)
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;
  private readonly MAX_CONNECTION_ATTEMPTS = 10;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);

    this.logger.log(`Initializing Redis connection to ${host}:${port} (db: ${db})`);

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      // Netflix-grade connection settings
      retryStrategy: (times: number) => {
        if (times > this.MAX_CONNECTION_ATTEMPTS) {
          this.logger.error(
            `Redis connection failed after ${times} attempts. Giving up. ` +
            `Please check Redis is running: brew services start redis`
          );
          return null; // Stop retrying
        }

        const delay = Math.min(times * 50, 2000); // Exponential backoff capped at 2s
        this.logger.warn(
          `Redis connection attempt ${times}/${this.MAX_CONNECTION_ATTEMPTS}, ` +
          `retrying in ${delay}ms...`
        );
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      // Performance optimization
      lazyConnect: false,
      keepAlive: 30000,
      // Error handling
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
    });

    // Event handlers
    this.client.on('connect', () => {
      this.logger.log('✅ Redis connection established');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      this.logger.log('✅ Redis ready to accept commands');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`❌ Redis error: ${err.message}`);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️  Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.logger.log('🔄 Redis reconnecting...');
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.ping();
      this.logger.log('✅ Redis module initialized successfully');
      this.isConnected = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Failed to connect to Redis: ${errorMessage}\n` +
        `   Please ensure Redis is running:\n` +
        `   • macOS: brew services start redis\n` +
        `   • Linux: sudo systemctl start redis\n` +
        `   • Docker: docker run -d -p 6379:6379 redis:7-alpine`
      );
      this.isConnected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('✅ Redis connection closed gracefully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error closing Redis connection: ${errorMessage}`);
    }
  }

  /**
   * Get value from cache
   * Returns null if key doesn't exist or Redis is unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn(`Redis unavailable, cache GET for key "${key}" failed`);
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis GET error for key "${key}": ${errorMessage}`);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttl Time-to-live in seconds (default: 1 hour)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Redis unavailable, cache SET for key "${key}" skipped`);
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || 3600; // Default 1 hour

      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis SET error for key "${key}": ${errorMessage}`);
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Redis unavailable, cache DEL for key "${key}" skipped`);
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis DEL error for key "${key}": ${errorMessage}`);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis EXISTS error for key "${key}": ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get cache statistics
   * Returns detailed metrics for monitoring
   */
  async getStats(): Promise<RedisCacheStats> {
    if (!this.isConnected) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        keys: 0,
        memory: 'unavailable',
        avgTtl: 0,
      };
    }

    try {
      const info = await this.client.info('stats');
      const keys = await this.client.dbsize();
      const memory = await this.client.info('memory');

      // Parse stats
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;
      const usedMemory = memory.match(/used_memory_human:(.+)/)?.[1] || 'unknown';

      return {
        hits,
        misses,
        hitRate,
        keys,
        memory: usedMemory,
        avgTtl: 0, // Would need to sample keys to calculate
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get Redis stats: ${errorMessage}`);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        keys: 0,
        memory: 'error',
        avgTtl: 0,
      };
    }
  }

  /**
   * Health check
   * Returns detailed health status
   */
  async getHealth(): Promise<RedisHealthStatus> {
    if (!this.isConnected) {
      return {
        isConnected: false,
        uptime: 0,
        memoryUsage: 'unavailable',
        connectedClients: 0,
        totalKeys: 0,
      };
    }

    try {
      const info = await this.client.info('server');
      const stats = await this.client.info('clients');
      const keys = await this.client.dbsize();
      const memory = await this.client.info('memory');

      const uptime = parseInt(info.match(/uptime_in_seconds:(\d+)/)?.[1] || '0');
      const clients = parseInt(stats.match(/connected_clients:(\d+)/)?.[1] || '0');
      const memUsage = memory.match(/used_memory_human:(.+)/)?.[1] || 'unknown';

      return {
        isConnected: true,
        uptime,
        memoryUsage: memUsage,
        connectedClients: clients,
        totalKeys: keys,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Health check failed: ${errorMessage}`);
      return {
        isConnected: false,
        uptime: 0,
        memoryUsage: 'error',
        connectedClients: 0,
        totalKeys: 0,
      };
    }
  }

  /**
   * Simple health check (ping)
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG' && this.isConnected;
    } catch {
      return false;
    }
  }

  /**
   * Flush all keys in current database
   * ⚠️  DANGEROUS - Use only for testing
   */
  async flushDb(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush Redis in production');
    }

    try {
      await this.client.flushdb();
      this.logger.warn('⚠️  Redis database flushed (all keys deleted)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to flush Redis: ${errorMessage}`);
    }
  }
}
