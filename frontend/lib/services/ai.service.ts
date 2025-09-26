/**
 * Core AI Service for Phase 6.86
 * Enterprise-grade OpenAI integration with error handling, retry logic, and cost tracking
 */

// import OpenAI from 'openai'; // Reserved for future OpenAI integration
import {
  AIRequest,
  AIResponse,
  AIError,
  AIUsage,
  AIBudget,
} from '@/lib/types/ai.types';

// Configuration
const AI_CONFIG = {
  models: {
    fast: 'gpt-3.5-turbo-0125' as const,
    smart: 'gpt-4-turbo-preview' as const,
    vision: 'gpt-4-vision-preview' as const,
  },
  limits: {
    maxRetries: 3,
    requestsPerMinute: 10,
    dailyBudgetUSD: 10,
    maxTokensDefault: 2000,
  },
  costs: {
    'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
  },
  cache: {
    ttl: 300, // 5 minutes in seconds
    maxSize: 100, // max number of cached responses
  },
};

// Simple in-memory cache (replace with Redis in production)
class SimpleCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any, ttl: number): void {
    // Limit cache size
    if (this.cache.size >= AI_CONFIG.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheKey(prompt: string, model: string): string {
    const hash = Buffer.from(`${model}:${prompt}`).toString('base64');
    return hash.substring(0, 32);
  }
}

// Rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly window: number; // in milliseconds

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.window);

    if (this.requests.length >= this.limit) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  timeUntilNextRequest(): number {
    if (this.requests.length < this.limit) return 0;

    const oldestRequest = Math.min(...this.requests);
    const timeElapsed = Date.now() - oldestRequest;
    return Math.max(0, this.window - timeElapsed);
  }
}

// Cost tracker
class CostTracker {
  private usage: AIUsage[] = [];
  private dailyUsage: Map<string, number> = new Map();

  trackUsage(usage: AIUsage): void {
    this.usage.push(usage);

    const today = new Date().toDateString();
    const current = this.dailyUsage.get(today) || 0;
    this.dailyUsage.set(today, current + usage.cost);
  }

  getDailyUsage(): number {
    const today = new Date().toDateString();
    return this.dailyUsage.get(today) || 0;
  }

  getBudget(): AIBudget {
    const dailyUsed = this.getDailyUsage();
    const dailyLimit = AI_CONFIG.limits.dailyBudgetUSD;

    return {
      daily: dailyLimit,
      monthly: dailyLimit * 30,
      used: dailyUsed,
      remaining: dailyLimit - dailyUsed,
      alerts: [
        {
          threshold: 0.5,
          message: '50% of daily budget used',
          triggered: dailyUsed >= dailyLimit * 0.5,
        },
        {
          threshold: 0.8,
          message: '80% of daily budget used',
          triggered: dailyUsed >= dailyLimit * 0.8,
        },
        {
          threshold: 1.0,
          message: 'Daily budget exceeded',
          triggered: dailyUsed >= dailyLimit,
        },
      ],
    };
  }

  calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const rates = AI_CONFIG.costs[model as keyof typeof AI_CONFIG.costs];
    if (!rates) return 0;

    return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
  }
}

// Main AI Service
export class AIService {
  private static instance: AIService;
  // private _openai: OpenAI | null = null; // Reserved for future OpenAI integration
  private cache = new SimpleCache();
  private rateLimiter = new RateLimiter(AI_CONFIG.limits.requestsPerMinute);
  private costTracker = new CostTracker();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;

    // NO LONGER USING OPENAI DIRECTLY IN BROWSER
    // All OpenAI calls now go through our secure backend API
    // This prevents API key exposure

