/**
 * Progressive Search Hook
 * Phase 10.1 Day 7 - Progressive Loading (200 Papers)
 *
 * Orchestrates loading 200 high-quality papers in 3 batches:
 * - Batch 1: 20 papers (fast, 2-3 seconds)
 * - Batch 2: 80 papers (10-15 seconds)
 * - Batch 3: 100 papers (15-20 seconds)
 *
 * Features:
 * - Quality score prioritization
 * - Real-time progress updates
 * - Cancellable requests
 * - Error handling
 * - Running quality score average
 *
 * @module useProgressiveSearch
 * @since Phase 10.1 Day 7
 */

'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { literatureAPI, type SearchLiteratureParams } from '@/lib/services/literature-api.service';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

interface BatchConfig {
  batchNumber: number;
  limit: number;
  description: string;
}

interface UseProgressiveSearchReturn {
  /** Execute progressive search (200 papers in 3 batches) */
  executeProgressiveSearch: () => Promise<void>;
  /** Cancel ongoing progressive search */
  cancelProgressiveSearch: () => void;
  /** Whether search is in progress */
  isSearching: boolean;
}

// ============================================================================
// Batch Configuration
// ============================================================================

// 🔧 Phase 10.6 Day 14.9: Dynamic batch allocation based on query complexity
// - BROAD queries: 500 papers (25 batches × 20)
// - SPECIFIC queries: 1000 papers (50 batches × 20)
// - COMPREHENSIVE queries: 1500 papers (75 batches × 20)
const BATCH_SIZE = 20;

// Function to generate batch configs dynamically
function generateBatchConfigs(targetPapers: number): BatchConfig[] {
  const totalBatches = Math.ceil(targetPapers / BATCH_SIZE);
  return Array.from({ length: totalBatches }, (_, i) => ({
    batchNumber: i + 1,
    limit: BATCH_SIZE,
    description: `Batch ${i + 1}/${totalBatches} (papers ${i * BATCH_SIZE + 1}-${(i + 1) * BATCH_SIZE})`,
  }));
}

