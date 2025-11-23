/**
 * ContentDepthAnalysis Component
 * Phase 10.91 Day 12 - Extracted from AcademicResourcesPanel.tsx (lines 560-628)
 * AUDIT FIXED: Removed 'any' type assertions, added proper type extension
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - COMPONENT EXTRACTION
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * Extracted content depth analysis UI to reduce parent component size and
 * improve modularity. Displays full-text vs abstract-only metrics for
 * selected papers with research methodology transparency.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - Mixed with database selection and action buttons
 * - Inline calculation logic cluttering parent
 * - Hard to test metrics calculations
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Focused component with clear responsibility
 * - Self-contained metric calculations
 * - Testable in isolation
 * - Reusable across different contexts
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY THIS:
 * ✅ DO:
 * - Update metric calculations for new content types
 * - Add new content quality indicators
 * - Enhance visual presentation of stats
 * - Add research methodology citations
 *
 * ❌ DON'T:
 * - Add business logic (keep calculations pure)
 * - Make API calls (use props for data)
 * - Mix with other concerns (database selection, etc.)
 * - Use `any` types (FIXED: now uses proper type extension)
 *
 * ============================================================================
 * 📊 PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. **Single Responsibility**: Only displays content depth metrics
 * 2. **Pure Functions**: All calculations derived from props
 * 3. **Type Safety**: Strong TypeScript typing (no `any`)
 * 4. **Accessibility**: Semantic HTML, clear labels
 * 5. **Research Transparency**: Citations for methodology
 */

'use client';

import React, { useMemo } from 'react';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended Paper type with full-text metadata
 * These fields are added by the full-text extraction service
 * Using type instead of interface to avoid extension conflicts
 */
type PaperWithFullText = Paper & {
  fullTextStatus?: 'success' | 'fetching' | 'failed' | 'pending';
  fullTextWordCount?: number;
};

export interface ContentDepthAnalysisProps {
  /** All papers in search results */
  papers: Paper[];
  /** Set of selected paper IDs */
  selectedPapers: Set<string>;
}

interface ContentMetrics {
  fullTextCount: number;
  fetchingCount: number;
  abstractOnlyCount: number;
  avgFullTextWords: number;
  avgAbstractWords: number;
}

// ============================================================================
// Component
// ============================================================================

export const ContentDepthAnalysis = React.memo<ContentDepthAnalysisProps>(
  function ContentDepthAnalysis({ papers, selectedPapers }) {
    // Calculate content depth metrics
    const metrics = useMemo<ContentMetrics>(() => {
      // Type-safe cast to extended type
      const selectedPaperObjects = papers.filter(p =>
        selectedPapers.has(p.id)
      ) as PaperWithFullText[];

      const fullTextCount = selectedPaperObjects.filter(
        p => p.fullTextStatus === 'success'
      ).length;

      const fetchingCount = selectedPaperObjects.filter(
        p => p.fullTextStatus === 'fetching'
      ).length;

      const abstractOnlyCount =
        selectedPaperObjects.length - fullTextCount - fetchingCount;

      const avgFullTextWords =
        fullTextCount > 0
          ? Math.round(
              selectedPaperObjects
                .filter(p => p.fullTextStatus === 'success')
                .reduce((sum, p) => sum + (p.fullTextWordCount || 0), 0) /
                fullTextCount
            )
          : 0;

      const avgAbstractWords =
        abstractOnlyCount > 0
          ? Math.round(
              selectedPaperObjects
                .filter(p => p.fullTextStatus !== 'success')
                .reduce((sum, p) => sum + (p.abstractWordCount || 0), 0) /
                abstractOnlyCount
            )
          : 0;

      return {
        fullTextCount,
        fetchingCount,
        abstractOnlyCount,
        avgFullTextWords,
        avgAbstractWords,
      };
    }, [papers, selectedPapers]);

    // Don't render if no papers selected or no full-text/fetching papers
    if (
      selectedPapers.size === 0 ||
      (metrics.fullTextCount === 0 && metrics.fetchingCount === 0)
    ) {
      return null;
    }

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Content Depth Analysis
        </h4>

        <div className="grid grid-cols-3 gap-3 text-xs">
          {/* Full-Text Papers */}
          {metrics.fullTextCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="font-semibold text-green-900">
                {metrics.fullTextCount} Full-Text Papers
              </div>
              <div className="text-green-700">
                Avg: {metrics.avgFullTextWords.toLocaleString()} words
              </div>
              <div className="text-green-600 text-[10px] mt-1">
                Deep coding (Braun & Clarke Stage 2)
              </div>
            </div>
          )}

          {/* Abstract-Only Papers */}
          {metrics.abstractOnlyCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="font-semibold text-blue-900">
                {metrics.abstractOnlyCount} Abstract-Only Papers
              </div>
              <div className="text-blue-700">
                Avg: {metrics.avgAbstractWords.toLocaleString()} words
              </div>
              <div className="text-blue-600 text-[10px] mt-1">
                Sufficient for theme ID
              </div>
            </div>
          )}

          {/* Fetching Papers */}
          {metrics.fetchingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 animate-pulse">
              <div className="font-semibold text-amber-900">
                {metrics.fetchingCount} Fetching...
              </div>
              <div className="text-amber-700">Processing PDFs</div>
              <div className="text-amber-600 text-[10px] mt-1">
                Wait for better depth
              </div>
            </div>
          )}
        </div>

        {/* Methodology Note */}
        <p className="text-xs text-blue-700 mt-3 leading-relaxed">
          <strong>Methodology:</strong> Full-text provides richer coding (40-50x
          more content) for high-quality papers (≥70 score). Abstracts sufficient
          for preliminary theme identification (Thomas & Harden 2008).
          {metrics.fetchingCount > 0 &&
            ' You may extract now or wait ~2 min for full-text to complete.'}
        </p>
      </div>
    );
  }
);
