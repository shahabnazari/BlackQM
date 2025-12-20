/**
 * Phase 10.113 Week 11: Redis-Based Embedding Cache Service
 *
 * High-performance caching layer for paper embeddings:
 * - Key: SHA256(DOI || Title+Author || ID) - prioritized for uniqueness
 * - Value: Float32Array compressed with Brotli
 * - TTL: 7 days (papers don't change)
 * - Target hit rate: >60% for common queries
 *
 * Memory Analysis:
 * - 384 dims × 4 bytes = 1.5KB per paper (uncompressed)
 * - ~600 bytes compressed with Brotli
 * - 10,000 papers ≈ 6MB Redis memory
 *
 * FIXES FROM ULTRA-THINK REVIEW:
 * - Bug 5: Cache key priority (DOI > Title+Author > ID)
 * - Bug 8: Redis fallback on connection failure
 * - Bug 9: Compression validation with round-trip check
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 11
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { Paper } from '../dto/literature.dto';
import { CacheService } from '../../../common/cache.service';
// Phase 10.113 Week 12: Production Monitoring
import { SemanticMetricsService } from './semantic-metrics.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Cached embedding with paper reference
 */
export interface CachedEmbedding {
  paper: Paper;
  embedding: number[];
}

/**
 * Uncached paper with original index
 */
export interface UncachedPaper {
  paper: Paper;
  index: number;
}

/**
 * Cache result from batch lookup
 */
export interface CacheResult {
  cached: CachedEmbedding[];
  uncached: UncachedPaper[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Cache key prefix for embedding namespace
 */
const CACHE_PREFIX = 'emb:v1:';

/**
 * TTL in seconds (7 days)
 */
const TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Maximum size for uncompressed JSON fallback (1MB)
 */
const MAX_UNCOMPRESSED_SIZE = 1024 * 1024;

/**
 * In-memory LRU fallback cache size
 * Phase 10.185: Increased from 1K to 5K for higher hit rates
 * At ~600 bytes/embedding, 5K entries = ~3MB memory (acceptable trade-off)
 */
const LRU_CACHE_SIZE = 5000;

// ============================================================================
// PROMISIFIED ZLIB
// ============================================================================

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class EmbeddingCacheService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingCacheService.name);

  // Bug 8 FIX: In-memory LRU cache as fallback
  private readonly lruCache = new Map<string, { embedding: number[]; timestamp: number }>();

  // Statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    hitRate: 0,
  };

  constructor(
    private readonly cacheService: CacheService,
    // Phase 10.113 Week 12: Production Monitoring
    private readonly semanticMetrics: SemanticMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('✅ [Phase 10.113 Week 11] EmbeddingCacheService initialized');
    this.logger.log(`   Prefix: ${CACHE_PREFIX}, TTL: ${TTL_SECONDS}s (7 days)`);
    this.logger.log(`   LRU fallback size: ${LRU_CACHE_SIZE} entries`);
  }

  /**
   * Bug 5 FIX: Generate reliable cache key with priority
   *
   * Priority order:
   * 1. DOI (globally unique)
   * 2. Title + First Author (mostly unique)
   * 3. Internal ID (fallback)
   * 4. null (skip caching for unidentifiable papers)
   *
   * @param paper - Paper to generate key for
   * @returns Cache key or null if unidentifiable
   */
  private generateCacheKey(paper: Paper): string | null {
    let identifier: string | null = null;

    // Priority 1: DOI (most reliable)
    if (paper.doi && paper.doi.trim().length > 0) {
      identifier = paper.doi.trim().toLowerCase();
    }
    // Priority 2: Title + First Author (authors is string[])
    else if (paper.title && paper.authors?.[0]) {
      const normalizedTitle = this.normalizeText(paper.title);
      const normalizedAuthor = this.normalizeText(paper.authors[0]);
      identifier = `${normalizedTitle}_${normalizedAuthor}`;
    }
    // Priority 3: Internal ID
    else if (paper.id && paper.id.trim().length > 0) {
      identifier = paper.id.trim();
    }

    // Skip caching for unidentifiable papers
    if (!identifier) {
      this.logger.debug(`[EmbeddingCache] Cannot generate key for paper: ${paper.title?.substring(0, 50) ?? 'Unknown'}`);
      return null;
    }

    // Hash to fixed-length key
    return `${CACHE_PREFIX}${this.hashIdentifier(identifier)}`;
  }

  /**
   * Normalize text for cache key generation
   *
   * @param text - Text to normalize
   * @returns Normalized text (lowercase, alphanumeric only)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 100);
  }

  /**
   * Hash identifier to fixed-length string
   *
   * @param id - Identifier to hash
   * @returns SHA256 hash (first 16 chars)
   */
  private hashIdentifier(id: string): string {
    return createHash('sha256')
      .update(id)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Bug 8 FIX: Get cached embeddings with Redis fallback to LRU
   *
   * @param papers - Papers to look up
   * @returns Cached embeddings and uncached papers
   */
  async getCachedEmbeddings(papers: Paper[]): Promise<CacheResult> {
    const cached: CachedEmbedding[] = [];
    const uncached: UncachedPaper[] = [];

    // Track papers without valid keys
    const papersWithKeys: Array<{ paper: Paper; key: string; index: number }> = [];

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      const key = this.generateCacheKey(paper);

      if (key) {
        papersWithKeys.push({ paper, key, index: i });
      } else {
        // Bug 5 FIX: Papers without valid key go directly to uncached
        uncached.push({ paper, index: i });
      }
    }

    if (papersWithKeys.length === 0) {
      return { cached: [], uncached: papers.map((p, i) => ({ paper: p, index: i })) };
    }

    try {
      // Try Redis batch get via CacheService
      for (const { paper, key, index } of papersWithKeys) {
        try {
          // Check LRU first (fastest)
          const lruEntry = this.lruCache.get(key);
          if (lruEntry) {
            cached.push({ paper, embedding: lruEntry.embedding });
            this.stats.hits++;
            this.semanticMetrics.recordCacheHit(); // Phase 10.113 Week 12
            continue;
          }

          // Check Redis
          const value = await this.cacheService.get(key) as string | null;

          if (value) {
            try {
              const embedding = await this.decompress(value);
              cached.push({ paper, embedding });

              // Update LRU
              this.updateLRU(key, embedding);
              this.stats.hits++;
              this.semanticMetrics.recordCacheHit(); // Phase 10.113 Week 12
            } catch (decompressError) {
              const errorMsg = decompressError instanceof Error ? decompressError.message : String(decompressError);
              this.logger.debug(`[EmbeddingCache] Decompress failed for ${key}: ${errorMsg}`);
              uncached.push({ paper, index });
              this.stats.misses++;
              this.semanticMetrics.recordCacheMiss(); // Phase 10.113 Week 12
            }
          } else {
            uncached.push({ paper, index });
            this.stats.misses++;
            this.semanticMetrics.recordCacheMiss(); // Phase 10.113 Week 12
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.debug(`[EmbeddingCache] Cache error for ${key}: ${errorMsg}`);
          uncached.push({ paper, index });
          this.stats.errors++;
          this.semanticMetrics.recordCacheMiss(); // Phase 10.113 Week 12: Errors count as misses
        }
      }

      this.updateHitRate();
      return { cached, uncached };

    } catch (error) {
      // Bug 8 FIX: Redis unavailable - return all as uncached
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[EmbeddingCache] Redis unavailable: ${errorMsg}. Treating all as cache miss.`);
      this.stats.errors++;

      return {
        cached: [],
        uncached: papers.map((p, i) => ({ paper: p, index: i })),
      };
    }
  }

  /**
   * Bug 9 FIX: Cache embeddings with compression validation
   *
   * Non-blocking: Failures don't affect search pipeline
   *
   * @param items - Papers with embeddings to cache
   */
  async cacheEmbeddings(
    items: Array<{ paper: Paper; embedding: number[] }>,
  ): Promise<void> {
    try {
      for (const { paper, embedding } of items) {
        const key = this.generateCacheKey(paper);
        if (!key) continue;

        try {
          // Bug 9 FIX: Compress with validation
          const compressed = await this.compressWithValidation(embedding);
          await this.cacheService.set(key, compressed, TTL_SECONDS);

          // Update LRU
          this.updateLRU(key, embedding);
        } catch (compressError) {
          const errorMsg = compressError instanceof Error ? compressError.message : String(compressError);

          // Bug 9 FIX: Fallback to uncompressed JSON if small enough
          const uncompressed = JSON.stringify(embedding);
          if (uncompressed.length < MAX_UNCOMPRESSED_SIZE) {
            this.logger.debug(`[EmbeddingCache] Compression failed for ${key}, caching uncompressed`);
            await this.cacheService.set(key, uncompressed, TTL_SECONDS);
          } else {
            this.logger.warn(`[EmbeddingCache] Skip caching ${key}: ${errorMsg}`);
          }
        }
      }
    } catch (error) {
      // Bug 8 FIX: Non-blocking - cache failure doesn't break search
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[EmbeddingCache] Failed to cache embeddings: ${errorMsg}`);
    }
  }

  /**
   * Bug 9 FIX: Compress with round-trip validation
   *
   * @param embedding - Embedding vector to compress
   * @returns Base64-encoded compressed data
   * @throws Error if validation fails
   */
  private async compressWithValidation(embedding: number[]): Promise<string> {
    const compressed = await this.compress(embedding);

    // Validate: decompress and compare
    const decompressed = await this.decompress(compressed);

    if (decompressed.length !== embedding.length) {
      throw new Error(`Compression validation failed: length ${decompressed.length} vs ${embedding.length}`);
    }

    // Spot-check values
    for (let i = 0; i < Math.min(5, embedding.length); i++) {
      if (Math.abs(decompressed[i] - embedding[i]) > 0.0001) {
        throw new Error(`Compression validation failed: value mismatch at index ${i}`);
      }
    }

    return compressed;
  }

  /**
   * Compress embedding to base64 string
   *
   * @param embedding - Embedding vector
   * @returns Base64-encoded Brotli-compressed data
   */
  private async compress(embedding: number[]): Promise<string> {
    const buffer = Buffer.from(new Float32Array(embedding).buffer);
    const compressed = await brotliCompress(buffer, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Balance speed vs compression
      },
    });
    return compressed.toString('base64');
  }

  /**
   * Decompress embedding from base64 string
   *
   * Handles both compressed and uncompressed (JSON) formats for backwards compatibility.
   *
   * @param data - Compressed or JSON-encoded data
   * @returns Embedding vector
   */
  private async decompress(data: string): Promise<number[]> {
    // Handle uncompressed JSON format (Bug 9 fallback)
    if (data.startsWith('[')) {
      return JSON.parse(data) as number[];
    }

    // Decompress Brotli
    const buffer = Buffer.from(data, 'base64');
    const decompressed = await brotliDecompress(buffer);

    // Convert to Float32Array
    const float32Array = new Float32Array(
      decompressed.buffer,
      decompressed.byteOffset,
      decompressed.byteLength / 4,
    );

    return Array.from(float32Array);
  }

  /**
   * Update LRU cache with eviction - O(1) using Map insertion order
   *
   * JavaScript Map maintains insertion order. To update "recently used":
   * - Delete and re-insert to move to end (newest)
   * - For eviction, get first key (oldest)
   *
   * @param key - Cache key
   * @param embedding - Embedding vector
   */
  private updateLRU(key: string, embedding: number[]): void {
    // If key exists, delete first to update position (move to end)
    if (this.lruCache.has(key)) {
      this.lruCache.delete(key);
    }

    // Evict oldest (first entry in Map) if at capacity
    if (this.lruCache.size >= LRU_CACHE_SIZE) {
      // Map.keys().next() gives first (oldest) key - O(1)
      const oldestKey = this.lruCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.lruCache.delete(oldestKey);
      }
    }

    // Insert at end (newest)
    this.lruCache.set(key, { embedding, timestamp: Date.now() });
  }

  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache statistics
   *
   * @returns Current cache stats
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear cache (for testing)
   */
  async clearCache(): Promise<void> {
    this.lruCache.clear();
    this.stats = { hits: 0, misses: 0, errors: 0, hitRate: 0 };
  }
}
