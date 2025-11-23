import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from '../auth/auth-utils';
import { logger } from '@/lib/utils/logger';

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
  // Phase 10 Day 5.13+ word count fields
  wordCount?: number; // Word count excluding references
  wordCountExcludingRefs?: number; // Alias for clarity
  isEligible?: boolean; // Meets minimum word count threshold
  // Phase 10 Day 5.17.4+ PDF availability
  pdfUrl?: string | null; // Direct URL to open access PDF
  openAccessStatus?: string | null; // Open access status (e.g., 'GOLD', 'GREEN', 'HYBRID', 'BRONZE')
  hasPdf?: boolean; // Whether PDF is available
  // Phase 10 Day 5.13+ Extension 2: Enterprise quality metrics
  abstractWordCount?: number; // Abstract word count
  citationsPerYear?: number; // Citation velocity (normalized by age)
  impactFactor?: number; // Journal impact factor
  sjrScore?: number; // SCImago Journal Rank
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Journal quartile ranking
  hIndexJournal?: number; // Journal h-index
  qualityScore?: number; // Composite quality score (0-100)
  isHighQuality?: boolean; // Quality score >= 50
  // Phase 10 Day 5.15+ Full-text support (CRITICAL for theme extraction quality)
  fullText?: string; // Full article content (10,000+ words when available)
  hasFullText?: boolean; // Whether full-text is available (PDF detected or already fetched)
  fullTextStatus?:
    | 'not_fetched'
    | 'fetching'
    | 'success'
    | 'failed'
    | 'available'; // Fetch status
  fullTextSource?:
    | 'unpaywall'
    | 'manual'
    | 'abstract_overflow'
    | 'pmc'
    | 'eric'
    | 'web_of_science'
    | 'scopus'
    | 'ieee'
    | 'springer'
    | 'nature'
    | 'wiley'
    | 'sage'
    | 'taylor_francis'
    | 'publisher'; // How full-text was obtained
  fullTextWordCount?: number; // Word count of full-text only (for analytics)
}

export interface Theme {
  id: string;
  name: string;
  keywords: string[];
  papers: string[];
  relevanceScore: number;
  emergenceYear?: number;
  trendDirection?: 'rising' | 'stable' | 'declining';
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  // Phase 10.7 Day 4: Enhanced fields from backend gap-analyzer.service.ts
  keywords: string[];
  relatedPapers: string[];
  importance: number; // 0-10 scale
  feasibility: number; // 0-10 scale
  marketPotential: number; // 0-10 scale
  suggestedMethodology?: string;
  suggestedStudyDesign?: string;
  estimatedImpact?: string;
  trendDirection?: 'emerging' | 'growing' | 'stable' | 'declining';
  confidenceScore: number; // 0-1 scale
  // Legacy fields (may be deprecated)
  relatedThemes?: string[];
  opportunityScore?: number;
  suggestedMethods?: string[];
  potentialImpact?: string;
  fundingOpportunities?: string[];
  collaborators?: string[];
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
  // Phase 10 Day 5.13+ filters
  minWordCount?: number; // Minimum word count (default: 1000)
  // Phase 10 Day 5.13+ Extension 2: Enterprise quality filters and sorting
  minAbstractLength?: number; // Minimum abstract words (default: 100)
  sortByEnhanced?:
    | 'relevance'
    | 'date'
    | 'citations'
    | 'citations_per_year'
    | 'word_count'
    | 'quality_score';
}

export interface KnowledgeGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'paper' | 'author' | 'concept' | 'method' | 'theme';
    properties: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'cites' | 'cited_by' | 'related' | 'contradicts';
    weight?: number;
  }>;
}

class LiteratureAPIService {
  private api: AxiosInstance;
  private baseURL: string;

  // Phase 10.92 Day 1: Full-text polling configuration constants
  // DRY Principle: Centralize magic numbers for easy tuning
  private readonly FULL_TEXT_POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
  private readonly FULL_TEXT_MAX_POLL_ATTEMPTS = 20; // ✅ FIX (BUG-004): Increased from 10 to 20 (60s total) - PDF extraction can be slow for large files
  private readonly FULL_TEXT_MAX_CONSECUTIVE_FAILURES = 3; // Abort after 3 consecutive errors

