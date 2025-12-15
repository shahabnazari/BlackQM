/**
 * Phase 10.143: Count Stabilization Detection Hook
 * Phase 10.152: Fixed orbital animation - stabilization persists after completion
 *
 * Detects when a count value stabilizes (stops increasing).
 * Uses a timer-based approach for reliable detection even when
 * count stops changing between renders.
 *
 * Used for:
 * - Stopping inward particle flow when collection complete
 * - Starting orbital animation when papers collected
 *
 * Phase 10.152 FIX: Orbital animation wasn't working because:
 * 1. Timer was cleared when isComplete became true
 * 2. isStabilized was reset when isActive became false
 * Now: stabilization state persists briefly after completion for visible orbit
 *
 * @module PipelineOrchestra
 * @since Phase 10.143
 */

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Configuration for stabilization detection
 * Centralized to avoid magic numbers
 * Phase 10.152: Optimized for visible orbital animation
 */
export const STABILIZATION_CONFIG = {
  /** Time in ms to wait before considering count stabilized
   * Phase 10.152: Reduced to 300ms for faster response
   * This ensures orbit starts quickly even on fast searches */
  stabilizationDelayMs: 300,
  /** Orbital animation duration in seconds
   * Phase 10.153: Reduced from 15s to 8s for more noticeable planetary motion
   * One full rotation every 8 seconds is clearly visible */
  orbitDurationSeconds: 8,
  /** How long to keep orbiting after search completes (ms)
   * Phase 10.152: Allows user to see the orbit animation briefly */
  orbitPersistAfterCompleteMs: 5000,
} as const;

// ============================================================================
// HOOK
// ============================================================================

interface UseCountStabilizationOptions {
  /** The count value to monitor */
  count: number;
  /** Whether the system is actively running */
  isActive: boolean;
}

interface UseCountStabilizationResult {
  /** Whether the count has stabilized (stopped increasing) */
  isStabilized: boolean;
}

/**
 * Detects when a count value stabilizes (stops increasing)
 *
 * Uses a timer-based approach: if count hasn't increased for
 * STABILIZATION_CONFIG.stabilizationDelayMs, it's considered stable.
 *
 * Phase 10.152 FIX: Stabilization now persists after search completion
 * to allow orbital animation to be visible.
 *
 * @example
 * ```tsx
 * const { isStabilized } = useCountStabilization({
 *   count: rawTotalPapers,
 *   isActive: isSearching,
 * });
 * ```
 */
export function useCountStabilization({
  count,
  isActive,
}: UseCountStabilizationOptions): UseCountStabilizationResult {
  const prevCountRef = useRef(count);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isStabilized, setIsStabilized] = useState(false);
  const wasActiveRef = useRef(false);

  // Timer-based stabilization detection
  useEffect(() => {
    // Clear existing stabilization timer when count changes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Track when we become active
    if (isActive && !wasActiveRef.current) {
      wasActiveRef.current = true;
    }

    // Phase 10.152 FIX: Don't skip if was previously active - let stabilization continue!
    // Only skip if never was active (prevents false stabilization before search starts)
    if (!isActive && !wasActiveRef.current) {
      return;
    }

    if (count > prevCountRef.current) {
      // Count is still increasing - reset stabilization, don't start timer
      setIsStabilized(false);
      prevCountRef.current = count;
    } else if (count < prevCountRef.current) {
      // Phase 10.152 FIX Bug #2: Count decreased - reset stabilization, don't start timer
      // This prevents false stabilization when count drops (e.g., deduplication)
      setIsStabilized(false);
      prevCountRef.current = count;
    } else if (count > 0 && !isStabilized) {
      // Count unchanged and positive - start stabilization timer
      // Note: count=0 intentionally never stabilizes (nothing to show)
      timerRef.current = setTimeout(() => {
        setIsStabilized(true);
      }, STABILIZATION_CONFIG.stabilizationDelayMs);
      prevCountRef.current = count;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [count, isActive, isStabilized]);

  // Phase 10.152 FIX: Persist stabilization briefly after search ends
  // This allows the orbital animation to be visible after completion
  useEffect(() => {
    // Clear any existing persist timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    // When search becomes inactive (completes), keep isStabilized for a bit
    if (!isActive && wasActiveRef.current && isStabilized) {
      // Keep orbiting for orbitPersistAfterCompleteMs after completion
      persistTimerRef.current = setTimeout(() => {
        setIsStabilized(false);
        wasActiveRef.current = false;
        prevCountRef.current = 0;
      }, STABILIZATION_CONFIG.orbitPersistAfterCompleteMs);
    }

    // Full reset when starting a new search
    if (isActive && !wasActiveRef.current) {
      setIsStabilized(false);
      prevCountRef.current = 0;
    }

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [isActive, isStabilized]);

  return { isStabilized };
}

export default useCountStabilization;
