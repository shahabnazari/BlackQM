/**
 * Phase 10.170 Week 2: Intelligent Full-Text Detection Service
 *
 * Enterprise-grade 7-tier waterfall detection with AI verification.
 * Implements patent-worthy multi-source triangulation for maximum
 * full-text discovery while maintaining security.
 *
 * SECURITY COMPLIANCE:
 * - Critical #3: DOI validation, SSRF prevention, domain whitelist
 * - Critical #4: HTML sanitization before parsing
 * - All external URLs validated before request
 * - Rate limiting per publisher
 *
 * 7-TIER WATERFALL:
 * 1. Database (instant) - Check if already fetched
 * 2. Direct URL (fast) - openAccessPdf.url, pdfUrl
 * 3. PMC Pattern (fast) - Construct URL from PMC ID
 * 4. Unpaywall API (medium) - Query Unpaywall with DOI
 * 5. Publisher HTML (medium) - Extract from landing page
 * 6. Secondary Links (slow) - Scan page for PDF/repository links
 * 7. AI Verification (expensive) - Verify content is full-text
 *
 * @module intelligent-fulltext-detection.service
 * @since Phase 10.170 Week 2
 */

import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import { OpenAIService } from '../../ai/services/openai.service';
import { timeout, catchError } from 'rxjs/operators';
import { JSDOM } from 'jsdom';
// Phase 10.170 Week 4: Netflix-Grade Infrastructure Integration
import { PurposeAwareCircuitBreakerService } from './purpose-aware-circuit-breaker.service';
import { PurposeAwareMetricsService } from './purpose-aware-metrics.service';
import {
  FullTextDetectionResult,
  DetectionConfidence,
  FullTextContentType,
  SecondaryLinkResult,
  AIVerificationResult,
  PaperForDetection,
  DetectionOptions,
  DetectionProgressEvent,
  BatchDetectionResult,
  DETECTION_TIERS,
  getTierConfig,
  isValidDOI,
  isValidExternalURL,
  isDomainWhitelisted,
  validateDetectionResult,
} from '../types/fulltext-detection.types';
import {
  getPublisherStrategyByDOI,
  getPublisherRateLimit,
} from '../constants/publisher-strategies.constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const PMC_BASE_URL = 'https://www.ncbi.nlm.nih.gov/pmc/articles';
const PMC_OA_URL = 'https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi';
const UNPAYWALL_BASE_URL = 'https://api.unpaywall.org/v2';
const UNPAYWALL_EMAIL = 'research@blackq.app'; // Required by Unpaywall API

// Default detection options
const DEFAULT_OPTIONS: Required<DetectionOptions> = {
  skipDatabaseCheck: false,
  skipAIVerification: false,
  maxTiers: 7,
  tierTimeoutMs: 5000,
  enableCrossReference: true,
  minConfidence: 'low',
};

// Rate limiting state per publisher
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// NETFLIX-GRADE DETECTION RESULT CACHE
// ============================================================================

/**
 * Phase 10.170 A+ Optimization: LRU Cache with TTL for Detection Results
 *
 * Netflix-grade caching strategy:
 * - In-memory LRU cache to avoid redundant detection
 * - Configurable TTL (default: 1 hour)
 * - Max entries limit to prevent memory bloat
 * - Cache hit/miss metrics for monitoring
 */
interface CacheEntry {
  result: FullTextDetectionResult;
  timestamp: number;
  hits: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

class DetectionResultCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private metrics: CacheMetrics = { hits: 0, misses: 0, evictions: 0, size: 0 };

  constructor(ttlMs: number = 60 * 60 * 1000, maxEntries: number = 10000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached result if valid
   */
  get(paperId: string): FullTextDetectionResult | null {
    const entry = this.cache.get(paperId);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check TTL expiration
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(paperId);
      this.metrics.misses++;
      this.metrics.size = this.cache.size;
      return null;
    }

    // Cache hit - update stats and return
    entry.hits++;
    this.metrics.hits++;
    return entry.result;
  }

  /**
   * Store detection result in cache
   */
  set(paperId: string, result: FullTextDetectionResult): void {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(paperId, {
      result,
      timestamp: Date.now(),
      hits: 0,
    });
    this.metrics.size = this.cache.size;
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Clear expired entries (background cleanup)
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.metrics.size = this.cache.size;
    return cleaned;
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): Readonly<CacheMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.metrics.size = 0;
  }
}

// Global cache instance (1-hour TTL, 10k max entries)
const detectionCache = new DetectionResultCache(60 * 60 * 1000, 10000);

// Managed cleanup interval (cleared on service destroy)
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Start cache cleanup interval (called from service constructor)
 * @param logger Logger instance for proper logging
 */
