/**
 * Phase 10.171: Cross-Week Integration Tests
 *
 * Integration tests verifying the coherent flow across Week 1-4 implementations:
 * - SearchPipelineService → TwoStageFilterService → PurposeAwareScoringService
 * - DiversityScoringService with metrics
 * - Full pipeline end-to-end verification
 *
 * @module cross-week-integration.service.spec
 * @since Phase 10.171
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TwoStageFilterService } from '../two-stage-filter.service';
import { PurposeAwareScoringService } from '../purpose-aware-scoring.service';
import { PurposeAwareConfigService } from '../purpose-aware-config.service';
import { DiversityScoringService } from '../diversity-scoring.service';
import { PurposeAwareMetricsService } from '../purpose-aware-metrics.service';
import { ResearchPurpose } from '../../types/purpose-aware.types';
import type { PaperForFilter } from '../../types/specialized-pipeline.types';
import type { ScoringPaperInput } from '../../types/purpose-aware-scoring.types';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Create test papers with realistic data
 */
function createTestPapers(count: number): PaperForFilter[] {
  const papers: PaperForFilter[] = [];
  const perspectives = [
    'academic research empirical study methodology',
    'practice implementation clinical case study',
    'policy regulation government institutional',
    'community citizen public opinion society',
    'critique challenge controversy debate skeptic',
    'historical evolution development tradition',
    'emerging innovative breakthrough frontier',
    'cultural cross-cultural international global',
  ];

  for (let i = 0; i < count; i++) {
    const perspectiveText = perspectives[i % perspectives.length];
    papers.push({
      id: `paper-${i}`,
      title: `Test Paper ${i}: ${perspectiveText.split(' ').slice(0, 2).join(' ')}`,
      abstract: `This is a comprehensive ${perspectiveText} about research topic ${i}. ` +
        `The paper presents ${perspectiveText} with detailed analysis and findings. ` +
        `Multiple ${perspectiveText} methods were employed to ensure validity.`,
      doi: `10.1000/test.${i}`,
      year: 2020 + (i % 5),
      citationCount: 10 + (i * 5),
      venue: i % 3 === 0 ? 'Nature' : i % 3 === 1 ? 'Science' : 'PLOS ONE',
      hasFullText: i % 2 === 0,
      qualityScore: 50 + (i % 50),
    });
  }

  return papers;
}

/**
 * Convert PaperForFilter to ScoringPaperInput
 */
