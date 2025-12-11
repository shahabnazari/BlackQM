/**
 * Phase 10.113 Week 8: Thematization Admin Service
 *
 * Netflix-grade admin analytics service for thematization usage monitoring,
 * billing administration, and operational insights.
 *
 * ============================================================================
 * RESPONSIBILITIES
 * ============================================================================
 *
 * 1. Usage Analytics - Aggregated usage statistics by time period
 * 2. Billing Administration - Revenue tracking, credit management
 * 3. User Insights - Top users, usage patterns
 * 4. Operational Dashboard - System health, error rates
 * 5. Promo Code Management - Create, update, analytics
 *
 * ============================================================================
 * ADMIN ENDPOINTS SUPPORTED
 * ============================================================================
 *
 * GET  /admin/thematization/analytics        - Usage analytics summary
 * GET  /admin/thematization/users/top        - Top users by usage
 * GET  /admin/thematization/revenue          - Revenue breakdown
 * GET  /admin/thematization/health           - System health status
 * POST /admin/thematization/promo            - Create promo code
 * GET  /admin/thematization/promo/:code      - Promo code analytics
 *
 * @module ThematizationAdminService
 * @since Phase 10.113 Week 8
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ThematizationMetricsService } from './thematization-metrics.service';

import { ThematizationTierCount } from '../types/unified-thematization.types';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing)
// ============================================================================

/**
 * Time period for analytics queries
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * User usage summary
 */
export interface UserUsageSummary {
  readonly userId: string;
  readonly subscription: string;
  readonly totalJobs: number;
  readonly totalCreditsUsed: number;
  readonly totalPapersProcessed: number;
  readonly avgJobDurationMs: number;
  readonly lastJobAt: Date | null;
  readonly joinedAt: Date;
}

/**
 * Tier breakdown analytics
 */
export interface TierAnalytics {
  readonly tier: ThematizationTierCount;
  readonly jobCount: number;
  readonly totalCredits: number;
  readonly avgDurationMs: number;
  readonly successRate: number;
}

/**
 * Revenue analytics
 */
export interface RevenueAnalytics {
  readonly period: AnalyticsPeriod;
  readonly totalCreditsConsumed: number;
  readonly estimatedRevenueUSD: number;
  readonly bySubscription: ReadonlyArray<{
    readonly subscription: string;
    readonly credits: number;
    readonly revenueUSD: number;
    readonly userCount: number;
  }>;
  readonly byTier: ReadonlyArray<{
    readonly tier: ThematizationTierCount;
    readonly credits: number;
    readonly revenueUSD: number;
    readonly jobCount: number;
  }>;
  readonly promoDiscounts: number;
}

/**
 * Usage analytics summary
 */
export interface UsageAnalyticsSummary {
  readonly period: AnalyticsPeriod;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly totalJobs: number;
  readonly completedJobs: number;
  readonly failedJobs: number;
  readonly successRate: number;
  readonly totalPapersProcessed: number;
  readonly totalThemesExtracted: number;
  readonly totalClaimsExtracted: number;
  readonly avgJobDurationMs: number;
  readonly p95DurationMs: number;
  readonly uniqueUsers: number;
  readonly newUsers: number;
  readonly tierBreakdown: readonly TierAnalytics[];
  readonly errorBreakdown: ReadonlyArray<{
    readonly errorType: string;
    readonly count: number;
    readonly percentage: number;
  }>;
}

/**
 * Promo code creation request
 */
export interface CreatePromoCodeRequest {
  readonly code: string;
  readonly discountType: 'percentage' | 'fixed_credits';
  readonly discountValue: number;
  readonly maxUses?: number;
  readonly maxUsesPerUser?: number;
  readonly validFrom?: Date;
  readonly validUntil?: Date;
  readonly minTier?: ThematizationTierCount;
  readonly targetSubscriptions?: readonly string[];
  readonly description?: string;
}

/**
 * Promo code analytics
 */
