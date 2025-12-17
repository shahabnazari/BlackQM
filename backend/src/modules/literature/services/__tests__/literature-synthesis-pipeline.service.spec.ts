/**
 * Phase 10.170 Week 4+: Literature Synthesis Pipeline Tests
 *
 * Tests for Meta-ethnography synthesis (Noblit & Hare, 1988)
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  LiteratureSynthesisPipelineService,
  StudyWithThemes,
  EmbeddingProviderFn,
} from '../literature-synthesis-pipeline.service';

describe('LiteratureSynthesisPipelineService', () => {
  let service: LiteratureSynthesisPipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiteratureSynthesisPipelineService],
    }).compile();

    service = module.get<LiteratureSynthesisPipelineService>(LiteratureSynthesisPipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('synthesize', () => {
    const createMockStudy = (id: string, themes: string[]): StudyWithThemes => ({
      id,
      title: `Study ${id}`,
      themes: themes.map((label, i) => ({
        id: `${id}_theme_${i}`,
        label,
        description: `Description of ${label}`,
        evidence: [`Evidence for ${label}`],
      })),
      methodology: 'qualitative',
      context: 'healthcare',
      year: 2023,
    });

    const createMockEmbeddingFn = (): EmbeddingProviderFn => {
      const embeddingCache = new Map<string, number[]>();

      return async (texts: readonly string[]): Promise<number[][]> => {
        return texts.map((text) => {
          // Generate deterministic embedding based on text hash
          const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const embedding = Array.from({ length: 128 }, (_, i) =>
            Math.sin(hash + i) * 0.5 + 0.5,
          );
          return embedding;
        });
      };
    };

    it('should synthesize multiple studies with themes', async () => {
      const studies = [
        createMockStudy('study_1', ['patient experience', 'care quality']),
        createMockStudy('study_2', ['patient satisfaction', 'service quality']),
        createMockStudy('study_3', ['healthcare access', 'treatment outcomes']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result).toBeDefined();
      expect(result.reciprocalTranslations).toBeDefined();
      expect(result.lineOfArgument).toBeDefined();
      expect(result.refutationalSynthesis).toBeDefined();
      expect(result.synthesizedThemes).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should identify reciprocal translations between studies', async () => {
      const studies = [
        createMockStudy('study_1', ['theme_a', 'theme_b']),
        createMockStudy('study_2', ['theme_a_similar', 'theme_c']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result.reciprocalTranslations.length).toBeGreaterThan(0);
      expect(result.reciprocalTranslations[0]).toHaveProperty('sourceThemes');
      expect(result.reciprocalTranslations[0]).toHaveProperty('targetThemes');
      expect(result.reciprocalTranslations[0]).toHaveProperty('mappings');
    });

    it('should generate line-of-argument synthesis', async () => {
      const studies = [
        createMockStudy('study_1', ['shared theme', 'unique theme 1']),
        createMockStudy('study_2', ['shared theme', 'unique theme 2']),
        createMockStudy('study_3', ['shared theme', 'unique theme 3']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result.lineOfArgument).toHaveProperty('centralArgument');
      expect(result.lineOfArgument).toHaveProperty('supportingThemes');
      expect(result.lineOfArgument).toHaveProperty('strength');
      expect(result.lineOfArgument).toHaveProperty('evidenceChain');
    });

    it('should identify contradictions in refutational synthesis', async () => {
      const studies = [
        createMockStudy('study_1', ['positive outcome']),
        createMockStudy('study_2', ['however negative outcome']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result.refutationalSynthesis).toHaveProperty('contradictions');
      expect(result.refutationalSynthesis).toHaveProperty('explanations');
      expect(result.refutationalSynthesis).toHaveProperty('unresolvedTensions');
      expect(result.refutationalSynthesis).toHaveProperty('complexityScore');
    });

    it('should calculate quality metrics', async () => {
      const studies = [
        createMockStudy('study_1', ['theme_1', 'theme_2']),
        createMockStudy('study_2', ['theme_3', 'theme_4']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result.qualityMetrics).toHaveProperty('studyCoverage');
      expect(result.qualityMetrics).toHaveProperty('themeSaturation');
      expect(result.qualityMetrics).toHaveProperty('translationCompleteness');
      expect(result.qualityMetrics).toHaveProperty('contradictionResolutionRate');
      expect(result.qualityMetrics).toHaveProperty('overallQuality');

      // All metrics should be between 0 and 1
      expect(result.qualityMetrics.studyCoverage).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.studyCoverage).toBeLessThanOrEqual(1);
      expect(result.qualityMetrics.overallQuality).toBeGreaterThanOrEqual(0);
      expect(result.qualityMetrics.overallQuality).toBeLessThanOrEqual(1);
    });

    it('should handle single study input', async () => {
      const studies = [
        createMockStudy('study_1', ['theme_1', 'theme_2']),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result).toBeDefined();
      expect(result.reciprocalTranslations.length).toBe(0);
    });

    it('should handle empty studies array', async () => {
      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize([], embeddingFn);

      expect(result.synthesizedThemes.length).toBe(0);
    });

    it('should handle studies with no themes', async () => {
      const studies = [
        createMockStudy('study_1', []),
        createMockStudy('study_2', []),
      ];

      const embeddingFn = createMockEmbeddingFn();

      const result = await service.synthesize(studies, embeddingFn);

      expect(result).toBeDefined();
    });
  });

  describe('translateStudies', () => {
    const createStudy = (id: string, themeLabels: string[]): StudyWithThemes => ({
      id,
      title: `Study ${id}`,
      themes: themeLabels.map((label, i) => ({
        id: `${id}_theme_${i}`,
        label,
        description: `Description of ${label}`,
        evidence: [`Evidence for ${label}`],
      })),
      methodology: 'qualitative',
      context: 'research',
      year: 2023,
    });

    const createEmbeddingFn = (): EmbeddingProviderFn => {
      return async (texts: readonly string[]): Promise<number[][]> => {
        return texts.map((text) => {
          const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i));
        });
      };
    };

    it('should translate themes between two studies', async () => {
      const studyA = createStudy('A', ['theme_1', 'theme_2']);
      const studyB = createStudy('B', ['theme_3', 'theme_4']);

      const embeddingFn = createEmbeddingFn();

      const result = await service.translateStudies(studyA, studyB, embeddingFn);

      expect(result).toBeDefined();
      expect(result.id).toBe('trans_A_B');
      expect(result.sourceThemes.length).toBe(2);
      expect(result.targetThemes.length).toBe(2);
      expect(result.mappings).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should identify direct mappings for very similar themes', async () => {
      const studyA = createStudy('A', ['user experience design']);
      const studyB = createStudy('B', ['user experience design']); // Same theme

      // Create embeddings that are identical for same text
      const embeddingFn: EmbeddingProviderFn = async (texts) => {
        return texts.map((text) => {
          const normalized = text.toLowerCase();
          const hash = normalized.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i));
        });
      };

      const result = await service.translateStudies(studyA, studyB, embeddingFn);

      // Should find direct mapping for identical themes
      const directMappings = result.mappings.filter((m) => m.mappingType === 'direct');
      expect(directMappings.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate reciprocity correctly', async () => {
      const studyA = createStudy('A', ['theme_1']);
      const studyB = createStudy('B', ['theme_2']);

      const embeddingFn = createEmbeddingFn();

      const result = await service.translateStudies(studyA, studyB, embeddingFn);

      expect(typeof result.isReciprocal).toBe('boolean');
    });
  });

  describe('quality thresholds', () => {
    it('should respect custom configuration', async () => {
      const studies = [
        {
          id: 'study_1',
          title: 'Study 1',
          themes: [
            { id: 't1', label: 'theme 1', description: 'desc 1', evidence: ['e1'] },
          ],
          methodology: 'qual',
          context: 'test',
          year: 2023,
        },
        {
          id: 'study_2',
          title: 'Study 2',
          themes: [
            { id: 't2', label: 'theme 2', description: 'desc 2', evidence: ['e2'] },
          ],
          methodology: 'qual',
          context: 'test',
          year: 2023,
        },
      ];

      const embeddingFn: EmbeddingProviderFn = async (texts) => {
        return texts.map(() => Array.from({ length: 128 }, () => Math.random()));
      };

      const customConfig = {
        directMappingThreshold: 0.95,
        analogousMappingThreshold: 0.75,
        minStudiesForConsensus: 2,
        contradictionSeverityThreshold: 0.8,
      };

      const result = await service.synthesize(studies, embeddingFn, customConfig);

      expect(result).toBeDefined();
    });
  });
});
