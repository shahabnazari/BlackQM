/**
 * SpringerLink Service
 * Phase 10.6 Day 9: SpringerLink Integration following Day 3.5 refactoring pattern
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
 * IF YOU NEED TO MODIFY SPRINGERLINK INTEGRATION:
 * ✅ DO: Modify THIS file (springer.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchSpringer() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-160: API query building → Modify Springer API parameters
 * - Line 190-280: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles SpringerLink API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All SpringerLink logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 15+ million documents from Springer Nature publishers
 * API: Springer Nature Meta API v2
 * Documentation: https://dev.springernature.com/
 * Rate Limits: 5,000 calls/day (free tier), higher for institutional
 * Data Types: Journal articles, books, book chapters, protocols, references
 * Fields: All sciences (multidisciplinary, STM focus)
 * Unique Features:
 *   - Access to Nature journals family
 *   - Book chapter indexing
 *   - Protocol articles (Methods)
 *   - Comprehensive metadata (subject classifications, funding)
 *   - OpenAccess status via API
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-160):
 * - Add new query parameters to buildSearchParams()
 * - Update Springer API documentation reference
 * - Adjust query string formatting (q parameter syntax)
 *
 * HOW TO CHANGE PAPER PARSING (Lines 190-280):
 * - Modify parsePaper() field extraction
 * - Update author parsing logic (creators field)
 * - Adjust metadata handling (subjects, onlineDate)
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
import { LARGE_RESPONSE_TIMEOUT } from '../constants/http-config.constants';

/**
 * Search options specific to Springer Nature API
 */
export interface SpringerSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  // Springer-specific filters
  subject?: string; // Subject classification
  contentType?: 'journal' | 'book' | 'protocol' | 'all';
  openAccessOnly?: boolean;
}

/**
 * SpringerLink Service
 * Provides search capabilities for Springer Nature publications
 *
 * Note: Springer Nature API requires registration and API key
 * Free tier: 5,000 calls/day
 * Institutional tier: Higher limits based on subscription
 */
@Injectable()
export class SpringerService {
  private readonly logger = new Logger(SpringerService.name);

  // Springer Nature Meta API v2 endpoint
  private readonly API_BASE_URL =
    'https://api.springernature.com/meta/v2/json';

  // API Key should be stored in environment variables
  // Format: process.env.SPRINGER_API_KEY
  private readonly API_KEY = process.env.SPRINGER_API_KEY || '';

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [SpringerLink] Service initialized');

