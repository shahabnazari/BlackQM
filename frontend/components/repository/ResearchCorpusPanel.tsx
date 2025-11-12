/**
 * Phase 10 Days 26-27: Research Corpus Panel
 *
 * Main panel for browsing and managing research insights in the repository
 *
 * Features:
 * - Search and filter insights
 * - View insight cards
 * - Access citation lineage
 * - Collaborative annotations
 * - Version history
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../apple-ui/Card';
import { Button } from '../apple-ui/Button';
import { Badge } from '../apple-ui/Badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { InsightCard } from './InsightCard';
import { CitationLineage } from './CitationLineage';
import { AnnotationPanel } from './AnnotationPanel';
import { ShareDialog } from './ShareDialog';
import {
  ResearchInsight,
  SearchFilters,
  SearchHistoryEntry,
  repositoryApi,
} from '@/lib/api/services/repository-api.service';

interface ResearchCorpusPanelProps {
  studyId?: string;
}

export function ResearchCorpusPanel({ studyId }: ResearchCorpusPanelProps) {
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInsight, setSelectedInsight] =
    useState<ResearchInsight | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'lineage' | 'annotations' | 'similar'
  >('overview');
  const [similarInsights, setSimilarInsights] = useState<ResearchInsight[]>([]); // Phase 10 Day 28
  const [showFilters, setShowFilters] = useState(false);
  const [searchAllStudies, setSearchAllStudies] = useState(false); // Phase 10 Day 28: Cross-study search
  const [shareDialogInsight, setShareDialogInsight] =
    useState<ResearchInsight | null>(null); // Phase 10 Day 29: Permissions
  const [filters, setFilters] = useState<SearchFilters>({
    studyIds: studyId ? [studyId] : [],
  });

  // Phase 10 Day 30: Progressive loading
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  // Statistics
  const [stats, setStats] = useState<{
    totalInsights: number;
    byType: Record<string, number>;
  } | null>(null);

  // Phase 10 Day 28: Search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadStats();
    loadSearchHistory(); // Phase 10 Day 28: Load history on mount
    if (studyId) {
      reindexStudy();
    }
  }, [studyId]);

  const loadStats = async () => {
    try {
      const data = await repositoryApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await repositoryApi.getSearchHistory(10);
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const reindexStudy = async () => {
    if (!studyId) return;

    try {
      setLoading(true);
      await repositoryApi.reindexStudy(studyId);
      await performSearch();
    } catch (error) {
      console.error('Failed to reindex study:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (append = false) => {
    try {
      setLoading(true);
      const offset = append ? insights.length : 0;

      const response = await repositoryApi.search({
        query: searchQuery,
        filters,
        allStudies: searchAllStudies, // Phase 10 Day 28: Cross-study search
        limit: 20,
        offset, // Phase 10 Day 30: Progressive loading
      });

      // Phase 10 Day 30: Append or replace results
      if (append) {
        setInsights(prev => [...prev, ...response.results.map(r => r.insight)]);
      } else {
        setInsights(response.results.map(r => r.insight));
      }

      // Phase 10 Day 30: Track pagination state
      setTotalResults(response.total);
      setHasMore(offset + response.results.length < response.total);

      // Phase 10 Day 28: Reload history after search (only on new search)
      if (!append) {
        await loadSearchHistory();
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) {
        setInsights([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Phase 10 Day 30: Load more results
  const loadMore = () => {
    performSearch(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  const handleViewDetails = async (insightId: string) => {
    const insight = insights.find(i => i.id === insightId);
    if (insight) {
      setSelectedInsight(insight);
      setActiveTab('overview');

      // Phase 10 Day 28: Load similar insights
      try {
        const similar = await repositoryApi.getRelatedInsights(insightId, 5);
        setSimilarInsights(similar);
      } catch (error) {
        console.error('Failed to load similar insights:', error);
      }
    }
  };

  const handleAnnotate = (insightId: string) => {
    const insight = insights.find(i => i.id === insightId);
    if (insight) {
      setSelectedInsight(insight);
      setActiveTab('annotations');
    }
  };

  // Phase 10 Day 29: Share handler
  const handleShare = (insight: ResearchInsight) => {
    setShareDialogInsight(insight);
  };

  const handleShareUpdate = (updatedInsight: ResearchInsight) => {
    // Update the insight in the list
    setInsights(prev =>
      prev.map(i => (i.id === updatedInsight.id ? updatedInsight : i))
    );
    // Update selected insight if it's the one being shared
    if (selectedInsight?.id === updatedInsight.id) {
      setSelectedInsight(updatedInsight);
    }
    // Update share dialog insight
    setShareDialogInsight(updatedInsight);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Research Corpus
              </h2>
              {stats && (
                <p className="text-sm text-gray-600 mt-1">
                  {stats.totalInsights} insights indexed across all studies
                </p>
              )}
            </div>
            {studyId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={reindexStudy}
                disabled={loading}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Reindex Study
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  searchAllStudies
                    ? 'Search across all your studies...'
                    : 'Search insights, statements, factors, themes...'
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              Search
            </Button>

            {/* Phase 10 Day 28: Search History Dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowHistory(!showHistory)}
              >
                <ClockIcon className="w-4 h-4 mr-1" />
                History
              </Button>
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Recent Searches
                    </span>
                    <button
                      onClick={async () => {
                        await repositoryApi.clearSearchHistory();
                        setSearchHistory([]);
                        setShowHistory(false);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                  {searchHistory.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSearchQuery(entry.query);
                        setShowHistory(false);
                        performSearch();
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="text-sm text-gray-900 truncate">
                        {entry.query}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.resultCount} results
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="w-4 h-4 mr-1" />
              Filters
            </Button>
          </form>

          {/* Phase 10 Day 28: Cross-Study Search Toggle */}
          {studyId && (
            <div className="mt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchAllStudies}
                  onChange={e => setSearchAllStudies(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Search across all my studies
                </span>
              </label>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insight Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'statement',
                    'factor',
                    'theme',
                    'gap',
                    'quote',
                    'paper_finding',
                    'hypothesis',
                  ].map(type => (
                    <Badge
                      key={type}
                      variant={
                        filters.types?.includes(type) ? 'default' : 'secondary'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const types = filters.types || [];
                        setFilters({
                          ...filters,
                          types: types.includes(type)
                            ? types.filter(t => t !== type)
                            : [...types, type],
                        });
                      }}
                    >
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="mt-4 flex gap-4">
              {Object.entries(stats.byType)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="text-sm">
                    <span className="text-gray-600 capitalize">{type}:</span>{' '}
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Insights List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card>
              <div className="p-8 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            </Card>
          ) : insights.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                {searchQuery
                  ? 'No insights found. Try a different search query.'
                  : 'No insights indexed yet. Click "Reindex Study" to get started.'}
              </div>
            </Card>
          ) : (
            <>
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onViewDetails={handleViewDetails}
                  onAnnotate={handleAnnotate}
                  onShare={handleShare}
                  compact
                />
              ))}

              {/* Phase 10 Day 30: Load More Button */}
              {hasMore && insights.length > 0 && (
                <Card>
                  <div className="p-4 flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-600">
                      Showing {insights.length} of {totalResults} results
                    </p>
                    <Button
                      onClick={loadMore}
                      loading={loading}
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                    >
                      Load More
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedInsight ? (
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as any)}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="lineage">Lineage</TabsTrigger>
                <TabsTrigger value="annotations">Notes</TabsTrigger>
                <TabsTrigger value="similar">Similar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <InsightCard
                  insight={selectedInsight}
                  compact={false}
                  onShare={handleShare}
                />
              </TabsContent>

              <TabsContent value="lineage">
                <CitationLineage
                  citationChain={selectedInsight.citationChain}
                />
              </TabsContent>

              <TabsContent value="annotations">
                <AnnotationPanel insightId={selectedInsight.id} />
              </TabsContent>

              {/* Phase 10 Day 28: Similar Insights */}
              <TabsContent value="similar">
                <Card>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Similar Insights
                    </h3>
                    {similarInsights.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No similar insights found.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {similarInsights.map(similar => (
                          <div
                            key={similar.id}
                            onClick={() => handleViewDetails(similar.id)}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="font-medium text-sm text-gray-900 mb-1">
                              {similar.title}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {similar.content}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {similar.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {similar.keywords.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <div className="p-8 text-center text-gray-500">
                Select an insight to view details
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Phase 10 Day 29: Share Dialog */}
      {shareDialogInsight && (
        <ShareDialog
          insight={shareDialogInsight}
          onClose={() => setShareDialogInsight(null)}
          onUpdate={handleShareUpdate}
        />
      )}
    </div>
  );
}
