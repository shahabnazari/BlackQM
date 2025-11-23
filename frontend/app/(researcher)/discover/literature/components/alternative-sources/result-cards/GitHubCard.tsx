/**
 * GitHubCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays GitHub repository results with stars, forks, and language
 *
 * @module alternative-sources/result-cards/GitHubCard
 */

'use client';

import React from 'react';
import { GitBranch, Star, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface GitHubResultMetadata {
  stars?: number;
  forks?: number;
  language?: string;
}

export interface GitHubResult {
  title: string;
  abstract?: string;
  url?: string;
  metadata?: GitHubResultMetadata;
}

export interface GitHubCardProps {
  result: GitHubResult;
}

// ============================================================================
// Component
// ============================================================================

export function GitHubCard({ result }: GitHubCardProps) {
  const { title, abstract, url, metadata } = result;
  const { stars, forks, language } = metadata || {};

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Source Badge and Language */}
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

          {/* Title */}
          <h4 className="font-semibold text-base text-gray-900 mb-2 break-words">
            {title}
          </h4>

          {/* Description */}
          {abstract && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {abstract}
            </p>
          )}

          {/* Quality Indicators */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            {stars !== undefined && (
              <div className="flex items-center gap-1">
                <Star
                  className="w-4 h-4 text-yellow-500 fill-yellow-500"
                  aria-hidden="true"
                />
                <span className="font-medium">{stars.toLocaleString()}</span>
                <span>stars</span>
              </div>
            )}
            {forks !== undefined && (
              <div className="flex items-center gap-1">
                <GitBranch
                  className="w-4 h-4 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">{forks.toLocaleString()}</span>
                <span>forks</span>
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
            aria-label={`Open ${title} on GitHub`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
