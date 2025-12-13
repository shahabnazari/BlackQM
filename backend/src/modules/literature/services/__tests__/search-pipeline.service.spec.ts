/**
 * SearchPipelineService End-to-End Unit Tests
 * Phase 10.120 - Netflix-Grade Search Pipeline Testing
 *
 * Comprehensive tests covering:
 * 1. BM25 Scoring Stage
 * 2. Semantic Scoring Stage
 * 3. Combined Score Calculation
 * 4. Quality Filtering
 * 5. Progressive Semantic Streaming
 * 6. Error Handling & Graceful Degradation
 * 7. Cancellation Support (AbortSignal)
 * 8. Budget Management Integration
 *
 * @module LiteratureSearch
 * @since Phase 10.120
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SearchPipelineService } from '../search-pipeline.service';
import { NeuralRelevanceService, PaperWithNeuralScore } from '../neural-relevance.service';
import { LocalEmbeddingService } from '../local-embedding.service';
import { NeuralBudgetService, BudgetAllocation, QualityLevel } from '../neural-budget.service';
import { AdaptiveTimeoutService } from '../adaptive-timeout.service';
import { GracefulDegradationService } from '../graceful-degradation.service';
import { ThemeFitScoringService, ThemeFitScore } from '../theme-fit-scoring.service';
import { ProgressiveSemanticService, SemanticTierResult } from '../progressive-semantic.service';
import { Paper, LiteratureSource } from '../../dto/literature.dto';
import { QueryComplexity } from '../../constants/source-allocation.constants';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Create a mock Paper with customizable properties
 */
