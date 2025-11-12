/**
 * Theme Extraction API Service
 * Enterprise-grade service for theme extraction and research design
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * Features:
 * - AI-powered theme extraction from literature
 * - Research question generation
 * - Hypothesis formulation
 * - Survey construction from themes
 * - Request cancellation and retry logic
 *
 * @module theme-extraction-api.service
 */

import {
  BaseApiService,
  CancellableRequest,
  RequestOptions,
} from './base-api.service';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedTheme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  relatedPapers: string[];
  frequency: number;
  confidence: number;
  category?: string;
  subThemes?: UnifiedTheme[];
}

export interface ResearchPurpose {
  type:
    | 'exploration'
    | 'hypothesis_testing'
    | 'theory_building'
    | 'literature_review';
  description: string;
  researchQuestions?: string[];
  targetAudience?: string;
}

export interface ExtractionParams {
  paperIds: string[];
  purpose: ResearchPurpose;
  userExpertiseLevel: 'novice' | 'researcher' | 'expert';
  maxThemes?: number;
  minFrequency?: number;
  includeSubThemes?: boolean;
}

export interface ExtractionProgress {
  stage: number;
  totalStages: number;
  currentStage: string;
  message: string;
  progress: number;
}

export interface ThemeExtractionResponse {
  requestId: string;
  themes: UnifiedTheme[];
  saturationData: {
    achieved: boolean;
    threshold: number;
    current: number;
    recommendation: string;
  };
  metadata: {
    totalPapers: number;
    processedPapers: number;
    averageConfidence: number;
    extractionTime: number;
  };
}

export interface ResearchQuestion {
  id: string;
  question: string;
  subQuestions?: string[];
  derivedFromThemes: string[];
  confidence: number;
  researchType: 'exploratory' | 'descriptive' | 'explanatory' | 'evaluative';
}

export interface Hypothesis {
  id: string;
  hypothesis: string;
  type: 'directional' | 'non-directional' | 'null';
  derivedFromThemes: string[];
  variables: string[];
  confidence: number;
  testability: number;
}

export interface ConstructMapping {
  themeId: string;
  themeName: string;
  construct: string;
  items: string[];
  reliability: number;
  validity: number;
}

export interface SurveyItem {
  id: string;
  question: string;
  type: 'likert' | 'multiple-choice' | 'text' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
  constructId?: string;
}

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  items: SurveyItem[];
}

export interface GeneratedSurvey {
  id: string;
  title: string;
  description: string;
  sections: SurveySection[];
  generatedAt: string;
  basedOnThemes: string[];
  metadata: {
    totalItems: number;
    estimatedCompletionTime: number;
    reliabilityScore: number;
  };
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
}

// ============================================================================
// Theme Extraction API Service Class
// ============================================================================

class ThemeExtractionApiService extends BaseApiService {
  private static instance: ThemeExtractionApiService;

  private constructor() {
    super('/themes');
  }

  /**
   * Singleton instance
   */
  static getInstance(): ThemeExtractionApiService {
    if (!ThemeExtractionApiService.instance) {
      ThemeExtractionApiService.instance = new ThemeExtractionApiService();
    }
    return ThemeExtractionApiService.instance;
  }

  // ============================================================================
  // Theme Extraction Operations
  // ============================================================================

  /**
   * Extract themes from papers
   * Returns cancellable request for long-running AI operations
   */
  extractThemes(
    params: ExtractionParams,
    options?: RequestOptions
  ): CancellableRequest<ThemeExtractionResponse> {
    const requestId = `extraction-${Date.now()}`;

    return this.createCancellableRequest(requestId, async signal => {
      const response = await this.post<ThemeExtractionResponse>(
        '/extract',
        params,
        { ...options, signal, timeout: 300000 } // 5 minute timeout for AI processing
      );
      return response.data;
    });
  }

  /**
   * Get extraction progress
   */
  async getExtractionProgress(
    requestId: string,
    options?: RequestOptions
  ): Promise<ExtractionProgress> {
    const response = await this.get<ExtractionProgress>(
      `/extract/${requestId}/progress`,
      options
    );
    return response.data;
  }

  /**
   * Poll extraction status until complete
   */
  pollExtractionStatus(
    requestId: string,
    onProgress?: (progress: ExtractionProgress) => void,
    options?: RequestOptions
  ): CancellableRequest<ThemeExtractionResponse> {
    const pollingRequestId = `poll-${requestId}`;

    return this.createCancellableRequest(pollingRequestId, async signal => {
      const pollInterval = 2000; // 2 seconds
      const maxAttempts = 150; // 5 minutes total (150 * 2s)

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (signal.aborted) {
          throw new Error('Polling cancelled');
        }

        try {
          // Check status
          const progress = await this.getExtractionProgress(requestId, options);

          // Call progress callback
          if (onProgress) {
            onProgress(progress);
          }

          // Check if complete
          if (progress.progress >= 100) {
            // Get final results
            const response = await this.get<ThemeExtractionResponse>(
              `/extract/${requestId}`,
              options
            );
            return response.data;
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error: any) {
          if (attempt === maxAttempts - 1) {
            throw error;
          }
        }
      }

      throw new Error('Extraction timeout - maximum polling attempts reached');
    });
  }

  // ============================================================================
  // Research Question Generation
  // ============================================================================

  /**
   * Generate research questions from themes
   */
  async generateResearchQuestions(
    themeIds: string[],
    params?: {
      researchType?:
        | 'exploratory'
        | 'descriptive'
        | 'explanatory'
        | 'evaluative';
      maxQuestions?: number;
      includeSubQuestions?: boolean;
    },
    options?: RequestOptions
  ): Promise<ResearchQuestion[]> {
    const response = await this.post<ResearchQuestion[]>(
      '/research-questions/generate',
      { themeIds, ...params },
      { ...options, timeout: 60000 }
    );
    return response.data;
  }

