import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NodeCache from 'node-cache';

/**
 * Cache Entry with metadata for stale-while-revalidate pattern
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
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
 * Cache Service - Phase 7 Day 4 + Phase 10 Days 2-3 Enhancement
 *
 * Multi-tier caching service with stale-while-revalidate pattern:
 * - Tier 1 (Fresh): 0-1 hour - Served as fresh data
 * - Tier 2 (Stale): 1-24 hours - Served during rate limits with staleness indicator
 * - Tier 3 (Archive): 24 hours-30 days - Served only as last resort
 *
 * This prevents "0 results" during API rate limits by serving stale data
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: NodeCache;

  // Multi-tier TTL configuration (in seconds)
  private readonly TTL_FRESH = 3600; // 1 hour
  private readonly TTL_STALE = 86400; // 24 hours
  private readonly TTL_ARCHIVE = 2592000; // 30 days

  constructor(private configService: ConfigService) {
    // Initialize with archive TTL (30 days) to keep all data
    // We'll determine freshness/staleness based on timestamp
    this.cache = new NodeCache({
      stdTTL: this.TTL_ARCHIVE,
      checkperiod: 3600, // Check for expired items every hour
      useClones: false,
    });
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
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const entry: CacheEntry<any> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.TTL_ARCHIVE,
    };

    // Always use archive TTL for storage, metadata determines freshness
    return this.cache.set(key, entry, this.TTL_ARCHIVE);
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
   */
  getStats() {
    return this.cache.getStats();
  }
}
