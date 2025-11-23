/**
 * Theme Extraction Workflow Hook - Phase 10.93 Day 2 - STRICT AUDIT CORRECTED
 *
 * Enterprise-grade hook for managing theme extraction preparation workflow.
 * REFACTORED to use service layer architecture (reduces from 1,152 → 638 lines).
 *
 * @module useThemeExtractionWorkflow
 * @since Phase 10.93 Day 2
 * @author VQMethod Team
 *
 * **STRICT AUDIT FIXES:**
 * - ✅ BUG-003: Fixed service instance creation pattern (lazy initialization)
 * - ✅ BUG-004: Fixed inconsistent latestPapersRef updates
 * - ✅ BUG-005: Fixed race condition with AbortController
 * - ✅ DX-001: Extracted toast duration constants
 * - ✅ DX-002: Extracted error toast style constant
 *
 * **Architecture Changes (Day 2):**
 * - ✅ Uses ThemeExtractionService for validation, metadata refresh, content analysis
 * - ✅ Uses PaperSaveService for paper saving with retry and parallel processing
 * - ✅ Uses FullTextExtractionService for full-text extraction with progress tracking
 * - ✅ Uses logger service instead of console.log (50+ replacements)
 * - ✅ Reduced from 1,152 lines to ~638 lines (44.6% reduction)
 * - ✅ Zero code duplication with services
 *
 * **Features:**
 * - Paper selection validation (via service)
 * - Duplicate extraction prevention
 * - Automatic metadata refresh for stale papers (via service)
 * - Paper database synchronization with retry logic (via service)
 * - Full-text extraction with progress tracking (via service)
 * - Content analysis and filtering (via service)
 * - Content type breakdown (full-text, abstract, etc.)
 * - Modal state management
 * - Request ID tracking for debugging
 *
 * **Workflow Steps:**
 * 1. Validate paper/video selection (ThemeExtractionService)
 * 2. Prevent duplicate extraction sessions
 * 3. Open modal with preparing state
 * 4. Check for stale paper metadata (ThemeExtractionService)
 * 5. Refresh metadata if needed (ThemeExtractionService)
 * 6. Save papers to database with retry (PaperSaveService)
 * 7. Extract full-text with progress tracking (FullTextExtractionService)
 * 8. Perform content analysis (ThemeExtractionService)
 * 9. Filter sources by content length
 * 10. Calculate content type breakdown
 * 11. Update modal state for mode selection
 *
 * **Usage:**
 * ```typescript
 * const {
 *   isExtractionInProgress,
 *   preparingMessage,
 *   contentAnalysis,
 *   currentRequestId,
 *   showModeSelectionModal,
 *   handleExtractThemes,
 *   cancelExtraction,
 *   setShowModeSelectionModal,
 *   setIsExtractionInProgress,
 * } = useThemeExtractionWorkflow({
 *   selectedPapers,
 *   papers,
 *   setPapers,
 *   transcribedVideos,
 *   user,
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';

// ✅ DAY 2: Import services
import { ThemeExtractionService } from '@/lib/services/theme-extraction/theme-extraction.service';
import { PaperSaveService } from '@/lib/services/theme-extraction/paper-save.service';
import { FullTextExtractionService } from '@/lib/services/theme-extraction/fulltext-extraction.service';
import type { ContentAnalysis } from '@/lib/services/theme-extraction/types';

// ✅ DAY 4: Import performance and error services
import { PerformanceMetricsService } from '@/lib/services/theme-extraction/performance-metrics.service';
import { ErrorClassifierService } from '@/lib/services/theme-extraction/error-classifier.service';

// ============================================================================
// CONSTANTS - STRICT AUDIT FIX: DX-001
// ============================================================================

/**
 * Toast notification duration constants (milliseconds)
 * STRICT AUDIT FIX: DX-001 - Extracted magic numbers
 */
const TOAST_DURATION = {
  ERROR: 10000,
  WARNING: 8000,
  INFO: 6000,
  SUCCESS: 3000,
} as const;

/**
 * Error toast styling constant
 * STRICT AUDIT FIX: DX-002 - Extracted repeated style object
 */
