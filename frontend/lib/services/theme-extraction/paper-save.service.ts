/**
 * Paper Save Service - Phase 10.93 Day 1 (STRICT AUDIT CORRECTED)
 *
 * Extracted from useThemeExtractionWorkflow.ts (lines 452-690)
 * Enterprise-grade service for saving papers with retry logic and batch processing
 *
 * @module theme-extraction/PaperSaveService
 * @since Phase 10.93
 *
 * **Features:**
 * - Single paper save with exponential backoff retry
 * - Batch save with rate-limited sequential processing (prevents 429 errors)
 * - Custom error handling with context preservation
 * - Comprehensive logging for debugging
 * - Cancellation support via AbortSignal
 * - Input validation with clear error messages
 *
 * **Performance:**
 * - Sequential with 700ms delay: 700ms/paper → ~4.9s for 7 papers
 * - This ensures compliance with backend rate limit (100 req/60s = 1.67 req/sec)
 * - Trade-off: Slower but prevents 429 rate limit errors
 *
 * **Security:**
 * - Sanitized error context (no sensitive data in logs)
 * - Validated inputs before processing
 */

import { literatureAPI } from '@/lib/services/literature-api.service';
import { retryApiCall } from '@/lib/utils/retry';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import { logger } from '@/lib/utils/logger';
import { PaperSaveError } from './errors';
import type {
  PaperSavePayload,
  PaperSaveResult,
  BatchSaveResult,
  RetryOptions,
  ProgressCallback,
  CancellationSignal,
} from './types';

/**
 * Configuration constants
 *
 * 🚨 CRITICAL FIX (2025-11-22): Previous values caused massive 429 errors
 * Backend limit: 100 requests per 60 seconds = 1.67 req/sec
 *
 * OLD: 3 concurrent + 500ms delay = 6 req/sec (3.6x over limit!)
 * NEW: 1 sequential + 700ms delay = 1.43 req/sec (within limit with margin)
 */
const MAX_CONCURRENT_SAVES = 1; // 🚨 FIXED: Sequential saves (was 3 concurrent)
const DEFAULT_MAX_RETRIES = 3;
const BATCH_DELAY_MS = 700; // 🚨 FIXED: 700ms for ~1.43 req/sec (was 500ms = 6 req/sec)

/**
 * Error messages as constants (DX-002 fix)
 */
const ERRORS = {
  MISSING_TITLE: 'Missing required field: title',
  MISSING_SOURCE: 'Missing required field: source',
  MISSING_PAPER: 'Paper object is null or undefined',
  SAVE_FAILED: 'Paper save operation failed',
  OPERATION_CANCELLED: 'Operation cancelled by user',
} as const;

/**
 * Paper Save Service
 *
 * Handles saving papers to database with retry logic and batch processing
 */
export class PaperSaveService {
  /**
   * Validate paper has required fields (BUG-002 fix)
   *
   * @param paper - Paper to validate
   * @throws {PaperSaveError} If validation fails
   */
  private validatePaper(paper: LiteraturePaper): void {
    if (!paper) {
      throw new PaperSaveError(ERRORS.MISSING_PAPER, {
        validation: 'paper_null_check',
      });
    }

    if (!paper.title) {
      throw new PaperSaveError(ERRORS.MISSING_TITLE, {
        validation: 'title_required',
        paperId: paper.id,
      });
    }

    if (!paper.source) {
      throw new PaperSaveError(ERRORS.MISSING_SOURCE, {
        validation: 'source_required',
        paperId: paper.id,
        paperTitle: paper.title?.substring(0, 100), // SEC-001 fix: truncate
      });
    }
  }

