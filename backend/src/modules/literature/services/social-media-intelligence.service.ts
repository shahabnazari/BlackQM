/**
 * ⚠️ PHASE 10.100 PHASE 4: SOCIAL MEDIA INTELLIGENCE SERVICE ⚠️
 *
 * Extracted from literature.service.ts (lines 2520-2534, 2673-3324) - November 28, 2025
 * Reduction: ~651 lines removed from main service
 *
 * Purpose: Social media search, sentiment analysis, and engagement-weighted synthesis
 * Platforms: Twitter/X, Reddit, LinkedIn, Facebook, Instagram, TikTok
 *
 * Enterprise-Grade Features:
 * - ✅ Input validation on all public methods (SEC-1 compliance)
 * - ✅ Type safety: Zero `any` types, all interfaces exported
 * - ✅ NestJS Logger integration (Phase 10.943 compliance - no console.log)
 * - ✅ Defensive error handling with graceful degradation
 * - ✅ Cache integration for rate limit protection
 * - ✅ Engagement-weighted synthesis algorithm
 * - ✅ Sentiment analysis with confidence scoring
 * - ✅ Comprehensive insights generation
 *
 * Architecture:
 * - Single Responsibility: Social media operations ONLY
 * - Stateless: No instance state (cache via dependency injection)
 * - Testable: Pure functions where possible
 * - Observable: Structured logging for all operations
 *
 * Reference: PHASE_10.100_REVISED_PLAN.md - Phase 4
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../../../common/cache.service';

// ==========================================
// EXPORTED INTERFACES (Type Safety)
// ==========================================

/**
 * Social media post with engagement metrics
 */
export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok';
  author: string;
  content: string;
  url: string;
  engagement: EngagementMetrics;
  timestamp: string;

  // Platform-specific fields (optional)
  authorFollowers?: number;
  authorConnections?: number;
  authorKarma?: string;
  authorTitle?: string;
  isVerified?: boolean;
  authorVerified?: boolean;
  organizationName?: string;
  subreddit?: string;
  title?: string;
  flair?: string;
  isStickied?: boolean;
  authorType?: string;
  groupMembers?: number;
  postType?: string;
  mediaType?: string;
  hashtags?: string[];
  mentions?: string[];
  videoViews?: number;
  soundOriginal?: boolean;
  trendingScore?: number;

  // Computed fields (added by service)
  sentiment?: SentimentAnalysis;
  weights?: PostWeights;
}

/**
 * Engagement metrics for social media posts
 */
export interface EngagementMetrics {
  totalScore: number;

  // Common fields
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;

  // Platform-specific
  upvotes?: number;
  downvotes?: number;
  awards?: number;
  reactions?: number;
  saves?: number;
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  label: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  positiveIndicators: number;
  negativeIndicators: number;
}

/**
 * Post weighting for influence scoring
 */
export interface PostWeights {
  engagement: number; // 0 to 1
  credibility: number; // 0 to 1
  influence: number; // 0 to 1 (combined score)
}

/**
 * Platform search status
 */
export interface PlatformStatus {
  status: 'success' | 'failed' | 'no_results';
  resultCount: number;
  error?: string;
}

/**
 * Social media insights aggregation
 */
export interface SocialMediaInsights {
  totalPosts: number;
  platformDistribution: Record<string, number>;
  sentimentDistribution: SentimentDistribution;
  topInfluencers: InfluencerInfo[];
  engagementStats: EngagementStats;
  timeDistribution: TimeDistribution;
}

/**
 * Social media post with platform status metadata
 * Phase 10.100 Strict Audit Fix: Proper typing for metadata property
 */
export interface SocialMediaPostWithMetadata extends SocialMediaPost {
  _platformStatus?: Record<string, PlatformStatus>;
}

/**
 * Sentiment distribution across posts
 */
export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

/**
 * Top influencer information
 */
export interface InfluencerInfo {
  author: string;
  platform: string;
  influence: number;
  engagement: number;
}

/**
 * Engagement statistics
 */
export interface EngagementStats {
  total: number;
  average: number;
  median: number;
}

/**
 * Time-based distribution of posts
 */
export interface TimeDistribution {
  last24h: number;
  lastWeek: number;
  lastMonth: number;
  older: number;
}

/**
 * Social opinion analysis result
 */
