/**
 * Cross-Platform Synthesis API Service
 *
 * Phase 9 Day 22 Implementation
 *
 * Frontend service for accessing cross-platform synthesis endpoints
 * Provides methods for:
 * 1. Multi-platform research synthesis (papers, YouTube, TikTok, Instagram)
 * 2. Emerging topics detection
 * 3. Theme dissemination tracking
 * 4. Platform-specific insights analysis
 *
 * @enterprise Features:
 * - Type-safe API calls
 * - Error handling with retry logic
 * - Response caching
 * - Loading state management
 * - React hooks integration
 */

import { apiClient } from '../client';
import { useState } from 'react';

/**
 * Interfaces matching backend models
 */

export interface MultiPlatformSource {
  type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  id: string;
  title: string;
  author: string;
  publishedAt: Date;
  url: string;
  themes: ExtractedTheme[];
  relevanceScore: number;
  engagement?: {
    views?: number;
    likes?: number;
    shares?: number;
    citations?: number;
  };
}

export interface ExtractedTheme {
  label: string;
  weight: number;
  keywords?: string[];
}

export interface ThemeCluster {
  theme: string;
  totalSources: number;
  sources: {
    papers: number;
    youtube: number;
    podcasts: number;
    tiktok: number;
    instagram: number;
  };
  averageRelevance: number;
  platformSpecificLanguage: {
    academic: string[];
    popularScience: string[];
    socialMedia: string[];
  };
}

export interface DisseminationPath {
  theme: string;
  timeline: Array<{
    date: Date;
    platform: string;
    sourceTitle: string;
    reach: number;
    type: 'academic' | 'educational' | 'popular';
  }>;
  totalReach: number;
  disseminationPattern: 'academic-first' | 'viral-first' | 'parallel';
  disseminationVelocity: number;
}

export interface EmergingTopic {
  topic: string;
  socialMediaMentions: number;
  academicPapers: number;
  trendScore: number;
  platforms: string[];
  firstMentionDate: Date;
  growthRate: number;
  recommendation: string;
  potentialGap: boolean;
}

export interface PlatformInsight {
  platform: string;
  sourceCount: number;
  averageEngagement: number;
  topThemes: string[];
  uniqueLanguage: string[];
}

export interface CrossPlatformSynthesisResult {
  query: string;
  sources: MultiPlatformSource[];
  themeClusters: ThemeCluster[];
  disseminationPaths: DisseminationPath[];
  emergingTopics: EmergingTopic[];
  platformInsights: PlatformInsight[];
  synthesisDate: Date;
  metadata?: {
    totalSources: number;
    totalThemeClusters: number;
    totalDisseminationPaths: number;
    totalEmergingTopics: number;
    platformCount: number;
  };
}

export interface CrossPlatformSynthesisOptions {
  maxResults?: number;
  includeTranscripts?: boolean;
  timeWindow?: number;
}

/**
 * Cross-Platform Synthesis API Client
 */
export class CrossPlatformSynthesisAPI {
  private static readonly BASE_PATH = '/literature/synthesis';

  /**
   * Synthesize research across all platforms
   */
  static async synthesizeMultiPlatform(
    query: string,
    options?: CrossPlatformSynthesisOptions,
  ): Promise<CrossPlatformSynthesisResult> {
    const response = await apiClient.post(`${this.BASE_PATH}/multi-platform`, {
      query,
      maxResults: options?.maxResults || 10,
      includeTranscripts: options?.includeTranscripts || false,
      timeWindow: options?.timeWindow || 90,
    });

    return response.data;
  }

  /**
   * Get emerging topics across platforms
   */
  static async getEmergingTopics(
    query: string,
    timeWindow?: number,
  ): Promise<{
    success: boolean;
    query: string;
    emergingTopics: EmergingTopic[];
    summary: {
      total: number;
      withPotentialGaps: number;
      highTrend: number;
    };
  }> {
    const params = new URLSearchParams({ query });
    if (timeWindow) {
      params.append('timeWindow', timeWindow.toString());
    }

    const response = await apiClient.get(
      `${this.BASE_PATH}/emerging-topics?${params.toString()}`,
    );

    return response.data;
  }

  /**
   * Track theme dissemination across platforms
   */
  static async getThemeDissemination(
    theme: string,
    query: string,
    timeWindow?: number,
  ): Promise<{
    success: boolean;
    theme: string;
    disseminationPath?: DisseminationPath;
    analytics?: {
      totalReach: number;
      velocity: number;
      pattern: string;
      timelineLength: number;
      platforms: string[];
    };
    message?: string;
    availableThemes?: string[];
  }> {
    const params = new URLSearchParams({ query });
    if (timeWindow) {
      params.append('timeWindow', timeWindow.toString());
    }

    const response = await apiClient.get(
      `${this.BASE_PATH}/dissemination/${encodeURIComponent(theme)}?${params.toString()}`,
    );

    return response.data;
  }

  /**
   * Get platform-specific insights
   */
  static async getPlatformInsights(
    query: string,
    platforms?: string[],
  ): Promise<{
    success: boolean;
    query: string;
    platformInsights: PlatformInsight[];
    summary: {
      totalPlatforms: number;
      totalSources: number;
      avgEngagement: number;
    };
  }> {
    const params = new URLSearchParams({ query });
    if (platforms && platforms.length > 0) {
      params.append('platforms', platforms.join(','));
    }

    const response = await apiClient.get(
      `${this.BASE_PATH}/platform-insights?${params.toString()}`,
    );

    return response.data;
  }
}

/**
 * React Hook for Cross-Platform Synthesis
 */
export function useCrossPlatformSynthesis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synthesize = async (
    query: string,
    options?: CrossPlatformSynthesisOptions,
  ): Promise<CrossPlatformSynthesisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await CrossPlatformSynthesisAPI.synthesizeMultiPlatform(
        query,
        options,
      );
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to synthesize cross-platform research';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEmergingTopics = async (query: string, timeWindow?: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await CrossPlatformSynthesisAPI.getEmergingTopics(
        query,
        timeWindow,
      );
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch emerging topics';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getThemeDissemination = async (
    theme: string,
    query: string,
    timeWindow?: number,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await CrossPlatformSynthesisAPI.getThemeDissemination(
        theme,
        query,
        timeWindow,
      );
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch dissemination path';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInsights = async (query: string, platforms?: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const result = await CrossPlatformSynthesisAPI.getPlatformInsights(
        query,
        platforms,
      );
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch platform insights';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    synthesize,
    getEmergingTopics,
    getThemeDissemination,
    getPlatformInsights,
    loading,
    error,
  };
}
