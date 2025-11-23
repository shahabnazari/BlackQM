/**
 * arXiv Service
 * Phase 10.6 Day 3.5: Extracted from literature.service.ts (lines 907-1007)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service was extracted from a 4,046-line God class (literature.service.ts)
 * following the same clean pattern as semantic-scholar.service.ts, crossref.service.ts,
 * and pubmed.service.ts.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - 100 lines of inline implementation in literature.service.ts
 * - XML/RSS parsing logic embedded in orchestration layer
 * - Difficult to unit test (tightly coupled to God class)
 * - arXiv-specific logic scattered across codebase
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for preprint analysis features
 * - literature.service.ts only contains thin 15-line wrapper
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY ARXIV INTEGRATION:
 * ✅ DO: Modify THIS file (arxiv.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchArxiv() method
 * ❌ DON'T: Inline XML parsing or HTTP calls anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add category filtering → Update params object in search() method
 * - Change PDF URL handling → Update parsePaper() method
 * - Add author ORCID extraction → Parse author XML for orcid attribute
 * - Add version detection → Extract version from arxiv ID
 * - Add citation enrichment → Integrate OpenAlex like PubMed service
 *
 * WRAPPER METHOD (literature.service.ts):
 * Should remain a thin 15-line wrapper that only handles orchestration
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles arXiv API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used for preprint analysis, version tracking
 * 8. Maintainability: All arXiv logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 2.3M+ preprints (physics, math, CS, q-bio, q-fin, stats, eess, econ)
 * API: Free, no key required (Atom/RSS feed, 3 requests/second limit)
 * Features:
 * - Full-text PDF URLs for all papers
 * - Subject categories and classifications
 * - Author information (names, affiliations if provided)
 * - Version tracking (v1, v2, etc.)
 * - Cross-listing across categories
 * - DOI linking for published versions
 *
 * API Limitations:
 * - No citation counts (preprints, not yet widely cited)
 * - No journal metrics (not peer-reviewed)
 * - Quality scoring based on content depth only
 *
 * @see https://arxiv.org/help/api/user-manual
 * @see https://arxiv.org/help/api/basics
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

export interface ArxivSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  category?: string; // e.g., 'cs.AI', 'physics.atom-ph'
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
}

@Injectable()
export class ArxivService {
  private readonly logger = new Logger(ArxivService.name);
  private readonly API_BASE_URL = 'http://export.arxiv.org/api/query';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search arXiv database using Atom/RSS API
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add category filter: Use category parameter in options
   * - To change sort order: Modify sortBy/sortOrder parameters
   * - To add date filters: Add logic to parse published dates
   * - To extract PDF URLs: Already included in parsePaper() method
   * - To add version tracking: Parse arxiv ID for version number
   *
   * 🔍 SEARCH QUERY SYNTAX:
   * - all:quantum → Search all fields
   * - ti:quantum → Search titles only
   * - au:Einstein → Search authors only
   * - cat:cs.AI → Filter by category
   * - AND, OR, ANDNOT operators supported
   *
   * @param query Search query string (supports arXiv query syntax)
   * @param options Search filters (year range, limit, category, sort)
   * @returns Array of Paper objects (no citation data available)
   */
  async search(query: string, options?: ArxivSearchOptions): Promise<Paper[]> {
    try {
      this.logger.log(`[arXiv] Searching: "${query}"`);

      // ========================================================================
      // STEP 1: Construct API parameters
      // ========================================================================
      // 📝 TO ADD FILTERS: Update params object below
      const params: any = {
        search_query: `all:${query}`, // Search all fields by default
        max_results: options?.limit || 20,
        sortBy: options?.sortBy || 'relevance',
        sortOrder: options?.sortOrder || 'descending',
      };

      // Add category filter if provided
      // 📝 TO ADD MULTIPLE CATEGORIES: Use OR operator in search_query
      if (options?.category) {
        params.search_query = `cat:${options.category} AND all:${query}`;
      }

      // ========================================================================
      // STEP 2: Execute API request
      // ========================================================================
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          timeout: FAST_API_TIMEOUT, // 10s - Phase 10.6 Day 14.5: Added timeout (was missing)
        }),
      );

      // ========================================================================
      // STEP 3: Parse XML/Atom response
      // ========================================================================
      // 📝 TO CHANGE PARSING: Update parsePaper() method below (line 162)
      const data = response.data;
      const entries = data.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      const papers = entries.map((entry: string) => this.parsePaper(entry));

      this.logger.log(`[arXiv] Returned ${papers.length} papers`);
      return papers;
    } catch (error: any) {
      // Enterprise-grade error handling: Log but don't throw (graceful degradation)
      if (error.response?.status === 429) {
        this.logger.error(`[arXiv] ⚠️  RATE LIMITED (429) - Too many requests`);
      } else {
        this.logger.error(
          `[arXiv] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
        );
      }
      return [];
    }
  }

  /**
   * Parse arXiv Atom feed entry into Paper object
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To extract categories: Parse <category term="..."/> tags
   * - To extract version info: Parse arxiv ID for version number
   * - To extract DOI: Parse <arxiv:doi> tag if present
   * - To extract comments: Parse <arxiv:comment> tag
   * - To extract journal ref: Parse <arxiv:journal_ref> tag
   *
   * 📊 PARSING STEPS:
   * 1. Core metadata (ID, title, summary, published date)
   * 2. Authors (name only, affiliations rarely provided)
   * 3. PDF URL construction (format: https://arxiv.org/pdf/{arxiv_id}.pdf)
   * 4. Word counts and quality scoring
   *
   * 🔍 XML PARSING STRATEGY:
   * Using regex for lightweight parsing (alternative to full XML parser)
   * Trade-off: Fast and simple, but may miss edge cases in malformed XML
   * 📝 TO USE FULL XML PARSER: Replace regex with 'fast-xml-parser' library
   *
   * ⚠️ QUALITY SCORE LIMITATION:
   * arXiv papers have no citation counts (preprints), so quality score is
   * primarily based on content depth (word count) and recency.
   *
   * @param entry Raw XML string for single Atom feed entry
   * @returns Normalized Paper object following application schema
   */
  private parsePaper(entry: string): Paper {
    // ==========================================================================
    // STEP 1: Extract core metadata
    // ==========================================================================
    // 📝 TO EXTRACT MORE FIELDS: Add regex patterns here
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const summary = entry.match(/<summary>(.*?)<\/summary>/)?.[1] || '';
    const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';

    // ==========================================================================
    // STEP 2: Extract authors
    // ==========================================================================
    // 📝 TO EXTRACT AUTHOR AFFILIATIONS: Parse <arxiv:affiliation> tags
    // Note: Affiliations are rarely provided in arXiv feed
    const authors =
      entry
        .match(/<author>[\s\S]*?<name>(.*?)<\/name>/g)
        ?.map((a: string) => a.match(/<name>(.*?)<\/name>/)?.[1] || '') || [];

    // ==========================================================================
    // STEP 3: Construct PDF URL
    // ==========================================================================
    // 📝 TO ADD VERSION TRACKING: Extract version from ID and link to specific version
    // Format: http://arxiv.org/abs/1234.5678v2 → version 2
    const arxivId = id.split('/abs/')[1]; // Extract ID from full URL
    const pdfUrl = arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null;

    // ==========================================================================
    // STEP 4: Extract subject categories
    // ==========================================================================
    // 📝 TO PARSE ALL CATEGORIES: Extract all <category term="..."/> attributes
    const categories =
      entry
        .match(/<category term="([^"]+)"/g)
        ?.map((cat: string) => cat.match(/term="([^"]+)"/)?.[1] || '') || [];

    // ==========================================================================
    // STEP 5: Calculate word counts for content depth analysis
    // ==========================================================================
    // 📝 TO CHANGE WORD COUNTING: Modify word-count.util.ts functions
    const abstractWordCount = calculateAbstractWordCount(summary);
    const wordCount = calculateComprehensiveWordCount(title.trim(), summary.trim());
    const wordCountExcludingRefs = wordCount;
    const year = published ? new Date(published).getFullYear() : undefined;

    // ==========================================================================
    // STEP 6: Calculate quality score (0-100 scale)
    // ==========================================================================
    // 📝 TO CHANGE QUALITY ALGORITHM: Modify paper-quality.util.ts
    // Note: citationCount is null (arXiv preprints, not widely cited yet)
    const qualityComponents = calculateQualityScore({
      citationCount: null, // arXiv doesn't provide citation counts
      year,
      wordCount,
      venue: 'arXiv', // Preprint server, not a journal
      source: LiteratureSource.ARXIV,
      impactFactor: null,
      sjrScore: null,
      quartile: null,
      hIndexJournal: null,
    });

    // ==========================================================================
    // STEP 7: Construct normalized Paper object
    // ==========================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    return {
      // Core identification
      id,
      title: title.trim(),
      authors,
      year,
      abstract: summary.trim(),

      // External identifiers
      // doi: undefined when not available (📝 TO EXTRACT DOI: Parse <arxiv:doi> tag)
      url: id, // Full arXiv URL (https://arxiv.org/abs/...)
      venue: 'arXiv',

      // Publication metadata
      // citationCount: undefined when not available (arXiv preprints)
      source: LiteratureSource.ARXIV,
      fieldsOfStudy: categories.length > 0 ? categories : undefined,

      // Content metrics
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount, 150),
      abstractWordCount,

      // PDF availability (arXiv provides PDF for ALL papers)
      pdfUrl,
      hasPdf: !!pdfUrl,
      hasFullText: !!pdfUrl,
      fullTextStatus: pdfUrl ? 'available' : 'not_fetched',
      fullTextSource: pdfUrl ? 'publisher' : undefined, // arXiv is the publisher of preprints
      openAccessStatus: 'OPEN_ACCESS', // All arXiv papers are open access

      // Quality metrics (limited for preprints)
      citationsPerYear: 0, // No citation data available from arXiv
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,

      // arXiv-specific metadata
      // 📝 TO ADD: primaryCategory, version, comment, journal_ref fields
    };
  }

  /**
   * Check if arXiv service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
