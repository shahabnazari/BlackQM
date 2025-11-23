/**
 * SourceResultCard Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Router component that displays source-specific result cards
 *
 * @module alternative-sources/result-cards/SourceResultCard
 */

'use client';

import React from 'react';
import { GitHubCard } from './GitHubCard';
import { StackOverflowCard } from './StackOverflowCard';
import { YouTubeCard } from './YouTubeCard';
import { PodcastCard } from './PodcastCard';
import { GenericCard } from './GenericCard';

// ============================================================================
// Types
// ============================================================================

export interface SourceResultCardProps {
  result: any; // Union type of all possible result types
}

// ============================================================================
// Component
// ============================================================================

/**
 * Source-specific result card router
 * Displays different card designs based on source type
 */
export function SourceResultCard({ result }: SourceResultCardProps) {
  const source = result.source?.toLowerCase() || '';

  // Route to source-specific card component
  if (source.includes('github')) {
    return <GitHubCard result={result} />;
  }

  if (source.includes('stackoverflow') || source.includes('stack overflow')) {
    return <StackOverflowCard result={result} />;
  }

  if (source.includes('youtube')) {
    return <YouTubeCard result={result} />;
  }

  if (source.includes('podcast')) {
    return <PodcastCard result={result} />;
  }

  // Fallback to generic card
  return <GenericCard result={result} />;
}
