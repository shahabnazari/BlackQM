/**
 * Phase 10.100 Phase 3: Alternative Sources Service
 *
 * Handles searches across non-traditional academic sources:
 * - arXiv (preprints)
 * - Patents
 * - GitHub (code repositories)
 * - Stack Overflow (technical discussions)
 * - YouTube (educational videos with transcription)
 * - Podcasts (iTunes/Apple Podcasts)
 *
 * Extracted from literature.service.ts to enforce Single Responsibility Principle.
 *
 * ARCHITECTURE:
 * - Each source has dedicated search method
 * - Parallel execution with Promise.allSettled for fault tolerance
 * - Graceful degradation (partial results on failures)
 * - Strict TypeScript typing (NO any types in business logic)
 *
 * @see backend/src/modules/literature/literature.service.ts (original location: lines 2533-3143)
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Parser from 'rss-parser';
import { TranscriptionService } from './transcription.service';
import { MultiMediaAnalysisService } from './multimedia-analysis.service';

/**
 * Alternative source search result (normalized format)
 * Phase 10.100 Strict Audit Fix: Exported for type safety in other modules
 */
export interface AlternativeSourceResult {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  url: string;
  source: 'arXiv' | 'Patents' | 'GitHub' | 'StackOverflow' | 'YouTube' | 'Podcast';
  type: 'preprint' | 'patent' | 'repository' | 'discussion' | 'video' | 'audio';
  metadata?: Record<string, unknown>;
}

/**
 * YouTube channel information
 * Phase 10.100 Strict Audit Fix: Exported for type safety in other modules
 */
export interface YouTubeChannelInfo {
  channelId: string;
  channelName: string;
  channelHandle: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  verified: boolean;
}

/**
 * YouTube video result
 * Phase 10.100 Strict Audit Fix: Exported for type safety in other modules
 */
export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // seconds
  viewCount: number;
  publishedAt: Date;
  tags: string[];
}

/**
 * YouTube channel videos response
 * Phase 10.100 Strict Audit Fix: Exported for type safety in other modules
 */
export interface YouTubeChannelVideosResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  hasMore: boolean;
}

/**
 * YouTube search with transcription options
 * Phase 10.100 Strict Audit Fix: Exported for type safety in other modules
 */
export interface YouTubeTranscriptionOptions {
  includeTranscripts?: boolean;
  extractThemes?: boolean;
  maxResults?: number;
}

