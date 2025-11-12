/**
 * Wiley Online Library Service
 * Phase 10.6 Day 11: Wiley Integration following Day 3.5 refactoring pattern
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service follows the enterprise pattern established in Day 3.5
 * to avoid the God class anti-pattern and establish clean architecture.
 *
 * PATTERN BENEFITS:
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for other features
 * - literature.service.ts contains only thin 15-30 line wrapper
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY WILEY INTEGRATION:
 * ✅ DO: Modify THIS file (wiley.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchWiley() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-160: API query building → Modify Wiley API parameters
 * - Line 190-280: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles Wiley API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All Wiley logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 6+ million articles from 1,600+ journals
 * API: Wiley Online Library Search API
 * Documentation: https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining
 * Rate Limits: Institutional access required for API (varies by license)
 * Data Types: Journal articles, books, chapters, reference works
 * Fields: Sciences, medicine, engineering, social sciences, humanities
 * Unique Features:
 *   - Strong in engineering and applied sciences
 *   - Major medical journals (JAMA, etc.)
 *   - Cochrane Library content
 *   - Reference works and handbooks
 *   - High-quality peer review standards
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-160):
 * - Add new query parameters to buildSearchParams()
 * - Update Wiley API documentation reference
 * - Adjust query string formatting (q parameter syntax)
 *
 * HOW TO CHANGE PAPER PARSING (Lines 190-280):
 * - Modify parsePaper() field extraction
 * - Update author parsing logic (contributors field)
 * - Adjust metadata handling (subjects, publicationDate)
 * - Change quality score calculation
 *
 * HOW TO ADD NEW FEATURES:
 * - Add methods below existing search() method
 * - Follow same error handling pattern
 * - Update method documentation
 * - Keep all logic in this service file
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
import { PUBLISHER_API_TIMEOUT } from '../constants/http-config.constants';

/**
 * Search options specific to Wiley API
 */
export interface WileySearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  contentType?: 'article' | 'book' | 'chapter' | 'all';
}

/**
 * Wiley Online Library Service
 * Implements access to 6M+ documents from Wiley publishers
 */
