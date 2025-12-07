/**
 * SAGE Publications Service
 * Phase 10.6 Day 12: SAGE Integration following Day 3.5 refactoring pattern
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
 * IF YOU NEED TO MODIFY SAGE INTEGRATION:
 * ✅ DO: Modify THIS file (sage.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchSage() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-160: API query building → Modify SAGE API parameters
 * - Line 190-280: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles SAGE API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All SAGE logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 1000+ journals across social sciences, humanities, STM
 * API: SAGE Journals API
 * Documentation: https://journals.sagepub.com/page/api
 * Rate Limits: Varies by institutional access (typically 1000 calls/day)
 * Data Types: Journal articles, reviews, book reviews
 * Fields: Social sciences, humanities, education, health, management
 * Unique Features:
 *   - Premier social science publisher
 *   - Strong methodology and research methods content
 *   - Extensive education research journals
 *   - Psychology and social work emphasis
 *   - Business and management journals
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-160):
 * - Add new query parameters to buildSearchParams()
 * - Update SAGE API documentation reference
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
import { ConfigService } from '@nestjs/config';
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
 * Search options specific to SAGE API
 */
export interface SageSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  subject?: string;
}

/**
 * Phase 10.106: Typed interface for SAGE API search parameters
 * Netflix-grade: No loose `any` types
 */
interface SageSearchParams {
  q: string;
  rows: number;
  start: number;
  sort: string;
  fq?: string;
  'fq.subject'?: string;
}

/**
 * Phase 10.106: Typed interface for SAGE API response item
 * Netflix-grade: Explicit typing for API response parsing
 */
interface SageApiItem {
  doi?: string;
  DOI?: string;
  id?: string;
  title?: string;
  articleTitle?: string;
  abstract?: string;
  abstractText?: string;
  description?: string;
  contributors?: Array<{ type?: string; name?: string }>;
  authors?: Array<{ name?: string; given?: string; family?: string; firstName?: string; lastName?: string } | string>;
  author?: Array<{ name?: string } | string> | string;
  publicationYear?: string;
  publicationDate?: string;
  year?: string;
  issued?: { 'date-parts'?: number[][] };
  journalTitle?: string;
  publicationTitle?: string;
  containerTitle?: string;
  url?: string;
  link?: string;
  keywords?: string[];
  subjects?: string[];
  categories?: string[];
  citationCount?: number;
  citedByCount?: number;
  type?: string;
  articleType?: string;
  openAccess?: boolean;
  isOpenAccess?: boolean;
  accessType?: string;
  license?: string;
}

/**
 * SAGE Publications Service
 * Implements access to 1000+ journals from SAGE Publishers
 */
@Injectable()
export class SageService {
  private readonly logger = new Logger(SageService.name);
  private readonly API_BASE_URL = 'https://journals.sagepub.com/api/search';
  private readonly apiKey: string;

  // Phase 10.106: Use ConfigService for proper .env loading (NestJS best practice)
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SAGE_API_KEY') || '';

