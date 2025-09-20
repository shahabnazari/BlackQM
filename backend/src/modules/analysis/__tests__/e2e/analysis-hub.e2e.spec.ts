/**
 * Analysis Hub E2E Tests - Phase 7
 * 
 * Critical path tests for the Analysis Hub functionality
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../../common/prisma.service';

describe('Analysis Hub E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testStudyId: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Create test user and authenticate
    const user = await prisma.user.create({
      data: {
        email: 'hub-test@example.com',
        password: 'hashedpassword',
        name: 'Hub Test User',
        role: 'RESEARCHER',
      },
    });
    testUserId = user.id;

    // Create test study
    const study = await prisma.survey.create({
      data: {
        title: 'Test Study for Hub',
        description: 'E2E test study',
        researcherId: testUserId,
        status: 'ACTIVE',
        config: {},
      },
    });
    testStudyId = study.id;

    // Get auth token (mock for testing)
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.survey.deleteMany({
      where: { researcherId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { email: 'hub-test@example.com' },
    });
    await app.close();
  });

  describe('Hub Data Loading', () => {
    it('should load comprehensive hub data for a study', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('study');
      expect(response.body).toHaveProperty('participants');
      expect(response.body).toHaveProperty('qsorts');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.study.id).toBe(testStudyId);
    });

    it('should return 404 for non-existent study', async () => {
      await request(app.getHttpServer())
        .get('/api/analysis/hub/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}`)
        .expect(401);
    });
  });

  describe('Data Explorer', () => {
    it('should fetch paginated response data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}/responses`)
        .query({ page: 1, limit: 20 })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should filter responses by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}/responses`)
        .query({ status: 'completed' })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should export data in specified format', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/analysis/hub/${testStudyId}/export`)
        .send({ format: 'csv', includeMetadata: true })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Visualization', () => {
    it('should generate correlation heatmap', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/visualization/charts/correlation-heatmap`)
        .send({
          studyId: testStudyId,
          width: 800,
          height: 600,
          format: 'svg',
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.headers['content-type']).toContain('svg');
    });

    it('should cache generated charts', async () => {
      // First request
      const start1 = Date.now();
      await request(app.getHttpServer())
        .post(`/api/visualization/charts/correlation-heatmap`)
        .send({
          studyId: testStudyId,
          width: 800,
          height: 600,
          format: 'svg',
        })
        .set('Authorization', authToken)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .post(`/api/visualization/charts/correlation-heatmap`)
        .send({
          studyId: testStudyId,
          width: 800,
          height: 600,
          format: 'svg',
        })
        .set('Authorization', authToken)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Cached request should be faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });
  });

  describe('AI Insights', () => {
    it('should generate factor narratives', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/analysis/interpretation/${testStudyId}/narratives`)
        .send({
          includeDistinguishing: true,
          includeConsensus: true,
          analysisDepth: 'standard',
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('narratives');
      expect(response.body.narratives).toBeInstanceOf(Array);
    });

    it('should generate recommendations', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/analysis/interpretation/${testStudyId}/recommendations`)
        .send({
          includeActionItems: true,
          prioritize: true,
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should analyze bias', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/analysis/interpretation/${testStudyId}/bias`)
        .send({
          dimensions: ['sampling', 'response', 'cultural'],
          includeRecommendations: true,
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('dimensions');
      expect(response.body).toHaveProperty('overallScore');
    });
  });

  describe('Scheduling', () => {
    let appointmentId: string;

    it('should create an appointment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/scheduling/appointments`)
        .send({
          studyId: testStudyId,
          participantId: 'test-participant-id',
          scheduledStart: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          scheduledEnd: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          type: 'online',
          meetingUrl: 'https://zoom.us/j/123456789',
        })
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      appointmentId = response.body.id;
    });

    it('should schedule reminder for appointment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/scheduling/appointments/${appointmentId}/reminders`)
        .send({
          type: 'email',
          timeBefore: 3600000, // 1 hour before
        })
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('email');
      expect(response.body.status).toBe('pending');
    });

    it('should get recruitment metrics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/scheduling/recruitment/${testStudyId}/metrics`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('totalInvited');
      expect(response.body).toHaveProperty('totalScheduled');
      expect(response.body).toHaveProperty('conversionRate');
      expect(response.body).toHaveProperty('completionRate');
    });
  });

  describe('Collaboration', () => {
    it('should add collaborator to study', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/collaboration/${testStudyId}/collaborators`)
        .send({
          email: 'collaborator@example.com',
          role: 'viewer',
        })
        .set('Authorization', authToken)
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.role).toBe('viewer');
    });

    it('should get activity log', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/collaboration/${testStudyId}/activity`)
        .query({ limit: 50 })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('activities');
      expect(response.body.activities).toBeInstanceOf(Array);
    });
  });

  describe('Report Generation', () => {
    it('should generate report with specified template', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${testStudyId}/generate`)
        .send({
          format: 'pdf',
          template: 'apa',
          sections: ['executive-summary', 'methodology', 'findings', 'recommendations'],
        })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('sections');
    });

    it('should export report in multiple formats', async () => {
      const formats = ['pdf', 'docx', 'markdown'];
      
      for (const format of formats) {
        const response = await request(app.getHttpServer())
          .post(`/api/reports/${testStudyId}/export`)
          .send({ format })
          .set('Authorization', authToken)
          .expect(200);

        expect(response.headers['content-disposition']).toContain(`filename=`);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent hub data requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get(`/api/analysis/hub/${testStudyId}`)
          .set('Authorization', authToken)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('study');
      });
    });

    it('should maintain response time under threshold', async () => {
      const start = Date.now();
      
      await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}`)
        .set('Authorization', authToken)
        .expect(200);

      const duration = Date.now() - start;
      
      // Response should be under 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/analysis/hub/${testStudyId}/export`)
        .send({ format: 'invalid-format' })
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle authorization errors', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/hub/${testStudyId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});