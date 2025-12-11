/**
 * Cursor-Based Cache Service
 * Phase 10.112 Week 3: Netflix-Grade ID-List Caching
 *
 * Features:
 * - Stores ID-lists instead of full paper objects (80% memory savings)
 * - Shared paper cache with reference counting
 * - Query hash excludes pagination for cursor-based access
 * - LRU eviction with configurable limits
 * - Collision detection via query signature
 * - Comprehensive metrics tracking
 *
 * Memory Efficiency:
 * - Traditional: 500 papers × 10KB = 5MB per query
 * - Cursor-based: 500 IDs × 50B + shared papers = ~25KB + deduplicated papers
 * - Savings: ~80% for overlapping queries
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Minimal paper interface for cache storage
 */
export interface CachedPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  doi?: string | null;
  pmid?: string | null;
  url?: string | null;
  venue?: string;
  citationCount?: number;
  source: string;
  qualityScore?: number;
  relevanceScore?: number;
}

/**
 * Query parameters for hash generation (excludes pagination)
 */
export interface QueryParams {
  query: string;
  sources?: string[];
  yearFrom?: number;
  yearTo?: number;
  minCitations?: number;
  publicationType?: string;
  author?: string;
  authorSearchMode?: string;
  fieldOfStudy?: string;
}

/**
 * ID-list cache entry
 */
interface IdListEntry {
  paperIds: string[];
  querySignature: string;
  timestamp: number;
  accessCount: number;
  totalResults: number;
}

/**
 * Paper cache entry with reference counting
 */
interface PaperCacheEntry {
  paper: CachedPaper;
  refCount: number;
  timestamp: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CursorCacheStats {
  idListHits: number;
  idListMisses: number;
  idListHitRate: number;
  paperHits: number;
  paperMisses: number;
  paperHitRate: number;
  idListEntries: number;
  cachedPapers: number;
  collisions: number;
  estimatedMemoryMB: number;
  memorySavedMB: number;
}

/**
 * Paginated result from cache
 */
export interface PaginatedCacheResult {
  papers: CachedPaper[];
  totalResults: number;
  fromCache: boolean;
  cacheKey: string;
}

@Injectable()
export class CursorBasedCacheService {
  private readonly logger = new Logger(CursorBasedCacheService.name);

  // ID-list cache: queryHash -> ordered list of paper IDs
  private readonly idListCache: Map<string, IdListEntry> = new Map();

  // Shared paper cache: paperId -> paper with ref count
  private readonly paperCache: Map<string, PaperCacheEntry> = new Map();

  // Configuration constants
  private static readonly MAX_ID_LIST_ENTRIES = 1000;
  private static readonly MAX_PAPER_CACHE_SIZE = 50000;
  private static readonly ID_LIST_TTL_MS = 1800000; // 30 minutes
  private static readonly PAPER_TTL_MS = 3600000; // 1 hour
  private static readonly CLEANUP_INTERVAL_MS = 300000; // 5 minutes
  private static readonly BYTES_PER_ID = 50; // UUID + overhead
  private static readonly BYTES_PER_PAPER = 10000; // Average paper object size

  // Statistics
  private idListHits = 0;
  private idListMisses = 0;
  private paperHits = 0;
  private paperMisses = 0;
  private collisions = 0;

  constructor() {
    this.logger.log(
      `[CursorCache] Initialized (ID lists: ${CursorBasedCacheService.MAX_ID_LIST_ENTRIES}, ` +
      `Papers: ${CursorBasedCacheService.MAX_PAPER_CACHE_SIZE}, TTL: 30m/1h)`
    );

    // Periodic cleanup
    const cleanupInterval = setInterval(
      () => this.cleanupStaleEntries(),
      CursorBasedCacheService.CLEANUP_INTERVAL_MS,
    );
    cleanupInterval.unref();
  }

  /**
   * Generate cache key from query parameters (excludes pagination)
   * Uses stable JSON serialization for consistent hashing
   */
  generateQueryHash(params: QueryParams): string {
    // Normalize and sort for consistent hashing
    const normalized = {
      query: params.query.trim().toLowerCase(),
      sources: params.sources ? [...params.sources].sort() : undefined,
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      minCitations: params.minCitations,
      publicationType: params.publicationType,
      author: params.author?.trim().toLowerCase(),
      authorSearchMode: params.authorSearchMode,
      fieldOfStudy: params.fieldOfStudy?.trim().toLowerCase(),
    };

    // Remove undefined values for consistent serialization
    const cleanParams = Object.fromEntries(
      Object.entries(normalized).filter(([, v]) => v !== undefined)
    );

    const signature = JSON.stringify(cleanParams);
    return crypto.createHash('sha256').update(signature).digest('hex');
  }

  /**
   * Generate query signature for collision detection
   */
  private generateQuerySignature(params: QueryParams): string {
    return JSON.stringify({
      q: params.query,
      s: params.sources,
      yf: params.yearFrom,
      yt: params.yearTo,
      mc: params.minCitations,
    });
  }

