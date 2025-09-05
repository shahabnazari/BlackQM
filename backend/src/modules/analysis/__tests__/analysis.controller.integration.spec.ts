import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisController } from '../analysis.controller';
import { QAnalysisService } from '../services/q-analysis.service';
import { FactorExtractionService } from '../services/factor-extraction.service';
import { RotationEngineService } from '../services/rotation-engine.service';
import { StatisticsService } from '../services/statistics.service';
import { PQMethodCompatibilityService } from '../services/pqmethod-compatibility.service';
import { Analysis } from '../entities/analysis.entity';
import { Study } from '../../studies/entities/study.entity';
import { User } from '../../users/entities/user.entity';

describe('AnalysisController Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let analysisRepository: Repository<Analysis>;
  let studyRepository: Repository<Study>;
  let authToken: string;
  let testUserId: string;
  let testStudyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        QAnalysisService,
        FactorExtractionService,
        RotationEngineService,
        StatisticsService,
        PQMethodCompatibilityService,
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
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    analysisRepository = moduleFixture.get<Repository<Analysis>>(
      getRepositoryToken(Analysis),
    );
    studyRepository = moduleFixture.get<Repository<Study>>(
      getRepositoryToken(Study),
    );

    // Generate test auth token
    testUserId = 'test-user-123';
    authToken = jwtService.sign({ sub: testUserId, role: 'researcher' });

    // Create test study
    const testStudy = await studyRepository.save({
      title: 'Test Q-Study',
      userId: testUserId,
      configuration: {
        gridColumns: 9,
        distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
        forcedDistribution: true,
      },
    });
    testStudyId = testStudy.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/analysis/* endpoints', () => {
    describe('POST /api/analysis/extract-factors', () => {
      it('should extract factors from Q-sort data', async () => {
        const qSortData = {
          studyId: testStudyId,
          correlationMatrix: generateTestCorrelationMatrix(10),
          extractionMethod: 'pca',
          numberOfFactors: 3,
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(qSortData)
          .expect(201);

        expect(response.body).toHaveProperty('factors');
        expect(response.body).toHaveProperty('eigenvalues');
        expect(response.body).toHaveProperty('varianceExplained');
        expect(response.body.factors).toHaveLength(3);
        expect(response.body.eigenvalues).toHaveLength(3);
      });

      it('should validate extraction parameters', async () => {
        const invalidData = {
          studyId: testStudyId,
          correlationMatrix: [], // Invalid empty matrix
          extractionMethod: 'invalid-method',
          numberOfFactors: -1, // Invalid negative number
        };

        await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('should enforce authentication', async () => {
        const qSortData = {
          studyId: testStudyId,
          correlationMatrix: generateTestCorrelationMatrix(10),
        };

        await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .send(qSortData)
          .expect(401);
      });
    });

    describe('POST /api/analysis/rotate-factors', () => {
      it('should perform varimax rotation', async () => {
        const rotationData = {
          studyId: testStudyId,
          loadingMatrix: generateTestLoadingMatrix(10, 3),
          rotationType: 'varimax',
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/rotate-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(rotationData)
          .expect(201);

        expect(response.body).toHaveProperty('rotatedMatrix');
        expect(response.body).toHaveProperty('rotationMatrix');
        expect(response.body.rotatedMatrix).toHaveLength(10);
        expect(response.body.rotatedMatrix[0]).toHaveLength(3);
      });

      it('should perform manual rotation with angle', async () => {
        const rotationData = {
          studyId: testStudyId,
          loadingMatrix: generateTestLoadingMatrix(10, 2),
          rotationType: 'manual',
          rotationAngle: 45,
          factorPairs: [0, 1],
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/rotate-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send(rotationData)
          .expect(201);

        expect(response.body).toHaveProperty('rotatedMatrix');
        expect(response.body).toHaveProperty('rotationAngle');
        expect(response.body.rotationAngle).toBe(45);
      });
    });

    describe('GET /api/analysis/:studyId/results', () => {
      let analysisId: string;

      beforeEach(async () => {
        const analysis = await analysisRepository.save({
          studyId: testStudyId,
          userId: testUserId,
          factors: generateTestFactors(3),
          eigenvalues: [3.5, 2.1, 1.4],
          varianceExplained: [35, 21, 14],
          status: 'completed',
        });
        analysisId = analysis.id;
      });

      it('should retrieve analysis results', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/analysis/${testStudyId}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('factors');
        expect(response.body).toHaveProperty('eigenvalues');
        expect(response.body).toHaveProperty('varianceExplained');
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('completed');
      });

      it('should return 404 for non-existent study', async () => {
        await request(app.getHttpServer())
          .get('/api/analysis/non-existent-id/results')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should enforce ownership access control', async () => {
        const otherUserToken = jwtService.sign({
          sub: 'other-user-456',
          role: 'researcher',
        });

        await request(app.getHttpServer())
          .get(`/api/analysis/${testStudyId}/results`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(403);
      });
    });

    describe('POST /api/analysis/calculate-z-scores', () => {
      it('should calculate z-scores for factor arrays', async () => {
        const factorData = {
          studyId: testStudyId,
          factorArrays: generateTestFactorArrays(3, 20),
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/calculate-z-scores')
          .set('Authorization', `Bearer ${authToken}`)
          .send(factorData)
          .expect(201);

        expect(response.body).toHaveProperty('zScores');
        expect(response.body.zScores).toHaveLength(3);
        response.body.zScores.forEach((factor: any) => {
          expect(factor).toHaveLength(20);
          factor.forEach((score: number) => {
            expect(score).toBeGreaterThanOrEqual(-4);
            expect(score).toBeLessThanOrEqual(4);
          });
        });
      });
    });

    describe('POST /api/analysis/identify-distinguishing', () => {
      it('should identify distinguishing statements', async () => {
        const analysisData = {
          studyId: testStudyId,
          factorLoadings: generateTestLoadingMatrix(20, 3),
          significanceLevel: 0.05,
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/identify-distinguishing')
          .set('Authorization', `Bearer ${authToken}`)
          .send(analysisData)
          .expect(201);

        expect(response.body).toHaveProperty('distinguishingStatements');
        expect(response.body).toHaveProperty('consensusStatements');
        expect(Array.isArray(response.body.distinguishingStatements)).toBe(
          true,
        );
        expect(Array.isArray(response.body.consensusStatements)).toBe(true);
      });
    });

    describe('POST /api/analysis/export', () => {
      it('should export analysis in JSON format', async () => {
        const exportData = {
          studyId: testStudyId,
          format: 'json',
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send(exportData)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toHaveProperty('study');
        expect(response.body).toHaveProperty('analysis');
        expect(response.body).toHaveProperty('exportDate');
      });

      it('should export analysis in CSV format', async () => {
        const exportData = {
          studyId: testStudyId,
          format: 'csv',
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send(exportData)
          .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.text).toContain('Factor,Statement,Loading');
      });

      it('should export in PQMethod format', async () => {
        const exportData = {
          studyId: testStudyId,
          format: 'pqmethod',
        };

        const response = await request(app.getHttpServer())
          .post('/api/analysis/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send(exportData)
          .expect(200);

        expect(response.headers['content-type']).toContain('text/plain');
        expect(response.text).toContain('PQMethod');
      });
    });

    describe('Rate Limiting', () => {
      it('should enforce rate limiting on analysis endpoints', async () => {
        const requests = [];
        const qSortData = {
          studyId: testStudyId,
          correlationMatrix: generateTestCorrelationMatrix(5),
        };

        // Make 21 requests (assuming rate limit is 20 per minute)
        for (let i = 0; i < 21; i++) {
          requests.push(
            request(app.getHttpServer())
              .post('/api/analysis/extract-factors')
              .set('Authorization', `Bearer ${authToken}`)
              .send(qSortData),
          );
        }

        const responses = await Promise.all(requests);
        const rateLimited = responses.some((res) => res.status === 429);

        expect(rateLimited).toBe(true);
      });
    });
  });

  // Helper functions for generating test data
  function generateTestCorrelationMatrix(size: number): number[][] {
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

  function generateTestLoadingMatrix(
    participants: number,
    factors: number,
  ): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < participants; i++) {
      matrix[i] = [];
      for (let j = 0; j < factors; j++) {
        matrix[i][j] = Math.random() * 0.8 - 0.4;
      }
    }
    return matrix;
  }

  function generateTestFactors(count: number): any[] {
    const factors = [];
    for (let i = 0; i < count; i++) {
      factors.push({
        id: i + 1,
        eigenvalue: 3.5 - i * 0.5,
        varianceExplained: 35 - i * 5,
        loadings: Array(10)
          .fill(0)
          .map(() => Math.random() * 0.8 - 0.4),
      });
    }
    return factors;
  }

  function generateTestFactorArrays(
    factors: number,
    statements: number,
  ): number[][] {
    const arrays: number[][] = [];
    for (let i = 0; i < factors; i++) {
      arrays[i] = [];
      for (let j = 0; j < statements; j++) {
        arrays[i][j] = Math.floor(Math.random() * 9) - 4; // -4 to 4
      }
    }
    return arrays;
  }
});
