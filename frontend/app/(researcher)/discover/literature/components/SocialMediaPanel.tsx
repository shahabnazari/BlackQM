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

import React, { memo } from 'react';
import { MessageSquare, Video, Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { CrossPlatformDashboard } from '@/components/literature/CrossPlatformDashboard';

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
  /** Handler for searching social media */
  onSocialSearch: () => void;
  /** Search query for social media and YouTube */
  query?: string;
  /** YouTube search query */
  youtubeQuery: string;
  /** Handler for YouTube query changes */
  onYoutubeQueryChange: (query: string) => void;
  /** Whether YouTube search is in progress */
  searchingYouTube: boolean;
  /** YouTube search results */
  youtubeResults: any[];
  /** Handler for YouTube search */
  onYoutubeSearch: () => void;
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
  // socialResults, // TODO: Used by CrossPlatformDashboard in future implementation
  socialInsights,
  loadingSocial,
  onSocialSearch,
  query = '',
  // youtubeQuery, // TODO: Implement YouTube search functionality
  // onYoutubeQueryChange, // TODO: Implement YouTube search functionality
  // searchingYouTube, // TODO: Implement YouTube search functionality
  youtubeResults,
  // onYoutubeSearch, // TODO: Implement YouTube search functionality
  selectedVideos,
  // onVideoSelect, // TODO: Implement video selection functionality
  transcribedVideos,
  onTranscribeVideos,
  transcribing,
  transcriptionProgress,
  showChannelBrowser,
  onToggleChannelBrowser,
  showVideoSelection,
  onToggleVideoSelection,
}: SocialMediaPanelProps) {

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = socialPlatforms.includes(platformId)
      ? socialPlatforms.filter(p => p !== platformId)
      : [...socialPlatforms, platformId];
    onPlatformsChange(newPlatforms);
  };

  const platforms = [
    { id: 'youtube', label: 'YouTube', icon: '📹', desc: 'Video content & interviews' },
    { id: 'instagram', label: 'Instagram', icon: '📸', desc: 'Visual insights & stories' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', desc: 'Short-form video trends' },
  ];

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
          Discover expert knowledge and trending discussions across social media platforms
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
                variant={socialPlatforms.includes(platform.id) ? 'default' : 'outline'}
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
            {socialPlatforms.length} platform{socialPlatforms.length !== 1 ? 's' : ''} selected
          </p>
        </div>

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
                    onVideosSelected={(videos) => {
                      // TODO: Handle videos selected from channel browser
                      console.log('Videos selected:', videos);
                    }}
                    researchContext=""
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
                    videos={youtubeResults}
                    researchContext=""
                    onTranscribe={async (videoIds) => {
                      // TODO: Implement video transcription
                      console.log('Transcribe videos:', videoIds);
                      await onTranscribeVideos();
                    }}
                    isLoading={transcribing}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instagram Section */}
        {socialPlatforms.includes('instagram') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2">📸 Instagram Search</h4>
            <p className="text-xs text-gray-600 mb-2">
              Search for visual insights, expert stories, and community discussions
            </p>
            <p className="text-xs text-gray-500">
              Coming soon: Instagram API integration for visual content analysis
            </p>
          </div>
        )}

        {/* TikTok Section */}
        {socialPlatforms.includes('tiktok') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <h4 className="text-sm font-semibold mb-2">🎵 TikTok Trends</h4>
            <p className="text-xs text-gray-600 mb-2">
              Discover trending topics and short-form expert content
            </p>
            <p className="text-xs text-gray-500">
              Coming soon: TikTok API integration for trend analysis
            </p>
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

        {/* Search Button */}
        {socialPlatforms.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={onSocialSearch}
              disabled={loadingSocial}
              variant="default"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loadingSocial ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching Social Media...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Social Media
                </>
              )}
            </Button>
          </div>
        )}

        {/* Cross-Platform Dashboard */}
        {socialInsights && (
          <div className="mt-4">
            <CrossPlatformDashboard
              query={query}
              maxResults={10}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
