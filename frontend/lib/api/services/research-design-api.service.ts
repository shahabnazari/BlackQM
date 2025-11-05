import { apiClient } from '../client';

/**
 * Phase 9.5: Research Design Intelligence - Frontend API Service
 *
 * Handles communication with backend research-design endpoints
 */

export interface SQUAREITScore {
  specific: number;
  quantifiable: number;
  usable: number;
  accurate: number;
  restricted: number;
  eligible: number;
  investigable: number;
  timely: number;
  overall: number;
  details: {
    specificReasoning: string;
    quantifiableReasoning: string;
    usableReasoning: string;
    accurateReasoning: string;
    restrictedReasoning: string;
    eligibleReasoning: string;
    investigableReasoning: string;
    timelyReasoning: string;
  };
}

export interface SubQuestion {
  id: string;
  question: string;
  gapIds: string[];
  priority: number;
  feasibility: number;
  impact: number;
  novelty: number;
}

export interface RefinedQuestion {
  id: string;
  originalQuestion: string;
  refinedQuestion: string;
  squareitScore: SQUAREITScore;
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    relevance: string;
  }>;
  gaps: Array<{
    id: string;
    description: string;
    importance: number;
  }>;
  subQuestions: SubQuestion[];
  improvementSuggestions: string[];
  confidenceScore: number;
  createdAt: Date;
}

export interface GeneratedHypothesis {
  id: string;
  type: 'null' | 'alternative' | 'directional';
  statement: string;
  source: 'contradiction' | 'gap' | 'trend';
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    evidenceType: 'supports' | 'contradicts' | 'mixed';
    excerpt?: string;
  }>;
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest?: string;
  confidenceScore: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  priority: number;
  createdAt: Date;
}

export interface TheoryDiagram {
  constructs: Array<{
    id: string;
    name: string;
    definition: string;
    sources: string[];
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: 'causes' | 'influences' | 'moderates' | 'mediates' | 'correlates';
    strength: 'weak' | 'moderate' | 'strong';
    evidence: string[];
  }>;
}

export interface MethodologyRecommendation {
  methodology:
    | 'q-methodology'
    | 'mixed-methods'
    | 'qualitative'
    | 'quantitative';
  suitabilityScore: number;
  reasoning: string;
  qMethodologyOptimization?: {
    recommendedStatementCount: number;
    recommendedPSetSize: number;
    estimatedFactorCount: number;
    gridShape: string;
  };
  alternativeMethodologies?: Array<{
    name: string;
    score: number;
    reasoning: string;
  }>;
}

export interface QuestionAnalysisRequest {
  question: string;
  literatureSummary?: {
    papers: any[];
    themes: any[];
    gaps: any[];
  };
  domain?: string;
  methodology?:
    | 'q-methodology'
    | 'mixed-methods'
    | 'qualitative'
    | 'quantitative';
}

export interface HypothesisGenerationRequest {
  researchQuestion: string;
  literatureSummary: {
    papers: any[];
    themes: any[];
    gaps: any[];
    contradictions?: any[];
    trends?: any[];
  };
  domain?: string;
}

class ResearchDesignAPIService {
  /**
   * Refine research question using SQUARE-IT framework
   */
  async refineQuestion(
    request: QuestionAnalysisRequest
  ): Promise<RefinedQuestion> {
    const response = await apiClient.post(
      '/research-design/refine-question',
      request
    );
    return response.data;
  }

  /**
   * Generate hypotheses from contradictions, gaps, and trends
   */
  async generateHypotheses(
    request: HypothesisGenerationRequest
  ): Promise<GeneratedHypothesis[]> {
    const response = await apiClient.post(
      '/research-design/generate-hypotheses',
      request
    );
    return response.data;
  }

  /**
   * Build conceptual framework diagram from themes
   */
  async buildTheoryDiagram(request: {
    researchQuestion: string;
    themes: any[];
    knowledgeGraphData?: any;
  }): Promise<TheoryDiagram> {
    const response = await apiClient.post(
      '/research-design/build-theory-diagram',
      request
    );
    return response.data;
  }

  /**
   * Get methodology recommendation with Q-methodology optimization
   */
  async recommendMethodology(request: {
    researchQuestion: string;
    hypotheses: GeneratedHypothesis[];
    themes: any[];
  }): Promise<MethodologyRecommendation> {
    const response = await apiClient.post(
      '/research-design/recommend-methodology',
      request
    );
    return response.data;
  }
}

export const researchDesignAPI = new ResearchDesignAPIService();