    this.isInitialized = true;
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.isInitialized) {
      throw this.createError(
        'NOT_INITIALIZED',
        'AI Service not initialized',
        false
      );
    }

    // Check budget
    const budget = this.costTracker.getBudget();
    if (budget.remaining <= 0) {
      throw this.createError(
        'BUDGET_EXCEEDED',
        'Daily AI budget exceeded',
        false
      );
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.timeUntilNextRequest();
      throw this.createError(
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        true
      );
    }

    // Check cache if enabled
    const cacheKey = this.cache.getCacheKey(request.prompt, request.model);
    if (request.cache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // SECURE BACKEND API CALL - No OpenAI keys in frontend
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= AI_CONFIG.limits.maxRetries; attempt++) {
      try {
        // Get auth token from session/storage
        const authToken = await this.getAuthToken();

        // Call our backend API instead of OpenAI directly
        const response = await fetch('/api/ai/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            prompt: request.prompt,
            model: request.model,
            temperature: request.temperature ?? 0.7,
            maxTokens: request.maxTokens ?? AI_CONFIG.limits.maxTokensDefault,
            context: request.context,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw this.createError(
              'UNAUTHORIZED',
              'Authentication required',
              false
            );
          }
          if (response.status === 429) {
            throw this.createError('RATE_LIMITED', 'Rate limit exceeded', true);
          }
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Track usage locally
        this.costTracker.trackUsage({
          userId: 'current-user', // Get from auth context
          endpoint: 'completion',
          model: request.model || 'gpt-3.5-turbo',
          inputTokens: data.inputTokens || 0,
          outputTokens: data.outputTokens || 0,
          cost: data.cost || 0,
          timestamp: new Date(),
          cached: false,
        });

        const aiResponse: AIResponse = {
          content: data.content,
          tokens: data.tokens,
          cost: data.cost,
          responseTime: Date.now() - startTime,
          cached: false,
        };

        // Cache the response
        if (request.cache !== false) {
          this.cache.set(cacheKey, aiResponse, AI_CONFIG.cache.ttl);
        }

        return aiResponse;
      } catch (error: any) {
        lastError = error;

        // Don't retry on auth errors
        if (error?.code === 'UNAUTHORIZED') {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < AI_CONFIG.limits.maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    // All retries failed
    throw this.createError(
      'API_ERROR',
      lastError?.message || 'Failed to generate completion after retries',
      true,
      lastError
    );
  }

  private async getAuthToken(): Promise<string> {
    // In production, get from NextAuth session or secure cookie
    // For now, return a placeholder
    if (typeof window !== 'undefined') {
      // Client-side: get from session storage or cookie
      return sessionStorage.getItem('auth-token') || '';
    }
    return '';
  }

  async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
    const request: AIRequest = {
      prompt: `${prompt}\n\nReturn your response as valid JSON only, with no additional text or formatting.`,
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
    };

    const response = await this.generateCompletion(request);

    try {
      const json = JSON.parse(response.content);

      // Validate against schema if provided
      if (schema) {
        // In production, use Zod or similar for validation
        // For now, just return the parsed JSON
      }

      return json as T;
    } catch (error) {
      throw this.createError(
        'PARSE_ERROR',
        'Failed to parse AI response as JSON',
        false,
        error
      );
    }
  }

  // Utility methods
  getBudget(): AIBudget {
    return this.costTracker.getBudget();
  }

  clearCache(): void {
    this.cache.clear();
  }

  private createError(
    code: string,
    message: string,
    retry: boolean,
    details?: any
  ): AIError {
    return { code, message, retry, details };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export utility functions
export async function initializeAI(): Promise<void> {
  // No API key needed - backend handles authentication
  aiService.initialize();
}

export async function generateAIResponse(
  prompt: string,
  options?: Partial<AIRequest>
): Promise<AIResponse> {
  return aiService.generateCompletion({
    prompt,
    model: 'gpt-3.5-turbo',
    ...options,
  });
}

export async function generateSmartResponse(
  prompt: string,
  options?: Partial<AIRequest>
): Promise<AIResponse> {
  return aiService.generateCompletion({
    prompt,
    model: 'gpt-4',
    ...options,
  });
}

export function getAIBudget(): AIBudget {
  return aiService.getBudget();
}

export function clearAICache(): void {
  aiService.clearCache();
}
