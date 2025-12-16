/**
 * Enhanced Search Results Container
 * World-class paper display and management system for researchers
 * 
 * Features:
 * - One paper per row (list view)
 * - Default: all papers selected
 * - Select All / Deselect All bulk actions
 * - Advanced filters (year, citations, authors, etc.)
 * - Sorting (quality, year, citations, etc.)
 * - Pagination (50 papers per page)
 * - Individual selection/deselection
 * - Excellent UI with researcher-focused design
 * 
 * @module SearchResultsContainerEnhanced
 */

'use client';

import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PaperCard } from '../components/PaperCard';
import { PaperFiltersPanel, type PaperFilters } from '../components/PaperFiltersPanel';
import { PaperSortControls, type SortConfig } from '../components/PaperSortControls';
import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

const PAPERS_PER_PAGE = 50;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Phase 10.160 FIX: Widened default filters to include ALL papers
 * This ensures "X papers" in results matches "X FINAL" in pipeline visualization
 * Previous defaults (year 2010+, 1-20 authors) were filtering out valid papers
 */
const DEFAULT_FILTERS: PaperFilters = {
  yearRange: [1900, CURRENT_YEAR], // Include all years by default
  citationsPerYearRange: [0, 1000], // Wide range to include all
  authorCountRange: [0, 100], // Include papers with 0 authors (some preprints) and large teams
  openAccessOnly: false,
  hasPdfOnly: false,
  publicationTypes: [],
  minimumQualityScore: 0,
};

const DEFAULT_SORT: SortConfig = {
  field: 'quality_score',
  direction: 'desc',
};

// ============================================================================
// Types
// ============================================================================

