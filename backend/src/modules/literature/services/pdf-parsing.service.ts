import { forwardRef, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma.service';
import { HtmlFullTextService } from './html-full-text.service';
import { GrobidExtractionService } from './grobid-extraction.service';
import { UniversalAbstractEnrichmentService } from './universal-abstract-enrichment.service';
import { MetricsService } from '../../../common/services/metrics.service';
import { ENRICHMENT_TIMEOUT, FULL_TEXT_TIMEOUT } from '../constants/http-config.constants';

/**
 * Phase 10.185: Netflix-Grade Extraction Error Interface
 * Categorizes errors for smart retry and metrics tracking
 */
export interface ExtractionError {
  category: 'paywall' | 'timeout' | 'network' | 'parsing' | 'rate_limit' | 'not_found' | 'circuit_breaker' | 'unknown';
  message: string;
  retryable: boolean;
  publisher?: string;
  httpStatus?: number;
  details?: Record<string, unknown>;
}

/**
 * Phase 10.185: Netflix-Grade Publisher Retry Configuration
 * Adaptive retry strategies per publisher based on reliability
 */
interface PublisherRetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
}

/**
 * Phase 10.185: Netflix-Grade Extraction Cache Entry
 * L1 in-memory cache for recent extractions
 */
interface ExtractionCacheEntry {
  fullText: string;
  wordCount: number;
  source: string;
  timestamp: number;
}

/**
 * Phase 10.185: Netflix-Grade Circuit Breaker State
 * Per-publisher circuit breaker for resilience
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  successesSinceHalfOpen: number;
}

// PHASE 10 DAY 32: Fix pdf-parse import for proper TypeScript compatibility
// Use dynamic import to avoid module resolution issues
const pdfParse = require('pdf-parse');

/**
 * Phase 10.106 Phase 10: Unpaywall API type definitions
 * Netflix-grade: Full type safety for external API
 */
interface OALocation {
  url_for_pdf?: string;
  url_for_landing_page?: string;
  is_oa?: boolean;
  license?: string;
  repository_institution?: string;
}

/**
 * Phase 10 Day 5.15+ (Enhanced Nov 18, 2025): Full-Text Parsing Service (PDF + HTML Waterfall)
 *
 * Enterprise-grade full-text fetching with 4-tier waterfall strategy:
 * Tier 1: Database cache check (instant if previously fetched)
 * Tier 2: PMC API + HTML scraping - 40-50% of papers (fastest, highest quality)
 * Tier 3: Unpaywall API (PDF) - 25-30% of papers (DOI-based open access)
 * Tier 4: Direct PDF from publisher URL - 15-20% additional coverage (MDPI, Frontiers, etc.)
 *
 * Result: 90%+ full-text availability vs 30% PDF-only approach
 *
 * Publisher Support:
 * - PMC: Free full-text HTML for 8M+ biomedical articles
 * - MDPI: Direct PDF from article URL (400k+ open access articles/year)
 * - Frontiers: Direct PDF from article URL
 * - PLOS: HTML + PDF patterns
 * - Springer/Nature: HTML when accessible
 * - Sage, Wiley, Taylor & Francis: Publisher-specific PDF patterns
 *
 * Scientific Foundation: Purposive sampling (Patton 2002) - deep analysis of high-quality papers
 */
@Injectable()
export class PDFParsingService {
  private readonly logger = new Logger(PDFParsingService.name);
  private readonly UNPAYWALL_EMAIL = 'research@blackq.app'; // Required by Unpaywall API
  private readonly MAX_PDF_SIZE_MB = 50;
  // Phase 10.6 Day 14.5: DOWNLOAD_TIMEOUT_MS removed - migrated to FULL_TEXT_TIMEOUT constant

  /**
   * Enterprise Enhancement (Nov 18, 2025): Centralized constants for maintainability
   */
  private readonly MIN_CONTENT_LENGTH = 100; // Minimum chars for valid full-text

  // Phase 10.183: Abstract enrichment constants
  private readonly MIN_ABSTRACT_CHARS = 100; // Minimum chars for valid abstract
  private readonly ABSTRACT_UPDATE_THRESHOLD = 1.2; // Only update if new is 20% longer
  private readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly MAX_REDIRECTS = 5;
  private readonly BYTES_PER_KB = 1024;

  // Phase 10.185: Netflix-Grade L1 In-Memory Cache (LRU-style with Map)
  private readonly extractionCache = new Map<string, ExtractionCacheEntry>();
  private readonly CACHE_MAX_SIZE = 1000;
  private readonly CACHE_TTL_MS = 3600000; // 1 hour

  // Phase 10.185: Netflix-Grade Per-Publisher Circuit Breakers
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly CIRCUIT_FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_TIMEOUT_MS = 60000; // 1 minute
  private readonly CIRCUIT_SUCCESS_THRESHOLD = 2;

