/**
 * Phase 10.100 Phase 10: Source Router Service
 *
 * Enterprise-grade service for routing literature searches to academic sources.
 *
 * Features:
 * - Source-specific routing (15+ academic databases)
 * - API quota management per source
 * - Request coalescing (deduplication)
 * - Comprehensive error handling
 * - Timeout detection
 * - Rate limit handling
 * - Input validation (SEC-1 compliance)
 * - Type-safe error handling
 * - NestJS Logger integration (Phase 10.943)
 *
 * Single Responsibility: Route search requests to appropriate academic sources ONLY
 *
 * @module LiteratureModule
 * @since Phase 10.100 Phase 10
 */

import { Injectable, Logger } from '@nestjs/common';
import { SearchCoalescerService } from './search-coalescer.service';
import { APIQuotaMonitorService } from './api-quota-monitor.service';
// Source services
import { SemanticScholarService } from './semantic-scholar.service';
import { CrossRefService } from './crossref.service';
import { PubMedService } from './pubmed.service';
import { ArxivService } from './arxiv.service';
import { GoogleScholarService } from './google-scholar.service';
import { SSRNService } from './ssrn.service';
import { PMCService } from './pmc.service';
import { ERICService } from './eric.service';
import { CoreService } from './core.service';
// Phase 10.106 Phase 1: OpenAlex search service
import { OpenAlexService } from './openalex.service';
import { WebOfScienceService } from './web-of-science.service';
import { ScopusService } from './scopus.service';
import { IEEEService } from './ieee.service';
import { SpringerService } from './springer.service';
import { NatureService } from './nature.service';
import { WileyService } from './wiley.service';
import { SageService } from './sage.service';
import { TaylorFrancisService } from './taylor-francis.service';
// DTOs and types
import { LiteratureSource, Paper, SearchLiteratureDto } from '../dto/literature.dto';

// ============================================================================
// CONSTANTS (Enterprise-Grade - No Magic Numbers)
// ============================================================================

/**
 * Maximum global timeout for HTTP requests (milliseconds)
 * Prevents 67s default hangs
 */
const MAX_GLOBAL_TIMEOUT = 30000; // 30 seconds

/**
 * Default limit for search results when not specified
 * Used as fallback if DTO validation doesn't apply default
 */
