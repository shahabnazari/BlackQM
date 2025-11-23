/**
 * StackOverflowCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays StackOverflow question results with score, answers, views, and tags
 *
 * @module alternative-sources/result-cards/StackOverflowCard
 */

'use client';

import React from 'react';
import { TrendingUp, MessageSquare, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface StackOverflowResultMetadata {
  score?: number;
  answerCount?: number;
  viewCount?: number;
  tags?: string[];
}

export interface StackOverflowResult {
  title: string;
  abstract?: string;
  url?: string;
  metadata?: StackOverflowResultMetadata;
}

export interface StackOverflowCardProps {
  result: StackOverflowResult;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_DISPLAYED_TAGS = 5;

// ============================================================================
// Component
// ============================================================================

export function StackOverflowCard({ result }: StackOverflowCardProps) {
  const { title, abstract, url, metadata } = result;
  const { score, answerCount, viewCount, tags } = metadata || {};

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Source Badge */}
          <Badge
            variant="default"
            className="bg-orange-600 text-white mb-2 text-xs"
          >
            📚 StackOverflow
          </Badge>

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
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-2 flex-wrap">
            {score !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp
                  className="w-4 h-4 text-green-600"
                  aria-hidden="true"
                />
                <span className="font-medium">{score}</span>
                <span>score</span>
              </div>
            )}
            {answerCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare
                  className="w-4 h-4 text-blue-600"
                  aria-hidden="true"
                />
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
              {tags.slice(0, MAX_DISPLAYED_TAGS).map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-gray-100"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > MAX_DISPLAYED_TAGS && (
                <span className="text-xs text-gray-400 self-center">
                  +{tags.length - MAX_DISPLAYED_TAGS} more
                </span>
              )}
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
            aria-label={`Open ${title} on StackOverflow`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
