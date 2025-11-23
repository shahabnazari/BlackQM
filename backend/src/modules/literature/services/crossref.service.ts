/**
 * CrossRef Service
 * Phase 10.6 Day 3.5: Extracted from literature.service.ts (lines 602-697)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - DEDICATED SOURCE SERVICE
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * This service was extracted from a 4,046-line God class (literature.service.ts)
 * following the same clean pattern as semantic-scholar.service.ts
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - 97 lines of inline implementation in literature.service.ts
 * - HTTP logic, parsing, and mapping embedded in orchestration layer
 * - Difficult to unit test (tightly coupled to God class)
 * - Code duplication with other sources
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Dedicated service class (Single Responsibility Principle)
 * - Testable in isolation (mock HttpService dependency)
 * - Reusable for DOI resolution in other features
 * - literature.service.ts only contains thin 15-line wrapper
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY CROSSREF INTEGRATION:
 * ✅ DO: Modify THIS file (crossref.service.ts)
 * ❌ DON'T: Add logic to literature.service.ts searchCrossRef() method
 * ❌ DON'T: Inline HTTP calls or parsing logic anywhere else
 *
 * EXAMPLES OF CORRECT MODIFICATIONS:
 * - Add new filters → Update params object in search() method
 * - Change DOI parsing → Update parsePaper() method
 * - Add caching → Add cache check before HTTP call
 * - Add custom headers → Modify httpService.get() call
 *
 * WRAPPER METHOD (literature.service.ts):
 * Should remain a thin 15-line wrapper that only handles orchestration
 *
 * ============================================================================
 * 📊 ENTERPRISE PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. Single Responsibility: This service ONLY handles CrossRef API
 * 2. Dependency Injection: HttpService injected via constructor
 * 3. Testability: Can mock HttpService for unit tests
 * 4. Error Handling: Graceful degradation (returns empty array)
 * 5. Logging: Clear, structured logging for debugging
 * 6. Type Safety: Strong typing with Paper interface
 * 7. Reusability: Can be used for DOI resolution by other services
 * 8. Maintainability: All CrossRef logic in ONE place
 *
 * ============================================================================
 * 🎯 SERVICE CAPABILITIES
 * ============================================================================
 *
 * Coverage: 140M+ DOI records (academic papers, books, datasets)
 * API: Free, no key required (50 requests/second limit)
 * Features:
 * - DOI-based metadata lookup
 * - Citation counts (is-referenced-by-count)
 * - Publication dates and venues
 * - Author information with ORCID IDs
 * - Publisher information
 * - Open access status
 *
 * @see https://api.crossref.org/
 * @see https://github.com/CrossRef/rest-api-doc
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
import { FAST_API_TIMEOUT } from '../constants/http-config.constants';

export interface CrossRefSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

@Injectable()
export class CrossRefService {
  private readonly logger = new Logger(CrossRefService.name);
  private readonly API_BASE_URL = 'https://api.crossref.org/works';
  private readonly userAgent: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Phase 10.7.10: CrossRef Polite Pool - Add mailto to User-Agent for better service
    // https://github.com/CrossRef/rest-api-doc#good-manners--more-reliable-service
    const contactEmail = this.configService.get<string>('CROSSREF_CONTACT_EMAIL') || 'research@vqmethod.com';
    this.userAgent = `VQMethod/1.0 (https://github.com/vqmethod/platform; mailto:${contactEmail})`;
    this.logger.log(`[CrossRef] Polite pool enabled with contact: ${contactEmail}`);
  }

  /**
   * Search CrossRef database
   * @param query Search query string
   * @param options Search filters (year range, limit)
   * @returns Array of Paper objects
   */
  async search(
    query: string,
    options?: CrossRefSearchOptions,
  ): Promise<Paper[]> {
    try {
      this.logger.log(`[CrossRef] Searching: "${query}"`);

      const params: any = {
        query,
        rows: options?.limit || 20,
      };

      // Add year filter if provided
      if (options?.yearFrom) {
        params['filter'] = `from-pub-date:${options.yearFrom}`;
      }

      const response = await firstValueFrom(
        this.httpService.get(this.API_BASE_URL, {
          params,
          headers: {
            'User-Agent': this.userAgent, // Phase 10.7.10: Polite pool for better service
          },
          timeout: FAST_API_TIMEOUT, // 10s - Phase 10.6 Day 14.5: Added timeout (was missing)
        }),
      );

      const papers = response.data.message.items.map((item: any) =>
        this.parsePaper(item),
      );

      this.logger.log(`[CrossRef] Found ${papers.length} papers`);
      return papers;
    } catch (error: any) {
      if (error.response?.status === 429) {
        this.logger.error(`[CrossRef] ⚠️  RATE LIMITED (429)`);
      } else {
        this.logger.error(
          `[CrossRef] Search failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
        );
      }
      return [];
    }
  }

  /**
   * Parse CrossRef API response into Paper object
   * Includes quality scoring and word count metrics
   */
  private parsePaper(item: any): Paper {
    // Calculate word counts
    const abstractWordCount = calculateAbstractWordCount(item.abstract);
    const wordCount = calculateComprehensiveWordCount(
      item.title?.[0],
      item.abstract,
    );
    const wordCountExcludingRefs = wordCount;

    // Extract publication year and citation count
    const year = item.published?.['date-parts']?.[0]?.[0];
    const citationCount = item['is-referenced-by-count'] || 0;

    // Calculate quality score
    const qualityComponents = calculateQualityScore({
      citationCount,
      year,
      wordCount,
      venue: item['container-title']?.[0],
      source: LiteratureSource.CROSSREF,
      impactFactor: null,
      sjrScore: null,
      quartile: null,
      hIndexJournal: null,
    });

    return {
      id: item.DOI,
      title: item.title?.[0] || '',
      authors: item.author?.map((a: any) => `${a.given} ${a.family}`) || [],
      year,
      abstract: item.abstract,
      doi: item.DOI,
      url: item.URL,
      venue: item['container-title']?.[0],
      citationCount,
      source: LiteratureSource.CROSSREF,
      wordCount,
      wordCountExcludingRefs,
      isEligible: isPaperEligible(wordCount, 150),
      abstractWordCount,
      citationsPerYear: year
        ? citationCount / Math.max(1, new Date().getFullYear() - year)
        : 0,
      qualityScore: qualityComponents.totalScore,
      isHighQuality: qualityComponents.totalScore >= 50,
    };
  }

  /**
   * Check if CrossRef service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
