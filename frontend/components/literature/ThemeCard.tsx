'use client';

import React, { useState } from 'react';
import {
  FileText,
  Video,
  Podcast,
  Share2,
  Eye,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { ThemeProvenancePanel } from './ThemeProvenancePanel';
import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';

/**
 * ThemeCard Component - Phase 9 Day 20 Task 3
 *
 * Displays a theme with source badges, confidence indicator, and "View Sources" button
 * Opens ThemeProvenancePanel modal for detailed provenance information
 *
 * @enterprise Features:
 * - Source count badges (papers, videos, podcasts, social)
 * - Visual confidence indicator
 * - Controversy flag
 * - Interactive provenance modal
 * - Responsive design
 */

interface ThemeCardProps {
  theme: UnifiedTheme;
  onClick?: (theme: UnifiedTheme) => void;
  showProvenanceButton?: boolean;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  onClick,
  showProvenanceButton = true,
}) => {
  const [showProvenance, setShowProvenance] = useState(false);

  // Calculate source badges
  const sourceBadges = [
    {
      type: 'papers',
      count: theme.provenance.paperCount,
      icon: FileText,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      type: 'videos',
      count: theme.provenance.videoCount,
      icon: Video,
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    {
      type: 'podcasts',
      count: theme.provenance.podcastCount,
      icon: Podcast,
      color:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      type: 'social',
      count: theme.provenance.socialCount,
      icon: Share2,
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
  ].filter(badge => badge.count > 0);

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onClick && onClick(theme)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {theme.label}
              </h3>
              {theme.controversial && (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            {theme.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {theme.description}
              </p>
            )}
          </div>
        </div>

        {/* Keywords */}
        {theme.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {theme.keywords.slice(0, 5).map((keyword, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
              >
                {keyword}
              </span>
            ))}
            {theme.keywords.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{theme.keywords.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Source Badges */}
        {sourceBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {sourceBadges.map(badge => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.type}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{badge.count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Confidence & Weight */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Confidence:
            </span>
            <div className="flex items-center gap-1">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getConfidenceColor(theme.provenance.averageConfidence)} transition-all`}
                  style={{
                    width: `${theme.provenance.averageConfidence * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {getConfidenceLabel(theme.provenance.averageConfidence)}
              </span>
            </div>
          </div>

          {theme.weight > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3 h-3" />
              <span>Weight: {(theme.weight * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* View Sources Button */}
        {showProvenanceButton && theme.sources.length > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setShowProvenance(true);
            }}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Sources ({theme.sources.length})
          </button>
        )}
      </div>

      {/* Provenance Modal */}
      {showProvenance && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProvenance(false)}
        >
          <div
            className="max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <ThemeProvenancePanel
              theme={theme}
              onClose={() => setShowProvenance(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
