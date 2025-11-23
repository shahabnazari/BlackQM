/**
 * PodcastCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays podcast episode results with duration, podcast name, and host
 *
 * @module alternative-sources/result-cards/PodcastCard
 */

'use client';

import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface PodcastResultMetadata {
  duration?: number;
  episodeTitle?: string;
  podcastName?: string;
}

export interface PodcastResult {
  title: string;
  authors?: string[];
  abstract?: string;
  url?: string;
  year?: number;
  metadata?: PodcastResultMetadata;
}

export interface PodcastCardProps {
  result: PodcastResult;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins} min`;
}

// ============================================================================
// Component
// ============================================================================

export function PodcastCard({ result }: PodcastCardProps) {
  const { title, authors, abstract, url, year, metadata } = result;
  const { duration, episodeTitle, podcastName } = metadata || {};

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Source Badge */}
          <Badge
            variant="default"
            className="bg-purple-600 text-white mb-2 text-xs"
          >
            🎙️ Podcast
          </Badge>

          {/* Episode Title */}
          <h4 className="font-semibold text-base text-gray-900 mb-1 break-words">
            {episodeTitle || title}
          </h4>

          {/* Podcast Name */}
          {podcastName && (
            <p className="text-sm font-medium text-purple-700 mb-2">
              {podcastName}
            </p>
          )}

          {/* Host */}
          {authors && authors.length > 0 && (
            <p className="text-xs text-gray-600 mb-2">Host: {authors[0]}</p>
          )}

          {/* Description */}
          {abstract && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {abstract}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {duration && (
              <div className="flex items-center gap-1">
                <span aria-hidden="true">⏱️</span>
                <span>{formatDuration(duration)}</span>
              </div>
            )}
            {year && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{year}</span>
              </div>
            )}
          </div>
        </div>

        {/* External Link Button */}
        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="flex-shrink-0"
            aria-label={`Open ${episodeTitle || title} podcast episode`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
