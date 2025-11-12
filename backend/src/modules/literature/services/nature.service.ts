/**
 * Nature Service
 * Phase 10.6 Day 10: Nature Integration following Day 3.5 refactoring pattern
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
 * IF YOU NEED TO MODIFY NATURE INTEGRATION:
 * ✅ DO: Modify THIS file (nature.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchNature() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * MODIFICATION GUIDE:
 * - Line 120-160: API query building → Modify Nature API parameters
 * - Line 190-280: Paper parsing → Adjust field extraction
 * - Line 90-100: API configuration → Update API_BASE_URL or endpoints
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles Nature API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used by other services/features
 * 8. Maintainability: All Nature logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: High-impact journals from Nature Publishing Group
 * API: Springer Nature API (Nature is part of Springer Nature)
 * Documentation: https://dev.springernature.com/
 * Rate Limits: Same as Springer (5,000 calls/day free tier)
 * Data Types: Journal articles from Nature portfolio (Nature, Nature Medicine, etc.)
 * Fields: Multidisciplinary sciences with focus on breakthrough research
 * Unique Features:
 *   - Highest impact factors (Nature IF ~69)
 *   - Prestigious venue for quality scoring
 *   - Rigorous peer review
 *   - Breakthrough research focus
 *   - Nature family journals (Nature Medicine, Nature Genetics, etc.)
 *
 * ============================================================================
 * 📝 INLINE MODIFICATION GUIDES
 * ============================================================================
 *
 * HOW TO CHANGE API QUERY BUILDING (Lines 120-160):
 * - Add new query parameters to buildSearchParams()
 * - Update API documentation reference
 * - Adjust query string formatting
 *
 * HOW TO CHANGE PAPER PARSING (Lines 190-280):
 * - Modify parsePaper() field extraction
 * - Update author parsing logic
 * - Adjust metadata handling
 * - Change quality score calculation (Nature has high impact factor)
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
 * Search options specific to Nature API
 */
export interface NatureSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  // Nature-specific filters
  journal?: string; // Specific Nature journal (e.g., 'Nature', 'Nature Medicine')
  openAccessOnly?: boolean;
}

/**
 * Nature Service
 * Provides search capabilities for Nature Publishing Group journals
 *
 * Note: Nature uses Springer Nature API (same as SpringerLink)
 * API key required: SPRINGER_API_KEY environment variable
 */
@Injectable()
export class NatureService {
  private readonly logger = new Logger(NatureService.name);

  // Springer Nature API (Nature is part of Springer Nature)
  private readonly API_BASE_URL =
    'https://api.springernature.com/meta/v2/json';

  // Uses same API key as Springer
  private readonly API_KEY = process.env.SPRINGER_API_KEY || '';

  // Nature impact factor (approximate, for quality scoring)
  private readonly NATURE_IMPACT_FACTOR = 69.0;

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [Nature] Service initialized');

