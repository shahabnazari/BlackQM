/**
 * Search Results Container
 * Phase 10.935 Day 13 Afternoon: Critical Gap Fix - Search Results Display
 *
 * **Purpose:**
 * Self-contained container for displaying search results after literature search.
 * Bridges the gap between search execution and paper library management.
 *
 * **Responsibilities:**
 * - Display papers from search results
 * - Show paper metadata (title, authors, abstract, source, year)
 * - Provide individual paper actions (save, view details)
 * - Handle empty states and loading states
 * - Show source badges and metadata
 *
 * **Architecture Pattern:**
 * Self-Contained Container Component (Phase 10.935 Pattern)
 * - ZERO required props (fully self-contained)
 * - Gets ALL data from Zustand stores
 * - Uses store actions for handlers
 * - Optional config props only
 * - Fully independent and reusable
 *
 * **State Management:**
 * - useLiteratureSearchStore: Search results (papers), loading state, query
 * - usePaperManagementStore: Save/unsave actions, saved papers tracking
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper hooks usage (dependency arrays)
 * - ✅ Accessibility (semantic HTML, ARIA labels, keyboard nav)
 * - ✅ Performance (React.memo, useCallback, useMemo)
 * - ✅ Error and loading state handling
 * - ✅ Self-contained (zero required props)
 * - ✅ Enterprise logging (no console.log)
 *
 * @module SearchResultsContainer
 * @since Phase 10.935 Day 13 Afternoon
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  FileText,
  AlertCircle,
  Loader2,
  Database,
  BookOpen,
} from 'lucide-react';
import { PaperCard } from '../components/PaperCard';
import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Component Props
// ============================================================================

/**
 * SearchResultsContainer Props
 *
 * Phase 10.935 Day 13: Container is self-contained with OPTIONAL config props only.
 * All data and handlers come from stores.
 *
 * **Optional Configuration:**
 * - className: Custom CSS classes
 * - emptyStateMessage: Custom message when no results
 * - showSourceBadges: Show source type badges (default: true)
 *
 * **Data Sources (from stores):**
 * - papers: useLiteratureSearchStore().papers
 * - loading: useLiteratureSearchStore().loading
 * - query: useLiteratureSearchStore().query
 * - savedPapers: usePaperManagementStore().savedPapers
 *
 * **Handlers (from store):**
 * - handleTogglePaperSave: usePaperManagementStore().handleTogglePaperSave
 */
