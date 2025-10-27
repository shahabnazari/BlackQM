/**
 * Cross-Platform Research Synthesis Dashboard
 *
 * Phase 9 Day 22 Implementation
 *
 * Enterprise-grade dashboard for visualizing research synthesis across:
 * - Academic papers
 * - YouTube videos
 * - Podcasts
 * - TikTok content
 * - Instagram posts
 *
 * Features:
 * - Theme clustering visualization
 * - Dissemination path timeline
 * - Emerging topics detection
 * - Platform-specific insights
 * - Interactive filters and exploration
 */

'use client';

import { useState, useEffect } from 'react';
import {
  useCrossPlatformSynthesis,
  CrossPlatformSynthesisResult,
} from '@/lib/api/services/cross-platform-synthesis-api.service';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CrossPlatformDashboardProps {
  query: string;
  maxResults?: number;
  timeWindow?: number;
}

const PLATFORM_COLORS = {
  papers: '#3B82F6', // Blue
  youtube: '#EF4444', // Red
  podcasts: '#8B5CF6', // Purple
  tiktok: '#EC4899', // Pink
  instagram: '#F59E0B', // Amber
};

export function CrossPlatformDashboard({
  query,
  maxResults = 10,
  timeWindow = 90,
}: CrossPlatformDashboardProps) {
  const { synthesize, loading, error } = useCrossPlatformSynthesis();
  const [synthesisResult, setSynthesisResult] =
    useState<CrossPlatformSynthesisResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'themes' | 'dissemination' | 'emerging' | 'platforms'
  >('overview');

  useEffect(() => {
    const fetchSynthesis = async () => {
      const result = await synthesize(query, { maxResults, timeWindow });
      if (result) {
        setSynthesisResult(result);
      }
    };

    if (query) {
      fetchSynthesis();
    }
  }, [query, maxResults, timeWindow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Synthesizing research across all platforms...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
          Synthesis Error
        </h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!synthesisResult) {
    return null;
  }

  const { themeClusters, emergingTopics, platformInsights } = synthesisResult;

  // Prepare data for theme cluster chart
  const themeClusterData = themeClusters.slice(0, 10).map(cluster => ({
    name:
      cluster.theme.length > 30
        ? cluster.theme.substring(0, 30) + '...'
        : cluster.theme,
    papers: cluster.sources.papers,
    youtube: cluster.sources.youtube,
    podcasts: cluster.sources.podcasts,
    tiktok: cluster.sources.tiktok,
    instagram: cluster.sources.instagram,
    total: cluster.totalSources,
  }));

  // Prepare data for platform distribution pie chart
  const platformDistributionData = [
    {
      name: 'Papers',
      value:
        platformInsights.find(p => p.platform === 'paper')?.sourceCount || 0,
      color: PLATFORM_COLORS.papers,
    },
    {
      name: 'YouTube',
      value:
        platformInsights.find(p => p.platform === 'youtube')?.sourceCount || 0,
      color: PLATFORM_COLORS.youtube,
    },
    {
      name: 'Podcasts',
      value:
        platformInsights.find(p => p.platform === 'podcast')?.sourceCount || 0,
      color: PLATFORM_COLORS.podcasts,
    },
    {
      name: 'TikTok',
      value:
        platformInsights.find(p => p.platform === 'tiktok')?.sourceCount || 0,
      color: PLATFORM_COLORS.tiktok,
    },
    {
      name: 'Instagram',
      value:
        platformInsights.find(p => p.platform === 'instagram')?.sourceCount ||
        0,
      color: PLATFORM_COLORS.instagram,
    },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cross-Platform Research Synthesis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Query:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {query}
          </span>
        </p>
        {synthesisResult.metadata && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Sources
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {synthesisResult.metadata.totalSources}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Theme Clusters
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {synthesisResult.metadata.totalThemeClusters}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dissemination Paths
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {synthesisResult.metadata.totalDisseminationPaths}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Emerging Topics
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {synthesisResult.metadata.totalEmergingTopics}
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Platforms
              </p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {synthesisResult.metadata.platformCount}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'themes', label: 'Theme Clusters', icon: '🎯' },
              { id: 'dissemination', label: 'Dissemination', icon: '📈' },
              { id: 'emerging', label: 'Emerging Topics', icon: '🔥' },
              { id: 'platforms', label: 'Platform Insights', icon: '🌐' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Platform Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Themes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Cross-Platform Themes
                </h3>
                <div className="space-y-3">
                  {themeClusters.slice(0, 5).map((cluster, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {cluster.theme}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {cluster.totalSources} sources
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {cluster.sources.papers > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                            📄 {cluster.sources.papers}
                          </span>
                        )}
                        {cluster.sources.youtube > 0 && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                            🎥 {cluster.sources.youtube}
                          </span>
                        )}
                        {cluster.sources.tiktok > 0 && (
                          <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded">
                            📱 {cluster.sources.tiktok}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Theme Clusters Tab */}
          {activeTab === 'themes' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Theme Distribution Across Platforms
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={themeClusterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="papers"
                    stackId="a"
                    fill={PLATFORM_COLORS.papers}
                    name="Papers"
                  />
                  <Bar
                    dataKey="youtube"
                    stackId="a"
                    fill={PLATFORM_COLORS.youtube}
                    name="YouTube"
                  />
                  <Bar
                    dataKey="podcasts"
                    stackId="a"
                    fill={PLATFORM_COLORS.podcasts}
                    name="Podcasts"
                  />
                  <Bar
                    dataKey="tiktok"
                    stackId="a"
                    fill={PLATFORM_COLORS.tiktok}
                    name="TikTok"
                  />
                  <Bar
                    dataKey="instagram"
                    stackId="a"
                    fill={PLATFORM_COLORS.instagram}
                    name="Instagram"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Emerging Topics Tab */}
          {activeTab === 'emerging' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Emerging Research Topics
              </h3>
              <div className="grid gap-4">
                {emergingTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4"
                    style={{
                      borderColor: topic.potentialGap ? '#F59E0B' : '#3B82F6',
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {topic.topic}
                        {topic.potentialGap && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                            Potential Gap
                          </span>
                        )}
                      </h4>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Trend: {(topic.trendScore * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Growth: +{topic.growthRate}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {topic.recommendation}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        📄 {topic.academicPapers} papers
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        📱 {topic.socialMediaMentions} social mentions
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        🌐 {topic.platforms.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Insights Tab */}
          {activeTab === 'platforms' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Platform-Specific Insights
              </h3>
              <div className="grid gap-6">
                {platformInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {insight.platform}
                      </h4>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {insight.sourceCount} sources
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Avg engagement: {insight.averageEngagement.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Top Themes:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {insight.topThemes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                    {insight.uniqueLanguage.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Platform-Specific Language:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.uniqueLanguage.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
