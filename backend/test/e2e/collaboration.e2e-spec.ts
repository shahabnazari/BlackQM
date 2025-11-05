/**
 * E2E Test: Phase 10 Collaboration Workflow
 *
 * Tests the complete collaboration lifecycle:
 * 1. Create report
 * 2. Add collaborators
 * 3. Create version snapshot
 * 4. Add comments and replies
 * 5. Track changes
 * 6. Submit for approval
 * 7. Generate share links
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';

describe('Collaboration Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let studyId: string;
  let reportId: string;
  let versionId: string;
  let commentId: string;
  let changeId: string;
  let shareLinkId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Login and get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'researcher@test.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Step 1: Create Study and Report', () => {
    it('should create a test study', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/studies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Study for Collaboration',
          description: 'End-to-end testing of collaboration features',
        })
        .expect(201);

      studyId = response.body.id;
      expect(studyId).toBeDefined();
    });

    it('should create a minimal report', async () => {
      // Directly create via Prisma for simplicity
      const report = await prisma.report.create({
        data: {
          userId,
          studyId,
          status: 'draft',
          templateType: 'apa',
          format: 'html',
          metadata: {
            title: 'E2E Test Report',
            authors: ['Test Researcher'],
            institution: 'Test University',
            date: new Date().toISOString(),
            version: 1,
            studyId,
          },
          sections: [
            {
              id: 'abstract',
              title: 'Abstract',
              content: '<p>Test abstract content</p>',
              order: 1,
            },
          ],
          provenance: [],
          content: '<h1>E2E Test Report</h1>',
        },
      });

      reportId = report.id;
      expect(reportId).toBeDefined();
    });
  });

  describe('Step 2: Version Control', () => {
    it('should create version snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          changeMessage: 'Initial version snapshot',
        })
        .expect(201);

      versionId = response.body.id;
      expect(response.body.versionNumber).toBe(1);
      expect(response.body.snapshot).toBeDefined();
    });

    it('should retrieve all versions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${reportId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('should retrieve specific version', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${reportId}/versions/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.versionNumber).toBe(1);
    });
  });

  describe('Step 3: Comment System', () => {
    it('should create comment on report', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This abstract needs more detail',
          sectionId: 'abstract',
        })
        .expect(201);

      commentId = response.body.id;
      expect(response.body.content).toBe('This abstract needs more detail');
    });

    it('should reply to comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'I agree, will expand this section',
        })
        .expect(201);

      expect(response.body.parentId).toBe(commentId);
    });

    it('should get all comments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${reportId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should resolve comment', async () => {
      await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Step 4: Track Changes', () => {
    it('should track insert change', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/changes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sectionId: 'abstract',
          changeType: 'insert',
          before: null,
          after: 'New sentence inserted',
          position: { start: 0, end: 20 },
        })
        .expect(201);

      changeId = response.body.id;
      expect(response.body.changeType).toBe('insert');
    });

    it('should track modify change', async () => {
      await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/changes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sectionId: 'abstract',
          changeType: 'modify',
          before: 'Original text',
          after: 'Modified text',
          position: { start: 5, end: 18 },
        })
        .expect(201);
    });

    it('should accept change', async () => {
      await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/changes/${changeId}/accept`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get change statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${reportId}/changes/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
    });
  });

  describe('Step 5: Sharing System', () => {
    it('should generate share link', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/share/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accessLevel: 'view',
          expiresIn: 7,
        })
        .expect(201);

      shareLinkId = response.body.id;
      expect(response.body.token).toBeDefined();
      expect(response.body.url).toContain('/shared/reports/');
    });

    it('should generate password-protected link', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/share/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accessLevel: 'comment',
          password: 'test123',
          expiresIn: 30,
        })
        .expect(201);

      expect(response.body.accessLevel).toBe('comment');
    });

    it('should get all share links', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${reportId}/share/links`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should make report public', async () => {
      await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/share/public`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should make report private', async () => {
      await request(app.getHttpServer())
        .post(`/api/reports/${reportId}/share/private`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Step 6: Complete Workflow Verification', () => {
    it('should verify report has all collaboration features', async () => {
      // Verify versions exist
      const versions = await prisma.reportVersion.findMany({
        where: { reportId },
      });
      expect(versions.length).toBe(1);

      // Verify comments exist
      const comments = await prisma.reportComment.findMany({
        where: { reportId },
      });
      expect(comments.length).toBeGreaterThan(0);

      // Verify changes exist
      const changes = await prisma.reportChange.findMany({
        where: { reportId },
      });
      expect(changes.length).toBeGreaterThan(0);

      // Verify share links exist
      const shareLinks = await prisma.reportShareLink.findMany({
        where: { reportId },
      });
      expect(shareLinks.length).toBeGreaterThan(0);
    });
  });
});