    if (!this.API_KEY) {
      this.logger.warn(
        '⚠️ [Nature] API key not configured - set SPRINGER_API_KEY environment variable',
      );
    }
  }

  /**
   * Search Nature journals
   *
   * @param query - Search query string
   * @param options - Optional search filters
   * @returns Promise<Paper[]> - Array of parsed papers
   *
   * Note: Uses Springer Nature API with nature.com filter
   */
  async search(
    query: string,
    options?: NatureSearchOptions,
  ): Promise<Paper[]> {
    try {
      if (!this.API_KEY) {
        this.logger.warn('[Nature] Skipping search - API key not configured');
        return [];
      }

      this.logger.log(`[Nature] Searching: "${query}"`);

      // Build API query parameters (filter to Nature journals)
      const params = this.buildSearchParams(query, options);

      // Make HTTP request to Springer Nature API
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

      const data = response.data;
      const totalRecords = data.result?.[0]?.total || 0;
      this.logger.log(`[Nature] Found ${totalRecords} results for "${query}"`);

      // Extract and parse records
      const records = data.records || [];
      const papers = records
        .map((record: any) => this.parsePaper(record))
        .filter((paper: Paper | null) => paper !== null) as Paper[];

      this.logger.log(`[Nature] Returning ${papers.length} eligible papers`);
      return papers;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger.error('[Nature] Authentication failed - check API key');
      } else if (error.response?.status === 429) {
        this.logger.error('[Nature] Rate limit exceeded - try again later');
      } else {
        this.logger.error(`[Nature] Search failed: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Build Nature API query parameters
   * Filters to Nature journals via URL pattern
   */
  private buildSearchParams(
    query: string,
    options?: NatureSearchOptions,
  ): Record<string, any> {
    const params: Record<string, any> = {
      api_key: this.API_KEY,
      // Filter to Nature journals only
      q: `${query} journal:Nature`,
      p: options?.limit || 25,
      s: 1,
    };

    // Add year range filters
    if (options?.yearFrom || options?.yearTo) {
      const yearFrom = options?.yearFrom || 1900;
      const yearTo = options?.yearTo || new Date().getFullYear();
      params.q += ` onlinedate:${yearFrom}-${yearTo}`;
    }

    // Filter to specific Nature journal
    if (options?.journal) {
      params.q = `${query} journal:${options.journal}`;
    }

    // Filter for open access only
    if (options?.openAccessOnly) {
      params.q += ' openaccess:true';
    }

    return params;
  }

  /**
   * Parse Nature API record to Paper object
   */
  private parsePaper(record: any): Paper | null {
    try {
      const title = record.title || 'Untitled';
      const abstract = record.abstract || '';

      if (!title || title === 'Untitled') {
        return null;
      }

      // Extract authors
      const authors = this.extractAuthors(record.creators);

      // Extract year
      const year = this.extractYear(
        record.publicationDate || record.onlineDate,
      );

      // Extract DOI (required for Nature papers)
      const doi = record.doi || null;

      // Extract venue (Nature journal name)
      const venue = record.publicationName || record.journalTitle || null;

      // Publication type (Nature is always journal articles)
      const publicationType = ['journal-article'];

      // Extract subjects
      const subjects = this.extractSubjects(record.subjects);

      // Calculate word counts
      const abstractWordCount = calculateAbstractWordCount(abstract);
      const wordCount = calculateComprehensiveWordCount(title, abstract);

      // Calculate quality score with Nature's high impact factor
      const citationCount = 0; // API doesn't provide citation count
      const qualityComponents = calculateQualityScore({
        citationCount,
        year,
        wordCount,
        venue,
        source: LiteratureSource.NATURE,
        impactFactor: this.NATURE_IMPACT_FACTOR, // Nature has very high IF
        sjrScore: null,
        quartile: 'Q1', // Nature is always Q1
        hIndexJournal: null,
      });

      // Build Nature URL
      const natureUrl = record.url?.[0]?.value || (doi ? `https://doi.org/${doi}` : null);

      // Check for open access
      const isOpenAccess = record.openaccess === 'true' || record.openaccess === true;
      const pdfUrl = isOpenAccess && doi ? `https://www.nature.com/articles/${doi}.pdf` : null;
      const hasFullText = !!pdfUrl || !!abstract;

      return {
        id: doi || `nature_${Date.now()}_${Math.random()}`,
        title,
        authors,
        year,
        abstract,
        doi,
        url: natureUrl,
        venue,
        source: LiteratureSource.NATURE,
        publicationType,
        fieldsOfStudy: subjects.length > 0 ? subjects : undefined,
        wordCount,
        wordCountExcludingRefs: wordCount,
        isEligible: isPaperEligible(wordCount),
        abstractWordCount,
        pdfUrl: pdfUrl || undefined,
        openAccessStatus: isOpenAccess ? 'OPEN_ACCESS' : null,
        hasPdf: !!pdfUrl,
        hasFullText,
        fullTextStatus: hasFullText ? 'available' : 'not_fetched',
        fullTextSource: pdfUrl ? 'nature' : undefined,
        qualityScore: qualityComponents.totalScore,
        isHighQuality: qualityComponents.totalScore >= 50, // Nature papers are always high quality
        citationCount,
        // Nature-specific: High impact factor benefit
        impactFactor: this.NATURE_IMPACT_FACTOR,
        quartile: 'Q1',
      };
    } catch (error: any) {
      this.logger.warn(`[Nature] Failed to parse record: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract and format author names
   */
  private extractAuthors(creatorsData: any): string[] {
    if (!creatorsData) return [];

    const creators = Array.isArray(creatorsData) ? creatorsData : [];

    return creators
      .map((creator: any) => {
        if (typeof creator === 'string') {
          return creator;
        }
        return creator.creator || '';
      })
      .filter((name: string) => name.length > 0);
  }

  /**
   * Extract year from publication date string
   */
  private extractYear(dateString: string | undefined): number | undefined {
    if (!dateString) return undefined;

    const yearMatch = dateString.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  }

  /**
   * Extract subjects/fields of study
   */
  private extractSubjects(subjectsData: any): string[] {
    if (!subjectsData) return [];

    const subjects = Array.isArray(subjectsData) ? subjectsData : [];

    return subjects
      .map((subject: any) => {
        if (typeof subject === 'string') {
          return subject;
        }
        return subject.subject || '';
      })
      .filter((name: string) => name.length > 0)
      .slice(0, 10);
  }

  /**
   * Check if subjects match high-impact research domains
   * Nature focuses on breakthrough, multidisciplinary research
   */
  isBreakthroughResearch(subjects: string[]): boolean {
    const breakthroughKeywords = [
      'breakthrough',
      'novel',
      'discovery',
      'innovation',
      'fundamental',
      'pioneering',
      'groundbreaking',
      'transformative',
      'paradigm',
      'cutting-edge',
    ];

    return subjects.some((subject) =>
      breakthroughKeywords.some((keyword) =>
        subject.toLowerCase().includes(keyword),
      ),
    );
  }
}
