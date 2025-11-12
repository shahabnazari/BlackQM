/**
 * Literature API Service (Enhanced)
 * Enterprise-grade service for academic literature search and retrieval
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * Features:
 * - Multi-database search (PubMed, Semantic Scholar, arXiv, etc.)
 * - Full-text fetching and PDF extraction
 * - Quality filtering and scoring
 * - Request cancellation and retry logic
 *
 * @module literature-api-enhanced.service
 */

import {
  BaseApiService,
  CancellableRequest,
  RequestOptions,
} from './base-api.service';

// ============================================================================
// Types
// ============================================================================

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  keywords?: string[];
  fieldsOfStudy?: string[];
  source: string;

  // Word count and eligibility
  wordCount?: number;
  wordCountExcludingRefs?: number;
  isEligible?: boolean;

  // PDF availability
  pdfUrl?: string | null;
  openAccessStatus?: string | null;
  hasPdf?: boolean;

  // Quality metrics
  abstractWordCount?: number;
  citationsPerYear?: number;
  impactFactor?: number;
  sjrScore?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  hIndexJournal?: number;
  qualityScore?: number;
  isHighQuality?: boolean;

  // Full-text support
  fullText?: string;
  hasFullText?: boolean;
  fullTextStatus?:
    | 'not_fetched'
    | 'fetching'
    | 'success'
    | 'failed'
    | 'available';
  fullTextSource?:
    | 'unpaywall'
    | 'manual'
    | 'abstract_overflow'
    | 'pmc'
    | 'publisher';
  fullTextWordCount?: number;
}

export interface SearchLiteratureParams {
  query: string;
  sources?: string[];
  yearFrom?: number;
  yearTo?: number;
  field?: string;
  limit?: number;
  page?: number;
  includeCitations?: boolean;
  sortBy?: 'relevance' | 'date' | 'citations';

  // Quality filters
  minWordCount?: number;
  minAbstractLength?: number;
  sortByEnhanced?:
    | 'relevance'
    | 'date'
    | 'citations'
    | 'citations_per_year'
    | 'word_count'
    | 'quality_score';
}

export interface SearchLiteratureResponse {
  papers: Paper[];
  total: number;
  page: number;
  // Phase 10.6 Day 14.5: Search transparency metadata
  metadata?: {
    totalCollected: number;
    sourceBreakdown: Record<string, { papers: number; duration: number; error?: string }>;
    uniqueAfterDedup: number;
    deduplicationRate: number;
    duplicatesRemoved: number;
    afterEnrichment: number;
    afterQualityFilter: number;
    qualityFiltered: number;
    totalQualified: number;
    displayed: number;
    searchDuration: number;
    queryExpansion?: { original: string; expanded: string };
  };
  isCached?: boolean;
  cacheAge?: number;
  isStale?: boolean;
  isArchive?: boolean;
  correctedQuery?: string;
  originalQuery?: string;
}

export interface FetchFullTextParams {
  paperId: string;
  doi?: string;
  url?: string;
  preferredSource?: 'unpaywall' | 'pmc' | 'publisher';
}

export interface FetchFullTextResponse {
  paperId: string;
  fullText: string;
  wordCount: number;
  source: string;
  success: boolean;
}

export interface ExportParams {
  paperIds: string[];
  format: 'csv' | 'bibtex' | 'ris' | 'json';
}

// ============================================================================
// Literature API Service Class
// ============================================================================

class LiteratureApiEnhancedService extends BaseApiService {
  private static instance: LiteratureApiEnhancedService;

  private constructor() {
    super('/literature');
  }

