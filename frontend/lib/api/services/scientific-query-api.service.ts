/**
 * Phase 10.113 Week 9: Scientific Query Optimization API Service
 *
 * Netflix-grade frontend service for scientific query validation and optimization.
 * Connects to backend ScientificQueryOptimizerService endpoints.
 *
 * Endpoints:
 * - POST /literature/query/validate - Validate query quality
 * - POST /literature/query/optimize - Optimize with mode selection
 * - GET /literature/query/effectiveness - A/B testing metrics
 * - GET /literature/query/stats - Query optimizer statistics
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 9
 */

import { apiClient } from '../client';
import type { AxiosError, AxiosResponse } from 'axios';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS (No Magic Numbers)
// ============================================================================

/** Default timeout for validation requests (fast operation) */
const VALIDATION_TIMEOUT_MS = 10000;

/** Timeout for AI-powered optimization (slower, GPT-4 call) */
const AI_OPTIMIZATION_TIMEOUT_MS = 60000;

/** Timeout for non-AI optimization modes */
const STANDARD_OPTIMIZATION_TIMEOUT_MS = 15000;

/** Default timeout for stats/effectiveness endpoints */
const STATS_TIMEOUT_MS = 10000;

// ============================================================================
// TYPE DEFINITIONS (Strict Typing - No 'any')
// ============================================================================

/**
 * Query expansion mode - matches backend type exactly
 */
export type QueryExpansionMode = 'none' | 'local' | 'enhanced' | 'ai';

/**
 * Query metrics from backend
 */
export interface QueryMetrics {
  readonly wordCount: number;
  readonly meaningfulWordCount: number;
  readonly characterCount: number;
  readonly academicTermCount: number;
}

/**
 * Query validation response from backend
 */
export interface QueryValidationResponse {
  readonly isValid: boolean;
  readonly qualityScore: number;
  readonly issues: readonly string[];
  readonly suggestions: readonly string[];
  readonly metrics: QueryMetrics;
}

/**
 * Query quality subset for optimization response
 */
export interface QueryQualitySubset {
  readonly isValid: boolean;
  readonly qualityScore: number;
  readonly issues: readonly string[];
  readonly suggestions: readonly string[];
}

/**
 * Query optimization response from backend
 */
export interface QueryOptimizationResponse {
  readonly originalQuery: string;
  readonly optimizedQuery: string;
  readonly mode: QueryExpansionMode;
  readonly quality: QueryQualitySubset;
  readonly shouldProceed: boolean;
  readonly warningMessage?: string;
  readonly processingTimeMs: number;
}

/**
 * Mode effectiveness metrics for A/B testing
 */
export interface ModeEffectivenessMetrics {
  readonly mode: QueryExpansionMode;
  readonly avgPapersFound: number;
  readonly avgSemanticScore: number;
  readonly avgQualityScore: number;
  readonly avgProcessingTimeMs: number;
  readonly sampleSize: number;
}

/**
 * Query effectiveness comparison response
 */
export interface QueryEffectivenessResponse {
  readonly modes: ModeEffectivenessMetrics[];
  readonly recommendedMode: QueryExpansionMode;
  readonly recommendation: string;
}

/**
 * Query optimizer statistics response
 */
