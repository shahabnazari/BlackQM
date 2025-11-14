/**
 * Alternative Sources Hook - Phase 10.1 Day 5
 *
 * Enterprise-grade hook for managing alternative research sources.
 * Consolidates YouTube, social media, and alternative academic source logic.
 *
 * @module useAlternativeSources
 * @since Phase 10.1 Day 5
 * @author VQMethod Team
 *
 * **Features:**
 * - YouTube video search with optional transcription
 * - Social media platform search (Twitter, Reddit, TikTok, Instagram)
 * - Alternative academic sources (Google Scholar, CORE, etc.)
 * - Sentiment analysis for social media results
 * - Transcription cost tracking
 * - Multi-source orchestration
 * - TypeScript strict mode compliance
 *
 * **Usage:**
 * ```typescript
 * const {
 *   // Alternative sources
 *   alternativeSources,
 *   setAlternativeSources,
 *   alternativeResults,
 *   loadingAlternative,
 *   // YouTube & transcription
 *   youtubeVideos,
 *   transcribedVideos,
 *   transcriptionOptions,
 *   setTranscriptionOptions,
 *   // Social media
 *   socialPlatforms,
 *   setSocialPlatforms,
 *   socialResults,
 *   socialInsights,
 *   loadingSocial,
 *   // Handlers
 *   handleSearchAlternativeSources,
 *   handleSearchSocialMedia,
 *   handleSearchAllSources,
 * } = useAlternativeSources({
 *   query,
 *   mainSearchHandler: handleSearch,
 *   hasMainSources: academicDatabases.length > 0,
 * });
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { literatureAPI } from '@/lib/services/literature-api.service';
import type { SocialMediaResult } from '@/lib/types/literature.types';

/**
 * Transcription configuration options
 */
export interface TranscriptionOptions {
  /** Include video transcriptions in search */
  includeTranscripts: boolean;
  /** Extract themes from transcripts */
  extractThemes: boolean;
  /** Maximum number of results */
  maxResults: number;
}

/**
 * Transcribed video structure
 */
export interface TranscribedVideo {
  id: string;
  title: string;
  sourceId: string; // YouTube video ID
  url: string;
  channel?: string;
  duration: number; // in seconds
  cost: number; // transcription cost
  transcript: string;
  themes?: any[];
  extractedAt: string;
  cached: boolean;
}

/**
 * Hook configuration
 */
export interface UseAlternativeSourcesConfig {
  /** Current search query */
  query: string;
  /** Main search handler (for handleSearchAllSources) */
  mainSearchHandler?: () => Promise<void>;
  /** Whether main sources are selected (for handleSearchAllSources) */
  hasMainSources?: boolean;
  /** Number of main academic sources (for toast messages) */
  mainSourcesCount?: number;
  /** Callback when tab should switch */
  onSwitchTab?: (tab: string) => void;
}

/**
 * Return type for useAlternativeSources hook
 */
export interface UseAlternativeSourcesReturn {
  // Alternative sources state
  alternativeSources: string[];
  setAlternativeSources: (sources: string[]) => void;
  alternativeResults: any[];
  loadingAlternative: boolean;

  // YouTube & transcription state
  youtubeVideos: any[];
  setYoutubeVideos: React.Dispatch<React.SetStateAction<any[]>>;
  transcribedVideos: TranscribedVideo[];
  setTranscribedVideos: React.Dispatch<
    React.SetStateAction<TranscribedVideo[]>
  >;
  transcriptionOptions: TranscriptionOptions;
  setTranscriptionOptions: (
    options:
      | TranscriptionOptions
      | ((prev: TranscriptionOptions) => TranscriptionOptions)
  ) => void;

  // Social media state
  socialPlatforms: string[];
  setSocialPlatforms: (platforms: string[]) => void;
  socialResults: SocialMediaResult[];
  socialInsights: Record<string, unknown> | null;
  loadingSocial: boolean;

  // Phase 10.8 Day 9: Per-platform loading states
  loadingInstagram: boolean;
  loadingTikTok: boolean;

  // Search handlers
  handleSearchAlternativeSources: () => Promise<void>;
  handleSearchSocialMedia: () => Promise<void>;
  handleSearchAllSources: () => Promise<void>;

  // Phase 10.8 Day 9: AI Smart Curation functions
  calculateQualityScore: (result: SocialMediaResult, query: string) => number;
  getQualityTier: (score: number) => 'gold' | 'silver' | 'bronze' | null;

