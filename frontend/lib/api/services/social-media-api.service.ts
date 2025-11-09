/**
 * Social Media API Service
 * Enterprise-grade service for multi-platform social media research
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * Features:
 * - Multi-platform search (Instagram, TikTok, Twitter, Reddit, LinkedIn, Facebook)
 * - Cross-platform insights and analytics
 * - Sentiment analysis and trending topics
 * - Request cancellation and retry logic
 *
 * @module social-media-api.service
 */

import { BaseApiService, CancellableRequest, RequestOptions } from './base-api.service';

// ============================================================================
// Types
// ============================================================================

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'reddit'
  | 'linkedin'
  | 'facebook';

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  author: string;
  authorId: string;
  content: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
  url: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  relevanceScore?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  hashtags?: string[];
  mentions?: string[];
}

export interface SocialSearchParams {
  query: string;
  platforms: SocialPlatform[];
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
  sortBy?: 'relevance' | 'date' | 'engagement';
  includeMedia?: boolean;
  language?: string;
}

export interface SocialSearchResponse {
  posts: Record<SocialPlatform, SocialPost[]>;
  totalResults: Record<SocialPlatform, number>;
  nextTokens: Partial<Record<SocialPlatform, string>>;
}

export interface CrossPlatformInsights {
  totalPosts: number;
  platformBreakdown: Record<SocialPlatform, number>;
  topThemes: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendingTopics: string[];
  influencers: {
    name: string;
    platform: SocialPlatform;
    followers: number;
  }[];
  engagementMetrics: {
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    avgEngagementRate: number;
  };
  timeDistribution: {
    hour: number;
    count: number;
  }[];
}

export interface InfluencerProfile {
  id: string;
  username: string;
  platform: SocialPlatform;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  verified: boolean;
}

export interface TrendingTopic {
  topic: string;
  volume: number;
  platforms: SocialPlatform[];
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedHashtags: string[];
  peakTime: string;
}

// ============================================================================
// Social Media API Service Class
// ============================================================================

class SocialMediaApiService extends BaseApiService {
  private static instance: SocialMediaApiService;

  private constructor() {
    super('/social-media');
  }

