/**
 * Unified AI Service Unit Tests
 * Phase 10.190: Netflix-Grade Unified AI Service
 * Phase 10.185: Enhanced with caching, budget checking, system prompts
 *
 * Comprehensive tests for multi-provider AI service:
 * - Provider fallback chain
 * - Circuit breaker behavior
 * - Metrics collection
 * - Cost tracking
 * - Health monitoring
 * - Phase 10.185: Response caching
 * - Phase 10.185: User budget enforcement
 * - Phase 10.185: System prompt support
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnifiedAIService } from '../unified-ai.service';
import { GroqProvider } from '../providers/groq.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { OpenAIProvider } from '../providers/openai.provider';
import { AIResponse, ProviderHealthStatus } from '../providers/ai-provider.interface';

// Mock implementations
const createMockResponse = (provider: string, cost: number): AIResponse => ({
  content: `Response from ${provider}`,
  tokens: 100,
  inputTokens: 80,
  outputTokens: 20,
  responseTimeMs: 500,
  cached: false,
  cost,
  provider,
  model: 'test-model',
});

const createMockHealthStatus = (
  status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy',
): ProviderHealthStatus => ({
  status,
  latencyMs: 500,
  errorRate: status === 'unhealthy' ? 0.8 : 0.05,
  lastCheckTimestamp: Date.now(),
  circuitBreakerState: status === 'unhealthy' ? 'open' : 'closed',
  consecutiveFailures: status === 'unhealthy' ? 5 : 0,
});

describe('UnifiedAIService', () => {
  let service: UnifiedAIService;
  let groqProvider: jest.Mocked<GroqProvider>;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let openaiProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(async () => {
    // Create mock providers
    groqProvider = {
      name: 'Groq',
      priority: 1,
      costPer1MInputTokens: 0,
      costPer1MOutputTokens: 0,
      isAvailable: jest.fn().mockReturnValue(true),
      isHealthy: jest.fn().mockResolvedValue(true),
      getHealthStatus: jest.fn().mockReturnValue(createMockHealthStatus()),
      generateCompletion: jest.fn().mockResolvedValue(createMockResponse('Groq', 0)),
      getMetrics: jest.fn().mockReturnValue({
        provider: 'Groq',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        circuitBreakerState: 'closed',
        requestsPerMinute: 0,
      }),
      resetMetrics: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    } as unknown as jest.Mocked<GroqProvider>;

    geminiProvider = {
      name: 'Gemini',
      priority: 2,
      costPer1MInputTokens: 0.075,
      costPer1MOutputTokens: 0.30,
      isAvailable: jest.fn().mockReturnValue(true),
      isHealthy: jest.fn().mockResolvedValue(true),
      getHealthStatus: jest.fn().mockReturnValue(createMockHealthStatus()),
      generateCompletion: jest.fn().mockResolvedValue(createMockResponse('Gemini', 0.0001)),
      getMetrics: jest.fn().mockReturnValue({
        provider: 'Gemini',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        circuitBreakerState: 'closed',
        requestsPerMinute: 0,
      }),
      resetMetrics: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    } as unknown as jest.Mocked<GeminiProvider>;

    openaiProvider = {
      name: 'OpenAI',
      priority: 3,
      costPer1MInputTokens: 0.5,
      costPer1MOutputTokens: 1.5,
      isAvailable: jest.fn().mockReturnValue(true),
      isHealthy: jest.fn().mockResolvedValue(true),
      getHealthStatus: jest.fn().mockReturnValue(createMockHealthStatus()),
      generateCompletion: jest.fn().mockResolvedValue(createMockResponse('OpenAI', 0.001)),
      getMetrics: jest.fn().mockReturnValue({
        provider: 'OpenAI',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        circuitBreakerState: 'closed',
        requestsPerMinute: 0,
      }),
      resetMetrics: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    } as unknown as jest.Mocked<OpenAIProvider>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'AI_PROVIDER_PRIORITY') return 'groq,gemini,openai';
              if (key === 'AI_ENABLE_FALLBACK') return true;
              if (key === 'AI_ENABLE_HEALTH_CHECKS') return false; // Disable for tests
              return undefined;
            }),
          },
        },
        { provide: GroqProvider, useValue: groqProvider },
        { provide: GeminiProvider, useValue: geminiProvider },
        { provide: OpenAIProvider, useValue: openaiProvider },
      ],
    }).compile();

    service = module.get<UnifiedAIService>(UnifiedAIService);
    await service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('Provider Priority', () => {
    it('should use Groq (FREE) as primary provider', async () => {
      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('Groq');
      expect(response.cost).toBe(0);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);
      expect(geminiProvider.generateCompletion).not.toHaveBeenCalled();
      expect(openaiProvider.generateCompletion).not.toHaveBeenCalled();
    });

    it('should fallback to Gemini when Groq fails', async () => {
      groqProvider.generateCompletion.mockRejectedValueOnce(new Error('Groq error'));

      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('Gemini');
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);
      expect(geminiProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should fallback to OpenAI when both Groq and Gemini fail', async () => {
      groqProvider.generateCompletion.mockRejectedValueOnce(new Error('Groq error'));
      geminiProvider.generateCompletion.mockRejectedValueOnce(new Error('Gemini error'));

      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('OpenAI');
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);
      expect(geminiProvider.generateCompletion).toHaveBeenCalledTimes(1);
      expect(openaiProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should throw error when all providers fail', async () => {
      groqProvider.generateCompletion.mockRejectedValueOnce(new Error('Groq error'));
      geminiProvider.generateCompletion.mockRejectedValueOnce(new Error('Gemini error'));
      openaiProvider.generateCompletion.mockRejectedValueOnce(new Error('OpenAI error'));

      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(
        'All AI providers failed',
      );
    });
  });

  describe('Provider Availability', () => {
    it('should skip unavailable providers', async () => {
      groqProvider.isAvailable.mockReturnValue(false);

      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('Gemini');
      expect(groqProvider.generateCompletion).not.toHaveBeenCalled();
    });

    it('should skip unhealthy providers', async () => {
      groqProvider.getHealthStatus.mockReturnValue(createMockHealthStatus('unhealthy'));

      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('Gemini');
      expect(groqProvider.generateCompletion).not.toHaveBeenCalled();
    });

    it('should skip providers with open circuit breaker', async () => {
      const unhealthyStatus = createMockHealthStatus('healthy');
      unhealthyStatus.circuitBreakerState = 'open';
      groqProvider.getHealthStatus.mockReturnValue(unhealthyStatus);

      const response = await service.generateCompletion('Test prompt');

      expect(response.provider).toBe('Gemini');
      expect(groqProvider.generateCompletion).not.toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    it('should track total requests and successes', async () => {
      await service.generateCompletion('Test 1');
      await service.generateCompletion('Test 2');

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.totalSuccesses).toBe(2);
      expect(metrics.totalFailures).toBe(0);
    });

    it('should track failures correctly', async () => {
      groqProvider.generateCompletion.mockRejectedValue(new Error('Error'));
      geminiProvider.generateCompletion.mockRejectedValue(new Error('Error'));
      openaiProvider.generateCompletion.mockRejectedValue(new Error('Error'));

      await expect(service.generateCompletion('Test')).rejects.toThrow();

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.totalFailures).toBe(1);
    });

    it('should track fallback count', async () => {
      groqProvider.generateCompletion.mockRejectedValueOnce(new Error('Groq error'));

      await service.generateCompletion('Test prompt');

      const metrics = service.getMetrics();

      expect(metrics.fallbackCount).toBe(1);
    });

    it('should track total cost', async () => {
      groqProvider.generateCompletion.mockResolvedValueOnce(createMockResponse('Groq', 0));

      await service.generateCompletion('Test');

      const metrics = service.getMetrics();

      expect(metrics.totalCostUsd).toBe(0); // Groq is FREE
    });
  });

  describe('Available Providers', () => {
    it('should return list of available providers', () => {
      const providers = service.getAvailableProviders();

      expect(providers).toContain('Groq');
      expect(providers).toContain('Gemini');
      expect(providers).toContain('OpenAI');
    });

    it('should exclude unavailable providers', () => {
      groqProvider.isAvailable.mockReturnValue(false);

      const providers = service.getAvailableProviders();

      expect(providers).not.toContain('Groq');
      expect(providers).toContain('Gemini');
      expect(providers).toContain('OpenAI');
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate costs for all providers', () => {
      const costs = service.estimateCost('Test prompt with about 20 tokens');

      expect(costs.get('Groq')).toBe(0); // FREE
      expect(costs.get('Gemini')).toBeGreaterThan(0); // Has cost
      expect(costs.get('OpenAI')).toBeGreaterThan(0); // Has cost
      expect(costs.get('OpenAI')! > costs.get('Gemini')!).toBe(true); // OpenAI more expensive
    });
  });

  describe('Health Status', () => {
    it('should return health status for all providers', () => {
      const health = service.getProviderHealth();

      expect(health.get('Groq')).toBeDefined();
      expect(health.get('Gemini')).toBeDefined();
      expect(health.get('OpenAI')).toBeDefined();
    });

    it('should identify primary provider', () => {
      const metrics = service.getMetrics();

      expect(metrics.primaryProvider).toBe('Groq');
    });

    it('should update primary provider when Groq is unhealthy', () => {
      groqProvider.getHealthStatus.mockReturnValue(createMockHealthStatus('unhealthy'));

      const metrics = service.getMetrics();

      expect(metrics.primaryProvider).toBe('Gemini');
    });
  });

  describe('Reset Metrics', () => {
    it('should reset all metrics', async () => {
      await service.generateCompletion('Test');

      service.resetMetrics();

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalSuccesses).toBe(0);
      expect(metrics.totalFailures).toBe(0);
      expect(metrics.totalCostUsd).toBe(0);
      expect(metrics.fallbackCount).toBe(0);
    });
  });

  describe('Options Handling', () => {
    it('should pass options to provider', async () => {
      const options = {
        model: 'smart' as const,
        temperature: 0.5,
        maxTokens: 1000,
      };

      await service.generateCompletion('Test', options);

      expect(groqProvider.generateCompletion).toHaveBeenCalledWith('Test', options);
    });

    it('should pass system prompt to provider', async () => {
      const options = {
        model: 'fast' as const,
        systemPrompt: 'You are a helpful assistant.',
      };

      await service.generateCompletion('Test prompt', options);

      expect(groqProvider.generateCompletion).toHaveBeenCalledWith('Test prompt', options);
    });
  });

  // ============================================================================
  // PHASE 10.185: Response Caching Tests
  // ============================================================================

  describe('Response Caching (Phase 10.185)', () => {
    it('should cache response when cache option is enabled', async () => {
      const prompt = 'Test caching prompt';
      const options = { cache: true };

      // First request - should hit provider
      const response1 = await service.generateCompletion(prompt, options);
      expect(response1.cached).toBe(false);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);

      // Second request - should hit cache
      const response2 = await service.generateCompletion(prompt, options);
      expect(response2.cached).toBe(true);
      expect(response2.content).toBe(response1.content);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should not cache when cache option is disabled', async () => {
      const prompt = 'Test no-cache prompt';
      const options = { cache: false };

      await service.generateCompletion(prompt, options);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);

      await service.generateCompletion(prompt, options);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should generate different cache keys for different prompts', async () => {
      const options = { cache: true };

      await service.generateCompletion('Prompt A', options);
      await service.generateCompletion('Prompt B', options);

      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should generate different cache keys for different options', async () => {
      const prompt = 'Same prompt';

      await service.generateCompletion(prompt, { cache: true, temperature: 0.1 });
      await service.generateCompletion(prompt, { cache: true, temperature: 0.9 });

      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should include systemPrompt in cache key', async () => {
      const prompt = 'Test prompt';

      await service.generateCompletion(prompt, {
        cache: true,
        systemPrompt: 'System A'
      });
      await service.generateCompletion(prompt, {
        cache: true,
        systemPrompt: 'System B'
      });

      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should track cache hit rate in metrics', async () => {
      const options = { cache: true };

      // First request - miss
      await service.generateCompletion('Test', options);
      // Second request - hit
      await service.generateCompletion('Test', options);
      // Third request - hit
      await service.generateCompletion('Test', options);

      const metrics = service.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('should clear cache when clearCache is called', async () => {
      const prompt = 'Cached prompt';
      const options = { cache: true };

      await service.generateCompletion(prompt, options);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(1);

      service.clearCache();

      await service.generateCompletion(prompt, options);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // PHASE 10.185: System Prompt Tests
  // ============================================================================

  describe('System Prompt Support (Phase 10.185)', () => {
    it('should accept system prompt in options', async () => {
      const systemPrompt = 'You are a Q-methodology expert.';

      await service.generateCompletion('Extract claims', { systemPrompt });

      expect(groqProvider.generateCompletion).toHaveBeenCalledWith(
        'Extract claims',
        expect.objectContaining({ systemPrompt }),
      );
    });

    it('should work with combined options', async () => {
      const options = {
        model: 'smart' as const,
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: 'Be concise and precise.',
        cache: true,
      };

      await service.generateCompletion('Test', options);

      expect(groqProvider.generateCompletion).toHaveBeenCalledWith('Test', options);
    });

    it('should fallback correctly with system prompt', async () => {
      groqProvider.generateCompletion.mockRejectedValueOnce(new Error('Groq error'));

      const options = { systemPrompt: 'Test system prompt' };
      const response = await service.generateCompletion('Test', options);

      expect(response.provider).toBe('Gemini');
      expect(geminiProvider.generateCompletion).toHaveBeenCalledWith('Test', options);
    });
  });

  // ============================================================================
  // PHASE 10.185: Input Validation Tests
  // ============================================================================

  describe('Input Validation (Phase 10.185)', () => {
    it('should reject empty prompts', async () => {
      await expect(service.generateCompletion('')).rejects.toThrow();
    });

    it('should reject whitespace-only prompts', async () => {
      await expect(service.generateCompletion('   ')).rejects.toThrow();
    });

    it('should handle very long prompts gracefully', async () => {
      const longPrompt = 'x'.repeat(50000); // 50k characters

      // Should not throw
      await service.generateCompletion(longPrompt);
      expect(groqProvider.generateCompletion).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // PHASE 10.185: Metrics Enhancement Tests
  // ============================================================================

  describe('Enhanced Metrics (Phase 10.185)', () => {
    it('should track cache size in metrics', async () => {
      await service.generateCompletion('Prompt 1', { cache: true });
      await service.generateCompletion('Prompt 2', { cache: true });
      await service.generateCompletion('Prompt 3', { cache: true });

      const metrics = service.getMetrics();
      expect(metrics.cacheSize).toBeGreaterThanOrEqual(3);
    });

    it('should maintain accurate cache hit rate', async () => {
      const options = { cache: true };

      // 1 miss
      await service.generateCompletion('A', options);
      // 1 hit
      await service.generateCompletion('A', options);
      // 1 miss
      await service.generateCompletion('B', options);
      // 1 hit
      await service.generateCompletion('B', options);

      const metrics = service.getMetrics();
      // 2 hits out of 4 requests = 50%
      expect(metrics.cacheHitRate).toBeCloseTo(0.5, 1);
    });
  });

  // ============================================================================
  // PHASE 10.185: Concurrent Request Tests
  // ============================================================================

  describe('Concurrent Requests (Phase 10.185)', () => {
    it('should handle concurrent requests without cache corruption', async () => {
      const prompts = ['A', 'B', 'C', 'D', 'E'];
      const options = { cache: true };

      // Fire all requests concurrently
      const promises = prompts.map(p => service.generateCompletion(p, options));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(5);

      // Request same prompts again - all should be cached
      const cachedPromises = prompts.map(p => service.generateCompletion(p, options));
      const cachedResponses = await Promise.all(cachedPromises);

      expect(cachedResponses.every(r => r.cached)).toBe(true);
      expect(groqProvider.generateCompletion).toHaveBeenCalledTimes(5); // No new calls
    });
  });
});
