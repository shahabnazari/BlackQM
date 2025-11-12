import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Paper, LiteratureSource } from '../dto/literature.dto';
import { PREPRINT_DEFAULT_MONTHS } from '../constants/http-config.constants';

/**
 * Phase 10.6 Day 3: bioRxiv and medRxiv Integration Service
 *
 * bioRxiv: Biology preprint server (since 2013)
 * medRxiv: Medical preprint server (since 2019)
 * Both run on the same platform and share API structure.
 *
 * Benefits:
 * - Access to cutting-edge research before peer review
 * - Full-text PDF access (all preprints are open access)
 * - Fast publication (papers available within days)
 * - 200,000+ preprints across biology and medicine
 *
 * API Documentation:
 * - bioRxiv: https://api.biorxiv.org/
 * - medRxiv: https://api.medrxiv.org/
 *
 * Rate Limits:
 * - No authentication required
 * - Reasonable use policy (no aggressive scraping)
 * - Recommended: 1 request per second
 *
 * @see https://www.biorxiv.org/
 * @see https://www.medrxiv.org/
 */
@Injectable()
export class BioRxivService {
  private readonly logger = new Logger(BioRxivService.name);
  private readonly BIORXIV_API = 'https://api.biorxiv.org/details';
  private readonly MEDRXIV_API = 'https://api.medrxiv.org/details';

  constructor(private readonly httpService: HttpService) {
    this.logger.log('✅ [bioRxiv/medRxiv] Service initialized');
  }

  /**
   * Search bioRxiv for preprints
   *
   * Note: bioRxiv API doesn't have direct search endpoint.
   * We search by date range and filter by keywords in-memory.
   *
   * @param query Search query string
   * @param options Search options
   * @returns Array of biology preprints
   */
  async searchBioRxiv(
    query: string,
    options?: {
      yearFrom?: number;
      yearTo?: number;
      limit?: number;
    },
  ): Promise<Paper[]> {
    return this.searchPreprints('biorxiv', query, options);
  }

  /**
   * Search medRxiv for preprints
   *
   * @param query Search query string
   * @param options Search options
   * @returns Array of medical preprints
   */
  async searchMedRxiv(
    query: string,
    options?: {
      yearFrom?: number;
      yearTo?: number;
      limit?: number;
    },
  ): Promise<Paper[]> {
    return this.searchPreprints('medrxiv', query, options);
  }

  /**
   * Internal search method for both bioRxiv and medRxiv
   *
   * Strategy: Fetch recent papers and filter by query keywords
   * This is necessary because the API doesn't support full-text search
   *
   * @param server 'biorxiv' or 'medrxiv'
   * @param query Search query
   * @param options Search options
   */
  private async searchPreprints(
    server: 'biorxiv' | 'medrxiv',
    query: string,
    options?: {
      yearFrom?: number;
      yearTo?: number;
      limit?: number;
    },
  ): Promise<Paper[]> {
    const startTime = Date.now();
    const serverName = server === 'biorxiv' ? 'bioRxiv' : 'medRxiv';
    this.logger.log(`[${serverName}] Searching: "${query}"`);

    try {
      // Determine date range for API call
      const now = new Date();
      const endDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Phase 10.6 Day 14.5: Optimized from 2 years to 6 months
      // BEFORE: Downloads ~10,000 papers (2 years), takes 3.5s
      // AFTER: Downloads ~2,500 papers (6 months), takes <1s
      const monthsBack = PREPRINT_DEFAULT_MONTHS; // 6 months
      const startDateObj = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const startDate = options?.yearFrom
        ? `${options.yearFrom}-01-01`
        : startDateObj.toISOString().split('T')[0];

      // Build API URL
      // Format: /biorxiv/YYYY-MM-DD/YYYY-MM-DD/cursor/format
      const baseUrl = server === 'biorxiv' ? this.BIORXIV_API : this.MEDRXIV_API;
      const url = `${baseUrl}/${server}/${startDate}/${endDate}/0/json`;

      this.logger.log(`[${serverName}] Fetching papers from ${startDate} to ${endDate}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'VQMethod Research Platform (contact@vqmethod.com)',
          },
        }),
      );

      const collection = response.data.collection || [];

      // Filter papers by query keywords (case-insensitive)
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const matchedPapers = collection.filter((paper: any) => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const authors = (paper.authors || '').toLowerCase();
        const searchText = `${title} ${abstract} ${authors}`;

        // Paper matches if it contains any query term
        return queryTerms.some(term => searchText.includes(term));
      });

      // Convert to Paper format
      const papers: Paper[] = matchedPapers
        .slice(0, options?.limit || 20)
        .map((paper: any) => this.parsePaper(paper, server));

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [${serverName}] Found ${papers.length} matching papers (from ${collection.length} total) in ${duration}ms`,
      );

      return papers;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [${serverName}] Search failed after ${duration}ms: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Parse bioRxiv/medRxiv preprint into Paper format
   *
   * @param preprint Raw API response object
   * @param server Source server name
   * @returns Parsed Paper object
   */
  private parsePaper(preprint: any, server: 'biorxiv' | 'medrxiv'): Paper {
    // Extract DOI and build full URL
    const doi = preprint.doi;
    const url = doi ? `https://doi.org/${doi}` : undefined;

    // Extract year from date (format: YYYY-MM-DD)
    const date = preprint.date || preprint.published || '';
    const year = date ? parseInt(date.split('-')[0]) : undefined;

    // Build PDF URL (all preprints have free PDFs)
    const pdfUrl = doi
      ? `https://www.${server}.org/content/${doi}v${preprint.version || '1'}.full.pdf`
      : undefined;

    // Parse authors (format: "Last, First; Last2, First2")
    const authorsString = preprint.authors || '';
    const authors = authorsString
      ? authorsString.split(';').map((author: string) => author.trim()).filter(Boolean)
      : [];

    return {
      id: doi || `${server}_${Date.now()}_${Math.random()}`,
      title: preprint.title || 'Untitled',
      abstract: preprint.abstract || '',
      authors,
      year: year || 0,
      venue: server === 'biorxiv' ? 'bioRxiv' : 'medRxiv',
      doi,
      url,
      source: (server === 'biorxiv' ? LiteratureSource.BIORXIV : LiteratureSource.MEDRXIV) as any,
      citationCount: 0, // Preprints don't have citation counts in API
      pdfUrl,
    };
  }

  /**
   * Get preprint by DOI
   *
   * @param doi DOI of the preprint
   * @param server Which server to query
   * @returns Paper object or null if not found
   */
  async getPreprintByDOI(
    doi: string,
    server: 'biorxiv' | 'medrxiv',
  ): Promise<Paper | null> {
    const serverName = server === 'biorxiv' ? 'bioRxiv' : 'medRxiv';
    this.logger.log(`[${serverName}] Fetching DOI: ${doi}`);

    try {
      const baseUrl = server === 'biorxiv' ? this.BIORXIV_API : this.MEDRXIV_API;
      const url = `${baseUrl}/${server}/${doi}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 10000,
        }),
      );

      const collection = response.data.collection;
      if (collection && collection.length > 0) {
        return this.parsePaper(collection[0], server);
      }

      return null;
    } catch (error: any) {
      this.logger.error(`[${serverName}] Failed to fetch DOI ${doi}: ${error.message}`);
      return null;
    }
  }
}
