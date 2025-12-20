/**
 * Query Expansion Service Tests
 *
 * Phase 9 Day 21 - Comprehensive test coverage for AI-powered query expansion
 *
 * Test Coverage:
 * - Query expansion with domain context
 * - Vagueness detection
 * - Related term suggestions
 * - Query narrowing
 * - Caching mechanisms
 * - Error handling and fallbacks
 * - Response parsing (valid and invalid)
 *
 * @group unit
 * @group ai-services
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  QueryExpansionService,
  ExpandedQuery,
} from './query-expansion.service';
import { UnifiedAIService } from './unified-ai.service';

describe('QueryExpansionService', () => {
  let service: QueryExpansionService;
  let unifiedAIService: jest.Mocked<UnifiedAIService>;

  const mockExpansionResponse = {
    content: JSON.stringify({
      expanded:
        'climate change impacts on agriculture and food security research methods',
      suggestions: [
        'agricultural adaptation to climate change',
        'food security and climate variability',
        'crop yield and temperature effects',
      ],
      isTooVague: false,
      narrowingQuestions: [],
      confidence: 0.85,
      relatedTerms: [
        'agricultural sustainability',
        'climate resilience',
        'food systems',
        'adaptation strategies',
      ],
    }),
    tokens: 150,
    inputTokens: 100,
    outputTokens: 50,
    responseTimeMs: 500,
    cached: false,
    cost: 0.001,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  };

  const mockVagueQueryResponse = {
    content: JSON.stringify({
      expanded: 'climate change impacts on ecosystems research methodologies',
      suggestions: [
        'climate change effects on biodiversity',
        'ecosystem resilience to climate variability',
        'climate impacts on marine ecosystems',
      ],
      isTooVague: true,
      narrowingQuestions: [
        'Which specific ecosystem are you interested in (forest, marine, freshwater)?',
        'Are you focusing on a particular geographic region?',
        'What time scale are you considering (short-term vs long-term)?',
      ],
      confidence: 0.6,
      relatedTerms: [
        'biodiversity',
        'ecosystem services',
        'ecological resilience',
      ],
    }),
    tokens: 180,
    inputTokens: 120,
    outputTokens: 60,
    responseTimeMs: 600,
    cached: false,
    cost: 0.0012,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  };

  beforeEach(async () => {
    const mockUnifiedAIService = {
      generateCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryExpansionService,
        {
          provide: UnifiedAIService,
          useValue: mockUnifiedAIService,
        },
      ],
    }).compile();

    service = module.get<QueryExpansionService>(QueryExpansionService);
    unifiedAIService = module.get(UnifiedAIService) as jest.Mocked<UnifiedAIService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expandQuery', () => {
    it('should expand specific query successfully', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(
        'climate change agriculture',
        'general',
      );

      expect(result).toMatchObject({
        expanded: expect.stringContaining('climate change'),
        suggestions: expect.arrayContaining([
          expect.stringContaining('agricultural adaptation'),
        ]),
        isTooVague: false,
        confidence: 0.85,
        relatedTerms: expect.arrayContaining(['agricultural sustainability']),
      });

      expect(unifiedAIService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('climate change agriculture'),
        expect.objectContaining({
          model: 'fast',
          temperature: 0.4,
        }),
      );
    });

    it('should detect vague queries and provide narrowing questions', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(
        mockVagueQueryResponse,
      );

      const result = await service.expandQuery('climate', 'general');

      expect(result.isTooVague).toBe(true);
      expect(result.narrowingQuestions).toHaveLength(3);
      expect(result.narrowingQuestions[0]).toContain('ecosystem');
      expect(result.confidence).toBe(0.6);
    });

    it('should apply domain-specific context when provided', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('health interventions', 'health');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('health');
      expect(calledPrompt).toContain('health interventions');
    });

    it('should use general academic context when domain is not specified', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('research methods');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('General academic research');
    });

    it('should cache results for the same query and domain', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // First call
      const result1 = await service.expandQuery('climate', 'general');

      // Second call with same parameters
      const result2 = await service.expandQuery('climate', 'general');

      expect(result1).toEqual(result2);
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should differentiate cache by domain', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // Same query, different domains
      await service.expandQuery('health', 'health');
      await service.expandQuery('health', 'education');

      // Should call OpenAI twice (different cache keys)
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should handle AI response with markdown code blocks', async () => {
      const responseWithMarkdown = {
        content: '```json\n' + mockExpansionResponse.content + '\n```',
        tokens: 150,
        inputTokens: 100,
        outputTokens: 50,
        responseTimeMs: 500,
        cached: false,
        cost: 0.001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      };
      unifiedAIService.generateCompletion.mockResolvedValue(responseWithMarkdown);

      const result = await service.expandQuery('climate', 'general');

      expect(result.expanded).toContain('climate change');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should return original query on invalid AI response', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Invalid response without JSON',
        tokens: 10,
        inputTokens: 5,
        outputTokens: 5,
        responseTimeMs: 100,
        cached: false,
        cost: 0.0001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.expandQuery('climate', 'general');

      expect(result).toMatchObject({
        expanded: '',
        suggestions: [],
        isTooVague: false,
        narrowingQuestions: [],
        confidence: 0.5,
        relatedTerms: [],
      });
    });

    it('should handle OpenAI service failure gracefully', async () => {
      unifiedAIService.generateCompletion.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      const result = await service.expandQuery('climate', 'general');

      expect(result).toMatchObject({
        expanded: 'climate',
        suggestions: [],
        isTooVague: false,
        narrowingQuestions: [],
        confidence: 0.5,
        relatedTerms: [],
      });
    });

    it('should handle partial AI responses gracefully', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          expanded: 'climate research',
          // Missing other fields
        }),
        tokens: 50,
        inputTokens: 30,
        outputTokens: 20,
        responseTimeMs: 200,
        cached: false,
        cost: 0.0005,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.expandQuery('climate', 'general');

      expect(result.expanded).toBe('climate research');
      expect(result.suggestions).toEqual([]);
      expect(result.isTooVague).toBe(false);
      expect(result.narrowingQuestions).toEqual([]);
      expect(result.confidence).toBe(0.7); // Default value
      expect(result.relatedTerms).toEqual([]);
    });
  });

  describe('suggestTerms', () => {
    const mockTermsResponse = {
      content: JSON.stringify({
        terms: [
          'climate adaptation',
          'mitigation strategies',
          'carbon sequestration',
          'renewable energy',
          'sustainability science',
        ],
        confidence: [0.9, 0.85, 0.8, 0.75, 0.7],
      }),
      tokens: 100,
      inputTokens: 60,
      outputTokens: 40,
      responseTimeMs: 400,
      cached: false,
      cost: 0.0008,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    };

    it('should suggest related academic terms', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockTermsResponse);

      const result = await service.suggestTerms(
        'climate change',
        'environmental science',
      );

      expect(result.terms).toHaveLength(5);
      expect(result.terms).toContain('climate adaptation');
      expect(result.confidence).toHaveLength(5);
      expect(result.confidence[0]).toBe(0.9);
    });

    it('should work without field specification', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockTermsResponse);

      const result = await service.suggestTerms('climate change');

      expect(result.terms).toHaveLength(5);
      expect(result.confidence).toHaveLength(5);

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('climate change');
      expect(calledPrompt).not.toContain('Field:');
    });

    it('should include field context when provided', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockTermsResponse);

      await service.suggestTerms('health', 'public health');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('Field: public health');
    });

    it('should use default confidence when not provided', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          terms: ['term1', 'term2', 'term3'],
          // confidence array missing
        }),
        tokens: 30,
        inputTokens: 15,
        outputTokens: 15,
        responseTimeMs: 150,
        cached: false,
        cost: 0.0003,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.suggestTerms('climate');

      expect(result.terms).toHaveLength(3);
      expect(result.confidence).toHaveLength(3);
      expect(result.confidence).toEqual([0.7, 0.7, 0.7]); // Default values
    });

    it('should return empty arrays on invalid response', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Invalid JSON response',
        tokens: 10,
        inputTokens: 5,
        outputTokens: 5,
        responseTimeMs: 100,
        cached: false,
        cost: 0.0001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.suggestTerms('climate');

      expect(result.terms).toEqual([]);
      expect(result.confidence).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      unifiedAIService.generateCompletion.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.suggestTerms('climate');

      expect(result.terms).toEqual([]);
      expect(result.confidence).toEqual([]);
    });
  });

  describe('narrowQuery', () => {
    const mockNarrowResponse = {
      content: JSON.stringify({
        narrowed: [
          'climate change impacts on coastal wetland ecosystems',
          'quantitative analysis of temperature effects on marine biodiversity',
          'qualitative study of community adaptation to sea level rise',
        ],
        reasoning:
          'Narrowing helps focus research on specific ecosystems, methodologies, and geographic contexts',
      }),
      tokens: 120,
      inputTokens: 70,
      outputTokens: 50,
      responseTimeMs: 450,
      cached: false,
      cost: 0.0009,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    };

    it('should provide narrowing suggestions for broad queries', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockNarrowResponse);

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toHaveLength(3);
      expect(result.narrowed[0]).toContain('coastal wetland');
      expect(result.reasoning).toContain('specific ecosystems');
    });

    it('should include methodology keywords in narrowed queries', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockNarrowResponse);

      const result = await service.narrowQuery('health');

      expect(result.narrowed.some((q) => q.includes('quantitative'))).toBe(
        true,
      );
      expect(result.narrowed.some((q) => q.includes('qualitative'))).toBe(true);
    });

    it('should return empty arrays on invalid response', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Not valid JSON',
        tokens: 10,
        inputTokens: 5,
        outputTokens: 5,
        responseTimeMs: 100,
        cached: false,
        cost: 0.0001,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toEqual([]);
      expect(result.reasoning).toBe('');
    });

    it('should handle API errors gracefully', async () => {
      unifiedAIService.generateCompletion.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toEqual([]);
      expect(result.reasoning).toBe('');
    });
  });

  describe('buildExpansionPrompt', () => {
    it('should build prompt with domain context', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('health interventions', 'health');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];

      expect(calledPrompt).toContain('health');
      expect(calledPrompt).toContain('health interventions');
      expect(calledPrompt).toContain('Academic research literature search');
      expect(calledPrompt).toContain('If too broad');
      expect(calledPrompt).toContain('If already specific');
    });

    it('should include examples in prompt', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('test query', 'general');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];

      expect(calledPrompt).toContain('Examples:');
      expect(calledPrompt).toContain('climate');
      expect(calledPrompt).toContain('health');
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      // Create cache entry
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);
      await service.expandQuery('climate', 'general');

      // Clear expired cache
      service.clearExpiredCache();

      // Cache should still exist (not expired - 1 hour TTL)
      unifiedAIService.generateCompletion.mockClear();
      await service.expandQuery('climate', 'general');
      expect(unifiedAIService.generateCompletion).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle single-word queries', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(
        mockVagueQueryResponse,
      );

      const result = await service.expandQuery('climate');

      expect(result.isTooVague).toBe(true);
      expect(result.narrowingQuestions.length).toBeGreaterThan(0);
    });

    it('should handle very long queries', async () => {
      const longQuery =
        'climate change impacts on agricultural productivity in sub-saharan africa with focus on smallholder farmers adaptation strategies';

      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(longQuery, 'climate');

      expect(result.expanded).toBeTruthy();
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining(longQuery),
        expect.any(Object),
      );
    });

    it('should handle queries with special characters', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(
        'climate & health: impact?',
        'general',
      );

      expect(result.expanded).toBeTruthy();
    });

    it('should handle empty expanded response', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          expanded: '',
          suggestions: [],
          isTooVague: true,
          narrowingQuestions: ['Please provide more context'],
          confidence: 0.3,
          relatedTerms: [],
        }),
        tokens: 40,
        inputTokens: 20,
        outputTokens: 20,
        responseTimeMs: 180,
        cached: false,
        cost: 0.0004,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const result = await service.expandQuery('', 'general');

      expect(result.expanded).toBe('');
      expect(result.isTooVague).toBe(true);
    });
  });

  describe('performance and caching', () => {
    it('should use cache for repeated queries within TTL', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // Multiple calls with same parameters
      await service.expandQuery('climate', 'general');
      await service.expandQuery('climate', 'general');
      await service.expandQuery('climate', 'general');

      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests efficiently', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const queries = ['climate', 'health', 'education', 'technology'];
      const promises = queries.map((q) => service.expandQuery(q, 'general'));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(unifiedAIService.generateCompletion).toHaveBeenCalledTimes(4);
    });
  });

  describe('domain-specific behavior', () => {
    it('should adapt to climate domain', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('adaptation', 'climate');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('climate');
    });

    it('should adapt to health domain', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('intervention', 'health');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('health');
    });

    it('should adapt to education domain', async () => {
      unifiedAIService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('learning', 'education');

      const calledPrompt = unifiedAIService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('education');
    });
  });
});
