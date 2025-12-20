/**
 * Phase 10.170 Week 4: Purpose-Aware Cache Service
 *
 * Netflix-grade in-memory caching for purpose-aware pipeline components.
 * Implements multi-tier TTL (fresh/stale) with memory pressure monitoring.
 *
 * DESIGN PRINCIPLES:
 * - NodeCache-style in-memory storage
 * - Fresh/stale TTL tiers for graceful staleness
 * - Memory pressure detection and emergency flush
 * - No external dependencies
 *
 * CACHE TIERS:
 * - Scores: 1h fresh, 24h stale, 50k max
 * - Diversity: 30m fresh, 4h stale, 5k max
 *
 * @module purpose-aware-cache.service
 * @since Phase 10.170 Week 4
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { ResearchPurpose } from '../types/purpose-aware.types';
import { PurposeAwareScoreResult, CorpusDiversityMetrics } from '../types/purpose-aware-scoring.types';
import {
  CacheEntry,
  CacheTier,
  CacheLookupResult,
  CacheStats,
} from '../types/purpose-aware-metrics.types';
import { PurposeAwareMetricsService } from './purpose-aware-metrics.service';
import { createHash } from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Score cache configuration */
const SCORE_CACHE_CONFIG = {
  /** Fresh TTL: 1 hour */
  FRESH_TTL_MS: 60 * 60 * 1000,
  /** Stale TTL: 24 hours */
  STALE_TTL_MS: 24 * 60 * 60 * 1000,
  /** Maximum entries */
  MAX_SIZE: 50000,
} as const;

/** Diversity cache configuration */
const DIVERSITY_CACHE_CONFIG = {
  /** Fresh TTL: 30 minutes */
  FRESH_TTL_MS: 30 * 60 * 1000,
  /** Stale TTL: 4 hours */
  STALE_TTL_MS: 4 * 60 * 60 * 1000,
  /** Maximum entries */
  MAX_SIZE: 5000,
} as const;

/** Memory pressure threshold (percentage of max entries)
 * Phase 10.185: Lowered from 0.9 to 0.8 for smoother cache eviction
 * Prevents sudden performance drops when cache is near capacity
 */
const MEMORY_PRESSURE_THRESHOLD = 0.8;

