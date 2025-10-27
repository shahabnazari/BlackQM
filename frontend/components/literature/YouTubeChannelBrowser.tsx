'use client';

import React, { useState } from 'react';
import {
  Youtube,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
  Clock,
  Eye,
  Users,
  Video,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { literatureAPI } from '@/lib/services/literature-api.service';

// ==================== TYPES ====================

interface ChannelMetadata {
  channelId: string;
  channelName: string;
  channelHandle?: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  verified: boolean;
}

interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  publishedAt: Date;
  tags?: string[];
}

interface YouTubeChannelBrowserProps {
  onVideosSelected: (videos: VideoItem[]) => void;
  researchContext?: string;
  className?: string;
}

interface FilterOptions {
  dateRange: 'all' | 'day' | 'week' | 'month' | 'year';
  minDuration?: number; // seconds
  maxDuration?: number; // seconds
  keyword?: string;
  minViews?: number;
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

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getDateRangeFilter = (range: FilterOptions['dateRange']): Date | null => {
  const now = new Date();
  switch (range) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

// ==================== MAIN COMPONENT ====================

export const YouTubeChannelBrowser: React.FC<YouTubeChannelBrowserProps> = ({
  onVideosSelected,
  researchContext: _researchContext,
  className = '',
}) => {
  const [channelInput, setChannelInput] = useState('');
  const [channel, setChannel] = useState<ChannelMetadata | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    keyword: '',
  });

  // ==================== HANDLERS ====================

  const handleLoadChannel = async () => {
    if (!channelInput.trim()) {
      setError('Please enter a channel URL, handle, or ID');
      return;
    }

    setIsLoadingChannel(true);
    setError(null);

    try {
      // Use real API instead of mock
      const channelData = await literatureAPI.getYouTubeChannel(channelInput);
      setChannel(channelData);

      // Auto-load first page of videos
      await loadVideos(channelData.channelId, 1);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to load channel. Please check the input and try again.'
      );
      console.error(err);
    } finally {
      setIsLoadingChannel(false);
    }
  };

  const loadVideos = async (channelId: string, page: number) => {
    setIsLoadingVideos(true);
    try {
      // Convert filter options for API
      const dateFilter = getDateRangeFilter(filters.dateRange);
      const options: any = {
        maxResults: 20,
        order: 'date',
      };

      if (dateFilter) {
        options.publishedAfter = dateFilter;
      }

      // Use real API instead of mock
      const { videos: newVideos, hasMore: more } =
        await literatureAPI.getChannelVideos(channelId, options);

      if (page === 1) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }

      setCurrentPage(page);
      setHasMore(more);
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
      console.error(err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleLoadMore = () => {
    if (channel && !isLoadingVideos && hasMore) {
      loadVideos(channel.channelId, currentPage + 1);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideoIds);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideoIds(newSelection);
  };

  const selectAllVisible = () => {
    const allIds = filteredVideos.map(v => v.videoId);
    setSelectedVideoIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedVideoIds(new Set());
  };

  const handleAddSelected = () => {
    const selectedVideos = videos.filter(v => selectedVideoIds.has(v.videoId));
    onVideosSelected(selectedVideos);
    setSelectedVideoIds(new Set());
  };

  // Apply client-side filters
  const filteredVideos = videos.filter(video => {
    const dateFilter = getDateRangeFilter(filters.dateRange);
    if (dateFilter && new Date(video.publishedAt) < dateFilter) return false;

    if (filters.minDuration && video.duration < filters.minDuration)
      return false;
    if (filters.maxDuration && video.duration > filters.maxDuration)
      return false;

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      return (
        video.title.toLowerCase().includes(keyword) ||
        video.description.toLowerCase().includes(keyword) ||
        video.tags?.some(tag => tag.toLowerCase().includes(keyword))
      );
    }

    if (filters.minViews && video.viewCount < filters.minViews) return false;

    return true;
  });

  // ==================== RENDER ====================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Channel Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            YouTube Channel Browser
          </CardTitle>
          <CardDescription>
            Enter a channel URL, handle (@username), or channel ID to browse
            videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., @TEDx or https://youtube.com/channel/UCxxxxxx"
              value={channelInput}
              onChange={e => setChannelInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadChannel()}
              className="flex-1"
            />
            <Button
              onClick={handleLoadChannel}
              disabled={isLoadingChannel}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoadingChannel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Load Channel
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Info */}
      {channel && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <img
                src={channel.thumbnailUrl}
                alt={channel.channelName}
                className="w-20 h-20 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{channel.channelName}</h3>
                  {channel.verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                {channel.channelHandle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {channel.channelHandle}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {channel.description}
                </p>
                <div className="flex gap-4">
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {formatNumber(channel.subscriberCount)} subscribers
                  </Badge>
                  <Badge variant="secondary">
                    <Video className="w-3 h-3 mr-1" />
                    {formatNumber(channel.videoCount)} videos
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {channel && videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value: any) =>
                    setFilters(prev => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Keyword</Label>
                <Input
                  placeholder="Filter by keyword..."
                  value={filters.keyword || ''}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, keyword: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Min Duration (minutes)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={
                    filters.minDuration
                      ? Math.floor(filters.minDuration / 60)
                      : ''
                  }
                  onChange={e => {
                    const val = e.target.value;
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      if (val) {
                        newFilters.minDuration = parseInt(val) * 60;
                      } else {
                        delete newFilters.minDuration;
                      }
                      return newFilters;
                    });
                  }}
                />
              </div>

              <div>
                <Label>Min Views</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minViews || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      if (val) {
                        newFilters.minViews = parseInt(val);
                      } else {
                        delete newFilters.minViews;
                      }
                      return newFilters;
                    });
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video List */}
      {channel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Channel Videos ({filteredVideos.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllVisible}>
                  Select All Visible
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddSelected}
                  disabled={selectedVideoIds.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Selected ({selectedVideoIds.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingVideos && currentPage === 1 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No videos match your filters.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredVideos.map(video => {
                    const isSelected = selectedVideoIds.has(video.videoId);
                    return (
                      <div
                        key={video.videoId}
                        className={`flex gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => toggleVideoSelection(video.videoId)}
                      >
                        <div className="flex-shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleVideoSelection(video.videoId)
                            }
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                            {video.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(video.viewCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(video.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(video.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingVideos}
                      variant="outline"
                    >
                      {isLoadingVideos ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        'Load More Videos'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
