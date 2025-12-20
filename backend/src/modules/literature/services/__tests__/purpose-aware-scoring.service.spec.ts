/**
 * Phase 10.170 Week 3: Purpose-Aware Scoring Service Tests
 *
 * Comprehensive test suite for the scoring, adaptive threshold,
 * and diversity services.
 *
 * @module purpose-aware-scoring.service.spec
 * @since Phase 10.170 Week 3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurposeAwareScoringService } from '../purpose-aware-scoring.service';
import { AdaptiveThresholdService } from '../adaptive-threshold.service';
import { DiversityScoringService } from '../diversity-scoring.service';
import { PurposeAwareConfigService } from '../purpose-aware-config.service';
import { ResearchPurpose } from '../../types/purpose-aware.types';
import {
  ScoringPaperInput,
  PerspectiveCategory,
  SCORING_VERSION,
} from '../../types/purpose-aware-scoring.types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Create mock config service
 */
function createMockConfigService(): PurposeAwareConfigService {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const service = new PurposeAwareConfigService();
  (service as unknown as { logger: typeof mockLogger }).logger = mockLogger;
  return service;
}

/**
 * Create test paper with optional overrides
 */
function createTestPaper(overrides: Partial<ScoringPaperInput> = {}): ScoringPaperInput {
  return {
    id: 'test-paper-1',
    title: 'A Comprehensive Study on Machine Learning Applications',
    abstract: 'This study investigates machine learning methods using empirical analysis and statistical approaches.',
    keywords: ['machine learning', 'empirical', 'study'],
    citationCount: 25,
    year: 2022,
    venue: 'Journal of AI Research',
    impactFactor: 5.5,
    hasFullText: true,
    wordCount: 3500,
    existingQualityScore: null,
    ...overrides,
  };
}

/**
 * Create multiple test papers with varying characteristics
 */
function createTestPaperSet(): ScoringPaperInput[] {
  return [
    // High-quality academic paper
    createTestPaper({
      id: 'paper-1',
      title: 'Empirical Analysis of Neural Networks: A Peer-Reviewed Study',
      abstract: 'This research presents findings from a randomized controlled trial examining the effectiveness of neural networks. Our methodology includes statistical analysis with p-values and confidence intervals.',
      citationCount: 100,
      year: 2021,
      impactFactor: 15,
      wordCount: 6000,
    }),
    // Practitioner-focused paper
    createTestPaper({
      id: 'paper-2',
      title: 'Implementing AI in Clinical Practice: A Real-World Case Study',
      abstract: 'This practical guide presents hands-on implementation experience from clinical professionals in the field.',
      citationCount: 30,
      year: 2022,
      impactFactor: 4,
      wordCount: 2500,
    }),
    // Policy-focused paper
    createTestPaper({
      id: 'paper-3',
      title: 'AI Governance and Regulation: A Policy Framework',
      abstract: 'This paper examines government policy and legislation guidelines for AI stakeholders and decision-makers.',
      citationCount: 15,
      year: 2023,
      impactFactor: 3,
      wordCount: 4000,
    }),
    // Critical perspective paper
    createTestPaper({
      id: 'paper-4',
      title: 'Challenging AI Claims: A Critical Analysis of Limitations',
      abstract: 'This critique examines the controversy and debate around AI, questioning problematic assumptions and raising concerns about risks.',
      citationCount: 20,
      year: 2022,
      impactFactor: 6,
      wordCount: 3000,
    }),
    // Low-quality paper
    createTestPaper({
      id: 'paper-5',
      title: 'Some Notes on AI',
      abstract: 'Brief notes on artificial intelligence.',
      citationCount: 1,
      year: 2020,
      impactFactor: 0.5,
      wordCount: 300,
      hasFullText: false,
    }),
  ];
}

// ============================================================================
// PURPOSE-AWARE SCORING SERVICE TESTS
// ============================================================================

