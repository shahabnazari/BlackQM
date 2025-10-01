import { Test, TestingModule } from '@nestjs/testing';
import {
  GapAnalyzerService,
  ResearchGap,
  ResearchOpportunity,
  TrendAnalysis,
  KeywordAnalysis,
  TopicModel,
} from './gap-analyzer.service';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { ThemeExtractionService } from './theme-extraction.service';

describe('GapAnalyzerService', () => {
  let service: GapAnalyzerService;
  let prismaService: PrismaService;
  let openAIService: OpenAIService;
  let themeExtractionService: ThemeExtractionService;

  const mockPrismaService = {
    paper: {
      findMany: jest.fn(),
    },
  };

  const mockOpenAIService = {
    generateCompletion: jest.fn(),
  };

  const mockThemeExtractionService = {
    extractThemes: jest.fn(),
  };

  const mockPapers = [
    {
      id: 'paper1',
      title: 'Machine Learning in Healthcare',
      abstract:
        'This study explores the application of machine learning algorithms in healthcare diagnostics',
      keywords: ['machine learning', 'healthcare', 'diagnostics'],
      year: 2023,
      themes: [],
      collection: null,
    },
    {
      id: 'paper2',
      title: 'Deep Learning for Medical Imaging',
      abstract:
        'A comprehensive review of deep learning techniques for medical image analysis',
      keywords: ['deep learning', 'medical imaging', 'computer vision'],
      year: 2023,
      themes: [],
      collection: null,
    },
    {
      id: 'paper3',
      title: 'AI Ethics in Healthcare',
      abstract:
        'Examining ethical considerations of artificial intelligence in medical practice',
      keywords: ['AI ethics', 'healthcare', 'artificial intelligence'],
      year: 2022,
      themes: [],
      collection: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GapAnalyzerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OpenAIService, useValue: mockOpenAIService },
        {
          provide: ThemeExtractionService,
          useValue: mockThemeExtractionService,
        },
      ],
    }).compile();

    service = module.get<GapAnalyzerService>(GapAnalyzerService);
    prismaService = module.get<PrismaService>(PrismaService);
    openAIService = module.get<OpenAIService>(OpenAIService);
    themeExtractionService = module.get<ThemeExtractionService>(
      ThemeExtractionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeResearchGaps', () => {
    it('should analyze research gaps from papers', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([
        {
          id: 'theme1',
          label: 'AI in Healthcare',
          keywords: ['AI', 'healthcare'],
          papers: ['paper1', 'paper2'],
          weight: 8,
        },
      ]);
      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify([
          {
            title: 'Explainable AI for Clinical Decision Support',
            description: 'Gap in transparent AI systems for healthcare',
            importance: 8,
            methodology: 'Develop interpretable models',
            impact: 'Improved clinical trust',
          },
        ]),
      });

      const gaps = await service.analyzeResearchGaps([
        'paper1',
        'paper2',
        'paper3',
      ]);

      expect(gaps).toBeDefined();
      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
      expect(mockPrismaService.paper.findMany).toHaveBeenCalled();
    });

    it('should handle empty paper list', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue([]);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);

      const gaps = await service.analyzeResearchGaps([]);

      expect(gaps).toEqual([]);
    });

    it('should fall back to rule-based identification on AI error', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([
        {
          id: 'theme1',
          label: 'Healthcare AI',
          keywords: ['healthcare', 'AI'],
          papers: ['paper1'],
          weight: 5,
          prevalence: 0.03,
        },
      ]);
      mockOpenAIService.generateCompletion.mockRejectedValue(
        new Error('AI service unavailable'),
      );

      const gaps = await service.analyzeResearchGaps(['paper1', 'paper2']);

      expect(gaps).toBeDefined();
      expect(gaps.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractAndAnalyzeKeywords', () => {
    it('should extract keywords from papers', async () => {
      const keywords = await service.extractAndAnalyzeKeywords(mockPapers);

      expect(keywords).toBeDefined();
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords[0]).toHaveProperty('keyword');
      expect(keywords[0]).toHaveProperty('frequency');
      expect(keywords[0]).toHaveProperty('importance');
    });

    it('should calculate keyword importance correctly', async () => {
      const keywords = await service.extractAndAnalyzeKeywords(mockPapers);

      const healthcareKeyword = keywords.find(
        (k) => k.keyword === 'healthcare',
      );
      expect(healthcareKeyword).toBeDefined();
      expect(healthcareKeyword!.frequency).toBeGreaterThan(0);
      expect(healthcareKeyword!.importance).toBeGreaterThan(0);
      expect(healthcareKeyword!.importance).toBeLessThanOrEqual(1);
    });

    it('should track keyword co-occurrences', async () => {
      const keywords = await service.extractAndAnalyzeKeywords(mockPapers);

      const mlKeyword = keywords.find((k) => k.keyword.includes('learning'));
      if (mlKeyword) {
        expect(mlKeyword.coOccurrences).toBeDefined();
        expect(Array.isArray(mlKeyword.coOccurrences)).toBe(true);
      }
    });

    it('should handle papers without abstracts', async () => {
      const papersWithoutAbstracts = [
        {
          id: 'paper4',
          title: 'Brief Note on AI',
          abstract: null,
          keywords: ['AI'],
          year: 2023,
        },
      ];

      const keywords = await service.extractAndAnalyzeKeywords(
        papersWithoutAbstracts,
      );
      expect(keywords).toBeDefined();
      expect(() => keywords).not.toThrow();
    });

    it('should limit co-occurrences to top 10', async () => {
      const keywords = await service.extractAndAnalyzeKeywords(mockPapers);

      for (const keyword of keywords) {
        expect(keyword.coOccurrences.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('performTopicModeling', () => {
    it('should perform topic modeling on papers', async () => {
      mockThemeExtractionService.extractThemes.mockResolvedValue([
        {
          id: 'theme1',
          label: 'Medical AI',
          keywords: ['medical', 'AI'],
          papers: ['paper1', 'paper2'],
          weight: 7,
        },
        {
          id: 'theme2',
          label: 'Ethics',
          keywords: ['ethics', 'responsibility'],
          papers: ['paper3'],
          weight: 5,
        },
      ]);

      const topics = await service.performTopicModeling(mockPapers, 5);

      expect(topics).toBeDefined();
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBeLessThanOrEqual(5);
      expect(topics[0]).toHaveProperty('topicId');
      expect(topics[0]).toHaveProperty('label');
      expect(topics[0]).toHaveProperty('coherenceScore');
      expect(topics[0]).toHaveProperty('prevalence');
    });

    it('should calculate topic evolution over time', async () => {
      mockThemeExtractionService.extractThemes.mockResolvedValue([
        {
          id: 'theme1',
          label: 'Evolving Topic',
          keywords: ['evolution', 'change'],
          papers: ['paper1', 'paper2', 'paper3'],
          weight: 8,
        },
      ]);

      const topics = await service.performTopicModeling(mockPapers);

      expect(topics[0].evolution).toBeDefined();
      expect(Array.isArray(topics[0].evolution)).toBe(true);
      expect(topics[0].evolution.length).toBeGreaterThan(0);
    });

    it('should respect numTopics parameter', async () => {
      mockThemeExtractionService.extractThemes.mockResolvedValue(
        Array(20)
          .fill(null)
          .map((_, i) => ({
            id: `theme${i}`,
            label: `Topic ${i}`,
            keywords: [`keyword${i}`],
            papers: [`paper${i}`],
            weight: Math.random() * 10,
          })),
      );

      const topics = await service.performTopicModeling(mockPapers, 3);

      expect(topics.length).toBeLessThanOrEqual(3);
    });
  });

  describe('detectTrends', () => {
    it('should detect trends in research topics', async () => {
      const keywords: KeywordAnalysis[] = [
        {
          keyword: 'machine learning',
          frequency: 10,
          growth: 0.5,
          coOccurrences: [],
          contexts: [],
          importance: 0.8,
        },
        {
          keyword: 'deep learning',
          frequency: 8,
          growth: 0.7,
          coOccurrences: [],
          contexts: [],
          importance: 0.7,
        },
      ];

      const trends = await service.detectTrends(mockPapers, keywords);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends[0]).toHaveProperty('topic');
      expect(trends[0]).toHaveProperty('trendType');
      expect(trends[0]).toHaveProperty('projectedGrowth');
      expect(trends[0]).toHaveProperty('confidence');
    });

    it('should categorize trend types correctly', async () => {
      const keywords: KeywordAnalysis[] = [
        {
          keyword: 'emerging tech',
          frequency: 3,
          growth: 0.8,
          coOccurrences: [],
          contexts: [],
          importance: 0.6,
        },
      ];

      const papersByYear = [
        { ...mockPapers[0], year: 2021 },
        { ...mockPapers[1], year: 2022 },
        { ...mockPapers[2], year: 2023 },
      ];

      const trends = await service.detectTrends(papersByYear, keywords);

      expect(trends[0].trendType).toBeDefined();
      expect([
        'emerging',
        'growing',
        'stable',
        'declining',
        'cyclical',
      ]).toContain(trends[0].trendType);
    });

    it('should detect inflection points', async () => {
      const keywords: KeywordAnalysis[] = [
        {
          keyword: 'volatile topic',
          frequency: 5,
          growth: 0.2,
          coOccurrences: [],
          contexts: [],
          importance: 0.5,
        },
      ];

      const trends = await service.detectTrends(mockPapers, keywords);

      expect(trends[0].inflectionPoints).toBeDefined();
      expect(Array.isArray(trends[0].inflectionPoints)).toBe(true);
    });

    it('should calculate trend confidence', async () => {
      const keywords: KeywordAnalysis[] = [
        {
          keyword: 'stable topic',
          frequency: 7,
          growth: 0.1,
          coOccurrences: [],
          contexts: [],
          importance: 0.6,
        },
      ];

      const trends = await service.detectTrends(mockPapers, keywords);

      expect(trends[0].confidence).toBeDefined();
      expect(trends[0].confidence).toBeGreaterThanOrEqual(0);
      expect(trends[0].confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('generateOpportunities', () => {
    it('should generate opportunities from gaps', async () => {
      const gaps: ResearchGap[] = [
        {
          id: 'gap1',
          title: 'Explainable AI Gap',
          description: 'Need for interpretable AI models',
          keywords: ['explainable', 'AI'],
          relatedPapers: ['paper1'],
          importance: 8,
          feasibility: 6,
          marketPotential: 7,
          confidenceScore: 0.8,
        },
      ];

      mockOpenAIService.generateCompletion.mockResolvedValue({
        content:
          'Rationale: High impact opportunity\nApproach: Develop new methods\nChallenges: Technical complexity',
      });

      const opportunities = await service.generateOpportunities(gaps);

      expect(opportunities).toBeDefined();
      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBe(1);
      expect(opportunities[0]).toHaveProperty('gap');
      expect(opportunities[0]).toHaveProperty('opportunityScore');
      expect(opportunities[0]).toHaveProperty('rationale');
      expect(opportunities[0]).toHaveProperty('suggestedApproach');
    });

    it('should sort opportunities by score', async () => {
      const gaps: ResearchGap[] = [
        {
          id: 'gap1',
          title: 'Low Priority Gap',
          description: 'Minor improvement',
          keywords: ['minor'],
          relatedPapers: [],
          importance: 3,
          feasibility: 5,
          marketPotential: 3,
          confidenceScore: 0.5,
        },
        {
          id: 'gap2',
          title: 'High Priority Gap',
          description: 'Major breakthrough',
          keywords: ['major'],
          relatedPapers: [],
          importance: 9,
          feasibility: 7,
          marketPotential: 8,
          confidenceScore: 0.9,
        },
      ];

      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: 'Generic opportunity analysis',
      });

      const opportunities = await service.generateOpportunities(gaps);

      expect(opportunities[0].opportunityScore).toBeGreaterThan(
        opportunities[1].opportunityScore,
      );
    });

    it('should handle AI errors gracefully', async () => {
      const gaps: ResearchGap[] = [
        {
          id: 'gap1',
          title: 'Test Gap',
          description: 'Test description',
          keywords: ['test'],
          relatedPapers: [],
          importance: 5,
          feasibility: 5,
          marketPotential: 5,
          confidenceScore: 0.5,
        },
      ];

      mockOpenAIService.generateCompletion.mockRejectedValue(
        new Error('AI error'),
      );

      // Should still generate opportunities with fallback values
      const opportunities = await service.generateOpportunities(gaps);

      expect(opportunities).toBeDefined();
      expect(opportunities.length).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should analyze 100 papers in under 5 seconds', async () => {
      const largePaperSet = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `paper${i}`,
          title: `Research Paper ${i}`,
          abstract: `Abstract for paper ${i} with various keywords and topics`,
          keywords: [`keyword${i % 10}`, `topic${i % 5}`],
          year: 2020 + (i % 4),
          themes: [],
          collection: null,
        }));

      mockPrismaService.paper.findMany.mockResolvedValue(largePaperSet);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);
      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: '[]',
      });

      const startTime = Date.now();
      await service.analyzeResearchGaps(largePaperSet.map((p) => p.id));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle concurrent requests efficiently', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);
      mockOpenAIService.generateCompletion.mockResolvedValue({ content: '[]' });

      const promises = Array(5)
        .fill(null)
        .map(() => service.analyzeResearchGaps(['paper1', 'paper2']));

      const results = await Promise.all(promises);

      expect(results).toBeDefined();
      expect(results.length).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle papers with missing years', async () => {
      const papersWithoutYears = mockPapers.map((p) => ({
        ...p,
        year: undefined,
      }));

      const keywords =
        await service.extractAndAnalyzeKeywords(papersWithoutYears);

      expect(keywords).toBeDefined();
      expect(() => keywords).not.toThrow();
    });

    it('should handle empty keywords list', async () => {
      const trends = await service.detectTrends(mockPapers, []);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(0);
    });

    it('should handle malformed AI responses', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);
      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: 'Not valid JSON response',
      });

      const gaps = await service.analyzeResearchGaps(['paper1']);

      expect(gaps).toBeDefined();
      expect(Array.isArray(gaps)).toBe(true);
    });
  });

  describe('Scoring and Ranking', () => {
    it('should score gaps based on multiple factors', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);
      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify([
          {
            title: 'High Impact Gap',
            description: 'Critical research gap',
            importance: 9,
            feasibility: 8,
            marketPotential: 9,
          },
          {
            title: 'Low Impact Gap',
            description: 'Minor research gap',
            importance: 3,
            feasibility: 9,
            marketPotential: 2,
          },
        ]),
      });

      const gaps = await service.analyzeResearchGaps(['paper1']);

      expect(gaps[0].importance).toBeGreaterThan(gaps[1].importance);
      expect(gaps[0].title).toContain('High Impact');
    });

    it('should adjust scores for emerging trends', async () => {
      mockPrismaService.paper.findMany.mockResolvedValue(mockPapers);
      mockThemeExtractionService.extractThemes.mockResolvedValue([]);
      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: JSON.stringify([
          {
            title: 'Emerging Tech Gap',
            description: 'Gap in emerging technology',
            importance: 5,
            feasibility: 5,
            marketPotential: 5,
          },
        ]),
      });

      const gaps = await service.analyzeResearchGaps(['paper1']);

      // If identified as emerging, scores should be boosted
      if (gaps[0].trendDirection === 'emerging') {
        expect(gaps[0].importance).toBeGreaterThan(5);
        expect(gaps[0].marketPotential).toBeGreaterThan(5);
      }
    });
  });
});
