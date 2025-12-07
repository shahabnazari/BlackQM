/**
 * Type Definitions for Theme Extraction Services - STRICT AUDIT CORRECTED
 *
 * Enterprise-grade type safety for service layer
 * Phase 10.93 Day 1
 *
 * @module theme-extraction/types
 * @since Phase 10.93
 *
 * **TYPE-002 FIX:** Added comprehensive JSDoc documentation to all types
 */

import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';

/**
 * Paper save payload (subset of Paper type with required fields only)
 *
 * Contains only the fields necessary to save a paper to the database.
 * Optional fields are included only if defined in the source paper.
 *
 * @see {PaperSaveService.saveSinglePaper}
 */
export interface PaperSavePayload {
  /** Paper title (required) */
  title: string;
  /** Array of author names (required, can be empty) */
  authors: string[];
  /** Source database/service name (e.g., "PubMed", "arXiv") */
  source: string;
  /** Publication year (optional) */
  year?: number;
  /** Paper abstract (optional) */
  abstract?: string;
  /** Digital Object Identifier (optional) */
  doi?: string;
  /** URL to paper (optional) */
  url?: string;
  /** Venue/journal name (optional) */
  venue?: string;
  /** Number of citations (optional) */
  citationCount?: number;
  /** Array of keyword strings (optional) */
  keywords?: string[];
}

/**
 * Result of saving a single paper
 *
 * Returned by `PaperSaveService.saveSinglePaper()`
 *
 * @see {PaperSaveService.saveSinglePaper}
 */
export interface PaperSaveResult {
  /** Whether the save operation succeeded */
  success: boolean;
  /** Database ID of the saved paper (UUID) */
  paperId: string;
  /** Error message if save failed (optional) */
  error?: string;
}

/**
 * Result of batch save operation
 *
 * Returned by `PaperSaveService.batchSave()`. Contains statistics
 * and mappings for all papers in the batch.
 *
 * @see {PaperSaveService.batchSave}
 *
 * @example
 * ```ts
 * const result = await service.batchSave(papers);
 * console.log(`Saved ${result.savedCount}/${papers.length}`);
 * console.log(`Failed: ${result.failedCount}`);
 * console.log(`First saved paper DB ID: ${result.savedPaperIds.get(papers[0].id)}`);
 * ```
 */
export interface BatchSaveResult {
  /** Number of papers successfully saved */
  savedCount: number;
  /** Number of papers skipped (e.g., duplicates) */
  skippedCount: number;
  /** Number of papers that failed to save */
  failedCount: number;
  /** Array of failed papers with titles and error messages */
  failedPapers: Array<{
    /** Paper title (or "Untitled" if missing) */
    title: string;
    /** Error message explaining why save failed */
    error: string;
  }>;
  /** Map from original paper ID to database paper ID */
  savedPaperIds: Map<string, string>;
}

/**
 * Result of metadata refresh operation
 *
 * Returned by `ThemeExtractionService.refreshStaleMetadata()`.
 * Contains refreshed papers and statistics.
 *
 * @see {ThemeExtractionService.refreshStaleMetadata}
 *
 * @example
 * ```ts
 * const result = await service.refreshStaleMetadata(stalePapers);
 * console.log(`Refreshed ${result.refreshed} papers`);
 * console.log(`${result.failed} failed to refresh`);
 * ```
 */
export interface MetadataRefreshResult {
  /** Number of papers successfully refreshed */
  refreshed: number;
  /** Number of papers that failed to refresh */
  failed: number;
  /** Array of papers with updated metadata */
  papers: LiteraturePaper[];
}

/**
 * Validation result
 *
 * Returned by `ThemeExtractionService.validateExtraction()`.
 * Contains validation outcome and context.
 *
 * @see {ThemeExtractionService.validateExtraction}
 *
 * @example
 * ```ts
 * const result = service.validateExtraction(user, papers, videos, false);
 * if (!result.valid) {
 *   console.error(`Validation failed: ${result.error}`);
 *   toast.error(result.userMessage);
 * }
 * ```
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Total number of sources (papers + videos) */
  totalSources: number;
  /** Number of selected papers */
  selectedPapers: number;
  /** Number of transcribed videos */
  transcribedVideos: number;
  /** Error code/message if validation failed (optional) */
  error?: string;
}

/**
 * Stale paper detection result
 *
 * Returned by `ThemeExtractionService.detectStalePapers()`.
 * Identifies papers needing metadata refresh.
 *
 * A paper is considered "stale" if it:
 * - Has identifiers (DOI or URL) for fetching
 * - Doesn't have full-text content
 * - Hasn't permanently failed full-text extraction
 *
 * @see {ThemeExtractionService.detectStalePapers}
 *
 * @example
 * ```ts
 * const result = service.detectStalePapers(papers, selectedIds);
 * if (result.stalePapers.length > 0) {
 *   await service.refreshStaleMetadata(result.stalePapers);
 * }
 * ```
 */
export interface StalePaperDetectionResult {
  /** Total number of papers checked */
  totalPapers: number;
  /** Array of papers with stale metadata */
  stalePapers: LiteraturePaper[];
  /** Number of papers with up-to-date metadata */
  upToDatePapers: number;
}

/**
 * Retry options for API calls
 *
 * Configures retry behavior for paper save operations.
 *
 * @see {PaperSaveService.saveSinglePaper}
 *
 * @example
 * ```ts
 * const options: RetryOptions = {
 *   maxRetries: 5,
 *   onRetry: (attempt, error, delayMs) => {
 *     console.log(`Attempt ${attempt}: waiting ${delayMs}ms`);
 *   }
 * };
 * ```
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /**
   * Callback invoked before each retry attempt
   *
   * @param attempt - Current attempt number (1-indexed)
   * @param error - Error that triggered the retry
   * @param delayMs - Delay in milliseconds before retry
   */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Progress callback for long-running operations
 *
 * Called periodically to report progress to the UI.
 * Consumer typically uses this to update a status message or progress bar.
 *
 * @param message - Human-readable progress message
 *
 * @example
 * ```ts
 * const onProgress: ProgressCallback = (msg) => {
 *   setStatusMessage(msg);
 * };
 *
 * await service.batchSave(papers, { onProgress });
 * ```
 */