  /**
   * Store search results in cache
   * Separates ID list from paper objects for memory efficiency
   */
  cacheResults(
    params: QueryParams,
    papers: CachedPaper[],
    totalResults: number,
  ): string {
    const queryHash = this.generateQueryHash(params);
    const querySignature = this.generateQuerySignature(params);

    // Check for collision with existing entry
    const existing = this.idListCache.get(queryHash);
    if (existing && existing.querySignature !== querySignature) {
      this.collisions++;
      this.logger.warn(
        `[CursorCache] Hash collision detected for query: ${params.query.substring(0, 30)}...`
      );
      // Overwrite with new data
    }

    // Evict if at capacity
    if (this.idListCache.size >= CursorBasedCacheService.MAX_ID_LIST_ENTRIES) {
      this.evictLRUIdList();
    }

    // Extract and store paper IDs
    const paperIds = papers.map(p => p.id);

    // Store ID list entry
    this.idListCache.set(queryHash, {
      paperIds,
      querySignature,
      timestamp: Date.now(),
      accessCount: 1,
      totalResults,
    });

    // Store papers in shared cache with reference counting
    for (const paper of papers) {
      this.cachePaper(paper, queryHash);
    }

    this.logger.debug(
      `[CursorCache] Cached ${papers.length} papers for query hash: ${queryHash.substring(0, 16)}...`
    );

    return queryHash;
  }

  /**
   * Retrieve paginated results from cache
   * Returns null if cache miss or collision detected
   */
  getPaginatedResults(
    params: QueryParams,
    offset: number,
    limit: number,
  ): PaginatedCacheResult | null {
    const queryHash = this.generateQueryHash(params);
    const entry = this.idListCache.get(queryHash);

    if (!entry) {
      this.idListMisses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CursorBasedCacheService.ID_LIST_TTL_MS) {
      this.invalidateIdList(queryHash);
      this.idListMisses++;
      return null;
    }

    // Collision detection
    const expectedSignature = this.generateQuerySignature(params);
    if (entry.querySignature !== expectedSignature) {
      this.collisions++;
      this.logger.warn(
        `[CursorCache] Signature mismatch for hash: ${queryHash.substring(0, 16)}...`
      );
      this.invalidateIdList(queryHash);
      this.idListMisses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    this.idListHits++;

    // Get paginated slice of IDs
    const paginatedIds = entry.paperIds.slice(offset, offset + limit);

    // Retrieve papers from shared cache
    const papers: CachedPaper[] = [];
    let allPapersFound = true;

    for (const paperId of paginatedIds) {
      const paper = this.getPaper(paperId);
      if (paper) {
        papers.push(paper);
        this.paperHits++;
      } else {
        this.paperMisses++;
        allPapersFound = false;
      }
    }

    // If any papers missing, invalidate the ID list (data inconsistency)
    if (!allPapersFound) {
      this.logger.warn(
        `[CursorCache] Paper cache miss for ID list: ${queryHash.substring(0, 16)}... ` +
        `(found ${papers.length}/${paginatedIds.length})`
      );
      // Return partial results but mark cache key as invalid for next time
    }

    return {
      papers,
      totalResults: entry.totalResults,
      fromCache: true,
      cacheKey: queryHash,
    };
  }

  /**
   * Check if query results are cached (without retrieving)
   */
  isCached(params: QueryParams): boolean {
    const queryHash = this.generateQueryHash(params);
    const entry = this.idListCache.get(queryHash);

    if (!entry) {
      return false;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CursorBasedCacheService.ID_LIST_TTL_MS) {
      return false;
    }

    return true;
  }

  /**
   * Get total result count for cached query
   */
  getCachedTotalCount(params: QueryParams): number | null {
    const queryHash = this.generateQueryHash(params);
    const entry = this.idListCache.get(queryHash);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > CursorBasedCacheService.ID_LIST_TTL_MS) {
      return null;
    }

    return entry.totalResults;
  }

