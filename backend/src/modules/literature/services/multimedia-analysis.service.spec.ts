import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import {
  MultiMediaAnalysisService,
  ExtractedTheme,
  ExtractedCitation,
} from './multimedia-analysis.service';
import { UnifiedThemeExtractionService } from './unified-theme-extraction.service';

describe('MultiMediaAnalysisService', () => {
  let service: MultiMediaAnalysisService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    videoTranscript: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transcriptTheme: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    multimediaCitation: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-openai-key';
      return null;
    }),
  };

  const mockUnifiedThemeService = {
    extractThemesFromSource: jest.fn(),
    extractFromMultipleSources: jest.fn(),
    getThemeProvenanceReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiMediaAnalysisService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: UnifiedThemeExtractionService,
          useValue: mockUnifiedThemeService,
        },
      ],
    }).compile();

    service = module.get<MultiMediaAnalysisService>(MultiMediaAnalysisService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getThemesForTranscript', () => {
    it('should retrieve themes from database', async () => {
      const mockThemes = [
        {
          theme: 'Climate Change',
          relevanceScore: 0.95,
          timestamps: [{ start: 100, end: 200 }],
          keywords: ['climate', 'change', 'adaptation'],
          summary: 'Discussion about climate change adaptation',
          quotes: [{ timestamp: 150, quote: 'We must adapt...' }],
        },
        {
          theme: 'Sustainability',
          relevanceScore: 0.85,
          timestamps: [{ start: 300, end: 400 }],
          keywords: ['sustainability', 'renewable'],
          summary: 'Sustainability practices',
          quotes: [],
        },
      ];

      mockPrismaService.transcriptTheme.findMany.mockResolvedValue(mockThemes);

      const result = await service.getThemesForTranscript('transcript-123');

      expect(result).toHaveLength(2);
      expect(result[0].theme).toBe('Climate Change');
      expect(result[0].relevanceScore).toBe(0.95);
      expect(result[1].theme).toBe('Sustainability');
      expect(mockPrismaService.transcriptTheme.findMany).toHaveBeenCalledWith({
        where: { transcriptId: 'transcript-123' },
        orderBy: { relevanceScore: 'desc' },
      });
    });

    it('should return empty array if no themes found', async () => {
      mockPrismaService.transcriptTheme.findMany.mockResolvedValue([]);

      const result = await service.getThemesForTranscript('transcript-123');

      expect(result).toEqual([]);
    });
  });

  describe('getCitationsForTranscript', () => {
    it('should retrieve citations from database', async () => {
      const mockCitations = [
        {
          citedWork: 'Smith et al. (2020)',
          citationType: 'citation',
          timestamp: 145,
          context: '...as Smith et al. found...',
          confidence: 0.9,
          parsedCitation: { author: 'Smith', year: 2020 },
        },
        {
          citedWork: 'A recent study',
          citationType: 'mention',
          timestamp: 250,
          context: '...a recent study showed...',
          confidence: 0.6,
          parsedCitation: null,
        },
      ];

      mockPrismaService.multimediaCitation.findMany.mockResolvedValue(
        mockCitations,
      );

      const result = await service.getCitationsForTranscript('transcript-123');

      expect(result).toHaveLength(2);
      expect(result[0].citedWork).toBe('Smith et al. (2020)');
      expect(result[0].citationType).toBe('citation');
      expect(result[0].confidence).toBe(0.9);
      expect(
        mockPrismaService.multimediaCitation.findMany,
      ).toHaveBeenCalledWith({
        where: { transcriptId: 'transcript-123' },
        orderBy: { timestamp: 'asc' },
      });
    });
  });

  describe('calculateGPT4Cost', () => {
    it('should calculate GPT-4 cost correctly', () => {
      // Access private method via type assertion
      const calculateCost = (service as any).calculateGPT4Cost.bind(service);

      const usage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
      };

      // $0.01 per 1K input tokens + $0.03 per 1K output tokens
      // (1000/1000 * 0.01) + (500/1000 * 0.03) = 0.01 + 0.015 = 0.025
      const cost = calculateCost(usage);

      expect(cost).toBeCloseTo(0.025, 4);
    });

    it('should handle zero tokens', () => {
      const calculateCost = (service as any).calculateGPT4Cost.bind(service);

      const usage = {
        prompt_tokens: 0,
        completion_tokens: 0,
      };

      const cost = calculateCost(usage);

      expect(cost).toBe(0);
    });
  });

  describe('findThemeTimestamps', () => {
    it('should find timestamps where keywords appear', () => {
      const findMethod = (service as any).findThemeTimestamps.bind(service);

      const keywords = ['climate', 'adaptation'];
      const segments = [
        { timestamp: 0, text: 'Introduction to the topic' },
        { timestamp: 30, text: 'Climate change is real' },
        { timestamp: 60, text: 'Adaptation strategies needed' },
        { timestamp: 90, text: 'Other unrelated content' },
        { timestamp: 120, text: 'Climate adaptation is crucial' },
      ];

      const result = findMethod(keywords, segments);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ start: 30, end: 60 });
      expect(result[1]).toEqual({ start: 60, end: 90 });
      expect(result[2]).toEqual({ start: 120, end: 120 + 10 }); // Last segment gets +10s
    });

    it('should return empty array if no keywords match', () => {
      const findMethod = (service as any).findThemeTimestamps.bind(service);

      const keywords = ['nonexistent'];
      const segments = [
        { timestamp: 0, text: 'Introduction' },
        { timestamp: 30, text: 'Content' },
      ];

      const result = findMethod(keywords, segments);

      expect(result).toEqual([]);
    });
  });

  describe('extractThemesFromTranscript', () => {
    it('should throw error if transcript not found', async () => {
      mockPrismaService.videoTranscript.findUnique.mockResolvedValue(null);

      await expect(
        service.extractThemesFromTranscript('nonexistent-id', 'test context'),
      ).rejects.toThrow('Transcript not found: nonexistent-id');
    });
  });

  describe('extractCitationsFromTranscript', () => {
    it('should throw error if transcript not found', async () => {
      mockPrismaService.videoTranscript.findUnique.mockResolvedValue(null);

      await expect(
        service.extractCitationsFromTranscript('nonexistent-id'),
      ).rejects.toThrow('Transcript not found: nonexistent-id');
    });
  });
});
