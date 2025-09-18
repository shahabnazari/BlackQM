/**
 * Tests for Core AI Service - Phase 6.86 Day 1
 * World-class test coverage for OpenAI integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIService } from '@/lib/services/ai.service';
import type { AIRequest, AIResponse } from '@/lib/types/ai.types';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('AIService', () => {
  let aiService: AIService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance for testing
    (AIService as any).instance = null;
    aiService = AIService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Functionality', () => {
    it('should create a singleton instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should generate completion with retry logic', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
      });

      expect(result.content).toBe('Test response');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockRejectedValue(new Error('Persistent error'));

      await expect(
        aiService.generateCompletion({
          prompt: 'Test prompt',
          model: 'fast',
        })
      ).rejects.toThrow('AI service unavailable after 3 attempts');

      expect(openai.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should generate JSON response', async () => {
      const mockData = { result: 'test', value: 42 };
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify(mockData) } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateJSON('Generate JSON');

      expect(result).toEqual(mockData);
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Invalid JSON {{{' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValueOnce(mockResponse);

      await expect(
        aiService.generateJSON('Generate JSON')
      ).rejects.toThrow('Invalid JSON response');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      // Make 10 requests (the limit)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          aiService.generateCompletion({
            prompt: `Test ${i}`,
            model: 'fast',
          })
        );
      }
      
      await Promise.all(promises);

      // 11th request should be rate limited
      await expect(
        aiService.generateCompletion({
          prompt: 'Test 11',
          model: 'fast',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset rate limit after window', async () => {
      vi.useFakeTimers();
      
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await aiService.generateCompletion({
          prompt: `Test ${i}`,
          model: 'fast',
        });
      }

      // Should be rate limited
      await expect(
        aiService.generateCompletion({
          prompt: 'Test 11',
          model: 'fast',
        })
      ).rejects.toThrow('Rate limit exceeded');

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000);

      // Should work now
      const result = await aiService.generateCompletion({
        prompt: 'Test after reset',
        model: 'fast',
      });
      
      expect(result.content).toBe('Test');
      
      vi.useRealTimers();
    });
  });

  describe('Caching', () => {
    it('should cache responses', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Cached response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValueOnce(mockResponse);

      // First request - should hit API
      const result1 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: true,
      });

      // Second request - should use cache
      const result2 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: true,
      });

      expect(result1.content).toBe('Cached response');
      expect(result2.content).toBe('Cached response');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      vi.useFakeTimers();
      
      const mockResponse1 = {
        choices: [{ message: { content: 'Response 1' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };
      
      const mockResponse2 = {
        choices: [{ message: { content: 'Response 2' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // First request
      const result1 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: true,
      });

      // Advance time beyond TTL (5 minutes)
      vi.advanceTimersByTime(301000);

      // Second request - should hit API again
      const result2 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: true,
      });

      expect(result1.content).toBe('Response 1');
      expect(result2.content).toBe('Response 2');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('should bypass cache when requested', async () => {
      const mockResponse1 = {
        choices: [{ message: { content: 'Response 1' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };
      
      const mockResponse2 = {
        choices: [{ message: { content: 'Response 2' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // First request with cache
      const result1 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: true,
      });

      // Second request without cache
      const result2 = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
        cache: false,
      });

      expect(result1.content).toBe('Response 1');
      expect(result2.content).toBe('Response 2');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cost Tracking', () => {
    it('should track usage costs', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateCompletion({
        prompt: 'Test prompt',
        model: 'fast',
      });

      expect(result.usage).toBeDefined();
      expect(result.usage.promptTokens).toBe(100);
      expect(result.usage.completionTokens).toBe(50);
      expect(result.usage.totalTokens).toBe(150);
      expect(result.usage.estimatedCost).toBeCloseTo(0.00013); // (100*0.0005 + 50*0.0015) / 1000
    });

    it('should respect daily budget limit', async () => {
      // Mock reaching daily budget
      const budgetTracker = (aiService as any).budgetTracker;
      budgetTracker.dailySpent = 10.01; // Over $10 limit

      await expect(
        aiService.generateCompletion({
          prompt: 'Test prompt',
          model: 'fast',
        })
      ).rejects.toThrow('Daily budget limit exceeded');
    });

    it('should track different model costs correctly', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockResolvedValue(mockResponse);

      // Test GPT-3.5 cost
      const result1 = await aiService.generateCompletion({
        prompt: 'Test',
        model: 'fast',
      });
      expect(result1.usage.estimatedCost).toBeCloseTo(0.00013);

      // Test GPT-4 cost
      const result2 = await aiService.generateCompletion({
        prompt: 'Test',
        model: 'smart',
      });
      expect(result2.usage.estimatedCost).toBeCloseTo(0.0025); // (100*0.01 + 50*0.03) / 1000
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors with exponential backoff', async () => {
      vi.useFakeTimers();
      
      const mockResponse = {
        choices: [{ message: { content: 'Success' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const openai = (aiService as any).openai;
      openai.chat.completions.create
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const promise = aiService.generateCompletion({
        prompt: 'Test',
        model: 'fast',
      });

      // First retry after 1 second
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second retry after 2 seconds
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result.content).toBe('Success');
      expect(openai.chat.completions.create).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });

    it('should handle API errors gracefully', async () => {
      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
      });

      await expect(
        aiService.generateCompletion({
          prompt: 'Test',
          model: 'fast',
        })
      ).rejects.toThrow('AI service rate limited');
    });

    it('should handle timeout errors', async () => {
      const openai = (aiService as any).openai;
      openai.chat.completions.create.mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({}), 35000); // Longer than 30s timeout
        })
      );

      await expect(
        aiService.generateCompletion({
          prompt: 'Test',
          model: 'fast',
          timeout: 100, // 100ms timeout for test
        })
      ).rejects.toThrow('Request timeout');
    });
  });
});