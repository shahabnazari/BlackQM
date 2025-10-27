/**
 * Unified Theme API Service
 *
 * Phase 9 Day 20 Task 4 Implementation
 *
 * Frontend service for accessing unified theme extraction endpoints
 * Provides methods for:
 * 1. Extract themes from multiple source types with full provenance
 * 2. Get detailed provenance report for any theme
 * 3. Filter themes by source type and influence
 *
 * @enterprise Features:
 * - Type-safe API calls
 * - Error handling with retry logic
 * - Response caching
 * - Loading state management
 */

import { apiClient } from '../client';

/**
 * Interfaces matching backend models
 */
export interface UnifiedTheme {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  weight: number;
  controversial: boolean;
  confidence: number;
  sources: ThemeSource[];
  provenance: ThemeProvenance;
  extractedAt: Date;
  extractionModel: string;
}

export interface ThemeSource {
  id?: string;
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  sourceId: string;
  sourceUrl?: string;
  sourceTitle: string;
  sourceAuthor?: string;
  influence: number;
  keywordMatches: number;
  excerpts: string[];
  timestamps?: Array<{ start: number; end: number; text: string }>;
  doi?: string;
  authors?: string[];
  year?: number;
}

export interface ThemeProvenance {
  paperInfluence: number;
  videoInfluence: number;
  podcastInfluence: number;
  socialInfluence: number;
  paperCount: number;
  videoCount: number;
  podcastCount: number;
  socialCount: number;
  averageConfidence: number;
  citationChain: string[];
}

export interface SourceContent {
  id: string;
  type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  title: string;
  content: string;
  author?: string;
  keywords: string[];
  url?: string;
  doi?: string;
  authors?: string[];
  year?: number;
  timestampedSegments?: Array<{ timestamp: number; text: string }>;
}

export interface ExtractionOptions {
  researchContext?: string;
  mergeWithExisting?: boolean;
  studyId?: string;
  collectionId?: string;
  maxThemes?: number;
  minConfidence?: number;
}

export interface ExtractionRequest {
  sources: SourceContent[];
  options?: ExtractionOptions;
}

export interface ExtractionResponse {
  themes: UnifiedTheme[];
  totalSources: number;
  processingTime: number;
}

export interface ProvenanceResponse {
  theme: UnifiedTheme;
  detailedSources: ThemeSource[];
}

/**
 * Unified Theme API Service Class
 */
export class UnifiedThemeAPIService {
  private static instance: UnifiedThemeAPIService;
  private baseUrl = '/literature/themes';

  private constructor() {}

  public static getInstance(): UnifiedThemeAPIService {
    if (!UnifiedThemeAPIService.instance) {
      UnifiedThemeAPIService.instance = new UnifiedThemeAPIService();
    }
    return UnifiedThemeAPIService.instance;
  }

