import { apiClient, ApiResponse } from '../client';
export interface StatementGenerationRequest {
  topic: string;
  domain?: string;
  description?: string; // Added for compatibility
  numStatements?: number;
  count?: number; // Alternative to numStatements
  perspectives?: string[];
  keywords?: string[]; // Added for compatibility
  language?: string;
  avoidBias?: boolean;
}

export interface StatementGenerationResponse {
  statements: Array<{
    id: string;
    text: string;
    perspective?: string;
    category?: string;
  }>;
  metadata: {
    tokensUsed: number;
    processingTime: number;
  }
}

export interface GridDesignRequest {
  numStatements?: number; // Made optional for compatibility
  studyTitle?: string; // Added for compatibility
  statementCount?: number; // Added for compatibility
  distribution?: any; // Added for compatibility
  studyType?: 'exploratory' | 'confirmatory' | 'mixed';
  participantCount?: number;
}

export interface GridDesignResponse {
  gridStructure: number[];
  gridConfig?: any; // Added for compatibility
  reasoning: string;
  recommendations: string[];
}

export interface BiasDetectionRequest {
  statements: string[];
  title?: string; // Added for compatibility
  description?: string; // Added for compatibility
  welcomeMessage?: string; // Added for compatibility
  checkTypes?: Array<'political' | 'cultural' | 'demographic' | 'linguistic'>;
}

export interface BiasDetectionResponse {
  overallScore: number;
  issues: Array<{
    statementIndex: number;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
  }>;
}

export interface FactorInterpretationRequest {
  factorLoadings: number[][];
  statements: string[];
  factorNumber: number;
}

export interface FactorInterpretationResponse {
  interpretation: string;
  theme: string;
  keyStatements: number[];
  narrative: string;
}

export interface LiteratureSearchRequest {
  query?: string; // Made optional for compatibility
  topic?: string; // Added for compatibility
  keywords?: string[]; // Added for compatibility
  yearRange?: { start: number; end: number; }
  sources?: Array<'semantic_scholar' | 'crossref' | 'pubmed'>;
  limit?: number;
}

export interface LiteratureSearchResponse {
  papers: Array<{
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    doi?: string;
    url?: string;
    relevanceScore: number;
  }>;
  references?: string[]; // Added for compatibility
  totalFound: number;
}

export interface ReportGenerationRequest {
  studyId: string;
  sections: Array<
    'executive_summary' | 'methodology' | 'findings' | 'interpretations' | 'conclusions'
  >;
  format: 'pdf' | 'docx' | 'latex';
  includeVisualizations?: boolean;
}

export interface ReportGenerationResponse {
  reportUrl: string;
  format: string;
  generatedAt: string;
}

export interface AIUsageResponse {
  totalTokens: number;
  totalCost: number;
  byFeature: Record<string, { tokens: number; cost: number }>;
  dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
}