    // Log API key status
    if (this.API_KEY) {
      this.logger.log('[SpringerLink] API key configured - using authenticated limits (5,000 calls/day)');
    } else {
      this.logger.warn(
        '⚠️ [SpringerLink] API key not configured - set SPRINGER_API_KEY environment variable',
      );
    }
  }

  /**
   * Search Springer Nature database
   *
   * @param query - Search query string
   * @param options - Optional search filters
   * @returns Promise<Paper[]> - Array of parsed papers
   *
   * Rate Limits: Free tier = 5,000 calls/day
   * Documentation: https://dev.springernature.com/
   */
  async search(
    query: string,
    options?: SpringerSearchOptions,
  ): Promise<Paper[]> {
    try {
      // Check for API key
      if (!this.API_KEY) {
        this.logger.warn(
          '[SpringerLink] Skipping search - API key not configured',
        );
        return [];
      }

      this.logger.log(`[SpringerLink] Searching: "${query}"`);

      // Build Springer API query parameters
      const params = this.buildSearchParams(query, options);

      // Make HTTP request to Springer API
      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: LARGE_RESPONSE_TIMEOUT, // 30s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      // Parse Springer API response
      const data = response.data;
      const totalRecords = data.result?.[0]?.total || 0;
      this.logger.log(
        `[SpringerLink] Found ${totalRecords} results for "${query}"`,
      );

      // Extract and parse records
      const records = data.records || [];
      const papers = records
        .map((record: any) => this.parsePaper(record))
        .filter((paper: Paper | null) => paper !== null) as Paper[];

      this.logger.log(
        `[SpringerLink] Returning ${papers.length} eligible papers`,
      );
      return papers;
    } catch (error: any) {
      // Graceful error handling - log and return empty array
      if (error.response?.status === 401) {
        this.logger.error(
          '[SpringerLink] Authentication failed - check API key',
        );
      } else if (error.response?.status === 429) {
        this.logger.error(
          '[SpringerLink] Rate limit exceeded - try again later',
        );
      } else {
        this.logger.error(`[SpringerLink] Search failed: ${error.message}`);
      }
      return []; // Graceful degradation
    }
  }

  /**
   * Build Springer API query parameters
   *
   * @param query - User search query
   * @param options - Optional filters
   * @returns Query parameters object
   */
  private buildSearchParams(
    query: string,
    options?: SpringerSearchOptions,
  ): Record<string, any> {
    const params: Record<string, any> = {
      api_key: this.API_KEY,
      q: query,
      p: options?.limit || 25,
      s: 1, // Start position
    };

    // Add year range filters (Springer uses date range format)
    if (options?.yearFrom || options?.yearTo) {
      const yearFrom = options?.yearFrom || 1900;
      const yearTo = options?.yearTo || new Date().getFullYear();
      params.q += ` onlinedate:${yearFrom}-${yearTo}`;
    }

    // Add subject filter
    if (options?.subject) {
      params.q += ` subject:${options.subject}`;
    }

    // Add content type filter
    if (options?.contentType && options.contentType !== 'all') {
      params.q += ` type:${options.contentType}`;
    }

    // Filter for open access only
    if (options?.openAccessOnly) {
      params.q += ' openaccess:true';
    }

    return params;
  }

  /**
   * Parse Springer API record to Paper object
   *
   * @param record - Raw Springer API record object
   * @returns Paper object or null if invalid
   */
  private parsePaper(record: any): Paper | null {
    try {
      // Extract core metadata
      const title = record.title || 'Untitled';
      const abstract = record.abstract || '';

      // Skip papers without meaningful content
      if (!title || title === 'Untitled') {
        return null;
      }

      // Extract authors (Springer uses 'creators' field)
      const authors = this.extractAuthors(record.creators);

      // Extract year from publication date
      const year = this.extractYear(
        record.publicationDate || record.onlineDate,
      );

      // Extract DOI (required for Springer papers)
      const doi = record.doi || null;

      // Extract venue (journal or book title)
      const venue =
        record.publicationName ||
        record.journalTitle ||
        record.bookTitle ||
        null;

      // Extract publication type
      const publicationTypeString = this.determinePublicationType(record);
      const publicationType = publicationTypeString
        ? [publicationTypeString]
        : undefined;

      // Extract subjects/fields of study
      const subjects = this.extractSubjects(record.subjects);

      // Extract Springer-specific metadata (available if needed in future)

      // Calculate word counts
      const abstractWordCount = calculateAbstractWordCount(abstract);
      const wordCount = calculateComprehensiveWordCount(title, abstract);

      // Calculate quality score
      const citationCount = 0; // Springer API doesn't provide citation count
      const qualityComponents = calculateQualityScore({
        citationCount,
        year,
        wordCount,
        venue,
        source: LiteratureSource.SPRINGER,
        impactFactor: null, // Not provided by API
        sjrScore: null,
        quartile: null,
        hIndexJournal: null,
      });

      // Build Springer URL
      const springerUrl = record.url?.[0]?.value || (doi ? `https://doi.org/${doi}` : null);

      // Check for open access and PDF availability
      const isOpenAccess = record.openaccess === 'true' || record.openaccess === true;
      const pdfUrl = isOpenAccess && doi ? `https://link.springer.com/content/pdf/${doi}.pdf` : null;
      const hasFullText = !!pdfUrl || !!abstract;

      // FIX: API sources without full text only have title+abstract (~200-300 words)
      // Use lower threshold (150 words) instead of default (1000 words) for API sources
      return {
        id: doi || `springer_${Date.now()}_${Math.random()}`,
        title,
        authors,
        year,
        abstract,
        doi,
        url: springerUrl,
        venue,
        source: LiteratureSource.SPRINGER,
        publicationType,
        fieldsOfStudy: subjects.length > 0 ? subjects : undefined,
        wordCount,
        wordCountExcludingRefs: wordCount,
        isEligible: isPaperEligible(wordCount, 150),
        abstractWordCount,
        pdfUrl: pdfUrl || undefined,
        openAccessStatus: isOpenAccess ? 'OPEN_ACCESS' : null,
        hasPdf: !!pdfUrl,
        hasFullText,
        fullTextStatus: hasFullText ? 'available' : 'not_fetched',
        fullTextSource: pdfUrl ? 'springer' : undefined,
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50,
        citationCount,
        // Springer-specific metadata stored in springerMetadata variable above
        // Can be extended by adding fields to Paper interface if needed
      };
    } catch (error: any) {
      this.logger.warn(
        `[SpringerLink] Failed to parse record: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Extract and format author names from Springer API response
   */
  private extractAuthors(creatorsData: any): string[] {
    if (!creatorsData) return [];

    // Springer API returns creators as array
    const creators = Array.isArray(creatorsData) ? creatorsData : [];

    return creators
      .map((creator: any) => {
        if (typeof creator === 'string') {
          return creator;
        }
        // Springer API format: { creator: "John Doe" }
        return creator.creator || '';
      })
      .filter((name: string) => name.length > 0);
  }

  /**
   * Extract year from publication date string
   */
  private extractYear(dateString: string | undefined): number | undefined {
    if (!dateString) return undefined;

    // Springer dates can be in various formats: "2023", "2023-05-15", etc.
    const yearMatch = dateString.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  }

  /**
   * Extract subjects/fields of study from Springer metadata
   */
  private extractSubjects(subjectsData: any): string[] {
    if (!subjectsData) return [];

    const subjects = Array.isArray(subjectsData) ? subjectsData : [];

    return subjects
      .map((subject: any) => {
        if (typeof subject === 'string') {
          return subject;
        }
        // Springer API format: { subject: "Computer Science" }
        return subject.subject || '';
      })
      .filter((name: string) => name.length > 0)
      .slice(0, 10); // Limit to top 10 subjects
  }

  /**
   * Determine publication type from Springer metadata
   */
  private determinePublicationType(record: any): string | null {
    const contentType = record.contentType?.toLowerCase() || '';

    if (contentType.includes('article') || contentType.includes('journal')) {
      return 'journal-article';
    } else if (contentType.includes('chapter')) {
      return 'book-chapter';
    } else if (contentType.includes('book')) {
      return 'book';
    } else if (contentType.includes('protocol')) {
      return 'protocol';
    } else if (contentType.includes('reference')) {
      return 'reference-entry';
    }

    // Default to journal article
    return 'journal-article';
  }

  /**
   * Check if subjects match scientific research domains
   * Useful for filtering relevant papers
   */
  isScientificDomain(subjects: string[]): boolean {
    const scientificKeywords = [
      'biology',
      'chemistry',
      'physics',
      'medicine',
      'computer science',
      'mathematics',
      'engineering',
      'psychology',
      'social sciences',
      'neuroscience',
      'genetics',
      'ecology',
      'biomedicine',
    ];

    return subjects.some((subject) =>
      scientificKeywords.some((keyword) =>
        subject.toLowerCase().includes(keyword),
      ),
    );
  }
}
