import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/api/utils/auth-headers';

/**
 * Phase 10 Day 31.4: Wait for Full-Text Hook
 *
 * Enterprise-grade hook to wait for full-text extraction to complete before theme extraction.
 * Implements polling with cancellation, timeout, and excellent UX feedback.
 *
 * **Features:**
 * - Polls bulk status API until all papers are ready
 * - Shows real-time progress with toast notifications
 * - Supports user cancellation
 * - Configurable timeout with skip option
 * - Zero magic numbers (all constants defined)
 * - Comprehensive error handling
 * - Memory leak prevention (cleanup on unmount)
 *
 * **Usage:**
 * ```tsx
 * const { waitForFullText, isWaiting, cancel } = useWaitForFullText();
 *
 * const ready = await waitForFullText(paperIds, {
 *   maxWaitSeconds: 60,
 *   onProgress: (status) => console.log(status)
 * });
 * ```
 */

// ============================================================================
// CONSTANTS (Phase 10 Day 31.4: Eliminate magic numbers)
// ============================================================================

/** Polling interval in milliseconds (2 seconds) */
const POLL_INTERVAL_MS = 2000;

/** Default maximum wait time in seconds (60 seconds = 1 minute) */
const DEFAULT_MAX_WAIT_SECONDS = 60;

/** Minimum wait time before showing skip option (15 seconds) */
const MIN_WAIT_FOR_SKIP_SECONDS = 15;

/** Toast duration for transient messages (2 seconds) */
const TOAST_DURATION_MS = 2000;

/** Toast duration for important messages (4 seconds) */
const TOAST_DURATION_IMPORTANT_MS = 4000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FullTextWaitStatus {
  /** Papers with full-text ready */
  ready: string[];
  /** Papers currently fetching full-text */
  fetching: string[];
  /** Papers that failed to fetch full-text */
  failed: string[];
  /** Papers not yet queued */
  notFetched: string[];
  /** Total papers being tracked */
  total: number;
  /** Number of papers ready */
  readyCount: number;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
}

export interface WaitForFullTextOptions {
  /** Maximum wait time in seconds (default: 60) */
  maxWaitSeconds?: number;
  /** Callback for progress updates */
  onProgress?: (status: FullTextWaitStatus) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Callback when timeout is reached */
  onTimeout?: (status: FullTextWaitStatus) => void;
}

