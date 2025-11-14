/**
 * AlternativeSourcesPanel Component
 * Extracted from literature page (Phase 10.1 - Enterprise Refactoring)
 * Handles alternative knowledge sources: podcasts, GitHub, StackOverflow, Medium
 *
 * Features:
 * - Source selection for podcasts, GitHub, StackOverflow, Medium
 * - Conditional display of source-specific search interfaces
 * - Alternative source search functionality
 * - Results display with external links
 *
 * @module AlternativeSourcesPanel
 */

'use client';

import React, { memo } from 'react';
import {
  GitBranch,
  Search,
  Loader2,
  ExternalLink,
  Star,
  TrendingUp,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export interface AlternativeSource {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export interface AlternativeSourcesPanelProps {
  /** Currently selected alternative sources */
  alternativeSources: string[];
  /** Handler for source selection changes */
  onSourcesChange: (sources: string[]) => void;
  /** Alternative source search results */
  alternativeResults: Paper[];
  /** Whether alternative source search is in progress */
  loadingAlternative: boolean;
  /** Handler for searching alternative sources */
  onSearch: () => void;
}

// ============================================================================
// Alternative Sources Configuration
// ============================================================================

const ALTERNATIVE_SOURCES: AlternativeSource[] = [
  {
    id: 'podcasts',
    label: 'Podcasts',
    icon: '🎙️',
    desc: 'Expert interviews & discussions',
  },
  { id: 'github', label: 'GitHub', icon: '💻', desc: 'Code & datasets' },
  {
    id: 'stackoverflow',
    label: 'StackOverflow',
    icon: '📚',
    desc: 'Technical Q&A',
  },
  { id: 'medium', label: 'Medium', icon: '📝', desc: 'Practitioner insights' },
];

// ============================================================================
// Component
// ============================================================================

export const AlternativeSourcesPanel = memo(function AlternativeSourcesPanel({
  alternativeSources,
  onSourcesChange,
  alternativeResults,
  loadingAlternative,
  onSearch,
}: AlternativeSourcesPanelProps) {
  const handleSourceToggle = (sourceId: string) => {
    const newSources = alternativeSources.includes(sourceId)
      ? alternativeSources.filter(s => s !== sourceId)
      : [...alternativeSources, sourceId];
    onSourcesChange(newSources);
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Alternative Knowledge Sources
          </span>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
            Expert Insights
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Discover expert knowledge beyond traditional academic databases:
          podcasts, technical documentation, and community expertise
          <span className="block mt-1 text-xs font-medium text-indigo-600">
            💡 All sources are free and open-access
          </span>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Availability Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>📢 Current Availability:</strong> Alternative sources are in active development.
            Most features are planned for Q1 2025. Check individual source badges for status updates.
          </p>
        </div>

        {/* Source Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Alternative Sources
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALTERNATIVE_SOURCES.map(source => (
              <Badge
                key={source.id}
                variant={
                  alternativeSources.includes(source.id) ? 'default' : 'outline'
                }
                className="cursor-pointer py-2 px-4 text-sm"
                onClick={() => handleSourceToggle(source.id)}
              >
                <span className="mr-2">{source.icon}</span>
                {source.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Conditional Source-Specific Interfaces */}
        {alternativeSources.includes('podcasts') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>🎙️ Podcast Transcription & Analysis</span>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                Coming Q1 2025
              </Badge>
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Automated podcast search, transcription, and AI-powered content extraction (in development)
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Podcast URL transcription (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">AI-powered content extraction & theme analysis (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Integration with major podcast platforms (planned Q1 2025)</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">
              💡 Join our waitlist to be notified when podcast search launches
            </p>
          </div>
        )}

        {alternativeSources.includes('github') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>💻 GitHub Repository Search</span>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                Planned Q1 2025
              </Badge>
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Search code implementations, datasets, and technical documentation from GitHub repositories (in development)
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Search 10+ million repositories with quality scoring (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">View stars, forks, and programming languages (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Direct links to repository documentation and code (planned Q1 2025)</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">
              💡 Join our waitlist to be notified when GitHub search launches
            </p>
          </div>
        )}

        {alternativeSources.includes('stackoverflow') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>📚 StackOverflow Knowledge Search</span>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                Planned Q1 2025
              </Badge>
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Search technical Q&A, community knowledge, and expert problem-solving discussions (in development)
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Search 20+ million questions with expert answers (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">View scores, answer counts, and community tags (planned Q1 2025)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600">🔄</span>
                <span className="text-gray-700">Filter by relevance and view count (planned Q1 2025)</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">
              💡 Join our waitlist to be notified when StackOverflow search launches
            </p>
          </div>
        )}

        {/* Search Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={onSearch}
              disabled={loadingAlternative || alternativeSources.length === 0}
              variant="default"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loadingAlternative ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="animate-pulse">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search These Sources Only
                </>
              )}
            </Button>
            {alternativeResults.length > 0 && (
              <Badge variant="secondary" className="self-center">
                {alternativeResults.length} results found
              </Badge>
            )}
          </div>

          {loadingAlternative && (
            <div className="text-sm text-purple-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Retrieving from {alternativeSources.join(', ')}...</span>
            </div>
          )}

          {alternativeSources.length === 0 && (
            <p className="text-xs text-orange-600">
              ⚠️ Select at least one source above to enable search
            </p>
          )}
        </div>

        {/* Results Display - Phase 10.8 Day 1: Source-specific cards with quality indicators */}
        {alternativeResults.length > 0 && (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {alternativeResults.map((result, idx) => (
              <SourceResultCard key={idx} result={result} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Phase 10.8 Day 1: Source-Specific Result Card Components
// ============================================================================

interface SourceResultCardProps {
  result: any;
}

/**
 * Source-specific result card router
 * Displays different card designs based on source type
 */
const SourceResultCard: React.FC<SourceResultCardProps> = ({ result }) => {
  const source = result.source?.toLowerCase() || '';

  // Route to source-specific card component
  if (source.includes('github')) {
    return <GitHubCard result={result} />;
  }
  if (source.includes('stackoverflow') || source.includes('stack overflow')) {
    return <StackOverflowCard result={result} />;
  }
  if (source.includes('youtube')) {
    return <YouTubeCard result={result} />;
  }
  if (source.includes('podcast')) {
    return <PodcastCard result={result} />;
  }

  // Fallback to generic card
  return <GenericCard result={result} />;
};

/**
 * GitHub Repository Card
 * Shows: stars, forks, programming language
 */
const GitHubCard: React.FC<{ result: any }> = ({ result }) => {
  const { title, abstract, url, metadata } = result;
  const { stars, forks, language } = metadata || {};

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="default" className="bg-gray-800 text-white text-xs">
              💻 GitHub
            </Badge>
            {language && (
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
            )}
          </div>

          <h4 className="font-semibold text-base text-gray-900 mb-2 break-words">
            {title}
          </h4>

          {abstract && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {abstract}
            </p>
          )}

          {/* Quality Indicators */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            {stars !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{stars.toLocaleString()}</span>
                <span>stars</span>
              </div>
            )}
            {forks !== undefined && (
              <div className="flex items-center gap-1">
                <GitBranch className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{forks.toLocaleString()}</span>
                <span>forks</span>
              </div>
            )}
          </div>
        </div>

        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * StackOverflow Question Card
 * Shows: score, answer count, view count, tags
 */
const StackOverflowCard: React.FC<{ result: any }> = ({ result }) => {
  const { title, abstract, url, metadata } = result;
  const { score, answerCount, viewCount, tags } = metadata || {};

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Badge variant="default" className="bg-orange-600 text-white mb-2 text-xs">
            📚 StackOverflow
          </Badge>

          <h4 className="font-semibold text-base text-gray-900 mb-2 break-words">
            {title}
          </h4>

          {abstract && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {abstract}
            </p>
          )}

          {/* Quality Indicators */}
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-2 flex-wrap">
            {score !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">{score}</span>
                <span>score</span>
              </div>
            )}
            {answerCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{answerCount}</span>
                <span>{answerCount === 1 ? 'answer' : 'answers'}</span>
              </div>
            )}
            {viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {viewCount >= 1000
                    ? `${(viewCount / 1000).toFixed(1)}k`
                    : viewCount}
                </span>
                <span>views</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 5).map((tag: string, i: number) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-gray-100"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * YouTube Video Card
 * Shows: channel name, publish date
 */
const YouTubeCard: React.FC<{ result: any }> = ({ result }) => {
  const { title, authors, abstract, url, year } = result;

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-pink-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Badge variant="default" className="bg-red-600 text-white mb-2 text-xs">
            🎥 YouTube
          </Badge>

          <h4 className="font-semibold text-base text-gray-900 mb-2 break-words">
            {title}
          </h4>

          {authors && authors.length > 0 && (
            <p className="text-sm text-gray-600 mb-2">
              {authors[0]}
            </p>
          )}

          {abstract && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {abstract}
            </p>
          )}

          {year && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{year}</span>
            </div>
          )}
        </div>

        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Podcast Episode Card
 * Shows: duration, podcast name, host
 */
const PodcastCard: React.FC<{ result: any }> = ({ result }) => {
  const { title, authors, abstract, url, year, metadata } = result;
  const { duration, episodeTitle, podcastName } = metadata || {};

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Badge variant="default" className="bg-purple-600 text-white mb-2 text-xs">
            🎙️ Podcast
          </Badge>

          <h4 className="font-semibold text-base text-gray-900 mb-1 break-words">
            {episodeTitle || title}
          </h4>

          {podcastName && (
            <p className="text-sm font-medium text-purple-700 mb-2">
              {podcastName}
            </p>
          )}

          {authors && authors.length > 0 && (
            <p className="text-xs text-gray-600 mb-2">
              Host: {authors[0]}
            </p>
          )}

          {abstract && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {abstract}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {duration && (
              <div className="flex items-center gap-1">
                <span>⏱️</span>
                <span>{formatDuration(duration)}</span>
              </div>
            )}
            {year && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{year}</span>
              </div>
            )}
          </div>
        </div>

        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Generic Fallback Card
 * Used for sources without specific card designs
 */
const GenericCard: React.FC<{ result: any }> = ({ result }) => {
  const { source, title, authors, abstract, url } = result;

  return (
    <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm break-words">{title}</h4>
          {authors && authors.length > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {authors.join(', ')}
            </p>
          )}
          <Badge variant="outline" className="mt-2 text-xs">
            {source}
          </Badge>
          {abstract && (
            <p className="text-xs text-gray-700 mt-2 line-clamp-2">
              {abstract}
            </p>
          )}
        </div>
        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
