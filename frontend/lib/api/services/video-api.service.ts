/**
 * Video API Service
 * Enterprise-grade service for YouTube video search, retrieval, and transcription
 * Phase 10.1 Day 2 - Core Service Layer Refactoring
 *
 * Features:
 * - YouTube video search and discovery
 * - Video transcription and processing
 * - Channel and playlist management
 * - Request cancellation and retry logic
 *
 * @module video-api.service
 */

import { BaseApiService, CancellableRequest, RequestOptions } from './base-api.service';

// ============================================================================
// Types
// ============================================================================

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  relevanceScore?: number;
  tags?: string[];
  categoryId?: string;
}

export interface VideoSearchParams {
  query: string;
  maxResults?: number;
  pageToken?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  videoDuration?: 'short' | 'medium' | 'long' | 'any';
  sortBy?: 'relevance' | 'date' | 'viewCount' | 'rating';
  channelId?: string;
}

export interface VideoSearchResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcription {
  videoId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  generatedAt: string;
}

export interface TranscriptionParams {
  videoId: string;
  language?: string;
  timestamps?: boolean;
  speakerLabels?: boolean;
  autoDetectLanguage?: boolean;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
  channelId: string;
  channelTitle: string;
}

// ============================================================================
// Video API Service Class
// ============================================================================

class VideoApiService extends BaseApiService {
  private static instance: VideoApiService;

  private constructor() {
    super('/video');
  }

  /**
   * Singleton instance
   */
  static getInstance(): VideoApiService {
    if (!VideoApiService.instance) {
      VideoApiService.instance = new VideoApiService();
    }
    return VideoApiService.instance;
  }

  // ============================================================================
  // Video Search Operations
  // ============================================================================

  /**
   * Search YouTube videos
   * Returns cancellable request for real-time abort support
   */
  searchVideos(
    params: VideoSearchParams,
    options?: RequestOptions
  ): CancellableRequest<VideoSearchResponse> {
    const requestId = `video-search-${Date.now()}`;

    return this.createCancellableRequest(requestId, async (signal) => {
      const response = await this.post<VideoSearchResponse>(
        '/search',
        params,
        { ...options, signal }
      );
      return response.data;
    });
  }

  /**
   * Get video by ID
   */
  async getVideoById(
    videoId: string,
    options?: RequestOptions
  ): Promise<YouTubeVideo> {
    const response = await this.get<YouTubeVideo>(
      `/videos/${videoId}`,
      options
    );
    return response.data;
  }

  /**
   * Get videos by multiple IDs (batch operation)
   */
  async getVideosByIds(
    videoIds: string[],
    options?: RequestOptions
  ): Promise<YouTubeVideo[]> {
    const response = await this.post<YouTubeVideo[]>(
      '/videos/batch',
      { videoIds },
      options
    );
    return response.data;
  }

  // ============================================================================
  // Transcription Operations
  // ============================================================================

  /**
   * Get or generate transcription for a video
   * Returns cancellable request for long-running transcription operations
   */
  getTranscription(
    params: TranscriptionParams,
    options?: RequestOptions
  ): CancellableRequest<Transcription> {
    const requestId = `transcription-${params.videoId}`;

    return this.createCancellableRequest(requestId, async (signal) => {
      const response = await this.post<Transcription>(
        '/transcriptions/generate',
        params,
        { ...options, signal, timeout: 120000 } // 2 minute timeout
      );
      return response.data;
    });
  }

  /**
   * Check transcription status
   */
  async checkTranscriptionStatus(
    videoId: string,
    options?: RequestOptions
  ): Promise<{
    videoId: string;
    status: 'not_started' | 'processing' | 'completed' | 'failed';
    progress?: number;
  }> {
    const response = await this.get(
      `/transcriptions/${videoId}/status`,
      options
    );
    return response.data as { videoId: string; status: 'not_started' | 'processing' | 'completed' | 'failed'; progress?: number };
  }

  /**
   * Batch transcription for multiple videos
   */
  async batchTranscribe(
    videoIds: string[],
    params: Omit<TranscriptionParams, 'videoId'>,
    options?: RequestOptions
  ): Promise<{ jobId: string; videoIds: string[] }> {
    const response = await this.post<{ jobId: string; videoIds: string[] }>(
      '/transcriptions/batch',
      { videoIds, ...params },
      options
    );
    return response.data;
  }