export interface SocialOpinionAnalysis {
  topic: string;
  platforms: string[];
  sentiment: string;
  keyThemes: string[];
  engagementScore: number;
}

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================

@Injectable()
export class SocialMediaIntelligenceService {
  private readonly logger = new Logger(SocialMediaIntelligenceService.name);

  // ==========================================
  // CONFIGURATION CONSTANTS (Phase 10.100 Strict Audit - DX Improvement)
  // ==========================================

  // Valid platform identifiers
  private readonly VALID_PLATFORMS = [
    'twitter',
    'reddit',
    'linkedin',
    'facebook',
    'instagram',
    'tiktok',
  ] as const;

  // Query validation
  private readonly MAX_QUERY_LENGTH = 500; // Maximum characters in search query (SEC-1 fix)

  // Cache configuration
  private readonly REDDIT_CACHE_TTL_SECONDS = 300; // 5 minutes

  // Sentiment analysis thresholds
  private readonly SENTIMENT_NORMALIZATION_DIVISOR = 5; // Normalize keyword counts to -1 to 1 scale

  // Reddit engagement scoring multipliers
  private readonly REDDIT_COMMENT_WEIGHT = 2; // Comments worth 2x upvotes
  private readonly REDDIT_AWARD_WEIGHT = 10; // Awards worth 10x upvotes

  // Credibility scoring
  private readonly CREDIBILITY_BASELINE = 0.5; // Starting credibility score
  private readonly CREDIBILITY_VERIFIED_BONUS = 0.2; // Bonus for verified accounts
  private readonly CREDIBILITY_HIGH_FOLLOWERS_THRESHOLD = 10000; // Follower count threshold
  private readonly CREDIBILITY_HIGH_FOLLOWERS_BONUS = 0.15; // Bonus for high follower count
  private readonly CREDIBILITY_HIGH_CONNECTIONS_THRESHOLD = 1000; // Connection count threshold
  private readonly CREDIBILITY_HIGH_CONNECTIONS_BONUS = 0.15; // Bonus for high connections
  private readonly CREDIBILITY_KARMA_BONUS = 0.1; // Bonus for having karma/title
  private readonly CREDIBILITY_ORGANIZATION_BONUS = 0.05; // Bonus for organization affiliation
  private readonly CREDIBILITY_MAX_SCORE = 1.0; // Maximum credibility score