  /**
   * Singleton instance
   */
  static getInstance(): LiteratureApiEnhancedService {
    if (!LiteratureApiEnhancedService.instance) {
      LiteratureApiEnhancedService.instance =
        new LiteratureApiEnhancedService();
    }
    return LiteratureApiEnhancedService.instance;
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Search literature across multiple databases
   * Returns cancellable request for real-time abort support
   */
  searchLiterature(
    params: SearchLiteratureParams,
    options?: RequestOptions
  ): CancellableRequest<SearchLiteratureResponse> {
    const requestId = `search-${Date.now()}`;

    return this.createCancellableRequest(requestId, async signal => {
      const response = await this.post<SearchLiteratureResponse>(
        '/search/public',
        params,
        { ...options, signal }
      );
      return response.data;
    });
  }

  /**
   * Get paper by ID
   */
  async getPaperById(
    paperId: string,
    options?: RequestOptions
  ): Promise<Paper> {
    const response = await this.get<Paper>(`/papers/${paperId}`, options);
    return response.data;
  }

  /**
   * Get papers by multiple IDs (batch operation)
   */
  async getPapersByIds(
    paperIds: string[],
    options?: RequestOptions
  ): Promise<Paper[]> {
    const requests = paperIds.map(id => () => this.getPaperById(id, options));
    return this.batch(requests);
  }

  // ============================================================================
  // Full-Text Operations
  // ============================================================================

  /**
   * Fetch full-text for a paper
   * Returns cancellable request for long-running operations
   */
  fetchFullText(
    params: FetchFullTextParams,
    options?: RequestOptions
  ): CancellableRequest<FetchFullTextResponse> {
    const requestId = `fulltext-${params.paperId}`;

    return this.createCancellableRequest(requestId, async signal => {
      const response = await this.post<FetchFullTextResponse>(
        '/fulltext/fetch',
        params,
        { ...options, signal, timeout: 60000 } // 60 second timeout for PDF processing
      );
      return response.data;
    });
  }

  /**
   * Batch fetch full-text for multiple papers
   */
  async fetchFullTextBatch(
    papers: FetchFullTextParams[],
    options?: RequestOptions
  ): Promise<FetchFullTextResponse[]> {
    const response = await this.post<FetchFullTextResponse[]>(
      '/fulltext/batch',
      { papers },
      { ...options, timeout: 120000 } // 2 minute timeout for batch
    );
    return response.data;
  }

  /**
   * Check full-text availability for papers
   */
  async checkFullTextAvailability(
    paperIds: string[],
    options?: RequestOptions
  ): Promise<Record<string, boolean>> {
    const response = await this.post<Record<string, boolean>>(
      '/fulltext/check',
      { paperIds },
      options
    );
    return response.data;
  }

  // ============================================================================
  // Export Operations
  // ============================================================================

  /**
   * Export papers in various formats
   */
  async exportPapers(
    params: ExportParams,
    options?: RequestOptions
  ): Promise<Blob> {
    const response = await this.post<Blob>('/export', params, {
      ...options,
      responseType: 'blob',
    });
    return response.data;
  }

  // ============================================================================
  // Citation & References
  // ============================================================================

  /**
   * Get citations for a paper
   */
  async getCitations(
    paperId: string,
    options?: RequestOptions
  ): Promise<Paper[]> {
    const response = await this.get<Paper[]>(
      `/papers/${paperId}/citations`,
      options
    );
    return response.data;
  }

  /**
   * Get references for a paper
   */
  async getReferences(
    paperId: string,
    options?: RequestOptions
  ): Promise<Paper[]> {
    const response = await this.get<Paper[]>(
      `/papers/${paperId}/references`,
      options
    );
    return response.data;
  }

  // ============================================================================
  // Quality & Metrics
  // ============================================================================

  /**
   * Calculate quality score for papers
   */
  async calculateQualityScores(
    paperIds: string[],
    options?: RequestOptions
  ): Promise<Record<string, number>> {
    const response = await this.post<Record<string, number>>(
      '/quality/calculate',
      { paperIds },
      options
    );
    return response.data;
  }

  /**
   * Get journal metrics
   */
  async getJournalMetrics(
    journalName: string,
    options?: RequestOptions
  ): Promise<{
    impactFactor?: number;
    sjrScore?: number;
    quartile?: string;
    hIndex?: number;
  }> {
    const response = await this.get(
      `/journals/metrics?name=${encodeURIComponent(journalName)}`,
      options
    );
    return response.data as {
      impactFactor?: number;
      sjrScore?: number;
      quartile?: string;
      hIndex?: number;
    };
  }

  // ============================================================================
  // Saved Searches
  // ============================================================================

  /**
   * Save a search query
   */
  async saveSearch(
    name: string,
    params: SearchLiteratureParams,
    options?: RequestOptions
  ): Promise<{ id: string }> {
    const response = await this.post<{ id: string }>(
      '/searches/save',
      { name, params },
      options
    );
    return response.data;
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(
    options?: RequestOptions
  ): Promise<
    Array<{
      id: string;
      name: string;
      params: SearchLiteratureParams;
      createdAt: string;
    }>
  > {
    const response = await this.get('/searches/saved', options);
    return response.data as Array<{
      id: string;
      name: string;
      params: SearchLiteratureParams;
      createdAt: string;
    }>;
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(
    searchId: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.delete(`/searches/${searchId}`, options);
  }

  // ============================================================================
  // Request Cancellation Utilities
  // ============================================================================

  /**
   * Cancel all literature search requests
   */
  cancelAllSearches(): void {
    this.cancelAll();
  }

  /**
   * Cancel full-text fetch for a specific paper
   */
  cancelFullTextFetch(paperId: string): void {
    this.cancel(`fulltext-${paperId}`);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const literatureApiService = LiteratureApiEnhancedService.getInstance();

// Export class for testing
export { LiteratureApiEnhancedService };
