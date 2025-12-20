/**
 * OpenAI Provider
 * Phase 10.190: Netflix-Grade Unified AI Service
 *
 * OpenAI GPT models as fallback when Groq and Gemini are unavailable.
 * Most expensive option but highly reliable.
 *
 * Features:
 * - High reliability
 * - Best quality (GPT-4)
 * - Proven performance
 * - Last resort fallback
 *
 * Pricing (GPT-3.5 Turbo):
 * - Input: $0.50 per 1M tokens
 * - Output: $1.50 per 1M tokens
 *
 * Pricing (GPT-4 Turbo):
 * - Input: $10.00 per 1M tokens
 * - Output: $30.00 per 1M tokens
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BaseAIProvider } from './base-ai-provider';
import {
  AICompletionOptions,
  AIResponse,
  ProviderConfig,
} from './ai-provider.interface';

/**
 * OpenAI model configurations
 */
const OPENAI_MODELS = {
  fast: 'gpt-3.5-turbo-0125', // Cheap, fast
  smart: 'gpt-4-turbo-preview', // Expensive, smart
} as const;

/**
 * Cost per model
 */
const OPENAI_COSTS = {
  'gpt-3.5-turbo-0125': { input: 0.5, output: 1.5 }, // Per 1M tokens
  'gpt-4-turbo-preview': { input: 10.0, output: 30.0 }, // Per 1M tokens
} as const;

/**
 * Default OpenAI provider configuration
 */
const DEFAULT_OPENAI_CONFIG: ProviderConfig = {
  apiKeyEnvVar: 'OPENAI_API_KEY',
  defaultTimeoutMs: 60000, // 60 seconds (OpenAI can be slow)
  maxRetries: 2,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60000, // 1 minute
};

@Injectable()
export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'OpenAI';
  // Default costs for GPT-3.5 (used for fast model)
  readonly costPer1MInputTokens = 0.5;
  readonly costPer1MOutputTokens = 1.5;
  readonly priority = 3; // Lowest priority (most expensive)

  private client: OpenAI | null = null;
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    super('OpenAI', DEFAULT_OPENAI_CONFIG);

    this.apiKey = this.configService.get<string>(DEFAULT_OPENAI_CONFIG.apiKeyEnvVar);

    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        timeout: DEFAULT_OPENAI_CONFIG.defaultTimeoutMs,
        maxRetries: DEFAULT_OPENAI_CONFIG.maxRetries,
      });
      this.logger.log('OpenAI provider initialized (fallback)');
    } else {
      this.logger.warn('OpenAI API key not configured - provider unavailable');
    }
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate completion using OpenAI
   */
  async generateCompletion(
    prompt: string,
    options: AICompletionOptions = {},
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key not configured');
    }

    // Check circuit breaker
    if (!this.canMakeRequest()) {
      throw new Error(`OpenAI circuit breaker is open - service temporarily unavailable`);
    }

    const startTime = Date.now();
    const modelType = options.model ?? 'fast';
    const modelName = OPENAI_MODELS[modelType];
    const timeoutMs = options.timeoutMs ?? this.config.defaultTimeoutMs;

    try {
      // Phase 10.185: Build messages array with optional system prompt
      // Netflix-grade: System prompts enable context-aware AI behavior
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Phase 10.195: Build request with optional JSON mode
      const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model: modelName,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 500,
      };

      // Enable JSON mode if requested
      if (options.jsonMode) {
        requestOptions.response_format = { type: 'json_object' };
      }

      // Create completion with timeout (CRITICAL: clear timer to prevent memory leak)
      const completionPromise = this.client.chat.completions.create(requestOptions);

      // Race against timeout with proper cleanup
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`OpenAI request timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      try {
        const completion = await Promise.race([completionPromise, timeoutPromise]);

        const responseTimeMs = Date.now() - startTime;
        const content = completion.choices[0]?.message?.content ?? '';

        // Extract token counts
        const inputTokens = completion.usage?.prompt_tokens ?? this.estimateTokens(prompt);
        const outputTokens =
          completion.usage?.completion_tokens ?? this.estimateTokens(content);
        const totalTokens = completion.usage?.total_tokens ?? (inputTokens + outputTokens);

        // Calculate cost based on model
        const cost = this.calculateModelCost(modelName, inputTokens, outputTokens);

        // Record success
        this.recordSuccess(responseTimeMs, cost);

        this.logger.debug(
          `OpenAI completion: ${totalTokens} tokens in ${responseTimeMs}ms ($${cost.toFixed(6)})`,
        );

        return {
          content,
          tokens: totalTokens,
          inputTokens,
          outputTokens,
          responseTimeMs,
          cached: false,
          cost,
          provider: this.name,
          model: modelName,
        };
      } finally {
        // CRITICAL: Always clear timeout to prevent memory leak
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      const responseTimeMs = Date.now() - startTime;
      this.recordFailure();

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for rate limit
      if (this.isRateLimitError(error)) {
        this.logger.warn(`OpenAI rate limit hit (${responseTimeMs}ms)`);
        throw new Error('OpenAI rate limit exceeded - try again later');
      }

      // Check for insufficient quota
      if (this.isQuotaError(error)) {
        this.logger.warn(`OpenAI quota exceeded (${responseTimeMs}ms)`);
        throw new Error('OpenAI quota exceeded - check your billing');
      }

      this.logger.error(`OpenAI completion failed: ${errorMessage} (${responseTimeMs}ms)`);
      throw error;
    }
  }

  /**
   * Calculate cost based on specific model
   */
  private calculateModelCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const modelKey = model as keyof typeof OPENAI_COSTS;
    const costs = OPENAI_COSTS[modelKey] ?? OPENAI_COSTS['gpt-3.5-turbo-0125'];

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return inputCost + outputCost;
  }

  /**
   * Estimate token count from text length
   * Approximation: ~4 characters per token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const errorObj = error as { status?: number; message?: string; code?: string };
      if (errorObj.status === 429) return true;
      if (errorObj.code === 'rate_limit_exceeded') return true;
      if (errorObj.message?.includes('429')) return true;
      if (errorObj.message?.toLowerCase().includes('rate limit')) return true;
    }
    return false;
  }

  /**
   * Check if error is a quota exceeded error
   */
  private isQuotaError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const errorObj = error as { message?: string; code?: string };
      if (errorObj.code === 'insufficient_quota') return true;
      if (errorObj.message?.toLowerCase().includes('quota')) return true;
      if (errorObj.message?.toLowerCase().includes('billing')) return true;
    }
    return false;
  }
}
