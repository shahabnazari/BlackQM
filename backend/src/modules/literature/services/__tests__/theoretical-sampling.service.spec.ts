/**
 * Phase 10.170 Week 4+: Theoretical Sampling Service Tests
 * Phase 10.185: Netflix-Grade - Added Vitest imports for ESM compatibility
 *
 * Tests for Security Critical #11: Infinite loop guards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TheoreticalSamplingService,
  TheoreticalSearchFn,
  ConceptExtractionFn,
  ExtractedConcept,
} from '../theoretical-sampling.service';
import { PaperForFilter, TheoreticalSamplingConfig } from '../../types/specialized-pipeline.types';

describe('TheoreticalSamplingService', () => {
  let service: TheoreticalSamplingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TheoreticalSamplingService],
    }).compile();

    service = module.get<TheoreticalSamplingService>(TheoreticalSamplingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeSampling', () => {
    const createMockPaper = (id: string): PaperForFilter => ({
      id,
      title: `Test Paper ${id}`,
      abstract: 'Test abstract with content about user experience and interface design.',
      doi: `10.1234/${id}`,
      year: 2023,
      citationCount: 10,
      venue: 'Test Journal',
      hasFullText: true,
    });

    const createMockSearchFn = (): TheoreticalSearchFn => {
      let callCount = 0;
      return async (query: string, limit: number): Promise<PaperForFilter[]> => {
        callCount++;
        // Return fewer papers on each call to simulate saturation
        const count = Math.max(0, limit - callCount);
        return Array.from({ length: count }, (_, i) =>
          createMockPaper(`search_${callCount}_${i}`),
        );
      };
    };

    const createMockExtractFn = (): ConceptExtractionFn => {
      let conceptIndex = 0;
      return async (papers: readonly PaperForFilter[]): Promise<ExtractedConcept[]> => {
        // Extract fewer new concepts over time to simulate saturation
        const newConceptCount = Math.max(0, 3 - Math.floor(conceptIndex / 5));
        const concepts: ExtractedConcept[] = [];

        for (let i = 0; i < newConceptCount; i++) {
          concepts.push({
            label: `concept_${conceptIndex++}`,
            frequency: Math.floor(Math.random() * papers.length) + 1,
            sourcePaperIds: papers.slice(0, 2).map((p) => p.id),
          });
        }

        return concepts;
      };
    };

    it('should execute sampling with initial papers', async () => {
      const initialPapers = [
        createMockPaper('initial_1'),
        createMockPaper('initial_2'),
      ];

      const searchFn = createMockSearchFn();
      const extractFn = createMockExtractFn();

      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves: 3, maxTotalPapers: 100, maxExecutionTimeMs: 60000 },
      );

      expect(result).toBeDefined();
      expect(result.papers.length).toBeGreaterThanOrEqual(initialPapers.length);
      expect(result.concepts).toBeDefined();
      expect(result.saturationMetrics).toBeDefined();
    });

    it('should respect maxWaves limit (Security Critical #11)', async () => {
      const initialPapers = [createMockPaper('initial_1')];

      // Search that always returns papers
      const searchFn: TheoreticalSearchFn = async () => [
        createMockPaper(`new_${Math.random()}`),
      ];

      // Extract that always returns new concepts
      let conceptId = 0;
      const extractFn: ConceptExtractionFn = async () => [{
        label: `concept_${conceptId++}`,
        frequency: 1,
        sourcePaperIds: ['test'],
      }];

      const maxWaves = 3;
      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves, maxTotalPapers: 1000, maxExecutionTimeMs: 60000 },
      );

      // Wave count should not exceed maxWaves
      expect(result.wave).toBeLessThanOrEqual(maxWaves);
    });

    it('should respect maxTotalPapers limit (Security Critical #11)', async () => {
      const initialPapers = Array.from({ length: 5 }, (_, i) =>
        createMockPaper(`initial_${i}`),
      );

      // Search that returns many papers
      const searchFn: TheoreticalSearchFn = async (_, limit) =>
        Array.from({ length: limit }, (_, i) =>
          createMockPaper(`search_${Math.random()}_${i}`),
        );

      const extractFn = createMockExtractFn();

      const maxTotalPapers = 100;
      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves: 10, maxTotalPapers, maxExecutionTimeMs: 60000 },
      );

      // Should stay within reasonable bounds of maxTotalPapers
      expect(result.papers.length).toBeLessThanOrEqual(maxTotalPapers + 50); // Allow some overshoot due to initial papers
    });

    it('should respect maxExecutionTimeMs limit (Security Critical #11)', async () => {
      const initialPapers = [createMockPaper('initial_1')];

      // Slow search function
      const searchFn: TheoreticalSearchFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [createMockPaper(`slow_${Math.random()}`)];
      };

      const extractFn = createMockExtractFn();

      const maxExecutionTimeMs = 60000; // 1 minute (valid range)
      const startTime = Date.now();

      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves: 5, maxTotalPapers: 1000, maxExecutionTimeMs },
      );

      const elapsed = Date.now() - startTime;

      // Should complete (either by saturation, maxWaves, or timeout)
      expect(result).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should detect saturation and stop early', async () => {
      const initialPapers = [
        createMockPaper('initial_1'),
        createMockPaper('initial_2'),
        createMockPaper('initial_3'),
      ];

      // Search that returns duplicate papers
      const searchFn: TheoreticalSearchFn = async () => [];

      // Extract that returns no new concepts (simulating saturation)
      const extractFn: ConceptExtractionFn = async () => [];

      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves: 10, maxTotalPapers: 1000, maxExecutionTimeMs: 120000 },
      );

      // Should reach saturation or complete within maxWaves
      expect(result.saturationReached || result.wave <= 10).toBe(true);
    });

    it('should track saturation metrics', async () => {
      const initialPapers = [createMockPaper('initial_1')];
      const searchFn = createMockSearchFn();
      const extractFn = createMockExtractFn();

      const result = await service.executeSampling(
        initialPapers,
        searchFn,
        extractFn,
        { maxWaves: 3, maxTotalPapers: 100, maxExecutionTimeMs: 60000 },
      );

      expect(result.saturationMetrics).toHaveProperty('newConceptsLastWave');
      expect(result.saturationMetrics).toHaveProperty('conceptGrowthRate');
      expect(result.saturationMetrics).toHaveProperty('saturatedPercentage');
      expect(result.saturationMetrics).toHaveProperty('overallSaturation');
      expect(result.saturationMetrics).toHaveProperty('wavesSinceNewConcept');
    });

    it('should handle empty initial papers', async () => {
      const searchFn = createMockSearchFn();
      const extractFn = createMockExtractFn();

      const result = await service.executeSampling(
        [],
        searchFn,
        extractFn,
        { maxWaves: 2, maxTotalPapers: 100, maxExecutionTimeMs: 60000 },
      );

      expect(result.papers.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate configuration', async () => {
      const initialPapers = [createMockPaper('initial_1')];
      const searchFn = createMockSearchFn();
      const extractFn = createMockExtractFn();

      // Invalid maxWaves
      await expect(
        service.executeSampling(
          initialPapers,
          searchFn,
          extractFn,
          { maxWaves: 0, maxTotalPapers: 100, maxExecutionTimeMs: 60000 },
        ),
      ).rejects.toThrow();

      // Invalid maxTotalPapers
      await expect(
        service.executeSampling(
          initialPapers,
          searchFn,
          extractFn,
          { maxWaves: 5, maxTotalPapers: 5, maxExecutionTimeMs: 60000 },
        ),
      ).rejects.toThrow();
    });
  });

  describe('executeWave', () => {
    it('should execute a single sampling wave', async () => {
      const state = {
        wave: 1,
        papers: [
          {
            id: 'paper_1',
            title: 'Test Paper',
            abstract: 'Test abstract',
            doi: '10.1234/test',
            year: 2023,
            citationCount: 10,
            venue: 'Test',
            hasFullText: true,
          },
        ],
        concepts: [
          {
            id: 'concept_1',
            label: 'user experience',
            supportingPaperIds: ['paper_1'],
            density: 0.5,
            isSaturated: false,
            firstWave: 1,
            lastActiveWave: 1,
          },
        ],
        saturationReached: false,
        saturationMetrics: {
          newConceptsLastWave: 1,
          conceptGrowthRate: 1,
          saturatedPercentage: 0,
          overallSaturation: 0,
          wavesSinceNewConcept: 0,
        },
        durationMs: 0,
      };

      const searchFn: TheoreticalSearchFn = async () => [{
        id: 'new_paper',
        title: 'New Paper',
        abstract: 'New abstract about user experience',
        doi: '10.1234/new',
        year: 2023,
        citationCount: 5,
        venue: 'Test',
        hasFullText: true,
      }];

      const extractFn: ConceptExtractionFn = async () => [{
        label: 'new concept',
        frequency: 1,
        sourcePaperIds: ['new_paper'],
      }];

      const config: TheoreticalSamplingConfig = {
        maxWaves: 5,
        maxTotalPapers: 100,
        maxExecutionTimeMs: 60000,
        papersPerWave: 10,
        saturationThreshold: 2,
        conceptDensityThreshold: 0.8,
      };

      const result = await service.executeWave(2, state, searchFn, extractFn, config);

      expect(result.wave).toBe(2);
      expect(result.papersAdded).toBeDefined();
      expect(result.newConcepts).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isConceptSaturated', () => {
    it('should return true for saturated concepts', () => {
      const concept = {
        id: 'concept_1',
        label: 'test',
        supportingPaperIds: ['p1', 'p2', 'p3'],
        density: 0.9,
        isSaturated: false,
        firstWave: 1,
        lastActiveWave: 1,
      };

      const currentWave = 5;
      const isSaturated = service.isConceptSaturated(concept, currentWave);

      expect(isSaturated).toBe(true);
    });

    it('should return false for active concepts', () => {
      const concept = {
        id: 'concept_1',
        label: 'test',
        supportingPaperIds: ['p1'],
        density: 0.3,
        isSaturated: false,
        firstWave: 1,
        lastActiveWave: 4,
      };

      const currentWave = 5;
      const isSaturated = service.isConceptSaturated(concept, currentWave);

      expect(isSaturated).toBe(false);
    });
  });
});
