/**
 * Phase 10.113 Week 7: Thematization Controller
 *
 * Netflix-grade REST API for unified thematization pipeline.
 * Exposes all Phase 10.113 enhancements through clean endpoints.
 *
 * ============================================================================
 * ENDPOINTS
 * ============================================================================
 *
 * POST /thematization/execute      - Execute full thematization pipeline
 * GET  /thematization/estimate     - Get cost estimate for a job
 * GET  /thematization/status/:id   - Get job status
 * POST /thematization/cancel/:id   - Cancel running job
 * GET  /thematization/usage        - Get user usage stats
 * GET  /thematization/pricing      - Get tier pricing comparison
 * GET  /thematization/subscriptions - Get subscription options
 * POST /thematization/promo/validate - Validate promo code
 *
 * @module ThematizationController
 * @since Phase 10.113 Week 7
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Services
import { UnifiedThematizationService } from '../services/unified-thematization.service';
import { ThematizationPricingService } from '../services/thematization-pricing.service';
import { ThematizationBillingService } from '../services/thematization-billing.service';
// Week 7: Query Optimization
import { ThematizationQueryService } from '../services/thematization-query.service';
// Week 8: Admin & Metrics
import { ThematizationAdminService, AnalyticsPeriod } from '../services/thematization-admin.service';
import { ThematizationMetricsService } from '../services/thematization-metrics.service';

// Types
import {
  ThematizationTierCount,
  ThematizationPipelineFlags,
  DEFAULT_PIPELINE_FLAGS,
  isValidTier,
} from '../types/unified-thematization.types';

// ============================================================================
// TYPE GUARDS (Strict Typing)
// ============================================================================

/**
 * Type guard: Check if value is an Error instance
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safely extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

// ============================================================================
// REQUEST/RESPONSE DTOs (Type-Safe)
// ============================================================================

/**
 * Execute thematization request body
 */
interface ExecuteThematizationDto {
  readonly topic: string;
  readonly topicDescription?: string;
  readonly tier: ThematizationTierCount;
  readonly papers: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly abstract?: string;
    readonly fullText?: string;
    readonly authors?: readonly string[];
    readonly year?: number;
    readonly doi?: string;
    readonly citationCount?: number;
  }>;
  readonly flags?: Partial<ThematizationPipelineFlags>;
  readonly autoDeductCredits?: boolean;
  readonly promoCode?: string;
}

/**
 * Cost estimate query parameters
 */
interface EstimateCostQuery {
  readonly tier: string;
  readonly enableHierarchical?: string;
  readonly enableControversy?: string;
  readonly enableClaims?: string;
  readonly promoCode?: string;
}

/**
 * Promo code validation body
 */
interface ValidatePromoDto {
  readonly code: string;
  readonly tier?: number;
}

// ============================================================================
// CONTROLLER IMPLEMENTATION
// ============================================================================

@ApiTags('Thematization')
@ApiBearerAuth()
@Controller('thematization')
@UseGuards(JwtAuthGuard)
export class ThematizationController {
  private readonly logger = new Logger(ThematizationController.name);

  constructor(
    private readonly thematizationService: UnifiedThematizationService,
    private readonly pricingService: ThematizationPricingService,
    private readonly billingService: ThematizationBillingService,
    // Week 7: Query Optimization
    private readonly queryService: ThematizationQueryService,
    // Week 8: Admin & Metrics
    private readonly adminService: ThematizationAdminService,
    private readonly metricsService: ThematizationMetricsService,
  ) {
    this.logger.log('✅ [ThematizationController] Initialized');
    this.logger.log('   Week 7: Query optimization enabled');
    this.logger.log('   Week 8: Admin & metrics enabled');
  }

  // ==========================================================================
  // PIPELINE EXECUTION ENDPOINTS
  // ==========================================================================

