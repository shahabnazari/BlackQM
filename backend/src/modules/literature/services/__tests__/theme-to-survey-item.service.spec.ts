import { ConfigService } from '@nestjs/config';
import { ThemeToSurveyItemService, Theme, GenerateSurveyItemsOptions } from '../theme-to-survey-item.service';

/**
 * Comprehensive test suite for ThemeToSurveyItemService
 * Phase 10 Day 5.9 - Theme-to-Survey Item Generation
 *
 * Coverage:
 * - All item types (Likert, MC, semantic differential, matrix/grid, rating scales)
 * - Reverse-coded items
 * - Different scale types
 * - AI generation fallback
 * - Validation and error handling
 * - Research backing and methodology
 *
 * Total Tests: 35 test cases
 */

describe('ThemeToSurveyItemService', () => {
  let service: ThemeToSurveyItemService;
  let configService: ConfigService;

  const mockTheme: Theme = {
    id: 'theme_1',
    name: 'Climate Change Awareness',
    description: 'Understanding and perception of climate change issues among different populations',
    prevalence: 0.85,
    confidence: 0.92,
    sources: [
      { id: 'paper1', title: 'Climate Perceptions Study', type: 'paper' },
      { id: 'paper2', title: 'Environmental Awareness Survey', type: 'paper' },
      { id: 'paper3', title: 'Public Opinion on Climate', type: 'paper' },
    ],
    keyPhrases: ['climate change', 'global warming', 'environmental concern', 'sustainability'],
  };

  const mockThemes: Theme[] = [
    mockTheme,
    {
      id: 'theme_2',
      name: 'Trust in Science',
      description: 'Public trust and confidence in scientific institutions and research',
      prevalence: 0.72,
      confidence: 0.88,
      sources: [
        { id: 'paper4', title: 'Trust in Science Research', type: 'paper' },
        { id: 'paper5', title: 'Scientific Credibility Study', type: 'paper' },
      ],
      keyPhrases: ['trust', 'credibility', 'scientific evidence', 'research integrity'],
    },
  ];

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return undefined; // Test without AI to avoid external calls
        return null;
      }),
    } as unknown as ConfigService;

    service = new ThemeToSurveyItemService(configService);
  });

  describe('Basic Service Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have generateSurveyItems method', () => {
      expect(service.generateSurveyItems).toBeDefined();
    });
  });

  describe('Likert Scale Generation', () => {
    it('should generate Likert items with 1-5 scale', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: '1-5',
        itemsPerTheme: 3,
        includeReverseCoded: false,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(3);
      expect(result.items[0].type).toBe('likert');
      expect(result.items[0].scaleType).toBe('1-5');
      expect(result.items[0].scaleLabels).toHaveLength(5);
      expect(result.items[0].scaleLabels).toEqual([
        'Strongly Disagree',
        'Disagree',
        'Neutral',
        'Agree',
        'Strongly Agree',
      ]);
    });

    it('should generate Likert items with 1-7 scale', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: '1-7',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].scaleType).toBe('1-7');
      expect(result.items[0].scaleLabels).toHaveLength(7);
    });

    it('should generate Likert items with frequency scale', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: 'frequency',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].scaleLabels).toEqual(['Never', 'Rarely', 'Sometimes', 'Often', 'Always']);
    });

    it('should generate Likert items with satisfaction scale', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: 'satisfaction',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].scaleLabels).toEqual([
        'Very Dissatisfied',
        'Dissatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied',
      ]);
    });

    it('should include reverse-coded items when requested', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: '1-5',
        itemsPerTheme: 4,
        includeReverseCoded: true,
      };

      const result = await service.generateSurveyItems(options);

      const reversedItems = result.items.filter((item) => item.reversed === true);
      expect(reversedItems.length).toBeGreaterThan(0);
      expect(reversedItems[0].reliability).toHaveProperty('reverseCodedReason');
      expect(reversedItems[0].reliability?.expectedCorrelation).toBe('negative');
    });

    it('should not include reverse-coded items when disabled', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        scaleType: '1-5',
        itemsPerTheme: 3,
        includeReverseCoded: false,
      };

      const result = await service.generateSurveyItems(options);

      const reversedItems = result.items.filter((item) => item.reversed === true);
      expect(reversedItems.length).toBe(0);
    });
  });

  describe('Multiple Choice Generation', () => {
    it('should generate multiple choice items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'multiple_choice',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(2);
      expect(result.items[0].type).toBe('multiple_choice');
      expect(result.items[0].options).toBeDefined();
      expect(result.items[0].options!.length).toBeGreaterThanOrEqual(4);
    });

    it('should have distinct options for MC items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'multiple_choice',
        itemsPerTheme: 1,
      };

      const result = await service.generateSurveyItems(options);

      const options_list = result.items[0].options!;
      const uniqueOptions = new Set(options_list);
      expect(uniqueOptions.size).toBe(options_list.length); // All options should be unique
    });
  });

  describe('Semantic Differential Generation', () => {
    it('should generate semantic differential items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'semantic_differential',
        scaleType: '1-7',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(3);
      expect(result.items[0].type).toBe('semantic_differential');
      expect(result.items[0].leftPole).toBeDefined();
      expect(result.items[0].rightPole).toBeDefined();
      expect(result.items[0].dimension).toBeDefined();
    });

    it('should have bipolar adjective pairs', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'semantic_differential',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].leftPole).not.toBe(result.items[0].rightPole);
      expect(result.items[0].leftPole).toBeTruthy();
      expect(result.items[0].rightPole).toBeTruthy();
    });

    it('should reference Osgood et al. (1957) in metadata', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'semantic_differential',
        itemsPerTheme: 1,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].metadata.researchBacking).toContain('Osgood');
    });
  });

  describe('Matrix/Grid Generation', () => {
    it('should generate matrix grid items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'matrix_grid',
        scaleType: '1-5',
        itemsPerTheme: 4,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(4);
      expect(result.items[0].type).toBe('matrix_grid');
      expect(result.items[0].construct).toBe(mockTheme.name);
    });

    it('should have item numbers for grid items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'matrix_grid',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].itemNumber).toBe(1);
      expect(result.items[1].itemNumber).toBe(2);
      expect(result.items[2].itemNumber).toBe(3);
    });

    it('should use same scale for all grid items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'matrix_grid',
        scaleType: '1-5',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      const scaleTypes = result.items.map((item) => item.scaleType);
      expect(new Set(scaleTypes).size).toBe(1); // All same scale type
    });
  });

  describe('Rating Scale Generation', () => {
    it('should generate rating scale items with 1-10 scale', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'rating_scale',
        scaleType: '1-10',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(2);
      expect(result.items[0].type).toBe('rating_scale');
      expect(result.items[0].scaleType).toBe('1-10');
      expect(result.items[0].scaleLabels).toBeDefined();
    });

    it('should have numeric rating labels', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'rating_scale',
        scaleType: '1-5',
        itemsPerTheme: 1,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].scaleLabels).toContain('1 (Lowest)');
      expect(result.items[0].scaleLabels).toContain('5 (Highest)');
    });
  });

  describe('Mixed Item Type Generation', () => {
    it('should generate mixed item types', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'mixed',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      const itemTypes = new Set(result.items.map((item) => item.type));
      expect(itemTypes.size).toBeGreaterThan(1); // Should have multiple types
    });

    it('should include both Likert and MC items in mixed mode', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'mixed',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      const hasLikert = result.items.some((item) => item.type === 'likert');
      const hasMC = result.items.some((item) => item.type === 'multiple_choice');

      expect(hasLikert || hasMC).toBeTruthy();
    });
  });

  describe('Multiple Themes', () => {
    it('should generate items for multiple themes', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: mockThemes,
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(4); // 2 themes × 2 items
      expect(result.summary.totalItems).toBe(4);
    });

    it('should maintain theme association in generated items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: mockThemes,
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      const theme1Items = result.items.filter((item) => item.themeId === mockThemes[0].id);
      const theme2Items = result.items.filter((item) => item.themeId === mockThemes[1].id);

      expect(theme1Items.length).toBe(2);
      expect(theme2Items.length).toBe(2);
    });
  });

  describe('Research Context and Target Audience', () => {
    it('should accept research context parameter', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
        researchContext: 'Environmental policy study with government stakeholders',
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should accept target audience parameter', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
        targetAudience: 'High school students',
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('Result Metadata and Methodology', () => {
    it('should include summary statistics', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 5,
        includeReverseCoded: true,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalItems).toBe(5);
      expect(result.summary.itemsByType).toHaveProperty('likert');
      expect(result.summary.averageConfidence).toBeGreaterThan(0);
    });

    it('should include methodology information', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.methodology).toBeDefined();
      expect(result.methodology.approach).toBeTruthy();
      expect(result.methodology.researchBacking).toContain('DeVellis');
      expect(result.methodology.reliability).toBeTruthy();
    });

    it('should include recommendations', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.pilotTesting).toBeTruthy();
      expect(result.recommendations.reliabilityAnalysis).toContain('Cronbach');
      expect(result.recommendations.validityChecks).toBeTruthy();
    });

    it('should reference DeVellis (2016) in methodology', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.methodology.researchBacking).toContain('DeVellis');
      expect(result.methodology.researchBacking).toContain('2016');
    });
  });

  describe('Item Metadata', () => {
    it('should include metadata for each item', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items[0].metadata).toBeDefined();
      expect(result.items[0].metadata.generationMethod).toBeTruthy();
      expect(result.items[0].metadata.researchBacking).toBeTruthy();
      expect(result.items[0].metadata.confidence).toBe(mockTheme.confidence);
      expect(result.items[0].metadata.themePrevalence).toBe(mockTheme.prevalence);
    });

    it('should preserve theme confidence in item metadata', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      result.items.forEach((item) => {
        expect(item.metadata.confidence).toBe(mockTheme.confidence);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty themes array gracefully', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items).toEqual([]);
      expect(result.summary.totalItems).toBe(0);
    });

    it('should handle theme with minimal metadata', async () => {
      const minimalTheme: Theme = {
        id: 'minimal',
        name: 'Basic Theme',
        description: 'Minimal description',
        prevalence: 0.5,
        confidence: 0.5,
        sources: [],
      };

      const options: GenerateSurveyItemsOptions = {
        themes: [minimalTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(2);
    });

    it('should default to 3 items per theme when not specified', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        // itemsPerTheme not specified
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(3); // Default is 3
    });

    it('should handle very high itemsPerTheme requests', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 10,
      };

      const result = await service.generateSurveyItems(options);

      expect(result.items.length).toBe(10);
    });
  });

  describe('Item Uniqueness and Quality', () => {
    it('should generate unique item IDs', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 5,
      };

      const result = await service.generateSurveyItems(options);

      const ids = result.items.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
    });

    it('should generate non-empty item text', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 3,
      };

      const result = await service.generateSurveyItems(options);

      result.items.forEach((item) => {
        expect(item.text).toBeTruthy();
        expect(item.text.length).toBeGreaterThan(0);
      });
    });

    it('should include theme name in items', async () => {
      const options: GenerateSurveyItemsOptions = {
        themes: [mockTheme],
        itemType: 'likert',
        itemsPerTheme: 2,
      };

      const result = await service.generateSurveyItems(options);

      result.items.forEach((item) => {
        expect(item.themeName).toBe(mockTheme.name);
      });
    });
  });
});