@Injectable()
export class WileyService {
  private readonly logger = new Logger(WileyService.name);
  private readonly API_BASE_URL = 'https://api.wiley.com/onlinelibrary/tdm/v1/articles';
  private readonly API_KEY = process.env.WILEY_API_KEY || '';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search Wiley Online Library
   * Returns standardized Paper[] format
   */
  async search(
    query: string,
    options: WileySearchOptions = {},
  ): Promise<Paper[]> {
    if (!this.API_KEY) {
      this.logger.warn(
        '⚠️ [Wiley] WILEY_API_KEY not configured - skipping search',
      );
      return [];
    }

    try {
      this.logger.log(
        `🔍 [Wiley] Searching: "${query}" (limit: ${options.limit || 25})`,
      );

      const params = this.buildSearchParams(query, options);
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'Wiley-TDM-Client-Token': this.API_KEY,
            Accept: 'application/json',
          },
          timeout: PUBLISHER_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      const items = response.data?.items || [];
      this.logger.log(`✅ [Wiley] Found ${items.length} papers`);

      const papers = items
        .map((item: any) => this.parsePaper(item))
        .filter((paper: Paper | null) => paper !== null) as Paper[];

      const eligiblePapers = papers.filter((paper) =>
        isPaperEligible(paper.wordCount || 0),
      );
      this.logger.log(
        `✅ [Wiley] ${eligiblePapers.length}/${papers.length} papers eligible (100+ words)`,
      );

      return eligiblePapers;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger.error('🔒 [Wiley] Authentication failed - check API key');
      } else if (error.response?.status === 429) {
        this.logger.warn('⏳ [Wiley] Rate limit exceeded - try again later');
      } else {
        this.logger.error(`❌ [Wiley] Search error: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Build Wiley API query parameters
   */
  private buildSearchParams(
    query: string,
    options: WileySearchOptions,
  ): Record<string, any> {
    const params: Record<string, any> = {
      query: query,
      count: options.limit || 25,
      offset: 0,
      order: 'relevance',
    };

    // Add date range filter
    if (options.yearFrom || options.yearTo) {
      const yearFrom = options.yearFrom || 1900;
      const yearTo = options.yearTo || new Date().getFullYear();
      params.publicationDateFrom = `${yearFrom}-01-01`;
      params.publicationDateTo = `${yearTo}-12-31`;
    }

    // Add content type filter
    if (options.contentType && options.contentType !== 'all') {
      params.contentType = options.contentType;
    }

    return params;
  }

  /**
   * Parse Wiley API response item into standardized Paper format
   */
  private parsePaper(item: any): Paper | null {
    try {
      // Extract DOI
      const doi = item.doi || undefined;

      // Extract title
      const title = item.title || 'Untitled';

      // Extract abstract
      const abstract =
        item.abstract ||
        item.abstractText ||
        item.summary ||
        'No abstract available.';

      // Calculate word counts
      const abstractWordCount = calculateAbstractWordCount(abstract);
      const comprehensiveWordCount = calculateComprehensiveWordCount(
        abstract,
        undefined,
      );

      // Extract authors
      const authors = this.extractAuthors(item);

      // Extract year
      const year = this.extractYear(item);

      // Extract publication info
      const journal =
        item.journalTitle || item.publicationTitle || 'Unknown Journal';

      // Extract URL
      const url =
        item.url ||
        (doi ? `https://doi.org/${doi}` : undefined) ||
        'https://onlinelibrary.wiley.com';

      // Extract subjects/keywords
      const keywords = this.extractKeywords(item);

      // Extract citation count (if available)
      const citationCount = item.citationCount || 0;

      // Determine publication type
      const publicationType = this.determinePublicationType(item);

      // Extract open access info
      const isOpenAccess =
        item.openAccess === true ||
        item.accessType === 'open' ||
        item.license?.includes('CC');

      // Calculate quality score with Wiley-specific boost
      const qualityComponents = calculateQualityScore({
        impactFactor: this.estimateImpactFactor(journal),
        citationCount: citationCount || 0,
        quartile: this.estimateQuartile(journal),
        year,
        wordCount: comprehensiveWordCount,
        venue: journal,
        source: 'wiley',
      });

      const paper: Paper = {
        title,
        abstract,
        authors,
        year,
        source: LiteratureSource.WILEY,
        id: doi || item.id || `wiley_${Date.now()}_${Math.random()}`,
        doi,
        url,
        venue: journal,
        keywords,
        citationCount,
        abstractWordCount,
        wordCount: comprehensiveWordCount,
        publicationType,
        openAccessStatus: isOpenAccess ? 'OPEN_ACCESS' : null,
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50,
        fullTextSource: 'wiley',
      };

      return paper;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ [Wiley] Failed to parse paper: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Extract authors from Wiley response
   */
  private extractAuthors(item: any): string[] {
    const authors: string[] = [];

    if (item.contributors) {
      for (const contributor of item.contributors) {
        if (contributor.type === 'author' && contributor.name) {
          authors.push(contributor.name);
        }
      }
    }

    if (authors.length === 0 && item.authors) {
      if (Array.isArray(item.authors)) {
        return item.authors
          .map((author: any) => {
            if (typeof author === 'string') return author;
            if (author.name) return author.name;
            if (author.given && author.family)
              return `${author.given} ${author.family}`;
            return null;
          })
          .filter((name: string | null): name is string => name !== null);
      }
    }

    if (authors.length === 0 && item.creator) {
      if (Array.isArray(item.creator)) {
        return item.creator.filter((name: any) => typeof name === 'string');
      }
    }

    return authors;
  }

  /**
   * Extract publication year
   */
  private extractYear(item: any): number | undefined {
    if (item.publicationDate) {
      const year = new Date(item.publicationDate).getFullYear();
      if (!isNaN(year)) return year;
    }

    if (item.coverDate) {
      const year = new Date(item.coverDate).getFullYear();
      if (!isNaN(year)) return year;
    }

    if (item.year) {
      const year = parseInt(item.year, 10);
      if (!isNaN(year)) return year;
    }

    return undefined;
  }

  /**
   * Extract keywords/subjects
   */
  private extractKeywords(item: any): string[] {
    const keywords: string[] = [];

    if (item.keywords && Array.isArray(item.keywords)) {
      keywords.push(...item.keywords);
    }

    if (item.subjects && Array.isArray(item.subjects)) {
      keywords.push(...item.subjects);
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Determine publication type
   */
  private determinePublicationType(item: any): string[] {
    const types: string[] = [];

    if (item.contentType) {
      types.push(item.contentType);
    } else if (item.type) {
      types.push(item.type);
    }

    // Classify based on journal or content indicators
    if (item.journalTitle) {
      types.push('Journal Article');
    }

    if (item.bookTitle) {
      types.push('Book Chapter');
    }

    if (types.length === 0) {
      types.push('Article');
    }

    return types;
  }

  /**
   * Estimate impact factor for known Wiley journals
   * Returns higher IF for prestigious Wiley journals
   */
  private estimateImpactFactor(journal: string): number {
    const journalLower = journal.toLowerCase();

    // High-impact Wiley journals (IF 10+)
    if (
      journalLower.includes('advanced materials') ||
      journalLower.includes('angew') ||
      journalLower.includes('angewandte chemie')
    ) {
      return 32.0; // Angewandte Chemie IF ~32
    }
    if (journalLower.includes('advanced energy materials')) {
      return 29.0;
    }
    if (journalLower.includes('advanced functional materials')) {
      return 19.0;
    }

    // Notable Wiley journals (IF 5-10)
    if (
      journalLower.includes('wiley interdisciplinary reviews') ||
      journalLower.includes('wires')
    ) {
      return 8.0;
    }
    if (
      journalLower.includes('journal of the american') ||
      journalLower.includes('jama')
    ) {
      return 7.5;
    }
    if (journalLower.includes('cochrane')) {
      return 9.0;
    }

    // Standard Wiley journals (IF 2-5)
    if (journalLower.includes('international journal')) {
      return 3.5;
    }
    if (
      journalLower.includes('european journal') ||
      journalLower.includes('journal of')
    ) {
      return 3.0;
    }

    // Default for Wiley (reputable publisher)
    return 2.5;
  }

  /**
   * Estimate quartile for known Wiley journals
   */
  private estimateQuartile(journal: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    const journalLower = journal.toLowerCase();

    // Q1 journals (top 25%)
    if (
      journalLower.includes('advanced') ||
      journalLower.includes('angew') ||
      journalLower.includes('cochrane') ||
      journalLower.includes('wires')
    ) {
      return 'Q1';
    }

    // Q2 journals (25-50%)
    if (
      journalLower.includes('international journal') ||
      journalLower.includes('european journal')
    ) {
      return 'Q2';
    }

    // Default to Q2 for Wiley (reputable publisher)
    return 'Q2';
  }

  /**
   * Public utility: Check if journal is from Wiley's high-impact portfolio
   * Can be used by other services for journal classification
   */
  public isHighImpactWileyJournal(journal: string): boolean {
    const journalLower = journal.toLowerCase();
    return (
      journalLower.includes('advanced materials') ||
      journalLower.includes('angew') ||
      journalLower.includes('cochrane') ||
      journalLower.includes('wires') ||
      journalLower.includes('advanced energy')
    );
  }
}
