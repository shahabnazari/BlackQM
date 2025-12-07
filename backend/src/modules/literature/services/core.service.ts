/**
 * CORE Service
 * Phase 10.7.10: New open access aggregator integration
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * IMPLEMENTATION STRATEGY:
 * This service follows the established clean architecture pattern used by all
 * other academic source services (PubMed, Semantic Scholar, CrossRef, etc.)
 *
 * ENTERPRISE PATTERN:
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for open access analysis features
 * - literature.service.ts contains only thin wrapper
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY CORE INTEGRATION:
 * ✅ DO: Modify THIS file (core.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchCore() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add year filtering → Update query string construction
 * - Add repository filtering → Use repositoryId parameter
 * - Extract full-text → Parse downloadUrl from response
 * - Add OAI-PMH metadata → Parse oai field
 * - Add citation enrichment → Integrate OpenAlex/Semantic Scholar
 *
 * WRAPPER METHOD (literature.service.ts):
 * Should remain a thin 15-line wrapper that only handles orchestration
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles CORE API
 * 2. Dependency Injection: HttpService + ConfigService injected
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used for OA discovery, repository analysis
 * 8. Maintainability: All CORE logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 250M+ open access papers (largest OA aggregator)
 * API: Requires free API key (10 requests/second with key)
 * Features:
 * - Full-text access URLs when available
 * - Repository metadata and provenance
 * - OAI-PMH identifiers for harvesting
 * - DOI and other persistent identifiers
 * - Author information with affiliations
 * - Open access status (all papers are OA)
 * - Download URLs for PDFs
 *
 * API Benefits:
 * - Largest open access corpus in the world
 * - Aggregates from 10,000+ repositories worldwide
 * - Full-text search capabilities
 * - Deduplication across repositories
 * - Comprehensive metadata enrichment
 *
 * @see https://core.ac.uk/services/api
 * @see https://api.core.ac.uk/docs/v3
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// Phase 10.106 Phase 3: Retry Service Integration - Enterprise-grade resilience
import { RetryService } from '../../../common/services/retry.service';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { FAST_API_TIMEOUT } from '../constants/http-config.constants';

export interface CoreSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  offset?: number;
}

/**
 * Phase 10.106 Phase 3: Typed interface for CORE API search parameters
 * Netflix-grade: No loose `any` types
 */
interface CoreSearchParams {
  q: string;
  limit: number;
  offset: number;
  'yearPublished.gte'?: number;
  'yearPublished.lte'?: number;
}

/**
 * Phase 10.106 Phase 3: Typed interface for CORE API response item
 * Netflix-grade: Explicit typing for API response parsing
 */
interface CoreApiItem {
  id?: string | number;
  title?: string;
  abstract?: string;
  yearPublished?: number;
  authors?: Array<{ name?: string }>;
  doi?: string;
  sourceFulltextUrls?: string[];
  downloadUrl?: string;
  links?: Array<{ type?: string; url?: string }>;
  publisher?: string;
  repositoryDocument?: {
    repositories?: Array<{ name?: string }>;
  };
}

/**
 * Phase 10.106 Phase 3: Typed interface for CORE API response
 * Netflix-grade: Full response typing
 */