  // Utilities
  clearAll: () => void;
  getTotalSourcesCount: () => number;
}

// Default transcription options
const DEFAULT_TRANSCRIPTION_OPTIONS: TranscriptionOptions = {
  includeTranscripts: false,
  extractThemes: false,
  maxResults: 10,
};

/**
 * Hook for managing alternative research sources
 *
 * **Alternative Sources:**
 * - Google Scholar
 * - CORE (COnnecting REpositories)
 * - YouTube videos
 * - Social media platforms
 *
 * **Social Media Platforms:**
 * - Twitter/X (trending discussions)
 * - Reddit (community insights)
 * - TikTok (short-form video content)
 * - Instagram (visual research content)
 *
 * @param {UseAlternativeSourcesConfig} config - Configuration object
 * @returns {UseAlternativeSourcesReturn} Alternative sources state and operations
 */
export function useAlternativeSources(
  config: UseAlternativeSourcesConfig
): UseAlternativeSourcesReturn {
  const {
    query,
    mainSearchHandler,
    hasMainSources = false,
    mainSourcesCount = 0,
    onSwitchTab,
  } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  // Alternative academic sources
  const [alternativeSources, setAlternativeSources] = useState<string[]>([]);
  const [alternativeResults, setAlternativeResults] = useState<any[]>([]);
  const [loadingAlternative, setLoadingAlternative] = useState(false);

  // YouTube state
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [transcribedVideos, setTranscribedVideos] = useState<
    TranscribedVideo[]
  >([]);
  const [transcriptionOptions, setTranscriptionOptions] =
    useState<TranscriptionOptions>(DEFAULT_TRANSCRIPTION_OPTIONS);

  // Social media state
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [socialResults, setSocialResults] = useState<SocialMediaResult[]>([]);
  const [socialInsights, setSocialInsights] = useState<Record<string, unknown> | null>(null);
  const [loadingSocial, setLoadingSocial] = useState(false);

  // Phase 10.8 Day 9: Per-platform loading states
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [loadingTikTok, setLoadingTikTok] = useState(false);

  // Prevent duplicate requests
  const isSearchingAlternativeRef = useRef(false);
  const isSearchingSocialRef = useRef(false);

  // ===========================
  // Phase 10.8 Day 9: AI SMART CURATION
  // ===========================

  /**
   * Calculate AI quality score for social media content
   *
   * Factors:
   * 1. Engagement rate (likes+comments)/views (0-40 points)
   * 2. Creator credibility (followers, verified) (0-30 points)
   * 3. Semantic relevance to query (0-20 points)
   * 4. Recency (newer = higher) (0-10 points)
   *
   * @returns Quality score 0-100
   */
  const calculateQualityScore = useCallback((result: SocialMediaResult, query: string): number => {
    let score = 0;

    // Factor 1: Engagement Rate (0-40 points)
    const metadata = result.metadata as Record<string, any> | undefined;
    const views = metadata?.['viewCount'] || metadata?.['views'] || 0;
    const likes = metadata?.['likeCount'] || metadata?.['likes'] || 0;
    const comments = metadata?.['commentCount'] || metadata?.['comments'] || 0;

    if (views > 0) {
      const engagementRate = (likes + comments) / views;
      // 10% engagement = 40 points, scales linearly
      score += Math.min(40, engagementRate * 400);
    }

    // Factor 2: Creator Credibility (0-30 points)
    const followers = metadata?.['followerCount'] || metadata?.['followers'] || 0;
    const isVerified = metadata?.['verified'] || false;

    // Verified badge = 10 points
    if (isVerified) score += 10;

    // Followers (logarithmic scale): 1M followers = 20 points
    if (followers > 0) {
      score += Math.min(20, Math.log10(followers) * 3.33);
    }

    // Factor 3: Semantic Relevance (0-20 points)
    // Simple keyword matching (can be enhanced with embeddings later)
    const title = (result.title || '').toLowerCase();
    const description = (result.abstract || metadata?.['description'] || '').toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(w => w.length > 2);

    let matchCount = 0;
    queryWords.forEach(word => {
      if (title.includes(word)) matchCount += 2; // Title matches worth more
      if (description.includes(word)) matchCount += 1;
    });

    score += Math.min(20, matchCount * 2);

    // Factor 4: Recency (0-10 points)
    const publishDate = metadata?.['publishedAt'] || metadata?.['createdAt'] || result.year;
    if (publishDate) {
      const date = new Date(publishDate);
      const now = new Date();
      const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      // Content within 30 days = 10 points, decays linearly over 365 days
      if (daysSince < 30) {
        score += 10;
      } else if (daysSince < 365) {
        score += 10 * (1 - (daysSince - 30) / 335);
      }
    }

    return Math.min(100, Math.round(score));
  }, []);

  /**
   * Get quality tier based on score
   */
  const getQualityTier = useCallback((score: number): 'gold' | 'silver' | 'bronze' | null => {
    if (score >= 90) return 'gold';
    if (score >= 70) return 'silver';
    if (score >= 50) return 'bronze';
    return null;
  }, []);

  // ===========================
  // ALTERNATIVE SOURCES SEARCH
  // ===========================

  /**
   * Search alternative sources (YouTube, Google Scholar, etc.)
   *
   * **Features:**
   * - YouTube search with optional transcription
   * - Transcription caching (pay once per video)
   * - Cost tracking
   * - Theme extraction from transcripts
   * - Auto-switch to transcriptions tab
   */
  const handleSearchAlternativeSources = useCallback(async () => {
    // Input validation
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (alternativeSources.length === 0) {
      toast.error('Please select at least one alternative source');
      return;
    }

    // Prevent duplicate searches
    if (isSearchingAlternativeRef.current) {
      console.log(
        '⏳ Alternative search already in progress, skipping duplicate request...'
      );
      return;
    }

    isSearchingAlternativeRef.current = true;
    setLoadingAlternative(true);

    try {
      // Use enhanced YouTube search with transcription if enabled
      if (
        alternativeSources.includes('youtube') &&
        transcriptionOptions.includeTranscripts
      ) {
        const youtubeResults =
          await literatureAPI.searchYouTubeWithTranscription(
            query,
            transcriptionOptions
          );

        // Store transcribed videos separately
        if (
          youtubeResults.transcripts &&
          youtubeResults.transcripts.length > 0
        ) {
          const newTranscriptions = youtubeResults.transcripts.map(
            (transcript: any) => ({
              id: transcript.id || transcript.videoId,
              title: transcript.title || 'Untitled Video',
              sourceId: transcript.videoId,
              url: `https://www.youtube.com/watch?v=${transcript.videoId}`,
              channel: transcript.channel,
              duration: transcript.duration || 0,
              cost: transcript.cost || 0,
              transcript: transcript.transcript || transcript.text || '',
              themes: transcript.themes || [],
              extractedAt: transcript.extractedAt || new Date().toISOString(),
              cached: transcript.cached || false,
            })
          );

          setTranscribedVideos(prev => [...prev, ...newTranscriptions]);

          // Auto-switch to transcriptions tab
          onSwitchTab?.('transcriptions');
        }

        // Get results from other sources
        const otherSources = alternativeSources.filter(s => s !== 'youtube');
        let otherResults: any[] = [];
        if (otherSources.length > 0) {
          otherResults = await literatureAPI.searchAlternativeSources(
            query,
            otherSources
          );
        }

        const allResults = [...(youtubeResults.videos || []), ...otherResults];
        setAlternativeResults(allResults);

        // Extract YouTube videos for VideoSelectionPanel
        if (youtubeResults.videos && youtubeResults.videos.length > 0) {
          setYoutubeVideos(youtubeResults.videos);
        }

        // Show success message with cost if applicable
        if (youtubeResults.transcriptionCost) {
          toast.success(
            `Found ${allResults.length} results. ${youtubeResults.transcripts?.length || 0} videos transcribed ($${youtubeResults.transcriptionCost.toFixed(2)})`
          );
        } else {
          toast.success(`Found ${allResults.length} results`);
        }
      } else {
        // Standard search without transcription
        const results = await literatureAPI.searchAlternativeSources(
          query,
          alternativeSources
        );
        setAlternativeResults(results);

        // Extract YouTube videos if present
        if (alternativeSources.includes('youtube')) {
          const youtubeResults = results.filter(
            (r: any) => r.source === 'youtube'
          );
          if (youtubeResults.length > 0) {
            setYoutubeVideos(youtubeResults);
          }
        }

        toast.success(
          `Found ${results.length} results from ${alternativeSources.length} alternative sources`
        );
      }
    } catch (error: any) {
      console.error('❌ Alternative search error:', error);

      // Phase 10.8 Day 1: Enhanced error messages with source-specific details
      const failedSources: string[] = [];
      if (alternativeSources.includes('github') && error.message?.includes('GitHub')) {
        failedSources.push('GitHub (API rate limit or network error)');
      }
      if (alternativeSources.includes('stackoverflow') && error.message?.includes('StackOverflow')) {
        failedSources.push('StackOverflow (API quota exceeded)');
      }
      if (alternativeSources.includes('youtube') && error.message?.includes('YouTube')) {
        failedSources.push('YouTube (API key required or quota exceeded)');
      }
      if (alternativeSources.includes('podcasts') && error.message?.includes('Podcast')) {
        failedSources.push('Podcasts (RSS feed unavailable)');
      }

      if (failedSources.length > 0) {
        toast.error(
          `Alternative sources search failed: ${failedSources.join(', ')}`,
          {
            description: 'Some sources may still have returned results. Check the results panel below.',
            duration: 5000,
          }
        );
      } else {
        toast.error('Alternative sources search failed', {
          description: error.message || 'Unknown error occurred. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => handleSearchAlternativeSources(),
          },
          duration: 5000,
        });
      }
    } finally {
      setLoadingAlternative(false);
      isSearchingAlternativeRef.current = false;
    }
  }, [query, alternativeSources, transcriptionOptions, onSwitchTab]);

  // ===========================
  // SOCIAL MEDIA SEARCH
  // ===========================

  /**
   * Search social media platforms
   *
   * **Features:**
   * - Multi-platform search (Twitter, Reddit, TikTok, Instagram)
   * - Sentiment analysis
   * - Engagement-weighted synthesis
   * - Insights generation
   *
   * **Sentiment Analysis:**
   * - Positive/Neutral/Negative distribution
   * - Trending topics
   * - Key influencers
   */
  const handleSearchSocialMedia = useCallback(async () => {
    // Input validation
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (socialPlatforms.length === 0) {
      toast.error('Please select at least one social media platform');
      return;
    }

    // Prevent duplicate searches
    if (isSearchingSocialRef.current) {
      console.log(
        '⏳ Social media search already in progress, skipping duplicate request...'
      );
      return;
    }

    isSearchingSocialRef.current = true;
    setLoadingSocial(true);

    // Phase 10.8 Day 9: Set per-platform loading states
    if (socialPlatforms.includes('instagram')) setLoadingInstagram(true);
    if (socialPlatforms.includes('tiktok')) setLoadingTikTok(true);

    try {
      console.log(
        '🔍 Social Media Search:',
        query,
        'Platforms:',
        socialPlatforms
      );

      const results = await literatureAPI.searchSocialMedia(
        query,
        socialPlatforms
      );

      // Phase 10.8 Day 9: Apply AI quality scores to results
      const scoredResults = results.map(result => ({
        ...result,
        qualityScore: calculateQualityScore(result, query),
        qualityTier: getQualityTier(calculateQualityScore(result, query)),
      }));

      // Sort by quality score (highest first)
      scoredResults.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));

      setSocialResults(scoredResults);

      // Generate insights from results
      if (scoredResults.length > 0) {
        const insights = await literatureAPI.getSocialMediaInsights(scoredResults);
        setSocialInsights(insights);

        // Count high-quality results (score >= 70)
        const highQualityCount = scoredResults.filter(r => (r.qualityScore || 0) >= 70).length;

        toast.success(
          `Found ${scoredResults.length} posts (${highQualityCount} high-quality) from ${socialPlatforms.length} platforms`
        );
      } else {
        toast.info(
          'No social media results found. Try different platforms or queries.'
        );
      }
    } catch (error: any) {
      console.error('❌ Social media search error:', error);

      // Phase 10.8 Day 9: Platform-specific error messages
      const failedPlatforms: string[] = [];
      if (socialPlatforms.includes('instagram') && error.message?.includes('Instagram')) {
        failedPlatforms.push('Instagram (API rate limit)');
      }
      if (socialPlatforms.includes('tiktok') && error.message?.includes('TikTok')) {
        failedPlatforms.push('TikTok (API quota exceeded)');
      }
      if (socialPlatforms.includes('twitter') && error.message?.includes('Twitter')) {
        failedPlatforms.push('Twitter/X (API authentication required)');
      }

      if (failedPlatforms.length > 0) {
        toast.error(
          `Social media search failed: ${failedPlatforms.join(', ')}`,
          {
            description: 'Some platforms may still have returned results.',
            action: {
              label: 'Retry',
              onClick: () => handleSearchSocialMedia(),
            },
            duration: 5000,
          }
        );
      } else {
        toast.error('Social media search failed', {
          description: error.message || 'Unknown error occurred.',
          action: {
            label: 'Retry',
            onClick: () => handleSearchSocialMedia(),
          },
          duration: 5000,
        });
      }
    } finally {
      setLoadingSocial(false);
      setLoadingInstagram(false);
      setLoadingTikTok(false);
      isSearchingSocialRef.current = false;
    }
  }, [query, socialPlatforms, calculateQualityScore, getQualityTier]);

  // ===========================
  // MASTER SEARCH ORCHESTRATION
  // ===========================

  /**
   * Search all selected sources (main + alternative + social)
   *
   * **Master Orchestration:**
   * - Executes all searches in parallel
   * - Handles errors gracefully (Promise.allSettled)
   * - Provides unified success message
   * - Coordinates with main search handler
   *
   * **Search Priority:**
   * 1. Academic databases (main)
   * 2. Alternative sources (YouTube, Google Scholar)
   * 3. Social media platforms
   */
  const handleSearchAllSources = useCallback(async () => {
    // Input validation
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    const hasAltSources = alternativeSources.length > 0;
    const hasSocialSources = socialPlatforms.length > 0;

    if (!hasMainSources && !hasAltSources && !hasSocialSources) {
      toast.error('Please select at least one source to search');
      return;
    }

    console.log('🔍 Master Search: Searching all selected sources...');
    console.log('   Main sources:', hasMainSources);
    console.log('   Alternative sources:', hasAltSources);
    console.log('   Social media:', hasSocialSources);

    // Execute all searches in parallel (graceful error handling)
    const searchPromises: Promise<void>[] = [];

    if (hasMainSources && mainSearchHandler) {
      searchPromises.push(mainSearchHandler());
    }

    if (hasAltSources) {
      searchPromises.push(handleSearchAlternativeSources());
    }

    if (hasSocialSources) {
      searchPromises.push(handleSearchSocialMedia());
    }

    // Wait for all searches to complete (even if some fail)
    const results = await Promise.allSettled(searchPromises);

    // Count successful vs failed searches
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(
      `✅ Master Search Complete: ${successful} succeeded, ${failed} failed`
    );

    // Calculate total sources searched
    const totalSources =
      (hasMainSources ? mainSourcesCount : 0) +
      (hasAltSources ? alternativeSources.length : 0) +
      (hasSocialSources ? socialPlatforms.length : 0);

    toast.success(
      `🔍 Comprehensive search completed across ${totalSources} sources!`
    );
  }, [
    query,
    hasMainSources,
    mainSourcesCount,
    alternativeSources,
    socialPlatforms,
    mainSearchHandler,
    handleSearchAlternativeSources,
    handleSearchSocialMedia,
  ]);

  // ===========================
  // UTILITIES
  // ===========================

  /**
   * Clear all alternative sources state
   */
  const clearAll = useCallback(() => {
    setAlternativeResults([]);
    setYoutubeVideos([]);
    setTranscribedVideos([]);
    setSocialResults([]);
    setSocialInsights(null);
    setTranscriptionOptions(DEFAULT_TRANSCRIPTION_OPTIONS);
  }, []);

  /**
   * Get total count of alternative sources selected
   *
   * @returns {number} Total count
   */
  const getTotalSourcesCount = useCallback((): number => {
    return alternativeSources.length + socialPlatforms.length;
  }, [alternativeSources, socialPlatforms]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Alternative sources state
    alternativeSources,
    setAlternativeSources,
    alternativeResults,
    loadingAlternative,

    // YouTube & transcription state
    youtubeVideos,
    setYoutubeVideos,
    transcribedVideos,
    setTranscribedVideos,
    transcriptionOptions,
    setTranscriptionOptions,

    // Social media state
    socialPlatforms,
    setSocialPlatforms,
    socialResults,
    socialInsights,
    loadingSocial,

    // Phase 10.8 Day 9: Per-platform loading states
    loadingInstagram,
    loadingTikTok,

    // Search handlers
    handleSearchAlternativeSources,
    handleSearchSocialMedia,
    handleSearchAllSources,

    // Phase 10.8 Day 9: AI Smart Curation functions
    calculateQualityScore,
    getQualityTier,

    // Utilities
    clearAll,
    getTotalSourcesCount,
  };
}
