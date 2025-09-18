/**
 * AI Cost Management Service for Phase 6.86
 * Enterprise-grade cost tracking and budget enforcement
 */

import { z } from 'zod';

// Cost configuration per model (prices in USD per 1000 tokens)
export const AI_MODEL_COSTS = {
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015,
    name: 'GPT-3.5 Turbo',
    maxTokens: 16385,
  },
  'gpt-3.5-turbo-16k': {
    input: 0.003,
    output: 0.004,
    name: 'GPT-3.5 Turbo 16K',
    maxTokens: 16385,
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06,
    name: 'GPT-4',
    maxTokens: 8192,
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03,
    name: 'GPT-4 Turbo',
    maxTokens: 128000,
  },
  'gpt-4o': {
    input: 0.005,
    output: 0.015,
    name: 'GPT-4o',
    maxTokens: 128000,
  },
} as const;

export type AIModel = keyof typeof AI_MODEL_COSTS;

// Usage tracking schema
const UsageRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  model: z.enum(['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo', 'gpt-4o']),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cost: z.number(),
  feature: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type UsageRecord = z.infer<typeof UsageRecordSchema>;

// Budget configuration
export interface BudgetConfig {
  dailyLimit: number; // USD
  monthlyLimit: number; // USD
  perUserDailyLimit: number; // USD
  perFeatureLimits: Record<string, number>; // Feature-specific limits
  alertThreshold: number; // Percentage (0-1) to trigger alerts
}

// Cost summary
export interface CostSummary {
  totalCost: number;
  dailyCost: number;
  monthlyCost: number;
  byModel: Record<AIModel, number>;
  byFeature: Record<string, number>;
  byUser: Record<string, number>;
  projectedMonthlyCost: number;
  budgetUtilization: number; // Percentage (0-1)
}

export class AICostManagementService {
  private static instance: AICostManagementService;
  private usageRecords: UsageRecord[] = [];
  private budgetConfig: BudgetConfig;
  private localStorage: Storage | null = null;
  