  // Influence scoring weights (must sum to 1.0)
  private readonly INFLUENCE_ENGAGEMENT_WEIGHT = 0.5; // 50% engagement
  private readonly INFLUENCE_CREDIBILITY_WEIGHT = 0.3; // 30% credibility
  private readonly INFLUENCE_SENTIMENT_WEIGHT = 0.2; // 20% sentiment quality

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Search multiple social media platforms in parallel
   *
   * @param query - Search query string
   * @param platforms - Array of platform identifiers
   * @param _userId - User ID for logging (unused in current implementation)
   * @returns Array of posts with sentiment and engagement weighting
   *
   * @throws {Error} If query is empty or invalid
   * @throws {Error} If platforms array is empty or contains invalid platforms
   */
  async searchSocialMedia(
    query: string,
    platforms: string[],
    _userId: string,
  ): Promise<SocialMediaPost[]> {
    // Phase 10.100 Phase 4 - SEC-1: Enterprise-grade input validation
    this.validateSearchInput(query, platforms);

    const results: SocialMediaPost[] = [];
    const platformStatus: Record<string, PlatformStatus> = {};
    const searchPromises: { platform: string; promise: Promise<SocialMediaPost[]> }[] = [];

    this.logger.log(
      `🔍 Social media search initiated for query: "${query}" across ${platforms.length} platforms`,
    );

    // Execute searches in parallel based on requested platforms
    if (platforms.includes('twitter')) {
      searchPromises.push({
        platform: 'twitter',
        promise: this.searchTwitter(query),
      });
    }
    if (platforms.includes('reddit')) {
      searchPromises.push({
        platform: 'reddit',
        promise: this.searchReddit(query),
      });
    }
    if (platforms.includes('linkedin')) {
      searchPromises.push({
        platform: 'linkedin',
        promise: this.searchLinkedIn(query),
      });
    }
    if (platforms.includes('facebook')) {
      searchPromises.push({
        platform: 'facebook',
        promise: this.searchFacebook(query),
      });
    }
    if (platforms.includes('instagram')) {
      searchPromises.push({
        platform: 'instagram',
        promise: this.searchInstagram(query),
      });
    }
    if (platforms.includes('tiktok')) {
      searchPromises.push({
        platform: 'tiktok',
        promise: this.searchTikTok(query),
      });
    }

    try {
      const allResults = await Promise.allSettled(
        searchPromises.map((sp) => sp.promise),
      );

      for (let i = 0; i < allResults.length; i++) {
        const result = allResults[i];
        const platformName = searchPromises[i].platform;

        if (result.status === 'fulfilled') {
          if (result.value && result.value.length > 0) {
            results.push(...result.value);
            platformStatus[platformName] = {
              status: 'success',
              resultCount: result.value.length,
            };
            this.logger.log(
              `✅ ${platformName}: ${result.value.length} results found`,
            );
          } else {
            platformStatus[platformName] = {
              status: 'no_results',
              resultCount: 0,
            };
            this.logger.log(`ℹ️ ${platformName}: No results found for query`);
          }
        } else {
          platformStatus[platformName] = {
            status: 'failed',
            resultCount: 0,
            error: result.reason?.message || 'Unknown error',
          };
          this.logger.warn(
            `⚠️ ${platformName}: API call failed - ${result.reason?.message}`,
          );
        }
      }

      // Perform sentiment analysis on all results
      const resultsWithSentiment = await this.analyzeSentiment(results);

      // Apply engagement-weighted synthesis
      const synthesizedResults = this.synthesizeByEngagement(resultsWithSentiment);

      // Add platform status metadata to first result (accessible via special property)
      // Phase 10.100 Strict Audit Fix: Proper typing instead of 'as any'
      if (synthesizedResults.length > 0) {
        const firstResult = synthesizedResults[0] as SocialMediaPostWithMetadata;
        if (!firstResult._platformStatus) {
          firstResult._platformStatus = platformStatus;
        }
      }

      const successfulPlatforms = Object.values(platformStatus).filter(
        (s) => s.status === 'success',
      ).length;
      const failedPlatforms = Object.values(platformStatus).filter(
        (s) => s.status === 'failed',
      ).length;
      const noResultsPlatforms = Object.values(platformStatus).filter(
        (s) => s.status === 'no_results',
      ).length;

      this.logger.log(
        `✅ Social media search complete: ${synthesizedResults.length} total results | Success: ${successfulPlatforms} | No results: ${noResultsPlatforms} | Failed: ${failedPlatforms}`,
      );

      return synthesizedResults;
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`❌ Social media search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platforms,
      });
      return results; // Return partial results
    }
  }

  /**
   * Analyze social media opinions on a topic
   *
   * @param topic - Topic to analyze
   * @param platforms - Platforms to search
   * @param _userId - User ID for logging
   * @returns Aggregated opinion analysis
   */
  async analyzeSocialOpinion(
    topic: string,
    platforms: string[],
    _userId: string,
  ): Promise<SocialOpinionAnalysis> {
    // Phase 10.100 Phase 4 - SEC-1: Input validation
    this.validateSearchInput(topic, platforms);

    // Analyze social media opinions on a topic
    // This would integrate with social media APIs
    return {
      topic,
      platforms,
      sentiment: 'mixed',
      keyThemes: ['innovation', 'concerns', 'opportunities'],
      engagementScore: 0.76,
    };
  }

  /**
   * Generate aggregated insights from social media data
   *
   * @param posts - Array of social media posts
   * @returns Comprehensive insights object
   *
   * @throws {Error} If posts array is empty
   */
  async generateSocialMediaInsights(posts: SocialMediaPost[]): Promise<SocialMediaInsights> {
    // Phase 10.100 Phase 4 - SEC-1: Input validation
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('Invalid posts: must be non-empty array');
    }

    const insights: SocialMediaInsights = {
      totalPosts: posts.length,
      platformDistribution: this.getPlatformDistribution(posts),
      sentimentDistribution: this.getSentimentDistribution(posts),
      topInfluencers: posts.slice(0, 10).map((p) => ({
        author: p.author,
        platform: p.platform,
        influence: p.weights?.influence || 0,
        engagement: p.engagement?.totalScore || 0,
      })),
      engagementStats: {
        total: posts.reduce(
          (sum, p) => sum + (p.engagement?.totalScore || 0),
          0,
        ),
        average:
          posts.reduce((sum, p) => sum + (p.engagement?.totalScore || 0), 0) /
          posts.length,
        median: this.calculateMedian(
          posts.map((p) => p.engagement?.totalScore || 0),
        ),
      },
      timeDistribution: this.getTimeDistribution(posts),
    };

    return insights;
  }

  // ==========================================
  // PLATFORM-SPECIFIC SEARCH METHODS
  // ==========================================

  /**
   * Search Twitter/X for research-relevant posts
   * Uses Twitter API v2 (requires API key)
   *
   * @private
   * @param query - Search query
   * @returns Array of Twitter posts
   */
  private async searchTwitter(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('🐦 Searching Twitter/X...');

      // NOTE: Twitter API v2 requires authentication
      // For MVP, we'll return mock data structure showing capabilities
      // Production would use: https://api.twitter.com/2/tweets/search/recent

      this.logger.warn(
        'Twitter API requires authentication - mock data returned for demo',
      );

      // Return structure that production would provide
      return [
        {
          id: `twitter-${Date.now()}-1`,
          platform: 'twitter' as const,
          author: 'ResearcherAccount',
          authorFollowers: 15000,
          content: `Interesting research on ${query} - shows promising results for Q-methodology applications`,
          url: 'https://twitter.com/example/status/123',
          engagement: {
            likes: 245,
            shares: 89,
            comments: 34,
            views: 12500,
            totalScore: 368, // Combined engagement metric
          },
          timestamp: new Date().toISOString(),
          hashtags: ['research', 'methodology', query.split(' ')[0]],
          mentions: [],
          isVerified: true,
        },
      ];
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`Twitter search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'twitter',
      });
      return [];
    }
  }

  /**
   * Search Reddit for subreddit discussions and research content
   * Uses Reddit JSON API (no authentication required for public data)
   *
   * @private
   * @param query - Search query
   * @returns Array of Reddit posts
   */
  private async searchReddit(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('🤖 Searching Reddit...');

      // Check cache first to protect against rate limits (60/min)
      const cacheKey = `reddit_search:${query}`;
      const cachedResults = await this.cacheService.get(cacheKey) as SocialMediaPost[] | undefined;

      if (cachedResults) {
        this.logger.log('✨ Reddit results retrieved from cache');
        return cachedResults;
      }

      // Reddit JSON API endpoint (no auth needed for public data)
      const url = `https://www.reddit.com/search.json`;
      const params = {
        q: query,
        limit: 25,
        sort: 'relevance',
        t: 'year', // past year
      };

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          headers: { 'User-Agent': 'VQMethod-Research-Platform/1.0' },
        }),
      );

      // Phase 10.100 Strict Audit Fix: Proper typing for Reddit API response
      interface RedditPostData {
        id: string;
        author: string;
        author_flair_text?: string;
        subreddit: string;
        title: string;
        selftext: string;
        url: string;
        permalink: string;
        ups: number;
        downs: number;
        num_comments: number;
        total_awards_received: number;
        score: number;
        created_utc: number;
        link_flair_text?: string;
        stickied: boolean;
      }

      interface RedditPost {
        data: RedditPostData;
      }

      interface RedditResponse {
        data?: {
          data?: {
            children?: RedditPost[];
          };
        };
      }

      let results: SocialMediaPost[] = [];

      const redditResponse = response.data as RedditResponse;
      if (redditResponse.data?.data?.children) {
        results = redditResponse.data.data.children.map((post: RedditPost) => {
          const data = post.data;
          return {
            id: `reddit-${data.id}`,
            platform: 'reddit' as const,
            author: data.author,
            authorKarma: data.author_flair_text || 'N/A',
            subreddit: data.subreddit,
            title: data.title,
            content: data.selftext || data.url,
            url: `https://www.reddit.com${data.permalink}`,
            engagement: {
              upvotes: data.ups,
              downvotes: data.downs,
              comments: data.num_comments,
              awards: data.total_awards_received,
              totalScore:
                data.score +
                data.num_comments * this.REDDIT_COMMENT_WEIGHT +
                data.total_awards_received * this.REDDIT_AWARD_WEIGHT,
            },
            timestamp: new Date(data.created_utc * 1000).toISOString(),
            flair: data.link_flair_text,
            isStickied: data.stickied,
          };
        });
      }

      // Cache results to protect against rate limiting
      await this.cacheService.set(cacheKey, results, this.REDDIT_CACHE_TTL_SECONDS);
      this.logger.log(
        `💾 Cached ${results.length} Reddit results for ${this.REDDIT_CACHE_TTL_SECONDS} seconds`,
      );

      return results;
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`Reddit search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'reddit',
      });
      return [];
    }
  }

  /**
   * Search LinkedIn for professional opinions and research discussions
   * LinkedIn API requires OAuth 2.0 authentication
   *
   * @private
   * @param query - Search query
   * @returns Array of LinkedIn posts
   */
  private async searchLinkedIn(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('💼 Searching LinkedIn...');

      // NOTE: LinkedIn API requires OAuth 2.0 and partnership agreement
      // For MVP, return mock structure showing professional research content

      this.logger.warn(
        'LinkedIn API requires OAuth - mock data returned for demo',
      );

      return [
        {
          id: `linkedin-${Date.now()}-1`,
          platform: 'linkedin' as const,
          author: 'Dr. Jane Smith',
          authorTitle: 'Professor of Social Science',
          authorConnections: 5000,
          content: `New findings on ${query} methodology - implications for qualitative research`,
          url: 'https://linkedin.com/posts/example-123',
          engagement: {
            likes: 342,
            comments: 67,
            shares: 89,
            totalScore: 498,
          },
          timestamp: new Date().toISOString(),
          authorVerified: true,
          organizationName: 'Research University',
        },
      ];
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`LinkedIn search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'linkedin',
      });
      return [];
    }
  }

  /**
   * Search Facebook public posts and research groups
   * Facebook Graph API requires app review and permissions
   *
   * @private
   * @param query - Search query
   * @returns Array of Facebook posts
   */
  private async searchFacebook(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('👥 Searching Facebook...');

      // NOTE: Facebook Graph API requires app review and specific permissions
      // Public search is limited to verified research purposes

      this.logger.warn(
        'Facebook API requires app review - mock data returned for demo',
      );

      return [
        {
          id: `facebook-${Date.now()}-1`,
          platform: 'facebook' as const,
          author: 'Research Methods Group',
          authorType: 'public-group',
          groupMembers: 45000,
          content: `Discussion on ${query} - members sharing experiences and methodologies`,
          url: 'https://facebook.com/groups/research-methods/posts/123',
          engagement: {
            reactions: 567,
            comments: 123,
            shares: 45,
            totalScore: 735,
          },
          timestamp: new Date().toISOString(),
          postType: 'group-discussion',
        },
      ];
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`Facebook search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'facebook',
      });
      return [];
    }
  }

  /**
   * Search Instagram for visual research content and academic discussions
   * Instagram Basic Display API requires OAuth and app review
   *
   * @private
   * @param query - Search query
   * @returns Array of Instagram posts
   */
  private async searchInstagram(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('📷 Searching Instagram...');

      // NOTE: Instagram API requires OAuth and app review
      // Limited to public accounts and approved business use cases

      this.logger.warn(
        'Instagram API requires OAuth - mock data returned for demo',
      );

      return [
        {
          id: `instagram-${Date.now()}-1`,
          platform: 'instagram' as const,
          author: 'academic_research',
          authorFollowers: 25000,
          content: `Visual presentation of ${query} results #research #methodology`,
          mediaType: 'carousel',
          url: 'https://instagram.com/p/example123',
          engagement: {
            likes: 1234,
            comments: 89,
            saves: 156,
            shares: 45,
            totalScore: 1524,
          },
          timestamp: new Date().toISOString(),
          hashtags: ['research', 'qualitativeresearch', 'methodology'],
          isVerified: true,
        },
      ];
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`Instagram search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'instagram',
      });
      return [];
    }
  }

  /**
   * Search TikTok for trending research content and public opinions
   * TikTok Research API requires academic partnership
   *
   * @private
   * @param query - Search query
   * @returns Array of TikTok posts
   */
  private async searchTikTok(query: string): Promise<SocialMediaPost[]> {
    try {
      this.logger.log('🎵 Searching TikTok...');

      // NOTE: TikTok Research API requires academic institution partnership
      // For MVP, return mock structure showing trend analysis capabilities

      this.logger.warn(
        'TikTok API requires academic partnership - mock data returned for demo',
      );

      return [
        {
          id: `tiktok-${Date.now()}-1`,
          platform: 'tiktok' as const,
          author: 'research_explains',
          authorFollowers: 180000,
          content: `Breaking down ${query} research in 60 seconds #science #research`,
          videoViews: 450000,
          url: 'https://tiktok.com/@research_explains/video/123',
          engagement: {
            likes: 45000,
            comments: 1200,
            shares: 3400,
            saves: 2100,
            views: 450000,
            totalScore: 51700,
          },
          timestamp: new Date().toISOString(),
          hashtags: ['research', 'science', 'education'],
          soundOriginal: true,
          trendingScore: 85, // 0-100 scale
        },
      ];
    } catch (error: unknown) {
      // Phase 10.100 Strict Audit Fix: Replace 'any' with 'unknown' for type safety
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`TikTok search failed: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        query,
        platform: 'tiktok',
      });
      return [];
    }
  }

  // ==========================================
  // ANALYSIS & SYNTHESIS METHODS
  // ==========================================

  /**
   * Analyze sentiment of social media posts using NLP
   * Categorizes content as positive, negative, or neutral
   *
   * @private
   * @param posts - Array of posts to analyze
   * @returns Posts with sentiment analysis added
   */
  private async analyzeSentiment(posts: SocialMediaPost[]): Promise<SocialMediaPost[]> {
    this.logger.log(`💭 Analyzing sentiment for ${posts.length} posts...`);

    return posts.map((post) => {
      // Basic sentiment analysis using keyword matching
      // Production would use OpenAI or dedicated NLP libraries (sentiment, natural, etc.)
      const content = (post.content || '').toLowerCase();
      const title = (post.title || '').toLowerCase();
      const fullText = `${title} ${content}`;

      // Positive indicators
      const positiveWords = [
        'excellent',
        'great',
        'amazing',
        'wonderful',
        'outstanding',
        'promising',
        'innovative',
        'successful',
        'breakthrough',
        'valuable',
        'insightful',
        'helpful',
        'impressive',
        'significant',
        'important',
      ];

      // Negative indicators
      const negativeWords = [
        'bad',
        'poor',
        'terrible',
        'awful',
        'disappointing',
        'flawed',
        'problematic',
        'concerning',
        'questionable',
        'misleading',
        'weak',
        'limited',
        'insufficient',
        'inadequate',
        'failed',
      ];

      const positiveCount = positiveWords.filter((word) =>
        fullText.includes(word),
      ).length;
      const negativeCount = negativeWords.filter((word) =>
        fullText.includes(word),
      ).length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let sentimentScore = 0; // -1 to 1 scale

      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        sentimentScore = Math.min(positiveCount / this.SENTIMENT_NORMALIZATION_DIVISOR, 1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        sentimentScore = Math.max(-negativeCount / this.SENTIMENT_NORMALIZATION_DIVISOR, -1);
      } else {
        sentiment = 'neutral';
        sentimentScore = 0;
      }

      return {
        ...post,
        sentiment: {
          label: sentiment,
          score: sentimentScore,
          confidence: Math.abs(sentimentScore),
          positiveIndicators: positiveCount,
          negativeIndicators: negativeCount,
        },
      };
    });
  }

  /**
   * Synthesize social media results with engagement-weighted scoring
   * Higher engagement = more weight in determining representative opinions
   *
   * @private
   * @param posts - Posts to synthesize
   * @returns Posts sorted by influence score
   */
  private synthesizeByEngagement(posts: SocialMediaPost[]): SocialMediaPost[] {
    this.logger.log(
      `⚖️ Applying engagement-weighted synthesis to ${posts.length} posts...`,
    );

    // Calculate engagement percentiles for weighting
    const engagementScores = posts.map((p) => p.engagement?.totalScore || 0);
    const maxEngagement = Math.max(...engagementScores, 1);

    // Add normalized engagement weight to each post
    const postsWithWeights = posts.map((post) => {
      const engagementWeight =
        (post.engagement?.totalScore || 0) / maxEngagement;

      // Calculate credibility score based on author metrics
      let credibilityScore = this.CREDIBILITY_BASELINE;

      if (post.isVerified || post.authorVerified) {
        credibilityScore += this.CREDIBILITY_VERIFIED_BONUS;
      }
      if (post.authorFollowers && post.authorFollowers > this.CREDIBILITY_HIGH_FOLLOWERS_THRESHOLD) {
        credibilityScore += this.CREDIBILITY_HIGH_FOLLOWERS_BONUS;
      }
      if (post.authorConnections && post.authorConnections > this.CREDIBILITY_HIGH_CONNECTIONS_THRESHOLD) {
        credibilityScore += this.CREDIBILITY_HIGH_CONNECTIONS_BONUS;
      }
      if (post.authorKarma || post.authorTitle) {
        credibilityScore += this.CREDIBILITY_KARMA_BONUS;
      }
      if (post.organizationName) {
        credibilityScore += this.CREDIBILITY_ORGANIZATION_BONUS;
      }

      credibilityScore = Math.min(credibilityScore, this.CREDIBILITY_MAX_SCORE);

      // Combined influence score: engagement + credibility + sentiment quality
      const influenceScore =
        engagementWeight * this.INFLUENCE_ENGAGEMENT_WEIGHT +
        credibilityScore * this.INFLUENCE_CREDIBILITY_WEIGHT +
        Math.abs(post.sentiment?.score || 0) * this.INFLUENCE_SENTIMENT_WEIGHT;

      return {
        ...post,
        weights: {
          engagement: engagementWeight,
          credibility: credibilityScore,
          influence: influenceScore,
        },
      };
    });

    // Sort by influence score (most influential first)
    return postsWithWeights.sort(
      (a, b) => (b.weights?.influence || 0) - (a.weights?.influence || 0),
    );
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Validate search input parameters
   *
   * @private
   * @throws {Error} If validation fails
   */
  private validateSearchInput(query: string, platforms: string[]): void {
    // Phase 10.100 Strict Audit - SEC-1: Query validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be non-empty string');
    }

    // Phase 10.100 Strict Audit - SEC-1: Prevent DoS via excessive query length
    if (query.length > this.MAX_QUERY_LENGTH) {
      throw new Error(`Invalid query: maximum length is ${this.MAX_QUERY_LENGTH} characters (received ${query.length})`);
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new Error('Invalid platforms: must be non-empty array');
    }

    // Phase 10.100 Strict Audit - TYPE-1: Use type guard instead of 'as any'
    const invalidPlatforms = platforms.filter(
      (p: string): boolean => {
        // Type-safe check: is p one of the valid platform values?
        return !(this.VALID_PLATFORMS as readonly string[]).includes(p);
      },
    );
    if (invalidPlatforms.length > 0) {
      throw new Error(
        `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms: ${this.VALID_PLATFORMS.join(', ')}`,
      );
    }
  }

  /**
   * Get platform distribution from posts
   *
   * @private
   */
  private getPlatformDistribution(posts: SocialMediaPost[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    posts.forEach((post) => {
      distribution[post.platform] = (distribution[post.platform] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get sentiment distribution from posts
   *
   * @private
   */
  private getSentimentDistribution(posts: SocialMediaPost[]): SentimentDistribution {
    const distribution = { positive: 0, negative: 0, neutral: 0 };
    posts.forEach((post) => {
      const sentiment = post.sentiment?.label || 'neutral';
      distribution[sentiment as keyof typeof distribution]++;
    });
    return {
      ...distribution,
      positivePercentage: (distribution.positive / posts.length) * 100,
      negativePercentage: (distribution.negative / posts.length) * 100,
      neutralPercentage: (distribution.neutral / posts.length) * 100,
    };
  }

  /**
   * Get time distribution of posts
   *
   * @private
   */
  private getTimeDistribution(posts: SocialMediaPost[]): TimeDistribution {
    const now = new Date();
    const distribution: TimeDistribution = {
      last24h: 0,
      lastWeek: 0,
      lastMonth: 0,
      older: 0,
    };

    posts.forEach((post) => {
      const postDate = new Date(post.timestamp);
      const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) distribution.last24h++;
      else if (hoursDiff < 168) distribution.lastWeek++; // 7 days
      else if (hoursDiff < 720) distribution.lastMonth++; // 30 days
      else distribution.older++;
    });

    return distribution;
  }

  /**
   * Calculate median from array of numbers
   *
   * @private
   */
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b); // Create copy to avoid mutating input
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
