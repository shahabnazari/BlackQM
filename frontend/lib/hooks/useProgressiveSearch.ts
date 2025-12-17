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
import { logger } from '@/lib/utils/logger';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { literatureAPI, type SearchLiteratureParams } from '@/lib/services/literature-api.service';
import type { Paper } from '@/lib/types/literature.types';
import type { SearchMetadata, ProgressiveLoadingState } from '@/lib/stores/helpers/literature-search-helpers';

// ============================================================================
// Stage Metadata Types (extracted from ProgressiveLoadingState)
// ============================================================================

type Stage1Metadata = NonNullable<ProgressiveLoadingState['stage1']>;
type Stage2Metadata = NonNullable<ProgressiveLoadingState['stage2']>;

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
    academicDatabases, // Phase 10.7.10: Source selection from Zustand (persisted)
    addPapers,
    setTotalResults,
    startProgressiveLoading,
    updateProgressiveLoading,
    completeProgressiveLoading,
    cancelProgressiveLoading,
    progressiveLoading,
    setSearchMetadata, // Phase 10.6 Day 14.5: Store aggregated metadata
    setShowSuggestions, // Phase 10.7.10: Close AI suggestions dropdown when search starts
    researchPurpose, // Phase 10.170: Purpose-Aware Search Integration
  } = useLiteratureSearchStore();

  // Ref to track if search should be cancelled
  const isCancelledRef = useRef(false);

  // 🎯 CRITICAL FIX: Refs to prevent animation restart and track animation state
  const backendCompleteRef = useRef(false); // Backend completion flag
  const animationStartedRef = useRef(false); // Prevents restart
  const hasBackendDataRef = useRef(false); // Ensures real data before animation

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
    async (config: BatchConfig): Promise<{ papers: Paper[]; metadata: SearchMetadata | null }> => {
      // Check if cancelled
      if (isCancelledRef.current) {
        logger.info('Batch cancelled', 'ProgressiveSearch', { batchNumber: config.batchNumber });
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

        // Phase 10.7.10: Use academicDatabases from Zustand store (persisted in localStorage)
        // This ensures all batches use the same sources selected by the user
        const searchParams: SearchLiteratureParams = {
          query,
          sources: academicDatabases, // Phase 10.7.10: User-selected sources (including springer + core)
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
          // Phase 10.170: Purpose-Aware Search Integration
          // Pass research purpose to backend for purpose-specific quality weights and paper limits
          ...(researchPurpose && { purpose: researchPurpose }),
          // Phase 10.1 Day 11: Removed strict filters - we only have abstracts, not full-text yet
          // minAbstractLength: 100 would require long abstracts (filters out 50% of papers)
          // minWordCount: 3000 would require full papers (filters out 100% of abstract-only papers)
          // These filters will be re-enabled when full-text extraction is implemented
        };

        // Search params logged in main function for visibility
        const result = await literatureAPI.searchLiterature(searchParams);

        // Guard against undefined result
        if (!result) {
          logger.error('Batch API returned undefined result', 'ProgressiveSearch', {
            batchNumber: config.batchNumber,
          });
          return {
            papers: [],
            metadata: null,
          };
        }

        logger.debug('Batch API response received', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          papersCount: result.papers?.length || 0,
          hasMetadata: !!result.metadata,
        });

        // Phase 10.6 Day 14.5: Return BOTH papers and metadata
        return {
          papers: result.papers || [],
          metadata: result.metadata || null,
        };
      } catch (error) {
        logger.error('Batch failed', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          error,
        });
        // Return empty result instead of throwing to allow other batches to continue
        return {
          papers: [],
          metadata: null,
        };
      }
    },
    [query, appliedFilters, academicDatabases, researchPurpose] // Phase 10.7.10: Added academicDatabases; Phase 10.170: Added researchPurpose
  );

  // ============================================================================
  // SMOOTH UX + REAL NUMBERS: Time-based animation with real backend data
  // ============================================================================

  /**
   * Smooth 30-second progress animation with beautiful heat map
   * BUT counter shows REAL backend numbers (not estimates)
   *
   * Animation: 30 seconds smooth (0% → 50% → 100%)
   * Counter: REAL numbers from backend (actual papers loaded)
   */
  const simulateSmoothProgress = useCallback((
    _targetPapers: number, // Unused but required for function signature consistency
    intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
    backendCompleteRef: React.MutableRefObject<boolean>,
    getRealPaperCount: () => number, // Function to get REAL count from backend
    getStage1Metadata: () => Stage1Metadata | null,
    getStage2Metadata: () => Stage2Metadata | null
  ) => {
    // BUG FIX: Prevent animation restart
    if (animationStartedRef.current) {
      logger.debug('Animation already running - preventing restart', 'ProgressiveSearch');
      return;
    }

    animationStartedRef.current = true;
    const startTime = Date.now();
    const STAGE1_DURATION = 15; // 15 seconds for Stage 1 (0-50%)
    const STAGE2_DURATION = 15; // 15 seconds for Stage 2 (50-98%)
    const TOTAL_DURATION = STAGE1_DURATION + STAGE2_DURATION;

    logger.info('Animation started - 30 second journey', 'ProgressiveSearch', {
      totalDuration: TOTAL_DURATION,
      stage1Duration: STAGE1_DURATION,
      stage2Duration: STAGE2_DURATION,
    });

    let lastStage = 1;
    let lastPercentage = 0; // 🎯 CRITICAL: Track last percentage to prevent backwards movement

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let percentage: number;
      let currentStage: 1 | 2;

      // Calculate percentage based on time (smooth animation)
      if (elapsed < STAGE1_DURATION) {
        // Stage 1: 0% → 50% over 15 seconds (exponential ease-out)
        const stage1Progress = elapsed / STAGE1_DURATION;
        const eased = 1 - Math.pow(1 - stage1Progress, 3);
        percentage = eased * 50;
        currentStage = 1;
      } else if (elapsed < TOTAL_DURATION) {
        // Stage 2: 50% → 98% over 15 seconds
        const stage2Progress = (elapsed - STAGE1_DURATION) / STAGE2_DURATION;
        const eased = 1 - Math.pow(1 - stage2Progress, 3);
        percentage = 50 + (eased * 48);
        currentStage = 2;
      } else {
        percentage = 98;
        currentStage = 2;
      }

      // Stage transition logging
      if (currentStage !== lastStage) {
        logger.info('Stage transition', 'ProgressiveSearch', { from: lastStage, to: currentStage });
        lastStage = currentStage;
      }

      // If backend finished, accelerate to 100%
      if (backendCompleteRef.current && percentage < 100) {
        const accelerationRate = 2;
        percentage = Math.min(100, percentage + accelerationRate);
      }

      // 🚨 CRITICAL BUG FIX: Ensure percentage NEVER decreases (prevents shrinking back)
      percentage = Math.max(lastPercentage, percentage);
      lastPercentage = percentage;

      // 🎯 KEY FIX: Use REAL paper count from backend, not estimates!
      const realPaperCount = getRealPaperCount();
      const stage1Meta = getStage1Metadata();
      const stage2Meta = getStage2Metadata();

      // Track if we have backend data
      if (stage1Meta && stage1Meta.totalCollected > 0) {
        hasBackendDataRef.current = true;
      }

      // Update UI with smooth animation + real numbers
      updateProgressiveLoading({
        loadedPapers: realPaperCount, // REAL count, not interpolated!
        currentStage,
        visualPercentage: percentage, // Smooth time-based percentage for animation
        ...(stage1Meta && { stage1: stage1Meta }),
        ...(stage2Meta && { stage2: stage2Meta }),
      });

      // Stop when 100%
      if (percentage >= 100) {
        logger.info('Animation complete at 100%', 'ProgressiveSearch', { realPaperCount });
        updateProgressiveLoading({
          loadedPapers: realPaperCount,
          currentStage: 2,
          visualPercentage: 100,
        });

        setTimeout(() => {
          completeProgressiveLoading();
          // 🎯 CRITICAL: Reset animation flag so next search can start
          animationStartedRef.current = false;
          backendCompleteRef.current = false;
          hasBackendDataRef.current = false;
        }, 300);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 100);
  }, [updateProgressiveLoading, completeProgressiveLoading]);

  // ============================================================================
  // Progressive Search Execution
  // ============================================================================

  /**
   * Execute progressive search: Dynamic paper count based on query complexity
   * Phase 10.6 Day 14.9: 500 (BROAD) / 1000 (SPECIFIC) / 1500 (COMPREHENSIVE)
   * Phase 10.7 Day 6: Added smooth progress simulation for better UX
   */
  const executeProgressiveSearch = useCallback(async () => {
    // Validation
    if (!query.trim()) {
      logger.warn('Empty query provided', 'ProgressiveSearch');
      toast.error('Please enter a search query');
      return;
    }

    // Phase 10.7.10: Close AI suggestions dropdown when search starts
    setShowSuggestions(false);

    // Reset cancellation flag
    isCancelledRef.current = false;

    // CRITICAL FIX: Reset animation refs at START of each search
    logger.debug('Resetting animation refs for new search', 'ProgressiveSearch');
    animationStartedRef.current = false;
    backendCompleteRef.current = false;
    hasBackendDataRef.current = false;

    // Start progressive loading with default target (will be updated after first batch)
    const initialTarget = BATCH_CONFIGS.length * BATCH_SIZE;

    logger.info('Starting progressive search', 'ProgressiveSearch', {
      initialTarget,
      batchCount: BATCH_CONFIGS.length,
      batchSize: BATCH_SIZE,
      query,
    });

    startProgressiveLoading(initialTarget);

    // Start smooth animation with REAL numbers from backend
    backendCompleteRef.current = false;
    const progressIntervalRef = { current: null as NodeJS.Timeout | null };

    let allPapers: Paper[] = [];
    let stage1Metadata: Stage1Metadata | null = null;
    let stage2Metadata: Stage2Metadata | null = null;
    let searchMetadata: SearchMetadata | null = null;
    let animationStarted = false; // 🚨 CRITICAL FIX: Track if animation has started

    // Functions to get REAL backend data (closures)
    const getRealPaperCount = () => allPapers.length;
    const getStage1Metadata = () => stage1Metadata;
    const getStage2Metadata = () => stage2Metadata;

    // 🚨 CRITICAL FIX: Don't start animation yet - wait for backend data first!
    // Animation will start after first batch returns with stage1/stage2 metadata
    // This ensures counter and progress bar are always in sync

    let currentOffset = 0;

    try {
      // Execute batches sequentially
      logger.debug('About to execute batches', 'ProgressiveSearch', {
        batchCount: BATCH_CONFIGS.length,
      });

      for (const config of BATCH_CONFIGS) {
        // Check if cancelled before each batch
        if (isCancelledRef.current) {
          logger.info('Search cancelled by user', 'ProgressiveSearch');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          toast.info('Search cancelled');
          cancelProgressiveLoading();
          return;
        }

        // Update batch status
        updateProgressiveLoading({
          currentBatch: config.batchNumber,
          status: 'loading',
        });

        logger.debug('Batch starting', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          totalBatches: BATCH_CONFIGS.length,
        });

        // Phase 10.6 Day 14.5: Execute batch and get metadata
        const batchResult = await executeBatch(config);
        const batchPapers = batchResult.papers;
        const batchMetadata = batchResult.metadata;

        logger.info('Batch received', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          papersCount: batchPapers.length,
          hasMetadata: !!batchMetadata,
        });

        // Phase 10.6 Day 14.5: Store metadata from first batch
        // Phase 10.7 Day 6: Extract two-stage filtering information
        // NOTE: Each paginated page returns the SAME metadata (for full search), so we only need it once
        if (batchMetadata && !searchMetadata) {
          logger.info('Storing metadata from first batch', 'ProgressiveSearch', {
            batchNumber: config.batchNumber,
            totalCollected: batchMetadata.totalCollected,
            uniqueAfterDedup: batchMetadata.uniqueAfterDedup,
            sourceBreakdown: Object.keys(batchMetadata.sourceBreakdown || {}),
          });
          searchMetadata = batchMetadata;

          // Phase 10.7 Day 6: Update progressive loading with stage information
          // CRITICAL FIX: Add fallback if stage1/stage2 are missing (robustness)
          if (searchMetadata.stage1 && searchMetadata.stage2) {
            logger.info('Stage metadata available', 'ProgressiveSearch', {
              stage1TotalCollected: searchMetadata.stage1.totalCollected,
              stage1SourcesSearched: searchMetadata.stage1.sourcesSearched,
              stage2FinalSelected: searchMetadata.stage2.finalSelected,
            });

            // Store stage metadata (but stage transition will be handled dynamically)
            updateProgressiveLoading({
              stage1: searchMetadata.stage1,
              stage2: searchMetadata.stage2,
            });

            // Also store stage metadata in closures for animation
            stage1Metadata = searchMetadata.stage1;
            stage2Metadata = searchMetadata.stage2;
          } else {
            // FALLBACK: Backend didn't send stage1/stage2, construct from available data
            logger.warn('Backend missing stage1/stage2 metadata - constructing fallback', 'ProgressiveSearch', {
              sourceBreakdown: searchMetadata.sourceBreakdown,
            });

            const totalCollected = searchMetadata.totalCollected || searchMetadata.uniqueAfterDedup || batchPapers.length;
            const sourcesSearched = searchMetadata.sourceBreakdown ? Object.keys(searchMetadata.sourceBreakdown).length : 0;
            const finalSelected = Math.min(initialTarget, totalCollected); // Estimate final based on initial target

            // Convert sourceBreakdown from backend format to component format if needed
            const convertedSourceBreakdown: Record<string, number | { papers: number; duration: number }> = {};
            if (searchMetadata.sourceBreakdown) {
              Object.entries(searchMetadata.sourceBreakdown).forEach(([source, data]) => {
                // Type assertion: backend sends the correct format
                convertedSourceBreakdown[source] = data as number | { papers: number; duration: number };
              });
            }

            stage1Metadata = {
              totalCollected,
              sourcesSearched,
              sourceBreakdown: convertedSourceBreakdown
            };

            stage2Metadata = {
              startingPapers: totalCollected,
              afterEnrichment: totalCollected,
              afterRelevanceFilter: finalSelected,
              finalSelected
            };

            // Store in Zustand
            updateProgressiveLoading({
              stage1: stage1Metadata,
              stage2: stage2Metadata,
            });

            logger.info('Fallback metadata stored', 'ProgressiveSearch', {
              constructedStage1: stage1Metadata,
              constructedStage2: stage2Metadata,
            });
          }

          // CRITICAL FIX: NOW start animation (we have real backend data!)
          if (!animationStarted && stage1Metadata && stage2Metadata) {
            logger.info('Starting animation with real backend data', 'ProgressiveSearch', {
              stage1Max: stage1Metadata.totalCollected,
              stage2Final: stage2Metadata.finalSelected,
            });

            simulateSmoothProgress(
              initialTarget,
              progressIntervalRef,
              backendCompleteRef,
              getRealPaperCount,
              getStage1Metadata,
              getStage2Metadata
            );

            animationStarted = true;
          }

          // Phase 10.6 Day 14.9: Adjust batch configs based on backend target
          if ((searchMetadata as any).allocationStrategy?.targetPaperCount) {
            const backendTarget = (searchMetadata as any).allocationStrategy.targetPaperCount;
            const actualAvailable = searchMetadata.totalQualified || 0;
            const targetToLoad = Math.min(backendTarget, actualAvailable);

            logger.info('Dynamic adjustment based on backend target', 'ProgressiveSearch', {
              backendTarget,
              actualAvailable,
              targetToLoad,
            });

            // Regenerate batch configs if target is different
            if (targetToLoad !== BATCH_CONFIGS.length * BATCH_SIZE) {
              BATCH_CONFIGS = generateBatchConfigs(targetToLoad);
              logger.info('Batch configs updated', 'ProgressiveSearch', {
                newBatchCount: BATCH_CONFIGS.length,
                targetPapers: targetToLoad,
              });

              // CRITICAL FIX: Reset animation lock BEFORE restarting
              animationStartedRef.current = false; // UNLOCK!

              // Stop current animation
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }

              startProgressiveLoading(targetToLoad);

              // Restart animation with new target (lock is now cleared, so it will work!)
              simulateSmoothProgress(
                targetToLoad,
                progressIntervalRef,
                backendCompleteRef,
                getRealPaperCount,
                getStage1Metadata,
                getStage2Metadata
              );
            }
          }

          // Store stage metadata for real numbers in counter
          // Convert undefined to null for consistent type handling
          stage1Metadata = searchMetadata.stage1 ?? null;
          stage2Metadata = searchMetadata.stage2 ?? null;
        } else if (!batchMetadata) {
          logger.warn('No metadata returned from batch', 'ProgressiveSearch', {
            batchNumber: config.batchNumber,
          });
        } else if (searchMetadata) {
          logger.debug('Already have metadata, skipping', 'ProgressiveSearch', {
            batchNumber: config.batchNumber,
          });
        }

        // Check if cancelled after batch completes
        if (isCancelledRef.current) {
          logger.info('Search cancelled after batch', 'ProgressiveSearch');
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

        // Log backend progress (animation shows smooth progress, this is real data)
        const currentTarget = BATCH_CONFIGS.length * BATCH_SIZE;
        const backendPercentage = (allPapers.length / currentTarget) * 100;

        logger.info('Batch progress', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          totalBatches: BATCH_CONFIGS.length,
          loadedPapers: allPapers.length,
          targetPapers: currentTarget,
          percentage: backendPercentage.toFixed(1),
          avgQuality: avgQuality.toFixed(1),
          batchSize: batchPapers.length,
        });

        // Update quality score (animation handles loadedPapers from getRealPaperCount)
        updateProgressiveLoading({
          averageQualityScore: avgQuality,
        });

        // Phase 10.7 Day 6: Removed batch completion toasts - too spammy, progress bar shows this

        // CRITICAL FIX: Break out of loop if dynamic adjustment reduced batch count
        // The for-of loop captured the original BATCH_CONFIGS array, so we must manually check
        // if the current batch number exceeds the (now reduced) target batch count
        // IMPORTANT: This check is at the END of the loop body, AFTER papers are added to store
        if (config.batchNumber >= BATCH_CONFIGS.length) {
          logger.info('Stopping at adjusted batch limit', 'ProgressiveSearch', {
            batchNumber: config.batchNumber,
            batchLimit: BATCH_CONFIGS.length,
          });
          break;
        }
      }

      // All batches complete
      const finalQuality = calculateAverageQualityScore(allPapers);

      // Phase 10.6 Day 14.5: Store search metadata for transparency
      if (searchMetadata) {
        logger.info('Storing search metadata from progressive search', 'ProgressiveSearch', {
          totalCollected: searchMetadata.totalCollected,
          uniqueAfterDedup: searchMetadata.uniqueAfterDedup,
        });
        setSearchMetadata(searchMetadata as any);
      } else {
        logger.warn('No metadata available from any batch', 'ProgressiveSearch');
      }

      setTotalResults(allPapers.length);

      // Signal backend complete (animation will accelerate to 100%)
      backendCompleteRef.current = true;

      logger.info('Progressive search complete', 'ProgressiveSearch', {
        totalPapersLoaded: allPapers.length,
        averageQuality: finalQuality.toFixed(1),
        stage1: searchMetadata?.stage1 ? {
          sourcesSearched: searchMetadata.stage1.sourcesSearched,
          totalCollected: searchMetadata.stage1.totalCollected,
          duration: searchMetadata.searchDuration,
        } : null,
        stage2: searchMetadata?.stage2 ? {
          startingPapers: searchMetadata.stage2.startingPapers,
          finalSelected: searchMetadata.stage2.finalSelected,
          selectionRate: searchMetadata.stage1
            ? ((searchMetadata.stage2.finalSelected / searchMetadata.stage1.totalCollected) * 100).toFixed(1)
            : null,
        } : null,
      });

      // Phase 10.7 Day 6: Removed success toast - completion celebration in UI is enough
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown search error';

      logger.error('Search failed', 'ProgressiveSearch', { error, errorMessage });

      // Clean up animation on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

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
    }
  }, [
    query,
    startProgressiveLoading,
    updateProgressiveLoading,
    completeProgressiveLoading,
    cancelProgressiveLoading,
    addPapers,
    setTotalResults,
    setSearchMetadata,
    setShowSuggestions,
    executeBatch,
    calculateAverageQualityScore,
    simulateSmoothProgress, // Smooth animation with real numbers
  ]);

  // ============================================================================
  // Cancel Search
  // ============================================================================

  /**
   * Cancel ongoing progressive search
   */
  const cancelSearch = useCallback(() => {
    logger.info('Cancel requested', 'ProgressiveSearch');
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