  /**
   * Execute unified thematization pipeline
   */
  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute thematization pipeline',
    description: 'Run the full Braun & Clarke thematization pipeline with optional enhancements',
  })
  @ApiBody({ description: 'Thematization configuration and papers' })
  @ApiResponse({ status: 200, description: 'Pipeline completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  async executeThematization(
    @Body() body: ExecuteThematizationDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;
    const startTime = Date.now();

    this.logger.log(
      `🚀 [Thematization] Starting for user ${userId}, ` +
      `topic: "${body.topic}", tier: ${body.tier}, papers: ${body.papers.length}`,
    );

    // Validate tier
    if (!isValidTier(body.tier)) {
      throw new BadRequestException(
        `Invalid tier: ${body.tier}. Valid tiers: 50, 100, 150, 200, 250, 300`,
      );
    }

    // Validate papers
    if (!body.papers || body.papers.length === 0) {
      throw new BadRequestException('At least one paper is required');
    }

    try {
      // Execute pipeline
      const result = await this.thematizationService.executeThematizationPipeline(
        body.papers.map(p => ({
          id: p.id,
          title: p.title,
          abstract: p.abstract,
          fullText: p.fullText,
          authors: p.authors ? [...p.authors] : undefined,
          year: p.year,
          doi: p.doi,
          citationCount: p.citationCount,
        })),
        {
          topic: body.topic,
          topicDescription: body.topicDescription,
          tier: body.tier,
          flags: { ...DEFAULT_PIPELINE_FLAGS, ...body.flags },
          userId,
          autoDeductCredits: body.autoDeductCredits,
        },
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [Thematization] Complete in ${processingTime}ms. ` +
        `Themes: ${result.themes.length}, Claims: ${result.claims?.length ?? 0}`,
      );

      return {
        success: true,
        data: result,
        meta: {
          processingTimeMs: processingTime,
          tier: body.tier,
          papersProcessed: body.papers.length,
        },
      };
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      this.logger.error(`❌ [Thematization] Failed: ${errorMsg}`);

      // Check for specific error types
      if (errorMsg.includes('Insufficient credits')) {
        throw new BadRequestException({
          statusCode: 402,
          message: errorMsg,
          error: 'Payment Required',
        });
      }

      throw new BadRequestException(errorMsg);
    }
  }

  /**
   * Get job status
   */
  @Get('status/:requestId')
  @ApiOperation({ summary: 'Get thematization job status' })
  @ApiParam({ name: 'requestId', description: 'Job request ID' })
  @ApiResponse({ status: 200, description: 'Job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  getJobStatus(@Param('requestId') requestId: string) {
    const status = this.thematizationService.getJobStatus(requestId);

    if (!status) {
      throw new BadRequestException(`Job not found: ${requestId}`);
    }

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Cancel running job
   */
  @Post('cancel/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel running thematization job' })
  @ApiParam({ name: 'requestId', description: 'Job request ID' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  @ApiResponse({ status: 404, description: 'Job not found or not running' })
  cancelJob(@Param('requestId') requestId: string) {
    const cancelled = this.thematizationService.cancelJob(requestId);

    if (!cancelled) {
      throw new BadRequestException(
        `Job not found or not running: ${requestId}`,
      );
    }

    return {
      success: true,
      message: 'Job cancelled',
    };
  }

  // ==========================================================================
  // PRICING ENDPOINTS
  // ==========================================================================

  /**
   * Get cost estimate for a job
   */
  @Get('estimate')
  @ApiOperation({ summary: 'Get cost estimate for thematization' })
  @ApiQuery({ name: 'tier', description: 'Paper count tier (50-300)' })
  @ApiQuery({ name: 'enableHierarchical', required: false })
  @ApiQuery({ name: 'enableControversy', required: false })
  @ApiQuery({ name: 'enableClaims', required: false })
  @ApiQuery({ name: 'promoCode', required: false })
  @ApiResponse({ status: 200, description: 'Cost estimate' })
  async getCostEstimate(
    @Query() query: EstimateCostQuery,
    @Req() req: Request,
  ) {
    const tier = parseInt(query.tier, 10) as ThematizationTierCount;

    if (!isValidTier(tier)) {
      throw new BadRequestException(
        `Invalid tier: ${query.tier}. Valid tiers: 50, 100, 150, 200, 250, 300`,
      );
    }

    const flags: Partial<ThematizationPipelineFlags> = {
      enableHierarchicalExtraction: query.enableHierarchical === 'true',
      enableControversyAnalysis: query.enableControversy === 'true',
      enableClaimExtraction: query.enableClaims === 'true',
    };

    const userId = (req.user as { id: string })?.id;

    const estimate = this.pricingService.calculateDetailedCost(
      tier,
      flags,
      userId,
      query.promoCode,
    );

    return {
      success: true,
      data: {
        tier,
        baseCost: estimate.baseCost,
        featureCosts: estimate.featureCosts,
        totalCost: estimate.totalCost,
        discounts: estimate.discounts,
        finalCost: estimate.finalCost,
        costUSD: estimate.costUSD,
        estimatedTimeSeconds: estimate.estimatedTimeSeconds,
        remainingCredits: estimate.remainingCredits,
      },
    };
  }

  /**
   * Get tier pricing comparison
   */
  @Get('pricing')
  @ApiOperation({ summary: 'Get all tier pricing comparison' })
  @ApiResponse({ status: 200, description: 'Tier pricing list' })
  getTierPricing() {
    const tiers = this.pricingService.getTierComparison();

    return {
      success: true,
      data: tiers,
    };
  }

  /**
   * Get subscription options
   */
  @Get('subscriptions')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription options' })
  getSubscriptionOptions() {
    const subscriptions = this.pricingService.getSubscriptionOptions();

    return {
      success: true,
      data: subscriptions,
    };
  }

  // ==========================================================================
  // USAGE ENDPOINTS
  // ==========================================================================

  /**
   * Get user usage statistics
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get current user usage stats' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUserUsage(@Req() req: Request) {
    const userId = (req.user as { id: string })?.id;

    // Use database-backed billing service
    const usage = await this.billingService.getOrCreateUsage(userId);

    return {
      success: true,
      data: {
        subscription: usage.subscription,
        creditsUsed: usage.creditsUsed,
        creditsRemaining: usage.creditsRemaining,
        monthlyCredits: usage.monthlyCredits,
        jobsThisMonth: usage.jobsThisMonth,
        totalJobsAllTime: usage.totalJobsAllTime,
        billingCycleStart: usage.billingCycleStart,
        billingCycleEnd: usage.billingCycleEnd,
      },
    };
  }

  /**
   * Get transaction history
   */
  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max records' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  async getTransactionHistory(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;

    const result = await this.billingService.getTransactionHistory(
      userId,
      parseInt(limit, 10) || 50,
      parseInt(offset, 10) || 0,
    );

    return {
      success: true,
      data: result.transactions,
      meta: {
        total: result.total,
        limit: parseInt(limit, 10) || 50,
        offset: parseInt(offset, 10) || 0,
      },
    };
  }

  // ==========================================================================
  // PROMO CODE ENDPOINTS
  // ==========================================================================

  /**
   * Validate promo code
   */
  @Post('promo/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a promo code' })
  @ApiBody({ description: 'Promo code to validate' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validatePromoCode(
    @Body() body: ValidatePromoDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string })?.id;

    const validation = await this.billingService.validatePromoCode(
      body.code,
      userId,
      body.tier,
    );

    return {
      success: true,
      data: {
        isValid: validation.isValid,
        reason: validation.reason,
        discountType: validation.discountType,
        discountValue: validation.discountValue,
      },
    };
  }

  // ==========================================================================
  // WEEK 7: QUERY OPTIMIZATION ENDPOINTS
  // ==========================================================================

  /**
   * Optimize query for thematization
   * Returns controversy expansion, methodology terms, and suggestions
   */
  @Post('optimize-query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Optimize search query for thematization',
    description: 'Expands query with controversy terms, methodology keywords, and provides tier recommendations',
  })
  @ApiBody({
    description: 'Query optimization request',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', example: 'climate change policy' },
        includeControversy: { type: 'boolean', default: true },
        includeMethodology: { type: 'boolean', default: true },
        targetTier: { type: 'number', enum: [50, 100, 150, 200, 250, 300] },
      },
      required: ['query'],
    },
  })
  @ApiResponse({ status: 200, description: 'Query optimized successfully' })
  optimizeQuery(
    @Body() body: {
      readonly query: string;
      readonly includeControversy?: boolean;
      readonly includeMethodology?: boolean;
      readonly targetTier?: ThematizationTierCount;
    },
  ) {
    if (!body.query || body.query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }

    const result = this.queryService.expandForThematization(body.query, {
      includeControversy: body.includeControversy,
      includeMethodology: body.includeMethodology,
      targetTier: body.targetTier,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Check if query is suitable for thematization
   */
  @Post('check-query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check query suitability for thematization',
    description: 'Analyzes if a query will produce good thematization results',
  })
  checkQuerySuitability(@Body() body: { readonly query: string }) {
    if (!body.query || body.query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }

    const result = this.queryService.isQuerySuitableForThematization(body.query);

    return {
      success: true,
      data: result,
    };
  }

  // ==========================================================================
  // WEEK 8: ADMIN ANALYTICS ENDPOINTS
  // ==========================================================================

  /**
   * Get usage analytics (Admin only)
   */
  @Get('admin/analytics')
  @ApiOperation({
    summary: 'Get usage analytics',
    description: 'Returns aggregated usage statistics for the specified period',
  })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(
    @Query('period') period: AnalyticsPeriod = 'week',
  ) {
    const analytics = await this.adminService.getUsageAnalytics(period);

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get top users (Admin only)
   */
  @Get('admin/top-users')
  @ApiOperation({
    summary: 'Get top users by usage',
    description: 'Returns top users sorted by jobs, credits, or papers',
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', enum: ['jobs', 'credits', 'papers'], required: false })
  @ApiResponse({ status: 200, description: 'Top users retrieved successfully' })
  async getTopUsers(
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'jobs' | 'credits' | 'papers',
  ) {
    const users = await this.adminService.getTopUsers(
      limit ? parseInt(limit, 10) : 10,
      sortBy || 'credits',
    );

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get revenue analytics (Admin only)
   */
  @Get('admin/revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Returns revenue breakdown by subscription and tier',
  })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(
    @Query('period') period: AnalyticsPeriod = 'month',
  ) {
    const revenue = await this.adminService.getRevenueAnalytics(period);

    return {
      success: true,
      data: revenue,
    };
  }

  /**
   * Get system health status
   */
  @Get('admin/health')
  @ApiOperation({
    summary: 'Get thematization service health',
    description: 'Returns health checks and metrics for the thematization pipeline',
  })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  getHealth() {
    const adminHealth = this.adminService.getHealthStatus();
    const metricsHealth = this.metricsService.getHealthStatus();
    const aggregateMetrics = this.metricsService.getAggregateMetrics();

    return {
      success: true,
      data: {
        overall: adminHealth.healthy && metricsHealth.healthy,
        admin: adminHealth,
        metrics: metricsHealth,
        aggregate: {
          totalJobs: aggregateMetrics.totalJobs,
          successRate: aggregateMetrics.successRate,
          avgProcessingTimeMs: aggregateMetrics.avgProcessingTimeMs,
          p95DurationMs: aggregateMetrics.p95DurationMs,
        },
      },
    };
  }

  /**
   * Get promo code analytics (Admin only)
   */
  @Get('admin/promos/:code')
  @ApiOperation({
    summary: 'Get promo code analytics',
    description: 'Returns usage statistics for a specific promo code',
  })
  @ApiParam({ name: 'code', description: 'Promo code to analyze' })
  @ApiResponse({ status: 200, description: 'Promo analytics retrieved successfully' })
  async getPromoAnalytics(@Param('code') code: string) {
    const analytics = await this.adminService.getPromoCodeAnalytics(code);

    if (!analytics) {
      throw new BadRequestException(`Promo code not found: ${code}`);
    }

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get recent job history
   */
  @Get('admin/recent-jobs')
  @ApiOperation({
    summary: 'Get recent thematization jobs',
    description: 'Returns the most recent thematization jobs with metrics',
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiResponse({ status: 200, description: 'Recent jobs retrieved successfully' })
  getRecentJobs(@Query('limit') limit?: string) {
    const jobs = this.metricsService.getRecentJobs(
      limit ? parseInt(limit, 10) : 10,
    );

    return {
      success: true,
      data: jobs,
    };
  }
}
