/**
 * Literature Search Hook - Phase 10.1 Day 5
 *
 * Enterprise-grade hook for managing academic literature search operations.
 * Extracts search logic from God Component pattern to improve maintainability.
 *
 * @module useLiteratureSearch
 * @since Phase 10.1 Day 5
 * @author VQMethod Team
 *
 * **Features:**
 * - Academic database selection and management
 * - Search execution with comprehensive filtering
 * - Query correction and validation
 * - Auto-selection of results
 * - Integration with Zustand store for state persistence
 * - TypeScript strict mode compliance
 *
 * **Usage:**
 * ```typescript
 * const {
 *   academicDatabases,
 *   setAcademicDatabases,
 *   queryCorrectionMessage,
 *   handleSearch,
 *   isSearching,
 * } = useLiteratureSearch();
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { literatureAPI } from '@/lib/services/literature-api.service';

/**
 * Query correction message structure
 */
export interface QueryCorrectionMessage {
  original: string;
  corrected: string;
}

/**
 * Search hook configuration options
 */
export interface UseLiteratureSearchConfig {
  /** Callback when search completes successfully */
  onSearchSuccess?: (paperCount: number, total: number) => void;
  /** Callback when search fails */
  onSearchError?: (error: Error) => void;
  /** Auto-select all papers after search (default: true) */
  autoSelectPapers?: boolean;
  /** Switch to results tab after search (default: true) */
  autoSwitchToResults?: boolean;
}

/**
 * Return type for useLiteratureSearch hook
 */
export interface UseLiteratureSearchReturn {
  // Database selection state
  academicDatabases: string[];
  setAcademicDatabases: (databases: string[]) => void;

  // Query correction
  queryCorrectionMessage: QueryCorrectionMessage | null;
  clearQueryCorrection: () => void;

  // Search operations
  handleSearch: () => Promise<void>;
  isSearching: boolean;

  // Zustand store access (for convenience)
  query: string;
  papers: any[];
  loading: boolean;
  totalResults: number;
  filters: any;
  appliedFilters: any;
}

// Default academic databases
const DEFAULT_ACADEMIC_DATABASES = [
  'pubmed',
  'semantic-scholar',
  'crossref',
  'arxiv',
];

/**
 * Hook for managing literature search operations
 *
 * **Architecture:**
 * - Wraps Zustand store for global state management
 * - Adds search-specific logic and handlers
 * - Provides database selection (not in Zustand)
 * - Handles query correction notifications
 *
 * @param {UseLiteratureSearchConfig} config - Configuration options
 * @returns {UseLiteratureSearchReturn} Search state and operations
 */
