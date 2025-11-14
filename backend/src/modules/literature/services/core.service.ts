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
    try {
      // CORE requires API key - exit early if not configured
      if (!this.apiKey) {
        this.logger.warn('[CORE] Search skipped - no API key configured');
        return [];
      }

      this.logger.log(`[CORE] Searching: "${query}"`);

      // ========================================================================
      // STEP 1: Construct query with filters
      // ========================================================================
      let coreQuery = query;

      // Add year filtering if provided
      if (options?.yearFrom && options?.yearTo) {
        coreQuery = `${query} AND yearPublished:[${options.yearFrom} TO ${options.yearTo}]`;
      } else if (options?.yearFrom) {
        coreQuery = `${query} AND yearPublished>=${options.yearFrom}`;
      } else if (options?.yearTo) {
        coreQuery = `${query} AND yearPublished<=${options.yearTo}`;
      }

      // ========================================================================
      // STEP 2: Execute API request
      // ========================================================================
      const params = {
        q: coreQuery,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.API_BASE_URL}/search/works`, {
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

      this.logger.log(`[CORE] Returned ${papers.length} papers`);
      return papers;
    } catch (error: any) {
      // Enterprise-grade error handling: Log but don't throw
      if (error.response?.status === 401) {
        this.logger.error(`[CORE] ⚠️  UNAUTHORIZED (401) - Invalid API key`);
      } else if (error.response?.status === 429) {
        this.logger.error(`[CORE] ⚠️  RATE LIMITED (429) - Exceeded 10 req/sec`);
      } else {
        this.logger.error(
          `[CORE] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
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
      const publishedDate = item.publishedDate || item.yearPublished?.toString() || '';
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

      // Apply eligibility check (300+ word minimum)
      if (!isPaperEligible(wordCount)) {
        this.logger.debug(`[CORE] Paper filtered out: "${title}" (insufficient word count)`);
        return null;
      }

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
        isEligible: isPaperEligible(wordCount),
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50,
      };
    } catch (error: any) {
      this.logger.error(`[CORE] Failed to parse paper: ${error.message}`);
      return null;
    }
  }
}
