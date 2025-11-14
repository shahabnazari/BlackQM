/**
 * SocialMediaResultsDisplay Component
 * Phase 10.8 Day 7: Social Media Intelligence
 * Unified display for all social media results (Instagram, TikTok, YouTube)
 *
 * Features:
 * - Tab-based navigation for each platform
 * - Unified stats overview
 * - Export functionality (CSV, JSON)
 * - Cross-platform insights integration
 * - Filter by platform or view all
 *
 * @module SocialMediaResultsDisplay
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramResultsGrid } from './InstagramResultsGrid';
import type { InstagramVideo } from './InstagramVideoCard';
import { CrossPlatformDashboard } from './CrossPlatformDashboard';
import { 
  Download, 
  TrendingUp, 
  MessageSquare,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// Types
// ============================================================================

export interface SocialMediaResult {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  title?: string;
  username?: string;
  caption?: string;
  url?: string;
  thumbnailUrl?: string;
  uploadDate: string;
  engagement?: {
    likes?: number;
    comments?: number;
    views?: number;
    shares?: number;
  };
  transcription?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    text?: string;
  };
  aiExtractedThemes?: string[];
  sentimentScore?: number;
  relevanceScore?: number;
}

export interface SocialMediaResultsDisplayProps {
  results: SocialMediaResult[];
  insights?: any;
  loading?: boolean;
  onViewTranscript?: (result: SocialMediaResult) => void;
  onAddToResearch?: (result: SocialMediaResult) => void;
  onPlayVideo?: (result: SocialMediaResult) => void;
  onExport?: (format: 'csv' | 'json') => void;
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

// ============================================================================
// Component
// ============================================================================

export const SocialMediaResultsDisplay = memo(function SocialMediaResultsDisplay({
  results,
  insights,
  loading = false,
  onViewTranscript,
  onAddToResearch,
  onPlayVideo,
  onExport,
}: SocialMediaResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  // ============================================================================
  // Data Processing
  // ============================================================================

  const groupedResults = useMemo(() => {
    const instagram: InstagramVideo[] = [];
    const tiktok: SocialMediaResult[] = [];
    const youtube: SocialMediaResult[] = [];

    results.forEach((result) => {
      // Convert to InstagramVideo format if needed
      if (result.platform === 'instagram') {
        instagram.push({
          id: result.id,
          username: result.username || 'Unknown',
          userAvatar: undefined,
          caption: result.caption || '',
          hashtags: [],
          uploadDate: result.uploadDate,
          thumbnailUrl: result.thumbnailUrl || undefined,
          videoUrl: result.url || undefined,
          engagement: result.engagement || undefined,
          transcription: result.transcription || undefined,
          aiExtractedThemes: result.aiExtractedThemes || undefined,
          sentimentScore: result.sentimentScore || undefined,
          relevanceScore: result.relevanceScore || undefined,
        });
      } else if (result.platform === 'tiktok') {
        tiktok.push(result);
      } else if (result.platform === 'youtube') {
        youtube.push(result);
      }
    });

    return { instagram, tiktok, youtube };
  }, [results]);

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    const totalEngagement = results.reduce((sum, r) => {
      const eng = r.engagement || {};
      return sum + (eng.likes || 0) + (eng.comments || 0) + (eng.views || 0);
    }, 0);

    const avgRelevance = results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / (results.length || 1);
    
    const transcribed = results.filter(r => r.transcription?.status === 'completed').length;

    const byPlatform = {
      instagram: groupedResults.instagram.length,
      tiktok: groupedResults.tiktok.length,
      youtube: groupedResults.youtube.length,
    };

    return {
      total: results.length,
      totalEngagement,
      avgRelevance: Math.round(avgRelevance),
      transcribed,
      byPlatform,
    };
  }, [results, groupedResults]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Social Media Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Social Media Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-indigo-200 bg-indigo-50">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-indigo-700">
              <p className="font-medium mb-2">Ready to discover social media insights</p>
              <p className="text-sm">
                Select your platforms above and click "Search Social Media" to find relevant videos, posts, and discussions from Instagram, TikTok, and YouTube.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Social Media Results
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
              {stats.total} Results
            </Badge>
          </CardTitle>

          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
            <div className="text-2xl font-bold text-pink-600">{stats.byPlatform.instagram}</div>
            <div className="text-xs text-gray-600">📸 Instagram</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.byPlatform.tiktok}</div>
            <div className="text-xs text-gray-600">🎵 TikTok</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.byPlatform.youtube}</div>
            <div className="text-xs text-gray-600">📹 YouTube</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.transcribed}</div>
            <div className="text-xs text-gray-600">✓ Transcribed</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center justify-around py-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-lg font-semibold">{formatNumber(stats.totalEngagement)}</div>
              <div className="text-xs text-gray-600">Total Engagement</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-lg font-semibold">{stats.avgRelevance}%</div>
              <div className="text-xs text-gray-600">Avg Relevance</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-lg font-semibold">{results.filter(r => r.aiExtractedThemes && r.aiExtractedThemes.length > 0).length}</div>
              <div className="text-xs text-gray-600">AI Analyzed</div>
            </div>
          </div>
        </div>

        {/* Tabs for Each Platform */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="instagram" disabled={stats.byPlatform.instagram === 0}>
              📸 Instagram ({stats.byPlatform.instagram})
            </TabsTrigger>
            <TabsTrigger value="tiktok" disabled={stats.byPlatform.tiktok === 0}>
              🎵 TikTok ({stats.byPlatform.tiktok})
            </TabsTrigger>
            <TabsTrigger value="youtube" disabled={stats.byPlatform.youtube === 0}>
              📹 YouTube ({stats.byPlatform.youtube})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-4">
            {/* Cross-Platform Insights */}
            {insights && (
              <CrossPlatformDashboard
                query=""
                maxResults={10}
              />
            )}

            {/* All Results (grouped by platform) */}
            <div className="space-y-6">
              {groupedResults.instagram.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    📸 Instagram Results
                  </h3>
                  <InstagramResultsGrid
                    videos={groupedResults.instagram}
                    onViewTranscript={onViewTranscript as any}
                    onAddToResearch={onAddToResearch as any}
                    onPlayVideo={onPlayVideo as any}
                  />
                </div>
              )}

              {groupedResults.tiktok.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    🎵 TikTok Results
                  </h3>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-700">
                      TikTok results display coming in Phase 10.8 Day 8
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {groupedResults.youtube.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    📹 YouTube Results
                  </h3>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      YouTube results are displayed in the Video Selection Panel above
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="mt-4">
            {groupedResults.instagram.length > 0 ? (
              <InstagramResultsGrid
                videos={groupedResults.instagram}
                onViewTranscript={onViewTranscript as any}
                onAddToResearch={onAddToResearch as any}
                onPlayVideo={onPlayVideo as any}
              />
            ) : (
              <Alert>
                <AlertDescription>No Instagram results found</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="tiktok" className="mt-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                <p className="font-medium mb-2">TikTok Display Coming Soon</p>
                <p className="text-sm">
                  TikTok results display will be implemented in Phase 10.8 Day 8
                </p>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="youtube" className="mt-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                <p className="font-medium mb-2">YouTube Videos</p>
                <p className="text-sm">
                  YouTube results are displayed in the Video Selection Panel in the Social Media Intelligence section above
                </p>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

