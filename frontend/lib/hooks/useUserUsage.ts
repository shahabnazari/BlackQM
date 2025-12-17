/**
 * Phase 10.175: User Usage Hook
 *
 * Fetches and caches user subscription and credit data for thematization.
 * Used by ThematizationConfigModal to show accurate pricing.
 *
 * @module useUserUsage
 * @since Phase 10.175
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserUsage, type UserUsageStats, type SubscriptionTier } from '@/lib/api/services/thematization-pricing-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Cache duration in milliseconds (5 minutes) */
const CACHE_DURATION_MS = 5 * 60 * 1000;

/** Default subscription tier when API unavailable */
const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTier = 'free';

/** Default remaining credits when API unavailable */
const DEFAULT_REMAINING_CREDITS = 100;

// ============================================================================
// MODULE-LEVEL CACHE
// ============================================================================

let cachedUsage: UserUsageStats | null = null;
let cacheTimestamp = 0;

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseUserUsageResult {
  /** User's subscription tier */
  subscriptionTier: SubscriptionTier;
  /** Remaining credits */
  remainingCredits: number;
  /** Full usage stats (if available) */
  usageStats: UserUsageStats | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh usage data */
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook to fetch and manage user usage data
 *
 * @returns User usage state and controls
 *
 * @example
 * ```tsx
 * const { subscriptionTier, remainingCredits, isLoading } = useUserUsage();
 *
 * return (
 *   <ThematizationConfigModal
 *     subscriptionTier={subscriptionTier}
 *     remainingCredits={remainingCredits}
 *   />
 * );
 * ```
 */
export function useUserUsage(): UseUserUsageResult {
  const [usageStats, setUsageStats] = useState<UserUsageStats | null>(cachedUsage);
  const [isLoading, setIsLoading] = useState(!cachedUsage);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch usage data from API with caching
   */
  const fetchUsage = useCallback(async (force = false) => {
    // Check cache validity
    const now = Date.now();
    if (!force && cachedUsage && now - cacheTimestamp < CACHE_DURATION_MS) {
      logger.debug('Using cached user usage', 'useUserUsage', {
        cacheAge: now - cacheTimestamp,
      });
      setUsageStats(cachedUsage);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Fetching user usage from API', 'useUserUsage');
      const data = await getUserUsage();

      if (data) {
        cachedUsage = data;
        cacheTimestamp = now;
        setUsageStats(data);
        logger.debug('User usage fetched', 'useUserUsage', {
          subscription: data.subscription,
          creditsRemaining: data.creditsRemaining,
        });
      } else {
        logger.warn('User usage API returned null, using defaults', 'useUserUsage');
        setError('Could not fetch usage data');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch user usage', 'useUserUsage', { error: message });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh usage data (force fetch)
   */
  const refresh = useCallback(async () => {
    await fetchUsage(true);
  }, [fetchUsage]);

  // Fetch on mount
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Compute values with fallbacks
  const subscriptionTier: SubscriptionTier = usageStats?.subscription ?? DEFAULT_SUBSCRIPTION_TIER;
  const remainingCredits = usageStats?.creditsRemaining ?? DEFAULT_REMAINING_CREDITS;

  return {
    subscriptionTier,
    remainingCredits,
    usageStats,
    isLoading,
    error,
    refresh,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useUserUsage;
