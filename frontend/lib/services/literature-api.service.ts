import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from '../auth/auth-utils';

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
  relatedThemes: string[];
  opportunityScore: number;
  suggestedMethods: string[];
  potentialImpact: string;
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

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
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

    // Add auth interceptor
    this.api.interceptors.request.use(async config => {
      const token = await getAuthToken();
      console.log(
        '🔑 [Auth Token]:',
        token ? `${token.substring(0, 20)}...` : 'No token found'
      );
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(
          '⚠️ [Auth] No token available - request will be unauthorized'
        );
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // For development, just log the error instead of redirecting
          console.log('🔐 Authentication required for this endpoint');
          // TODO: Re-enable redirect after auth is implemented
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Search literature across multiple databases
  async searchLiterature(params: SearchLiteratureParams): Promise<{
    papers: Paper[];
    total: number;
    page: number;
  }> {
    try {
      console.log('📡 API: Sending search request with params:', params);
      // Temporarily use public endpoint for development
      const response = await this.api.post('/literature/search/public', params);
      console.log('📥 API: Raw response:', response);
      console.log('📥 API: Response.data:', response.data);

      // apiClient.post returns response.data already, which contains {data: actualData}
      // Backend returns {papers, total, page} directly
      // So response = {data: {papers, total, page}}
      const actualData = response.data || response;
      console.log('📥 API: Actual data:', actualData);
      console.log('📚 API: Papers count:', actualData.papers?.length || 0);

      // Ensure we have the expected structure
      const result = {
        papers: actualData.papers || [],
        total: actualData.total || 0,
        page: actualData.page || params.page || 1,
      };

      console.log('✅ API: Returning result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ API: Literature search failed:', error);
      // Better error handling
      if (error.response?.status === 401) {
        console.log('🔐 API: Authentication required - using public endpoint');
      }
      if (error.response?.data?.message) {
        console.error('❌ API Error message:', error.response.data.message);
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
      console.error('Gap analysis failed:', error);
      // Return mock data for development if auth fails
      if (error.response?.status === 401) {
        console.log('Using mock gap data for development');
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
      // Extract only the fields allowed by SavePaperDto
      const saveData = {
        title: paper.title!,
        authors: paper.authors || [],
        year: paper.year!,
        abstract: paper.abstract,
        doi: paper.doi,
        url: paper.url,
        venue: paper.venue,
        citationCount: paper.citationCount,
        tags: paper.tags,
        collectionId: paper.collectionId,
      };

      // Try public endpoint first for development
      const response = await this.api.post('/literature/save/public', saveData);

      // Also save full paper to localStorage for persistence in development
      this.saveToLocalStorage(paper);

      return response.data;
    } catch (error: any) {
      console.error('Failed to save paper:', error);

      // Fallback to localStorage for development
      if (
        error.response?.status === 401 ||
        error.response?.status === 404 ||
        error.response?.status === 400
      ) {
        console.log('Using localStorage fallback for save');
        this.saveToLocalStorage(paper);
        return { success: true, paperId: paper.id || 'mock-id' };
      }
      throw error;
    }
  }

  // Helper: Save to localStorage
  private saveToLocalStorage(paper: Partial<Paper>): void {
    try {
      const stored = localStorage.getItem('savedPapers') || '[]';
      const papers = JSON.parse(stored);
      const exists = papers.some((p: any) => p.id === paper.id);

      if (!exists) {
        papers.push({
          ...paper,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem('savedPapers', JSON.stringify(papers));
        console.log('✅ Paper saved to localStorage:', paper.title);
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Get user's saved papers
  async getUserLibrary(
    page = 1,
    limit = 20
  ): Promise<{
    papers: Paper[];
    total: number;
  }> {
    try {
      // Try public endpoint first for development
      const response = await this.api.get('/literature/library/public', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user library:', error);

      // Fallback to localStorage for development
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('Using localStorage fallback for library');
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
      console.error('Failed to get from localStorage:', e);
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
      console.error('Failed to remove paper:', error);

      // Fallback to localStorage for development
      if (
        error.response?.status === 401 ||
        error.response?.status === 404 ||
        error.response?.status === 500
      ) {
        console.log('Using localStorage fallback for remove');
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
      console.log('✅ Paper removed from localStorage:', paperId);
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
    }
  }

  // Export citations in various formats
  async exportCitations(
    paperIds: string[],
    format: 'bibtex' | 'ris' | 'json' | 'apa' | 'mla'
  ): Promise<{
    content: string;
    filename: string;
  }> {
    try {
      const response = await this.api.post('/literature/export', {
        paperIds,
        format,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export citations:', error);
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
          console.error('Failed to extract themes with auth:', authError);
          throw authError;
        }
      }
      console.error('Failed to extract themes:', error);
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
      console.error('Failed to build knowledge graph:', error);
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
      console.error('Failed to get knowledge graph:', error);
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
      console.error('Failed to track influence flow:', error);
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
      console.error('Failed to predict missing links:', error);
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
      console.error('Failed to export knowledge graph:', error);
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
      console.error('Failed to score research opportunities:', error);
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
      console.error('Failed to predict funding probability:', error);
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
      console.error('Failed to optimize timeline:', error);
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
      console.error('Failed to predict impact:', error);
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
      console.error('Failed to forecast trends:', error);
      throw error;
    }
  }

  /**
   * Analyze research gaps from papers (Phase 9 Day 8-10 enhanced)
   */
  async analyzeGapsFromPapers(paperIds: string[]): Promise<any[]> {
    try {
      const response = await this.api.post('/literature/gaps/analyze', {
        paperIds,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to analyze gaps from papers:', error);
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
      console.error('Failed to get citation network:', error);
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
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  // Generate Q-statements from literature themes
  async generateStatementsFromThemes(
    themes: string[],
    studyContext: any
  ): Promise<string[]> {
    try {
      const response = await this.api.post('/literature/statements/generate', {
        themes,
        studyContext,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate statements:', error);
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
      console.error('Failed to analyze social opinion:', error);
      throw error;
    }
  }

  // Search alternative sources
  async searchAlternativeSources(
    query: string,
    sources: string[]
  ): Promise<any[]> {
    try {
      console.log('🔍 [Alternative Sources] Searching...', { query, sources });

      // Use public endpoint for development/testing to avoid authentication issues
      // TODO: Switch back to '/literature/alternative' when authentication is properly implemented
      const response = await this.api.get('/literature/alternative/public', {
        params: { query, sources },
      });

      console.log('✅ [Alternative Sources] Results received:', response.data);
      console.log(
        '📊 [Alternative Sources] Result count:',
        response.data?.length || 0
      );

      // Ensure we always return an array
      const results = Array.isArray(response.data) ? response.data : [];
      console.log(
        '📦 [Alternative Sources] Returning:',
        results.length,
        'results'
      );

      return results;
    } catch (error: any) {
      console.error('❌ [Alternative Sources] Search failed:', error);
      console.error(
        '❌ [Alternative Sources] Error details:',
        error.response?.data
      );
      console.error(
        '❌ [Alternative Sources] Error status:',
        error.response?.status
      );

      // Provide helpful error message about authentication
      if (error.response?.status === 401) {
        console.error(
          '🔐 Authentication required. Using public endpoint as fallback.'
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
      console.error('Failed to search social media:', error);
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
      console.error('Failed to get social media insights:', error);
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
      console.error('Failed to search YouTube with transcription:', error);
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
      console.error('Failed to transcribe media:', error);
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
      console.error('Failed to extract themes:', error);
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
      console.error('Failed to extract citations:', error);
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
      console.error('Failed to estimate cost:', error);
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
      console.error('Failed to add multimedia to graph:', error);
      throw error;
    }
  }

  /**
   * Get YouTube channel information
   * Supports: channel ID, @handle, or full URL
   */
  async getYouTubeChannel(channelIdentifier: string): Promise<any> {
    try {
      const response = await this.api.post(
        '/literature/youtube/channel/info',
        {
          channelIdentifier,
        }
      );
      return response.data.channel;
    } catch (error) {
      console.error('Failed to fetch YouTube channel:', error);
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
      console.error('Failed to fetch channel videos:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const literatureAPI = new LiteratureAPIService();
export default literatureAPI;