  // Phase 10.185: Netflix-Grade Publisher-Specific Retry Configs
  private readonly publisherRetryConfigs: Map<string, PublisherRetryConfig> = new Map([
    // Fast, reliable sources (fewer retries)
    ['arxiv', { maxAttempts: 2, initialDelayMs: 1000, maxDelayMs: 4000, backoffMultiplier: 2, jitterMs: 200 }],
    ['pmc', { maxAttempts: 2, initialDelayMs: 1000, maxDelayMs: 4000, backoffMultiplier: 2, jitterMs: 200 }],
    ['plos', { maxAttempts: 2, initialDelayMs: 1000, maxDelayMs: 4000, backoffMultiplier: 2, jitterMs: 200 }],
    // Medium reliability (standard retries)
    ['springer', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['nature', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['wiley', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['mdpi', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['frontiers', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['taylorfrancis', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    ['jama', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
    // Slow, unreliable sources (more retries, longer backoff)
    ['elsevier', { maxAttempts: 4, initialDelayMs: 3000, maxDelayMs: 16000, backoffMultiplier: 2, jitterMs: 1000 }],
    ['ieee', { maxAttempts: 4, initialDelayMs: 3000, maxDelayMs: 16000, backoffMultiplier: 2, jitterMs: 1000 }],
    ['sage', { maxAttempts: 3, initialDelayMs: 2500, maxDelayMs: 10000, backoffMultiplier: 2, jitterMs: 750 }],
    // Default
    ['unknown', { maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 8000, backoffMultiplier: 2, jitterMs: 500 }],
  ]);

  // Phase 10.185: Graceful degradation minimum word count
  private readonly GRACEFUL_DEGRADATION_MIN_WORDS = 150;

  // Phase 10.185: Optional metrics service injection
  private metricsService?: MetricsService;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => HtmlFullTextService))
    private htmlService: HtmlFullTextService,
    @Inject(forwardRef(() => GrobidExtractionService))
    private grobidService: GrobidExtractionService,
    @Inject(forwardRef(() => UniversalAbstractEnrichmentService))
    private universalAbstractEnrichment: UniversalAbstractEnrichmentService,
    @Optional() metricsService?: MetricsService,
  ) {
    this.metricsService = metricsService;
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE ERROR CATEGORIZATION
  // ==========================================================================

  /**
   * Phase 10.185: Categorize extraction error for smart retry
   * - Detects paywall, timeout, network, rate limit, not found
   * - Tracks publisher and HTTP status for metrics
   * - Determines if error is retryable
   */
  private categorizeError(error: unknown, publisher?: string, httpStatus?: number): ExtractionError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Netflix-Grade: Detect HTTP status codes from Axios errors
    const axiosError = error as AxiosError;
    const statusCode = httpStatus || axiosError.response?.status;
    const errorCode = axiosError.code;

    // Paywall detection (403, subscription required)
    if (
      statusCode === 402 ||
      statusCode === 403 ||
      lowerMessage.includes('403') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('access denied') ||
      lowerMessage.includes('subscription required') ||
      lowerMessage.includes('paywall') ||
      lowerMessage.includes('purchase')
    ) {
      return {
        category: 'paywall',
        message: 'Paper is behind paywall or requires subscription',
        retryable: false,
        publisher,
        httpStatus: statusCode,
      };
    }

    // Timeout detection (408, ETIMEDOUT, ECONNABORTED)
    if (
      statusCode === 408 ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ECONNABORTED' ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('timed out') ||
      lowerMessage.includes('etimedout')
    ) {
      return {
        category: 'timeout',
        message: 'Extraction timed out',
        retryable: true,
        publisher,
        httpStatus: statusCode,
      };
    }

    // Network errors (ECONNREFUSED, ENOTFOUND, ECONNRESET)
    if (
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNRESET' ||
      errorCode === 'EHOSTUNREACH' ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('econnrefused') ||
      lowerMessage.includes('enotfound')
    ) {
      return {
        category: 'network',
        message: 'Network connection error',
        retryable: true,
        publisher,
        httpStatus: statusCode,
      };
    }

    // Rate limiting (429)
    if (
      statusCode === 429 ||
      lowerMessage.includes('429') ||
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('quota exceeded')
    ) {
      return {
        category: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true,
        publisher,
        httpStatus: statusCode,
      };
    }

    // Not found (404, 410)
    if (
      statusCode === 404 ||
      statusCode === 410 ||
      lowerMessage.includes('404') ||
      lowerMessage.includes('not found') ||
      lowerMessage.includes('does not exist')
    ) {
      return {
        category: 'not_found',
        message: 'Paper or URL not found',
        retryable: false,
        publisher,
        httpStatus: statusCode,
      };
    }

    // PDF parsing errors
    if (
      lowerMessage.includes('pdf') &&
      (lowerMessage.includes('parse') || lowerMessage.includes('corrupt') || lowerMessage.includes('invalid'))
    ) {
      return {
        category: 'parsing',
        message: 'PDF parsing error',
        retryable: false,
        publisher,
      };
    }

    // Unknown (conservative retry once)
    return {
      category: 'unknown',
      message: errorMessage,
      retryable: true,
      publisher,
      httpStatus: statusCode,
    };
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE PUBLISHER DETECTION
  // ==========================================================================

  /**
   * Phase 10.185: Detect publisher from URL or DOI
   * Used for per-publisher circuit breakers and retry strategies
   */
  private detectPublisher(urlOrDoi: string): string {
    if (!urlOrDoi) return 'unknown';

    const lower = urlOrDoi.toLowerCase();

    if (lower.includes('springer') || lower.includes('link.springer')) return 'springer';
    if (lower.includes('nature') || lower.includes('nature.com')) return 'nature';
    if (lower.includes('wiley') || lower.includes('onlinelibrary.wiley')) return 'wiley';
    if (lower.includes('mdpi') || lower.includes('mdpi.com')) return 'mdpi';
    if (lower.includes('frontiers') || lower.includes('frontiersin.org')) return 'frontiers';
    if (lower.includes('plos') || lower.includes('plos.org')) return 'plos';
    if (lower.includes('elsevier') || lower.includes('sciencedirect')) return 'elsevier';
    if (lower.includes('ieee') || lower.includes('ieee.org')) return 'ieee';
    if (lower.includes('arxiv') || lower.includes('arxiv.org')) return 'arxiv';
    if (lower.includes('pubmed') || lower.includes('ncbi.nlm.nih.gov')) return 'pmc';
    if (lower.includes('pmc')) return 'pmc';
    if (lower.includes('sage') || lower.includes('sagepub.com')) return 'sage';
    if (lower.includes('taylor') || lower.includes('tandfonline')) return 'taylorfrancis';
    if (lower.includes('jama') || lower.includes('jamanetwork')) return 'jama';

    // DOI prefix detection
    if (lower.startsWith('10.1007/')) return 'springer';
    if (lower.startsWith('10.1038/')) return 'nature';
    if (lower.startsWith('10.1111/') || lower.startsWith('10.1002/')) return 'wiley';
    if (lower.startsWith('10.3390/')) return 'mdpi';
    if (lower.startsWith('10.3389/')) return 'frontiers';
    if (lower.startsWith('10.1371/')) return 'plos';
    if (lower.startsWith('10.1016/')) return 'elsevier';
    if (lower.startsWith('10.1109/')) return 'ieee';
    if (lower.startsWith('10.1177/')) return 'sage';
    if (lower.startsWith('10.1080/')) return 'taylorfrancis';
    if (lower.startsWith('10.1001/')) return 'jama';

    return 'unknown';
  }

  /**
   * Phase 10.185: Get retry config for publisher
   */
  getRetryConfig(publisher: string): PublisherRetryConfig {
    return this.publisherRetryConfigs.get(publisher) || this.publisherRetryConfigs.get('unknown')!;
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE CIRCUIT BREAKER
  // ==========================================================================

  /**
   * Phase 10.185: Get or create circuit breaker for publisher
   */
  private getCircuitBreaker(publisher: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(publisher)) {
      this.circuitBreakers.set(publisher, {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        successesSinceHalfOpen: 0,
      });
    }
    return this.circuitBreakers.get(publisher)!;
  }

  /**
   * Phase 10.185: Check if circuit breaker allows request
   */
  private isCircuitBreakerOpen(publisher: string): boolean {
    const cb = this.getCircuitBreaker(publisher);
    const now = Date.now();

    if (cb.state === 'open') {
      // Check if reset timeout has passed
      if (now - cb.lastFailure >= this.CIRCUIT_RESET_TIMEOUT_MS) {
        cb.state = 'half-open';
        cb.successesSinceHalfOpen = 0;
        this.logger.log(`🔄 Circuit breaker HALF-OPEN for ${publisher} (reset timeout passed)`);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Phase 10.185: Record circuit breaker success
   */
  private recordCircuitBreakerSuccess(publisher: string): void {
    const cb = this.getCircuitBreaker(publisher);

    if (cb.state === 'half-open') {
      cb.successesSinceHalfOpen++;
      if (cb.successesSinceHalfOpen >= this.CIRCUIT_SUCCESS_THRESHOLD) {
        cb.state = 'closed';
        cb.failures = 0;
        this.logger.log(`✅ Circuit breaker CLOSED for ${publisher} (recovered)`);
      }
    } else if (cb.state === 'closed') {
      // Reset failures on success
      cb.failures = Math.max(0, cb.failures - 1);
    }
  }

  /**
   * Phase 10.185: Record circuit breaker failure
   */
  private recordCircuitBreakerFailure(publisher: string): void {
    const cb = this.getCircuitBreaker(publisher);
    cb.failures++;
    cb.lastFailure = Date.now();

    if (cb.state === 'half-open') {
      // Immediately open on failure in half-open state
      cb.state = 'open';
      this.logger.warn(`🔴 Circuit breaker OPEN for ${publisher} (failed in half-open)`);
      this.metricsService?.incrementCounter('fulltext_circuit_breaker_open_total', { publisher });
    } else if (cb.state === 'closed' && cb.failures >= this.CIRCUIT_FAILURE_THRESHOLD) {
      cb.state = 'open';
      this.logger.warn(`🔴 Circuit breaker OPEN for ${publisher} (${cb.failures} failures)`);
      this.metricsService?.incrementCounter('fulltext_circuit_breaker_open_total', { publisher });
    }
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE L1 IN-MEMORY CACHE
  // ==========================================================================

  /**
   * Phase 10.185: Get from L1 cache with true LRU behavior
   * Phase 10.185.1 FIX: Move accessed items to end of Map for true LRU
   */
  private getFromCache(paperId: string): ExtractionCacheEntry | null {
    const cacheKey = `paper:${paperId}`;
    const entry = this.extractionCache.get(cacheKey);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.extractionCache.delete(cacheKey);
      return null;
    }

    // Phase 10.185.1 FIX: True LRU - move accessed item to end of Map
    // Map maintains insertion order, so delete + re-set moves to end
    this.extractionCache.delete(cacheKey);
    this.extractionCache.set(cacheKey, entry);

    this.metricsService?.incrementCounter('fulltext_cache_hits_total', { tier: 'l1' });
    return entry;
  }

  /**
   * Phase 10.185: Set in L1 cache with LRU eviction
   */
  private setInCache(paperId: string, entry: ExtractionCacheEntry): void {
    const cacheKey = `paper:${paperId}`;

    // LRU eviction: remove oldest entries if cache is full
    if (this.extractionCache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.extractionCache.keys().next().value;
      if (firstKey) {
        this.extractionCache.delete(firstKey);
      }
    }

    this.extractionCache.set(cacheKey, entry);
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE GRACEFUL DEGRADATION
  // ==========================================================================

  /**
   * Phase 10.185: Build fallback content from abstract + title
   * Used when all extraction tiers fail
   */
  private buildFallbackContent(paper: { title?: string | null; abstract?: string | null }): {
    text: string;
    wordCount: number;
    usable: boolean;
  } {
    const parts: string[] = [];

    if (paper.title) parts.push(paper.title);
    if (paper.abstract) parts.push(paper.abstract);

    const text = parts.join('\n\n');
    const wordCount = this.calculateWordCount(text);
    const usable = wordCount >= this.GRACEFUL_DEGRADATION_MIN_WORDS;

    return { text, wordCount, usable };
  }

  /**
   * Phase 10.183: Check if paper needs abstract enrichment
   *
   * @param existingAbstract - Current abstract in database
   * @returns true if abstract is missing or too short
   */
  private needsAbstractEnrichment(existingAbstract: string | null | undefined): boolean {
    if (!existingAbstract) {
      return true;
    }
    return existingAbstract.trim().length < this.MIN_ABSTRACT_CHARS;
  }

  /**
   * Phase 10.183: Determine if new abstract should replace existing (Loophole #5 fix)
   *
   * Quality comparison logic:
   * - Accept new abstract if existing is empty
   * - Only update if new abstract is significantly longer (threshold defined by ABSTRACT_UPDATE_THRESHOLD)
   * - Minimum chars required for valid abstract (MIN_ABSTRACT_CHARS)
   *
   * @param existingAbstract - Current abstract in database
   * @param newAbstract - Newly extracted abstract
   * @returns true if new abstract should replace existing
   */
  private shouldUpdateAbstract(
    existingAbstract: string | null | undefined,
    newAbstract: string,
  ): boolean {
    const newTrimmed = newAbstract.trim();
    const newLength = newTrimmed.length;

    // Minimum chars for valid abstract
    if (newLength < this.MIN_ABSTRACT_CHARS) {
      return false;
    }

    // Accept if existing is empty or too short
    if (!existingAbstract) {
      return true;
    }

    const existingTrimmed = existingAbstract.trim();
    const existingLength = existingTrimmed.length;

    if (existingLength < this.MIN_ABSTRACT_CHARS) {
      return true;
    }

    // Only update if new abstract is significantly longer
    return newLength > existingLength * this.ABSTRACT_UPDATE_THRESHOLD;
  }

  /**
   * Fetch PDF from Unpaywall API for a given DOI
   * Returns PDF buffer or null if unavailable
   */
  async fetchPDF(doi: string): Promise<Buffer | null> {
    try {
      this.logger.log(`Fetching PDF for DOI: ${doi}`);

      // Step 1: Query Unpaywall API for PDF location
      const unpaywallUrl = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${this.UNPAYWALL_EMAIL}`;

      const unpaywallResponse = await axios.get(unpaywallUrl, {
        timeout: ENRICHMENT_TIMEOUT, // 5s - Phase 10.6 Day 14.5: Migrated to centralized config (metadata lookup)
      });

      const data = unpaywallResponse.data;

      // Check if open access PDF is available
      if (!data.is_oa) {
        this.logger.warn(`PDF not open access for DOI: ${doi}`);
        return null;
      }

      // Get best PDF location (prefer publisher > repository)
      let pdfUrl: string | null = null;

      if (data.best_oa_location?.url_for_pdf) {
        pdfUrl = data.best_oa_location.url_for_pdf;
      } else if (data.oa_locations && data.oa_locations.length > 0) {
        // Find first location with PDF URL
        const pdfLocation = data.oa_locations.find(
          (loc: OALocation) => loc.url_for_pdf,
        );
        if (pdfLocation) {
          pdfUrl = pdfLocation.url_for_pdf;
        }
      }

      // Phase 10 Day 5.17.4+: If no direct PDF URL but has landing page, try publisher-specific patterns
      if (!pdfUrl && data.best_oa_location?.url_for_landing_page) {
        pdfUrl = this.constructPdfUrlFromLandingPage(
          data.best_oa_location.url_for_landing_page,
          data.publisher,
        );
        if (pdfUrl) {
          this.logger.log(`Constructed PDF URL from landing page: ${pdfUrl}`);
        }
      }

      if (!pdfUrl) {
        this.logger.warn(`No PDF URL found for DOI: ${doi}`);
        return null;
      }

      this.logger.log(`Downloading PDF from: ${pdfUrl}`);

      // Step 2: Download PDF with size and timeout limits
      // Phase 10 Day 5.17.4+: Enhanced headers to bypass publisher bot protection
      const landingPage =
        data.best_oa_location?.url_for_landing_page ||
        data.doi_url ||
        `https://doi.org/${doi}`;
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: FULL_TEXT_TIMEOUT, // 30s - Phase 10.6 Day 14.5: Migrated to centralized config (PDF download)
        maxContentLength:
          this.MAX_PDF_SIZE_MB * this.BYTES_PER_KB * this.BYTES_PER_KB, // 50MB
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'application/pdf,application/x-pdf,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: landingPage,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        maxRedirects: this.MAX_REDIRECTS,
        validateStatus: (status) => status >= 200 && status < 400, // Accept 3xx redirects
      });

      const buffer = Buffer.from(pdfResponse.data);

      this.logger.log(
        `Successfully downloaded PDF (${(buffer.length / this.BYTES_PER_KB).toFixed(2)} KB)`,
      );

      return buffer;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          this.logger.error(`PDF download timeout for DOI: ${doi}`);
        } else if (error.response?.status === 404) {
          this.logger.warn(`PDF not found (404) for DOI: ${doi}`);
        } else if (error.response?.status === 403) {
          this.logger.warn(`PDF access forbidden (403) for DOI: ${doi}`);
        } else {
          this.logger.error(
            `Axios error fetching PDF for DOI ${doi}: ${error.message}`,
          );
        }
      } else {
        this.logger.error(`Error fetching PDF for DOI ${doi}:`, error);
      }
      return null;
    }
  }

  /**
   * Construct PDF URL from landing page using publisher-specific patterns
   * Phase 10 Day 5.17.4+: Handle cases where Unpaywall doesn't have direct PDF URLs
   */
  private constructPdfUrlFromLandingPage(
    landingPageUrl: string,
    publisher?: string,
  ): string | null {
    try {
      const url = new URL(landingPageUrl);
      const hostname = url.hostname.toLowerCase();

      // Sage Publications (journals.sagepub.com)
      if (hostname.includes('sagepub.com')) {
        // Pattern: https://journals.sagepub.com/doi/10.1177/XXX → https://journals.sagepub.com/doi/pdf/10.1177/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl.replace('/doi/', '/doi/pdf/');
        }
      }

      // Wiley (onlinelibrary.wiley.com)
      if (hostname.includes('wiley.com')) {
        // Pattern: https://onlinelibrary.wiley.com/doi/10.1111/XXX → https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl.replace('/doi/', '/doi/pdfdirect/');
        }
      }

      // Springer (link.springer.com)
      if (hostname.includes('springer.com')) {
        // Pattern: https://link.springer.com/article/10.1007/XXX → https://link.springer.com/content/pdf/10.1007/XXX.pdf
        if (url.pathname.includes('/article/')) {
          const doi = url.pathname.split('/article/')[1];
          return `https://link.springer.com/content/pdf/${doi}.pdf`;
        }
      }

      // Taylor & Francis (tandfonline.com)
      if (hostname.includes('tandfonline.com')) {
        // Pattern: https://www.tandfonline.com/doi/full/10.1080/XXX → https://www.tandfonline.com/doi/pdf/10.1080/XXX
        if (url.pathname.includes('/doi/')) {
          return landingPageUrl
            .replace('/doi/full/', '/doi/pdf/')
            .replace('/doi/abs/', '/doi/pdf/');
        }
      }

      // MDPI (mdpi.com)
      if (hostname.includes('mdpi.com')) {
        // Pattern: https://www.mdpi.com/1234-5678/1/2/34 → https://www.mdpi.com/1234-5678/1/2/34/pdf
        if (!landingPageUrl.endsWith('/pdf')) {
          return `${landingPageUrl}/pdf`;
        }
      }

      // Frontiers (frontiersin.org)
      if (hostname.includes('frontiersin.org')) {
        // Pattern: https://www.frontiersin.org/articles/10.3389/XXX → https://www.frontiersin.org/articles/10.3389/XXX/pdf
        if (
          url.pathname.includes('/articles/') &&
          !url.pathname.endsWith('/pdf')
        ) {
          return `${landingPageUrl}/pdf`;
        }
      }

      // PLOS (journals.plos.org)
      if (hostname.includes('plos.org')) {
        // Pattern: https://journals.plos.org/plosone/article?id=10.1371/XXX → https://journals.plos.org/plosone/article/file?id=10.1371/XXX&type=printable
        if (url.pathname.includes('/article')) {
          const match = landingPageUrl.match(/id=(10\.\d+\/[^\&]+)/);
          if (match) {
            const baseUrl = landingPageUrl.split('/article')[0];
            return `${baseUrl}/article/file?id=${match[1]}&type=printable`;
          }
        }
      }

      // JAMA Network (jamanetwork.com)
      // Phase 10.6 Day 8: JAMA publisher-specific PDF pattern
      if (hostname.includes('jamanetwork.com')) {
        // Pattern: https://jamanetwork.com/journals/jama/fullarticle/2761645 →
        //          https://jamanetwork.com/journals/jama/articlepdf/2761044/jama_*.pdf
        // Note: Unpaywall provides the correct PDF URL, this is fallback for landing pages
        if (url.pathname.includes('/fullarticle/')) {
          // Extract article ID
          const articleIdMatch = url.pathname.match(/\/fullarticle\/(\d+)/);
          if (articleIdMatch) {
            const articleId = articleIdMatch[1];
            // JAMA's PDF article IDs are often different from HTML article IDs
            // We need to query the HTML page or rely on Unpaywall's direct PDF URL
            // For now, log and return null to let Unpaywall handle it
            this.logger.log(
              `JAMA article detected: ${articleId}. Relying on Unpaywall for PDF URL.`,
            );
          }
        }
      }

      // Handle doi.org URLs by detecting publisher from DOI pattern
      if (hostname === 'doi.org' && url.pathname.startsWith('/10.')) {
        const doi = url.pathname.substring(1); // Remove leading /

        // Sage: 10.1177/... → journals.sagepub.com
        if (doi.startsWith('10.1177/')) {
          return `https://journals.sagepub.com/doi/pdf/${doi}`;
        }

        // Wiley: 10.1111/... → onlinelibrary.wiley.com
        if (doi.startsWith('10.1111/') || doi.startsWith('10.1002/')) {
          return `https://onlinelibrary.wiley.com/doi/pdfdirect/${doi}`;
        }

        // Springer: 10.1007/... → link.springer.com
        if (doi.startsWith('10.1007/')) {
          return `https://link.springer.com/content/pdf/${doi}.pdf`;
        }

        // Taylor & Francis: 10.1080/... → tandfonline.com
        if (doi.startsWith('10.1080/')) {
          return `https://www.tandfonline.com/doi/pdf/${doi}`;
        }

        // MDPI: 10.3390/... → mdpi.com (need to resolve full path)
        // For MDPI, the DOI alone isn't enough, skip for now

        // Frontiers: 10.3389/... → frontiersin.org
        if (doi.startsWith('10.3389/')) {
          return `https://www.frontiersin.org/articles/${doi}/pdf`;
        }

        // PLOS: 10.1371/... → journals.plos.org
        if (doi.startsWith('10.1371/')) {
          // PLOS journal detection from DOI is complex, use generic pattern
          return `https://journals.plos.org/plosone/article/file?id=${doi}&type=printable`;
        }

        // JAMA: 10.1001/... → jamanetwork.com
        // Phase 10.6 Day 8: JAMA DOI pattern
        if (doi.startsWith('10.1001/')) {
          // JAMA uses Bronze OA model - Unpaywall will provide direct PDF URLs
          // We'll rely on Unpaywall's best_oa_location rather than constructing
          this.logger.log(
            `JAMA DOI detected (${doi}). Relying on Unpaywall for PDF URL.`,
          );
          return null; // Let Unpaywall handle it
        }

        // Generic fallback: try adding .pdf
        return `${landingPageUrl}.pdf`;
      }

      this.logger.log(
        `No PDF URL pattern available for publisher: ${publisher || hostname}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error constructing PDF URL from landing page: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Extract text from PDF buffer using pdf-parse
   * Returns plain text or null on error
   */
  async extractText(pdfBuffer: Buffer): Promise<string | null> {
    try {
      this.logger.log(
        `Extracting text from PDF (${(pdfBuffer.length / this.BYTES_PER_KB).toFixed(2)} KB)`,
      );

      // PHASE 10 DAY 32: Use pdfParse function (renamed from pdf)
      const data = await pdfParse(pdfBuffer);

      if (!data.text || data.text.trim().length === 0) {
        this.logger.warn('PDF extraction returned empty text');
        return null;
      }

      this.logger.log(`Extracted ${data.text.length} characters from PDF`);

      return data.text;
    } catch (error) {
      this.logger.error('Error extracting text from PDF:', error);
      return null;
    }
  }

  /**
   * Clean extracted PDF text
   * - Fix encoding issues
   * - Remove headers/footers
   * - Fix hyphenation
   * - Remove non-content sections (references, indexes, etc.)
   */
  cleanText(rawText: string): string {
    let cleaned = rawText;

    // Step 1: Fix common encoding issues
    cleaned = cleaned
      .replace(/\uFFFD/g, '') // Replace replacement character
      .replace(/[^\x00-\x7F]/g, (char) => {
        // Preserve common special chars, replace others
        const commonChars = 'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ';
        return commonChars.includes(char) ? char : '';
      });

    // Step 2: Fix line breaks and hyphenation
    cleaned = cleaned
      .replace(/(\w)-\s*\n\s*(\w)/g, '$1$2') // Fix hyphenated words across lines
      .replace(/\n{3,}/g, '\n\n') // Normalize excessive line breaks
      .replace(/[ \t]+/g, ' '); // Normalize whitespace

    // Step 3: Remove common headers/footers patterns
    const headerFooterPatterns = [
      /^\d+\s*$/gm, // Standalone page numbers
      /^Page \d+ of \d+$/gim,
      /^\d+\s+[A-Z][a-z]+ et al\.$/gim, // Author names in header
      /^[A-Z][a-z]+ \d{4}$/gim, // Journal name + year
    ];

    headerFooterPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Step 4: Remove non-content sections using 50+ exclusion markers
    // (Same markers as comprehensive word count utility)
    const exclusionMarkers = [
      // English
      'references',
      'bibliography',
      'works cited',
      'cited references',
      'literature cited',
      'index',
      'subject index',
      'author index',
      'keyword index',
      'glossary',
      'terminology',
      'appendix',
      'appendices',
      'supplementary material',
      'supplemental material',
      'supporting information',
      'acknowledgments',
      'acknowledgements',
      'author contributions',
      'funding',
      'funding sources',
      'financial disclosure',
      'conflict of interest',
      'conflicts of interest',
      'competing interests',
      'about the author',
      'about the authors',
      'biographical note',

      // Portuguese
      'referências',
      'bibliografia',
      'índice',
      'glossário',
      'apêndice',
      'material suplementar',
      'agradecimentos',
      'financiamento',

      // French
      'références',
      'bibliographie',
      'index',
      'glossaire',
      'annexe',
      'matériel supplémentaire',
      'remerciements',
      'financement',

      // German
      'literaturverzeichnis',
      'bibliographie',
      'index',
      'glossar',
      'anhang',
      'ergänzungsmaterial',
      'danksagung',
      'finanzierung',

      // Italian
      'bibliografia',
      'riferimenti',
      'indice',
      'glossario',
      'appendice',
      'materiale supplementare',
      'ringraziamenti',
      'finanziamento',

      // Spanish
      'referencias',
      'bibliografía',
      'índice',
      'glosario',
      'apéndice',
      'material suplementario',
      'agradecimientos',
      'financiación',
    ];

    // Find first occurrence of any exclusion marker (case-insensitive)
    let cutoffIndex = -1;
    const lowerText = cleaned.toLowerCase();

    for (const marker of exclusionMarkers) {
      const pattern = new RegExp(`\\b${marker}\\b`, 'i');
      const match = lowerText.match(pattern);
      if (match && match.index !== undefined) {
        if (cutoffIndex === -1 || match.index < cutoffIndex) {
          cutoffIndex = match.index;
        }
      }
    }

    // Cut off everything from first exclusion marker onward
    if (cutoffIndex !== -1) {
      cleaned = cleaned.substring(0, cutoffIndex);
      this.logger.log(
        `Removed non-content sections (cut at character ${cutoffIndex})`,
      );
    }

    // Step 5: Final cleanup
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Calculate SHA256 hash for deduplication
   */
  calculateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Calculate word count (simple whitespace-based)
   */
  calculateWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Phase 10 Day 30 (Enhanced Nov 18, 2025): Enterprise-Grade Waterfall Full-Text Fetching
   *
   * Main method: Fetch, extract, clean, and store full-text for a paper using 4-tier waterfall
   *
   * **4-Tier Waterfall Strategy:**
   * - **Tier 1:** Database cache check (instant, 0ms)
   * - **Tier 2:** PMC API + HTML scraping (fast, 40-50% coverage, highest quality)
   * - **Tier 3:** Unpaywall PDF (medium speed, 25-30% coverage, good quality)
   * - **Tier 4:** Direct publisher PDF (medium speed, 15-20% additional coverage, good quality)
   *   - MDPI: {url}/pdf pattern
   *   - Frontiers: {url}/pdf pattern
   *   - Sage: /doi/ → /doi/pdf/ pattern
   *   - Wiley: /doi/ → /doi/pdfdirect/ pattern
   *   - And more...
   *
   * **Result:** 90%+ full-text availability vs 30% with PDF-only approach
   *
   * **Quality Hierarchy:** PMC > HTML scraping > Direct PDF > Unpaywall PDF
   *
   * @param paperId - Database ID of the paper to fetch full-text for
   * @returns Promise with success status, word count, and error (if failed)
   */
  async processFullText(paperId: string): Promise<{
    success: boolean;
    status: 'success' | 'failed' | 'not_found';
    wordCount?: number;
    error?: string;
    category?: string;
    retryable?: boolean;
  }> {
    const startTime = Date.now();

    try {
      // Phase 10.185: L1 In-Memory Cache Check (fastest)
      const cached = this.getFromCache(paperId);
      if (cached) {
        this.logger.log(
          `✅ Paper ${paperId} found in L1 cache (${cached.wordCount} words from ${cached.source})`,
        );
        return {
          success: true,
          status: 'success',
          wordCount: cached.wordCount,
        };
      }

      // Tier 1: Get paper from database (L2 cache check)
      const paper = await this.prisma.paper.findUnique({
        where: { id: paperId },
      });

      if (!paper) {
        return {
          success: false,
          status: 'not_found',
          error: 'Paper not found',
        };
      }

      // Phase 10.185: Detect publisher for circuit breaker and metrics
      const publisher = this.detectPublisher(paper.url || paper.doi || '');

      // Phase 10.185: Circuit Breaker Check
      if (this.isCircuitBreakerOpen(publisher)) {
        this.logger.warn(
          `🔴 Circuit breaker OPEN for ${publisher} - failing fast for paper ${paperId}`,
        );
        return {
          success: false,
          status: 'failed',
          error: `Publisher ${publisher} is temporarily unavailable (circuit breaker open)`,
          category: 'circuit_breaker',
          retryable: true,
        };
      }

      // If already has full-text in database (L2 cache), skip fetching
      // Phase 10.185.1 FIX: Re-process if source was 'graceful_degradation' - we should try for real full-text
      const isGracefulDegradation = paper.fullTextSource === 'graceful_degradation';
      if (paper.fullText && paper.fullText.length > this.MIN_CONTENT_LENGTH && !isGracefulDegradation) {
        this.logger.log(
          `✅ Paper ${paperId} already has full-text (${paper.fullTextWordCount} words) - L2 cache hit`,
        );

        // Store in L1 cache for future requests
        this.setInCache(paperId, {
          fullText: paper.fullText,
          wordCount: paper.fullTextWordCount || 0,
          source: paper.fullTextSource || 'database',
          timestamp: Date.now(),
        });

        this.metricsService?.incrementCounter('fulltext_cache_hits_total', { tier: 'l2' });

        return {
          success: true,
          status: 'success',
          wordCount: paper.fullTextWordCount || 0,
        };
      }

      // Phase 10.185.1: Log if re-processing graceful degradation paper
      if (isGracefulDegradation) {
        this.logger.log(
          `🔄 Paper ${paperId} has graceful degradation content - attempting real full-text fetch`,
        );
      }

      // Update status to fetching
      await this.prisma.paper.update({
        where: { id: paperId },
        data: { fullTextStatus: 'fetching' },
      });

      this.logger.log(
        `🔄 Starting waterfall full-text fetch for paper: ${paperId}`,
      );

      let fullText: string | null = null;
      let fullTextSource: string | null = null;

      // Phase 10.183: Track extracted abstract across all tiers
      let extractedAbstract: string | undefined;
      let extractedAbstractWordCount: number | undefined;

      // Phase 10.183: Cache PDF buffer to avoid duplicate Unpaywall API calls
      let cachedPdfBuffer: Buffer | null = null;

      // Tier 2: Try PMC API first (fastest and most reliable for biomedical papers)
      // Check if we have PMID (added via PubMed search)
      const pmid = (paper as any).pmid;
      if (pmid || paper.url) {
        this.logger.log(
          `🔍 Tier 2: Attempting HTML full-text (PMC API + URL scraping)...`,
        );
        const htmlResult = await this.htmlService.fetchFullTextWithFallback(
          paperId,
          pmid,
          paper.url || undefined,
        );

        if (htmlResult.success && htmlResult.text) {
          fullText = htmlResult.text;
          fullTextSource = htmlResult.source === 'pmc' ? 'pmc' : 'html_scrape';
          this.logger.log(
            `✅ Tier 2 SUCCESS: ${htmlResult.source} provided ${htmlResult.wordCount} words`,
          );

          // Phase 10.183: Loophole #1 Fix - Save HTML/PMC extracted abstract
          if (htmlResult.abstract && this.shouldUpdateAbstract(paper.abstract, htmlResult.abstract)) {
            extractedAbstract = htmlResult.abstract;
            extractedAbstractWordCount = htmlResult.abstractWordCount || this.calculateWordCount(htmlResult.abstract);
            this.logger.log(
              `📝 Abstract extracted from ${htmlResult.source}: ${extractedAbstractWordCount} words`,
            );
          }
        } else {
          this.logger.log(`⚠️  Tier 2 FAILED: ${htmlResult.error}`);
        }
      } else {
        this.logger.log(
          `⏭️  Tier 2 SKIPPED: No PMID or URL available for HTML fetching`,
        );
      }

      // Tier 2.5: Try GROBID PDF extraction (Phase 10.94 - Enterprise Enhancement)
      // 6-10x better extraction than pdf-parse (90%+ vs 15% content extraction)
      // Phase 10.180: pdfUrl is now in Prisma schema (no more 'as any' cast needed)
      if (!fullText && (paper.pdfUrl || paper.doi)) {
        this.logger.log(`🔍 Tier 2.5: Attempting GROBID PDF extraction...`);

        // Create AbortController for this tier
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), FULL_TEXT_TIMEOUT);

        try {
          // Check if GROBID is available
          const isGrobidAvailable = await this.grobidService.isGrobidAvailable(
            abortController.signal
          );

          if (isGrobidAvailable && !abortController.signal.aborted) {
            let pdfBuffer: Buffer | null = null;

            // Try direct PDF URL first (faster)
            if (paper.pdfUrl) {
              try {
                const pdfResponse = await axios.get(paper.pdfUrl, {
                  responseType: 'arraybuffer',
                  timeout: FULL_TEXT_TIMEOUT,
                  headers: {
                    'User-Agent': this.USER_AGENT,
                    Accept: 'application/pdf,*/*',
                  },
                  maxRedirects: this.MAX_REDIRECTS,
                  signal: abortController.signal,
                });
                pdfBuffer = Buffer.from(pdfResponse.data);
              } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`⚠️  Direct PDF download failed: ${errorMsg}`);
              }
            }

            // Fallback to Unpaywall if no direct PDF
            if (!pdfBuffer && paper.doi && !abortController.signal.aborted) {
              try {
                pdfBuffer = await this.fetchPDF(paper.doi);
                // Cache for potential reuse in Tier 3 (avoids duplicate API call)
                if (pdfBuffer) {
                  cachedPdfBuffer = pdfBuffer;
                }
              } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`⚠️  Unpaywall PDF fetch failed: ${errorMsg}`);
              }
            }

            // Process with GROBID
            if (pdfBuffer && !abortController.signal.aborted) {
              const grobidResult = await this.grobidService.extractFromBuffer(pdfBuffer, {
                signal: abortController.signal,
              });

              if (grobidResult.success && grobidResult.text) {
                fullText = grobidResult.text;
                fullTextSource = 'grobid';
                const wordCount = grobidResult.wordCount || 0;
                this.logger.log(
                  `✅ Tier 2.5 SUCCESS: GROBID extracted ${wordCount} words (${grobidResult.processingTime}ms)`,
                );

                // Phase 10.183: Loophole #3 Fix - Save GROBID extracted abstract
                const grobidAbstract = grobidResult.metadata?.abstract;
                if (grobidAbstract && !extractedAbstract && this.shouldUpdateAbstract(paper.abstract, grobidAbstract)) {
                  extractedAbstract = grobidAbstract;
                  extractedAbstractWordCount = this.calculateWordCount(grobidAbstract);
                  this.logger.log(
                    `📝 Abstract extracted from GROBID: ${extractedAbstractWordCount} words`,
                  );
                }
              } else {
                this.logger.log(`⚠️  Tier 2.5 FAILED: ${grobidResult.error || 'Unknown error'}`);
              }
            }
          } else {
            this.logger.log(`⏭️  Tier 2.5 SKIPPED: GROBID service unavailable`);
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`❌ Tier 2.5 ERROR: ${errorMsg}`);
        } finally {
          clearTimeout(timeoutId);  // Clean up timeout
        }
      } else if (!fullText) {
        this.logger.log(`⏭️  Tier 2.5 SKIPPED: No PDF URL or DOI available for GROBID`);
      }

      // Tier 3: Try PDF via Unpaywall if HTML failed (uses cached buffer if available)
      if (!fullText && paper.doi) {
        this.logger.log(`🔍 Tier 3: Attempting PDF fetch via Unpaywall...`);
        // Use cached PDF buffer from Tier 2.5 if available (avoids duplicate API call)
        const pdfBuffer = cachedPdfBuffer || await this.fetchPDF(paper.doi);

        if (pdfBuffer) {
          if (cachedPdfBuffer) {
            this.logger.log(`♻️  Using cached PDF buffer from Tier 2.5`);
          }
          const rawText = await this.extractText(pdfBuffer);
          if (rawText) {
            fullText = this.cleanText(rawText);
            fullTextSource = 'unpaywall';
            const wordCount = this.calculateWordCount(fullText);
            this.logger.log(`✅ Tier 3 SUCCESS: PDF provided ${wordCount} words`);
          } else {
            this.logger.log(
              `⚠️  Tier 3 FAILED: PDF extraction returned no text`,
            );
          }
        } else {
          this.logger.log(
            `⚠️  Tier 3 FAILED: PDF not available or behind paywall`,
          );
        }
      } else if (!fullText) {
        this.logger.log(`⏭️  Tier 3 SKIPPED: No DOI available for PDF fetch`);
      }

      // Tier 4: Try direct PDF from publisher URL (for open-access publishers like MDPI)
      // Enterprise Enhancement (Nov 18, 2025): URL-based PDF fallback for publishers without DOI/Unpaywall coverage
      if (!fullText && paper.url) {
        this.logger.log(
          `🔍 Tier 4: Attempting direct PDF from publisher URL...`,
        );

        // DEF-001: Validate URL format before processing
        try {
          new URL(paper.url); // Throws if invalid
        } catch (urlError: unknown) {
          // Phase 10.106 Phase 10: Use unknown with type narrowing
          const err = urlError as { message?: string };
          this.logger.warn(
            `⏭️  Tier 4 SKIPPED: Invalid URL format: ${err.message || 'Unknown error'}`,
          );
          // Continue to final failure handling
        }

        const pdfUrl = this.constructPdfUrlFromLandingPage(paper.url);

        if (pdfUrl) {
          this.logger.log(`📄 Constructed PDF URL: ${pdfUrl}`);
          try {
            const landingPage = paper.url;
            const pdfResponse = await axios.get(pdfUrl, {
              timeout: FULL_TEXT_TIMEOUT, // 60s for large PDFs
              responseType: 'arraybuffer',
              headers: {
                'User-Agent': this.USER_AGENT,
                Accept: 'application/pdf,*/*',
                Referer: landingPage,
              },
              maxRedirects: this.MAX_REDIRECTS,
              // DEF-002: Add PDF size validation
              maxContentLength:
                this.MAX_PDF_SIZE_MB * this.BYTES_PER_KB * this.BYTES_PER_KB,
            });

            if (pdfResponse.data) {
              const pdfBuffer = Buffer.from(pdfResponse.data);
              this.logger.log(
                `✅ PDF downloaded successfully (${(pdfBuffer.length / this.BYTES_PER_KB).toFixed(2)} KB)`,
              );

              const rawText = await this.extractText(pdfBuffer);
              if (rawText) {
                fullText = this.cleanText(rawText);
                fullTextSource = 'direct_pdf';
                // PERF-003: Use calculateWordCount() method instead of inline split
                const wordCount = this.calculateWordCount(fullText);
                this.logger.log(
                  `✅ Tier 4 SUCCESS: Direct PDF provided ${wordCount} words`,
                );
              } else {
                this.logger.log(
                  `⚠️  Tier 4 FAILED: PDF extraction returned no text`,
                );
              }
            }
          } catch (error: unknown) {
            // Phase 10.106 Phase 8: Use unknown with type narrowing
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            this.logger.log(
              `⚠️  Tier 4 FAILED: PDF download error: ${errorMsg}`,
            );
          }
        } else {
          this.logger.log(
            `⏭️  Tier 4 SKIPPED: Could not construct PDF URL from landing page`,
          );
        }
      } else if (!fullText) {
        this.logger.log(`⏭️  Tier 4 SKIPPED: No URL available for direct PDF`);
      }

      // Phase 10.183: Loophole #4 Fix - Try UniversalAbstractEnrichmentService as fallback
      // This runs regardless of full-text success, if we still don't have a good abstract
      if (!extractedAbstract && this.needsAbstractEnrichment(paper.abstract)) {
        this.logger.log(`🔍 Attempting universal abstract enrichment as fallback...`);
        try {
          const enrichmentResult = await this.universalAbstractEnrichment.enrichAbstract(
            paper.doi || undefined,
            paper.url || undefined,
            pmid,
          );

          if (enrichmentResult.abstract && enrichmentResult.abstract.length > 0) {
            if (this.shouldUpdateAbstract(paper.abstract, enrichmentResult.abstract)) {
              extractedAbstract = enrichmentResult.abstract;
              extractedAbstractWordCount = enrichmentResult.wordCount || this.calculateWordCount(enrichmentResult.abstract);
              this.logger.log(
                `📝 Abstract enriched via ${enrichmentResult.source}: ${extractedAbstractWordCount} words`,
              );
            }
          } else {
            this.logger.log(`⚠️  Universal abstract enrichment returned no result`);
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`⚠️  Universal abstract enrichment error: ${errorMsg}`);
        }
      }

      // If all tiers failed, try graceful degradation
      if (!fullText) {
        // Phase 10.185: Netflix-Grade Graceful Degradation
        // Try to use abstract + title as fallback content
        const fallback = this.buildFallbackContent({
          title: paper.title,
          abstract: extractedAbstract || paper.abstract,
        });

        if (fallback.usable) {
          // Graceful degradation successful - use abstract + title
          this.logger.log(
            `✅ Graceful degradation: Using abstract + title (${fallback.wordCount} words) for paper ${paperId}`,
          );

          const fallbackHash = this.calculateHash(fallback.text);

          // Phase 10.185.1 FIX: Set hasFullText=false for graceful degradation
          // This allows future re-processing when real full-text becomes available
          await this.prisma.paper.update({
            where: { id: paperId },
            data: {
              fullText: fallback.text,
              fullTextStatus: 'success',
              fullTextSource: 'graceful_degradation',
              fullTextFetchedAt: new Date(),
              fullTextWordCount: fallback.wordCount,
              fullTextHash: fallbackHash,
              wordCount: fallback.wordCount,
              hasFullText: false, // Phase 10.185.1: NOT real full-text, just abstract+title
              ...(extractedAbstract && {
                abstract: extractedAbstract,
                abstractWordCount: extractedAbstractWordCount,
              }),
            },
          });

          // Track metrics
          this.metricsService?.incrementCounter('fulltext_graceful_degradation_total', { publisher });
          this.recordCircuitBreakerSuccess(publisher);

          // Store in L1 cache
          this.setInCache(paperId, {
            fullText: fallback.text,
            wordCount: fallback.wordCount,
            source: 'graceful_degradation',
            timestamp: Date.now(),
          });

          const duration = Date.now() - startTime;
          this.metricsService?.recordHistogram('fulltext_extraction_duration_seconds', duration / 1000, {
            publisher,
            source: 'graceful_degradation',
            status: 'success',
          });

          return {
            success: true,
            status: 'success',
            wordCount: fallback.wordCount,
          };
        }

        // Complete failure - mark as failed
        this.recordCircuitBreakerFailure(publisher);

        // Even if full-text failed, still save any extracted abstract
        if (extractedAbstract) {
          await this.prisma.paper.update({
            where: { id: paperId },
            data: {
              fullTextStatus: 'failed',
              abstract: extractedAbstract,
              abstractWordCount: extractedAbstractWordCount,
            },
          });
          this.logger.log(
            `📝 Full-text failed but abstract saved: ${extractedAbstractWordCount} words`,
          );
        } else {
          await this.prisma.paper.update({
            where: { id: paperId },
            data: { fullTextStatus: 'failed' },
          });
        }

        // Track failure metrics
        const duration = Date.now() - startTime;
        this.metricsService?.recordHistogram('fulltext_extraction_duration_seconds', duration / 1000, {
          publisher,
          status: 'failed',
        });
        this.metricsService?.incrementCounter('fulltext_extraction_total', {
          publisher,
          status: 'failed',
          category: 'all_tiers_failed',
        });

        return {
          success: false,
          status: 'failed',
          error:
            'All full-text fetching methods failed (PMC, HTML scraping, Unpaywall PDF, direct publisher PDF)',
          category: 'all_tiers_failed',
          retryable: true,
        };
      }

      // Step 3: Calculate metrics
      const fullTextWordCount = this.calculateWordCount(fullText);
      const fullTextHash = this.calculateHash(fullText);

      // Step 4: Check for duplicates
      const duplicate = await this.prisma.paper.findFirst({
        where: {
          fullTextHash,
          id: { not: paperId },
        },
      });

      if (duplicate) {
        this.logger.warn(
          `Duplicate full-text detected for paper ${paperId} (matches ${duplicate.id})`,
        );
      }

      // Step 5: Recalculate comprehensive word count (title + abstract + fullText)
      const titleWords = this.calculateWordCount(paper.title || '');
      // Phase 10.183: Use extracted abstract word count if available
      const abstractWords = extractedAbstractWordCount ||
        paper.abstractWordCount ||
        this.calculateWordCount(paper.abstract || '');
      const totalWordCount = titleWords + abstractWords + fullTextWordCount;

      // Step 6: Store in database with correct source
      // Phase 10.183: Include abstract fields if extracted (Loopholes #1, #2, #3 final save)
      const updateData: Prisma.PaperUpdateInput = {
        fullText,
        fullTextStatus: 'success',
        fullTextSource, // 'pmc', 'html_scrape', 'unpaywall', 'grobid', or 'direct_pdf'
        fullTextFetchedAt: new Date(),
        fullTextWordCount,
        fullTextHash,
        wordCount: totalWordCount,
        wordCountExcludingRefs: totalWordCount, // Already excluded in cleanText/HTML parsing
        hasFullText: true,
      };

      // Include extracted abstract if we have one
      if (extractedAbstract) {
        updateData.abstract = extractedAbstract;
        updateData.abstractWordCount = extractedAbstractWordCount;
        this.logger.log(
          `📝 Saving enriched abstract: ${extractedAbstractWordCount} words`,
        );
      }

      await this.prisma.paper.update({
        where: { id: paperId },
        data: updateData,
      });

      const abstractStatus = extractedAbstract
        ? ` + ${extractedAbstractWordCount} word abstract`
        : '';
      this.logger.log(
        `✅ Successfully processed full-text for paper ${paperId}: ${fullTextWordCount} words from ${fullTextSource}${abstractStatus} (total: ${totalWordCount})`,
      );

      // Phase 10.185: Record circuit breaker success
      this.recordCircuitBreakerSuccess(publisher);

      // Phase 10.185: Store in L1 cache
      this.setInCache(paperId, {
        fullText,
        wordCount: fullTextWordCount,
        source: fullTextSource || 'unknown',
        timestamp: Date.now(),
      });

      // Phase 10.185: Track success metrics
      const duration = Date.now() - startTime;
      this.metricsService?.recordHistogram('fulltext_extraction_duration_seconds', duration / 1000, {
        publisher,
        source: fullTextSource || 'unknown',
        status: 'success',
      });
      this.metricsService?.incrementCounter('fulltext_extraction_total', {
        publisher,
        source: fullTextSource || 'unknown',
        status: 'success',
      });

      return {
        success: true,
        status: 'success',
        wordCount: fullTextWordCount,
      };
    } catch (error) {
      // Phase 10.185: Categorize error for smart retry
      const publisher = 'unknown'; // Can't detect without paper
      const categorizedError = this.categorizeError(error, publisher);
      const duration = Date.now() - startTime;

      this.logger.error(
        `Error processing full-text for paper ${paperId} [${categorizedError.category}]:`,
        error,
      );

      // Track error metrics
      this.metricsService?.recordHistogram('fulltext_extraction_duration_seconds', duration / 1000, {
        publisher,
        status: 'failed',
        category: categorizedError.category,
      });
      this.metricsService?.incrementCounter('fulltext_extraction_errors_total', {
        publisher,
        category: categorizedError.category,
        retryable: categorizedError.retryable ? 'true' : 'false',
      });

      // Update status to failed
      await this.prisma.paper
        .update({
          where: { id: paperId },
          data: { fullTextStatus: 'failed' },
        })
        .catch(() => {}); // Ignore error if paper doesn't exist

      return {
        success: false,
        status: 'failed',
        error: categorizedError.message,
        category: categorizedError.category,
        retryable: categorizedError.retryable,
      };
    }
  }

  /**
   * Get full-text fetch status for a paper
   */
  async getStatus(paperId: string): Promise<{
    status: string;
    wordCount?: number;
    fetchedAt?: Date;
    error?: string;
  } | null> {
    const paper = await this.prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        fullTextStatus: true,
        fullTextWordCount: true,
        fullTextFetchedAt: true,
      },
    });

    if (!paper) {
      return null;
    }

    return {
      status: paper.fullTextStatus || 'not_fetched',
      wordCount: paper.fullTextWordCount || undefined,
      fetchedAt: paper.fullTextFetchedAt || undefined,
    };
  }

  /**
   * Get full-text content for a paper
   */
  async getFullText(paperId: string): Promise<string | null> {
    const paper = await this.prisma.paper.findUnique({
      where: { id: paperId },
      select: { fullText: true },
    });

    return paper?.fullText || null;
  }

  /**
   * Bulk status check for multiple papers
   * Returns grouped by status
   */
  async getBulkStatus(paperIds: string[]): Promise<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  }> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
      select: { id: true, fullTextStatus: true },
    });

    const grouped = {
      ready: [] as string[],
      fetching: [] as string[],
      failed: [] as string[],
      not_fetched: [] as string[],
    };

    papers.forEach((paper) => {
      const status = paper.fullTextStatus || 'not_fetched';
      if (status === 'success') {
        grouped.ready.push(paper.id);
      } else if (status === 'fetching') {
        grouped.fetching.push(paper.id);
      } else if (status === 'failed') {
        grouped.failed.push(paper.id);
      } else {
        grouped.not_fetched.push(paper.id);
      }
    });

    return grouped;
  }

  // ==========================================================================
  // PHASE 10.185: NETFLIX-GRADE SCHEDULED STUCK JOB CLEANUP
  // ==========================================================================

  /**
   * Phase 10.185: Scheduled automatic cleanup of stuck jobs and expired cache
   * Runs every 10 minutes to clean up stuck 'fetching' jobs and expired cache entries
   * Netflix-Grade: Automatic, self-healing, with metrics
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledCleanupStuckJobs(): Promise<void> {
    const startTime = Date.now();

    try {
      // Phase 10.185.1: Cleanup expired L1 cache entries
      const expiredCacheCount = this.cleanupExpiredCacheEntries();
      if (expiredCacheCount > 0) {
        this.logger.log(`🧹 Cleaned up ${expiredCacheCount} expired cache entries`);
        this.metricsService?.incrementCounter('fulltext_cache_expired_cleaned_total', {
          count: String(expiredCacheCount),
        });
      }

      // Cleanup stuck fetching jobs
      const cleaned = await this.cleanupStuckFetchingJobs(5);

      if (cleaned > 0) {
        this.metricsService?.incrementCounter('fulltext_stuck_jobs_cleaned_total', {
          timeout_minutes: '5',
        });

        this.logger.warn(`🧹 Scheduled cleanup: ${cleaned} stuck jobs cleaned up`, {
          cleaned,
          durationMs: Date.now() - startTime,
        });
      }
    } catch (error) {
      this.metricsService?.incrementCounter('fulltext_cleanup_errors_total');
      this.logger.error(
        `❌ Scheduled cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.stack : String(error) },
      );
    }
  }

  /**
   * Phase 10.185.1: Cleanup expired L1 cache entries
   * Removes entries older than CACHE_TTL_MS to prevent stale data buildup
   * @returns Number of entries cleaned up
   */
  private cleanupExpiredCacheEntries(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.extractionCache) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.extractionCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Cleanup stuck 'fetching' jobs
   *
   * Phase 10.184: Marks papers stuck in 'fetching' status as 'failed'
   * after a timeout period (default: 5 minutes)
   *
   * Phase 10.185: Enhanced with metrics tracking
   *
   * Use Case:
   * - Jobs that crashed or timed out without updating status
   * - Prevents papers from appearing "in progress" indefinitely
   * - Allows users to retry extraction
   *
   * @param timeoutMinutes - Minutes after which 'fetching' status is considered stuck (default: 5)
   * @returns Number of papers cleaned up
   */
  async cleanupStuckFetchingJobs(timeoutMinutes: number = 5): Promise<number> {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeoutMs);

    this.logger.log(
      `🧹 Cleaning up stuck 'fetching' jobs older than ${timeoutMinutes} minutes...`,
    );

    try {
      // Find stuck papers
      const stuckPapers = await this.prisma.paper.findMany({
        where: {
          fullTextStatus: 'fetching',
          updatedAt: { lt: cutoffTime },
        },
        select: { id: true, title: true, updatedAt: true },
      });

      if (stuckPapers.length === 0) {
        this.logger.log('✅ No stuck jobs found');
        return 0;
      }

      this.logger.log(`🔍 Found ${stuckPapers.length} stuck jobs`);

      // Log each stuck paper
      for (const paper of stuckPapers) {
        const stuckDuration = Math.round(
          (Date.now() - paper.updatedAt.getTime()) / 60000,
        );
        this.logger.log(
          `  - ${paper.id}: "${paper.title?.substring(0, 50)}..." stuck for ${stuckDuration} minutes`,
        );
      }

      // Batch update all stuck papers to 'failed'
      const result = await this.prisma.paper.updateMany({
        where: {
          fullTextStatus: 'fetching',
          updatedAt: { lt: cutoffTime },
        },
        data: {
          fullTextStatus: 'failed',
          updatedAt: new Date(), // Update timestamp
        },
      });

      this.logger.log(
        `✅ Cleaned up ${result.count} stuck jobs (marked as 'failed')`,
      );

      return result.count;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to cleanup stuck jobs: ${errorMsg}`);
      throw error;
    }
  }
}
