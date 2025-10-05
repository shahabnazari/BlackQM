/**
 * Theme to Statement Service Tests
 *
 * Phase 9 - Comprehensive test coverage for theme-based statement generation
 *
 * Test Coverage:
 * - Theme to statement mapping
 * - Multi-perspective statement generation
 * - Controversy pair generation
 * - Confidence scoring
 * - Provenance tracking
 * - Study scaffolding creation
 * - Database persistence
 * - Error handling
 *
 * @group unit
 * @group literature-services
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ThemeToStatementService, StatementWithProvenance, StudyScaffoldingContext } from './theme-to-statement.service';
import { PrismaService } from '../../../common/prisma.service';
import { ThemeExtractionService, ExtractedTheme } from './theme-extraction.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';

describe('ThemeToStatementService', () => {
  let service: ThemeToStatementService;
  let prismaService: jest.Mocked<PrismaService>;
  let themeExtractionService: jest.Mocked<ThemeExtractionService>;
  let statementGeneratorService: jest.Mocked<StatementGeneratorService>;

  const mockExtractedTheme: ExtractedTheme = {
    id: 'theme-123',
    label: 'Climate Change Adaptation',
    description: 'Strategies for adapting to climate change impacts',
    papers: ['paper-1', 'paper-2', 'paper-3'],
    weight: 0.8,
    keywords: ['adaptation', 'resilience', 'climate'],
    controversial: false,
  };

  const mockControversialTheme: ExtractedTheme = {
    id: 'theme-456',
    label: 'Renewable Energy Transition',
    description: 'Debate on renewable vs fossil fuel energy sources',
    papers: ['paper-4', 'paper-5'],
    weight: 0.9,
    keywords: ['renewable', 'fossil fuel', 'energy'],
    controversial: true,
    opposingViews: [
      'Renewable energy is economically viable and necessary',
      'Fossil fuels remain essential for economic stability',
    ],
  };

  const mockGeneratedStatement = {
    text: 'Climate adaptation requires integrated policy approaches',
    rationale: 'Based on research findings',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      survey: {
        update: jest.fn(),
      },
      statement: {
        create: jest.fn(),
      },
      researchPipeline: {
        upsert: jest.fn(),
      },
    };

    const mockThemeExtraction = {
      // Add methods if needed
    };

    const mockStatementGenerator = {
      generateStatements: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeToStatementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ThemeExtractionService,
          useValue: mockThemeExtraction,
        },
        {
          provide: StatementGeneratorService,
          useValue: mockStatementGenerator,
        },
      ],
    }).compile();

    service = module.get<ThemeToStatementService>(ThemeToStatementService);
    prismaService = module.get(PrismaService) as any;
    themeExtractionService = module.get(ThemeExtractionService) as any;
    statementGeneratorService = module.get(StatementGeneratorService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapThemesToStatements', () => {
    it('should generate statements from single theme', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([mockExtractedTheme]);

      expect(result).toHaveLength(1);
      expect(result[0].themeId).toBe('theme-123');
      expect(result[0].themeLabel).toBe('Climate Change Adaptation');
      expect(result[0].statements.length).toBeGreaterThan(0);
    });

    it('should generate perspective-based statements for non-controversial themes', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([mockExtractedTheme]);

      const statements = result[0].statements;

      // Non-controversial themes should only have neutral perspectives
      const neutralStatements = statements.filter(
        (s) => s.perspective === 'neutral'
      );
      expect(neutralStatements.length).toBeGreaterThan(0);
    });

    it('should generate multi-perspective statements for controversial themes', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([
        mockControversialTheme,
      ]);

      const statements = result[0].statements;

      // Controversial themes should have supportive, critical, and balanced perspectives
      const perspectives = new Set(statements.map((s) => s.perspective));
      expect(perspectives.has('supportive')).toBe(true);
      expect(perspectives.has('critical')).toBe(true);
      expect(perspectives.has('balanced')).toBe(true);
    });

    it('should respect target statement count', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements(
        [mockExtractedTheme, mockExtractedTheme],
        { targetStatements: 10 }
      );

      const totalStatements = result.reduce(
        (sum, mapping) => sum + mapping.statements.length,
        0
      );

      // Should generate approximately the target number (may vary due to minimum per theme)
      expect(totalStatements).toBeGreaterThanOrEqual(10);
    });

    it('should adjust to academic level', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      await service.mapThemesToStatements([mockExtractedTheme], {
        academicLevel: 'advanced',
      });

      expect(statementGeneratorService.generateStatements).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          academicLevel: 'advanced',
        })
      );
    });

    it('should assign sequential statement orders', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([
        mockExtractedTheme,
        mockExtractedTheme,
      ]);

      const allStatements = result.flatMap((m) => m.statements);
      const orders = allStatements.map((s) => s.order);

      // Orders should be sequential starting from 1
      expect(orders).toEqual([...Array(orders.length).keys()].map((i) => i + 1));
    });

    it('should ensure minimum statements per theme', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([mockExtractedTheme]);

      // Should have at least 5 statements per theme (or the minimum defined)
      expect(result[0].statements.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('generateControversyPairs', () => {
    it('should generate paired statements for controversial themes', async () => {
      statementGeneratorService.generateStatements
        .mockResolvedValueOnce([
          { text: 'Renewables are cost-effective and sustainable' },
        ])
        .mockResolvedValueOnce([
          { text: 'Fossil fuels ensure energy security and affordability' },
        ]);

      const result = await service['generateControversyPairs'](
        mockControversialTheme
      );

      expect(result).toHaveLength(2);
      expect(result[0].perspective).toBe('supportive');
      expect(result[1].perspective).toBe('critical');
      expect(result[0].generationMethod).toBe('controversy-pair');
      expect(result[1].generationMethod).toBe('controversy-pair');
    });

    it('should include controversy context in provenance', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        { text: 'Test statement' },
      ]);

      const result = await service['generateControversyPairs'](
        mockControversialTheme
      );

      expect(result[0].provenance.controversyContext).toEqual({
        viewpointA: mockControversialTheme.opposingViews![0],
        viewpointB: mockControversialTheme.opposingViews![1],
      });
    });

    it('should return empty array for non-controversial themes', async () => {
      const result = await service['generateControversyPairs'](
        mockExtractedTheme
      );

      expect(result).toEqual([]);
    });

    it('should handle themes with insufficient opposing views', async () => {
      const themeWithOneView: ExtractedTheme = {
        ...mockControversialTheme,
        opposingViews: ['Only one view'],
      };

      const result = await service['generateControversyPairs'](themeWithOneView);

      expect(result).toEqual([]);
    });
  });

  describe('generatePerspectiveStatement', () => {
    it('should generate supportive perspective statement', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service['generatePerspectiveStatement'](
        mockExtractedTheme,
        'supportive',
        'intermediate'
      );

      expect(result.perspective).toBe('supportive');
      expect(result.text).toBeTruthy();
      expect(result.sourceThemeId).toBe(mockExtractedTheme.id);
    });

    it('should generate critical perspective statement', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service['generatePerspectiveStatement'](
        mockExtractedTheme,
        'critical',
        'intermediate'
      );

      expect(result.perspective).toBe('critical');
    });

    it('should avoid bias for neutral and balanced perspectives', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      await service['generatePerspectiveStatement'](
        mockExtractedTheme,
        'neutral',
        'intermediate'
      );

      expect(statementGeneratorService.generateStatements).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          avoidBias: true,
        })
      );
    });

    it('should include complete provenance', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service['generatePerspectiveStatement'](
        mockExtractedTheme,
        'neutral',
        'intermediate'
      );

      expect(result.provenance).toMatchObject({
        sourceDocuments: mockExtractedTheme.papers,
        extractedThemes: [mockExtractedTheme.id],
        citationChain: [],
        generationTimestamp: expect.any(Date),
        aiModel: 'gpt-4-turbo-preview',
      });
    });
  });

  describe('calculateConfidence', () => {
    it('should increase confidence for themes with many papers', async () => {
      const themeWithManyPapers: ExtractedTheme = {
        ...mockExtractedTheme,
        papers: Array(15).fill('paper-id'),
      };

      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service['generatePerspectiveStatement'](
        themeWithManyPapers,
        'neutral',
        'intermediate'
      );

      // More papers should lead to higher confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should adjust confidence for controversial themes', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      // Balanced statements on controversial topics should have slightly higher confidence
      const balancedResult = await service['generatePerspectiveStatement'](
        mockControversialTheme,
        'balanced',
        'intermediate'
      );

      // Partisan statements on controversial topics should have slightly lower confidence
      const supportiveResult = await service['generatePerspectiveStatement'](
        mockControversialTheme,
        'supportive',
        'intermediate'
      );

      expect(balancedResult.confidence).toBeGreaterThan(
        supportiveResult.confidence
      );
    });

    it('should factor in theme weight', async () => {
      const highWeightTheme: ExtractedTheme = {
        ...mockExtractedTheme,
        weight: 0.95,
      };

      const lowWeightTheme: ExtractedTheme = {
        ...mockExtractedTheme,
        weight: 0.3,
      };

      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const highResult = await service['generatePerspectiveStatement'](
        highWeightTheme,
        'neutral',
        'intermediate'
      );

      const lowResult = await service['generatePerspectiveStatement'](
        lowWeightTheme,
        'neutral',
        'intermediate'
      );

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should clamp confidence to 0-1 range', async () => {
      const extremeTheme: ExtractedTheme = {
        ...mockExtractedTheme,
        papers: Array(50).fill('paper-id'),
        weight: 1.0,
      };

      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service['generatePerspectiveStatement'](
        extremeTheme,
        'balanced',
        'intermediate'
      );

      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createStudyScaffolding', () => {
    it('should generate research questions from gaps', async () => {
      const gaps = [
        { topic: 'climate adaptation in urban areas', description: 'Research gap description' },
        { topic: 'renewable energy policy', description: 'Policy gap' },
      ];

      const result = await service.createStudyScaffolding(
        gaps,
        [mockExtractedTheme]
      );

      expect(result.researchQuestions).toHaveLength(2);
      expect(result.researchQuestions![0]).toContain('climate adaptation');
    });

    it('should generate hypotheses from controversial themes', async () => {
      const result = await service.createStudyScaffolding(
        [],
        [mockControversialTheme]
      );

      expect(result.hypotheses).toHaveLength(1);
      expect(result.hypotheses![0]).toContain('polarized perspectives');
    });

    it('should suggest larger grid for controversial topics', async () => {
      const controversialResult = await service.createStudyScaffolding(
        [],
        [mockControversialTheme]
      );

      const nonControversialResult = await service.createStudyScaffolding(
        [],
        [mockExtractedTheme]
      );

      expect(controversialResult.suggestedMethods!.gridSize).toBe(11);
      expect(nonControversialResult.suggestedMethods!.gridSize).toBe(9);
    });

    it('should calculate participant count based on themes', async () => {
      const manyThemes = Array(10).fill(mockExtractedTheme);

      const result = await service.createStudyScaffolding([], manyThemes);

      // 8 participants per theme minimum, 10 themes = 80 participants
      expect(result.suggestedMethods!.participantCount).toBe(80);
    });

    it('should suggest analysis approach based on controversy', async () => {
      const controversialResult = await service.createStudyScaffolding(
        [],
        [mockControversialTheme]
      );

      const nonControversialResult = await service.createStudyScaffolding(
        [],
        [mockExtractedTheme]
      );

      expect(controversialResult.suggestedMethods!.analysisApproach).toBe(
        'varimax-rotation'
      );
      expect(nonControversialResult.suggestedMethods!.analysisApproach).toBe(
        'pca-extraction'
      );
    });
  });

  describe('persistToSurvey', () => {
    it('should persist statement mappings to database', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const mappings = await service.mapThemesToStatements([mockExtractedTheme]);

      await service.persistToSurvey('survey-123', mappings);

      expect(prismaService.survey.update).toHaveBeenCalledWith({
        where: { id: 'survey-123' },
        data: expect.objectContaining({
          basedOnPapersIds: expect.any(String),
          extractedThemeIds: expect.any(String),
        }),
      });
    });

    it('should create statements with provenance', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const mappings = await service.mapThemesToStatements([mockExtractedTheme]);

      await service.persistToSurvey('survey-123', mappings);

      expect(prismaService.statement.create).toHaveBeenCalled();
      const createCalls = (prismaService.statement.create as jest.Mock).mock
        .calls;

      createCalls.forEach((call) => {
        const data = call[0].data;
        expect(data).toMatchObject({
          surveyId: 'survey-123',
          text: expect.any(String),
          order: expect.any(Number),
          sourceThemeId: expect.any(String),
          perspective: expect.any(String),
          generationMethod: expect.any(String),
          confidence: expect.any(Number),
          provenance: expect.any(Object),
        });
      });
    });

    it('should upsert research pipeline', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const mappings = await service.mapThemesToStatements([mockExtractedTheme]);

      await service.persistToSurvey('survey-123', mappings);

      expect(prismaService.researchPipeline.upsert).toHaveBeenCalledWith({
        where: { surveyId: 'survey-123' },
        update: expect.objectContaining({
          generatedStatements: expect.any(String),
          statementProvenance: expect.any(String),
          extractedThemes: expect.any(String),
          selectedPaperIds: expect.any(String),
        }),
        create: expect.objectContaining({
          surveyId: 'survey-123',
          generatedStatements: expect.any(String),
          statementProvenance: expect.any(String),
          extractedThemes: expect.any(String),
          selectedPaperIds: expect.any(String),
        }),
      });
    });
  });

  describe('generateFromThemes', () => {
    it('should generate statements from theme IDs', async () => {
      const result = await service.generateFromThemes(
        ['theme-1', 'theme-2', 'theme-3'],
        {
          topic: 'climate change',
          academicLevel: 'graduate',
          targetStatementCount: 30,
          perspectives: ['supportive', 'critical', 'neutral'],
        },
        'user-123'
      );

      expect(result.statements).toHaveLength(3);
      expect(result.metadata.themesProcessed).toBe(3);
      expect(result.metadata.statementsGenerated).toBe(3);
    });

    it('should distribute perspectives evenly', async () => {
      const result = await service.generateFromThemes(
        ['theme-1', 'theme-2', 'theme-3'],
        {
          topic: 'health',
          academicLevel: 'undergraduate',
          targetStatementCount: 30,
          perspectives: ['supportive', 'critical', 'neutral'],
        },
        'user-123'
      );

      const perspectives = result.statements.map((s) => s.perspective);
      expect(perspectives).toContain('supportive');
      expect(perspectives).toContain('critical');
      expect(perspectives).toContain('neutral');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty theme array', async () => {
      const result = await service.mapThemesToStatements([]);

      expect(result).toEqual([]);
    });

    it('should handle theme without description', async () => {
      const themeWithoutDescription: ExtractedTheme = {
        ...mockExtractedTheme,
        description: undefined,
      };

      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([
        themeWithoutDescription,
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].statements.length).toBeGreaterThan(0);
    });

    it('should handle theme without papers', async () => {
      const themeWithoutPapers: ExtractedTheme = {
        ...mockExtractedTheme,
        papers: [],
      };

      statementGeneratorService.generateStatements.mockResolvedValue([
        mockGeneratedStatement,
      ]);

      const result = await service.mapThemesToStatements([themeWithoutPapers]);

      expect(result[0].statements[0].provenance.sourceDocuments).toEqual([]);
    });

    it('should handle statement generator returning empty array', async () => {
      statementGeneratorService.generateStatements.mockResolvedValue([]);

      const result = await service.mapThemesToStatements([mockExtractedTheme]);

      // Should provide fallback statement
      expect(result[0].statements[0].text).toContain(mockExtractedTheme.label);
    });
  });
});