export type ProgressCallback = (message: string) => void;

/**
 * Abort signal for cancellation support
 *
 * Standard Web API AbortSignal for cancelling async operations.
 * Use AbortController to create and manage cancellation.
 *
 * @see {AbortController}
 * @see {AbortSignal}
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * // Start operation
 * const promise = service.batchSave(papers, { signal: controller.signal });
 *
 * // Cancel operation
 * controller.abort();
 *
 * try {
 *   await promise;
 * } catch (error) {
 *   console.log('Operation cancelled');
 * }
 * ```
 */
export type CancellationSignal = AbortSignal;

/**
 * Content analysis result
 *
 * Returned by `ThemeExtractionService.analyzeAndFilterContent()`.
 * Contains comprehensive analysis of content availability and quality
 * for all selected papers and videos.
 *
 * @see {ThemeExtractionService.analyzeAndFilterContent}
 *
 * @example
 * ```ts
 * const analysis = await service.analyzeAndFilterContent(
 *   papers,
 *   selectedIds,
 *   videos,
 *   requestId
 * );
 *
 * if (analysis.sources.length === 0) {
 *   console.error('No sources with content');
 *   return;
 * }
 *
 * console.log(`Found ${analysis.fullTextCount} papers with full-text`);
 * console.log(`Average content length: ${Math.round(analysis.avgContentLength)} chars`);
 * ```
 */
export interface ContentAnalysis {
  /** Number of papers with full-text */
  fullTextCount: number;
  /** Number of papers with abstract overflow (>250 words) */
  abstractOverflowCount: number;
  /** Number of papers with abstract only */
  abstractCount: number;
  /** Number of papers with no content */
  noContentCount: number;
  /** Average content length across all sources (characters) */
  avgContentLength: number;
  /** Whether any full-text content is available */
  hasFullTextContent: boolean;
  /** All valid source content objects (papers + videos with content) */
  sources: import('@/lib/api/services/unified-theme-api.service').SourceContent[];
  /** Total papers and videos selected (before filtering) */
  totalSelected: number;
  /** Papers and videos with content that will be used */
  totalWithContent: number;
  /** Papers and videos without content that will be skipped */
  totalSkipped: number;
  /** List of all selected papers with their content status */
  selectedPapersList: Array<{
    /** Paper/video ID */
    id: string;
    /** Paper/video title */
    title: string;
    /** Whether this source has sufficient content */
    hasContent: boolean;
    /** Content type classification */
    contentType: import('@/lib/types/content-types').ContentType;
    /** Content length in characters */
    contentLength: number;
    /** Reason why source was skipped (if applicable) */
    skipReason?: string;
  }>;
}

/**
 * Full-text extraction result
 *
 * Returned by `FullTextExtractionService.extractBatch()`.
 * Contains extraction statistics and updated papers.
 *
 * @see {FullTextExtractionService.extractBatch}
 *
 * @example
 * ```ts
 * const result = await service.extractBatch(paperIdMap, { onProgress });
 * console.log(`Extracted ${result.successCount}/${result.totalCount} papers`);
 *
 * if (result.failedCount > 0) {
 *   console.warn(`${result.failedCount} papers failed full-text extraction`);
 * }
 *
 * // Use updated papers
 * setPapers(result.updatedPapers);
 * ```
 */
export interface FullTextExtractionResult {
  /** Total number of papers processed */
  totalCount: number;
  /** Number of papers with successful full-text extraction */
  successCount: number;
  /** Number of papers that failed full-text extraction */
  failedCount: number;
  /** Array of updated papers with extraction results */
  updatedPapers: import('@/lib/types/literature.types').Paper[];
  /** Array of paper IDs that failed extraction */
  failedPaperIds: string[];
}

/**
 * Progress information for full-text extraction (Phase 10.93 Day 4 Enhanced)
 *
 * Contains comprehensive progress data including ETA and performance metrics.
 *
 * @since Phase 10.93 Day 4
 */
export interface FullTextProgressInfo {
  /** Number of papers completed (success + failed) */
  completed: number;
  /** Total number of papers being extracted */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Estimated time remaining (human-readable, e.g., "2m 30s") - Day 4 */
  estimatedTimeRemaining?: string;
  /** Average time per paper in milliseconds - Day 4 */
  averageTimePerPaper?: number;
}

/**
 * Progress callback for full-text extraction (Phase 10.93 Day 4 Enhanced)
 *
 * Called periodically to report extraction progress to the UI.
 * Consumer typically uses this to update a progress bar or status message.
 *
 * **Day 4 Enhancement:** Now provides ETA and performance data.
 *
 * @param progress - Progress information object
 *
 * @example
 * ```ts
 * const onProgress: FullTextProgressCallback = (progress) => {
 *   setStatusMessage(
 *     `Extracting full-text (${progress.completed}/${progress.total} - ${progress.percentage}%)` +
 *     (progress.estimatedTimeRemaining ? ` - ${progress.estimatedTimeRemaining} remaining` : '')
 *   );
 *   setProgressBarValue(progress.percentage);
 * };
 *
 * await service.extractBatch(papers, { onProgress });
 * ```
 */
export type FullTextProgressCallback = (progress: FullTextProgressInfo) => void;
