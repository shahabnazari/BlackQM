/**
 * Phase 10.113 Week 6: Thematization Pricing API Service
 *
 * Netflix-grade frontend service for thematization pricing and tier selection.
 * Connects to backend ThematizationPricingService endpoints.
 *
 * Endpoints:
 * - GET /thematization/pricing - Get tier pricing comparison
 * - GET /thematization/subscriptions - Get subscription options
 * - GET /thematization/estimate - Get cost estimate
 * - GET /thematization/usage - Get user usage stats
 *
 * @module ThematizationPricingAPI
 * @since Phase 10.113 Week 6
 */

import { apiClient } from '../client';
import type { AxiosError } from 'axios';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS (No Magic Numbers)
// ============================================================================

/** Default timeout for pricing/subscription API calls */
const API_TIMEOUT_MS = 10000;

// ============================================================================
// TYPE DEFINITIONS (Strict Typing - No 'any')
// ============================================================================

/**
 * Valid thematization tier counts
 */
export type ThematizationTierCount = 50 | 100 | 150 | 200 | 250 | 300;

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * Pipeline feature flags
 */
export interface ThematizationPipelineFlags {
  readonly enableHierarchicalExtraction: boolean;
  readonly enableControversyAnalysis: boolean;
  readonly enableClaimExtraction: boolean;
}

/**
 * Tier pricing information
 */
export interface TierPricing {
  readonly tier: ThematizationTierCount;
  readonly baseCost: number;
  readonly fullCost: number;
  readonly estimatedTime: string;
  readonly description: string;
}

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  readonly tier: SubscriptionTier;
  readonly monthlyCredits: number;
  readonly priceUSD: number;
  readonly features: readonly string[];
  readonly discountPercent: number;
}

/**
 * Feature costs breakdown
 */
export interface FeatureCosts {
  readonly hierarchicalExtraction?: number;
  readonly controversyAnalysis?: number;
  readonly claimExtraction?: number;
}

/**
 * Cost estimate response
 */
export interface CostEstimateResponse {
  readonly tier: ThematizationTierCount;
  readonly baseCost: number;
  readonly featureCosts: FeatureCosts;
  readonly totalCost: number;
  readonly discounts: {
    readonly subscriptionDiscount?: number;
    readonly bulkDiscount?: number;
    readonly promoDiscount?: number;
  };
  readonly finalCost: number;
  readonly costUSD: number;
  readonly estimatedTimeSeconds: number;
  readonly remainingCredits?: number;
}

/**
 * User usage statistics
 */
export interface UserUsageStats {
  readonly subscription: SubscriptionTier;
  readonly creditsUsed: number;
  readonly creditsRemaining: number;
  readonly monthlyCredits: number;
  readonly jobsThisMonth: number;
  readonly totalJobsAllTime: number;
  readonly billingCycleStart?: string;
  readonly billingCycleEnd?: string;
}

// Note: apiClient.get<T>() returns Promise<ApiResponse<T>> where ApiResponse = { data: T }
// So response.data gives us the actual data T

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default tier pricing (fallback when API unavailable)
 */
const DEFAULT_TIER_PRICING: readonly TierPricing[] = [
  {
    tier: 50,
    baseCost: 10,
    fullCost: 25,
    estimatedTime: '2-3 min',
    description: 'Quick Analysis - Perfect for exploratory research',
  },
  {
    tier: 100,
    baseCost: 15,
    fullCost: 30,
    estimatedTime: '4-5 min',
    description: 'Standard Analysis - Good balance of depth and speed',
  },
  {
    tier: 150,
    baseCost: 20,
    fullCost: 35,
    estimatedTime: '6-8 min',
    description: 'Deep Analysis - Comprehensive coverage',
  },
  {
    tier: 200,
    baseCost: 25,
    fullCost: 40,
    estimatedTime: '10-12 min',
    description: 'Comprehensive Analysis - Full literature review',
  },
  {
    tier: 250,
    baseCost: 30,
    fullCost: 45,
    estimatedTime: '14-16 min',
    description: 'Expert Analysis - Professional research grade',
  },
  {
    tier: 300,
    baseCost: 35,
    fullCost: 50,
    estimatedTime: '18-20 min',
    description: 'Full Research Analysis - Maximum depth',
  },
] as const;

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Get tier pricing comparison
 *
 * @returns Array of tier pricing information
 */
export async function getTierPricing(): Promise<readonly TierPricing[]> {
  try {
    logger.debug('Fetching tier pricing', 'ThematizationPricingAPI');

    const response = await apiClient.get<readonly TierPricing[]>(
      '/thematization/pricing',
      { timeout: API_TIMEOUT_MS }
    );

    const data = response.data;
    logger.debug('Tier pricing fetched', 'ThematizationPricingAPI', {
      tierCount: data.length,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch tier pricing', 'ThematizationPricingAPI', {
      error: axiosError.message,
      status: axiosError.response?.status,
    });

    // Return default pricing on error
    return DEFAULT_TIER_PRICING;
  }
}