const ERROR_TOAST_STYLE = {
  background: '#FEE2E2',
  border: '2px solid #EF4444',
  color: '#991B1B',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Re-export types for backward compatibility with useThemeExtractionHandlers
 */
export type { ContentAnalysis } from '@/lib/services/theme-extraction/types';
export type Paper = LiteraturePaper;

/**
 * Transcribed video structure
 */
export interface TranscribedVideo {
  id: string;
  title: string;
  sourceId: string;
  url: string;
  channel?: string;
  duration: number;
  cost: number;
  transcript: string;
  themes?: any[];
  extractedAt: string;
  cached: boolean;
}

/**
 * Hook configuration
 */
export interface UseThemeExtractionWorkflowConfig {
  /** Currently selected paper IDs */
  selectedPapers: Set<string>;
  /** All papers in search results */
  papers: LiteraturePaper[];
  /** Setter for updating papers array */
  setPapers: (papers: LiteraturePaper[] | ((prev: LiteraturePaper[]) => LiteraturePaper[])) => void;
  /** Transcribed videos for extraction */
  transcribedVideos: TranscribedVideo[];
  /** User authentication object */
  user: { id: string; email?: string } | null;
}

/**
 * Hook return type
 */
export interface UseThemeExtractionWorkflowReturn {
  // State
  isExtractionInProgress: boolean;
  preparingMessage: string;
  contentAnalysis: ContentAnalysis | null;
  currentRequestId: string | null;
  showModeSelectionModal: boolean;

  // Handlers
  handleExtractThemes: () => Promise<void>;
  cancelExtraction: () => void;

  // Setters (for external control)
  setShowModeSelectionModal: (show: boolean) => void;
  setIsExtractionInProgress: (inProgress: boolean) => void;
  setPreparingMessage: (message: string) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing theme extraction preparation workflow
 *
 * **Architecture (Phase 10.93 Day 2 - STRICT AUDIT CORRECTED):**
 * - Delegates validation to ThemeExtractionService
 * - Delegates metadata refresh to ThemeExtractionService
 * - Delegates paper saving to PaperSaveService (with retry & parallelism)
 * - Delegates full-text extraction to FullTextExtractionService
 * - Delegates content analysis to ThemeExtractionService
 * - Hook orchestrates services and manages UI state
 * - Uses lazy initialization for service instances (BUG-003 fix)
 * - Consistent latestPapersRef updates (BUG-004 fix)
 * - Aborts existing extraction before starting new one (BUG-005 fix)
 *
 * **Error Handling:**
 * - Graceful degradation on metadata refresh failure
 * - Retry logic with exponential backoff for paper saving (via service)
 * - User-friendly error messages in modal
 * - Automatic cleanup on errors
 *
 * @param {UseThemeExtractionWorkflowConfig} config - Configuration object
 * @returns {UseThemeExtractionWorkflowReturn} State and handlers
 */
export function useThemeExtractionWorkflow(
  config: UseThemeExtractionWorkflowConfig
): UseThemeExtractionWorkflowReturn {
  const { selectedPapers, papers, setPapers, transcribedVideos, user } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [isExtractionInProgress, setIsExtractionInProgress] = useState(false);
  const [preparingMessage, setPreparingMessage] = useState<string>('');
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);

  // Mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track latest papers to prevent stale data
  const latestPapersRef = useRef<LiteraturePaper[]>(papers);

  // AbortController for user cancellation support
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===========================
  // STRICT AUDIT FIX: BUG-003
  // Lazy initialization for service instances
  // ===========================

  const themeServiceRef = useRef<ThemeExtractionService | null>(null);
  const paperServiceRef = useRef<PaperSaveService | null>(null);
  const fullTextServiceRef = useRef<FullTextExtractionService | null>(null);

  // Lazy initialize services
  if (!themeServiceRef.current) {
    themeServiceRef.current = new ThemeExtractionService();
  }
  if (!paperServiceRef.current) {
    paperServiceRef.current = new PaperSaveService();
  }
  if (!fullTextServiceRef.current) {
    fullTextServiceRef.current = new FullTextExtractionService();
  }

  useEffect(() => {
    latestPapersRef.current = papers;
  }, [papers]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // ===========================
  // MAIN EXTRACTION HANDLER
  // ===========================

  /**
   * Main theme extraction preparation handler
   *
   * **Process (Day 4 Enhanced - PERFORMANCE & ERROR TRACKING):**
   * 1. Initialize performance metrics (DAY 4 NEW)
   * 2. Abort existing extraction if any (BUG-005 fix)
   * 3. Validation - ThemeExtractionService.validateExtraction()
   * 4. Modal Opening - Show preparing state
   * 5. Metadata Detection - ThemeExtractionService.detectStalePapers()
   * 6. Metadata Refresh - ThemeExtractionService.refreshStaleMetadata() + metrics
   * 7. Database Sync - PaperSaveService.batchSave() with retry & parallelism + metrics
   * 8. Full-text Extraction - FullTextExtractionService.extractBatch() + ETA + metrics
   * 9. Content Analysis - ThemeExtractionService.analyzeAndFilterContent() + metrics
   * 10. Ready State - Clear preparing message for mode selection
   * 11. Performance Report - Log comprehensive metrics (DAY 4 NEW)
   */
  const handleExtractThemes = useCallback(async () => {
    // ===========================
    // DAY 4: Initialize performance tracking
    // ===========================
    const performanceMetrics = new PerformanceMetricsService();
    const errorClassifier = new ErrorClassifierService();

    // ===========================
    // STRICT AUDIT FIX: BUG-005
    // Abort existing extraction before starting new one
    // ===========================

    if (abortControllerRef.current) {
      logger.info('Aborting existing extraction workflow', 'useThemeExtractionWorkflow');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Create AbortController for cancellation support
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // ===========================
      // STEP 1: VALIDATION (SERVICE)
      // ===========================

      logger.info('Starting theme extraction workflow', 'useThemeExtractionWorkflow', {
        selectedPapers: selectedPapers.size,
        transcribedVideos: transcribedVideos.length,
      });

      // ✅ DAY 2: Use service for validation
      const themeService = themeServiceRef.current!;
      const validation = themeService.validateExtraction(
        user,
        selectedPapers,
        transcribedVideos,
        isExtractionInProgress
      );

      if (!validation.valid) {
        // Show user-facing message
        if (validation.userMessage) {
          toast.error(validation.userMessage, {
            duration: TOAST_DURATION.ERROR, // ✅ DX-001 fix
            style: ERROR_TOAST_STYLE, // ✅ DX-002 fix
          });
        }
        logger.error('Validation failed', 'useThemeExtractionWorkflow', {
          error: validation.error,
        });
        return;
      }

      logger.info('Validation passed', 'useThemeExtractionWorkflow', {
        totalSources: validation.totalSources,
        selectedPapers: validation.selectedPapers,
        transcribedVideos: validation.transcribedVideos,
      });

      // Set extraction in progress
      setIsExtractionInProgress(true);

      // Open modal immediately with preparing state
      setPreparingMessage('Analyzing papers and preparing for extraction...');
      setShowModeSelectionModal(true);

      // Generate unique request ID for tracing
      const requestId = `extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentRequestId(requestId);

      logger.info('Theme extraction started', 'useThemeExtractionWorkflow', { requestId });

      // Check for cancellation
      if (signal.aborted) {
        logger.info('Operation cancelled before metadata refresh', 'useThemeExtractionWorkflow');
        return;
      }

      // Create a copy of selectedPapers Set (prevents stale data issues)
      const papersToAnalyze = new Set(selectedPapers);

      // ===========================
      // STEP 2: METADATA REFRESH (SERVICE)
      // ===========================

      logger.info('Checking for stale metadata', 'useThemeExtractionWorkflow', { requestId });

      // ✅ DAY 2: Use service for stale paper detection
      const detection = themeService.detectStalePapers(latestPapersRef.current, papersToAnalyze);

      logger.info('Stale paper detection complete', 'useThemeExtractionWorkflow', {
        totalPapers: detection.totalPapers,
        stalePapers: detection.stalePapers.length,
        upToDate: detection.upToDatePapers,
      });

      if (detection.stalePapers.length > 0) {
        logger.info(
          `Refreshing metadata for ${detection.stalePapers.length} papers`,
          'useThemeExtractionWorkflow'
        );
        setPreparingMessage(`Updating metadata for ${detection.stalePapers.length} papers...`);

        // ✅ DAY 4: Track metadata refresh performance
        performanceMetrics.startTimer('metadataRefresh');

        // ✅ DAY 2: Use service for metadata refresh
        const refreshResult = await themeService.refreshStaleMetadata(
          detection.stalePapers,
          (message: string) => {
            setPreparingMessage(message);
          }
        );

        performanceMetrics.endTimer('metadataRefresh');
        performanceMetrics.recordItemsProcessed(refreshResult.refreshed);
        if (refreshResult.refreshed > 0) performanceMetrics.recordSuccess();
        if (refreshResult.failed > 0) performanceMetrics.recordFailure();

        logger.info('Metadata refresh complete', 'useThemeExtractionWorkflow', {
          refreshed: refreshResult.refreshed,
          failed: refreshResult.failed,
        });

        // ===========================
        // STRICT AUDIT FIX: BUG-004
        // Update latestPapersRef consistently
        // ===========================

        // Update papers array with refreshed metadata
        const refreshedPapersMap = new Map(refreshResult.papers.map((p) => [p.id, p]));
        const updatedPapers = latestPapersRef.current.map(
          (p) => refreshedPapersMap.get(p.id) || p
        );
        setPapers(updatedPapers);
        latestPapersRef.current = updatedPapers; // ✅ BUG-004 fix - consistent update
      } else {
        logger.info('All papers have up-to-date metadata', 'useThemeExtractionWorkflow');
      }

      // Check for cancellation
      if (signal.aborted) {
        logger.info('Operation cancelled after metadata refresh', 'useThemeExtractionWorkflow');
        return;
      }

      // ===========================
      // STEP 3: PAPER SAVING (SERVICE)
      // ===========================

      logger.info('Saving papers to database', 'useThemeExtractionWorkflow', {
        count: papersToAnalyze.size,
      });

      const papersToSave = latestPapersRef.current.filter((p) => papersToAnalyze.has(p.id));

      // ✅ DAY 4: Track paper saving performance
      performanceMetrics.startTimer('paperSaving');

      // ✅ DAY 2: Use service for paper saving
      const paperService = paperServiceRef.current!;
      const saveResult = await paperService.batchSave(papersToSave, {
        onProgress: (message: string) => {
          setPreparingMessage(message);
        },
        retryOptions: { maxRetries: 3 },
      });

      performanceMetrics.endTimer('paperSaving');
      performanceMetrics.recordItemsProcessed(saveResult.savedCount);
      if (saveResult.savedCount > 0) performanceMetrics.recordSuccess();
      if (saveResult.failedCount > 0) performanceMetrics.recordFailure();

      logger.info('Paper saving complete', 'useThemeExtractionWorkflow', {
        saved: saveResult.savedCount,
        skipped: saveResult.skippedCount,
        failed: saveResult.failedCount,
      });

      // Log authentication errors separately
      const authErrors = saveResult.failedPapers.filter((p) =>
        p.error.includes('AUTHENTICATION_REQUIRED')
      );
      if (authErrors.length > 0) {
        logger.warn(
          `${authErrors.length} papers require authentication`,
          'useThemeExtractionWorkflow',
          { count: authErrors.length }
        );
      }

      // Check for cancellation
      if (signal.aborted) {
        logger.info('Operation cancelled after paper saving', 'useThemeExtractionWorkflow');
        return;
      }

      // ===========================
      // STEP 4: FULL-TEXT EXTRACTION (SERVICE)
      // ===========================

      // ✅ DAY 2 PART 2: Use service for full-text extraction
      if (saveResult.savedPaperIds.size > 0) {
        if (signal.aborted) {
          logger.info('Full-text extraction cancelled', 'useThemeExtractionWorkflow');
          return;
        }

        logger.info(
          `Starting full-text extraction for ${saveResult.savedPaperIds.size} papers`,
          'useThemeExtractionWorkflow'
        );

        // ✅ DAY 4: Track full-text extraction performance
        performanceMetrics.startTimer('fullTextExtraction');

        const fullTextService = fullTextServiceRef.current!;
        const extractionResult = await fullTextService.extractBatch(
          saveResult.savedPaperIds,
          {
            // ✅ DAY 4 ENHANCED: Updated progress callback with ETA
            onProgress: (progress) => {
              if (isMountedRef.current && !signal.aborted) {
                const baseMessage = `Extracting full-text (${progress.completed}/${progress.total} - ${progress.percentage}%)`;
                const etaMessage = progress.estimatedTimeRemaining
                  ? ` - ${progress.estimatedTimeRemaining} remaining`
                  : '';
                setPreparingMessage(baseMessage + etaMessage);
              }
            },
            signal,
          }
        );

        performanceMetrics.endTimer('fullTextExtraction');
        performanceMetrics.recordItemsProcessed(extractionResult.successCount);
        if (extractionResult.successCount > 0) performanceMetrics.recordSuccess();
        if (extractionResult.failedCount > 0) performanceMetrics.recordFailure();

        logger.info('Full-text extraction complete', 'useThemeExtractionWorkflow', {
          total: extractionResult.totalCount,
          success: extractionResult.successCount,
          failed: extractionResult.failedCount,
        });

        // Update papers with extraction results
        // CRITICAL FIX (Nov 18, 2025): Update ref BEFORE state to avoid race condition
        if (extractionResult.updatedPapers.length > 0) {
          const updatedPapersMap = new Map(
            extractionResult.updatedPapers.map((p) => [p.id, p])
          );

          // STEP 1: Merge papers synchronously
          const merged = latestPapersRef.current.map((p) => updatedPapersMap.get(p.id) || p);

          // STEP 2: Update ref IMMEDIATELY (synchronous)
          latestPapersRef.current = merged;

          // STEP 3: Update React state (asynchronous, doesn't block content analysis)
          setPapers(merged);

          // STEP 4: Log the results
          const withFullText = merged.filter((p) => p.hasFullText).length;
          logger.debug('Papers updated with full-text results', 'useThemeExtractionWorkflow', {
            total: merged.length,
            withFullText,
          });
        }

        // Check for cancellation
        if (signal.aborted) {
          logger.info('Operation cancelled after full-text extraction', 'useThemeExtractionWorkflow');
          return;
        }
      }

      // ===========================
      // STEP 5: CONTENT ANALYSIS (SERVICE)
      // ===========================

      setPreparingMessage('Analyzing paper content...');

      logger.info('Starting content analysis', 'useThemeExtractionWorkflow', { requestId });

      // ✅ DAY 4: Track content analysis performance
      performanceMetrics.startTimer('contentAnalysis');

      // ✅ DAY 2: Use service for content analysis
      const analysis = await themeService.analyzeAndFilterContent(
        latestPapersRef.current,
        papersToAnalyze,
        transcribedVideos,
        requestId
      );

      performanceMetrics.endTimer('contentAnalysis');
      performanceMetrics.recordItemsProcessed(analysis.totalWithContent);
      if (analysis.sources.length > 0) performanceMetrics.recordSuccess();
      else performanceMetrics.recordFailure();

      // Handle no content error
      if (analysis.sources.length === 0) {
        logger.error('No sources with content', 'useThemeExtractionWorkflow', {
          totalSelected: analysis.totalSelected,
          totalSkipped: analysis.totalSkipped,
        });

        // Build detailed error message
        const papersWithoutContent = analysis.selectedPapersList.filter((p) => !p.hasContent);
        let errorMessage = '';

        if (analysis.totalSelected === 0) {
          errorMessage = 'No papers were selected for extraction.';
        } else {
          errorMessage = `All ${analysis.totalSelected} selected papers were skipped:\n\n`;
          papersWithoutContent.slice(0, 5).forEach((paper) => {
            errorMessage += `• ${paper.title.substring(0, 60)}...\n  ${paper.skipReason || 'No content available'}\n`;
          });
          if (papersWithoutContent.length > 5) {
            errorMessage += `\n...and ${papersWithoutContent.length - 5} more papers`;
          }
        }

        setPreparingMessage(errorMessage);
        setIsExtractionInProgress(false);

        toast.error('No papers with sufficient content for theme extraction', {
          duration: TOAST_DURATION.ERROR, // ✅ DX-001 fix
          description:
            'Papers need either full-text or abstracts with at least 50 characters.',
          style: ERROR_TOAST_STYLE, // ✅ DX-002 fix
        });

        return;
      }

      // Warn user if significant papers were skipped
      if (analysis.totalSkipped > 0) {
        const skippedPercentage = Math.round(
          (analysis.totalSkipped / analysis.totalSelected) * 100
        );
        if (skippedPercentage >= 50) {
          logger.warn(
            `${analysis.totalSkipped}/${analysis.totalSelected} papers (${skippedPercentage}%) have no content`,
            'useThemeExtractionWorkflow'
          );
          toast.warning(
            `${analysis.totalSkipped} of ${analysis.totalSelected} papers have no content and will be skipped. Only ${analysis.totalWithContent} papers will be used for extraction.`,
            { duration: TOAST_DURATION.WARNING } // ✅ DX-001 fix
          );
        } else if (analysis.totalSkipped > 0) {
          logger.warn(`${analysis.totalSkipped} papers will be skipped`, 'useThemeExtractionWorkflow');
          toast.info(
            `${analysis.totalSkipped} papers will be skipped (no content). ${analysis.totalWithContent} papers will be used.`,
            { duration: TOAST_DURATION.INFO } // ✅ DX-001 fix
          );
        }
      }

      setContentAnalysis(analysis);

      logger.info('Content analysis complete', 'useThemeExtractionWorkflow', {
        totalSources: analysis.sources.length,
        fullText: analysis.fullTextCount,
        abstractOverflow: analysis.abstractOverflowCount,
        abstract: analysis.abstractCount,
        avgContentLength: Math.round(analysis.avgContentLength),
      });

      // Clear preparing message and extraction flag when ready for mode selection
      setPreparingMessage('');
      setIsExtractionInProgress(false);

      // ===========================
      // DAY 4: Generate and log performance report
      // ===========================
      performanceMetrics.complete();
      const performanceReport = performanceMetrics.generateReport();

      logger.info('Theme extraction preparation complete', 'useThemeExtractionWorkflow', {
        requestId,
        performance: {
          totalDurationMs: performanceReport.totalDurationMs,
          successRate: performanceReport.successRate,
          itemsPerSecond: performanceReport.itemsPerSecond,
          bottleneck: performanceReport.slowestOperation?.name,
          peakMemoryMB: performanceReport.peakMemoryMB,
          timings: performanceReport.operationTimings,
        },
      });
    } catch (error: unknown) {
      // ===========================
      // DAY 4: Enhanced error handling with classification
      // ===========================
      const err = error instanceof Error ? error : new Error('An unexpected error occurred');

      const classification = errorClassifier.classify(err);

      logger.error('Theme extraction failed', 'useThemeExtractionWorkflow', {
        error: err.message,
        category: classification.category,
        isRetryable: classification.isRetryable,
        suggestedAction: classification.suggestedAction,
      });

      // Complete state cleanup
      if (isMountedRef.current) {
        setIsExtractionInProgress(false);
        setShowModeSelectionModal(false);
        setPreparingMessage('');
        setContentAnalysis(null);
        setCurrentRequestId(null);
      }

      // ✅ DAY 4 ENHANCED: User-friendly error feedback
      toast.error(classification.userMessage, {
        duration: TOAST_DURATION.WARNING,
        description: classification.suggestedAction,
        style: ERROR_TOAST_STYLE,
      });
    }
  }, [
    user,
    isExtractionInProgress,
    selectedPapers,
    transcribedVideos,
    setPapers,
    setIsExtractionInProgress,
    setPreparingMessage,
    setShowModeSelectionModal,
    setContentAnalysis,
    setCurrentRequestId,
  ]);

  // ===========================
  // CANCELLATION HANDLER
  // ===========================

  /**
   * Cancel ongoing theme extraction
   */
  const cancelExtraction = useCallback(() => {
    logger.info('User requested extraction cancellation', 'useThemeExtractionWorkflow');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (isMountedRef.current) {
      setIsExtractionInProgress(false);
      setShowModeSelectionModal(false);
      setPreparingMessage('');
      setContentAnalysis(null);
      setCurrentRequestId(null);
    }

    toast.info('Theme extraction cancelled', { duration: TOAST_DURATION.SUCCESS }); // ✅ DX-001 fix
  }, [
    setIsExtractionInProgress,
    setShowModeSelectionModal,
    setPreparingMessage,
    setContentAnalysis,
    setCurrentRequestId,
  ]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // State
    isExtractionInProgress,
    preparingMessage,
    contentAnalysis,
    currentRequestId,
    showModeSelectionModal,

    // Handlers
    handleExtractThemes,
    cancelExtraction,

    // Setters
    setShowModeSelectionModal,
    setIsExtractionInProgress,
    setPreparingMessage,
    setContentAnalysis,
  };
}
