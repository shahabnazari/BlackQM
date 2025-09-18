/**
 * AI Cache Service for Phase 6.86
 * Enterprise-grade caching with TTL, LRU eviction, and persistence
 */

import { z } from 'zod';

// Cache entry schema
const CacheEntrySchema = z.object({
  key: z.string(),
  value: z.any(),
  timestamp: z.number(),
  ttl: z.number(), // Time to live in seconds
  hits: z.number(), // Access count for LRU
  size: z.number(), // Approximate size in bytes
  tags: z.array(z.string()).optional(), // For grouped invalidation
});

type CacheEntry = z.infer<typeof CacheEntrySchema>;

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in seconds
  maxEntries: number; // Maximum number of entries
  persistToStorage: boolean; // Whether to persist to localStorage
  compressionThreshold: number; // Compress entries larger than this (bytes)
}

export class AICacheService {
  private static instance: AICacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private currentSize: number = 0;
  private localStorage: Storage | null = null;
  
  private constructor() {
    // Default configuration
    this.config = {
      maxSize: 10 * 1024 * 1024, // 10MB
      defaultTTL: 3600, // 1 hour
      maxEntries: 1000,
      persistToStorage: true,
      compressionThreshold: 1024, // 1KB
    };
    
    // Initialize localStorage if available
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
      if (this.config.persistToStorage) {
        this.loadFromStorage();
      }
    }
    
