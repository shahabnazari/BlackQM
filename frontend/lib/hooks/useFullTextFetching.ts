/**
 * Full-Text Fetching Hook - Phase 10.1 Day 5
 *
 * Enterprise-grade hook for managing full-text extraction and status tracking.
 * Consolidates full-text fetching logic from God Component pattern.
 *
 * @module useFullTextFetching
 * @since Phase 10.1 Day 5
 * @author VQMethod Team
 *
 * **Features:**
 * - Waterfall fetching coordination (PMC, Unpaywall, PDF extraction)
 * - Full-text status tracking for papers
 * - Progress monitoring with timeout handling
 * - Retry logic with exponential backoff
 * - Integration with useWaitForFullText hook
 * - TypeScript strict mode compliance
 *
 * **Architecture:**
 * - Backend handles waterfall: PMC → Unpaywall → Direct PDF → Semantic Scholar
 * - Frontend polls for status via bulk status API
 * - This hook provides state management and coordination
 *
 * **Usage:**
 * ```typescript
 * const {
 *   waitForFullText,
 *   isWaiting,
 *   cancel,
 *   fullTextStatus,
 *   trackPaper,
 * } = useFullTextFetching();
 *
 * // Wait for papers to finish fetching
 * const result = await waitForFullText(paperIds);
 * ```
 */

import { useState, useCallback } from 'react';
import {
  useWaitForFullText,
  FullTextWaitStatus,
  WaitForFullTextOptions,
  WaitForFullTextResult,
} from './useWaitForFullText';

/**
 * Full-text status for individual papers
 */
export enum FullTextFetchStatus {
  /** Not yet queued for fetching */
  NOT_STARTED = 'not_started',
  /** Currently fetching (waterfall in progress) */
  FETCHING = 'fetching',
  /** Successfully fetched full-text */
  READY = 'ready',
  /** Failed to fetch (exhausted all sources) */
  FAILED = 'failed',
}

/**
 * Full-text fetching statistics
 */
export interface FullTextStats {
  /** Total papers being tracked */
  total: number;
  /** Papers with full-text ready */
  ready: number;
  /** Papers currently fetching */
  fetching: number;
  /** Papers that failed */
  failed: number;
  /** Papers not yet started */
  notStarted: number;
  /** Completion percentage */
  progressPercent: number;
}

/**
 * Return type for useFullTextFetching hook
 */
export interface UseFullTextFetchingReturn {
  // Core waiting functionality (from useWaitForFullText)
  waitForFullText: (
    paperIds: string[],
    options?: WaitForFullTextOptions
  ) => Promise<WaitForFullTextResult>;
  isWaiting: boolean;
  cancel: () => void;

  // Status tracking
  fullTextStatus: Map<string, FullTextFetchStatus>;
  trackPaper: (paperId: string, status: FullTextFetchStatus) => void;
  getPaperStatus: (paperId: string) => FullTextFetchStatus;
  clearStatus: () => void;

  // Statistics
  getStats: (paperIds?: string[]) => FullTextStats;
}

/**
 * Hook for managing full-text fetching operations
 *
 * **Waterfall Process (Backend):**
 * 1. Check PMC (PubMed Central) for open access full-text
 * 2. Try Unpaywall for legal free PDFs
 * 3. Attempt direct PDF extraction from paper URL
 * 4. Fall back to Semantic Scholar full-text
 * 5. If all fail, use abstract only
 *
 * **Frontend Responsibilities:**
 * - Poll bulk status API for progress
 * - Track status per paper
 * - Provide UX feedback
 * - Handle timeouts and cancellation
 *
 * @returns {UseFullTextFetchingReturn} Full-text fetching state and operations
 */