export interface WaitForFullTextResult {
  /** True if all papers are ready, false if cancelled/timeout */
  allReady: boolean;
  /** Final status */
  status: FullTextWaitStatus;
  /** Reason for completion */
  reason: 'success' | 'cancelled' | 'timeout' | 'error';
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useWaitForFullText() {
  const [isWaiting, setIsWaiting] = useState(false);
  const cancelledRef = useRef(false);
  const toastIdRef = useRef<string | number | null>(null);

  /**
   * Cancel the waiting process
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsWaiting(false);

    // Dismiss any active toast
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    toast.info('Full-text wait cancelled', { duration: TOAST_DURATION_MS });
  }, []);

  /**
   * Fetch bulk status for papers
   * Phase 10 Day 31.4: Properly typed, error handling, no magic numbers
   */
  const fetchBulkStatus = useCallback(async (paperIds: string[]): Promise<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  } | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const url = `${apiUrl}/pdf/bulk-status`;

      console.log(`🔍 [fetchBulkStatus] Calling ${url} with ${paperIds.length} paper IDs`);
      console.log(`🔍 [fetchBulkStatus] Paper IDs:`, paperIds.slice(0, 3).join(', ') + (paperIds.length > 3 ? '...' : ''));

      // Phase 10 Day 31.5: CRITICAL FIX - Add Authorization header for authentication
      const authHeaders = getAuthHeaders();
      console.log(`🔐 [fetchBulkStatus] Auth headers:`, Object.keys(authHeaders).length > 0 ? 'JWT token present' : 'NO TOKEN - will get 401!');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders, // Include JWT token
        },
        credentials: 'include',
        body: JSON.stringify({ paperIds }),
      });

      console.log(`🔍 [fetchBulkStatus] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [fetchBulkStatus] API error:`, errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`🔍 [fetchBulkStatus] Result breakdown:`, {
        ready: result.ready?.length || 0,
        fetching: result.fetching?.length || 0,
        failed: result.failed?.length || 0,
        not_fetched: result.not_fetched?.length || 0,
      });
      console.log(`🔍 [fetchBulkStatus] Ready paper IDs:`, result.ready?.slice(0, 3).join(', ') + (result.ready?.length > 3 ? '...' : ''));
      console.log(`🔍 [fetchBulkStatus] Not fetched IDs:`, result.not_fetched?.slice(0, 3).join(', ') + (result.not_fetched?.length > 3 ? '...' : ''));

      return result;
    } catch (error) {
      console.error('❌ [fetchBulkStatus] Error fetching bulk status:', error);
      return null;
    }
  }, []);

  /**
   * Wait for full-text extraction to complete
   * Phase 10 Day 31.4: Enterprise-grade implementation with proper UX
   */
  const waitForFullText = useCallback(async (
    paperIds: string[],
    options: WaitForFullTextOptions = {}
  ): Promise<WaitForFullTextResult> => {
    // Phase 10 Day 31.4: Input validation (defensive programming)
    if (!paperIds || paperIds.length === 0) {
      console.warn('waitForFullText called with empty paperIds array');
      return {
        allReady: true,
        status: {
          ready: [],
          fetching: [],
          failed: [],
          notFetched: [],
          total: 0,
          readyCount: 0,
          progressPercent: 100,
          elapsedSeconds: 0,
        },
        reason: 'success',
      };
    }

    const {
      maxWaitSeconds = DEFAULT_MAX_WAIT_SECONDS,
      onProgress,
      onCancel,
      onTimeout,
    } = options;

    // Reset cancellation flag
    cancelledRef.current = false;
    setIsWaiting(true);

    const startTime = Date.now();
    let elapsedSeconds = 0;

    try {
      console.log(`\n🕐 [FullTextWait] Starting wait for ${paperIds.length} papers (max ${maxWaitSeconds}s)...`);

      // Phase 10 Day 31.5: Check initial status to detect papers that cannot be fetched
      console.log(`🔍 [FullTextWait] Fetching initial status to detect unfetchable papers...`);
      const initialStatus = await fetchBulkStatus(paperIds);

      if (initialStatus) {
        const initialReady = initialStatus.ready.length;
        const initialFetching = initialStatus.fetching.length;
        const initialFailed = initialStatus.failed.length;
        const initialNotFetched = initialStatus.not_fetched.length;

        console.log(`📊 [FullTextWait] Initial status breakdown:`);
        console.log(`   • Ready (have full-text): ${initialReady}`);
        console.log(`   • Fetching (jobs in progress): ${initialFetching}`);
        console.log(`   • Failed (fetch failed): ${initialFailed}`);
        console.log(`   • Not fetched (no job queued - missing DOI/PMID/URL): ${initialNotFetched}`);

        // Warn if papers cannot be fetched
        if (initialNotFetched > 0) {
          console.warn(
            `⚠️ [FullTextWait] WARNING: ${initialNotFetched} papers have no DOI/PMID/URL and cannot fetch full-text!`
          );
          toast.warning(
            `${initialNotFetched} papers lack identifiers for full-text extraction. They will use abstracts only.`,
            { duration: TOAST_DURATION_IMPORTANT_MS }
          );
        }

        // If ALL papers are already ready or cannot be fetched, skip waiting
        if (initialFetching === 0) {
          console.log(
            `✅ [FullTextWait] No papers currently fetching - ${initialReady} ready, ${initialFailed + initialNotFetched} cannot fetch. Skipping wait.`
          );
          setIsWaiting(false);
          return {
            allReady: initialReady === paperIds.length,
            status: {
              ready: initialStatus.ready,
              fetching: initialStatus.fetching,
              failed: initialStatus.failed,
              notFetched: initialStatus.not_fetched,
              total: paperIds.length,
              readyCount: initialReady,
              progressPercent: Math.round((initialReady / paperIds.length) * 100),
              elapsedSeconds: 0,
            },
            reason: 'success',
          };
        }

        console.log(
          `⏳ [FullTextWait] ${initialFetching} papers are currently fetching. Starting poll...`
        );
      }

      while (true) {
        // Check if cancelled
        if (cancelledRef.current) {
          console.log('❌ [FullTextWait] Cancelled by user');
          onCancel?.();
          return {
            allReady: false,
            status: {
              ready: [],
              fetching: [],
              failed: [],
              notFetched: paperIds,
              total: paperIds.length,
              readyCount: 0,
              progressPercent: 0,
              elapsedSeconds,
            },
            reason: 'cancelled',
          };
        }

        // Check timeout
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedSeconds >= maxWaitSeconds) {
          console.log(`⏱️ [FullTextWait] Timeout reached after ${elapsedSeconds}s`);

          // Fetch final status
          const finalStatus = await fetchBulkStatus(paperIds);
          if (finalStatus) {
            const finalResult: FullTextWaitStatus = {
              ready: finalStatus.ready,
              fetching: finalStatus.fetching,
              failed: finalStatus.failed,
              notFetched: finalStatus.not_fetched,
              total: paperIds.length,
              readyCount: finalStatus.ready.length,
              progressPercent: Math.round((finalStatus.ready.length / paperIds.length) * 100),
              elapsedSeconds,
            };

            onTimeout?.(finalResult);

            // Dismiss progress toast
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }

            // Show timeout message with option to proceed
            toast.warning(
              `Full-text wait timed out after ${maxWaitSeconds}s. ${finalResult.readyCount}/${paperIds.length} papers ready. Proceeding with available content...`,
              { duration: TOAST_DURATION_IMPORTANT_MS }
            );

            return {
              allReady: false,
              status: finalResult,
              reason: 'timeout',
            };
          }
        }

        // Fetch current status
        const bulkStatus = await fetchBulkStatus(paperIds);

        if (!bulkStatus) {
          console.error('❌ [FullTextWait] Failed to fetch bulk status');
          setIsWaiting(false);
          return {
            allReady: false,
            status: {
              ready: [],
              fetching: [],
              failed: [],
              notFetched: paperIds,
              total: paperIds.length,
              readyCount: 0,
              progressPercent: 0,
              elapsedSeconds,
            },
            reason: 'error',
          };
        }

        const status: FullTextWaitStatus = {
          ready: bulkStatus.ready,
          fetching: bulkStatus.fetching,
          failed: bulkStatus.failed,
          notFetched: bulkStatus.not_fetched,
          total: paperIds.length,
          readyCount: bulkStatus.ready.length,
          progressPercent: Math.round((bulkStatus.ready.length / paperIds.length) * 100),
          elapsedSeconds,
        };

        // Call progress callback
        onProgress?.(status);

        // Log progress with detailed breakdown
        console.log(
          `   ⏳ Progress: ${status.readyCount}/${status.total} ready (${status.progressPercent}%) - ${status.fetching.length} fetching, ${status.failed.length} failed, ${status.notFetched.length} not_fetched - ${elapsedSeconds}s elapsed`
        );

        // Phase 10 Day 31.5: CRITICAL FIX - Only wait for papers that are actually fetching
        // Papers in 'not_fetched' status will NEVER get full-text (no job queued)
        // Papers in 'failed' status already tried and failed
        // Only papers in 'fetching' status can transition to 'ready'
        const stillFetchingCount = status.fetching.length;
        const cannotFetchCount = status.notFetched.length + status.failed.length;

        // Log the actual state
        if (cannotFetchCount > 0) {
          console.warn(
            `   ⚠️ ${cannotFetchCount} papers cannot get full-text: ${status.notFetched.length} not queued (no DOI/PMID/URL), ${status.failed.length} failed`
          );
        }

        // Exit condition: No more papers are being fetched
        // Don't wait for papers that are 'not_fetched' - they'll never change
        if (stillFetchingCount === 0) {
          console.log(
            `✅ [FullTextWait] Wait complete! ${status.readyCount} ready, ${status.failed.length} failed, ${status.notFetched.length} not queued`
          );

          // Dismiss progress toast
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }

          // Show success message with accurate counts
          if (cannotFetchCount > 0) {
            // Some papers couldn't be fetched
            if (status.readyCount > 0) {
              toast.success(
                `${status.readyCount} papers with full-text ready. ${cannotFetchCount} will use abstracts only.`,
                { duration: TOAST_DURATION_IMPORTANT_MS }
              );
            } else {
              toast.warning(
                `No full-text available. ${cannotFetchCount} papers will use abstracts only.`,
                { duration: TOAST_DURATION_IMPORTANT_MS }
              );
            }
          } else {
            // All papers have full-text
            toast.success(
              `All ${status.readyCount} papers have full-text ready!`,
              { duration: TOAST_DURATION_MS }
            );
          }

          setIsWaiting(false);
          return {
            allReady: true,
            status,
            reason: 'success',
          };
        }

        // Show progress toast (update existing or create new)
        const progressMessage = `Fetching full-text: ${status.readyCount}/${status.total} ready${elapsedSeconds >= MIN_WAIT_FOR_SKIP_SECONDS ? ' (you can proceed anyway)' : ''}`;

        if (toastIdRef.current) {
          // Update existing toast
          toast.loading(progressMessage, { id: toastIdRef.current });
        } else {
          // Create new toast
          toastIdRef.current = toast.loading(progressMessage);
        }

        // Wait before next poll (Phase 10 Day 31.4: Use constant, not magic number)
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error) {
      console.error('❌ [FullTextWait] Unexpected error:', error);

      // Dismiss progress toast
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }

      toast.error('Error waiting for full-text. Proceeding with available content...', {
        duration: TOAST_DURATION_IMPORTANT_MS
      });

      setIsWaiting(false);
      return {
        allReady: false,
        status: {
          ready: [],
          fetching: [],
          failed: [],
          notFetched: paperIds,
          total: paperIds.length,
          readyCount: 0,
          progressPercent: 0,
          elapsedSeconds,
        },
        reason: 'error',
      };
    }
  }, [fetchBulkStatus]);

  // Phase 10 Day 31.4: Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cancel any ongoing wait operation
      cancelledRef.current = true;

      // Dismiss any active toast notifications
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  return {
    waitForFullText,
    isWaiting,
    cancel,
  };
}
