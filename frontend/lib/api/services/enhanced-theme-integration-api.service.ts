import { apiClient } from '../client';

/**
 * Enhanced Theme Integration API Service
 * Phase 10 Day 5.12
 *
 * Purpose: Frontend API client for Enhanced Theme Integration Service
 * Endpoints:
 * - POST /literature/themes/suggest-questions
 * - POST /literature/themes/suggest-hypotheses
 * - POST /literature/themes/map-constructs
 * - POST /literature/themes/generate-complete-survey
 */

// Debug logging helpers
const isDev = process.env.NODE_ENV === 'development';

function log(...args: any[]) {
  if (isDev) {
    console.log('[EnhancedThemeAPI]', ...args);
  }
}

function error(...args: any[]) {
  console.error('[EnhancedThemeAPI Error]', ...args);
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  keyPhrases?: string[];
  subthemes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface ResearchQuestionSuggestion {
  id: string;
  question: string;
  type: 'exploratory' | 'explanatory' | 'evaluative' | 'descriptive';
  relevanceScore: number;
  rationale: string;
  relatedThemes: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  squareItScore?: {
    specific: number;
    quantifiable: number;
    usable: number;
    accurate: number;
    restricted: number;
    eligible: number;
    investigable: number;
    timely: number;
    overallScore: number;
  };
  suggestedMethodology: 'qualitative' | 'quantitative' | 'mixed_methods' | 'q_methodology';
}

export interface HypothesisSuggestion {
  id: string;
  hypothesis: string;
  type: 'correlational' | 'causal' | 'mediation' | 'moderation' | 'interaction';
  independentVariable: string;
  dependentVariable: string;
  moderator?: string;
  mediator?: string;
  confidenceScore: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  relatedThemes: string[];
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest: string;
  researchBacking: string;
}

export interface ConstructMapping {
  construct: {
    id: string;
    name: string;
    definition: string;
    themes: string[];
  };
  relatedConstructs: Array<{
    constructId: string;
    constructName: string;
    relationshipType: 'causes' | 'influences' | 'correlates' | 'moderates' | 'mediates';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
  }>;
}

export interface CompleteSurvey {
  sections: Array<{
    id: string;
    title: string;
    description: string;
    items: Array<{
      id: string;
      type: 'likert' | 'multiple_choice' | 'semantic_differential' | 'open_ended';
      text: string;
      scaleType?: string;
      options?: string[];
      themeProvenance: string[];
      construct?: string;
    }>;
  }>;
  metadata: {
    totalItems: number;
    estimatedCompletionTime: number;
    themeCoverage: number;
    reliabilityEstimate?: number;
  };
  methodology: {
    approach: string;
    researchBacking: string;
    validation: string;
  };
}

export interface SuggestQuestionsRequest {
  themes: Theme[];
  questionTypes?: ('exploratory' | 'explanatory' | 'evaluative' | 'descriptive')[];
  maxQuestions?: number;
  researchDomain?: string;
  researchGoal?: string;
}

export interface SuggestHypothesesRequest {
  themes: Theme[];
  hypothesisTypes?: ('correlational' | 'causal' | 'mediation' | 'moderation' | 'interaction')[];
  maxHypotheses?: number;
  researchDomain?: string;
  researchContext?: string;
}

export interface MapConstructsRequest {
  themes: Theme[];
  includeRelationships?: boolean;
  clusteringAlgorithm?: 'semantic' | 'statistical' | 'hybrid';
}

export interface GenerateCompleteSurveyRequest {
  themes: Theme[];
  surveyPurpose: 'exploratory' | 'confirmatory' | 'mixed';
  targetRespondentCount?: number;
  complexityLevel?: 'basic' | 'intermediate' | 'advanced';
  includeDemographics?: boolean;
  includeValidityChecks?: boolean;
  researchContext?: string;
}

/**
 * Suggest research questions from themes
 */
export async function suggestResearchQuestions(
  request: SuggestQuestionsRequest,
): Promise<ResearchQuestionSuggestion[]> {
  try {
    log('Calling suggest-questions API with', request);

    const response = await apiClient.post<{
      success: boolean;
      questions: ResearchQuestionSuggestion[];
      totalGenerated: number;
    }>('/literature/themes/suggest-questions', request);

    log('API response received:', response);

    // Validate response structure
    // Note: apiClient.post() returns the backend response directly (not wrapped in .data)
    if (!response) {
      error('Invalid response structure:', response);
      throw new Error('Invalid API response structure');
    }

    // Backend returns { success, questions, totalGenerated } directly
    const responseData = response as any;
    if (!responseData.questions) {
      error('Missing questions in response:', responseData);
      throw new Error('API returned no questions');
    }

    log(`Successfully received ${responseData.questions.length} questions`);
    return responseData.questions;
  } catch (err: any) {
    error('Failed to generate research questions:', err);
    error('Error response:', err.response?.data);
    error('Request was:', request);
    throw new Error(
      err.response?.data?.message || err.message || 'Failed to generate research questions',
    );
  }
}

/**
 * Suggest hypotheses from themes
 */
export async function suggestHypotheses(
  request: SuggestHypothesesRequest,
): Promise<HypothesisSuggestion[]> {
  try {
    log('Calling suggest-hypotheses API with', request);

    const response = await apiClient.post<{
      success: boolean;
      hypotheses: HypothesisSuggestion[];
      totalGenerated: number;
    }>('/literature/themes/suggest-hypotheses', request);

    log('API response received:', response);

    // Validate response structure
    if (!response) {
      error('Invalid response structure:', response);
      throw new Error('Invalid API response structure');
    }

    const responseData = response as any;
    if (!responseData.hypotheses) {
      error('Missing hypotheses in response:', responseData);
      throw new Error('API returned no hypotheses');
    }

    log(`Successfully received ${responseData.hypotheses.length} hypotheses`);
    return responseData.hypotheses;
  } catch (err: any) {
    error('Failed to generate hypotheses:', err);
    error('Error response:', err.response?.data);
    error('Request was:', request);
    throw new Error(
      err.response?.data?.message || err.message || 'Failed to generate hypotheses',
    );
  }
}

/**
 * Map themes to psychological constructs
 */
export async function mapThemesToConstructs(
  request: MapConstructsRequest,
): Promise<ConstructMapping[]> {
  try {
    log('Calling map-constructs API with', request);

    const response = await apiClient.post<{
      success: boolean;
      constructs: ConstructMapping[];
      totalConstructs: number;
    }>('/literature/themes/map-constructs', request);

    log('API response received:', response);

    // Validate response structure
    if (!response) {
      error('Invalid response structure:', response);
      throw new Error('Invalid API response structure');
    }

    const responseData = response as any;
    if (!responseData.constructs) {
      error('Missing constructs in response:', responseData);
      throw new Error('API returned no constructs');
    }

    log(`Successfully received ${responseData.constructs.length} constructs`);
    return responseData.constructs;
  } catch (err: any) {
    error('Failed to map constructs:', err);
    error('Error response:', err.response?.data);
    error('Request was:', request);
    throw new Error(
      err.response?.data?.message || err.message || 'Failed to map constructs',
    );
  }
}

/**
 * Generate complete survey from themes
 */
export async function generateCompleteSurvey(
  request: GenerateCompleteSurveyRequest,
): Promise<CompleteSurvey> {
  try {
    log('Calling generate-complete-survey API with', request);

    const response = await apiClient.post<{
      success: boolean;
      sections: CompleteSurvey['sections'];
      metadata: CompleteSurvey['metadata'];
      methodology: CompleteSurvey['methodology'];
    }>('/literature/themes/generate-complete-survey', request);

    log('API response received:', response);

    // Validate response structure
    if (!response) {
      error('Invalid response structure:', response);
      throw new Error('Invalid API response structure');
    }

    const responseData = response as any;
    if (!responseData.sections || !responseData.metadata || !responseData.methodology) {
      error('Missing required fields in response:', responseData);
      throw new Error('API returned incomplete survey data');
    }

    log(`Successfully received survey with ${responseData.sections.length} sections`);
    return {
      sections: responseData.sections,
      metadata: responseData.metadata,
      methodology: responseData.methodology,
    };
  } catch (err: any) {
    error('Failed to generate complete survey:', err);
    error('Error response:', err.response?.data);
    error('Request was:', request);
    throw new Error(
      err.response?.data?.message || err.message || 'Failed to generate complete survey',
    );
  }
}

/**
 * Save research question result for later use
 */
export function saveResearchQuestions(
  questions: ResearchQuestionSuggestion[],
  themesUsed: Theme[],
): void {
  try {
    const data = {
      questions,
      themesUsed,
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem('theme_research_questions', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save research questions:', error);
  }
}

/**
 * Get saved research questions
 */
export function getSavedResearchQuestions(): {
  questions: ResearchQuestionSuggestion[];
  themesUsed: Theme[];
  generatedAt: string;
} | null {
  try {
    const data = localStorage.getItem('theme_research_questions');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load saved research questions:', error);
    return null;
  }
}

/**
 * Save hypothesis results for later use
 */
export function saveHypotheses(
  hypotheses: HypothesisSuggestion[],
  themesUsed: Theme[],
): void {
  try {
    const data = {
      hypotheses,
      themesUsed,
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem('theme_hypotheses', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save hypotheses:', error);
  }
}

/**
 * Get saved hypotheses
 */
export function getSavedHypotheses(): {
  hypotheses: HypothesisSuggestion[];
  themesUsed: Theme[];
  generatedAt: string;
} | null {
  try {
    const data = localStorage.getItem('theme_hypotheses');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load saved hypotheses:', error);
    return null;
  }
}

/**
 * Save construct mapping for later use
 */
export function saveConstructMapping(
  constructs: ConstructMapping[],
  themesUsed: Theme[],
): void {
  try {
    const data = {
      constructs,
      themesUsed,
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem('theme_constructs', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save construct mapping:', error);
  }
}

/**
 * Get saved construct mapping
 */
export function getSavedConstructMapping(): {
  constructs: ConstructMapping[];
  themesUsed: Theme[];
  generatedAt: string;
} | null {
  try {
    const data = localStorage.getItem('theme_constructs');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load saved construct mapping:', error);
    return null;
  }
}

/**
 * Save complete survey for later use
 */
export function saveCompleteSurvey(
  survey: CompleteSurvey,
  themesUsed: Theme[],
  purpose: string,
): void {
  try {
    const data = {
      survey,
      themesUsed,
      purpose,
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem('theme_complete_survey', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save complete survey:', error);
  }
}

/**
 * Get saved complete survey
 */
export function getSavedCompleteSurvey(): {
  survey: CompleteSurvey;
  themesUsed: Theme[];
  purpose: string;
  generatedAt: string;
} | null {
  try {
    const data = localStorage.getItem('theme_complete_survey');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load saved complete survey:', error);
    return null;
  }
}

/**
 * Enhanced Theme Integration Service Object
 * Wraps all API functions for convenient importing
 */
export const enhancedThemeIntegrationService = {
  // API calls
  suggestQuestions: suggestResearchQuestions,
  suggestHypotheses,
  mapConstructs: mapThemesToConstructs,
  generateCompleteSurvey,

  // Local storage helpers
  saveResearchQuestions,
  getSavedResearchQuestions,
  saveHypotheses,
  getSavedHypotheses,
  saveConstructMapping,
  getSavedConstructMapping,
  saveCompleteSurvey,
  getSavedCompleteSurvey,
};