  // Phase 10.92 Day 18: Token refresh promise to prevent race conditions
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseURL =
      process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // CRITICAL FIX: Add timeout to prevent hanging requests
      timeout: 60000, // 60 seconds - literature search can take time
      // Configure params serialization for arrays
      // NestJS expects 'sources=youtube' not 'sources[]=youtube'
      paramsSerializer: {
        serialize: params => {
          const parts: string[] = [];
          Object.keys(params).forEach(key => {
            const value = params[key];
            if (Array.isArray(value)) {
              // For arrays, send as repeated params: sources=youtube&sources=github
              // Or for single item: sources=youtube
              if (value.length === 1) {
                parts.push(
                  `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`
                );
              } else {
                value.forEach(v => {
                  parts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
                  );
                });
              }
            } else if (value !== undefined && value !== null) {
              parts.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
              );
            }
          });
          return parts.join('&');
        },
      },
    });

    // Add auth interceptor with enterprise-grade validation and automatic token refresh
    this.api.interceptors.request.use(async config => {
      // CRITICAL FIX: Skip token processing for auth endpoints to prevent recursion
      if (config.url?.includes('/auth/')) {
        return config; // Let auth endpoints through without token manipulation
      }

      // PHASE 10.94.3: Development mode auth bypass for testing
      // When NEXT_PUBLIC_DEV_AUTH_BYPASS=true, skip token validation
      // This allows testing theme extraction without authentication
      const devAuthBypass = process.env['NEXT_PUBLIC_DEV_AUTH_BYPASS'] === 'true';
      if (devAuthBypass && process.env['NODE_ENV'] !== 'production') {
        logger.info('DEV_AUTH_BYPASS enabled - skipping token validation', 'LiteratureAPIService');
        // Set a development token header that backend can recognize
        config.headers['X-Dev-Auth-Bypass'] = 'true';
        return config;
      }

      let token = await getAuthToken();

      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Auth token retrieved', 'LiteratureAPIService', {
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        });
      }

      if (token) {
        // PERMANENT FIX: Check if token is expired BEFORE sending request
        try {
          const tokenParts = token.split('.');

          if (tokenParts.length !== 3) {
            logger.error('Invalid JWT format', 'LiteratureAPIService', {
              expectedParts: 3,
              actualParts: tokenParts.length,
            });
            // Try to refresh token
            token = await this.refreshTokenIfNeeded();
            if (!token) {
              logger.error('Token refresh failed - clearing auth', 'LiteratureAPIService');
              this.clearAuth();
              return config; // Don't send incomplete token
            }
          } else {
            // Decode payload to check expiration
            const payloadBase64 = tokenParts[1];
            if (!payloadBase64) {
              logger.error('Token missing payload part', 'LiteratureAPIService');
              return config;
            }
            const payload = JSON.parse(atob(payloadBase64));
            const now = Math.floor(Date.now() / 1000);

            // PROACTIVE REFRESH: If token expires in less than 5 minutes, refresh it now
            if (payload.exp && payload.exp - now < 300) {
              logger.info('Token expires soon, refreshing proactively', 'LiteratureAPIService', {
                expiresIn: payload.exp - now,
              });
              const newToken = await this.refreshTokenIfNeeded();
              if (newToken) {
                token = newToken;
                logger.info('Token refreshed proactively', 'LiteratureAPIService');
              }
            }

            // If already expired, refresh immediately
            if (payload.exp && payload.exp < now) {
              logger.warn('Token expired, refreshing', 'LiteratureAPIService');
              const newToken = await this.refreshTokenIfNeeded();
              if (newToken) {
                token = newToken;
                logger.info('Token refreshed successfully', 'LiteratureAPIService');
              } else {
                logger.error('Token expired and refresh failed - clearing auth', 'LiteratureAPIService');
                this.clearAuth();
                return config;
              }
            }
          }

          if (token.length < 100) {
            logger.error('Token too short', 'LiteratureAPIService', {
              tokenLength: token.length,
              expectedMinLength: 100,
            });
            // Try to refresh token
            const newToken = await this.refreshTokenIfNeeded();
            if (newToken) {
              token = newToken;
            } else {
              logger.error('Token refresh failed after short token detected', 'LiteratureAPIService');
              this.clearAuth();
              return config; // Don't send suspicious token
            }
          }

          // Token is valid, set Authorization header
          config.headers.Authorization = `Bearer ${token}`;

          if (process.env.NODE_ENV !== 'production') {
            logger.debug('Authorization header set successfully', 'LiteratureAPIService');
          }
        } catch (error) {
          logger.error('Error processing token', 'LiteratureAPIService', { error });
          // Try to refresh token on any error
          const newToken = await this.refreshTokenIfNeeded();
          if (newToken) {
            token = newToken;
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('No token available - request will be unauthorized', 'LiteratureAPIService');
        }
      }

      return config;
    });

    // Add response interceptor with automatic token refresh on 401
    this.api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        // PERMANENT FIX: Automatic token refresh on 401
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          logger.info('Got 401, attempting token refresh', 'LiteratureAPIService');

          try {
            // Try to refresh the token
            const newToken = await this.refreshTokenIfNeeded();

            if (newToken) {
              logger.info('Token refreshed, retrying original request', 'LiteratureAPIService');

              // Update the Authorization header with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // Retry the original request
              return this.api(originalRequest);
            } else {
              logger.error('Token refresh failed', 'LiteratureAPIService');
              this.clearAuth();
              // Show user-friendly error
              logger.error('Session expired - user must log in again', 'LiteratureAPIService');
            }
          } catch (refreshError) {
            logger.error('Error during token refresh', 'LiteratureAPIService', { error: refreshError });
            this.clearAuth();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ========== PERMANENT TOKEN REFRESH SOLUTION ==========
  // Phase 10.92 Day 18: Automatic token refresh helpers

  /**
   * Refresh the access token using the refresh token
   * Returns new access token or null if refresh fails
   * INCLUDES: Promise coalescing to prevent multiple concurrent refresh calls
   */
  private async refreshTokenIfNeeded(): Promise<string | null> {
    // CRITICAL FIX: If refresh already in progress, reuse existing promise
    if (this.refreshPromise) {
      logger.debug('Refresh already in progress, waiting for completion', 'LiteratureAPIService');
      return this.refreshPromise;
    }

    // Start new refresh and store promise
    this.refreshPromise = this.performTokenRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      // Clear promise after completion (success or failure)
      this.refreshPromise = null;
    }
  }

  /**
   * Actual token refresh implementation
   * Called by refreshTokenIfNeeded() with promise coalescing
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        logger.error('No refresh token available', 'LiteratureAPIService');
        return null;
      }

      logger.info('Calling refresh endpoint', 'LiteratureAPIService');

      // Call the refresh endpoint
      const response = await this.api.post('/auth/refresh', {
        refreshToken,
      });

      // Extract tokens from response (handle both accessToken and access_token)
      const newAccessToken = response.data.accessToken || response.data.access_token;
      const newRefreshToken = response.data.refreshToken || response.data.refresh_token;

      if (!newAccessToken) {
        logger.error('No access token in refresh response', 'LiteratureAPIService');
        return null;
      }

      // Update localStorage with new tokens
      localStorage.setItem('access_token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      logger.info('Tokens refreshed and stored', 'LiteratureAPIService');

      return newAccessToken;
    } catch (error: any) {
      logger.error('Token refresh failed', 'LiteratureAPIService', { errorMessage: error.message });

      // If refresh fails with 401, the refresh token is also expired
      if (error.response?.status === 401) {
        logger.error('Refresh token expired - user must log in again', 'LiteratureAPIService');
        this.clearAuth();
      }

      return null;
    }
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token'); // Legacy key
    logger.info('Cleared all auth data', 'LiteratureAPIService');
  }

  // ========== END TOKEN REFRESH SOLUTION ==========

  // Search literature across multiple databases
  // Phase 10.6 Day 14.5+: Returns enhanced metadata for transparency
  async searchLiterature(params: SearchLiteratureParams): Promise<{
    papers: Paper[];
    total: number;
    page: number;
    metadata?: {
      // Phase 10.7 Day 6: TWO-STAGE FILTERING METADATA
      stage1?: {
        description: string;
        totalCollected: number;
        sourcesSearched: number;
        sourceBreakdown: Record<string, { papers: number; duration: number; error?: string } | number>;
        searchDuration: number;
      };
      stage2?: {
        description: string;
        startingPapers: number;
        afterEnrichment: number;
        afterRelevanceFilter: number;
        afterQualityRanking: number;
        finalSelected: number;
        samplingApplied: boolean;
        diversityEnforced: boolean;
      };
      // Legacy fields for backward compatibility
      totalCollected: number;
      sourceBreakdown: Record<string, { papers: number; duration: number; error?: string } | number>;
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
      allocationStrategy?: any;
    };
  }> {
    try {
      logger.info('Sending search request', 'LiteratureAPIService', {
        query: params.query,
        sources: params.sources,
        sourcesCount: params.sources?.length,
      });
      // Temporarily use public endpoint for development
      const response = await this.api.post('/literature/search/public', params);

      // apiClient.post returns response.data already, which contains {data: actualData}
      // Backend returns {papers, total, page} directly
      // So response = {data: {papers, total, page}}
      const actualData = response.data || response;

      // Ensure we have the expected structure
      // Phase 10.6 Day 14.5: Include metadata for transparency
      const result = {
        papers: actualData.papers || [],
        total: actualData.total || 0,
        page: actualData.page || params.page || 1,
        metadata: actualData.metadata || null, // CRITICAL: Pass through metadata from backend
      };

      logger.info('Search completed', 'LiteratureAPIService', {
        papersCount: result.papers.length,
        total: result.total,
        hasMetadata: !!result.metadata,
      });
      return result;
    } catch (error: any) {
      logger.error('Literature search failed', 'LiteratureAPIService', {
        error,
        status: error.response?.status,
        message: error.response?.data?.message,
      });
      // Better error handling
      if (error.response?.status === 401) {
        logger.warn('Authentication required - using public endpoint', 'LiteratureAPIService');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  // Analyze research gaps
  async analyzeGaps(
    field: string,
    options?: {
      subtopics?: string[];
      timeRange?: number;
      includeFunding?: boolean;
      includeCollaborations?: boolean;
    }
  ): Promise<ResearchGap[]> {
    try {
      const response = await this.api.get('/literature/gaps', {
        params: { field, ...options },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Gap analysis failed', 'LiteratureAPIService', { error });
      // Return mock data for development if auth fails
      if (error.response?.status === 401) {
        logger.warn('Using mock gap data for development', 'LiteratureAPIService');
        return [];
      }
      throw error;
    }
  }

  // Save paper to user library
  async savePaper(
    paper: Partial<Paper> & {
      tags?: string[];
      collectionId?: string;
    }
  ): Promise<{ success: boolean; paperId: string }> {
    try {
      // 🚀 PHASE 10.94.3: Validate required fields BEFORE sending to avoid 400 errors
      // This prevents batch failures from validation issues
      if (!paper.title || typeof paper.title !== 'string' || paper.title.trim().length === 0) {
        logger.error('Paper validation failed: missing or empty title', 'LiteratureAPIService', {
          paperId: paper.id,
          hasTitle: !!paper.title,
          titleType: typeof paper.title,
        });
        throw new Error('VALIDATION_ERROR: Paper title is required');
      }

      // 🚀 PHASE 10.94.3: Ensure authors is an array (some APIs return single string)
      // Use type assertion for runtime type checking since some APIs may return non-standard data
      let authorsArray: string[];
      const authorsValue = paper.authors as unknown;
      if (Array.isArray(authorsValue)) {
        authorsArray = authorsValue.filter((a): a is string => typeof a === 'string');
      } else if (typeof authorsValue === 'string' && authorsValue.length > 0) {
        // Convert single author string to array
        authorsArray = [authorsValue];
      } else {
        authorsArray = [];
      }

      // 🚀 PHASE 10.94.3: Ensure year is a valid number
      let yearNumber: number;
      if (typeof paper.year === 'number' && !isNaN(paper.year)) {
        yearNumber = paper.year;
      } else if (typeof paper.year === 'string') {
        yearNumber = parseInt(paper.year, 10);
        if (isNaN(yearNumber)) {
          yearNumber = new Date().getFullYear();
        }
      } else {
        yearNumber = new Date().getFullYear();
      }

      // Extract only the fields allowed by SavePaperDto
      const saveData = {
        title: paper.title.trim(),
        authors: authorsArray,
        year: yearNumber,
        abstract: paper.abstract,
        doi: paper.doi,
        url: paper.url,
        venue: paper.venue,
        citationCount: typeof paper.citationCount === 'number' ? paper.citationCount : undefined,
        tags: paper.tags,
        collectionId: paper.collectionId,
      };

      // Phase 10 Day 32: CRITICAL FIX - Use authenticated endpoint to enable full-text extraction
      // Public endpoint doesn't save to DB or initiate full-text jobs
      const response = await this.api.post('/literature/save', saveData);

      // Phase 10 Day 32: REMOVED localStorage duplication
      // Papers saved to database only - prevents data sync issues
      // localStorage becomes stale when DB updates (full-text added)

      return response.data;
    } catch (error: any) {
      // 🚀 PHASE 10.94.3: Enhanced error logging with response body details
      logger.error('Failed to save paper', 'LiteratureAPIService', {
        paperId: paper.id,
        title: paper.title?.substring(0, 50),
        status: error.response?.status,
        responseData: error.response?.data, // Backend validation error details
        message: error.message,
      });

      // Phase 10 Day 32: CRITICAL FIX - Don't return success on authentication failures
      // Misleading success breaks theme extraction (no DB save = no full-text jobs)
      if (error.response?.status === 401) {
        logger.error('Authentication required to save papers', 'LiteratureAPIService');
        throw new Error('AUTHENTICATION_REQUIRED');
      }

      // 🚀 PHASE 10.94.3: Handle 400 validation errors with details
      if (error.response?.status === 400) {
        const validationMessage = error.response?.data?.message || 'Validation failed';
        logger.error('Validation error from backend', 'LiteratureAPIService', {
          validationMessage,
          errors: error.response?.data?.errors,
        });
        throw new Error(`VALIDATION_ERROR: ${validationMessage}`);
      }

      // Re-throw other errors without misleading success
      throw error;
    }
  }

  // Phase 10 Day 32: Removed saveToLocalStorage helper
  // Papers are now saved ONLY to database via authenticated API
  // localStorage duplication removed to prevent sync issues

  // Get user's saved papers
  async getUserLibrary(
    page = 1,
    limit = 20
  ): Promise<{
    papers: Paper[];
    total: number;
  }> {
    try {
      // Phase 10 Day 32: CRITICAL FIX - Use authenticated endpoint to get actual saved papers
      // Public endpoint returns empty library (no papers with full-text)
      const response = await this.api.get('/literature/library', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user library', 'LiteratureAPIService', { error });

      // Fallback to localStorage for development
      if (error.response?.status === 401 || error.response?.status === 404) {
        logger.warn('Using localStorage fallback for library', 'LiteratureAPIService');
        return this.getFromLocalStorage(page, limit);
      }
      throw error;
    }
  }

  // Helper: Get from localStorage
  private getFromLocalStorage(
    page = 1,
    limit = 20
  ): { papers: Paper[]; total: number } {
    try {
      const stored = localStorage.getItem('savedPapers') || '[]';
      const papers = JSON.parse(stored);
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        papers: papers.slice(start, end),
        total: papers.length,
      };
    } catch (e) {
      logger.error('Failed to get from localStorage', 'LiteratureAPIService', { error: e });
      return { papers: [], total: 0 };
    }
  }

  // Remove paper from library
  async removePaper(paperId: string): Promise<{ success: boolean }> {
    try {
      // Try public endpoint first for development
      const response = await this.api.delete(
        `/literature/library/public/${paperId}`
      );

      // Also remove from localStorage
      this.removeFromLocalStorage(paperId);

      return response.data;
    } catch (error: any) {
      logger.error('Failed to remove paper', 'LiteratureAPIService', { error, paperId });

      // Fallback to localStorage for development
      if (
        error.response?.status === 401 ||
        error.response?.status === 404 ||
        error.response?.status === 500
      ) {
        logger.warn('Using localStorage fallback for remove', 'LiteratureAPIService');
        this.removeFromLocalStorage(paperId);
        return { success: true };
      }
      throw error;
    }
  }

  // Helper: Remove from localStorage
  private removeFromLocalStorage(paperId: string): void {
    try {
      const stored = localStorage.getItem('savedPapers') || '[]';
      const papers = JSON.parse(stored);
      const filtered = papers.filter((p: any) => p.id !== paperId);

      localStorage.setItem('savedPapers', JSON.stringify(filtered));
      logger.info('Paper removed from localStorage', 'LiteratureAPIService', { paperId });
    } catch (e) {
      logger.error('Failed to remove from localStorage', 'LiteratureAPIService', { error: e });
    }
  }

  // Export citations in various formats
  async exportCitations(
    paperIds: string[],
    format: 'bibtex' | 'ris' | 'json' | 'csv' | 'apa' | 'mla' | 'chicago',
    includeAbstracts?: boolean
  ): Promise<{
    content: string;
    filename: string;
  }> {
    try {
      const response = await this.api.post('/literature/export', {
        paperIds,
        format,
        includeAbstracts,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Extract themes from papers
  async extractThemes(paperIds: string[], numThemes = 5): Promise<Theme[]> {
    try {
      // Use public endpoint for development
      const response = await this.api.post('/literature/themes/public', {
        paperIds,
        numThemes,
      });
      return response.data;
    } catch (error: any) {
      // If public endpoint fails, try authenticated endpoint
      if (error.response?.status === 404) {
        try {
          const authResponse = await this.api.post('/literature/themes', {
            paperIds,
            numThemes,
          });
          return authResponse.data;
        } catch (authError) {
          logger.error('Failed to extract themes with auth', 'LiteratureAPIService', { error: authError });
          throw authError;
        }
      }
      logger.error('Failed to extract themes', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  // ===========================================================================
  // PHASE 10 DAY 5.8 WEEK 1: ACADEMIC-GRADE THEME EXTRACTION
  // ===========================================================================

  /**
   * Extract themes using academic-grade methodology with semantic embeddings
   * Based on Braun & Clarke (2006) Reflexive Thematic Analysis
   *
   * Implements 6-stage process:
   * 1. Familiarization - Generate embeddings from FULL content
   * 2. Initial Coding - Identify semantic patterns
   * 3. Theme Generation - Cluster related codes
   * 4. Theme Review - Validate against full dataset (3+ sources)
   * 5. Refinement - Merge overlaps and remove weak themes
   * 6. Provenance - Calculate semantic influence
   */
  async extractThemesAcademic(
    sources: {
      id?: string;
      type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
      title: string;
      content: string; // FULL CONTENT - NO TRUNCATION
      authors?: string[];
      keywords?: string[];
      url?: string;
      doi?: string;
      year?: number;
    }[],
    options?: {
      researchContext?: string;
      methodology?:
        | 'reflexive_thematic'
        | 'grounded_theory'
        | 'content_analysis';
      validationLevel?: 'standard' | 'rigorous' | 'publication_ready';
      maxThemes?: number;
      minConfidence?: number;
      studyId?: string;
    }
  ): Promise<{
    success: boolean;
    themes: Theme[];
    methodology: {
      method: string;
      citation: string;
      stages: number;
      validation: string;
      aiRole: string;
      limitations: string;
    };
    validation: {
      coherenceScore: number;
      coverage: number;
      saturation: boolean;
      confidence: number;
    };
    processingStages: string[];
    metadata: {
      sourcesAnalyzed: number;
      codesGenerated: number;
      candidateThemes: number;
      finalThemes: number;
      processingTimeMs: number;
      embeddingModel: string;
      analysisModel: string;
    };
    transparency: {
      howItWorks: string;
      aiRole: string;
      quality: string;
      limitations: string;
      citation: string;
    };
  }> {
    try {
      const response = await this.api.post(
        '/literature/themes/extract-academic',
        {
          sources,
          researchContext: options?.researchContext,
          methodology: options?.methodology || 'reflexive_thematic',
          validationLevel: options?.validationLevel || 'rigorous',
          maxThemes: options?.maxThemes || 15,
          minConfidence: options?.minConfidence || 0.5,
          studyId: options?.studyId,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to extract themes with academic methodology', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  // ===========================================================================
  // PHASE 9 DAY 14-15: KNOWLEDGE GRAPH & PREDICTIVE GAP DETECTION
  // ===========================================================================

  /**
   * Phase 9 Day 14: Build knowledge graph from papers
   */
  async buildKnowledgeGraph(paperIds: string[]): Promise<{
    success: boolean;
    metrics: {
      entitiesExtracted: number;
      citationsCreated: number;
      bridgeConceptsFound: number;
      controversiesDetected: number;
      emergingTopicsFound: number;
      processingTimeMs: number;
    };
    insights: {
      bridgeConcepts: any[];
      controversies: any[];
      emergingTopics: any[];
    };
  }> {
    try {
      const response = await this.api.post(
        '/literature/knowledge-graph/build',
        { paperIds }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to build knowledge graph', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  /**
   * Get knowledge graph for visualization
   */
  async getKnowledgeGraph(filters?: {
    types?: string[];
    minConfidence?: number;
    includePredicted?: boolean;
  }): Promise<{
    success: boolean;
    graph: KnowledgeGraphData;
    stats: {
      nodeCount: number;
      edgeCount: number;
      bridgeConcepts: number;
      emergingTopics: number;
    };
  }> {
    try {
      const params: any = {};
      if (filters?.types) params.types = filters.types.join(',');
      if (filters?.minConfidence) params.minConfidence = filters.minConfidence;
      if (filters?.includePredicted !== undefined)
        params.includePredicted = filters.includePredicted;

      const response = await this.api.get('/literature/knowledge-graph/view', {
        params,
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get knowledge graph', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  /**
   * Track influence flow from a concept
   */
  async trackInfluenceFlow(nodeId: string): Promise<{
    success: boolean;
    sourceNodeId: string;
    influenceFlows: any[];
    totalInfluenced: number;
  }> {
    try {
      const response = await this.api.get(
        `/literature/knowledge-graph/influence/${nodeId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to track influence flow', 'LiteratureAPIService', { error, nodeId });
      throw error;
    }
  }

  /**
   * Predict missing links in knowledge graph
   */
  async predictMissingLinks(): Promise<{
    success: boolean;
    predictedLinks: any[];
    totalPredictions: number;
  }> {
    try {
      const response = await this.api.post(
        '/literature/knowledge-graph/predict-links'
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to predict missing links', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  /**
   * Export knowledge graph in various formats
   */
  async exportKnowledgeGraph(
    format: 'json' | 'graphml' | 'cypher' = 'json'
  ): Promise<{
    success: boolean;
    format: string;
    data: string;
  }> {
    try {
      const response = await this.api.get(
        '/literature/knowledge-graph/export',
        {
          params: { format },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to export knowledge graph', 'LiteratureAPIService', { error, format });
      throw error;
    }
  }

  /**
   * Phase 9 Day 15: Score research opportunities with ML predictions
   */
  async scoreResearchOpportunities(gapIds: string[]): Promise<{
    success: boolean;
    opportunities: any[];
    topOpportunities: any[];
    averageScore: number;
  }> {
    try {
      const response = await this.api.post(
        '/literature/predictive-gaps/score-opportunities',
        {
          gapIds,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to score research opportunities', 'LiteratureAPIService', { error, gapIds });
      throw error;
    }
  }

  /**
   * Predict funding probability for research gaps
   */
  async predictFundingProbability(gapIds: string[]): Promise<{
    success: boolean;
    fundingOpportunities: any[];
    highProbability: any[];
  }> {
    try {
      const response = await this.api.post(
        '/literature/predictive-gaps/funding-probability',
        {
          gapIds,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to predict funding probability', 'LiteratureAPIService', { error, gapIds });
      throw error;
    }
  }

  /**
   * Get optimized research timelines
   */
  async getTimelineOptimizations(gapIds: string[]): Promise<{
    success: boolean;
    timelines: any[];
    averageDuration: number;
  }> {
    try {
      const response = await this.api.post(
        '/literature/predictive-gaps/optimize-timeline',
        {
          gapIds,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to optimize timeline', 'LiteratureAPIService', { error, gapIds });
      throw error;
    }
  }

  /**
   * Predict research impact
   */
  async predictImpact(gapIds: string[]): Promise<{
    success: boolean;
    predictions: any[];
    transformativeOpportunities: any[];
  }> {
    try {
      const response = await this.api.post(
        '/literature/predictive-gaps/predict-impact',
        {
          gapIds,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to predict impact', 'LiteratureAPIService', { error, gapIds });
      throw error;
    }
  }

  /**
   * Forecast research trends
   */
  async forecastTrends(topics: string[]): Promise<{
    success: boolean;
    forecasts: any[];
    emergingTopics: any[];
    decliningTopics: any[];
  }> {
    try {
      const response = await this.api.post(
        '/literature/predictive-gaps/forecast-trends',
        {
          topics,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to forecast trends', 'LiteratureAPIService', { error, topics });
      throw error;
    }
  }

  /**
   * Analyze research gaps from papers (Phase 9 Day 8-10 enhanced)
   * Now sends full paper content instead of just IDs
   */
  async analyzeGapsFromPapers(papers: Paper[]): Promise<any[]> {
    try {
      logger.info('Analyzing research gaps from papers', 'LiteratureAPIService', {
        papersCount: papers.length,
      });

      // Send full paper content to backend
      const response = await this.api.post('/literature/gaps/analyze', {
        papers: papers.map(p => ({
          id: p.id,
          title: p.title,
          abstract: p.abstract,
          authors: p.authors,
          year: p.year,
          keywords: p.keywords,
          doi: p.doi,
          venue: p.venue,
          citationCount: p.citationCount,
        })),
      });

      logger.info('Gap analysis complete', 'LiteratureAPIService', {
        gapsFound: response.data?.length || 0,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to analyze gaps from papers', 'LiteratureAPIService', { error });

      // Fallback to public endpoint for development
      if (error.response?.status === 401 || error.response?.status === 404) {
        logger.info('Trying public endpoint for gap analysis', 'LiteratureAPIService');
        try {
          const publicResponse = await this.api.post(
            '/literature/gaps/analyze/public',
            {
              papers: papers.map(p => ({
                id: p.id,
                title: p.title,
                abstract: p.abstract,
                authors: p.authors,
                year: p.year,
                keywords: p.keywords,
                doi: p.doi,
                venue: p.venue,
                citationCount: p.citationCount,
              })),
            }
          );
          logger.info('Public gap analysis complete', 'LiteratureAPIService', {
            gapsFound: publicResponse.data?.length || 0,
          });
          return publicResponse.data;
        } catch (publicError) {
          logger.error('Public endpoint also failed', 'LiteratureAPIService', { error: publicError });
          throw publicError;
        }
      }

      throw error;
    }
  }

  // Get citation network for a paper
  async getCitationNetwork(
    paperId: string,
    depth = 2
  ): Promise<KnowledgeGraphData> {
    try {
      const response = await this.api.get(`/literature/citations/${paperId}`, {
        params: { depth },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get citation network', 'LiteratureAPIService', { error, paperId });
      throw error;
    }
  }

  // Get literature recommendations for a study
  async getStudyRecommendations(studyId: string): Promise<Paper[]> {
    try {
      const response = await this.api.get(
        `/literature/recommendations/${studyId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get recommendations', 'LiteratureAPIService', { error, studyId });
      throw error;
    }
  }

  // Generate Q-statements from literature themes
  async generateStatementsFromThemes(
    themes: string[],
    studyContext: any
  ): Promise<string[]> {
    try {
      // Phase 10 Day 14: Use public endpoint for development/testing
      // In production, this should use the authenticated endpoint
      const endpoint = '/literature/statements/generate/public';

      logger.info('Generating Q-Statements from themes', 'LiteratureAPIService', {
        themesCount: themes.length,
      });
      const response = await this.api.post(endpoint, {
        themes,
        studyContext,
      });
      logger.info('Q-Statements generated', 'LiteratureAPIService', {
        statementsCount: response.data?.length || 0,
      });
      return response.data;
    } catch (error) {
      logger.error('Q-Statements generation failed', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  // Get social media research data
  async analyzeSocialOpinion(topic: string, platforms: string[]): Promise<any> {
    try {
      const response = await this.api.get('/literature/social', {
        params: { topic, platforms },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze social opinion', 'LiteratureAPIService', { error, topic, platforms });
      throw error;
    }
  }

  // Search alternative sources
  async searchAlternativeSources(
    query: string,
    sources: string[]
  ): Promise<any[]> {
    try {
      logger.info('Starting alternative sources search', 'LiteratureAPIService', {
        query,
        sources,
        sourcesCount: sources.length,
      });

      // Use public endpoint for development/testing to avoid authentication issues
      // TODO: Switch back to '/literature/alternative' when authentication is properly implemented
      const response = await this.api.get('/literature/alternative/public', {
        params: { query, sources },
      });

      // Ensure we always return an array
      const results = Array.isArray(response.data) ? response.data : [];

      logger.info('Alternative sources search completed', 'LiteratureAPIService', {
        resultCount: results.length,
        sources,
      });

      return results;
    } catch (error: any) {
      logger.error('Alternative sources search failed', 'LiteratureAPIService', {
        error,
        query,
        sources,
        status: error.response?.status,
        errorDetails: error.response?.data,
      });

      // Provide helpful error message about authentication
      if (error.response?.status === 401) {
        logger.warn(
          'Authentication required for alternative sources',
          'LiteratureAPIService',
          { endpoint: '/literature/alternative/public' }
        );
      }

      throw error;
    }
  }

  /**
   * PHASE 9 DAY 13: Social Media Intelligence
   * Search social media platforms for research-relevant content
   */
  async searchSocialMedia(query: string, platforms: string[]): Promise<any[]> {
    try {
      const response = await this.api.get('/literature/social/search/public', {
        params: { query, platforms },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to search social media', 'LiteratureAPIService', { error, query, platforms });
      throw error;
    }
  }

  /**
   * Get aggregated insights from social media data
   * Provides sentiment distribution, trending themes, and key influencers
   */
  async getSocialMediaInsights(posts: any[]): Promise<any> {
    try {
      const response = await this.api.get('/literature/social/insights', {
        data: posts,
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get social media insights', 'LiteratureAPIService', { error, postsCount: posts.length });
      // Return basic insights on failure
      return {
        totalPosts: posts.length,
        platformDistribution: {},
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        topInfluencers: [],
        engagementStats: { total: 0, average: 0, median: 0 },
      };
    }
  }

  // ============================================
  // PHASE 9 DAY 18: MULTI-MODAL TRANSCRIPTION
  // ============================================

  /**
   * Search YouTube videos with optional transcription and theme extraction
   */
  async searchYouTubeWithTranscription(
    query: string,
    options: {
      includeTranscripts?: boolean;
      extractThemes?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/youtube-search',
        {
          query,
          includeTranscripts: options.includeTranscripts || false,
          extractThemes: options.extractThemes || false,
          maxResults: options.maxResults || 10,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to search YouTube with transcription', 'LiteratureAPIService', { error, query });
      throw error;
    }
  }

  /**
   * Get or create transcription for a video/podcast
   */
  async transcribeMedia(
    sourceId: string,
    sourceType: 'youtube' | 'podcast',
    sourceUrl?: string
  ): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/transcribe',
        {
          sourceId,
          sourceType,
          sourceUrl,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to transcribe media', 'LiteratureAPIService', { error, sourceId, sourceType });
      throw error;
    }
  }

  /**
   * Extract themes from a transcript
   */
  async extractThemesFromTranscript(
    transcriptId: string,
    researchContext?: string
  ): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/extract-themes',
        {
          transcriptId,
          researchContext,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to extract themes from transcript', 'LiteratureAPIService', { error, transcriptId });
      throw error;
    }
  }

  /**
   * Extract citations from a transcript
   */
  async extractCitationsFromTranscript(transcriptId: string): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/extract-citations',
        {
          transcriptId,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to extract citations from transcript', 'LiteratureAPIService', { error, transcriptId });
      throw error;
    }
  }

  /**
   * Estimate transcription cost
   */
  async estimateTranscriptionCost(
    sourceId: string,
    sourceType: 'youtube' | 'podcast'
  ): Promise<{ duration: number; estimatedCost: number }> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/estimate-cost',
        {
          sourceId,
          sourceType,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to estimate transcription cost', 'LiteratureAPIService', { error, sourceId, sourceType });
      throw error;
    }
  }

  /**
   * Add multimedia to knowledge graph
   */
  async addMultimediaToGraph(transcriptId: string): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/multimedia/add-to-graph',
        {
          transcriptId,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to add multimedia to graph', 'LiteratureAPIService', { error, transcriptId });
      throw error;
    }
  }

  /**
   * Get YouTube channel information
   * Supports: channel ID, @handle, or full URL
   */
  async getYouTubeChannel(channelIdentifier: string): Promise<any> {
    try {
      const response = await this.api.post('/literature/youtube/channel/info', {
        channelIdentifier,
      });
      return response.data.channel;
    } catch (error) {
      logger.error('Failed to fetch YouTube channel', 'LiteratureAPIService', { error, channelIdentifier });
      throw error;
    }
  }

  /**
   * Get videos from a YouTube channel
   */
  async getChannelVideos(
    channelId: string,
    options?: {
      maxResults?: number;
      publishedAfter?: Date;
      publishedBefore?: Date;
      order?: 'date' | 'relevance' | 'viewCount';
    }
  ): Promise<{ videos: any[]; nextPageToken?: string; hasMore: boolean }> {
    try {
      const payload: any = {
        channelId,
        maxResults: options?.maxResults || 20,
        order: options?.order || 'date',
      };

      if (options?.publishedAfter) {
        payload.publishedAfter = options.publishedAfter.toISOString();
      }

      if (options?.publishedBefore) {
        payload.publishedBefore = options.publishedBefore.toISOString();
      }

      const response = await this.api.post(
        '/literature/youtube/channel/videos',
        payload
      );

      return {
        videos: response.data.videos || [],
        nextPageToken: response.data.nextPageToken,
        hasMore: response.data.hasMore || false,
      };
    } catch (error) {
      logger.error('Failed to fetch channel videos', 'LiteratureAPIService', { error, channelId });
      throw error;
    }
  }

  /**
   * Phase 10 Day 5.9: Generate Survey Items from Themes
   * Convert academic themes into traditional survey items (Likert, MC, rating scales)
   *
   * Purpose: Expand theme utility from Q-methodology only to ALL survey types
   * Research Foundation: DeVellis (2016) Scale Development
   */
  async generateSurveyItemsFromThemes(
    themes: Array<{
      id: string;
      name: string;
      description: string;
      prevalence: number;
      confidence: number;
      sources?: Array<{
        id: string;
        title: string;
        type: string;
      }>;
      keyPhrases?: string[];
    }>,
    options?: {
      itemType?:
        | 'likert'
        | 'multiple_choice'
        | 'semantic_differential'
        | 'matrix_grid'
        | 'rating_scale'
        | 'mixed';
      scaleType?:
        | '1-5'
        | '1-7'
        | '1-10'
        | 'agree-disagree'
        | 'frequency'
        | 'satisfaction';
      itemsPerTheme?: number;
      includeReverseCoded?: boolean;
      researchContext?: string;
      targetAudience?: string;
    }
  ): Promise<{
    success: boolean;
    items: Array<{
      id: string;
      type:
        | 'likert'
        | 'multiple_choice'
        | 'semantic_differential'
        | 'matrix_grid'
        | 'rating_scale';
      themeId: string;
      themeName: string;
      text: string;
      scaleType?: string;
      scaleLabels?: string[];
      options?: string[];
      reversed?: boolean;
      dimension?: string;
      leftPole?: string;
      rightPole?: string;
      construct?: string;
      itemNumber?: number;
      reliability?: {
        reverseCodedReason?: string;
        expectedCorrelation?: 'positive' | 'negative';
      };
      metadata: {
        generationMethod: string;
        researchBacking: string;
        confidence: number;
        themePrevalence: number;
      };
    }>;
    summary: {
      totalItems: number;
      itemsByType: Record<string, number>;
      reverseCodedCount: number;
      averageConfidence: number;
    };
    methodology: {
      approach: string;
      researchBacking: string;
      validation: string;
      reliability: string;
    };
    recommendations: {
      pilotTesting: string;
      reliabilityAnalysis: string;
      validityChecks: string;
    };
  }> {
    try {
      const response = await this.api.post(
        '/literature/themes/to-survey-items',
        {
          themes,
          itemType: options?.itemType || 'likert',
          scaleType: options?.scaleType || '1-5',
          itemsPerTheme: options?.itemsPerTheme || 3,
          includeReverseCoded: options?.includeReverseCoded !== false,
          researchContext: options?.researchContext,
          targetAudience: options?.targetAudience,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to generate survey items from themes', 'LiteratureAPIService', { error });
      throw error;
    }
  }

  /**
   * PHASE 10 DAY 30: Refresh Paper Metadata (Enterprise-Grade Solution)
   * Re-fetches metadata from academic sources for existing papers
   * Populates missing full-text availability fields for papers saved before detection was implemented
   *
   * @param paperIds - Array of paper IDs or DOIs to refresh
   * @returns Object with refreshed papers and statistics
   */
  async refreshPaperMetadata(paperIds: string[]): Promise<{
    success: boolean;
    refreshed: number;
    failed: number;
    papers: Paper[];
    errors: Array<{ paperId: string; error: string }>;
  }> {
    try {
      logger.info('Refresh paper metadata starting', 'LiteratureAPIService', {
        papersCount: paperIds.length,
      });

      const response = await this.api.post(
        '/literature/papers/refresh-metadata',
        {
          paperIds,
        }
      );

      const withFullText = response.data.papers?.filter((p: Paper) => p.hasFullText).length || 0;

      logger.info('Metadata refresh complete', 'LiteratureAPIService', {
        totalPapers: paperIds.length,
        refreshed: response.data.refreshed,
        failed: response.data.failed,
        papersWithFullText: withFullText,
        errors: response.data.errors?.length || 0,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to refresh paper metadata', 'LiteratureAPIService', {
        error,
        errorMessage: error.message,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Phase 10.92 Day 1: Fetch Full-Text for Single Paper
   *
   * Triggers full-text extraction for a single paper via backend waterfall strategy.
   * Backend immediately updates paper status to 'fetching' and queues for processing.
   *
   * **Workflow:**
   * 1. Call backend endpoint to trigger full-text fetch job
   * 2. Backend queues paper for extraction (PMC → PDF → HTML waterfall)
   * 3. Poll for completion using pollFullTextStatus helper
   * 4. Return updated paper with full-text when available
   *
   * **Polling Strategy:**
   * - Max 20 attempts (60 seconds total) - Increased to handle large PDF extraction
   * - 3-second intervals
   * - Returns early on 'success' or 'failed' status
   * - Timeout handling with current paper state
   *
   * @param paperId - Paper ID to fetch full-text for
   * @returns Promise<Paper> - Updated paper with full-text status
   * @throws Error if paper not found or fetch trigger fails
   *
   * @example
   * ```typescript
   * const updatedPaper = await literatureAPI.fetchFullTextForPaper('paper-123');
   * if (updatedPaper.hasFullText) {
   *   console.log(`Full-text: ${updatedPaper.fullTextWordCount} words`);
   * }
   * ```
   */
  async fetchFullTextForPaper(paperId: string): Promise<Paper> {
    try {
      logger.info('Full-text fetch starting', 'LiteratureAPIService', { paperId });

      // Step 1: Trigger full-text extraction job
      const triggerResponse = await this.api.post<{
        success: boolean;
        jobId: string;
        paperId: string;
        message: string;
        fullTextStatus: string;
      }>(`/literature/fetch-fulltext/${paperId}`);

      logger.info('Full-text fetch job triggered', 'LiteratureAPIService', {
        paperId,
        jobId: triggerResponse.data.jobId,
      });

      // If already has full-text, return immediately
      if (triggerResponse.data.fullTextStatus === 'success') {
        logger.info('Paper already has full-text', 'LiteratureAPIService', { paperId });
        const paper = await this.getPaperById(paperId);
        return paper;
      }

      // Step 2: Poll for completion
      // ✅ BUG FIX (Phase 10.942): Use class constant instead of hardcoded 10
      // Previously: 10 attempts × 3s = 30s timeout (too short for large PDFs)
      // Now: FULL_TEXT_MAX_POLL_ATTEMPTS (20) × 3s = 60s timeout
      const updatedPaper = await this.pollFullTextStatus(paperId);

      logger.info('Full-text fetch completed', 'LiteratureAPIService', {
        paperId,
        status: updatedPaper.fullTextStatus,
        hasFullText: updatedPaper.hasFullText,
        wordCount: updatedPaper.fullTextWordCount || 0,
      });

      return updatedPaper;
    } catch (error: any) {
      logger.error('Full-text fetch failed', 'LiteratureAPIService', {
        paperId,
        errorMessage: error.message,
      });

      // Handle 404 error (paper not found)
      if (error.response?.status === 404) {
        throw new Error(
          `Paper ${paperId} not found in database - save it first`
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Helper: Poll paper status for full-text completion
   *
   * Polls the paper library endpoint to check if full-text extraction completed.
   * Stops early on 'success' or 'failed' status.
   *
   * **Enterprise Error Handling:**
   * - Tracks consecutive failures to detect persistent issues
   * - Aborts after MAX_CONSECUTIVE_FAILURES (likely network/backend issue)
   * - Continues on transient errors (occasional failures are OK)
   *
   * **Configuration:**
   * - Poll interval: FULL_TEXT_POLL_INTERVAL_MS (configurable)
   * - Max attempts: FULL_TEXT_MAX_POLL_ATTEMPTS (configurable)
   * - Max consecutive failures: FULL_TEXT_MAX_CONSECUTIVE_FAILURES (configurable)
   *
   * @param paperId - Paper ID to poll
   * @param maxAttempts - Maximum polling attempts (default: from class constant)
   * @returns Promise<Paper> - Updated paper when status changes
   * @throws Error if consecutive polling failures exceed threshold
   * @private
   */
  private async pollFullTextStatus(
    paperId: string,
    maxAttempts = this.FULL_TEXT_MAX_POLL_ATTEMPTS
  ): Promise<Paper> {
    const pollInterval = this.FULL_TEXT_POLL_INTERVAL_MS;
    const maxConsecutiveFailures = this.FULL_TEXT_MAX_CONSECUTIVE_FAILURES;
    let consecutiveFailures = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Wait before polling (except first attempt)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      logger.debug('Polling for full-text status', 'LiteratureAPIService', {
        paperId,
        attempt,
        maxAttempts,
      });

      try {
        // Get updated paper from library
        const paper = await this.getPaperById(paperId);

        // Reset consecutive failure counter on successful poll
        consecutiveFailures = 0;

        // Check if full-text fetch completed (success or failed)
        if (
          paper.fullTextStatus === 'success' ||
          paper.fullTextStatus === 'failed'
        ) {
          logger.info('Full-text status changed', 'LiteratureAPIService', {
            paperId,
            status: paper.fullTextStatus,
          });
          return paper;
        }

        logger.debug('Full-text still processing', 'LiteratureAPIService', {
          paperId,
          status: paper.fullTextStatus || 'not_fetched',
        });
      } catch (error: any) {
        consecutiveFailures++;

        logger.warn('Polling error', 'LiteratureAPIService', {
          paperId,
          consecutiveFailures,
          maxConsecutiveFailures,
          errorMessage: error.message,
        });

        // Abort if too many consecutive failures (likely persistent issue)
        if (consecutiveFailures >= maxConsecutiveFailures) {
          logger.error('Aborting polling after consecutive failures', 'LiteratureAPIService', {
            paperId,
            consecutiveFailures,
          });
          throw new Error(
            `Polling failed after ${consecutiveFailures} consecutive attempts - likely network or backend issue`
          );
        }

        logger.debug('Transient error - continuing to poll', 'LiteratureAPIService', {
          consecutiveFailures,
          maxConsecutiveFailures,
        });
      }
    }

    // Timeout - return paper as-is
    logger.warn('Full-text fetch timeout', 'LiteratureAPIService', {
      paperId,
      timeoutSeconds: maxAttempts * pollInterval / 1000,
    });

    try {
      const finalPaper = await this.getPaperById(paperId);
      return finalPaper;
    } catch (error) {
      logger.error('Failed to get final paper state', 'LiteratureAPIService', { error, paperId });
      throw error;
    }
  }

  /**
   * Helper: Get single paper by ID from library
   *
   * @param paperId - Paper ID
   * @returns Promise<Paper> - Paper object
   * @private
   */
  private async getPaperById(paperId: string): Promise<Paper> {
    try {
      const response = await this.api.get<{ paper: Paper }>(
        `/literature/library/${paperId}`
      );
      return response.data.paper;
    } catch (error: any) {
      logger.error('Failed to get paper by ID', 'LiteratureAPIService', {
        paperId,
        errorMessage: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const literatureAPI = new LiteratureAPIService();
export default literatureAPI;