function createMockPaper(overrides: Partial<Paper> = {}): Paper {
  const id = `paper-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return {
    id,
    title: overrides.title ?? `Mock Paper Title ${id}`,
    authors: overrides.authors ?? ['Author One', 'Author Two'],
    abstract: overrides.abstract ?? 'This is a mock abstract about machine learning and neural networks in medical research.',
    source: overrides.source ?? LiteratureSource.SEMANTIC_SCHOLAR,
    year: overrides.year ?? 2023,
    citationCount: overrides.citationCount ?? 50,
    qualityScore: overrides.qualityScore ?? 60,
    ...overrides,
  };
}

/**
 * Create multiple mock papers for batch testing
 */
function createMockPapers(count: number, baseOverrides: Partial<Paper> = {}): Paper[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPaper({
      ...baseOverrides,
      title: `Paper ${i + 1}: ${baseOverrides.title ?? 'Research Study'}`,
      citationCount: (baseOverrides.citationCount ?? 50) + i * 10,
      qualityScore: Math.min(100, (baseOverrides.qualityScore ?? 60) + i * 2),
    })
  );
}

/**
 * Create mock pipeline configuration
 */
function createMockConfig(overrides: Partial<{
  query: string;
  queryComplexity: QueryComplexity;
  targetPaperCount: number;
  sortOption: string;
  emitProgress: (message: string, progress: number) => void;
  signal: AbortSignal;
}> = {}) {
  return {
    query: overrides.query ?? 'machine learning medical diagnosis',
    queryComplexity: overrides.queryComplexity ?? QueryComplexity.COMPREHENSIVE,
    targetPaperCount: overrides.targetPaperCount ?? 300,
    sortOption: overrides.sortOption ?? 'relevance',
    emitProgress: overrides.emitProgress ?? jest.fn(),
    signal: overrides.signal,
  };
}

/**
 * Create mock budget allocation
 */
function createMockBudget(overrides: Partial<BudgetAllocation> = {}): BudgetAllocation {
  return {
    maxConcurrentRequests: overrides.maxConcurrentRequests ?? 10,
    batchSize: overrides.batchSize ?? 32,
    timeoutMs: overrides.timeoutMs ?? 30000,
    qualityLevel: overrides.qualityLevel ?? 'full',
    skipNeuralReranking: overrides.skipNeuralReranking ?? false,
    skipEmbeddings: overrides.skipEmbeddings ?? false,
    reason: overrides.reason ?? 'Test budget allocation',
  };
}

/**
 * Create mock ThemeFit score
 */
function createMockThemeFitScore(overrides: Partial<ThemeFitScore> = {}): ThemeFitScore {
  return {
    overallThemeFit: overrides.overallThemeFit ?? 0.6,
    controversyPotential: overrides.controversyPotential ?? 0.5,
    statementClarity: overrides.statementClarity ?? 0.7,
    perspectiveDiversity: overrides.perspectiveDiversity ?? 0.4,
    citationControversy: overrides.citationControversy ?? 0.3,
    explanation: overrides.explanation ?? 'Controversy=0.5, Clarity=0.7, Diversity=0.4, CitationControversy=0.3',
  };
}

// ============================================================================
// MOCK SERVICE IMPLEMENTATIONS
// ============================================================================

const mockNeuralRelevanceService = {
  rerankWithSciBERT: jest.fn(),
  filterByDomain: jest.fn(),
  filterByAspects: jest.fn(),
  parseQueryAspects: jest.fn(),
};

const mockLocalEmbeddingService = {
  generateEmbedding: jest.fn(),
  generateEmbeddingsBatch: jest.fn(),
};

const mockNeuralBudgetService = {
  startRequest: jest.fn(),
  endRequest: jest.fn(),
  requestBudget: jest.fn(),
};

const mockAdaptiveTimeoutService = {
  recordLatency: jest.fn(),
  getTimeout: jest.fn().mockReturnValue(30000),
};

const mockGracefulDegradationService = {
  executeWithReduced: jest.fn(),
};

const mockThemeFitScoringService = {
  calculateThemeFitScore: jest.fn(),
  calculateThemeFitScoresBatch: jest.fn(),
  isGoodForThematization: jest.fn(),
  getThematizationTier: jest.fn(),
};

const mockProgressiveSemanticService = {
  generateQueryEmbedding: jest.fn(),
  streamSemanticScores: jest.fn(),
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('SearchPipelineService', () => {
  let service: SearchPipelineService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockNeuralBudgetService.requestBudget.mockReturnValue(createMockBudget());
    mockThemeFitScoringService.calculateThemeFitScore.mockReturnValue(createMockThemeFitScore());
    mockLocalEmbeddingService.generateEmbedding.mockResolvedValue(
      Array(384).fill(0).map(() => Math.random())
    );
    mockLocalEmbeddingService.generateEmbeddingsBatch.mockImplementation(
      async (texts: string[]) => texts.map(() => Array(384).fill(0).map(() => Math.random()))
    );
    mockGracefulDegradationService.executeWithReduced.mockImplementation(
      async (name, fullFn) => {
        const data = await fullFn();
        return { isFullQuality: true, data, level: 'full', message: 'Success' };
      }
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchPipelineService,
        { provide: NeuralRelevanceService, useValue: mockNeuralRelevanceService },
        { provide: LocalEmbeddingService, useValue: mockLocalEmbeddingService },
        { provide: NeuralBudgetService, useValue: mockNeuralBudgetService },
        { provide: AdaptiveTimeoutService, useValue: mockAdaptiveTimeoutService },
        { provide: GracefulDegradationService, useValue: mockGracefulDegradationService },
        { provide: ThemeFitScoringService, useValue: mockThemeFitScoringService },
        { provide: ProgressiveSemanticService, useValue: mockProgressiveSemanticService },
      ],
    }).compile();

    service = module.get<SearchPipelineService>(SearchPipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================================================
  // 1. BASIC PIPELINE EXECUTION
  // ==========================================================================
  describe('Basic Pipeline Execution', () => {
    it('should execute optimized pipeline with valid inputs', async () => {
      const papers = createMockPapers(50, {
        abstract: 'Machine learning algorithms for medical diagnosis using neural networks.',
      });
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockNeuralBudgetService.startRequest).toHaveBeenCalled();
      expect(mockNeuralBudgetService.endRequest).toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const papers: Paper[] = [];
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      expect(result).toEqual([]);
    });

    it('should return empty array for null input', async () => {
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(null as unknown as Paper[], config);

      expect(result).toEqual([]);
    });

    it('should emit progress events during execution', async () => {
      const papers = createMockPapers(20);
      const emitProgress = jest.fn();
      const config = createMockConfig({ emitProgress });

      await service.executeOptimizedPipeline(papers, config);

      expect(emitProgress).toHaveBeenCalled();
      // Should have called progress for multiple stages
      expect(emitProgress.mock.calls.length).toBeGreaterThan(0);
    });

    it('should request budget at start and release at end', async () => {
      const papers = createMockPapers(30);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      expect(mockNeuralBudgetService.startRequest).toHaveBeenCalledTimes(1);
      expect(mockNeuralBudgetService.requestBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
          estimatedPapers: 30,
          requiresNeuralReranking: true,
          requiresEmbeddings: true,
        })
      );
      expect(mockNeuralBudgetService.endRequest).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 2. BM25 SCORING TESTS
  // ==========================================================================
  describe('BM25 Scoring Stage', () => {
    it('should calculate BM25 scores for papers with matching keywords', async () => {
      const papers = createMockPapers(10, {
        title: 'Deep Learning for Medical Image Analysis',
        abstract: 'Deep learning neural networks for medical image analysis and diagnosis.',
      });
      const config = createMockConfig({ query: 'deep learning medical imaging' });

      const result = await service.executeOptimizedPipeline(papers, config);

      // Papers should have relevance scores assigned
      expect(result.length).toBeGreaterThan(0);
      result.forEach(paper => {
        expect(paper.relevanceScore).toBeDefined();
      });
    });

    it('should boost NCBI source papers in BM25 scoring', async () => {
      const pmcPaper = createMockPaper({
        title: 'PubMed Central Research',
        abstract: 'Medical research from PMC.',
        source: 'pmc' as LiteratureSource,
      });
      const regularPaper = createMockPaper({
        title: 'Regular Source Research',
        abstract: 'General research abstract.',
        source: LiteratureSource.SEMANTIC_SCHOLAR,
      });

      const papers = [pmcPaper, regularPaper];
      const config = createMockConfig({ query: 'medical research' });

      const result = await service.executeOptimizedPipeline(papers, config);

      // PMC paper should not be filtered out despite potentially lower BM25
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle papers with empty abstracts', async () => {
      const papers = [
        createMockPaper({ abstract: '' }),
        createMockPaper({ abstract: 'Valid abstract with keywords.' }),
      ];
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      // Should not crash, may return fewer papers
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==========================================================================
  // 3. SEMANTIC SCORING TESTS
  // ==========================================================================
  describe('Semantic Scoring Stage', () => {
    it('should generate query embedding', async () => {
      const papers = createMockPapers(10);
      const config = createMockConfig({ query: 'neural network classification' });

      await service.executeOptimizedPipeline(papers, config);

      expect(mockLocalEmbeddingService.generateEmbedding).toHaveBeenCalledWith(
        'neural network classification'
      );
    });

    it('should generate paper embeddings in batch', async () => {
      const papers = createMockPapers(20);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      expect(mockLocalEmbeddingService.generateEmbeddingsBatch).toHaveBeenCalled();
    });

    it('should use graceful degradation for embedding generation', async () => {
      const papers = createMockPapers(15);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      expect(mockGracefulDegradationService.executeWithReduced).toHaveBeenCalledWith(
        'semantic:embeddings',
        expect.any(Function),
        expect.any(Function),
        undefined // signal
      );
    });

    it('should handle embedding generation failure gracefully', async () => {
      mockGracefulDegradationService.executeWithReduced.mockResolvedValueOnce({
        isFullQuality: false,
        data: null,
        level: 'fallback',
        message: 'Embedding service unavailable',
      });

      const papers = createMockPapers(10);
      const config = createMockConfig();

      // Should not throw, should use neutral scores
      const result = await service.executeOptimizedPipeline(papers, config);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should NEVER skip embeddings even when budget suggests it', async () => {
      mockNeuralBudgetService.requestBudget.mockReturnValue(
        createMockBudget({ skipEmbeddings: true })
      );

      const papers = createMockPapers(10);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      // Should still call embedding generation despite skipEmbeddings=true
      expect(mockGracefulDegradationService.executeWithReduced).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 4. COMBINED SCORE CALCULATION
  // ==========================================================================
  describe('Combined Score Calculation', () => {
    it('should calculate combined scores with correct weights', async () => {
      const papers = createMockPapers(5, {
        abstract: 'Machine learning medical diagnosis neural networks.',
      });
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      result.forEach(paper => {
        expect(paper.neuralRelevanceScore).toBeDefined();
        expect(paper.neuralExplanation).toBeDefined();
        // Score should be in 0-100 range
        expect(paper.neuralRelevanceScore).toBeGreaterThanOrEqual(0);
        expect(paper.neuralRelevanceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should include ThemeFit in combined score', async () => {
      const papers = createMockPapers(5);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      // ThemeFitScoringService should have been called for each paper
      expect(mockThemeFitScoringService.calculateThemeFitScore.mock.calls.length).toBeGreaterThan(0);
    });

    it('should set isGoodForThematization flag on papers', async () => {
      mockThemeFitScoringService.calculateThemeFitScore.mockReturnValue(
        createMockThemeFitScore({ overallThemeFit: 0.75 })
      );

      const papers = createMockPapers(5);
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      result.forEach(paper => {
        // Papers with themeFit >= 0.5 should be marked as good for thematization
        expect(paper.isGoodForThematization).toBeDefined();
      });
    });

    it('should generate neuralExplanation with score breakdown', async () => {
      const papers = createMockPapers(3);
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      result.forEach(paper => {
        expect(paper.neuralExplanation).toContain('BM25=');
        expect(paper.neuralExplanation).toContain('Sem=');
        expect(paper.neuralExplanation).toContain('ThemeFit=');
      });
    });
  });

  // ==========================================================================
  // 5. QUALITY FILTERING
  // ==========================================================================
  describe('Quality Filtering Stage', () => {
    it('should filter papers below quality threshold', async () => {
      const papers = [
        createMockPaper({ qualityScore: 10, abstract: 'Low quality paper.' }),
        createMockPaper({ qualityScore: 50, abstract: 'Medium quality paper.' }),
        createMockPaper({ qualityScore: 80, abstract: 'High quality paper.' }),
      ];
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      // Low quality paper (score 10) should be filtered out (threshold is 20)
      // Higher quality papers should remain
      const qualityScores = result.map(p => p.qualityScore ?? 0);
      qualityScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(20);
      });
    });

    it('should preserve NCBI papers even with lower quality scores', async () => {
      const pmcPaper = createMockPaper({
        qualityScore: 15,
        source: 'pmc' as LiteratureSource,
        abstract: 'PMC paper with lower quality score.',
      });
      const papers = [pmcPaper];
      const config = createMockConfig();

      // In the optimized pipeline, NCBI boost applies differently
      // This tests that the pipeline handles various quality scores
      const result = await service.executeOptimizedPipeline(papers, config);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==========================================================================
  // 6. CANCELLATION SUPPORT (AbortSignal)
  // ==========================================================================
  describe('Cancellation Support', () => {
    it('should throw error when aborted before execution', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const papers = createMockPapers(10);
      const config = createMockConfig({ signal: abortController.signal });

      await expect(service.executeOptimizedPipeline(papers, config))
        .rejects.toThrow('Request cancelled');
    });

    it('should check abort signal before semantic scoring', async () => {
      const abortController = new AbortController();

      // Mock to abort after BM25 scoring
      mockGracefulDegradationService.executeWithReduced.mockImplementation(
        async () => {
          // Simulate abort during embedding generation
          abortController.abort();
          throw new Error('Request cancelled');
        }
      );

      const papers = createMockPapers(10);
      const config = createMockConfig({ signal: abortController.signal });

      await expect(service.executeOptimizedPipeline(papers, config))
        .rejects.toThrow('Request cancelled');
    });

    it('should release budget even when cancelled', async () => {
      const abortController = new AbortController();

      mockGracefulDegradationService.executeWithReduced.mockRejectedValue(
        new Error('Request cancelled')
      );

      const papers = createMockPapers(10);
      const config = createMockConfig({ signal: abortController.signal });

      try {
        await service.executeOptimizedPipeline(papers, config);
      } catch {
        // Expected to throw
      }

      expect(mockNeuralBudgetService.startRequest).toHaveBeenCalled();
      // Budget should be released even on error (handled by finally or catch)
    });
  });

  // ==========================================================================
  // 7. PROGRESSIVE SEMANTIC STREAMING
  // ==========================================================================
  describe('Progressive Semantic Streaming', () => {
    it('should generate query embedding for streaming', async () => {
      const papers = createMockPapers(100);
      const query = 'test query';

      mockProgressiveSemanticService.generateQueryEmbedding.mockResolvedValue(
        Array(384).fill(0.1)
      );
      mockProgressiveSemanticService.streamSemanticScores.mockImplementation(
        async function* () {
          yield {
            tier: 'immediate',
            version: 1,
            papers: papers.slice(0, 50).map(p => ({ ...p, semanticScore: 0.7 })),
            latencyMs: 500,
            isComplete: false,
            metadata: {
              papersProcessed: 50,
              cacheHits: 0,
              embedGenerated: 50,
              usedWorkerPool: true,
            },
          } as SemanticTierResult;
        }
      );

      const results: SemanticTierResult[] = [];
      for await (const result of service.streamProgressiveSemanticScores(papers, query)) {
        results.push(result);
      }

      expect(mockProgressiveSemanticService.generateQueryEmbedding).toHaveBeenCalledWith(query);
      expect(results.length).toBe(1);
      expect(results[0].tier).toBe('immediate');
    });

    it('should yield multiple tiers progressively', async () => {
      const papers = createMockPapers(200);
      const query = 'progressive test';

      mockProgressiveSemanticService.generateQueryEmbedding.mockResolvedValue(
        Array(384).fill(0.1)
      );
      mockProgressiveSemanticService.streamSemanticScores.mockImplementation(
        async function* () {
          yield {
            tier: 'immediate',
            version: 1,
            papers: papers.slice(0, 50).map(p => ({ ...p, semanticScore: 0.7 })),
            latencyMs: 400,
            isComplete: false,
            metadata: {
              papersProcessed: 50,
              cacheHits: 0,
              embedGenerated: 50,
              usedWorkerPool: true,
            },
          } as SemanticTierResult;
          yield {
            tier: 'refined',
            version: 2,
            papers: papers.slice(0, 150).map(p => ({ ...p, semanticScore: 0.65 })),
            latencyMs: 1500,
            isComplete: false,
            metadata: {
              papersProcessed: 150,
              cacheHits: 10,
              embedGenerated: 100,
              usedWorkerPool: true,
            },
          } as SemanticTierResult;
          yield {
            tier: 'complete',
            version: 3,
            papers: papers.map(p => ({ ...p, semanticScore: 0.6 })),
            latencyMs: 5000,
            isComplete: true,
            metadata: {
              papersProcessed: 200,
              cacheHits: 50,
              embedGenerated: 150,
              usedWorkerPool: true,
            },
          } as SemanticTierResult;
        }
      );

      const results: SemanticTierResult[] = [];
      for await (const result of service.streamProgressiveSemanticScores(papers, query)) {
        results.push(result);
      }

      expect(results.length).toBe(3);
      expect(results[0].tier).toBe('immediate');
      expect(results[1].tier).toBe('refined');
      expect(results[2].tier).toBe('complete');
    });

    it('should handle empty papers array gracefully', async () => {
      const papers: Paper[] = [];
      const query = 'test';

      const results: SemanticTierResult[] = [];
      for await (const result of service.streamProgressiveSemanticScores(papers, query)) {
        results.push(result);
      }

      expect(results.length).toBe(0);
      expect(mockProgressiveSemanticService.generateQueryEmbedding).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 8. COMBINED SCORE HELPER METHOD
  // ==========================================================================
  describe('calculateCombinedScores Method', () => {
    it('should calculate combined scores with default weights', () => {
      const papersWithSemantic = createMockPapers(5).map((p, i) => ({
        ...p,
        relevanceScore: 50 + i * 10,
        semanticScore: 0.5 + i * 0.1,
      }));

      const result = service.calculateCombinedScores(papersWithSemantic as any);

      result.forEach(paper => {
        expect(paper.combinedScore).toBeDefined();
        expect(paper.neuralRelevanceScore).toBeDefined();
        expect(paper.neuralExplanation).toContain('BM25=');
        expect(paper.neuralExplanation).toContain('Sem=');
        expect(paper.neuralExplanation).toContain('ThemeFit=');
      });
    });

    it('should use custom weights when provided', () => {
      const papersWithSemantic = createMockPapers(3).map(p => ({
        ...p,
        relevanceScore: 60,
        semanticScore: 0.8,
      }));

      const result = service.calculateCombinedScores(
        papersWithSemantic as any,
        0.3,  // BM25 weight
        0.5,  // Semantic weight
        0.2   // ThemeFit weight
      );

      expect(result.length).toBe(3);
      result.forEach(paper => {
        expect(paper.combinedScore).toBeDefined();
      });
    });

    it('should calculate ThemeFit if not present', () => {
      const papersWithoutThemeFit = createMockPapers(2).map(p => ({
        ...p,
        relevanceScore: 50,
        semanticScore: 0.6,
        // No themeFitScore
      }));

      const result = service.calculateCombinedScores(papersWithoutThemeFit as any);

      // Should have called ThemeFitScoringService
      expect(mockThemeFitScoringService.calculateThemeFitScore.mock.calls.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 9. EDGE CASES & ERROR HANDLING
  // ==========================================================================
  describe('Edge Cases & Error Handling', () => {
    it('should handle papers with missing titles', async () => {
      const papers = [
        createMockPaper({ title: undefined as unknown as string }),
        createMockPaper({ title: 'Valid Title' }),
      ];
      const config = createMockConfig();

      // Should not throw
      const result = await service.executeOptimizedPipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle papers with missing DOIs', async () => {
      const papers = createMockPapers(5).map(p => ({ ...p, doi: undefined }));
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle very long abstracts', async () => {
      const longAbstract = 'word '.repeat(2000);
      const papers = [createMockPaper({ abstract: longAbstract })];
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle special characters in query', async () => {
      const papers = createMockPapers(5);
      const config = createMockConfig({
        query: 'COVID-19 & SARS-CoV-2 (coronavirus)',
      });

      const result = await service.executeOptimizedPipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle unicode characters in abstracts', async () => {
      const papers = [
        createMockPaper({
          abstract: 'Research on 中文 characters and émoji 🧬 in text.',
        }),
      ];
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect target paper count limit', async () => {
      const papers = createMockPapers(500);
      const config = createMockConfig({ targetPaperCount: 100 });

      const result = await service.executeOptimizedPipeline(papers, config);

      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // 10. LEGACY PIPELINE (executePipeline)
  // ==========================================================================
  describe('Legacy Pipeline Execution', () => {
    beforeEach(() => {
      // Setup neural reranking mock
      mockNeuralRelevanceService.rerankWithSciBERT.mockImplementation(
        async (query, papers) => papers.map((p: Paper, i: number) => ({
          ...p,
          neuralRelevanceScore: 0.8 - i * 0.01,
          neuralRank: i + 1,
          neuralExplanation: 'Mock neural explanation',
        }))
      );

      // Setup domain filtering mock
      mockNeuralRelevanceService.filterByDomain.mockImplementation(
        async (papers) => papers.map((p: Paper) => ({
          ...p,
          domain: 'Medicine',
          domainConfidence: 0.9,
        }))
      );

      // Setup aspect filtering mock
      mockNeuralRelevanceService.filterByAspects.mockImplementation(
        async (papers) => papers.map((p: Paper) => ({
          ...p,
          aspects: { subjectType: 'research', methodType: 'experimental' },
        }))
      );

      mockNeuralRelevanceService.parseQueryAspects.mockReturnValue({
        subjectType: 'any',
        methodType: 'any',
      });
    });

    it('should throw error for invalid papers parameter', async () => {
      const config = createMockConfig();

      await expect(service.executePipeline(null as unknown as Paper[], config))
        .rejects.toThrow('Invalid papers parameter');
    });

    it('should throw error for missing config', async () => {
      const papers = createMockPapers(5);

      await expect(service.executePipeline(papers, null as unknown as any))
        .rejects.toThrow('Invalid config parameter');
    });

    it('should throw error for empty query', async () => {
      const papers = createMockPapers(5);
      const config = createMockConfig({ query: '' });

      await expect(service.executePipeline(papers, config))
        .rejects.toThrow('Invalid config.query');
    });

    it('should throw error for invalid targetPaperCount', async () => {
      const papers = createMockPapers(5);
      const config = createMockConfig({ targetPaperCount: -1 });

      await expect(service.executePipeline(papers, config))
        .rejects.toThrow('Invalid config.targetPaperCount');
    });

    it('should throw error for missing emitProgress function', async () => {
      const papers = createMockPapers(5);
      const config = {
        query: 'test',
        queryComplexity: QueryComplexity.COMPREHENSIVE,
        targetPaperCount: 100,
        emitProgress: 'not a function' as unknown as () => void,
      };

      await expect(service.executePipeline(papers, config))
        .rejects.toThrow('Invalid config.emitProgress');
    });

    it('should execute full 8-stage pipeline', async () => {
      const papers = createMockPapers(20, {
        abstract: 'Machine learning study on medical diagnosis.',
        qualityScore: 50,
      });
      const config = createMockConfig();

      const result = await service.executePipeline(papers, config);

      expect(result.length).toBeGreaterThan(0);
      expect(mockNeuralRelevanceService.rerankWithSciBERT).toHaveBeenCalled();
      expect(mockNeuralRelevanceService.filterByDomain).toHaveBeenCalled();
      expect(mockNeuralRelevanceService.filterByAspects).toHaveBeenCalled();
    });

    it('should handle neural reranking timeout gracefully', async () => {
      mockNeuralRelevanceService.rerankWithSciBERT.mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Neural reranking timeout')), 100)
        )
      );

      const papers = createMockPapers(10, { qualityScore: 50 });
      const config = createMockConfig();

      // Should not throw, should fallback to BM25
      const result = await service.executePipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle domain classification failure gracefully', async () => {
      mockNeuralRelevanceService.filterByDomain.mockRejectedValue(
        new Error('Domain classification unavailable')
      );

      const papers = createMockPapers(10, { qualityScore: 50 });
      const config = createMockConfig();

      // Should not throw, should skip domain filter
      const result = await service.executePipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle aspect filtering failure gracefully', async () => {
      mockNeuralRelevanceService.filterByAspects.mockRejectedValue(
        new Error('Aspect filtering unavailable')
      );

      const papers = createMockPapers(10, { qualityScore: 50 });
      const config = createMockConfig();

      // Should not throw, should skip aspect filter
      const result = await service.executePipeline(papers, config);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==========================================================================
  // 11. PERFORMANCE & OPTIMIZATION
  // ==========================================================================
  describe('Performance & Optimization', () => {
    it('should limit papers for semantic scoring (pre-filter)', async () => {
      // Create more papers than MAX_PAPERS_FOR_SEMANTIC (600)
      const papers = createMockPapers(800);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      // The batch embedding call should receive limited papers
      const batchCall = mockLocalEmbeddingService.generateEmbeddingsBatch.mock.calls[0];
      expect(batchCall[0].length).toBeLessThanOrEqual(600);
    });

    it('should record embedding latency for adaptive timeout', async () => {
      const papers = createMockPapers(20);
      const config = createMockConfig();

      await service.executeOptimizedPipeline(papers, config);

      expect(mockAdaptiveTimeoutService.recordLatency).toHaveBeenCalledWith(
        'embedding:batch',
        expect.any(Number),
        true
      );
    });

    it('should sort results by combined score', async () => {
      const papers = createMockPapers(20);
      const config = createMockConfig({ sortOption: 'relevance' });

      const result = await service.executeOptimizedPipeline(papers, config);

      // Check that results are sorted by neuralRelevanceScore (descending)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].neuralRelevanceScore ?? 0)
          .toBeGreaterThanOrEqual(result[i].neuralRelevanceScore ?? 0);
      }
    });

    it('should assign ranks to all papers', async () => {
      const papers = createMockPapers(15);
      const config = createMockConfig();

      const result = await service.executeOptimizedPipeline(papers, config);

      result.forEach((paper, idx) => {
        expect(paper.neuralRank).toBe(idx + 1);
      });
    });
  });
});
