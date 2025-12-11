/**
 * Phase 10.113 Week 6: Thematization Pricing Service
 *
 * Netflix-grade pricing infrastructure for thematization analysis.
 * Calculates costs based on paper tiers and optional features.
 *
 * ============================================================================
 * PRICING MODEL
 * ============================================================================
 *
 * Base Costs (Credits):
 * - Tier 50:  10 credits (Quick Analysis)
 * - Tier 100: 15 credits (Standard Analysis)
 * - Tier 150: 20 credits (Deep Analysis)
 * - Tier 200: 25 credits (Comprehensive Analysis)
 * - Tier 250: 30 credits (Expert Analysis)
 * - Tier 300: 35 credits (Full Research Analysis)
 *
 * Optional Feature Costs:
 * - Hierarchical Extraction (Week 3): +5 credits
 * - Controversy Analysis (Week 4): +5 credits
 * - Claim Extraction (Week 5): +5 credits
 *
 * Reference: THEMATIZATION_TIER_CONFIGS in unified-thematization.types.ts
 *
 * @module ThematizationPricingService
 * @since Phase 10.113 Week 6
 */

import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import {
  ThematizationTierCount,
  ThematizationPipelineFlags,
  ThematizationCostEstimate,
  DEFAULT_PIPELINE_FLAGS,
  getTierConfig,
  isValidTier,
} from '../types/unified-thematization.types';
import { ThematizationBillingService } from './thematization-billing.service';

// ============================================================================
// NAMED CONSTANTS (No Magic Numbers)
// ============================================================================

/** Base cost in credits for tier 50 */
const BASE_COST_CREDITS = 10;

/** Cost per optional feature */
const FEATURE_COST_CREDITS = 5;

/** Discount for bulk purchases (> 10 jobs) */
const BULK_DISCOUNT_PERCENT = 10;

/** Free tier monthly limit */
const FREE_TIER_MONTHLY_LIMIT = 3;

/** Credit to USD conversion rate */
const CREDITS_TO_USD = 0.10;

// ============================================================================
// PRICING TYPES
// ============================================================================

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

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
 * All subscription configurations
 */
