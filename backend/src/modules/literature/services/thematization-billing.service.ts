/**
 * Phase 10.113 Week 7: Thematization Billing Service
 *
 * Netflix-grade database-backed billing infrastructure for thematization.
 * Replaces in-memory cache with Prisma persistence.
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 *
 * This service handles ALL database operations for thematization billing:
 * - User usage tracking (credits, jobs, subscription)
 * - Transaction audit logging (debits, credits, refunds)
 * - Promo code validation and redemption
 * - Billing cycle management
 *
 * Database Models (Prisma):
 * - ThematizationUsage: User credit/subscription state
 * - ThematizationTransaction: Audit log for all credit operations
 * - ThematizationPromoCode: Discount codes with validity constraints
 *
 * @module ThematizationBillingService
 * @since Phase 10.113 Week 7
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Prisma, ThematizationSubscriptionTier } from '@prisma/client';

// ============================================================================
// NAMED CONSTANTS (No Magic Numbers)
// ============================================================================

/** Default monthly credits for free tier */
const FREE_TIER_MONTHLY_CREDITS = 30;

/** Default monthly credits for basic tier */
const BASIC_TIER_MONTHLY_CREDITS = 100;

/** Default monthly credits for pro tier */
const PRO_TIER_MONTHLY_CREDITS = 300;

/** Default monthly credits for enterprise tier */
const ENTERPRISE_TIER_MONTHLY_CREDITS = 1000;

/** Billing cycle duration in days */
const BILLING_CYCLE_DAYS = 30;

/** Maximum transaction description length */
const MAX_DESCRIPTION_LENGTH = 500;

/** Transaction types */
const TRANSACTION_TYPE = {
  DEBIT: 'debit',
  CREDIT: 'credit',
  REFUND: 'refund',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
} as const;

type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

// ============================================================================
// TYPE DEFINITIONS (Strict Typing)
// ============================================================================

/**
 * Subscription tier configuration
 */
interface SubscriptionTierConfig {
  readonly tier: ThematizationSubscriptionTier;
  readonly monthlyCredits: number;
  readonly discountPercent: number;
}

/**
 * All subscription tier configurations
 */
const SUBSCRIPTION_TIER_CONFIGS: Readonly<Record<ThematizationSubscriptionTier, SubscriptionTierConfig>> = {
  FREE: {
    tier: ThematizationSubscriptionTier.FREE,
    monthlyCredits: FREE_TIER_MONTHLY_CREDITS,
    discountPercent: 0,
  },
  BASIC: {
    tier: ThematizationSubscriptionTier.BASIC,
    monthlyCredits: BASIC_TIER_MONTHLY_CREDITS,
    discountPercent: 0,
  },
  PRO: {
    tier: ThematizationSubscriptionTier.PRO,
    monthlyCredits: PRO_TIER_MONTHLY_CREDITS,
    discountPercent: 10,
  },
  ENTERPRISE: {
    tier: ThematizationSubscriptionTier.ENTERPRISE,
    monthlyCredits: ENTERPRISE_TIER_MONTHLY_CREDITS,
    discountPercent: 20,
  },
};

/**
 * Usage state returned from database
 */
export interface UsageState {
  readonly id: string;
  readonly userId: string;
  readonly subscription: ThematizationSubscriptionTier;
  readonly monthlyCredits: number;
  readonly creditsUsed: number;
  readonly creditsRemaining: number;
  readonly jobsThisMonth: number;
  readonly totalJobsAllTime: number;
  readonly lastJobAt: Date | null;
  readonly billingCycleStart: Date;
  readonly billingCycleEnd: Date | null;
}

/**
 * Transaction record
 */
export interface TransactionRecord {
  readonly id: string;
  readonly type: string;
  readonly amount: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly requestId: string | null;
  readonly tier: number | null;
  readonly topic: string | null;
  readonly discountApplied: number;
  readonly description: string | null;
  readonly createdAt: Date;
}

/**
 * Promo code validation result
 */
export interface PromoCodeValidation {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly discountType?: string;
  readonly discountValue?: number;
  readonly promoCodeId?: string;
}

