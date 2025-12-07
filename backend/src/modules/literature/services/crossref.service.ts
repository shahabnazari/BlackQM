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
// Phase 10.106 Netflix-Grade: Import RetryService for resilient API calls
import { RetryService } from '../../../common/services/retry.service';

export interface CrossRefSearchOptions {
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
}

interface CrossRefSearchParams {
  query: string;
  rows: number;
  filter?: string;
}

/**
 * Phase 10.106 Phase 5: Typed interface for CrossRef API author
 * Netflix-grade: No loose `any` types
 */
interface CrossRefAuthor {
  given?: string;
  family?: string;
  ORCID?: string;
  affiliation?: Array<{ name: string }>;
}

/**
 * Phase 10.106 Phase 5: Typed interface for CrossRef API item
 * Netflix-grade: Explicit typing for API response parsing
 */
interface CrossRefItem {
  DOI: string;
  title?: string[];
  author?: CrossRefAuthor[];
  published?: {
    'date-parts'?: number[][];
  };
  abstract?: string;
  URL?: string;
  'container-title'?: string[];
  'is-referenced-by-count'?: number;
  type?: string;
  publisher?: string;
  ISSN?: string[];
  subject?: string[];
}

@Injectable()
export class CrossRefService {
  private readonly logger = new Logger(CrossRefService.name);
  private readonly API_BASE_URL = 'https://api.crossref.org/works';
  private readonly userAgent: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly retry: RetryService,
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

      const params: CrossRefSearchParams = {
        query,
        rows: options?.limit || 20,
      };

      // Add year filter if provided
      if (options?.yearFrom) {
        params.filter = `from-pub-date:${options.yearFrom}`;
      }

      // Phase 10.106 Netflix-Grade: Execute HTTP request with automatic retry + exponential backoff
      // Retry policy: 3 attempts, 1s → 2s → 4s delays, 0-500ms jitter
      // Retryable errors: Network failures, timeouts, rate limits (429), server errors (500-599)
      const result = await this.retry.executeWithRetry(
        async () => firstValueFrom(
          this.httpService.get(this.API_BASE_URL, {
            params,
            headers: {
              'User-Agent': this.userAgent, // Phase 10.7.10: Polite pool for better service
            },
            timeout: FAST_API_TIMEOUT, // 10s timeout
          }),
        ),
        'CrossRef.search',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 16000,
          backoffMultiplier: 2,
          jitterMs: 500,
        },
      );

      // RetryResult structure: { data: AxiosResponse, attempts: number }
      const items = result.data?.data?.message?.items;
      if (!items || !Array.isArray(items)) {
        this.logger.warn(`[CrossRef] API returned invalid response structure`);
        return [];
      }

      // Phase 10.106 Phase 5: Use typed interface instead of any
      const papers = items.map((item: CrossRefItem) => this.parsePaper(item));

      this.logger.log(`[CrossRef] Found ${papers.length} papers (attempts: ${result.attempts})`);
      return papers;
    } catch (error: unknown) {
      // Phase 10.106 Phase 5: Use unknown with type narrowing (Netflix-grade)
      const err = error as { response?: { status?: number }; message?: string };
      // This catch block should rarely execute (retry service handles most errors)
      if (err.response?.status === 429) {
        this.logger.error(`[CrossRef] ⚠️  RATE LIMITED (429) - all retries exhausted`);
      } else {
        this.logger.error(
          `[CrossRef] Search failed after retries: ${err.message || 'Unknown error'} (Status: ${err.response?.status || 'N/A'})`,
        );
      }
      return [];
    }
  }

  /**
   * Parse CrossRef API response into Paper object
   * Includes quality scoring and word count metrics
   * Phase 10.106 Phase 5: Use typed CrossRefItem interface (Netflix-grade)
   */
  private parsePaper(item: CrossRefItem): Paper {
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

    // Phase 10.106: Sanitize abstract to remove XML/HTML tags that break JSON serialization
    // JATS XML like <jats:p xml:lang="en"> contains unescaped quotes that corrupt JSON
    const sanitizedAbstract = this.sanitizeAbstract(item.abstract);

    return {
      id: item.DOI,
      title: item.title?.[0] || '',
      // Phase 10.106 Phase 5: Use typed CrossRefAuthor interface (Netflix-grade)
      authors: item.author?.map((a: CrossRefAuthor) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
      year,
      abstract: sanitizedAbstract,
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
   * Phase 10.106: Sanitize abstract to remove XML/HTML tags
   * CrossRef returns abstracts in JATS XML format with tags like:
   * <jats:p xml:lang="en">...</jats:p>
   * These contain unescaped quotes that break JSON serialization
   */
  private sanitizeAbstract(abstract: string | undefined): string | undefined {
    if (!abstract) return undefined;

    // Remove all XML/HTML tags (including JATS namespace tags)
    return abstract
      .replace(/<[^>]*>/g, '') // Remove all tags
      .replace(/&lt;/g, '<')   // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Check if CrossRef service is available
   * Always returns true (no API key required)
   */
  isAvailable(): boolean {
    return true;
  }
}
