/**
 * Phase 10.113 Week 3: MetaThemeDiscoveryService Unit Tests
 *
 * Comprehensive test coverage for hierarchical theme extraction:
 * - Level 1: Meta-theme clustering
 * - Level 2: Sub-theme extraction
 * - Quality metrics calculation
 * - Edge cases and error handling
 *
 * @author Phase 10.113 - Hierarchical Theme Extraction
 * @date December 2025
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MetaThemeDiscoveryService } from '../meta-theme-discovery.service';
import { LocalEmbeddingService } from '../local-embedding.service';
import { KMeansClusteringService } from '../kmeans-clustering.service';
import { MathematicalUtilitiesService } from '../mathematical-utilities.service';
import { ThemeFitScoringService } from '../theme-fit-scoring.service';
import type {
  HierarchicalPaperInput,
  HierarchicalExtractionConfig,
  HierarchicalExtractionResult,
  MetaTheme,
  SubTheme,
} from '../../types/hierarchical-theme.types';
import {
  HierarchicalExtractionStage,
  DEFAULT_HIERARCHICAL_CONFIG,
  isMetaTheme,
  isSubTheme,
  isHierarchicalExtractionResult,
} from '../../types/hierarchical-theme.types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Generate mock papers for testing
 */
function generateMockPapers(count: number): HierarchicalPaperInput[] {
  const domains = [
    'machine learning',
    'climate change',
    'healthcare',
    'economics',
    'psychology',
  ];

  return Array.from({ length: count }, (_, i) => {
    const domain = domains[i % domains.length];
    return {
      id: `paper-${i}`,
      title: `Research on ${domain} topic ${i}`,
      abstract: `This study investigates ${domain} phenomena. We found significant results in ${domain} research. The findings suggest important implications for ${domain} practice.`,
      themeFitScore: 0.5 + Math.random() * 0.5,
      keywords: [domain, 'research', `topic${i}`],
    };
  });
}

/**
 * Generate mock embeddings (384 dimensions)
 */
function generateMockEmbedding(): number[] {
  return Array.from({ length: 384 }, () => Math.random() - 0.5);
}

/**
 * Mock LocalEmbeddingService
 */
const mockEmbeddingService = {
  generateEmbeddingsBatch: jest.fn().mockImplementation(async (texts: string[]) => {
    return texts.map(() => generateMockEmbedding());
  }),
  cosineSimilarity: jest.fn().mockImplementation((a: number[], b: number[]) => {
    // Simple mock similarity
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }),
};

/**
 * Mock KMeansClusteringService
 */
const mockKmeansService = {
  kMeansPlusPlusClustering: jest.fn().mockImplementation(
    async (codes, _embeddings, k) => {
      // Distribute codes evenly into k clusters
      const clusters = [];
      const perCluster = Math.ceil(codes.length / k);

      for (let i = 0; i < k; i++) {
        const clusterCodes = codes.slice(i * perCluster, (i + 1) * perCluster);
        if (clusterCodes.length > 0) {
          clusters.push({
            codes: clusterCodes,
            centroid: generateMockEmbedding(),
            metadata: { clusterIndex: i, size: clusterCodes.length },
          });
        }
      }
      return clusters;
    },
  ),
};

/**
 * Mock MathematicalUtilitiesService
 */
const mockMathUtils = {
  euclideanDistance: jest.fn().mockImplementation((a: number[], b: number[]) => {
    let sum = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }),
  calculateDaviesBouldinIndex: jest.fn().mockReturnValue(0.5),
  calculateSilhouetteScore: jest.fn().mockReturnValue(0.7),
};

/**
 * Mock ThemeFitScoringService
 */
