import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryController } from '../repository.controller';
import { ResearchRepositoryService } from '../../services/research-repository.service';
import { HttpStatus } from '@nestjs/common';

/**
 * Phase 10 Day 26: Repository Controller Tests
 *
 * Tests for REST API endpoints covering:
 * - Reindexing operations (all, study-specific)
 * - Search with filters and pagination
 * - Insight retrieval with lineage
 * - Related insights
 * - Facets and statistics
 * - Security (JWT authentication)
 * - Error handling
 */

describe('RepositoryController', () => {
  let controller: RepositoryController;
  let repositoryService: ResearchRepositoryService;

  const mockUserId = 'user-123';
  const mockStudyId = 'study-456';

  const mockRequest = {
    user: {
      userId: mockUserId,
    },
  };

  const mockInsight = {
    id: 'insight-1',
    title: 'Test Insight',
    content: 'This is a test insight.',
    type: 'statement' as const,
    sourceType: 'study' as const,
    sourceId: 'source-1',
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
    keywords: ['test'],
    tags: [],
    metadata: {},
    relatedInsights: [],
    relatedPapers: [],
    relatedThemes: [],
    searchVector: 'test insight',
    isPublic: false,
    shareLevel: 'private' as const,
    viewCount: 0,
    citationCount: 0,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoryController],
      providers: [
        {
          provide: ResearchRepositoryService,
          useValue: {
            reindexAll: jest.fn(),
            reindexStudy: jest.fn(),
            search: jest.fn(),
            getInsight: jest.fn(),
            getRelatedInsights: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RepositoryController>(RepositoryController);
    repositoryService = module.get<ResearchRepositoryService>(
      ResearchRepositoryService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // INDEXING ENDPOINT TESTS
  // ==========================================================================

  describe('POST /repository/index', () => {
    it('should reindex all entities for the user', async () => {
      jest.spyOn(repositoryService, 'reindexAll').mockResolvedValue(156);

      const result = await controller.reindexAll(mockRequest);

      expect(result).toEqual({
        indexed: 156,
        message: 'Successfully indexed 156 insights',
      });
      expect(repositoryService.reindexAll).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle zero results gracefully', async () => {
      jest.spyOn(repositoryService, 'reindexAll').mockResolvedValue(0);

      const result = await controller.reindexAll(mockRequest);

      expect(result.indexed).toBe(0);
      expect(result.message).toContain('0');
    });
  });

  describe('POST /repository/index/study/:studyId', () => {
    it('should reindex specific study', async () => {
      jest.spyOn(repositoryService, 'reindexStudy').mockResolvedValue(42);

      const result = await controller.reindexStudy(mockStudyId, mockRequest);

      expect(result).toEqual({
        studyId: mockStudyId,
        indexed: 42,
        message: `Successfully indexed 42 insights from study ${mockStudyId}`,
      });
      expect(repositoryService.reindexStudy).toHaveBeenCalledWith(
        mockStudyId,
        mockUserId,
      );
    });

    it('should handle empty study', async () => {
      jest.spyOn(repositoryService, 'reindexStudy').mockResolvedValue(0);

      const result = await controller.reindexStudy(mockStudyId, mockRequest);

      expect(result.indexed).toBe(0);
    });
  });

  // ==========================================================================
  // SEARCH ENDPOINT TESTS
  // ==========================================================================

  describe('GET /repository/search', () => {
    const mockSearchResult = {
      results: [
        {
          insight: mockInsight,
          score: 0.95,
          highlights: ['This is a test insight.'],
        },
      ],
      total: 1,
      facets: {
        types: new Map([['statement', 1]]),
        sourceTypes: new Map([['study', 1]]),
        studies: new Map([[mockStudyId, 1]]),
        dateRanges: new Map(),
      },
      query: { query: 'test' },
    };

    it('should search with basic query', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      const result = await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(result).toEqual(mockSearchResult);
      expect(repositoryService.search).toHaveBeenCalledWith({
        query: 'test',
        filters: {
          types: undefined,
          sourceTypes: undefined,
          studyIds: undefined,
          userIds: [mockUserId],
        },
        sort: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should apply type filters', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        'statement,factor',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            types: ['statement', 'factor'],
          }),
        }),
      );
    });

    it('should apply source type filters', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        'study,paper',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            sourceTypes: ['study', 'paper'],
          }),
        }),
      );
    });

    it('should apply study filters', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        'study-1,study-2',
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            studyIds: ['study-1', 'study-2'],
          }),
        }),
      );
    });

    it('should apply pagination', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        '10',
        '20',
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        }),
      );
    });

    it('should apply sorting', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'popularity',
        'desc',
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: {
            field: 'popularity',
            order: 'desc',
          },
        }),
      );
    });

    it('should default sort order to desc', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'date',
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: {
            field: 'date',
            order: 'desc',
          },
        }),
      );
    });

    it('should default limit to 20', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        }),
      );
    });

    it('should default offset to 0', async () => {
      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult);

      await controller.search(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest,
      );

      expect(repositoryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
        }),
      );
    });
  });

  // ==========================================================================
  // INSIGHT ENDPOINT TESTS
  // ==========================================================================

  describe('GET /repository/insights/:id', () => {
    it('should retrieve an insight', async () => {
      jest
        .spyOn(repositoryService, 'getInsight')
        .mockResolvedValue(mockInsight as any);

      const result = await controller.getInsight('insight-1', mockRequest);

      expect(result).toEqual(mockInsight);
      expect(repositoryService.getInsight).toHaveBeenCalledWith(
        'insight-1',
        mockUserId,
      );
    });

    it('should return 404 for non-existent insight', async () => {
      jest.spyOn(repositoryService, 'getInsight').mockResolvedValue(null);

      const result = await controller.getInsight('nonexistent', mockRequest);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Insight not found',
      });
    });
  });

  describe('GET /repository/insights/:id/related', () => {
    it('should get related insights with default limit', async () => {
      const mockRelated = [mockInsight, { ...mockInsight, id: 'insight-2' }];
      jest
        .spyOn(repositoryService, 'getRelatedInsights')
        .mockResolvedValue(mockRelated as any);

      const result = await controller.getRelatedInsights(
        'insight-1',
        undefined,
      );

      expect(result).toEqual(mockRelated);
      expect(repositoryService.getRelatedInsights).toHaveBeenCalledWith(
        'insight-1',
        5,
      );
    });

    it('should get related insights with custom limit', async () => {
      const mockRelated = [mockInsight];
      jest
        .spyOn(repositoryService, 'getRelatedInsights')
        .mockResolvedValue(mockRelated as any);

      const result = await controller.getRelatedInsights('insight-1', '10');

      expect(result).toEqual(mockRelated);
      expect(repositoryService.getRelatedInsights).toHaveBeenCalledWith(
        'insight-1',
        10,
      );
    });

    it('should handle empty related insights', async () => {
      jest.spyOn(repositoryService, 'getRelatedInsights').mockResolvedValue([]);

      const result = await controller.getRelatedInsights(
        'insight-1',
        undefined,
      );

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // FACETS ENDPOINT TESTS
  // ==========================================================================

  describe('GET /repository/facets', () => {
    it('should return available facets', async () => {
      const result = await controller.getFacets(mockRequest);

      expect(result).toEqual({
        types: [
          'statement',
          'factor',
          'theme',
          'gap',
          'quote',
          'paper_finding',
          'hypothesis',
        ],
        sourceTypes: ['study', 'paper', 'response', 'analysis', 'literature'],
        shareLevels: ['private', 'team', 'institution', 'public'],
        sortOptions: ['relevance', 'date', 'popularity', 'citationCount'],
      });
    });
  });

  // ==========================================================================
  // STATS ENDPOINT TESTS
  // ==========================================================================

  describe('GET /repository/stats', () => {
    it('should return repository statistics', async () => {
      const mockSearchResult = {
        results: [],
        total: 100,
        facets: {
          types: new Map([
            ['statement', 40],
            ['factor', 30],
            ['theme', 20],
            ['quote', 10],
          ]),
          sourceTypes: new Map([
            ['study', 60],
            ['paper', 30],
            ['analysis', 10],
          ]),
          studies: new Map([
            ['study-1', 50],
            ['study-2', 50],
          ]),
          dateRanges: new Map(),
        },
        query: {},
      };

      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(mockSearchResult as any);

      const result = await controller.getStats(mockRequest);

      expect(result).toEqual({
        totalInsights: 100,
        byType: {
          statement: 40,
          factor: 30,
          theme: 20,
          quote: 10,
        },
        bySourceType: {
          study: 60,
          paper: 30,
          analysis: 10,
        },
        byStudy: {
          'study-1': 50,
          'study-2': 50,
        },
      });

      expect(repositoryService.search).toHaveBeenCalledWith({
        query: '',
        filters: { userIds: [mockUserId] },
        limit: 0,
      });
    });

    it('should handle empty repository', async () => {
      const emptyResult = {
        results: [],
        total: 0,
        facets: {
          types: new Map(),
          sourceTypes: new Map(),
          studies: new Map(),
          dateRanges: new Map(),
        },
        query: {},
      };

      jest
        .spyOn(repositoryService, 'search')
        .mockResolvedValue(emptyResult as any);

      const result = await controller.getStats(mockRequest);

      expect(result.totalInsights).toBe(0);
      expect(result.byType).toEqual({});
      expect(result.bySourceType).toEqual({});
      expect(result.byStudy).toEqual({});
    });
  });
});
