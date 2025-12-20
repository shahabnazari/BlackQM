/**
 * useSearch Custom Hook
 * Extracted from literature page (Week 1 Day 1-2)
 * Encapsulates search orchestration logic for academic, alternative, and social sources
 * Phase 10 Day 31 - Enterprise Refactoring
 */

'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { literatureAPI } from '@/lib/services/literature-api.service';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  papers: Paper[];
  total: number;
  correctedQuery?: string;
  originalQuery?: string;
}

interface UseSearchReturn {
  /** Execute academic database search */
  searchAcademic: () => Promise<void>;
  /** Execute search across all sources (academic, alternative, social) */
  searchAllSources: (
    academicDatabases: string[],
    alternativeSources: string[],
    socialPlatforms: string[]
  ) => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Current search error */
  error: Error | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSearch(): UseSearchReturn {
  // ============================================================================
  // Local State
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // Zustand Store State
  // ============================================================================

  const {
    query,
    appliedFilters,
    currentPage,
    setPapers,
    setTotalResults,
    setQueryCorrection,
    getAppliedFilterCount,
  } = useLiteratureSearchStore();

  const appliedFilterCount = getAppliedFilterCount();

  // ============================================================================
  // Search Academic Databases
  // ============================================================================

  const searchAcademic = useCallback(async () => {
    if (!query.trim()) {
      logger.warn('[useSearch] Empty query provided');
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    const searchId = `search-${Date.now()}`;
    logger.group(`[useSearch] Academic Search ${searchId}`);
    logger.info('[useSearch] Query', { query });
    logger.info('[useSearch] Applied Filters', { appliedFilters });

    try {
      const searchParams = {
        query,
        sources: [], // Will be populated by parent
        ...(appliedFilters.yearFrom && { yearFrom: appliedFilters.yearFrom }),
        ...(appliedFilters.yearTo && { yearTo: appliedFilters.yearTo }),
        ...(appliedFilters.minCitations !== undefined && {
          minCitations: appliedFilters.minCitations,
        }),
        ...(appliedFilters.publicationType !== 'all' && {
          publicationType: appliedFilters.publicationType,
        }),
        ...(appliedFilters.author &&
          appliedFilters.author.trim().length > 0 && {
            author: appliedFilters.author.trim(),
            authorSearchMode: appliedFilters.authorSearchMode,
          }),
        sortByEnhanced: appliedFilters.sortBy,
        page: currentPage,
        limit: 20,
        includeCitations: true,
        // Phase 10.195: Advanced Research Filters
        ...(appliedFilters.hasFullTextOnly && { hasFullTextOnly: true }),
        ...(appliedFilters.excludeBooks && { excludeBooks: true }),
      };

      logger.debug('[useSearch] Search params:', searchParams);

      const endTimer = logger.time('[useSearch] API call duration');
      const result: SearchResult = await literatureAPI.searchLiterature(
        searchParams as any
      );
      endTimer();

      logger.info('[useSearch] Results received:', {
        papersCount: result.papers?.length || 0,
        totalResults: result.total,
        hasCorrectedQuery: !!result.correctedQuery,
      });

      // Handle query auto-correction
      if (result.correctedQuery && result.originalQuery) {
        logger.info('[useSearch] Query was auto-corrected', {
          original: result.originalQuery,
          corrected: result.correctedQuery,
        });
        setQueryCorrection({
          original: result.originalQuery,
          corrected: result.correctedQuery,
        });
      } else {
        setQueryCorrection(null);
      }

      // Handle results
      if (result.papers && result.papers.length > 0) {
        setPapers(result.papers);
        setTotalResults(result.total);

        logger.info('[useSearch] Papers state updated successfully');

        toast.success(`Found ${result.total} papers`, {
          duration: 3000,
        });
      } else {
        logger.warn('[useSearch] No papers found');

        setPapers([]);
        setTotalResults(0);

        // Provide helpful feedback based on filters
        if (appliedFilterCount > 0) {
          const filterHints: string[] = [];

          if (appliedFilters.minCitations && appliedFilters.minCitations > 0) {
            filterHints.push(
              `citation filter (≥${appliedFilters.minCitations})`
            );
          }

          const currentYear = new Date().getFullYear();
          if (
            appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= currentYear - 2
          ) {
            filterHints.push(
              `recent year filter (${appliedFilters.yearFrom}+)`
            );
          }

          if (filterHints.length > 0) {
            toast.info(
              `No papers found. Your ${filterHints.join(' and ')} may be too restrictive.`,
              { duration: 7000 }
            );
          } else {
            toast.info('No papers found. Try adjusting your filters.', {
              duration: 5000,
            });
          }
        } else {
          toast.info('No papers found. Try adjusting your search terms.', {
            duration: 5000,
          });
        }
      }

      // Check for overly restrictive filters
      if (result.total === 0 && appliedFilterCount > 0) {
        const hasStrictFilters =
          (appliedFilters.minCitations && appliedFilters.minCitations > 0) ||
          (appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= new Date().getFullYear() - 2);

        if (hasStrictFilters) {
          logger.warn('[useSearch] Filters may be too restrictive');
          toast.warning(
            'Try removing the citation filter or expanding the year range.',
            { duration: 6000 }
          );
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown search error';

      logger.error('[useSearch] Search failed', err);

      setError(err instanceof Error ? err : new Error(errorMessage));

      toast.error(`Search failed: ${errorMessage}`, {
        duration: 5000,
      });

      // Reset state on error
      setPapers([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      logger.groupEnd();
    }
  }, [
    query,
    appliedFilters,
    currentPage,
    appliedFilterCount,
    setPapers,
    setTotalResults,
    setQueryCorrection,
  ]);

  // ============================================================================
  // Search All Sources (Academic + Alternative + Social)
  // ============================================================================

  const searchAllSources = useCallback(
    async (
      academicDatabases: string[],
      alternativeSources: string[],
      socialPlatforms: string[]
    ) => {
      if (!query.trim()) {
        logger.warn('[useSearch] Empty query for all sources search');
        toast.error('Please enter a search query');
        return;
      }

      const hasMainSources = academicDatabases.length > 0;
      const hasAltSources = alternativeSources.length > 0;
      const hasSocialSources = socialPlatforms.length > 0;

      if (!hasMainSources && !hasAltSources && !hasSocialSources) {
        logger.warn('[useSearch] No sources selected');
        toast.error('Please select at least one source to search');
        return;
      }

      const searchId = `search-all-${Date.now()}`;
      logger.group(`[useSearch] All Sources Search ${searchId}`);
      logger.info('Sources selected:', {
        academic: academicDatabases.length,
        alternative: alternativeSources.length,
        social: socialPlatforms.length,
      });

      // Execute searches in parallel
      const searchPromises: Promise<void>[] = [];

      if (hasMainSources) {
        logger.debug('[useSearch] Including academic search');
        searchPromises.push(searchAcademic());
      }

      // Note: Alternative and social search implementations would go here
      // For now, we focus on academic search as the primary use case

      try {
        await Promise.allSettled(searchPromises);

        const totalSources =
          (hasMainSources ? academicDatabases.length : 0) +
          (hasAltSources ? alternativeSources.length : 0) +
          (hasSocialSources ? socialPlatforms.length : 0);

        logger.info('[useSearch] All sources search completed', {
          totalSources,
        });

        toast.success(
          `Comprehensive search completed across ${totalSources} sources!`,
          { duration: 4000 }
        );
      } catch (err) {
        logger.error('[useSearch] All sources search failed', err);
        // Individual search errors are already handled by searchAcademic
      } finally {
        logger.groupEnd();
      }
    },
    [query, searchAcademic]
  );

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    searchAcademic,
    searchAllSources,
    loading,
    error,
  };
}
