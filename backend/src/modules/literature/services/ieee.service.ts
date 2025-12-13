/**
 * IEEE Xplore Service
 * Phase 10.6 Day 8: IEEE Xplore Integration following Day 3.5 refactoring pattern
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
 * IF YOU NEED TO MODIFY IEEE XPLORE INTEGRATION:
 * ✅ DO: Modify THIS file (ieee.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchIEEE() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-150: API query building → Modify IEEE API parameters
 * - Line 180-250: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles IEEE Xplore API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All IEEE Xplore logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 5.5+ million technical papers from IEEE Xplore
 * API: IEEE Xplore REST API v3
 * Documentation: https://developer.ieee.org/docs
 * Rate Limits: 200 calls/day (free tier), 10,000 calls/day (premium)
 * Data Types: Journal articles, conference papers, standards, e-books
 * Fields: Engineering, Computer Science, Electronics, Telecommunications
 * Unique Features:
 *   - IEEE standards documents access
 *   - Conference proceedings indexing
 *   - Technical field classification
 *   - Citation data for engineering research
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-150):
 * - Add new query parameters to buildSearchParams()
 * - Update IEEE API documentation reference
 * - Adjust query string formatting
 *
 * HOW TO CHANGE PAPER PARSING (Lines 180-250):
 * - Modify parsePaper() field extraction
 * - Update author parsing logic
 * - Adjust metadata handling
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
import { RetryService } from '../../../common/services/retry.service';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';
import { LARGE_RESPONSE_TIMEOUT } from '../constants/http-config.constants';

export interface IEEESearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  publicationType?: 'journal' | 'conference' | 'standard' | 'ebook' | 'all';
  technicalField?: string;
}

/**
 * Phase 10.106 Phase 10: IEEE API type definitions
 * Netflix-grade: Full type safety for external API
 */
interface IEEEAuthor {
  full_name?: string;
  authorUrl?: string;
}

interface IEEEAuthorsData {
  authors?: (IEEEAuthor | string)[];
}

interface IEEEArticle {
  content_type?: string;
  article_number?: string;
  title?: string;
  abstract?: string;
  publication_title?: string;
  publication_year?: string;
  doi?: string;
  pdf_url?: string;
  html_url?: string;
  citing_paper_count?: number;
  authors?: IEEEAuthorsData;
  index_terms?: {
    author_terms?: { terms?: string[] };
    ieee_terms?: { terms?: string[] };
  };
  conference_location?: string;
  isbn?: string;
  issn?: string;
  access_type?: string;
}

interface IEEESearchParams {
  apikey: string;
  querytext: string;
  format: string;
  max_records: number;
  start_year?: number;
  end_year?: number;
  content_type?: string;
}

