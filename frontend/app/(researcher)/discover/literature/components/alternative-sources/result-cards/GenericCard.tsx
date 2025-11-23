/**
 * GenericCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Fallback card for alternative sources without specific card designs
 *
 * @module alternative-sources/result-cards/GenericCard
 */

'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface GenericResult {
  source?: string;
  title: string;
  authors?: string[];
  abstract?: string;
  url?: string;
}

export interface GenericCardProps {
  result: GenericResult;
}

// ============================================================================
// Component
// ============================================================================

export function GenericCard({ result }: GenericCardProps) {
  const { source, title, authors, abstract, url } = result;

  return (
    <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-semibold text-sm break-words">{title}</h4>

          {/* Authors */}
          {authors && authors.length > 0 && (
            <p className="text-xs text-gray-600 mt-1">{authors.join(', ')}</p>
          )}

          {/* Source Badge */}
          {source && (
            <Badge variant="outline" className="mt-2 text-xs">
              {source}
            </Badge>
          )}

          {/* Abstract */}
          {abstract && (
            <p className="text-xs text-gray-700 mt-2 line-clamp-2">
              {abstract}
            </p>
          )}
        </div>

        {/* External Link Button */}
        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="flex-shrink-0"
            aria-label={`Open ${title}`}
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
