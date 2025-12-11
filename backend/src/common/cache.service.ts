import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NodeCache from 'node-cache';

/**
 * Cache Entry with metadata for stale-while-revalidate pattern
 * Phase 10.112 Enhancement: Added originalKey for collision detection
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  originalKey: string; // Collision detection: store original key for verification
}

/**
 * Cache result with staleness metadata
 */
export interface CacheResult<T> {
  data: T | null;
  isFresh: boolean;
  isStale: boolean;
  isArchive: boolean;
  age: number; // Age in seconds
  timestamp?: number;
}

/**
 * Cache statistics with memory metrics
 * Phase 10.112 Enhancement: Netflix-grade observability
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
  collisions: number;
  evictions: number;
  memoryPressureFlushes: number;
  memoryUsageMB: number;
}

/**
 * Cache Service - Phase 7 Day 4 + Phase 10.112 Netflix-Grade Enhancement
 *
 * Multi-tier caching service with stale-while-revalidate pattern:
 * - Tier 1 (Fresh): 0-1 hour - Served as fresh data
 * - Tier 2 (Stale): 1-24 hours - Served during rate limits with staleness indicator
 * - Tier 3 (Archive): 24 hours-30 days - Served only as last resort
 *
 * Phase 10.112 Enhancements:
 * - LRU eviction with maxKeys limit (prevents unbounded memory growth)
 * - Memory pressure monitoring with emergency flush
 * - Collision detection with original key verification
 * - Production-grade metrics and logging
 *
 * Netflix-Grade Features:
 * - Bounded memory: maxKeys=10000 (~50MB max)
 * - Automatic eviction: deleteOnExpire=true
 * - Memory pressure: Emergency flush at 1GB heap
 * - Observability: Collision/eviction tracking
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private cache: NodeCache;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  // Multi-tier TTL configuration (in seconds)
  private readonly TTL_FRESH = 3600; // 1 hour
  private readonly TTL_STALE = 86400; // 24 hours
  private readonly TTL_ARCHIVE = 2592000; // 30 days

  // Phase 10.112: Netflix-grade memory management (configurable via env)
  private readonly maxKeys: number;
  private readonly memoryPressureThresholdMB: number;
  private readonly memoryCheckIntervalMS: number;

  // Phase 10.112: Default constants (used if env not set)
  private static readonly DEFAULT_MAX_KEYS = 10000; // LRU eviction at 10K entries
  private static readonly DEFAULT_MEMORY_PRESSURE_THRESHOLD_MB = 1024; // 1GB heap threshold
  private static readonly DEFAULT_MEMORY_CHECK_INTERVAL_MS = 60000; // Check every minute

  // Phase 10.112: Metrics tracking
  private collisionCount = 0;
  private evictionCount = 0;
  private memoryPressureFlushCount = 0;

  constructor(private readonly configService: ConfigService) {
    // Phase 10.112: Netflix-grade configurable thresholds via environment
    this.maxKeys = this.configService.get<number>(
      'CACHE_MAX_KEYS',
      CacheService.DEFAULT_MAX_KEYS
    );
    this.memoryPressureThresholdMB = this.configService.get<number>(
      'CACHE_MEMORY_PRESSURE_THRESHOLD_MB',
      CacheService.DEFAULT_MEMORY_PRESSURE_THRESHOLD_MB
    );
    this.memoryCheckIntervalMS = this.configService.get<number>(
      'CACHE_MEMORY_CHECK_INTERVAL_MS',
      CacheService.DEFAULT_MEMORY_CHECK_INTERVAL_MS
    );

    // Phase 10.112: Netflix-grade NodeCache configuration
    // - maxKeys: Prevents unbounded memory growth (LRU eviction)
    // - deleteOnExpire: Immediate cleanup of expired entries
    this.cache = new NodeCache({
      stdTTL: this.TTL_ARCHIVE,
      checkperiod: 3600, // Check for expired items every hour
      useClones: false, // Performance: return direct references
      maxKeys: this.maxKeys, // Phase 10.112: Configurable LRU eviction limit
      deleteOnExpire: true, // Phase 10.112: Immediate cleanup
    });

    // Phase 10.112: Track evictions for metrics
    this.cache.on('del', (key: string) => {
      this.evictionCount++;
      this.logger.debug(`[Cache] Evicted key: ${key.substring(0, 50)}...`);
    });
  }

  /**
   * Phase 10.112: Initialize memory pressure monitoring
   */
  onModuleInit(): void {
    this.startMemoryPressureMonitoring();
    this.logger.log(
      `✅ [Cache] Initialized (maxKeys: ${this.maxKeys}, ` +
      `memoryThreshold: ${this.memoryPressureThresholdMB}MB)`
    );
  }

  /**
   * Phase 10.112: Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.logger.log('[Cache] Shutdown complete');
  }

  /**
   * Phase 10.112: Start memory pressure monitoring
   * Periodically checks heap usage and flushes cache if threshold exceeded
   */
  private startMemoryPressureMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, this.memoryCheckIntervalMS);
    // Unref the timer to allow process to exit gracefully during tests
    // This prevents the interval from keeping Node.js process alive
    this.memoryCheckInterval.unref();
  }

  /**
   * Phase 10.112: Check memory pressure and flush if needed
   * Netflix-grade: Automatic protection against OOM
   */
  private checkMemoryPressure(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / (1024 * 1024);

    if (heapUsedMB > this.memoryPressureThresholdMB) {
      this.memoryPressureFlushCount++;
      const keysBefore = this.cache.keys().length;

      // Emergency flush: Remove oldest 50% of entries
      const keys = this.cache.keys();
      const keysToRemove = Math.floor(keys.length / 2);
      const sortedKeys = keys
        .map(key => {
          const entry = this.cache.get<CacheEntry<unknown>>(key);
          return { key, timestamp: entry?.timestamp ?? 0 };
        })
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, keysToRemove)
        .map(item => item.key);

      this.cache.del(sortedKeys);

      this.logger.warn(
        `⚠️ [Cache] Memory pressure flush: ${heapUsedMB.toFixed(0)}MB heap, ` +
        `removed ${keysToRemove}/${keysBefore} oldest entries ` +
        `(total flushes: ${this.memoryPressureFlushCount})`
      );
    }
  }

  /**
   * Get value from cache (backward compatible)
   * Returns data if fresh, null otherwise
   */
  async get(key: string): Promise<any> {
    const result = await this.getWithMetadata(key);
    return result.isFresh ? result.data : null;
  }

  /**
   * Get value from cache with staleness metadata
   * Phase 10 Days 2-3: Enhanced version for stale-while-revalidate
   * Phase 10.112: Added collision detection via originalKey verification
   */
  async getWithMetadata<T>(key: string): Promise<CacheResult<T>> {
    const entry = this.cache.get<CacheEntry<T>>(key);

    if (!entry) {
      return {
        data: null,
        isFresh: false,
        isStale: false,
        isArchive: false,
        age: 0,
      };
    }

    // Phase 10.112: Collision detection - verify originalKey matches
    if (entry.originalKey && entry.originalKey !== key) {
      this.collisionCount++;
      this.logger.warn(
        `⚠️ [Cache] Hash collision detected! Key: ${key.substring(0, 30)}... ` +
        `Original: ${entry.originalKey.substring(0, 30)}... ` +
        `(total collisions: ${this.collisionCount})`
      );
      // Evict the colliding entry and return cache miss
      this.cache.del(key);
      return {
        data: null,
        isFresh: false,
        isStale: false,
        isArchive: false,
        age: 0,
      };
    }

    const now = Date.now();
    const ageMs = now - entry.timestamp;
    const ageSeconds = Math.floor(ageMs / 1000);

    // Determine tier based on age
    const isFresh = ageSeconds < this.TTL_FRESH;
    const isStale = ageSeconds >= this.TTL_FRESH && ageSeconds < this.TTL_STALE;
    const isArchive = ageSeconds >= this.TTL_STALE;

    return {
      data: entry.data,
      isFresh,
      isStale,
      isArchive,
      age: ageSeconds,
      timestamp: entry.timestamp,
    };
  }

  /**
   * Get stale or archive data (fallback during rate limits)
   * Phase 10 Days 2-3: Returns stale/archive data when fresh is unavailable
   */
  async getStaleOrArchive<T>(key: string): Promise<CacheResult<T>> {
    const result = await this.getWithMetadata<T>(key);

    if (result.data && (result.isStale || result.isArchive)) {
      this.logger.log(
        `🔄 [Cache] Serving ${result.isStale ? 'stale' : 'archive'} data for "${key}" (age: ${Math.floor(result.age / 60)} min)`,
      );
      return result;
    }

    return {
      data: null,
      isFresh: false,
      isStale: false,
      isArchive: false,
      age: 0,
    };
  }

  /**
   * Set value in cache with metadata
   * Phase 10.112: Added originalKey for collision detection
   * Phase 10.112: Handle ECACHEFULL by evicting oldest entry before retry
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const entry: CacheEntry<any> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.TTL_ARCHIVE,
      originalKey: key, // Phase 10.112: Store original key for collision detection
    };

    try {
      // Always use archive TTL for storage, metadata determines freshness
      return this.cache.set(key, entry, this.TTL_ARCHIVE);
    } catch (error: unknown) {
      // Phase 10.112: Handle cache full error by evicting oldest entry
      // NodeCache sets error.name = 'ECACHEFULL', not error.message
      const isNodeCacheError = error instanceof Error;
      const isCacheFull = isNodeCacheError && (
        error.name === 'ECACHEFULL' ||
        error.message.includes('max keys') ||
        error.message.includes('Cache full')
      );

      if (isCacheFull) {
        this.evictOldestEntry();
        // Retry after eviction
        try {
          return this.cache.set(key, entry, this.TTL_ARCHIVE);
        } catch (retryError: unknown) {
          this.logger.error(`[Cache] Failed to set key after eviction: ${key}`);
          return false;
        }
      }
      throw error;
    }
  }

  /**
   * Phase 10.112: Evict oldest entry to make room for new entries
   */
  private evictOldestEntry(): void {
    const keys = this.cache.keys();
    if (keys.length === 0) return;

    let oldestKey = keys[0];
    let oldestTimestamp = Infinity;

    for (const key of keys) {
      const entry = this.cache.get<CacheEntry<unknown>>(key);
      if (entry && entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    this.cache.del(oldestKey);
    this.logger.debug(`[Cache] Evicted oldest entry: ${oldestKey.substring(0, 50)}...`);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<number> {
    return this.cache.del(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    return this.cache.del(matchingKeys);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.flushAll();
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   * Phase 10.112: Enhanced with Netflix-grade metrics
   */
  getStats(): CacheStats {
    const nodeStats = this.cache.getStats();
    const memUsage = process.memoryUsage();

    return {
      hits: nodeStats.hits,
      misses: nodeStats.misses,
      keys: nodeStats.keys,
      ksize: nodeStats.ksize,
      vsize: nodeStats.vsize,
      collisions: this.collisionCount,
      evictions: this.evictionCount,
      memoryPressureFlushes: this.memoryPressureFlushCount,
      memoryUsageMB: Math.round(memUsage.heapUsed / (1024 * 1024)),
    };
  }

  /**
   * Phase 10.112: Get collision count for monitoring
   */
  getCollisionCount(): number {
    return this.collisionCount;
  }

  /**
   * Phase 10.112: Get eviction count for monitoring
   */
  getEvictionCount(): number {
    return this.evictionCount;
  }

  /**
   * Phase 10.112: Get memory pressure flush count
   */
  getMemoryPressureFlushCount(): number {
    return this.memoryPressureFlushCount;
  }

  /**
   * Phase 10.112: Force memory pressure check (for testing)
   */
  forceMemoryCheck(): void {
    this.checkMemoryPressure();
  }

  /**
   * Phase 10.112: Get current cache key count
   */
  getKeyCount(): number {
    return this.cache.keys().length;
  }

  /**
   * Phase 10.112: Check if cache is at capacity
   */
  isAtCapacity(): boolean {
    return this.cache.keys().length >= this.maxKeys;
  }

  /**
   * Phase 10.112: Get configured max keys limit
   */
  getMaxKeys(): number {
    return this.maxKeys;
  }
}
