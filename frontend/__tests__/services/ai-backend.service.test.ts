/**
 * AI Backend Service Integration Tests
 * 
 * Tests the integration between frontend and backend AI services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiBackendService } from '../../lib/services/ai-backend.service';

// Mock fetch
global.fetch = vi.fn();

// Mock auth token
vi.mock('../../lib/auth/auth-utils', () => ({
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
}));

describe('AI Backend Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateStatements', () => {
    it('should generate statements successfully', async () => {
      const mockResponse = {
        success: true,
        statements: [
          { id: '1', text: 'Statement 1', perspective: 'positive' },
          { id: '2', text: 'Statement 2', perspective: 'negative' },
        ],
        count: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.generateStatements({
        topic: 'Climate Change',
        count: 30,
        avoidBias: true,
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/generate-statements'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle errors properly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'AI service unavailable' }),
      });

      await expect(
        aiBackendService.generateStatements({ topic: 'Test' })
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('getGridRecommendations', () => {
    it('should get grid recommendations successfully', async () => {
      const mockResponse = {
        success: true,
        recommendations: [
          {
            columns: 9,
            distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2],
            labels: ['-4', '-3', '-2', '-1', '0', '+1', '+2', '+3', '+4'],
            reasoning: 'Balanced distribution for 34 statements',
            complexity: 'moderate' as const,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.getGridRecommendations({
        studyTopic: 'Social Media Impact',
        expectedStatements: 34,
        participantExperience: 'intermediate',
      });

      expect(result).toEqual(mockResponse);
      expect(result.recommendations[0].complexity).toBe('moderate');
    });
  });

  describe('detectBias', () => {
    it('should detect bias in statements', async () => {
      const mockResponse = {
        success: true,
        analysis: {
          overallBiasScore: 0.3,
          biasedStatements: ['Statement 1'],
          biasTypes: { political: 0.2, cultural: 0.1 },
          recommendations: ['Consider neutral language'],
          alternatives: {
            'Statement 1': 'Neutral version of statement 1',
          },
        },
        depth: 'comprehensive',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.detectBias({
        statements: ['Statement 1', 'Statement 2'],
        analysisDepth: 'comprehensive',
        suggestAlternatives: true,
      });

      expect(result.analysis.overallBiasScore).toBe(0.3);
      expect(result.analysis.alternatives).toBeDefined();
    });
  });

  describe('generateQuestionnaire', () => {
    it('should generate questionnaire with skip logic', async () => {
      const mockResponse = {
        success: true,
        questions: [
          {
            id: 'q1',
            text: 'How often do you use social media?',
            type: 'multipleChoice' as const,
            options: ['Daily', 'Weekly', 'Monthly', 'Never'],
            required: true,
            skipLogic: {
              condition: "answer === 'Never'",
              targetQuestionId: 'q5',
            },
            aiGenerated: true as const,
            confidence: 0.9,
            reasoning: 'Important for understanding usage patterns',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.generateQuestionnaire({
        studyTopic: 'Social Media Usage',
        questionCount: 10,
        questionTypes: ['multipleChoice', 'likert'],
        includeSkipLogic: true,
      });

      expect(result.questions[0].skipLogic).toBeDefined();
      expect(result.questions[0].type).toBe('multipleChoice');
    });
  });

  describe('getParticipantAssistance', () => {
    it('should provide participant assistance', async () => {
      const mockResponse = {
        success: true,
        assistance: {
          message: 'Take your time to carefully consider each statement.',
          stage: 'qsort',
          participantId: 'p123',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.getParticipantAssistance({
        participantId: 'p123',
        stage: 'qsort',
        question: 'How should I approach the sorting?',
      });

      expect(result.assistance.message).toContain('carefully consider');
    });
  });

  describe('analyzeResponses', () => {
    it('should analyze participant responses', async () => {
      const mockResponse = {
        success: true,
        analysis: {
          patterns: {
            commonPatterns: ['Pattern A', 'Pattern B'],
            clusters: [['p1', 'p2'], ['p3', 'p4']],
            outliers: ['p5'],
          },
          quality: {
            overallQuality: 0.85,
            flaggedResponses: [],
            completionRate: 0.95,
          },
        },
        participantCount: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.analyzeResponses({
        responses: [
          {
            participantId: 'p1',
            qsort: [1, 2, 3, 4, 5],
            completionTime: 1200,
          },
        ],
        analysisTypes: ['patterns', 'quality'],
      });

      expect(result.analysis.quality.overallQuality).toBe(0.85);
    });
  });

  describe('updateBudget', () => {
    it('should update budget limits', async () => {
      const mockResponse = {
        success: true,
        message: 'Budget limits updated successfully',
        currentLimits: {
          daily: 50,
          monthly: 500,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiBackendService.updateBudget({
        dailyLimit: 50,
        monthlyLimit: 500,
      });

      expect(result.currentLimits.daily).toBe(50);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        aiBackendService.generateStatements({ topic: 'Test' })
      ).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid token' }),
      });

      await expect(
        aiBackendService.generateStatements({ topic: 'Test' })
      ).rejects.toThrow('Invalid token');
    });

    it('should handle 429 rate limiting', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(
        aiBackendService.generateStatements({ topic: 'Test' })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 402 payment required', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: async () => ({ message: 'AI budget limit exceeded' }),
      });

      await expect(
        aiBackendService.generateStatements({ topic: 'Test' })
      ).rejects.toThrow('AI budget limit exceeded');
    });
  });
});

describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const mockResponse = { success: true, data: 'test' };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const promises = Array.from({ length: 5 }, (_, i) => 
      aiBackendService.generateStatements({ topic: `Test ${i}` })
    );

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(5);
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  it('should respect response time requirements', async () => {
    const mockResponse = { success: true, data: 'test' };
    
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => mockResponse,
          });
        }, 100); // Simulate 100ms response time
      })
    );

    const start = Date.now();
    await aiBackendService.generateStatements({ topic: 'Test' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000); // Should be under 3 seconds
  });
});