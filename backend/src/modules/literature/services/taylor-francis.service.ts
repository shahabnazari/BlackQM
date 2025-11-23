/**
 * Taylor & Francis Service
 * Phase 10.6 Day 13: Taylor & Francis Integration following Day 3.5 refactoring pattern
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
 * IF YOU NEED TO MODIFY TAYLOR & FRANCIS INTEGRATION:
 * ✅ DO: Modify THIS file (taylor-francis.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchTaylorFrancis() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-160: API query building → Modify T&F API parameters
 * - Line 190-280: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles Taylor & Francis API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All T&F logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 2,700+ journals, 60,000+ books across all disciplines
 * API: Taylor & Francis Online API
 * Documentation: https://www.tandfonline.com/action/showPublications
 * Rate Limits: Varies by institutional access (typically 3000 calls/day)
 * Data Types: Journal articles, books, book chapters, reference works
 * Fields: Humanities, social sciences, behavioral sciences, STM
 * Unique Features:
 *   - Premier humanities and social sciences publisher
 *   - Routledge imprint (leading social sciences)
 *   - CRC Press (engineering and science handbooks)
 *   - Strong in education, psychology, sociology
 *   - Extensive book content (not just journals)
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-160):
 * - Add new query parameters to buildSearchParams()
 * - Update Taylor & Francis API documentation reference
 * - Adjust query string formatting
 *
 * HOW TO CHANGE PAPER PARSING (Lines 190-280):
 * - Modify parsePaper() field extraction
 * - Update author parsing logic
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
 * Search options specific to Taylor & Francis API
 */
export interface TaylorFrancisSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  subject?: string;
}

/**
 * Taylor & Francis Service
 * Implements access to 2,700+ journals from Taylor & Francis Group
 */
