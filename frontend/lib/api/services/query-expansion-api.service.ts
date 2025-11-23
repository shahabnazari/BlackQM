/**
 * Query Expansion API Service
 *
 * Day 26: Real AI Integration
 * Connects frontend to backend AI query expansion endpoints
 */

import { apiClient, ApiResponse } from '../client';
import type { AxiosError, AxiosResponse } from 'axios';
import { logger } from '@/lib/utils/logger';

/**
 * AUDIT FIX TYPE-001: Helper to safely unwrap API response
 * Handles wrapped ({ data: T }), ApiResponse<T>, AxiosResponse<T>, and unwrapped (T) response shapes
 */
function unwrapResponse<T>(response: AxiosResponse<T> | ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export interface ExpandedQuery {
  expanded: string;
  suggestions: string[];
  isTooVague: boolean;
  narrowingQuestions: string[];
  confidence: number;
  relatedTerms: string[];
}

export interface SuggestedTerm {
  term: string;
  confidence: number;
  category: 'methodology' | 'concept' | 'domain' | 'technique';
}

export interface QueryExpansionResponse {
  success: boolean;
  expanded: ExpandedQuery;
}

export interface SuggestTermsResponse {
  success: boolean;
  terms: string[];
  confidence: number[];
}

export interface NarrowQueryResponse {
  success: boolean;
  narrowed: string[];
  reasoning: string;
}

/**
 * Expand search query with AI
 *
 * AUDIT FIX (2025-11-22): Increased timeout from 30s (default) to 60s
 * OpenAI can take longer during high load periods, and 30s was causing
 * cascading failures in the search pipeline.
 */
export async function expandQuery(
  query: string,
  domain?: 'climate' | 'health' | 'education' | 'general'
): Promise<ExpandedQuery> {
  try {
    // Use public endpoint for development (no auth required)
    // AUDIT FIX: Add explicit 60s timeout for AI operations
    const response = await apiClient.post<QueryExpansionResponse>(
      '/ai/query/expand/public',
      { query, domain: domain || 'general' },
      { timeout: 60000 } // 60 seconds for AI operations
    );

    // AUDIT FIX TYPE-001: Use type-safe unwrapper instead of `any`
    // Backend returns: { success: true, expanded: {...} }
    const data = unwrapResponse(response);

    if (data?.success && data?.expanded) {
      return data.expanded;
    }

    // Fallback if response structure is unexpected
    logger.warn('Unexpected expand query response', 'QueryExpansionAPIService', { response: data });
    return {
      expanded: query,
      suggestions: [],
      isTooVague: false,
      narrowingQuestions: [],
      confidence: 0.5,
      relatedTerms: [],
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to expand query', 'QueryExpansionAPIService', { error: axiosError.message });

    // Return original query on error
    return {
      expanded: query,
      suggestions: [],
      isTooVague: false,
      narrowingQuestions: [],
      confidence: 0.5,
      relatedTerms: [],
    };
  }
}

/**
 * Get suggested terms for query
 */
export async function suggestTerms(
  query: string,
  field?: string
): Promise<SuggestedTerm[]> {
  try {
    // AUDIT FIX: Add explicit 60s timeout for AI operations
    const response = await apiClient.post<SuggestTermsResponse>(
      '/ai/query/suggest-terms',
      { query, field },
      { timeout: 60000 }
    );

    // AUDIT FIX TYPE-001: Use type-safe unwrapper
    const data = unwrapResponse(response);

    if (data?.success && data?.terms) {
      // Convert to SuggestedTerm format
      return data.terms.map((term: string, index: number) => ({
        term,
        confidence: data.confidence[index] || 0.7,
        category: 'methodology' as const, // Default category
      }));
    }

    return [];
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to suggest terms', 'QueryExpansionAPIService', { error: axiosError.message });
    return [];
  }
}

/**
 * Narrow overly broad query
 */
export async function narrowQuery(query: string): Promise<{
  narrowed: string[];
  reasoning: string;
}> {
  try {
    // AUDIT FIX: Add explicit 60s timeout for AI operations
    const response = await apiClient.post<NarrowQueryResponse>(
      '/ai/query/narrow',
      { query },
      { timeout: 60000 }
    );

    // AUDIT FIX TYPE-001: Use type-safe unwrapper
    const data = unwrapResponse(response);

    if (data?.success) {
      return {
        narrowed: data.narrowed || [],
        reasoning: data.reasoning || '',
      };
    }

    return { narrowed: [], reasoning: '' };
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to narrow query', 'QueryExpansionAPIService', { error: axiosError.message });
    return { narrowed: [], reasoning: '' };
  }
}

/**
 * Check if OpenAI is configured
 */
export async function checkAIAvailability(): Promise<boolean> {
  try {
    // Try a simple query to test AI availability
    const result = await expandQuery('test', 'general');
    return result.confidence > 0;
  } catch {
    return false;
  }
}