  private constructor() {
    // Default budget configuration
    this.budgetConfig = {
      dailyLimit: 10, // $10 per day default
      monthlyLimit: 100, // $100 per month default
      perUserDailyLimit: 1, // $1 per user per day
      perFeatureLimits: {
        gridRecommendation: 0.5,
        statementGeneration: 2,
        biasDetection: 1,
        questionnaire: 1.5,
        participantAssist: 0.5,
        responseAnalysis: 2,
      },
      alertThreshold: 0.8, // Alert at 80% budget utilization
    };
    
    // Initialize localStorage if available
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
      this.loadUsageFromStorage();
    }
  }
  
  static getInstance(): AICostManagementService {
    if (!AICostManagementService.instance) {
      AICostManagementService.instance = new AICostManagementService();
    }
    return AICostManagementService.instance;
  }
  
  /**
   * Track AI usage and calculate cost
   */
  async trackUsage(
    userId: string,
    model: AIModel,
    inputTokens: number,
    outputTokens: number,
    feature: string,
    metadata?: Record<string, any>
  ): Promise<UsageRecord> {
    // Calculate cost
    const modelCost = AI_MODEL_COSTS[model];
    const inputCost = (inputTokens / 1000) * modelCost.input;
    const outputCost = (outputTokens / 1000) * modelCost.output;
    const totalCost = inputCost + outputCost;
    
    // Check budget limits before recording
    await this.checkBudgetLimits(userId, feature, totalCost);
    
    // Create usage record
    const record: UsageRecord = {
      id: this.generateId(),
      userId,
      model,
      inputTokens,
      outputTokens,
      cost: totalCost,
      feature,
      timestamp: new Date(),
      metadata,
    };
    
    // Validate record
    const validatedRecord = UsageRecordSchema.parse(record);
    
    // Store record
    this.usageRecords.push(validatedRecord);
    this.saveUsageToStorage();
    
    // Check for alerts
    this.checkAlerts();
    
    return validatedRecord;
  }
  
  /**
   * Check if operation would exceed budget limits
   */
  private async checkBudgetLimits(
    userId: string,
    feature: string,
    cost: number
  ): Promise<void> {
    const summary = this.getCostSummary();
    
    // Check daily limit
    if (summary.dailyCost + cost > this.budgetConfig.dailyLimit) {
      throw new Error(`Daily budget limit of $${this.budgetConfig.dailyLimit} would be exceeded`);
    }
    
    // Check monthly limit
    if (summary.monthlyCost + cost > this.budgetConfig.monthlyLimit) {
      throw new Error(`Monthly budget limit of $${this.budgetConfig.monthlyLimit} would be exceeded`);
    }
    
    // Check per-user daily limit
    const userDailyCost = this.getUserDailyCost(userId);
    if (userDailyCost + cost > this.budgetConfig.perUserDailyLimit) {
      throw new Error(`User daily limit of $${this.budgetConfig.perUserDailyLimit} would be exceeded`);
    }
    
    // Check feature-specific limit
    const featureLimit = this.budgetConfig.perFeatureLimits[feature];
    if (featureLimit) {
      const featureDailyCost = this.getFeatureDailyCost(feature);
      if (featureDailyCost + cost > featureLimit) {
        throw new Error(`Feature '${feature}' daily limit of $${featureLimit} would be exceeded`);
      }
    }
  }
  
  /**
   * Get comprehensive cost summary
   */
  getCostSummary(): CostSummary {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter records
    const todayRecords = this.usageRecords.filter(r => r.timestamp >= todayStart);
    const monthRecords = this.usageRecords.filter(r => r.timestamp >= monthStart);
    
    // Calculate costs
    const totalCost = this.usageRecords.reduce((sum, r) => sum + r.cost, 0);
    const dailyCost = todayRecords.reduce((sum, r) => sum + r.cost, 0);
    const monthlyCost = monthRecords.reduce((sum, r) => sum + r.cost, 0);
    
    // Group by model
    const byModel: Record<string, number> = {};
    for (const model of Object.keys(AI_MODEL_COSTS) as AIModel[]) {
      byModel[model] = monthRecords
        .filter(r => r.model === model)
        .reduce((sum, r) => sum + r.cost, 0);
    }
    
    // Group by feature
    const byFeature: Record<string, number> = {};
    for (const record of monthRecords) {
      byFeature[record.feature] = (byFeature[record.feature] || 0) + record.cost;
    }
    
    // Group by user
    const byUser: Record<string, number> = {};
    for (const record of monthRecords) {
      byUser[record.userId] = (byUser[record.userId] || 0) + record.cost;
    }
    
    // Project monthly cost
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const projectedMonthlyCost = daysPassed > 0 ? (monthlyCost / daysPassed) * daysInMonth : 0;
    
    // Calculate budget utilization
    const budgetUtilization = monthlyCost / this.budgetConfig.monthlyLimit;
    
    return {
      totalCost,
      dailyCost,
      monthlyCost,
      byModel: byModel as Record<AIModel, number>,
      byFeature,
      byUser,
      projectedMonthlyCost,
      budgetUtilization,
    };
  }
  
  /**
   * Get user's daily cost
   */
  private getUserDailyCost(userId: string): number {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return this.usageRecords
      .filter(r => r.userId === userId && r.timestamp >= todayStart)
      .reduce((sum, r) => sum + r.cost, 0);
  }
  
  /**
   * Get feature's daily cost
   */
  private getFeatureDailyCost(feature: string): number {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return this.usageRecords
      .filter(r => r.feature === feature && r.timestamp >= todayStart)
      .reduce((sum, r) => sum + r.cost, 0);
  }
  
  /**
   * Check for budget alerts
   */
  private checkAlerts(): void {
    const summary = this.getCostSummary();
    
    if (summary.budgetUtilization >= this.budgetConfig.alertThreshold) {
      console.warn(`⚠️ AI Budget Alert: ${(summary.budgetUtilization * 100).toFixed(1)}% of monthly budget used`);
      
      // Emit custom event for UI handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai-budget-alert', {
          detail: {
            utilization: summary.budgetUtilization,
            monthlyCost: summary.monthlyCost,
            limit: this.budgetConfig.monthlyLimit,
          },
        }));
      }
    }
  }
  
  /**
   * Update budget configuration
   */
  updateBudgetConfig(config: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...config };
    this.saveConfigToStorage();
  }
  
  /**
   * Get current budget configuration
   */
  getBudgetConfig(): BudgetConfig {
    return { ...this.budgetConfig };
  }
  
  /**
   * Estimate cost for a request
   */
  estimateCost(
    model: AIModel,
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): number {
    const modelCost = AI_MODEL_COSTS[model];
    const inputCost = (estimatedInputTokens / 1000) * modelCost.input;
    const outputCost = (estimatedOutputTokens / 1000) * modelCost.output;
    return inputCost + outputCost;
  }
  
  /**
   * Get optimal model based on budget and requirements
   */
  getOptimalModel(
    requirements: {
      minQuality?: 'fast' | 'balanced' | 'high';
      maxCost?: number;
      maxTokens?: number;
    }
  ): AIModel {
    const { minQuality = 'balanced', maxCost, maxTokens } = requirements;
    
    // Define quality tiers
    const qualityTiers: Record<string, AIModel[]> = {
      fast: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      balanced: ['gpt-4o', 'gpt-4-turbo'],
      high: ['gpt-4', 'gpt-4-turbo'],
    };
    
    const eligibleModels = qualityTiers[minQuality] || ['gpt-3.5-turbo'];
    
    // Filter by token requirements
    const tokenFilteredModels = maxTokens 
      ? eligibleModels.filter(m => AI_MODEL_COSTS[m].maxTokens >= maxTokens)
      : eligibleModels;
    
    // Ensure we have models
    if (!tokenFilteredModels || tokenFilteredModels.length === 0) {
      return 'gpt-3.5-turbo';
    }
    
    // If cost constraint, pick cheapest eligible model
    if (maxCost && tokenFilteredModels.length > 0) {
      return tokenFilteredModels.reduce((cheapest, model) => {
        const cheapestCost = AI_MODEL_COSTS[cheapest].input + AI_MODEL_COSTS[cheapest].output;
        const modelCost = AI_MODEL_COSTS[model].input + AI_MODEL_COSTS[model].output;
        return modelCost < cheapestCost ? model : cheapest;
      });
    }
    
    // Default to first eligible model
    return tokenFilteredModels[0] || 'gpt-3.5-turbo';
  }
  
  /**
   * Export usage data for reporting
   */
  exportUsageData(
    startDate?: Date,
    endDate?: Date
  ): {
    records: UsageRecord[];
    summary: CostSummary;
    csvData: string;
  } {
    const filteredRecords = this.usageRecords.filter(r => {
      if (startDate && r.timestamp < startDate) return false;
      if (endDate && r.timestamp > endDate) return false;
      return true;
    });
    
    // Generate CSV
    const csvHeaders = 'Date,User ID,Model,Feature,Input Tokens,Output Tokens,Cost (USD)\n';
    const csvRows = filteredRecords.map(r => 
      `${r.timestamp.toISOString()},${r.userId},${r.model},${r.feature},${r.inputTokens},${r.outputTokens},${r.cost.toFixed(4)}`
    ).join('\n');
    
    return {
      records: filteredRecords,
      summary: this.getCostSummary(),
      csvData: csvHeaders + csvRows,
    };
  }
  
  /**
   * Clear old usage records (for storage management)
   */
  cleanupOldRecords(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const beforeCount = this.usageRecords.length;
    this.usageRecords = this.usageRecords.filter(r => r.timestamp > cutoffDate);
    const afterCount = this.usageRecords.length;
    
    this.saveUsageToStorage();
    
    return beforeCount - afterCount;
  }
  
  // Storage helpers
  
  private generateId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private saveUsageToStorage(): void {
    if (!this.localStorage) return;
    
    try {
      // Keep only last 30 days of records in localStorage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRecords = this.usageRecords.filter(r => r.timestamp > thirtyDaysAgo);
      this.localStorage.setItem('ai_usage_records', JSON.stringify(recentRecords));
    } catch (error) {
      console.error('Failed to save usage records to storage:', error);
    }
  }
  
  private loadUsageFromStorage(): void {
    if (!this.localStorage) return;
    
    try {
      const stored = this.localStorage.getItem('ai_usage_records');
      if (stored) {
        const records = JSON.parse(stored);
        this.usageRecords = records.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
      
      // Load budget config
      const storedConfig = this.localStorage.getItem('ai_budget_config');
      if (storedConfig) {
        this.budgetConfig = { ...this.budgetConfig, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Failed to load usage records from storage:', error);
    }
  }
  
  private saveConfigToStorage(): void {
    if (!this.localStorage) return;
    
    try {
      this.localStorage.setItem('ai_budget_config', JSON.stringify(this.budgetConfig));
    } catch (error) {
      console.error('Failed to save budget config to storage:', error);
    }
  }
}

// Export singleton instance
export const aiCostManager = AICostManagementService.getInstance();

// Export convenience functions
export function trackAIUsage(
  userId: string,
  model: AIModel,
  inputTokens: number,
  outputTokens: number,
  feature: string
): Promise<UsageRecord> {
  return aiCostManager.trackUsage(userId, model, inputTokens, outputTokens, feature);
}

export function getAICostSummary(): CostSummary {
  return aiCostManager.getCostSummary();
}

export function estimateAICost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  return aiCostManager.estimateCost(model, inputTokens, outputTokens);
}