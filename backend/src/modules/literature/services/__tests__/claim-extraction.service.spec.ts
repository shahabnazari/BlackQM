/**
 * Phase 10.113 Week 5: Claim Extraction Service Tests
 *
 * Comprehensive unit tests for ClaimExtractionService
 * Testing claim extraction, potential scoring, perspective classification,
 * deduplication, and quality metrics.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClaimExtractionService } from '../claim-extraction.service';
import { OpenAIService } from '../../../ai/services/openai.service';
import { LocalEmbeddingService } from '../local-embedding.service';
import {
  ClaimExtractionPaperInput,
  ClaimExtractionThemeContext,
  ClaimExtractionConfig,
  DEFAULT_CLAIM_EXTRACTION_CONFIG,
  ClaimExtractionStage,
  ClaimPerspective,
} from '../../types/claim-extraction.types';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Create mock papers for testing
 */
function createMockPapers(count: number = 5): ClaimExtractionPaperInput[] {
  const papers: ClaimExtractionPaperInput[] = [];

  const abstracts = [
    'Climate change research demonstrates that rising global temperatures significantly impact agricultural productivity. This study shows that crop yields have decreased by 15% in affected regions. The evidence strongly supports the need for immediate mitigation strategies.',
    'This paper challenges the conventional view that renewable energy is economically viable at scale. Our analysis reveals hidden costs and infrastructure challenges that proponents often overlook. A more balanced approach considering nuclear power is recommended.',
    'We examine the relationship between social media usage and mental health outcomes in adolescents. Our findings suggest a complex, non-linear relationship that defies simple characterization. Both positive and negative effects were observed depending on usage patterns.',
    'Electric vehicle adoption faces significant infrastructure barriers according to this comprehensive study. Charging network gaps and range anxiety remain primary concerns for potential buyers. Government intervention may be necessary to accelerate adoption.',
    'This research investigates the effectiveness of remote work policies on employee productivity. Results indicate that hybrid models outperform both fully remote and fully in-office arrangements. Organizational culture plays a mediating role in these outcomes.',
    'Machine learning applications in healthcare show promise for early disease detection. Our model achieved 94% accuracy in identifying precancerous lesions. However, concerns about algorithmic bias and transparency remain significant barriers to clinical adoption.',
    'The study explores sustainable urban development strategies in developing countries. Traditional planning approaches fail to account for informal settlements and rapid urbanization. Participatory design methods show improved outcomes in community acceptance.',
  ];

  for (let i = 0; i < count; i++) {
    papers.push({
      id: `paper-${i + 1}`,
      title: `Research Paper ${i + 1}: A Comprehensive Analysis`,
      abstract: abstracts[i % abstracts.length] ?? abstracts[0]!,
      year: 2020 + (i % 5),
      authors: [`Author A${i}`, `Author B${i}`],
      keywords: ['research', 'analysis', 'study'],
    });
  }

  return papers;
}

/**
 * Create mock theme context
 */
function createMockTheme(): ClaimExtractionThemeContext {
  return {
    id: 'theme-1',
    label: 'Climate Change and Agriculture',
    description: 'Research on climate change impacts on agricultural systems',
    keywords: ['climate', 'agriculture', 'crop', 'temperature', 'farming'],
    subThemes: [
      {
        id: 'subtheme-1',
        label: 'Crop Yields',
        keywords: ['yield', 'productivity', 'harvest'],
      },
      {
        id: 'subtheme-2',
        label: 'Mitigation Strategies',
        keywords: ['mitigation', 'adaptation', 'policy'],
      },
    ],
    isControversial: true,
  };
}

// ============================================================================
// MOCKS
// ============================================================================