@Injectable()
export class AlternativeSourcesService {
  private readonly logger = new Logger(AlternativeSourcesService.name);
  // Phase 10.106 Phase 5: Store API key via ConfigService (NestJS best practice)
  private readonly youtubeApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TranscriptionService))
    private readonly transcriptionService: TranscriptionService,
    @Inject(forwardRef(() => MultiMediaAnalysisService))
    private readonly multimediaAnalysisService: MultiMediaAnalysisService,
  ) {
    // Phase 10.106 Phase 5: Load API key once at initialization (Netflix-grade)
    this.youtubeApiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
  }

  /**
   * Search across multiple alternative sources in parallel
   *
   * @param query Search query
   * @param sources List of source identifiers to search
   * @param _userId User ID (for logging/analytics, not used in search)
   * @returns Combined results from all sources
   */
  async searchAlternativeSources(
    query: string,
    sources: string[],
    _userId: string,
  ): Promise<AlternativeSourceResult[]> {
    // Phase 10.100 Strict Audit Fix SEC-1: Defensive input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be non-empty string');
    }

    if (!Array.isArray(sources) || sources.length === 0) {
      throw new Error('Invalid sources: must be non-empty array');
    }

    const validSources = ['arxiv', 'patents', 'github', 'stackoverflow', 'youtube', 'podcasts'];
    const invalidSources = sources.filter((s: string): boolean => !validSources.includes(s));
    if (invalidSources.length > 0) {
      throw new Error(`Invalid sources: ${invalidSources.join(', ')}. Valid sources: ${validSources.join(', ')}`);
    }

    const results: AlternativeSourceResult[] = [];
    const searchPromises: Promise<AlternativeSourceResult[]>[] = [];

    // Execute searches in parallel based on requested sources
    if (sources.includes('arxiv')) {
      searchPromises.push(this.searchArxivPreprints(query));
    }
    if (sources.includes('patents')) {
      searchPromises.push(this.searchPatents(query));
    }
    if (sources.includes('github')) {
      searchPromises.push(this.searchGitHub(query));
    }
    if (sources.includes('stackoverflow')) {
      searchPromises.push(this.searchStackOverflow(query));
    }
    if (sources.includes('youtube')) {
      searchPromises.push(this.searchYouTube(query));
    }
    if (sources.includes('podcasts')) {
      searchPromises.push(this.searchPodcasts(query));
    }

    try {
      const allResults = await Promise.allSettled(searchPromises);
      for (const result of allResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value);
        }
      }

      this.logger.log(
        `Alternative sources search found ${results.length} results across ${sources.length} sources`,
      );

      return results;
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Alternative sources search failed: ${errorMessage}`);
      return results; // Return partial results
    }
  }

  /**
   * Search arXiv preprints database
   *
   * @param query Search query
   * @returns Preprint results
   */
  private async searchArxivPreprints(query: string): Promise<AlternativeSourceResult[]> {
    try {
      const url = 'http://export.arxiv.org/api/query';
      const params = {
        search_query: `all:${query}`,
        max_results: 20,
        sortBy: 'relevance',
        sortOrder: 'descending',
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      // Parse XML response (basic implementation)
      const data: string = response.data;
      const entries: string[] = data.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      return entries.map((entry: string): AlternativeSourceResult => {
        const title: string = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const summary: string = entry.match(/<summary>(.*?)<\/summary>/)?.[1] || '';
        const id: string = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
        const published: string =
          entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
        const authors: string[] =
          entry
            .match(/<author>[\s\S]*?<name>(.*?)<\/name>/g)
            ?.map((a: string): string => a.match(/<name>(.*?)<\/name>/)?.[1] || '') ||
          [];

        return {
          id,
          title: title.trim(),
          authors,
          year: published ? new Date(published).getFullYear() : null,
          abstract: summary.trim(),
          url: id,
          source: 'arXiv',
          type: 'preprint',
        };
      });
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`arXiv search failed: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Search patents database (Google Patents API)
   * Currently returns empty array - requires API key configuration
   *
   * @param _query Search query
   * @returns Patent results (empty until API key configured)
   */
  private async searchPatents(_query: string): Promise<AlternativeSourceResult[]> {
    try {
      // Google Patents Custom Search API (requires API key)
      // For now, return empty array with a note
      this.logger.warn(
        'Patent search requires Google Patents API key - not configured',
      );
      return [];
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Patent search failed: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Search GitHub repositories
   *
   * @param query Search query
   * @returns Repository results
   */
  private async searchGitHub(query: string): Promise<AlternativeSourceResult[]> {
    try {
      const url = `https://api.github.com/search/repositories`;
      const params = {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 10,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );

      interface GitHubRepo {
        id: number;
        full_name: string;
        owner: { login: string };
        created_at: string;
        description: string | null;
        html_url: string;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
      }

      return response.data.items.map((repo: GitHubRepo): AlternativeSourceResult => ({
        id: repo.id.toString(),
        title: repo.full_name,
        authors: [repo.owner.login],
        year: repo.created_at ? new Date(repo.created_at).getFullYear() : null,
        abstract: repo.description || '',
        url: repo.html_url,
        source: 'GitHub',
        type: 'repository',
        metadata: {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
        },
      }));
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`GitHub search failed: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Search Stack Overflow discussions
   *
   * @param query Search query
   * @returns Discussion/question results
   */
  private async searchStackOverflow(query: string): Promise<AlternativeSourceResult[]> {
    try {
      const url = 'https://api.stackexchange.com/2.3/search';
      const params = {
        order: 'desc',
        sort: 'relevance',
        intitle: query,
        site: 'stackoverflow',
        pagesize: 10,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      interface StackOverflowItem {
        question_id: number;
        title: string;
        owner?: { display_name?: string };
        creation_date: number;
        body_markdown?: string;
        excerpt?: string;
        link: string;
        score: number;
        answer_count: number;
        view_count: number;
        tags: string[];
      }

      if (response.data && response.data.items) {
        return response.data.items.map((item: StackOverflowItem): AlternativeSourceResult => ({
          id: item.question_id.toString(),
          title: item.title,
          authors: [item.owner?.display_name || 'Anonymous'],
          year: item.creation_date
            ? new Date(item.creation_date * 1000).getFullYear()
            : null,
          abstract: item.body_markdown || item.excerpt || '',
          url: item.link,
          source: 'StackOverflow',
          type: 'discussion',
          metadata: {
            score: item.score,
            answerCount: item.answer_count,
            viewCount: item.view_count,
            tags: item.tags,
          },
        }));
      }

      return [];
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`StackOverflow search failed: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Search YouTube videos (requires API key in .env)
   *
   * @param query Search query
   * @returns Video results
   */
  private async searchYouTube(query: string): Promise<AlternativeSourceResult[]> {
    try {
      // Phase 10.106 Phase 5: Use instance property instead of process.env (NestJS best practice)
      if (this.youtubeApiKey && this.youtubeApiKey !== 'your-youtube-api-key-here') {
        // Use YouTube Data API v3 for proper search
        const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
        const params = {
          key: this.youtubeApiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: 10,
          order: 'relevance',
        };

        const response = await firstValueFrom(
          this.httpService.get(searchUrl, { params }),
        );

        interface YouTubeSearchItem {
          id: { videoId: string };
          snippet: {
            title: string;
            description: string;
            channelTitle: string;
            channelId: string;
            publishedAt: string;
            thumbnails: Record<string, { url: string }>;
          };
        }

        if (response.data && response.data.items) {
          return response.data.items.map((item: YouTubeSearchItem): AlternativeSourceResult => ({
            id: item.id.videoId,
            title: item.snippet.title,
            authors: [item.snippet.channelTitle],
            year: new Date(item.snippet.publishedAt).getFullYear(),
            abstract: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            source: 'YouTube',
            type: 'video',
            metadata: {
              channelId: item.snippet.channelId,
              publishedAt: item.snippet.publishedAt,
              thumbnails: item.snippet.thumbnails,
            },
          }));
        }
      }

      // API key not configured - return empty array with error log
      this.logger.error(
        'YouTube API key not configured. Add YOUTUBE_API_KEY to .env file.',
      );
      this.logger.error(
        'Get your free API key at: https://console.cloud.google.com/apis/credentials',
      );
      return [];
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      const errorStack: string | undefined =
        error instanceof Error ? error.stack : undefined;
      this.logger.error(`YouTube search failed: ${errorMessage}`, errorStack);
      return [];
    }
  }

  /**
   * Get YouTube channel information by ID, handle (@username), or URL
   *
   * Supports:
   * - Channel ID: UC...
   * - Handle: @username
   * - URL: https://youtube.com/channel/UC...
   *
   * @param channelIdentifier Channel ID, handle, or URL
   * @returns Channel information
   * @throws Error if channel not found or API key not configured
   */
  async getYouTubeChannel(channelIdentifier: string): Promise<YouTubeChannelInfo> {
    try {
      // Phase 10.106 Phase 5: Use instance property instead of process.env (NestJS best practice)
      if (!this.youtubeApiKey || this.youtubeApiKey === 'your-youtube-api-key-here') {
        throw new Error('YouTube API key not configured');
      }

      // Parse channel identifier
      let channelId = channelIdentifier;
      let isHandle = false;

      // Extract from URL if provided
      if (channelIdentifier.includes('youtube.com/channel/')) {
        const match = channelIdentifier.match(/channel\/([^/?]+)/);
        channelId = match?.[1] || channelIdentifier;
      } else if (channelIdentifier.includes('youtube.com/@')) {
        const match = channelIdentifier.match(/@([^/?]+)/);
        channelId = match?.[1] || channelIdentifier;
        isHandle = true;
      } else if (channelIdentifier.startsWith('@')) {
        channelId = channelIdentifier.slice(1);
        isHandle = true;
      }

      // If it's a handle, first resolve to channel ID
      if (
        isHandle ||
        (!channelId.startsWith('UC') && channelId.length !== 24)
      ) {
        const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
        const searchParams = {
          key: this.youtubeApiKey,
          q: channelId,
          part: 'snippet',
          type: 'channel',
          maxResults: 1,
        };

        const searchResponse = await firstValueFrom(
          this.httpService.get(searchUrl, { params: searchParams }),
        );

        if (searchResponse.data?.items?.[0]) {
          channelId = searchResponse.data.items[0].id.channelId;
        } else {
          throw new Error('Channel not found');
        }
      }

      // Get channel details
      const channelUrl = 'https://www.googleapis.com/youtube/v3/channels';
      const channelParams = {
        key: this.youtubeApiKey,
        id: channelId,
        part: 'snippet,statistics,brandingSettings',
      };

      const channelResponse = await firstValueFrom(
        this.httpService.get(channelUrl, { params: channelParams }),
      );

      if (!channelResponse.data?.items?.[0]) {
        throw new Error('Channel not found');
      }

      const channel = channelResponse.data.items[0];

      return {
        channelId: channel.id,
        channelName: channel.snippet.title,
        channelHandle:
          channel.snippet.customUrl ||
          `@${channel.snippet.title.replace(/\s+/g, '')}`,
        description: channel.snippet.description,
        thumbnailUrl:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.default.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        verified: channel.snippet.customUrl ? true : false, // Approximate verification
      };
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch YouTube channel: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get videos from a YouTube channel with pagination and filters
   *
   * @param channelId YouTube channel ID
   * @param options Pagination and filter options
   * @returns Videos with pagination metadata
   * @throws Error if API key not configured
   */
  async getChannelVideos(
    channelId: string,
    options: {
      page?: number;
      maxResults?: number;
      publishedAfter?: Date;
      publishedBefore?: Date;
      order?: 'date' | 'relevance' | 'viewCount';
    } = {},
  ): Promise<YouTubeChannelVideosResponse> {
    try {
      // Phase 10.106 Phase 5: Use instance property instead of process.env (NestJS best practice)
      if (!this.youtubeApiKey || this.youtubeApiKey === 'your-youtube-api-key-here') {
        throw new Error('YouTube API key not configured');
      }

      const maxResults = options.maxResults || 20;
      const order = options.order || 'date';

      const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
      const params: Record<string, unknown> = {
        key: this.youtubeApiKey,
        channelId: channelId,
        part: 'snippet',
        type: 'video',
        maxResults,
        order,
      };

      if (options.publishedAfter) {
        params.publishedAfter = options.publishedAfter.toISOString();
      }

      if (options.publishedBefore) {
        params.publishedBefore = options.publishedBefore.toISOString();
      }

      const response = await firstValueFrom(
        this.httpService.get(searchUrl, { params }),
      );

      if (!response.data?.items) {
        return { videos: [], hasMore: false };
      }

      // Get video details (duration, view count, etc.)
      const videoIds: string = response.data.items
        .map((item: { id: { videoId: string } }): string => item.id.videoId)
        .join(',');
      const videoDetailsUrl = 'https://www.googleapis.com/youtube/v3/videos';
      const videoDetailsParams = {
        key: this.youtubeApiKey,
        id: videoIds,
        part: 'contentDetails,statistics',
      };

      const detailsResponse = await firstValueFrom(
        this.httpService.get(videoDetailsUrl, { params: videoDetailsParams }),
      );

      const videoDetailsMap = new Map(
        detailsResponse.data.items?.map((item: { id: string }): [string, unknown] => [item.id, item]) || [],
      );

      const videos: YouTubeVideo[] = response.data.items.map((item: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          thumbnails: { medium?: { url: string }; default: { url: string } };
        };
      }): YouTubeVideo => {
        const details: {
          contentDetails?: { duration: string };
          statistics?: { viewCount: string };
          snippet?: { tags?: string[] };
        } | undefined = videoDetailsMap.get(item.id.videoId) as
          | { contentDetails?: { duration: string }; statistics?: { viewCount: string }; snippet?: { tags?: string[] } }
          | undefined;
        const duration = this.parseYouTubeDuration(
          details?.contentDetails?.duration || 'PT0S',
        );

        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl:
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default.url,
          duration, // in seconds
          viewCount: parseInt(details?.statistics?.viewCount || '0'),
          publishedAt: new Date(item.snippet.publishedAt),
          tags: details?.snippet?.tags || [],
        };
      });

      return {
        videos,
        nextPageToken: response.data.nextPageToken,
        hasMore: !!response.data.nextPageToken,
      };
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch channel videos: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Parse YouTube ISO 8601 duration to seconds
   *
   * @example
   * PT1H2M30S -> 3750 seconds
   * PT30M -> 1800 seconds
   * PT45S -> 45 seconds
   *
   * @param duration ISO 8601 duration string
   * @returns Duration in seconds
   */
  private parseYouTubeDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Enhanced YouTube search with optional transcription and theme extraction
   *
   * Phase 9 Day 18 feature
   *
   * @param query Search query
   * @param options Transcription and analysis options
   * @returns Video results with optional transcripts and themes
   */
  async searchYouTubeWithTranscription(
    query: string,
    options: YouTubeTranscriptionOptions = {},
  ): Promise<AlternativeSourceResult[]> {
    // First, get basic YouTube search results
    const videos = await this.searchYouTube(query);

    if (!options.includeTranscripts || videos.length === 0) {
      return videos;
    }

    // Process each video for transcription and theme extraction
    const processedVideos: AlternativeSourceResult[] = [];
    for (const video of videos.slice(0, options.maxResults || 10)) {
      try {
        // Get or create transcription (cached if exists)
        const transcript =
          await this.transcriptionService.getOrCreateTranscription(
            video.id,
            'youtube',
          );

        // Attach transcript to video result
        const enhancedVideo: AlternativeSourceResult = {
          ...video,
          metadata: {
            ...video.metadata,
            transcript: {
              id: transcript.id,
              text: transcript.transcript,
              duration: transcript.duration,
              confidence: transcript.confidence,
              cost: transcript.cost,
              timestampedText: transcript.timestampedText,
            },
          },
        };

        // Extract themes if requested
        if (options.extractThemes && transcript) {
          const themes =
            await this.multimediaAnalysisService.extractThemesFromTranscript(
              transcript.id,
              query,
            );

          const citations =
            await this.multimediaAnalysisService.getCitationsForTranscript(
              transcript.id,
            );

          enhancedVideo.metadata = {
            ...enhancedVideo.metadata,
            themes,
            citations,
          };
        }

        processedVideos.push(enhancedVideo);
      } catch (error: unknown) {
        const errorMessage: string =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to process video ${video.id}: ${errorMessage}`);
        // Include video without transcription
        processedVideos.push({
          ...video,
          metadata: {
            ...video.metadata,
            transcriptionError: errorMessage,
          },
        });
      }
    }

    return processedVideos;
  }

  /**
   * Search podcasts via iTunes/Apple Podcasts API
   * Fetches RSS feeds for episode transcripts
   *
   * @param query Search query
   * @returns Podcast episode results
   */
  private async searchPodcasts(query: string): Promise<AlternativeSourceResult[]> {
    try {
      // Use iTunes Search API (free, no authentication required)
      // https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
      const searchUrl = 'https://itunes.apple.com/search';
      const params = {
        term: query,
        media: 'podcast',
        limit: 10,
        entity: 'podcast',
      };

      const response = await firstValueFrom(
        this.httpService.get(searchUrl, { params }),
      );

      if (
        !response.data ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        return [];
      }

      const parser = new Parser();
      const results: AlternativeSourceResult[] = [];

      interface PodcastSearchResult {
        feedUrl?: string;
        collectionName: string;
        artistName?: string;
        collectionViewUrl: string;
      }

      interface FeedItem {
        guid?: string;
        link?: string;
        title?: string;
        content?: string;
        description?: string;
        pubDate?: string;
        itunes?: { duration?: string };
      }

      // Process each podcast and fetch its RSS feed for episode details
      for (const podcast of response.data.results.slice(0, 5) as PodcastSearchResult[]) {
        try {
          // Fetch the RSS feed to get episode transcripts/descriptions
          const feedUrl = podcast.feedUrl;

          if (feedUrl) {
            const feed = await parser.parseURL(feedUrl);

            // Process episodes and look for transcript information
            const episodes: FeedItem[] = feed.items.slice(0, 3); // Get latest 3 episodes per podcast

            for (const episode of episodes) {
              // Extract transcript from episode description or content
              const content: string = episode.content || episode.description || '';
              const hasTranscript: boolean = content.length > 200; // Assume substantial content includes transcript

              if (hasTranscript) {
                results.push({
                  id: episode.guid || episode.link || '',
                  title: `${podcast.collectionName}: ${episode.title}`,
                  authors: [podcast.artistName || 'Unknown Host'],
                  year: episode.pubDate
                    ? new Date(episode.pubDate).getFullYear()
                    : null,
                  abstract: content.substring(0, 500).replace(/<[^>]*>/g, ''), // Strip HTML, first 500 chars
                  url: episode.link || podcast.collectionViewUrl,
                  source: 'Podcast',
                  type: 'audio',
                  metadata: {
                    podcastName: podcast.collectionName,
                    episodeTitle: episode.title,
                    duration: episode.itunes?.duration || null,
                    publishDate: episode.pubDate,
                    feedUrl: feedUrl,
                    fullContent: content.replace(/<[^>]*>/g, ''), // Full episode description
                  },
                });
              }
            }
          }
        } catch (feedError: unknown) {
          // Some feeds might be inaccessible or malformed
          const errorMessage: string =
            feedError instanceof Error ? feedError.message : String(feedError);
          this.logger.debug(
            `Failed to parse podcast feed for ${podcast.collectionName}: ${errorMessage}`,
          );
        }
      }

      return results;
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Podcast search failed: ${errorMessage}`);
      return [];
    }
  }
}
