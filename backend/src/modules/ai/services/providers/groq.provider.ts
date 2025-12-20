/**
 * Groq AI Provider
 * Phase 10.190: Netflix-Grade Unified AI Service
 *
 * Groq provides FREE access to Llama 3.3 70B and other models.
 * Primary provider due to zero cost and excellent performance.
 *
 * Features:
 * - 100% FREE tier
 * - Fast inference (~500ms)
 * - High quality (comparable to GPT-3.5)
 * - OpenAI-compatible API
 *
 * Rate Limits (Free Tier):
 * - 30 requests per minute
 * - 14,400 requests per day
 * - 500,000 tokens per day
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
 * Groq model configurations
 */
const GROQ_MODELS = {
  fast: 'llama-3.3-70b-versatile', // Best balance of speed and quality
  smart: 'llama-3.3-70b-versatile', // Same model, Groq doesn't have a "smarter" free option
} as const;

/**
 * Default Groq provider configuration
 */
const DEFAULT_GROQ_CONFIG: ProviderConfig = {
  apiKeyEnvVar: 'GROQ_API_KEY',
  baseUrl: 'https://api.groq.com/openai/v1',
  defaultTimeoutMs: 30000, // 30 seconds
  maxRetries: 2,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60000, // 1 minute
};

@Injectable()
export class GroqProvider extends BaseAIProvider {
  readonly name = 'Groq';
  readonly costPer1MInputTokens = 0; // FREE
  readonly costPer1MOutputTokens = 0; // FREE
  readonly priority = 1; // Highest priority (cheapest)

  private client: OpenAI | null = null;
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    super('Groq', DEFAULT_GROQ_CONFIG);

    this.apiKey = this.configService.get<string>(DEFAULT_GROQ_CONFIG.apiKeyEnvVar);

    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: DEFAULT_GROQ_CONFIG.baseUrl,
        timeout: DEFAULT_GROQ_CONFIG.defaultTimeoutMs,
        maxRetries: DEFAULT_GROQ_CONFIG.maxRetries,
      });
      this.logger.log('Groq provider initialized (FREE tier)');
    } else {
      this.logger.warn('Groq API key not configured - provider unavailable');
    }
  }

  /**
   * Check if Groq is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate completion using Groq
   */
  async generateCompletion(
    prompt: string,
    options: AICompletionOptions = {},
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Groq client not initialized - API key not configured');
    }

    // Check circuit breaker
    if (!this.canMakeRequest()) {
      throw new Error(`Groq circuit breaker is open - service temporarily unavailable`);
    }

    const startTime = Date.now();
    const model = GROQ_MODELS[options.model ?? 'fast'];
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
        model,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 500,
      };

      // Enable JSON mode if requested (Groq supports via OpenAI-compatible API)
      if (options.jsonMode) {
        requestOptions.response_format = { type: 'json_object' };
      }

      // Create completion with timeout (CRITICAL: clear timer to prevent memory leak)
      const completionPromise = this.client.chat.completions.create(requestOptions);

      // Race against timeout with proper cleanup
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Groq request timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      try {
        const completion = await Promise.race([completionPromise, timeoutPromise]);
        return this.processSuccessfulCompletion(completion, prompt, model, startTime);
      } finally {
        // CRITICAL: Always clear timeout to prevent memory leak
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      const responseTimeMs = Date.now() - startTime;
      this.recordFailure();

      // Parse error for rate limiting
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for rate limit
      if (this.isRateLimitError(error)) {
        const retryAfter = this.parseRetryAfter(errorMessage);
        this.logger.warn(
          `Groq rate limit hit - retry after ${retryAfter}s (${responseTimeMs}ms)`,
        );
        throw new Error(`Groq rate limit exceeded - retry after ${retryAfter}s`);
      }

      this.logger.error(`Groq completion failed: ${errorMessage} (${responseTimeMs}ms)`);
      throw error;
    }
  }

  /**
   * Process successful completion response
   */
  private processSuccessfulCompletion(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    prompt: string,
    model: string,
    startTime: number,
  ): AIResponse {
    const responseTimeMs = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content ?? '';
    const inputTokens = completion.usage?.prompt_tokens ?? this.estimateTokens(prompt);
    const outputTokens = completion.usage?.completion_tokens ?? this.estimateTokens(content);
    const totalTokens = completion.usage?.total_tokens ?? (inputTokens + outputTokens);
    const cost = this.calculateCost(inputTokens, outputTokens); // Always 0 for Groq

    // Record success
    this.recordSuccess(responseTimeMs, cost);

    this.logger.debug(
      `Groq completion: ${totalTokens} tokens in ${responseTimeMs}ms (FREE)`,
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
      model,
    };
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
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 429) return true;
      if (errorObj.message?.includes('429')) return true;
      if (errorObj.message?.toLowerCase().includes('rate limit')) return true;
    }
    return false;
  }

  /**
   * Parse retry-after value from error message
   */
  private parseRetryAfter(errorMessage: string): number {
    // Groq format: "Please try again in 6m54.72s"
    const match = errorMessage.match(/try again in (\d+)m([\d.]+)s/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      return Math.ceil(minutes * 60 + seconds);
    }

    // Default: 60 seconds
    return 60;
  }
}