/**
 * Debit result after credit deduction
 */
export interface DebitResult {
  readonly success: boolean;
  readonly transactionId: string;
  readonly creditsDeducted: number;
  readonly creditsRemaining: number;
  readonly discountApplied: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationBillingService {
  private readonly logger = new Logger(ThematizationBillingService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('✅ [ThematizationBilling] Database-backed service initialized');
  }

  // ==========================================================================
  // USER USAGE OPERATIONS
  // ==========================================================================

  /**
   * Get or create user usage record
   *
   * @param userId - User ID
   * @returns Usage state
   */
  async getOrCreateUsage(userId: string): Promise<UsageState> {
    // Try to find existing usage
    const existing = await this.prisma.thematizationUsage.findUnique({
      where: { userId },
    });

    if (existing) {
      // Check if billing cycle needs reset
      const cycleReset = await this.checkAndResetBillingCycle(existing.id);
      if (cycleReset) {
        // Re-fetch after reset
        const updated = await this.prisma.thematizationUsage.findUnique({
          where: { userId },
        });
        if (updated) {
          return this.mapUsageToState(updated);
        }
      }
      return this.mapUsageToState(existing);
    }

    // Create new usage record for first-time user
    const billingCycleEnd = new Date();
    billingCycleEnd.setDate(billingCycleEnd.getDate() + BILLING_CYCLE_DAYS);

    const newUsage = await this.prisma.thematizationUsage.create({
      data: {
        userId,
        subscription: ThematizationSubscriptionTier.FREE,
        monthlyCredits: FREE_TIER_MONTHLY_CREDITS,
        creditsRemaining: FREE_TIER_MONTHLY_CREDITS,
        billingCycleEnd,
      },
    });

    this.logger.log(`🆕 [Billing] Created usage record for user ${userId}`);
    return this.mapUsageToState(newUsage);
  }

  /**
   * Check if user can afford a job
   *
   * @param userId - User ID
   * @param requiredCredits - Credits needed for job
   * @returns Affordability check result
   */
  async canAfford(
    userId: string,
    requiredCredits: number,
  ): Promise<{ canAfford: boolean; reason?: string; availableCredits: number }> {
    const usage = await this.getOrCreateUsage(userId);

    if (usage.creditsRemaining >= requiredCredits) {
      return {
        canAfford: true,
        availableCredits: usage.creditsRemaining,
      };
    }

    return {
      canAfford: false,
      reason: `Insufficient credits: ${usage.creditsRemaining} available, ${requiredCredits} required`,
      availableCredits: usage.creditsRemaining,
    };
  }

  /**
   * Debit credits for a completed job
   *
   * @param userId - User ID
   * @param amount - Credits to deduct
   * @param requestId - Thematization job request ID
   * @param tier - Tier used
   * @param topic - Topic analyzed
   * @param promoCodeId - Optional promo code ID
   * @param discountApplied - Discount amount
   * @returns Debit result
   */
  async debitCredits(
    userId: string,
    amount: number,
    requestId?: string,
    tier?: number,
    topic?: string,
    promoCodeId?: string,
    discountApplied: number = 0,
  ): Promise<DebitResult> {
    return this.prisma.$transaction(async (tx) => {
      // Get current usage with lock
      const usage = await tx.thematizationUsage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const balanceBefore = usage.creditsRemaining;
      const balanceAfter = Math.max(0, balanceBefore - amount);

      // Update usage
      await tx.thematizationUsage.update({
        where: { id: usage.id },
        data: {
          creditsUsed: usage.creditsUsed + amount,
          creditsRemaining: balanceAfter,
          jobsThisMonth: usage.jobsThisMonth + 1,
          totalJobsAllTime: usage.totalJobsAllTime + 1,
          lastJobAt: new Date(),
        },
      });

      // Create transaction record
      const transaction = await tx.thematizationTransaction.create({
        data: {
          usageId: usage.id,
          type: TRANSACTION_TYPE.DEBIT,
          amount: -amount, // Negative for debit
          balanceBefore,
          balanceAfter,
          requestId: requestId ?? null,
          tier: tier ?? null,
          topic: topic ? topic.substring(0, MAX_DESCRIPTION_LENGTH) : null,
          promoCodeId: promoCodeId ?? null,
          discountApplied,
          description: `Thematization job${tier ? ` (Tier ${tier})` : ''}`,
        },
      });

      // Increment promo code usage if used
      if (promoCodeId) {
        await tx.thematizationPromoCode.update({
          where: { id: promoCodeId },
          data: { currentUses: { increment: 1 } },
        });
      }

      this.logger.log(
        `💰 [Billing] Debited ${amount} credits from user ${userId}. ` +
        `Balance: ${balanceBefore} → ${balanceAfter}`,
      );

      return {
        success: true,
        transactionId: transaction.id,
        creditsDeducted: amount,
        creditsRemaining: balanceAfter,
        discountApplied,
      };
    });
  }

  /**
   * Credit (add) credits to user account
   *
   * @param userId - User ID
   * @param amount - Credits to add
   * @param reason - Reason for credit
   * @returns Updated usage state
   */
  async creditCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<UsageState> {
    return this.prisma.$transaction(async (tx) => {
      const usage = await tx.thematizationUsage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const balanceBefore = usage.creditsRemaining;
      const balanceAfter = balanceBefore + amount;

      // Update usage
      const updated = await tx.thematizationUsage.update({
        where: { id: usage.id },
        data: {
          creditsRemaining: balanceAfter,
        },
      });

      // Create transaction record
      await tx.thematizationTransaction.create({
        data: {
          usageId: usage.id,
          type: TRANSACTION_TYPE.CREDIT,
          amount, // Positive for credit
          balanceBefore,
          balanceAfter,
          description: reason.substring(0, MAX_DESCRIPTION_LENGTH),
        },
      });

      this.logger.log(
        `💳 [Billing] Credited ${amount} credits to user ${userId}. ` +
        `Balance: ${balanceBefore} → ${balanceAfter}`,
      );

      return this.mapUsageToState(updated);
    });
  }

  /**
   * Refund credits for a failed job
   *
   * @param userId - User ID
   * @param amount - Credits to refund
   * @param requestId - Original job request ID
   * @param reason - Refund reason
   * @returns Updated usage state
   */
  async refundCredits(
    userId: string,
    amount: number,
    requestId: string,
    reason: string,
  ): Promise<UsageState> {
    return this.prisma.$transaction(async (tx) => {
      const usage = await tx.thematizationUsage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const balanceBefore = usage.creditsRemaining;
      const balanceAfter = balanceBefore + amount;

      // Update usage (refund doesn't change job count)
      const updated = await tx.thematizationUsage.update({
        where: { id: usage.id },
        data: {
          creditsUsed: Math.max(0, usage.creditsUsed - amount),
          creditsRemaining: balanceAfter,
        },
      });

      // Create transaction record
      await tx.thematizationTransaction.create({
        data: {
          usageId: usage.id,
          type: TRANSACTION_TYPE.REFUND,
          amount, // Positive for refund
          balanceBefore,
          balanceAfter,
          requestId,
          description: `Refund: ${reason}`.substring(0, MAX_DESCRIPTION_LENGTH),
        },
      });

      this.logger.log(
        `🔄 [Billing] Refunded ${amount} credits to user ${userId}. ` +
        `Balance: ${balanceBefore} → ${balanceAfter}`,
      );

      return this.mapUsageToState(updated);
    });
  }

  // ==========================================================================
  // SUBSCRIPTION OPERATIONS
  // ==========================================================================

  /**
   * Upgrade user subscription
   *
   * @param userId - User ID
   * @param newTier - New subscription tier
   * @returns Updated usage state
   */
  async upgradeSubscription(
    userId: string,
    newTier: ThematizationSubscriptionTier,
  ): Promise<UsageState> {
    const tierConfig = SUBSCRIPTION_TIER_CONFIGS[newTier];

    return this.prisma.$transaction(async (tx) => {
      const usage = await tx.thematizationUsage.findUnique({
        where: { userId },
      });

      if (!usage) {
        throw new NotFoundException(`Usage record not found for user ${userId}`);
      }

      const balanceBefore = usage.creditsRemaining;
      const creditsToAdd = tierConfig.monthlyCredits;
      const balanceAfter = balanceBefore + creditsToAdd;

      // Update subscription
      const updated = await tx.thematizationUsage.update({
        where: { id: usage.id },
        data: {
          subscription: newTier,
          monthlyCredits: tierConfig.monthlyCredits,
          creditsRemaining: balanceAfter,
          subscriptionStartAt: new Date(),
        },
      });

      // Create transaction record
      await tx.thematizationTransaction.create({
        data: {
          usageId: usage.id,
          type: TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
          amount: creditsToAdd,
          balanceBefore,
          balanceAfter,
          description: `Subscription upgrade to ${newTier}`,
        },
      });

      this.logger.log(
        `🚀 [Billing] User ${userId} upgraded to ${newTier}. ` +
        `Credits: ${balanceBefore} → ${balanceAfter}`,
      );

      return this.mapUsageToState(updated);
    });
  }

  /**
   * Get subscription discount percentage
   *
   * @param userId - User ID
   * @returns Discount percentage
   */
  async getSubscriptionDiscount(userId: string): Promise<number> {
    const usage = await this.getOrCreateUsage(userId);
    return SUBSCRIPTION_TIER_CONFIGS[usage.subscription].discountPercent;
  }

  // ==========================================================================
  // PROMO CODE OPERATIONS
  // ==========================================================================

  /**
   * Validate a promo code
   *
   * @param code - Promo code to validate
   * @param userId - User ID (for usage limit check)
   * @param tier - Tier being used (for tier restrictions)
   * @returns Validation result
   */
  async validatePromoCode(
    code: string,
    userId: string,
    tier?: number,
  ): Promise<PromoCodeValidation> {
    const promoCode = await this.prisma.thematizationPromoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return { isValid: false, reason: 'Promo code not found' };
    }

    // Check if active
    if (!promoCode.isActive) {
      return { isValid: false, reason: 'Promo code is no longer active' };
    }

    // Check time validity
    const now = new Date();
    if (now < promoCode.validFrom) {
      return { isValid: false, reason: 'Promo code is not yet valid' };
    }
    if (promoCode.validUntil && now > promoCode.validUntil) {
      return { isValid: false, reason: 'Promo code has expired' };
    }

    // Check total uses
    if (promoCode.maxUses !== null && promoCode.currentUses >= promoCode.maxUses) {
      return { isValid: false, reason: 'Promo code has reached maximum uses' };
    }

    // Check per-user limit
    const userUsageCount = await this.prisma.thematizationTransaction.count({
      where: {
        promoCodeId: promoCode.id,
        usage: { userId },
      },
    });

    if (userUsageCount >= promoCode.maxUsesPerUser) {
      return { isValid: false, reason: 'You have already used this promo code' };
    }

    // Check tier restriction
    if (promoCode.minTier !== null && tier !== undefined && tier < promoCode.minTier) {
      return {
        isValid: false,
        reason: `Promo code requires minimum Tier ${promoCode.minTier}`,
      };
    }

    // Check subscription restriction
    if (promoCode.targetSubscriptions !== null) {
      const usage = await this.getOrCreateUsage(userId);
      const allowedTiers = promoCode.targetSubscriptions as string[];
      if (!allowedTiers.includes(usage.subscription)) {
        return {
          isValid: false,
          reason: 'Promo code is not valid for your subscription tier',
        };
      }
    }

    return {
      isValid: true,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      promoCodeId: promoCode.id,
    };
  }