const mockOpenAIService = {
  generateCompletion: jest.fn().mockImplementation((prompt: string) => {
    // Return different responses based on prompt content
    if (prompt.includes('Extract key claims')) {
      return Promise.resolve({
        content: JSON.stringify([
          {
            originalText: 'Climate change significantly impacts agricultural productivity.',
            normalizedClaim: 'Climate change has a significant impact on agricultural productivity.',
            subTheme: 'Crop Yields',
            confidence: 0.85,
          },
          {
            originalText: 'Crop yields have decreased by 15% in affected regions.',
            normalizedClaim: 'Crop yields have decreased substantially in climate-affected regions.',
            subTheme: 'Crop Yields',
            confidence: 0.9,
          },
          {
            originalText: 'Immediate mitigation strategies are needed.',
            normalizedClaim: 'Climate change requires immediate mitigation strategies.',
            subTheme: 'Mitigation Strategies',
            confidence: 0.75,
          },
        ]),
      });
    }
    if (prompt.includes('Classify these claims')) {
      return Promise.resolve({
        content: JSON.stringify(['supportive', 'neutral', 'critical']),
      });
    }
    return Promise.resolve({ content: '[]' });
  }),
};

const mockEmbeddingService = {
  generateEmbedding: jest.fn().mockImplementation((text: string) => {
    // Generate deterministic embeddings based on text hash
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding = Array(384).fill(0).map((_, i) => Math.sin(hash + i) * 0.5);
    return Promise.resolve(embedding);
  }),
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ClaimExtractionService', () => {
  let service: ClaimExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimExtractionService,
        { provide: OpenAIService, useValue: mockOpenAIService },
        { provide: LocalEmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get<ClaimExtractionService>(ClaimExtractionService);

    // Reset mocks
    jest.clearAllMocks();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================

  describe('extractClaims', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should extract claims from papers', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result).toBeDefined();
      expect(result.theme.id).toBe(theme.id);
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return empty result for empty papers array', async () => {
      const theme = createMockTheme();

      const result = await service.extractClaims([], theme);

      expect(result.claims).toHaveLength(0);
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
    });

    it('should filter papers with short abstracts', async () => {
      const papers: ClaimExtractionPaperInput[] = [
        {
          id: 'paper-short',
          title: 'Short Paper',
          abstract: 'Too short', // Less than 100 characters
        },
        ...createMockPapers(2),
      ];
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      // Should still process valid papers
      expect(result.qualityMetrics.papersProcessed).toBeLessThan(papers.length);
    });

    it('should respect maxClaimsPerPaper configuration', async () => {
      const papers = createMockPapers(2);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        maxClaimsPerPaper: 2,
      };

      const result = await service.extractClaims(papers, theme, config);

      // Each paper should have at most 2 claims
      expect(result.claims.length).toBeLessThanOrEqual(4);
    });

    it('should respect maxTotalClaims configuration', async () => {
      const papers = createMockPapers(10);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        maxTotalClaims: 5,
      };

      const result = await service.extractClaims(papers, theme, config);

      expect(result.claims.length).toBeLessThanOrEqual(5);
    });
  });

  // ============================================================================
  // STATEMENT POTENTIAL SCORING TESTS
  // ============================================================================

  describe('Statement Potential Scoring', () => {
    it('should score statement potential for all claims', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      for (const claim of result.claims) {
        expect(claim.statementPotential).toBeGreaterThanOrEqual(0);
        expect(claim.statementPotential).toBeLessThanOrEqual(1);
      }
    });

    it('should filter claims below minStatementPotential threshold', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        minStatementPotential: 0.9, // Very high threshold
      };

      const result = await service.extractClaims(papers, theme, config);

      // May filter out all claims or keep only high-potential ones
      for (const claim of result.claims) {
        expect(claim.statementPotential).toBeGreaterThanOrEqual(0.9);
      }
    });
  });

  // ============================================================================
  // PERSPECTIVE CLASSIFICATION TESTS
  // ============================================================================

  describe('Perspective Classification', () => {
    it('should classify claim perspectives', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      const validPerspectives: ClaimPerspective[] = ['supportive', 'critical', 'neutral'];

      for (const claim of result.claims) {
        expect(validPerspectives).toContain(claim.perspective);
      }
    });

    it('should group claims by perspective', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.claimsByPerspective).toBeDefined();
      expect(result.claimsByPerspective.has('supportive')).toBe(true);
      expect(result.claimsByPerspective.has('critical')).toBe(true);
      expect(result.claimsByPerspective.has('neutral')).toBe(true);
    });

    it('should calculate perspective distribution in quality metrics', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      const distribution = result.qualityMetrics.perspectiveDistribution;
      expect(distribution).toBeDefined();

      // Total should equal number of claims
      const total = Array.from(distribution.values()).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(result.claims.length);
    });
  });

  // ============================================================================
  // DEDUPLICATION TESTS
  // ============================================================================

  describe('Claim Deduplication', () => {
    it('should deduplicate similar claims', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        deduplicateClaims: true,
      };

      const result = await service.extractClaims(papers, theme, config);

      // claimsAfterDedup should be <= claimsExtracted
      expect(result.qualityMetrics.claimsAfterDedup).toBeLessThanOrEqual(
        result.qualityMetrics.claimsExtracted,
      );
    });

    it('should skip deduplication when disabled', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        deduplicateClaims: false,
      };

      const result = await service.extractClaims(papers, theme, config);

      // When dedup is disabled, counts should be equal
      expect(result.qualityMetrics.claimsAfterDedup).toBe(
        result.qualityMetrics.claimsExtracted,
      );
    });

    it('should merge source papers for deduplicated claims', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      // Deduplicated claims should have isDeduplicated flag
      const deduplicatedClaims = result.claims.filter(c => c.metadata.isDeduplicated);

      for (const claim of deduplicatedClaims) {
        // Should have merged claim IDs
        expect(claim.metadata.mergedClaimIds.length).toBeGreaterThan(0);
        // May have multiple source papers
        expect(claim.sourcePapers.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ============================================================================
  // SUB-THEME GROUPING TESTS
  // ============================================================================

  describe('Sub-Theme Grouping', () => {
    it('should group claims by sub-theme', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.claimsBySubTheme).toBeDefined();
      expect(result.claimsBySubTheme.size).toBeGreaterThanOrEqual(0);
    });

    it('should calculate sub-theme coverage in quality metrics', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.qualityMetrics.subThemeCoverage).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.subThemeCoverage).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // QUALITY METRICS TESTS
  // ============================================================================

  describe('Quality Metrics', () => {
    it('should calculate average confidence', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.qualityMetrics.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.avgConfidence).toBeLessThanOrEqual(1);
    });

    it('should calculate average statement potential', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.qualityMetrics.avgStatementPotential).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.avgStatementPotential).toBeLessThanOrEqual(1);
    });

    it('should count high-quality claims', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.qualityMetrics.highQualityClaims).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.highQualityClaims).toBeLessThanOrEqual(result.claims.length);

      // Verify high-quality count matches claims with potential > 0.7
      const actualHighQuality = result.claims.filter(c => c.statementPotential > 0.7).length;
      expect(result.qualityMetrics.highQualityClaims).toBe(actualHighQuality);
    });

    it('should calculate claims per paper', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      const expectedAvg = result.claims.length / result.qualityMetrics.papersProcessed;
      expect(result.qualityMetrics.avgClaimsPerPaper).toBeCloseTo(expectedAvg, 2);
    });
  });

  // ============================================================================
  // PROGRESS CALLBACK TESTS
  // ============================================================================

  describe('Progress Callbacks', () => {
    it('should call progress callback at each stage', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const progressStages: ClaimExtractionStage[] = [];

      const onProgress = (stage: ClaimExtractionStage) => {
        progressStages.push(stage);
      };

      await service.extractClaims(papers, theme, {}, onProgress);

      // Should progress through all stages
      expect(progressStages).toContain(ClaimExtractionStage.INITIALIZING);
      expect(progressStages).toContain(ClaimExtractionStage.EXTRACTING_CLAIMS);
      expect(progressStages).toContain(ClaimExtractionStage.COMPLETE);
    });

    it('should report increasing progress percentages', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const progressValues: number[] = [];

      const onProgress = (_stage: ClaimExtractionStage, percent: number) => {
        progressValues.push(percent);
      };

      await service.extractClaims(papers, theme, {}, onProgress);

      // Progress should be non-decreasing
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]!);
      }

      // Should end at 100%
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });

  // ============================================================================
  // CANCELLATION TESTS
  // ============================================================================

  describe('Cancellation Support', () => {
    it('should throw error when signal is aborted', async () => {
      const papers = createMockPapers(5);
      const theme = createMockTheme();

      const controller = new AbortController();
      controller.abort();

      await expect(
        service.extractClaims(papers, theme, {}, undefined, controller.signal),
      ).rejects.toThrow('Claim extraction cancelled');
    });

    it('should handle pre-aborted signal gracefully', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const controller = new AbortController();
      controller.abort();

      try {
        await service.extractClaims(papers, theme, {}, undefined, controller.signal);
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('cancelled');
      }
    });
  });

  // ============================================================================
  // METADATA TESTS
  // ============================================================================

  describe('Metadata', () => {
    it('should include processing time', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.startTime).toBeInstanceOf(Date);
      expect(result.metadata.endTime).toBeInstanceOf(Date);
    });

    it('should include configuration used', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        maxClaimsPerPaper: 3,
        minConfidence: 0.6,
      };

      const result = await service.extractClaims(papers, theme, config);

      expect(result.metadata.config.maxClaimsPerPaper).toBe(3);
      expect(result.metadata.config.minConfidence).toBe(0.6);
      // Merged with defaults
      expect(result.metadata.config.deduplicateClaims).toBe(
        DEFAULT_CLAIM_EXTRACTION_CONFIG.deduplicateClaims,
      );
    });

    it('should include request ID', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.metadata.requestId).toBeDefined();
      expect(result.metadata.requestId!.length).toBeGreaterThan(0);
    });

    it('should include warnings for edge cases', async () => {
      const theme = createMockTheme();

      const result = await service.extractClaims([], theme);

      expect(result.metadata.warnings.length).toBeGreaterThan(0);
      expect(result.metadata.warnings.some(w => w.includes('Insufficient'))).toBe(true);
    });
  });

  // ============================================================================
  // CLAIM METADATA TESTS
  // ============================================================================

  describe('Claim Metadata', () => {
    it('should include extraction timestamp', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      for (const claim of result.claims) {
        expect(claim.metadata.extractedAt).toBeInstanceOf(Date);
      }
    });

    it('should include word counts', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      for (const claim of result.claims) {
        expect(claim.metadata.originalWordCount).toBeGreaterThan(0);
        expect(claim.metadata.normalizedWordCount).toBeGreaterThan(0);
      }
    });

    it('should extract key terms', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      for (const claim of result.claims) {
        expect(claim.metadata.keyTerms).toBeDefined();
        expect(Array.isArray(claim.metadata.keyTerms)).toBe(true);
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      mockOpenAIService.generateCompletion.mockRejectedValueOnce(
        new Error('AI service unavailable'),
      );

      const papers = createMockPapers(3);
      const theme = createMockTheme();

      // Should not throw, should return partial results or empty
      const result = await service.extractClaims(papers, theme);

      expect(result).toBeDefined();
    });

    it('should handle malformed AI responses', async () => {
      mockOpenAIService.generateCompletion.mockResolvedValueOnce({
        content: 'not valid json',
      });

      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================

  describe('Configuration', () => {
    it('should use default config when not provided', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();

      const result = await service.extractClaims(papers, theme);

      expect(result.metadata.config.minConfidence).toBe(
        DEFAULT_CLAIM_EXTRACTION_CONFIG.minConfidence,
      );
      expect(result.metadata.config.maxClaimsPerPaper).toBe(
        DEFAULT_CLAIM_EXTRACTION_CONFIG.maxClaimsPerPaper,
      );
    });

    it('should merge partial config with defaults', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        minConfidence: 0.7,
        // Other fields should use defaults
      };

      const result = await service.extractClaims(papers, theme, config);

      expect(result.metadata.config.minConfidence).toBe(0.7);
      expect(result.metadata.config.maxClaimsPerPaper).toBe(
        DEFAULT_CLAIM_EXTRACTION_CONFIG.maxClaimsPerPaper,
      );
    });

    it('should respect normalizeClaimText setting', async () => {
      const papers = createMockPapers(3);
      const theme = createMockTheme();
      const config: Partial<ClaimExtractionConfig> = {
        normalizeClaimText: true,
      };

      const result = await service.extractClaims(papers, theme, config);

      // Normalized claims should end with period and start with uppercase
      for (const claim of result.claims) {
        expect(claim.normalizedClaim).toMatch(/^[A-Z]/);
        expect(claim.normalizedClaim).toMatch(/\.$/);
      }
    });
  });
});