  /**
   * Save a single paper with retry logic
   *
   * @param paper - Paper to save
   * @param options - Retry options
   * @returns Promise resolving to save result
   *
   * @throws {PaperSaveError} If validation fails or save fails after retries
   *
   * @example
   * ```ts
   * const service = new PaperSaveService();
   * const result = await service.saveSinglePaper(paper, {
   *   maxRetries: 3,
   *   onRetry: (attempt, error, delayMs) => {
   *     console.log(`Retry ${attempt}/3 - waiting ${delayMs}ms`);
   *   }
   * });
   * ```
   */
  public async saveSinglePaper(
    paper: LiteraturePaper,
    options: RetryOptions = {}
  ): Promise<PaperSaveResult> {
    // BUG-002 fix: Validate inputs before processing
    this.validatePaper(paper);

    try {
      // Build save payload with only defined fields
      const savePayload: PaperSavePayload = {
        title: paper.title,
        authors: paper.authors || [],
        source: paper.source,
      };

      // Add optional fields only if defined
      if (paper.year !== undefined) savePayload.year = paper.year;
      if (paper.abstract) savePayload.abstract = paper.abstract;
      if (paper.doi) savePayload.doi = paper.doi;
      if (paper.url) savePayload.url = paper.url;
      if (paper.venue) savePayload.venue = paper.venue;
      if (paper.citationCount !== undefined) {
        savePayload.citationCount = paper.citationCount;
      }
      if (paper.keywords) savePayload.keywords = paper.keywords;

      // Phase 10.180: Include full-text detection results from Stage 9
      // CRITICAL: These fields tell the backend WHERE to fetch full-text from
      if (paper.pdfUrl) savePayload.pdfUrl = paper.pdfUrl;
      if (paper.hasFullText !== undefined) savePayload.hasFullText = paper.hasFullText;
      if (paper.fullTextStatus) savePayload.fullTextStatus = paper.fullTextStatus;

      // PERF-001 fix: Direct assignment instead of wrapper function
      const retryOptions: {
        maxRetries: number;
        onRetry?: (attempt: number, error: Error, delayMs: number) => void;
      } = {
        maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      };

      // Conditionally add onRetry to avoid assigning undefined
      if (options.onRetry) {
        retryOptions.onRetry = options.onRetry;
      }

      const result = await retryApiCall(
        async () => {
          const saveResult = await literatureAPI.savePaper(savePayload);
          if (!saveResult.success) {
            throw new Error('Save returned false');
          }
          return saveResult;
        },
        retryOptions
      );

      // Unwrap RetryResult - retryApiCall wraps the response
      if (!result.success || !result.data) {
        const errorMsg = result.error || ERRORS.SAVE_FAILED;
        throw new PaperSaveError(errorMsg, {
          // SEC-001 fix: Sanitized context (no sensitive data)
          paperTitle: paper.title?.substring(0, 100),
          paperId: paper.id,
          source: paper.source,
        });
      }

      return result.data;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown save error';

      throw new PaperSaveError(errorMsg, {
        // SEC-001 fix: Sanitized context
        paperTitle: paper.title?.substring(0, 100),
        paperId: paper.id,
        source: paper.source,
        errorType: error instanceof Error ? error.constructor.name : 'unknown',
      });
    }
  }

