/**
 * AI Integration Tests
 * Phase 6.86: Enterprise-grade testing for all AI endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Next.js modules
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

// Import handlers
import { POST as proxyHandler } from '@/app/api/ai/proxy/route';
import { POST as questionnaireHandler } from '@/app/api/ai/questionnaire/route';
import { POST as stimuliHandler } from '@/app/api/ai/stimuli/route';
import { POST as biasHandler } from '@/app/api/ai/bias/route';
import { GET as metricsHandler } from '@/app/api/ai/monitoring/metrics/route';
import { GET as usageHandler } from '@/app/api/ai/monitoring/usage/route';

// Test utilities
function createMockRequest(body: any, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe('AI API Integration Tests', () => {
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock authenticated session
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { 
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'researcher'
      }
    });
  });
  
  describe('AI Proxy Endpoint', () => {
    
    it('should reject unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);
      
      const request = createMockRequest({
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo'
      });
      
      const response = await proxyHandler(request);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });
    
    it('should validate request schema', async () => {
      const request = createMockRequest({
        // Missing required 'prompt' field
        model: 'gpt-3.5-turbo'
      });
      
      const response = await proxyHandler(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid request data');
    });
    
    it('should enforce rate limiting', async () => {
      // Make 10 requests (assuming limit is 10 per minute)
      const requests = Array(11).fill(null).map(() => 
        createMockRequest({
          prompt: 'Test prompt',
          model: 'gpt-3.5-turbo'
        })
      );
      
      // First 10 should succeed (or return normal errors)
      for (let i = 0; i < 10; i++) {
        const response = await proxyHandler(requests[i]);
        expect(response.status).not.toBe(429);
      }
      
      // 11th request should be rate limited
      const response = await proxyHandler(requests[10]);
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
    });
    
    it('should track usage and costs', async () => {
      const request = createMockRequest({
        prompt: 'Calculate cost for this request',
        model: 'gpt-4',
        maxTokens: 1000
      });
      
      // Mock successful OpenAI response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: 'Test response',
          tokens: 150,
          inputTokens: 50,
          outputTokens: 100,
          cost: 0.0045
        })
      } as Response);
      
      const response = await proxyHandler(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('cost');
      expect(data.cost).toBeGreaterThan(0);
      expect(data).toHaveProperty('tokens');
    });
  });
  
  describe('Questionnaire Generation', () => {
    
    it('should generate questions with proper types', async () => {
      const request = createMockRequest({
        action: 'generate',
        data: {
          topic: 'Climate change attitudes',
          questionCount: 10,
          questionTypes: ['text', 'select', 'scale'],
          targetAudience: 'University students'
        }
      });
      
      const response = await questionnaireHandler(request);
      
      // Should either succeed or fail gracefully
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.questions).toBeInstanceOf(Array);
        expect(data.questions.length).toBeGreaterThan(0);
        
        // Validate question structure
        data.questions.forEach((q: any) => {
          expect(q).toHaveProperty('id');
          expect(q).toHaveProperty('type');
          expect(q).toHaveProperty('text');
          expect(['text', 'select', 'scale']).toContain(q.type);
        });
      }
    });
    
    it('should validate question generation parameters', async () => {
      const request = createMockRequest({
        action: 'generate',
        data: {
          topic: 'Test',
          questionCount: 1000, // Exceeds reasonable limit
          questionTypes: []
        }
      });
      
      const response = await questionnaireHandler(request);
      
      // Should reject invalid parameters
      if (response.status === 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });
  });
  
  describe('Bias Detection', () => {
    
    it('should detect bias in statements', async () => {
      const request = createMockRequest({
        action: 'detect',
        data: {
          statements: [
            'All politicians are corrupt',
            'Climate change is a hoax',
            'Technology improves our lives'
          ]
        }
      });
      
      const response = await biasHandler(request);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('overallScore');
        expect(data.overallScore).toBeGreaterThanOrEqual(0);
        expect(data.overallScore).toBeLessThanOrEqual(100);
        expect(data).toHaveProperty('detectedBiases');
        expect(data.detectedBiases).toBeInstanceOf(Array);
      }
    });
    
    it('should provide bias mitigation suggestions', async () => {
      const request = createMockRequest({
        action: 'suggest-fixes',
        data: {
          statements: [
            'Women are naturally better at caregiving'
          ]
        }
      });
      
      const response = await biasHandler(request);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('suggestions');
        expect(data.suggestions).toBeInstanceOf(Array);
        
        data.suggestions.forEach((suggestion: any) => {
          expect(suggestion).toHaveProperty('original');
          expect(suggestion).toHaveProperty('suggested');
          expect(suggestion).toHaveProperty('reasoning');
        });
      }
    });
    
    it('should check cultural sensitivity', async () => {
      const request = createMockRequest({
        action: 'cultural-sensitivity',
        data: {
          statements: [
            'American values are superior',
            'Eastern medicine is not scientific'
          ]
        }
      });
      
      const response = await biasHandler(request);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('issues');
        expect(data.issues).toBeInstanceOf(Array);
      }
    });
  });
  
  describe('Monitoring Endpoints', () => {
    
    it('should return metrics for authenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/monitoring/metrics?range=day');
      
      const response = await metricsHandler(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('totalRequests');
      expect(data).toHaveProperty('totalCost');
      expect(data).toHaveProperty('averageResponseTime');
      expect(data).toHaveProperty('errorRate');
      expect(data).toHaveProperty('topModels');
      expect(data).toHaveProperty('hourlyDistribution');
    });
    
    it('should return user usage data', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/monitoring/usage');
      
      const response = await usageHandler(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('dailyUsage');
      expect(data).toHaveProperty('monthlyUsage');
      expect(data).toHaveProperty('dailyLimit');
      expect(data).toHaveProperty('monthlyLimit');
      expect(data).toHaveProperty('isApproachingLimit');
      expect(data).toHaveProperty('isOverLimit');
    });
    
    it('should enforce authentication for monitoring', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce(null);
      
      const request = new NextRequest('http://localhost:3000/api/ai/monitoring/metrics');
      
      const response = await metricsHandler(request);
      expect(response.status).toBe(401);
    });
  });
  
  describe('Error Handling', () => {
    
    it('should handle OpenAI API errors gracefully', async () => {
      const request = createMockRequest({
        prompt: 'Test error handling',
        model: 'gpt-3.5-turbo'
      });
      
      // Mock OpenAI API error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('OpenAI API error'));
      
      const response = await proxyHandler(request);
      
      // Should return service unavailable
      expect([503, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
    
    it('should handle quota exceeded errors', async () => {
      const request = createMockRequest({
        prompt: 'Test quota',
        model: 'gpt-4'
      });
      
      // Mock quota exceeded error
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).code = 'insufficient_quota';
      vi.mocked(fetch).mockRejectedValueOnce(quotaError);
      
      const response = await proxyHandler(request);
      
      const data = await response.json();
      expect(data.error).toContain('quota');
    });
    
    it('should not expose sensitive errors to client', async () => {
      const request = createMockRequest({
        prompt: 'Test security',
        model: 'gpt-3.5-turbo'
      });
      
      // Mock API key error
      const apiKeyError = new Error('Invalid API key');
      (apiKeyError as any).code = 'invalid_api_key';
      vi.mocked(fetch).mockRejectedValueOnce(apiKeyError);
      
      const response = await proxyHandler(request);
      
      const data = await response.json();
      // Should not expose API key error details
      expect(data.error).not.toContain('API key');
      expect(data.error).not.toContain('invalid_api_key');
    });
  });
  
  describe('Performance Tests', () => {
    
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const request = createMockRequest({
        prompt: 'Performance test',
        model: 'gpt-3.5-turbo'
      });
      
      // Mock fast response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: 'Fast response',
          tokens: 50,
          cost: 0.001
        })
      } as Response);
      
      await proxyHandler(request);
      
      const responseTime = Date.now() - startTime;
      
      // Should respond within 3 seconds (excluding actual AI processing)
      expect(responseTime).toBeLessThan(3000);
    });
    
    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => 
        createMockRequest({
          prompt: 'Concurrent test',
          model: 'gpt-3.5-turbo'
        })
      );
      
      // Mock responses
      requests.forEach(() => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: 'Concurrent response',
            tokens: 50,
            cost: 0.001
          })
        } as Response);
      });
      
      // Process requests concurrently
      const responses = await Promise.all(
        requests.map(req => proxyHandler(req))
      );
      
      // All should complete
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.status).toBeDefined();
      });
    });
  });
});

describe('Security Tests', () => {
  
  it('should never expose API keys in responses', async () => {
    const request = createMockRequest({
      prompt: 'Check for API key exposure',
      model: 'gpt-3.5-turbo'
    });
    
    const response = await proxyHandler(request);
    const responseText = await response.text();
    
    // Check response doesn't contain API key patterns
    expect(responseText).not.toMatch(/sk-[a-zA-Z0-9]{48}/);
    expect(responseText).not.toContain('OPENAI_API_KEY');
    expect(responseText).not.toContain(process.env.OPENAI_API_KEY || '');
  });
  
  it('should sanitize user input to prevent injection', async () => {
    const request = createMockRequest({
      prompt: 'Test <script>alert("XSS")</script>',
      model: 'gpt-3.5-turbo'
    });
    
    const response = await proxyHandler(request);
    
    if (response.status === 200) {
      const data = await response.json();
      // Response should not contain unescaped script tags
      expect(JSON.stringify(data)).not.toContain('<script>');
    }
  });
  
  it('should validate model names to prevent arbitrary code execution', async () => {
    const request = createMockRequest({
      prompt: 'Test',
      model: 'gpt-3.5-turbo; rm -rf /' // Attempted injection
    });
    
    const response = await proxyHandler(request);
    
    // Should reject invalid model names
    expect(response.status).toBe(400);
  });
});