/** Cleanup interval (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class PurposeAwareCacheService {
  private readonly logger = new Logger(PurposeAwareCacheService.name);

  // Score cache: paperId:purpose -> ScoreResult
  private readonly scoreCache = new Map<string, CacheEntry<PurposeAwareScoreResult>>();

  // Diversity cache: paperSetHash -> DiversityMetrics
  private readonly diversityCache = new Map<string, CacheEntry<CorpusDiversityMetrics>>();

  // Cleanup interval handle
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    @Optional() private readonly metricsService?: PurposeAwareMetricsService,
  ) {
    this.startCleanupTimer();
    this.logger.log('✅ [PurposeAwareCache] Phase 10.170 Week 4 - Service initialized');
    this.logger.log(
      `[PurposeAwareCache] Score cache: ${SCORE_CACHE_CONFIG.MAX_SIZE} max, ` +
      `${SCORE_CACHE_CONFIG.FRESH_TTL_MS / 1000}s fresh TTL`
    );
    this.logger.log(
      `[PurposeAwareCache] Diversity cache: ${DIVERSITY_CACHE_CONFIG.MAX_SIZE} max, ` +
      `${DIVERSITY_CACHE_CONFIG.FRESH_TTL_MS / 1000}s fresh TTL`
    );
  }

  // ==========================================================================
  // SCORE CACHE METHODS
  // ==========================================================================

  /**
   * Get cached score for a paper
   *
   * @param paperId Paper identifier
   * @param purpose Research purpose
   * @returns Cache lookup result with tier information
   */
  getCachedScore(
    paperId: string,
    purpose: ResearchPurpose,
  ): CacheLookupResult<PurposeAwareScoreResult> {
    const key = this.buildScoreKey(paperId, purpose);
    const entry = this.scoreCache.get(key);

    if (!entry) {
      this.metricsService?.recordCacheOperation('scores', 'get', false);
      return { found: false, tier: 'expired', value: null };
    }

    const now = Date.now();
    const tier = this.determineTier(entry, now);

    if (tier === 'expired') {
      // Remove expired entry
      this.scoreCache.delete(key);
      this.metricsService?.recordCacheOperation('scores', 'get', false);
      return { found: false, tier: 'expired', value: null };
    }

    this.metricsService?.recordCacheOperation('scores', 'get', true);
    return { found: true, tier, value: entry.value };
  }

  /**
   * Cache a score result
   *
   * @param paperId Paper identifier
   * @param purpose Research purpose
   * @param result Score result to cache
   */
  setCachedScore(
    paperId: string,
    purpose: ResearchPurpose,
    result: PurposeAwareScoreResult,
  ): void {
    // Check memory pressure before adding
    if (this.scoreCache.size >= SCORE_CACHE_CONFIG.MAX_SIZE) {
      this.evictOldestEntries(this.scoreCache, 0.1); // Evict 10%
    }

    const key = this.buildScoreKey(paperId, purpose);
    const now = Date.now();

    const entry: CacheEntry<PurposeAwareScoreResult> = {
      value: result,
      createdAt: now,
      expiresAt: now + SCORE_CACHE_CONFIG.FRESH_TTL_MS,
      staleExpiresAt: now + SCORE_CACHE_CONFIG.STALE_TTL_MS,
      key,
    };

    this.scoreCache.set(key, entry);
    this.metricsService?.recordCacheOperation('scores', 'set');
    this.metricsService?.updateCacheSize('scores', this.scoreCache.size);
  }

  /**
   * Batch get cached scores
   *
   * @param paperIds Paper identifiers
   * @param purpose Research purpose
   * @returns Map of paperId to cached result (only hits)
   */
  batchGetCachedScores(
    paperIds: readonly string[],
    purpose: ResearchPurpose,
  ): Map<string, PurposeAwareScoreResult> {
    const results = new Map<string, PurposeAwareScoreResult>();

    for (const paperId of paperIds) {
      const lookup = this.getCachedScore(paperId, purpose);
      if (lookup.found && lookup.value) {
        results.set(paperId, lookup.value);
      }
    }

    return results;
  }

  /**
   * Batch set cached scores
   *
   * @param scores Score results to cache
   * @param purpose Research purpose
   */
  batchSetCachedScores(
    scores: readonly PurposeAwareScoreResult[],
    purpose: ResearchPurpose,
  ): void {
    for (const score of scores) {
      this.setCachedScore(score.paperId, purpose, score);
    }
  }

  /**
   * Invalidate cached score for a paper
   *
   * @param paperId Paper identifier
   */
  invalidateScore(paperId: string): void {
    // Invalidate for all purposes
    for (const purpose of Object.values(ResearchPurpose)) {
      const key = this.buildScoreKey(paperId, purpose);
      if (this.scoreCache.has(key)) {
        this.scoreCache.delete(key);
        this.metricsService?.recordCacheOperation('scores', 'invalidate');
      }
    }
    this.metricsService?.updateCacheSize('scores', this.scoreCache.size);
  }

  // ==========================================================================
  // DIVERSITY CACHE METHODS
  // ==========================================================================

  /**
   * Get cached diversity metrics for a paper set
   *
   * @param paperIds Paper identifiers (order-independent)
   * @returns Cache lookup result
   */
  getCachedDiversityMetrics(
    paperIds: readonly string[],
  ): CacheLookupResult<CorpusDiversityMetrics> {
    const key = this.buildDiversityKey(paperIds);
    const entry = this.diversityCache.get(key);

    if (!entry) {
      this.metricsService?.recordCacheOperation('diversity', 'get', false);
      return { found: false, tier: 'expired', value: null };
    }

    const now = Date.now();
    const tier = this.determineTier(entry, now);

    if (tier === 'expired') {
      this.diversityCache.delete(key);
      this.metricsService?.recordCacheOperation('diversity', 'get', false);
      return { found: false, tier: 'expired', value: null };
    }

    this.metricsService?.recordCacheOperation('diversity', 'get', true);
    return { found: true, tier, value: entry.value };
  }

  /**
   * Cache diversity metrics for a paper set
   *
   * @param paperIds Paper identifiers
   * @param metrics Diversity metrics to cache
   */
  setCachedDiversityMetrics(
    paperIds: readonly string[],
    metrics: CorpusDiversityMetrics,
  ): void {
    // Check memory pressure
    if (this.diversityCache.size >= DIVERSITY_CACHE_CONFIG.MAX_SIZE) {
      this.evictOldestEntries(this.diversityCache, 0.1);
    }

    const key = this.buildDiversityKey(paperIds);
    const now = Date.now();

    const entry: CacheEntry<CorpusDiversityMetrics> = {
      value: metrics,
      createdAt: now,
      expiresAt: now + DIVERSITY_CACHE_CONFIG.FRESH_TTL_MS,
      staleExpiresAt: now + DIVERSITY_CACHE_CONFIG.STALE_TTL_MS,
      key,
    };

    this.diversityCache.set(key, entry);
    this.metricsService?.recordCacheOperation('diversity', 'set');
    this.metricsService?.updateCacheSize('diversity', this.diversityCache.size);
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getScoreCacheStats(): CacheStats {
    return this.buildCacheStats(this.scoreCache, SCORE_CACHE_CONFIG.MAX_SIZE, 'scores');
  }

  /**
   * Get diversity cache statistics
   */
  getDiversityCacheStats(): CacheStats {
    return this.buildCacheStats(this.diversityCache, DIVERSITY_CACHE_CONFIG.MAX_SIZE, 'diversity');
  }

  /**
   * Check and handle memory pressure
   */
  checkMemoryPressure(): void {
    const scorePressure = this.scoreCache.size / SCORE_CACHE_CONFIG.MAX_SIZE;
    const diversityPressure = this.diversityCache.size / DIVERSITY_CACHE_CONFIG.MAX_SIZE;

    if (scorePressure > MEMORY_PRESSURE_THRESHOLD) {
      this.logger.warn(
        `[PurposeAwareCache] Score cache memory pressure: ${(scorePressure * 100).toFixed(1)}%`
      );
      this.evictOldestEntries(this.scoreCache, 0.2);
    }

    if (diversityPressure > MEMORY_PRESSURE_THRESHOLD) {
      this.logger.warn(
        `[PurposeAwareCache] Diversity cache memory pressure: ${(diversityPressure * 100).toFixed(1)}%`
      );
      this.evictOldestEntries(this.diversityCache, 0.2);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.scoreCache.clear();
    this.diversityCache.clear();
    this.metricsService?.updateCacheSize('scores', 0);
    this.metricsService?.updateCacheSize('diversity', 0);
    this.logger.log('[PurposeAwareCache] All caches cleared');
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Build cache key for score lookup
   */
  private buildScoreKey(paperId: string, purpose: ResearchPurpose): string {
    return `score:${paperId}:${purpose}`;
  }

  /**
   * Build cache key for diversity lookup (order-independent)
   */
  private buildDiversityKey(paperIds: readonly string[]): string {
    // Sort paper IDs to ensure consistent key regardless of input order
    const sortedIds = [...paperIds].sort();
    const hash = createHash('sha256')
      .update(sortedIds.join(','))
      .digest('hex')
      .substring(0, 16);
    return `diversity:${hash}`;
  }

  /**
   * Determine cache tier for an entry
   */
  private determineTier<T>(entry: CacheEntry<T>, now: number): CacheTier {
    if (now < entry.expiresAt) {
      return 'fresh';
    }
    if (now < entry.staleExpiresAt) {
      return 'stale';
    }
    return 'expired';
  }

  /**
   * Evict oldest entries from a cache
   */
  private evictOldestEntries<T>(
    cache: Map<string, CacheEntry<T>>,
    fraction: number,
  ): void {
    const evictCount = Math.ceil(cache.size * fraction);
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);

    for (let i = 0; i < evictCount && i < entries.length; i++) {
      cache.delete(entries[i][0]);
      this.metricsService?.recordCacheEviction(
        entries[i][0].startsWith('score:') ? 'scores' : 'diversity'
      );
    }

    this.logger.debug(`[PurposeAwareCache] Evicted ${evictCount} entries`);
  }

  /**
   * Build cache stats for a cache
   */
  private buildCacheStats<T>(
    cache: Map<string, CacheEntry<T>>,
    maxSize: number,
    name: string,
  ): CacheStats {
    // Calculate fresh vs stale vs expired
    const now = Date.now();
    let freshCount = 0;
    let staleCount = 0;

    for (const entry of cache.values()) {
      const tier = this.determineTier(entry, now);
      if (tier === 'fresh') freshCount++;
      else if (tier === 'stale') staleCount++;
    }

    // Estimate memory (rough: 500 bytes per entry)
    const memoryBytes = cache.size * 500;

    return {
      size: cache.size,
      maxSize,
      hits: 0, // Tracked by metrics service
      misses: 0, // Tracked by metrics service
      hitRate: 0, // Calculated by metrics service
      evictions: 0, // Tracked by metrics service
      memoryBytes,
    };
  }

  /**
   * Start background cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Remove expired entries from all caches
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removed = 0;

    // Clean score cache
    for (const [key, entry] of this.scoreCache) {
      if (now >= entry.staleExpiresAt) {
        this.scoreCache.delete(key);
        removed++;
      }
    }

    // Clean diversity cache
    for (const [key, entry] of this.diversityCache) {
      if (now >= entry.staleExpiresAt) {
        this.diversityCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`[PurposeAwareCache] Cleanup removed ${removed} expired entries`);
      this.metricsService?.updateCacheSize('scores', this.scoreCache.size);
      this.metricsService?.updateCacheSize('diversity', this.diversityCache.size);
    }
  }
}