  /**
   * Calculate discount from promo code
   *
   * @param promoCodeId - Promo code ID
   * @param baseCost - Base cost to apply discount to
   * @returns Discount amount
   */
  async calculatePromoDiscount(
    promoCodeId: string,
    baseCost: number,
  ): Promise<number> {
    const promoCode = await this.prisma.thematizationPromoCode.findUnique({
      where: { id: promoCodeId },
    });

    if (!promoCode) {
      return 0;
    }

    if (promoCode.discountType === 'percentage') {
      return (baseCost * promoCode.discountValue) / 100;
    }

    if (promoCode.discountType === 'fixed_credits') {
      return Math.min(promoCode.discountValue, baseCost);
    }

    return 0;
  }

  // ==========================================================================
  // TRANSACTION HISTORY
  // ==========================================================================

  /**
   * Get transaction history for user
   *
   * @param userId - User ID
   * @param limit - Max records to return
   * @param offset - Offset for pagination
   * @returns Transaction records
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ transactions: TransactionRecord[]; total: number }> {
    const usage = await this.prisma.thematizationUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      return { transactions: [], total: 0 };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.thematizationTransaction.findMany({
        where: { usageId: usage.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.thematizationTransaction.count({
        where: { usageId: usage.id },
      }),
    ]);

    return {
      transactions: transactions.map(this.mapTransactionToRecord),
      total,
    };
  }

  // ==========================================================================
  // BILLING CYCLE MANAGEMENT
  // ==========================================================================

  /**
   * Check and reset billing cycle if expired
   *
   * @param usageId - Usage record ID
   * @returns Whether cycle was reset
   */
  private async checkAndResetBillingCycle(usageId: string): Promise<boolean> {
    const usage = await this.prisma.thematizationUsage.findUnique({
      where: { id: usageId },
    });

    if (!usage || !usage.billingCycleEnd) {
      return false;
    }

    const now = new Date();
    if (now < usage.billingCycleEnd) {
      return false; // Cycle not expired
    }

    // Reset billing cycle
    const newCycleEnd = new Date();
    newCycleEnd.setDate(newCycleEnd.getDate() + BILLING_CYCLE_DAYS);

    const tierConfig = SUBSCRIPTION_TIER_CONFIGS[usage.subscription];

    await this.prisma.$transaction(async (tx) => {
      // Reset usage counters
      await tx.thematizationUsage.update({
        where: { id: usageId },
        data: {
          creditsUsed: 0,
          creditsRemaining: tierConfig.monthlyCredits,
          jobsThisMonth: 0,
          billingCycleStart: now,
          billingCycleEnd: newCycleEnd,
        },
      });

      // Create renewal transaction
      await tx.thematizationTransaction.create({
        data: {
          usageId,
          type: TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
          amount: tierConfig.monthlyCredits,
          balanceBefore: usage.creditsRemaining,
          balanceAfter: tierConfig.monthlyCredits,
          description: `Monthly billing cycle reset (${usage.subscription})`,
        },
      });
    });

    this.logger.log(
      `🔄 [Billing] Reset billing cycle for usage ${usageId}. ` +
      `New credits: ${tierConfig.monthlyCredits}`,
    );

    return true;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Map Prisma usage model to UsageState interface
   */
  private mapUsageToState(usage: {
    id: string;
    userId: string;
    subscription: ThematizationSubscriptionTier;
    monthlyCredits: number;
    creditsUsed: number;
    creditsRemaining: number;
    jobsThisMonth: number;
    totalJobsAllTime: number;
    lastJobAt: Date | null;
    billingCycleStart: Date;
    billingCycleEnd: Date | null;
  }): UsageState {
    return {
      id: usage.id,
      userId: usage.userId,
      subscription: usage.subscription,
      monthlyCredits: usage.monthlyCredits,
      creditsUsed: usage.creditsUsed,
      creditsRemaining: usage.creditsRemaining,
      jobsThisMonth: usage.jobsThisMonth,
      totalJobsAllTime: usage.totalJobsAllTime,
      lastJobAt: usage.lastJobAt,
      billingCycleStart: usage.billingCycleStart,
      billingCycleEnd: usage.billingCycleEnd,
    };
  }

  /**
   * Map Prisma transaction model to TransactionRecord interface
   */
  private mapTransactionToRecord(transaction: {
    id: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    requestId: string | null;
    tier: number | null;
    topic: string | null;
    discountApplied: number;
    description: string | null;
    createdAt: Date;
  }): TransactionRecord {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      requestId: transaction.requestId,
      tier: transaction.tier,
      topic: transaction.topic,
      discountApplied: transaction.discountApplied,
      description: transaction.description,
      createdAt: transaction.createdAt,
    };
  }
}
