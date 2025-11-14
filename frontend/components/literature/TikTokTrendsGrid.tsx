/**
 * TikTokTrendsGrid Component
 * Phase 10.8 Day 8 - TikTok Integration
 * 
 * Enterprise-grade TikTok trends grid with:
 * - Responsive masonry layout
 * - Multi-criteria filtering (engagement, relevance, trending)
 * - Advanced sorting (viral score, recency, engagement rate)
 * - Statistics dashboard
 * - Empty states with guidance
 * 
 * @module TikTokTrendsGrid
 * @since Phase 10.8 Day 8
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import {
  Filter,
  TrendingUp,
  Heart,
  Sparkles,
  BarChart3,
  SortAsc,
  Eye,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TikTokVideoCard, TikTokVideo } from './TikTokVideoCard';

// ============================================================================
// Types
// ============================================================================

export interface TikTokTrendsGridProps {
  /** Videos to display */
  videos: TikTokVideo[];
  /** Handler for transcribe action */
  onTranscribe?: (videoId: string) => void;
  /** Handler for add to research action */
  onAddToResearch?: (video: TikTokVideo) => void;
  /** Handler for view transcript action */
  onViewTranscript?: (videoId: string) => void;
  /** Currently transcribing video IDs */
  transcribingIds?: Set<string>;
  /** Whether the grid is loading */
  isLoading?: boolean;
  /** Search query for empty state */
  searchQuery?: string;
}

type SortOption = 'viral' | 'recent' | 'engagement' | 'relevance' | 'trending';
type FilterOption = 'all' | 'trending' | 'high-engagement' | 'verified' | 'transcribed';

// ============================================================================
// Utility Functions
// ============================================================================

function calculateViralScore(video: TikTokVideo): number {
  const { views, likes, comments, shares } = video.stats;
  const engagementRate = views > 0 ? ((likes + comments * 2 + shares * 3) / views) * 100 : 0;
  
  // Viral score considers:
  // - Engagement rate (40%)
  // - Total engagement volume (30%)
  // - View count (20%)
  // - Recency bonus (10%)
  const totalEngagement = likes + comments + shares;
  const normalizedEngagement = Math.min(totalEngagement / 100000, 1); // Cap at 100k
  const normalizedViews = Math.min(views / 1000000, 1); // Cap at 1M
  
  const publishedDate = new Date(video.publishedAt);
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 1 - daysSincePublished / 30); // Decay over 30 days

  return (
    engagementRate * 0.4 +
    normalizedEngagement * 100 * 0.3 +
    normalizedViews * 100 * 0.2 +
    recencyBonus * 100 * 0.1
  );
}

function calculateEngagementRate(video: TikTokVideo): number {
  const { views, likes, comments, shares } = video.stats;
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

function sortVideos(videos: TikTokVideo[], sortBy: SortOption): TikTokVideo[] {
  const sorted = [...videos];

  switch (sortBy) {
    case 'viral':
      return sorted.sort((a, b) => calculateViralScore(b) - calculateViralScore(a));
    
    case 'recent':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });
    
    case 'engagement':
      return sorted.sort((a, b) => calculateEngagementRate(b) - calculateEngagementRate(a));
    
    case 'relevance':
      return sorted.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    
    case 'trending':
      return sorted.sort((a, b) => {
        if (a.trending === b.trending) return calculateViralScore(b) - calculateViralScore(a);
        return a.trending ? -1 : 1;
      });
    
    default:
      return sorted;
  }
}

function filterVideos(videos: TikTokVideo[], filterBy: FilterOption): TikTokVideo[] {
  switch (filterBy) {
    case 'trending':
      return videos.filter((v) => v.trending);
    
    case 'high-engagement':
      return videos.filter((v) => calculateEngagementRate(v) > 5); // >5% engagement rate
    
    case 'verified':
      return videos.filter((v) => v.author.verified);
    
    case 'transcribed':
      return videos.filter((v) => v.transcriptionStatus === 'completed');
    
    case 'all':
    default:
      return videos;
  }
}

