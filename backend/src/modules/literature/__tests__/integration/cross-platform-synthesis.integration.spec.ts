/**
 * Cross-Platform Synthesis Integration Tests
 *
 * Phase 9 Day 22 Implementation
 *
 * Tests the complete cross-platform synthesis workflow:
 * 1. Multi-platform synthesis endpoint
 * 2. Emerging topics detection
 * 3. Theme dissemination tracking
 * 4. Platform-specific insights
 *
 * @enterprise Testing Standards:
 * - End-to-end workflow validation
 * - Real service integration (not mocked)
 * - Performance benchmarks
 * - Error handling scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LiteratureModule } from '../../literature.module';
import { PrismaModule } from '../../../../common/prisma.module';
import { AIModule } from '../../../ai/ai.module';
import { AuthModule } from '../../../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

describe('Cross-Platform Synthesis Integration Tests (Phase 9 Day 22)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        LiteratureModule,
        PrismaModule,
        AIModule,
        AuthModule,
        HttpModule,
        CacheModule.register(),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for authenticated requests
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    authToken = loginResponse.body.access_token || 'mock-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /literature/synthesis/multi-platform', () => {
    it('should synthesize research across all platforms', async () => {
      const response = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'climate change adaptation',
          maxResults: 5,
          includeTranscripts: false,
          timeWindow: 30,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('climate change adaptation');
      expect(response.body.sources).toBeDefined();
      expect(Array.isArray(response.body.sources)).toBe(true);
      expect(response.body.themeClusters).toBeDefined();
      expect(Array.isArray(response.body.themeClusters)).toBe(true);
      expect(response.body.disseminationPaths).toBeDefined();
      expect(response.body.emergingTopics).toBeDefined();
      expect(response.body.platformInsights).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.totalSources).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty results gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'xyzabc123nonexistent',
          maxResults: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sources).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing query
          maxResults: 5,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should enforce maxResults limits', async () => {
      const response = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'climate change',
          maxResults: 100, // Exceeds limit
        })
        .expect(400);

      expect(response.body.message).toContain('maxResults');
    });

    it('should complete synthesis within performance budget', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'machine learning',
          maxResults: 10,
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete in <30 seconds
    });
  });

  describe('GET /literature/synthesis/emerging-topics', () => {
    it('should identify emerging topics', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/emerging-topics')
        .query({ query: 'artificial intelligence', timeWindow: 30 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('artificial intelligence');
      expect(response.body.emergingTopics).toBeDefined();
      expect(Array.isArray(response.body.emergingTopics)).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should detect potential research gaps', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/emerging-topics')
        .query({ query: 'quantum computing', timeWindow: 90 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary.withPotentialGaps).toBeGreaterThanOrEqual(0);

      const gapTopics = response.body.emergingTopics.filter(
        (topic: any) => topic.potentialGap,
      );

      gapTopics.forEach((topic: any) => {
        expect(topic.topic).toBeDefined();
        expect(topic.recommendation).toBeDefined();
        expect(topic.trendScore).toBeGreaterThanOrEqual(0);
        expect(topic.trendScore).toBeLessThanOrEqual(1);
      });
    });

    it('should require query parameter', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/emerging-topics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /literature/synthesis/dissemination/:theme', () => {
    it('should track theme dissemination path', async () => {
      // First, get a theme from synthesis
      const synthesisResponse = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'renewable energy',
          maxResults: 10,
        });

      const theme =
        synthesisResponse.body.disseminationPaths?.[0]?.theme || 'solar power';

      const response = await request(app.getHttpServer())
        .get(`/literature/synthesis/dissemination/${encodeURIComponent(theme)}`)
        .query({ query: 'renewable energy', timeWindow: 90 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.success) {
        expect(response.body.disseminationPath).toBeDefined();
        expect(response.body.disseminationPath.theme).toBeDefined();
        expect(response.body.disseminationPath.timeline).toBeDefined();
        expect(response.body.analytics).toBeDefined();
        expect(response.body.analytics.totalReach).toBeGreaterThanOrEqual(0);
        expect(response.body.analytics.platforms).toBeDefined();
        expect(Array.isArray(response.body.analytics.platforms)).toBe(true);
      } else {
        expect(response.body.availableThemes).toBeDefined();
      }
    });

    it('should handle non-existent themes gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/dissemination/nonexistent-theme-xyz')
        .query({ query: 'test', timeWindow: 30 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No dissemination path found');
      expect(response.body.availableThemes).toBeDefined();
    });

    it('should require query parameter', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/dissemination/test-theme')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /literature/synthesis/platform-insights', () => {
    it('should provide platform-specific insights', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .query({ query: 'data science' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('data science');
      expect(response.body.platformInsights).toBeDefined();
      expect(Array.isArray(response.body.platformInsights)).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalPlatforms).toBeGreaterThanOrEqual(0);
    });

    it('should filter by specific platforms', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .query({ query: 'blockchain', platforms: 'paper,youtube' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.platformInsights).toBeDefined();

      const platforms = response.body.platformInsights.map(
        (insight: any) => insight.platform,
      );

      platforms.forEach((platform: string) => {
        expect(['paper', 'youtube']).toContain(platform);
      });
    });

    it('should calculate engagement metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .query({ query: 'machine learning' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary.avgEngagement).toBeGreaterThanOrEqual(0);

      response.body.platformInsights.forEach((insight: any) => {
        expect(insight.platform).toBeDefined();
        expect(insight.sourceCount).toBeGreaterThanOrEqual(0);
        expect(insight.averageEngagement).toBeGreaterThanOrEqual(0);
        expect(insight.topThemes).toBeDefined();
        expect(Array.isArray(insight.topThemes)).toBe(true);
      });
    });

    it('should require query parameter', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full synthesis workflow', async () => {
      const query = 'sustainable agriculture';

      // Step 1: Multi-platform synthesis
      const synthesisResponse = await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query, maxResults: 10, timeWindow: 60 })
        .expect(200);

      expect(synthesisResponse.body.success).toBe(true);

      // Step 2: Get emerging topics
      const emergingResponse = await request(app.getHttpServer())
        .get('/literature/synthesis/emerging-topics')
        .query({ query, timeWindow: 60 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(emergingResponse.body.success).toBe(true);

      // Step 3: Get platform insights
      const insightsResponse = await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .query({ query })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(insightsResponse.body.success).toBe(true);

      // Verify data consistency
      const totalSourcesFromSynthesis =
        synthesisResponse.body.metadata?.totalSources || 0;
      const totalSourcesFromInsights =
        insightsResponse.body.summary?.totalSources || 0;

      // Sources should match or be close (slight variation acceptable due to caching)
      expect(Math.abs(totalSourcesFromSynthesis - totalSourcesFromInsights)).toBeLessThan(
        5,
      );
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for synthesis', async () => {
      await request(app.getHttpServer())
        .post('/literature/synthesis/multi-platform')
        .send({ query: 'test' })
        .expect(401);
    });

    it('should require authentication for emerging topics', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/emerging-topics')
        .query({ query: 'test' })
        .expect(401);
    });

    it('should require authentication for dissemination', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/dissemination/test')
        .query({ query: 'test' })
        .expect(401);
    });

    it('should require authentication for platform insights', async () => {
      await request(app.getHttpServer())
        .get('/literature/synthesis/platform-insights')
        .query({ query: 'test' })
        .expect(401);
    });
  });
});