  /**
   * Save multiple papers in parallel with controlled concurrency
   *
   * @param papers - Array of papers to save
   * @param options - Configuration options
   * @returns Promise resolving to batch save result
   *
   * @throws {PaperSaveError} If operation is cancelled
   *
   * @example
   * ```ts
   * const service = new PaperSaveService();
   * const result = await service.batchSave(papers, {
   *   signal: abortController.signal,
   *   onProgress: (msg) => setStatus(msg),
   *   retryOptions: { maxRetries: 3 }
   * });
   *
   * console.log(`Saved ${result.savedCount}/${papers.length} papers`);
   * ```
   */
  public async batchSave(
    papers: LiteraturePaper[],
    options: {
      signal?: CancellationSignal;
      onProgress?: ProgressCallback;
      retryOptions?: RetryOptions;
    } = {}
  ): Promise<BatchSaveResult> {
    // BUG-003 fix: Defensive check for null/undefined/empty array
    if (!papers || papers.length === 0) {
      logger.warn('batchSave called with empty or null papers array', 'PaperSaveService');
      return {
        savedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        failedPapers: [],
        savedPaperIds: new Map(),
      };
    }

    const { signal, onProgress, retryOptions = {} } = options;

    let savedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failedPapers: Array<{ title: string; error: string }> = [];
    const savedPaperIds = new Map<string, string>(); // originalId -> dbPaperId

    // DX-001 fix: Use logger service instead of console.log
    logger.info(
      `Processing ${papers.length} papers in parallel (max ${MAX_CONCURRENT_SAVES} concurrent)`,
      'PaperSaveService'
    );

    // Process papers in batches for controlled parallelism
    for (let i = 0; i < papers.length; i += MAX_CONCURRENT_SAVES) {
      // Check for cancellation before each batch
      if (signal?.aborted) {
        logger.info('Paper saving cancelled by user', 'PaperSaveService');
        throw new PaperSaveError(ERRORS.OPERATION_CANCELLED, {
          savedCount,
          failedCount,
          processedCount: i,
        });
      }

      const batch = papers.slice(i, i + MAX_CONCURRENT_SAVES);
      const batchNumber = Math.floor(i / MAX_CONCURRENT_SAVES) + 1;
      const totalBatches = Math.ceil(papers.length / MAX_CONCURRENT_SAVES);

      const batchMessage = `Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} papers...`;
      logger.debug(batchMessage, 'PaperSaveService');
      onProgress?.(batchMessage);

      // Process batch in parallel using Promise.allSettled (doesn't fail if one fails)
      const batchResults = await Promise.allSettled(
        batch.map(async (paper) => {
          const saveResult = await this.saveSinglePaper(paper, {
            ...retryOptions,
            onRetry: (attempt: number, error: Error, delayMs: number) => {
              logger.warn(
                `Retry ${attempt}/${retryOptions.maxRetries ?? DEFAULT_MAX_RETRIES} for "${paper.title?.substring(0, 40)}..." - waiting ${Math.round(delayMs)}ms`,
                'PaperSaveService',
                { errorMessage: error.message }
              );
              retryOptions.onRetry?.(attempt, error, delayMs);
            },
          });
          return { paper, saveResult };
        })
      );

      // Phase 10.942: Add delay between batches to prevent rate limiting
      // BATCH_DELAY_MS gives server breathing room while maintaining good UX
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }

      // Process results from this batch
      // AUDIT FIX BUG-003: Use index-based iteration for safer paper reference
      for (let resultIndex = 0; resultIndex < batchResults.length; resultIndex++) {
        const result = batchResults[resultIndex];
        // Defensive null check (should never happen but TypeScript safety)
        if (!result) continue;

        if (result.status === 'fulfilled') {
          const { paper, saveResult } = result.value;

          if (saveResult.success) {
            savedCount++;
            const dbPaperId = saveResult.paperId;
            savedPaperIds.set(paper.id, dbPaperId);

            logger.debug(
              `Saved: "${paper.title?.substring(0, 50)}..." (DB ID: ${dbPaperId.substring(0, 8)}...)`,
              'PaperSaveService'
            );
          } else {
            failedCount++;
            const errorMsg = saveResult.error || 'Unknown error';
            failedPapers.push({
              title: paper.title || 'Untitled',
              error: errorMsg,
            });
            logger.error(
              `Failed: "${paper.title?.substring(0, 50)}..."`,
              'PaperSaveService',
              { error: errorMsg }
            );
          }
        } else {
          // Promise.allSettled caught a rejection
          // AUDIT FIX: Use direct index lookup instead of indexOf()
          const paper = batch[resultIndex];
          failedCount++;
          const errorMsg = result.reason?.message || 'Unknown error';
          failedPapers.push({
            title: paper?.title || 'Untitled',
            error: errorMsg,
          });
          logger.error(
            `Failed: "${paper?.title?.substring(0, 50)}..."`,
            'PaperSaveService',
            { error: errorMsg }
          );
        }
      }
    }

    const summaryMessage = `Saved ${savedCount}/${papers.length} papers successfully`;
    logger.info(summaryMessage, 'PaperSaveService');
    onProgress?.(summaryMessage);

    return {
      savedCount,
      skippedCount,
      failedCount,
      failedPapers,
      savedPaperIds,
    };
  }

  /**
   * Get save statistics for reporting
   */
  public formatSaveStats(result: BatchSaveResult): string {
    const total = result.savedCount + result.skippedCount + result.failedCount;
    return `Saved: ${result.savedCount}/${total}, Failed: ${result.failedCount}, Skipped: ${result.skippedCount}`;
  }
}
