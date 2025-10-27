'use client';

import React, { useState, useMemo } from 'react';
import {
  Video,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  Download,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ==================== TYPES ====================

interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  duration: number; // seconds
  viewCount: number;
  publishedAt: Date;
  relevanceScore?: number; // 0-100
  isTranscribed?: boolean;
  transcriptionStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
  cachedTranscript?: boolean;
}

interface VideoSelectionPanelProps {
  videos: VideoMetadata[];
  researchContext: string;
  onTranscribe: (videoIds: string[]) => Promise<void>;
  onScoreRelevance?: (videos: VideoMetadata[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface CostBreakdown {
  videoId: string;
  title: string;
  duration: number;
  cost: number;
  isCached: boolean;
}

// ==================== UTILITIES ====================

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const calculateTranscriptionCost = (durationSeconds: number): number => {
  // $0.006 per minute (Whisper API pricing)
  return (durationSeconds / 60) * 0.006;
};

const getStatusColor = (
  status?: 'not_started' | 'processing' | 'completed' | 'failed'
): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'processing':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

const getStatusLabel = (video: VideoMetadata): string => {
  if (video.cachedTranscript) return 'Cached ($0.00)';
  if (video.transcriptionStatus === 'completed') return 'Transcribed';
  if (video.transcriptionStatus === 'processing') return 'Processing...';
  if (video.transcriptionStatus === 'failed') return 'Failed';
  return 'Not Transcribed';
};

// ==================== MAIN COMPONENT ====================

export const VideoSelectionPanel: React.FC<VideoSelectionPanelProps> = ({
  videos,
  researchContext: _researchContext,
  onTranscribe,
  onScoreRelevance,
  isLoading = false,
  className = '',
}) => {
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    new Set()
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sortBy, setSortBy] = useState<
    'relevance' | 'date' | 'views' | 'duration'
  >('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'transcribed' | 'not_transcribed'
  >('all');
  const [scoringVideos, setScoringVideos] = useState(false);

  // ==================== COMPUTED VALUES ====================

  const sortedAndFilteredVideos = useMemo(() => {
    let filtered = [...videos];

    // Apply status filter
    if (filterStatus === 'transcribed') {
      filtered = filtered.filter(
        v => v.isTranscribed || v.transcriptionStatus === 'completed'
      );
    } else if (filterStatus === 'not_transcribed') {
      filtered = filtered.filter(
        v => !v.isTranscribed && v.transcriptionStatus !== 'completed'
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'relevance':
          compareValue = (b.relevanceScore || 0) - (a.relevanceScore || 0);
          break;
        case 'date':
          compareValue =
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime();
          break;
        case 'views':
          compareValue = b.viewCount - a.viewCount;
          break;
        case 'duration':
          compareValue = b.duration - a.duration;
          break;
      }

      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [videos, sortBy, sortOrder, filterStatus]);

  const costBreakdown: CostBreakdown[] = useMemo(() => {
    return Array.from(selectedVideoIds).map(videoId => {
      const video = videos.find(v => v.videoId === videoId)!;
      const isCached =
        video.cachedTranscript || video.transcriptionStatus === 'completed';
      return {
        videoId,
        title: video.title,
        duration: video.duration,
        cost: isCached ? 0 : calculateTranscriptionCost(video.duration),
        isCached,
      };
    });
  }, [selectedVideoIds, videos]);

  const totalCost = useMemo(() => {
    return costBreakdown.reduce((sum, item) => sum + item.cost, 0);
  }, [costBreakdown]);

  // ==================== HANDLERS ====================

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideoIds);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideoIds(newSelection);
  };

  const selectAll = () => {
    const allIds = sortedAndFilteredVideos.map(v => v.videoId);
    setSelectedVideoIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedVideoIds(new Set());
  };

  const handleTranscribeClick = () => {
    if (selectedVideoIds.size === 0) return;
    setShowConfirmDialog(true);
  };

  const confirmTranscription = async () => {
    setShowConfirmDialog(false);
    setIsTranscribing(true);

    try {
      await onTranscribe(Array.from(selectedVideoIds));
      setSelectedVideoIds(new Set()); // Clear selection after successful transcription
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleScoreRelevance = async () => {
    if (!onScoreRelevance || sortedAndFilteredVideos.length === 0) return;

    setScoringVideos(true);
    try {
      await onScoreRelevance(sortedAndFilteredVideos);
    } catch (error) {
      console.error('Scoring failed:', error);
    } finally {
      setScoringVideos(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>

              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="transcribed">Transcribed Only</SelectItem>
                  <SelectItem value="not_transcribed">
                    Not Transcribed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {onScoreRelevance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScoreRelevance}
                  disabled={
                    scoringVideos || sortedAndFilteredVideos.length === 0
                  }
                >
                  {scoringVideos ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Score Relevance
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>

              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>

              <Button
                onClick={handleTranscribeClick}
                disabled={selectedVideoIds.size === 0 || isTranscribing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Transcribe Selected ({selectedVideoIds.size})
                    {totalCost > 0 && (
                      <span className="ml-2">${totalCost.toFixed(2)}</span>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedVideoIds.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedVideoIds.size} video
                  {selectedVideoIds.size !== 1 ? 's' : ''} selected
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  Total Cost: ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : sortedAndFilteredVideos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No videos found matching your filters.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredVideos.map(video => {
            const isSelected = selectedVideoIds.has(video.videoId);
            const cost =
              video.cachedTranscript ||
              video.transcriptionStatus === 'completed'
                ? 0
                : calculateTranscriptionCost(video.duration);

            return (
              <Card
                key={video.videoId}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => toggleVideoSelection(video.videoId)}
              >
                <CardContent className="p-4">
                  {/* Thumbnail */}
                  <div className="relative mb-3">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleVideoSelection(video.videoId)
                        }
                        onClick={e => e.stopPropagation()}
                        className="bg-white"
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(video.duration)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(video.transcriptionStatus)}`}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                    {video.title}
                  </h3>

                  {/* Channel */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {video.channelName}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      {formatViewCount(video.viewCount)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </Badge>
                    {video.relevanceScore !== undefined && (
                      <Badge
                        variant={
                          video.relevanceScore >= 70 ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {video.relevanceScore}%
                      </Badge>
                    )}
                  </div>

                  {/* Status & Cost */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs font-medium">
                      {getStatusLabel(video)}
                    </span>
                    {cost > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />$
                        {cost.toFixed(3)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Transcription</DialogTitle>
            <DialogDescription>
              You are about to transcribe {selectedVideoIds.size} video
              {selectedVideoIds.size !== 1 ? 's' : ''}. Please review the cost
              breakdown below.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left p-2">Video</th>
                  <th className="text-right p-2">Duration</th>
                  <th className="text-right p-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {costBreakdown.map(item => (
                  <tr key={item.videoId} className="border-t">
                    <td className="p-2">
                      <div className="line-clamp-1">{item.title}</div>
                      {item.isCached && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Cached
                        </Badge>
                      )}
                    </td>
                    <td className="text-right p-2">
                      {formatDuration(item.duration)}
                    </td>
                    <td className="text-right p-2 font-semibold">
                      ${item.cost.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800 sticky bottom-0">
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td colSpan={2} className="p-2 font-bold">
                    Total
                  </td>
                  <td className="text-right p-2 font-bold text-lg text-blue-600 dark:text-blue-400">
                    ${totalCost.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTranscription}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm & Transcribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
