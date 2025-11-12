import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import { LARGE_RESPONSE_TIMEOUT, ENRICHMENT_TIMEOUT } from '../constants/http-config.constants';

/**
 * Phase 10.6 Day 3: Google Scholar Integration Service
 *
 * Uses SerpAPI (https://serpapi.com/) for legal Google Scholar access.
 * Direct scraping violates Google's Terms of Service.
 *
 * Benefits:
 * - Access to 100M+ papers not in other databases
 * - Citation counts and related papers
 * - PDF links from publisher sites
 * - Multi-disciplinary coverage (not just CS/medical like others)
 *
 * Rate Limits:
 * - Free tier: 100 searches/month
 * - Paid tier: 5,000+ searches/month
 *
 * @see https://serpapi.com/google-scholar-api
 */
@Injectable()
export class GoogleScholarService {
  private readonly logger = new Logger(GoogleScholarService.name);
  private readonly SERPAPI_BASE_URL = 'https://serpapi.com/search';
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // SerpAPI key from environment variables
    this.apiKey = this.configService.get<string>('SERPAPI_KEY') || '';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      this.logger.warn(
        '⚠️  [GoogleScholar] SERPAPI_KEY not configured. Google Scholar search disabled.',
      );
      this.logger.warn(
        '   Get your key at: https://serpapi.com/manage-api-key',
      );
    } else {
      this.logger.log('✅ [GoogleScholar] Service initialized with SerpAPI');
    }
  }

  /**
   * Search Google Scholar via SerpAPI
   *
   * @param query Search query string
   * @param options Additional search options
   * @returns Array of papers from Google Scholar
   */
  async search(
    query: string,
    options?: {
      yearFrom?: number;
      yearTo?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<Paper[]> {
    if (!this.enabled) {
      this.logger.warn('[GoogleScholar] Skipping search - API key not configured');
      return [];
    }

    const startTime = Date.now();
    this.logger.log(`[GoogleScholar] Searching: "${query}"`);

    try {
      const params: any = {
        engine: 'google_scholar',
        q: query,
        api_key: this.apiKey,
        num: Math.min(options?.limit || 20, 20), // SerpAPI max is 20 per request
        start: options?.offset || 0,
      };

      // Add year range filter if provided
      if (options?.yearFrom || options?.yearTo) {
        const yearFrom = options.yearFrom || 1900;
        const yearTo = options.yearTo || new Date().getFullYear();
        params.as_ylo = yearFrom; // year low
        params.as_yhi = yearTo; // year high
      }

      const response = await firstValueFrom(
        this.httpService.get(this.SERPAPI_BASE_URL, {
          params,
          timeout: LARGE_RESPONSE_TIMEOUT, // 30s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      const results = response.data.organic_results || [];
      const papers: Paper[] = results.map((result: any) => this.parsePaper(result));

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [GoogleScholar] Found ${papers.length} papers in ${duration}ms`,
      );

      return papers;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [GoogleScholar] Search failed after ${duration}ms: ${error.message}`,
      );

      // Handle specific SerpAPI errors
      if (error.response?.status === 401) {
        this.logger.error('[GoogleScholar] Invalid API key');
      } else if (error.response?.status === 429) {
        this.logger.error('[GoogleScholar] Rate limit exceeded');
      }

      return [];
    }
  }

  /**
   * Parse Google Scholar result into Paper format
   *
   * @param result Raw SerpAPI result object
   * @returns Parsed Paper object
   */
  private parsePaper(result: any): Paper {
    // Extract year from publication info (e.g., "Nature, 2023")
    const publicationInfo = result.publication_info?.summary || '';
    const yearMatch = publicationInfo.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

    // Extract journal/venue from publication info
    const journalMatch = publicationInfo.match(/^([^,]+)/);
    const journal = journalMatch ? journalMatch[1].trim() : undefined;

    // Extract authors from result
    const authors = result.publication_info?.authors?.map((author: any) => ({
      name: author.name || '',
      link: author.link || undefined,
    })) || [];

    // Extract PDF link (from resources if available)
    const pdfResource = result.resources?.find((r: any) =>
      r.file_format === 'PDF' || r.title?.toLowerCase().includes('pdf')
    );
    const pdfUrl = pdfResource?.link || result.link;

    return {
      id: result.result_id || `gs_${Date.now()}_${Math.random()}`,
      title: result.title || 'Untitled',
      abstract: result.snippet || '',
      authors: authors.map((a: any) => a.name),
      year: year || 0,
      venue: journal,
      doi: undefined, // Google Scholar doesn't always provide DOI
      url: result.link || undefined,
      source: LiteratureSource.GOOGLE_SCHOLAR as any,
      citationCount: result.inline_links?.cited_by?.total || 0,
      pdfUrl: pdfUrl || undefined,
    };
  }

  /**
   * Check if service is available (API key configured)
   */
  isAvailable(): boolean {
    return this.enabled;
  }

  /**
   * Get API usage information (if available from SerpAPI)
   */
  async getUsageStats(): Promise<{
    used: number;
    limit: number;
    remaining: number;
  } | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://serpapi.com/account', {
          params: { api_key: this.apiKey },
          timeout: ENRICHMENT_TIMEOUT, // 5s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      return {
        used: response.data.total_searches_this_month || 0,
        limit: response.data.plan_searches_per_month || 100,
        remaining: response.data.plan_searches_left || 0,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get usage stats: ${error.message}`);
      return null;
    }
  }
}
