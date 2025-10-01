/**
 * Phase 9 Day 11 - Enterprise-Grade Caching Service
 *
 * Provides multi-layer caching with:
 * - Memory cache (fastest, limited size)
 * - IndexedDB cache (persistent, larger capacity)
 * - Session storage (temporary, cross-tab)
 * - Request deduplication
 * - Cache invalidation strategies
 *
 * @author Phase 9 Day 11 Implementation
 * @date October 1, 2025
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size?: number;
  etag?: string;
  dependencies?: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in ms
  layer?: 'memory' | 'indexeddb' | 'session' | 'all';
  compress?: boolean;
  encrypt?: boolean;
  dependencies?: string[];
  invalidateOn?: string[];
}

interface CacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  avgResponseTime: number;
  memoryUsage: number;
  storageUsage: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>>;
  private pendingRequests: Map<string, Promise<any>>;
  private statistics: CacheStatistics;
  private maxMemorySize: number;
  private currentMemorySize: number;
  private dbName = 'vqmethod-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.memoryCache = new Map();
    this.pendingRequests = new Map();
    this.statistics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      storageUsage: 0,
    };
    this.maxMemorySize = 50 * 1024 * 1024; // 50MB
    this.currentMemorySize = 0;
    this.initIndexedDB();
    this.startCleanupInterval();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };

      request.onsuccess = () => {
        this.db = request.result;
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('dependencies', 'dependencies', {
            unique: false,
            multiEntry: true,
          });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
    }
  }

  /**
   * Get data from cache with multiple layer fallback
   */
  async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const startTime = performance.now();
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      layer = 'all',
    } = options;

    // Check for pending requests to prevent duplicate fetches
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Try memory cache first
    if (layer === 'memory' || layer === 'all') {
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        this.updateStatistics('hit', performance.now() - startTime);
        return memoryResult;
      }
    }

    // Try session storage
    if (layer === 'session' || layer === 'all') {
      const sessionResult = await this.getFromSession<T>(key);
      if (sessionResult !== null) {
        // Promote to memory cache
        this.setToMemory(key, sessionResult, ttl);
        this.updateStatistics('hit', performance.now() - startTime);
        return sessionResult;
      }
    }

    // Try IndexedDB
    if ((layer === 'indexeddb' || layer === 'all') && this.db) {
      const dbResult = await this.getFromIndexedDB<T>(key);
      if (dbResult !== null) {
        // Promote to memory and session cache
        this.setToMemory(key, dbResult, ttl);
        this.setToSession(key, dbResult, ttl);
        this.updateStatistics('hit', performance.now() - startTime);
        return dbResult;
      }
    }

    // Cache miss - fetch if fetcher provided
    if (fetcher) {
      this.updateStatistics('miss', performance.now() - startTime);

      // Create pending request to prevent duplicate fetches
      const fetchPromise = fetcher().then(
        async data => {
          await this.set(key, data, options);
          this.pendingRequests.delete(key);
          return data;
        },
        error => {
          this.pendingRequests.delete(key);
          throw error;
        }
      );

      this.pendingRequests.set(key, fetchPromise);
      return fetchPromise;
    }

    this.updateStatistics('miss', performance.now() - startTime);
    return null;
  }

  /**
   * Set data in cache across multiple layers
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 5 * 60 * 1000, layer = 'all', dependencies = [] } = options;

    const size = this.estimateSize(data);

    if (layer === 'memory' || layer === 'all') {
      this.setToMemory(key, data, ttl, dependencies, size);
    }

    if (layer === 'session' || layer === 'all') {
      await this.setToSession(key, data, ttl, dependencies);
    }

    if ((layer === 'indexeddb' || layer === 'all') && this.db) {
      await this.setToIndexedDB(key, data, ttl, dependencies, size);
    }
  }

  /**
   * Invalidate cache entries
   */
  async invalidate(
    pattern?: string | RegExp,
    options: { layer?: string } = {}
  ): Promise<void> {
    const { layer = 'all' } = options;

    if (layer === 'memory' || layer === 'all') {
      this.invalidateMemory(pattern);
    }

    if (layer === 'session' || layer === 'all') {
      this.invalidateSession(pattern);
    }

    if ((layer === 'indexeddb' || layer === 'all') && this.db) {
      await this.invalidateIndexedDB(pattern);
    }
  }

  /**
   * Invalidate by dependency
   */
  async invalidateByDependency(dependency: string): Promise<void> {
    // Memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        this.memoryCache.delete(key);
      }
    }

    // Session storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('cache:')) {
        try {
          const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (entry.dependencies?.includes(dependency)) {
            sessionStorage.removeItem(key);
          }
        } catch {}
      }
    }

    // IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('dependencies');
      const request = index.openCursor(IDBKeyRange.only(dependency));

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  /**
   * Memory cache operations
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.currentMemorySize -= entry.size || 0;
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  private setToMemory<T>(
    key: string,
    data: T,
    ttl: number,
    dependencies: string[] = [],
    size?: number
  ): void {
    const entrySize = size || this.estimateSize(data);

    // Evict if necessary
    while (this.currentMemorySize + entrySize > this.maxMemorySize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size: entrySize,
      dependencies,
    };

    this.memoryCache.set(key, entry);
    this.currentMemorySize += entrySize;
  }

  /**
   * Session storage operations
   */
  private async getFromSession<T>(key: string): Promise<T | null> {
    try {
      const item = sessionStorage.getItem(`cache:${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);

      if (Date.now() - entry.timestamp > entry.ttl) {
        sessionStorage.removeItem(`cache:${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  private async setToSession<T>(
    key: string,
    data: T,
    ttl: number,
    dependencies: string[] = []
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        dependencies,
      };

      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      // Session storage full or other error
      console.warn('Failed to save to session storage:', error);
    }
  }

  /**
   * IndexedDB operations
   */
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    return new Promise(resolve => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (Date.now() - result.timestamp > result.ttl) {
          // Expired - delete it
          this.deleteFromIndexedDB(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  private async setToIndexedDB<T>(
    key: string,
    data: T,
    ttl: number,
    dependencies: string[] = [],
    size?: number
  ): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const entry = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        size,
        dependencies,
      };

      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save to IndexedDB'));
      };
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    store.delete(key);
  }

  /**
   * Cache invalidation
   */
  private invalidateMemory(pattern?: string | RegExp): void {
    if (!pattern) {
      this.memoryCache.clear();
      this.currentMemorySize = 0;
      return;
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        this.currentMemorySize -= entry.size || 0;
      }
    }
  }

  private invalidateSession(pattern?: string | RegExp): void {
    const regex = pattern
      ? typeof pattern === 'string'
        ? new RegExp(pattern)
        : pattern
      : null;

    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('cache:')) {
        if (!regex || regex.test(key.substring(6))) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  private async invalidateIndexedDB(pattern?: string | RegExp): Promise<void> {
    if (!this.db) return;

    const regex = pattern
      ? typeof pattern === 'string'
        ? new RegExp(pattern)
        : pattern
      : null;

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    if (!regex) {
      store.clear();
      return;
    }

    const request = store.openCursor();

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (regex.test(cursor.key)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  /**
   * LRU eviction for memory cache
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000;
      if (score < lruHits) {
        lruHits = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.memoryCache.get(lruKey);
      if (entry) {
        this.currentMemorySize -= entry.size || 0;
        this.memoryCache.delete(lruKey);
        this.statistics.evictions++;
      }
    }
  }

  /**
   * Cleanup expired entries periodically
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  private cleanup(): void {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        this.currentMemorySize -= entry.size || 0;
      }
    }

    // Clean session storage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('cache:')) {
        try {
          const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (Date.now() - entry.timestamp > entry.ttl) {
            sessionStorage.removeItem(key);
          }
        } catch {}
      }
    }

    // Clean IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(Date.now() - 24 * 60 * 60 * 1000); // 24 hours old

      const request = index.openCursor(range);
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  /**
   * Utility functions
   */
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default 1KB if estimation fails
    }
  }

  private updateStatistics(type: 'hit' | 'miss', responseTime: number): void {
    if (type === 'hit') {
      this.statistics.hits++;
    } else {
      this.statistics.misses++;
    }

    // Update average response time
    const total = this.statistics.hits + this.statistics.misses;
    this.statistics.avgResponseTime =
      (this.statistics.avgResponseTime * (total - 1) + responseTime) / total;

    this.statistics.memoryUsage = this.currentMemorySize;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.currentMemorySize = 0;

    // Clear session storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('cache:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    }

    // Reset statistics
    this.statistics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      storageUsage: 0,
    };
  }

  /**
   * Preload cache with data
   */
  async preload<T>(
    items: Array<{
      key: string;
      fetcher: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    const promises = items.map(({ key, fetcher, options }) =>
      this.get(key, fetcher, options)
    );

    await Promise.all(promises);
  }

  /**
   * Create cache key from parameters
   */
  static createKey(namespace: string, ...params: any[]): string {
    const paramStr = params
      .map(p => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      .join(':');

    return `${namespace}:${paramStr}`;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export React hooks
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await cacheService.invalidate(key);
      const result = await cacheService.get(key, fetcher, options);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await cacheService.get(key, fetcher, options);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading, error, refresh };
}

// Export performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      console.warn(`Start mark '${startMark}' not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }

    this.measures.get(name)!.push(duration);

    return duration;
  }

  getAverageMeasure(name: string): number {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;

    return measures.reduce((sum, val) => sum + val, 0) / measures.length;
  }

  getPercentile(name: string, percentile: number): number {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;

    const sorted = [...measures].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;

    return sorted[Math.max(0, index)] || 0;
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  report(): {
    measures: {
      [key: string]: { avg: number; p50: number; p95: number; p99: number };
    };
  } {
    const report: any = { measures: {} };

    for (const [name, _values] of this.measures.entries()) {
      report.measures[name] = {
        avg: this.getAverageMeasure(name),
        p50: this.getPercentile(name, 50),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99),
      };
    }

    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React import for hooks
import React from 'react';
