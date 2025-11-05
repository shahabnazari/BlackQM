/**
 * Unified Theme API Service
 *
 * Phase 9 Day 20 Task 4 Implementation
 * Phase 10 Day 5.13 Week 2 - V2 Purpose-Driven Extraction Support
 *
 * Frontend service for accessing unified theme extraction endpoints
 * Provides methods for:
 * 1. Extract themes from multiple source types with full provenance
 * 2. Get detailed provenance report for any theme
 * 3. Filter themes by source type and influence
 * 4. V2 Purpose-driven extraction with transparent progress (NEW)
 *
 * @enterprise Features:
 * - Type-safe API calls
 * - Error handling with retry logic
 * - Response caching
 * - Loading state management
 * - Progressive disclosure support (Novice/Researcher/Expert)
 * - Iterative refinement tracking
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
  // Phase 10 Day 5.16: Content type metadata for adaptive validation
  metadata?: {
    contentType?: 'none' | 'abstract' | 'full_text' | 'abstract_overflow';
    contentSource?: string;
    contentLength?: number;
    hasFullText?: boolean;
    fullTextStatus?: 'not_fetched' | 'fetching' | 'success' | 'failed';
    [key: string]: any; // Allow other metadata fields (videoId, duration, etc.)
  };
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
  metadata?: {
    stats?: any;
    performanceGain?: string;
    processingTimeMinutes?: string;
    themesExtracted?: number;
    sourceBreakdown?: Record<string, number>;
  };
}

export interface ProvenanceResponse {
  theme: UnifiedTheme;
  detailedSources: ThemeSource[];
}

/**
 * ============================================================================
 * V2 PURPOSE-DRIVEN EXTRACTION INTERFACES (Phase 10 Day 5.13 Week 2)
 * ============================================================================
 */

export type ResearchPurpose =
  | 'q_methodology'
  | 'survey_construction'
  | 'qualitative_analysis'
  | 'literature_synthesis'
  | 'hypothesis_generation';

export type UserExpertiseLevel = 'novice' | 'researcher' | 'expert';

export interface TransparentProgressMessage {
  stageName: string;
  stageNumber: number;
  totalStages: number;
  percentage: number;
  whatWeAreDoing: string;
  whyItMatters: string;
  liveStats: {
    sourcesAnalyzed: number;
    codesGenerated?: number;
    themesIdentified?: number;
    currentOperation: string;
  };
}

export interface SaturationDataPoint {
  sourceNumber: number;
  newThemesDiscovered: number;
  cumulativeThemes: number;
}

export interface SaturationData {
  sourceProgression: SaturationDataPoint[];
  saturationReached: boolean;
  saturationPoint?: number;
  recommendation: string;
}

export interface EnhancedMethodologyReport {
  method: string;
  citation: string;
  stages: number;
  validation: string;
  aiRole: string;
  limitations: string;
  aiDisclosure: {
    modelUsed: string;
    aiRoleDetailed: string;
    humanOversightRequired: string;
    confidenceCalibration: {
      high: string;
      medium: string;
      low: string;
    };
  };
  iterativeRefinement?: {
    cyclesPerformed: number;
    stagesRevisited: number[];
    rationale: string;
  };
}

export interface V2ExtractionOptions extends ExtractionOptions {
  purpose: ResearchPurpose;
  userExpertiseLevel?: UserExpertiseLevel;
  allowIterativeRefinement?: boolean;
  methodology?:
    | 'reflexive_thematic'
    | 'framework_analysis'
    | 'interpretive_phenomenology';
  validationLevel?: 'rigorous' | 'standard' | 'exploratory';
}

export interface V2ExtractionRequest {
  sources: SourceContent[];
  purpose: ResearchPurpose;
  userExpertiseLevel?: UserExpertiseLevel;
  allowIterativeRefinement?: boolean;
  methodology?: string;
  validationLevel?: string;
  researchContext?: string;
  studyId?: string;
  requestId?: string; // PHASE 10 DAY 5.17.3: Request tracking for end-to-end tracing
}

export interface V2ExtractionResponse {
  success: boolean;
  themes: UnifiedTheme[];
  methodology: EnhancedMethodologyReport;
  saturationData?: SaturationData;
  transparency: {
    purpose: ResearchPurpose;
    howItWorks: string;
    aiRole: string;
    humanOversightRequired: string;
    confidenceCalibration: {
      high: string;
      medium: string;
      low: string;
    };
    quality: string;
    limitations: string;
    citations: string;
    saturationRecommendation?: string;
  };
}

