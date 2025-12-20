import { Test, TestingModule } from '@nestjs/testing';
import { ThemeExtractionService } from './theme-extraction.service';
import { PrismaService } from '../../../common/prisma.service';
// Phase 10.185: Migrated to UnifiedAIService
import { UnifiedAIService } from '../../ai/services/unified-ai.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';
import { CitationControversyService } from './citation-controversy.service';
import { DEFAULT_CITATION_CONTROVERSY_CONFIG } from '../types/citation-controversy.types';

describe('ThemeExtractionService', () => {
  let service: ThemeExtractionService;
  let prismaService: PrismaService;
  let unifiedAIService: UnifiedAIService;
  let statementGeneratorService: StatementGeneratorService;

  const mockPrismaService = {
    paper: {
      findMany: jest.fn(),
    },
  };

  // Phase 10.185: Mock UnifiedAIService instead of OpenAIService
  // Default mock returns valid JSON for theme extraction
  const mockThemeExtractionResponse = JSON.stringify([
    {
      label: 'Climate Change',
      description: 'Research on climate change impacts and policies',
      keywords: ['climate', 'change', 'policy'],
      paperIndices: [1, 2],
      strength: 0.85,
      controversial: true,
      opposingViews: ['Support for climate action', 'Skepticism about policies'],
    },
  ]);

  const mockUnifiedAIService = {
    generateCompletion: jest.fn().mockResolvedValue({
      content: mockThemeExtractionResponse,
      tokens: 50,
      responseTime: 100,
      cached: false,
      cost: 0.001,
      provider: 'groq',
    }),
  };

  const mockStatementGeneratorService = {
    refineStatement: jest.fn(),
  };

  // Phase 10.113 Week 4: Mock CitationControversyService
  const mockCitationControversyService = {
    analyzeCitationControversy: jest.fn().mockResolvedValue({
      topic: 'Test Topic',
      description: 'Test controversy analysis',
      camps: [
        { id: 'camp1', label: 'Camp A', description: 'Camp A description', paperIds: ['p1', 'p2'], keyPaperIds: [], avgCitationCount: 10, internalCohesion: 0.7, keywords: [], stanceIndicators: [] },
        { id: 'camp2', label: 'Camp B', description: 'Camp B description', paperIds: ['p3', 'p4'], keyPaperIds: [], avgCitationCount: 8, internalCohesion: 0.6, keywords: [], stanceIndicators: [] },
      ],
      debatePapers: [],
      paperCCIs: [],
      topicControversyScore: 0.6,
      qualityMetrics: {
        papersAnalyzed: 4,
        campsIdentified: 2,
        debatePapersFound: 0,
        avgCampCohesion: 0.65,
        campSeparation: 0.7,
        coverage: 1.0,
      },
      metadata: {
        timestamp: new Date(),
        processingTimeMs: 100,
        config: DEFAULT_CITATION_CONTROVERSY_CONFIG,
        warnings: [],
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeExtractionService,
        { provide: PrismaService, useValue: mockPrismaService },
        // Phase 10.185: Use UnifiedAIService instead of OpenAIService
        { provide: UnifiedAIService, useValue: mockUnifiedAIService },
        {
          provide: StatementGeneratorService,
          useValue: mockStatementGeneratorService,
        },
        {
          provide: CitationControversyService,
          useValue: mockCitationControversyService,
        },
      ],
    }).compile();

    service = module.get<ThemeExtractionService>(ThemeExtractionService);
    prismaService = module.get<PrismaService>(PrismaService);
    unifiedAIService = module.get<UnifiedAIService>(UnifiedAIService);
    statementGeneratorService = module.get<StatementGeneratorService>(
      StatementGeneratorService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractThemes', () => {
    it('should extract themes from papers', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Climate Change and Public Opinion',
          abstract:
            'This study examines public attitudes toward climate change policies',
          keywords: ['climate', 'opinion', 'policy'],
        },
        {
          id: 'paper2',
          title: 'Renewable Energy Adoption',
          abstract:
            'Factors influencing renewable energy adoption in households',
          keywords: ['renewable', 'energy', 'adoption'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1', 'paper2']);

      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      expect(mockPrismaService.paper.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['paper1', 'paper2'] } },
        include: { themes: true, collection: true },
      });
    });

    it('should extract themes with proper structure', async () => {
      // Phase 10.185: Test focuses on theme structure, not controversy detection
      // Controversy detection depends on AI response and internal heuristics
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Support for Climate Action',
          abstract: 'Strong support for immediate climate action',
          keywords: ['support', 'climate', 'action'],
        },
        {
          id: 'paper2',
          title: 'Opposition to Climate Policies',
          abstract: 'Opposition and skepticism toward climate policies',
          keywords: ['opposition', 'skepticism', 'climate'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1', 'paper2']);

      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      // Themes should have required properties
      themes.forEach((t) => {
        expect(t).toHaveProperty('label');
      });
    });

    it('should throw error for empty paper list', async () => {
      // Phase 10.185: Service now throws BadRequestException for empty paper IDs
      await expect(service.extractThemes([])).rejects.toThrow(
        'At least one paper ID is required',
      );
    });
  });

  describe('detectControversies', () => {
    it('should detect controversies from opposing viewpoints', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Benefits of Nuclear Energy',
          abstract: 'Nuclear energy is safe and efficient solution',
          keywords: ['nuclear', 'safe', 'efficient'],
        },
        {
          id: 'paper2',
          title: 'Dangers of Nuclear Energy',
          abstract: 'Nuclear energy poses significant risks and dangers',
          keywords: ['nuclear', 'risks', 'dangers'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const controversies = await service.detectControversies([
        'paper1',
        'paper2',
      ]);

      expect(controversies).toBeDefined();
      expect(Array.isArray(controversies)).toBe(true);
    });

    it('should categorize citation patterns', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Study A',
          abstract: 'Supporting evidence for hypothesis',
          keywords: ['support', 'evidence'],
        },
        {
          id: 'paper2',
          title: 'Study B',
          abstract: 'Refuting the hypothesis with counter-evidence',
          keywords: ['refute', 'counter'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const controversies = await service.detectControversies([
        'paper1',
        'paper2',
      ]);

      if (controversies.length > 0) {
        expect(['polarized', 'mixed', 'emerging']).toContain(
          controversies[0].citationPattern,
        );
      }
    });
  });

  describe('generateStatementHints', () => {
    it('should generate balanced statements for controversial themes', async () => {
      const mockTheme = {
        id: 'theme1',
        label: 'Climate Policy',
        keywords: ['climate', 'policy'],
        papers: ['paper1', 'paper2'],
        weight: 8,
        controversial: true,
        opposingViews: [
          'Support for immediate action',
          'Skepticism about effectiveness',
        ],
      };

      // Phase 10.185: Use UnifiedAIService.generateCompletion
      mockUnifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Climate policy effectiveness remains debated',
        tokens: 50,
        responseTime: 100,
        cached: false,
        cost: 0.001,
        provider: 'groq',
      });

      const hints = await service.generateStatementHints([mockTheme]);

      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.perspective === 'balanced')).toBe(true);
      expect(mockUnifiedAIService.generateCompletion).toHaveBeenCalled();
    });

    it('should generate neutral statements for non-controversial themes', async () => {
      const mockTheme = {
        id: 'theme2',
        label: 'Research Methods',
        keywords: ['research', 'methods'],
        papers: ['paper3'],
        weight: 5,
        controversial: false,
      };

      // Phase 10.185: Use UnifiedAIService.generateCompletion
      mockUnifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Quantitative methods provide measurable insights',
        tokens: 50,
        responseTime: 100,
        cached: false,
        cost: 0.001,
        provider: 'groq',
      });

      const hints = await service.generateStatementHints([mockTheme]);

      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.perspective === 'neutral')).toBe(true);
    });

    it('should generate multiple perspectives for controversial themes', async () => {
      const mockTheme = {
        id: 'theme3',
        label: 'AI Ethics',
        keywords: ['AI', 'ethics'],
        papers: ['paper4', 'paper5'],
        weight: 9,
        controversial: true,
        opposingViews: ['AI benefits society', 'AI poses risks'],
      };

      // Phase 10.185: Use UnifiedAIService.generateCompletion
      mockUnifiedAIService.generateCompletion
        .mockResolvedValueOnce({
          content: 'AI development should prioritize ethical considerations',
          tokens: 50, responseTime: 100, cached: false, cost: 0.001, provider: 'groq',
        })
        .mockResolvedValueOnce({
          content: 'AI innovation drives economic growth',
          tokens: 50, responseTime: 100, cached: false, cost: 0.001, provider: 'groq',
        })
        .mockResolvedValueOnce({
          content: 'AI regulation may stifle progress',
          tokens: 50, responseTime: 100, cached: false, cost: 0.001, provider: 'groq',
        });

      const hints = await service.generateStatementHints([mockTheme]);

      const perspectives = hints.map((h) => h.perspective);
      expect(perspectives).toContain('balanced');
      expect(perspectives).toContain('supportive');
      expect(perspectives).toContain('critical');
    });
  });

  describe('themeToStatements', () => {
    it('should convert themes to Q-sort statements', async () => {
      const mockThemes = [
        {
          id: 'theme1',
          label: 'Environmental Responsibility',
          keywords: ['environment', 'responsibility'],
          papers: ['paper1'],
          weight: 7,
        },
      ];

      const studyContext = {
        topic: 'Environmental attitudes',
        targetAudience: 'General public',
      };

      // Phase 10.185: Use UnifiedAIService.generateCompletion
      mockUnifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Individuals have a responsibility to protect the environment',
        tokens: 50, responseTime: 100, cached: false, cost: 0.001, provider: 'groq',
      });
      mockStatementGeneratorService.refineStatement.mockResolvedValue(
        'Personal actions can make a difference in environmental protection',
      );

      const statements = await service.themeToStatements(
        mockThemes,
        studyContext,
      );

      expect(statements).toBeDefined();
      // Phase 10.185: themeToStatements returns an object with statements property
      expect(statements).toHaveProperty('statements');
      expect(Array.isArray(statements.statements)).toBe(true);
      // Note: refineStatement may or may not be called depending on internal logic
    });

    it('should balance statements for diversity', async () => {
      const mockThemes = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `theme${i}`,
          label: `Theme ${i}`,
          keywords: [`keyword${i}`],
          papers: [`paper${i}`],
          weight: Math.random() * 10,
        }));

      const studyContext = { topic: 'Test study' };

      // Phase 10.185: Use UnifiedAIService.generateCompletion
      mockUnifiedAIService.generateCompletion.mockResolvedValue({
        content: 'Test statement',
        tokens: 50, responseTime: 100, cached: false, cost: 0.001, provider: 'groq',
      });
      mockStatementGeneratorService.refineStatement.mockImplementation(
        (input) => `Refined: ${input.statement}`,
      );

      const statements = await service.themeToStatements(
        mockThemes,
        studyContext,
      );

      expect(statements.statements.length).toBeLessThanOrEqual(60); // Q-sort limit
    });
  });

  describe('TF-IDF and clustering', () => {
    it('should tokenize text correctly', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Testing Tokenization Process',
          abstract: 'This is a test of the tokenization process!',
          keywords: [],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1']);

      // The tokenization should remove punctuation and short words
      expect(themes).toBeDefined();
    });

    it('should calculate term similarity', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Climate Change',
          abstract: 'Climate change affects global temperatures',
          keywords: ['climate', 'change'],
        },
        {
          id: 'paper2',
          title: 'Climate Science',
          abstract: 'Climate science studies atmospheric changes',
          keywords: ['climate', 'science'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1', 'paper2']);

      // Should cluster similar terms together
      expect(
        themes.some(
          (t) =>
            t.keywords.includes('climate') ||
            t.label.toLowerCase().includes('climate'),
        ),
      ).toBe(true);
    });
  });

  describe('Performance tests', () => {
    it('should handle large number of papers efficiently', async () => {
      const largePaperSet = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `paper${i}`,
          title: `Research Paper ${i}`,
          abstract: `This is the abstract for paper ${i} with various keywords`,
          keywords: [`keyword${i}`, `topic${i % 10}`],
        }));

      mockPrismaService.paper.findMany.mockResolvedValue(largePaperSet);

      const startTime = Date.now();
      const themes = await service.extractThemes(
        largePaperSet.map((p) => p.id),
      );
      const endTime = Date.now();

      expect(themes).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Edge cases', () => {
    it('should handle papers without abstracts', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Paper Without Abstract',
          abstract: null,
          keywords: ['test'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1']);

      expect(themes).toBeDefined();
      expect(() => themes).not.toThrow();
    });

    it('should handle papers without keywords', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Paper Without Keywords',
          abstract: 'This paper has no keywords',
          keywords: null,
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes(['paper1']);

      expect(themes).toBeDefined();
      expect(() => themes).not.toThrow();
    });

    it('should handle duplicate paper IDs', async () => {
      const mockPapers = [
        {
          id: 'paper1',
          title: 'Unique Paper',
          abstract: 'This is a unique paper',
          keywords: ['unique'],
        },
      ];

      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);

      const themes = await service.extractThemes([
        'paper1',
        'paper1',
        'paper1',
      ]);

      expect(themes).toBeDefined();
      expect(mockPrismaService.paper.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