export const SUBSCRIPTION_CONFIGS: Readonly<Record<SubscriptionTier, SubscriptionConfig>> = {
  free: {
    tier: 'free',
    monthlyCredits: 30,
    priceUSD: 0,
    features: ['Up to 3 jobs/month', 'Tier 50 only', 'Basic support'],
    discountPercent: 0,
  },
  basic: {
    tier: 'basic',
    monthlyCredits: 100,
    priceUSD: 9.99,
    features: ['Up to 10 jobs/month', 'All tiers', 'Email support', 'Theme-Fit scoring'],
    discountPercent: 0,
  },
  pro: {
    tier: 'pro',
    monthlyCredits: 300,
    priceUSD: 29.99,
    features: [
      'Unlimited jobs',
      'All tiers',
      'Priority support',
      'All features included',
      'API access',
    ],
    discountPercent: 10,
  },
  enterprise: {
    tier: 'enterprise',
    monthlyCredits: 1000,
    priceUSD: 99.99,
    features: [
      'Unlimited jobs',
      'All tiers',
      'Dedicated support',
      'All features included',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    discountPercent: 20,
  },
} as const;

/**
 * Detailed cost breakdown
 */
export interface DetailedCostBreakdown extends ThematizationCostEstimate {
  /** Cost in USD */
  readonly costUSD: number;
  /** Applied discounts */
  readonly discounts: {
    readonly subscriptionDiscount?: number;
    readonly bulkDiscount?: number;
    readonly promoDiscount?: number;
  };
  /** Final cost after discounts */
  readonly finalCost: number;
  /** Remaining credits after job */
  readonly remainingCredits?: number;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  readonly userId: string;
  readonly subscription: SubscriptionTier;
  readonly creditsUsed: number;
  readonly creditsRemaining: number;
  readonly jobsThisMonth: number;
  readonly lastJobDate?: Date;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationPricingService {
  private readonly logger = new Logger(ThematizationPricingService.name);

  // In-memory usage tracking (fallback when billing service not available)
  private readonly usageCache = new Map<string, UsageStats>();

  // Database-backed billing service (optional - for production persistence)
  private readonly billingService?: ThematizationBillingService;

  constructor(
    @Optional() billingService?: ThematizationBillingService,
  ) {
    this.billingService = billingService;
    const mode = billingService ? 'database-backed' : 'in-memory';
    this.logger.log(`✅ [ThematizationPricing] Service initialized (${mode})`);
  }

  /**
   * Check if using database-backed persistence
   */
  isDatabaseBacked(): boolean {
    return this.billingService !== undefined;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Calculate cost estimate for a thematization job
   *
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @returns Cost estimate
   */
  estimateCost(
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
  ): ThematizationCostEstimate {
    if (!isValidTier(tier)) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const tierConfig = getTierConfig(tier);
    const mergedFlags = { ...DEFAULT_PIPELINE_FLAGS, ...flags };

    let totalFeatureCost = 0;
    let hierarchicalCost: number | undefined;
    let controversyCost: number | undefined;
    let claimCost: number | undefined;

    if (mergedFlags.enableHierarchicalExtraction) {
      hierarchicalCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    if (mergedFlags.enableControversyAnalysis) {
      controversyCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    if (mergedFlags.enableClaimExtraction) {
      claimCost = FEATURE_COST_CREDITS;
      totalFeatureCost += FEATURE_COST_CREDITS;
    }

    const featureCosts: ThematizationCostEstimate['featureCosts'] = {
      hierarchicalExtraction: hierarchicalCost,
      controversyAnalysis: controversyCost,
      claimExtraction: claimCost,
    };

    const baseCost = BASE_COST_CREDITS * tierConfig.priceMultiplier;
    const totalCost = baseCost + totalFeatureCost;

    return {
      tier,
      baseCost,
      tierMultiplier: tierConfig.priceMultiplier,
      featureCosts,
      totalCost,
      estimatedTimeSeconds: tierConfig.estimatedTimeSeconds,
    };
  }

  /**
   * Calculate detailed cost breakdown with discounts
   *
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @param userId - User ID for discount lookup
   * @param promoCode - Optional promo code
   * @returns Detailed cost breakdown
   */
  calculateDetailedCost(
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
    userId?: string,
    promoCode?: string,
  ): DetailedCostBreakdown {
    const estimate = this.estimateCost(tier, flags);

    let subscriptionDiscount = 0;
    let bulkDiscount = 0;
    let promoDiscount = 0;

    // Apply subscription discount
    if (userId) {
      const usage = this.getUserUsage(userId);
      const subConfig = SUBSCRIPTION_CONFIGS[usage.subscription];
      subscriptionDiscount = (estimate.totalCost * subConfig.discountPercent) / 100;
    }

    // Apply bulk discount (> 10 jobs this month)
    if (userId) {
      const usage = this.getUserUsage(userId);
      if (usage.jobsThisMonth >= 10) {
        bulkDiscount = (estimate.totalCost * BULK_DISCOUNT_PERCENT) / 100;
      }
    }

    // Apply promo code discount
    if (promoCode) {
      promoDiscount = this.calculatePromoDiscount(promoCode, estimate.totalCost);
    }

    const totalDiscount = subscriptionDiscount + bulkDiscount + promoDiscount;
    const finalCost = Math.max(0, estimate.totalCost - totalDiscount);
    const costUSD = finalCost * CREDITS_TO_USD;

    // Calculate remaining credits
    let remainingCredits: number | undefined;
    if (userId) {
      const usage = this.getUserUsage(userId);
      remainingCredits = Math.max(0, usage.creditsRemaining - finalCost);
    }

    return {
      ...estimate,
      costUSD,
      discounts: {
        subscriptionDiscount: subscriptionDiscount > 0 ? subscriptionDiscount : undefined,
        bulkDiscount: bulkDiscount > 0 ? bulkDiscount : undefined,
        promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
      },
      finalCost,
      remainingCredits,
    };
  }

  /**
   * Check if user can afford a job (sync - in-memory)
   *
   * @param userId - User ID
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @returns Whether user has enough credits
   */
  canAfford(
    userId: string,
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
  ): { canAfford: boolean; reason?: string; requiredCredits: number; availableCredits: number } {
    const estimate = this.estimateCost(tier, flags);
    const usage = this.getUserUsage(userId);

    if (usage.creditsRemaining >= estimate.totalCost) {
      return {
        canAfford: true,
        requiredCredits: estimate.totalCost,
        availableCredits: usage.creditsRemaining,
      };
    }

    // Check free tier limits
    if (usage.subscription === 'free') {
      if (usage.jobsThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
        return {
          canAfford: false,
          reason: `Free tier limit reached (${FREE_TIER_MONTHLY_LIMIT} jobs/month). Upgrade to continue.`,
          requiredCredits: estimate.totalCost,
          availableCredits: usage.creditsRemaining,
        };
      }

      if (tier > 50) {
        return {
          canAfford: false,
          reason: 'Free tier only supports Tier 50. Upgrade to access higher tiers.',
          requiredCredits: estimate.totalCost,
          availableCredits: usage.creditsRemaining,
        };
      }
    }

    return {
      canAfford: false,
      reason: `Insufficient credits: ${usage.creditsRemaining} available, ${estimate.totalCost} required.`,
      requiredCredits: estimate.totalCost,
      availableCredits: usage.creditsRemaining,
    };
  }

  /**
   * Check if user can afford a job (async - database-backed)
   *
   * @param userId - User ID
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @returns Whether user has enough credits
   */
  async canAffordAsync(
    userId: string,
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
  ): Promise<{ canAfford: boolean; reason?: string; requiredCredits: number; availableCredits: number }> {
    const estimate = this.estimateCost(tier, flags);

    if (this.billingService) {
      const result = await this.billingService.canAfford(userId, estimate.totalCost);
      return {
        canAfford: result.canAfford,
        reason: result.reason,
        requiredCredits: estimate.totalCost,
        availableCredits: result.availableCredits,
      };
    }

    // Fallback to sync method
    return this.canAfford(userId, tier, flags);
  }

  /**
   * Deduct credits for a completed job (sync - in-memory)
   *
   * @param userId - User ID
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @returns Updated usage stats
   */
  deductCredits(
    userId: string,
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
  ): UsageStats {
    const cost = this.calculateDetailedCost(tier, flags, userId);
    const currentUsage = this.getUserUsage(userId);

    const updatedUsage: UsageStats = {
      ...currentUsage,
      creditsUsed: currentUsage.creditsUsed + cost.finalCost,
      creditsRemaining: Math.max(0, currentUsage.creditsRemaining - cost.finalCost),
      jobsThisMonth: currentUsage.jobsThisMonth + 1,
      lastJobDate: new Date(),
    };

    this.usageCache.set(userId, updatedUsage);
    this.logger.log(
      `💰 [Pricing] Deducted ${cost.finalCost} credits from user ${userId}. ` +
      `Remaining: ${updatedUsage.creditsRemaining}`,
    );

    return updatedUsage;
  }

  /**
   * Deduct credits for a completed job (async - database-backed)
   *
   * @param userId - User ID
   * @param tier - Paper count tier
   * @param flags - Pipeline feature flags
   * @param requestId - Optional request ID for audit
   * @param topic - Optional topic for audit
   * @param promoCode - Optional promo code
   * @returns Debit result with credits deducted and remaining
   */
  async deductCreditsAsync(
    userId: string,
    tier: ThematizationTierCount,
    flags?: Partial<ThematizationPipelineFlags>,
    requestId?: string,
    topic?: string,
    promoCode?: string,
  ): Promise<{ creditsDeducted: number; creditsRemaining: number }> {
    const cost = this.calculateDetailedCost(tier, flags, userId, promoCode);

    if (this.billingService) {
      // Validate promo code if provided
      let promoCodeId: string | undefined;
      let promoDiscount = 0;

      if (promoCode) {
        const validation = await this.billingService.validatePromoCode(promoCode, userId, tier);
        if (validation.isValid && validation.promoCodeId) {
          promoCodeId = validation.promoCodeId;
          promoDiscount = await this.billingService.calculatePromoDiscount(promoCodeId, cost.totalCost);
        }
      }

      const result = await this.billingService.debitCredits(
        userId,
        cost.finalCost,
        requestId,
        tier,
        topic,
        promoCodeId,
        promoDiscount,
      );

      return {
        creditsDeducted: result.creditsDeducted,
        creditsRemaining: result.creditsRemaining,
      };
    }

    // Fallback to sync method
    const usage = this.deductCredits(userId, tier, flags);
    return {
      creditsDeducted: cost.finalCost,
      creditsRemaining: usage.creditsRemaining,
    };
  }

  /**
   * Get user usage statistics
   *
   * @param userId - User ID
   * @returns Usage statistics
   */
  getUserUsage(userId: string): UsageStats {
    const cached = this.usageCache.get(userId);
    if (cached) {
      return cached;
    }

    // Default to free tier for new users
    const defaultUsage: UsageStats = {
      userId,
      subscription: 'free',
      creditsUsed: 0,
      creditsRemaining: SUBSCRIPTION_CONFIGS.free.monthlyCredits,
      jobsThisMonth: 0,
    };

    this.usageCache.set(userId, defaultUsage);
    return defaultUsage;
  }

  /**
   * Upgrade user subscription
   *
   * @param userId - User ID
   * @param newTier - New subscription tier
   * @returns Updated usage stats
   */
  upgradeSubscription(userId: string, newTier: SubscriptionTier): UsageStats {
    const currentUsage = this.getUserUsage(userId);
    const newConfig = SUBSCRIPTION_CONFIGS[newTier];

    const updatedUsage: UsageStats = {
      ...currentUsage,
      subscription: newTier,
      creditsRemaining: currentUsage.creditsRemaining + newConfig.monthlyCredits,
    };

    this.usageCache.set(userId, updatedUsage);
    this.logger.log(
      `🚀 [Pricing] User ${userId} upgraded to ${newTier}. ` +
      `Credits: ${updatedUsage.creditsRemaining}`,
    );

    return updatedUsage;
  }

  /**
   * Get all subscription options
   */
  getSubscriptionOptions(): readonly SubscriptionConfig[] {
    return Object.values(SUBSCRIPTION_CONFIGS);
  }

  /**
   * Get tier pricing comparison
   */
  getTierComparison(): ReadonlyArray<{
    tier: ThematizationTierCount;
    baseCost: number;
    fullCost: number;
    estimatedTime: string;
    description: string;
  }> {
    const tiers: ThematizationTierCount[] = [50, 100, 150, 200, 250, 300];

    return tiers.map(tier => {
      const config = getTierConfig(tier);
      const estimate = this.estimateCost(tier, {
        enableHierarchicalExtraction: true,
        enableControversyAnalysis: true,
        enableClaimExtraction: true,
      });

      return {
        tier,
        baseCost: estimate.baseCost,
        fullCost: estimate.totalCost,
        estimatedTime: this.formatTime(config.estimatedTimeSeconds),
        description: config.description,
      };
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate promo code discount
   */
  private calculatePromoDiscount(promoCode: string, baseCost: number): number {
    // Simple promo code logic (in production, use database)
    const promoCodes: Record<string, number> = {
      WELCOME20: 20,
      RESEARCH10: 10,
      ACADEMIC25: 25,
    };

    const discountPercent = promoCodes[promoCode.toUpperCase()];
    if (!discountPercent) {
      return 0;
    }

    return (baseCost * discountPercent) / 100;
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }
}
