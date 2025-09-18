/**
 * AI Monitoring Service
 * Phase 6.86: Enterprise-grade monitoring and analytics
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

interface AIMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  topModels: Array<{ model: string; count: number; cost: number }>;
  hourlyDistribution: Array<{ hour: number; requests: number }>;
}

interface UserUsage {
  userId: string;
  dailyUsage: number;
  monthlyUsage: number;
  dailyLimit: number;
  monthlyLimit: number;
  percentOfDailyLimit: number;
  percentOfMonthlyLimit: number;
  isApproachingLimit: boolean;
  isOverLimit: boolean;
}

@Injectable()
export class AIMonitoringService {
  private readonly logger = new Logger(AIMonitoringService.name);
  
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService
  ) {}
  
  /**
   * Track AI usage for a request
   */
  async trackUsage(data: {
    userId: string;
    endpoint: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    responseTimeMs: number;
    status: 'success' | 'error';
    errorMessage?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Record usage in database
      const usage = await this.prisma.aIUsage.create({
        data: {
          userId: data.userId,
          endpoint: data.endpoint,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.promptTokens + data.completionTokens,
          cost: data.cost,
          responseTimeMs: data.responseTimeMs,
          status: data.status,
          errorMessage: data.errorMessage,
          metadata: data.metadata
        }
      });
      
      // Check budget limits
      await this.checkBudgetLimits(data.userId);
      
      // Update rate limits
      await this.updateRateLimits(data.userId);
      
      // Emit event for real-time monitoring
      this.eventEmitter.emit('ai.usage.tracked', {
        userId: data.userId,
        usage,
        timestamp: new Date()
      });
      
      // Log high-cost requests
      if (data.cost > 0.5) {
        this.logger.warn(`High-cost AI request: User ${data.userId}, Cost: $${data.cost.toFixed(4)}, Model: ${data.model}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to track AI usage:', error);
      // Don't throw - monitoring shouldn't break the main flow
    }
  }
  
  /**
   * Check if user is approaching or exceeding budget limits
   */
  async checkBudgetLimits(userId: string): Promise<UserUsage> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get user's budget limits
    const budgetLimit = await this.prisma.aIBudgetLimit.findUnique({
      where: { userId }
    });
    
    if (!budgetLimit) {
      // Create default budget limit for new user
      await this.prisma.aIBudgetLimit.create({
        data: {
          userId,
          dailyLimitUsd: 10.00,
          monthlyLimitUsd: 300.00,
          alertThreshold: 0.80
        }
      });
    }
    
    // Calculate daily usage
    const dailyUsage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay }
      },
      _sum: { cost: true }
    });
    
    // Calculate monthly usage
    const monthlyUsage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth }
      },
      _sum: { cost: true }
    });
    
    const dailyTotal = Number(dailyUsage._sum.cost || 0);
    const monthlyTotal = Number(monthlyUsage._sum.cost || 0);
    const dailyLimit = Number(budgetLimit?.dailyLimitUsd || 10);
    const monthlyLimit = Number(budgetLimit?.monthlyLimitUsd || 300);
    const threshold = Number(budgetLimit?.alertThreshold || 0.80);
    
    const usage: UserUsage = {
      userId,
      dailyUsage: dailyTotal,
      monthlyUsage: monthlyTotal,
      dailyLimit,
      monthlyLimit,
      percentOfDailyLimit: (dailyTotal / dailyLimit) * 100,
      percentOfMonthlyLimit: (monthlyTotal / monthlyLimit) * 100,
      isApproachingLimit: dailyTotal >= dailyLimit * threshold,
      isOverLimit: dailyTotal >= dailyLimit
    };
    
    // Send alerts if necessary
    if (usage.isOverLimit) {
      this.eventEmitter.emit('ai.budget.exceeded', { userId, usage });
      this.logger.error(`User ${userId} exceeded daily AI budget: $${dailyTotal.toFixed(2)}/$${dailyLimit}`);
    } else if (usage.isApproachingLimit) {
      this.eventEmitter.emit('ai.budget.warning', { userId, usage });
      this.logger.warn(`User ${userId} approaching daily AI budget: $${dailyTotal.toFixed(2)}/$${dailyLimit}`);
    }
    
    return usage;
  }
  
  /**
   * Update rate limiting for user
   */
  async updateRateLimits(userId: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60000); // 1 minute window
    
    // Get or create rate limit record
    let rateLimit = await this.prisma.aIRateLimit.findFirst({
      where: {
        userId,
        windowStart: { lte: now },
        windowEnd: { gte: now }
      }
    });
    
    if (!rateLimit) {
      // Create new window
      rateLimit = await this.prisma.aIRateLimit.create({
        data: {
          userId,
          windowStart,
          windowEnd: new Date(windowStart.getTime() + 60000),
          requestCount: 1,
          maxRequests: this.configService.get('RATE_LIMIT_PER_MINUTE', 10)
        }
      });
    } else {
      // Increment counter
      await this.prisma.aIRateLimit.update({
        where: { id: rateLimit.id },
        data: { requestCount: rateLimit.requestCount + 1 }
      });
    }
    
    return rateLimit.requestCount < rateLimit.maxRequests;
  }
  
  /**
   * Get comprehensive AI metrics
   */
  async getMetrics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<AIMetrics> {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    // Get all usage records for time period
    const usageRecords = await this.prisma.aIUsage.findMany({
      where: { createdAt: { gte: startDate } }
    });
    
    // Calculate metrics
    const totalRequests = usageRecords.length;
    const totalTokens = usageRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = usageRecords.reduce((sum, r) => sum + Number(r.cost), 0);
    const averageResponseTime = usageRecords.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / totalRequests || 0;
    const errorCount = usageRecords.filter(r => r.status === 'error').length;
    const errorRate = (errorCount / totalRequests) * 100 || 0;
    
    // Get cache metrics
    const cacheHits = await this.prisma.aICache.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { hitCount: true }
    });
    const cacheHitRate = (Number(cacheHits._sum.hitCount || 0) / totalRequests) * 100 || 0;
    
    // Get model distribution
    const modelCounts = new Map<string, { count: number; cost: number }>();
    usageRecords.forEach(record => {
      const existing = modelCounts.get(record.model) || { count: 0, cost: 0 };
      modelCounts.set(record.model, {
        count: existing.count + 1,
        cost: existing.cost + Number(record.cost)
      });
    });
    
    const topModels = Array.from(modelCounts.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get hourly distribution
    const hourlyDistribution = new Array(24).fill(0).map((_, hour) => {
      const count = usageRecords.filter(r => 
        new Date(r.createdAt).getHours() === hour
      ).length;
      return { hour, requests: count };
    });
    
    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageResponseTime,
      errorRate,
      cacheHitRate,
      topModels,
      hourlyDistribution
    };
  }
  
  /**
   * Get user-specific usage statistics
   */
  async getUserUsageStats(userId: string): Promise<any> {
    const usage = await this.checkBudgetLimits(userId);
    
    // Get recent requests
    const recentRequests = await this.prisma.aIUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        endpoint: true,
        model: true,
        totalTokens: true,
        cost: true,
        status: true,
        responseTimeMs: true,
        createdAt: true
      }
    });
    
    // Get usage trend (last 7 days)
    const trend = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests,
        SUM(cost) as total_cost,
        AVG(response_time_ms) as avg_response_time
      FROM ai_usage
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return {
      usage,
      recentRequests,
      trend
    };
  }
  
  /**
   * Clean up old cache entries (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupCache(): Promise<void> {
    this.logger.log('Starting AI cache cleanup...');
    
    try {
      const result = await this.prisma.aICache.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
      
      this.logger.log(`Cleaned up ${result.count} expired cache entries`);
      
      // Also clean up old rate limit records
      const rateLimitResult = await this.prisma.aIRateLimit.deleteMany({
        where: {
          windowEnd: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });
      
      this.logger.log(`Cleaned up ${rateLimitResult.count} old rate limit records`);
      
    } catch (error) {
      this.logger.error('Cache cleanup failed:', error);
    }
  }
  
  /**
   * Generate daily usage report (runs at 11 PM)
   */
  @Cron('0 23 * * *')
  async generateDailyReport(): Promise<void> {
    this.logger.log('Generating daily AI usage report...');
    
    try {
      const metrics = await this.getMetrics('day');
      
      // Log summary
      this.logger.log(`Daily AI Usage Summary:
        - Total Requests: ${metrics.totalRequests}
        - Total Tokens: ${metrics.totalTokens}
        - Total Cost: $${metrics.totalCost.toFixed(2)}
        - Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms
        - Error Rate: ${metrics.errorRate.toFixed(1)}%
        - Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%
      `);
      
      // Emit event for notification system
      this.eventEmitter.emit('ai.daily.report', { metrics, date: new Date() });
      
      // Refresh materialized view
      await this.prisma.$executeRaw`SELECT refresh_ai_usage_summary()`;
      
    } catch (error) {
      this.logger.error('Daily report generation failed:', error);
    }
  }
  
  /**
   * Get real-time monitoring data for dashboard
   */
  async getRealTimeStats(): Promise<any> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Get recent activity
    const recentActivity = await this.prisma.aIUsage.findMany({
      where: { createdAt: { gte: fiveMinutesAgo } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Get current active users
    const activeUsers = await this.prisma.aIUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: fiveMinutesAgo } },
      _count: true
    });
    
    // Get system health metrics
    const health = {
      activeUsers: activeUsers.length,
      requestsPerMinute: Math.round(recentActivity.length / 5),
      averageResponseTime: recentActivity.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / recentActivity.length || 0,
      errorRate: (recentActivity.filter(r => r.status === 'error').length / recentActivity.length) * 100 || 0,
      status: 'healthy' as 'healthy' | 'degraded' | 'down'
    };
    
    // Determine system status
    if (health.errorRate > 50) {
      health.status = 'down';
    } else if (health.errorRate > 10 || health.averageResponseTime > 5000) {
      health.status = 'degraded';
    }
    
    return {
      recentActivity,
      health,
      timestamp: new Date()
    };
  }
}

export default AIMonitoringService;