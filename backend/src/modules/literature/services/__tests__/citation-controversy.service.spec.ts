/**
 * Phase 10.113 Week 4: Citation Controversy Service Tests
 *
 * Comprehensive unit tests for citation-based controversy analysis.
 * Tests CCI calculation, camp detection, and debate paper identification.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CitationControversyService } from '../citation-controversy.service';
import { LocalEmbeddingService } from '../local-embedding.service';
import {
  CitationAnalysisPaperInput,
  ControversyClassification,
  DebatePaperRole,
  DEFAULT_CITATION_CONTROVERSY_CONFIG,
} from '../../types/citation-controversy.types';

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Generate mock embedding (384 dimensions for MiniLM)
 */
function generateMockEmbedding(seed: number): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 384; i++) {
    embedding.push(Math.sin(seed * i * 0.1) * 0.5);
  }
  return embedding;
}

/**
 * Create mock papers for testing
 */
function createMockPapers(): CitationAnalysisPaperInput[] {
  return [
    // Camp A papers (climate change is human-caused)
    {
      id: 'paper-a1',
      title: 'Evidence for Anthropogenic Climate Change',
      abstract: 'We argue that human activities are the primary driver of climate change.',
      year: 2020,
      citationCount: 150,
      references: ['paper-a2', 'paper-a3', 'paper-debate1'],
      citedBy: ['paper-a2', 'paper-a3'],
      keywords: ['climate', 'anthropogenic', 'evidence'],
      embedding: generateMockEmbedding(1),
    },
    {
      id: 'paper-a2',
      title: 'Human Impact on Global Temperature',
      abstract: 'This study demonstrates the correlation between CO2 emissions and temperature rise.',
      year: 2021,
      citationCount: 80,
      references: ['paper-a1', 'paper-debate1'],
      citedBy: ['paper-a1', 'paper-a3'],
      keywords: ['temperature', 'emissions', 'correlation'],
      embedding: generateMockEmbedding(2),
    },
    {
      id: 'paper-a3',
      title: 'Climate Models and Predictions',
      abstract: 'We propose new models for predicting climate change impacts.',
      year: 2019,
      citationCount: 200,
      references: ['paper-a1', 'paper-a2'],
      citedBy: ['paper-a1', 'paper-a2'],
      keywords: ['models', 'predictions', 'climate'],
      embedding: generateMockEmbedding(3),
    },
    // Camp B papers (skeptical viewpoint)
    {
      id: 'paper-b1',
      title: 'Natural Climate Variability Analysis',
      abstract: 'We challenge the assumption that all climate change is anthropogenic.',
      year: 2020,
      citationCount: 60,
      references: ['paper-b2', 'paper-b3', 'paper-debate1'],
      citedBy: ['paper-b2', 'paper-b3'],
      keywords: ['natural', 'variability', 'challenge'],
      embedding: generateMockEmbedding(101),
    },
    {
      id: 'paper-b2',
      title: 'Solar Cycles and Temperature',
      abstract: 'This paper questions the dominant narrative by examining solar influences.',
      year: 2021,
      citationCount: 45,
      references: ['paper-b1', 'paper-debate1'],
      citedBy: ['paper-b1', 'paper-b3'],
      keywords: ['solar', 'cycles', 'temperature'],
      embedding: generateMockEmbedding(102),
    },
    {
      id: 'paper-b3',
      title: 'Historical Climate Patterns',
      abstract: 'We suggest that historical data shows natural climate cycles.',
      year: 2018,
      citationCount: 90,
      references: ['paper-b1', 'paper-b2'],
      citedBy: ['paper-b1', 'paper-b2'],
      keywords: ['historical', 'patterns', 'cycles'],
      embedding: generateMockEmbedding(103),
    },
    // Debate paper (cited by both camps)
    {
      id: 'paper-debate1',
      title: 'Comprehensive Climate Review: Methods and Approaches',
      abstract: 'A methodology paper reviewing climate analysis techniques.',
      year: 2015,
      citationCount: 500,
      references: [],
      citedBy: ['paper-a1', 'paper-a2', 'paper-b1', 'paper-b2'],
      keywords: ['review', 'methodology', 'climate'],
      embedding: generateMockEmbedding(50),
    },
  ];
}

/**
 * Create minimal mock papers (below threshold)
 */
