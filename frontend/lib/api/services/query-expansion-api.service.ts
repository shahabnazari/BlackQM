/**
 * Query Expansion API Service
 *
 * Day 26: Real AI Integration
 * Connects frontend to backend AI query expansion endpoints
 */

import { apiClient } from '../client';
import type { AxiosError } from 'axios';

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
 */
export async function expandQuery(
  query: string,
  domain?: 'climate' | 'health' | 'education' | 'general'
): Promise<ExpandedQuery> {
  try {
    // Use public endpoint for development (no auth required)
    const response = await apiClient.post<QueryExpansionResponse>(
      '/ai/query/expand/public',
      { query, domain: domain || 'general' }
    );

    // apiClient.post returns the unwrapped response data directly
    // Backend returns: { success: true, expanded: {...} }
    const data = response.data || (response as any);

    if (data?.success && data?.expanded) {
      return data.expanded;
    }

    // Fallback if response structure is unexpected
    console.warn('Unexpected expand query response:', data);
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
    console.error('Failed to expand query:', axiosError.message);

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
    const response = await apiClient.post<SuggestTermsResponse>(
      '/ai/query/suggest-terms',
      { query, field }
    );

    const data = response.data || (response as any);

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
    console.error('Failed to suggest terms:', axiosError.message);
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
    const response = await apiClient.post<NarrowQueryResponse>(
      '/ai/query/narrow',
      { query }
    );

    const data = response.data || (response as any);

    if (data?.success) {
      return {
        narrowed: data.narrowed || [],
        reasoning: data.reasoning || '',
      };
    }

    return { narrowed: [], reasoning: '' };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Failed to narrow query:', axiosError.message);
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
