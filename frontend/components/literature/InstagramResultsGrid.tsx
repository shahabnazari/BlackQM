/**
 * InstagramResultsGrid Component
 * Phase 10.8 Day 7: Instagram Integration
 * Enterprise-grade results grid with masonry layout and advanced filtering
 *
 * Features:
 * - Responsive masonry layout
 * - Multi-criteria filtering (engagement, relevance, date, sentiment)
 * - Sort options (relevance, date, engagement)
 * - Empty state with helpful message
 * - Loading skeleton
 * - Infinite scroll ready
 *
 * @module InstagramResultsGrid
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { InstagramVideoCard, type InstagramVideo } from './InstagramVideoCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// Types
// ============================================================================

export interface InstagramResultsGridProps {
  videos: InstagramVideo[];
  loading?: boolean;
  onViewTranscript?: (video: InstagramVideo) => void;
  onAddToResearch?: (video: InstagramVideo) => void;
  onPlayVideo?: (video: InstagramVideo) => void;
}

type SortOption = 'relevance' | 'date' | 'engagement' | 'sentiment';
type FilterOption = 'all' | 'transcribed' | 'high-engagement' | 'high-relevance';

// ============================================================================
// Component
// ============================================================================

export const InstagramResultsGrid = memo(function InstagramResultsGrid({
  videos,
  loading = false,
  onViewTranscript,
  onAddToResearch,
  onPlayVideo,
}: InstagramResultsGridProps) {
  // State
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ============================================================================
  // Filtering & Sorting Logic
  // ============================================================================

  const filteredAndSortedVideos = useMemo(() => {
    let results = [...videos];

    // Apply filters
    switch (filterBy) {
      case 'transcribed':
        results = results.filter(v => v.transcription?.status === 'completed');
        break;
      case 'high-engagement':
        results = results.filter(v => {
          const engagement = v.engagement;
          if (!engagement) return false;
          const totalEngagement = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.views || 0);
          return totalEngagement > 1000; // Threshold for "high engagement"
        });
        break;
      case 'high-relevance':
        results = results.filter(v => (v.relevanceScore || 0) >= 70);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        
        case 'engagement': {
          const aEngagement = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.views || 0);
          const bEngagement = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.views || 0);
          return bEngagement - aEngagement;
        }
        
        case 'sentiment':
          return (b.sentimentScore || 0.5) - (a.sentimentScore || 0.5);
        
        default:
          return 0;
      }
    });

    return results;
  }, [videos, sortBy, filterBy]);

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    const transcribed = videos.filter(v => v.transcription?.status === 'completed').length;
    const avgRelevance = videos.reduce((sum, v) => sum + (v.relevanceScore || 0), 0) / (videos.length || 1);
    const highEngagement = videos.filter(v => {
      const engagement = v.engagement;
      if (!engagement) return false;
      const total = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.views || 0);
      return total > 1000;
    }).length;

    return {
      total: videos.length,
      transcribed,
      avgRelevance: Math.round(avgRelevance),
      highEngagement,
    };
  }, [videos]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[4/5] bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (videos.length === 0) {
    return (
      <Alert className="border-pink-200 bg-pink-50">
        <Sparkles className="h-4 w-4 text-pink-600" />
        <AlertDescription className="text-pink-700">
          <p className="font-medium mb-2">No Instagram videos yet</p>
          <p className="text-sm">
            Upload Instagram videos using the button above to analyze visual content, extract themes, and integrate with your research.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-pink-100 text-pink-700">
            📸 {stats.total} Videos
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            ✓ {stats.transcribed} Transcribed
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            ⭐ {stats.avgRelevance}% Avg Match
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            🔥 {stats.highEngagement} High Engagement
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
          <Filter className="w-4 h-4 text-gray-600" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="transcribed">Transcribed Only</SelectItem>
                <SelectItem value="high-engagement">High Engagement</SelectItem>
                <SelectItem value="high-relevance">High Relevance (70%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(sortBy !== 'relevance' || filterBy !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortBy('relevance');
                setFilterBy('all');
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Results Count */}
      {filteredAndSortedVideos.length !== videos.length && (
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedVideos.length} of {videos.length} videos
        </p>
      )}

      {/* Masonry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedVideos.map((video) => (
          <InstagramVideoCard
            key={video.id}
            video={video}
            onViewTranscript={onViewTranscript || undefined}
            onAddToResearch={onAddToResearch || undefined}
            onPlayVideo={onPlayVideo || undefined}
          />
        ))}
      </div>

      {/* No Results After Filtering */}
      {filteredAndSortedVideos.length === 0 && videos.length > 0 && (
        <Alert>
          <AlertDescription>
            <p className="font-medium mb-2">No videos match your filters</p>
            <p className="text-sm text-gray-600">
              Try adjusting your filter criteria or{' '}
              <button
                className="text-blue-600 underline"
                onClick={() => {
                  setSortBy('relevance');
                  setFilterBy('all');
                }}
              >
                reset filters
              </button>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});

