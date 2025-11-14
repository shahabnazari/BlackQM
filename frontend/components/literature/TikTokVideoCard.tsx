/**
 * TikTokVideoCard Component
 * Phase 10.8 Day 8 - TikTok Integration
 * 
 * Enterprise-grade TikTok video card with:
 * - Rich metadata display (creator, engagement, hashtags)
 * - Trending badge and viral indicators
 * - Relevance scoring and sentiment analysis
 * - Transcription status and AI themes
 * - Action buttons (transcribe, add to research)
 * 
 * @module TikTokVideoCard
 * @since Phase 10.8 Day 8
 */

'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  Sparkles,
  FileText,
  Plus,
  ExternalLink,
  Hash,
  Calendar,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TikTokVideo {
  id: string;
  url: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
    verified?: boolean;
  };
  publishedAt: Date | string;
  duration: number;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  hashtags: string[];
  trending?: boolean;
  relevanceScore?: number;
  sentimentScore?: number;
  themes?: string[];
  transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
}

export interface TikTokVideoCardProps {
  /** Video data to display */
  video: TikTokVideo;
  /** Handler for transcribe button */
  onTranscribe?: (videoId: string) => void;
  /** Handler for add to research button */
  onAddToResearch?: (video: TikTokVideo) => void;
  /** Handler for view transcript button */
  onViewTranscript?: (videoId: string) => void;
  /** Whether transcription is in progress */
  isTranscribing?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function calculateEngagementRate(stats: TikTokVideo['stats']): number {
  if (stats.views === 0) return 0;
  return ((stats.likes + stats.comments + stats.shares) / stats.views) * 100;
}

function getRelevanceColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-gray-100 text-gray-700 border-gray-300';
}

function getSentimentColor(score: number): string {
  if (score >= 0.6) return 'bg-green-100 text-green-700';
  if (score >= 0.4) return 'bg-gray-100 text-gray-700';
  return 'bg-red-100 text-red-700';
}

function getSentimentLabel(score: number): string {
  if (score >= 0.7) return 'Very Positive';
  if (score >= 0.5) return 'Positive';
  if (score >= 0.3) return 'Neutral';
  if (score >= 0.1) return 'Negative';
  return 'Very Negative';
}

// ============================================================================
// Component
// ============================================================================

export const TikTokVideoCard = memo(function TikTokVideoCard({
  video,
  onTranscribe,
  onAddToResearch,
  onViewTranscript,
  isTranscribing = false,
}: TikTokVideoCardProps) {
  const [imageError, setImageError] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const engagementRate = calculateEngagementRate(video.stats);
  const hasTranscript = video.transcriptionStatus === 'completed';
  const isProcessing = video.transcriptionStatus === 'processing' || isTranscribing;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTranscribe = useCallback(() => {
    onTranscribe?.(video.id);
  }, [video.id, onTranscribe]);

  const handleAddToResearch = useCallback(() => {
    onAddToResearch?.(video);
  }, [video, onAddToResearch]);

  const handleViewTranscript = useCallback(() => {
    onViewTranscript?.(video.id);
  }, [video.id, onViewTranscript]);

  const handleOpenVideo = useCallback(() => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  }, [video.url]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-cyan-200 group">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20">
        {video.thumbnailUrl && !imageError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-cyan-400" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            onClick={handleOpenVideo}
            className="bg-white/90 hover:bg-white text-cyan-600 rounded-full w-16 h-16 p-0"
          >
            <Play className="w-8 h-8 fill-current" />
          </Button>
        </div>

        {/* Trending Badge */}
        {video.trending && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-red-500 text-white border-0">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}

        {/* Duration */}
        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Creator Info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {video.author.avatar ? (
              <img
                src={video.author.avatar}
                alt={video.author.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              video.author.username?.[0]?.toUpperCase() ?? 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">
                @{video.author.username}
              </span>
              {video.author.verified && (
                <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(video.publishedAt)}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {video.description}
        </p>

        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.hashtags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-cyan-50 text-cyan-700 border-cyan-300"
              >
                <Hash className="w-3 h-3 mr-0.5" />
                {tag}
              </Badge>
            ))}
            {video.hashtags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{video.hashtags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="grid grid-cols-4 gap-2 py-2 border-t border-b border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold mt-0.5">{formatNumber(video.stats.views)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-500">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold mt-0.5">{formatNumber(video.stats.likes)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold mt-0.5">{formatNumber(video.stats.comments)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold mt-0.5">{formatNumber(video.stats.shares)}</div>
          </div>
        </div>

        {/* Scores */}
        <div className="flex gap-2">
          {video.relevanceScore !== undefined && (
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold', getRelevanceColor(video.relevanceScore))}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {video.relevanceScore}% relevant
            </Badge>
          )}
          {video.sentimentScore !== undefined && (
            <Badge
              variant="outline"
              className={cn('text-xs', getSentimentColor(video.sentimentScore))}
            >
              {getSentimentLabel(video.sentimentScore)}
            </Badge>
          )}
        </div>

        {/* Engagement Rate */}
        <div className="text-xs text-gray-600">
          <span className="font-medium">Engagement:</span> {engagementRate.toFixed(1)}%
        </div>

        {/* AI Themes */}
        {video.themes && video.themes.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
                AI-Extracted Themes:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {video.themes.map((theme, idx) => (
                <Badge
                  key={idx}
                  className="text-xs bg-purple-100 text-purple-700 border-purple-300"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!hasTranscript && (
            <Button
              onClick={handleTranscribe}
              disabled={isProcessing}
              size="sm"
              variant="outline"
              className="flex-1 min-h-[40px] border-cyan-300 hover:bg-cyan-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Transcribe
                </>
              )}
            </Button>
          )}
          {hasTranscript && (
            <Button
              onClick={handleViewTranscript}
              size="sm"
              variant="outline"
              className="flex-1 min-h-[40px] border-green-300 hover:bg-green-50"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              View Transcript
            </Button>
          )}
          <Button
            onClick={handleAddToResearch}
            size="sm"
            className="flex-1 min-h-[40px] bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add to Research
          </Button>
        </div>

        {/* Open External Link */}
        <Button
          onClick={handleOpenVideo}
          size="sm"
          variant="ghost"
          className="w-full text-xs text-gray-600 hover:text-cyan-600"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View on TikTok
        </Button>
      </CardContent>
    </Card>
  );
});