class AIService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTimeout
    });
  }

  async generateStatements(
    request: StatementGenerationRequest
  ): Promise<StatementGenerationResponse> {
    const cacheKey = this.getCacheKey('generateStatements', request);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post<ApiResponse<StatementGenerationResponse>>('/ai/generate-statements', request);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error generating statements:', error);
      throw error;
    }
  }

  async optimizeGrid(request: GridDesignRequest): Promise<GridDesignResponse> {
    const cacheKey = this.getCacheKey('optimizeGrid', request);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post<ApiResponse<GridDesignResponse>>('/ai/optimize-grid', request);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error optimizing grid:', error);
      throw error;
    }
  }

  async detectBias(request: BiasDetectionRequest): Promise<BiasDetectionResponse> {
    const cacheKey = this.getCacheKey('detectBias', request);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post<ApiResponse<BiasDetectionResponse>>('/ai/detect-bias', request);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error detecting bias:', error);
      throw error;
    }
  }

  async interpretFactor(
    request: FactorInterpretationRequest
  ): Promise<FactorInterpretationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<FactorInterpretationResponse>>('/ai/interpret-factor', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error interpreting factor:', error);
      throw error;
    }
  }

  async searchLiterature(request: LiteratureSearchRequest): Promise<LiteratureSearchResponse> {
    const cacheKey = this.getCacheKey('searchLiterature', request);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post<ApiResponse<LiteratureSearchResponse>>('/ai/search-literature', request);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching literature:', error);
      throw error;
    }
  }

  // Alias for backward compatibility
  async reviewLiterature(request: LiteratureSearchRequest): Promise<LiteratureSearchResponse> {
    return this.searchLiterature(request);
  }

  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ReportGenerationResponse>>('/ai/generate-report', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async getUsage(): Promise<AIUsageResponse> {
    try {
      const response = await apiClient.get<ApiResponse<AIUsageResponse>>('/ai/usage');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching AI usage:', error);
      throw error;
    }
  }

  async validateGrid(gridStructure: number[]): Promise<{ valid: boolean; issues?: string[] }> {
    try {
      const response = await apiClient.post<ApiResponse<{ valid: boolean; issues?: string[] }>>('/ai/validate-grid', { gridStructure });
      return response.data.data;
    } catch (error: any) {
      console.error('Error validating grid:', error);
      throw error;
    }
  }

  async checkCulturalSensitivity(statements: string[]): Promise<{
    score: number;
    issues: Array<{ statement: string; concern: string; severity: string }>;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        score: number;
        issues: Array<{ statement: string; concern: string; severity: string }>;
      }>>('/ai/check-cultural-sensitivity', { statements });
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking cultural sensitivity:', error);
      throw error;
    }
  }

  async analyzePerspectiveBalance(statements: string[]): Promise<{
    balanced: boolean;
    distribution: Record<string, number>;
    recommendations?: string[];
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        balanced: boolean;
        distribution: Record<string, number>;
        recommendations?: string[];
      }>>('/ai/analyze-perspective-balance', { statements });
      return response.data.data;
    } catch (error: any) {
      console.error('Error analyzing perspective balance:', error);
      throw error;
    }
  }

  async detectLoadedLanguage(statements: string[]): Promise<{
    issues: Array<{
      statementIndex: number;
      phrase: string;
      suggestion: string;
    }>;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        issues: Array<{
          statementIndex: number;
          phrase: string;
          suggestion: string;
        }>;
      }>>('/ai/detect-loaded-language', { statements });
      return response.data;
    } catch (error: any) {
      console.error('Error detecting loaded language:', error);
      throw error;
    }
  }

  async generateDiversityReport(studyId: string): Promise<{
    reportUrl: string;
    metrics: {
      perspectiveDiversity: number;
      demographicReach: number;
      inclusionScore: number;
    }
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        reportUrl: string;
        metrics: {
          perspectiveDiversity: number;
          demographicReach: number;
          inclusionScore: number;
        }
      }>>('/ai/generate-diversity-report', { studyId });
      return response.data;
    } catch (error: any) {
      console.error('Error generating diversity report:', error);
      throw error;
    }
  }

  async regenerateStatement(statement: string, issue: string): Promise<{ improved: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ improved: string }>>('/ai/regenerate-statement', { statement, issue });
      return response.data;
    } catch (error: any) {
      console.error('Error regenerating statement:', error);
      throw error;
    }
  }

  async suggestNeutralAlternative(
    text: string,
  ): Promise<{ suggestion: string; explanation: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ suggestion: string; explanation: string }>>('/ai/suggest-neutral', { text });
      return response.data;
    } catch (error: any) {
      console.error('Error suggesting neutral alternative:', error);
      throw error;
    }
  }

  async analyzeAllBias(statements: string[]): Promise<BiasDetectionResponse> {
    try {
      const response = await apiClient.post<ApiResponse<BiasDetectionResponse>>('/ai/analyze-bias', { statements });
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing bias:', error);
      throw error;
    }
  }

  async suggestGridConfiguration(params: GridDesignRequest): Promise<GridDesignResponse> {
    try {
      const response = await apiClient.post<ApiResponse<GridDesignResponse>>('/ai/grid-suggestion', params);
      return response.data;
    } catch (error: any) {
      console.error('Error suggesting grid configuration:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const aiService = new AIService();
