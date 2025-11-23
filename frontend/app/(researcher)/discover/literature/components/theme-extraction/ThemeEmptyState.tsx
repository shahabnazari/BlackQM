/**
 * Theme Empty State Component
 * Shows guidance when no themes have been extracted
 *
 * **Purpose:**
 * Provides user guidance and status feedback when theme extraction
 * hasn't been performed yet or failed to produce results
 *
 * **Features:**
 * - Custom empty state messaging
 * - Loading state display during extraction
 * - Warning message when extraction completes with no themes
 * - Clear visual feedback with icons and color coding
 *
 * **Enterprise Standards:**
 * - ✅ Performance optimized with React.memo()
 * - ✅ WCAG 2.1 AA compliant with ARIA attributes
 * - ✅ Semantic HTML with proper roles and live regions
 * - ✅ Type-safe with explicit return types
 *
 * @module ThemeEmptyState
 */

'use client';

import React from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default empty state message shown when no themes extracted
 */
const DEFAULT_EMPTY_MESSAGE =
  'Search for papers and/or transcribe videos, then click "Extract Themes from All Sources" to identify research themes with full provenance tracking';

// ============================================================================
// Types
// ============================================================================

export interface ThemeEmptyStateProps {
  /** Whether theme extraction is currently in progress */
  analyzingThemes: boolean;

  /** Set of paper IDs that have been extracted */
  extractedPapers: Set<string>;

  /** Current unified themes array */
  unifiedThemes: UnifiedTheme[];

  /** Optional custom empty state message */
  emptyStateMessage?: string | undefined;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ThemeEmptyState - Shows guidance when no themes extracted
 *
 * Displays different states:
 * 1. Default empty state with guidance message
 * 2. Loading state during theme extraction
 * 3. Warning state when extraction completes with no themes
 *
 * **Performance:**
 * - Memoized with React.memo() to prevent unnecessary re-renders
 *
 * **Accessibility:**
 * - Uses semantic ARIA roles (status, alert)
 * - Live regions (polite, assertive) for dynamic content
 * - Decorative icons marked with aria-hidden
 *
 * @param {ThemeEmptyStateProps} props - Component props
 * @returns {JSX.Element} Rendered empty state
 */
export const ThemeEmptyState = React.memo<ThemeEmptyStateProps>(function ThemeEmptyState({
  analyzingThemes,
  extractedPapers,
  unifiedThemes,
  emptyStateMessage,
}): JSX.Element {
  return (
    <div className="text-center py-12 text-gray-500">
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
      <p className="text-lg font-medium mb-2">No themes extracted yet</p>
      <p className="text-sm text-gray-400 mb-4">{emptyStateMessage || DEFAULT_EMPTY_MESSAGE}</p>

      {/* Loading State */}
      {analyzingThemes && (
        <div
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg inline-block"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="w-6 h-6 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-2"
            aria-hidden="true"
          />
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Extraction in progress...
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
            Themes will appear here automatically when complete
          </p>
        </div>
      )}

      {/* Warning State - Extraction completed but no themes found */}
      {!analyzingThemes && extractedPapers.size > 0 && unifiedThemes.length === 0 && (
        <div
          className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg inline-block"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Extraction completed but no themes were returned
            </p>
          </div>
          <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
            This might indicate insufficient content in selected sources
          </p>
        </div>
      )}
    </div>
  );
});

// Display name for React DevTools
ThemeEmptyState.displayName = 'ThemeEmptyState';