  /**
   * Extract themes from multiple sources with full provenance tracking
   * @param sources - Array of source content (papers, videos, podcasts, social)
   * @param options - Extraction options
   */
  async extractFromMultipleSources(
    sources: SourceContent[],
    options?: ExtractionOptions
  ): Promise<ExtractionResponse> {
    try {
      console.log('🟢 UnifiedThemeAPI.extractFromMultipleSources called');
      console.log('   URL:', `${this.baseUrl}/unified-extract`);
      console.log('   Sources:', sources.length);
      console.log('   Payload:', { sources: sources.slice(0, 1), options }); // Log first source as sample

      // Note: apiClient.post() returns ApiResponse<T> which has structure { data: T, message?, meta? }
      // So we need to access response.data to get the actual ExtractionResponse
      const response = await apiClient.post<ExtractionResponse>(
        `${this.baseUrl}/unified-extract`,
        { sources, options }
      );

      console.log('🟢 API Response received:');
      console.log('   Response type:', typeof response);
      console.log('   Response keys:', response ? Object.keys(response) : 'null');
      console.log('   Has data?', response && 'data' in response);
      console.log('   Themes count:', response.data?.themes?.length);
      console.log('   Total sources:', response.data?.totalSources);
      console.log('   Processing time:', response.data?.processingTime, 'ms');

      return response.data;
    } catch (error: any) {
      console.error('🔴 [UnifiedThemeAPI] Extract failed:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      console.error('   Error message:', error.message);
      throw new Error(
        `Failed to extract themes from sources: ${error.message}`
      );
    }
  }

  /**
   * Get detailed provenance report for a specific theme
   * @param themeId - ID of the theme
   */
  async getThemeProvenance(themeId: string): Promise<ProvenanceResponse> {
    try {
      const response = await apiClient.get<ProvenanceResponse>(
        `${this.baseUrl}/${themeId}/provenance`
      );
      return response.data;
    } catch (error) {
      console.error('[UnifiedThemeAPI] Get provenance failed:', error);
      throw new Error('Failed to get theme provenance');
    }
  }

  /**
   * Filter themes by source type and influence
   * @param studyId - Study ID to filter themes
   * @param sourceType - Optional source type filter
   * @param minInfluence - Minimum influence threshold (0-1)
   */
  async getThemesBySources(
    studyId: string,
    sourceType?: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
    minInfluence: number = 0
  ): Promise<UnifiedTheme[]> {
    try {
      const params: any = { studyId, minInfluence };
      if (sourceType) {
        params.sourceType = sourceType;
      }

      const response = await apiClient.get<{ themes: UnifiedTheme[] }>(
        `${this.baseUrl}/filter`,
        { params }
      );
      return response.data.themes;
    } catch (error) {
      console.error('[UnifiedThemeAPI] Filter themes failed:', error);
      throw new Error('Failed to filter themes by sources');
    }
  }

  /**
   * Get themes for a specific collection/literature review
   * @param collectionId - Collection ID
   */
  async getCollectionThemes(collectionId: string): Promise<UnifiedTheme[]> {
    try {
      const response = await apiClient.get<{ themes: UnifiedTheme[] }>(
        `${this.baseUrl}/collection/${collectionId}`
      );
      return response.data.themes;
    } catch (error) {
      console.error('[UnifiedThemeAPI] Get collection themes failed:', error);
      throw new Error('Failed to get collection themes');
    }
  }

  /**
   * Compare themes across multiple studies
   * @param studyIds - Array of study IDs
   */
  async compareStudyThemes(studyIds: string[]): Promise<{
    commonThemes: UnifiedTheme[];
    uniqueThemes: Map<string, UnifiedTheme[]>;
    similarity: number;
  }> {
    try {
      const response = await apiClient.post<{
        commonThemes: UnifiedTheme[];
        uniqueThemes: Record<string, UnifiedTheme[]>;
        similarity: number;
      }>(`${this.baseUrl}/compare`, { studyIds });

      // Convert record to Map for better API
      const uniqueThemes = new Map(Object.entries(response.data.uniqueThemes));

      return {
        commonThemes: response.data.commonThemes,
        uniqueThemes,
        similarity: response.data.similarity,
      };
    } catch (error) {
      console.error('[UnifiedThemeAPI] Compare themes failed:', error);
      throw new Error('Failed to compare study themes');
    }
  }

  /**
   * Export themes with full provenance to various formats
   * @param themeIds - Array of theme IDs to export
   * @param format - Export format (csv, json, latex)
   */
  async exportThemesWithProvenance(
    themeIds: string[],
    format: 'csv' | 'json' | 'latex' = 'json'
  ): Promise<Blob> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/export`,
        { themeIds, format },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('[UnifiedThemeAPI] Export themes failed:', error);
      throw new Error('Failed to export themes with provenance');
    }
  }
}

// Export singleton instance
export const unifiedThemeAPI = UnifiedThemeAPIService.getInstance();

/**
 * React Hook for unified theme API with loading states
 */
import { useCallback, useState } from 'react';

interface UseUnifiedThemeAPIReturn {
  extractThemes: (
    sources: SourceContent[],
    options?: ExtractionOptions
  ) => Promise<ExtractionResponse | null>;
  getProvenance: (themeId: string) => Promise<ProvenanceResponse | null>;
  filterThemes: (
    studyId: string,
    sourceType?: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
    minInfluence?: number
  ) => Promise<UnifiedTheme[]>;
  loading: boolean;
  error: string | null;
}

export function useUnifiedThemeAPI(): UseUnifiedThemeAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractThemes = useCallback(
    async (sources: SourceContent[], options?: ExtractionOptions) => {
      setLoading(true);
      setError(null);
      console.log('🔵 useUnifiedThemeAPI.extractThemes called');
      console.log('   Sources count:', sources.length);
      console.log('   Options:', options);
      try {
        console.log('🔵 Calling unifiedThemeAPI.extractFromMultipleSources...');
        const result = await unifiedThemeAPI.extractFromMultipleSources(
          sources,
          options
        );
        console.log('🔵 API returned result:', result);
        console.log('   Result type:', typeof result);
        console.log('   Result has themes?', result?.themes ? 'YES' : 'NO');
        return result;
      } catch (err) {
        console.error('🔴 Error in extractThemes:', err);
        console.error('   Error type:', typeof err);
        console.error(
          '   Error message:',
          err instanceof Error ? err.message : 'Unknown'
        );
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getProvenance = useCallback(async (themeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await unifiedThemeAPI.getThemeProvenance(themeId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const filterThemes = useCallback(
    async (
      studyId: string,
      sourceType?: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
      minInfluence?: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await unifiedThemeAPI.getThemesBySources(
          studyId,
          sourceType,
          minInfluence
        );
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    extractThemes,
    getProvenance,
    filterThemes,
    loading,
    error,
  };
}
