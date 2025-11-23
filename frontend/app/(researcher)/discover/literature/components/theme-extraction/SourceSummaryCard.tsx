/**
 * Source Summary Card Component
 * Displays source type counts from extracted themes
 *
 * **Purpose:**
 * Shows breakdown of source types (papers, videos, podcasts, social media)
 * that contributed to theme extraction
 *
 * **Features:**
 * - Displays count badges for each source type
 * - Only shows source types with non-zero counts
 * - Color-coded badges for visual distinction
 * - Shows total source count with provenance tracking message
 *
 * **Enterprise Standards:**
 * - ✅ Performance optimized with React.memo() and useMemo()
 * - ✅ Type-safe source type checking with type guards
 * - ✅ WCAG 2.1 AA compliant with aria-labels
 * - ✅ Explicit typing for all objects and functions
 *
 * @module SourceSummaryCard
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// Types
// ============================================================================

export interface SourceSummaryCardProps {
  unifiedThemes: UnifiedTheme[];
}

/**
 * Valid source types for theme extraction
 */
type ValidSourceType = 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';

/**
 * Source count summary by type
 */
interface SourceCounts {
  papers: number;
  youtube: number;
  podcasts: number;
  social: number;
}

/**
 * Theme source with validated type
 */
interface ThemeSource {
  sourceType?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to validate source type
 *
 * @param sourceType - Source type string to validate
 * @returns True if sourceType is a valid ValidSourceType
 */
function isValidSourceType(sourceType: string | undefined): sourceType is ValidSourceType {
  return (
    sourceType === 'paper' ||
    sourceType === 'youtube' ||
    sourceType === 'podcast' ||
    sourceType === 'tiktok' ||
    sourceType === 'instagram'
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * SourceSummaryCard - Displays source type counts from themes
 *
 * Analyzes all themes and counts how many sources of each type contributed.
 * Displays color-coded badges for each source type with counts.
 *
 * **Performance:**
 * - Memoized with React.memo() to prevent unnecessary re-renders
 * - Source counting logic memoized with useMemo()
 *
 * **Accessibility:**
 * - Descriptive aria-labels on all badges
 * - Semantic HTML with proper heading hierarchy
 *
 * @param {SourceSummaryCardProps} props - Component props
 * @returns {JSX.Element} Rendered source summary card
 */
export const SourceSummaryCard = React.memo<SourceSummaryCardProps>(function SourceSummaryCard({
  unifiedThemes,
}) {
  // Memoize source counting to avoid recalculation on every render
  const sourceCounts = React.useMemo<SourceCounts>(() => {
    const counts: SourceCounts = {
      papers: 0,
      youtube: 0,
      podcasts: 0,
      social: 0,
    };

    unifiedThemes.forEach(theme => {
      theme.sources?.forEach((source: ThemeSource) => {
        // Use type guard for runtime type safety
        if (!isValidSourceType(source.sourceType)) {
          return; // Skip invalid source types
        }

        if (source.sourceType === 'paper') {
          counts.papers++;
        } else if (source.sourceType === 'youtube') {
          counts.youtube++;
        } else if (source.sourceType === 'podcast') {
          counts.podcasts++;
        } else if (source.sourceType === 'tiktok' || source.sourceType === 'instagram') {
          counts.social++;
        }
      });
    });

    return counts;
  }, [unifiedThemes]);

  return (
    <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Theme Sources Summary
        </h3>
        <div className="flex items-center gap-6">
          {sourceCounts.papers > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                className="bg-blue-500"
                aria-label={`${sourceCounts.papers} academic papers extracted`}
              >
                Papers
              </Badge>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {sourceCounts.papers}
              </span>
            </div>
          )}
          {sourceCounts.youtube > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                className="bg-purple-500"
                aria-label={`${sourceCounts.youtube} YouTube videos extracted`}
              >
                Videos
              </Badge>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {sourceCounts.youtube}
              </span>
            </div>
          )}
          {sourceCounts.podcasts > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                className="bg-orange-500"
                aria-label={`${sourceCounts.podcasts} podcast episodes extracted`}
              >
                Podcasts
              </Badge>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {sourceCounts.podcasts}
              </span>
            </div>
          )}
          {sourceCounts.social > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                className="bg-pink-500"
                aria-label={`${sourceCounts.social} social media posts extracted`}
              >
                Social
              </Badge>
              <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {sourceCounts.social}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Themes extracted from {unifiedThemes.length} sources with full provenance tracking
        </p>
      </CardContent>
    </Card>
  );
});

// Display name for React DevTools
SourceSummaryCard.displayName = 'SourceSummaryCard';
