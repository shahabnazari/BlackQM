/**
 * Semantic Scholar Service
 * Phase 10.6 Day 3.5: Extracted from literature.service.ts (lines 464-600)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service was extracted from a 4,046-line God class (literature.service.ts)
 * to follow the Single Responsibility Principle and establish a clean architecture
 * for integrating 19 academic sources without creating technical debt.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - 136 lines of inline implementation in literature.service.ts
 * - HTTP logic, parsing, and mapping all embedded in orchestration layer
 * - Impossible to unit test in isolation
 * - Code duplication across similar sources
 * - Adding new sources = God class grows even larger
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Dedicated service class with single responsibility
 * - Can be unit tested in isolation (mock HttpService)
 * - Reusable for other features (citation analysis, paper enrichment)
 * - literature.service.ts only contains thin 15-line wrapper
 * - Adding new sources = new service file, NOT growing God class
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY SEMANTIC SCHOLAR INTEGRATION:
 * ✅ DO: Modify THIS file (semantic-scholar.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchSemanticScholar() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add new API fields → Update line 59 'fields' parameter
 * - Change parsing logic → Update parsePaper() method (line 97)
 * - Add caching → Add cache check in search() method before HTTP call
 * - Add rate limiting → Inject APIQuotaMonitorService in constructor
 *
 * WRAPPER METHOD (literature.service.ts):
 * The searchSemanticScholar() method should remain a thin 15-line wrapper:
 * ```typescript
 * private async searchSemanticScholar(dto: SearchLiteratureDto) {
 *   try {
 *     return await this.semanticScholarService.search(dto.query, {...});
 *   } catch (error) {
 *     this.logger.error(`[Semantic Scholar] Failed: ${error.message}`);
 *     return [];
 *   }
 * }
 * ```
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles Semantic Scholar API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All Semantic Scholar logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 200M+ research papers across all disciplines
 * API: Free, no key required (100 requests per 5 minutes)
 * Features:
 * - Rich metadata (citations, venues, fields of study)
 * - Open access PDF detection
 * - PMC fallback for full-text access
 * - Quality scoring and word count metrics
 * - Author information with structured names
 * - External IDs (DOI, PMID, ArXiv, etc.)
 *
 * @see https://api.semanticscholar.org/
 * @see https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data/operation/get_graph_get_paper_search
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
// Phase 10.102 Phase 3.1: Retry Service Integration - Enterprise-grade resilience
import { RetryService } from '../../../common/services/retry.service';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { FAST_API_TIMEOUT } from '../constants/http-config.constants';

/**
 * Phase 10.106 Phase 6: Typed interface for Semantic Scholar author
 * Netflix-grade: No loose `any` types
 */
interface SemanticScholarAuthor {
  authorId?: string;
  name: string;
}

/**
 * Phase 10.106 Phase 6: Typed interface for Semantic Scholar API paper
 * Netflix-grade: Explicit typing for API response parsing
 */
interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  authors?: SemanticScholarAuthor[];
  year?: number;
  venue?: string;
  citationCount?: number;
  fieldsOfStudy?: string[];
  url?: string;
  externalIds?: {
    DOI?: string;
    PubMed?: string;
    PubMedCentral?: string;
    ArXiv?: string;
  };
  openAccessPdf?: {
    url?: string;
  };
}

export interface SemanticScholarSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

/**
 * Semantic Scholar API request parameters
 * @see https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data
 */
interface SemanticScholarSearchParams {
  query: string;
  fields: string;
  limit: number;
  year?: string;
}

@Injectable()
export class SemanticScholarService {
  private readonly logger = new Logger(SemanticScholarService.name);
  private readonly API_BASE_URL = 'https://api.semanticscholar.org/graph/v1';

  /**
   * Semantic Scholar API maximum results per request.
   * Requesting more than 100 causes HTTP 500 Internal Server Error.
   * @see https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data/operation/get_graph_get_paper_search
   */
  private readonly MAX_RESULTS_PER_REQUEST = 100;

  /** Default limit when none specified - Phase 10.115: Increased to API max */
  private readonly DEFAULT_LIMIT = 100;

  /** API fields to request - comprehensive metadata for paper analysis */
  // Phase 10.105 Day 5: API field compatibility fixes
  // - Removed 'openAccessPdf' - causes API to return 0 results
  // - Removed 'isOpenAccess' - combination with externalIds breaks API
  // PDF URLs and open access status now derived from externalIds (PMC IDs)
  private readonly API_FIELDS =
    'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy,externalIds';

  // Phase 10.102 Phase 3.1: Inject RetryService for automatic retry with exponential backoff
  constructor(
    private readonly httpService: HttpService,
    private readonly retry: RetryService,
  ) {}