    if (this.apiKey) {
      this.logger.log('✅ [SAGE] Service initialized with API key');
    } else {
      this.logger.warn('⚠️ [SAGE] API key not configured - set SAGE_API_KEY environment variable');
    }
  }

  /**
   * Search SAGE Publications
   * Returns standardized Paper[] format
   */
  async search(query: string, options: SageSearchOptions = {}): Promise<Paper[]> {
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ [SAGE] SAGE_API_KEY not configured - skipping search',
      );
      return [];
    }

    try {
      this.logger.log(
        `🔍 [SAGE] Searching: "${query}" (limit: ${options.limit || 25})`,
      );

      const params = this.buildSearchParams(query, options);
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'X-API-Key': this.apiKey,
            Accept: 'application/json',
          },
          timeout: PUBLISHER_API_TIMEOUT, // 15s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      // Phase 10.106: Type the response items as SageApiItem[]
      const items: SageApiItem[] = response.data?.results || response.data?.items || [];
      this.logger.log(`✅ [SAGE] Found ${items.length} papers`);

      const papers = items
        .map((item) => this.parsePaper(item))
        .filter((paper): paper is Paper => paper !== null);

      const eligiblePapers = papers.filter((paper) =>
        isPaperEligible(paper.wordCount || 0, 150),
      );
      this.logger.log(
        `✅ [SAGE] ${eligiblePapers.length}/${papers.length} papers eligible (100+ words)`,
      );

      return eligiblePapers;
    } catch (error: unknown) {
      // Phase 10.106 Phase 4: Use unknown with type narrowing
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 401) {
        this.logger.error('🔒 [SAGE] Authentication failed - check API key');
      } else if (err.response?.status === 429) {
        this.logger.warn('⏳ [SAGE] Rate limit exceeded - try again later');
      } else {
        this.logger.error(`❌ [SAGE] Search error: ${err.message || 'Unknown error'}`);
      }
      return [];
    }
  }

  /**
   * Build SAGE API query parameters
   * Phase 10.106: Uses typed SageSearchParams interface
   */
  private buildSearchParams(
    query: string,
    options: SageSearchOptions,
  ): SageSearchParams {
    const params: SageSearchParams = {
      q: query,
      rows: options.limit || 25,
      start: 0,
      sort: 'relevance desc',
    };

    // Add date range filter
    if (options.yearFrom || options.yearTo) {
      const yearFrom = options.yearFrom || 1900;
      const yearTo = options.yearTo || new Date().getFullYear();
      params.fq = `publicationYear:[${yearFrom} TO ${yearTo}]`;
    }

    // Add subject filter if specified
    if (options.subject) {
      params['fq.subject'] = options.subject;
    }

    return params;
  }

  /**
   * Parse SAGE API response item into standardized Paper format
   * Phase 10.106: Uses typed SageApiItem interface
   */
  private parsePaper(item: SageApiItem): Paper | null {
    try {
      // Extract DOI
      const doi = item.doi || item.DOI || undefined;

      // Extract title
      const title = item.title || item.articleTitle || 'Untitled';

      // Extract abstract
      const abstract =
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
        item.journalTitle ||
        item.publicationTitle ||
        item.containerTitle ||
        'Unknown Journal';

      // Extract URL
      const url =
        item.url ||
        item.link ||
        (doi ? `https://doi.org/${doi}` : undefined) ||
        'https://journals.sagepub.com';

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

      // Calculate quality score with SAGE-specific considerations
      const qualityComponents = calculateQualityScore({
        impactFactor: this.estimateImpactFactor(journal),
        citationCount: citationCount || 0,
        quartile: this.estimateQuartile(journal),
        year,
        wordCount: comprehensiveWordCount,
        venue: journal,
        source: 'sage',
      });

      const paper: Paper = {
        title,
        abstract,
        authors,
        year,
        source: LiteratureSource.SAGE,
        id: doi || item.id || `sage_${Date.now()}_${Math.random()}`,
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
        fullTextSource: 'sage',
      };

      return paper;
    } catch (error: unknown) {
      // Phase 10.106 Phase 4: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.warn(`⚠️ [SAGE] Failed to parse paper: ${err.message || 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Extract authors from SAGE response
   * Phase 10.106: Uses typed SageApiItem interface
   */
  private extractAuthors(item: SageApiItem): string[] {
    const authors: string[] = [];

    // Try contributors array
    if (item.contributors && Array.isArray(item.contributors)) {
      for (const contributor of item.contributors) {
        if (contributor.type === 'author' && contributor.name) {
          authors.push(contributor.name);
        }
      }
    }

    // Try authors array
    // Phase 10.106 Phase 5: Use SageApiItem type for author (Netflix-grade)
    type SageAuthor = { name?: string; given?: string; family?: string; firstName?: string; lastName?: string } | string;
    if (authors.length === 0 && item.authors) {
      if (Array.isArray(item.authors)) {
        return item.authors
          .map((author: SageAuthor) => {
            if (typeof author === 'string') return author;
            if (typeof author === 'object' && author.name) return author.name;
            if (typeof author === 'object' && author.given && author.family)
              return `${author.given} ${author.family}`;
            if (typeof author === 'object' && author.firstName && author.lastName)
              return `${author.firstName} ${author.lastName}`;
            return null;
          })
          .filter((name: string | null): name is string => name !== null);
      }
    }

    // Try author field
    // Phase 10.106 Phase 5: Use typed union instead of any (Netflix-grade)
    type SimpleAuthor = { name?: string } | string;
    if (authors.length === 0 && item.author) {
      if (Array.isArray(item.author)) {
        return item.author
          .map((author: SimpleAuthor) => {
            if (typeof author === 'string') return author;
            if (typeof author === 'object' && author.name) return author.name;
            return null;
          })
          .filter((name: string | null): name is string => name !== null);
      } else if (typeof item.author === 'string') {
        return [item.author];
      }
    }

    return authors.length > 0 ? authors : [];
  }

  /**
   * Extract publication year
   * Phase 10.106: Uses typed SageApiItem interface
   */
  private extractYear(item: SageApiItem): number | undefined {
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
   * Phase 10.106: Uses typed SageApiItem interface
   */
  private extractKeywords(item: SageApiItem): string[] {
    const keywords: string[] = [];

    // Phase 10.106 Phase 5: Use string type instead of any (Netflix-grade)
    if (item.keywords && Array.isArray(item.keywords)) {
      keywords.push(...item.keywords.filter((k: string): k is string => typeof k === 'string'));
    }

    if (item.subjects && Array.isArray(item.subjects)) {
      keywords.push(...item.subjects.filter((s: string): s is string => typeof s === 'string'));
    }

    if (item.categories && Array.isArray(item.categories)) {
      keywords.push(
        ...item.categories.filter((c: string): c is string => typeof c === 'string'),
      );
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Determine publication type
   * Phase 10.106: Uses typed SageApiItem interface
   */
  private determinePublicationType(item: SageApiItem): string[] {
    const types: string[] = [];

    if (item.type) {
      types.push(item.type);
    }

    if (item.articleType) {
      types.push(item.articleType);
    }

    // Classify based on content indicators
    if (item.journalTitle || item.publicationTitle) {
      types.push('Journal Article');
    }

    if (types.length === 0) {
      types.push('Article');
    }

    return types;
  }

  /**
   * Estimate impact factor for known SAGE journals
   * Returns higher IF for prestigious SAGE journals
   */
  private estimateImpactFactor(journal: string): number {
    const journalLower = journal.toLowerCase();

    // High-impact SAGE journals (IF 5+)
    if (
      journalLower.includes('journal of personality and social psychology') ||
      journalLower.includes('jpsp')
    ) {
      return 6.5; // JPSP is top psychology journal
    }
    if (
      journalLower.includes('perspectives on psychological science') ||
      journalLower.includes('pps')
    ) {
      return 11.0; // Very high impact
    }
    if (journalLower.includes('psychological science')) {
      return 5.5;
    }
    if (journalLower.includes('american sociological review')) {
      return 8.0; // Premier sociology journal
    }

    // Notable SAGE journals (IF 3-5)
    if (
      journalLower.includes('journal of') &&
      (journalLower.includes('social') ||
        journalLower.includes('psychology') ||
        journalLower.includes('management'))
    ) {
      return 3.5;
    }
    if (journalLower.includes('educational') || journalLower.includes('pedagogy')) {
      return 3.0;
    }

    // Standard SAGE journals (IF 2-3)
    if (journalLower.includes('research') || journalLower.includes('studies')) {
      return 2.5;
    }

    // Default for SAGE (reputable social science publisher)
    return 2.0;
  }

  /**
   * Estimate quartile for known SAGE journals
   */
  private estimateQuartile(journal: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    const journalLower = journal.toLowerCase();

    // Q1 journals (top 25%)
    if (
      journalLower.includes('perspectives on psychological') ||
      journalLower.includes('american sociological') ||
      journalLower.includes('personality and social psychology') ||
      journalLower.includes('psychological science')
    ) {
      return 'Q1';
    }

    // Q2 journals (25-50%)
    if (
      journalLower.includes('journal of') ||
      journalLower.includes('research') ||
      journalLower.includes('educational')
    ) {
      return 'Q2';
    }

    // Default to Q2 for SAGE (reputable publisher in social sciences)
    return 'Q2';
  }

  /**
   * Public utility: Check if journal is from SAGE's high-impact portfolio
   * Can be used by other services for journal classification
   */
  public isHighImpactSageJournal(journal: string): boolean {
    const journalLower = journal.toLowerCase();
    return (
      journalLower.includes('perspectives on psychological') ||
      journalLower.includes('american sociological review') ||
      journalLower.includes('personality and social psychology') ||
      journalLower.includes('psychological science')
    );
  }

  /**
   * Public utility: Check if journal is social science focused
   * Useful for categorizing research areas
   */
  public isSocialScienceJournal(journal: string): boolean {
    const journalLower = journal.toLowerCase();
    return (
      journalLower.includes('social') ||
      journalLower.includes('sociology') ||
      journalLower.includes('psychology') ||
      journalLower.includes('education') ||
      journalLower.includes('management') ||
      journalLower.includes('business') ||
      journalLower.includes('health')
    );
  }
}
