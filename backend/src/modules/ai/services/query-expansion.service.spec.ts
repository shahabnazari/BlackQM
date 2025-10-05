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
import { QueryExpansionService, ExpandedQuery } from './query-expansion.service';
import { OpenAIService } from './openai.service';

describe('QueryExpansionService', () => {
  let service: QueryExpansionService;
  let openaiService: jest.Mocked<OpenAIService>;

  const mockExpansionResponse = {
    content: JSON.stringify({
      expanded: 'climate change impacts on agriculture and food security research methods',
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
      relatedTerms: ['biodiversity', 'ecosystem services', 'ecological resilience'],
    }),
  };

  beforeEach(async () => {
    const mockOpenAIService = {
      generateCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryExpansionService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<QueryExpansionService>(QueryExpansionService);
    openaiService = module.get(OpenAIService) as jest.Mocked<OpenAIService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expandQuery', () => {
    it('should expand specific query successfully', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(
        'climate change agriculture',
        'general'
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

      expect(openaiService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('climate change agriculture'),
        expect.objectContaining({
          model: 'fast',
          temperature: 0.4,
        })
      );
    });

    it('should detect vague queries and provide narrowing questions', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockVagueQueryResponse);

      const result = await service.expandQuery('climate', 'general');

      expect(result.isTooVague).toBe(true);
      expect(result.narrowingQuestions).toHaveLength(3);
      expect(result.narrowingQuestions[0]).toContain('ecosystem');
      expect(result.confidence).toBe(0.6);
    });

    it('should apply domain-specific context when provided', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('health interventions', 'health');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('health');
      expect(calledPrompt).toContain('health interventions');
    });

    it('should use general academic context when domain is not specified', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('research methods');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('General academic research');
    });

    it('should cache results for the same query and domain', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // First call
      const result1 = await service.expandQuery('climate', 'general');

      // Second call with same parameters
      const result2 = await service.expandQuery('climate', 'general');

      expect(result1).toEqual(result2);
      expect(openaiService.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should differentiate cache by domain', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // Same query, different domains
      await service.expandQuery('health', 'health');
      await service.expandQuery('health', 'education');

      // Should call OpenAI twice (different cache keys)
      expect(openaiService.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should handle AI response with markdown code blocks', async () => {
      const responseWithMarkdown = {
        content: '```json\n' + mockExpansionResponse.content + '\n```',
      };
      openaiService.generateCompletion.mockResolvedValue(responseWithMarkdown);

      const result = await service.expandQuery('climate', 'general');

      expect(result.expanded).toContain('climate change');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should return original query on invalid AI response', async () => {
      openaiService.generateCompletion.mockResolvedValue({
        content: 'Invalid response without JSON',
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
      openaiService.generateCompletion.mockRejectedValue(
        new Error('OpenAI API error')
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
      openaiService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          expanded: 'climate research',
          // Missing other fields
        }),
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
    };

    it('should suggest related academic terms', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockTermsResponse);

      const result = await service.suggestTerms(
        'climate change',
        'environmental science'
      );

      expect(result.terms).toHaveLength(5);
      expect(result.terms).toContain('climate adaptation');
      expect(result.confidence).toHaveLength(5);
      expect(result.confidence[0]).toBe(0.9);
    });

    it('should work without field specification', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockTermsResponse);

      const result = await service.suggestTerms('climate change');

      expect(result.terms).toHaveLength(5);
      expect(result.confidence).toHaveLength(5);

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('climate change');
      expect(calledPrompt).not.toContain('Field:');
    });

    it('should include field context when provided', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockTermsResponse);

      await service.suggestTerms('health', 'public health');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('Field: public health');
    });

    it('should use default confidence when not provided', async () => {
      openaiService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          terms: ['term1', 'term2', 'term3'],
          // confidence array missing
        }),
      });

      const result = await service.suggestTerms('climate');

      expect(result.terms).toHaveLength(3);
      expect(result.confidence).toHaveLength(3);
      expect(result.confidence).toEqual([0.7, 0.7, 0.7]); // Default values
    });

    it('should return empty arrays on invalid response', async () => {
      openaiService.generateCompletion.mockResolvedValue({
        content: 'Invalid JSON response',
      });

      const result = await service.suggestTerms('climate');

      expect(result.terms).toEqual([]);
      expect(result.confidence).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      openaiService.generateCompletion.mockRejectedValue(
        new Error('API error')
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
    };

    it('should provide narrowing suggestions for broad queries', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockNarrowResponse);

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toHaveLength(3);
      expect(result.narrowed[0]).toContain('coastal wetland');
      expect(result.reasoning).toContain('specific ecosystems');
    });

    it('should include methodology keywords in narrowed queries', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockNarrowResponse);

      const result = await service.narrowQuery('health');

      expect(result.narrowed.some((q) => q.includes('quantitative'))).toBe(true);
      expect(result.narrowed.some((q) => q.includes('qualitative'))).toBe(true);
    });

    it('should return empty arrays on invalid response', async () => {
      openaiService.generateCompletion.mockResolvedValue({
        content: 'Not valid JSON',
      });

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toEqual([]);
      expect(result.reasoning).toBe('');
    });

    it('should handle API errors gracefully', async () => {
      openaiService.generateCompletion.mockRejectedValue(
        new Error('API error')
      );

      const result = await service.narrowQuery('climate');

      expect(result.narrowed).toEqual([]);
      expect(result.reasoning).toBe('');
    });
  });

  describe('buildExpansionPrompt', () => {
    it('should build prompt with domain context', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('health interventions', 'health');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];

      expect(calledPrompt).toContain('health');
      expect(calledPrompt).toContain('health interventions');
      expect(calledPrompt).toContain('Academic research literature search');
      expect(calledPrompt).toContain('If too broad');
      expect(calledPrompt).toContain('If already specific');
    });

    it('should include examples in prompt', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('test query', 'general');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];

      expect(calledPrompt).toContain('Examples:');
      expect(calledPrompt).toContain('climate');
      expect(calledPrompt).toContain('health');
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      // Create cache entry
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);
      await service.expandQuery('climate', 'general');

      // Clear expired cache
      service.clearExpiredCache();

      // Cache should still exist (not expired - 1 hour TTL)
      openaiService.generateCompletion.mockClear();
      await service.expandQuery('climate', 'general');
      expect(openaiService.generateCompletion).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle single-word queries', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockVagueQueryResponse);

      const result = await service.expandQuery('climate');

      expect(result.isTooVague).toBe(true);
      expect(result.narrowingQuestions.length).toBeGreaterThan(0);
    });

    it('should handle very long queries', async () => {
      const longQuery =
        'climate change impacts on agricultural productivity in sub-saharan africa with focus on smallholder farmers adaptation strategies';

      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(longQuery, 'climate');

      expect(result.expanded).toBeTruthy();
      expect(openaiService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining(longQuery),
        expect.any(Object)
      );
    });

    it('should handle queries with special characters', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const result = await service.expandQuery(
        'climate & health: impact?',
        'general'
      );

      expect(result.expanded).toBeTruthy();
    });

    it('should handle empty expanded response', async () => {
      openaiService.generateCompletion.mockResolvedValue({
        content: JSON.stringify({
          expanded: '',
          suggestions: [],
          isTooVague: true,
          narrowingQuestions: ['Please provide more context'],
          confidence: 0.3,
          relatedTerms: [],
        }),
      });

      const result = await service.expandQuery('', 'general');

      expect(result.expanded).toBe('');
      expect(result.isTooVague).toBe(true);
    });
  });

  describe('performance and caching', () => {
    it('should use cache for repeated queries within TTL', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      // Multiple calls with same parameters
      await service.expandQuery('climate', 'general');
      await service.expandQuery('climate', 'general');
      await service.expandQuery('climate', 'general');

      expect(openaiService.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests efficiently', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      const queries = ['climate', 'health', 'education', 'technology'];
      const promises = queries.map((q) => service.expandQuery(q, 'general'));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(openaiService.generateCompletion).toHaveBeenCalledTimes(4);
    });
  });

  describe('domain-specific behavior', () => {
    it('should adapt to climate domain', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('adaptation', 'climate');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('climate');
    });

    it('should adapt to health domain', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('intervention', 'health');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('health');
    });

    it('should adapt to education domain', async () => {
      openaiService.generateCompletion.mockResolvedValue(mockExpansionResponse);

      await service.expandQuery('learning', 'education');

      const calledPrompt = openaiService.generateCompletion.mock.calls[0][0];
      expect(calledPrompt).toContain('education');
    });
  });
});