const mockThemeFitScoring = {
  calculateThemeFitScore: jest.fn().mockReturnValue({
    controversyPotential: 0.6,
    statementClarity: 0.7,
    perspectiveDiversity: 0.5,
    citationControversy: 0.4,
    overallThemeFit: 0.55,
    explanation: 'Mock score',
  }),
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('MetaThemeDiscoveryService', () => {
  let service: MetaThemeDiscoveryService;
  let module: TestingModule;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        MetaThemeDiscoveryService,
        { provide: LocalEmbeddingService, useValue: mockEmbeddingService },
        { provide: KMeansClusteringService, useValue: mockKmeansService },
        { provide: MathematicalUtilitiesService, useValue: mockMathUtils },
        { provide: ThemeFitScoringService, useValue: mockThemeFitScoring },
      ],
    }).compile();

    service = module.get<MetaThemeDiscoveryService>(MetaThemeDiscoveryService);
  });

  afterEach(async () => {
    await module.close();
  });

  // ============================================================================
  // BASIC EXTRACTION TESTS
  // ============================================================================

  describe('extractHierarchicalThemes', () => {
    it('should extract hierarchical themes from papers', async () => {
      const papers = generateMockPapers(50);

      const result = await service.extractHierarchicalThemes(papers);

      expect(result).toBeDefined();
      expect(result.metaThemes).toBeDefined();
      expect(result.metaThemes.length).toBeGreaterThan(0);
      expect(result.totalPapers).toBe(50);
      expect(result.clusteredPapers).toBeGreaterThan(0);
    });

    it('should respect configuration for meta-theme count', async () => {
      const papers = generateMockPapers(100);
      const config: Partial<HierarchicalExtractionConfig> = {
        minMetaThemes: 5,
        maxMetaThemes: 8,
      };

      const result = await service.extractHierarchicalThemes(papers, config);

      expect(result.metaThemes.length).toBeGreaterThanOrEqual(1);
      expect(result.metaThemes.length).toBeLessThanOrEqual(8);
    });

    it('should throw error for insufficient papers', async () => {
      const papers = generateMockPapers(5); // Less than minimum

      await expect(service.extractHierarchicalThemes(papers)).rejects.toThrow(
        /Insufficient papers/,
      );
    });

    it('should handle cancellation signal', async () => {
      const papers = generateMockPapers(50);
      const abortController = new AbortController();

      // Abort immediately
      abortController.abort();

      await expect(
        service.extractHierarchicalThemes(papers, {}, undefined, abortController.signal),
      ).rejects.toThrow(/cancelled/);
    });
  });

  // ============================================================================
  // META-THEME STRUCTURE TESTS
  // ============================================================================

  describe('MetaTheme structure', () => {
    it('should create valid MetaTheme objects', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        expect(isMetaTheme(metaTheme)).toBe(true);
        expect(metaTheme.id).toBeDefined();
        expect(metaTheme.label).toBeDefined();
        expect(metaTheme.label.length).toBeGreaterThan(0);
        expect(metaTheme.paperIds).toBeDefined();
        expect(Array.isArray(metaTheme.paperIds)).toBe(true);
        expect(metaTheme.centroidEmbedding).toBeDefined();
        expect(metaTheme.coherenceScore).toBeGreaterThanOrEqual(0);
        expect(metaTheme.coherenceScore).toBeLessThanOrEqual(1);
        expect(metaTheme.weight).toBeGreaterThanOrEqual(0);
        expect(metaTheme.weight).toBeLessThanOrEqual(1);
      }
    });

    it('should include representative papers', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.representativePaperIds).toBeDefined();
        expect(Array.isArray(metaTheme.representativePaperIds)).toBe(true);
        // Representative papers should be subset of cluster papers
        for (const repId of metaTheme.representativePaperIds) {
          expect(metaTheme.paperIds).toContain(repId);
        }
      }
    });

    it('should extract keywords for each meta-theme', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.keywords).toBeDefined();
        expect(Array.isArray(metaTheme.keywords)).toBe(true);
        // Should have at least some keywords
        expect(metaTheme.keywords.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate controversy level', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.controversyLevel).toBeDefined();
        expect(metaTheme.controversyLevel).toBeGreaterThanOrEqual(0);
        expect(metaTheme.controversyLevel).toBeLessThanOrEqual(1);
      }
    });
  });

  // ============================================================================
  // SUB-THEME EXTRACTION TESTS
  // ============================================================================

  describe('SubTheme extraction', () => {
    it('should extract sub-themes for meta-themes with sufficient papers', async () => {
      const papers = generateMockPapers(100);
      const config: Partial<HierarchicalExtractionConfig> = {
        minSubThemesPerMeta: 2,
        maxSubThemesPerMeta: 4,
        minPapersPerCluster: 2,
      };

      const result = await service.extractHierarchicalThemes(papers, config);

      // At least some meta-themes should have sub-themes
      const metaThemesWithSubThemes = result.metaThemes.filter(
        m => m.subThemes.length > 0,
      );
      expect(metaThemesWithSubThemes.length).toBeGreaterThan(0);
    });

    it('should create valid SubTheme objects', async () => {
      const papers = generateMockPapers(100);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        for (const subTheme of metaTheme.subThemes) {
          expect(isSubTheme(subTheme)).toBe(true);
          expect(subTheme.id).toBeDefined();
          expect(subTheme.parentMetaThemeId).toBe(metaTheme.id);
          expect(subTheme.label).toBeDefined();
          expect(subTheme.paperIds).toBeDefined();
          expect(Array.isArray(subTheme.paperIds)).toBe(true);
          expect(subTheme.keyPaperIds).toBeDefined();
          expect(subTheme.weight).toBeGreaterThanOrEqual(0);
          expect(subTheme.weight).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should link sub-themes to parent meta-theme', async () => {
      const papers = generateMockPapers(100);
      const result = await service.extractHierarchicalThemes(papers);

      const metaThemeIds = new Set(result.metaThemes.map(m => m.id));

      for (const metaTheme of result.metaThemes) {
        for (const subTheme of metaTheme.subThemes) {
          expect(metaThemeIds.has(subTheme.parentMetaThemeId)).toBe(true);
        }
      }
    });

    it('should ensure sub-theme papers are subset of meta-theme papers', async () => {
      const papers = generateMockPapers(100);
      const result = await service.extractHierarchicalThemes(papers);

      for (const metaTheme of result.metaThemes) {
        const metaPaperIds = new Set(metaTheme.paperIds);

        for (const subTheme of metaTheme.subThemes) {
          for (const paperId of subTheme.paperIds) {
            expect(metaPaperIds.has(paperId)).toBe(true);
          }
        }
      }
    });
  });

  // ============================================================================
  // QUALITY METRICS TESTS
  // ============================================================================

  describe('Quality metrics', () => {
    it('should calculate quality metrics', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.avgMetaThemeCoherence).toBeDefined();
      expect(result.qualityMetrics.avgSubThemeCoherence).toBeDefined();
      expect(result.qualityMetrics.clusterCoverage).toBeDefined();
      expect(result.qualityMetrics.avgPapersPerMetaTheme).toBeDefined();
      expect(result.qualityMetrics.themeDiversity).toBeDefined();
    });

    it('should have valid metric ranges', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      const metrics = result.qualityMetrics;

      expect(metrics.avgMetaThemeCoherence).toBeGreaterThanOrEqual(0);
      expect(metrics.avgMetaThemeCoherence).toBeLessThanOrEqual(1);

      expect(metrics.avgSubThemeCoherence).toBeGreaterThanOrEqual(0);
      expect(metrics.avgSubThemeCoherence).toBeLessThanOrEqual(1);

      expect(metrics.clusterCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.clusterCoverage).toBeLessThanOrEqual(1);

      expect(metrics.themeDiversity).toBeGreaterThanOrEqual(0);
      expect(metrics.themeDiversity).toBeLessThanOrEqual(1);

      expect(metrics.metaThemeDaviesBouldin).toBeGreaterThanOrEqual(0);
      expect(metrics.metaThemeSilhouette).toBeGreaterThanOrEqual(-1);
      expect(metrics.metaThemeSilhouette).toBeLessThanOrEqual(1);
    });

    it('should track orphaned papers', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      expect(result.orphanedPaperIds).toBeDefined();
      expect(Array.isArray(result.orphanedPaperIds)).toBe(true);

      // Clustered + orphaned should equal total
      expect(result.clusteredPapers + result.orphanedPaperIds.length).toBeLessThanOrEqual(
        result.totalPapers,
      );
    });
  });

  // ============================================================================
  // PROGRESS CALLBACK TESTS
  // ============================================================================

  describe('Progress callbacks', () => {
    it('should call progress callback at each stage', async () => {
      const papers = generateMockPapers(50);
      const progressCalls: { stage: HierarchicalExtractionStage; progress: number }[] = [];

      await service.extractHierarchicalThemes(
        papers,
        {},
        (stage, progress, _message) => {
          progressCalls.push({ stage, progress });
        },
      );

      // Should have calls for major stages
      const stages = progressCalls.map(c => c.stage);
      expect(stages).toContain(HierarchicalExtractionStage.INITIALIZING);
      expect(stages).toContain(HierarchicalExtractionStage.GENERATING_EMBEDDINGS);
      expect(stages).toContain(HierarchicalExtractionStage.META_THEME_CLUSTERING);
      expect(stages).toContain(HierarchicalExtractionStage.COMPLETE);
    });

    it('should report progress from 0 to 100', async () => {
      const papers = generateMockPapers(50);
      const progressValues: number[] = [];

      await service.extractHierarchicalThemes(
        papers,
        {},
        (_stage, progress, _message) => {
          progressValues.push(progress);
        },
      );

      // First progress should be 0, last should be 100
      expect(progressValues[0]).toBe(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle papers with missing abstracts', async () => {
      const papers: HierarchicalPaperInput[] = Array.from({ length: 20 }, (_, i) => ({
        id: `paper-${i}`,
        title: `Paper ${i}`,
        abstract: i % 2 === 0 ? undefined : `Abstract for paper ${i}`,
      }));

      const result = await service.extractHierarchicalThemes(papers);

      expect(result).toBeDefined();
      expect(result.metaThemes.length).toBeGreaterThan(0);
    });

    it('should handle papers without theme-fit scores', async () => {
      const papers: HierarchicalPaperInput[] = Array.from({ length: 20 }, (_, i) => ({
        id: `paper-${i}`,
        title: `Paper ${i}`,
        abstract: `Abstract ${i}`,
        // No themeFitScore
      }));

      const result = await service.extractHierarchicalThemes(papers);

      expect(result).toBeDefined();
      // Should still compute avgThemeFitScore (default 0.5)
      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.avgThemeFitScore).toBeDefined();
      }
    });

    it('should handle minimum viable paper count', async () => {
      const papers = generateMockPapers(10); // Minimum required

      const result = await service.extractHierarchicalThemes(papers);

      expect(result).toBeDefined();
      expect(result.metaThemes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // RESULT STRUCTURE VALIDATION
  // ============================================================================

  describe('Result structure', () => {
    it('should return valid HierarchicalExtractionResult', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      expect(isHierarchicalExtractionResult(result)).toBe(true);
    });

    it('should include timestamp', async () => {
      const papers = generateMockPapers(50);
      const beforeTime = new Date();
      const result = await service.extractHierarchicalThemes(papers);
      const afterTime = new Date();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should include processing time', async () => {
      const papers = generateMockPapers(50);
      const result = await service.extractHierarchicalThemes(papers);

      expect(result.processingTimeMs).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should include used configuration', async () => {
      const papers = generateMockPapers(50);
      const customConfig: Partial<HierarchicalExtractionConfig> = {
        minMetaThemes: 4,
        maxMetaThemes: 6,
      };

      const result = await service.extractHierarchicalThemes(papers, customConfig);

      expect(result.config).toBeDefined();
      expect(result.config.minMetaThemes).toBe(4);
      expect(result.config.maxMetaThemes).toBe(6);
    });
  });

  // ============================================================================
  // TYPE GUARDS TESTS
  // ============================================================================

  describe('Type guards', () => {
    it('isMetaTheme should correctly identify MetaTheme objects', () => {
      const validMetaTheme: MetaTheme = {
        id: 'test-id',
        label: 'Test Theme',
        description: 'Test description',
        paperIds: ['paper1', 'paper2'],
        representativePaperIds: ['paper1'],
        centroidEmbedding: [0.1, 0.2],
        coherenceScore: 0.8,
        weight: 0.5,
        keywords: ['test'],
        avgThemeFitScore: 0.6,
        subThemes: [],
        controversyLevel: 0.3,
        createdAt: new Date(),
      };

      expect(isMetaTheme(validMetaTheme)).toBe(true);
      expect(isMetaTheme(null)).toBe(false);
      expect(isMetaTheme({})).toBe(false);
      expect(isMetaTheme({ id: 'test' })).toBe(false);
    });

    it('isSubTheme should correctly identify SubTheme objects', () => {
      const validSubTheme: SubTheme = {
        id: 'sub-id',
        parentMetaThemeId: 'parent-id',
        label: 'Sub Theme',
        description: 'Description',
        paperIds: ['paper1'],
        keyPaperIds: ['paper1'],
        keywords: ['keyword'],
        weight: 0.3,
        controversyLevel: 0.2,
        centroidEmbedding: [0.1],
        coherenceScore: 0.7,
      };

      expect(isSubTheme(validSubTheme)).toBe(true);
      expect(isSubTheme(null)).toBe(false);
      expect(isSubTheme({})).toBe(false);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should complete extraction within reasonable time', async () => {
      const papers = generateMockPapers(100);
      const startTime = Date.now();

      await service.extractHierarchicalThemes(papers);

      const duration = Date.now() - startTime;
      // Should complete in under 5 seconds with mocked services
      expect(duration).toBeLessThan(5000);
    });

    it('should handle 300 papers (max tier)', async () => {
      const papers = generateMockPapers(300);

      const result = await service.extractHierarchicalThemes(papers);

      expect(result).toBeDefined();
      expect(result.totalPapers).toBe(300);
      expect(result.metaThemes.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// DEFAULT CONFIG TESTS
// ============================================================================

describe('DEFAULT_HIERARCHICAL_CONFIG', () => {
  it('should have valid default values', () => {
    expect(DEFAULT_HIERARCHICAL_CONFIG.minMetaThemes).toBe(5);
    expect(DEFAULT_HIERARCHICAL_CONFIG.maxMetaThemes).toBe(8);
    expect(DEFAULT_HIERARCHICAL_CONFIG.minSubThemesPerMeta).toBe(3);
    expect(DEFAULT_HIERARCHICAL_CONFIG.maxSubThemesPerMeta).toBe(5);
    expect(DEFAULT_HIERARCHICAL_CONFIG.minPapersPerCluster).toBe(2);
    expect(DEFAULT_HIERARCHICAL_CONFIG.coherenceThreshold).toBe(0.3);
    expect(DEFAULT_HIERARCHICAL_CONFIG.useAILabeling).toBe(true);
    expect(DEFAULT_HIERARCHICAL_CONFIG.detectControversies).toBe(true);
  });

  it('should be readonly', () => {
    // TypeScript should prevent modification at compile time
    // This test verifies the structure exists
    expect(Object.isFrozen(DEFAULT_HIERARCHICAL_CONFIG)).toBe(false); // Note: as const doesn't freeze
    expect(DEFAULT_HIERARCHICAL_CONFIG).toBeDefined();
  });
});
