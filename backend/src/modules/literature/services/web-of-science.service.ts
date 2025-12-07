/**
 * Web of Science Service
 * Phase 10.6 Day 6: Premium academic database integration following Day 3.5 refactoring pattern
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
 * - Reusable for other features (citation analysis, impact metrics)
 * - literature.service.ts contains only thin 15-30 line wrapper
 * - Adding new sources = new service file, NOT growing God class
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY WEB OF SCIENCE INTEGRATION:
 * ✅ DO: Modify THIS file (web-of-science.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchWebOfScience() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add new API filters → Update search() method parameters (line 150)
 * - Change parsing logic → Update parsePaper() method (line 220)
 * - Add citation network analysis → Add new method in this file
 * - Add caching → Add cache check in search() method before HTTP call
 * - Add rate limiting → Inject APIQuotaMonitorService in constructor
 *
 * WRAPPER METHOD (literature.service.ts):
 * The searchWebOfScience() method should remain a thin 15-line wrapper:
 * ```typescript
 * private async searchWebOfScience(dto: SearchLiteratureDto) {
 *   try {
 *     return await this.webOfScienceService.search(dto.query, {...});
 *   } catch (error) {
 *     this.logger.error(`[Web of Science] Failed: ${error.message}`);
 *     return [];
 *   }
 * }
 * ```
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles Web of Science API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All Web of Science logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 159M+ records across all disciplines from Web of Science
 * API: Clarivate Web of Science Starter API (premium, requires API key)
 * Documentation: https://developer.clarivate.com/apis/wos-starter
 * API Endpoint: https://wos-api.clarivate.com/api/wos
 * Rate Limits: Varies by subscription tier (check your plan)
 *
 * Features:
 * - Citation counts and citation networks
 * - Impact factors and journal metrics
 * - Highly-cited papers filtering
 * - Field-weighted citation impact
 * - Subject category classification
 * - Author disambiguation
 * - Institutional affiliation data
 * - Open Access status detection
 * - PDF availability checking
 * - Date range filtering
 *
 * Research Coverage:
 * - All scientific disciplines
 * - Arts & Humanities
 * - Social Sciences
 * - Science & Technology
 * - Conference proceedings
 * - Books and book chapters
 * - Data sets
 *
 * Premium Features:
 * - High-quality metadata (impact factors, quartiles)
 * - Citation relationships (cited references, citing articles)
 * - Author identifiers (ResearcherID, ORCID)
 * - Institution identifiers
 * - Funding acknowledgements
 *
 * Environment Variables Required:
 * - WOS_API_KEY: Your Clarivate API key (required)
 *
 * @see https://developer.clarivate.com/apis/wos-starter
 * @see https://clarivate.com/webofsciencegroup/solutions/web-of-science/
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
import { LARGE_RESPONSE_TIMEOUT } from '../constants/http-config.constants';

export interface WebOfScienceSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  openAccessOnly?: boolean;
  highlyCitedOnly?: boolean;
  subjectCategory?: string;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS search parameters
 */
interface WosSearchParams {
  databaseId: string;
  usrQuery: string;
  count: number;
  firstRecord: number;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS title
 */
interface WosTitle {
  '@type'?: string;
  '#text'?: string;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS name/author
 */
interface WosName {
  '@role'?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS identifier
 */
interface WosIdentifier {
  '@type'?: string;
  '@value'?: string;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS category/subject
 */
interface WosSubject {
  '#text'?: string;
}

/**
 * Phase 10.106 Phase 7: Typed interface for WoS record
 * Netflix-grade: Explicit typing for API response parsing
 */
interface WosRecord {
  UID?: string;
  static_data?: {
    summary?: {
      titles?: { title?: WosTitle[] };
      pub_info?: { pubyear?: string };
      names?: { name?: WosName[] };
      source_title?: string;
      doctypes?: { doctype?: string | string[] };
    };
    fullrecord_metadata?: {
      abstracts?: { abstract?: { abstract_text?: { p?: string } } };
      identifiers?: { identifier?: WosIdentifier[] };
      category_info?: { subjects?: { subject?: WosSubject[] } };
    };
  };
  dynamic_data?: {
    citation_related?: { tc_list?: { silo_tc?: { local_count?: string } } };
    cluster_related?: {
      identifiers?: {
        impact_factor?: string;
        quartile?: string;
        oa?: { oa_status?: string; oa_loc_url?: string };
      };
    };
  };
}

@Injectable()
export class WebOfScienceService {
  private readonly logger = new Logger(WebOfScienceService.name);
  private readonly API_BASE_URL =
    'https://wos-api.clarivate.com/api/wos';
  private readonly apiKey: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('WOS_API_KEY');

    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ [Web of Science] API key not configured. Set WOS_API_KEY environment variable for production use.',
      );
      this.logger.warn(
        '⚠️ [Web of Science] Service will return empty results until API key is configured.',
      );
    } else {
      this.logger.log('✅ [Web of Science] Service initialized with API key');
    }
  }