  /**
   * Search Semantic Scholar database
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new API fields: Update API_FIELDS class constant
   * - To add filters: Add to params object in this method
   * - To add caching: Insert cache check before HTTP call
   * - To add rate limiting: Inject APIQuotaMonitorService in constructor
   * - To change error handling: Modify catch block below
   *
   * @param query Search query string (must be non-empty)
   * @param options Search filters (year range, limit)
   * @returns Array of Paper objects (empty array on error for graceful degradation)
   */
  async search(
    query: string,
    options?: SemanticScholarSearchOptions,
  ): Promise<Paper[]> {
    // Input validation: empty queries waste API quota
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      this.logger.warn('[Semantic Scholar] Empty query provided, returning empty result');
      return [];
    }

    try {
      // Cap limit at API maximum (100) to prevent HTTP 500 errors
      // The tier allocation system may request 600 papers, but API only supports 100
      const requestedLimit = options?.limit ?? this.DEFAULT_LIMIT;
      const cappedLimit = Math.min(requestedLimit, this.MAX_RESULTS_PER_REQUEST);

      if (requestedLimit > this.MAX_RESULTS_PER_REQUEST) {
        this.logger.warn(
          `[Semantic Scholar] Requested ${requestedLimit} papers, capped to ${cappedLimit} (API limit)`,
        );
      }

      this.logger.log(`[Semantic Scholar] Searching: "${trimmedQuery}" (limit: ${cappedLimit})`);

      // Build typed request parameters
      const url = `${this.API_BASE_URL}/paper/search`;
      const params: SemanticScholarSearchParams = {
        query: trimmedQuery,
        fields: this.API_FIELDS,
        limit: cappedLimit,
      };

      // Year range filter (format: YYYY-YYYY)
      if (options?.yearFrom || options?.yearTo) {
        params.year =
          `${options.yearFrom || 1900}-${options.yearTo || new Date().getFullYear()}`;
      }

      // Phase 10.102 Phase 3.1: Execute HTTP request with automatic retry + exponential backoff
      // Retry policy: 3 attempts, 1s → 2s → 4s delays, 0-500ms jitter
      // Retryable errors: Network failures, timeouts, rate limits (429), server errors (500-599)
      // Phase 10.105: Production-ready with full RetryService integration
      const result = await this.retry.executeWithRetry(
        async () => firstValueFrom(
          this.httpService.get(url, {
            params,
            timeout: FAST_API_TIMEOUT, // 10s timeout
          }),
        ),
        'SemanticScholar.searchPapers',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          backoffMultiplier: 2,
          jitterMs: 500,
        },
      );

      // Parse each paper from successful API response
      // 📝 TO CHANGE PARSING: Update parsePaper() method below
      // Phase 10.105: Production-ready with correct RetryResult unwrapping

      // RetryResult structure: { data: AxiosResponse, attempts: number }
      // AxiosResponse structure: { data: SemanticScholarResponse, status, ... }
      // SemanticScholarResponse: { data: Paper[], total: number }

      const apiResponse = result.data.data; // Unwrap: RetryResult -> AxiosResponse -> API JSON

