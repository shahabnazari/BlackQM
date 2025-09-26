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
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login';
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
      const response = await this.api.post('/api/literature/search', params);
      return response.data;
    } catch (error) {
      console.error('Literature search failed:', error);
      throw error;
    }
  }

  // Analyze research gaps
  async analyzeGaps(field: string, options?: {
    subtopics?: string[];
    timeRange?: number;
    includeFunding?: boolean;
    includeCollaborations?: boolean;
  }): Promise<ResearchGap[]> {
    try {
      const response = await this.api.get('/api/literature/gaps', {
        params: { field, ...options },
      });
      return response.data;
    } catch (error) {
      console.error('Gap analysis failed:', error);
      throw error;
    }
  }

  // Save paper to user library
  async savePaper(paper: Partial<Paper> & {
    tags?: string[];
    collectionId?: string;
  }): Promise<{ success: boolean; paperId: string }> {
    try {
      const response = await this.api.post('/api/literature/save', paper);
      return response.data;
    } catch (error) {
      console.error('Failed to save paper:', error);
      throw error;
    }
  }

  // Get user's saved papers
  async getUserLibrary(page = 1, limit = 20): Promise<{
    papers: Paper[];
    total: number;
  }> {
    try {
      const response = await this.api.get('/api/literature/library', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user library:', error);
      throw error;
    }
  }

  // Remove paper from library
  async removePaper(paperId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.delete(`/api/literature/library/${paperId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove paper:', error);
      throw error;
    }
  }

  // Export citations in various formats
  async exportCitations(paperIds: string[], format: 'bibtex' | 'ris' | 'json' | 'apa' | 'mla'): Promise<{
    content: string;
    filename: string;
  }> {
    try {
      const response = await this.api.post('/api/literature/export', {
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
      const response = await this.api.post('/api/literature/themes', {
        paperIds,
        numThemes,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to extract themes:', error);
      throw error;
    }
  }

  // Build knowledge graph from papers
  async buildKnowledgeGraph(paperIds: string[]): Promise<KnowledgeGraphData> {
    try {
      const response = await this.api.post('/api/literature/knowledge-graph', paperIds);
      return response.data;
    } catch (error) {
      console.error('Failed to build knowledge graph:', error);
      throw error;
    }
  }

  // Get citation network for a paper
  async getCitationNetwork(paperId: string, depth = 2): Promise<KnowledgeGraphData> {
    try {
      const response = await this.api.get(`/api/literature/citations/${paperId}`, {
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
      const response = await this.api.get(`/api/literature/recommendations/${studyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  // Generate Q-statements from literature themes
  async generateStatementsFromThemes(themes: string[], studyContext: any): Promise<string[]> {
    try {
      const response = await this.api.post('/api/literature/statements/generate', {
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
      const response = await this.api.get('/api/literature/social', {
        params: { topic, platforms },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to analyze social opinion:', error);
      throw error;
    }
  }

  // Search alternative sources
  async searchAlternativeSources(query: string, sources: string[]): Promise<any[]> {
    try {
      const response = await this.api.get('/api/literature/alternative', {
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