  /**
   * Search Web of Science database for academic papers
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new search filters: Add to params object (line 195)
   * - To change result limit: Modify count parameter (line 198)
   * - To add citation filters: Add to query string (line 192)
   * - To add sorting: Add sort parameter
   * - To add caching: Insert cache check before HTTP call
   * - To change error handling: Modify catch block (line 220)
   *
   * @param query Search query string
   * @param options Search filters (year range, limit, filters)
   * @returns Array of Paper objects (empty array on error for graceful degradation)
   */
  async search(
    query: string,
    options?: WebOfScienceSearchOptions,
  ): Promise<Paper[]> {
    // Check if API key is configured
    if (!this.apiKey) {
      this.logger.warn(
        `[Web of Science] API key not configured - returning empty results`,
      );
      return [];
    }

    try {
      this.logger.log(`[Web of Science] Searching: "${query}"`);

      // Build query string with filters
      // 📝 TO ADD NEW FILTERS: Modify query construction here
      let queryString = `TS="${query}"`;

      // Add year range filter
      if (options?.yearFrom || options?.yearTo) {
        const yearFrom = options.yearFrom || 1900;
        const yearTo = options.yearTo || new Date().getFullYear();
        queryString += ` AND PY=${yearFrom}-${yearTo}`;
      }

      // Add highly-cited filter
      if (options?.highlyCitedOnly) {
        queryString += ' AND HC=(YES)';
      }

      // Add Open Access filter
      if (options?.openAccessOnly) {
        queryString += ' AND OA=(YES)';
      }

      // Add subject category filter
      if (options?.subjectCategory) {
        queryString += ` AND WC="${options.subjectCategory}"`;
      }

      // Build request parameters
      const params: WosSearchParams = {
        databaseId: 'WOS',
        usrQuery: queryString,
        count: options?.limit || 20,
        firstRecord: 1,
      };

      // Make HTTP request with API key authentication
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'X-ApiKey': this.apiKey,
          },
          timeout: LARGE_RESPONSE_TIMEOUT, // 30s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      // Parse results
      const records = response.data?.Data?.Records?.records?.REC || [];
      const papers = Array.isArray(records)
        ? records.map((record: WosRecord) => this.parsePaper(record))
        : [];

      this.logger.log(
        `[Web of Science] Found ${papers.length} papers for query: "${query}"`,
      );

      return papers;
    } catch (error: unknown) {
      // Phase 10.106 Phase 4: Use unknown with type narrowing
      const err = error as { response?: { status?: number }; message?: string };
      // Graceful degradation - log error but don't crash
      if (err.response?.status === 401) {
        this.logger.error(
          `[Web of Science] Authentication failed - check API key`,
        );
      } else if (err.response?.status === 429) {
        this.logger.error(`[Web of Science] Rate limit exceeded`);
      } else {
        this.logger.error(
          `[Web of Science] Search failed: ${err.message || 'Unknown error'}`,
        );
      }
      return [];
    }
  }

