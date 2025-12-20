/**
 * Gemini AI Provider
 * Phase 10.190: Netflix-Grade Unified AI Service
 *
 * Google's Gemini provides 80% cheaper AI compared to OpenAI GPT-3.5.
 * Secondary provider after Groq (FREE) for cost optimization.
 *
 * Features:
 * - 80% cheaper than OpenAI
 * - Fast inference (~800ms)
 * - Good quality
 * - Free tier available (15 requests/minute)
 *
 * Pricing (Gemini 1.5 Flash):
 * - Input: $0.075 per 1M tokens
 * - Output: $0.30 per 1M tokens
 *
 * Note: Requires @google/generative-ai package
 * Install: npm install @google/generative-ai
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAIProvider } from './base-ai-provider';
import {
  AICompletionOptions,
  AIResponse,
  ProviderConfig,
} from './ai-provider.interface';

/**
 * Gemini model configurations
 */
const GEMINI_MODELS = {
  fast: 'gemini-1.5-flash', // Fast and cheap
  smart: 'gemini-1.5-pro', // Better quality, more expensive
} as const;

/**
 * Default Gemini provider configuration
 */
const DEFAULT_GEMINI_CONFIG: ProviderConfig = {
  apiKeyEnvVar: 'GEMINI_API_KEY',
  defaultTimeoutMs: 30000, // 30 seconds
  maxRetries: 2,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60000, // 1 minute
};

/**
 * Gemini SDK types (dynamic import)
 */
interface GeminiGenerativeModel {
  generateContent(request: {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      responseMimeType?: string; // Phase 10.195: JSON mode support
    };
  }): Promise<{
    response: {
      text(): string;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
  }>;
}

interface GeminiGenerativeAI {
  getGenerativeModel(options: { model: string }): GeminiGenerativeModel;
}

@Injectable()
export class GeminiProvider extends BaseAIProvider {
  readonly name = 'Gemini';
  readonly costPer1MInputTokens = 0.075; // $0.075 per 1M input tokens
  readonly costPer1MOutputTokens = 0.30; // $0.30 per 1M output tokens
  readonly priority = 2; // Second priority (after Groq)

  private client: GeminiGenerativeAI | null = null;
  private readonly apiKey: string | undefined;
  private initializationError: string | null = null;
  private initializationAttempted = false; // Track if we've tried to initialize

  constructor(private readonly configService: ConfigService) {
    super('Gemini', DEFAULT_GEMINI_CONFIG);

    this.apiKey = this.configService.get<string>(DEFAULT_GEMINI_CONFIG.apiKeyEnvVar);

    if (this.apiKey) {
      // Lazy initialize client when first needed
      this.initializeClient().catch((error) => {
        this.initializationError = error.message;
        this.logger.warn(`Gemini initialization deferred: ${error.message}`);
      });
    } else {
      this.logger.warn('Gemini API key not configured - provider unavailable');
    }
  }

  /**
   * Initialize Gemini client (lazy load SDK)
   */
  private async initializeClient(): Promise<void> {
    if (this.client) return;
    if (!this.apiKey) return;
    if (this.initializationAttempted) return; // Don't retry failed init

    this.initializationAttempted = true;

    try {
      // Dynamic import to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const geminiModule = await (Function('return import("@google/generative-ai")')() as Promise<{ GoogleGenerativeAI: new (apiKey: string) => GeminiGenerativeAI }>);
      this.client = new geminiModule.GoogleGenerativeAI(this.apiKey);
      this.logger.log('Gemini provider initialized (80% cheaper than OpenAI)');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.initializationError = message;
      this.logger.warn(
        `Gemini SDK not available: ${message}. Install with: npm install @google/generative-ai`,
      );
    }
  }

