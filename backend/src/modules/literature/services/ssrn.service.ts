import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Paper, LiteratureSource } from '../dto/literature.dto';

/**
 * Phase 10.6 Day 3: SSRN (Social Science Research Network) Integration
 *
 * SSRN is the leading repository for social science research, including:
 * - Economics
 * - Psychology
 * - Business
 * - Law
 * - Political Science
 * - Education
 * - Management
 * - Finance
 *
 * Benefits:
 * - 1,000,000+ papers and working papers
 * - Early-stage research before formal publication
 * - PDF downloads available for most papers
 * - Author contact information
 * - Download counts and views as popularity metrics
 *
 * API Access:
 * - SSRN doesn't have a public REST API
 * - We use RSS feeds and web scraping (within their ToS for research)
 * - Alternative: Elsevier API (SSRN was acquired by Elsevier in 2016)
 *
 * Rate Limits:
 * - Respectful crawling (1 request per 2 seconds)
 * - Cache results aggressively
 *
 * @see https://www.ssrn.com/
 */
@Injectable()
export class SSRNService {
  private readonly logger = new Logger(SSRNService.name);
  private readonly SSRN_BASE_URL = 'https://www.ssrn.com';
  private readonly SSRN_SEARCH_URL = 'https://papers.ssrn.com/sol3/papers.cfm';

  // Rate limiting: minimum 2 seconds between requests
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [SSRN] Service initialized');
    this.logger.warn(
      '[SSRN] Note: SSRN has no official API. Using RSS feeds and respectful scraping.',
    );
  }

  /**
   * Search SSRN for papers
   *
   * Uses SSRN's search interface with respectful rate limiting
   *
   * @param query Search query string
   * @param options Search options
   * @returns Array of social science papers
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
    this.logger.log(`[SSRN] Searching: "${query}"`);

    try {
      // Rate limiting
      await this.enforceRateLimit();

      // SSRN search parameters
      const params = new URLSearchParams({
        npage: '1',
        keywords: query,
        sortBy: 'relevance',
      });

      // Add year filter if provided
      if (options?.yearFrom) {
        params.append('startYear', options.yearFrom.toString());
      }
      if (options?.yearTo) {
        params.append('endYear', options.yearTo.toString());
      }

      // Note: This is a simplified implementation
      // In production, you'd need more sophisticated scraping or use Elsevier API
      const url = `${this.SSRN_SEARCH_URL}?${params.toString()}`;

      this.logger.warn(
        '[SSRN] Search implementation simplified. Consider using Elsevier API for production.',
      );

      // For now, return mock results to demonstrate integration
      // In production, implement proper scraping or Elsevier API integration
      const papers = this.generateMockSSRNResults(query, options?.limit || 10);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ [SSRN] Found ${papers.length} papers in ${duration}ms (mock data)`);

      return papers;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ [SSRN] Search failed after ${duration}ms: ${error.message}`);
      return [];
    }
  }

  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      this.logger.debug(`[SSRN] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Generate mock SSRN results for demonstration
   *
   * TODO: Replace with actual SSRN scraping or Elsevier API integration
   *
   * @param query Search query
   * @param limit Number of results
   * @returns Mock paper results
   */
  private generateMockSSRNResults(query: string, limit: number): Paper[] {
    this.logger.warn('[SSRN] Returning mock data. Implement real SSRN integration for production.');

    const mockPapers: Paper[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < Math.min(limit, 5); i++) {
      mockPapers.push({
        id: `ssrn_${Date.now()}_${i}`,
        title: `Social Science Research on ${query} - Working Paper ${i + 1}`,
        abstract: `This working paper examines ${query} from a social science perspective. The study analyzes empirical data and provides theoretical insights into the phenomenon. Methodology includes quantitative analysis and case studies.`,
        authors: [`Author ${i + 1}`, `Researcher ${i + 1}`],
        year: currentYear - i,
        venue: 'SSRN Electronic Journal',
        doi: undefined,
        url: `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=${3000000 + i}`,
        source: LiteratureSource.SSRN as any,
        citationCount: 0,
        pdfUrl: `https://papers.ssrn.com/sol3/Delivery.cfm/SSRN_ID${3000000 + i}.pdf`,
      });
    }

    return mockPapers;
  }

  /**
   * Get paper by SSRN ID
   *
   * @param ssrnId SSRN abstract ID
   * @returns Paper object or null
   */
  async getPaperById(ssrnId: string): Promise<Paper | null> {
    this.logger.log(`[SSRN] Fetching paper ID: ${ssrnId}`);

    try {
      await this.enforceRateLimit();

      // TODO: Implement actual SSRN paper fetching
      this.logger.warn('[SSRN] getPaperById not fully implemented. Use Elsevier API.');

      return null;
    } catch (error: any) {
      this.logger.error(`[SSRN] Failed to fetch paper ${ssrnId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if SSRN integration is available
   *
   * @returns true if service can be used (currently always true for mock)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Get implementation status
   *
   * @returns Status message
   */
  getStatus(): string {
    return 'MOCK IMPLEMENTATION - Elsevier API integration required for production';
  }
}
