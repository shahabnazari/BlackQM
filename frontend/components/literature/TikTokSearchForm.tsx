/**
 * TikTokSearchForm Component
 * Phase 10.8 Day 8 - TikTok Integration
 * 
 * Enterprise-grade TikTok search form with:
 * - Hashtag and keyword search
 * - Trending hashtag suggestions
 * - Time range filtering
 * - Academic context support
 * - Research-focused UI/UX
 * 
 * @module TikTokSearchForm
 * @since Phase 10.8 Day 8
 */

'use client';

import React, { useState, useCallback, memo } from 'react';
import { Search, TrendingUp, Calendar, Hash, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

export interface TikTokSearchFormProps {
  /** Handler for search submission */
  onSearch: (params: TikTokSearchParams) => void;
  /** Whether search is in progress */
  isLoading?: boolean;
  /** Current search query */
  query?: string;
  /** Handler for query changes */
  onQueryChange?: (query: string) => void;
}

export interface TikTokSearchParams {
  /** Search query (keywords or hashtags) */
  query: string;
  /** Time range for search */
  timeRange: '7' | '30' | '90' | 'all';
  /** Include trending content only */
  trendingOnly: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TRENDING_HASHTAGS = [
  { tag: '#SciComm', desc: 'Science Communication' },
  { tag: '#AcademicTikTok', desc: 'Academic Research' },
  { tag: '#ResearchLife', desc: 'Research Lifestyle' },
  { tag: '#ScienceTikTok', desc: 'Science Content' },
  { tag: '#PhDLife', desc: 'PhD Research' },
  { tag: '#LabLife', desc: 'Laboratory Work' },
  { tag: '#STEMEducation', desc: 'STEM Learning' },
  { tag: '#DataScience', desc: 'Data Analysis' },
];

const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

// ============================================================================
// Component
// ============================================================================

export const TikTokSearchForm = memo(function TikTokSearchForm({
  onSearch,
  isLoading = false,
  query: externalQuery = '',
  onQueryChange,
}: TikTokSearchFormProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [localQuery, setLocalQuery] = useState(externalQuery);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [trendingOnly, setTrendingOnly] = useState(false);

  // Use controlled query if provided, otherwise use local
  const query = onQueryChange ? externalQuery : localQuery;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleQueryChange = useCallback((value: string) => {
    if (onQueryChange) {
      onQueryChange(value);
    } else {
      setLocalQuery(value);
    }
  }, [onQueryChange]);

  const handleHashtagClick = useCallback((hashtag: string) => {
    const newQuery = query ? `${query} ${hashtag}` : hashtag;
    handleQueryChange(newQuery);
  }, [query, handleQueryChange]);

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    onSearch({
      query: query.trim(),
      timeRange,
      trendingOnly,
    });
  }, [query, timeRange, trendingOnly, onSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  }, [handleSearch, isLoading]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span>TikTok Research Search</span>
          <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
            Beta
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Search for research-relevant TikTok videos using hashtags, keywords, or creators
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Search Input */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
              <Input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter hashtags (#SciComm) or keywords..."
                className="pl-10 min-h-[44px] border-cyan-300 focus:border-cyan-500"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white min-h-[44px] px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search TikTok
                </>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time Range */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Time Range
              </label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)} disabled={isLoading}>
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trending Only */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                Content Type
              </label>
              <Button
                type="button"
                variant={trendingOnly ? 'default' : 'outline'}
                className={`w-full min-h-[44px] justify-start ${
                  trendingOnly
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
                    : 'border-gray-300'
                }`}
                onClick={() => setTrendingOnly(!trendingOnly)}
                disabled={isLoading}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {trendingOnly ? 'Trending Only' : 'All Content'}
              </Button>
            </div>
          </div>
        </form>

        {/* Trending Hashtag Suggestions */}
        <div className="pt-3 border-t border-cyan-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium text-gray-700">Academic Hashtags:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_HASHTAGS.map((item) => (
              <Button
                key={item.tag}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleHashtagClick(item.tag)}
                disabled={isLoading}
                className="text-xs border-cyan-300 hover:bg-cyan-50 hover:border-cyan-400 transition-colors"
                title={item.desc}
              >
                <Hash className="w-3 h-3 mr-1" />
                {item.tag.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">TikTok Research API Features:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                <li>Search by hashtags, keywords, or creator usernames</li>
                <li>Real-time trend analysis and engagement metrics</li>
                <li>Academic content filtering and relevance scoring</li>
                <li>Automatic transcription and theme extraction</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