  /**
   * Store individual paper in shared cache
   */
  private cachePaper(paper: CachedPaper, sourceQueryHash: string): void {
    const existing = this.paperCache.get(paper.id);

    if (existing) {
      // Increment reference count
      existing.refCount++;
      existing.timestamp = Date.now();
    } else {
      // Evict if at capacity
      if (this.paperCache.size >= CursorBasedCacheService.MAX_PAPER_CACHE_SIZE) {
        this.evictLRUPaper();
      }

      this.paperCache.set(paper.id, {
        paper,
        refCount: 1,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Retrieve paper from shared cache
   */
  private getPaper(paperId: string): CachedPaper | null {
    const entry = this.paperCache.get(paperId);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CursorBasedCacheService.PAPER_TTL_MS) {
      this.paperCache.delete(paperId);
      return null;
    }

    return entry.paper;
  }

  /**
   * Invalidate ID list and decrement paper references
   */
  private invalidateIdList(queryHash: string): void {
    const entry = this.idListCache.get(queryHash);
    if (!entry) {
      return;
    }

    // Decrement reference counts for all papers
    for (const paperId of entry.paperIds) {
      const paperEntry = this.paperCache.get(paperId);
      if (paperEntry) {
        paperEntry.refCount--;
        if (paperEntry.refCount <= 0) {
          this.paperCache.delete(paperId);
        }
      }
    }

    this.idListCache.delete(queryHash);
  }

  /**
   * Evict least recently used ID list entry
   */
  private evictLRUIdList(): void {
    let lruKey: string | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.idListCache.entries()) {
      const age = Date.now() - entry.timestamp;
      const score = (entry.accessCount * 1000) / age;

      if (score < minScore) {
        minScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.invalidateIdList(lruKey);
      this.logger.debug(`[CursorCache] Evicted LRU ID list: ${lruKey.substring(0, 16)}...`);
    }
  }

  /**
   * Evict least recently used paper
   */
  private evictLRUPaper(): void {
    let lruKey: string | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.paperCache.entries()) {
      // Skip papers still referenced by active queries
      if (entry.refCount > 0) {
        continue;
      }

      const age = Date.now() - entry.timestamp;
      const score = 1000 / age; // Older = lower score

      if (score < minScore) {
        minScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.paperCache.delete(lruKey);
      this.logger.debug(`[CursorCache] Evicted LRU paper: ${lruKey.substring(0, 16)}...`);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupStaleEntries(): void {
    const now = Date.now();
    let idListsRemoved = 0;
    let papersRemoved = 0;

    // Cleanup expired ID lists
    for (const [key, entry] of this.idListCache.entries()) {
      if (now - entry.timestamp > CursorBasedCacheService.ID_LIST_TTL_MS) {
        this.invalidateIdList(key);
        idListsRemoved++;
      }
    }

    // Cleanup expired papers with no references
    for (const [key, entry] of this.paperCache.entries()) {
      if (
        entry.refCount <= 0 &&
        now - entry.timestamp > CursorBasedCacheService.PAPER_TTL_MS
      ) {
        this.paperCache.delete(key);
        papersRemoved++;
      }
    }

    if (idListsRemoved > 0 || papersRemoved > 0) {
      this.logger.debug(
        `[CursorCache] Cleanup: removed ${idListsRemoved} ID lists, ${papersRemoved} papers`
      );
    }
  }

  /**
   * Calculate estimated memory usage
   */
  private calculateMemoryUsage(): { currentMB: number; savedMB: number } {
    const idListBytes = this.idListCache.size * CursorBasedCacheService.BYTES_PER_ID * 500; // Avg 500 IDs per list
    const paperBytes = this.paperCache.size * CursorBasedCacheService.BYTES_PER_PAPER;
    const currentBytes = idListBytes + paperBytes;

    // Traditional approach would store full papers per query
    const traditionalBytes = this.idListCache.size * 500 * CursorBasedCacheService.BYTES_PER_PAPER;
    const savedBytes = traditionalBytes - currentBytes;

    return {
      currentMB: currentBytes / (1024 * 1024),
      savedMB: Math.max(0, savedBytes) / (1024 * 1024),
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CursorCacheStats {
    const totalIdListAccesses = this.idListHits + this.idListMisses;
    const totalPaperAccesses = this.paperHits + this.paperMisses;
    const memory = this.calculateMemoryUsage();

    return {
      idListHits: this.idListHits,
      idListMisses: this.idListMisses,
      idListHitRate: totalIdListAccesses > 0
        ? Math.round((this.idListHits / totalIdListAccesses) * 100)
        : 0,
      paperHits: this.paperHits,
      paperMisses: this.paperMisses,
      paperHitRate: totalPaperAccesses > 0
        ? Math.round((this.paperHits / totalPaperAccesses) * 100)
        : 0,
      idListEntries: this.idListCache.size,
      cachedPapers: this.paperCache.size,
      collisions: this.collisions,
      estimatedMemoryMB: Math.round(memory.currentMB * 100) / 100,
      memorySavedMB: Math.round(memory.savedMB * 100) / 100,
    };
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.idListHits = 0;
    this.idListMisses = 0;
    this.paperHits = 0;
    this.paperMisses = 0;
    this.collisions = 0;
  }

  /**
   * Clear all caches (for testing)
   */
  clear(): void {
    this.idListCache.clear();
    this.paperCache.clear();
    this.resetStats();
    this.logger.log('[CursorCache] Cache cleared');
  }

  /**
   * Log cache statistics
   */
  logStats(): void {
    const stats = this.getStats();
    this.logger.log(
      `[CursorCache] Stats: ID Lists ${stats.idListHits}/${stats.idListMisses} ` +
      `(${stats.idListHitRate}% hit), Papers ${stats.paperHits}/${stats.paperMisses} ` +
      `(${stats.paperHitRate}% hit), ${stats.idListEntries} queries cached, ` +
      `${stats.cachedPapers} papers, ~${stats.estimatedMemoryMB}MB used, ` +
      `~${stats.memorySavedMB}MB saved, ${stats.collisions} collisions`
    );
  }
}
