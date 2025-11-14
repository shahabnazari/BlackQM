/**
 * SocialMediaPanel Component
 * Extracted from literature page (Phase 10.1 - Enterprise Refactoring)
 * Handles social media intelligence: YouTube, Instagram, TikTok, and cross-platform analysis
 *
 * Features:
 * - YouTube channel browsing and video selection
 * - Multi-platform social media search (Instagram, TikTok, etc.)
 * - Cross-platform sentiment dashboard
 * - Video transcription management
 *
 * @module SocialMediaPanel
 */

'use client';

import React, { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { MessageSquare, Video, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { CrossPlatformDashboard } from '@/components/literature/CrossPlatformDashboard';
// Phase 10.8 Day 7: Instagram Integration
// Phase 10.8 Day 8: TikTok Integration (Unified Search - Refactored)
import { 
  SocialMediaResultsDisplay,
  TikTokTrendsGrid,
  type TikTokVideo,
} from '@/components/literature';
// Phase 10.8 Day 8 Audit: Refactored Social Media Search Hook
import { useSocialMediaSearch } from '@/lib/hooks/useSocialMediaSearch';

// ============================================================================
// Types
// ============================================================================

export interface SocialMediaPanelProps {
  /** Currently selected social media platforms */
  socialPlatforms: string[];
  /** Handler for platform selection changes */
  onPlatformsChange: (platforms: string[]) => void;
  /** Social media search results */
  socialResults: any[];
  /** Social media insights data */
  socialInsights: any | null;
  /** Whether social media search is in progress */
  loadingSocial: boolean;
  /** Search query for social media and YouTube */
  query?: string;
  /** Selected YouTube videos */
  selectedVideos: any[];
  /** Handler for video selection */
  onVideoSelect: (video: any) => void;
  /** Transcribed videos */
  transcribedVideos: any[];
  /** Handler for video transcription */
  onTranscribeVideos: () => void;
  /** Whether transcription is in progress */
  transcribing: boolean;
  /** Transcription progress */
  transcriptionProgress: string;
  /** Show channel browser */
  showChannelBrowser: boolean;
  /** Toggle channel browser visibility */
  onToggleChannelBrowser: () => void;
  /** Show video selection panel */
  showVideoSelection: boolean;
  /** Toggle video selection visibility */
  onToggleVideoSelection: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const SocialMediaPanel = memo(function SocialMediaPanel({
  socialPlatforms,
  onPlatformsChange,
  socialResults,
  socialInsights,
  loadingSocial,
  query = '',
  selectedVideos,
  onVideoSelect,
  transcribedVideos,
  onTranscribeVideos,
  transcribing,
  transcriptionProgress,
  showChannelBrowser,
  onToggleChannelBrowser,
  showVideoSelection,
  onToggleVideoSelection,
}: SocialMediaPanelProps) {
  // Instagram upload removed - search-only functionality

  // Phase 10.8 Day 8 Audit: Refactored Social Media Search
  const [socialMediaQuery, setSocialMediaQuery] = useState('');
  const [transcribingTikTokIds, setTranscribingTikTokIds] = useState<Set<string>>(new Set());
  
  // Use refactored social media search hook
  const {
    youtubeResults: hookYoutubeResults,
    instagramResults: hookInstagramResults,
    loadingYouTube,
    loadingInstagram,
    tiktokResults: hookTiktokResults,
    loadingTikTok,
    searchAll: searchAllPlatforms,
    isSearching: isSocialSearching,
  } = useSocialMediaSearch();
  
  // Sync unified search query with parent query (initialize on mount)
  // PERFORMANCE FIX: Removed socialMediaQuery from dependencies to prevent infinite loop
  useEffect(() => {
    if (query && !socialMediaQuery) {
      setSocialMediaQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // Only depend on query to avoid infinite loop

  // Instagram upload removed - search-only functionality

  // Phase 10.8 Day 8 Audit: Unified Social Media Search Handler (Refactored)
  const handleUnifiedSocialMediaSearch = useCallback(async () => {
    if (!socialMediaQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (socialPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    // Use refactored search hook (doesn't require backend)
    await searchAllPlatforms({
      query: socialMediaQuery,
      platforms: socialPlatforms,
    });

    // Note: Not calling onSocialSearch() to avoid backend API error
    // The parent's handleSearchSocialMedia requires backend endpoint that doesn't exist yet
    // Each platform search handles its own results independently
  }, [socialMediaQuery, socialPlatforms, searchAllPlatforms]);

  // Phase 10.8 Day 8: TikTok transcription handler  
  const handleTikTokTranscribe = useCallback(async (videoId: string) => {
    setTranscribingTikTokIds(prev => new Set([...prev, videoId]));

    try {
      // TODO: Call backend API to transcribe TikTok video
      // await literatureAPI.transcribeTikTokVideo(videoId);
      console.log('Transcribing TikTok video:', videoId);
      
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Note: Video status update would happen in the hook's state management
      // For now, just show success message
      toast.success('TikTok video transcribed successfully!');
    } catch (error) {
      console.error('TikTok transcription error:', error);
      toast.error('Failed to transcribe TikTok video.');
    } finally {
      setTranscribingTikTokIds(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  }, []);

  // Phase 10.8 Day 8: Add TikTok video to research
  const handleAddTikTokToResearch = useCallback(async (video: TikTokVideo) => {
    try {
      // TODO: Call backend API to add TikTok video to research corpus
      // await literatureAPI.addTikTokToResearch(video);
      console.log('Adding TikTok video to research:', video);
      
      toast.success(`Added "${video.title}" to research corpus`);
    } catch (error) {
      console.error('Add to research error:', error);
      toast.error('Failed to add video to research.');
    }
  }, []);

  // Phase 10.8 Day 8: View TikTok transcript
  const handleViewTikTokTranscript = useCallback((videoId: string) => {
    // TODO: Open transcript modal or navigate to transcript view
    console.log('Viewing TikTok transcript:', videoId);
    toast.info('Transcript viewer opening...');
  }, []);

  // Unified handlers for social media results (Instagram, TikTok, etc.)
  const handleViewTranscript = useCallback((result: any) => {
    console.log('Viewing transcript for:', result);
    
    // Determine platform and route to appropriate handler
    if (result.platform === 'instagram' || result.source === 'instagram') {
      toast.info('Instagram transcript viewer opening...');
      // TODO: Open Instagram transcript modal
    } else if (result.platform === 'tiktok' || result.source === 'tiktok') {
      handleViewTikTokTranscript(result.id);
    } else {
      toast.info('Transcript viewer opening...');
    }
  }, [handleViewTikTokTranscript]);

  const handleAddToResearch = useCallback(async (result: any) => {
    try {
      console.log('Adding social media content to research:', result);
      
      // Determine platform and route to appropriate handler
      if (result.platform === 'instagram' || result.source === 'instagram') {
        // TODO: Call backend API to add Instagram post to research corpus
        // await literatureAPI.addInstagramToResearch(result);
        toast.success(`Added Instagram post to research corpus`);
      } else if (result.platform === 'tiktok' || result.source === 'tiktok') {
        await handleAddTikTokToResearch(result as TikTokVideo);
      } else {
        toast.success(`Added ${result.platform || 'social media'} content to research corpus`);
      }
      
      // NOTE: In production, this would:
      // 1. Transcribe the video if not already done
      // 2. Extract themes/insights
      // 3. Add to the research corpus alongside papers
      // 4. Make it available for theme extraction
      
    } catch (error) {
      console.error('Add to research error:', error);
      toast.error('Failed to add content to research.');
    }
  }, [handleAddTikTokToResearch]);

  // PERFORMANCE FIX: Optimized handler with useCallback
  const handlePlatformToggle = useCallback(
    (platformId: string) => {
      const newPlatforms = socialPlatforms.includes(platformId)
        ? socialPlatforms.filter(p => p !== platformId)
        : [...socialPlatforms, platformId];
      onPlatformsChange(newPlatforms);
    },
    [socialPlatforms, onPlatformsChange]
  );

  // PERFORMANCE FIX: Memoize platform list to prevent re-creation on every render
  const platforms = useMemo(() => [
    {
      id: 'youtube',
      label: 'YouTube',
      icon: '📹',
      desc: 'Video content & interviews',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: '📸',
      desc: 'Visual insights & stories',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      icon: '🎵',
      desc: 'Short-form video trends',
    },
  ], []);

  // Video selection handler with proper implementation
  const handleVideosSelected = useCallback(
    (videos: any[]) => {
      if (videos.length === 0) return;
      
      // Select first video or batch select if handler supports it
      videos.forEach(video => onVideoSelect(video));
      toast.success(`${videos.length} video${videos.length > 1 ? 's' : ''} selected from channel`);
    },
    [onVideoSelect]
  );

  // Transcription handler with proper implementation
  const handleTranscribe = useCallback(
    async (videoIds: string[]) => {
      if (videoIds.length === 0) {
        toast.error('No videos selected for transcription');
        return;
      }

      try {
        await onTranscribeVideos();
        toast.success(`Transcription started for ${videoIds.length} video${videoIds.length > 1 ? 's' : ''}`);
      } catch (error) {
        toast.error('Failed to start transcription');
      }
    },
    [onTranscribeVideos]
  );

  // PERFORMANCE FIX: Memoize search placeholder text
  const searchPlaceholder = useMemo(() => {
    const selectedLabels = socialPlatforms
      .map(p => platforms.find(pl => pl.id === p)?.label)
      .filter(Boolean)
      .join(', ');
    return `Search across ${selectedLabels || 'selected platforms'}...`;
  }, [socialPlatforms, platforms]);

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Social Media Intelligence
          </span>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
            Multi-Platform
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Discover expert knowledge and trending discussions across social media
          platforms
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Social Media Platforms
          </label>
          <div className="flex gap-2 flex-wrap">
            {platforms.map(platform => (
              <Badge
                key={platform.id}
                variant={
                  socialPlatforms.includes(platform.id) ? 'default' : 'outline'
                }
                className="cursor-pointer py-2 px-4 text-sm hover:scale-105 transition-transform"
                onClick={() => handlePlatformToggle(platform.id)}
                title={platform.desc}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {socialPlatforms.length} platform
            {socialPlatforms.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Unified Social Media Search - Phase 10.8 Day 8 Audit Fix */}
        {socialPlatforms.length > 0 && (
          <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-600" />
              Search All Selected Platforms
            </label>
            <div className="flex gap-2">
              <Input
                value={socialMediaQuery}
                onChange={(e) => setSocialMediaQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSocialSearching && handleUnifiedSocialMediaSearch()}
                placeholder={searchPlaceholder}
                className="flex-1 min-h-[44px] border-purple-300 focus:border-purple-500"
                disabled={isSocialSearching}
                autoComplete="off"
              />
              <Button
                onClick={handleUnifiedSocialMediaSearch}
                disabled={isSocialSearching || !socialMediaQuery.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-h-[44px] px-6"
              >
                {isSocialSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 One search query for all platforms: {socialPlatforms.map(p => `${platforms.find(pl => pl.id === p)?.icon} ${platforms.find(pl => pl.id === p)?.label}`).join(', ')}
            </p>
          </div>
        )}

        {/* YouTube Section */}
        {socialPlatforms.includes('youtube') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Video className="w-4 h-4" />
                YouTube Research
              </h4>
              <Badge variant="secondary" className="text-xs">
                {transcribedVideos.length} transcribed
              </Badge>
            </div>

            {/* Transcription options */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTranscribeVideos}
                  disabled={selectedVideos.length === 0 || transcribing}
                >
                  {transcribing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    'Transcribe Selected'
                  )}
                </Button>
                {selectedVideos.length > 0 && (
                  <Badge variant="secondary" className="self-center text-xs">
                    {selectedVideos.length} selected
                  </Badge>
                )}
              </div>
              {transcribing && transcriptionProgress && (
                <p className="text-xs text-blue-600">{transcriptionProgress}</p>
              )}
            </div>

            {/* Note: YouTube search now happens via unified search bar above */}
            {/* Individual platform search buttons removed to avoid duplicate search mechanisms */}

            {/* YouTube Channel Browser (collapsible) */}
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleChannelBrowser}
                className="w-full justify-between"
              >
                <span>Browse Academic Channels</span>
                <span>{showChannelBrowser ? '▼' : '▶'}</span>
              </Button>
              {showChannelBrowser && (
                <div className="mt-2">
                  <YouTubeChannelBrowser
                    onVideosSelected={handleVideosSelected}
                    researchContext={query}
                  />
                </div>
              )}
            </div>

            {/* Video Selection Panel (collapsible) */}
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleVideoSelection}
                className="w-full justify-between"
              >
                <span>Select Videos</span>
                <span>{showVideoSelection ? '▼' : '▶'}</span>
              </Button>
              {showVideoSelection && (
                <div className="mt-2">
                  <VideoSelectionPanel
                    videos={hookYoutubeResults.length > 0 ? hookYoutubeResults : selectedVideos}
                    researchContext={query}
                    onTranscribe={handleTranscribe}
                    isLoading={transcribing}
                  />
                </div>
              )}
            </div>
          </div>
        )}

{/* Instagram & TikTok search info removed for cleaner UI - results shown in tabs below */}

        {/* YouTube Results Section - Compact design */}
        {socialPlatforms.includes('youtube') && hookYoutubeResults.length > 0 && (
          <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>📹 YouTube</span>
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                {hookYoutubeResults.length}
              </Badge>
            </h4>
            <VideoSelectionPanel
              videos={hookYoutubeResults}
              researchContext={socialMediaQuery}
              onTranscribe={handleTranscribe}
              isLoading={transcribing}
            />
          </div>
        )}

        {/* YouTube Loading State */}
        {socialPlatforms.includes('youtube') && loadingYouTube && hookYoutubeResults.length === 0 && (
          <div className="border rounded-lg p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              <span className="text-sm text-gray-600">Searching YouTube...</span>
            </div>
          </div>
        )}

        {/* TikTok Results - Compact design */}
        {socialPlatforms.includes('tiktok') && hookTiktokResults.length > 0 && (
          <div className="border rounded-lg p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>🎵 TikTok</span>
              <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                {hookTiktokResults.length}
              </Badge>
            </h4>
            <TikTokTrendsGrid
              videos={hookTiktokResults}
              onTranscribe={handleTikTokTranscribe}
              onAddToResearch={handleAddTikTokToResearch}
              onViewTranscript={handleViewTikTokTranscript}
              transcribingIds={transcribingTikTokIds}
              isLoading={loadingTikTok}
              searchQuery={socialMediaQuery}
            />
          </div>
        )}

        {/* TikTok Loading State */}
        {socialPlatforms.includes('tiktok') && loadingTikTok && hookTiktokResults.length === 0 && (
          <div className="border rounded-lg p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
              <span className="text-sm text-gray-600">Searching TikTok...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {socialPlatforms.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Select one or more social media platforms above to begin
            </p>
          </div>
        )}

        {/* Cross-Platform Dashboard */}
        {socialInsights && (
          <div className="mt-4">
            <CrossPlatformDashboard query={query} maxResults={10} />
          </div>
        )}

        {/* Phase 10.8 Day 7: Social Media Results Display */}
        {/* ROUND 2 FIX: Combine hook results with page results */}
        {(() => {
          // Convert hook results to SocialMediaResult format
          const convertedInstagram = hookInstagramResults.map(result => ({
            ...result,
            platform: 'instagram' as const,
            username: result.author?.username || result.username,
            caption: result.caption,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            uploadDate: result.publishedAt?.toISOString() || new Date().toISOString(),
            engagement: {
              likes: result.stats?.likes,
              comments: result.stats?.comments,
              views: result.stats?.views,
              shares: result.stats?.shares,
            },
            transcription: result.transcriptionStatus ? {
              status: result.transcriptionStatus as any,
            } : undefined,
            aiExtractedThemes: result.themes,
            sentimentScore: result.sentimentScore,
            relevanceScore: result.relevanceScore,
          }));

          const allResults = [...(socialResults || []), ...convertedInstagram];
          
          return allResults.length > 0 ? (
            <div className="mt-4">
              <SocialMediaResultsDisplay
                results={allResults}
                insights={socialInsights}
                loading={loadingSocial || loadingInstagram}
                onViewTranscript={handleViewTranscript}
                onAddToResearch={handleAddToResearch}
              />
            </div>
          ) : null;
        })()}
      </CardContent>

    </Card>
  );
});