  /**
   * Refine research questions
   */
  async refineResearchQuestions(
    questions: ResearchQuestion[],
    feedback: string,
    options?: RequestOptions
  ): Promise<ResearchQuestion[]> {
    const response = await this.post<ResearchQuestion[]>(
      '/research-questions/refine',
      { questions, feedback },
      options
    );
    return response.data;
  }

  // ============================================================================
  // Hypothesis Generation
  // ============================================================================

  /**
   * Generate hypotheses from themes
   */
  async generateHypotheses(
    themeIds: string[],
    params?: {
      hypothesisType?: 'directional' | 'non-directional' | 'null' | 'all';
      maxHypotheses?: number;
      includeVariables?: boolean;
    },
    options?: RequestOptions
  ): Promise<Hypothesis[]> {
    const response = await this.post<Hypothesis[]>(
      '/hypotheses/generate',
      { themeIds, ...params },
      { ...options, timeout: 60000 }
    );
    return response.data;
  }

  /**
   * Test hypothesis feasibility
   */
  async testHypothesisFeasibility(
    hypothesis: Hypothesis,
    options?: RequestOptions
  ): Promise<{
    feasible: boolean;
    testability: number;
    suggestedMethods: string[];
    requiredSampleSize: number;
    estimatedCost: number;
  }> {
    const response = await this.post(
      '/hypotheses/feasibility',
      { hypothesis },
      options
    );
    return response.data as {
      feasible: boolean;
      testability: number;
      suggestedMethods: string[];
      requiredSampleSize: number;
      estimatedCost: number;
    };
  }

  // ============================================================================
  // Survey Construction
  // ============================================================================

  /**
   * Map themes to survey constructs
   */
  async mapThemesToConstructs(
    themeIds: string[],
    options?: RequestOptions
  ): Promise<ConstructMapping[]> {
    const response = await this.post<ConstructMapping[]>(
      '/survey/map-constructs',
      { themeIds },
      { ...options, timeout: 60000 }
    );
    return response.data;
  }

  /**
   * Generate survey from themes
   */
  async generateSurvey(
    themeIds: string[],
    params?: {
      surveyTitle?: string;
      surveyDescription?: string;
      targetLength?: 'short' | 'medium' | 'long';
      includeValidation?: boolean;
    },
    options?: RequestOptions
  ): Promise<GeneratedSurvey> {
    const response = await this.post<GeneratedSurvey>(
      '/survey/generate',
      { themeIds, ...params },
      { ...options, timeout: 90000 }
    );
    return response.data;
  }

  /**
   * Validate survey items
   */
  async validateSurveyItems(
    items: SurveyItem[],
    options?: RequestOptions
  ): Promise<{
    items: SurveyItem[];
    issues: {
      itemId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }[];
    reliabilityEstimate: number;
  }> {
    const response = await this.post('/survey/validate', { items }, options);
    return response.data as {
      items: SurveyItem[];
      issues: {
        itemId: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        suggestion: string;
      }[];
      reliabilityEstimate: number;
    };
  }

  // ============================================================================
  // Research Gap Analysis
  // ============================================================================

  /**
   * Identify research gaps from themes
   */
  async identifyResearchGaps(
    themeIds: string[],
    params?: {
      minOpportunityScore?: number;
      includeFunding?: boolean;
    },
    options?: RequestOptions
  ): Promise<ResearchGap[]> {
    const response = await this.post<ResearchGap[]>(
      '/gaps/identify',
      { themeIds, ...params },
      { ...options, timeout: 60000 }
    );
    return response.data;
  }

  /**
   * Get gap recommendations
   */
  async getGapRecommendations(
    gapId: string,
    options?: RequestOptions
  ): Promise<{
    gap: ResearchGap;
    recommendations: {
      methodology: string[];
      collaborators: string[];
      funding: string[];
      timeline: string;
    };
  }> {
    const response = await this.get(`/gaps/${gapId}/recommendations`, options);
    return response.data as {
      gap: ResearchGap;
      recommendations: {
        methodology: string[];
        collaborators: string[];
        funding: string[];
        timeline: string;
      };
    };
  }

  // ============================================================================
  // Theme Management
  // ============================================================================

  /**
   * Get theme details
   */
  async getThemeDetails(
    themeId: string,
    options?: RequestOptions
  ): Promise<UnifiedTheme> {
    const response = await this.get<UnifiedTheme>(`/${themeId}`, options);
    return response.data;
  }

  /**
   * Merge themes
   */
  async mergeThemes(
    themeIds: string[],
    mergedName: string,
    options?: RequestOptions
  ): Promise<UnifiedTheme> {
    const response = await this.post<UnifiedTheme>(
      '/merge',
      { themeIds, mergedName },
      options
    );
    return response.data;
  }

  /**
   * Split theme
   */
  async splitTheme(
    themeId: string,
    splitCriteria: string,
    options?: RequestOptions
  ): Promise<UnifiedTheme[]> {
    const response = await this.post<UnifiedTheme[]>(
      `/${themeId}/split`,
      { splitCriteria },
      options
    );
    return response.data;
  }

  // ============================================================================
  // Request Cancellation Utilities
  // ============================================================================

  /**
   * Cancel theme extraction
   */
  cancelExtraction(requestId: string): void {
    this.cancel(`extraction-${requestId}`);
    this.cancel(`poll-${requestId}`);
  }

  /**
   * Cancel all theme operations
   */
  cancelAllOperations(): void {
    this.cancelAll();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const themeExtractionApiService =
  ThemeExtractionApiService.getInstance();

// Export class for testing
export { ThemeExtractionApiService };
