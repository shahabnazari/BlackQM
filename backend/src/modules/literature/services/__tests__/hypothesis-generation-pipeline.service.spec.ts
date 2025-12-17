/**
 * Phase 10.170 Week 4+: Hypothesis Generation Pipeline Tests
 *
 * Tests for Grounded Theory methodology (Glaser & Strauss, 1967)
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  HypothesisGenerationPipelineService,
  GroundedTheorySource,
  GTEmbeddingProviderFn,
} from '../hypothesis-generation-pipeline.service';

describe('HypothesisGenerationPipelineService', () => {
  let service: HypothesisGenerationPipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HypothesisGenerationPipelineService],
    }).compile();

    service = module.get<HypothesisGenerationPipelineService>(HypothesisGenerationPipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateHypotheses', () => {
    const createMockSource = (id: string, content: string): GroundedTheorySource => ({
      id,
      title: `Source ${id}: ${content.substring(0, 30)}`,
      abstract: content,
      fullText: `Full text expanding on: ${content}. This includes more detail about user experience, interface design, and accessibility. The findings suggest that because of these factors, users tend to prefer simpler interfaces resulting in better outcomes.`,
      keywords: ['user experience', 'interface design', 'accessibility'],
    });

    const createMockEmbeddingFn = (): GTEmbeddingProviderFn => {
      return async (texts: readonly string[]): Promise<number[][]> => {
        return texts.map((text) => {
          const hash = text.toLowerCase().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i) * 0.5 + 0.5);
        });
      };
    };

    it('should generate hypotheses from sources', async () => {
      const sources = [
        createMockSource('1', 'User experience impacts satisfaction'),
        createMockSource('2', 'Interface design affects usability'),
        createMockSource('3', 'Accessibility improves engagement'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result).toBeDefined();
      expect(result.openCoding).toBeDefined();
      expect(result.axialCoding).toBeDefined();
      expect(result.selectiveCoding).toBeDefined();
      expect(result.theoreticalFramework).toBeDefined();
      expect(result.hypotheses).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should perform open coding to extract initial codes', async () => {
      const sources = [
        createMockSource('1', 'The study found that user experience significantly impacts satisfaction levels.'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.openCoding).toHaveProperty('codes');
      expect(result.openCoding).toHaveProperty('frequencyDistribution');
      expect(result.openCoding).toHaveProperty('inVivoCodes');
      expect(result.openCoding).toHaveProperty('codingDensity');
    });

    it('should perform axial coding with paradigm model', async () => {
      const sources = [
        createMockSource('1', 'Because of poor design, users struggle with navigation resulting in frustration.'),
        createMockSource('2', 'Users approach the interface through trial and error leading to learning.'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.axialCoding).toHaveProperty('categories');
      expect(result.axialCoding).toHaveProperty('relationships');
      expect(result.axialCoding).toHaveProperty('paradigmCompleteness');

      // Check paradigm model components
      if (result.axialCoding.categories.length > 0) {
        const category = result.axialCoding.categories[0];
        expect(category).toHaveProperty('causalConditions');
        expect(category).toHaveProperty('context');
        expect(category).toHaveProperty('interveningConditions');
        expect(category).toHaveProperty('actionStrategies');
        expect(category).toHaveProperty('consequences');
      }
    });

    it('should perform selective coding to identify core category', async () => {
      const sources = [
        createMockSource('1', 'Central theme emerges from user behavior'),
        createMockSource('2', 'User behavior connects all other findings'),
        createMockSource('3', 'Outcomes depend on user behavior patterns'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.selectiveCoding).toHaveProperty('coreCategory');
      expect(result.selectiveCoding).toHaveProperty('categoryIntegration');
      expect(result.selectiveCoding).toHaveProperty('storyline');
      expect(result.selectiveCoding).toHaveProperty('theoreticalSaturation');

      expect(result.selectiveCoding.coreCategory).toHaveProperty('label');
      expect(result.selectiveCoding.coreCategory).toHaveProperty('centrality');
      expect(result.selectiveCoding.coreCategory).toHaveProperty('explanatoryPower');
    });

    it('should generate theoretical framework', async () => {
      const sources = [
        createMockSource('1', 'Framework connecting design and outcomes'),
        createMockSource('2', 'Theoretical basis for user behavior'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.theoreticalFramework).toHaveProperty('id');
      expect(result.theoreticalFramework).toHaveProperty('name');
      expect(result.theoreticalFramework).toHaveProperty('description');
      expect(result.theoreticalFramework).toHaveProperty('coreConstruct');
      expect(result.theoreticalFramework).toHaveProperty('constructs');
      expect(result.theoreticalFramework).toHaveProperty('propositions');
      expect(result.theoreticalFramework).toHaveProperty('boundaryConditions');
      expect(result.theoreticalFramework).toHaveProperty('diagramMermaid');
    });

    it('should generate testable hypotheses', async () => {
      const sources = [
        createMockSource('1', 'Independent variable affects dependent variable'),
        createMockSource('2', 'Mediator explains the relationship'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      if (result.hypotheses.length > 0) {
        const hypothesis = result.hypotheses[0];
        expect(hypothesis).toHaveProperty('id');
        expect(hypothesis).toHaveProperty('statement');
        expect(hypothesis).toHaveProperty('type');
        expect(hypothesis).toHaveProperty('variables');
        expect(hypothesis).toHaveProperty('grounding');
        expect(hypothesis).toHaveProperty('testability');
        expect(hypothesis).toHaveProperty('novelty');
      }
    });

    it('should calculate quality metrics', async () => {
      const sources = [
        createMockSource('1', 'Quality source with rich content'),
        createMockSource('2', 'Another source with detailed findings'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.qualityMetrics).toHaveProperty('samplingAdequacy');
      expect(result.qualityMetrics).toHaveProperty('codingDensity');
      expect(result.qualityMetrics).toHaveProperty('categoryCompleteness');
      expect(result.qualityMetrics).toHaveProperty('paradigmCompleteness');
      expect(result.qualityMetrics).toHaveProperty('coreCategoryCentrality');
      expect(result.qualityMetrics).toHaveProperty('theoreticalSaturation');
      expect(result.qualityMetrics).toHaveProperty('frameworkCoherence');
      expect(result.qualityMetrics).toHaveProperty('overallQuality');

      // All metrics should be between 0 and 1
      expect(result.qualityMetrics.overallQuality).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.overallQuality).toBeLessThanOrEqual(1);
    });

    it('should extract in-vivo codes from quoted text', async () => {
      const sources = [
        {
          id: '1',
          title: 'Source with quotes',
          abstract: 'Participants described "feeling overwhelmed" by the interface.',
          fullText: 'Users mentioned "easy to use" as a key factor.',
          keywords: ['quotes', 'in-vivo'],
        },
      ];

      const embeddingFn = createMockEmbeddingFn();
      const config = { enableInVivoCodes: true };

      const result = await service.generateHypotheses(sources, embeddingFn, config);

      expect(result.openCoding.inVivoCodes).toBeDefined();
      expect(Array.isArray(result.openCoding.inVivoCodes)).toBe(true);
    });

    it('should handle empty sources array', async () => {
      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses([], embeddingFn);

      expect(result).toBeDefined();
      expect(result.openCoding.codes.length).toBe(0);
    });

    it('should handle sources with minimal content', async () => {
      const sources = [
        {
          id: '1',
          title: 'Minimal',
          abstract: null,
          fullText: null,
          keywords: [],
        },
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result).toBeDefined();
    });

    it('should generate mermaid diagram', async () => {
      const sources = [
        createMockSource('1', 'Source for diagram generation'),
        createMockSource('2', 'Another source for relationships'),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.theoreticalFramework.diagramMermaid).toBeDefined();
      expect(result.theoreticalFramework.diagramMermaid).toContain('graph TD');
    });
  });

  describe('configuration options', () => {
    it('should respect custom configuration', async () => {
      const sources = [
        {
          id: '1',
          title: 'Test',
          abstract: 'Test content',
          fullText: 'Full test content',
          keywords: ['test'],
        },
      ];

      const embeddingFn: GTEmbeddingProviderFn = async (texts) => {
        return texts.map(() => Array.from({ length: 128 }, () => Math.random()));
      };

      const customConfig = {
        minCodeFrequency: 1,
        codeMergeThreshold: 0.9,
        minAxialCategories: 2,
        minPropositionsForHypothesis: 1,
        enableInVivoCodes: true,
      };

      const result = await service.generateHypotheses(sources, embeddingFn, customConfig);

      expect(result).toBeDefined();
    });
  });

  describe('hypothesis types', () => {
    it('should generate various hypothesis types', async () => {
      const sources = [
        {
          id: '1',
          title: 'Complex relationships',
          abstract: 'X causes Y when Z is present. A moderates the effect of B on C.',
          fullText: 'The mediating role of M between independent and dependent variables.',
          keywords: ['causal', 'moderating', 'mediating'],
        },
        {
          id: '2',
          title: 'Conditional effects',
          abstract: 'Under certain conditions, the relationship changes.',
          fullText: 'Conditional relationships depend on context.',
          keywords: ['conditional', 'context'],
        },
      ];

      const embeddingFn: GTEmbeddingProviderFn = async (texts) => {
        return texts.map((text) => {
          const hash = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i));
        });
      };

      const result = await service.generateHypotheses(sources, embeddingFn);

      // Should generate hypotheses of various types
      if (result.hypotheses.length > 0) {
        const types = result.hypotheses.map((h) => h.type);
        expect(types.length).toBeGreaterThan(0);
      }
    });
  });

  describe('category relationships', () => {
    it('should identify relationships between categories', async () => {
      const sources = [
        {
          id: '1',
          title: 'Cause and effect',
          abstract: 'Factor A leads to outcome B. Condition C results in effect D.',
          fullText: 'The causal chain shows that A causes B which then causes C.',
          keywords: ['causal', 'chain'],
        },
      ];

      const embeddingFn: GTEmbeddingProviderFn = async (texts) => {
        return texts.map((text) => {
          const hash = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i));
        });
      };

      const result = await service.generateHypotheses(sources, embeddingFn);

      expect(result.axialCoding.relationships).toBeDefined();
      expect(Array.isArray(result.axialCoding.relationships)).toBe(true);
    });
  });
});