  /**
   * Parse Web of Science record into Paper format
   *
   * ⚠️ MODIFICATION GUIDE:
   * - To add new metadata fields: Extract from record object and add to return statement
   * - To change quality scoring: Modify calculateQualityScore parameters (line 300)
   * - To add PDF detection: Modify pdfUrl logic (line 315)
   * - To add citation network: Extract citation data from record.dynamic_data
   *
   * @param record Raw Web of Science record
   * @returns Paper object with normalized metadata
   */
  private parsePaper(record: WosRecord): Paper {
    // Extract static data
    const static_data = record.static_data || {};
    const summary = static_data.summary || {};
    const titles = summary.titles?.title || [];
    const pub_info = summary.pub_info || {};
    const names = summary.names?.name || [];

    // Extract dynamic data (citations, usage)
    const dynamic_data = record.dynamic_data || {};
    const citation_related = dynamic_data.citation_related || {};
    const tc_list = citation_related.tc_list?.silo_tc || {};

    // Extract basic metadata
    const title =
      titles.find((t: WosTitle) => t['@type'] === 'item')?.['#text'] ||
      titles[0]?.['#text'] ||
      'Untitled';
    const abstract =
      static_data.fullrecord_metadata?.abstracts?.abstract?.abstract_text
        ?.p ||
      '';

    // Extract authors
    const authors = names
      .filter((n: WosName) => n['@role'] === 'author')
      .map(
        (author: WosName) =>
          `${author.first_name || ''} ${author.last_name || ''}`.trim(),
      );

    // Extract year
    const year = pub_info.pubyear
      ? parseInt(pub_info.pubyear)
      : undefined;

    // Extract identifiers
    const identifiers =
      static_data.fullrecord_metadata?.identifiers?.identifier || [];
    const doi =
      identifiers.find((id: WosIdentifier) => id['@type'] === 'doi')?.['@value'] ||
      undefined;

    // Extract citation count
    const citationCount = tc_list?.local_count
      ? parseInt(tc_list.local_count)
      : 0;

    // Extract venue information
    const venue = summary.source_title || undefined;

    // Extract publication type
    const publicationType = summary.doctypes?.doctype || undefined;

    // Extract subject categories
    const categories =
      static_data.fullrecord_metadata?.category_info?.subjects
        ?.subject || [];
    const fieldsOfStudy = categories.map((cat: WosSubject) => cat['#text']);

    // Calculate word counts for content depth analysis
    const abstractWordCount = calculateAbstractWordCount(abstract);
    const wordCount = calculateComprehensiveWordCount(title, abstract);
    const wordCountExcludingRefs = wordCount; // Web of Science abstracts don't include refs

    // Extract journal metrics (if available)
    const journal_info = dynamic_data.cluster_related?.identifiers || {};
    const impactFactor = journal_info.impact_factor
      ? parseFloat(journal_info.impact_factor)
      : undefined;
    // Phase 10.106 Phase 7: Validate quartile is a valid QuartileType
    const rawQuartile = journal_info.quartile;
    const quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | undefined =
      rawQuartile === 'Q1' || rawQuartile === 'Q2' ||
      rawQuartile === 'Q3' || rawQuartile === 'Q4' ? rawQuartile : undefined;

    // Calculate quality score (0-100 scale)
    const qualityComponents = calculateQualityScore({
      citationCount,
      year,
      wordCount,
      venue,
      source: LiteratureSource.WEB_OF_SCIENCE,
      impactFactor,
      sjrScore: undefined, // WoS doesn't provide SJR (that's Scopus)
      quartile,
      hIndexJournal: undefined,
    });

    // Extract Open Access and PDF information
    const oa_info = dynamic_data.cluster_related?.identifiers?.oa || {};
    const isOpenAccess = oa_info.oa_status === 'Y';
    const pdfUrl = oa_info.oa_loc_url || undefined;
    const hasPdf = !!pdfUrl;

    // Generate unique ID
    const uid = record.UID || `wos_${Date.now()}_${Math.random()}`;

    return {
      // Core identification
      id: uid,
      title,
      authors: Array.isArray(authors) ? authors : [],
      year,
      abstract,

      // External identifiers
      doi,
      url: doi ? `https://doi.org/${doi}` : undefined,

      // Publication metadata
      venue,
      source: LiteratureSource.WEB_OF_SCIENCE,
      // Phase 10.106 Phase 7: Ensure publicationType is string[] | undefined
      publicationType: Array.isArray(publicationType)
        ? publicationType
        : publicationType ? [publicationType] : undefined,

      // Subject classification - Phase 10.106 Phase 7: Filter out undefined values
      fieldsOfStudy: fieldsOfStudy.filter((f): f is string => f !== undefined).length > 0
        ? fieldsOfStudy.filter((f): f is string => f !== undefined)
        : undefined,

      // Content metrics (Phase 10 Day 5.13+)
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount, 150),
      abstractWordCount,

      // PDF and full-text availability
      pdfUrl,
      openAccessStatus: isOpenAccess ? 'OPEN_ACCESS' : null,
      hasPdf,
      hasFullText: hasPdf,
      fullTextStatus: hasPdf ? 'available' : 'not_fetched',
      fullTextSource: hasPdf ? 'web_of_science' : undefined,

      // Quality metrics (Phase 10 Day 5.13+)
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
      citationCount,

      // Journal metrics (premium data from Web of Science)
      impactFactor,
      quartile,
    };
  }
}