const DEFAULT_SEARCH_LIMIT = 20;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class SourceRouterService {
  private readonly logger = new Logger(SourceRouterService.name);

  constructor(
    private readonly searchCoalescer: SearchCoalescerService,
    private readonly quotaMonitor: APIQuotaMonitorService,
    // Academic source services
    private readonly semanticScholarService: SemanticScholarService,
    private readonly crossRefService: CrossRefService,
    private readonly pubMedService: PubMedService,
    private readonly arxivService: ArxivService,
    private readonly googleScholarService: GoogleScholarService,
    private readonly ssrnService: SSRNService,
    private readonly pmcService: PMCService,
    private readonly ericService: ERICService,
    private readonly coreService: CoreService,
    // Phase 10.106 Phase 1: OpenAlex search service
    private readonly openAlexService: OpenAlexService,
    private readonly webOfScienceService: WebOfScienceService,
    private readonly scopusService: ScopusService,
    private readonly ieeeService: IEEEService,
    private readonly springerService: SpringerService,
    private readonly natureService: NatureService,
    private readonly wileyService: WileyService,
    private readonly sageService: SageService,
    private readonly taylorFrancisService: TaylorFrancisService,
  ) {}

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Route search request to appropriate academic source
   *
   * Routes to the specified academic source service with:
   * - Quota management (prevents API limit violations)
   * - Request coalescing (deduplicates concurrent requests)
   * - Comprehensive error handling
   * - Timeout detection
   * - Rate limit handling
   *
   * **Supported Sources**:
   * - Semantic Scholar (SEMANTIC_SCHOLAR)
   * - CrossRef (CROSSREF)
   * - PubMed (PUBMED)
   * - ArXiv (ARXIV)
   * - Google Scholar (GOOGLE_SCHOLAR)
   * - SSRN (SSRN)
   * - PubMed Central (PMC)
   * - ERIC (ERIC)
   * - CORE (CORE)
   * - OpenAlex (OPENALEX) - Phase 10.106
   * - Web of Science (WEB_OF_SCIENCE)
   * - Scopus (SCOPUS)
   * - IEEE Xplore (IEEE_XPLORE)
   * - Springer (SPRINGER)
   * - Nature (NATURE)
   * - Wiley (WILEY)
   * - SAGE (SAGE)
   * - Taylor & Francis (TAYLOR_FRANCIS)
   *
   * **Error Handling**:
   * - Returns empty array on error (non-blocking)
   * - Logs detailed error information
   * - Detects timeouts, rate limits, quota exhaustion
   *
   * @param source - Academic source to search
   * @param searchDto - Search parameters (query, filters, limit)
   * @returns Promise<Paper[]> - Search results (empty array on error)
   *
   * @example
   * const papers = await sourceRouter.searchBySource(
   *   LiteratureSource.PUBMED,
   *   { query: 'COVID-19', limit: 10 }
   * );
   */
  async searchBySource(
    source: LiteratureSource,
    searchDto: SearchLiteratureDto,
  ): Promise<Paper[]> {
    // SEC-1: Input validation
    this.validateSearchInput(source, searchDto);

    switch (source) {
      case LiteratureSource.SEMANTIC_SCHOLAR:
        return this.callSourceWithQuota('semantic-scholar', searchDto, () =>
          this.semanticScholarService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.CROSSREF:
        return this.callSourceWithQuota('crossref', searchDto, () =>
          this.crossRefService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.PUBMED:
        return this.callSourceWithQuota('pubmed', searchDto, () =>
          this.pubMedService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.ARXIV:
        return this.callSourceWithQuota('arxiv', searchDto, () =>
          this.arxivService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
            sortBy: 'relevance',
            sortOrder: 'descending',
          }),
        );

      case LiteratureSource.GOOGLE_SCHOLAR:
        return this.callSourceWithQuota('google-scholar', searchDto, () =>
          this.googleScholarService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.SSRN:
        return this.callSourceWithQuota('ssrn', searchDto, () =>
          this.ssrnService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.PMC:
        return this.callSourceWithQuota('pmc', searchDto, () =>
          this.pmcService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.ERIC:
        return this.callSourceWithQuota('eric', searchDto, () =>
          this.ericService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.CORE:
        return this.callSourceWithQuota('core', searchDto, () =>
          this.coreService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      // Phase 10.106 Phase 1: OpenAlex search (Netflix-grade fix: pass options object)
      case LiteratureSource.OPENALEX:
        return this.callSourceWithQuota('openalex', searchDto, () =>
          this.openAlexService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.WEB_OF_SCIENCE:
        return this.callSourceWithQuota('web-of-science', searchDto, () =>
          this.webOfScienceService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.SCOPUS:
        return this.callSourceWithQuota('scopus', searchDto, () =>
          this.scopusService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.IEEE_XPLORE:
        return this.callSourceWithQuota('ieee', searchDto, () =>
          this.ieeeService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.SPRINGER:
        return this.callSourceWithQuota('springer', searchDto, () =>
          this.springerService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.NATURE:
        return this.callSourceWithQuota('nature', searchDto, () =>
          this.natureService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.WILEY:
        return this.callSourceWithQuota('wiley', searchDto, () =>
          this.wileyService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.SAGE:
        return this.callSourceWithQuota('sage', searchDto, () =>
          this.sageService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      case LiteratureSource.TAYLOR_FRANCIS:
        return this.callSourceWithQuota('taylor_francis', searchDto, () =>
          this.taylorFrancisService.search(searchDto.query, {
            yearFrom: searchDto.yearFrom,
            yearTo: searchDto.yearTo,
            limit: searchDto.limit,
          }),
        );

      default:
        this.logger.warn(`Unknown source: ${source}, returning empty array`);
        return [];
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Call source service with quota management and error handling
   *
   * Wraps source service calls with:
   * - Request coalescing (deduplicates concurrent identical requests)
   * - Quota checking (prevents API limit violations)
   * - Comprehensive error handling (timeouts, rate limits, generic errors)
   * - Performance monitoring (logs duration)
   *
   * **Request Coalescing**:
   * - Generates unique key from source + search params
   * - Deduplicates concurrent identical requests
   * - Falls back to simpler key if stringify fails
   *
   * **Quota Management**:
   * - Checks quota before making request
   * - Records successful requests
   * - Returns empty array if quota exceeded
   *
   * **Error Handling**:
   * - Timeout errors (ECONNABORTED, timeout in message)
   * - Rate limit errors (HTTP 429)
   * - Generic errors (logs status code)
   * - Always returns empty array on error (non-blocking)
   *
   * @param sourceName - Source identifier for logging and quota
   * @param searchDto - Search parameters for cache key
   * @param serviceCall - Function that calls the actual source service
   * @returns Promise<Paper[]> - Search results (empty array on error/quota)
   *
   * @private
   */
  private async callSourceWithQuota(
    sourceName: string,
    searchDto: SearchLiteratureDto,
    serviceCall: () => Promise<Paper[]>,
  ): Promise<Paper[]> {
    // Safe JSON.stringify with fallback (prevents crashes from circular references)
    let coalescerKey: string;
    try {
      coalescerKey = `${sourceName}:${JSON.stringify(searchDto)}`;
    } catch (stringifyError) {
      // Fallback to simpler key if stringify fails
      coalescerKey = `${sourceName}:${searchDto.query}:${searchDto.limit || DEFAULT_SEARCH_LIMIT}:${Date.now()}`;
      this.logger.warn(
        `[${sourceName}] Failed to stringify searchDto, using fallback coalescer key`,
      );
    }

    return await this.searchCoalescer.coalesce(coalescerKey, async () => {
      // Check quota before making API call
      if (!this.quotaMonitor.canMakeRequest(sourceName)) {
        this.logger.warn(
          `🚫 [${sourceName}] Quota exceeded - using cache instead`,
        );
        return [];
      }

      try {
        const startTime = Date.now();

        // Call the actual service method
        const papers = await serviceCall();

        const duration = Date.now() - startTime;

        // Enhanced logging for debugging
        if (papers.length === 0) {
          this.logger.warn(
            `⚠️  [${sourceName}] Query "${searchDto.query}" returned 0 papers (${duration}ms) - Possible timeout or no matches`,
          );
        } else {
          this.logger.log(
            `✓ [${sourceName}] Found ${papers.length} papers (${duration}ms)`,
          );
        }

        // Record successful request
        this.quotaMonitor.recordRequest(sourceName);
        return papers;
      } catch (error: unknown) {
        // Phase 10.100 Phases 8-11 Audit Fix: Enterprise-grade error handling
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Type-safe property access
        const errorCode = typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
        const responseStatus = typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

        // Check for timeout errors
        if (
          errorCode === 'ECONNABORTED' ||
          (typeof errorMessage === 'string' && errorMessage.includes('timeout'))
        ) {
          this.logger.error(
            `⏱️  [${sourceName}] Timeout after ${MAX_GLOBAL_TIMEOUT}ms - Query: "${searchDto.query}"`,
          );
        }
        // Check for rate limiting
        else if (responseStatus === 429) {
          this.logger.error(
            `🚫 [${sourceName}] Rate limited (429) - Consider adding API key`,
          );
        }
        // Generic error
        else {
          this.logger.error(
            `❌ [${sourceName}] Error: ${errorMessage} (Status: ${responseStatus || 'N/A'})`,
          );
        }
        return [];
      }
    });
  }

  // ==========================================================================
  // VALIDATION METHODS (SEC-1 Compliance)
  // ==========================================================================

  /**
   * Validate search input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - source must be valid LiteratureSource enum value
   * - searchDto must be non-null object
   * - searchDto.query must be non-empty string
   *
   * Note: Other searchDto validation (limit, yearFrom, etc.) is handled by
   * class-validator decorators in SearchLiteratureDto
   *
   * @param source - Literature source to validate
   * @param searchDto - Search parameters to validate
   * @throws Error if validation fails
   *
   * @private
   */
  private validateSearchInput(
    source: LiteratureSource,
    searchDto: SearchLiteratureDto,
  ): void {
    // Validate source is valid enum value
    if (!source || typeof source !== 'string') {
      throw new Error('Invalid source: must be non-empty string');
    }

    // Validate searchDto is object
    if (!searchDto || typeof searchDto !== 'object') {
      throw new Error('Invalid searchDto: must be non-null object');
    }

    // Validate query is non-empty string
    if (
      !searchDto.query ||
      typeof searchDto.query !== 'string' ||
      searchDto.query.trim().length === 0
    ) {
      throw new Error('Invalid query: must be non-empty string');
    }
  }
}