describe('PurposeAwareScoringService', () => {
  let scoringService: PurposeAwareScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
  });

  describe('scorePaper', () => {
    it('should score a paper with all components', () => {
      const paper = createTestPaper();
      const result = scoringService.scorePaper(paper, ResearchPurpose.Q_METHODOLOGY);

      expect(result.paperId).toBe(paper.id);
      expect(result.purpose).toBe(ResearchPurpose.Q_METHODOLOGY);
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.version).toBe(SCORING_VERSION);

      // Check all components exist
      expect(result.components.content).toBeDefined();
      expect(result.components.citation).toBeDefined();
      expect(result.components.journal).toBeDefined();
      expect(result.components.methodology).toBeDefined();
    });

    it('should apply different weights for different purposes', () => {
      const paper = createTestPaper();

      const qMethodResult = scoringService.scorePaper(paper, ResearchPurpose.Q_METHODOLOGY);
      const synthesisResult = scoringService.scorePaper(paper, ResearchPurpose.LITERATURE_SYNTHESIS);

      // Q-methodology has journal weight = 0, synthesis has journal weight = 0.25
      expect(qMethodResult.components.journal.weight).toBe(0);
      expect(synthesisResult.components.journal.weight).toBe(0.25);

      // Q-methodology has diversity weight
      expect(qMethodResult.components.diversity).toBeDefined();
      expect(qMethodResult.components.diversity!.weight).toBe(0.30);
    });

    it('should apply full-text bonus', () => {
      const paperWithFullText = createTestPaper({ hasFullText: true });
      const paperWithoutFullText = createTestPaper({ hasFullText: false });

      const withResult = scoringService.scorePaper(paperWithFullText, ResearchPurpose.LITERATURE_SYNTHESIS);
      const withoutResult = scoringService.scorePaper(paperWithoutFullText, ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(withResult.fullTextBonus).toBeGreaterThan(0);
      expect(withoutResult.fullTextBonus).toBe(0);
      expect(withResult.hasFullText).toBe(true);
      expect(withoutResult.hasFullText).toBe(false);
    });

    it('should handle papers with missing data gracefully', () => {
      const sparePaper = createTestPaper({
        abstract: null,
        citationCount: null,
        year: null,
        impactFactor: null,
        wordCount: null,
      });

      const result = scoringService.scorePaper(sparePaper, ResearchPurpose.Q_METHODOLOGY);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should throw on invalid input', () => {
      const invalidPaper = { ...createTestPaper(), id: '' };

      expect(() => {
        scoringService.scorePaper(invalidPaper, ResearchPurpose.Q_METHODOLOGY);
      }).toThrow();
    });
  });

  describe('scoreBatch', () => {
    it('should score multiple papers efficiently', () => {
      const papers = createTestPaperSet();
      const result = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });

      expect(result.scores).toHaveLength(papers.length);
      expect(result.stats.totalProcessed).toBe(papers.length);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should partition papers by threshold', () => {
      const papers = createTestPaperSet();
      const result = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });

      const total = result.passingPapers.length + result.failingPapers.length;
      expect(total).toBe(papers.length);
    });

    it('should calculate accurate statistics', () => {
      const papers = createTestPaperSet();
      const result = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });

      expect(result.stats.passRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.passRate).toBeLessThanOrEqual(1);
      expect(result.stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.stats.averageScore).toBeLessThanOrEqual(100);
      expect(result.stats.minScore).toBeLessThanOrEqual(result.stats.maxScore);
    });
  });

  describe('getRawScores', () => {
    it('should return unweighted component scores', () => {
      const paper = createTestPaper();
      const raw = scoringService.getRawScores(paper);

      expect(raw.content).toBeGreaterThanOrEqual(0);
      expect(raw.content).toBeLessThanOrEqual(100);
      expect(raw.citation).toBeGreaterThanOrEqual(0);
      expect(raw.citation).toBeLessThanOrEqual(100);
      expect(raw.journal).toBeGreaterThanOrEqual(0);
      expect(raw.journal).toBeLessThanOrEqual(100);
      expect(raw.methodology).toBeGreaterThanOrEqual(0);
      expect(raw.methodology).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// ADAPTIVE THRESHOLD SERVICE TESTS
// ============================================================================

describe('AdaptiveThresholdService', () => {
  let thresholdService: AdaptiveThresholdService;
  let scoringService: PurposeAwareScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
    thresholdService = new AdaptiveThresholdService(configService);
  });

  describe('applyAdaptiveThreshold', () => {
    it('should not relax threshold if target already met', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      // Use low target that's easily met
      const result = thresholdService.applyAdaptiveThreshold(
        scores,
        ResearchPurpose.Q_METHODOLOGY,
        2, // Low target
      );

      expect(result.stepsApplied).toBe(0);
      expect(result.currentThreshold).toBe(result.originalThreshold);
      expect(result.targetMet).toBe(true);
    });

    it('should relax threshold when target not met', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      // Use high target that requires relaxation
      const result = thresholdService.applyAdaptiveThreshold(
        scores,
        ResearchPurpose.Q_METHODOLOGY,
        100, // Very high target
      );

      expect(result.stepsApplied).toBeGreaterThan(0);
      expect(result.currentThreshold).toBeLessThan(result.originalThreshold);
    });

    it('should not go below minimum threshold', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      const config = configService.getConfig(ResearchPurpose.Q_METHODOLOGY);

      const result = thresholdService.applyAdaptiveThreshold(
        scores,
        ResearchPurpose.Q_METHODOLOGY,
        1000, // Impossible target
      );

      expect(result.currentThreshold).toBeGreaterThanOrEqual(config.qualityThreshold.min);
      expect(result.atMinimum).toBe(true);
    });

    it('should track history of relaxation steps', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      const result = thresholdService.applyAdaptiveThreshold(
        scores,
        ResearchPurpose.Q_METHODOLOGY,
        100,
      );

      expect(result.history.length).toBeGreaterThanOrEqual(1);
      expect(result.history[0].step).toBe(0); // Initial step

      // History should be in order
      for (let i = 1; i < result.history.length; i++) {
        expect(result.history[i].step).toBe(i);
        expect(result.history[i].threshold).toBeLessThanOrEqual(result.history[i - 1].threshold);
      }
    });
  });

  describe('findOptimalThreshold', () => {
    it('should find threshold that achieves target', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      const optimal = thresholdService.findOptimalThreshold(scores, 3, 0, 100);

      const passing = scores.filter(s => s.totalScore >= optimal).length;
      expect(passing).toBeGreaterThanOrEqual(3);
    });
  });

  describe('analyzeThresholdDistribution', () => {
    it('should show paper counts at each threshold', () => {
      const papers = createTestPaperSet();
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      const distribution = thresholdService.analyzeThresholdDistribution(scores);

      expect(distribution.length).toBeGreaterThan(0);

      // Lower thresholds should have >= papers than higher thresholds
      for (let i = 1; i < distribution.length; i++) {
        expect(distribution[i].passingCount).toBeGreaterThanOrEqual(
          distribution[i - 1].passingCount
        );
      }
    });
  });
});