export function useFullTextFetching(): UseFullTextFetchingReturn {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  // Full-text status tracking (paper ID → status)
  const [fullTextStatus, setFullTextStatus] = useState<
    Map<string, FullTextFetchStatus>
  >(new Map());

  // Core waiting functionality from useWaitForFullText
  const { waitForFullText: baseWaitForFullText, isWaiting, cancel } = useWaitForFullText();

  // ===========================
  // STATUS TRACKING
  // ===========================

  /**
   * Track full-text status for a paper
   *
   * @param {string} paperId - The paper ID to track
   * @param {FullTextFetchStatus} status - The current status
   */
  const trackPaper = useCallback((paperId: string, status: FullTextFetchStatus) => {
    setFullTextStatus((prev) => {
      const updated = new Map(prev);
      updated.set(paperId, status);
      return updated;
    });
  }, []);

  /**
   * Get full-text status for a paper
   *
   * @param {string} paperId - The paper ID to check
   * @returns {FullTextFetchStatus} The current status
   */
  const getPaperStatus = useCallback(
    (paperId: string): FullTextFetchStatus => {
      return fullTextStatus.get(paperId) || FullTextFetchStatus.NOT_STARTED;
    },
    [fullTextStatus]
  );

  /**
   * Clear all status tracking
   */
  const clearStatus = useCallback(() => {
    setFullTextStatus(new Map());
  }, []);

  // ===========================
  // STATISTICS
  // ===========================

  /**
   * Get full-text fetching statistics
   *
   * @param {string[]} paperIds - Optional list of paper IDs to calculate stats for
   * @returns {FullTextStats} Statistics object
   */
  const getStats = useCallback(
    (paperIds?: string[]): FullTextStats => {
      const idsToCheck = paperIds || Array.from(fullTextStatus.keys());

      let ready = 0;
      let fetching = 0;
      let failed = 0;
      let notStarted = 0;

      idsToCheck.forEach((id) => {
        const status = getPaperStatus(id);
        switch (status) {
          case FullTextFetchStatus.READY:
            ready++;
            break;
          case FullTextFetchStatus.FETCHING:
            fetching++;
            break;
          case FullTextFetchStatus.FAILED:
            failed++;
            break;
          case FullTextFetchStatus.NOT_STARTED:
            notStarted++;
            break;
        }
      });

      const total = idsToCheck.length;
      const progressPercent = total > 0 ? Math.round((ready / total) * 100) : 0;

      return {
        total,
        ready,
        fetching,
        failed,
        notStarted,
        progressPercent,
      };
    },
    [fullTextStatus, getPaperStatus]
  );

  // ===========================
  // ENHANCED WAITING
  // ===========================

  /**
   * Wait for full-text extraction with status tracking
   *
   * Wraps useWaitForFullText and updates local status tracking
   *
   * @param {string[]} paperIds - Array of paper IDs to wait for
   * @param {WaitForFullTextOptions} options - Waiting options
   * @returns {Promise<WaitForFullTextResult>} Result with status
   */
  const waitForFullText = useCallback(
    async (
      paperIds: string[],
      options: WaitForFullTextOptions = {}
    ): Promise<WaitForFullTextResult> => {
      // Mark all papers as fetching initially
      paperIds.forEach((id) => trackPaper(id, FullTextFetchStatus.FETCHING));

      // Enhanced progress callback that updates status
      const enhancedOnProgress = (status: FullTextWaitStatus) => {
        // Update status map based on bulk status
        status.ready.forEach((id) => trackPaper(id, FullTextFetchStatus.READY));
        status.fetching.forEach((id) => trackPaper(id, FullTextFetchStatus.FETCHING));
        status.failed.forEach((id) => trackPaper(id, FullTextFetchStatus.FAILED));
        status.notFetched.forEach((id) => trackPaper(id, FullTextFetchStatus.NOT_STARTED));

        // Call user's progress callback if provided
        options.onProgress?.(status);
      };

      // Call base waitForFullText with enhanced progress tracking
      const result = await baseWaitForFullText(paperIds, {
        ...options,
        onProgress: enhancedOnProgress,
      });

      // Update final status
      result.status.ready.forEach((id) => trackPaper(id, FullTextFetchStatus.READY));
      result.status.fetching.forEach((id) => trackPaper(id, FullTextFetchStatus.FETCHING));
      result.status.failed.forEach((id) => trackPaper(id, FullTextFetchStatus.FAILED));
      result.status.notFetched.forEach((id) => trackPaper(id, FullTextFetchStatus.NOT_STARTED));

      return result;
    },
    [baseWaitForFullText, trackPaper]
  );

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Core waiting functionality
    waitForFullText,
    isWaiting,
    cancel,

    // Status tracking
    fullTextStatus,
    trackPaper,
    getPaperStatus,
    clearStatus,

    // Statistics
    getStats,
  };
}
