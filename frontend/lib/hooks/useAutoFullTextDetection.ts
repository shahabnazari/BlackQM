/**
 * Auto Full-Text Detection Hook - Netflix-Grade A+
 * 
 * Automatically runs full-text detection when papers are selected
 * so users see accurate counts in Content Analysis modal without waiting.
 * 
 * Netflix-Grade Features:
 * - Automatic triggering when papers selected
 * - WebSocket with proper URL construction
 * - Timeout handling (60s max)
 * - Retry logic (3 attempts)
 * - Race condition prevention
 * - Memory leak prevention
 * - Error recovery
 * - Type-safe backend integration
 * 
 * Triggers detection:
 * - When papers are selected (after search completes)
 * - When selected papers change
 * - Only for papers without hasFullText flag set
 * 
 * @module useAutoFullTextDetection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

interface UseAutoFullTextDetectionConfig {
  /** Papers to detect full-text for */
  papers: Paper[];
  /** Whether detection is enabled (default: true) */
  enabled?: boolean;
  /** Minimum number of papers to trigger detection (default: 10) */
  minPapers?: number;
  /** Callback when detection completes */
  onDetectionComplete?: (detectedCount: number) => void;
}

interface UseAutoFullTextDetectionReturn {
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Number of papers detected so far */
  detectedCount: number;
  /** Total papers being detected */
  totalDetecting: number;
  /** Error message if detection failed */
  error: string | null;
  /** Manually trigger detection */
  triggerDetection: () => Promise<void>;
}

/**
 * Hook to automatically detect full-text availability for selected papers
 * 
 * Uses WebSocket for real-time progress updates and batch detection.
 * Updates papers in store with hasFullText flag when detection completes.
 */
