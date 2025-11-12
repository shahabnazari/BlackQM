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
import { firstValueFrom } from 'rxjs';
import { LiteratureSource, Paper } from '../dto/literature.dto';
import { calculateQualityScore } from '../utils/paper-quality.util';
import {
  calculateAbstractWordCount,
  calculateComprehensiveWordCount,
  isPaperEligible,
} from '../utils/word-count.util';

/**
 * Search options specific to IEEE Xplore API
 */
export interface IEEESearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  // IEEE-specific filters
  publicationType?: 'journal' | 'conference' | 'standard' | 'ebook' | 'all';
  technicalField?: string; // CS, EE, Telecom, etc.
}

/**
 * IEEE Xplore Service
 * Provides search capabilities for IEEE digital library
 *
 * Note: IEEE Xplore API requires registration and API key
 * Free tier: 200 calls/day
 * Premium tier: 10,000 calls/day
 */
@Injectable()
export class IEEEService {
  private readonly logger = new Logger(IEEEService.name);

  // IEEE Xplore REST API v3 endpoint
  private readonly API_BASE_URL =
    'https://ieeexploreapi.ieee.org/api/v1/search/articles';

  // API Key should be stored in environment variables
  // Format: process.env.IEEE_API_KEY
  private readonly API_KEY = process.env.IEEE_API_KEY || '';

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [IEEE Xplore] Service initialized');

    // Warn if API key is not configured
    if (!this.API_KEY) {
      this.logger.warn(
        '⚠️ [IEEE Xplore] API key not configured - set IEEE_API_KEY environment variable',
      );
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
      // Check for API key
      if (!this.API_KEY) {
        this.logger.warn(
          '[IEEE Xplore] Skipping search - API key not configured',
        );
        return [];
      }

      this.logger.log(`[IEEE Xplore] Searching: "${query}"`);

      // Build IEEE API query parameters
      const params = this.buildSearchParams(query, options);

      // Make HTTP request to IEEE API
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }),
      );

      // Parse IEEE API response
      const data = response.data;
      const totalRecords = data.total_records || 0;
      this.logger.log(
        `[IEEE Xplore] Found ${totalRecords} results for "${query}"`,
      );

      // Extract and parse articles
      const articles = data.articles || [];
      const papers = articles
        .map((article: any) => this.parsePaper(article))
        .filter((paper: Paper | null) => paper !== null) as Paper[];

      this.logger.log(
        `[IEEE Xplore] Returning ${papers.length} eligible papers`,
      );
      return papers;
    } catch (error: any) {
      // Graceful error handling - log and return empty array
      if (error.response?.status === 401) {
        this.logger.error('[IEEE Xplore] Authentication failed - check API key');
      } else if (error.response?.status === 429) {
        this.logger.error('[IEEE Xplore] Rate limit exceeded - try again later');
      } else {
        this.logger.error(`[IEEE Xplore] Search failed: ${error.message}`);
      }
      return []; // Graceful degradation
    }
  }

  /**
   * Build IEEE API query parameters
   *
   * @param query - User search query
   * @param options - Optional filters
   * @returns Query parameters object
   */
  private buildSearchParams(
    query: string,
    options?: IEEESearchOptions,
  ): Record<string, any> {
    const params: Record<string, any> = {
      apikey: this.API_KEY,
      querytext: query,
      format: 'json',
      max_records: options?.limit || 25,
    };

    // Add year range filters
    if (options?.yearFrom) {
      params.start_year = options.yearFrom;
    }

    if (options?.yearTo) {
      params.end_year = options.yearTo;
    }

    // Add publication type filter
    if (options?.publicationType && options.publicationType !== 'all') {
      params.content_type = this.mapPublicationType(
        options.publicationType,
      );
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

  /**
   * Parse IEEE API article response to Paper object
   *
   * @param article - Raw IEEE API article object
   * @returns Paper object or null if invalid
   */
  private parsePaper(article: any): Paper | null {
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
      const doi = article.doi || null;

      // Extract venue (journal or conference)
      const venue =
        article.publication_title ||
        article.conference_location ||
        null;

      // Extract publication type (convert to array as per Paper interface)
      const publicationTypeString = this.determinePublicationType(article);
      const publicationType = publicationTypeString ? [publicationTypeString] : undefined;

      // Extract IEEE-specific metadata
      const ieeeMetadata = {
        articleNumber: article.article_number || null,
        isbn: article.isbn || null,
        issn: article.issn || null,
        contentType: article.content_type || null,
        indexTerms: article.index_terms?.ieee_terms || [],
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
        : article.html_url || null;

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
        isEligible: isPaperEligible(wordCount),
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
        // IEEE-specific metadata stored in ieeeMetadata variable above
        // Can be extended by adding fields to Paper interface if needed
      };
    } catch (error: any) {
      this.logger.warn(
        `[IEEE Xplore] Failed to parse article: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Extract and format author names from IEEE API response
   */
  private extractAuthors(authorsData: any): string[] {
    if (!authorsData) return [];

    // IEEE API returns authors as an object with authors array
    const authors = authorsData.authors || [];

    return authors
      .map((author: any) => {
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
   */
  private determinePublicationType(article: any): string | null {
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