    // Start cleanup interval
    this.startCleanupInterval();
  }
  
  static getInstance(): AICacheService {
    if (!AICacheService.instance) {
      AICacheService.instance = new AICacheService();
    }
    return AICacheService.instance;
  }
  
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }
    
    // Update hit count and timestamp for LRU
    entry.hits++;
    entry.timestamp = Date.now();
    
    // Decompress if needed
    const value = this.shouldCompress(entry.size) 
      ? await this.decompress(entry.value)
      : entry.value;
    
    return value as T;
  }
  
  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    tags?: string[]
  ): Promise<void> {
    // Calculate size
    const size = this.estimateSize(value);
    
    // Check if we need to make room
    if (this.currentSize + size > this.config.maxSize) {
      this.evictLRU(size);
    }
    
    // Check max entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU(0);
    }
    
    // Compress if needed
    const storedValue = this.shouldCompress(size) 
      ? await this.compress(value)
      : value;
    
    // Create entry
    const entry: CacheEntry = {
      key,
      value: storedValue,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      size,
      tags,
    };
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
    }
    
    // Add new entry
    this.cache.set(key, entry);
    this.currentSize += size;
    
    // Persist if configured
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }
  
  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.currentSize -= entry.size;
    this.cache.delete(key);
    
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
    
    return true;
  }
  
  /**
   * Clear entire cache or by tags
   */
  clear(tags?: string[]): number {
    let cleared = 0;
    
    if (!tags) {
      // Clear everything
      cleared = this.cache.size;
      this.cache.clear();
      this.currentSize = 0;
    } else {
      // Clear by tags
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags?.some(tag => tags.includes(tag))) {
          this.delete(key);
          cleared++;
        }
      }
    }
    
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
    
    return cleared;
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    size: number;
    hitRate: number;
    averageTTL: number;
    oldestEntry: number;
    hottestKeys: Array<{ key: string; hits: number }>;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const totalRequests = totalHits + this.getMissCount();
    
    // Get hottest keys
    const hottestKeys = entries
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10)
      .map(e => ({ key: e.key, hits: e.hits }));
    
    // Find oldest entry
    const oldestEntry = entries.length > 0
      ? Math.min(...entries.map(e => e.timestamp))
      : Date.now();
    
    return {
      entries: this.cache.size,
      size: this.currentSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      averageTTL: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.ttl, 0) / entries.length 
        : 0,
      oldestEntry,
      hottestKeys,
    };
  }
  
  /**
   * Memoize a function with caching
   */
  memoize<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator?: (...args: TArgs) => string,
    ttl?: number
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `memoize_${fn.name}_${JSON.stringify(args)}`;
      
      // Check cache
      const cached = await this.get<TResult>(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function
      const result = await fn(...args);
      
      // Cache result
      await this.set(key, result, ttl);
      
      return result;
    };
  }
  
  // Private methods
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }
  
  private evictLRU(requiredSpace: number): void {
    // Sort entries by LRU score (combination of hits and recency)
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: entry.hits * 0.3 + (Date.now() - entry.timestamp) * -0.7,
      }))
      .sort((a, b) => a.score - b.score);
    
    let freedSpace = 0;
    
    for (const { key } of entries) {
      if (freedSpace >= requiredSpace && this.cache.size < this.config.maxEntries) {
        break;
      }
      
      const entry = this.cache.get(key)!;
      freedSpace += entry.size;
      this.delete(key);
    }
  }
  
  private estimateSize(value: any): number {
    // Rough estimation of object size
    const str = JSON.stringify(value);
    return str.length * 2; // Approximate bytes (UTF-16)
  }
  
  private shouldCompress(size: number): boolean {
    return size > this.config.compressionThreshold;
  }
  
  private async compress(value: any): Promise<string> {
    // Simple compression using base64 encoding
    // In production, use proper compression like pako/gzip
    const str = JSON.stringify(value);
    
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(str);
    }
    
    return str;
  }
  
  private async decompress(value: string): Promise<any> {
    // Decompress base64
    if (typeof window !== 'undefined' && window.atob) {
      try {
        const str = window.atob(value);
        return JSON.parse(str);
      } catch {
        // Fall back if not compressed
        return value;
      }
    }
    
    return value;
  }
  
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  private cleanup(): void {
    const expired: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expired.push(key);
      }
    }
    
    for (const key of expired) {
      this.delete(key);
    }
    
    if (expired.length > 0) {
      console.log(`Cache cleanup: removed ${expired.length} expired entries`);
    }
  }
  
  private getMissCount(): number {
    // This would need to be tracked separately in production
    return 0;
  }
  
  private saveToStorage(): void {
    if (!this.localStorage) return;
    
    try {
      // Only save entries that fit in localStorage (typically 5-10MB limit)
      const entries = Array.from(this.cache.entries())
        .filter(([_, entry]) => !this.isExpired(entry))
        .slice(0, 100); // Limit to 100 entries
      
      this.localStorage.setItem('ai_cache_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }
  
  private loadFromStorage(): void {
    if (!this.localStorage) return;
    
    try {
      const stored = this.localStorage.getItem('ai_cache_entries');
      if (stored) {
        const entries: Array<[string, CacheEntry]> = JSON.parse(stored);
        
        for (const [key, entry] of entries) {
          if (!this.isExpired(entry)) {
            this.cache.set(key, entry);
            this.currentSize += entry.size;
          }
        }
        
        console.log(`Loaded ${entries.length} cache entries from storage`);
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }
  
  /**
   * Warm up cache with predicted values
   */
  async warmUp(predictions: Array<{ key: string; generator: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = predictions.map(async ({ key, generator, ttl }) => {
      if (!this.has(key)) {
        try {
          const value = await generator();
          await this.set(key, value, ttl);
        } catch (error) {
          console.error(`Failed to warm up cache for key ${key}:`, error);
        }
      }
    });
    
    await Promise.all(promises);
  }
}

// Export singleton instance
export const aiCache = AICacheService.getInstance();

// Export convenience functions
export async function getCached<T>(key: string): Promise<T | null> {
  return aiCache.get<T>(key);
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl?: number,
  tags?: string[]
): Promise<void> {
  return aiCache.set(key, value, ttl, tags);
}

export function clearCache(tags?: string[]): number {
  return aiCache.clear(tags);
}

export function memoizeAI<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyGenerator?: (...args: TArgs) => string,
  ttl?: number
): (...args: TArgs) => Promise<TResult> {
  return aiCache.memoize(fn, keyGenerator, ttl);
}