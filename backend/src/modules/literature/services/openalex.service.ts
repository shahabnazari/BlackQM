/**
 * OpenAlex Search Service
 *
 * Phase 10.106 Phase 1: Netflix-Grade OpenAlex Integration
 *
 * Purpose:
 * - Search OpenAlex's 250M+ works database
 * - Map OpenAlex data to Paper DTO format
 * - Provide high-quality academic papers with excellent metadata
 *
 * Data Source: OpenAlex API (https://openalex.org)
 * - 250M+ works
 * - 140K+ sources (journals, conferences)
 * - 100% FREE, no API key required
 * - Rate limit: 10 requests/second
 *
 * Architecture:
 * - Netflix-grade rate limiting (Bottleneck reservoir pattern)
 * - Type-safe Paper DTO mapping
 * - Comprehensive error handling
 * - Enterprise logging
 * - Graceful degradation
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import Bottleneck from 'bottleneck';
// Phase 10.106: Retry service for resilience
import { RetryService } from '../../../common/services/retry.service';

/**
 * Search options for OpenAlex queries
 * Phase 10.106 STRICT AUDIT: Added for consistency with other source services
 */
export interface OpenAlexSearchOptions {
  readonly yearFrom?: number;
  readonly yearTo?: number;
  readonly limit?: number;
}

/**
 * OpenAlex work response (from API)
 */
interface OpenAlexWork {
  readonly id: string;
  readonly doi?: string;
  readonly title?: string;
  readonly display_name?: string;
  readonly publication_year?: number;
  readonly cited_by_count?: number;
  readonly relevance_score?: number;
  readonly abstract_inverted_index?: Record<string, readonly number[]>;
  readonly authorships?: readonly OpenAlexAuthorship[];
  readonly open_access?: {
    readonly is_oa?: boolean;
    readonly oa_status?: string;
  };
  readonly primary_location?: {
    readonly source?: {
      readonly display_name?: string;
      readonly issn_l?: string;
      readonly summary_stats?: {
        readonly h_index?: number;
        readonly '2yr_mean_citedness'?: number;
      };
    };
  };
  readonly primary_topic?: {
    readonly display_name?: string;
  };
  readonly topics?: readonly {
    readonly display_name?: string;
  }[];
}

interface OpenAlexAuthorship {
  readonly author?: {
    readonly display_name?: string;
  };
}

interface OpenAlexSearchResponse {
  readonly results?: readonly OpenAlexWork[];
  readonly meta?: {
    readonly count?: number;
  };
}

@Injectable()
export class OpenAlexService {
  private readonly logger = new Logger(OpenAlexService.name);
  private readonly baseUrl = 'https://api.openalex.org';

  // ============================================
  // Netflix-Grade Rate Limiting
  // ============================================
  // OpenAlex limit: 10 req/sec (polite pool)
  // Same pattern as openalex-enrichment.service.ts for consistency
  private readonly rateLimiter = new Bottleneck({
    reservoir: 10,                    // 10 requests
    reservoirRefreshAmount: 10,       // Refill to 10
    reservoirRefreshInterval: 1000,   // Every 1 second
    maxConcurrent: 10,
  });

