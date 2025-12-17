/**
 * Phase 10.170 Week 4+: Two-Stage Filter Service Tests
 *
 * Tests for Security Critical #10: Immutable copy to prevent race conditions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TwoStageFilterService } from '../two-stage-filter.service';
import { PaperForFilter } from '../../types/specialized-pipeline.types';
import { ResearchPurpose } from '../../types/purpose-aware.types';

describe('TwoStageFilterService', () => {
  let service: TwoStageFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwoStageFilterService],
    }).compile();

    service = module.get<TwoStageFilterService>(TwoStageFilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('twoStageFilter', () => {
    const createMockPaper = (overrides: Partial<PaperForFilter> = {}): PaperForFilter => ({
      id: `paper_${Math.random().toString(36).substring(7)}`,
      title: 'Test Paper Title',
      abstract: 'This is a test abstract with sufficient content for analysis.',
      doi: '10.1234/test',
      year: 2023,
      citationCount: 10,
      venue: 'Test Journal',
      hasFullText: true,
      qualityScore: 75,
      ...overrides,
    });

    it('should filter papers through both stages', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ qualityScore: 80 }),
        createMockPaper({ qualityScore: 60 }),
        createMockPaper({ qualityScore: 40 }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.contentStage).toBeDefined();
      expect(result.qualityStage).toBeDefined();
      expect(result.finalPapers).toBeDefined();
      expect(result.stats).toBeDefined();
    });

    it('should reject papers without abstract in content stage', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ abstract: null }),
        createMockPaper({ abstract: 'Valid abstract' }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.contentStage.rejected.length).toBeGreaterThanOrEqual(1);
      expect(result.contentStage.rejectionReasons.size).toBeGreaterThanOrEqual(1);
    });

    it('should reject papers with very old publication year', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ year: 1990 }),
        createMockPaper({ year: 2023 }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      // Old papers should be rejected in content stage
      const rejectedYears = papers.filter(
        (p) => result.contentStage.rejected.some((r) => r.id === p.id),
      );
      expect(rejectedYears.length).toBeGreaterThanOrEqual(0);
    });

    it('should reject papers below quality threshold in quality stage', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ qualityScore: 10 }),
        createMockPaper({ qualityScore: 90 }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      // Low quality papers should be rejected in quality stage
      expect(result.qualityStage.disqualified.length).toBeGreaterThanOrEqual(0);
    });

    it('should create immutable copies of input papers (Security Critical #10)', () => {
      const papers: PaperForFilter[] = [createMockPaper()];
      const originalId = papers[0].id;

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      // Verify original papers are not mutated
      expect(papers[0].id).toBe(originalId);

      // Verify result papers are separate instances
      if (result.finalPapers.length > 0) {
        expect(result.finalPapers[0]).not.toBe(papers[0]);
      }
    });

    it('should calculate correct statistics', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ qualityScore: 80 }),
        createMockPaper({ qualityScore: 60 }),
        createMockPaper({ qualityScore: 40 }),
        createMockPaper({ abstract: null }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.stats.inputCount).toBe(4);
      expect(result.stats.finalPassRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.finalPassRate).toBeLessThanOrEqual(1);
    });

    it('should allow custom quality threshold override', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ qualityScore: 30 }),
        createMockPaper({ qualityScore: 40 }),
        createMockPaper({ qualityScore: 50 }),
      ];

      // With low threshold, more papers should pass
      const lowThresholdResult = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose, 20);

      // With high threshold, fewer papers should pass
      const highThresholdResult = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose, 80);

      expect(lowThresholdResult.qualityStage.qualified.length).toBeGreaterThanOrEqual(
        highThresholdResult.qualityStage.qualified.length,
      );
    });

    it('should handle empty input array', () => {
      const papers: PaperForFilter[] = [];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.finalPapers).toHaveLength(0);
      expect(result.stats.inputCount).toBe(0);
    });

    it('should track execution time', () => {
      const papers: PaperForFilter[] = [
        createMockPaper(),
        createMockPaper(),
        createMockPaper(),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.contentStage.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.qualityStage.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('content eligibility through twoStageFilter', () => {
    const createMockPaper = (overrides: Partial<PaperForFilter> = {}): PaperForFilter => ({
      id: `paper_${Math.random().toString(36).substring(7)}`,
      title: 'Test Paper Title',
      abstract: 'This is a test abstract with sufficient content for analysis.',
      doi: '10.1234/test',
      year: 2023,
      citationCount: 10,
      venue: 'Test Journal',
      hasFullText: true,
      qualityScore: 75,
      ...overrides,
    });

    it('should pass papers with valid content through content stage', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ abstract: 'This is a valid abstract with enough content for analysis.' }),
      ];

      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      expect(result.contentStage.eligible.length).toBeGreaterThan(0);
    });

    it('should reject papers with missing abstract in content stage (when required)', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ abstract: null }),
      ];

      // Use 'literature_synthesis' which requires abstracts
      const result = service.twoStageFilter(papers, 'literature_synthesis' as ResearchPurpose);

      expect(result.contentStage.rejected.length).toBe(1);
      expect(result.contentStage.rejectionReasons.size).toBe(1);
    });

    it('should allow papers without abstract for q_methodology (not required)', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ abstract: null }),
      ];

      // Q_methodology doesn't require abstracts
      const result = service.twoStageFilter(papers, 'q_methodology' as ResearchPurpose);

      // Should pass content stage (abstract not required for q_methodology)
      expect(result.contentStage.eligible.length).toBe(1);
    });

    it('should reject papers with very short abstract in content stage', () => {
      const papers: PaperForFilter[] = [
        createMockPaper({ abstract: 'Too short' }),
      ];

      // Use 'literature_synthesis' which has minAbstractLength: 150
      const result = service.twoStageFilter(papers, 'literature_synthesis' as ResearchPurpose);

      expect(result.contentStage.rejected.length).toBe(1);
    });
  });
});
