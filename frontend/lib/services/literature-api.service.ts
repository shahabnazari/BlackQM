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
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use(config => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
      console.log('📥 API: Response received:', response.data);
      console.log('📚 API: Papers count:', response.data.papers?.length || 0);
      
      // Ensure we have the expected structure
      const result = {
        papers: response.data.papers || [],
        total: response.data.total || 0,
        page: response.data.page || params.page || 1
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
        collectionId: paper.collectionId
      };
      
      // Try public endpoint first for development
      const response = await this.api.post('/literature/save/public', saveData);
      
      // Also save full paper to localStorage for persistence in development
      this.saveToLocalStorage(paper);
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to save paper:', error);
      
      // Fallback to localStorage for development
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 400) {
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
  private getFromLocalStorage(page = 1, limit = 20): { papers: Paper[]; total: number } {
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
      if (error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
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

  // Build knowledge graph from papers
  async buildKnowledgeGraph(paperIds: string[]): Promise<KnowledgeGraphData> {
    try {
      const response = await this.api.post(
        '/literature/knowledge-graph',
        paperIds
      );
      return response.data;
    } catch (error) {
      console.error('Failed to build knowledge graph:', error);
      throw error;
    }
  }

  // Get citation network for a paper
  async getCitationNetwork(
    paperId: string,
    depth = 2
  ): Promise<KnowledgeGraphData> {
    try {
      const response = await this.api.get(
        `/literature/citations/${paperId}`,
        {
          params: { depth },
        }
      );
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
      const response = await this.api.post(
        '/literature/statements/generate',
        {
          themes,
          studyContext,
        }
      );
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
      const response = await this.api.get('/literature/alternative', {
        params: { query, sources },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search alternative sources:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const literatureAPI = new LiteratureAPIService();
export default literatureAPI;
