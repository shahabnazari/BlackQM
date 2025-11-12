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
import { GitBranch, Search, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
              🎙️ Podcast Search
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              Search for research podcasts, expert interviews, and academic
              discussions
            </p>
            <Input placeholder="Search podcasts..." className="mb-2" />
            <p className="text-xs text-gray-500">
              Coming soon: Integration with Apple Podcasts, Spotify, and Google
              Podcasts
            </p>
          </div>
        )}

        {alternativeSources.includes('github') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              💻 GitHub Repository Browser
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              Find code implementations, datasets, and technical documentation
            </p>
            <Input placeholder="Search repositories..." className="mb-2" />
            <p className="text-xs text-gray-500">
              Coming soon: GitHub API integration for code search and dataset
              discovery
            </p>
          </div>
        )}

        {alternativeSources.includes('stackoverflow') && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              📚 StackOverflow Search
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              Search technical Q&A and community knowledge
            </p>
            <Input placeholder="Search questions..." className="mb-2" />
            <p className="text-xs text-gray-500">
              Coming soon: StackOverflow API integration for technical
              problem-solving
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

        {/* Results Display */}
        {alternativeResults.length > 0 && (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {alternativeResults.map((result, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{result.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {result.authors?.join(', ')}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {result.source}
                    </Badge>
                    {result.abstract && (
                      <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                        {result.abstract}
                      </p>
                    )}
                  </div>
                  {result.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