// Default: 500 papers (25 batches) - will be updated after first response
let BATCH_CONFIGS: BatchConfig[] = generateBatchConfigs(500);

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProgressiveSearch(): UseProgressiveSearchReturn {
  // ============================================================================
  // State Management
  // ============================================================================

  const {
    query,
    appliedFilters,
    addPapers,
    setTotalResults,
    startProgressiveLoading,
    updateProgressiveLoading,
    completeProgressiveLoading,
    cancelProgressiveLoading,
    progressiveLoading,
    setSearchMetadata, // Phase 10.6 Day 14.5: Store aggregated metadata
  } = useLiteratureSearchStore();

  // Ref to track if search should be cancelled
  const isCancelledRef = useRef(false);

  // ============================================================================
  // Quality Score Calculation
  // ============================================================================

  /**
   * Calculate average quality score from papers
   * Quality score is based on: citations, impact factor, SJR, etc.
   */
  const calculateAverageQualityScore = useCallback((papers: Paper[]): number => {
    if (papers.length === 0) return 0;

    const scores = papers.map(paper => {
      // Quality score calculation
      let score = 50; // Base score

      // Citation metrics (up to +30 points)
      if (paper.citationCount) {
        const citationScore = Math.min(30, Math.log10(paper.citationCount + 1) * 10);
        score += citationScore;
      }

      // Citations per year (up to +10 points)
      if (paper.citationsPerYear && paper.citationsPerYear > 0) {
        score += Math.min(10, paper.citationsPerYear / 2);
      }

      // Journal quality (up to +10 points)
      if (paper.quartile === 'Q1') score += 10;
      else if (paper.quartile === 'Q2') score += 7;
      else if (paper.quartile === 'Q3') score += 4;

      // Explicit quality score from backend
      if (paper.qualityScore) {
        return paper.qualityScore;
      }

      return Math.min(100, score);
    });

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }, []);

  // ============================================================================
  // Batch Execution
  // ============================================================================

  /**
   * Execute a single batch of the progressive search
   * Phase 10.6 Day 14.5: Now returns both papers AND metadata
   */
  const executeBatch = useCallback(
    async (config: BatchConfig): Promise<{ papers: Paper[]; metadata: any }> => {
      // Check if cancelled
      if (isCancelledRef.current) {
        console.log(`⚠️ [useProgressiveSearch] Batch ${config.batchNumber} cancelled`);
        return { papers: [], metadata: null };
      }

      // Batch execution (logging moved to main function for visibility)
      try {
        // 🔧 FIX: Use batch number as page number (now that all batches have same limit)
        // With consistent limit=20:
        // - Batch 1 (page 1): papers 0-19
        // - Batch 2 (page 2): papers 20-39
        // - Batch 10 (page 10): papers 180-199
        const page = config.batchNumber;

        const searchParams: SearchLiteratureParams = {
          query,
          sources: [], // Will use all sources
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
          sortByEnhanced: 'quality_score' as const, // 🎯 KEY: Sort by quality
          page, // 🔧 FIX: Use batch number directly as page
          limit: config.limit,
          includeCitations: true,
          // Phase 10.1 Day 11: Removed strict filters - we only have abstracts, not full-text yet
          // minAbstractLength: 100 would require long abstracts (filters out 50% of papers)
          // minWordCount: 3000 would require full papers (filters out 100% of abstract-only papers)
          // These filters will be re-enabled when full-text extraction is implemented
        };

        // Search params logged in main function for visibility
        const result = await literatureAPI.searchLiterature(searchParams);

        // Guard against undefined result
        if (!result) {
          console.error(`❌ [Batch ${config.batchNumber}] API returned undefined result`);
          return {
            papers: [],
            metadata: null,
          };
        }

        console.log(`📦 [Batch ${config.batchNumber}] API Response:`, {
          hasPapers: !!result.papers,
          papersCount: result.papers?.length || 0,
          hasMetadata: !!result.metadata,
          metadataKeys: result.metadata ? Object.keys(result.metadata) : [],
        });

        // Phase 10.6 Day 14.5: Return BOTH papers and metadata
        return {
          papers: result.papers || [],
          metadata: result.metadata || null,
        };
      } catch (error) {
        console.error(`❌ [useProgressiveSearch] Batch ${config.batchNumber} failed:`, error);
        // Return empty result instead of throwing to allow other batches to continue
        return {
          papers: [],
          metadata: null,
        };
      }
    },
    [query, appliedFilters]
  );

  // ============================================================================
  // Progressive Search Execution
  // ============================================================================

  /**
   * Execute progressive search: Dynamic paper count based on query complexity
   * Phase 10.6 Day 14.9: 500 (BROAD) / 1000 (SPECIFIC) / 1500 (COMPREHENSIVE)
   */
  const executeProgressiveSearch = useCallback(async () => {
    // Validation
    if (!query.trim()) {
      console.log('⚠️ [useProgressiveSearch] Empty query provided');
      toast.error('Please enter a search query');
      return;
    }

    // Reset cancellation flag
    isCancelledRef.current = false;

    // Start progressive loading with default target (will be updated after first batch)
    const initialTarget = BATCH_CONFIGS.length * BATCH_SIZE;
    
    console.log('='.repeat(80));
    console.log('🚀 [useProgressiveSearch] Starting progressive search');
    console.log(`📊 Initial Target: ${initialTarget} papers in ${BATCH_CONFIGS.length} batches (${BATCH_SIZE} per batch)`);
    console.log('🔍 Query:', query);
    console.log(`📦 Batch configs count: ${BATCH_CONFIGS.length}`);
    console.log('⚠️  Target will be adjusted after first batch based on query complexity');
    console.log('='.repeat(80));

    startProgressiveLoading(initialTarget);

    let allPapers: Paper[] = [];
    let currentOffset = 0;
    // Phase 10.6 Day 14.5: Store metadata (will use from first batch since all pages return same metadata)
    let searchMetadata: any = null;

    try {
      // Execute batches sequentially
      console.log(`\n🔄 [useProgressiveSearch] About to execute ${BATCH_CONFIGS.length} batches\n`);

      for (const config of BATCH_CONFIGS) {
        // Check if cancelled before each batch
        if (isCancelledRef.current) {
          console.log('⚠️ [useProgressiveSearch] Search cancelled by user');
          toast.info('Search cancelled');
          cancelProgressiveLoading();
          return;
        }

        // Update batch status
        updateProgressiveLoading({
          currentBatch: config.batchNumber,
          status: 'loading',
        });

        console.log(`\n📥 [Batch ${config.batchNumber}/${BATCH_CONFIGS.length}] Starting...`);

        // Phase 10.6 Day 14.5: Execute batch and get metadata
        const batchResult = await executeBatch(config);
        const batchPapers = batchResult.papers;
        const batchMetadata = batchResult.metadata;

        console.log(`✅ [Batch ${config.batchNumber}/${BATCH_CONFIGS.length}] Received ${batchPapers.length} papers`);
        console.log(`📊 [Batch ${config.batchNumber}] Metadata:`, batchMetadata);

        // Phase 10.6 Day 14.5: Store metadata from first batch
        // NOTE: Each paginated page returns the SAME metadata (for full search), so we only need it once
        if (batchMetadata && !searchMetadata) {
          console.log(`✓ [Batch ${config.batchNumber}] Storing metadata (first batch with metadata)`);
          searchMetadata = batchMetadata;
          console.log(`  totalCollected: ${searchMetadata.totalCollected}`);
          console.log(`  uniqueAfterDedup: ${searchMetadata.uniqueAfterDedup}`);
          console.log(`  sourceBreakdown:`, Object.keys(searchMetadata.sourceBreakdown));
          
          // Phase 10.6 Day 14.9: Adjust batch configs based on backend target
          if ((searchMetadata as any).allocationStrategy?.targetPaperCount) {
            const backendTarget = (searchMetadata as any).allocationStrategy.targetPaperCount;
            const actualAvailable = searchMetadata.totalQualified || 0;
            const targetToLoad = Math.min(backendTarget, actualAvailable);
            
            console.log(`\n🎯 [Dynamic Adjustment] Backend Target: ${backendTarget} papers`);
            console.log(`📊 [Dynamic Adjustment] Actually Available: ${actualAvailable} papers`);
            console.log(`📥 [Dynamic Adjustment] Will Load: ${targetToLoad} papers`);
            
            // Regenerate batch configs if target is different
            if (targetToLoad !== BATCH_CONFIGS.length * BATCH_SIZE) {
              BATCH_CONFIGS = generateBatchConfigs(targetToLoad);
              console.log(`✅ [Dynamic Adjustment] Updated to ${BATCH_CONFIGS.length} batches (${targetToLoad} papers total)`);
              
              // Update progressive loading target
              startProgressiveLoading(targetToLoad);
            }
          }
          
          console.log(`  Full metadata:`, JSON.stringify(searchMetadata, null, 2));
        } else if (!batchMetadata) {
          console.log(`❌ [Batch ${config.batchNumber}] NO metadata returned from API!`);
        } else if (searchMetadata) {
          console.log(`ℹ️ [Batch ${config.batchNumber}] Already have metadata, skipping`);
        }

        // Check if cancelled after batch completes
        if (isCancelledRef.current) {
          console.log('⚠️ [useProgressiveSearch] Search cancelled after batch');
          cancelProgressiveLoading();
          return;
        }

        // Append papers to collection
        allPapers = [...allPapers, ...batchPapers];
        currentOffset += batchPapers.length;

        // Add papers to store (progressive display)
        addPapers(batchPapers);

        // Calculate quality score
        const avgQuality = calculateAverageQualityScore(allPapers);

        // Update progress
        updateProgressiveLoading({
          loadedPapers: allPapers.length,
          averageQualityScore: avgQuality,
        });

        console.log(`\n📊 [Batch ${config.batchNumber}] Complete:`, {
          batchSize: batchPapers.length,
          totalLoaded: allPapers.length,
          avgQuality,
        });

        // Show toast for batch completion
        toast.success(
          `Loaded ${allPapers.length}/${BATCH_CONFIGS.length * BATCH_SIZE} papers (Avg Quality: ${avgQuality}/100)`,
          { duration: 2000 }
        );
      }

      // All batches complete
      const finalQuality = calculateAverageQualityScore(allPapers);

      // Phase 10.6 Day 14.5: Store search metadata for transparency
      if (searchMetadata) {
        console.log(`💾 Storing search metadata from progressive search:`, searchMetadata);
        setSearchMetadata(searchMetadata as any);
      } else {
        console.log(`⚠️ No metadata available from any batch - transparency won't work`);
      }

      setTotalResults(allPapers.length);
      completeProgressiveLoading();

      console.log('='.repeat(80));
      console.log('✅ [useProgressiveSearch] Progressive search COMPLETE!');
      console.log(`📚 Total papers loaded: ${allPapers.length}`);
      console.log(`⭐ Average quality: ${finalQuality}/100`);
      console.log(`📊 Search metadata:`, searchMetadata);
      console.log('='.repeat(80));

      toast.success(
        `🎉 Loaded ${allPapers.length} high-quality papers (Avg: ${finalQuality}/100)!`,
        { duration: 5000 }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown search error';

      console.error('❌ [useProgressiveSearch] Search failed:', error);

      // Update state to show error
      updateProgressiveLoading({
        status: 'error',
        errorMessage,
      });

      toast.error(`Search failed: ${errorMessage}`, {
        duration: 5000,
      });

      // Keep papers that were loaded before error
      if (allPapers.length > 0) {
        toast.info(
          `${allPapers.length} papers were loaded before the error occurred`,
          { duration: 4000 }
        );
      }
    } finally {
      // No longer using logger.group, so no groupEnd needed
    }
  }, [
    query,
    startProgressiveLoading,
    updateProgressiveLoading,
    completeProgressiveLoading,
    cancelProgressiveLoading,
    addPapers,
    setTotalResults,
    setSearchMetadata, // Phase 10.6 Day 14.5
    executeBatch,
    calculateAverageQualityScore,
  ]);

  // ============================================================================
  // Cancel Search
  // ============================================================================

  /**
   * Cancel ongoing progressive search
   */
  const cancelSearch = useCallback(() => {
    console.log('🛑 [useProgressiveSearch] Cancel requested');
    isCancelledRef.current = true;
    cancelProgressiveLoading();
    toast.info('Cancelling search...');
  }, [cancelProgressiveLoading]);

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    executeProgressiveSearch,
    cancelProgressiveSearch: cancelSearch,
    isSearching: progressiveLoading.status === 'loading',
  };
}
