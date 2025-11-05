import { Test, TestingModule } from '@nestjs/testing';
import { CrossPlatformSynthesisService } from './cross-platform-synthesis.service';
import { PrismaService } from '@/common/prisma.service';
import { LiteratureService } from '../literature.service';
import { TikTokResearchService } from './tiktok-research.service';
import { InstagramManualService } from './instagram-manual.service';
import { TranscriptionService } from './transcription.service';
import { MultiMediaAnalysisService } from './multimedia-analysis.service';

/**
 * Cross-Platform Synthesis Service Tests
 *
 * Comprehensive test suite for cross-platform knowledge synthesis
 * Tests multi-platform search, theme clustering, dissemination tracking, emerging topics
 *
 * Phase 9 Day 19 Task 3 - Testing
 */

describe('CrossPlatformSynthesisService', () => {
  let service: CrossPlatformSynthesisService;
  let literatureService: LiteratureService;
  let tiktokService: TikTokResearchService;

  const mockPrismaService = {};
  const mockLiteratureService = {
    searchLiterature: jest.fn(),
    searchYouTube: jest.fn(),
  };
  const mockTikTokService = {
    searchTikTokVideos: jest.fn(),
  };
  const mockInstagramService = {};
  const mockTranscriptionService = {};
  const mockMultimediaAnalysisService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrossPlatformSynthesisService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LiteratureService, useValue: mockLiteratureService },
        { provide: TikTokResearchService, useValue: mockTikTokService },
        { provide: InstagramManualService, useValue: mockInstagramService },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        {
          provide: MultiMediaAnalysisService,
          useValue: mockMultimediaAnalysisService,
        },
      ],
    }).compile();

    service = module.get<CrossPlatformSynthesisService>(
      CrossPlatformSynthesisService,
    );
    literatureService = module.get<LiteratureService>(LiteratureService);
    tiktokService = module.get<TikTokResearchService>(TikTokResearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('synthesizeMultiPlatformResearch', () => {
    const mockPapers = [
      {
        papers: [
          {
            id: 'paper1',
            doi: '10.1234/test',
            title: 'Climate Change Research',
            authors: ['Dr. Smith'],
            year: 2023,
            url: 'https://doi.org/10.1234/test',
            citationCount: 100,
          },
        ],
        total: 1,
        page: 1,
      },
    ];

    const mockYouTubeVideos = [
      {
        id: 'video1',
        title: 'Climate Change Explained',
        channelTitle: 'Science Channel',
        publishedAt: '2024-01-01',
        statistics: {
          viewCount: 10000,
          likeCount: 500,
        },
      },
    ];

    const mockTikTokResults = {
      videos: [
        {
          id: 'tiktok1',
          title: 'Climate Tips',
          description: 'Quick climate tips',
          author: 'EcoWarrior',
          publishedAt: new Date('2025-01-01'),
          url: 'https://tiktok.com/video/123',
          views: 5000,
          likes: 200,
          shares: 50,
        },
      ],
      totalResults: 1,
      hasMore: false,
    };

    it('should synthesize research from all platforms', async () => {
      mockLiteratureService.searchLiterature.mockResolvedValue(mockPapers);
      mockLiteratureService.searchYouTube.mockResolvedValue(mockYouTubeVideos);
      mockTikTokService.searchTikTokVideos.mockResolvedValue(mockTikTokResults);

      const result = await service.synthesizeMultiPlatformResearch(
        'climate change',
        {
          maxResults: 10,
        },
      );

      expect(result.query).toBe('climate change');
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.themeClusters).toBeDefined();
      expect(result.disseminationPaths).toBeDefined();
      expect(result.emergingTopics).toBeDefined();
      expect(result.platformInsights).toBeDefined();
    });

    it('should handle platform search failures gracefully', async () => {
      mockLiteratureService.searchLiterature.mockRejectedValue(
        new Error('API Error'),
      );
      mockLiteratureService.searchYouTube.mockResolvedValue(mockYouTubeVideos);
      mockTikTokService.searchTikTokVideos.mockResolvedValue(mockTikTokResults);

      const result =
        await service.synthesizeMultiPlatformResearch('test query');

      expect(result.sources.length).toBe(2); // YouTube + TikTok only
    });
  });

  describe('traceDisseminationPaths', () => {
    const mockSources = [
      {
        type: 'paper' as const,
        id: '1',
        title: 'Academic Paper',
        author: 'Researcher',
        publishedAt: new Date('2023-01-01'),
        url: 'test.com',
        themes: [
          {
            theme: 'Climate Change',
            relevanceScore: 0.9,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.9,
        engagement: { citations: 50 },
      },
      {
        type: 'youtube' as const,
        id: '2',
        title: 'YouTube Video',
        author: 'Educator',
        publishedAt: new Date('2024-01-01'),
        url: 'youtube.com',
        themes: [
          {
            theme: 'Climate Change',
            relevanceScore: 0.8,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.8,
        engagement: { views: 10000 },
      },
      {
        type: 'tiktok' as const,
        id: '3',
        title: 'TikTok Video',
        author: 'Influencer',
        publishedAt: new Date('2025-01-01'),
        url: 'tiktok.com',
        themes: [
          {
            theme: 'Climate Change',
            relevanceScore: 0.7,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.7,
        engagement: { views: 5000, likes: 200 },
      },
    ];

    const mockClusters = [
      {
        theme: 'Climate Change',
        totalSources: 3,
        sources: {
          papers: 1,
          youtube: 1,
          podcasts: 0,
          tiktok: 1,
          instagram: 0,
        },
        averageRelevance: 0.8,
        platformSpecificLanguage: {
          academic: [],
          popularScience: [],
          socialMedia: [],
        },
      },
    ];

    it('should trace dissemination paths over time', async () => {
      const paths = await service.traceDisseminationPaths(
        mockClusters,
        mockSources,
        90,
      );

      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].theme).toBe('Climate Change');
      expect(paths[0].timeline).toHaveLength(3);
      expect(paths[0].disseminationPattern).toBe('academic-first');
    });

    it('should calculate dissemination velocity correctly', async () => {
      const paths = await service.traceDisseminationPaths(
        mockClusters,
        mockSources,
        90,
      );

      expect(paths[0].disseminationVelocity).toBeGreaterThan(0);
    });

    it('should calculate total reach across platforms', async () => {
      const paths = await service.traceDisseminationPaths(
        mockClusters,
        mockSources,
        90,
      );

      expect(paths[0].totalReach).toBeGreaterThan(0);
    });
  });

  describe('identifyEmergingTopics', () => {
    const mockSources = [
      // Social media sources (recent)
      ...Array(15)
        .fill(null)
        .map((_, i) => ({
          type: 'tiktok' as const,
          id: `tiktok${i}`,
          title: 'Sustainable Fashion',
          author: 'Creator',
          publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          url: 'test.com',
          themes: [
            {
              theme: 'Sustainable Fashion',
              relevanceScore: 0.8,
              timestamps: [],
              keywords: [],
              summary: '',
              quotes: [],
            },
          ],
          relevanceScore: 0.8,
        })),
      // Academic sources (few)
      {
        type: 'paper' as const,
        id: 'paper1',
        title: 'Sustainability Paper',
        author: 'Researcher',
        publishedAt: new Date('2023-01-01'),
        url: 'test.com',
        themes: [
          {
            theme: 'Sustainable Fashion',
            relevanceScore: 0.9,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.9,
      },
    ];

    it('should identify emerging topics with high social mentions and low academic coverage', async () => {
      const emergingTopics = await service.identifyEmergingTopics(
        mockSources,
        90,
      );

      expect(emergingTopics.length).toBeGreaterThan(0);
      expect(emergingTopics[0].topic).toContain('sustainable fashion');
      expect(emergingTopics[0].socialMediaMentions).toBeGreaterThanOrEqual(10);
      expect(emergingTopics[0].academicPapers).toBeLessThan(5);
    });

    it('should calculate trend scores correctly', async () => {
      const emergingTopics = await service.identifyEmergingTopics(
        mockSources,
        90,
      );

      expect(emergingTopics[0].trendScore).toBeGreaterThan(0);
      expect(emergingTopics[0].trendScore).toBeLessThanOrEqual(100);
    });

    it('should provide recommendations based on trend score', async () => {
      const emergingTopics = await service.identifyEmergingTopics(
        mockSources,
        90,
      );

      expect(emergingTopics[0].recommendation).toBeDefined();
      expect(emergingTopics[0].recommendation.length).toBeGreaterThan(0);
    });

    it('should identify potential research gaps', async () => {
      const mockGapSources = [
        ...Array(12)
          .fill(null)
          .map((_, i) => ({
            type: 'youtube' as const,
            id: `youtube${i}`,
            title: 'New Topic',
            author: 'Creator',
            publishedAt: new Date(),
            url: 'test.com',
            themes: [
              {
                theme: 'New Topic',
                relevanceScore: 0.8,
                timestamps: [],
                keywords: [],
                summary: '',
                quotes: [],
              },
            ],
            relevanceScore: 0.8,
          })),
      ];

      const emergingTopics = await service.identifyEmergingTopics(
        mockGapSources,
        90,
      );

      expect(emergingTopics[0].potentialGap).toBe(true);
    });
  });

  describe('analyzePlatformDifferences', () => {
    const mockSources = [
      {
        type: 'paper' as const,
        id: '1',
        title: 'Academic Research',
        author: 'Researcher',
        publishedAt: new Date(),
        url: 'test.com',
        themes: [
          {
            theme: 'Machine Learning',
            relevanceScore: 0.9,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
          {
            theme: 'Neural Networks',
            relevanceScore: 0.8,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.9,
        engagement: { citations: 100 },
      },
      {
        type: 'youtube' as const,
        id: '2',
        title: 'ML Tutorial',
        author: 'Educator',
        publishedAt: new Date(),
        url: 'youtube.com',
        themes: [
          {
            theme: 'Machine Learning',
            relevanceScore: 0.7,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.7,
        engagement: { views: 50000, likes: 2000 },
      },
    ];

    const mockClusters = [
      {
        theme: 'Machine Learning',
        totalSources: 2,
        sources: {
          papers: 1,
          youtube: 1,
          podcasts: 0,
          tiktok: 0,
          instagram: 0,
        },
        averageRelevance: 0.8,
        platformSpecificLanguage: {
          academic: [],
          popularScience: [],
          socialMedia: [],
        },
      },
    ];

    it('should analyze platform-specific differences', () => {
      const insights = service.analyzePlatformDifferences(
        mockSources,
        mockClusters,
      );

      expect(insights.length).toBeGreaterThan(0);
      expect(insights.find((i) => i.platform === 'paper')).toBeDefined();
      expect(insights.find((i) => i.platform === 'youtube')).toBeDefined();
    });

    it('should calculate average engagement by platform', () => {
      const insights = service.analyzePlatformDifferences(
        mockSources,
        mockClusters,
      );

      const youtubeInsight = insights.find((i) => i.platform === 'youtube');
      expect(youtubeInsight?.averageEngagement).toBeGreaterThan(0);
    });

    it('should identify top themes per platform', () => {
      const insights = service.analyzePlatformDifferences(
        mockSources,
        mockClusters,
      );

      const paperInsight = insights.find((i) => i.platform === 'paper');
      expect(paperInsight?.topThemes).toContain('Machine Learning');
    });
  });

  describe('buildCrossPlatformGraph', () => {
    const mockSources = [
      {
        type: 'paper' as const,
        id: '1',
        title: 'Source 1',
        author: 'Author',
        publishedAt: new Date(),
        url: 'test.com',
        themes: [
          {
            theme: 'AI',
            relevanceScore: 0.9,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
          {
            theme: 'ML',
            relevanceScore: 0.8,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.9,
      },
      {
        type: 'youtube' as const,
        id: '2',
        title: 'Source 2',
        author: 'Creator',
        publishedAt: new Date(),
        url: 'youtube.com',
        themes: [
          {
            theme: 'AI',
            relevanceScore: 0.7,
            timestamps: [],
            keywords: [],
            summary: '',
            quotes: [],
          },
        ],
        relevanceScore: 0.7,
      },
    ];

    it('should build cross-platform knowledge graph', async () => {
      const graph = await service.buildCrossPlatformGraph(mockSources);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges.length).toBeGreaterThanOrEqual(0);
    });

    it('should connect sources with shared themes', async () => {
      const graph = await service.buildCrossPlatformGraph(mockSources);

      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.edges[0].relationshipType).toBe('shares_themes');
    });

    it('should calculate edge weights based on similarity', async () => {
      const graph = await service.buildCrossPlatformGraph(mockSources);

      if (graph.edges.length > 0) {
        expect(graph.edges[0].weight).toBeGreaterThan(0);
        expect(graph.edges[0].weight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Private Helper Methods', () => {
    it('should determine if themes are similar', () => {
      const similar1 = service['areThemesSimilar'](
        'Climate Change',
        'climate change',
      );
      const similar2 = service['areThemesSimilar'](
        'Climate Change',
        'Global Warming',
      );
      const different = service['areThemesSimilar'](
        'Climate Change',
        'Artificial Intelligence',
      );

      expect(similar1).toBe(true);
      expect(different).toBe(false);
    });

    it('should calculate reach correctly', () => {
      const source = {
        type: 'youtube' as const,
        id: '1',
        title: 'Test',
        author: 'Test',
        publishedAt: new Date(),
        url: 'test.com',
        themes: [],
        relevanceScore: 0.8,
        engagement: { views: 1000, likes: 100, shares: 10 },
      };

      const reach = service['calculateReach'](source);
      expect(reach).toBe(3000); // 1000 views + 100 likes*10 + 10 shares*100
    });

    it('should categorize source types correctly', () => {
      expect(service['categorizeSourceType']('paper')).toBe('academic');
      expect(service['categorizeSourceType']('youtube')).toBe('educational');
      expect(service['categorizeSourceType']('tiktok')).toBe('popular');
    });

    it('should identify dissemination patterns', () => {
      const academicFirst = service['identifyDisseminationPattern']([
        { type: 'academic', platform: 'paper' },
        { type: 'popular', platform: 'tiktok' },
      ]);

      const viralFirst = service['identifyDisseminationPattern']([
        { type: 'popular', platform: 'tiktok' },
        { type: 'academic', platform: 'paper' },
      ]);

      expect(academicFirst).toBe('academic-first');
      expect(viralFirst).toBe('viral-first');
    });
  });
});