export interface SearchResultsContainerEnhancedProps {
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply filters to papers
 */
function applyFilters(papers: Paper[], filters: PaperFilters): Paper[] {
  return papers.filter((paper) => {
    // Year filter
    if (paper.year) {
      if (paper.year < filters.yearRange[0] || paper.year > filters.yearRange[1]) {
        return false;
      }
    }

    // Citations per year filter
    if (paper.citationCount && paper.year) {
      const yearsOld = CURRENT_YEAR - paper.year;
      const citationsPerYear = yearsOld > 0 ? paper.citationCount / yearsOld : paper.citationCount;
      if (
        citationsPerYear < filters.citationsPerYearRange[0] ||
        citationsPerYear > filters.citationsPerYearRange[1]
      ) {
        return false;
      }
    }

    // Author count filter
    const authorCount = paper.authors?.length || 0;
    if (
      authorCount < filters.authorCountRange[0] ||
      authorCount > filters.authorCountRange[1]
    ) {
      return false;
    }

    // Quality score filter
    if (paper.qualityScore && paper.qualityScore < filters.minimumQualityScore) {
      return false;
    }

    // Open access filter
    if (filters.openAccessOnly) {
      // Check if paper has open access status (truthy and not 'closed' or 'subscription')
      const isOpenAccess = paper.openAccessStatus && 
        !['closed', 'subscription', 'restricted'].includes(paper.openAccessStatus.toLowerCase());
      if (!isOpenAccess) {
        return false;
      }
    }

    // Has PDF filter
    if (filters.hasPdfOnly && !paper.pdfUrl) {
      return false;
    }

    // Publication type filter
    if (filters.publicationTypes.length > 0) {
      // Handle both array and string formats for publicationType
      const paperTypes = Array.isArray(paper.publicationType)
        ? paper.publicationType
        : paper.publicationType
        ? [paper.publicationType]
        : [];
      
      const matchesType = filters.publicationTypes.some((type) =>
        paperTypes.some((pt) => {
          const ptStr = typeof pt === 'string' ? pt : String(pt);
          return ptStr.toLowerCase().includes(type.toLowerCase());
        })
      );
      if (!matchesType) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort papers
 * Phase 10.169: Use overallScore (harmonic mean of relevance × quality) for quality sorting
 */
function sortPapers(papers: Paper[], sortConfig: SortConfig): Paper[] {
  const sorted = [...papers].sort((a, b) => {
    let comparison = 0;

    switch (sortConfig.field) {
      case 'quality_score':
        // Phase 10.169: Use overallScore (composite of relevance + quality via harmonic mean)
        // This is the score papers are ranked by in the backend quality selection stage
        // Falls back to qualityScore if overallScore not available
        comparison = (a.overallScore ?? a.qualityScore ?? 0) - (b.overallScore ?? b.qualityScore ?? 0);
        break;
      case 'publication_year':
        comparison = (a.year || 0) - (b.year || 0);
        break;
      case 'citations':
        comparison = (a.citationCount || 0) - (b.citationCount || 0);
        break;
      case 'citations_per_year': {
        const aYearsOld = CURRENT_YEAR - (a.year || CURRENT_YEAR);
        const bYearsOld = CURRENT_YEAR - (b.year || CURRENT_YEAR);
        const aCitationsPerYear = aYearsOld > 0 ? (a.citationCount || 0) / aYearsOld : (a.citationCount || 0);
        const bCitationsPerYear = bYearsOld > 0 ? (b.citationCount || 0) / bYearsOld : (b.citationCount || 0);
        comparison = aCitationsPerYear - bCitationsPerYear;
        break;
      }
      case 'relevance':
        // Phase 10.169: Use overallScore for relevance sorting (composite score)
        // overallScore = harmonic mean of (relevance × quality), which gives best results
        comparison = (a.overallScore ?? a.qualityScore ?? 0) - (b.overallScore ?? b.qualityScore ?? 0);
        break;
      case 'author_count':
        comparison = (a.authors?.length || 0) - (b.authors?.length || 0);
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Count active filters
 * Phase 10.160: Updated defaults to match widened filter ranges
 */
function countActiveFilters(filters: PaperFilters): number {
  let count = 0;

  // Year range (if not default - Phase 10.160: Changed default from 2010 to 1900)
  if (filters.yearRange[0] !== 1900 || filters.yearRange[1] !== CURRENT_YEAR) {
    count++;
  }

  // Citations per year range (if not default - Phase 10.160: Changed default max from 100 to 1000)
  if (filters.citationsPerYearRange[0] !== 0 || filters.citationsPerYearRange[1] !== 1000) {
    count++;
  }

  // Author count range (if not default - Phase 10.160: Changed from 1-20 to 0-100)
  if (filters.authorCountRange[0] !== 0 || filters.authorCountRange[1] !== 100) {
    count++;
  }

  // Quality score (if not default)
  if (filters.minimumQualityScore > 0) {
    count++;
  }

  // Boolean filters
  if (filters.openAccessOnly) count++;
  if (filters.hasPdfOnly) count++;

  // Publication types
  if (filters.publicationTypes.length > 0) count++;

  return count;
}

// ============================================================================
// Component
// ============================================================================

export const SearchResultsContainerEnhanced = memo(function SearchResultsContainerEnhanced({
  className,
}: SearchResultsContainerEnhancedProps = {}) {
  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  const papers = useLiteratureSearchStore((s) => s.papers);
  const loading = useLiteratureSearchStore((s) => s.loading);
  const query = useLiteratureSearchStore((s) => s.query);
  const selectedPapers = useLiteratureSearchStore((s) => s.selectedPapers);
  const togglePaperSelection = useLiteratureSearchStore((s) => s.togglePaperSelection);
  const selectMultiplePapers = useLiteratureSearchStore((s) => s.selectMultiplePapers);
  const clearSelection = useLiteratureSearchStore((s) => s.clearSelection);

  const savedPapers = usePaperManagementStore((s) => s.savedPapers);
  const extractingPapers = usePaperManagementStore((s) => s.extractingPapers);
  const extractedPapers = usePaperManagementStore((s) => s.extractedPapers);
  const handleTogglePaperSave = usePaperManagementStore((s) => s.handleTogglePaperSave);

  // ==========================================================================
  // LOCAL STATE
  // ==========================================================================

  const [filters, setFilters] = useState<PaperFilters>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to track the last set of papers we auto-selected
  const lastAutoSelectedPapersRef = useRef<string>('');

  // ==========================================================================
  // MEMOIZED VALUES
  // Note: useMemo must come before useEffect that depends on them
  // ==========================================================================

  /**
   * Apply filters and sorting to papers
   */
  const processedPapers = useMemo(() => {
    let result = papers;

    // Apply filters
    result = applyFilters(result, filters);

    // Apply sorting
    result = sortPapers(result, sortConfig);

    return result;
  }, [papers, filters, sortConfig]);

  /**
   * Paginate papers
   */
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAPERS_PER_PAGE;
    const endIndex = startIndex + PAPERS_PER_PAGE;
    return processedPapers.slice(startIndex, endIndex);
  }, [processedPapers, currentPage]);

  /**
   * Pagination stats
   */
  const paginationStats = useMemo(() => {
    const totalPages = Math.ceil(processedPapers.length / PAPERS_PER_PAGE);
    const startIndex = (currentPage - 1) * PAPERS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * PAPERS_PER_PAGE, processedPapers.length);

    return {
      totalPages,
      startIndex,
      endIndex,
      totalResults: processedPapers.length,
    };
  }, [processedPapers.length, currentPage]);

  /**
   * Count selected papers on current page
   */
  const selectedCountCurrentPage = useMemo(() => {
    return paginatedPapers.filter((p) => selectedPapers.has(p.id)).length;
  }, [paginatedPapers, selectedPapers]);

  /**
   * Check if all current page papers are selected
   */
  const allCurrentPageSelected = useMemo(() => {
    return (
      paginatedPapers.length > 0 &&
      paginatedPapers.every((p) => selectedPapers.has(p.id))
    );
  }, [paginatedPapers, selectedPapers]);

  /**
   * Count active filters
   */
  const activeFilterCount = useMemo(() => {
    return countActiveFilters(filters);
  }, [filters]);

  /**
   * Check if paper is saved
   */
  const isPaperSaved = useCallback(
    (paperId: string): boolean => {
      return savedPapers.some((p) => p.id === paperId);
    },
    [savedPapers]
  );

  // ==========================================================================
  // EFFECTS
  // Note: These must come after useMemo declarations they depend on
  // ==========================================================================

  /**
   * Auto-select ALL papers when search results change
   * PHASE 10.942 BUGFIX: Fixed auto-selection to ALWAYS select all papers on new search
   * PHASE 10.160 FIX: Changed to select from processedPapers (filtered) instead of papers (all)
   * This ensures "X selected" badge matches "X papers" displayed count
   * DEFAULT BEHAVIOR: All VISIBLE papers selected on new search
   */
  useEffect(() => {
    // Phase 10.160: Use processedPapers signature (filtered papers) for accurate selection
    // This prevents mismatch between "X selected" and "X papers" in the UI
    const papersSignature = processedPapers.map((p) => p.id).sort().join(',');

    // Only auto-select if:
    // 1. We have papers
    // 2. This is a NEW set of papers (different from last auto-selected set)
    // BUGFIX: Removed `selectedPapers.size === 0` condition - we ALWAYS want to
    // select all papers when a new search happens, even if user had previous selections
    if (
      processedPapers.length > 0 &&
      papersSignature !== lastAutoSelectedPapersRef.current
    ) {
      // Phase 10.160 FIX: Select only visible (filtered) papers, not all papers
      // This ensures the "X selected" badge matches the displayed "X papers" count
      const visiblePaperIds = processedPapers.map((p) => p.id);

      // Defensive: Only select if we have valid IDs
      if (visiblePaperIds.length > 0 && visiblePaperIds.every((id) => id && typeof id === 'string')) {
        // BUGFIX: Clear existing selections first, then select all visible papers
        // This ensures a clean slate for each new search
        clearSelection();
        selectMultiplePapers(visiblePaperIds);
        lastAutoSelectedPapersRef.current = papersSignature;

        logger.info('Auto-selected ALL visible papers from new search', 'SearchResultsContainerEnhanced', {
          count: visiblePaperIds.length,
          filteredFrom: papers.length,
        });
      }
    }
  }, [processedPapers, papers.length, selectMultiplePapers, clearSelection]);

  /**
   * Reset to page 1 when filters or sort changes
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Select all papers on current page
   */
  const handleSelectAll = useCallback(() => {
    const currentPageIds = paginatedPapers.map((p) => p.id);
    selectMultiplePapers(currentPageIds);

    logger.info('Selected all papers on current page', 'SearchResultsContainerEnhanced', {
      count: currentPageIds.length,
      page: currentPage,
    });
  }, [paginatedPapers, currentPage, selectMultiplePapers]);

  /**
   * Deselect all papers (globally)
   */
  const handleDeselectAll = useCallback(() => {
    clearSelection();

    logger.info('Deselected all papers', 'SearchResultsContainerEnhanced');
  }, [clearSelection]);

  /**
   * Toggle selection for individual paper
   */
  const handleToggleSelection = useCallback(
    (paperId: string) => {
      togglePaperSelection(paperId);

      logger.debug('Toggled paper selection', 'SearchResultsContainerEnhanced', {
        paperId,
        nowSelected: !selectedPapers.has(paperId),
      });
    },
    [togglePaperSelection, selectedPapers]
  );

  /**
   * Handle paper save/unsave
   */
  const handleSavePaper = useCallback(
    (paper: Paper) => {
      if (!paper || !paper.id) {
        logger.warn('Invalid paper for save', 'SearchResultsContainerEnhanced');
        return;
      }

      handleTogglePaperSave(paper);

      const action = isPaperSaved(paper.id) ? 'unsaved' : 'saved';
      logger.info(`Paper ${action}`, 'SearchResultsContainerEnhanced', {
        paperId: paper.id,
        title: paper.title,
      });
    },
    [handleTogglePaperSave, isPaperSaved]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    logger.info('Cleared all filters', 'SearchResultsContainerEnhanced');
  }, []);

  /**
   * Pagination handlers
   */
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(() => goToPage(paginationStats.totalPages), [goToPage, paginationStats.totalPages]);
  const goToPreviousPage = useCallback(() => goToPage(Math.max(1, currentPage - 1)), [goToPage, currentPage]);
  const goToNextPage = useCallback(() => goToPage(Math.min(paginationStats.totalPages, currentPage + 1)), [goToPage, currentPage, paginationStats.totalPages]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (!query) {
      return (
        <div className="text-center py-16">
          <Search className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Ready to Search
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Select academic databases and execute a search to discover relevant research papers
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Papers Found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {processedPapers.length === 0 && papers.length > 0
            ? 'No papers match your current filters. Try adjusting your filter criteria.'
            : 'Try adjusting your search query or selecting different databases.'}
        </p>
      </div>
    );
  };

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <div className="text-center py-16">
      <Loader2 className="w-20 h-20 mx-auto text-blue-500 animate-spin mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Searching Literature...
      </h3>
      <p className="text-gray-500">
        {query ? `Searching for "${query}"` : 'Processing your request'}
      </p>
    </div>
  );

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (paginationStats.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{paginationStats.startIndex}</span> to{' '}
          <span className="font-semibold">{paginationStats.endIndex}</span> of{' '}
          <span className="font-semibold">{paginationStats.totalResults}</span> papers
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-9"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-9"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1 px-3">
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{paginationStats.totalPages}</span>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === paginationStats.totalPages}
            className="h-9"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === paginationStats.totalPages}
            className="h-9"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters Panel */}
      {papers.length > 0 && (
        <PaperFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Main Results Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="w-6 h-6 text-blue-600" />
                Search Results
                {processedPapers.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-base">
                    {processedPapers.length} {processedPapers.length === 1 ? 'paper' : 'papers'}
                  </Badge>
                )}
              </CardTitle>
              {query && (
                <p className="text-sm text-gray-500 mt-2">
                  Results for: <span className="font-medium">&quot;{query}&quot;</span>
                </p>
              )}
            </div>

            {/* Selection Badge */}
            {selectedPapers.size > 0 && (
              <Badge variant="default" className="bg-blue-600 text-base px-4 py-2">
                {selectedPapers.size} selected
              </Badge>
            )}
          </div>

          {/* Controls Row */}
          {processedPapers.length > 0 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              {/* Bulk Selection Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={allCurrentPageSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={allCurrentPageSelected ? handleDeselectAll : handleSelectAll}
                  className="h-9"
                >
                  {allCurrentPageSelected ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  {allCurrentPageSelected ? 'Deselect All' : 'Select All'}
                </Button>

                {selectedPapers.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="h-9"
                  >
                    Clear Selection ({selectedPapers.size})
                  </Button>
                )}

                <span className="text-xs text-gray-500 ml-2">
                  {selectedCountCurrentPage}/{paginatedPapers.length} on this page
                </span>
              </div>

              {/* Sort Controls */}
              <PaperSortControls sortConfig={sortConfig} onSortChange={setSortConfig} />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Loading state */}
          {loading && renderLoadingState()}

          {/* Empty state */}
          {!loading && processedPapers.length === 0 && renderEmptyState()}

          {/* Results list */}
          {!loading && paginatedPapers.length > 0 && (
            <>
              {/* Info Alert */}
              <div className="px-6 pt-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    <strong>💡 Tip:</strong> All papers are selected by default. Use checkboxes to
                    deselect specific papers or click &quot;Deselect All&quot; to start fresh.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Papers List (One per row) */}
              <div className="divide-y" role="list" aria-label="Search results">
                {paginatedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    role="listitem"
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* AUDIT FIX: Pass handlers directly instead of inline arrow functions
                        to prevent unnecessary re-renders. Handlers already accept paper/id. */}
                    <PaperCard
                      paper={paper}
                      isSelected={selectedPapers.has(paper.id)}
                      isSaved={isPaperSaved(paper.id)}
                      isExtracting={extractingPapers.has(paper.id)}
                      isExtracted={extractedPapers.has(paper.id)}
                      onToggleSelection={handleToggleSelection}
                      onToggleSave={handleSavePaper}
                      getSourceIcon={getAcademicIcon}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