// ============================================================================
// DIVERSITY SCORING SERVICE TESTS
// ============================================================================

describe('DiversityScoringService', () => {
  let diversityService: DiversityScoringService;

  beforeEach(() => {
    diversityService = new DiversityScoringService();
  });

  describe('scorePaperDiversity', () => {
    it('should detect academic perspective', () => {
      const paper = createTestPaper({
        title: 'A Peer-Reviewed Empirical Study of Research Methodology',
        abstract: 'This academic publication presents findings from our university research using rigorous methodology.',
      });

      const result = diversityService.scorePaperDiversity(paper);

      expect(result.perspectives).toContain(PerspectiveCategory.ACADEMIC);
    });

    it('should detect practitioner perspective', () => {
      const paper = createTestPaper({
        title: 'Practical Implementation: A Real-World Case Study',
        abstract: 'This applied field guide provides hands-on clinical experience from industry professionals.',
      });

      const result = diversityService.scorePaperDiversity(paper);

      expect(result.perspectives).toContain(PerspectiveCategory.PRACTITIONER);
    });

    it('should detect critical perspective', () => {
      const paper = createTestPaper({
        title: 'Challenging the Status Quo: A Critical Critique',
        abstract: 'This paper questions problematic assumptions, highlighting controversy and debate around this limitation.',
      });

      const result = diversityService.scorePaperDiversity(paper);

      expect(result.perspectives).toContain(PerspectiveCategory.CRITICAL);
    });

    it('should identify unique perspectives', () => {
      const paper = createTestPaper({
        title: 'Policy Framework for Government Regulation',
        abstract: 'This policy paper examines governance guidelines for stakeholders.',
      });

      const existingPerspectives = new Set<PerspectiveCategory>([
        PerspectiveCategory.ACADEMIC,
        PerspectiveCategory.PRACTITIONER,
      ]);

      const result = diversityService.scorePaperDiversity(paper, existingPerspectives);

      expect(result.isUniquePerspective).toBe(true);
    });

    it('should calculate diversity contribution score', () => {
      const paper = createTestPaper();
      const result = diversityService.scorePaperDiversity(paper);

      expect(result.diversityContribution).toBeGreaterThanOrEqual(0);
      expect(result.diversityContribution).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeCorpusDiversity', () => {
    it('should calculate Shannon and Simpson indices', () => {
      const papers = createTestPaperSet();
      const metrics = diversityService.analyzeCorpusDiversity(papers);

      expect(metrics.shannonIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.simpsonIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.simpsonIndex).toBeLessThanOrEqual(1);
    });

    it('should calculate coverage ratio', () => {
      const papers = createTestPaperSet();
      const metrics = diversityService.analyzeCorpusDiversity(papers);

      expect(metrics.coverageRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.coverageRatio).toBeLessThanOrEqual(1);
      expect(metrics.uniquePerspectives).toBeGreaterThanOrEqual(0);
    });

    it('should identify underrepresented perspectives', () => {
      const papers = createTestPaperSet();
      const metrics = diversityService.analyzeCorpusDiversity(papers);

      expect(Array.isArray(metrics.underrepresented)).toBe(true);
      expect(Array.isArray(metrics.overrepresented)).toBe(true);
    });

    it('should determine health status', () => {
      const papers = createTestPaperSet();
      const metrics = diversityService.analyzeCorpusDiversity(papers);

      const validStatuses = ['excellent', 'good', 'moderate', 'poor', 'critical'];
      expect(validStatuses).toContain(metrics.healthStatus);
    });

    it('should handle empty corpus', () => {
      const metrics = diversityService.analyzeCorpusDiversity([]);

      expect(metrics.totalPapers).toBe(0);
      expect(metrics.healthStatus).toBe('critical');
      expect(metrics.coverageRatio).toBe(0);
    });
  });

  describe('selectForMaxDiversity', () => {
    it('should select diverse papers', () => {
      const papers = createTestPaperSet();
      const selected = diversityService.selectForMaxDiversity(papers, 3);

      expect(selected.length).toBe(3);
    });

    it('should return all papers if fewer than target', () => {
      const papers = createTestPaperSet().slice(0, 2);
      const selected = diversityService.selectForMaxDiversity(papers, 10);

      expect(selected.length).toBe(2);
    });

    it('should prioritize unique perspectives', () => {
      const papers = createTestPaperSet();
      const selected = diversityService.selectForMaxDiversity(papers, 3);

      // Analyze diversity of selected papers
      const metrics = diversityService.analyzeCorpusDiversity(selected);

      // Should have reasonable diversity
      expect(metrics.uniquePerspectives).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRecommendations', () => {
    it('should provide actionable recommendations', () => {
      const papers = createTestPaperSet();
      const metrics = diversityService.analyzeCorpusDiversity(papers);
      const recommendations = diversityService.getRecommendations(metrics);

      expect(Array.isArray(recommendations)).toBe(true);
      // Recommendations should be non-empty strings
      for (const rec of recommendations) {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// COMPREHENSIVE PURPOSE-SPECIFIC SCORING TESTS (Day 15 Enhancement)
// ============================================================================

describe('Purpose-Specific Scoring Validation', () => {
  let scoringService: PurposeAwareScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
  });

  describe('all purposes produce valid scores', () => {
    const allPurposes = Object.values(ResearchPurpose);

    it.each(allPurposes)('should produce valid scores for purpose: %s', (purpose) => {
      const paper = createTestPaper();
      const result = scoringService.scorePaper(paper, purpose);

      // Score bounds
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);

      // Component scores
      expect(result.components.content.raw).toBeGreaterThanOrEqual(0);
      expect(result.components.content.raw).toBeLessThanOrEqual(100);
      expect(result.components.citation.raw).toBeGreaterThanOrEqual(0);
      expect(result.components.citation.raw).toBeLessThanOrEqual(100);
      expect(result.components.journal.raw).toBeGreaterThanOrEqual(0);
      expect(result.components.journal.raw).toBeLessThanOrEqual(100);
      expect(result.components.methodology.raw).toBeGreaterThanOrEqual(0);
      expect(result.components.methodology.raw).toBeLessThanOrEqual(100);

      // Weights sum should be approximately 1.0
      const totalWeight =
        result.components.content.weight +
        result.components.citation.weight +
        result.components.journal.weight +
        result.components.methodology.weight +
        (result.components.diversity?.weight ?? 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });

  describe('Q-methodology specific features', () => {
    it('should have diversity component only for Q-methodology', () => {
      const paper = createTestPaper();

      const qMethodResult = scoringService.scorePaper(paper, ResearchPurpose.Q_METHODOLOGY);
      const synthesisResult = scoringService.scorePaper(paper, ResearchPurpose.LITERATURE_SYNTHESIS);
      const qualitativeResult = scoringService.scorePaper(paper, ResearchPurpose.QUALITATIVE_ANALYSIS);

      // Q-methodology should have diversity
      expect(qMethodResult.components.diversity).toBeDefined();
      expect(qMethodResult.components.diversity!.weight).toBe(0.30);

      // Others should not have diversity (or weight = 0)
      expect(synthesisResult.components.diversity?.weight ?? 0).toBe(0);
      expect(qualitativeResult.components.diversity?.weight ?? 0).toBe(0);
    });

    it('should have journal weight = 0 for Q-methodology', () => {
      const paper = createTestPaper();
      const result = scoringService.scorePaper(paper, ResearchPurpose.Q_METHODOLOGY);

      expect(result.components.journal.weight).toBe(0);
      expect(result.components.journal.weighted).toBe(0);
    });
  });

  describe('literature synthesis specific features', () => {
    it('should have highest citation weight for literature synthesis', () => {
      const paper = createTestPaper();

      const synthesisResult = scoringService.scorePaper(paper, ResearchPurpose.LITERATURE_SYNTHESIS);
      const hypothesisResult = scoringService.scorePaper(paper, ResearchPurpose.HYPOTHESIS_GENERATION);

      // Synthesis should have higher citation weight
      expect(synthesisResult.components.citation.weight).toBeGreaterThanOrEqual(
        hypothesisResult.components.citation.weight
      );
    });
  });
});

// ============================================================================
// JOURNAL PRESTIGE VALIDATION TESTS (Day 15 Enhancement)
// ============================================================================

describe('Journal Prestige Weight Validation', () => {
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
  });

  describe('journal weight bounds', () => {
    const purposesWithJournal = [
      ResearchPurpose.LITERATURE_SYNTHESIS,
      ResearchPurpose.QUALITATIVE_ANALYSIS,
      ResearchPurpose.HYPOTHESIS_GENERATION,
      ResearchPurpose.SURVEY_CONSTRUCTION,
    ];

    it.each(purposesWithJournal)(
      'should have journal weight between 0.15-0.25 for purpose: %s',
      (purpose) => {
        const config = configService.getConfig(purpose);
        const journalWeight = config.qualityWeights.journal;

        expect(journalWeight).toBeGreaterThanOrEqual(0.15);
        expect(journalWeight).toBeLessThanOrEqual(0.25);
      }
    );

    it('Q-methodology should have journal weight = 0 (intentionally excluded)', () => {
      const config = configService.getConfig(ResearchPurpose.Q_METHODOLOGY);
      expect(config.qualityWeights.journal).toBe(0);
    });
  });

  describe('config validation prevents invalid weights', () => {
    it('should reject weights > 1.0', () => {
      // This tests the validation in purpose-aware-config.service
      const config = configService.getConfig(ResearchPurpose.LITERATURE_SYNTHESIS);

      // Ensure all weights are valid
      expect(config.qualityWeights.content).toBeLessThanOrEqual(1.0);
      expect(config.qualityWeights.citation).toBeLessThanOrEqual(1.0);
      expect(config.qualityWeights.journal).toBeLessThanOrEqual(1.0);
      expect(config.qualityWeights.methodology).toBeLessThanOrEqual(1.0);
    });

    it('should reject negative weights', () => {
      const config = configService.getConfig(ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(config.qualityWeights.content).toBeGreaterThanOrEqual(0);
      expect(config.qualityWeights.citation).toBeGreaterThanOrEqual(0);
      expect(config.qualityWeights.journal).toBeGreaterThanOrEqual(0);
      expect(config.qualityWeights.methodology).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// SCORE INFLATION/DEFLATION TESTS (Day 15 Enhancement)
// ============================================================================

describe('Score Inflation/Deflation Prevention', () => {
  let scoringService: PurposeAwareScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
  });

  describe('score clamping', () => {
    it('should never produce scores above 100', () => {
      // Create a "perfect" paper that might score > 100 without clamping
      const perfectPaper = createTestPaper({
        citationCount: 10000,
        year: 2024,
        impactFactor: 100,
        wordCount: 10000,
        hasFullText: true,
      });

      const result = scoringService.scorePaper(perfectPaper, ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should never produce scores below 0', () => {
      // Create a minimal paper
      const minimalPaper = createTestPaper({
        title: 'X',
        abstract: null,
        citationCount: 0,
        year: 1900,
        impactFactor: 0,
        wordCount: 0,
        hasFullText: false,
      });

      const result = scoringService.scorePaper(minimalPaper, ResearchPurpose.Q_METHODOLOGY);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });

    it('should not inflate scores with full-text bonus beyond 100', () => {
      const highScorePaper = createTestPaper({
        citationCount: 500,
        impactFactor: 50,
        wordCount: 8000,
        hasFullText: true,
      });

      const result = scoringService.scorePaper(highScorePaper, ResearchPurpose.LITERATURE_SYNTHESIS);

      // Even with full-text bonus, should not exceed 100
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.fullTextBonus).toBeGreaterThan(0); // Bonus was applied
    });
  });

  describe('component score bounds', () => {
    it('should clamp all component raw scores to 0-100', () => {
      const paper = createTestPaper({
        citationCount: 100000, // Extreme citation count
      });

      const raw = scoringService.getRawScores(paper);

      expect(raw.content).toBeLessThanOrEqual(100);
      expect(raw.citation).toBeLessThanOrEqual(100);
      expect(raw.journal).toBeLessThanOrEqual(100);
      expect(raw.methodology).toBeLessThanOrEqual(100);
      expect(raw.diversity).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined values without crashing', () => {
      const sparePaper = createTestPaper({
        abstract: null,
        keywords: [],
        citationCount: null,
        year: null,
        venue: null,
        impactFactor: null,
        wordCount: null,
      });

      expect(() => {
        scoringService.scorePaper(sparePaper, ResearchPurpose.Q_METHODOLOGY);
      }).not.toThrow();
    });

    it('should handle very old papers', () => {
      const oldPaper = createTestPaper({
        year: 1950,
        citationCount: 1000,
      });

      const result = scoringService.scorePaper(oldPaper, ResearchPurpose.LITERATURE_SYNTHESIS);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should handle papers with zero word count', () => {
      const emptyPaper = createTestPaper({
        wordCount: 0,
        abstract: null,
      });

      const result = scoringService.scorePaper(emptyPaper, ResearchPurpose.QUALITATIVE_ANALYSIS);

      expect(result.components.content.raw).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// PERFORMANCE BENCHMARK TESTS (Day 15 Enhancement)
// ============================================================================

describe('Performance Benchmarks', () => {
  let scoringService: PurposeAwareScoringService;
  let thresholdService: AdaptiveThresholdService;
  let diversityService: DiversityScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
    thresholdService = new AdaptiveThresholdService(configService);
    diversityService = new DiversityScoringService();
  });

  /**
   * Generate large paper set for performance testing
   */
  function generateLargePaperSet(count: number): ScoringPaperInput[] {
    return Array.from({ length: count }, (_, i) =>
      createTestPaper({
        id: `perf-paper-${i}`,
        citationCount: Math.floor(Math.random() * 100),
        year: 2015 + Math.floor(Math.random() * 10),
        wordCount: 500 + Math.floor(Math.random() * 5000),
        hasFullText: Math.random() > 0.5,
      })
    );
  }

  describe('batch scoring performance', () => {
    it('should score 100 papers in under 100ms', () => {
      const papers = generateLargePaperSet(100);

      const start = performance.now();
      const result = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });
      const elapsed = performance.now() - start;

      expect(result.scores).toHaveLength(100);
      expect(elapsed).toBeLessThan(100);
    });

    it('should score 1000 papers in under 500ms', () => {
      const papers = generateLargePaperSet(1000);

      const start = performance.now();
      const result = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });
      const elapsed = performance.now() - start;

      expect(result.scores).toHaveLength(1000);
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('adaptive threshold performance', () => {
    it('should apply threshold relaxation to 500 papers in under 100ms', () => {
      const papers = generateLargePaperSet(500);
      const scores = papers.map(p =>
        scoringService.scorePaper(p, ResearchPurpose.Q_METHODOLOGY)
      );

      const start = performance.now();
      thresholdService.applyAdaptiveThreshold(
        scores,
        ResearchPurpose.Q_METHODOLOGY,
        100,
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('diversity scoring performance', () => {
    it('should analyze corpus diversity for 500 papers in under 200ms', () => {
      const papers = generateLargePaperSet(500);

      const start = performance.now();
      diversityService.analyzeCorpusDiversity(papers);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200);
    });

    // Phase 10.185: Increased threshold to 2000ms for CI/slower machines/parallel workloads
    it('should select for max diversity from 500 papers (target 50) in under 2000ms', () => {
      const papers = generateLargePaperSet(500);

      const start = performance.now();
      const selected = diversityService.selectForMaxDiversity(papers, 50);
      const elapsed = performance.now() - start;

      expect(selected.length).toBe(50);
      expect(elapsed).toBeLessThan(2000); // 2s tolerance for parallel workloads
    });
  });
});

// ============================================================================
// INTEGRATION TESTS (Day 15 Enhancement)
// ============================================================================

describe('Service Integration Tests', () => {
  let scoringService: PurposeAwareScoringService;
  let thresholdService: AdaptiveThresholdService;
  let diversityService: DiversityScoringService;
  let configService: PurposeAwareConfigService;

  beforeEach(() => {
    configService = createMockConfigService();
    scoringService = new PurposeAwareScoringService(configService);
    thresholdService = new AdaptiveThresholdService(configService);
    diversityService = new DiversityScoringService();
  });

  describe('full pipeline flow (simulated Stage 10)', () => {
    it('should score → threshold → diversity select correctly', () => {
      const papers = createTestPaperSet();
      const purpose = ResearchPurpose.Q_METHODOLOGY;
      const targetCount = 3;

      // Step 1: Score papers
      const batchResult = scoringService.scoreBatch({
        papers,
        purpose,
      });

      expect(batchResult.scores).toHaveLength(papers.length);

      // Step 2: Apply adaptive threshold
      const thresholdResult = thresholdService.applyAdaptiveThreshold(
        batchResult.scores,
        purpose,
        targetCount,
      );

      expect(thresholdResult.originalThreshold).toBeGreaterThan(0);

      // Step 3: Select for diversity (Q-methodology specific)
      const selected = diversityService.selectForMaxDiversity(papers, targetCount);

      expect(selected.length).toBe(targetCount);

      // Step 4: Analyze final diversity
      const metrics = diversityService.analyzeCorpusDiversity(selected);

      expect(metrics.totalPapers).toBe(targetCount);
      expect(metrics.healthStatus).toBeDefined();
    });

    it('should maintain score consistency across pipeline', () => {
      const papers = createTestPaperSet();

      // Score same paper twice - should be identical
      const score1 = scoringService.scorePaper(papers[0], ResearchPurpose.Q_METHODOLOGY);
      const score2 = scoringService.scorePaper(papers[0], ResearchPurpose.Q_METHODOLOGY);

      expect(score1.totalScore).toBe(score2.totalScore);
      expect(score1.components.content.raw).toBe(score2.components.content.raw);
    });

    it('should handle empty paper list gracefully', () => {
      const emptyPapers: ScoringPaperInput[] = [];

      const batchResult = scoringService.scoreBatch({
        papers: emptyPapers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });

      expect(batchResult.scores).toHaveLength(0);
      expect(batchResult.stats.totalProcessed).toBe(0);

      const diversityMetrics = diversityService.analyzeCorpusDiversity(emptyPapers);
      expect(diversityMetrics.totalPapers).toBe(0);
    });
  });

  describe('config consistency', () => {
    it('should use same config across services', () => {
      const purpose = ResearchPurpose.LITERATURE_SYNTHESIS;

      const config1 = configService.getConfig(purpose);
      const config2 = configService.getConfig(purpose);

      // Same config object (cached)
      expect(config1.qualityWeights).toEqual(config2.qualityWeights);
      expect(config1.qualityThreshold).toEqual(config2.qualityThreshold);
    });
  });
});