export interface QueryOptimizerStatsResponse {
  readonly totalQueries: number;
  readonly validQueries: number;
  readonly invalidQueries: number;
  readonly avgQualityScore: number;
  readonly modeUsage: Record<QueryExpansionMode, number>;
  readonly lastUpdated: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type-safe response unwrapper
 * Handles wrapped ({ data: T }), AxiosResponse<T>, and unwrapped (T) response shapes
 */
function unwrapResponse<T>(response: AxiosResponse<T> | { data: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

/**
 * Default validation response for error cases
 */
const DEFAULT_VALIDATION_RESPONSE: QueryValidationResponse = {
  isValid: true,
  qualityScore: 50,
  issues: [],
  suggestions: [],
  metrics: {
    wordCount: 0,
    meaningfulWordCount: 0,
    characterCount: 0,
    academicTermCount: 0,
  },
};

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Validate query quality using backend scientific validator
 *
 * Phase 10.113 Week 9: Replaces local QueryValidator.validate()
 * Uses backend POST /literature/query/validate
 *
 * @param query - Search query to validate
 * @returns Query validation response with quality score, issues, suggestions
 */
export async function validateQuery(
  query: string
): Promise<QueryValidationResponse> {
  if (!query || query.trim().length === 0) {
    return {
      ...DEFAULT_VALIDATION_RESPONSE,
      isValid: false,
      qualityScore: 0,
      issues: ['Query cannot be empty'],
    };
  }

  try {
    logger.debug('Validating query via backend', 'ScientificQueryAPI', { query });

    const response = await apiClient.post<QueryValidationResponse>(
      '/literature/query/validate',
      { query: query.trim() },
      { timeout: VALIDATION_TIMEOUT_MS }
    );

    const data = unwrapResponse(response);

    logger.debug('Query validation complete', 'ScientificQueryAPI', {
      isValid: data.isValid,
      qualityScore: data.qualityScore,
      issueCount: data.issues.length,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to validate query', 'ScientificQueryAPI', {
      error: axiosError.message,
      status: axiosError.response?.status,
    });

    // Return default validation on error (don't block user)
    return {
      ...DEFAULT_VALIDATION_RESPONSE,
      suggestions: ['Unable to validate query - proceeding with default settings'],
    };
  }
}

/**
 * Optimize query with configurable mode
 *
 * Phase 10.113 Week 9: Scientific A/B testable query optimization
 *
 * Modes:
 * - 'none': Original query only (baseline)
 * - 'local': Spell-check + normalization (low overhead)
 * - 'enhanced': Local + methodology/controversy terms (medium overhead)
 * - 'ai': Full GPT-4 expansion (high overhead, testable)
 *
 * @param query - Search query to optimize
 * @param mode - Optimization mode (default: 'local')
 * @returns Optimized query with quality assessment
 */
export async function optimizeQuery(
  query: string,
  mode: QueryExpansionMode = 'local'
): Promise<QueryOptimizationResponse> {
  if (!query || query.trim().length === 0) {
    return {
      originalQuery: query,
      optimizedQuery: query,
      mode,
      quality: {
        isValid: false,
        qualityScore: 0,
        issues: ['Query cannot be empty'],
        suggestions: [],
      },
      shouldProceed: false,
      warningMessage: 'Empty query',
      processingTimeMs: 0,
    };
  }

  try {
    logger.debug('Optimizing query', 'ScientificQueryAPI', { query, mode });

    // Use longer timeout for AI mode
    const timeout = mode === 'ai' ? AI_OPTIMIZATION_TIMEOUT_MS : STANDARD_OPTIMIZATION_TIMEOUT_MS;

    const response = await apiClient.post<QueryOptimizationResponse>(
      '/literature/query/optimize',
      { query: query.trim(), mode },
      { timeout }
    );

    const data = unwrapResponse(response);

    logger.debug('Query optimization complete', 'ScientificQueryAPI', {
      originalQuery: data.originalQuery,
      optimizedQuery: data.optimizedQuery,
      mode: data.mode,
      shouldProceed: data.shouldProceed,
      processingTimeMs: data.processingTimeMs,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to optimize query', 'ScientificQueryAPI', {
      error: axiosError.message,
      status: axiosError.response?.status,
    });

    // Return original query on error
    return {
      originalQuery: query,
      optimizedQuery: query,
      mode,
      quality: {
        isValid: true,
        qualityScore: 50,
        issues: [],
        suggestions: ['Optimization failed - using original query'],
      },
      shouldProceed: true,
      warningMessage: 'Optimization unavailable',
      processingTimeMs: 0,
    };
  }
}

/**
 * Get query optimization effectiveness comparison
 *
 * Phase 10.113 Week 9: For A/B testing and mode selection
 * Returns metrics for each mode to help users choose
 *
 * @returns Effectiveness metrics by mode with recommendation
 */
export async function getEffectivenessComparison(): Promise<QueryEffectivenessResponse | null> {
  try {
    logger.debug('Fetching effectiveness comparison', 'ScientificQueryAPI');

    const response = await apiClient.get<QueryEffectivenessResponse>(
      '/literature/query/effectiveness',
      { timeout: STATS_TIMEOUT_MS }
    );

    const data = unwrapResponse(response);

    logger.debug('Effectiveness comparison fetched', 'ScientificQueryAPI', {
      modesCount: data.modes.length,
      recommendedMode: data.recommendedMode,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch effectiveness', 'ScientificQueryAPI', {
      error: axiosError.message,
    });
    return null;
  }
}

/**
 * Get query optimizer statistics
 *
 * Phase 10.113 Week 9: For monitoring and analytics
 *
 * @returns Query optimizer statistics
 */
export async function getOptimizerStats(): Promise<QueryOptimizerStatsResponse | null> {
  try {
    logger.debug('Fetching optimizer stats', 'ScientificQueryAPI');

    const response = await apiClient.get<QueryOptimizerStatsResponse>(
      '/literature/query/stats',
      { timeout: STATS_TIMEOUT_MS }
    );

    const data = unwrapResponse(response);

    logger.debug('Optimizer stats fetched', 'ScientificQueryAPI', {
      totalQueries: data.totalQueries,
      avgQualityScore: data.avgQualityScore,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch optimizer stats', 'ScientificQueryAPI', {
      error: axiosError.message,
    });
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get quality indicator label and color based on score
 *
 * @param score - Quality score (0-100)
 * @returns Label, color, and emoji for UI display
 */
export function getQualityIndicator(score: number): {
  label: string;
  color: 'green' | 'yellow' | 'red';
  emoji: string;
} {
  if (score >= 80) {
    return { label: 'Excellent', color: 'green', emoji: '✨' };
  }
  if (score >= 60) {
    return { label: 'Good', color: 'green', emoji: '👍' };
  }
  if (score >= 40) {
    return { label: 'Fair', color: 'yellow', emoji: '⚠️' };
  }
  return { label: 'Poor', color: 'red', emoji: '❌' };
}

/**
 * Get mode display info
 *
 * @param mode - Query expansion mode
 * @returns Display name, description, and icon
 */
export function getModeDisplayInfo(mode: QueryExpansionMode): {
  name: string;
  description: string;
  icon: string;
} {
  switch (mode) {
    case 'none':
      return {
        name: 'Original',
        description: 'No modifications (baseline)',
        icon: '📝',
      };
    case 'local':
      return {
        name: 'Local',
        description: 'Spell-check + normalization',
        icon: '🔧',
      };
    case 'enhanced':
      return {
        name: 'Enhanced',
        description: 'Local + methodology terms',
        icon: '🔬',
      };
    case 'ai':
      return {
        name: 'AI Powered',
        description: 'Full GPT-4 expansion',
        icon: '🤖',
      };
  }
}

export default {
  validateQuery,
  optimizeQuery,
  getEffectivenessComparison,
  getOptimizerStats,
  getQualityIndicator,
  getModeDisplayInfo,
};