@Injectable()
export class TaylorFrancisService {
  private readonly logger = new Logger(TaylorFrancisService.name);
  private readonly API_BASE_URL = 'https://www.tandfonline.com/action/doSearch';
  private readonly API_KEY = process.env.TAYLOR_FRANCIS_API_KEY || '';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Search Taylor & Francis
   * Returns standardized Paper[] format
   */
  async search(
    query: string,
    options: TaylorFrancisSearchOptions = {},
  ): Promise<Paper[]> {
    if (!this.API_KEY) {
      this.logger.warn(
        '⚠️ [Taylor & Francis] TAYLOR_FRANCIS_API_KEY not configured - skipping search',
      );
      return [];
    }

    try {
      this.logger.log(
        `🔍 [Taylor & Francis] Searching: "${query}" (limit: ${options.limit || 25})`,
      );

      const params = this.buildSearchParams(query, options);
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'X-API-Key': this.API_KEY,
            Accept: 'application/json',
          },
          timeout: PUBLISHER_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      const items =
        response.data?.results || response.data?.items || response.data?.records || [];
      this.logger.log(`✅ [Taylor & Francis] Found ${items.length} papers`);

      const papers = items
        .map((item: any) => this.parsePaper(item))
        .filter((paper: Paper | null) => paper !== null) as Paper[];

      const eligiblePapers = papers.filter((paper) =>
        isPaperEligible(paper.wordCount || 0, 150),
      );
      this.logger.log(
        `✅ [Taylor & Francis] ${eligiblePapers.length}/${papers.length} papers eligible (100+ words)`,
      );

      return eligiblePapers;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger.error(
          '🔒 [Taylor & Francis] Authentication failed - check API key',
        );
      } else if (error.response?.status === 429) {
        this.logger.warn(
          '⏳ [Taylor & Francis] Rate limit exceeded - try again later',
        );
      } else {
        this.logger.error(
          `❌ [Taylor & Francis] Search error: ${error.message}`,
        );
      }
      return [];
    }
  }

  /**
   * Build Taylor & Francis API query parameters
   */
  private buildSearchParams(
    query: string,
    options: TaylorFrancisSearchOptions,
  ): Record<string, any> {
    const params: Record<string, any> = {
      AllField: query,
      pageSize: options.limit || 25,
      startPage: 0,
      sortBy: 'Relevance',
    };

    // Add date range filter
    if (options.yearFrom || options.yearTo) {
      const yearFrom = options.yearFrom || 1900;
      const yearTo = options.yearTo || new Date().getFullYear();
      params.AfterYear = yearFrom;
      params.BeforeYear = yearTo;
    }

    // Add subject filter if specified
    if (options.subject) {
      params.SubjectGroup = options.subject;
    }

    return params;
  }

  /**
   * Parse Taylor & Francis API response item into standardized Paper format
   */
  private parsePaper(item: any): Paper | null {
    try {
      // Extract DOI
      const doi = item.doi || item.DOI || undefined;

      // Extract title
      const title = item.Title || item.title || item.articleTitle || 'Untitled';

      // Extract abstract
      const abstract =
        item.Abstract ||
        item.abstract ||
        item.abstractText ||
        item.description ||
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
        item.PublicationTitle ||
        item.journalTitle ||
        item.publicationTitle ||
        item.containerTitle ||
        'Unknown Journal';

      // Extract URL
      const url =
        item.URL ||
        item.url ||
        item.link ||
        (doi ? `https://doi.org/${doi}` : undefined) ||
        'https://www.tandfonline.com';

      // Extract subjects/keywords
      const keywords = this.extractKeywords(item);

      // Extract citation count (if available)
      const citationCount = item.citationCount || item.citedByCount || 0;

      // Determine publication type
      const publicationType = this.determinePublicationType(item);

      // Extract open access info
      const isOpenAccess =
        item.openAccess === true ||
        item.isOpenAccess === true ||
        item.accessType === 'open' ||
        item.license?.includes('CC');

      // Calculate quality score with T&F-specific considerations
      const qualityComponents = calculateQualityScore({
        impactFactor: this.estimateImpactFactor(journal),
        citationCount: citationCount || 0,
        quartile: this.estimateQuartile(journal),
        year,
        wordCount: comprehensiveWordCount,
        venue: journal,
        source: 'taylor_francis',
      });

      const paper: Paper = {
        title,
        abstract,
        authors,
        year,
        source: LiteratureSource.TAYLOR_FRANCIS,
        id:
          doi ||
          item.id ||
          item.articleId ||
          `taylor_francis_${Date.now()}_${Math.random()}`,
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
        fullTextSource: 'taylor_francis',
      };

      return paper;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ [Taylor & Francis] Failed to parse paper: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Extract authors from Taylor & Francis response
   */
  private extractAuthors(item: any): string[] {
    const authors: string[] = [];

    // Try Authors array
    if (item.Authors && Array.isArray(item.Authors)) {
      return item.Authors.map((author: any) => {
        if (typeof author === 'string') return author;
        if (author.name) return author.name;
        if (author.given && author.family)
          return `${author.given} ${author.family}`;
        if (author.firstName && author.lastName)
          return `${author.firstName} ${author.lastName}`;
        return null;
      }).filter((name: string | null): name is string => name !== null);
    }

    // Try contributors array
    if (item.contributors && Array.isArray(item.contributors)) {
      for (const contributor of item.contributors) {
        if (contributor.type === 'author' && contributor.name) {
          authors.push(contributor.name);
        }
      }
    }

    // Try authors array (lowercase)
    if (authors.length === 0 && item.authors) {
      if (Array.isArray(item.authors)) {
        return item.authors
          .map((author: any) => {
            if (typeof author === 'string') return author;
            if (author.name) return author.name;
            if (author.given && author.family)
              return `${author.given} ${author.family}`;
            if (author.firstName && author.lastName)
              return `${author.firstName} ${author.lastName}`;
            return null;
          })
          .filter((name: string | null): name is string => name !== null);
      }
    }

    // Try author field (single author)
    if (authors.length === 0 && item.author) {
      if (typeof item.author === 'string') {
        return [item.author];
      }
    }

    return authors.length > 0 ? authors : [];
  }

  /**
   * Extract publication year
   */
  private extractYear(item: any): number | undefined {
    if (item.PubYear) {
      const year = parseInt(item.PubYear, 10);
      if (!isNaN(year)) return year;
    }

    if (item.publicationYear) {
      const year = parseInt(item.publicationYear, 10);
      if (!isNaN(year)) return year;
    }

    if (item.publicationDate) {
      const year = new Date(item.publicationDate).getFullYear();
      if (!isNaN(year)) return year;
    }

    if (item.year) {
      const year = parseInt(item.year, 10);
      if (!isNaN(year)) return year;
    }

    if (item.issued && item.issued['date-parts']) {
      const yearPart = item.issued['date-parts'][0]?.[0];
      if (yearPart && !isNaN(yearPart)) return yearPart;
    }

    return undefined;
  }

  /**
   * Extract keywords/subjects
   */
  private extractKeywords(item: any): string[] {
    const keywords: string[] = [];

    if (item.Keywords && Array.isArray(item.Keywords)) {
      keywords.push(
        ...item.Keywords.filter((k: any) => typeof k === 'string'),
      );
    }

    if (item.keywords && Array.isArray(item.keywords)) {
      keywords.push(...item.keywords.filter((k: any) => typeof k === 'string'));
    }

    if (item.subjects && Array.isArray(item.subjects)) {
      keywords.push(...item.subjects.filter((s: any) => typeof s === 'string'));
    }

    if (item.SubjectGroup && Array.isArray(item.SubjectGroup)) {
      keywords.push(
        ...item.SubjectGroup.filter((s: any) => typeof s === 'string'),
      );
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Determine publication type
   */
  private determinePublicationType(item: any): string[] {
    const types: string[] = [];

    if (item.Type) {
      types.push(item.Type);
    }

    if (item.type) {
      types.push(item.type);
    }

    if (item.articleType) {
      types.push(item.articleType);
    }

    // Classify based on content indicators
    if (item.PublicationTitle || item.journalTitle) {
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
   * Estimate impact factor for known Taylor & Francis journals
   * Returns higher IF for prestigious T&F journals
   */
  private estimateImpactFactor(journal: string): number {
    const journalLower = journal.toLowerCase();

    // High-impact T&F journals (IF 5+)
    if (
      journalLower.includes('ergonomics') ||
      journalLower.includes('journal of the american statistical')
    ) {
      return 6.0;
    }

    // Notable T&F journals (IF 3-5)
    if (
      journalLower.includes('international journal of') ||
      journalLower.includes('journal of')
    ) {
      return 3.5;
    }

    // Routledge journals (reputable social sciences)
    if (
      journalLower.includes('routledge') ||
      journalLower.includes('education') ||
      journalLower.includes('psychology') ||
      journalLower.includes('sociology')
    ) {
      return 3.0;
    }

    // Standard T&F journals (IF 2-3)
    if (journalLower.includes('research') || journalLower.includes('studies')) {
      return 2.5;
    }

    // Default for Taylor & Francis (reputable publisher)
    return 2.0;
  }

  /**
   * Estimate quartile for known Taylor & Francis journals
   */
  private estimateQuartile(journal: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    const journalLower = journal.toLowerCase();

    // Q1 journals (top 25%)
    if (
      journalLower.includes('ergonomics') ||
      journalLower.includes('american statistical') ||
      journalLower.includes('international journal of')
    ) {
      return 'Q1';
    }

    // Q2 journals (25-50%)
    if (
      journalLower.includes('routledge') ||
      journalLower.includes('journal of') ||
      journalLower.includes('research')
    ) {
      return 'Q2';
    }

    // Default to Q2 for Taylor & Francis (reputable publisher)
    return 'Q2';
  }

  /**
   * Public utility: Check if journal is from T&F's high-impact portfolio
   * Can be used by other services for journal classification
   */
  public isHighImpactTaylorFrancisJournal(journal: string): boolean {
    const journalLower = journal.toLowerCase();
    return (
      journalLower.includes('ergonomics') ||
      journalLower.includes('american statistical') ||
      journalLower.includes('international journal of')
    );
  }

  /**
   * Public utility: Check if journal is from Routledge imprint
   * Routledge is the flagship social sciences imprint
   */
  public isRoutledgeJournal(journal: string): boolean {
    const journalLower = journal.toLowerCase();
    return journalLower.includes('routledge');
  }
}