interface CoreApiResponse {
  results?: CoreApiItem[];
  totalHits?: number;
}

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);
  private readonly API_BASE_URL = 'https://api.core.ac.uk/v3';
  private readonly apiKey: string;

  // Phase 10.106 Phase 3: Inject RetryService for enterprise-grade resilience
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly retry: RetryService,
  ) {
    // Phase 10.7.10: CORE API key from environment (10 req/sec)
    this.apiKey = this.configService.get<string>('CORE_API_KEY') || '';
    if (this.apiKey) {
      this.logger.log('[CORE] API key configured - using authenticated limits (10 req/sec)');
    } else {
      this.logger.warn('[CORE] No API key - CORE source disabled');
    }
  }

  /**
   * Search CORE database using API v3
   *
   * Phase 10.106 Phase 3: Refactored to use centralized RetryService
   * instead of custom retry logic (DRY principle)
   *
   * @param query Search query string (supports CORE query language)
   * @param options Search filters (year range, limit, pagination)
   * @returns Array of Paper objects with full-text URLs
   */
  async search(query: string, options?: CoreSearchOptions): Promise<Paper[]> {
    // CORE requires API key - exit early if not configured
    if (!this.apiKey) {
      this.logger.warn('[CORE] Search skipped - no API key configured');
      return [];
    }

    this.logger.log(`[CORE] Searching: "${query}"`);

    try {
      // Construct typed query parameters
      const params: CoreSearchParams = {
        q: query,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      };

      // Add year filtering as query parameters
      if (options?.yearFrom) {
        params['yearPublished.gte'] = options.yearFrom;
      }
      if (options?.yearTo) {
        params['yearPublished.lte'] = options.yearTo;
      }

      // Phase 10.106 Phase 3: Execute HTTP request with centralized retry + exponential backoff
      // Retry policy: 3 attempts, 1s → 2s → 4s delays, 0-500ms jitter
      // Retryable errors: Network failures, timeouts, server errors (500-599)
      const result = await this.retry.executeWithRetry(
        async () => firstValueFrom(
          this.httpService.get(`${this.API_BASE_URL}/search/works/`, {
            params,
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: FAST_API_TIMEOUT, // 10s timeout
          }),
        ),
        'CORE.searchPapers',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          backoffMultiplier: 2,
          jitterMs: 500,
        },
      );

      // Phase 10.106 Phase 3: Handle both direct data and wrapped AxiosResponse cases
      // Same fix pattern as ERIC/PMC services - unwrap if needed
      const rawData = result.data;
      const apiData: CoreApiResponse = (rawData as any)?.data ?? rawData;
      const results: CoreApiItem[] = apiData?.results || [];
      const papers = results
        .map((item) => this.parsePaper(item))
        .filter((paper): paper is Paper => paper !== null);

      this.logger.log(`[CORE] Returned ${papers.length} papers`);
      return papers;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      const status = err.response?.status;

      if (status === 401) {
        this.logger.error(`[CORE] ⚠️  UNAUTHORIZED (401) - Invalid API key`);
      } else if (status === 429) {
        this.logger.error(`[CORE] ⚠️  RATE LIMITED (429) - Exceeded 10 req/sec`);
      } else if (status === 500) {
        this.logger.error(`[CORE] ❌ HTTP 500 - Elasticsearch cluster overloaded`);
      } else {
        this.logger.error(`[CORE] Search failed: ${err.message || 'Unknown error'} (Status: ${status || 'N/A'})`);
      }

      return [];
    }
  }

  /**
   * Parse CORE API response into Paper object
   * Phase 10.106 Phase 3: Uses typed CoreApiItem interface
   *
   * @param item CORE API result item (typed)
   * @returns Paper object or null if invalid
   */
  private parsePaper(item: CoreApiItem): Paper | null {
    try {
      // ========================================================================
      // STEP 1: Extract core metadata
      // ========================================================================
      const id = item.id?.toString() || '';
      const title = item.title || 'Untitled';
      const abstract = item.abstract || '';
      const year = item.yearPublished || undefined;

      // Skip if no title (invalid paper)
      if (!title || title === 'Untitled') {
        return null;
      }

      // ========================================================================
      // STEP 2: Extract authors
      // ========================================================================
      // Phase 10.106 Strict Mode: Use typed interface instead of any
      const authors: string[] = [];
      if (item.authors && Array.isArray(item.authors)) {
        authors.push(...item.authors.map((author) => author.name || 'Unknown Author'));
      }

      // ========================================================================
      // STEP 3: Extract URLs and identifiers
      // ========================================================================
      const doi = item.doi || '';
      const url = item.doi ? `https://doi.org/${item.doi}` : item.sourceFulltextUrls?.[0] || '';

      // Full-text download URL (CORE's unique feature!)
      // Phase 10.106 Strict Mode: Use typed interface instead of any
      const pdfUrl = item.downloadUrl || item.links?.find((link) => link.type === 'download')?.url || '';

      // ========================================================================
      // STEP 4: Extract repository and source info
      // ========================================================================
      const source = item.publisher || item.repositoryDocument?.repositories?.[0]?.name || 'CORE';

      // ========================================================================
      // STEP 5: Calculate quality metrics
      // ========================================================================
      const abstractWordCount = calculateAbstractWordCount(abstract);
      const wordCount = calculateComprehensiveWordCount(title, abstract);
      const wordCountExcludingRefs = wordCount;

      // Calculate quality score
      const qualityComponents = calculateQualityScore({
        citationCount: 0, // CORE doesn't provide citation counts
        year,
        wordCount,
        venue: source,
        source: LiteratureSource.CORE,
        impactFactor: null,
        sjrScore: null,
      });

      // Phase 10.7.10: REMOVED EARLY FILTER - Let papers be returned with isEligible flag
      // Papers will be filtered later in the pipeline if needed, but we don't throw them away here
      // This matches the pattern used by other sources (CrossRef, ArXiv, etc.)

      // Build paper object
      return {
        id,
        title,
        authors,
        year,
        abstract,
        source: LiteratureSource.CORE,
        url,
        doi,
        citationCount: 0, // CORE doesn't provide citation counts
        isOpenAccess: true, // All CORE papers are open access
        pdfUrl,
        abstractWordCount,
        wordCount,
        wordCountExcludingRefs,
        // FIX: API sources without full text only have title+abstract (~200-300 words)
        // Use lower threshold (150 words) instead of default (1000 words)
        isEligible: isPaperEligible(wordCount, 150),
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50,
      };
    } catch (error: unknown) {
      // Phase 10.106 Strict Mode: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.error(`[CORE] Failed to parse paper: ${err.message || 'Unknown error'}`);
      return null;
    }
  }
}
