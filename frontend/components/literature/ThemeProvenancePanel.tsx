'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FileText,
  Video,
  Podcast,
  Share2,
  ExternalLink,
  Clock,
  Award,
  FileCheck,
} from 'lucide-react';
import type {
  UnifiedTheme,
  ThemeSource,
} from '@/lib/api/services/unified-theme-api.service';

/**
 * ThemeProvenancePanel - Enterprise Transparency UI for Theme Sources
 *
 * Phase 9 Day 20 Task 3 Implementation
 *
 * Provides advanced researchers with complete transparency into:
 * 1. Source breakdown by type (papers, videos, podcasts, social media)
 * 2. Statistical influence metrics
 * 3. Clickable links to original sources (DOI, YouTube timestamps)
 * 4. Extraction metadata (model, confidence, timestamp)
 * 5. Complete citation chain for reproducibility
 *
 * @enterprise Features:
 * - Real-time influence calculations
 * - Interactive visualizations
 * - Reproducibility support
 * - Academic citation generation
 */

interface ThemeProvenancePanelProps {
  theme: UnifiedTheme;
  onClose?: () => void;
}

const SOURCE_COLORS = {
  paper: '#3b82f6', // Blue
  youtube: '#ef4444', // Red
  podcast: '#8b5cf6', // Purple
  social: '#10b981', // Green
};

const SOURCE_ICONS = {
  paper: FileText,
  youtube: Video,
  podcast: Podcast,
  social: Share2,
};

export const ThemeProvenancePanel: React.FC<ThemeProvenancePanelProps> = ({
  theme,
  onClose,
}) => {
  // Prepare data for pie chart
  const chartData = useMemo(() => {
    const data = [];
    if (theme.provenance.paperInfluence > 0) {
      data.push({
        name: 'Papers',
        value: theme.provenance.paperInfluence * 100,
        count: theme.provenance.paperCount,
        color: SOURCE_COLORS.paper,
      });
    }
    if (theme.provenance.videoInfluence > 0) {
      data.push({
        name: 'Videos',
        value: theme.provenance.videoInfluence * 100,
        count: theme.provenance.videoCount,
        color: SOURCE_COLORS.youtube,
      });
    }
    if (theme.provenance.podcastInfluence > 0) {
      data.push({
        name: 'Podcasts',
        value: theme.provenance.podcastInfluence * 100,
        count: theme.provenance.podcastCount,
        color: SOURCE_COLORS.podcast,
      });
    }
    if (theme.provenance.socialInfluence > 0) {
      data.push({
        name: 'Social Media',
        value: theme.provenance.socialInfluence * 100,
        count: theme.provenance.socialCount,
        color: SOURCE_COLORS.social,
      });
    }
    return data;
  }, [theme.provenance]);

  // Sort sources by influence (highest first)
  const topSources = useMemo(() => {
    return [...theme.sources]
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 10);
  }, [theme.sources]);

  // Format timestamp for YouTube/podcast
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate clickable URL with timestamp
  const getSourceUrl = (source: ThemeSource): string => {
    if (source.doi) {
      return `https://doi.org/${source.doi}`;
    }
    if (source.sourceUrl) {
      // Add timestamp for YouTube
      if (
        source.sourceType === 'youtube' &&
        source.timestamps &&
        source.timestamps[0]
      ) {
        return `${source.sourceUrl}?t=${source.timestamps[0].start}s`;
      }
      return source.sourceUrl;
    }
    return '#';
  };

  // Get icon for source type
  const getSourceIcon = (type: string) => {
    const Icon = SOURCE_ICONS[type as keyof typeof SOURCE_ICONS] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  // Get color for source type
  const getSourceColor = (type: string) => {
    return SOURCE_COLORS[type as keyof typeof SOURCE_COLORS] || '#gray';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {theme.label}
            </h2>
            {theme.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {theme.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Keywords: {theme.keywords.join(', ')}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Column: Source Breakdown Chart */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Source Breakdown
            </h3>

            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${(value as number).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Statistical Summary */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {chartData.map(item => (
                <div
                  key={item.name}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.count} {item.count === 1 ? 'source' : 'sources'} •{' '}
                    {item.value.toFixed(1)}% influence
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extraction Metadata */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Extraction Metadata
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Model: {theme.extractionModel}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Extraction engine
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(theme.extractedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Extraction timestamp
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Confidence:{' '}
                    {(theme.provenance.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${theme.provenance.averageConfidence * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Influential Sources */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Influential Sources
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {topSources.map((source, index) => (
              <div
                key={source.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {/* Source Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="mt-1 p-2 rounded-lg"
                    style={{
                      backgroundColor: `${getSourceColor(source.sourceType)}20`,
                    }}
                  >
                    {getSourceIcon(source.sourceType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {(source.influence * 100).toFixed(1)}% influence
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {source.keywordMatches} keyword matches
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {source.sourceTitle}
                    </h4>
                    {source.sourceAuthor && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {source.sourceAuthor}{' '}
                        {source.year && `(${source.year})`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Excerpts */}
                {source.excerpts.length > 0 && (
                  <div className="mb-2 pl-12">
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
                      "{source.excerpts[0]}"
                    </p>
                  </div>
                )}

                {/* Timestamps (for multimedia) */}
                {source.timestamps &&
                  source.timestamps.length > 0 &&
                  source.timestamps[0] && (
                    <div className="mb-2 pl-12">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          Relevant at{' '}
                          {formatTimestamp(source.timestamps[0].start)}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Link */}
                <div className="pl-12">
                  <a
                    href={getSourceUrl(source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source.doi ? `DOI: ${source.doi}` : 'View source'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citation Chain (Footer) */}
      {theme.provenance.citationChain.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Citation Chain (for reproducibility)
          </h3>
          <div className="flex flex-wrap gap-2">
            {theme.provenance.citationChain
              .slice(0, 10)
              .map((citation, index) => (
                <a
                  key={index}
                  href={
                    citation.startsWith('http')
                      ? citation
                      : `https://doi.org/${citation}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {citation}
                </a>
              ))}
            {theme.provenance.citationChain.length > 10 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{theme.provenance.citationChain.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