export interface PromoCodeAnalytics {
  readonly code: string;
  readonly discountType: string;
  readonly discountValue: number;
  readonly totalUses: number;
  readonly totalDiscountApplied: number;
  readonly uniqueUsers: number;
  readonly isActive: boolean;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
  readonly usageByTier: ReadonlyArray<{
    readonly tier: ThematizationTierCount;
    readonly uses: number;
    readonly discountApplied: number;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Credit to USD conversion rate */
const CREDITS_TO_USD = 0.10;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ThematizationAdminService {
  private readonly logger = new Logger(ThematizationAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: ThematizationMetricsService,
  ) {
    this.logger.log('✅ [ThematizationAdmin] Service initialized');
  }

  // ==========================================================================
  // USAGE ANALYTICS
  // ==========================================================================

  /**
   * Get usage analytics summary for a period
   */
  async getUsageAnalytics(period: AnalyticsPeriod): Promise<UsageAnalyticsSummary> {
    const { start, end } = this.getPeriodDates(period);

    // Get transaction data for period
    const transactions = await this.prisma.thematizationTransaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        type: 'debit',
      },
      include: {
        usage: true,
      },
    });

    // Calculate metrics
    const completedJobs = transactions.filter(t => t.amount < 0).length;
    const failedJobs = 0; // Would need to track in transactions

    // Aggregate by tier
    const tierMap = new Map<ThematizationTierCount, {
      jobs: number;
      credits: number;
      durations: number[];
    }>();

    for (const tx of transactions) {
      const tier = (tx.tier ?? 50) as ThematizationTierCount;
      const existing = tierMap.get(tier) ?? { jobs: 0, credits: 0, durations: [] };
      existing.jobs++;
      existing.credits += Math.abs(tx.amount);
      tierMap.set(tier, existing);
    }

    const tierBreakdown: TierAnalytics[] = [];
    for (const [tier, data] of tierMap) {
      tierBreakdown.push({
        tier,
        jobCount: data.jobs,
        totalCredits: data.credits,
        avgDurationMs: 0, // Would need duration tracking
        successRate: 1.0,
      });
    }

    // Get unique users
    const userIds = new Set(transactions.map(t => t.usage.userId));

    // Get new users in period
    const newUsers = await this.prisma.thematizationUsage.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get real-time metrics from metrics service
    const realtimeMetrics = this.metricsService.getAggregateMetrics();

    // Calculate totals
    let totalPapers = 0;
    let totalThemes = 0;
    let totalClaims = 0;
    let totalCredits = 0;

    for (const tx of transactions) {
      totalCredits += Math.abs(tx.amount);
      // Estimate papers/themes/claims from metadata if available
      const metadata = tx.metadata as { papersProcessed?: number; themesExtracted?: number; claimsExtracted?: number } | null;
      if (metadata) {
        totalPapers += metadata.papersProcessed ?? 0;
        totalThemes += metadata.themesExtracted ?? 0;
        totalClaims += metadata.claimsExtracted ?? 0;
      }
    }