  /**
   * Check if Gemini is available
   * FIXED: Only return true if initialization succeeded (not just attempted)
   */
  isAvailable(): boolean {
    // If no API key, definitely not available
    if (!this.apiKey) return false;

    // If we have a client, we're available
    if (this.client) return true;

    // If initialization was attempted and failed, not available
    if (this.initializationAttempted && this.initializationError) return false;

    // If initialization hasn't been attempted yet, optimistically return true
    // The actual init will happen on first use
    if (!this.initializationAttempted) return true;

    return false;
  }

  /**
   * Generate completion using Gemini
   */
  async generateCompletion(
    prompt: string,
    options: AICompletionOptions = {},
  ): Promise<AIResponse> {
    // Ensure client is initialized
    if (!this.client) {
      await this.initializeClient();
    }

    if (!this.client) {
      throw new Error(
        this.initializationError ??
          'Gemini client not initialized - install @google/generative-ai',
      );
    }

    // Check circuit breaker
    if (!this.canMakeRequest()) {
      throw new Error(`Gemini circuit breaker is open - service temporarily unavailable`);
    }

    const startTime = Date.now();
    const modelName = GEMINI_MODELS[options.model ?? 'fast'];
    const timeoutMs = options.timeoutMs ?? this.config.defaultTimeoutMs;

    try {
      const model = this.client.getGenerativeModel({ model: modelName });

      // Phase 10.185: Build contents array with optional system prompt
      // Netflix-grade: Gemini uses 'model' role for system-like instructions
      // Note: Gemini doesn't have a true "system" role, we prepend as model context
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (options.systemPrompt) {
        // Gemini convention: Use 'user' for system context followed by 'model' acknowledgment
        contents.push({ role: 'user', parts: [{ text: `[System Instructions]\n${options.systemPrompt}` }] });
        contents.push({ role: 'model', parts: [{ text: 'I understand. I will follow these instructions.' }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      // Phase 10.195: Build generation config with optional JSON mode
      const generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        responseMimeType?: string;
      } = {
        temperature: options.temperature ?? 0.1,
        maxOutputTokens: options.maxTokens ?? 500,
      };

      // Enable JSON mode if requested (Gemini uses responseMimeType)
      if (options.jsonMode) {
        generationConfig.responseMimeType = 'application/json';
      }

      // Create completion with timeout
      const completionPromise = model.generateContent({
        contents,
        generationConfig,
      });

      // Race against timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      const result = await Promise.race([completionPromise, timeoutPromise]);

      const responseTimeMs = Date.now() - startTime;
      const content = result.response.text();

      // Extract token counts
      const usage = result.response.usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? this.estimateTokens(prompt);
      const outputTokens = usage?.candidatesTokenCount ?? this.estimateTokens(content);
      const totalTokens = usage?.totalTokenCount ?? (inputTokens + outputTokens);
      const cost = this.calculateCost(inputTokens, outputTokens);

      // Record success
      this.recordSuccess(responseTimeMs, cost);

      this.logger.debug(
        `Gemini completion: ${totalTokens} tokens in ${responseTimeMs}ms ($${cost.toFixed(6)})`,
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
    } catch (error: unknown) {
      const responseTimeMs = Date.now() - startTime;
      this.recordFailure();

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for rate limit
      if (this.isRateLimitError(error)) {
        this.logger.warn(`Gemini rate limit hit (${responseTimeMs}ms)`);
        throw new Error('Gemini rate limit exceeded - try again later');
      }

      // Check for quota exceeded
      if (this.isQuotaError(error)) {
        this.logger.warn(`Gemini quota exceeded (${responseTimeMs}ms)`);
        throw new Error('Gemini quota exceeded - check your billing');
      }

      this.logger.error(`Gemini completion failed: ${errorMessage} (${responseTimeMs}ms)`);
      throw error;
    }
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
      if (errorObj.message?.toLowerCase().includes('quota')) return true;
    }
    return false;
  }

  /**
   * Check if error is a quota exceeded error
   */
  private isQuotaError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const errorObj = error as { message?: string };
      if (errorObj.message?.toLowerCase().includes('quota')) return true;
      if (errorObj.message?.toLowerCase().includes('billing')) return true;
    }
    return false;
  }
}