// ============================================================================
// Component
// ============================================================================

export const TikTokTrendsGrid = memo(function TikTokTrendsGrid({
  videos,
  onTranscribe,
  onAddToResearch,
  onViewTranscript,
  transcribingIds = new Set(),
  isLoading = false,
  searchQuery = '',
}: TikTokTrendsGridProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [sortBy, setSortBy] = useState<SortOption>('viral');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // ============================================================================
  // Computed Values
  // ============================================================================

  const processedVideos = useMemo(() => {
    let result = videos;
    result = filterVideos(result, filterBy);
    result = sortVideos(result, sortBy);
    return result;
  }, [videos, sortBy, filterBy]);

  const stats = useMemo(() => {
    const total = videos.length;
    const trending = videos.filter((v) => v.trending).length;
    const transcribed = videos.filter((v) => v.transcriptionStatus === 'completed').length;
    const avgEngagement = videos.length > 0
      ? videos.reduce((sum, v) => sum + calculateEngagementRate(v), 0) / videos.length
      : 0;
    const avgRelevance = videos.length > 0
      ? videos.reduce((sum, v) => sum + (v.relevanceScore ?? 0), 0) / videos.length
      : 0;

    return {
      total,
      trending,
      transcribed,
      avgEngagement: avgEngagement.toFixed(1),
      avgRelevance: avgRelevance.toFixed(0),
    };
  }, [videos]);

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto" />
          <p className="text-gray-600">Searching TikTok...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Empty State
  // ============================================================================

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-cyan-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No TikTok Videos Found</h3>
          <p className="text-gray-600">
            {searchQuery
              ? `No videos found for "${searchQuery}". Try different hashtags or keywords.`
              : 'Start by searching for hashtags like #SciComm or #AcademicTikTok to find research-relevant content.'}
          </p>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-cyan-900 mb-2">💡 Search Tips:</p>
            <ul className="text-sm text-cyan-800 space-y-1">
              <li>• Use academic hashtags like #SciComm, #PhDLife, #ResearchLife</li>
              <li>• Search for specific topics or keywords</li>
              <li>• Try creator usernames for consistent content</li>
              <li>• Enable "Trending Only" for viral content</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Grid with Results
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-medium text-gray-600">Total Videos</span>
          </div>
          <div className="text-2xl font-bold text-cyan-900">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-red-50 border border-pink-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-pink-600" />
            <span className="text-xs font-medium text-gray-600">Trending</span>
          </div>
          <div className="text-2xl font-bold text-pink-900">{stats.trending}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Transcribed</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.transcribed}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-600">Avg Engagement</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.avgEngagement}%</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-600">Avg Relevance</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.avgRelevance}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Showing {processedVideos.length} videos</span>
          {filterBy !== 'all' && (
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
              {filterBy}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Filter */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-[160px] min-h-[40px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="trending">Trending Only</SelectItem>
              <SelectItem value="high-engagement">High Engagement</SelectItem>
              <SelectItem value="verified">Verified Creators</SelectItem>
              <SelectItem value="transcribed">Transcribed</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] min-h-[40px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viral">Viral Score</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="engagement">Engagement Rate</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="trending">Trending First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {processedVideos.map((video) => (
          <TikTokVideoCard
            key={video.id}
            video={video}
            {...(onTranscribe && { onTranscribe })}
            {...(onAddToResearch && { onAddToResearch })}
            {...(onViewTranscript && { onViewTranscript })}
            isTranscribing={transcribingIds.has(video.id)}
          />
        ))}
      </div>

      {/* No Results After Filtering */}
      {processedVideos.length === 0 && videos.length > 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No videos match the current filters.</p>
          <Button
            onClick={() => setFilterBy('all')}
            variant="outline"
            className="mt-3"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
});