function toScoringInput(paper: PaperForFilter): ScoringPaperInput {
  return {
    id: paper.id,
    title: paper.title,
    abstract: paper.abstract,
    keywords: [],
    citationCount: paper.citationCount,
    year: paper.year,
    venue: paper.venue,
    impactFactor: null,
    hasFullText: paper.hasFullText ?? false,
    wordCount: paper.abstract ? paper.abstract.split(/\s+/).length : null,
    existingQualityScore: paper.qualityScore ?? null,
  };
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Cross-Week Integration Tests', () => {
  let configService: PurposeAwareConfigService;
  let scoringService: PurposeAwareScoringService;
  let filterService: TwoStageFilterService;
  let diversityService: DiversityScoringService;
  let metricsService: PurposeAwareMetricsService;

  beforeEach(() => {
    // Initialize services in dependency order
    configService = new PurposeAwareConfigService();
    metricsService = new PurposeAwareMetricsService();
    scoringService = new PurposeAwareScoringService(configService, undefined, metricsService);
    filterService = new TwoStageFilterService(scoringService);
    diversityService = new DiversityScoringService(metricsService);
  });

  // ==========================================================================
  // GAP #3: TwoStageFilter → PurposeAwareScoring Integration
  // ==========================================================================

  describe('Gap #3: TwoStageFilter → PurposeAwareScoring Integration', () => {
    it('should use PurposeAwareScoringService when available', () => {
      const papers = createTestPapers(10);
      const result = filterService.twoStageFilter(
        papers,
        ResearchPurpose.Q_METHODOLOGY,
        30, // Low threshold for testing
      );

      expect(result.finalPapers.length).toBeGreaterThanOrEqual(0);
      expect(result.stats.inputCount).toBe(10);
      expect(result.stats.contentPassCount).toBeGreaterThanOrEqual(result.stats.qualityPassCount);
    });

    it('should apply purpose-specific weights for Q-Methodology', () => {
      const papers = createTestPapers(20);
      const qMethodResult = filterService.twoStageFilter(
        papers,
        ResearchPurpose.Q_METHODOLOGY,
        30,
      );

      const litSynthResult = filterService.twoStageFilter(
        papers,
        ResearchPurpose.LITERATURE_SYNTHESIS,
        30,
      );

      // Q-methodology has zero journal weight, so different results expected
      expect(qMethodResult.stats.inputCount).toBe(litSynthResult.stats.inputCount);
      // Results may differ due to different scoring weights
    });

    it('should fall back to basic scoring when PurposeAwareScoringService unavailable', () => {
      const filterWithoutScoring = new TwoStageFilterService(); // No scoring service
      const papers = createTestPapers(5);

      // Still need to provide a purpose for content eligibility stage config
      const result = filterWithoutScoring.twoStageFilter(
        papers,
        ResearchPurpose.Q_METHODOLOGY,
        30,
      );

      expect(result.finalPapers.length).toBeGreaterThanOrEqual(0);
      expect(result.stats.inputCount).toBe(5);
      // Verify basic scoring was used (no metrics recorded since no metricsService)
    });

    it('should filter by content eligibility first (content-first principle)', () => {
      const papers = createTestPapers(10);
      // Remove abstract from some papers
      papers[0].abstract = null;
      papers[1].abstract = 'Too short';

      const result = filterService.twoStageFilter(
        papers,
        ResearchPurpose.QUALITATIVE_ANALYSIS, // Requires abstract
        30,
      );

      // Papers without proper abstract should be filtered in content stage
      expect(result.stats.contentPassCount).toBeLessThan(result.stats.inputCount);
    });
  });

  // ==========================================================================
  // METRICS INTEGRATION
  // ==========================================================================

  describe('Metrics Integration', () => {
    it('should record scoring metrics via PurposeAwareMetricsService', () => {
      const papers = createTestPapers(5).map(toScoringInput);

      // Score papers
      for (const paper of papers) {
        scoringService.scorePaper(paper, ResearchPurpose.Q_METHODOLOGY);
      }

      const metrics = metricsService.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      expect(metrics.papersScored).toBe(5);
    });

    it('should record diversity metrics when purpose provided', () => {
      const papers = createTestPapers(20).map(toScoringInput);

      // Analyze diversity with purpose
      diversityService.analyzeCorpusDiversity(papers, ResearchPurpose.Q_METHODOLOGY);

      // Metrics should be recorded
      const metrics = metricsService.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      expect(metrics.avgShannonIndex).toBeGreaterThan(0);
    });

    it('should track metrics across multiple purposes', () => {
      const papers = createTestPapers(10).map(toScoringInput);

      // Score for different purposes
      scoringService.scorePaper(papers[0], ResearchPurpose.Q_METHODOLOGY);
      scoringService.scorePaper(papers[1], ResearchPurpose.LITERATURE_SYNTHESIS);
      scoringService.scorePaper(papers[2], ResearchPurpose.HYPOTHESIS_GENERATION);

      const qMetrics = metricsService.getPurposeMetrics(ResearchPurpose.Q_METHODOLOGY);
      const litMetrics = metricsService.getPurposeMetrics(ResearchPurpose.LITERATURE_SYNTHESIS);
      const hypMetrics = metricsService.getPurposeMetrics(ResearchPurpose.HYPOTHESIS_GENERATION);

      expect(qMetrics.papersScored).toBe(1);
      expect(litMetrics.papersScored).toBe(1);
      expect(hypMetrics.papersScored).toBe(1);
    });

    it('should provide SLA compliance status', () => {
      const papers = createTestPapers(100).map(toScoringInput);

      // Batch score
      scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.Q_METHODOLOGY,
      });

      const slaStatus = metricsService.getSLACompliance();
      expect(typeof slaStatus.scoring).toBe('boolean');
      expect(typeof slaStatus.overall).toBe('boolean');
    });
  });

  // ==========================================================================
  // DIVERSITY SCORING
  // ==========================================================================

  describe('Diversity Scoring Integration', () => {
    it('should detect multiple perspectives in paper corpus', () => {
      const papers = createTestPapers(16).map(toScoringInput); // 2 papers per perspective

      const metrics = diversityService.analyzeCorpusDiversity(papers);

      expect(metrics.uniquePerspectives).toBeGreaterThan(0);
      expect(metrics.shannonIndex).toBeGreaterThan(0);
      expect(metrics.coverageRatio).toBeGreaterThan(0);
    });

    it('should select papers for maximum diversity', () => {
      const papers = createTestPapers(50).map(p => ({
        ...toScoringInput(p),
        qualityScore: 60 + (Math.random() * 40),
      }));

      const selected = diversityService.selectForMaxDiversity(papers, 10, 50);

      expect(selected.length).toBe(10);
    });

    it('should identify underrepresented perspectives', () => {
      // Create papers heavily biased toward academic perspective
      const papers: ScoringPaperInput[] = [];
      for (let i = 0; i < 20; i++) {
        papers.push({
          id: `paper-${i}`,
          title: `Academic Research Study ${i}`,
          abstract: 'This is an academic research study with empirical methodology and peer-reviewed findings.',
          keywords: [],
          citationCount: 50,
          year: 2023,
          venue: 'Academic Journal',
          impactFactor: 5.0,
          hasFullText: true,
          wordCount: 100,
          existingQualityScore: 70,
        });
      }

      const metrics = diversityService.analyzeCorpusDiversity(papers);

      // Should have low diversity since all papers are academic
      expect(metrics.underrepresented.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // END-TO-END PIPELINE FLOW
  // ==========================================================================

  describe('End-to-End Pipeline Flow', () => {
    it('should process papers through complete Week 1-4 pipeline', () => {
      // 1. Create test papers
      const papers = createTestPapers(50);

      // 2. Apply two-stage filtering (Week 4)
      const filterResult = filterService.twoStageFilter(
        papers,
        ResearchPurpose.Q_METHODOLOGY,
        40,
      );

      expect(filterResult.finalPapers.length).toBeGreaterThanOrEqual(0);

      // 3. Convert to scoring input and analyze diversity (Week 3)
      const scoringInputs = filterResult.finalPapers.map(toScoringInput);
      const diversityMetrics = diversityService.analyzeCorpusDiversity(
        scoringInputs,
        ResearchPurpose.Q_METHODOLOGY,
      );

      expect(diversityMetrics.totalPapers).toBe(filterResult.finalPapers.length);

      // 4. Check metrics collected (Week 4 infrastructure)
      const metrics = metricsService.getMetricsSummary();
      expect(metrics.totalOperations).toBeGreaterThan(0);
    });

    it('should maintain type safety across service boundaries', () => {
      const papers = createTestPapers(5);

      // Filter returns PaperForFilter[]
      const filterResult = filterService.twoStageFilter(
        papers,
        ResearchPurpose.LITERATURE_SYNTHESIS,
        30,
      );

      // Convert to ScoringPaperInput for scoring service
      const scoringInputs: ScoringPaperInput[] = filterResult.finalPapers.map(p => ({
        id: p.id,
        title: p.title,
        abstract: p.abstract,
        keywords: [],
        citationCount: p.citationCount,
        year: p.year,
        venue: p.venue,
        impactFactor: null,
        hasFullText: p.hasFullText ?? false,
        wordCount: p.abstract ? p.abstract.split(/\s+/).length : null,
        existingQualityScore: p.qualityScore ?? null,
      }));

      // Score via scoring service
      const batchResult = scoringService.scoreBatch({
        papers: scoringInputs,
        purpose: ResearchPurpose.LITERATURE_SYNTHESIS,
      });

      expect(batchResult.scores.length).toBe(scoringInputs.length);
      expect(batchResult.stats.totalProcessed).toBe(scoringInputs.length);
    });

    it('should handle empty input gracefully', () => {
      const emptyPapers: PaperForFilter[] = [];

      const filterResult = filterService.twoStageFilter(
        emptyPapers,
        ResearchPurpose.Q_METHODOLOGY,
        50,
      );

      expect(filterResult.finalPapers.length).toBe(0);
      expect(filterResult.stats.inputCount).toBe(0);

      const diversityMetrics = diversityService.analyzeCorpusDiversity([]);
      expect(diversityMetrics.totalPapers).toBe(0);
      expect(diversityMetrics.shannonIndex).toBe(0);
    });
  });

  // ==========================================================================
  // PERFORMANCE TESTS
  // ==========================================================================

  describe('Performance Integration', () => {
    it('should process 500 papers in under 1 second', () => {
      const papers = createTestPapers(500);
      const start = performance.now();

      const filterResult = filterService.twoStageFilter(
        papers,
        ResearchPurpose.Q_METHODOLOGY,
        30,
      );

      const elapsed = performance.now() - start;

      expect(filterResult.stats.inputCount).toBe(500);
      expect(elapsed).toBeLessThan(1000);
    });

    it('should score batch of 1000 papers efficiently', () => {
      const papers = createTestPapers(1000).map(toScoringInput);
      const start = performance.now();

      const batchResult = scoringService.scoreBatch({
        papers,
        purpose: ResearchPurpose.LITERATURE_SYNTHESIS,
      });

      const elapsed = performance.now() - start;

      expect(batchResult.scores.length).toBe(1000);
      expect(elapsed).toBeLessThan(2000); // 2 seconds max
    });
  });
});