function startCacheCleanup(logger: Logger): void {
  // Clear any existing interval to prevent duplicates
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }

  cleanupIntervalId = setInterval(() => {
    const cleaned = detectionCache.cleanup();
    if (cleaned > 0) {
      logger.debug(`[DetectionCache] Cleaned ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}

/**
 * Stop cache cleanup interval (called from service destroy)
 */
function stopCacheCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Rate limit cleanup interval
let rateLimitCleanupId: NodeJS.Timeout | null = null;

/**
 * Start rate limit cleanup (removes expired entries)
 */
function startRateLimitCleanup(): void {
  if (rateLimitCleanupId) {
    clearInterval(rateLimitCleanupId);
  }

  rateLimitCleanupId = setInterval(() => {
    const now = Date.now();
    for (const [key, state] of rateLimitState.entries()) {
      if (now > state.resetAt) {
        rateLimitState.delete(key);
      }
    }
  }, 60 * 1000); // Cleanup every minute
}

/**
 * Stop rate limit cleanup
 */
function stopRateLimitCleanup(): void {
  if (rateLimitCleanupId) {
    clearInterval(rateLimitCleanupId);
    rateLimitCleanupId = null;
  }
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * SECURITY (Critical #4): Sanitize HTML before parsing
 * Strips dangerous elements while preserving structure for link extraction
 */
function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a DOM to parse HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove dangerous elements
  const dangerousElements = [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'meta',
    'link',
    'base',
    'noscript',
  ];

  for (const tag of dangerousElements) {
    const elements = document.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  }

  // Remove event handlers from all elements
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = el.getAttributeNames();
    for (const attr of attrs) {
      // Remove event handlers and javascript: URLs
      if (attr.startsWith('on') || el.getAttribute(attr)?.includes('javascript:')) {
        el.removeAttribute(attr);
      }
    }
  });

  return document.body?.innerHTML || '';
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class IntelligentFullTextDetectionService implements OnModuleDestroy {
  private readonly logger = new Logger(IntelligentFullTextDetectionService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly openAIService?: OpenAIService,
    // Phase 10.170 Week 4: Netflix-Grade Infrastructure
    @Optional() private readonly circuitBreaker?: PurposeAwareCircuitBreakerService,
    @Optional() private readonly metricsService?: PurposeAwareMetricsService,
  ) {
    // Start managed cleanup intervals
    startCacheCleanup(this.logger);
    startRateLimitCleanup();

    this.logger.log('✅ [IntelligentFullTextDetection] Phase 10.170 Week 2 - Service initialized');
    this.logger.log('✅ [Phase 10.170 A+] Detection result caching enabled (1h TTL, 10k max entries)');
    if (!openAIService) {
      this.logger.warn('[AI Verification] OpenAI service not available - Tier 7 will be skipped');
    }
    // Phase 10.170 Week 4: Log infrastructure status
    if (circuitBreaker) {
      this.logger.log('✅ [Phase 10.170 Week 4] Circuit breaker protection enabled');
    }
    if (metricsService) {
      this.logger.log('✅ [Phase 10.170 Week 4] Metrics collection enabled');
    }
  }

  /**
   * Cleanup intervals on module destroy (prevents memory leaks)
   * Phase 10.170 Week 2 Audit Fix
   */
  onModuleDestroy(): void {
    this.logger.log('[IntelligentFullTextDetection] Stopping cleanup intervals...');
    stopCacheCleanup();
    stopRateLimitCleanup();
  }

  // ==========================================================================
  // CACHE MANAGEMENT (Phase 10.170 A+ Optimization)
  // ==========================================================================

  /**
   * Get cache metrics for monitoring
   * Netflix-grade: Track hit rate, evictions, and size
   */
  getCacheMetrics(): { hits: number; misses: number; evictions: number; size: number; hitRate: number } {
    const metrics = detectionCache.getMetrics();
    return {
      ...metrics,
      hitRate: detectionCache.getHitRate(),
    };
  }

  /**
   * Clear detection cache
   * Use sparingly - typically only for testing or after major updates
   */
  clearCache(): void {
    detectionCache.clear();
    this.logger.log('[Cache] Detection cache cleared');
  }

  /**
   * Log cache statistics
   */
  logCacheStats(): void {
    const metrics = this.getCacheMetrics();
    this.logger.log(
      `[Cache Stats] Size: ${metrics.size}, Hits: ${metrics.hits}, Misses: ${metrics.misses}, ` +
      `Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%, Evictions: ${metrics.evictions}`
    );
  }

  // ==========================================================================
  // MAIN DETECTION METHOD
  // ==========================================================================

  /**
   * Detect full-text availability using 7-tier waterfall
   *
   * Attempts detection in order of speed and reliability:
   * 1. Database check (instant)
   * 2. Direct URL check (fast)
   * 3. PMC pattern (fast)
   * 4. Unpaywall API (medium)
   * 5. Publisher HTML (medium)
   * 6. Secondary links (slow)
   * 7. AI verification (expensive)
   *
   * Stops at first high-confidence result.
   *
   * @param paper Paper to detect full-text for
   * @param options Detection options
   * @returns Detection result
   */
  async detectFullText(
    paper: PaperForDetection,
    options: DetectionOptions = {},
  ): Promise<FullTextDetectionResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const tiersAttempted: number[] = [];
    const alternativeUrls: string[] = [];

    // Phase 10.170 A+ Optimization: Check cache first
    const cachedResult = detectionCache.get(paper.id);
    if (cachedResult) {
      this.logger.debug(`[Detection] Cache HIT for paper ${paper.id}`);
      return cachedResult;
    }

    this.logger.debug(`[Detection] Starting for paper ${paper.id}, DOI: ${paper.doi || 'N/A'}`);

    // Emit progress event
    this.emitProgress(paper.id, 0, 'Starting detection');

    try {
      // TIER 1: Database Check (instant)
      if (!opts.skipDatabaseCheck && opts.maxTiers >= 1) {
        tiersAttempted.push(1);
        this.emitProgress(paper.id, 1, 'Checking database');

        const dbResult = this.checkDatabase(paper);
        if (dbResult.isAvailable && dbResult.confidence === 'high') {
          return this.finalizeResult(dbResult, startTime, tiersAttempted, paper.id);
        }
      }

      // TIER 2: Direct URL Check (fast)
      if (opts.maxTiers >= 2) {
        tiersAttempted.push(2);
        this.emitProgress(paper.id, 2, 'Checking direct URLs');

        const directResult = this.checkDirectUrls(paper);
        if (directResult.isAvailable) {
          if (directResult.primaryUrl) {
            alternativeUrls.push(directResult.primaryUrl);
          }
          alternativeUrls.push(...directResult.alternativeUrls);

          if (directResult.confidence === 'high') {
            return this.finalizeResult(directResult, startTime, tiersAttempted, paper.id);
          }
        }
      }

      // TIER 3: PMC Pattern (fast)
      if (opts.maxTiers >= 3 && paper.externalIds?.PubMedCentral) {
        tiersAttempted.push(3);
        this.emitProgress(paper.id, 3, 'Checking PubMed Central');

        const pmcResult = await this.checkPMCPattern(paper);
        if (pmcResult.isAvailable) {
          if (pmcResult.primaryUrl) {
            alternativeUrls.push(pmcResult.primaryUrl);
          }
          if (pmcResult.confidence === 'high') {
            return this.finalizeResult(
              { ...pmcResult, alternativeUrls },
              startTime,
              tiersAttempted,
              paper.id,
            );
          }
        }
      }

      // TIER 4: Unpaywall API (medium)
      if (opts.maxTiers >= 4 && paper.doi && isValidDOI(paper.doi)) {
        tiersAttempted.push(4);
        this.emitProgress(paper.id, 4, 'Querying Unpaywall');

        const unpaywallResult = await this.checkUnpaywall(paper.doi);
        if (unpaywallResult.isAvailable) {
          if (unpaywallResult.primaryUrl) {
            alternativeUrls.push(unpaywallResult.primaryUrl);
          }
          alternativeUrls.push(...unpaywallResult.alternativeUrls);

          if (unpaywallResult.confidence === 'high') {
            return this.finalizeResult(
              { ...unpaywallResult, alternativeUrls },
              startTime,
              tiersAttempted,
              paper.id,
            );
          }
        }
      }

      // TIER 5: Publisher HTML (medium)
      if (opts.maxTiers >= 5 && paper.doi) {
        tiersAttempted.push(5);
        this.emitProgress(paper.id, 5, 'Checking publisher page');

        const publisherResult = await this.checkPublisherHTML(paper);
        if (publisherResult.isAvailable) {
          if (publisherResult.primaryUrl) {
            alternativeUrls.push(publisherResult.primaryUrl);
          }
          alternativeUrls.push(...publisherResult.alternativeUrls);

          if (publisherResult.confidence === 'high') {
            return this.finalizeResult(
              { ...publisherResult, alternativeUrls },
              startTime,
              tiersAttempted,
              paper.id,
            );
          }
        }
      }

      // TIER 6: Secondary Links (slow)
      if (opts.maxTiers >= 6 && alternativeUrls.length > 0) {
        tiersAttempted.push(6);
        this.emitProgress(paper.id, 6, 'Scanning for secondary links');

        const secondaryLinks = await this.scanForSecondaryLinks(alternativeUrls, paper);
        if (secondaryLinks.length > 0) {
          const bestLink = secondaryLinks.sort((a, b) => b.confidence - a.confidence)[0];
          if (bestLink.confidence > 0.7) {
            return this.finalizeResult(
              {
                isAvailable: true,
                confidence: 'medium',
                sources: ['secondary_link'],
                primaryUrl: bestLink.url,
                alternativeUrls: secondaryLinks.map((l) => l.url),
                detectionMethod: 'pdf_link_scan',
                contentType: bestLink.type === 'pdf' ? 'pdf' : 'html',
                estimatedWordCount: null,
                detectedAt: Date.now(),
                durationMs: 0,
                tiersAttempted: [],
              },
              startTime,
              tiersAttempted,
              paper.id,
            );
          }
        }
      }

      // TIER 7: AI Verification (expensive)
      if (opts.maxTiers >= 7 && !opts.skipAIVerification && alternativeUrls.length > 0) {
        tiersAttempted.push(7);
        this.emitProgress(paper.id, 7, 'AI verification');

        const aiResult = await this.performAIVerification(alternativeUrls[0], paper);
        if (aiResult && aiResult.isFullText) {
          return this.finalizeResult(
            {
              isAvailable: true,
              confidence: 'ai_verified',
              sources: ['publisher_html', 'publisher_pdf'],
              primaryUrl: alternativeUrls[0],
              alternativeUrls,
              detectionMethod: 'ai_analysis',
              contentType: 'unknown',
              estimatedWordCount: null,
              aiVerification: aiResult,
              detectedAt: Date.now(),
              durationMs: 0,
              tiersAttempted: [],
            },
            startTime,
            tiersAttempted,
            paper.id,
          );
        }
      }

      // No full-text found
      return this.finalizeResult(
        {
          isAvailable: false,
          confidence: 'low',
          sources: [],
          primaryUrl: null,
          alternativeUrls,
          detectionMethod: 'cross_reference',
          contentType: 'unknown',
          estimatedWordCount: null,
          detectedAt: Date.now(),
          durationMs: 0,
          tiersAttempted: [],
        },
        startTime,
        tiersAttempted,
        paper.id,
      );
    } catch (error) {
      this.logger.error(
        `[Detection] Error for paper ${paper.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return this.finalizeResult(
        {
          isAvailable: false,
          confidence: 'low',
          sources: [],
          primaryUrl: null,
          alternativeUrls: [],
          detectionMethod: 'cross_reference',
          contentType: 'unknown',
          estimatedWordCount: null,
          error: (error as Error).message,
          detectedAt: Date.now(),
          durationMs: 0,
          tiersAttempted: [],
        },
        startTime,
        tiersAttempted,
        paper.id,
      );
    }
  }

  /**
   * Batch detect full-text for multiple papers
   *
   * @param papers Papers to detect
   * @param options Detection options
   * @returns Batch detection result
   */
  async detectBatch(
    papers: readonly PaperForDetection[],
    options: DetectionOptions = {},
  ): Promise<BatchDetectionResult> {
    const startTime = Date.now();
    const results: Record<string, FullTextDetectionResult> = {};
    const successfulPapers: string[] = [];
    const failedPapers: string[] = [];

    // Process in parallel with concurrency limit
    const CONCURRENCY = 5;
    const chunks = this.chunkArray(papers, CONCURRENCY);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (paper) => {
          try {
            const result = await this.detectFullText(paper, options);
            return { paperId: paper.id, result, success: result.isAvailable };
          } catch (error) {
            return {
              paperId: paper.id,
              result: null,
              success: false,
              error: (error as Error).message,
            };
          }
        }),
      );

      for (const { paperId, result, success } of chunkResults) {
        if (result) {
          results[paperId] = result;
        }
        if (success) {
          successfulPapers.push(paperId);
        } else {
          failedPapers.push(paperId);
        }
      }
    }

    const totalDurationMs = Date.now() - startTime;

    return {
      results,
      successfulPapers,
      failedPapers,
      totalDurationMs,
      avgDurationMs: papers.length > 0 ? totalDurationMs / papers.length : 0,
    };
  }

  // ==========================================================================
  // TIER IMPLEMENTATIONS
  // ==========================================================================

  /**
   * TIER 1: Check database for existing full-text
   */
  private checkDatabase(paper: PaperForDetection): FullTextDetectionResult {
    const hasFullText =
      paper.fullText &&
      typeof paper.fullText === 'string' &&
      paper.fullText.length > 1000 && // Minimum content threshold
      paper.fullTextStatus === 'available';

    if (hasFullText) {
      // Estimate word count from existing full-text
      const wordCount = paper.fullText!.split(/\s+/).length;

      return {
        isAvailable: true,
        confidence: 'high',
        sources: ['database'],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'direct_url',
        contentType: 'html',
        estimatedWordCount: wordCount,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [1],
      };
    }

    return {
      isAvailable: false,
      confidence: 'low',
      sources: [],
      primaryUrl: null,
      alternativeUrls: [],
      detectionMethod: 'direct_url',
      contentType: 'unknown',
      estimatedWordCount: null,
      detectedAt: Date.now(),
      durationMs: 0,
      tiersAttempted: [1],
    };
  }

  /**
   * TIER 2: Check direct URLs (openAccessPdf.url, pdfUrl)
   */
  private checkDirectUrls(paper: PaperForDetection): FullTextDetectionResult {
    const alternativeUrls: string[] = [];
    let primaryUrl: string | null = null;
    let confidence: DetectionConfidence = 'low';

    // Check OpenAlex openAccessPdf
    if (paper.openAccessPdf?.url && isValidExternalURL(paper.openAccessPdf.url)) {
      primaryUrl = paper.openAccessPdf.url;
      confidence = 'high';
      alternativeUrls.push(paper.openAccessPdf.url);
    }

    // Check pdfUrl
    if (paper.pdfUrl && isValidExternalURL(paper.pdfUrl)) {
      if (!primaryUrl) {
        primaryUrl = paper.pdfUrl;
        confidence = 'high';
      }
      if (!alternativeUrls.includes(paper.pdfUrl)) {
        alternativeUrls.push(paper.pdfUrl);
      }
    }

    if (primaryUrl) {
      return {
        isAvailable: true,
        confidence,
        sources: ['publisher_pdf'],
        primaryUrl,
        alternativeUrls,
        detectionMethod: 'direct_url',
        contentType: 'pdf',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [2],
      };
    }

    return {
      isAvailable: false,
      confidence: 'low',
      sources: [],
      primaryUrl: null,
      alternativeUrls,
      detectionMethod: 'direct_url',
      contentType: 'unknown',
      estimatedWordCount: null,
      detectedAt: Date.now(),
      durationMs: 0,
      tiersAttempted: [2],
    };
  }

  /**
   * TIER 3: Check PMC pattern
   */
  private async checkPMCPattern(paper: PaperForDetection): Promise<FullTextDetectionResult> {
    const pmcId = paper.externalIds?.PubMedCentral;

    if (!pmcId) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'pmc_pattern',
        contentType: 'unknown',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [3],
      };
    }

    // Construct PMC URL
    const pmcUrl = `${PMC_BASE_URL}/PMC${pmcId.replace(/^PMC/i, '')}/`;

    // Validate URL
    if (!isValidExternalURL(pmcUrl) || !isDomainWhitelisted(pmcUrl)) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'pmc_pattern',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: 'PMC URL validation failed',
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [3],
      };
    }

    // Verify PMC article exists with HEAD request
    try {
      const tierConfig = getTierConfig(3);
      const timeoutMs = tierConfig?.timeoutMs ?? 1000;

      await firstValueFrom(
        this.httpService
          .head(pmcUrl, {
            timeout: timeoutMs,
            validateStatus: (status) => status === 200,
          })
          .pipe(
            timeout(timeoutMs),
            catchError(() => {
              throw new Error('PMC verification failed');
            }),
          ),
      );

      // PMC article exists
      const pdfUrl = `${pmcUrl}pdf/`;

      return {
        isAvailable: true,
        confidence: 'high',
        sources: ['pmc'],
        primaryUrl: pmcUrl,
        alternativeUrls: [pdfUrl],
        detectionMethod: 'pmc_pattern',
        contentType: 'html',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [3],
      };
    } catch (error) {
      // PMC verification failed - expected for non-PMC papers
      this.logger.debug(`[PMC] Verification failed: ${(error as Error).message}`);
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'pmc_pattern',
        contentType: 'unknown',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [3],
      };
    }
  }

  /**
   * TIER 4: Check Unpaywall API
   * Phase 10.170 Week 4: Protected by circuit breaker
   */
  private async checkUnpaywall(doi: string): Promise<FullTextDetectionResult> {
    // Validate DOI
    if (!isValidDOI(doi)) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'unpaywall_api',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: 'Invalid DOI format',
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [4],
      };
    }

    const url = `${UNPAYWALL_BASE_URL}/${encodeURIComponent(doi)}?email=${UNPAYWALL_EMAIL}`;
    const startTime = Date.now();

    // Phase 10.170 Week 4: Circuit breaker wrapper
    const executeUnpaywallCall = async (): Promise<UnpaywallResponse> => {
      const tierConfig = getTierConfig(4);
      const timeoutMs = tierConfig?.timeoutMs ?? 3000;

      const response = await firstValueFrom(
        this.httpService
          .get<UnpaywallResponse>(url, {
            timeout: timeoutMs,
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              throw new Error(`Unpaywall API error: ${error.message}`);
            }),
          ),
      );
      return response.data;
    };

    // Fallback returns empty response (not OA)
    const fallbackResult = async (): Promise<UnpaywallResponse> => ({
      doi,
      doi_url: `https://doi.org/${doi}`,
      is_oa: false,
    });

    try {
      // Use circuit breaker if available, otherwise direct call
      const data = this.circuitBreaker
        ? await this.circuitBreaker.withUnpaywall(executeUnpaywallCall, fallbackResult)
        : await executeUnpaywallCall();

      // Phase 10.170 Week 4: Record metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('unpaywall', data.is_oa, durationMs);

      if (!data.is_oa) {
        return {
          isAvailable: false,
          confidence: 'medium',
          sources: [],
          primaryUrl: null,
          alternativeUrls: [],
          detectionMethod: 'unpaywall_api',
          contentType: 'unknown',
          estimatedWordCount: null,
          detectedAt: Date.now(),
          durationMs: 0,
          tiersAttempted: [4],
        };
      }

      const alternativeUrls: string[] = [];
      let primaryUrl: string | null = null;
      let contentType: FullTextContentType = 'unknown';

      // Get best OA location
      if (data.best_oa_location?.url_for_pdf) {
        primaryUrl = data.best_oa_location.url_for_pdf;
        contentType = 'pdf';
        alternativeUrls.push(primaryUrl);
      } else if (data.best_oa_location?.url) {
        primaryUrl = data.best_oa_location.url;
        contentType = 'html';
        alternativeUrls.push(primaryUrl);
      }

      // Collect alternative locations
      if (data.oa_locations) {
        for (const loc of data.oa_locations) {
          if (loc.url_for_pdf && !alternativeUrls.includes(loc.url_for_pdf)) {
            alternativeUrls.push(loc.url_for_pdf);
          }
          if (loc.url && !alternativeUrls.includes(loc.url)) {
            alternativeUrls.push(loc.url);
          }
        }
      }

      // Validate URLs
      const validUrls = alternativeUrls.filter(
        (u) => isValidExternalURL(u) && isDomainWhitelisted(u),
      );

      if (validUrls.length === 0) {
        return {
          isAvailable: false,
          confidence: 'low',
          sources: [],
          primaryUrl: null,
          alternativeUrls: [],
          detectionMethod: 'unpaywall_api',
          contentType: 'unknown',
          estimatedWordCount: null,
          error: 'No valid URLs from Unpaywall',
          detectedAt: Date.now(),
          durationMs: 0,
          tiersAttempted: [4],
        };
      }

      return {
        isAvailable: true,
        confidence: 'high',
        sources: ['unpaywall'],
        primaryUrl: validUrls[0],
        alternativeUrls: validUrls,
        detectionMethod: 'unpaywall_api',
        contentType,
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [4],
      };
    } catch (error) {
      this.logger.debug(`[Unpaywall] Error for DOI ${doi}: ${(error as Error).message}`);

      // Phase 10.170 Week 4: Record failure metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('unpaywall', false, durationMs);
      this.metricsService?.recordError();

      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'unpaywall_api',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: (error as Error).message,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [4],
      };
    }
  }

  /**
   * TIER 5: Check publisher HTML page
   * Phase 10.170 Week 4: Protected by circuit breaker
   */
  private async checkPublisherHTML(paper: PaperForDetection): Promise<FullTextDetectionResult> {
    if (!paper.doi || !isValidDOI(paper.doi)) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'html_scraping',
        contentType: 'unknown',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [5],
      };
    }

    // Get publisher strategy
    const strategy = getPublisherStrategyByDOI(paper.doi);
    if (!strategy) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'html_scraping',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: 'Unknown publisher',
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [5],
      };
    }

    // Check rate limit
    if (!this.checkRateLimit(strategy.publisherId)) {
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'html_scraping',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: 'Rate limit exceeded',
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [5],
      };
    }

    // Resolve DOI to landing page
    const doiUrl = `https://doi.org/${encodeURIComponent(paper.doi)}`;
    const startTime = Date.now();

    // Phase 10.170 Week 4: Circuit breaker wrapper for publisher fetch
    const executePublisherFetch = async (): Promise<string> => {
      const tierConfig = getTierConfig(5);
      const timeoutMs = tierConfig?.timeoutMs ?? 5000;

      const response = await firstValueFrom(
        this.httpService
          .get<string>(doiUrl, {
            timeout: timeoutMs,
            maxRedirects: 3,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              Accept: 'text/html,application/xhtml+xml',
              ...strategy.customHeaders,
            },
            responseType: 'text',
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              throw new Error(`Publisher fetch failed: ${error.message}`);
            }),
          ),
      );
      return response.data;
    };

    // Fallback returns empty HTML (no content found)
    const fallbackResult = async (): Promise<string> => '';

    try {
      // Use circuit breaker if available, otherwise direct call
      const htmlContent = this.circuitBreaker
        ? await this.circuitBreaker.withPublisherScraping(executePublisherFetch, fallbackResult)
        : await executePublisherFetch();

      // Record rate limit hit
      this.recordRateLimitHit(strategy.publisherId);

      // Phase 10.170 Week 4: Record metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('publisher_html', htmlContent.length > 0, durationMs);

      // Sanitize HTML
      // SECURITY (Critical #4): HTML sanitization before parsing
      const sanitizedHtml = sanitizeHtmlContent(htmlContent);

      // Parse HTML
      const dom = new JSDOM(sanitizedHtml);
      const document = dom.window.document;

      // Look for PDF link using publisher selectors
      const alternativeUrls: string[] = [];
      let primaryUrl: string | null = null;

      if (strategy.htmlSelectors?.pdfLink) {
        const pdfLinks = document.querySelectorAll(strategy.htmlSelectors.pdfLink);
        for (const link of pdfLinks) {
          const href = link.getAttribute('href');
          if (href) {
            const absoluteUrl = this.resolveUrl(href, doiUrl);
            if (absoluteUrl && isValidExternalURL(absoluteUrl)) {
              if (!primaryUrl) {
                primaryUrl = absoluteUrl;
              }
              alternativeUrls.push(absoluteUrl);
            }
          }
        }
      }

      // Check for HTML full-text content
      let hasHtmlContent = false;
      if (strategy.htmlSelectors?.content) {
        const contentElements = document.querySelectorAll(strategy.htmlSelectors.content);
        for (const el of contentElements) {
          const text = el.textContent?.trim() || '';
          if (text.length > 3000) {
            // Likely has full-text
            hasHtmlContent = true;
            break;
          }
        }
      }

      if (primaryUrl || hasHtmlContent) {
        return {
          isAvailable: true,
          confidence: primaryUrl ? 'high' : 'medium',
          sources: ['publisher_html', 'publisher_pdf'],
          primaryUrl: primaryUrl || doiUrl,
          alternativeUrls,
          detectionMethod: 'html_scraping',
          contentType: primaryUrl ? 'pdf' : 'html',
          estimatedWordCount: null,
          detectedAt: Date.now(),
          durationMs: 0,
          tiersAttempted: [5],
        };
      }

      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls,
        detectionMethod: 'html_scraping',
        contentType: 'unknown',
        estimatedWordCount: null,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [5],
      };
    } catch (error) {
      this.logger.debug(`[Publisher HTML] Error: ${(error as Error).message}`);

      // Phase 10.170 Week 4: Record failure metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('publisher_html', false, durationMs);
      this.metricsService?.recordError();

      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'html_scraping',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: (error as Error).message,
        detectedAt: Date.now(),
        durationMs: 0,
        tiersAttempted: [5],
      };
    }
  }

  /**
   * TIER 6: Scan for secondary links
   */
  private async scanForSecondaryLinks(
    urls: readonly string[],
    paper: PaperForDetection,
  ): Promise<SecondaryLinkResult[]> {
    const results: SecondaryLinkResult[] = [];

    // Limit to first 3 URLs
    const urlsToScan = urls.slice(0, 3);

    for (const url of urlsToScan) {
      if (!isValidExternalURL(url)) {
        continue;
      }

      try {
        const tierConfig = getTierConfig(6);
        const timeoutMs = tierConfig?.timeoutMs ?? 8000;

        const response = await firstValueFrom(
          this.httpService
            .get<string>(url, {
              timeout: timeoutMs,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              },
              responseType: 'text',
            })
            .pipe(
              timeout(timeoutMs),
              catchError(() => {
                throw new Error('Secondary link scan failed');
              }),
            ),
        );

        // Sanitize and parse
        const sanitizedHtml = sanitizeHtmlContent(response.data);

        const dom = new JSDOM(sanitizedHtml);
        const links = dom.window.document.querySelectorAll('a[href]');

        for (const link of links) {
          const href = link.getAttribute('href');
          const text = link.textContent?.toLowerCase() || '';

          if (!href) continue;

          const absoluteUrl = this.resolveUrl(href, url);
          if (!absoluteUrl || !isValidExternalURL(absoluteUrl)) continue;

          // Check for PDF indicators
          if (
            href.includes('.pdf') ||
            text.includes('pdf') ||
            text.includes('download') ||
            text.includes('full text')
          ) {
            const domain = new URL(absoluteUrl).hostname;

            results.push({
              url: absoluteUrl,
              label: text.substring(0, 100),
              type: href.includes('.pdf') ? 'pdf' : 'unknown',
              confidence: href.includes('.pdf') ? 0.9 : 0.6,
              domain,
            });
          }

          // Check for repository indicators
          if (
            text.includes('repository') ||
            text.includes('preprint') ||
            text.includes('arxiv') ||
            text.includes('biorxiv')
          ) {
            const domain = new URL(absoluteUrl).hostname;

            results.push({
              url: absoluteUrl,
              label: text.substring(0, 100),
              type: 'repository',
              confidence: 0.7,
              domain,
            });
          }
        }
      } catch (error) {
        // Continue to next URL - expected for rate-limited or unavailable pages
        this.logger.debug(`[SecondaryLinks] Scan failed for URL: ${(error as Error).message}`);
      }
    }

    // Deduplicate and sort by confidence
    const uniqueResults = this.deduplicateLinks(results);
    return uniqueResults.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * TIER 7: AI verification
   * Phase 10.170 Week 4: Protected by circuit breaker
   */
  private async performAIVerification(
    url: string,
    paper: PaperForDetection,
  ): Promise<AIVerificationResult | null> {
    // AI verification is expensive - only do if we have a candidate
    if (!url || !isValidExternalURL(url)) {
      return null;
    }

    // Skip if OpenAI service not available
    if (!this.openAIService) {
      this.logger.debug('[AI Verification] OpenAI service not available - skipping');
      return null;
    }

    const startTime = Date.now();

    // Phase 10.170 Week 4: Circuit breaker wrapper for AI verification
    const executeAIVerification = async (): Promise<AIVerificationResult | null> => {
      // Fetch a sample of the content for analysis
      const contentSample = await this.fetchContentSample(url);
      if (!contentSample || contentSample.length < 500) {
        this.logger.debug('[AI Verification] Content sample too short for analysis');
        return null;
      }

      // Sanitize content before sending to AI
      // SECURITY (Critical #5): AI prompt sanitization
      const sanitizedSample = this.sanitizeForAIPrompt(contentSample);

      // Build verification prompt
      const prompt = this.buildVerificationPrompt(sanitizedSample, paper);

      // Call AI service
      this.logger.debug(`[AI Verification] Analyzing content for paper: ${paper.title || paper.id}`);
      const response = await this.openAIService!.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.1, // Low temperature for consistent analysis
        maxTokens: 500,
        cache: true,
      });

      // Parse AI response
      return this.parseAIVerificationResponse(response.content);
    };

    // Fallback returns null (skip AI verification)
    const fallbackResult = async (): Promise<AIVerificationResult | null> => null;

    try {
      // Use circuit breaker if available, otherwise direct call
      const result = this.circuitBreaker
        ? await this.circuitBreaker.withAIVerification(executeAIVerification, fallbackResult)
        : await executeAIVerification();

      // Phase 10.170 Week 4: Record metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('ai_verification', result !== null, durationMs);

      return result;
    } catch (error) {
      this.logger.debug(`[AI Verification] Error: ${(error as Error).message}`);

      // Phase 10.170 Week 4: Record failure metrics
      const durationMs = Date.now() - startTime;
      this.metricsService?.recordDetectionAttempt('ai_verification', false, durationMs);
      this.metricsService?.recordError();

      return null;
    }
  }

  /**
   * Fetch a sample of content from URL for AI verification
   * SECURITY: Validates URL and limits content size
   */
  private async fetchContentSample(url: string): Promise<string | null> {
    if (!isValidExternalURL(url) || !isDomainWhitelisted(url)) {
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AcademicBot/1.0)',
            Accept: 'text/html,application/xhtml+xml,text/plain',
          },
          maxContentLength: 100000, // Limit to 100KB
        }).pipe(
          timeout(10000),
          catchError(() => {
            throw new Error('Content fetch timeout');
          }),
        ),
      );

      const content = typeof response.data === 'string' ? response.data : '';
      // Extract text content, limit to first 5000 chars
      const textContent = this.extractTextFromHTML(content);
      return textContent.slice(0, 5000);
    } catch {
      return null;
    }
  }

  /**
   * Extract plain text from HTML content
   */
  private extractTextFromHTML(html: string): string {
    const sanitized = sanitizeHtmlContent(html);
    const dom = new JSDOM(sanitized);
    return dom.window.document.body?.textContent?.trim() || '';
  }

  /**
   * Sanitize content before sending to AI
   * SECURITY (Critical #5): Prevent prompt injection
   */
  private sanitizeForAIPrompt(content: string): string {
    // Remove potential prompt injection attempts
    return content
      .replace(/```/g, '') // Remove code blocks
      .replace(/system:/gi, '') // Remove system prompts
      .replace(/assistant:/gi, '') // Remove assistant markers
      .replace(/user:/gi, '') // Remove user markers
      .replace(/\[INST\]/gi, '') // Remove instruction markers
      .replace(/<\|.*?\|>/g, '') // Remove special tokens
      .slice(0, 4000); // Limit length
  }

  /**
   * Build verification prompt for AI
   */
  private buildVerificationPrompt(contentSample: string, paper: PaperForDetection): string {
    return `Analyze this academic content sample and determine if it appears to be full-text article content (not just abstract, metadata, or paywall page).

Paper Title: ${paper.title || 'Unknown'}
DOI: ${paper.doi || 'Unknown'}

Content Sample:
---
${contentSample}
---

Respond in JSON format only:
{
  "isFullText": true/false,
  "confidence": 0.0-1.0,
  "contentType": "full_article" | "abstract_only" | "paywall" | "metadata" | "unknown",
  "reasoning": "brief explanation",
  "estimatedSections": ["introduction", "methods", "results", "discussion", etc.]
}`;
  }

  /**
   * Parse AI verification response
   */
  private parseAIVerificationResponse(responseContent: string): AIVerificationResult | null {
    try {
      // Extract JSON from response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (typeof parsed.isFullText !== 'boolean' || typeof parsed.confidence !== 'number') {
        return null;
      }

      // Determine recommendation based on analysis
      const confidence = Math.min(1, Math.max(0, parsed.confidence));
      let recommendation: 'accept' | 'retry_html' | 'retry_pdf' | 'reject';
      if (parsed.isFullText && confidence >= 0.7) {
        recommendation = 'accept';
      } else if (parsed.contentType === 'paywall' || confidence < 0.3) {
        recommendation = 'reject';
      } else if (parsed.contentType === 'abstract_only') {
        recommendation = 'retry_pdf';
      } else {
        recommendation = 'retry_html';
      }

      return {
        isFullText: parsed.isFullText,
        qualityScore: Math.round(confidence * 100),
        recommendation,
        reasoning: parsed.reasoning || 'AI analysis completed',
        tokenCost: 0, // Will be populated by caller if needed
        model: 'gpt-3.5-turbo',
        verifiedAt: Date.now(),
      };
    } catch {
      this.logger.debug('[AI Verification] Failed to parse AI response');
      return null;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Finalize result with timing information and cache storage
   * Phase 10.170 A+ Optimization: Results are cached for 1 hour
   */
  private finalizeResult(
    result: Omit<FullTextDetectionResult, 'durationMs' | 'tiersAttempted'> & {
      durationMs?: number;
      tiersAttempted?: readonly number[];
    },
    startTime: number,
    tiersAttempted: readonly number[],
    paperId?: string, // Optional paperId for caching
  ): FullTextDetectionResult {
    const finalResult: FullTextDetectionResult = {
      ...result,
      durationMs: Date.now() - startTime,
      tiersAttempted,
    };

    // Validate result
    if (!validateDetectionResult(finalResult)) {
      this.logger.warn('[Detection] Result validation failed, returning safe default');
      return {
        isAvailable: false,
        confidence: 'low',
        sources: [],
        primaryUrl: null,
        alternativeUrls: [],
        detectionMethod: 'cross_reference',
        contentType: 'unknown',
        estimatedWordCount: null,
        error: 'Result validation failed',
        detectedAt: Date.now(),
        durationMs: Date.now() - startTime,
        tiersAttempted,
      };
    }

    // Phase 10.170 A+ Optimization: Store in cache
    if (paperId) {
      detectionCache.set(paperId, finalResult);
      this.logger.debug(`[Detection] Cached result for paper ${paperId}`);
    }

    return finalResult;
  }

  /**
   * Emit progress event
   */
  private emitProgress(paperId: string, currentTier: number, message: string): void {
    const tierConfig = getTierConfig(currentTier);

    const event: DetectionProgressEvent = {
      paperId,
      currentTier,
      totalTiers: DETECTION_TIERS.length,
      tierName: tierConfig?.name ?? 'Unknown',
      message,
      timestamp: Date.now(),
    };

    this.eventEmitter.emit('fulltext-detection.progress', event);
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return null;
    }
  }

  /**
   * Check rate limit for publisher
   */
  private checkRateLimit(publisherId: string): boolean {
    const limit = getPublisherRateLimit(publisherId);
    const state = rateLimitState.get(publisherId);

    if (!state || Date.now() > state.resetAt) {
      return true;
    }

    return state.count < limit;
  }

  /**
   * Record rate limit hit
   */
  private recordRateLimitHit(publisherId: string): void {
    const now = Date.now();
    const state = rateLimitState.get(publisherId);

    if (!state || now > state.resetAt) {
      rateLimitState.set(publisherId, {
        count: 1,
        resetAt: now + 60000, // Reset after 1 minute
      });
    } else {
      state.count++;
    }
  }

  /**
   * Deduplicate links by URL
   */
  private deduplicateLinks(links: SecondaryLinkResult[]): SecondaryLinkResult[] {
    const seen = new Set<string>();
    const unique: SecondaryLinkResult[] = [];

    for (const link of links) {
      if (!seen.has(link.url)) {
        seen.add(link.url);
        unique.push(link);
      }
    }

    return unique;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size) as T[]);
    }
    return chunks;
  }
}

// ============================================================================
// UNPAYWALL API TYPES
// ============================================================================

interface UnpaywallOALocation {
  url?: string;
  url_for_pdf?: string;
  url_for_landing_page?: string;
  evidence?: string;
  host_type?: string;
  is_best?: boolean;
  license?: string;
  pmh_id?: string;
  repository_institution?: string;
  updated?: string;
  version?: string;
}

interface UnpaywallResponse {
  doi: string;
  doi_url: string;
  title?: string;
  is_oa: boolean;
  oa_status?: string;
  best_oa_location?: UnpaywallOALocation;
  oa_locations?: UnpaywallOALocation[];
  journal_is_oa?: boolean;
  journal_issns?: string;
  publisher?: string;
}