@Injectable()
export class IEEEService {
  private readonly logger = new Logger(IEEEService.name);
  private readonly API_BASE_URL = 'https://ieeexploreapi.ieee.org/api/v1/search/articles';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly retry: RetryService,
  ) {
    this.apiKey = this.configService.get<string>('IEEE_API_KEY') || '';
    this.logger.log('✅ [IEEE Xplore] Service initialized');

    if (!this.apiKey) {
      this.logger.warn('⚠️ [IEEE Xplore] API key not configured - set IEEE_API_KEY');
    }
  }

  /**
   * Search IEEE Xplore database
   *
   * @param query - Search query string
   * @param options - Optional search filters
   * @returns Promise<Paper[]> - Array of parsed papers
   *
   * Rate Limits: Free tier = 200 calls/day
   * Documentation: https://developer.ieee.org/docs
   */
  async search(
    query: string,
    options?: IEEESearchOptions,
  ): Promise<Paper[]> {
    try {
      if (!this.apiKey) {
        this.logger.warn('[IEEE Xplore] Skipping search - API key not configured');
        return [];
      }

      this.logger.log(`[IEEE Xplore] Searching: "${query}"`);

      const params = this.buildSearchParams(query, options);

      const result = await this.retry.executeWithRetry(
        async () => firstValueFrom(
          this.httpService.get(this.API_BASE_URL, {
            params,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: LARGE_RESPONSE_TIMEOUT,
          }),
        ),
        'IEEE.search',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          backoffMultiplier: 2,
          jitterMs: 500,
        },
      );

      const data = result.data?.data;
      if (!data) {
        this.logger.warn('[IEEE Xplore] API returned invalid response');
        return [];
      }

      const totalRecords = data.total_records || 0;
      this.logger.log(`[IEEE Xplore] Found ${totalRecords} results (attempts: ${result.attempts})`);

      const articles: IEEEArticle[] = data.articles || [];
      const papers = articles
        .map((article) => this.parsePaper(article))
        .filter((paper): paper is Paper => paper !== null);

      this.logger.log(`[IEEE Xplore] Returning ${papers.length} eligible papers`);
      return papers;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 401) {
        this.logger.error('[IEEE Xplore] Authentication failed - check API key');
      } else if (err.response?.status === 429) {
        this.logger.error('[IEEE Xplore] Rate limit exceeded');
      } else {
        this.logger.error(`[IEEE Xplore] Search failed: ${err.message || 'Unknown error'}`);
      }
      return [];
    }
  }

  private buildSearchParams(
    query: string,
    options?: IEEESearchOptions,
  ): IEEESearchParams {
    const params: IEEESearchParams = {
      apikey: this.apiKey,
      querytext: query,
      format: 'json',
      max_records: options?.limit || 25,
    };

    if (options?.yearFrom) {
      params.start_year = options.yearFrom;
    }

    if (options?.yearTo) {
      params.end_year = options.yearTo;
    }

    if (options?.publicationType && options.publicationType !== 'all') {
      params.content_type = this.mapPublicationType(options.publicationType);
    }

    return params;
  }

  /**
   * Map internal publication type to IEEE API content type
   */
  private mapPublicationType(type: string): string {
    const mapping: Record<string, string> = {
      journal: 'Journals',
      conference: 'Conferences',
      standard: 'Standards',
      ebook: 'eBooks',
    };
    return mapping[type] || 'Journals';
  }

  private parsePaper(article: IEEEArticle): Paper | null {
    try {
      // Extract core metadata
      const title = article.title || 'Untitled';
      const abstract = article.abstract || '';

      // Skip papers without meaningful content
      if (!title || title === 'Untitled') {
        return null;
      }

      // Extract authors
      const authors = this.extractAuthors(article.authors);

      // Extract year from publication date
      const year = article.publication_year
        ? parseInt(article.publication_year, 10)
        : undefined;

      // Extract DOI
      const doi = article.doi || undefined;

      // Extract venue (journal or conference)
      const venue =
        article.publication_title ||
        article.conference_location ||
        undefined;

      // Extract publication type (convert to array as per Paper interface)
      const publicationTypeString = this.determinePublicationType(article);
      const publicationType = publicationTypeString ? [publicationTypeString] : undefined;

      // Extract IEEE-specific metadata
      const ieeeMetadata = {
        articleNumber: article.article_number || null,
        isbn: article.isbn || null,
        issn: article.issn || null,
        contentType: article.content_type || null,
        indexTerms: article.index_terms?.ieee_terms?.terms || [],
      };

      // Calculate word counts
      const abstractWordCount = calculateAbstractWordCount(abstract);
      const wordCount = calculateComprehensiveWordCount(title, abstract);

      // Calculate quality score
      const citationCount = article.citing_paper_count || 0;
      const qualityComponents = calculateQualityScore({
        citationCount,
        year,
        wordCount,
        venue,
        source: LiteratureSource.IEEE_XPLORE,
        impactFactor: null, // IEEE doesn't provide impact factor
        sjrScore: null,
        quartile: null,
        hIndexJournal: null,
      });

      // Build IEEE Xplore URL
      const ieeeUrl = article.doi
        ? `https://doi.org/${article.doi}`
        : article.html_url || undefined;

      // Check for PDF access
      const pdfUrl = article.pdf_url || null;
      const hasFullText = !!pdfUrl || !!abstract;

      return {
        id: article.article_number || `ieee_${Date.now()}_${Math.random()}`,
        title,
        authors,
        year,
        abstract,
        doi,
        url: ieeeUrl,
        venue,
        source: LiteratureSource.IEEE_XPLORE,
        publicationType,
        fieldsOfStudy: ieeeMetadata.indexTerms || null,
        wordCount,
        wordCountExcludingRefs: wordCount,
        isEligible: isPaperEligible(wordCount, 150),
        abstractWordCount,
        pdfUrl: pdfUrl || undefined,
        openAccessStatus: article.access_type === 'OPEN_ACCESS' ? 'OPEN_ACCESS' : null,
        hasPdf: !!pdfUrl,
        hasFullText,
        fullTextStatus: hasFullText ? 'available' : 'not_fetched',
        fullTextSource: pdfUrl ? 'ieee' : undefined,
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50,
        citationCount,
        // Phase 10.120: Add metadataCompleteness for honest scoring transparency
        metadataCompleteness: qualityComponents.metadataCompleteness,
        // IEEE-specific metadata stored in ieeeMetadata variable above
        // Can be extended by adding fields to Paper interface if needed
      };
    } catch (error: unknown) {
      // Phase 10.106 Phase 4: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.warn(
        `[IEEE Xplore] Failed to parse article: ${err.message || 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Extract and format author names from IEEE API response
   * Phase 10.106 Phase 10: Fully typed
   */
  private extractAuthors(authorsData: IEEEAuthorsData | undefined): string[] {
    if (!authorsData) return [];

    // IEEE API returns authors as an object with authors array
    const authors = authorsData.authors || [];

    return authors
      .map((author: IEEEAuthor | string) => {
        if (typeof author === 'string') {
          return author;
        }
        // IEEE API format: { full_name: "John Doe" }
        return author.full_name || author.authorUrl || '';
      })
      .filter((name: string) => name.length > 0);
  }

  /**
   * Determine publication type from IEEE metadata
   * Phase 10.106 Phase 10: Fully typed
   */
  private determinePublicationType(article: IEEEArticle): string | null {
    const contentType = article.content_type?.toLowerCase() || '';

    if (contentType.includes('journals')) {
      return 'journal-article';
    } else if (contentType.includes('conferences')) {
      return 'conference-paper';
    } else if (contentType.includes('standards')) {
      return 'standard';
    } else if (contentType.includes('books')) {
      return 'book';
    }

    // Default to journal article
    return 'journal-article';
  }

  /**
   * Check if a technical field matches engineering/CS domains
   * Useful for filtering relevant papers
   */
  isEngineeringDomain(indexTerms: string[]): boolean {
    const engineeringKeywords = [
      'computer',
      'software',
      'algorithm',
      'network',
      'circuit',
      'signal',
      'wireless',
      'electronics',
      'telecommunications',
      'robotics',
      'artificial intelligence',
      'machine learning',
      'data mining',
    ];

    return indexTerms.some((term) =>
      engineeringKeywords.some((keyword) =>
        term.toLowerCase().includes(keyword),
      ),
    );
  }
}
