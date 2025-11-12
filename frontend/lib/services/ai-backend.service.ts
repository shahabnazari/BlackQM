/**
 * AI Backend Service
 *
 * This service acts as a proxy to the backend AI endpoints.
 * All AI operations go through the secure backend API.
 *
 * Security:
 * - No API keys stored in frontend
 * - All requests authenticated via JWT
 * - Rate limiting handled by backend
 * - Cost tracking managed server-side
 */

import { getAuthToken } from '../auth/auth-utils';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

export interface GridRecommendation {
  columns: number;
  distribution: number[];
  labels: string[];
  reasoning: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: 'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic';
  options?: string[];
  required: boolean;
  skipLogic?: {
    condition: string;
    targetQuestionId: string;
  };
  aiGenerated: true;
  confidence: number;
  reasoning: string;
}

export interface BiasAnalysis {
  overallBiasScore: number;
  biasedStatements: string[];
  biasTypes: Record<string, number>;
  recommendations: string[];
  alternatives?: Record<string, string>;
}

export interface ParticipantAssistance {
  message: string;
  stage: string;
  participantId: string;
}

class AIBackendService {
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}/api/ai${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  }

  // Fetch with retry logic and exponential backoff
  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.fetchWithAuth(endpoint, options);
        return response; // Success - return immediately
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const errorMessage = lastError.message || '';
        const isRateLimitError =
          errorMessage.includes('429') || errorMessage.includes('rate limit');
        const isServerError =
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504');
        const isTimeoutError =
          errorMessage.includes('timeout') ||
          errorMessage.includes('ETIMEDOUT');

        // Only retry for specific errors
        if (!isRateLimitError && !isServerError && !isTimeoutError) {
          throw error; // Not retryable - throw immediately
        }

        // Don't wait after the last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt) * 1000;
          // Add some jitter to prevent thundering herd
          const jitterMs = Math.random() * 500;
          const waitMs = backoffMs + jitterMs;

          console.log(
            `Retry attempt ${attempt + 1}/${maxRetries} after ${waitMs}ms for ${endpoint}`
          );
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error('Request failed after retries');
  }

  // Statement Generation - Uses retry for reliability
  async generateStatements(params: {
    topic: string;
    count?: number;
    perspectives?: string[];
    avoidBias?: boolean;
    academicLevel?: 'basic' | 'intermediate' | 'advanced';
    maxLength?: number;
  }) {
    const response = await this.fetchWithRetry('/generate-statements', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Grid Recommendations - Uses retry for reliability
  async getGridRecommendations(params: {
    studyTopic: string;
    expectedStatements: number;
    participantExperience?: 'novice' | 'intermediate' | 'expert';
    researchType?: 'exploratory' | 'confirmatory' | 'comparative';
  }): Promise<{ success: boolean; recommendations: GridRecommendation[] }> {
    const response = await this.fetchWithRetry('/grid/recommend', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Questionnaire Generation - Uses retry for reliability
  async generateQuestionnaire(params: {
    studyTopic: string;
    questionCount: number;
    questionTypes: Array<
      'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic'
    >;
    targetAudience?: string;
    includeSkipLogic?: boolean;
  }): Promise<{ success: boolean; questions: GeneratedQuestion[] }> {
    const response = await this.fetchWithRetry('/questionnaire/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Participant Assistance - Uses retry for reliability
  async getParticipantAssistance(params: {
    participantId: string;
    stage: 'consent' | 'prescreening' | 'presorting' | 'qsort' | 'postsurvey';
    context?: Record<string, any>;
    question?: string;
  }): Promise<{ success: boolean; assistance: ParticipantAssistance }> {
    const response = await this.fetchWithRetry('/participant-assistance', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Response Analysis - Uses retry for reliability
  async analyzeResponses(params: {
    responses: Array<{
      participantId: string;
      qsort: number[];
      surveyAnswers?: Record<string, any>;
      completionTime?: number;
    }>;
    analysisTypes?: Array<'patterns' | 'quality' | 'anomalies' | 'insights'>;
  }) {
    const response = await this.fetchWithRetry('/analyze-responses', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Bias Detection - Uses retry for reliability
  async detectBias(params: {
    statements: string[];
    analysisDepth?: 'quick' | 'comprehensive';
    suggestAlternatives?: boolean;
  }): Promise<{ success: boolean; analysis: BiasAnalysis; depth: string }> {
    const response = await this.fetchWithRetry('/detect-bias', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Statement Validation
  async validateStatements(params: {
    statements: Array<{
      id: string;
      text: string;
      perspective?: string;
      polarity?: 'positive' | 'negative' | 'neutral';
    }>;
    topic: string;
  }) {
    const response = await this.fetchWithAuth('/validate-statements', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Text Analysis
  async analyzeText(params: {
    text: string;
    analysisType: 'sentiment' | 'themes' | 'bias';
  }) {
    const response = await this.fetchWithAuth('/analyze-text', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Neutralize Statement
  async neutralizeStatement(statement: string) {
    const response = await this.fetchWithAuth('/neutralize-statement', {
      method: 'POST',
      body: JSON.stringify({ statement }),
    });
    return response.json();
  }

  // Cultural Sensitivity Check
  async checkCulturalSensitivity(params: {
    statements: string[];
    targetRegions?: string[];
  }) {
    const response = await this.fetchWithAuth('/cultural-sensitivity', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Usage Summary
  async getUsageSummary() {
    const response = await this.fetchWithAuth('/usage/summary', {
      method: 'GET',
    });
    return response.json();
  }

  // Usage Report
  async getUsageReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.fetchWithAuth(`/usage/report?${params}`, {
      method: 'GET',
    });
    return response.json();
  }

  // Update Budget
  async updateBudget(params: { dailyLimit: number; monthlyLimit: number }) {
    const response = await this.fetchWithAuth('/budget/update', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // Perspective Guidelines
  async generatePerspectiveGuidelines(topic: string) {
    const response = await this.fetchWithAuth('/perspective-guidelines', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
    return response.json();
  }

  // Statement Variations
  async generateStatementVariations(statement: string, count: number = 3) {
    const response = await this.fetchWithAuth('/statement-variations', {
      method: 'POST',
      body: JSON.stringify({ statement, count }),
    });
    return response.json();
  }

  // Smart Validation - Adaptive form validation with AI
  async validateSmartly(params: {
    formData: Record<string, any>;
    validationRules?: Array<{
      field: string;
      rule:
        | 'required'
        | 'email'
        | 'minLength'
        | 'maxLength'
        | 'pattern'
        | 'custom';
      value?: any;
      message?: string;
    }>;
    context?: string;
    adaptiveMode?: boolean;
  }): Promise<{
    success: boolean;
    valid: boolean;
    errors: Record<string, string>;
    suggestions?: Record<string, string>;
    nextQuestions?: Array<{ field: string; question: string; type: string }>;
  }> {
    const response = await this.fetchWithRetry('/smart-validation', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }
}

// Export singleton instance
export const aiBackendService = new AIBackendService();