    return {
      period,
      periodStart: start,
      periodEnd: end,
      totalJobs: transactions.length,
      completedJobs,
      failedJobs,
      successRate: transactions.length > 0 ? completedJobs / transactions.length : 0,
      totalPapersProcessed: totalPapers || realtimeMetrics.totalPapersProcessed,
      totalThemesExtracted: totalThemes || realtimeMetrics.totalThemesExtracted,
      totalClaimsExtracted: totalClaims || realtimeMetrics.totalClaimsExtracted,
      avgJobDurationMs: realtimeMetrics.avgProcessingTimeMs,
      p95DurationMs: realtimeMetrics.p95DurationMs,
      uniqueUsers: userIds.size,
      newUsers,
      tierBreakdown,
      errorBreakdown: Object.entries(realtimeMetrics.errorsByType).map(([type, count]) => ({
        errorType: type,
        count,
        percentage: realtimeMetrics.totalJobs > 0 ? count / realtimeMetrics.totalJobs : 0,
      })),
    };
  }

  // ==========================================================================
  // USER ANALYTICS
  // ==========================================================================

  /**
   * Get top users by usage
   */
  async getTopUsers(
    limit: number = 10,
    sortBy: 'jobs' | 'credits' | 'papers' = 'credits',
  ): Promise<readonly UserUsageSummary[]> {
    const usages = await this.prisma.thematizationUsage.findMany({
      orderBy: sortBy === 'jobs'
        ? { totalJobsAllTime: 'desc' }
        : { creditsUsed: 'desc' },
      take: limit,
    });

    return usages.map(u => ({
      userId: u.userId,
      subscription: u.subscription,
      totalJobs: u.totalJobsAllTime,
      totalCreditsUsed: u.creditsUsed,
      totalPapersProcessed: 0, // Would need to track separately
      avgJobDurationMs: 0, // Would need to track separately
      lastJobAt: u.lastJobAt,
      joinedAt: u.createdAt,
    }));
  }

  /**
   * Get user usage details
   */
  async getUserUsageDetails(userId: string): Promise<{
    readonly usage: UserUsageSummary;
    readonly recentTransactions: ReadonlyArray<{
      readonly id: string;
      readonly type: string;
      readonly amount: number;
      readonly tier: number | null;
      readonly topic: string | null;
      readonly createdAt: Date;
    }>;
  } | null> {
    const usage = await this.prisma.thematizationUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      return null;
    }

    const transactions = await this.prisma.thematizationTransaction.findMany({
      where: { usage: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      usage: {
        userId: usage.userId,
        subscription: usage.subscription,
        totalJobs: usage.totalJobsAllTime,
        totalCreditsUsed: usage.creditsUsed,
        totalPapersProcessed: 0,
        avgJobDurationMs: 0,
        lastJobAt: usage.lastJobAt,
        joinedAt: usage.createdAt,
      },
      recentTransactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        tier: t.tier,
        topic: t.topic,
        createdAt: t.createdAt,
      })),
    };
  }

  // ==========================================================================
  // REVENUE ANALYTICS
  // ==========================================================================

  /**
   * Get revenue analytics for a period
   */
  async getRevenueAnalytics(period: AnalyticsPeriod): Promise<RevenueAnalytics> {
    const { start, end } = this.getPeriodDates(period);

    // Get all debit transactions
    const transactions = await this.prisma.thematizationTransaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        type: 'debit',
      },
      include: {
        usage: true,
      },
    });

    // Calculate totals
    let totalCredits = 0;
    let totalDiscounts = 0;

    // Group by subscription
    const subscriptionMap = new Map<string, { credits: number; users: Set<string> }>();

    // Group by tier
    const tierMap = new Map<number, { credits: number; jobs: number }>();

    for (const tx of transactions) {
      const credits = Math.abs(tx.amount);
      totalCredits += credits;
      totalDiscounts += tx.discountApplied;

      // By subscription
      const sub = tx.usage.subscription;
      const subData = subscriptionMap.get(sub) ?? { credits: 0, users: new Set() };
      subData.credits += credits;
      subData.users.add(tx.usage.userId);
      subscriptionMap.set(sub, subData);

      // By tier
      const tier = tx.tier ?? 50;
      const tierData = tierMap.get(tier) ?? { credits: 0, jobs: 0 };
      tierData.credits += credits;
      tierData.jobs++;
      tierMap.set(tier, tierData);
    }

    // Build subscription breakdown
    const bySubscription = Array.from(subscriptionMap.entries()).map(([sub, data]) => ({
      subscription: sub,
      credits: data.credits,
      revenueUSD: data.credits * CREDITS_TO_USD,
      userCount: data.users.size,
    }));

    // Build tier breakdown
    const byTier = Array.from(tierMap.entries()).map(([tier, data]) => ({
      tier: tier as ThematizationTierCount,
      credits: data.credits,
      revenueUSD: data.credits * CREDITS_TO_USD,
      jobCount: data.jobs,
    }));

    return {
      period,
      totalCreditsConsumed: totalCredits,
      estimatedRevenueUSD: totalCredits * CREDITS_TO_USD,
      bySubscription,
      byTier,
      promoDiscounts: totalDiscounts,
    };
  }

  // ==========================================================================
  // PROMO CODE MANAGEMENT
  // ==========================================================================

  /**
   * Create a new promo code
   */
  async createPromoCode(request: CreatePromoCodeRequest): Promise<{ id: string; code: string }> {
    const code = request.code.toUpperCase().trim();

    // Check for existing code
    const existing = await this.prisma.thematizationPromoCode.findUnique({
      where: { code },
    });

    if (existing) {
      throw new Error(`Promo code already exists: ${code}`);
    }

    const promo = await this.prisma.thematizationPromoCode.create({
      data: {
        code,
        discountType: request.discountType,
        discountValue: request.discountValue,
        maxUses: request.maxUses,
        maxUsesPerUser: request.maxUsesPerUser ?? 1,
        validFrom: request.validFrom ?? new Date(),
        validUntil: request.validUntil,
        minTier: request.minTier,
        targetSubscriptions: request.targetSubscriptions ?? undefined,
        description: request.description,
        isActive: true,
      },
    });

    this.logger.log(`✅ [Admin] Created promo code: ${code}`);

    return { id: promo.id, code: promo.code };
  }

  /**
   * Get promo code analytics
   */
  async getPromoCodeAnalytics(code: string): Promise<PromoCodeAnalytics | null> {
    const promo = await this.prisma.thematizationPromoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        transactions: {
          include: {
            usage: true,
          },
        },
      },
    });

    if (!promo) {
      return null;
    }

    // Aggregate usage by tier
    const tierMap = new Map<number, { uses: number; discount: number }>();
    const uniqueUsers = new Set<string>();
    let totalDiscount = 0;

    for (const tx of promo.transactions) {
      uniqueUsers.add(tx.usage.userId);
      totalDiscount += tx.discountApplied;

      const tier = tx.tier ?? 50;
      const existing = tierMap.get(tier) ?? { uses: 0, discount: 0 };
      existing.uses++;
      existing.discount += tx.discountApplied;
      tierMap.set(tier, existing);
    }

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      totalUses: promo.currentUses,
      totalDiscountApplied: totalDiscount,
      uniqueUsers: uniqueUsers.size,
      isActive: promo.isActive,
      validFrom: promo.validFrom,
      validUntil: promo.validUntil,
      usageByTier: Array.from(tierMap.entries()).map(([tier, data]) => ({
        tier: tier as ThematizationTierCount,
        uses: data.uses,
        discountApplied: data.discount,
      })),
    };
  }

  /**
   * Deactivate a promo code
   */
  async deactivatePromoCode(code: string): Promise<boolean> {
    const result = await this.prisma.thematizationPromoCode.updateMany({
      where: { code: code.toUpperCase() },
      data: { isActive: false },
    });

    if (result.count > 0) {
      this.logger.log(`🛑 [Admin] Deactivated promo code: ${code}`);
      return true;
    }

    return false;
  }

  // ==========================================================================
  // SYSTEM HEALTH
  // ==========================================================================

  /**
   * Get system health status
   */
  getHealthStatus(): {
    readonly healthy: boolean;
    readonly activeJobs: number;
    readonly checks: ReadonlyArray<{
      readonly name: string;
      readonly status: 'pass' | 'warn' | 'fail';
      readonly message: string;
    }>;
    readonly metrics: {
      readonly successRate: number;
      readonly avgDurationMs: number;
      readonly p95DurationMs: number;
    };
  } {
    const healthStatus = this.metricsService.getHealthStatus();
    const aggregateMetrics = this.metricsService.getAggregateMetrics();

    return {
      healthy: healthStatus.healthy,
      activeJobs: this.metricsService.getActiveJobCount(),
      checks: healthStatus.checks,
      metrics: {
        successRate: aggregateMetrics.successRate,
        avgDurationMs: aggregateMetrics.avgProcessingTimeMs,
        p95DurationMs: aggregateMetrics.p95DurationMs,
      },
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get date range for analytics period
   */
  private getPeriodDates(period: AnalyticsPeriod): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    switch (period) {
      case 'day':
        start = new Date(end);
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start = new Date(end);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date(end);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'all':
      default:
        start = new Date(0); // Unix epoch
        break;
    }

    return { start, end };
  }
}