/**
 * Get subscription options
 *
 * @returns Array of subscription configurations
 */
export async function getSubscriptionOptions(): Promise<readonly SubscriptionConfig[]> {
  try {
    logger.debug('Fetching subscription options', 'ThematizationPricingAPI');

    const response = await apiClient.get<readonly SubscriptionConfig[]>(
      '/thematization/subscriptions',
      { timeout: API_TIMEOUT_MS }
    );

    const data = response.data;
    logger.debug('Subscription options fetched', 'ThematizationPricingAPI', {
      optionCount: data.length,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch subscription options', 'ThematizationPricingAPI', {
      error: axiosError.message,
    });

    // Return empty array on error
    return [];
  }
}

/**
 * Get cost estimate for a thematization job
 *
 * @param tier - Paper count tier
 * @param flags - Optional pipeline feature flags
 * @param promoCode - Optional promo code
 * @returns Cost estimate with breakdown
 */
export async function getCostEstimate(
  tier: ThematizationTierCount,
  flags?: Partial<ThematizationPipelineFlags>,
  promoCode?: string
): Promise<CostEstimateResponse | null> {
  try {
    logger.debug('Fetching cost estimate', 'ThematizationPricingAPI', { tier, flags });

    const params = new URLSearchParams();
    params.append('tier', tier.toString());

    if (flags?.enableHierarchicalExtraction) {
      params.append('enableHierarchical', 'true');
    }
    if (flags?.enableControversyAnalysis) {
      params.append('enableControversy', 'true');
    }
    if (flags?.enableClaimExtraction) {
      params.append('enableClaims', 'true');
    }
    if (promoCode) {
      params.append('promoCode', promoCode);
    }

    const response = await apiClient.get<CostEstimateResponse>(
      `/thematization/estimate?${params.toString()}`,
      { timeout: API_TIMEOUT_MS }
    );

    const data = response.data;
    logger.debug('Cost estimate fetched', 'ThematizationPricingAPI', {
      tier: data.tier,
      finalCost: data.finalCost,
    });

    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch cost estimate', 'ThematizationPricingAPI', {
      error: axiosError.message,
    });
    return null;
  }
}

/**
 * Get user usage statistics
 *
 * @returns User usage stats
 */
export async function getUserUsage(): Promise<UserUsageStats | null> {
  try {
    logger.debug('Fetching user usage', 'ThematizationPricingAPI');

    // Backend returns { success: true, data: UserUsageStats }
    // apiClient.get() extracts response.data, so we get { success: true, data: UserUsageStats }
    const response = await apiClient.get<{ success: boolean; data: UserUsageStats }>(
      '/thematization/usage',
      { timeout: API_TIMEOUT_MS }
    );

    // Extract nested data property
    const data = response.data?.data || response.data;
    
    // Validate response structure
    if (!data || typeof data !== 'object' || !('subscription' in data)) {
      logger.warn('Invalid user usage response format', 'ThematizationPricingAPI', { response });
      return null;
    }

    logger.debug('User usage fetched', 'ThematizationPricingAPI', {
      subscription: data.subscription,
      creditsRemaining: data.creditsRemaining,
    });

    return data as UserUsageStats;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch user usage', 'ThematizationPricingAPI', {
      error: axiosError.message,
      status: axiosError.response?.status,
    });
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if tier is valid
 */
export function isValidTier(tier: number): tier is ThematizationTierCount {
  return [50, 100, 150, 200, 250, 300].includes(tier);
}

/**
 * Get tier display info
 */
export function getTierDisplayInfo(tier: ThematizationTierCount): {
  name: string;
  badgeColor: string;
  icon: string;
} {
  switch (tier) {
    case 50:
      return { name: 'Quick', badgeColor: 'bg-blue-100 text-blue-700', icon: '⚡' };
    case 100:
      return { name: 'Standard', badgeColor: 'bg-green-100 text-green-700', icon: '📊' };
    case 150:
      return { name: 'Deep', badgeColor: 'bg-purple-100 text-purple-700', icon: '🔍' };
    case 200:
      return { name: 'Comprehensive', badgeColor: 'bg-orange-100 text-orange-700', icon: '📚' };
    case 250:
      return { name: 'Expert', badgeColor: 'bg-red-100 text-red-700', icon: '🎓' };
    case 300:
      return { name: 'Full Research', badgeColor: 'bg-indigo-100 text-indigo-700', icon: '🏆' };
  }
}

/**
 * Format credits as display string
 */
export function formatCredits(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`;
}

/**
 * Format USD as display string
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default {
  getTierPricing,
  getSubscriptionOptions,
  getCostEstimate,
  getUserUsage,
  isValidTier,
  getTierDisplayInfo,
  formatCredits,
  formatUSD,
};