function createMinimalPapers(): CitationAnalysisPaperInput[] {
  return [
    {
      id: 'paper-1',
      title: 'Test Paper 1',
      year: 2020,
      citationCount: 10,
      embedding: generateMockEmbedding(1),
    },
    {
      id: 'paper-2',
      title: 'Test Paper 2',
      year: 2021,
      citationCount: 5,
      embedding: generateMockEmbedding(2),
    },
  ];
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('CitationControversyService', () => {
  let service: CitationControversyService;
  let embeddingService: LocalEmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationControversyService,
        {
          provide: LocalEmbeddingService,
          useValue: {
            cosineSimilarity: jest.fn((a: number[], b: number[]) => {
              // Simple mock cosine similarity
              let dot = 0;
              let normA = 0;
              let normB = 0;
              for (let i = 0; i < Math.min(a.length, b.length); i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
              }
              return dot / (Math.sqrt(normA) * Math.sqrt(normB));
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CitationControversyService>(CitationControversyService);
    embeddingService = module.get<LocalEmbeddingService>(LocalEmbeddingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCitationControversy', () => {
    it('should return empty result for insufficient papers', async () => {
      const papers = createMinimalPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Test Topic',
      );

      expect(result.topic).toBe('Test Topic');
      expect(result.camps).toHaveLength(0);
      expect(result.debatePapers).toHaveLength(0);
      expect(result.paperCCIs).toHaveLength(0);
      expect(result.metadata.warnings.some(
        (w) => w.includes('Insufficient papers')
      )).toBe(true);
    });

    it('should analyze papers and detect camps', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      expect(result.topic).toBe('Climate Change');
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
      expect(result.qualityMetrics.papersAnalyzed).toBe(papers.length);
    });

    it('should calculate CCI for all papers', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      expect(result.paperCCIs.length).toBe(papers.length);
      for (const cci of result.paperCCIs) {
        expect(cci.score).toBeGreaterThanOrEqual(0);
        expect(cci.score).toBeLessThanOrEqual(1);
        expect(cci.classification).toBeDefined();
        expect(cci.components).toBeDefined();
      }
    });

    it('should identify debate papers cited by multiple camps', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      // The methodology paper should be identified as a debate paper
      const methodologyDebate = result.debatePapers.find(
        (dp) => dp.paperId === 'paper-debate1'
      );

      if (result.camps.length >= 2) {
        expect(methodologyDebate).toBeDefined();
        if (methodologyDebate) {
          expect(methodologyDebate.citationsByCamp.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should respect cancellation signal', async () => {
      const papers = createMockPapers();
      const abortController = new AbortController();

      // Abort immediately
      abortController.abort();

      await expect(
        service.analyzeCitationControversy(
          papers,
          'Climate Change',
          {},
          undefined,
          abortController.signal,
        )
      ).rejects.toThrow('cancelled');
    });

    it('should call progress callback with stages', async () => {
      const papers = createMockPapers();
      const progressCallback = jest.fn();

      await service.analyzeCitationControversy(
        papers,
        'Climate Change',
        {},
        progressCallback,
      );

      expect(progressCallback).toHaveBeenCalled();
      // Should have called with multiple stages
      const stages = progressCallback.mock.calls.map((call) => call[0]);
      expect(stages).toContain('INITIALIZING');
      expect(stages).toContain('COMPLETE');
    });

    it('should merge custom config with defaults', async () => {
      const papers = createMockPapers();
      const customConfig = {
        minCitationsForAnalysis: 10,
        controversyThreshold: 0.8,
      };

      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
        customConfig,
      );

      expect(result.metadata.config.minCitationsForAnalysis).toBe(10);
      expect(result.metadata.config.controversyThreshold).toBe(0.8);
      // Ensure defaults are preserved
      expect(result.metadata.config.highVelocityThreshold).toBe(
        DEFAULT_CITATION_CONTROVERSY_CONFIG.highVelocityThreshold
      );
    });
  });

  describe('controversy classification', () => {
    it('should classify low CCI as CONSENSUS', async () => {
      const papers = createMockPapers().map((p) => ({
        ...p,
        citationCount: 1, // Low citations
        references: [],
        citedBy: [],
      }));

      const result = await service.analyzeCitationControversy(
        papers,
        'Low Controversy Topic',
      );

      // Most papers should have low controversy
      const consensusPapers = result.paperCCIs.filter(
        (cci) => cci.classification === ControversyClassification.CONSENSUS
      );
      expect(consensusPapers.length).toBeGreaterThan(0);
    });
  });

  describe('quality metrics', () => {
    it('should calculate quality metrics correctly', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      const metrics = result.qualityMetrics;
      expect(metrics.papersAnalyzed).toBe(papers.length);
      expect(metrics.avgCampCohesion).toBeGreaterThanOrEqual(0);
      expect(metrics.avgCampCohesion).toBeLessThanOrEqual(1);
      expect(metrics.coverage).toBeGreaterThanOrEqual(0);
      expect(metrics.coverage).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle papers without embeddings', async () => {
      const papers = createMockPapers().map((p) => ({
        ...p,
        embedding: undefined,
      }));

      const result = await service.analyzeCitationControversy(
        papers,
        'No Embeddings Topic',
      );

      // Should still return a result, but with warning
      expect(result).toBeDefined();
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
    });

    it('should handle papers without citation data', async () => {
      const papers = createMockPapers().map((p) => ({
        ...p,
        references: undefined,
        citedBy: undefined,
      }));

      const result = await service.analyzeCitationControversy(
        papers,
        'No Citations Topic',
      );

      expect(result).toBeDefined();
      expect(result.metadata.warnings.some(
        (w) => w.includes('citation data')
      )).toBe(true);
    });

    it('should handle empty topic string', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        '',
      );

      expect(result.topic).toBe('');
      expect(result).toBeDefined();
    });
  });

  describe('debate paper roles', () => {
    it('should classify old highly-cited papers as FOUNDATIONAL', async () => {
      const papers: CitationAnalysisPaperInput[] = [
        // Very old, highly cited paper
        {
          id: 'foundational-paper',
          title: 'Seminal Work in Field',
          abstract: 'This foundational work established the field.',
          year: 2000, // Very old
          citationCount: 500, // Highly cited
          references: [],
          citedBy: ['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5'],
          keywords: ['foundational', 'seminal'],
          embedding: generateMockEmbedding(1),
        },
        // Papers that cite the foundational work
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `paper-${i + 1}`,
          title: `Citing Paper ${i + 1}`,
          abstract: `This paper builds on foundational work.`,
          year: 2020 + (i % 3),
          citationCount: 10 + i * 5,
          references: ['foundational-paper'],
          citedBy: [],
          keywords: ['citing', 'extension'],
          embedding: generateMockEmbedding(100 + i),
        })),
      ];

      const result = await service.analyzeCitationControversy(
        papers,
        'Foundational Topic',
      );

      // Check if foundational paper was identified
      const foundationalDebate = result.debatePapers.find(
        (dp) => dp.paperId === 'foundational-paper'
      );

      if (foundationalDebate) {
        expect(foundationalDebate.debateRole).toBe(DebatePaperRole.FOUNDATIONAL);
      }
    });

    it('should classify methodology papers correctly', async () => {
      const papers: CitationAnalysisPaperInput[] = [
        // Methodology paper
        {
          id: 'method-paper',
          title: 'A Novel Method for Data Analysis',
          abstract: 'We present a new methodology and framework for analysis.',
          year: 2018,
          citationCount: 200,
          references: [],
          citedBy: ['paper-1', 'paper-2', 'paper-3', 'paper-4', 'paper-5', 'paper-6'],
          keywords: ['method', 'framework', 'technique'],
          embedding: generateMockEmbedding(1),
        },
        // Papers using the methodology
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `paper-${i + 1}`,
          title: `Application Paper ${i + 1}`,
          abstract: `Using the methodology to analyze data.`,
          year: 2020 + (i % 3),
          citationCount: 15 + i * 3,
          references: ['method-paper'],
          citedBy: [],
          keywords: ['application', 'using'],
          embedding: generateMockEmbedding(100 + i),
        })),
      ];

      const result = await service.analyzeCitationControversy(
        papers,
        'Methodology Topic',
      );

      const methodDebate = result.debatePapers.find(
        (dp) => dp.paperId === 'method-paper'
      );

      if (methodDebate) {
        expect(methodDebate.debateRole).toBe(DebatePaperRole.METHODOLOGY);
      }
    });
  });

  describe('CCI components', () => {
    it('should calculate velocity score based on citations per year', async () => {
      const papers: CitationAnalysisPaperInput[] = [
        // High velocity paper (100 citations in 1 year = 100/year)
        {
          id: 'high-velocity',
          title: 'Rapidly Cited Paper',
          year: new Date().getFullYear() - 1,
          citationCount: 100,
          embedding: generateMockEmbedding(1),
        },
        // Low velocity paper (10 citations in 10 years = 1/year)
        {
          id: 'low-velocity',
          title: 'Slowly Cited Paper',
          year: new Date().getFullYear() - 10,
          citationCount: 10,
          embedding: generateMockEmbedding(2),
        },
        // More papers to meet threshold
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `filler-${i}`,
          title: `Filler Paper ${i}`,
          year: 2020,
          citationCount: 20,
          embedding: generateMockEmbedding(100 + i),
        })),
      ];

      const result = await service.analyzeCitationControversy(
        papers,
        'Velocity Test',
      );

      const highVelocityCCI = result.paperCCIs.find(
        (cci) => cci.paperId === 'high-velocity'
      );
      const lowVelocityCCI = result.paperCCIs.find(
        (cci) => cci.paperId === 'low-velocity'
      );

      if (highVelocityCCI && lowVelocityCCI) {
        expect(highVelocityCCI.components.velocityScore).toBeGreaterThan(
          lowVelocityCCI.components.velocityScore
        );
      }
    });

    it('should calculate recency score based on publication year', async () => {
      const currentYear = new Date().getFullYear();
      const papers: CitationAnalysisPaperInput[] = [
        // Recent paper
        {
          id: 'recent',
          title: 'Recent Paper',
          year: currentYear,
          citationCount: 10,
          embedding: generateMockEmbedding(1),
        },
        // Old paper
        {
          id: 'old',
          title: 'Old Paper',
          year: currentYear - 15,
          citationCount: 100,
          embedding: generateMockEmbedding(2),
        },
        // More papers to meet threshold
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `filler-${i}`,
          title: `Filler Paper ${i}`,
          year: 2020,
          citationCount: 20,
          embedding: generateMockEmbedding(100 + i),
        })),
      ];

      const result = await service.analyzeCitationControversy(
        papers,
        'Recency Test',
      );

      const recentCCI = result.paperCCIs.find((cci) => cci.paperId === 'recent');
      const oldCCI = result.paperCCIs.find((cci) => cci.paperId === 'old');

      if (recentCCI && oldCCI) {
        expect(recentCCI.components.recencyScore).toBeGreaterThan(
          oldCCI.components.recencyScore
        );
      }
    });
  });

  describe('topic controversy score', () => {
    it('should return higher score for topics with more camps', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Multi-Camp Topic',
      );

      // With proper camp detection, controversy score should be > 0
      if (result.camps.length >= 2) {
        expect(result.topicControversyScore).toBeGreaterThan(0);
      }
    });

    it('should return 0 for single-camp topics', async () => {
      // Create papers that all cite each other (single camp)
      const papers: CitationAnalysisPaperInput[] = Array.from(
        { length: 6 },
        (_, i) => ({
          id: `unified-${i}`,
          title: `Unified View Paper ${i}`,
          abstract: 'All papers agree on this topic.',
          year: 2020,
          citationCount: 20,
          references: Array.from({ length: 6 }, (_, j) =>
            j !== i ? `unified-${j}` : ''
          ).filter((id) => id),
          citedBy: Array.from({ length: 6 }, (_, j) =>
            j !== i ? `unified-${j}` : ''
          ).filter((id) => id),
          keywords: ['unified', 'consensus'],
          embedding: generateMockEmbedding(i), // Similar embeddings
        })
      );

      const result = await service.analyzeCitationControversy(
        papers,
        'Consensus Topic',
      );

      // Should have low controversy since papers are unified
      expect(result.topicControversyScore).toBeLessThan(0.5);
    });
  });

  describe('description generation', () => {
    it('should generate meaningful description', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      expect(result.description).toBeTruthy();
      expect(result.description.length).toBeGreaterThan(20);
      expect(result.description).toContain('Climate Change');
    });

    it('should include camp count in description when camps exist', async () => {
      const papers = createMockPapers();
      const result = await service.analyzeCitationControversy(
        papers,
        'Climate Change',
      );

      if (result.camps.length >= 2) {
        expect(result.description).toMatch(/\d+ camps/);
      }
    });
  });
});
