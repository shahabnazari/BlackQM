import { Test, TestingModule } from '@nestjs/testing';
import { ResearchRepositoryService } from '../research-repository.service';
import { PrismaService } from '../../../../common/prisma.service';
import { CacheService } from '../../../../common/cache.service';
import { Logger } from '@nestjs/common';

/**
 * Phase 10 Day 26: Research Repository Service Tests
 *
 * Comprehensive test suite covering:
 * - Entity extraction (statements, factors, quotes, papers)
 * - Indexing and reindexing
 * - Search with faceting
 * - Related insights
 * - Keyword extraction
 * - Relevance scoring
 * - Error handling
 *
 * Target Coverage: >90%
 */

describe('ResearchRepositoryService', () => {
  let service: ResearchRepositoryService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  // Mock data
  const mockUserId = 'user-123';
  const mockStudyId = 'study-456';

  const mockStatement = {
    id: 'stmt-1',
    surveyId: mockStudyId,
    text: 'Climate change is the most pressing environmental issue of our time.',
    order: 1,
    sourcePaperId: 'paper-1',
    sourceThemeId: 'theme-1',
    perspective: 'supportive',
    generationMethod: 'theme-based',
    confidence: 0.9,
    provenance: {},
    statementProvenance: {
      sourcePaper: {
        id: 'paper-1',
        title: 'Climate Change and Society',
        authors: ['Smith, J.', 'Doe, A.'],
        year: 2023,
        doi: '10.1234/example',
      },
      sourceTheme: {
        id: 'theme-1',
        name: 'Climate Action',
        keywords: ['climate', 'environment', 'sustainability'],
        relevanceScore: 0.95,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAnalysisResult = {
    id: 'analysis-1',
    surveyId: mockStudyId,
    factors: [
      {
        factorNumber: 1,
        label: 'Environmental Activists',
        description: 'This factor represents environmental activists who prioritize climate action.',
        variance: 0.35,
        eigenvalue: 4.2,
        loadings: [0.8, 0.7, 0.6],
      },
      {
        factorNumber: 2,
        label: 'Economic Pragmatists',
        description: 'This factor represents those balancing environmental and economic concerns.',
        variance: 0.25,
        eigenvalue: 3.0,
        loadings: [0.7, 0.6, 0.5],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponse = {
    id: 'response-1',
    surveyId: mockStudyId,
    participantId: 'participant-1',
    completedAt: new Date(),
    answers: [
      {
        id: 'answer-1',
        questionId: 'q-1',
        responseId: 'response-1',
        value: 'I believe that renewable energy is essential for combating climate change and ensuring a sustainable future for our planet and future generations.',
        createdAt: new Date(),
      },
      {
        id: 'answer-2',
        questionId: 'q-2',
        responseId: 'response-1',
        value: 'Yes', // Short answer, should be filtered out
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
  };

  const mockPaper = {
    id: 'paper-1',
    title: 'Climate Change and Society: A Comprehensive Review',
    authors: ['Smith, J.', 'Doe, A.'],
    year: 2023,
    abstract: 'This paper examines the social implications of climate change and proposes policy interventions.',
    journal: 'Environmental Science',
    doi: '10.1234/example',
    citationCount: 45,
    keywords: ['climate change', 'society', 'policy'],
    fieldsOfStudy: ['Environmental Science', 'Social Science'],
    source: 'semantic_scholar',
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchRepositoryService,
        {
          provide: PrismaService,
          useValue: {
            statement: {
              findMany: jest.fn(),
            },
            analysisResult: {
              findMany: jest.fn(),
            },
            response: {
              findMany: jest.fn(),
            },
            paper: {
              findMany: jest.fn(),
            },
            researchInsight: {
              upsert: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            repositoryIndex: {
              upsert: jest.fn(),
            },
            survey: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResearchRepositoryService>(ResearchRepositoryService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // ENTITY EXTRACTION TESTS
  // ==========================================================================

  describe('extractInsightsFromStudy', () => {
    it('should extract insights from all sources', async () => {
      // Setup mocks
      jest.spyOn(prismaService.statement, 'findMany').mockResolvedValue([mockStatement] as any);
      jest.spyOn(prismaService.analysisResult, 'findMany').mockResolvedValue([mockAnalysisResult] as any);
      jest.spyOn(prismaService.response, 'findMany').mockResolvedValue([mockResponse] as any);

      const insights = await service.extractInsightsFromStudy(mockStudyId, mockUserId);

      // Should extract from statements, factors, and quotes
      expect(insights.length).toBeGreaterThan(0);
      expect(prismaService.statement.findMany).toHaveBeenCalledWith({
        where: { surveyId: mockStudyId },
        include: {
          statementProvenance: {
            include: {
              sourcePaper: true,
              sourceTheme: true,
            },
          },
        },
      });
      expect(prismaService.analysisResult.findMany).toHaveBeenCalled();
      expect(prismaService.response.findMany).toHaveBeenCalled();
    });

    it('should handle empty study gracefully', async () => {
      jest.spyOn(prismaService.statement, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.analysisResult, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.response, 'findMany').mockResolvedValue([]);

      const insights = await service.extractInsightsFromStudy(mockStudyId, mockUserId);

      expect(insights).toEqual([]);
    });
  });

  describe('extractStatementInsights', () => {
    it('should extract statement insights with full provenance', async () => {
      jest.spyOn(prismaService.statement, 'findMany').mockResolvedValue([mockStatement] as any);

      const insights = await service['extractStatementInsights'](mockStudyId, mockUserId);

      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('statement');
      expect(insights[0].content).toBe(mockStatement.text);
      expect(insights[0].citationChain).toHaveLength(3); // paper → theme → statement
      expect(insights[0].citationChain[0].type).toBe('paper');
      expect(insights[0].citationChain[1].type).toBe('theme');
      expect(insights[0].citationChain[2].type).toBe('statement');
      expect(insights[0].keywords).toBeDefined();
      expect(insights[0].keywords.length).toBeGreaterThan(0);
    });

    it('should handle statements without provenance', async () => {
      const statementWithoutProvenance = {
        ...mockStatement,
        statementProvenance: null,
      };
      jest.spyOn(prismaService.statement, 'findMany').mockResolvedValue([statementWithoutProvenance] as any);

      const insights = await service['extractStatementInsights'](mockStudyId, mockUserId);

      expect(insights).toHaveLength(1);
      expect(insights[0].citationChain).toHaveLength(1); // only statement
    });
  });

  describe('extractFactorInsights', () => {
    it('should extract factor insights from analysis results', async () => {
      jest.spyOn(prismaService.analysisResult, 'findMany').mockResolvedValue([mockAnalysisResult] as any);

      const insights = await service['extractFactorInsights'](mockStudyId, mockUserId);

      expect(insights).toHaveLength(2); // Two factors in mock data
      expect(insights[0].type).toBe('factor');
      expect(insights[0].title).toContain('Environmental Activists');
      expect(insights[0].content).toContain('environmental activists');
      expect(insights[0].citationChain[0].type).toBe('factor');
      expect(insights[0].citationChain[0].metadata).toHaveProperty('variance');
      expect(insights[0].citationChain[0].metadata).toHaveProperty('eigenvalue');
    });

    it('should handle analysis results without factors', async () => {
      const resultWithoutFactors = {
        ...mockAnalysisResult,
        factors: null,
      };
      jest.spyOn(prismaService.analysisResult, 'findMany').mockResolvedValue([resultWithoutFactors] as any);

      const insights = await service['extractFactorInsights'](mockStudyId, mockUserId);

      expect(insights).toEqual([]);
    });
  });

  describe('extractQuoteInsights', () => {
    it('should extract quotes from long text answers', async () => {
      jest.spyOn(prismaService.response, 'findMany').mockResolvedValue([mockResponse] as any);

      const insights = await service['extractQuoteInsights'](mockStudyId, mockUserId);

      expect(insights).toHaveLength(1); // Only one answer is >50 chars
      expect(insights[0].type).toBe('quote');
      expect(insights[0].content).toContain('renewable energy');
      expect(insights[0].keywords).toBeDefined();
    });

    it('should filter out short answers', async () => {
      const responseWithShortAnswers = {
        ...mockResponse,
        answers: [
          {
            id: 'answer-3',
            questionId: 'q-3',
            responseId: 'response-1',
            value: 'No',
            createdAt: new Date(),
          },
        ],
      };
      jest.spyOn(prismaService.response, 'findMany').mockResolvedValue([responseWithShortAnswers] as any);

      const insights = await service['extractQuoteInsights'](mockStudyId, mockUserId);

      expect(insights).toEqual([]);
    });

    it('should handle non-string answer values', async () => {
      const responseWithNonStringAnswers = {
        ...mockResponse,
        answers: [
          {
            id: 'answer-4',
            questionId: 'q-4',
            responseId: 'response-1',
            value: { rating: 5 }, // Object, not string
            createdAt: new Date(),
          },
        ],
      };
      jest.spyOn(prismaService.response, 'findMany').mockResolvedValue([responseWithNonStringAnswers] as any);

      const insights = await service['extractQuoteInsights'](mockStudyId, mockUserId);

      expect(insights).toEqual([]);
    });
  });

  describe('extractInsightsFromLiterature', () => {
    it('should extract insights from papers', async () => {
      jest.spyOn(prismaService.paper, 'findMany').mockResolvedValue([mockPaper] as any);

      const insights = await service.extractInsightsFromLiterature(mockUserId);

      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('paper_finding');
      expect(insights[0].title).toBe(mockPaper.title);
      expect(insights[0].content).toContain('social implications');
      expect(insights[0].keywords).toContain('climate change');
      expect(insights[0].citationCount).toBe(45);
    });

    it('should filter by paper IDs when provided', async () => {
      jest.spyOn(prismaService.paper, 'findMany').mockResolvedValue([mockPaper] as any);

      await service.extractInsightsFromLiterature(mockUserId, ['paper-1', 'paper-2']);

      expect(prismaService.paper.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, id: { in: ['paper-1', 'paper-2'] } },
        take: 100,
      });
    });

    it('should limit to 100 papers to prevent overwhelming extraction', async () => {
      jest.spyOn(prismaService.paper, 'findMany').mockResolvedValue([]);

      await service.extractInsightsFromLiterature(mockUserId);

      expect(prismaService.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  // ==========================================================================
  // INDEXING TESTS
  // ==========================================================================

  describe('indexInsight', () => {
    it('should index an insight to both tables', async () => {
      const mockInsight = {
        id: 'insight-1',
        title: 'Test Insight',
        content: 'This is a test insight about climate change.',
        type: 'statement' as const,
        sourceType: 'study' as const,
        sourceId: 'stmt-1',
        studyId: mockStudyId,
        userId: mockUserId,
        citationChain: [],
        provenance: {
          extractionMethod: 'test',
          confidence: 0.9,
          sources: [],
          generatedAt: new Date(),
          generatedBy: 'test',
        },
        keywords: ['climate', 'change', 'test'],
        searchVector: 'test insight about climate change',
        isPublic: false,
        shareLevel: 'private' as const,
        viewCount: 0,
        citationCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.researchInsight, 'upsert').mockResolvedValue({} as any);
      jest.spyOn(prismaService.repositoryIndex, 'upsert').mockResolvedValue({} as any);

      await service.indexInsight(mockInsight);

      expect(prismaService.researchInsight.upsert).toHaveBeenCalledWith({
        where: { id: mockInsight.id },
        create: expect.objectContaining({
          id: mockInsight.id,
          title: mockInsight.title,
          content: mockInsight.content,
        }),
        update: expect.objectContaining({
          title: mockInsight.title,
          content: mockInsight.content,
        }),
      });

      expect(prismaService.repositoryIndex.upsert).toHaveBeenCalled();
    });
  });

  describe('indexInsights', () => {
    it('should batch index multiple insights', async () => {
      const mockInsights = [
        { id: 'insight-1' } as any,
        { id: 'insight-2' } as any,
        { id: 'insight-3' } as any,
      ];

      jest.spyOn(service, 'indexInsight').mockResolvedValue(undefined);

      const indexed = await service.indexInsights(mockInsights);

      expect(indexed).toBe(3);
      expect(service.indexInsight).toHaveBeenCalledTimes(3);
    });

    it('should continue indexing on individual failures', async () => {
      const mockInsights = [
        { id: 'insight-1' } as any,
        { id: 'insight-2' } as any,
        { id: 'insight-3' } as any,
      ];

      jest.spyOn(service, 'indexInsight')
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Index failed'))
        .mockResolvedValueOnce(undefined);

      const indexed = await service.indexInsights(mockInsights);

      expect(indexed).toBe(2); // Only 2 successful
      expect(service.indexInsight).toHaveBeenCalledTimes(3);
    });
  });

  describe('reindexStudy', () => {
    it('should extract and index all insights from a study', async () => {
      jest.spyOn(service, 'extractInsightsFromStudy').mockResolvedValue([{ id: 'insight-1' } as any]);
      jest.spyOn(service, 'indexInsights').mockResolvedValue(1);

      const indexed = await service.reindexStudy(mockStudyId, mockUserId);

      expect(indexed).toBe(1);
      expect(service.extractInsightsFromStudy).toHaveBeenCalledWith(mockStudyId, mockUserId);
      expect(service.indexInsights).toHaveBeenCalledWith([{ id: 'insight-1' }]);
    });
  });

  describe('reindexAll', () => {
    it('should reindex all studies and literature for a user', async () => {
      jest.spyOn(prismaService.survey, 'findMany').mockResolvedValue([
        { id: 'study-1' },
        { id: 'study-2' },
      ] as any);
      jest.spyOn(service, 'reindexStudy').mockResolvedValue(5);
      jest.spyOn(service, 'extractInsightsFromLiterature').mockResolvedValue([{ id: 'lit-1' }] as any);
      jest.spyOn(service, 'indexInsights').mockResolvedValue(1);

      const totalIndexed = await service.reindexAll(mockUserId);

      expect(totalIndexed).toBe(11); // 2 studies * 5 + 1 literature
      expect(service.reindexStudy).toHaveBeenCalledTimes(2);
      expect(service.extractInsightsFromLiterature).toHaveBeenCalledWith(mockUserId);
    });
  });

  // ==========================================================================
  // SEARCH TESTS
  // ==========================================================================

  describe('search', () => {
    const mockInsightFromDb = {
      id: 'insight-1',
      title: 'Climate Change Insight',
      content: 'This insight discusses climate change impacts on society.',
      type: 'statement',
      sourceType: 'study',
      sourceId: 'stmt-1',
      studyId: mockStudyId,
      userId: mockUserId,
      citationChain: [],
      provenance: {},
      keywords: ['climate', 'change', 'society'],
      tags: [],
      metadata: {},
      relatedInsights: [],
      relatedPapers: [],
      relatedThemes: [],
      searchVector: 'climate change insight',
      isPublic: false,
      shareLevel: 'private',
      viewCount: 10,
      citationCount: 2,
      version: 1,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should search insights with query', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue([mockInsightFromDb] as any);
      jest.spyOn(prismaService.researchInsight, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.researchInsight, 'groupBy').mockResolvedValue([]);

      const result = await service.search({
        query: 'climate change',
        limit: 20,
        offset: 0,
      });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.results[0].insight.title).toContain('Climate');
      expect(result.results[0].score).toBeGreaterThan(0);
      expect(result.results[0].highlights).toBeDefined();
    });

    it('should return cached results when available', async () => {
      const cachedResult = {
        results: [],
        total: 0,
        facets: {
          types: new Map(),
          sourceTypes: new Map(),
          studies: new Map(),
          dateRanges: new Map(),
        },
        query: { query: 'test' },
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedResult);

      const result = await service.search({ query: 'test' });

      expect(result).toEqual(cachedResult);
      expect(prismaService.researchInsight.findMany).not.toHaveBeenCalled();
    });

    it('should apply type filters', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.researchInsight, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.researchInsight, 'groupBy').mockResolvedValue([]);

      await service.search({
        query: 'test',
        filters: {
          types: ['statement', 'factor'],
        },
      });

      expect(prismaService.researchInsight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['statement', 'factor'] },
          }),
        })
      );
    });

    it('should apply date range filters', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.researchInsight, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.researchInsight, 'groupBy').mockResolvedValue([]);

      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');

      await service.search({
        query: 'test',
        filters: {
          dateRange: { from, to },
        },
      });

      expect(prismaService.researchInsight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.researchInsight, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.researchInsight, 'groupBy').mockResolvedValue([]);

      await service.search({
        query: 'test',
        limit: 10,
        offset: 20,
      });

      expect(prismaService.researchInsight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should cache search results', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(cacheService, 'set').mockResolvedValue(true);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.researchInsight, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.researchInsight, 'groupBy').mockResolvedValue([]);

      await service.search({ query: 'test' });

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        300 // 5 minutes
      );
    });
  });

  describe('getInsight', () => {
    it('should retrieve an insight and increment view count', async () => {
      const mockInsight = { id: 'insight-1', userId: mockUserId } as any;

      jest.spyOn(prismaService.researchInsight, 'findFirst').mockResolvedValue(mockInsight);
      jest.spyOn(prismaService.researchInsight, 'update').mockResolvedValue({} as any);

      const result = await service.getInsight('insight-1', mockUserId);

      expect(result).toBeDefined();
      expect(prismaService.researchInsight.update).toHaveBeenCalledWith({
        where: { id: 'insight-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should return null for non-existent insight', async () => {
      jest.spyOn(prismaService.researchInsight, 'findFirst').mockResolvedValue(null);

      const result = await service.getInsight('nonexistent', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getRelatedInsights', () => {
    it('should find related insights by study and type', async () => {
      const mockInsight = {
        id: 'insight-1',
        studyId: mockStudyId,
        type: 'statement',
      } as any;

      const mockRelated = [
        { id: 'insight-2', studyId: mockStudyId } as any,
        { id: 'insight-3', type: 'statement' } as any,
      ];

      jest.spyOn(prismaService.researchInsight, 'findUnique').mockResolvedValue(mockInsight);
      jest.spyOn(prismaService.researchInsight, 'findMany').mockResolvedValue(mockRelated);

      const related = await service.getRelatedInsights('insight-1', 5);

      expect(related).toHaveLength(2);
      expect(prismaService.researchInsight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'insight-1' },
          }),
          take: 5,
        })
      );
    });

    it('should return empty array for non-existent insight', async () => {
      jest.spyOn(prismaService.researchInsight, 'findUnique').mockResolvedValue(null);

      const related = await service.getRelatedInsights('nonexistent');

      expect(related).toEqual([]);
    });
  });

  // ==========================================================================
  // HELPER METHOD TESTS
  // ==========================================================================

  describe('extractKeywords', () => {
    it('should extract meaningful keywords from text', () => {
      const text = 'Climate change is the most pressing environmental issue of our time and requires immediate action.';

      const keywords = service['extractKeywords'](text, 5);

      expect(keywords).toBeDefined();
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(5);
      // Should not contain stop words
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('of');
    });

    it('should filter out short words', () => {
      const text = 'The AI can be a tool for the job.';

      const keywords = service['extractKeywords'](text);

      // Words under 4 chars should be filtered
      keywords.forEach(keyword => {
        expect(keyword.length).toBeGreaterThan(3);
      });
    });

    it('should handle empty text', () => {
      const keywords = service['extractKeywords']('');

      expect(keywords).toEqual([]);
    });

    it('should handle text with only stop words', () => {
      const text = 'the a an and or but in on at to for';

      const keywords = service['extractKeywords'](text);

      expect(keywords).toEqual([]);
    });
  });

  describe('buildSearchVector', () => {
    it('should combine and normalize multiple text fields', () => {
      const vector = service['buildSearchVector'](
        'Climate Change',
        'Environmental Impact',
        'Policy Implications'
      );

      expect(vector).toBe('climate change environmental impact policy implications');
      expect(vector).not.toContain('  '); // No double spaces
    });

    it('should handle special characters', () => {
      const vector = service['buildSearchVector'](
        'Climate-change',
        'Impact (significant)',
        'Policy: action!'
      );

      expect(vector).toContain('climate');
      expect(vector).toContain('change');
      expect(vector).not.toContain('-');
      expect(vector).not.toContain('(');
      expect(vector).not.toContain(')');
    });

    it('should filter out empty strings', () => {
      const vector = service['buildSearchVector']('', 'test', '', 'value');

      expect(vector).toBe('test value');
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate relevance with all factors', () => {
      const insight = {
        citationCount: 10,
        viewCount: 100,
        provenance: { confidence: 0.9 },
      } as any;

      const score = service['calculateRelevanceScore'](insight);

      expect(score).toBeGreaterThan(0.5); // Base score
      expect(score).toBeLessThanOrEqual(1.0); // Max score
    });

    it('should cap score at 1.0', () => {
      const insight = {
        citationCount: 1000,
        viewCount: 10000,
        provenance: { confidence: 1.0 },
      } as any;

      const score = service['calculateRelevanceScore'](insight);

      expect(score).toBe(1.0);
    });

    it('should handle zero citations and views', () => {
      const insight = {
        citationCount: 0,
        viewCount: 0,
        provenance: { confidence: 0.5 },
      } as any;

      const score = service['calculateRelevanceScore'](insight);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1.0);
    });
  });

  describe('calculateSearchScore', () => {
    it('should score higher for title matches', () => {
      const insight = {
        title: 'Climate Change Research',
        content: 'Some other content',
        keywords: [],
        viewCount: 0,
        citationCount: 0,
      } as any;

      const score = service['calculateSearchScore'](insight, 'climate');

      expect(score).toBeGreaterThan(0);
    });

    it('should score for content matches', () => {
      const insight = {
        title: 'Research',
        content: 'This discusses climate change impacts',
        keywords: [],
        viewCount: 0,
        citationCount: 0,
      } as any;

      const score = service['calculateSearchScore'](insight, 'climate');

      expect(score).toBeGreaterThan(0);
    });

    it('should score for keyword matches', () => {
      const insight = {
        title: 'Research',
        content: 'Some content',
        keywords: ['climate', 'change', 'policy'],
        viewCount: 0,
        citationCount: 0,
      } as any;

      const score = service['calculateSearchScore'](insight, 'climate');

      expect(score).toBeGreaterThan(0);
    });

    it('should add popularity boost', () => {
      const popularInsight = {
        title: 'Research',
        content: 'climate',
        keywords: [],
        viewCount: 100,
        citationCount: 50,
      } as any;

      const unpopularInsight = {
        title: 'Research',
        content: 'climate',
        keywords: [],
        viewCount: 0,
        citationCount: 0,
      } as any;

      const popularScore = service['calculateSearchScore'](popularInsight, 'climate');
      const unpopularScore = service['calculateSearchScore'](unpopularInsight, 'climate');

      expect(popularScore).toBeGreaterThan(unpopularScore);
    });

    it('should return basic score for empty query', () => {
      const insight = {
        viewCount: 10,
        citationCount: 5,
      } as any;

      const score = service['calculateSearchScore'](insight, '');

      expect(score).toBe(15); // viewCount + citationCount
    });
  });

  describe('extractHighlights', () => {
    it('should extract context around query matches', () => {
      const text = 'Climate change is a pressing issue that affects everyone. We must take action on climate change now.';
      const query = 'climate change';

      const highlights = service['extractHighlights'](text, query);

      expect(highlights.length).toBeGreaterThan(0);
      expect(highlights[0]).toContain('climate change');
    });

    it('should limit to 3 highlights', () => {
      const text = 'climate change '.repeat(10);
      const query = 'climate';

      const highlights = service['extractHighlights'](text, query);

      expect(highlights.length).toBeLessThanOrEqual(3);
    });

    it('should handle no matches', () => {
      const text = 'Some random text';
      const query = 'nonexistent';

      const highlights = service['extractHighlights'](text, query);

      expect(highlights).toEqual([]);
    });

    it('should add ellipsis for truncated context', () => {
      const longText = 'x'.repeat(200) + 'climate change' + 'y'.repeat(200);
      const query = 'climate';

      const highlights = service['extractHighlights'](longText, query, 50);

      expect(highlights[0]).toContain('...');
    });
  });
});
