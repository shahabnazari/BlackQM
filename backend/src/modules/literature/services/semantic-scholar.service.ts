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
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { FAST_API_TIMEOUT } from '../constants/http-config.constants';

export interface SemanticScholarSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

@Injectable()
export class SemanticScholarService {
  private readonly logger = new Logger(SemanticScholarService.name);
  private readonly API_BASE_URL = 'https://api.semanticscholar.org/graph/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search Semantic Scholar database
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new API fields: Update 'fields' parameter below (line 133)
   * - To add filters: Add to params object (line 131-136)
   * - To add caching: Insert cache check before HTTP call
   * - To add rate limiting: Inject APIQuotaMonitorService in constructor
   * - To change error handling: Modify catch block (line 147-157)
   *
   * @param query Search query string
   * @param options Search filters (year range, limit)
   * @returns Array of Paper objects (empty array on error for graceful degradation)
   */
  async search(
    query: string,
    options?: SemanticScholarSearchOptions,
  ): Promise<Paper[]> {
    try {
      this.logger.log(`[Semantic Scholar] Searching: "${query}"`);

      // API endpoint configuration
      const url = `${this.API_BASE_URL}/paper/search`;
      const params: any = {
        query,
        // 📝 TO ADD NEW FIELDS: Update this comma-separated string
        // Available fields: https://api.semanticscholar.org/api-docs/graph#tag/Paper-Data
        fields:
          'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy,openAccessPdf,isOpenAccess,externalIds',
        limit: options?.limit || 20,
      };

      // Year range filter (format: YYYY-YYYY)
      if (options?.yearFrom || options?.yearTo) {
        params['year'] =
          `${options.yearFrom || 1900}-${options.yearTo || new Date().getFullYear()}`;
      }

      // Execute HTTP request
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          timeout: FAST_API_TIMEOUT, // 10s - Phase 10.6 Day 14.5: Added timeout (was missing)
        }),
      );

      // Parse each paper from API response
      // 📝 TO CHANGE PARSING: Update parsePaper() method below (line 162)
      const papers = response.data.data.map((paper: any) =>
        this.parsePaper(paper),
      );

      this.logger.log(`[Semantic Scholar] Found ${papers.length} papers`);
      return papers;
    } catch (error: any) {
      // Enterprise-grade error handling: Log but don't throw (graceful degradation)
      // 📝 TO ADD CUSTOM ERROR HANDLING: Add specific error type checks here
      if (error.response?.status === 429) {
        this.logger.error(
          `[Semantic Scholar] ⚠️  RATE LIMITED (429) - Too many requests`,
        );
      } else {
        this.logger.error(
          `[Semantic Scholar] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
        );
      }
      // Return empty array instead of throwing - allows other sources to succeed
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
   * @param paper Raw API response object from Semantic Scholar
   * @returns Normalized Paper object following application schema
   */
  private parsePaper(paper: any): Paper {
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
    let pdfUrl = paper.openAccessPdf?.url || null;
    let hasPdf = !!pdfUrl && pdfUrl.trim().length > 0;

    // FALLBACK STRATEGY: If no direct PDF but paper is in PubMed Central
    // 📝 TO ADD MORE FALLBACKS: Add additional checks here (e.g., Unpaywall API)
    if (!hasPdf && paper.externalIds?.PubMedCentral) {
      const pmcId = paper.externalIds.PubMedCentral;
      pdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`;
      hasPdf = true;
      this.logger.log(
        `[Semantic Scholar] PMC fallback for paper ${paper.paperId}: ${pdfUrl}`,
      );
    }

    // ============================================================================
    // STEP 4: Construct normalized Paper object
    // ============================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    // See: backend/src/modules/literature/dto/literature.dto.ts
    return {
      // Core identification
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors?.map((a: any) => a.name) || [], // ✅ Fixed Day 3: Returns string[]
      year: paper.year,
      abstract: paper.abstract,

      // External identifiers (critical for cross-referencing)
      doi: paper.externalIds?.DOI || null,
      pmid: paper.externalIds?.PubMed || null, // For PMC full-text lookup
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
      pdfUrl,
      openAccessStatus: paper.isOpenAccess || hasPdf ? 'OPEN_ACCESS' : null,
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
    };
  }

  /**
   * Check if Semantic Scholar service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
