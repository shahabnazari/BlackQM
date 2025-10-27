import { Test, TestingModule } from '@nestjs/testing';
import { UnifiedThemeExtractionService } from './unified-theme-extraction.service';
import { PrismaService } from '../../../common/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('UnifiedThemeExtractionService', () => {
  let service: UnifiedThemeExtractionService;
  let prisma: PrismaService;

  const mockPrisma = {
    paper: {
      findMany: jest.fn(),
    },
    videoTranscript: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    unifiedTheme: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    themeProvenance: {
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedThemeExtractionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UnifiedThemeExtractionService>(
      UnifiedThemeExtractionService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractThemesFromSource', () => {
    it('should validate input - reject empty source IDs', async () => {
      await expect(
        service.extractThemesFromSource('paper', [], {}),
      ).rejects.toThrow('No source IDs provided');
    });

    it('should validate input - reject too many sources', async () => {
      const tooMany = Array.from({ length: 100 }, (_, i) => `paper-${i}`);
      await expect(
        service.extractThemesFromSource('paper', tooMany, {}),
      ).rejects.toThrow('Too many sources');
    });

    it('should fetch papers correctly', async () => {
      const mockPapers = [
        {
          id: 'paper-1',
          title: 'Climate Change Research',
          abstract: 'Study on climate change adaptation strategies.',
          authors: ['Dr. Smith', 'Dr. Jones'],
          keywords: ['climate', 'adaptation'],
          doi: '10.1234/test',
          year: 2023,
          url: 'https://doi.org/10.1234/test',
        },
      ];

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers);

      // This will fail at AI extraction, but we can verify paper fetching
      try {
        await service.extractThemesFromSource('paper', ['paper-1'], {});
      } catch (error) {
        // Expected to fail at AI extraction in test
      }

      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['paper-1'] } },
      });
    });

    it('should handle empty results gracefully', async () => {
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const result = await service.extractThemesFromSource(
        'paper',
        ['paper-1'],
        {},
      );

      expect(result).toEqual([]);
    });
  });

  describe('getThemeProvenanceReport', () => {
    it('should throw error for non-existent theme', async () => {
      mockPrisma.unifiedTheme.findUnique.mockResolvedValue(null);

      await expect(
        service.getThemeProvenanceReport('non-existent'),
      ).rejects.toThrow('Theme not found');
    });

    it('should return complete provenance report', async () => {
      const mockTheme = {
        id: 'theme-1',
        label: 'Climate Adaptation',
        description: 'Strategies for climate change adaptation',
        keywords: ['adaptation', 'resilience'],
        confidence: 0.85,
        extractionModel: 'gpt-4-turbo-preview',
        sources: [
          {
            sourceType: 'paper',
            sourceTitle: 'Climate Research',
            sourceUrl: 'https://doi.org/10.1234/test',
            influence: 0.7,
          },
          {
            sourceType: 'youtube',
            sourceTitle: 'Climate Talk',
            sourceUrl: 'https://youtube.com/watch?v=abc',
            influence: 0.3,
          },
        ],
        provenance: {
          paperInfluence: 0.7,
          videoInfluence: 0.3,
          podcastInfluence: 0,
          socialInfluence: 0,
          paperCount: 1,
          videoCount: 1,
          podcastCount: 0,
          socialCount: 0,
        },
      };

      mockPrisma.unifiedTheme.findUnique.mockResolvedValue(mockTheme);

      const report = await service.getThemeProvenanceReport('theme-1');

      expect(report).toHaveProperty('theme');
      expect(report).toHaveProperty('sources');
      expect(report).toHaveProperty('statistics');
      expect(report.theme.label).toBe('Climate Adaptation');
      expect(report.statistics.sourceBreakdown.paper).toBe(0.7);
      expect(report.statistics.sourceBreakdown.youtube).toBe(0.3);
      expect(report.statistics.sourceCounts.papers).toBe(1);
      expect(report.statistics.sourceCounts.videos).toBe(1);
    });
  });

  describe('mergeThemesFromSources', () => {
    it('should merge similar themes from different sources', async () => {
      const sources = [
        {
          type: 'paper' as const,
          themes: [
            {
              label: 'Climate Change',
              keywords: ['climate', 'change'],
              weight: 0.8,
              sources: [
                {
                  sourceType: 'paper',
                  sourceId: 'paper-1',
                  sourceTitle: 'Paper 1',
                  influence: 0.5,
                  keywordMatches: 5,
                  excerpts: ['Climate change is real'],
                },
              ],
            },
          ],
          sourceIds: ['paper-1'],
        },
        {
          type: 'youtube' as const,
          themes: [
            {
              label: 'Climate Change',
              keywords: ['climate', 'warming'],
              weight: 0.7,
              sources: [
                {
                  sourceType: 'youtube',
                  sourceId: 'video-1',
                  sourceTitle: 'Video 1',
                  influence: 0.4,
                  keywordMatches: 4,
                  excerpts: ['Global warming discussion'],
                },
              ],
            },
          ],
          sourceIds: ['video-1'],
        },
      ];

      const merged = await service.mergeThemesFromSources(sources);

      expect(merged).toHaveLength(1);
      expect(merged[0].label).toBe('Climate Change');
      expect(merged[0].sources).toHaveLength(2);
      expect(merged[0].keywords).toContain('climate');
      expect(merged[0].keywords).toContain('change');
      expect(merged[0].keywords).toContain('warming');
    });

    it('should keep separate themes when not similar', async () => {
      const sources = [
        {
          type: 'paper' as const,
          themes: [
            {
              label: 'Climate Change',
              keywords: ['climate'],
              weight: 0.8,
              sources: [],
            },
            {
              label: 'Artificial Intelligence',
              keywords: ['AI', 'ML'],
              weight: 0.7,
              sources: [],
            },
          ],
          sourceIds: ['paper-1'],
        },
      ];

      const merged = await service.mergeThemesFromSources(sources);

      expect(merged).toHaveLength(2);
      expect(merged.map((t) => t.label)).toContain('Climate Change');
      expect(merged.map((t) => t.label)).toContain('Artificial Intelligence');
    });
  });

  describe('calculateSourceInfluence', () => {
    it('should calculate influence based on keyword matches', () => {
      // Access private method through service instance
      const keywords = ['climate', 'change', 'adaptation'];
      const content =
        'Climate change is real. Adaptation strategies are crucial. Climate resilience matters.';

      // @ts-ignore - Testing private method
      const influence = service.calculateSourceInfluence(keywords, content);

      expect(influence).toBeGreaterThan(0);
      expect(influence).toBeLessThanOrEqual(1);
    });

    it('should return 0 influence for no keyword matches', () => {
      const keywords = ['quantum', 'physics'];
      const content = 'This is about climate change.';

      // @ts-ignore - Testing private method
      const influence = service.calculateSourceInfluence(keywords, content);

      expect(influence).toBe(0);
    });

    it('should normalize influence scores correctly', () => {
      const keywords = ['test'];
      const content = 'test '.repeat(50); // Very high keyword density

      // @ts-ignore - Testing private method
      const influence = service.calculateSourceInfluence(keywords, content);

      expect(influence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('countKeywordMatches', () => {
    it('should count keyword matches accurately', () => {
      const keywords = ['climate', 'change', 'warming'];
      const content = 'Climate change and global warming are related.';

      // @ts-ignore - Testing private method
      const count = service.countKeywordMatches(keywords, content);

      expect(count).toBe(3);
    });

    it('should be case insensitive', () => {
      const keywords = ['Climate', 'CHANGE'];
      const content = 'climate change is real';

      // @ts-ignore - Testing private method
      const count = service.countKeywordMatches(keywords, content);

      expect(count).toBe(2);
    });
  });

  describe('extractRelevantExcerpts', () => {
    it('should extract sentences containing keywords', () => {
      const keywords = ['climate', 'adaptation'];
      const content =
        'Climate change is happening. We need adaptation strategies. This is important.';

      // @ts-ignore - Testing private method
      const excerpts = service.extractRelevantExcerpts(keywords, content);

      expect(excerpts.length).toBeGreaterThan(0);
      expect(excerpts.length).toBeLessThanOrEqual(3);
      expect(excerpts.some((e) => e.includes('Climate'))).toBe(true);
    });

    it('should limit number of excerpts', () => {
      const keywords = ['test'];
      const content = Array.from(
        { length: 10 },
        (_, i) => `Test sentence ${i}.`,
      ).join(' ');

      // @ts-ignore - Testing private method
      const excerpts = service.extractRelevantExcerpts(keywords, content, 3);

      expect(excerpts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('findRelevantTimestamps', () => {
    it('should find timestamps where keywords appear', () => {
      const keywords = ['climate', 'change'];
      const segments = [
        { timestamp: 0, text: 'Introduction to the topic' },
        { timestamp: 30, text: 'Climate change is a serious issue' },
        { timestamp: 60, text: 'We discuss mitigation strategies' },
        { timestamp: 90, text: 'Climate adaptation is crucial' },
      ];

      // @ts-ignore - Testing private method
      const timestamps = service.findRelevantTimestamps(keywords, segments);

      expect(timestamps.length).toBe(2);
      expect(timestamps[0].start).toBe(30);
      expect(timestamps[1].start).toBe(90);
    });

    it('should handle empty segments', () => {
      const keywords = ['test'];
      const segments: any[] = [];

      // @ts-ignore - Testing private method
      const timestamps = service.findRelevantTimestamps(keywords, segments);

      expect(timestamps).toEqual([]);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      // @ts-ignore - Testing private method
      const similarity = service.calculateSimilarity(
        'climate change',
        'climate change',
      );

      expect(similarity).toBe(1.0);
    });

    it('should return >= 0.5 for similar strings with 50% word overlap', () => {
      // @ts-ignore - Testing private method
      const similarity = service.calculateSimilarity(
        'climate change adaptation',
        'climate change mitigation',
      );

      // Jaccard index: intersection {climate, change} = 2, union = 4, so 2/4 = 0.5
      expect(similarity).toBeGreaterThanOrEqual(0.5);
    });

    it('should return low similarity for different strings', () => {
      // @ts-ignore - Testing private method
      const similarity = service.calculateSimilarity(
        'climate change',
        'artificial intelligence',
      );

      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle empty strings', () => {
      // @ts-ignore - Testing private method
      const similarity = service.calculateSimilarity('', '');

      expect(similarity).toBe(0);
    });
  });

  describe('findSimilarTheme', () => {
    it('should find similar theme above threshold', () => {
      // Need >70% similarity (threshold = 0.7) to match
      // 'Climate Change Adaptation Strategies' vs 'Climate Change Adaptation Methods'
      // Intersection: {climate, change, adaptation} = 3, Union: 5 words, similarity = 0.6
      // Better: use identical words with one extra
      const label = 'Climate Change Adaptation Strategies';
      const existing = ['Climate Change Adaptation', 'Artificial Intelligence'];

      // @ts-ignore - Testing private method
      const similar = service.findSimilarTheme(label, existing);

      // 3/4 = 0.75 > 0.7 threshold
      expect(similar).toBe('Climate Change Adaptation');
    });

    it('should return null when no similar theme found', () => {
      const label = 'Climate Change';
      const existing = ['Artificial Intelligence', 'Quantum Computing'];

      // @ts-ignore - Testing private method
      const similar = service.findSimilarTheme(label, existing);

      expect(similar).toBeNull();
    });

    it('should return null for empty existing labels', () => {
      const label = 'Climate Change';
      const existing: string[] = [];

      // @ts-ignore - Testing private method
      const similar = service.findSimilarTheme(label, existing);

      expect(similar).toBeNull();
    });
  });

  describe('buildCitationChain', () => {
    it('should build citation chain with DOIs', () => {
      const sources = [
        {
          doi: '10.1234/test1',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Paper 1',
        },
        {
          doi: '10.1234/test2',
          sourceUrl: 'https://example.com/2',
          sourceTitle: 'Paper 2',
        },
      ];

      // @ts-ignore - Testing private method
      const chain = service.buildCitationChain(sources);

      expect(chain.length).toBe(2);
      expect(chain[0]).toBe('DOI: 10.1234/test1');
      expect(chain[1]).toBe('DOI: 10.1234/test2');
    });

    it('should fall back to URLs when no DOI', () => {
      const sources = [
        { sourceUrl: 'https://youtube.com/watch?v=abc', sourceTitle: 'Video' },
      ];

      // @ts-ignore - Testing private method
      const chain = service.buildCitationChain(sources);

      expect(chain[0]).toBe('https://youtube.com/watch?v=abc');
    });

    it('should limit to 10 sources', () => {
      const sources = Array.from({ length: 20 }, (_, i) => ({
        doi: `10.1234/test${i}`,
        sourceTitle: `Source ${i}`,
      }));

      // @ts-ignore - Testing private method
      const chain = service.buildCitationChain(sources);

      expect(chain.length).toBe(10);
    });
  });

  describe('caching', () => {
    it('should generate consistent cache keys', () => {
      const key1 = (service as any).generateCacheKey('paper', ['id1', 'id2'], {
        researchContext: 'test',
      });
      const key2 = (service as any).generateCacheKey('paper', ['id2', 'id1'], {
        researchContext: 'test',
      });

      // Should be same because source IDs are sorted
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = (service as any).generateCacheKey('paper', ['id1'], {});
      const key2 = (service as any).generateCacheKey('youtube', ['id1'], {});

      expect(key1).not.toBe(key2);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.paper.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        service.extractThemesFromSource('paper', ['paper-1'], {}),
      ).rejects.toThrow('Database error');
    });
  });

  describe('performance', () => {
    it('should handle large number of sources within limits', async () => {
      const sources = Array.from({ length: 50 }, (_, i) => `source-${i}`);
      mockPrisma.paper.findMany.mockResolvedValue([]);

      const result = await service.extractThemesFromSource(
        'paper',
        sources,
        {},
      );

      expect(result).toEqual([]);
      expect(mockPrisma.paper.findMany).toHaveBeenCalled();
    });

    it('should reject excessive sources', async () => {
      const sources = Array.from({ length: 100 }, (_, i) => `source-${i}`);

      await expect(
        service.extractThemesFromSource('paper', sources, {}),
      ).rejects.toThrow('Too many sources');
    });
  });
});
