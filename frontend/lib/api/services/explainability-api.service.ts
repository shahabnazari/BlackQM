/**
 * Explainability API Service
 * Phase 10 Days 24-25: Frontend connector for Explainable AI backend
 *
 * Connects to backend/src/modules/analysis/services/explainability.service.ts
 * Provides SHAP-inspired feature importance, bias audits, what-if scenarios
 */

import { apiClient } from '../client';

// ============================================================================
// TYPE DEFINITIONS (matching backend)
// ============================================================================

/**
 * Feature importance for a single statement
 * Adapted from SHAP values for Q-methodology
 */
export interface StatementImportance {
  statementId: string | number;
  statementText: string;
  importance: number; // 0-1 scale
  contribution: 'positive' | 'negative' | 'neutral';
  zScore: number;
  rank: number;
  explanation: string;
}

/**
 * Factor explanation with feature importance
 */
export interface FactorExplanation {
  factorNumber: number;
  factorLabel: string;
  statementImportances: StatementImportance[];
  topPositiveStatements: StatementImportance[];
  topNegativeStatements: StatementImportance[];
  neutralStatements: StatementImportance[];
  explainedVariance: number;
  certaintyScore: number; // 0-1 scale
  confidenceInterval: [number, number];
}

/**
 * Counterfactual "what-if" scenario
 */
export interface Counterfactual {
  scenarioName: string;
  description: string;
  modifiedStatements: {
    statementId: string | number;
    action: 'removed' | 'added' | 'modified';
    originalRank?: number;
    newRank?: number;
  }[];
  predictedImpact: {
    factorNumber: number;
    currentVariance: number;
    predictedVariance: number;
    varianceChange: number; // percentage
    confidenceLevel: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Multi-dimensional bias analysis
 */
export interface BiasAudit {
  overallBiasScore: number; // 0-100, lower is better
  dimensions: {
    statementBalance: BiasDimension;
    factorBalance: BiasDimension;
    demographicRepresentation: BiasDimension;
    viewpointDiversity: BiasDimension;
    extremityBias: BiasDimension;
  };
  recommendations: BiasRecommendation[];
  complianceLevel: 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
}

export interface BiasDimension {
  name: string;
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  description: string;
  evidence: string[];
  correctiveActions: string[];
}

export interface BiasRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
  actionItems: string[];
  expectedImpact: string;
}

/**
 * Certainty scoring for interpretation
 */
export interface CertaintyScore {
  overall: number; // 0-1 scale
  components: {
    statisticalSignificance: number;
    factorStability: number;
    interpretabilityClarity: number;
    convergenceQuality: number;
  };
  confidenceInterval: [number, number];
  reliability: 'very_high' | 'high' | 'moderate' | 'low';
  explanation: string;
}

/**
 * Alternative explanation
 */
export interface AlternativeExplanation {
  alternativeId: string;
  perspective: string;
  narrative: string;
  keyDifferences: string[];
  supportingEvidence: string[];
  plausibilityScore: number; // 0-1
  comparisonWithPrimary: {
    similarities: string[];
    differences: string[];
    strengthsOfAlternative: string[];
    weaknessesOfAlternative: string[];
  };
}

// ============================================================================
// API SERVICE
// ============================================================================

export class ExplainabilityApiService {
  /**
   * Calculate feature importance for all factors
   * SHAP-inspired analysis showing which statements matter most
   */
  async calculateFeatureImportance(
    studyId: string
  ): Promise<{ factors: FactorExplanation[] }> {
    const response = await apiClient.get(`/interpretation/${studyId}/explainability/feature-importance`);
    return response.data;
  }

  /**
   * Generate "what-if" counterfactual scenarios
   * Shows impact of removing/adding statements
   */
  async generateCounterfactuals(
    studyId: string,
    options?: {
      scenarioCount?: number;
      focusOnDistinguishing?: boolean;
    }
  ): Promise<{ counterfactuals: Counterfactual[] }> {
    const params = new URLSearchParams();
    if (options?.scenarioCount) params.append('scenarioCount', options.scenarioCount.toString());
    if (options?.focusOnDistinguishing) params.append('focusOnDistinguishing', 'true');

    const response = await apiClient.get(
      `/interpretation/${studyId}/explainability/counterfactuals?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Perform comprehensive bias audit
   * Multi-dimensional analysis across 5 bias types
   */
  async performBiasAudit(studyId: string): Promise<BiasAudit> {
    const response = await apiClient.get(`/interpretation/${studyId}/explainability/bias-audit`);
    return response.data;
  }

  /**
   * Calculate certainty score for interpretations
   * Provides confidence intervals and reliability assessment
   */
  async calculateCertaintyScore(
    studyId: string,
    factorNumber?: number
  ): Promise<CertaintyScore> {
    const params = factorNumber ? `?factorNumber=${factorNumber}` : '';
    const response = await apiClient.get(
      `/interpretation/${studyId}/explainability/certainty-score${params}`
    );
    return response.data;
  }

  /**
   * Generate alternative interpretations using GPT-4
   * Provides multiple perspectives (sociological, psychological, etc.)
   */
  async generateAlternativeExplanations(
    studyId: string,
    factorNumber: number,
    count: number = 2
  ): Promise<{ alternatives: AlternativeExplanation[] }> {
    const response = await apiClient.get(
      `/interpretation/${studyId}/explainability/alternative-explanations/${factorNumber}?count=${count}`
    );
    return response.data;
  }

  /**
   * Get comprehensive explainability summary
   * Combines feature importance, bias audit, and certainty scores
   */
  async getExplainabilitySummary(studyId: string): Promise<{
    featureImportance: { factors: FactorExplanation[] };
    biasAudit: BiasAudit;
    certaintyScores: Record<number, CertaintyScore>;
    counterfactuals: { counterfactuals: Counterfactual[] };
  }> {
    // Fetch all components in parallel
    const [featureImportance, biasAudit, counterfactuals] = await Promise.all([
      this.calculateFeatureImportance(studyId),
      this.performBiasAudit(studyId),
      this.generateCounterfactuals(studyId),
    ]);

    // Calculate certainty scores for each factor
    const certaintyScores: Record<number, CertaintyScore> = {};
    for (const factor of featureImportance.factors) {
      certaintyScores[factor.factorNumber] = await this.calculateCertaintyScore(
        studyId,
        factor.factorNumber
      );
    }

    return {
      featureImportance,
      biasAudit,
      certaintyScores,
      counterfactuals,
    };
  }
}

// Singleton instance
export const explainabilityApi = new ExplainabilityApiService();
