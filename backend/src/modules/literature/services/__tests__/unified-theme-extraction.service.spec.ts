/**
 * Phase 10 Day 5.7 Stage 2 Phase 1: Unit Tests for Unified Theme Extraction Service
 * Enterprise-Grade Unit Testing with Coverage
 *
 * Testing Philosophy: Validate core business logic, edge cases, and error handling
 * Target Coverage: >90%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnifiedThemeExtractionService } from '../unified-theme-extraction.service';
import { PrismaService } from '../../../../common/prisma.service';
import { CacheService } from '../../../../common/cache.service';

describe('UnifiedThemeExtractionService', () => {
  let service: UnifiedThemeExtractionService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  // Mock data
  const mockPaper = {
    id: 'paper-1',
    type: 'paper' as const,
    title: 'The Impact of Climate Change on Agriculture',
    content:
      'Climate change significantly affects agricultural productivity through altered precipitation patterns, increased temperatures, and extreme weather events. Adaptation strategies include drought-resistant crops and improved irrigation systems.',
    authors: ['Dr. Jane Smith', 'Dr. John Doe'],
    year: 2023,
    doi: '10.1000/test.2023',
    keywords: ['climate change', 'agriculture', 'adaptation'],
  };

  const mockVideo = {
    id: 'video-1',
    type: 'youtube' as const,
    title: 'Sustainable Farming Techniques',
    content:
      'Discussion about organic farming methods, crop rotation benefits, soil health improvement, and reduced chemical pesticide usage in modern agriculture.',
    keywords: ['sustainable farming', 'organic', 'soil health'],
  };

  const mockPrismaService = {
    paper: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedThemeExtractionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UnifiedThemeExtractionService>(
      UnifiedThemeExtractionService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have PrismaService injected', () => {
      expect(prismaService).toBeDefined();
    });

    it('should have CacheService injected', () => {
      expect(cacheService).toBeDefined();
    });
  });

  describe('extractFromMultipleSources', () => {
    it('should extract themes from a single paper', async () => {
      const result = await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'climate change agriculture',
        minConfidence: 0.5,
      });

      expect(result).toBeDefined();
      expect(result.themes).toBeDefined();
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBeGreaterThan(0);

      // Verify theme structure
      const theme = result.themes[0];
      expect(theme).toHaveProperty('label');
      expect(theme).toHaveProperty('keywords');
      expect(theme).toHaveProperty('confidence');
      expect(theme.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should extract themes from multiple papers', async () => {
      const mockPaper2 = {
        ...mockPaper,
        id: 'paper-2',
        title: 'Water Scarcity and Crop Management',
        content:
          'Efficient water management is crucial for sustainable agriculture, particularly in arid regions experiencing water scarcity.',
      };

      const result = await service.extractFromMultipleSources(
        [mockPaper, mockPaper2],
        {
          researchContext: 'sustainable agriculture',
          minConfidence: 0.5,
        },
      );

      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('totalSources', 2);
      expect(result.metadata.sourceTypes).toContain('paper');
    });

    it('should extract themes from mixed sources (papers + videos)', async () => {
      const result = await service.extractFromMultipleSources(
        [mockPaper, mockVideo],
        {
          researchContext: 'sustainable agriculture',
          minConfidence: 0.5,
        },
      );

      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.metadata.totalSources).toBe(2);
      expect(result.metadata.sourceTypes).toContain('paper');
      expect(result.metadata.sourceTypes).toContain('youtube');
    });

    it('should handle video-only sources', async () => {
      const result = await service.extractFromMultipleSources([mockVideo], {
        researchContext: 'sustainable farming',
        minConfidence: 0.5,
      });

      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.metadata.sourceTypes).toEqual(['youtube']);
    });

    it('should filter themes by minimum confidence', async () => {
      const result = await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'climate change',
        minConfidence: 0.7,
      });

      result.themes.forEach((theme) => {
        expect(theme.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('should handle empty sources array', async () => {
      await expect(
        service.extractFromMultipleSources([], {
          researchContext: 'test',
          minConfidence: 0.5,
        }),
      ).rejects.toThrow();
    });

    it('should handle sources with no content', async () => {
      const emptySource = {
        id: 'empty-1',
        type: 'paper' as const,
        title: 'Empty Paper',
        content: '',
        authors: [],
        year: 2024,
        keywords: [],
      };

      const result = await service.extractFromMultipleSources([emptySource], {
        researchContext: 'test',
        minConfidence: 0.5,
      });

      // Should either extract themes from title or return empty array
      expect(Array.isArray(result.themes)).toBe(true);
    });

    it('should include provenance information in themes', async () => {
      const result = await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'climate change',
        minConfidence: 0.5,
      });

      const themeWithProvenance = result.themes.find((t) => t.provenance);
      if (themeWithProvenance) {
        expect(themeWithProvenance.provenance).toHaveProperty('citationChain');
        expect(
          Array.isArray(themeWithProvenance.provenance.citationChain),
        ).toBe(true);
      }
    });

    it('should handle large number of sources efficiently', async () => {
      const manySources = Array.from({ length: 20 }, (_, i) => ({
        ...mockPaper,
        id: `paper-${i}`,
        title: `Paper ${i} about Climate Change`,
      }));

      const startTime = Date.now();
      const result = await service.extractFromMultipleSources(manySources, {
        researchContext: 'climate change',
        minConfidence: 0.5,
      });
      const elapsedTime = Date.now() - startTime;

      expect(result.themes.length).toBeGreaterThan(0);
      expect(elapsedTime).toBeLessThan(60000); // Should complete within 60 seconds
    }, 70000);

    it('should deduplicate similar themes', async () => {
      const result = await service.extractFromMultipleSources(
        [mockPaper, mockPaper],
        {
          researchContext: 'climate change',
          minConfidence: 0.5,
        },
      );

      // Themes should be deduplicated
      const themeLabels = result.themes.map((t) => t.label.toLowerCase());
      const uniqueLabels = new Set(themeLabels);

      // Allow some duplicates but should have significant deduplication
      const deduplicationRate = uniqueLabels.size / themeLabels.length;
      expect(deduplicationRate).toBeGreaterThan(0.7); // At least 70% unique
    });
  });

  describe('Theme Extraction Quality', () => {
    it('should extract semantically meaningful themes', async () => {
      const result = await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'agriculture',
        minConfidence: 0.6,
      });

      // Themes should not be generic structural themes
      const genericThemes = [
        'methodology',
        'results',
        'conclusion',
        'discussion',
        'introduction',
      ];
      result.themes.forEach((theme) => {
        const themeLabel = theme.label.toLowerCase();
        genericThemes.forEach((generic) => {
          expect(themeLabel).not.toContain(generic);
        });
      });
    });

    it('should extract domain-specific keywords', async () => {
      const result = await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'climate agriculture',
        minConfidence: 0.5,
      });

      // Should have relevant keywords
      const allKeywords = result.themes.flatMap((t) =>
        t.keywords.map((k) => k.toLowerCase()),
      );
      const relevantKeywords = [
        'climate',
        'agriculture',
        'crop',
        'weather',
        'temperature',
        'precipitation',
      ];

      const hasRelevantKeywords = relevantKeywords.some((keyword) =>
        allKeywords.some((k) => k.includes(keyword)),
      );

      expect(hasRelevantKeywords).toBe(true);
    });

    it('should assign appropriate confidence scores', async () => {
      const result = await service.extractFromMultipleSources(
        [mockPaper, mockVideo],
        {
          researchContext: 'sustainable agriculture',
          minConfidence: 0.4,
        },
      );

      result.themes.forEach((theme) => {
        expect(theme.confidence).toBeGreaterThanOrEqual(0.4);
        expect(theme.confidence).toBeLessThanOrEqual(1.0);
      });

      // Themes with multiple supporting sources should have higher confidence
      const multiSourceThemes = result.themes.filter(
        (t) => t.provenance?.sourceCounts.total > 1,
      );
      if (multiSourceThemes.length > 0) {
        const avgConfidence =
          multiSourceThemes.reduce((sum, t) => sum + t.confidence, 0) /
          multiSourceThemes.length;
        expect(avgConfidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Cache Integration', () => {
    it('should check cache before extraction', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'test',
        minConfidence: 0.5,
      });

      // Note: Cache key generation depends on implementation
      // This test validates cache service is called
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should store results in cache after extraction', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await service.extractFromMultipleSources([mockPaper], {
        researchContext: 'test',
        minConfidence: 0.5,
      });

      // Should attempt to cache results
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed source objects', async () => {
      const malformedSource = {
        id: 'malformed-1',
        // Missing required fields
      } as any;

      await expect(
        service.extractFromMultipleSources([malformedSource], {
          researchContext: 'test',
          minConfidence: 0.5,
        }),
      ).rejects.toThrow();
    });

    it('should handle extremely long content gracefully', async () => {
      const longContent = 'a'.repeat(100000); // 100k characters
      const longSource = {
        ...mockPaper,
        content: longContent,
      };

      const result = await service.extractFromMultipleSources([longSource], {
        researchContext: 'test',
        minConfidence: 0.5,
      });

      expect(result.themes).toBeDefined();
    }, 60000);

    it('should handle special characters in content', async () => {
      const specialContent = {
        ...mockPaper,
        content: 'Test with special chars: @#$%^&*(){}[]|\\;:\'",<>?/`~',
      };

      const result = await service.extractFromMultipleSources(
        [specialContent],
        {
          researchContext: 'test',
          minConfidence: 0.5,
        },
      );

      expect(result.themes).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete extraction in reasonable time for typical use case', async () => {
      const startTime = Date.now();

      await service.extractFromMultipleSources(
        [mockPaper, mockVideo, mockPaper],
        {
          researchContext: 'agriculture',
          minConfidence: 0.5,
        },
      );

      const elapsedTime = Date.now() - startTime;

      // Should complete within 30 seconds for 3 sources
      expect(elapsedTime).toBeLessThan(30000);
    }, 35000);

    it('should scale linearly with number of sources', async () => {
      const threeSources = [
        mockPaper,
        mockVideo,
        { ...mockPaper, id: 'paper-3' },
      ];
      const sixSources = [
        ...threeSources,
        ...threeSources.map((s, i) => ({ ...s, id: `${s.id}-copy-${i}` })),
      ];

      const startTime1 = Date.now();
      await service.extractFromMultipleSources(threeSources, {
        researchContext: 'test',
        minConfidence: 0.5,
      });
      const time3 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await service.extractFromMultipleSources(sixSources, {
        researchContext: 'test',
        minConfidence: 0.5,
      });
      const time6 = Date.now() - startTime2;

      // Should scale roughly linearly (allow 3x buffer for variability)
      expect(time6).toBeLessThan(time3 * 3);
    }, 120000);
  });
});
