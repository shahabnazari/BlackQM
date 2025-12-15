/**
 * Phase 10.155: IterativeFetchService Unit Tests
 *
 * Netflix-grade test coverage for iterative paper fetching.
 * Tests iteration logic, stop conditions, deduplication, and state management.
 *
 * Test Categories:
 * 1. Initial State Creation
 * 2. Fetch Limit Calculation
 * 3. Paper Deduplication
 * 4. Stop Conditions
 * 5. State Updates
 * 6. Integration Scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  IterativeFetchService,
  IterationState,
  IterationResult,
  PaperWithOverallScore,
  IterativeFetchConfig,
} from '../iterative-fetch.service';
import { AdaptiveQualityThresholdService } from '../adaptive-quality-threshold.service';

describe('IterativeFetchService', () => {
  let service: IterativeFetchService;
  let adaptiveThreshold: AdaptiveQualityThresholdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IterativeFetchService,
        AdaptiveQualityThresholdService,
      ],
    }).compile();

    service = module.get<IterativeFetchService>(IterativeFetchService);
    adaptiveThreshold = module.get<AdaptiveQualityThresholdService>(AdaptiveQualityThresholdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // 1. INITIAL STATE CREATION
  // ============================================================================
  describe('Initial State Creation', () => {
    it('should create initial state with correct field detection', () => {
      const state = service.createInitialState('cancer immunotherapy clinical trials');

      expect(state.field).toBe('biomedical');
      expect(state.currentThreshold).toBe(60);
      expect(state.currentIteration).toBe(0);
      expect(state.allPapers.size).toBe(0);
      expect(state.exhaustedSources.size).toBe(0);
      expect(state.cancelled).toBe(false);
    });

    it('should create state with social science threshold', () => {
      const state = service.createInitialState('mental health depression psychology');

      expect(state.field).toBe('social-science');
      expect(state.currentThreshold).toBe(45);
    });

    it('should create state with interdisciplinary threshold for ambiguous query', () => {
      const state = service.createInitialState('research analysis');

      expect(state.field).toBe('interdisciplinary');
      expect(state.currentThreshold).toBe(50);
    });

    it('should have start timestamp set', () => {
      const before = Date.now();
      const state = service.createInitialState('test query');
      const after = Date.now();

      expect(state.startTime).toBeGreaterThanOrEqual(before);
      expect(state.startTime).toBeLessThanOrEqual(after);
    });
  });

  // ============================================================================
  // 2. FETCH LIMIT CALCULATION
  // ============================================================================
  describe('Fetch Limit Calculation', () => {
    it('should return base limit for iteration 1', () => {
      const limit = service.getFetchLimitForIteration(1);
      expect(limit).toBe(600);
    });

    it('should return 900 for iteration 2', () => {
      const limit = service.getFetchLimitForIteration(2);
      expect(limit).toBe(900);
    });

    it('should return 1350 for iteration 3', () => {
      const limit = service.getFetchLimitForIteration(3);
      expect(limit).toBe(1350);
    });

    it('should cap at max limit for iteration 4+', () => {
      const limit4 = service.getFetchLimitForIteration(4);
      const limit5 = service.getFetchLimitForIteration(5);

      expect(limit4).toBe(1998); // 600 * 3.33
      expect(limit5).toBe(1998); // Capped at same
    });

    it('should respect custom config', () => {
      const config: IterativeFetchConfig = {
        ...service.getDefaultConfig(),
        baseFetchLimit: 400,
        maxFetchLimit: 1000,
      };

      const limit = service.getFetchLimitForIteration(1, config);
      expect(limit).toBe(400);

      const limit3 = service.getFetchLimitForIteration(3, config);
      expect(limit3).toBe(900); // 400 * 2.25 = 900
    });
  });

  // ============================================================================
  // 3. PAPER DEDUPLICATION
  // ============================================================================
  describe('Paper Deduplication', () => {
    it('should generate key from DOI when available', () => {
      const key = service.generatePaperKey({ doi: '10.1234/test', title: 'Test Paper' });
      expect(key).toBe('doi:10.1234/test');
    });

    it('should generate key from title when DOI unavailable', () => {
      const key = service.generatePaperKey({ title: 'Test Paper Title' });
      expect(key).toBe('title:test paper title');
    });

    it('should normalize titles consistently', () => {
      const key1 = service.generatePaperKey({ title: 'Test Paper!' });
      const key2 = service.generatePaperKey({ title: 'TEST PAPER' });
      const key3 = service.generatePaperKey({ title: '  Test   Paper  ' });

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it('should normalize title by removing punctuation', () => {
      const normalized = service.normalizeTitle('Hello, World! This is a test.');
      expect(normalized).toBe('hello world this is a test');
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(200);
      const normalized = service.normalizeTitle(longTitle);
      expect(normalized.length).toBe(100);
    });
  });

  // ============================================================================
  // 4. STOP CONDITIONS
  // ============================================================================
  describe('Stop Conditions', () => {
    let state: IterationState;

    beforeEach(() => {
      state = service.createInitialState('test query');
      state.currentIteration = 1;
    });

    it('should stop when target reached', () => {
      const result = service.shouldContinue(state, 300, 100, 10);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('TARGET_REACHED');
    });

    it('should stop when user cancels', () => {
      state.cancelled = true;
      const result = service.shouldContinue(state, 100, 50, 10);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('USER_CANCELLED');
    });

    it('should stop when max iterations reached', () => {
      state.currentIteration = 4;
      const result = service.shouldContinue(state, 100, 50, 10);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('MAX_ITERATIONS');
    });

    it('should stop when all sources exhausted', () => {
      state.exhaustedSources = new Set(['source1', 'source2', 'source3']);
      const result = service.shouldContinue(state, 100, 50, 3);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('SOURCES_EXHAUSTED');
    });

    it('should stop on diminishing returns after iteration 1', () => {
      state.currentIteration = 2;
      state.previousFilteredCount = 100;
      // Yield rate = 1 / 100 = 1% < 5% threshold
      const result = service.shouldContinue(state, 101, 100, 10);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('DIMINISHING_RETURNS');
    });

    it('should NOT trigger diminishing returns on iteration 1', () => {
      state.currentIteration = 1;
      state.previousFilteredCount = 0;
      // Would be diminishing returns, but iteration 1 is exempt
      const result = service.shouldContinue(state, 10, 100, 10);
      expect(result.shouldContinue).toBe(true);
      expect(result.reason).toBe('RELAXING_THRESHOLD');
    });

    it('should continue and relax threshold when below target', () => {
      const result = service.shouldContinue(state, 100, 50, 10);
      expect(result.shouldContinue).toBe(true);
      expect(result.reason).toBe('RELAXING_THRESHOLD');
    });

    it('should stop when at minimum threshold', () => {
      state.currentThreshold = 30; // Minimum
      state.currentIteration = 3;
      // Mock that getNextThreshold returns null
      jest.spyOn(adaptiveThreshold, 'getNextThreshold').mockReturnValue(null);

      const result = service.shouldContinue(state, 100, 50, 10);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('MIN_THRESHOLD');
    });
  });

  // ============================================================================
  // 5. STATE UPDATES
  // ============================================================================
  describe('State Updates', () => {
    it('should update state with new papers', () => {
      const state = service.createInitialState('test query');
      const newPapers: PaperWithOverallScore[] = [
        createMockPaper('doi:1', 'Paper 1', 75),
        createMockPaper('doi:2', 'Paper 2', 65),
      ];

      const result = service.processIterationResults(
        state,
        newPapers,
        new Map([['source1', 100]]),
        10,
      );

      expect(result.iteration).toBe(1);
      expect(result.newPapersThisIteration).toBe(2);
      expect(state.allPapers.size).toBe(2);
    });

    it('should deduplicate papers across iterations', () => {
      const state = service.createInitialState('test query');

      // First iteration
      const papers1: PaperWithOverallScore[] = [
        createMockPaper('doi:1', 'Paper 1', 75),
        createMockPaper('doi:2', 'Paper 2', 65),
      ];
      service.processIterationResults(state, papers1, new Map(), 10);

      // Second iteration with overlap
      const papers2: PaperWithOverallScore[] = [
        createMockPaper('doi:1', 'Paper 1', 75), // Duplicate
        createMockPaper('doi:3', 'Paper 3', 55), // New
      ];
      const result = service.processIterationResults(state, papers2, new Map(), 10);

      expect(result.newPapersThisIteration).toBe(1); // Only Paper 3 is new
      expect(state.allPapers.size).toBe(3);
    });

    it('should track exhausted sources', () => {
      const state = service.createInitialState('test query');
      state.currentThreshold = 50;

      const newPapers: PaperWithOverallScore[] = [];
      // source1 returns 100 papers (below 600 * 0.5 = 300 threshold)
      const sourceCounts = new Map([
        ['source1', 100],
        ['source2', 500],
      ]);

      service.processIterationResults(state, newPapers, sourceCounts, 10);

      expect(state.exhaustedSources.has('source1')).toBe(true);
      expect(state.exhaustedSources.has('source2')).toBe(false);
    });

    it('should relax threshold when continuing', () => {
      const state = service.createInitialState('cancer research');
      expect(state.currentThreshold).toBe(60); // Biomedical starts at 60

      // Process iteration with below-target results
      const papers: PaperWithOverallScore[] = Array(50)
        .fill(null)
        .map((_, i) => createMockPaper(`doi:${i}`, `Paper ${i}`, 70));

      service.processIterationResults(state, papers, new Map(), 10);

      // Threshold should be relaxed for next iteration
      expect(state.currentThreshold).toBe(50);
    });
  });

  // ============================================================================
  // 6. FILTERED PAPERS RETRIEVAL
  // ============================================================================
  describe('Filtered Papers Retrieval', () => {
    it('should filter papers by threshold', () => {
      const state = service.createInitialState('test query');
      state.currentThreshold = 50;

      // Add papers with various scores
      state.allPapers.set('1', createMockPaper('doi:1', 'High', 80));
      state.allPapers.set('2', createMockPaper('doi:2', 'Medium', 55));
      state.allPapers.set('3', createMockPaper('doi:3', 'Low', 30));

      const filtered = service.getFilteredPapers(state, 300);

      expect(filtered.length).toBe(2); // Only 80 and 55 pass
    });

    it('should sort filtered papers by overall score', () => {
      const state = service.createInitialState('test query');
      state.currentThreshold = 40;

      state.allPapers.set('1', createMockPaper('doi:1', 'Medium', 55));
      state.allPapers.set('2', createMockPaper('doi:2', 'High', 80));
      state.allPapers.set('3', createMockPaper('doi:3', 'Low', 45));

      const filtered = service.getFilteredPapers(state, 300);

      expect(filtered[0].overallScore).toBe(80);
      expect(filtered[1].overallScore).toBe(55);
      expect(filtered[2].overallScore).toBe(45);
    });

    it('should respect target count limit', () => {
      const state = service.createInitialState('test query');
      state.currentThreshold = 0;

      // Add more papers than target
      for (let i = 0; i < 500; i++) {
        state.allPapers.set(`${i}`, createMockPaper(`doi:${i}`, `Paper ${i}`, 50 + Math.random() * 50));
      }

      const filtered = service.getFilteredPapers(state, 300);

      expect(filtered.length).toBe(300);
    });
  });

  // ============================================================================
  // 7. PROGRESS EVENT CREATION
  // ============================================================================
  describe('Progress Event Creation', () => {
    it('should create valid progress event', () => {
      const result: IterationResult = {
        iteration: 2,
        threshold: 50,
        papersFound: 150,
        targetPapers: 300,
        newPapersThisIteration: 75,
        yieldRate: 0.3,
        sourcesExhausted: ['source1'],
        shouldContinue: true,
        reason: 'RELAXING_THRESHOLD',
        fetchLimit: 900,
        durationMs: 5000,
        timestamp: Date.now(),
      };

      const event = service.createProgressEvent('search-123', result, 'iteration_complete');

      expect(event.type).toBe('iteration_complete');
      expect(event.searchId).toBe('search-123');
      expect(event.iteration).toBe(2);
      expect(event.threshold).toBe(50);
      expect(event.papersFound).toBe(150);
      expect(event.reason).toBe('RELAXING_THRESHOLD');
    });

    it('should not include reason for iteration_start', () => {
      const result: IterationResult = {
        iteration: 1,
        threshold: 60,
        papersFound: 0,
        targetPapers: 300,
        newPapersThisIteration: 0,
        yieldRate: 0,
        sourcesExhausted: [],
        shouldContinue: true,
        reason: 'RELAXING_THRESHOLD',
        fetchLimit: 600,
        durationMs: 0,
        timestamp: Date.now(),
      };

      const event = service.createProgressEvent('search-123', result, 'iteration_start');

      expect(event.reason).toBeUndefined();
    });
  });

  // ============================================================================
  // 8. INTEGRATION SCENARIOS
  // ============================================================================
  describe('Integration Scenarios', () => {
    it('should handle full iteration workflow for biomedical query', () => {
      // Create initial state
      const state = service.createInitialState('cancer immunotherapy clinical trials');
      expect(state.field).toBe('biomedical');
      expect(state.currentThreshold).toBe(60);

      // Iteration 1: Find 82 papers
      const papers1 = createMockPapersWithScores(100, 40, 90);
      const result1 = service.processIterationResults(state, papers1, new Map(), 10);

      expect(result1.iteration).toBe(1);
      expect(result1.papersFound).toBeLessThan(300);
      expect(result1.shouldContinue).toBe(true);
      expect(state.currentThreshold).toBe(50); // Relaxed

      // Iteration 2: Find more papers with relaxed threshold
      const papers2 = createMockPapersWithScores(150, 35, 85);
      const result2 = service.processIterationResults(state, papers2, new Map(), 10);

      expect(result2.iteration).toBe(2);
      // More papers should pass with lower threshold
      expect(result2.papersFound).toBeGreaterThan(result1.papersFound);
    });

    it('should stop early when target reached', () => {
      const state = service.createInitialState('test query');
      state.currentThreshold = 40;

      // Add enough high-quality papers to meet target
      const papers = createMockPapersWithScores(350, 50, 90);
      const result = service.processIterationResults(state, papers, new Map(), 10);

      expect(result.papersFound).toBeGreaterThanOrEqual(300);
      expect(result.shouldContinue).toBe(false);
      expect(result.reason).toBe('TARGET_REACHED');
    });

    it('should handle cancellation gracefully', () => {
      const state = service.createInitialState('test query');

      // Start iteration
      const papers = createMockPapersWithScores(100, 40, 80);
      service.processIterationResults(state, papers, new Map(), 10);

      // Cancel
      service.cancelIteration(state);

      // Check cancellation
      expect(state.cancelled).toBe(true);
      const continueCheck = service.shouldContinue(state, 100, 0, 10);
      expect(continueCheck.shouldContinue).toBe(false);
      expect(continueCheck.reason).toBe('USER_CANCELLED');

      // Should still be able to get partial results
      const filtered = service.getFilteredPapers(state, 300);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockPaper(doi: string, title: string, overallScore: number): PaperWithOverallScore {
  return {
    id: doi,
    doi,
    title,
    overallScore,
    qualityScore: overallScore * 0.8,
    neuralRelevanceScore: overallScore * 1.2,
  };
}

function createMockPapersWithScores(count: number, minScore: number, maxScore: number): PaperWithOverallScore[] {
  return Array(count)
    .fill(null)
    .map((_, i) => {
      const score = minScore + Math.random() * (maxScore - minScore);
      return createMockPaper(`doi:${i}-${Date.now()}`, `Paper ${i}`, Math.round(score));
    });
}
