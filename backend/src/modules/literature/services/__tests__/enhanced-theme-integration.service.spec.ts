import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnhancedThemeIntegrationService, Theme } from '../enhanced-theme-integration.service';
import { PrismaService } from '../../../../common/prisma.service';

/**
 * Enhanced Theme Integration Service Test Suite
 * Phase 10 Day 5.12
 *
 * Test Coverage:
 * - Research question generation (exploratory, explanatory, evaluative, descriptive)
 * - Hypothesis generation (correlational, causal, mediation, moderation, interaction)
 * - Theme-to-construct mapping with relationship detection
 * - Complete survey generation
 * - AI and template fallback mechanisms
 * - Edge cases and error handling
 *
 * Target: 35+ test cases for enterprise-grade quality
 */

describe('EnhancedThemeIntegrationService', () => {
  let service: EnhancedThemeIntegrationService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockThemes: Theme[] = [
    {
      id: 'theme1',
      name: 'Work-Life Balance',
      description: 'Balancing professional responsibilities with personal life',
      prevalence: 0.85,
      confidence: 0.90,
      sources: [
        { id: 'paper1', title: 'Work-Life Balance Study', type: 'academic' },
        { id: 'paper2', title: 'Professional Wellbeing', type: 'academic' },
      ],
      keyPhrases: ['work-life balance', 'professional boundaries', 'wellbeing'],
      subthemes: [
        { name: 'Flexible Work', description: 'Remote and flexible working arrangements' },
        { name: 'Time Management', description: 'Managing time effectively' },
      ],
    },
    {
      id: 'theme2',
      name: 'Job Satisfaction',
      description: 'Overall satisfaction with employment and career',
      prevalence: 0.78,
      confidence: 0.85,
      sources: [
        { id: 'paper3', title: 'Job Satisfaction Research', type: 'academic' },
      ],
      keyPhrases: ['job satisfaction', 'career fulfillment', 'workplace happiness'],
    },
    {
      id: 'theme3',
      name: 'Organizational Culture',
      description: 'Values, norms, and practices within the organization',
      prevalence: 0.72,
      confidence: 0.80,
      sources: [
        { id: 'paper4', title: 'Organizational Culture Analysis', type: 'academic' },
      ],
      keyPhrases: ['organizational culture', 'company values', 'workplace norms'],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedThemeIntegrationService,
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma service methods if needed
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Return mock OpenAI key for tests
              if (key === 'OPENAI_API_KEY') {
                return undefined; // Test template fallback
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EnhancedThemeIntegrationService>(EnhancedThemeIntegrationService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== RESEARCH QUESTION GENERATION TESTS ====================

  describe('suggestResearchQuestions', () => {
    it('should generate research questions from themes', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
        maxQuestions: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should generate questions of different types', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
        questionTypes: ['exploratory', 'explanatory'],
        maxQuestions: 10,
      });

      const types = new Set(result.map((q) => q.type));
      expect(types.has('exploratory') || types.has('explanatory')).toBe(true);
    });

    it('should include relevance scores between 0 and 1', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
      });

      result.forEach((q) => {
        expect(q.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(q.relevanceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should include rationale for each question', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
      });

      result.forEach((q) => {
        expect(q.rationale).toBeDefined();
        expect(typeof q.rationale).toBe('string');
        expect(q.rationale.length).toBeGreaterThan(0);
      });
    });

    it('should link questions to related themes', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
      });

      result.forEach((q) => {
        expect(Array.isArray(q.relatedThemes)).toBe(true);
        expect(q.relatedThemes.length).toBeGreaterThan(0);
      });
    });

    it('should assign complexity levels', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
      });

      result.forEach((q) => {
        expect(['basic', 'intermediate', 'advanced']).toContain(q.complexity);
      });
    });

    it('should suggest appropriate methodologies', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
      });

      result.forEach((q) => {
        expect([
          'qualitative',
          'quantitative',
          'mixed_methods',
          'q_methodology',
        ]).toContain(q.suggestedMethodology);
      });
    });

    it('should prioritize high-confidence themes', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
        maxQuestions: 5,
      });

      // First few questions should reference high-confidence themes
      const topQuestion = result[0];
      const highConfidenceThemeIds = mockThemes
        .filter((t) => t.confidence >= 0.85)
        .map((t) => t.id);

      const hasHighConfidenceTheme = topQuestion.relatedThemes.some((id) =>
        highConfidenceThemeIds.includes(id),
      );

      expect(hasHighConfidenceTheme).toBe(true);
    });

    it('should handle single theme input', async () => {
      const result = await service.suggestResearchQuestions({
        themes: [mockThemes[0]],
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((q) => {
        expect(q.relatedThemes).toContain('theme1');
      });
    });

    it('should respect maxQuestions limit', async () => {
      const result = await service.suggestResearchQuestions({
        themes: mockThemes,
        maxQuestions: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  // ==================== HYPOTHESIS GENERATION TESTS ====================

  describe('suggestHypotheses', () => {
    it('should generate hypotheses from themes', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
        maxHypotheses: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should generate correlational hypotheses', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
        hypothesisTypes: ['correlational'],
      });

      const correlationalHyp = result.filter((h) => h.type === 'correlational');
      expect(correlationalHyp.length).toBeGreaterThan(0);
    });

    it('should identify independent and dependent variables', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(h.independentVariable).toBeDefined();
        expect(typeof h.independentVariable).toBe('string');
        expect(h.dependentVariable).toBeDefined();
        expect(typeof h.dependentVariable).toBe('string');
      });
    });

    it('should include confidence scores', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(h.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(h.confidenceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should assign evidence strength ratings', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(['strong', 'moderate', 'weak']).toContain(h.evidenceStrength);
      });
    });

    it('should suggest statistical tests', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(h.suggestedStatisticalTest).toBeDefined();
        expect(typeof h.suggestedStatisticalTest).toBe('string');
        expect(h.suggestedStatisticalTest.length).toBeGreaterThan(0);
      });
    });

    it('should include research backing', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(h.researchBacking).toBeDefined();
        expect(typeof h.researchBacking).toBe('string');
      });
    });

    it('should link hypotheses to related themes', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
      });

      result.forEach((h) => {
        expect(Array.isArray(h.relatedThemes)).toBe(true);
        expect(h.relatedThemes.length).toBeGreaterThan(0);
      });
    });

    it('should respect maxHypotheses limit', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
        maxHypotheses: 5,
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize high-confidence theme combinations', async () => {
      const result = await service.suggestHypotheses({
        themes: mockThemes,
        maxHypotheses: 3,
      });

      // Top hypothesis should involve high-confidence themes
      const topHypothesis = result[0];
      expect(topHypothesis.confidenceScore).toBeGreaterThanOrEqual(0.5);
    });
  });

  // ==================== CONSTRUCT MAPPING TESTS ====================

  describe('mapThemesToConstructs', () => {
    it('should map themes to constructs', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create construct definitions', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
      });

      result.forEach((mapping) => {
        expect(mapping.construct).toBeDefined();
        expect(mapping.construct.id).toBeDefined();
        expect(mapping.construct.name).toBeDefined();
        expect(mapping.construct.definition).toBeDefined();
        expect(typeof mapping.construct.definition).toBe('string');
      });
    });

    it('should link constructs to themes', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
      });

      result.forEach((mapping) => {
        expect(Array.isArray(mapping.construct.themes)).toBe(true);
        expect(mapping.construct.themes.length).toBeGreaterThan(0);
      });
    });

    it('should detect construct relationships when enabled', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
        includeRelationships: true,
      });

      result.forEach((mapping) => {
        expect(Array.isArray(mapping.relatedConstructs)).toBe(true);
      });
    });

    it('should not include relationships when disabled', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
        includeRelationships: false,
      });

      result.forEach((mapping) => {
        expect(mapping.relatedConstructs.length).toBe(0);
      });
    });

    it('should cluster similar themes together', async () => {
      const result = await service.mapThemesToConstructs({
        themes: mockThemes,
      });

      // Should have fewer constructs than themes due to clustering
      expect(result.length).toBeLessThanOrEqual(mockThemes.length);
    });

    it('should handle single theme', async () => {
      const result = await service.mapThemesToConstructs({
        themes: [mockThemes[0]],
      });

      expect(result.length).toBe(1);
      expect(result[0].construct.themes).toContain('theme1');
    });
  });

  // ==================== COMPLETE SURVEY GENERATION TESTS ====================

  describe('generateCompleteSurvey', () => {
    it('should generate complete survey with all sections', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'mixed',
      });

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should include introduction for confirmatory surveys', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'confirmatory',
      });

      const introSection = result.sections.find((s) => s.id === 'intro');
      expect(introSection).toBeDefined();
    });

    it('should include demographics when requested', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
        includeDemographics: true,
      });

      const demoSection = result.sections.find((s) => s.id === 'demographics');
      expect(demoSection).toBeDefined();
      expect(demoSection?.items.length).toBeGreaterThan(0);
    });

    it('should exclude demographics when not requested', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
        includeDemographics: false,
      });

      const demoSection = result.sections.find((s) => s.id === 'demographics');
      expect(demoSection).toBeUndefined();
    });

    it('should include main items section', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
      });

      const mainSection = result.sections.find((s) => s.id === 'main_items');
      expect(mainSection).toBeDefined();
      expect(mainSection?.items.length).toBeGreaterThan(0);
    });

    it('should include validity checks when requested', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'confirmatory',
        includeValidityChecks: true,
      });

      const validitySection = result.sections.find((s) => s.id === 'validity_checks');
      expect(validitySection).toBeDefined();
    });

    it('should calculate total items correctly', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
        includeDemographics: true,
        includeValidityChecks: true,
      });

      const actualTotal = result.sections.reduce(
        (sum, section) => sum + section.items.length,
        0,
      );

      expect(result.metadata.totalItems).toBe(actualTotal);
    });

    it('should estimate completion time', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
      });

      expect(result.metadata.estimatedCompletionTime).toBeDefined();
      expect(result.metadata.estimatedCompletionTime).toBeGreaterThan(0);
    });

    it('should calculate theme coverage', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
      });

      expect(result.metadata.themeCoverage).toBeDefined();
      expect(result.metadata.themeCoverage).toBeGreaterThanOrEqual(0);
      expect(result.metadata.themeCoverage).toBeLessThanOrEqual(100);
    });

    it('should link items to theme provenance', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
      });

      const mainSection = result.sections.find((s) => s.id === 'main_items');
      expect(mainSection).toBeDefined();

      mainSection?.items.forEach((item) => {
        expect(Array.isArray(item.themeProvenance)).toBe(true);
      });
    });

    it('should include methodology information', async () => {
      const result = await service.generateCompleteSurvey({
        themes: mockThemes,
        surveyPurpose: 'exploratory',
      });

      expect(result.methodology).toBeDefined();
      expect(result.methodology.approach).toBeDefined();
      expect(result.methodology.researchBacking).toBeDefined();
      expect(result.methodology.validation).toBeDefined();
    });

    it('should vary item count by complexity level', async () => {
      const basicResult = await service.generateCompleteSurvey({
        themes: [mockThemes[0]],
        surveyPurpose: 'exploratory',
        complexityLevel: 'basic',
        includeDemographics: false,
        includeValidityChecks: false,
      });

      const advancedResult = await service.generateCompleteSurvey({
        themes: [mockThemes[0]],
        surveyPurpose: 'exploratory',
        complexityLevel: 'advanced',
        includeDemographics: false,
        includeValidityChecks: false,
      });

      expect(advancedResult.metadata.totalItems).toBeGreaterThan(
        basicResult.metadata.totalItems,
      );
    });
  });

  // ==================== EDGE CASES AND ERROR HANDLING ====================

  describe('Edge Cases', () => {
    it('should handle empty themes array gracefully', async () => {
      const result = await service.suggestResearchQuestions({
        themes: [],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle themes with minimal metadata', async () => {
      const minimalTheme: Theme = {
        id: 'minimal',
        name: 'Test Theme',
        description: 'Basic description',
        prevalence: 0.5,
        confidence: 0.5,
        sources: [],
      };

      const result = await service.suggestResearchQuestions({
        themes: [minimalTheme],
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very large theme sets', async () => {
      const manyThemes: Theme[] = Array.from({ length: 50 }, (_, i) => ({
        id: `theme${i}`,
        name: `Theme ${i}`,
        description: `Description for theme ${i}`,
        prevalence: Math.random(),
        confidence: Math.random(),
        sources: [],
      }));

      const result = await service.suggestResearchQuestions({
        themes: manyThemes,
        maxQuestions: 15,
      });

      expect(result.length).toBeLessThanOrEqual(15);
    });
  });
});