export interface SearchResultsContainerProps {
  /** Optional: Custom CSS class name */
  className?: string;
  /** Optional: Custom empty state message */
  emptyStateMessage?: string;
  /** Optional: Show source type badges (default: true) */
  showSourceBadges?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SearchResultsContainer - Displays search results after literature search
 *
 * Self-contained container that displays papers from search results with actions.
 *
 * **Phase 10.935 Day 13 Afternoon:** Critical Gap Fix
 * - Bridges search execution and paper library
 * - Allows users to view and save search results
 * - Self-contained (no required props)
 * - Enterprise-grade quality
 *
 * @example
 * ```tsx
 * // No props needed!
 * <SearchResultsContainer />
 *
 * // Or with custom config
 * <SearchResultsContainer
 *   emptyStateMessage="Try adjusting your search filters"
 *   showSourceBadges={true}
 * />
 * ```
 */
export const SearchResultsContainer = memo(function SearchResultsContainer({
  className,
  emptyStateMessage = 'No papers found. Try adjusting your search query or filters.',
  showSourceBadges = true,
}: SearchResultsContainerProps = {}) {
  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  // Literature search store - search results and state
  const papers = useLiteratureSearchStore((s) => s.papers);
  const loading = useLiteratureSearchStore((s) => s.loading);
  const query = useLiteratureSearchStore((s) => s.query);

  // Paper management store - save/unsave actions
  const savedPapers = usePaperManagementStore((s) => s.savedPapers);
  const handleTogglePaperSave = usePaperManagementStore((s) => s.handleTogglePaperSave);

  // ==========================================================================
  // MEMOIZED HANDLERS
  // ==========================================================================

  /**
   * Check if a paper is already saved
   * Used to show "Saved" vs "Save" button state
   */
  const isPaperSaved = useCallback(
    (paperId: string): boolean => {
      if (!paperId || typeof paperId !== 'string') {
        logger.warn('Invalid paperId for saved check', 'SearchResultsContainer', { paperId });
        return false;
      }

      return savedPapers.some((p) => p.id === paperId);
    },
    [savedPapers]
  );

  /**
   * Handle paper save/unsave toggle
   * Memoized to prevent unnecessary re-renders
   */
  const handleSavePaper = useCallback(
    (paper: Paper) => {
      // Input validation
      if (!paper || typeof paper !== 'object' || !paper.id) {
        logger.warn('Invalid paper for save toggle', 'SearchResultsContainer', {
          hasId: !!paper?.id,
          type: typeof paper,
        });
        return;
      }

      const action = isPaperSaved(paper.id) ? 'unsave' : 'save';

      handleTogglePaperSave(paper);

      logger.info(`Paper ${action}d from search results`, 'SearchResultsContainer', {
        paperId: paper.id,
        title: paper.title,
        action,
      });
    },
    [handleTogglePaperSave, isPaperSaved]
  );

  // ==========================================================================
  // MEMOIZED DERIVED STATE
  // ==========================================================================

  /**
   * Count of papers by source type
   * Used for source breakdown display
   */
  const sourceBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};

    papers.forEach((paper) => {
      const source = paper.source || 'unknown';
      breakdown[source] = (breakdown[source] || 0) + 1;
    });

    return breakdown;
  }, [papers]);

  /**
   * Count of already saved papers in results
   */
  const savedCount = useMemo(() => {
    return papers.filter((p) => isPaperSaved(p.id)).length;
  }, [papers, isPaperSaved]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  /**
   * Render empty state when no results
   */
  const renderEmptyState = () => {
    // Show "Ready to Search" if no query has been entered
    if (!query) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Ready to Search
          </h3>
          <p className="text-gray-500">
            Select sources above and execute a search to find relevant literature
          </p>
        </div>
      );
    }

    // Show "No Results Found" if search was executed but returned nothing
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Found</h3>
        <p className="text-gray-500">{emptyStateMessage}</p>
      </div>
    );
  };

  /**
   * Render loading state during search
   */
  const renderLoadingState = () => (
    <div className="text-center py-12">
      <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Searching Literature...</h3>
      <p className="text-gray-500">
        {query ? `Searching for "${query}"` : 'Processing your search request'}
      </p>
    </div>
  );

  /**
   * Render source breakdown badges
   */
  const renderSourceBreakdown = () => {
    if (!showSourceBadges || Object.keys(sourceBreakdown).length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(sourceBreakdown).map(([source, count]) => (
          <Badge key={source} variant="outline" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            {source}: {count}
          </Badge>
        ))}
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <Card className={className} data-testid="search-results-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Results
              {papers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
                </Badge>
              )}
            </CardTitle>
            {query && (
              <p className="text-sm text-gray-500 mt-1">
                Results for: <span className="font-medium">&quot;{query}&quot;</span>
              </p>
            )}
          </div>

          {/* Saved count indicator */}
          {savedCount > 0 && (
            <Badge variant="outline" className="text-xs">
              ⭐ {savedCount} saved
            </Badge>
          )}
        </div>

        {/* Source breakdown */}
        {renderSourceBreakdown()}
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {loading && renderLoadingState()}

        {/* Empty state */}
        {!loading && papers.length === 0 && renderEmptyState()}

        {/* Results grid */}
        {!loading && papers.length > 0 && (
          <>
            {/* Results info alert */}
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>Tip:</strong> Click &quot;Save&quot; to add papers to your library for
                theme extraction and analysis. Saved papers appear in the section below.
              </AlertDescription>
            </Alert>

            {/* Paper grid */}
            <div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Search results"
            >
              {papers.map((paper) => (
                <div key={paper.id} role="listitem">
                  <PaperCard
                    paper={paper}
                    isSelected={false}
                    isSaved={isPaperSaved(paper.id)}
                    isExtracting={false}
                    isExtracted={false}
                    onToggleSelection={() => {
                      /* Selection only in library */
                    }}
                    onToggleSave={() => handleSavePaper(paper)}
                    getSourceIcon={getAcademicIcon}
                  />
                </div>
              ))}
            </div>

            {/* Results footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {papers.length} results
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {savedCount} saved
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Scroll down to view saved papers and extract themes
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

SearchResultsContainer.displayName = 'SearchResultsContainer';