  /**
   * Get batch transcription job status
   */
  async getBatchTranscriptionStatus(
    jobId: string,
    options?: RequestOptions
  ): Promise<{
    jobId: string;
    totalVideos: number;
    completed: number;
    failed: number;
    progress: number;
  }> {
    const response = await this.get(
      `/transcriptions/batch/${jobId}/status`,
      options
    );
    return response.data as { jobId: string; totalVideos: number; completed: number; failed: number; progress: number };
  }

  // ============================================================================
  // Channel Operations
  // ============================================================================

  /**
   * Get channel information
   */
  async getChannelInfo(
    channelId: string,
    options?: RequestOptions
  ): Promise<ChannelInfo> {
    const response = await this.get<ChannelInfo>(
      `/channels/${channelId}`,
      options
    );
    return response.data;
  }

  /**
   * Get videos from a channel
   */
  async getChannelVideos(
    channelId: string,
    params?: {
      maxResults?: number;
      pageToken?: string;
      sortBy?: 'date' | 'viewCount' | 'rating';
    },
    options?: RequestOptions
  ): Promise<VideoSearchResponse> {
    const response = await this.get<VideoSearchResponse>(
      `/channels/${channelId}/videos`,
      { ...options, params }
    );
    return response.data;
  }

  /**
   * Search channels
   */
  async searchChannels(
    query: string,
    params?: {
      maxResults?: number;
      pageToken?: string;
    },
    options?: RequestOptions
  ): Promise<{
    channels: ChannelInfo[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    const response = await this.get(
      `/channels/search?q=${encodeURIComponent(query)}`,
      { ...options, params }
    );
    return response.data as { channels: ChannelInfo[]; nextPageToken?: string; totalResults: number };
  }

  // ============================================================================
  // Playlist Operations
  // ============================================================================

  /**
   * Get playlist information
   */
  async getPlaylistInfo(
    playlistId: string,
    options?: RequestOptions
  ): Promise<Playlist> {
    const response = await this.get<Playlist>(
      `/playlists/${playlistId}`,
      options
    );
    return response.data;
  }

  /**
   * Get videos from a playlist
   */
  async getPlaylistVideos(
    playlistId: string,
    params?: {
      maxResults?: number;
      pageToken?: string;
    },
    options?: RequestOptions
  ): Promise<VideoSearchResponse> {
    const response = await this.get<VideoSearchResponse>(
      `/playlists/${playlistId}/videos`,
      { ...options, params }
    );
    return response.data;
  }

  // ============================================================================
  // Video Analysis
  // ============================================================================

  /**
   * Analyze video content for research relevance
   */
  async analyzeVideoRelevance(
    videoId: string,
    researchQuery: string,
    options?: RequestOptions
  ): Promise<{
    videoId: string;
    relevanceScore: number;
    keyTopics: string[];
    matchedKeywords: string[];
    summary: string;
  }> {
    const response = await this.post(
      '/analyze/relevance',
      { videoId, researchQuery },
      options
    );
    return response.data as { videoId: string; relevanceScore: number; keyTopics: string[]; matchedKeywords: string[]; summary: string };
  }

  /**
   * Extract key moments from video
   */
  async extractKeyMoments(
    videoId: string,
    options?: RequestOptions
  ): Promise<{
    videoId: string;
    moments: Array<{
      timestamp: number;
      duration: number;
      description: string;
      importance: number;
    }>;
  }> {
    const response = await this.post(
      '/analyze/moments',
      { videoId },
      options
    );
    return response.data as { videoId: string; moments: Array<{ timestamp: number; duration: number; description: string; importance: number }> };
  }

  // ============================================================================
  // Request Cancellation Utilities
  // ============================================================================

  /**
   * Cancel all video search requests
   */
  cancelAllSearches(): void {
    this.cancelAll();
  }

  /**
   * Cancel transcription for a specific video
   */
  cancelTranscription(videoId: string): void {
    this.cancel(`transcription-${videoId}`);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const videoApiService = VideoApiService.getInstance();

// Export class for testing
export { VideoApiService };
