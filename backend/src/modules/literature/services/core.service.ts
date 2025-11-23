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

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);
  private readonly API_BASE_URL = 'https://api.core.ac.uk/v3';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
   * ⚠️ MODIFICATION GUIDE:
   * - To add year filters: Modify query string to include yearPublished
   * - To add repository filter: Use repositoryId in query
   * - To change result limit: Modify limit parameter
   * - To add pagination: Use offset parameter
   * - To filter by license: Add license filter to query
   *
   * 🔍 QUERY SYNTAX EXAMPLES:
   * - title:"machine learning" → Search in titles
   * - fullText:quantum → Search full text
   * - authors.name:"Einstein" → Filter by author
   * - yearPublished>=2020 → Year filtering
   * - yearPublished:[2015 TO 2020] → Year range
   * - subjects:Medicine → Subject filtering
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

    // Phase 10.8: Use retry logic to handle Elasticsearch infrastructure failures
    return this.searchWithRetry(query, options);
  }

  /**
   * Execute CORE search with retry logic for infrastructure failures
   *
   * Phase 10.8: CORE's Elasticsearch cluster frequently returns HTTP 500 when shards
   * are overloaded (es_rejected_execution_exception). Retry with exponential backoff
   * to improve reliability without changing our code when CORE has capacity issues.
   *
   * RETRY STRATEGY:
   * - Max 3 attempts (initial + 2 retries)
   * - Exponential backoff: 1s, 2s between retries
   * - Only retry HTTP 500 (infrastructure errors)
   * - Don't retry 401 (auth), 429 (rate limit), or other errors
   *
   * @param query Search query string
   * @param options Search filters
   * @param attempt Current attempt number (for recursion)
   * @returns Array of Paper objects
   */
  private async searchWithRetry(
    query: string,
    options?: CoreSearchOptions,
    attempt: number = 1,
  ): Promise<Paper[]> {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAYS = [1000, 2000]; // 1s, 2s

    try {
      // ========================================================================
      // STEP 1: Construct query parameters
      // ========================================================================
      // Phase 10.8: Use query parameters for year filtering (not query string syntax)
      // CORE API requires yearPublished.gte/lte parameters, NOT query string syntax
      const params: any = {
        q: query,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      };

      // Add year filtering as query parameters (not in query string)
      if (options?.yearFrom) {
        params['yearPublished.gte'] = options.yearFrom;
      }
      if (options?.yearTo) {
        params['yearPublished.lte'] = options.yearTo;
      }

      // ========================================================================
      // STEP 2: Execute API request
      // ========================================================================

      const response = await firstValueFrom(
        this.httpService.get(`${this.API_BASE_URL}/search/works/`, {
          params,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: FAST_API_TIMEOUT, // 10s timeout
        }),
      );

      // ========================================================================
      // STEP 3: Parse response
      // ========================================================================
      const results = response.data.results || [];
      const papers = results
        .map((item: any) => this.parsePaper(item))
        .filter((paper: Paper | null) => paper !== null);

      // Log success (especially important if this was a retry)
      if (attempt > 1) {
        this.logger.log(`[CORE] ✅ Retry succeeded on attempt ${attempt} - returned ${papers.length} papers`);
      } else {
        this.logger.log(`[CORE] Returned ${papers.length} papers`);
      }

      return papers;
    } catch (error: any) {
      const status = error.response?.status;

      // ========================================================================
      // RETRY LOGIC: Only retry HTTP 500 (Elasticsearch infrastructure failures)
      // ========================================================================
      if (status === 500 && attempt < MAX_ATTEMPTS) {
        const delay = RETRY_DELAYS[attempt - 1];
        this.logger.warn(
          `[CORE] ⚠️  HTTP 500 (Elasticsearch overload) - Retry ${attempt}/${MAX_ATTEMPTS - 1} in ${delay}ms`,
        );

        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));

        // Recursive retry
        return this.searchWithRetry(query, options, attempt + 1);
      }

      // ========================================================================
      // TERMINAL ERRORS: Don't retry these
      // ========================================================================
      if (status === 401) {
        this.logger.error(`[CORE] ⚠️  UNAUTHORIZED (401) - Invalid API key`);
      } else if (status === 429) {
        this.logger.error(`[CORE] ⚠️  RATE LIMITED (429) - Exceeded 10 req/sec`);
      } else if (status === 500) {
        this.logger.error(
          `[CORE] ❌ HTTP 500 failed after ${attempt} attempts - Elasticsearch cluster overloaded`,
        );
      } else {
        this.logger.error(
          `[CORE] Search failed: ${error.message} (Status: ${status || 'N/A'})`,
        );
      }

      return [];
    }
  }

  /**
   * Parse CORE API response into Paper object
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To extract full-text: Use downloadUrl field
   * - To get repository info: Parse repositoryDocument object
   * - To get OAI ID: Parse oai field
   * - To extract topics: Parse topics array
   * - To get language: Parse language field
   *
   * 📊 PARSING STEPS:
   * 1. Core metadata (ID, title, abstract, year)
   * 2. Authors (names and affiliations)
   * 3. URLs (DOI, PDF download URL)
   * 4. Repository metadata
   * 5. Quality scoring and word counts
   *
   * @param item CORE API result item
   * @returns Paper object or null if invalid
   */
  private parsePaper(item: any): Paper | null {
    try {
      // ========================================================================
      // STEP 1: Extract core metadata
      // ========================================================================
      const id = item.id?.toString() || '';
      const title = item.title || 'Untitled';
      const abstract = item.abstract || '';
      const year = item.yearPublished || null;

      // Skip if no title (invalid paper)
      if (!title || title === 'Untitled') {
        return null;
      }

      // ========================================================================
      // STEP 2: Extract authors
      // ========================================================================
      const authors: string[] = [];
      if (item.authors && Array.isArray(item.authors)) {
        authors.push(...item.authors.map((author: any) => author.name || 'Unknown Author'));
      }

      // ========================================================================
      // STEP 3: Extract URLs and identifiers
      // ========================================================================
      const doi = item.doi || '';
      const url = item.doi ? `https://doi.org/${item.doi}` : item.sourceFulltextUrls?.[0] || '';

      // Full-text download URL (CORE's unique feature!)
      const pdfUrl = item.downloadUrl || item.links?.find((link: any) => link.type === 'download')?.url || '';

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
    } catch (error: any) {
      this.logger.error(`[CORE] Failed to parse paper: ${error.message}`);
      return null;
    }
  }
}