export function useLiteratureSearch(
  config: UseLiteratureSearchConfig = {}
): UseLiteratureSearchReturn {
  const {
    onSearchSuccess,
    onSearchError,
    autoSelectPapers = true,
    // autoSwitchToResults not implemented yet - reserved for future use
  } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  // Local state (not in Zustand)
  const [academicDatabases, setAcademicDatabases] = useState<string[]>(
    DEFAULT_ACADEMIC_DATABASES
  );
  const [queryCorrectionMessage, setQueryCorrectionMessage] =
    useState<QueryCorrectionMessage | null>(null);

  // Zustand store state and actions
  const {
    query,
    papers,
    loading,
    totalResults,
    currentPage,
    filters,
    appliedFilters,
    // setQuery, setCurrentPage - not used, only reading
    setPapers,
    setLoading,
    setTotalResults,
    getAppliedFilterCount,
  } = useLiteratureSearchStore();

  // Prevent duplicate search requests
  const isSearchingRef = useRef(false);

  // ===========================
  // SEARCH OPERATIONS
  // ===========================

  /**
   * Execute academic literature search
   *
   * **Features:**
   * - Validates query before searching
   * - Applies all filters from Zustand store
   * - Handles query auto-correction
   * - Auto-selects papers for extraction
   * - Provides helpful error messages based on filters
   * - Prevents duplicate concurrent searches
   *
   * **Flow:**
   * 1. Validate query
   * 2. Build search parameters with filters
   * 3. Call API
   * 4. Handle query correction
   * 5. Update state with results
   * 6. Auto-select papers (if enabled)
   * 7. Show appropriate toast messages
   */
  const handleSearch = useCallback(async () => {
    // Input validation
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    // Prevent duplicate searches
    if (isSearchingRef.current) {
      console.log(
        '⏳ Search already in progress, skipping duplicate request...'
      );
      return;
    }

    isSearchingRef.current = true;
    setLoading(true);

    try {
      console.log('='.repeat(80));
      console.log('🔍 SEARCH START');
      console.log('Query:', query);
      console.log('Applied Filters:', appliedFilters);
      console.log('Selected Sources (academicDatabases):', academicDatabases);
      console.log('Sources count:', academicDatabases.length);

      // Build search parameters with filters
      const searchParams = {
        query,
        sources: academicDatabases,
        ...(appliedFilters.yearFrom && { yearFrom: appliedFilters.yearFrom }),
        ...(appliedFilters.yearTo && { yearTo: appliedFilters.yearTo }),
        ...(appliedFilters.minCitations !== undefined && {
          minCitations: appliedFilters.minCitations,
        }),
        ...(appliedFilters.publicationType !== 'all'
          ? { publicationType: appliedFilters.publicationType }
          : {}),
        ...(appliedFilters.author &&
          appliedFilters.author.trim().length > 0 && {
            author: appliedFilters.author.trim(),
            authorSearchMode: appliedFilters.authorSearchMode,
          }),
        // Enhanced sorting with quality metrics
        ...(appliedFilters.sortBy !== undefined && {
          sortByEnhanced: appliedFilters.sortBy,
        }),
        page: currentPage,
        limit: 20,
        includeCitations: true,
        // Enterprise research-grade: 100-word minimum abstract
        minAbstractLength: 100,
      };

      console.log('📤 Sending search params:', searchParams);

      const result = await literatureAPI.searchLiterature(searchParams);

      console.log('✅ Search result received:', result);
      console.log('📚 Papers array:', result.papers);
      console.log('📚 Papers count:', result.papers?.length);
      console.log('📈 Total results:', result.total);
      console.log('='.repeat(80));

      // Check if query was auto-corrected (Google-like UX)
      if ((result as any).correctedQuery && (result as any).originalQuery) {
        setQueryCorrectionMessage({
          original: (result as any).originalQuery,
          corrected: (result as any).correctedQuery,
        });
      } else {
        setQueryCorrectionMessage(null);
      }

      // Check if filters are too restrictive (no results)
      if (result.total === 0 && getAppliedFilterCount() > 0) {
        const hasStrictFilters =
          (appliedFilters.minCitations && appliedFilters.minCitations > 0) ||
          (appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= new Date().getFullYear() - 2);

        if (hasStrictFilters) {
          toast.warning(
            'No papers found with current filters. Try removing the citation filter or expanding the year range.',
            { duration: 6000 }
          );
        }
      }

      // Handle results
      if (result.papers && result.papers.length > 0) {
        setPapers(result.papers);
        setTotalResults(result.total);

        console.log(
          '✅ Papers state updated with',
          result.papers.length,
          'papers'
        );

        // Success callback
        onSearchSuccess?.(result.papers.length, result.total);

        // Note: autoSelectPapers is handled by page.tsx after search completes
        const selectionMessage = autoSelectPapers
          ? ' All papers selected by default.'
          : '';
        toast.success(
          `Found ${result.total} papers across ${academicDatabases.length} databases.${selectionMessage}`
        );
      } else {
        // No results found
        console.warn('⚠️ No papers in result');
        setPapers([]);
        setTotalResults(0);

        // Provide helpful error messages based on filters
        if (getAppliedFilterCount() > 0) {
          const filterHints = [];
          if (appliedFilters.minCitations && appliedFilters.minCitations > 0) {
            filterHints.push(
              `citation filter (≥${appliedFilters.minCitations})`
            );
          }
          if (
            appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= new Date().getFullYear() - 2
          ) {
            filterHints.push(
              `recent year filter (${appliedFilters.yearFrom}+)`
            );
          }

          if (filterHints.length > 0) {
            toast.info(
              `No papers found. Your ${filterHints.join(' and ')} may be too restrictive. Try removing filters or adjusting the year range.`,
              { duration: 7000 }
            );
          } else {
            toast.info(
              'No papers found with current filters. Try removing some filters.'
            );
          }
        } else {
          toast.info('No papers found. Try adjusting your search terms.');
        }
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast.error('Search failed. Please try again.');
      onSearchError?.(error as Error);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, [
    query,
    appliedFilters,
    academicDatabases,
    currentPage,
    autoSelectPapers,
    onSearchSuccess,
    onSearchError,
    setLoading,
    setPapers,
    setTotalResults,
    getAppliedFilterCount,
  ]);

  /**
   * Clear query correction message
   */
  const clearQueryCorrection = useCallback(() => {
    setQueryCorrectionMessage(null);
  }, []);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Database selection
    academicDatabases,
    setAcademicDatabases,

    // Query correction
    queryCorrectionMessage,
    clearQueryCorrection,

    // Search operations
    handleSearch,
    isSearching: isSearchingRef.current,

    // Zustand store access (convenience)
    query,
    papers,
    loading,
    totalResults,
    filters,
    appliedFilters,
  };
}