  private requestCount = 0;
  private failureCount = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly retry: RetryService,
  ) {
    this.logger.log('✅ [OpenAlex Search] Service initialized with Netflix-grade rate limiter (10 req/sec)');
  }

  /**
   * Search OpenAlex for academic papers
   *
   * Phase 10.106 STRICT AUDIT: Updated signature for consistency with other source services
   * Now supports year filtering via options parameter
   *
   * @param query Search query string
   * @param options Search options (yearFrom, yearTo, limit)
   * @returns Array of Paper DTOs
   */
  async search(query: string, options?: OpenAlexSearchOptions): Promise<Paper[]> {
    const startTime = Date.now();

    // SEC-1 FIX: Enhanced input validation with sanitization
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.logger.warn('[OpenAlex] Empty query provided, returning 0 results');
      return [];
    }

    // Sanitize query: remove control characters, limit length
    const sanitizedQuery = query
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Limit to 1000 chars to prevent DoS

    if (sanitizedQuery.length === 0) {
      this.logger.warn('[OpenAlex] Query became empty after sanitization');
      return [];
    }

    // Extract options with defaults
    const limit = options?.limit ?? 100;
    const yearFrom = options?.yearFrom;
    const yearTo = options?.yearTo;

    const perPage = Math.min(limit, 200); // OpenAlex max: 200 per page

    try {
      this.logger.log(`🔍 [OpenAlex] Searching for "${sanitizedQuery}" (max ${perPage} results)...`);

      // BUG-1 FIX: Build params with year filtering support
      const params: Record<string, string | number> = {
        search: sanitizedQuery,
        per_page: perPage,
        sort: 'relevance_score:desc', // Most relevant first
      };

      // Add year filtering if provided
      if (yearFrom !== undefined || yearTo !== undefined) {
        // OpenAlex uses publication_year filter
        if (yearFrom !== undefined && yearTo !== undefined) {
          params.filter = `publication_year:${yearFrom}-${yearTo}`;
        } else if (yearFrom !== undefined) {
          params.filter = `publication_year:${yearFrom}-`;
        } else if (yearTo !== undefined) {
          params.filter = `publication_year:-${yearTo}`;
        }
      }

      // Rate-limited API call with retry
      const response = await this.rateLimiter.schedule(async () => {
        this.requestCount++;
        return await this.retry.executeWithRetry(
          async () => firstValueFrom(
            this.httpService.get<OpenAlexSearchResponse>(`${this.baseUrl}/works`, {
              params,
              headers: {
                'User-Agent': 'BlackQMethod-Research-Platform (mailto:research@blackqmethod.com)',
              },
              timeout: 30000, // 30s timeout
            })
          ),
          'OpenAlex.search',
          {
            maxAttempts: 2,
            initialDelayMs: 1000,
            maxDelayMs: 4000,
            backoffMultiplier: 2,
            jitterMs: 500,
          },
        );
      });

      // BUG-2 FIX: Runtime validation before type assertion
      // Phase 10.106 Netflix-Grade: RetryResult wraps AxiosResponse
      // response is RetryResult<AxiosResponse<OpenAlexSearchResponse>>
      // response.data is AxiosResponse<OpenAlexSearchResponse>
      // response.data.data is OpenAlexSearchResponse
      const axiosResponse = response.data;
      const responseData = axiosResponse.data;

      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        this.logger.error('[OpenAlex] Invalid API response: not an object');
        return [];
      }

      if (!Array.isArray(responseData.results)) {
        this.logger.error('[OpenAlex] Invalid API response: results is not an array');
        return [];
      }

      const works: readonly OpenAlexWork[] = responseData.results;
      const totalAvailable =
        typeof responseData.meta?.count === 'number'
          ? responseData.meta.count
          : 0;

      // Map OpenAlex works to Paper DTOs
      const papers: Paper[] = works.map((work: OpenAlexWork) => this.mapWorkToPaper(work));

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `✅ [OpenAlex] Search completed: ${papers.length} papers returned (${totalAvailable.toLocaleString()} total available) in ${duration}s`
      );

      // Reset failure count on success
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }

      return papers;
    } catch (error: unknown) {
      // Phase 10.106 Phase 6: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string };
      this.failureCount++;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.error(
        `❌ [OpenAlex] Search failed after ${duration}s: ${err.message || 'Unknown error'} (failure ${this.failureCount}/${this.requestCount})`
      );

      // Graceful degradation: return empty array on error
      return [];
    }
  }

  /**
   * Map OpenAlex work to Paper DTO
   *
   * Strict type-safe mapping with comprehensive field extraction
   */
  private mapWorkToPaper(work: OpenAlexWork): Paper {
    // Extract basic fields
    const openAlexId = work.id || '';
    const doi = work.doi?.replace('https://doi.org/', '') || undefined;
    const title = work.title || work.display_name || 'Untitled';
    const year = work.publication_year || undefined;

    // Extract abstract (reconstruct from inverted index)
    const abstract = work.abstract_inverted_index
      ? this.reconstructAbstract(work.abstract_inverted_index)
      : '';

    // Extract authors
    const authors = this.extractAuthors(work.authorships || []);

    // Extract venue/publisher info
    const venue = work.primary_location?.source?.display_name || undefined;

    // Extract citation metrics
    const citationCount = work.cited_by_count || 0;
    const hIndexJournal = work.primary_location?.source?.summary_stats?.h_index || undefined;
    const impactFactor = work.primary_location?.source?.summary_stats?.['2yr_mean_citedness'] || undefined;

    // Extract Open Access status
    const isOpenAccess = work.open_access?.is_oa || false;

    // Extract field of study
    const fieldOfStudy: string[] = [];
    if (work.primary_topic?.display_name) {
      fieldOfStudy.push(work.primary_topic.display_name);
    }
    // Add additional topics (max 3 total)
    if (work.topics) {
      for (const topic of work.topics.slice(0, 2)) {
        if (topic.display_name && !fieldOfStudy.includes(topic.display_name)) {
          fieldOfStudy.push(topic.display_name);
        }
      }
    }

    // Calculate initial quality score
    const qualityScore = this.calculateInitialQualityScore(work);

    // Construct Paper DTO
    const paper: Paper = {
      id: openAlexId,
      title,
      doi,
      abstract,
      authors,
      year,
      source: LiteratureSource.OPENALEX,
      url: doi ? `https://doi.org/${doi}` : openAlexId,
      citationCount,
      qualityScore,
      isHighQuality: qualityScore >= 50,
      // Venue and journal metrics (if available)
      venue,
      hIndexJournal,
      impactFactor,
      // Additional metadata
      isOpenAccess,
      fieldOfStudy: fieldOfStudy.length > 0 ? fieldOfStudy : undefined,
    };

    return paper;
  }

  /**
   * Reconstruct abstract from OpenAlex inverted index
   *
   * OpenAlex stores abstracts as inverted indices for efficiency:
   * { "quantum": [0, 5], "computing": [1], "algorithm": [2] }
   * → "quantum computing algorithm ... quantum ..."
   *
   * Phase 10.106 STRICT AUDIT: Added runtime validation for TYPE-1 fix
   *
   * @param invertedIndex Inverted index (word → positions)
   * @returns Reconstructed abstract text
   */
  private reconstructAbstract(invertedIndex: Record<string, readonly number[]>): string {
    try {
      // TYPE-1 FIX: Validate input is actually an object
      if (!invertedIndex || typeof invertedIndex !== 'object' || Array.isArray(invertedIndex)) {
        this.logger.debug('[OpenAlex] Invalid inverted index: not an object');
        return '';
      }

      const words: string[] = [];

      // Place each word at its position(s)
      for (const [word, positions] of Object.entries(invertedIndex)) {
        // TYPE-1 FIX: Validate positions is an array
        if (!Array.isArray(positions)) {
          this.logger.debug(`[OpenAlex] Invalid positions for word "${word}": not an array`);
          continue;
        }

        for (const pos of positions) {
          // TYPE-1 FIX: Validate position is a number
          if (typeof pos !== 'number' || pos < 0 || !Number.isFinite(pos)) {
            this.logger.debug(`[OpenAlex] Invalid position for word "${word}": ${pos}`);
            continue;
          }

          words[pos] = word;
        }
      }

      // Join and clean up
      const abstract = words.filter(Boolean).join(' ').trim();

      // Limit to reasonable length (first 500 words)
      const wordArray = abstract.split(' ');
      if (wordArray.length > 500) {
        return wordArray.slice(0, 500).join(' ') + '...';
      }

      return abstract;
    } catch (error: unknown) {
      // Phase 10.106 Phase 6: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string };
      this.logger.debug(`[OpenAlex] Failed to reconstruct abstract: ${err.message || 'Unknown error'}`);
      return '';
    }
  }

  /**
   * Extract author names from authorships
   *
   * @param authorships OpenAlex authorships array
   * @returns Array of author names (max 10)
   */
  private extractAuthors(authorships: readonly OpenAlexAuthorship[]): string[] {
    return authorships
      .slice(0, 10) // Max 10 authors to avoid excessive data
      .map((authorship: OpenAlexAuthorship) => authorship.author?.display_name)
      .filter((name): name is string => Boolean(name));
  }

  /**
   * Calculate initial quality score for a work
   *
   * Scoring components:
   * - Relevance (40%): OpenAlex relevance_score
   * - Citations (30%): Citation count (normalized)
   * - Recency (15%): Publication year boost
   * - Journal (15%): Journal h-index boost
   *
   * @param work OpenAlex work
   * @returns Quality score (0-100)
   */
  private calculateInitialQualityScore(work: OpenAlexWork): number {
    // Component 1: Relevance (0-40 points)
    // OpenAlex relevance_score typically ranges 0-1600+
    const relevanceScore = Math.min((work.relevance_score || 0) / 1600, 1) * 40;

    // Component 2: Citations (0-30 points)
    // Normalize citations: 100+ citations = max points
    const citationScore = Math.min((work.cited_by_count || 0) / 100, 1) * 30;

    // Component 3: Recency (0-15 points)
    // Papers from last 3 years get max points, linear decay after
    const currentYear = new Date().getFullYear();
    const yearsSincePublication = work.publication_year
      ? currentYear - work.publication_year
      : 100;
    const recencyScore = Math.max(0, Math.min(1, (5 - yearsSincePublication) / 5)) * 15;

    // Component 4: Journal Quality (0-15 points)
    // h-index: 100+ = max points
    const hIndex = work.primary_location?.source?.summary_stats?.h_index || 0;
    const journalScore = Math.min(hIndex / 100, 1) * 15;

    // Total score (0-100)
    const totalScore = relevanceScore + citationScore + recencyScore + journalScore;

    return Math.round(totalScore);
  }

  /**
   * Get service statistics for monitoring
   */
  getStats(): {
    requestCount: number;
    failureCount: number;
    failureRate: number;
  } {
    return {
      requestCount: this.requestCount,
      failureCount: this.failureCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0,
    };
  }
}