      if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        this.logger.warn(
          `[Semantic Scholar] API returned invalid response structure. ` +
          `Expected data array, got: ${apiResponse && apiResponse.data ? typeof apiResponse.data : 'undefined'}`
        );
        return [];
      }

      // Phase 10.106 Phase 6: Use typed SemanticScholarPaper interface (Netflix-grade)
      const papers = apiResponse.data.map((paper: SemanticScholarPaper) =>
        this.parsePaper(paper),
      );

      this.logger.log(
        `[Semantic Scholar] Found ${papers.length} papers (attempts: ${result.attempts})`,
      );
      return papers;
    } catch (error: unknown) {
      // Phase 10.106 Phase 6: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string };
      // This catch block should rarely execute (retry service handles most errors)
      // Only catches unexpected errors outside retry logic
      this.logger.error(
        `[Semantic Scholar] Unexpected error: ${err.message || 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Parse Semantic Scholar API response into Paper object
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new Paper fields: Update return object below (line 220-248)
   * - To change quality algorithm: Modify calculateQualityScore() params (line 192)
   * - To add new metadata extraction: Add parsing logic after line 188
   * - To change PDF detection: Modify logic at line 201-211
   *
   * 📊 QUALITY METRICS CALCULATED:
   * 1. Word counts (title + abstract, excluding references)
   * 2. Quality score (0-100 based on citations, age, content depth)
   * 3. Citations per year (impact velocity metric)
   * 4. Eligibility (meets minimum word count threshold)
   *
   * 🔍 PDF DETECTION STRATEGY:
   * 1. Primary: Use Semantic Scholar's openAccessPdf.url
   * 2. Fallback: Construct PMC URL if PubMedCentral ID present
   * 3. Future: Could add Unpaywall API fallback for DOIs
   *
   * @param paper Typed API response object from Semantic Scholar
   * @returns Normalized Paper object following application schema
   * Phase 10.106 Phase 6: Use typed SemanticScholarPaper interface (Netflix-grade)
   */
  private parsePaper(paper: SemanticScholarPaper): Paper {
    // ============================================================================
    // STEP 1: Calculate word counts for content depth analysis
    // ============================================================================
    // 📝 TO CHANGE WORD COUNTING: Modify word-count.util.ts functions
    const abstractWordCount = calculateAbstractWordCount(paper.abstract);
    const wordCount = calculateComprehensiveWordCount(
      paper.title,
      paper.abstract,
    );
    const wordCountExcludingRefs = wordCount; // Already excludes non-content

    // ============================================================================
    // STEP 2: Calculate quality score (0-100 scale)
    // ============================================================================
    // 📝 TO CHANGE QUALITY ALGORITHM: Modify paper-quality.util.ts
    // 📝 TO ADD JOURNAL METRICS: Integrate OpenAlexEnrichmentService
    const qualityComponents = calculateQualityScore({
      citationCount: paper.citationCount,
      year: paper.year,
      wordCount,
      venue: paper.venue,
      source: LiteratureSource.SEMANTIC_SCHOLAR,
      impactFactor: null, // TODO: Enrich from OpenAlex (see PubMed service example)
      sjrScore: null,     // TODO: Add SJR (Scimago Journal Rank)
      quartile: null,     // TODO: Add journal quartile (Q1-Q4)
      hIndexJournal: null, // TODO: Add journal h-index
    });

    // ============================================================================
    // STEP 3: PDF detection with intelligent fallback strategy
    // ============================================================================
    // Phase 10.105 Day 5: openAccessPdf field removed from API (causes 0 results)
    // Now using PMC ID fallback as primary PDF source
    let pdfUrl: string | null = null;
    let hasPdf = false;

    // PRIMARY STRATEGY: Check if paper is in PubMed Central (reliable PDF source)
    if (paper.externalIds?.PubMedCentral) {
      const pmcId = paper.externalIds.PubMedCentral;
      pdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`;
      hasPdf = true;
    }

    // FUTURE: Could add Unpaywall API lookup for DOIs
    // FUTURE: Could add ArXiv PDF URL for ArXiv papers

    // ============================================================================
    // STEP 4: Construct normalized Paper object
    // ============================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    // Phase 10.106: Sanitize abstract to remove XML/HTML tags that break JSON serialization
    const sanitizedAbstract = this.sanitizeAbstract(paper.abstract);

    // See: backend/src/modules/literature/dto/literature.dto.ts
    return {
      // Core identification
      id: paper.paperId,
      title: paper.title,
      // Phase 10.106 Phase 6: Use typed SemanticScholarAuthor (Netflix-grade)
      authors: paper.authors?.map((a: SemanticScholarAuthor) => a.name) || [],
      year: paper.year,
      abstract: sanitizedAbstract,

      // External identifiers (critical for cross-referencing)
      // Phase 10.106 Phase 6: Use undefined instead of null for Paper interface compatibility
      doi: paper.externalIds?.DOI || undefined,
      pmid: paper.externalIds?.PubMed || undefined, // For PMC full-text lookup
      url: paper.url,

      // Publication metadata
      venue: paper.venue,
      citationCount: paper.citationCount,
      fieldsOfStudy: paper.fieldsOfStudy,
      source: LiteratureSource.SEMANTIC_SCHOLAR,

      // Content metrics (Phase 10 Day 5.13+)
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount, 150),
      abstractWordCount,

      // PDF and full-text availability (Phase 10 Day 5.17+)
      // Phase 10.105 Day 5: isOpenAccess removed from API fields - derive from hasPdf instead
      pdfUrl,
      openAccessStatus: hasPdf ? 'OPEN_ACCESS' : null,
      hasPdf,
      hasFullText: hasPdf,
      fullTextStatus: hasPdf ? 'available' : 'not_fetched',
      fullTextSource: hasPdf
        ? paper.externalIds?.PubMedCentral
          ? 'pmc'
          : 'publisher'
        : undefined,

      // Quality metrics (Phase 10 Day 5.13+, Phase 10.1 Day 12)
      citationsPerYear:
        qualityComponents.citationImpact > 0
          ? (paper.citationCount || 0) /
            Math.max(
              1,
              new Date().getFullYear() -
                (paper.year || new Date().getFullYear()),
            )
          : 0,
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
      // Phase 10.120: Add metadataCompleteness for honest scoring transparency
      metadataCompleteness: qualityComponents.metadataCompleteness,
    };
  }

  /**
   * Phase 10.106: Sanitize abstract to remove XML/HTML tags
   * Some sources return abstracts with markup that breaks JSON serialization
   */
  private sanitizeAbstract(abstract: string | undefined | null): string | undefined {
    if (!abstract) return undefined;

    // Remove all XML/HTML tags and normalize whitespace
    return abstract
      .replace(/<[^>]*>/g, '') // Remove all tags
      .replace(/&lt;/g, '<')   // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Check if Semantic Scholar service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
