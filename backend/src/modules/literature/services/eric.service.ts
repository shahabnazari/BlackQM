/**
 * ERIC (Education Resources Information Center) Service
 * Phase 10.6 Day 5: Education research database integration following Day 3.5 refactoring pattern
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service follows the enterprise pattern established in Day 3.5 (semantic-scholar.service.ts)
 * to avoid the God class anti-pattern and establish clean architecture for integrating
 * 19 academic sources without creating technical debt.
 *
 * PATTERN BENEFITS:
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for other features (education-specific theme extraction)
 * - literature.service.ts contains only thin 15-30 line wrapper
 * - Adding new sources = new service file, NOT growing God class
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY ERIC INTEGRATION:
 * ✅ DO: Modify THIS file (eric.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchERIC() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add new API filters → Update search() method parameters (line 130)
 * - Change parsing logic → Update parsePaper() method (line 180)
 * - Add caching → Add cache check in search() method before HTTP call
 * - Add rate limiting → Inject APIQuotaMonitorService in constructor
 *
 * WRAPPER METHOD (literature.service.ts):
 * The searchERIC() method should remain a thin 15-line wrapper:
 * ```typescript
 * private async searchERIC(dto: SearchLiteratureDto) {
 *   try {
 *     return await this.ericService.search(dto.query, {...});
 *   } catch (error) {
 *     this.logger.error(`[ERIC] Failed: ${error.message}`);
 *     return [];
 *   }
 * }
 * ```
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles ERIC API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All ERIC logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 1.5M+ education research papers from ERIC database
 * API: Free RESTful JSON API (US Department of Education)
 * Documentation: https://eric.ed.gov/
 * API Endpoint: https://api.eric.ed.gov/search
 * Rate Limits: None specified (reasonable use policy)
 *
 * Features:
 * - Education-specific metadata (education level, audience)
 * - Full-text availability indicators
 * - Peer-reviewed filter
 * - Publication type filtering
 * - ISSN/ISBN tracking
 * - Free PDF links when available
 * - Date range filtering
 *
 * Education Research Focus Areas:
 * - K-12 education
 * - Higher education
 * - Educational technology
 * - Special education
 * - Curriculum development
 * - Teacher training
 * - Educational assessment
 *
 * @see https://eric.ed.gov/
 * @see https://eric.ed.gov/api.html
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

export interface ERICSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  peerReviewed?: boolean;
  publicationType?: 'Journal Articles' | 'Reports' | 'Books' | 'All';
  educationLevel?: string;
}

@Injectable()
export class ERICService {
  private readonly logger = new Logger(ERICService.name);
  private readonly API_BASE_URL = 'https://api.eric.ed.gov/search';

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [ERIC] Service initialized');
  }

  /**
   * Search ERIC database for education research papers
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new search filters: Add to params object (line 153)
   * - To change result limit: Modify rows parameter (line 156)
   * - To add sorting: Add sort parameter
   * - To add caching: Insert cache check before HTTP call
   * - To change error handling: Modify catch block (line 175)
   *
   * @param query Search query string
   * @param options Search filters (year range, limit, filters)
   * @returns Array of Paper objects (empty array on error for graceful degradation)
   */
  async search(
    query: string,
    options?: ERICSearchOptions,
  ): Promise<Paper[]> {
    try {
      this.logger.log(`[ERIC] Searching: "${query}"`);

      // Build query parameters
      // 📝 TO ADD NEW FILTERS: Add additional parameters here
      const params: any = {
        search: query,
        format: 'json',
        rows: options?.limit || 20,
        start: 0,
      };

      // Add peer-reviewed filter if requested
      if (options?.peerReviewed) {
        params['e_peerreviewed'] = 'true';
      }

      // Add publication type filter
      if (options?.publicationType && options.publicationType !== 'All') {
        params['e_pubtype'] = options.publicationType;
      }

      // Add education level filter
      if (options?.educationLevel) {
        params['e_educationlevel'] = options.educationLevel;
      }

      // Add date range filter
      if (options?.yearFrom) {
        params['e_pubyearmin'] = options.yearFrom;
      }
      if (options?.yearTo) {
        params['e_pubyearmax'] = options.yearTo;
      }

      // Execute HTTP request
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          timeout: 30000,
        }),
      );

      // Parse response
      // 📝 TO CHANGE PARSING: Update parsePaper() method below
      const docs = response.data?.response?.docs || [];
      const papers = docs.map((doc: any) => this.parsePaper(doc));

      this.logger.log(`[ERIC] Found ${papers.length} papers`);
      return papers;
    } catch (error: any) {
      // Enterprise-grade error handling: Log but don't throw (graceful degradation)
      // 📝 TO ADD CUSTOM ERROR HANDLING: Add specific error type checks here
      if (error.response?.status === 503) {
        this.logger.error(
          `[ERIC] ⚠️  SERVICE UNAVAILABLE (503) - ERIC API temporarily down`,
        );
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.error(
          `[ERIC] ⚠️  CONNECTION REFUSED - Cannot reach ERIC API`,
        );
      } else {
        this.logger.error(
          `[ERIC] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
        );
      }
      // Return empty array instead of throwing - allows other sources to succeed
      return [];
    }
  }

  /**
   * Parse ERIC API response into Paper object
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new Paper fields: Update return object below (line 260-290)
   * - To change quality algorithm: Modify calculateQualityScore() params (line 240)
   * - To add new metadata extraction: Add parsing logic after line 225
   * - To change PDF detection: Modify logic at line 230-238
   *
   * 📊 QUALITY METRICS CALCULATED:
   * 1. Word counts (title + abstract, excluding references)
   * 2. Quality score (0-100 based on citations, age, content depth)
   * 3. Education-specific metadata (education level, audience)
   *
   * 🔍 PDF DETECTION STRATEGY:
   * 1. Check fulltext.url field (ERIC provides direct PDF links)
   * 2. Check e_fulltextauth (full-text authorization status)
   * 3. Fallback to URL field if available
   *
   * @param doc Raw API response object from ERIC
   * @returns Normalized Paper object following application schema
   */
  private parsePaper(doc: any): Paper {
    // ============================================================================
    // STEP 1: Extract basic metadata
    // ============================================================================
    const title = doc.title || 'Untitled';
    const abstract = doc.description || '';
    const authors = doc.author || [];
    const year = doc.publicationdateyear
      ? parseInt(doc.publicationdateyear)
      : undefined;

    // ============================================================================
    // STEP 2: Calculate word counts for content depth analysis
    // ============================================================================
    // 📝 TO CHANGE WORD COUNTING: Modify word-count.util.ts functions
    const abstractWordCount = calculateAbstractWordCount(abstract);
    const wordCount = calculateComprehensiveWordCount(title, abstract);
    const wordCountExcludingRefs = wordCount; // Already excludes non-content

    // ============================================================================
    // STEP 3: Calculate quality score (0-100 scale)
    // ============================================================================
    // 📝 TO CHANGE QUALITY ALGORITHM: Modify paper-quality.util.ts
    const qualityComponents = calculateQualityScore({
      citationCount: 0, // ERIC doesn't provide citation counts
      year,
      wordCount,
      venue: doc.source || doc.sponsor || null,
      source: LiteratureSource.ERIC,
      impactFactor: null,
      sjrScore: null,
      quartile: null,
      hIndexJournal: null,
    });

    // ============================================================================
    // STEP 4: PDF and full-text detection
    // ============================================================================
    // 📝 TO ADD MORE PDF SOURCES: Add additional checks here
    let pdfUrl: string | undefined = undefined;
    let hasPdf = false;

    // Check for full-text URL
    if (doc.e_fulltextauth === 'Y' && doc.fulltext?.url) {
      pdfUrl = doc.fulltext.url;
      hasPdf = true;
    } else if (doc.url) {
      // Fallback to main URL
      pdfUrl = doc.url;
      hasPdf = true;
    }

    // ============================================================================
    // STEP 5: Extract education-specific metadata
    // ============================================================================
    const educationLevel = doc.e_educationlevel || [];
    const audience = doc.e_audience || [];
    const peerReviewed = doc.e_peerreviewed === 'T';

    // ============================================================================
    // STEP 6: Construct normalized Paper object
    // ============================================================================
    // 📝 TO ADD NEW FIELDS: Add them here matching Paper interface definition
    // See: backend/src/modules/literature/dto/literature.dto.ts
    return {
      // Core identification
      id: doc.id || `eric_${Date.now()}_${Math.random()}`,
      title,
      authors: Array.isArray(authors) ? authors : [],
      year,
      abstract,

      // External identifiers
      doi: doc.doi || null,
      url: doc.url || null,

      // Publication metadata
      venue: doc.source || doc.sponsor || null,
      source: LiteratureSource.ERIC,
      publicationType: doc.e_pubtype || null,

      // Education-specific metadata (stored in fieldsOfStudy for compatibility)
      fieldsOfStudy: educationLevel.length > 0 ? educationLevel : null,

      // Content metrics (Phase 10 Day 5.13+)
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount),
      abstractWordCount,

      // PDF and full-text availability
      pdfUrl,
      openAccessStatus: hasPdf ? 'OPEN_ACCESS' : null,
      hasPdf,
      hasFullText: hasPdf,
      fullTextStatus: hasPdf ? 'available' : 'not_fetched',
      fullTextSource: hasPdf ? 'eric' : undefined,

      // Quality metrics (Phase 10 Day 5.13+)
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
      citationCount: 0, // ERIC doesn't provide citation counts
    };
  }

  /**
   * Check if ERIC service is available
   * Always returns true (free public API, no key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
