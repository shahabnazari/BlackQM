/**
 * PHASE 9 DAY 13: Social Media Intelligence Integration Tests
 * Tests all 6 social media platforms + sentiment analysis + engagement-weighted synthesis
 *
 * Run: npm test -- social-media.integration.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { LiteratureService } from '../literature.service';
import { PrismaService } from '../../../common/prisma.service';

describe('Phase 9 Day 13: Social Media Intelligence Integration', () => {
  let service: LiteratureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register(),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [LiteratureService, PrismaService],
    }).compile();

    service = module.get<LiteratureService>(LiteratureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('Individual Platform Integration', () => {
    const testQuery = 'Q-methodology research';

    it('should search Twitter/X for research content', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['twitter'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check structure of first result
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'twitter');
      expect(firstResult).toHaveProperty('author');
      expect(firstResult).toHaveProperty('content');
      expect(firstResult).toHaveProperty('engagement');
      expect(firstResult).toHaveProperty('sentiment');
      expect(firstResult).toHaveProperty('weights');
    }, 10000); // 10 second timeout

    it('should search Reddit for academic discussions', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['reddit'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'reddit');
      expect(firstResult).toHaveProperty('subreddit');
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('content');
      expect(firstResult).toHaveProperty('engagement');
      expect(firstResult.engagement).toHaveProperty('upvotes');
      expect(firstResult.engagement).toHaveProperty('comments');
    }, 10000);

    it('should search LinkedIn for professional content', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['linkedin'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'linkedin');
      expect(firstResult).toHaveProperty('authorTitle');
      expect(firstResult).toHaveProperty('organizationName');
    }, 10000);

    it('should search Facebook for group discussions', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['facebook'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'facebook');
      expect(firstResult).toHaveProperty('postType');
    }, 10000);

    it('should search Instagram for visual content', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['instagram'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'instagram');
      expect(firstResult).toHaveProperty('mediaType');
      expect(firstResult).toHaveProperty('hashtags');
    }, 10000);

    it('should search TikTok for trending content', async () => {
      const results = await service.searchSocialMedia(
        testQuery,
        ['tiktok'],
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('platform', 'tiktok');
      expect(firstResult).toHaveProperty('videoViews');
      expect(firstResult).toHaveProperty('trendingScore');
    }, 10000);
  });

  describe('Multi-Platform Search', () => {
    it('should search across all 6 platforms simultaneously', async () => {
      const platforms = [
        'twitter',
        'reddit',
        'linkedin',
        'facebook',
        'instagram',
        'tiktok',
      ];
      const results = await service.searchSocialMedia(
        'qualitative research',
        platforms,
        'test-user',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should have results from multiple platforms
      const platformsFound = new Set(results.map((r) => r.platform));
      expect(platformsFound.size).toBeGreaterThan(1);

      // All results should have required fields
      results.forEach((result) => {
        expect(result).toHaveProperty('platform');
        expect(result).toHaveProperty('sentiment');
        expect(result).toHaveProperty('weights');
      });
    }, 15000);

    it('should handle empty platform array gracefully', async () => {
      const results = await service.searchSocialMedia(
        'test query',
        [],
        'test-user',
      );
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle invalid platform names gracefully', async () => {
      const results = await service.searchSocialMedia(
        'test query',
        ['invalid-platform'],
        'test-user',
      );
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should analyze sentiment for all posts', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      expect(results.length).toBeGreaterThan(0);

      // All results should have sentiment analysis
      results.forEach((result) => {
        expect(result.sentiment).toBeDefined();
        expect(result.sentiment).toHaveProperty('label');
        expect(result.sentiment).toHaveProperty('score');
        expect(result.sentiment).toHaveProperty('confidence');
        expect(['positive', 'negative', 'neutral']).toContain(
          result.sentiment.label,
        );
        expect(result.sentiment.score).toBeGreaterThanOrEqual(-1);
        expect(result.sentiment.score).toBeLessThanOrEqual(1);
      });
    });

    it('should detect positive sentiment correctly', async () => {
      const results = await service.searchSocialMedia(
        'excellent research',
        ['twitter'],
        'test-user',
      );

      const positiveResults = results.filter(
        (r) => r.sentiment?.label === 'positive',
      );
      expect(positiveResults.length).toBeGreaterThan(0);
    });

    it('should calculate sentiment distribution', async () => {
      const results = await service.searchSocialMedia(
        'research methodology',
        ['twitter', 'reddit'],
        'test-user',
      );
      const insights = await service.generateSocialMediaInsights(results);

      expect(insights).toHaveProperty('sentimentDistribution');
      expect(insights.sentimentDistribution).toHaveProperty('positive');
      expect(insights.sentimentDistribution).toHaveProperty('negative');
      expect(insights.sentimentDistribution).toHaveProperty('neutral');
      expect(insights.sentimentDistribution).toHaveProperty(
        'positivePercentage',
      );
      expect(insights.sentimentDistribution).toHaveProperty(
        'negativePercentage',
      );
      expect(insights.sentimentDistribution).toHaveProperty(
        'neutralPercentage',
      );

      // Percentages should sum to 100
      const total =
        insights.sentimentDistribution.positivePercentage +
        insights.sentimentDistribution.negativePercentage +
        insights.sentimentDistribution.neutralPercentage;
      expect(Math.abs(total - 100)).toBeLessThan(0.1); // Allow small floating point error
    });
  });

  describe('Engagement-Weighted Synthesis', () => {
    it('should calculate engagement weights for all posts', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      results.forEach((result) => {
        expect(result.weights).toBeDefined();
        expect(result.weights).toHaveProperty('engagement');
        expect(result.weights).toHaveProperty('credibility');
        expect(result.weights).toHaveProperty('influence');

        // All weights should be between 0 and 1
        expect(result.weights.engagement).toBeGreaterThanOrEqual(0);
        expect(result.weights.engagement).toBeLessThanOrEqual(1);
        expect(result.weights.credibility).toBeGreaterThanOrEqual(0);
        expect(result.weights.credibility).toBeLessThanOrEqual(1);
        expect(result.weights.influence).toBeGreaterThanOrEqual(0);
        expect(result.weights.influence).toBeLessThanOrEqual(1);
      });
    });

    it('should rank results by influence score', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      // Results should be sorted by influence (descending)
      for (let i = 1; i < results.length; i++) {
        const prevInfluence = results[i - 1].weights?.influence || 0;
        const currInfluence = results[i].weights?.influence || 0;
        expect(prevInfluence).toBeGreaterThanOrEqual(currInfluence);
      }
    });

    it('should boost verified accounts in credibility scoring', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'linkedin'],
        'test-user',
      );

      const verifiedResults = results.filter(
        (r) => r.isVerified || r.authorVerified,
      );
      if (verifiedResults.length > 0) {
        // Verified accounts should have higher credibility
        verifiedResults.forEach((result) => {
          expect(result.weights.credibility).toBeGreaterThan(0.5);
        });
      }
    });
  });

  describe('Aggregated Insights', () => {
    it('should generate platform distribution', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit', 'linkedin'],
        'test-user',
      );
      const insights = await service.generateSocialMediaInsights(results);

      expect(insights).toHaveProperty('platformDistribution');
      expect(typeof insights.platformDistribution).toBe('object');
      expect(Object.keys(insights.platformDistribution).length).toBeGreaterThan(
        0,
      );
    });

    it('should identify top influencers', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );
      const insights = await service.generateSocialMediaInsights(results);

      expect(insights).toHaveProperty('topInfluencers');
      expect(Array.isArray(insights.topInfluencers)).toBe(true);
      expect(insights.topInfluencers.length).toBeLessThanOrEqual(10);

      if (insights.topInfluencers.length > 0) {
        insights.topInfluencers.forEach((influencer: any) => {
          expect(influencer).toHaveProperty('author');
          expect(influencer).toHaveProperty('platform');
          expect(influencer).toHaveProperty('influence');
          expect(influencer).toHaveProperty('engagement');
        });
      }
    });

    it('should calculate engagement statistics', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );
      const insights = await service.generateSocialMediaInsights(results);

      expect(insights).toHaveProperty('engagementStats');
      expect(insights.engagementStats).toHaveProperty('total');
      expect(insights.engagementStats).toHaveProperty('average');
      expect(insights.engagementStats).toHaveProperty('median');

      expect(insights.engagementStats.total).toBeGreaterThanOrEqual(0);
      expect(insights.engagementStats.average).toBeGreaterThanOrEqual(0);
      expect(insights.engagementStats.median).toBeGreaterThanOrEqual(0);
    });

    it('should generate time distribution', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );
      const insights = await service.generateSocialMediaInsights(results);

      expect(insights).toHaveProperty('timeDistribution');
      expect(insights.timeDistribution).toHaveProperty('last24h');
      expect(insights.timeDistribution).toHaveProperty('lastWeek');
      expect(insights.timeDistribution).toHaveProperty('lastMonth');
      expect(insights.timeDistribution).toHaveProperty('older');

      const totalPosts =
        insights.timeDistribution.last24h +
        insights.timeDistribution.lastWeek +
        insights.timeDistribution.lastMonth +
        insights.timeDistribution.older;
      expect(totalPosts).toBe(results.length);
    });
  });

  describe('Performance & Error Handling', () => {
    it('should complete search within 10 seconds for 6 platforms', async () => {
      const startTime = Date.now();
      const platforms = [
        'twitter',
        'reddit',
        'linkedin',
        'facebook',
        'instagram',
        'tiktok',
      ];

      await service.searchSocialMedia('research', platforms, 'test-user');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // < 10 seconds
    });

    it('should handle API failures gracefully', async () => {
      // Even if some APIs fail, should return partial results
      const results = await service.searchSocialMedia(
        'test',
        ['twitter', 'reddit'],
        'test-user',
      );
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty query string', async () => {
      const results = await service.searchSocialMedia(
        '',
        ['twitter'],
        'test-user',
      );
      expect(Array.isArray(results)).toBe(true);
    });

    it('should process large result sets efficiently', async () => {
      const platforms = [
        'twitter',
        'reddit',
        'linkedin',
        'facebook',
        'instagram',
        'tiktok',
      ];
      const results = await service.searchSocialMedia(
        'research',
        platforms,
        'test-user',
      );

      // Should handle sentiment analysis for all results quickly
      const startTime = Date.now();
      const insights = await service.generateSocialMediaInsights(results);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // < 2 seconds for insights generation
      expect(insights.totalPosts).toBe(results.length);
    });
  });

  describe('Data Quality & Validation', () => {
    it('should return valid engagement metrics for all posts', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      results.forEach((result) => {
        expect(result.engagement).toBeDefined();
        expect(result.engagement).toHaveProperty('totalScore');
        expect(result.engagement.totalScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include timestamps for all posts', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      results.forEach((result) => {
        expect(result).toHaveProperty('timestamp');
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
      });
    });

    it('should include author information for all posts', async () => {
      const results = await service.searchSocialMedia(
        'research',
        ['twitter', 'reddit'],
        'test-user',
      );

      results.forEach((result) => {
        expect(result).toHaveProperty('author');
        expect(typeof result.author).toBe('string');
        expect(result.author.length).toBeGreaterThan(0);
      });
    });
  });
});
