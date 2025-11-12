import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import { FAST_API_TIMEOUT, PREPRINT_SERVER_TIMEOUT } from '../constants/http-config.constants';

/**
 * Phase 10.6 Day 3: ChemRxiv Integration Service
 *
 * ChemRxiv is the preprint server for chemistry, operated by the American Chemical Society (ACS).
 *
 * Benefits:
 * - Access to cutting-edge chemistry research
 * - All papers are open access with CC-BY licenses
 * - Full-text PDF downloads available
 * - Rigorous moderation (papers reviewed for scientific integrity)
 * - 15,000+ chemistry preprints
 *
 * API Documentation:
 * - ChemRxiv uses Figshare API infrastructure
 * - Public API: https://api.figshare.com/v2/
 * - Collection ID for ChemRxiv: institution 259 (American Chemical Society)
 *
 * Rate Limits:
 * - No authentication required for public access
 * - Recommended: Max 10 requests per second
 *
 * @see https://chemrxiv.org/
 * @see https://docs.figsh are.com/
 */
@Injectable()
export class ChemRxivService {
  private readonly logger = new Logger(ChemRxivService.name);
  private readonly FIGSHARE_API = 'https://api.figshare.com/v2';
  private readonly CHEMRXIV_INSTITUTION_ID = 259; // American Chemical Society

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [ChemRxiv] Service initialized (via Figshare API)');
  }

  /**
   * Search ChemRxiv for chemistry preprints
   *
   * Uses Figshare API to search within ChemRxiv collection
   *
   * @param query Search query string
   * @param options Search options
   * @returns Array of chemistry preprints
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
    const startTime = Date.now();
    this.logger.log(`[ChemRxiv] Searching: "${query}"`);

    try {
      // Build Figshare search request
      const searchParams = {
        search_for: `:title: ${query} OR :description: ${query}`,
        item_type: 3, // 3 = preprint
        institution: this.CHEMRXIV_INSTITUTION_ID,
        page: Math.floor((options?.offset || 0) / 10) + 1,
        page_size: Math.min(options?.limit || 10, 100),
      };

      // Add year filter if provided
      if (options?.yearFrom) {
        searchParams.search_for += ` AND :published_date: >= ${options.yearFrom}-01-01`;
      }
      if (options?.yearTo) {
        searchParams.search_for += ` AND :published_date: <= ${options.yearTo}-12-31`;
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.FIGSHARE_API}/articles/search`, searchParams, {
          timeout: PREPRINT_SERVER_TIMEOUT, // 30s - Phase 10.6 Day 14.5: Migrated to centralized config
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const articles = response.data || [];
      const papers: Paper[] = articles.map((article: any) => this.parsePaper(article));

      const duration = Date.now() - startTime;
      this.logger.log(`✅ [ChemRxiv] Found ${papers.length} papers in ${duration}ms`);

      return papers;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ [ChemRxiv] Search failed after ${duration}ms: ${error.message}`);

      // Handle specific Figshare API errors
      if (error.response?.status === 400) {
        this.logger.error('[ChemRxiv] Invalid search parameters');
      } else if (error.response?.status === 429) {
        this.logger.error('[ChemRxiv] Rate limit exceeded');
      }

      return [];
    }
  }

  /**
   * Get paper by ChemRxiv/Figshare article ID
   *
   * @param articleId Figshare article ID
   * @returns Paper object or null if not found
   */
  async getPaperById(articleId: string | number): Promise<Paper | null> {
    this.logger.log(`[ChemRxiv] Fetching article ID: ${articleId}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.FIGSHARE_API}/articles/${articleId}`, {
          timeout: FAST_API_TIMEOUT, // 10s - Phase 10.6 Day 14.5: Migrated to centralized config
        }),
      );

      return this.parsePaper(response.data);
    } catch (error: any) {
      this.logger.error(
        `[ChemRxiv] Failed to fetch article ${articleId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Parse Figshare article into Paper format
   *
   * @param article Raw Figshare API response
   * @returns Parsed Paper object
   */
  private parsePaper(article: any): Paper {
    // Extract DOI
    const doi = article.doi || undefined;

    // Extract year from published_date (ISO format)
    const publishedDate = article.published_date || article.created_date;
    const year = publishedDate ? new Date(publishedDate).getFullYear() : undefined;

    // Extract authors
    const authors = (article.authors || [])
      .map((author: any) => author.full_name || author.name)
      .filter(Boolean);

    // Find PDF file (Figshare can have multiple files)
    const pdfFile = (article.files || []).find((file: any) =>
      file.name?.toLowerCase().endsWith('.pdf') || file.mime_type === 'application/pdf'
    );
    const pdfUrl = pdfFile?.download_url || undefined;

    // Extract categories/tags
    const categories = (article.categories || [])
      .map((cat: any) => cat.title)
      .join(', ');

    return {
      id: article.id?.toString() || `chemrxiv_${Date.now()}_${Math.random()}`,
      title: article.title || 'Untitled',
      abstract: article.description || '',
      authors,
      year: year || 0,
      venue: 'ChemRxiv',
      doi,
      url: article.url || article.url_public_html || undefined,
      source: LiteratureSource.CHEMRXIV as any,
      citationCount: article.citation_count || 0,
      pdfUrl,
    };
  }

  /**
   * Check if ChemRxiv service is available
   *
   * @returns true (Figshare API is public)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Get recent papers from ChemRxiv
   *
   * Useful for discovering new chemistry research
   *
   * @param limit Number of papers to fetch
   * @returns Array of recent chemistry preprints
   */
  async getRecentPapers(limit: number = 10): Promise<Paper[]> {
    this.logger.log(`[ChemRxiv] Fetching ${limit} recent papers`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.FIGSHARE_API}/articles/search`,
          {
            item_type: 3, // preprint
            institution: this.CHEMRXIV_INSTITUTION_ID,
            page: 1,
            page_size: limit,
            order: 'published_date',
            order_direction: 'desc',
          },
          { timeout: FAST_API_TIMEOUT }, // 10s - Phase 10.6 Day 14.5: Migrated to centralized config
        ),
      );

      const articles = response.data || [];
      return articles.map((article: any) => this.parsePaper(article));
    } catch (error: any) {
      this.logger.error(`[ChemRxiv] Failed to fetch recent papers: ${error.message}`);
      return [];
    }
  }
}