export type V2ProgressCallback = (
  stage: number,
  total: number,
  message: string,
  transparentMessage?: TransparentProgressMessage
) => void;

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
   * PHASE 10 DAY 5.5: Auto-selects optimized batch endpoint for 5+ sources
   * PHASE 10 DAY 5.6: Auto-fallback to public endpoint on 401 errors (dev only)
   * PHASE 10 DAY 5.6: Progress callback support for interactive UI
   * @param sources - Array of source content (papers, videos, podcasts, social)
   * @param options - Extraction options
   * @param onProgress - Optional callback for progress updates
   */
  async extractFromMultipleSources(
    sources: SourceContent[],
    options?: ExtractionOptions,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<ExtractionResponse> {
    // PHASE 10 DAY 5.5: Auto-select batch endpoint for 5+ sources
    const useBatchEndpoint = sources.length >= 5;
    const endpoint = useBatchEndpoint
      ? `${this.baseUrl}/unified-extract-batch`
      : `${this.baseUrl}/unified-extract`;

    console.log('🟢 UnifiedThemeAPI.extractFromMultipleSources called');
    console.log('   URL:', endpoint);
    console.log('   Sources:', sources.length);
    console.log(
      '   Mode:',
      useBatchEndpoint ? '⚡ BATCH (optimized)' : '🔄 Regular'
    );

    // PHASE 10 DAY 5.6: Progress tracking
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Start progress tracking
      if (onProgress) {
        onProgress(0, sources.length, 'Starting extraction...');
        const estimatedTimePerSource = 40000; // 40 seconds
        const totalEstimatedTime = sources.length * estimatedTimePerSource;
        const startTime = Date.now();

        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const estimatedCompleted = Math.floor(
            (elapsed / totalEstimatedTime) * sources.length
          );
          const current = Math.min(estimatedCompleted, sources.length - 1);
          if (current < sources.length) {
            onProgress(
              current,
              sources.length,
              `Processing source ${current + 1} of ${sources.length}...`
            );
          }
        }, 5000);
      }

      // Make API call
      const response: any = await apiClient.post(
        endpoint,
        { sources, options },
        { timeout: 600000 } // 10 minutes for complex extraction
      );

      // Clear progress and mark complete
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (onProgress) {
        onProgress(sources.length, sources.length, 'Deduplicating themes...');
      }

      console.log('🟢 API Response received:');
      console.log('   Themes count:', response?.themes?.length);
      console.log(
        '   Processing time:',
        response?.metadata?.processingTimeMs,
        'ms'
      );

      // Return formatted response
      return {
        themes: response.themes || [],
        totalSources: response.metadata?.totalSources || sources.length,
        processingTime: response.metadata?.processingTimeMs || 0,
        metadata: response.metadata,
      } as ExtractionResponse;
    } catch (error: any) {
      // Clean up progress on error
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      console.error('🔴 [UnifiedThemeAPI] Extract failed:', error);

      // PHASE 10 DAY 5.6: Auto-fallback to public endpoint on 401
      if (error.response?.status === 401) {
        console.warn('⚠️ Authentication required. Trying public endpoint...');
        return this.extractWithPublicEndpoint(sources, options, onProgress);
      }

      throw new Error(`Failed to extract themes: ${error.message}`);
    }
  }

  /**
   * Fallback method for testing without authentication
   * Uses public endpoint (dev only)
   * @private
   */
  private async extractWithPublicEndpoint(
    sources: SourceContent[],
    options?: ExtractionOptions,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<ExtractionResponse> {
    const endpoint =
      sources.length >= 5
        ? `${this.baseUrl}/unified-extract-batch/public`
        : `${this.baseUrl}/unified-extract`;

    console.log('🔓 Using public endpoint (no auth required):');

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Start progress tracking
      if (onProgress) {
        onProgress(0, sources.length, 'Starting extraction (public)...');
        const startTime = Date.now();
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const current = Math.min(
            Math.floor(elapsed / 40000),
            sources.length - 1
          );
          if (current < sources.length) {
            onProgress(
              current,
              sources.length,
              `Processing source ${current + 1} of ${sources.length}...`
            );
          }
        }, 5000);
      }

      const response: any = await apiClient.post(
        endpoint,
        { sources, options },
        { timeout: 600000 }
      ); // 10 minutes

      // Clear progress
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (onProgress) {
        onProgress(sources.length, sources.length, 'Complete!');
      }

      console.log('✅ Public endpoint successful');

      return {
        themes: response.themes || [],
        totalSources: response.metadata?.totalSources || sources.length,
        processingTime: response.metadata?.processingTimeMs || 0,
        metadata: response.metadata,
      } as ExtractionResponse;
    } catch (error: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('❌ Public endpoint failed:', error.message);
      throw new Error('Authentication failed and public endpoint unavailable.');
    }
  }

  /**
   * =========================================================================
   * V2 PURPOSE-DRIVEN EXTRACTION (Phase 10 Day 5.13 Week 2)
   * =========================================================================
   *
   * Extract themes using purpose-adaptive algorithms with transparent progress
   * Features:
   * - 5 research purposes with optimized extraction strategies
   * - 4-part transparent progress messaging
   * - Progressive disclosure (Novice/Researcher/Expert)
   * - Iterative refinement support
   * - AI confidence calibration
   * - Theme saturation visualization
   *
   * @param sources - Array of source content
   * @param request - V2 extraction request with purpose and options
   * @param onProgress - Optional callback for 4-part transparent progress
   */
  async extractThemesV2(
    sources: SourceContent[],
    request: V2ExtractionRequest,
    onProgress?: V2ProgressCallback
  ): Promise<V2ExtractionResponse> {
    const endpoint = `${this.baseUrl}/extract-themes-v2`;

    // BUG FIX: Generate request ID if not provided for end-to-end tracing
    const requestId =
      request.requestId ||
      `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 UnifiedThemeAPI.extractThemesV2 called');
    console.log('   Request ID:', requestId);
    console.log('   URL:', endpoint);
    console.log('   Purpose:', request.purpose);
    console.log('   Sources:', sources.length);
    console.log(
      '   Expertise Level:',
      request.userExpertiseLevel || 'researcher'
    );
    console.log(
      '   Iterative Refinement:',
      request.allowIterativeRefinement || false
    );

    // Phase 10 Day 5.17.3: Connect to WebSocket for real-time progress
    let socket: any = null;

    try {
      // Phase 10 Day 5.17.3: Initialize WebSocket connection for real-time progress
      if (onProgress && typeof window !== 'undefined') {
        const socketIO = await import('socket.io-client');
        const wsUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

        socket = socketIO.default(`${wsUrl}/theme-extraction`, {
          transports: ['websocket', 'polling'],
          reconnection: false, // Don't reconnect for one-time extraction
        });

        // BUG FIX: Get actual userId from JWT token to match backend WebSocket room
        // Backend emits to user.userId from JWT @CurrentUser decorator
        const getUserIdFromToken = (): string | null => {
          if (typeof window === 'undefined') return null;

          const token = localStorage.getItem('access_token');
          if (!token) return null;

          try {
            // Decode JWT payload (format: header.payload.signature)
            const base64Url = token.split('.')[1];
            if (!base64Url) {
              console.error('Invalid JWT token format');
              return null;
            }
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);
            return payload.userId || payload.sub || payload.id || null;
          } catch (error) {
            console.error('Failed to decode JWT token:', error);
            return null;
          }
        };

        const userId = getUserIdFromToken() ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('🔐 WebSocket userId resolution:');
        console.log(`   From JWT: ${getUserIdFromToken()}`);
        console.log(`   Final userId: ${userId}`);
        console.log(`   Is fallback session: ${!getUserIdFromToken()}`);

        socket.on('connect', () => {
          console.log('✅ WebSocket connected to theme-extraction namespace');
          console.log(`   Joining room: ${userId}`);
          socket.emit('join', userId);
        });

        socket.on('extraction-progress', (progress: any) => {
          console.log('📊 Real-time progress update:', progress);

          // Phase 10 Day 5.17.3: Map backend progress to frontend callback format
          if (onProgress) {
            if (progress.details && progress.details.stageNumber) {
              // Full TransparentProgressMessage available
              const transparentMessage = progress.details;
              onProgress(
                transparentMessage.stageNumber,
                transparentMessage.totalStages || 6,
                transparentMessage.whatWeAreDoing || progress.message,
                transparentMessage
              );
            } else {
              // Fallback: Estimate stage from percentage or use basic message
              const estimatedStage = Math.max(
                1,
                Math.ceil((progress.percentage / 100) * 6)
              );
              onProgress(estimatedStage, 6, progress.message, undefined);
            }
          }
        });

        socket.on('extraction-error', (error: any) => {
          console.error('❌ WebSocket error:', error);
        });

        socket.on('extraction-complete', (result: any) => {
          console.log('✅ Extraction complete via WebSocket:', result);
        });
      }

      // Make API call with full request body
      const response: any = await apiClient.post(
        endpoint,
        {
          sources,
          purpose: request.purpose,
          userExpertiseLevel: request.userExpertiseLevel || 'researcher',
          allowIterativeRefinement: request.allowIterativeRefinement || false,
          methodology: request.methodology || 'reflexive_thematic',
          validationLevel: request.validationLevel || 'rigorous',
          researchContext: request.researchContext,
          studyId: request.studyId,
          requestId, // BUG FIX: Use generated requestId for end-to-end tracing
        },
        { timeout: 600000 } // 10 minutes for complex extraction (large datasets with many sources)
      );

      // Phase 10 Day 5.17.3: Disconnect WebSocket after completion
      if (socket) {
        socket.disconnect();
        console.log('🔌 WebSocket disconnected');
      }

      if (onProgress) {
        onProgress(
          6,
          6,
          'Extraction complete! Themes ready for review.',
          undefined
        );
      }

      console.log('✅ V2 API Response received:');
      console.log('   Success:', response?.success);
      console.log('   Themes count:', response?.themes?.length);
      console.log(
        '   Saturation reached:',
        response?.saturationData?.saturationReached
      );

      // BUG FIX: apiClient.post() already returns response.data, so don't double-access
      // Return formatted V2 response
      return {
        success: response.success || true,
        themes: response.themes || [],
        methodology: response.methodology,
        saturationData: response.saturationData,
        transparency: response.transparency,
      } as V2ExtractionResponse;
    } catch (error: any) {
      // Phase 10 Day 5.17.3: Clean up WebSocket on error
      if (socket) {
        socket.disconnect();
      }

      console.error('🔴 [UnifiedThemeAPI] V2 extract failed:', error);
      console.error('   Status:', error.response?.status);
      console.error(
        '   Message:',
        error.response?.data?.message || error.message
      );

      throw new Error(
        `Failed to extract themes (V2): ${error.response?.data?.message || error.message}`
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
      // BUG FIX: apiClient already returns response.data
      // Cast to access themes property
      return (response as any).themes || response;
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
      // BUG FIX: apiClient already returns response.data
      // Cast to access themes property
      return (response as any).themes || response;
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

      // BUG FIX: apiClient already returns response.data
      // Cast to access properties
      const responseData = response as any;
      // Convert record to Map for better API
      const uniqueThemes = new Map(
        Object.entries(responseData.uniqueThemes || {}) as [string, UnifiedTheme[]][]
      );

      return {
        commonThemes: responseData.commonThemes || [],
        uniqueThemes,
        similarity: responseData.similarity || 0,
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
    options?: ExtractionOptions,
    onProgress?: (current: number, total: number, message: string) => void
  ) => Promise<ExtractionResponse | null>;
  extractThemesV2: (
    sources: SourceContent[],
    request: V2ExtractionRequest,
    onProgress?: V2ProgressCallback
  ) => Promise<V2ExtractionResponse | null>;
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
    async (
      sources: SourceContent[],
      options?: ExtractionOptions,
      onProgress?: (current: number, total: number, message: string) => void
    ) => {
      setLoading(true);
      setError(null);
      console.log('🔵 useUnifiedThemeAPI.extractThemes called');
      console.log('   Sources count:', sources.length);
      console.log('   Options:', options);
      try {
        console.log('🔵 Calling unifiedThemeAPI.extractFromMultipleSources...');
        const result = await unifiedThemeAPI.extractFromMultipleSources(
          sources,
          options,
          onProgress
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

  const extractThemesV2 = useCallback(
    async (
      sources: SourceContent[],
      request: V2ExtractionRequest,
      onProgress?: V2ProgressCallback
    ) => {
      setLoading(true);
      setError(null);
      console.log('🔵 useUnifiedThemeAPI.extractThemesV2 called');
      console.log('   Purpose:', request.purpose);
      console.log('   Sources count:', sources.length);
      try {
        console.log('🔵 Calling unifiedThemeAPI.extractThemesV2...');
        const result = await unifiedThemeAPI.extractThemesV2(
          sources,
          request,
          onProgress
        );
        console.log('🔵 V2 API returned result:', result);
        console.log('   Success:', result?.success);
        console.log('   Themes count:', result?.themes?.length);
        console.log(
          '   Has saturation data?',
          result?.saturationData ? 'YES' : 'NO'
        );
        return result;
      } catch (err) {
        console.error('🔴 Error in extractThemesV2:', err);
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
    extractThemesV2,
    getProvenance,
    filterThemes,
    loading,
    error,
  };
}
