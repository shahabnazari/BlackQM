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
  setTranscribedVideos: React.Dispatch<React.SetStateAction<TranscribedVideo[]>>;
  transcriptionOptions: TranscriptionOptions;
  setTranscriptionOptions: (
    options: TranscriptionOptions | ((prev: TranscriptionOptions) => TranscriptionOptions)
  ) => void;

  // Social media state
  socialPlatforms: string[];
  setSocialPlatforms: (platforms: string[]) => void;
  socialResults: any[];
  socialInsights: any | null;
  loadingSocial: boolean;

  // Search handlers
  handleSearchAlternativeSources: () => Promise<void>;
  handleSearchSocialMedia: () => Promise<void>;
  handleSearchAllSources: () => Promise<void>;

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
  const [transcribedVideos, setTranscribedVideos] = useState<TranscribedVideo[]>([]);
  const [transcriptionOptions, setTranscriptionOptions] =
    useState<TranscriptionOptions>(DEFAULT_TRANSCRIPTION_OPTIONS);

  // Social media state
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [socialResults, setSocialResults] = useState<any[]>([]);
  const [socialInsights, setSocialInsights] = useState<any | null>(null);
  const [loadingSocial, setLoadingSocial] = useState(false);

  // Prevent duplicate requests
  const isSearchingAlternativeRef = useRef(false);
  const isSearchingSocialRef = useRef(false);

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
        const youtubeResults = await literatureAPI.searchYouTubeWithTranscription(
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

          setTranscribedVideos((prev) => [...prev, ...newTranscriptions]);

          // Auto-switch to transcriptions tab
          onSwitchTab?.('transcriptions');
        }

        // Get results from other sources
        const otherSources = alternativeSources.filter((s) => s !== 'youtube');
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
    } catch (error) {
      console.error('❌ Alternative search error:', error);
      toast.error('Alternative sources search failed');
    } finally {
      setLoadingAlternative(false);
      isSearchingAlternativeRef.current = false;
    }
  }, [
    query,
    alternativeSources,
    transcriptionOptions,
    onSwitchTab,
  ]);

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

      setSocialResults(results);

      // Generate insights from results
      if (results.length > 0) {
        const insights = await literatureAPI.getSocialMediaInsights(results);
        setSocialInsights(insights);

        toast.success(
          `Found ${results.length} posts from ${socialPlatforms.length} platforms with sentiment analysis`
        );
      } else {
        toast.info(
          'No social media results found. Try different platforms or queries.'
        );
      }
    } catch (error) {
      console.error('❌ Social media search error:', error);
      toast.error('Social media search failed');
    } finally {
      setLoadingSocial(false);
      isSearchingSocialRef.current = false;
    }
  }, [query, socialPlatforms]);

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
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`✅ Master Search Complete: ${successful} succeeded, ${failed} failed`);

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

    // Search handlers
    handleSearchAlternativeSources,
    handleSearchSocialMedia,
    handleSearchAllSources,

    // Utilities
    clearAll,
    getTotalSourcesCount,
  };
}
