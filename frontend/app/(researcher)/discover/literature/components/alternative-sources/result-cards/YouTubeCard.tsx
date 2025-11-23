/**
 * YouTubeCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays YouTube video results with channel name and publish date
 *
 * @module alternative-sources/result-cards/YouTubeCard
 */

'use client';

import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface YouTubeResult {
  title: string;
  authors?: string[];
  abstract?: string;
  url?: string;
  year?: number;
}

export interface YouTubeCardProps {
  result: YouTubeResult;
}

// ============================================================================
// Component
// ============================================================================

export function YouTubeCard({ result }: YouTubeCardProps) {
  const { title, authors, abstract, url, year } = result;

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-pink-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Source Badge */}
          <Badge variant="default" className="bg-red-600 text-white mb-2 text-xs">
            🎥 YouTube
          </Badge>

          {/* Title */}
          <h4 className="font-semibold text-base text-gray-900 mb-2 break-words">
            {title}
          </h4>

          {/* Channel Name */}
          {authors && authors.length > 0 && (
            <p className="text-sm text-gray-600 mb-2">{authors[0]}</p>
          )}

          {/* Description */}
          {abstract && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {abstract}
            </p>
          )}

          {/* Publish Date */}
          {year && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{year}</span>
            </div>
          )}
        </div>

        {/* External Link Button */}
        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="flex-shrink-0"
            aria-label={`Open ${title} on YouTube`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
