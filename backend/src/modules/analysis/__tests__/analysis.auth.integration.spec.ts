import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisController } from '../analysis.controller';
import { QAnalysisService } from '../services/q-analysis.service';
import { Analysis } from '../entities/analysis.entity';
import { Study } from '../../studies/entities/study.entity';
import { User } from '../../users/entities/user.entity';

describe('Analysis Authentication & Authorization Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let studyRepository: Repository<Study>;
  let analysisRepository: Repository<Analysis>;

  // Test users with different roles
  let researcherToken: string;
  let participantToken: string;
  let adminToken: string;
  let unauthenticatedRequest: any;

  // Test data
  let researcherUser: User;
  let participantUser: User;
  let adminUser: User;
  let researcherStudy: Study;
  let publicStudy: Study;
  let privateStudy: Study;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        QAnalysisService,
        JwtService,
        {
          provide: getRepositoryToken(Analysis),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Study),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          if (!authHeader) {
            return false;
          }

          const token = authHeader.split(' ')[1];
          try {
            const decoded = jwtService.verify(token);
            request.user = decoded;
            return true;
          } catch {
            return false;
          }
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    studyRepository = moduleFixture.get<Repository<Study>>(
      getRepositoryToken(Study),
    );
    analysisRepository = moduleFixture.get<Repository<Analysis>>(
      getRepositoryToken(Analysis),
    );

    // Create test users
    researcherUser = await userRepository.save({
      email: 'researcher@test.com',
      firstName: 'Research',
      lastName: 'User',
      role: 'researcher',
      passwordHash: 'hashed',
    });

    participantUser = await userRepository.save({
      email: 'participant@test.com',
      firstName: 'Participant',
      lastName: 'User',
      role: 'participant',
      passwordHash: 'hashed',
    });

    adminUser = await userRepository.save({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      passwordHash: 'hashed',
    });

    // Generate tokens
    researcherToken = jwtService.sign({
      sub: researcherUser.id,
      email: researcherUser.email,
      role: 'researcher',
    });

    participantToken = jwtService.sign({
      sub: participantUser.id,
      email: participantUser.email,
      role: 'participant',
    });

    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: 'admin',
    });

    // Create test studies
    researcherStudy = await studyRepository.save({
      title: 'Researcher Study',
      userId: researcherUser.id,
      visibility: 'private',
      configuration: {
        gridColumns: 9,
        distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      },
    });

    publicStudy = await studyRepository.save({
      title: 'Public Study',
      userId: researcherUser.id,
      visibility: 'public',
      configuration: {
        gridColumns: 9,
        distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      },
    });

    privateStudy = await studyRepository.save({
      title: 'Private Study',
      userId: adminUser.id,
      visibility: 'private',
      configuration: {
        gridColumns: 9,
        distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Requirements', () => {
    it('should reject requests without authentication token', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .send({
          studyId: researcherStudy.id,
          correlationMatrix: [[1]],
        })
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = jwtService.sign(
        {
          sub: researcherUser.id,
          email: researcherUser.email,
          role: 'researcher',
        },
        { expiresIn: '-1h' }, // Already expired
      );

      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should accept requests with valid token', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow researchers to analyze their own studies', async () => {
      const analysisData = {
        studyId: researcherStudy.id,
        correlationMatrix: generateTestMatrix(5),
        extractionMethod: 'pca',
      };

      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(analysisData)
        .expect(201);
    });

    it('should prevent researchers from analyzing others private studies', async () => {
      const analysisData = {
        studyId: privateStudy.id, // Owned by admin
        correlationMatrix: generateTestMatrix(5),
      };

      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(analysisData)
        .expect(403);
    });

    it('should allow participants to view public study results only', async () => {
      // Create analysis for public study
      await analysisRepository.save({
        studyId: publicStudy.id,
        userId: researcherUser.id,
        status: 'completed',
        isPublic: true,
      });

      // Participant can view public results
      await request(app.getHttpServer())
        .get(`/api/analysis/${publicStudy.id}/results`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      // Participant cannot view private results
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });

    it('should allow admins to access all analyses', async () => {
      // Admin can access researcher's study
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      // Admin can analyze any study
      const analysisData = {
        studyId: researcherStudy.id,
        correlationMatrix: generateTestMatrix(5),
      };

      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(analysisData)
        .expect(201);
    });

    it('should restrict export functionality to study owners', async () => {
      // Owner can export
      await request(app.getHttpServer())
        .post('/api/analysis/export')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({
          studyId: researcherStudy.id,
          format: 'json',
        })
        .expect(200);

      // Non-owner cannot export
      await request(app.getHttpServer())
        .post('/api/analysis/export')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          studyId: researcherStudy.id,
          format: 'json',
        })
        .expect(403);
    });
  });

  describe('Study Collaboration Access', () => {
    let collaboratorUser: User;
    let collaboratorToken: string;

    beforeEach(async () => {
      // Create collaborator
      collaboratorUser = await userRepository.save({
        email: 'collaborator@test.com',
        firstName: 'Collaborator',
        lastName: 'User',
        role: 'researcher',
        passwordHash: 'hashed',
      });

      collaboratorToken = jwtService.sign({
        sub: collaboratorUser.id,
        email: collaboratorUser.email,
        role: 'researcher',
      });

      // Add collaborator to study
      await studyRepository.update(researcherStudy.id, {
        collaborators: [collaboratorUser.id],
      });
    });

    it('should allow collaborators to analyze shared studies', async () => {
      const analysisData = {
        studyId: researcherStudy.id,
        correlationMatrix: generateTestMatrix(5),
      };

      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(analysisData)
        .expect(201);
    });

    it('should track analysis ownership for audit', async () => {
      const analysisData = {
        studyId: researcherStudy.id,
        correlationMatrix: generateTestMatrix(5),
        auditLog: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(analysisData)
        .expect(201);

      expect(response.body).toHaveProperty('createdBy', collaboratorUser.id);
      expect(response.body).toHaveProperty('auditLog');
    });
  });

  describe('API Key Authentication', () => {
    let apiKey: string;

    beforeEach(async () => {
      // Generate API key for researcher
      apiKey = 'test-api-key-' + Math.random().toString(36).substring(7);
      await userRepository.update(researcherUser.id, {
        apiKeys: [
          {
            key: apiKey,
            name: 'Test API Key',
            createdAt: new Date(),
            lastUsed: null,
            permissions: ['read:analysis', 'write:analysis'],
          },
        ],
      });
    });

    it('should authenticate requests with valid API key', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('X-API-Key', apiKey)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should reject requests with invalid API key', async () => {
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('X-API-Key', 'invalid-api-key')
        .expect(401);
    });

    it('should respect API key permission scopes', async () => {
      // Create read-only API key
      const readOnlyKey =
        'read-only-key-' + Math.random().toString(36).substring(7);
      await userRepository.update(researcherUser.id, {
        apiKeys: [
          {
            key: readOnlyKey,
            name: 'Read Only Key',
            permissions: ['read:analysis'],
          },
        ],
      });

      // Can read
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('X-API-Key', readOnlyKey)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      // Cannot write
      await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('X-API-Key', readOnlyKey)
        .send({
          studyId: researcherStudy.id,
          correlationMatrix: [[1]],
        })
        .expect(403);
    });
  });

  describe('Session Management', () => {
    it('should handle concurrent sessions from same user', async () => {
      // Create two different session tokens
      const session1Token = jwtService.sign({
        sub: researcherUser.id,
        email: researcherUser.email,
        role: 'researcher',
        sessionId: 'session-1',
      });

      const session2Token = jwtService.sign({
        sub: researcherUser.id,
        email: researcherUser.email,
        role: 'researcher',
        sessionId: 'session-2',
      });

      // Both sessions should work
      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${session1Token}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

      await request(app.getHttpServer())
        .get(`/api/analysis/${researcherStudy.id}/results`)
        .set('Authorization', `Bearer ${session2Token}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should refresh tokens before expiration', async () => {
      const shortLivedToken = jwtService.sign(
        {
          sub: researcherUser.id,
          email: researcherUser.email,
          role: 'researcher',
        },
        { expiresIn: '5m' },
      );

      const refreshToken = jwtService.sign(
        {
          sub: researcherUser.id,
          type: 'refresh',
        },
        { expiresIn: '7d' },
      );

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should require 2FA for sensitive operations when enabled', async () => {
      // Enable 2FA for user
      await userRepository.update(researcherUser.id, {
        twoFactorEnabled: true,
        twoFactorSecret: 'test-secret',
      });

      // Request without 2FA code should fail
      await request(app.getHttpServer())
        .delete(`/api/analysis/${researcherStudy.id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(403);

      // Request with valid 2FA code should succeed
      await request(app.getHttpServer())
        .delete(`/api/analysis/${researcherStudy.id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .set('X-2FA-Code', '123456') // Mock valid code
        .expect((res) => {
          expect([200, 204, 404]).toContain(res.status);
        });
    });
  });

  describe('Rate Limiting per User Role', () => {
    it('should apply different rate limits based on user role', async () => {
      const requests = [];

      // Participants have lower rate limit (10 requests per minute)
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app.getHttpServer())
            .get(`/api/analysis/${publicStudy.id}/results`)
            .set('Authorization', `Bearer ${participantToken}`),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should allow higher rate limits for admin users', async () => {
      const requests = [];

      // Admins have higher rate limit (1000 requests per minute)
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app.getHttpServer())
            .get(`/api/analysis/${researcherStudy.id}/results`)
            .set('Authorization', `Bearer ${adminToken}`),
        );
      }

      const responses = await Promise.all(requests);
      const successful = responses.filter((r) => r.status !== 429);

      expect(successful.length).toBe(50); // All should succeed
    });
  });

  // Helper functions
  function generateTestMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = matrix[j]?.[i] ?? Math.random() * 0.8 - 0.4;
        }
      }
    }
    return matrix;
  }
});
