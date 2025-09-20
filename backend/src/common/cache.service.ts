import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NodeCache from 'node-cache';

/**
 * Cache Service - Phase 7 Day 4 Implementation
 *
 * In-memory caching service for performance optimization
 * Used by visualization service for chart caching
 */
@Injectable()
export class CacheService {
  private cache: NodeCache;

  constructor(private configService: ConfigService) {
    // Initialize with default TTL of 1 hour
    this.cache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600,
      useClones: false,
    });
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
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
