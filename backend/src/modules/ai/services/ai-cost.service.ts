import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CostSummary {
  dailyCost: number;
  monthlyCost: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyPercentage: number;
  monthlyPercentage: number;
  remainingDailyBudget: number;
  remainingMonthlyBudget: number;
}

export interface UsageDetails {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  modelBreakdown: {
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
}

@Injectable()
export class AICostService {
  private readonly logger = new Logger(AICostService.name);
  
  private readonly costPerToken = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
  };

  constructor(private prisma: PrismaService) {}

  async trackUsage(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    endpoint: string = 'unknown'
  ): Promise<number> {
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    await this.prisma.aIUsage.create({
      data: {
        userId,
        model,
        endpoint,
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        status: 'success',
      },
    });

    // Check budget limits
    await this.checkBudgetLimit(userId);

    return cost;
  }

  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const rates = this.costPerToken[model as keyof typeof this.costPerToken] || this.costPerToken['gpt-3.5-turbo'];
    return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
  }

  async checkBudgetLimit(userId: string): Promise<void> {
    const budgetLimit = await this.getBudgetLimit(userId);
    
    if (!budgetLimit.isActive) {
      return;
    }

    const usage = await this.getCostSummary(userId);
    
    if (usage.dailyCost > budgetLimit.dailyLimitUsd) {
      throw new Error('Daily AI credit limit exceeded');
    }
    
    if (usage.monthlyCost > budgetLimit.monthlyLimitUsd) {
      throw new Error('Monthly AI credit limit exceeded');
    }

    // Alert if approaching limit
    if (usage.monthlyPercentage > budgetLimit.alertThreshold * 100) {
      this.logger.warn(
        `User ${userId} has used ${usage.monthlyPercentage.toFixed(1)}% of monthly AI budget`
      );
    }
  }

  async getBudgetLimit(userId: string) {
    let budgetLimit = await this.prisma.aIBudgetLimit.findUnique({
      where: { userId },
    });

    if (!budgetLimit) {
      // Create default budget limit
      budgetLimit = await this.prisma.aIBudgetLimit.create({
        data: {
          userId,
          dailyLimitUsd: 10.0,
          monthlyLimitUsd: 300.0,
          alertThreshold: 0.8,
          isActive: true,
        },
      });
    }

    return budgetLimit;
  }

  async getCostSummary(userId: string): Promise<CostSummary> {
    const budgetLimit = await this.getBudgetLimit(userId);
    const dailyCost = await this.getDailyUsage(userId);
    const monthlyCost = await this.getMonthlyUsage(userId);

    return {
      dailyCost,
      monthlyCost,
      dailyLimit: budgetLimit.dailyLimitUsd,
      monthlyLimit: budgetLimit.monthlyLimitUsd,
      dailyPercentage: (dailyCost / budgetLimit.dailyLimitUsd) * 100,
      monthlyPercentage: (monthlyCost / budgetLimit.monthlyLimitUsd) * 100,
      remainingDailyBudget: Math.max(0, budgetLimit.dailyLimitUsd - dailyCost),
      remainingMonthlyBudget: Math.max(0, budgetLimit.monthlyLimitUsd - monthlyCost),
    };
  }

  async getUsageDetails(userId: string, days: number = 30): Promise<UsageDetails> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usage = await this.prisma.aIUsage.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    const totalRequests = usage.length;
    const successfulRequests = usage.filter(u => u.status === 'success').length;
    const failedRequests = totalRequests - successfulRequests;
    const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalResponseTime = usage.reduce((sum, u) => sum + (u.responseTimeMs || 0), 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    // Group by model
    const modelMap = new Map<string, { requests: number; tokens: number; cost: number }>();
    
    usage.forEach(u => {
      const existing = modelMap.get(u.model) || { requests: 0, tokens: 0, cost: 0 };
      modelMap.set(u.model, {
        requests: existing.requests + 1,
        tokens: existing.tokens + u.totalTokens,
        cost: existing.cost + u.cost,
      });
    });

    const modelBreakdown = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      ...data,
    }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokens,
      averageResponseTime,
      modelBreakdown,
    };
  }

  async getMonthlyUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    return usage._sum.cost || 0;
  }

  async getDailyUsage(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
      _sum: { cost: true },
    });

    return usage._sum.cost || 0;
  }

  async updateBudgetLimit(
    userId: string,
    dailyLimit?: number,
    monthlyLimit?: number,
    alertThreshold?: number
  ): Promise<void> {
    const existing = await this.getBudgetLimit(userId);

    await this.prisma.aIBudgetLimit.update({
      where: { id: existing.id },
      data: {
        ...(dailyLimit !== undefined && { dailyLimitUsd: dailyLimit }),
        ...(monthlyLimit !== undefined && { monthlyLimitUsd: monthlyLimit }),
        ...(alertThreshold !== undefined && { alertThreshold }),
      },
    });
  }

  async toggleBudgetLimit(userId: string, isActive: boolean): Promise<void> {
    const existing = await this.getBudgetLimit(userId);

    await this.prisma.aIBudgetLimit.update({
      where: { id: existing.id },
      data: { isActive },
    });
  }

  // Cleanup old cache entries (runs daily at midnight)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredCache(): Promise<void> {
    try {
      const result = await this.prisma.aICache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      this.logger.log(`Cleaned up ${result.count} expired AI cache entries`);
    } catch (error) {
      this.logger.error('Failed to cleanup AI cache:', error);
    }
  }

  // Cleanup old rate limit records (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldRateLimits(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      
      const result = await this.prisma.aIRateLimit.deleteMany({
        where: {
          windowEnd: {
            lt: oneHourAgo,
          },
        },
      });
      
      this.logger.debug(`Cleaned up ${result.count} old rate limit records`);
    } catch (error) {
      this.logger.error('Failed to cleanup rate limits:', error);
    }
  }

  // Generate usage report
  async generateUsageReport(userId: string, startDate: Date, endDate: Date) {
    const usage = await this.prisma.aIUsage.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      period: {
        start: startDate,
        end: endDate,
      },
      totalRequests: usage.length,
      totalCost: usage.reduce((sum, u) => sum + u.cost, 0),
      totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
      averageRequestCost: usage.length > 0 ? usage.reduce((sum, u) => sum + u.cost, 0) / usage.length : 0,
      successRate: usage.length > 0 ? (usage.filter(u => u.status === 'success').length / usage.length) * 100 : 0,
      modelUsage: this.groupByModel(usage),
      dailyBreakdown: this.groupByDay(usage),
    };

    return summary;
  }

  private groupByModel(usage: any[]): Record<string, { requests: number; tokens: number; cost: number }> {
    const grouped: Record<string, { requests: number; tokens: number; cost: number }> = {};

    usage.forEach(u => {
      if (!grouped[u.model]) {
        grouped[u.model] = {
          requests: 0,
          tokens: 0,
          cost: 0,
        };
      }

      const modelGroup = grouped[u.model];
      if (modelGroup) {
        modelGroup.requests += 1;
        modelGroup.tokens += u.totalTokens;
        modelGroup.cost += u.cost;
      }
    });

    return grouped;
  }

  private groupByDay(usage: any[]): Record<string, { requests: number; tokens: number; cost: number }> {
    const grouped: Record<string, { requests: number; tokens: number; cost: number }> = {};

    usage.forEach(u => {
      const day = u.createdAt.toISOString().split('T')[0];

      if (!grouped[day]) {
        grouped[day] = {
          requests: 0,
          tokens: 0,
          cost: 0,
        };
      }

      const dayGroup = grouped[day];
      if (dayGroup) {
        dayGroup.requests += 1;
        dayGroup.tokens += u.totalTokens;
        dayGroup.cost += u.cost;
      }
    });

    return grouped;
  }
}