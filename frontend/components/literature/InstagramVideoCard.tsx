/**
 * InstagramVideoCard Component
 * Phase 10.8 Day 7: Instagram Integration
 * Enterprise-grade video card with metadata, engagement, and transcription status
 *
 * Features:
 * - Thumbnail with play overlay
 * - Creator profile (avatar, username)
 * - Caption with hashtags
 * - Engagement metrics (likes, comments, views)
 * - Transcription status badge
 * - AI-extracted themes preview
 * - Actions (view transcript, add to research)
 *
 * @module InstagramVideoCard
 */

'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Eye, 
  FileText, 
  CheckCircle, 
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface InstagramVideo {
  id: string;
  username: string;
  userAvatar?: string | undefined;
  thumbnailUrl?: string | undefined;
  videoUrl?: string | undefined;
  caption: string;
  hashtags: string[];
  uploadDate: string;
  engagement?: {
    likes?: number | undefined;
    comments?: number | undefined;
    views?: number | undefined;
    shares?: number | undefined;
    saves?: number | undefined;
  } | undefined;
  transcription?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    text?: string | undefined;
    duration?: number | undefined;
  } | undefined;
  aiExtractedThemes?: string[] | undefined;
  sentimentScore?: number | undefined;
  relevanceScore?: number | undefined;
  // ROUND 3: Quality criteria
  author?: {
    username?: string;
    displayName?: string;
    verified?: boolean;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    profilePic?: string;
    bio?: string;
  } | undefined;
  engagementRate?: string | number | undefined;
  qualityScore?: number | undefined;
  isSponsored?: boolean | undefined;
}

export interface InstagramVideoCardProps {
  video: InstagramVideo;
  onViewTranscript?: ((video: InstagramVideo) => void) | undefined;
  onAddToResearch?: ((video: InstagramVideo) => void) | undefined;
  onPlayVideo?: ((video: InstagramVideo) => void) | undefined;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatNumber = (num?: number): string => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getTranscriptionStatusBadge = (status: 'pending' | 'processing' | 'completed' | 'failed') => {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Transcribed</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1 animate-pulse" />Processing</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'failed':
      return <Badge variant="destructive"><span className="text-xs">Failed</span></Badge>;
    default:
      return null;
  }
};

const getSentimentBadge = (score?: number) => {
  if (score === undefined) return null;
  if (score >= 0.6) return <Badge variant="secondary" className="bg-green-100 text-green-700">😊 Positive</Badge>;
  if (score <= 0.4) return <Badge variant="secondary" className="bg-red-100 text-red-700">😟 Negative</Badge>;
  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">😐 Neutral</Badge>;
};

// ============================================================================
// Component
// ============================================================================

export const InstagramVideoCard = memo(function InstagramVideoCard({
  video,
  onViewTranscript,
  onAddToResearch,
  onPlayVideo,
}: InstagramVideoCardProps) {
  const {
    username,
    thumbnailUrl,
    caption,
    hashtags,
    uploadDate,
    engagement,
    transcription,
    aiExtractedThemes,
    sentimentScore,
    relevanceScore,
    author,
    engagementRate,
    qualityScore,
    isSponsored,
  } = video;

  const hasTranscript = transcription?.status === 'completed';
  const displayUsername = author?.username || username;
  const displayName = author?.displayName || username;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Thumbnail with Play Overlay */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Video by ${username}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">📸</span>
          </div>
        )}
        
        {/* Play Overlay */}
        <div 
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onPlayVideo?.(video)}
        >
          <div className="bg-white/90 rounded-full p-4">
            <Play className="w-8 h-8 text-pink-600 fill-pink-600" />
          </div>
        </div>

        {/* Transcription Status Badge */}
        <div className="absolute top-2 right-2">
          {transcription && getTranscriptionStatusBadge(transcription.status)}
        </div>

        {/* Relevance Score */}
        {relevanceScore !== undefined && relevanceScore >= 70 && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-blue-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              {relevanceScore}% Match
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Creator Profile - ROUND 3: Added quality criteria */}
        <div className="flex items-center gap-2">
          {author?.profilePic ? (
            <img 
              src={author.profilePic} 
              alt={displayUsername}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-white text-xs flex items-center justify-center font-semibold">
              {displayUsername.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">@{displayUsername}</p>
              {/* ROUND 3: Verification badge */}
              {author?.verified && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0 h-4">
                  ✓
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDate(uploadDate)}</span>
              {/* ROUND 3: Follower count - quality indicator */}
              {author?.followerCount !== undefined && (
                <>
                  <span>•</span>
                  <span className="font-medium text-gray-700">
                    {formatNumber(author.followerCount)} followers
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Caption */}
        {caption && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {caption}
          </p>
        )}

        {/* Hashtags */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs text-blue-600 border-blue-300">
                {tag}
              </Badge>
            ))}
            {hashtags.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-600">
                +{hashtags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Engagement Metrics - ROUND 3: Enhanced with quality indicators */}
        {engagement && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t">
              {engagement.likes !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>{formatNumber(engagement.likes)}</span>
                </div>
              )}
              {engagement.comments !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span>{formatNumber(engagement.comments)}</span>
                </div>
              )}
              {engagement.views !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span>{formatNumber(engagement.views)}</span>
                </div>
              )}
              {/* ROUND 3: Saves - strong quality indicator */}
              {engagement.saves !== undefined && engagement.saves > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">📥</span>
                  <span className="font-medium text-green-700">{formatNumber(engagement.saves)}</span>
                </div>
              )}
            </div>
            {/* ROUND 3: Engagement rate - key quality metric */}
            {engagementRate !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Engagement:</span>
                <Badge variant="secondary" className={`text-xs ${
                  Number(engagementRate) > 5 ? 'bg-green-100 text-green-700' :
                  Number(engagementRate) > 2 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {typeof engagementRate === 'number' ? `${engagementRate.toFixed(2)}%` : `${engagementRate}%`}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* AI-Extracted Themes */}
        {aiExtractedThemes && aiExtractedThemes.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">AI Themes</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiExtractedThemes.slice(0, 2).map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  {theme}
                </Badge>
              ))}
              {aiExtractedThemes.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  +{aiExtractedThemes.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Sentiment */}
        {sentimentScore !== undefined && (
          <div className="flex items-center gap-2">
            {getSentimentBadge(sentimentScore)}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {hasTranscript && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onViewTranscript?.(video)}
            >
              <FileText className="w-3 h-3 mr-1" />
              View Transcript
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            onClick={() => onAddToResearch?.(video)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to Research
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