export function useAutoFullTextDetection(
  config: UseAutoFullTextDetectionConfig
): UseAutoFullTextDetectionReturn {
  const {
    papers,
    enabled = true,
    minPapers = 10,
    onDetectionComplete,
  } = config;

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [totalDetecting, setTotalDetecting] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const detectionInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const setPapers = useLiteratureSearchStore((state) => state.setPapers);

  // Netflix-Grade: Constants
  const DETECTION_TIMEOUT_MS = 60000; // 60 seconds max
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000; // 2 seconds between retries
  const DEBOUNCE_DELAY_MS = 1500; // 1.5 seconds debounce to prevent rapid-fire triggers

  /**
   * Connect to WebSocket for full-text detection
   * Netflix-Grade: Proper URL construction (strip /api suffix)
   */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // WebSocket connects to base URL without /api prefix
    // REST: http://localhost:4000/api  (NEXT_PUBLIC_API_URL)
    // WebSocket: http://localhost:4000 (base URL)
    const restApiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
    const wsBaseUrl = restApiUrl.replace(/\/api\/?$/, ''); // Strip /api suffix for WebSocket
    const socket = io(`${wsBaseUrl}/literature`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      logger.info('WebSocket connected for full-text detection', 'useAutoFullTextDetection');
      setError(null); // Clear error on successful connection
    });

    socket.on('disconnect', (reason: string) => {
      logger.warn('WebSocket disconnected', 'useAutoFullTextDetection', { reason });
      // If disconnected during detection, mark as failed
      if (detectionInProgressRef.current) {
        setError('Connection lost during detection');
        setIsDetecting(false);
        detectionInProgressRef.current = false;
      }
    });

    socket.on('connect_error', (err: Error) => {
      logger.error('WebSocket connection error', 'useAutoFullTextDetection', { error: err.message });
      setError(`Connection failed: ${err.message}`);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  /**
   * Trigger full-text detection for papers without hasFullText flag
   * Netflix-Grade: Timeout, retry, error handling, race condition prevention
   */
  const triggerDetection = useCallback(async () => {
    if (!enabled || detectionInProgressRef.current) {
      return;
    }

    // Filter papers that need detection
    // Phase 10.185.1 Compatibility: Skip papers with graceful_degradation source
    // These papers have hasFullText=false intentionally to allow re-processing
    // Note: fullTextSource type doesn't include 'graceful_degradation' in frontend types,
    // but backend can return it, so we check for it as a string
    const papersNeedingDetection = papers.filter(
      (p) => 
        p && 
        p.id && 
        !p.hasFullText && 
        (p.doi || p.title) &&
        // Phase 10.185.1: Don't re-detect papers that already have graceful degradation
        // They should be re-processed by pdf-parsing.service, not detection service
        (p.fullTextSource as string | undefined) !== 'graceful_degradation'
    );

    if (papersNeedingDetection.length < minPapers) {
      logger.debug(
        `Skipping detection: ${papersNeedingDetection.length} papers need detection (min: ${minPapers})`,
        'useAutoFullTextDetection'
      );
      return;
    }

    detectionInProgressRef.current = true;
    setIsDetecting(true);
    setError(null);
    setDetectedCount(0);
    setTotalDetecting(papersNeedingDetection.length);
    retryCountRef.current = 0;

    // Netflix-Grade: Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Prepare papers for detection (outside closure)
    const papersForDetection = papersNeedingDetection.map((p) => ({
      id: p.id,
      doi: p.doi,
      title: p.title,
    }));

    const performDetection = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          logger.info(
            `Starting auto full-text detection for ${papersNeedingDetection.length} papers (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`,
            'useAutoFullTextDetection'
          );

          const socket = connectSocket();

          // Netflix-Grade: Set timeout for detection
          timeoutRef.current = setTimeout(() => {
            logger.error('Full-text detection timeout', 'useAutoFullTextDetection', {
              timeout: DETECTION_TIMEOUT_MS,
            });
            socket.off('fulltext:batch-result'); // Remove listener
            reject(new Error(`Detection timeout after ${DETECTION_TIMEOUT_MS}ms`));
          }, DETECTION_TIMEOUT_MS);

          // Netflix-Grade: Cleanup function for listener
          const cleanup = () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            socket.off('fulltext:batch-result', handleResult);
          };

          // Listen for batch result
          const handleResult = (result: {
            results: Readonly<Record<string, {
              readonly isAvailable: boolean;
              readonly confidence: 'low' | 'medium' | 'high' | 'ai_verified';
              readonly primaryUrl: string | null;
              readonly sources: readonly string[];
            }>>;
            readonly successfulPapers: readonly string[];
            readonly failedPapers: readonly string[];
          }) => {
            cleanup(); // Clear timeout and remove listener

            logger.info(
              `Full-text detection complete: ${result.successfulPapers.length} available, ${result.failedPapers.length} not found`,
              'useAutoFullTextDetection'
            );

            // Netflix-Grade: Update papers in store with detection results
            // Accept medium+ confidence results (not just high/ai_verified)
            // Backend returns primaryUrl as string | null, handle both
            setPapers((prevPapers) => {
              return prevPapers.map((storePaper) => {
                const detectionResult = result.results[storePaper.id];
                if (detectionResult && detectionResult.isAvailable) {
                  // Accept medium, high, or ai_verified confidence (exclude 'low')
                  const acceptableConfidence: readonly ('medium' | 'high' | 'ai_verified')[] = ['medium', 'high', 'ai_verified'] as const;
                  if (detectionResult.confidence !== 'low' && acceptableConfidence.includes(detectionResult.confidence as 'medium' | 'high' | 'ai_verified')) {
                    return {
                      ...storePaper,
                      hasFullText: true,
                      pdfUrl: (detectionResult.primaryUrl || storePaper.pdfUrl) ?? null,
                      fullTextStatus: 'available' as const,
                    } as Paper;
                  }
                }
                return storePaper;
              });
            });

            setDetectedCount(result.successfulPapers.length);
            setIsDetecting(false);
            detectionInProgressRef.current = false;
            retryCountRef.current = 0; // Reset retry count on success

            onDetectionComplete?.(result.successfulPapers.length);
            resolve();
          };

          socket.once('fulltext:batch-result', handleResult);

          // Netflix-Grade: Handle WebSocket errors
          const handleError = (error: Error) => {
            cleanup();
            reject(error);
          };

          socket.once('error', handleError);

          // Trigger batch detection
          socket.emit('fulltext:detect-batch', { papers: papersForDetection }, (response: {
            success: boolean;
            error?: string;
            stats?: { total: number; successful: number; failed: number };
          }) => {
            if (!response.success) {
              cleanup();
              socket.off('error', handleError);
              reject(new Error(response.error || 'Detection failed'));
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    };

    // Netflix-Grade: Retry logic
    const attemptDetection = async (): Promise<void> => {
      try {
        await performDetection();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Full-text detection attempt failed', 'useAutoFullTextDetection', {
          attempt: retryCountRef.current + 1,
          error: error.message,
        });

        retryCountRef.current++;
        if (retryCountRef.current < MAX_RETRIES) {
          logger.info(`Retrying detection (${retryCountRef.current + 1}/${MAX_RETRIES})`, 'useAutoFullTextDetection');
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          return attemptDetection();
        } else {
          // Max retries reached
          logger.error('Full-text detection failed after all retries', 'useAutoFullTextDetection', {
            attempts: MAX_RETRIES,
            error: error.message,
          });
          setError(error.message);
          setIsDetecting(false);
          detectionInProgressRef.current = false;
          retryCountRef.current = 0;
        }
      }
    };

    // Start detection with retry
    attemptDetection().catch((err) => {
      logger.error('Unhandled detection error', 'useAutoFullTextDetection', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, [enabled, papers, minPapers, connectSocket, setPapers, onDetectionComplete]);

  /**
   * Auto-trigger detection when papers change
   * Netflix-Grade: Debounce to prevent race conditions
   */
  useEffect(() => {
    if (!enabled || papers.length === 0) {
      return;
    }

    // Check if any papers need detection
    // Phase 10.185.1 Compatibility: Skip graceful degradation papers
    const needsDetection = papers.some(
      (p) => 
        p && 
        p.id && 
        !p.hasFullText && 
        (p.doi || p.title) &&
        (p.fullTextSource as string | undefined) !== 'graceful_degradation'
    );

    if (needsDetection && !detectionInProgressRef.current) {
      // Netflix-Grade: Debounce to prevent rapid-fire triggers
      // Use longer delay to ensure papers are fully loaded
      const timeoutId = setTimeout(() => {
        // Double-check detection is still needed (papers might have changed)
        const stillNeedsDetection = papers.some(
          (p) => 
            p && 
            p.id && 
            !p.hasFullText && 
            (p.doi || p.title) &&
            (p.fullTextSource as string | undefined) !== 'graceful_degradation'
        );
        if (stillNeedsDetection && !detectionInProgressRef.current) {
          triggerDetection();
        }
      }, DEBOUNCE_DELAY_MS);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [enabled, papers, triggerDetection]);

  /**
   * Cleanup WebSocket and timeouts on unmount
   * Netflix-Grade: Prevent memory leaks
   */
  useEffect(() => {
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Disconnect WebSocket
      if (socketRef.current) {
        // Remove all listeners to prevent memory leaks
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Reset state
      detectionInProgressRef.current = false;
      retryCountRef.current = 0;
    };
  }, []);

  return {
    isDetecting,
    detectedCount,
    totalDetecting,
    error,
    triggerDetection,
  };
}

