import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../../common/prisma.service';
import * as crypto from 'crypto';

export interface AICompletionOptions {
  model?: 'fast' | 'smart' | 'vision';
  temperature?: number;
  maxTokens?: number;
  cache?: boolean;
  userId?: string;
}

export interface AIResponse {
  content: string;
  tokens: number;
  responseTime: number;
  cached: boolean;
  cost: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai!: OpenAI;
  private models = {
    fast: 'gpt-3.5-turbo-0125',
    smart: 'gpt-4-turbo-preview',
    vision: 'gpt-4-vision-preview',
  };

  private costPerToken = {
    'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OpenAI API key not configured. AI features will be disabled.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey,
      organization: this.configService.get('OPENAI_ORG_ID'),
      timeout: 120000, // 2 minutes timeout for OpenAI API calls
      maxRetries: 2, // Retry failed requests up to 2 times
    });
  }

  async generateCompletion(
    prompt: string,
    options: AICompletionOptions = {},
  ): Promise<AIResponse> {
    const {
      model = 'fast',
      temperature = 0.7,
      maxTokens = 1000,
      cache = true,
      userId,
    } = options;

    const modelName = this.models[model];
    const startTime = Date.now();

    // Check cache if enabled
    if (cache) {
      const cachedResponse = await this.checkCache(prompt, modelName);
      if (cachedResponse) {
        this.logger.debug(
          `Cache hit for prompt hash: ${this.hashPrompt(prompt)}`,
        );
        return cachedResponse;
      }
    }

    // Check rate limit if userId provided
    if (userId) {
      await this.checkRateLimit(userId);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });

      const responseTime = Date.now() - startTime;
      const firstChoice = completion.choices[0];
      const content = firstChoice?.message.content || '';
      const usage = completion.usage || {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      const cost = this.calculateCost(
        modelName,
        usage.prompt_tokens,
        usage.completion_tokens,
      );

      // Track usage if userId provided
      if (userId) {
        await this.trackUsage(
          userId,
          modelName,
          usage,
          cost,
          responseTime,
          'success',
        );
      }

      // Cache response if enabled
      if (cache) {
        await this.cacheResponse(
          prompt,
          modelName,
          content,
          usage.total_tokens,
          cost,
        );
      }

      return {
        content,
        tokens: usage.total_tokens,
        responseTime,
        cached: false,
        cost,
      };
    } catch (error: any) {
      this.logger.error('OpenAI API error:', error);

      // Track error if userId provided
      if (userId) {
        await this.trackUsage(
          userId,
          modelName,
          null,
          0,
          Date.now() - startTime,
          'error',
          error?.message,
        );
      }

      throw new Error('AI service temporarily unavailable');
    }
  }

  async analyzeText(
    text: string,
    analysisType: 'sentiment' | 'themes' | 'bias',
    userId?: string,
  ): Promise<any> {
    const prompts = {
      sentiment: `Analyze the sentiment of the following text. Return a JSON object with overall sentiment (positive/negative/neutral) and confidence score (0-1):\n\n${text}`,
      themes: `Extract the main themes from the following text. Return a JSON array of themes with descriptions:\n\n${text}`,
      bias: `Analyze the following text for potential biases. Return a JSON object with identified biases and suggestions for improvement:\n\n${text}`,
    };

    const response = await this.generateCompletion(prompts[analysisType], {
      model: 'smart',
      temperature: 0.3,
      maxTokens: 1500,
      userId,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return response.content;
    }
  }

  private async checkCache(
    prompt: string,
    model: string,
  ): Promise<AIResponse | null> {
    const cacheKey = this.getCacheKey(prompt, model);

    const cached = await this.prisma.aICache.findFirst({
      where: {
        cacheKey,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (cached) {
      // Update hit count and last accessed
      await this.prisma.aICache.update({
        where: { id: cached.id },
        data: {
          hitCount: cached.hitCount + 1,
          lastAccessedAt: new Date(),
        },
      });

      const response = JSON.parse(cached.response);
      return {
        content: response.content,
        tokens: cached.tokensSaved,
        responseTime: 0,
        cached: true,
        cost: 0,
      };
    }

    return null;
  }

  private async cacheResponse(
    prompt: string,
    model: string,
    response: string,
    tokens: number,
    cost: number,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(prompt, model);
    const promptHash = this.hashPrompt(prompt);
    const ttl = this.configService.get<number>('AI_CACHE_TTL_SECONDS') || 3600;

    try {
      await this.prisma.aICache.create({
        data: {
          cacheKey,
          promptHash,
          model,
          response: JSON.stringify({ content: response }),
          tokensSaved: tokens,
          costSaved: cost,
          hitCount: 0,
          expiresAt: new Date(Date.now() + ttl * 1000),
        },
      });
    } catch (error: any) {
      // Ignore cache errors - caching is optional
      this.logger.warn('Failed to cache AI response:', error?.message);
    }
  }

  private async checkRateLimit(userId?: string): Promise<void> {
    // Skip rate limiting if no userId provided (e.g., public endpoints in development)
    if (!userId) {
      return;
    }

    const limit = this.configService.get<number>('AI_RATE_LIMIT_PER_MIN') || 10;
    const windowStart = new Date(Date.now() - 60000); // 1 minute ago
    const windowEnd = new Date();

    // Check existing rate limit
    const rateLimit = await this.prisma.aIRateLimit.findFirst({
      where: {
        userId,
        windowStart: {
          gte: windowStart,
        },
        windowEnd: {
          lte: windowEnd,
        },
      },
    });

    if (rateLimit && rateLimit.requestCount >= limit) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Create or update rate limit
    if (rateLimit) {
      await this.prisma.aIRateLimit.update({
        where: { id: rateLimit.id },
        data: { requestCount: rateLimit.requestCount + 1 },
      });
    } else {
      await this.prisma.aIRateLimit.create({
        data: {
          userId,
          windowStart,
          windowEnd,
          requestCount: 1,
          maxRequests: limit,
        },
      });
    }
  }

  private async trackUsage(
    userId: string,
    model: string,
    usage: any,
    cost: number,
    responseTime: number,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.aIUsage.create({
        data: {
          userId,
          endpoint: 'openai.generateCompletion',
          model,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          cost,
          responseTimeMs: Math.round(responseTime),
          status,
          errorMessage,
        },
      });

      // Check budget limit
      await this.checkBudgetLimit(userId);
    } catch (error: any) {
      this.logger.error('Failed to track AI usage:', error);
    }
  }

  private async checkBudgetLimit(userId: string): Promise<void> {
    const budgetLimit = await this.prisma.aIBudgetLimit.findUnique({
      where: { userId },
    });

    if (!budgetLimit || !budgetLimit.isActive) {
      return;
    }

    // Check daily usage
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyUsage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
      _sum: { cost: true },
    });

    if ((dailyUsage._sum.cost || 0) > budgetLimit.dailyLimitUsd) {
      throw new Error('Daily AI budget limit exceeded');
    }

    // Check monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    if ((monthlyUsage._sum.cost || 0) > budgetLimit.monthlyLimitUsd) {
      throw new Error('Monthly AI budget limit exceeded');
    }

    // Check alert threshold
    const monthlyPercentage =
      (monthlyUsage._sum.cost || 0) / budgetLimit.monthlyLimitUsd;
    if (monthlyPercentage > budgetLimit.alertThreshold) {
      this.logger.warn(
        `User ${userId} has reached ${(monthlyPercentage * 100).toFixed(1)}% of monthly AI budget`,
      );
    }
  }

  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const rates =
      this.costPerToken[model as keyof typeof this.costPerToken] ||
      this.costPerToken['gpt-3.5-turbo-0125'];
    return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
  }

  private getCacheKey(prompt: string, model: string): string {
    return `${model}:${this.hashPrompt(prompt).substring(0, 32)}`;
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
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
}