  /**
   * Singleton instance
   */
  static getInstance(): SocialMediaApiService {
    if (!SocialMediaApiService.instance) {
      SocialMediaApiService.instance = new SocialMediaApiService();
    }
    return SocialMediaApiService.instance;
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Search posts across multiple social media platforms
   * Returns cancellable request for real-time abort support
   */
  searchPosts(
    params: SocialSearchParams,
    options?: RequestOptions
  ): CancellableRequest<SocialSearchResponse> {
    const requestId = `social-search-${Date.now()}`;

    return this.createCancellableRequest(requestId, async (signal) => {
      const response = await this.post<SocialSearchResponse>(
        '/search',
        params,
        { ...options, signal }
      );
      return response.data;
    });
  }

  /**
   * Search posts on a specific platform
   */
  searchPlatform(
    platform: SocialPlatform,
    query: string,
    params?: {
      maxResults?: number;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: 'relevance' | 'date' | 'engagement';
    },
    options?: RequestOptions
  ): CancellableRequest<{
    posts: SocialPost[];
    totalResults: number;
    nextToken?: string;
  }> {
    const requestId = `${platform}-search-${Date.now()}`;

    return this.createCancellableRequest(requestId, async (signal) => {
      const response = await this.post(
        `/${platform}/search`,
        { query, ...params },
        { ...options, signal }
      );
      return response.data as { posts: SocialPost[]; totalResults: number; nextToken?: string };
    });
  }

  /**
   * Get post by ID
   */
  async getPostById(
    platform: SocialPlatform,
    postId: string,
    options?: RequestOptions
  ): Promise<SocialPost> {
    const response = await this.get<SocialPost>(
      `/${platform}/posts/${postId}`,
      options
    );
    return response.data;
  }

  // ============================================================================
  // Cross-Platform Insights
  // ============================================================================

  /**
   * Generate cross-platform insights from posts
   * Returns cancellable request for computationally intensive operation
   */
  generateInsights(
    postIds: string[],
    options?: RequestOptions
  ): CancellableRequest<CrossPlatformInsights> {
    const requestId = `insights-${Date.now()}`;

    return this.createCancellableRequest(requestId, async (signal) => {
      const response = await this.post<CrossPlatformInsights>(
        '/insights/generate',
        { postIds },
        { ...options, signal, timeout: 60000 } // 60 second timeout
      );
      return response.data;
    });
  }

  /**
   * Get sentiment analysis for posts
   */
  async analyzeSentiment(
    postIds: string[],
    options?: RequestOptions
  ): Promise<Record<string, {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  }>> {
    const response = await this.post(
      '/analysis/sentiment',
      { postIds },
      options
    );
    return response.data as Record<string, { sentiment: 'positive' | 'neutral' | 'negative'; score: number; confidence: number }>;
  }

  /**
   * Extract themes from posts
   */
  async extractThemes(
    postIds: string[],
    params?: {
      minOccurrence?: number;
      maxThemes?: number;
    },
    options?: RequestOptions
  ): Promise<{
    themes: {
      name: string;
      frequency: number;
      keywords: string[];
      sentiment: string;
    }[];
  }> {
    const response = await this.post(
      '/analysis/themes',
      { postIds, ...params },
      options
    );
    return response.data as { themes: { name: string; frequency: number; keywords: string[]; sentiment: string }[] };
  }

  // ============================================================================
  // Influencer Operations
  // ============================================================================

  /**
   * Get influencer profile
   */
  async getInfluencerProfile(
    platform: SocialPlatform,
    username: string,
    options?: RequestOptions
  ): Promise<InfluencerProfile> {
    const response = await this.get<InfluencerProfile>(
      `/${platform}/influencers/${username}`,
      options
    );
    return response.data;
  }

  /**
   * Search influencers
   */
  async searchInfluencers(
    query: string,
    params?: {
      platforms?: SocialPlatform[];
      minFollowers?: number;
      maxFollowers?: number;
      verified?: boolean;
    },
    options?: RequestOptions
  ): Promise<{
    influencers: InfluencerProfile[];
    totalResults: number;
  }> {
    const response = await this.post(
      '/influencers/search',
      { query, ...params },
      options
    );
    return response.data as { influencers: InfluencerProfile[]; totalResults: number };
  }

  /**
   * Get influencer posts
   */
  async getInfluencerPosts(
    platform: SocialPlatform,
    username: string,
    params?: {
      maxResults?: number;
      dateFrom?: string;
      dateTo?: string;
    },
    options?: RequestOptions
  ): Promise<{
    posts: SocialPost[];
    totalResults: number;
  }> {
    const response = await this.get(
      `/${platform}/influencers/${username}/posts`,
      { ...options, params }
    );
    return response.data as { posts: SocialPost[]; totalResults: number };
  }

  // ============================================================================
  // Trending Topics
  // ============================================================================

  /**
   * Get trending topics across platforms
   */
  async getTrendingTopics(
    params?: {
      platforms?: SocialPlatform[];
      limit?: number;
      timeRange?: '1h' | '6h' | '24h' | '7d';
    },
    options?: RequestOptions
  ): Promise<{
    topics: TrendingTopic[];
  }> {
    const response = await this.post(
      '/trending/topics',
      params,
      options
    );
    return response.data as { topics: TrendingTopic[] };
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(
    platform: SocialPlatform,
    params?: {
      limit?: number;
      location?: string;
    },
    options?: RequestOptions
  ): Promise<{
    hashtags: {
      tag: string;
      volume: number;
      trend: 'rising' | 'stable' | 'falling';
    }[];
  }> {
    const response = await this.get(
      `/${platform}/trending/hashtags`,
      { ...options, params }
    );
    return response.data as { hashtags: { tag: string; volume: number; trend: 'rising' | 'stable' | 'falling' }[] };
  }

  // ============================================================================
  // Engagement Analytics
  // ============================================================================

  /**
   * Calculate engagement rate for posts
   */
  async calculateEngagementRate(
    postIds: string[],
    options?: RequestOptions
  ): Promise<Record<string, number>> {
    const response = await this.post(
      '/analytics/engagement',
      { postIds },
      options
    );
    return response.data as Record<string, number>;
  }

  /**
   * Get time distribution of posts
   */
  async getTimeDistribution(
    postIds: string[],
    params?: {
      groupBy?: 'hour' | 'day' | 'week';
    },
    options?: RequestOptions
  ): Promise<{
    distribution: {
      timestamp: string;
      count: number;
    }[];
  }> {
    const response = await this.post(
      '/analytics/time-distribution',
      { postIds, ...params },
      options
    );
    return response.data as { distribution: { timestamp: string; count: number }[] };
  }

  // ============================================================================
  // Export Operations
  // ============================================================================

  /**
   * Export posts to various formats
   */
  async exportPosts(
    postIds: string[],
    format: 'csv' | 'json' | 'xlsx',
    options?: RequestOptions
  ): Promise<Blob> {
    const response = await this.post<Blob>(
      '/export',
      { postIds, format },
      { ...options, responseType: 'blob' }
    );
    return response.data;
  }

  // ============================================================================
  // Request Cancellation Utilities
  // ============================================================================

  /**
   * Cancel all social media search requests
   */
  cancelAllSearches(): void {
    this.cancelAll();
  }

  /**
   * Cancel insights generation
   */
  cancelInsightsGeneration(): void {
    this.cancelAll();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const socialMediaApiService = SocialMediaApiService.getInstance();

// Export class for testing
export { SocialMediaApiService };
