import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { performance } from 'perf_hooks';

describe('Smoke Tests - Basic Analysis Pipeline', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let testStudyId: string;
  let testAnalysisId: string;

  const SMOKE_TEST_TIMEOUT = 30000; // 30 seconds max for entire pipeline

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret-key',
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'smoke-test-user', role: 'researcher' });
    testStudyId = `smoke-study-${Date.now()}`;
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  describe('End-to-End Analysis Flow', () => {
    it(
      'should complete full analysis pipeline from data input to results',
      async () => {
        const startTime = performance.now();

        // Step 1: Create a new study
        console.log('🔍 Step 1: Creating study...');
        const createStudyResponse = await request(app.getHttpServer())
          .post('/api/studies/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Smoke Test Study',
            description: 'Automated smoke test',
            configuration: {
              gridColumns: 9,
              distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
              forcedDistribution: true,
              statementCount: 36,
            },
          })
          .expect(201);

        testStudyId = createStudyResponse.body.id;
        expect(testStudyId).toBeDefined();
        console.log('✅ Study created:', testStudyId);

        // Step 2: Upload Q-sort data
        console.log('🔍 Step 2: Uploading Q-sort data...');
        const qSorts = generateTestQSorts(20, 36); // 20 participants, 36 statements

        const uploadResponse = await request(app.getHttpServer())
          .post('/api/analysis/upload-sorts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: testStudyId,
            qSorts: qSorts,
          })
          .expect(201);

        expect(uploadResponse.body.participantCount).toBe(20);
        console.log(
          '✅ Q-sorts uploaded:',
          uploadResponse.body.participantCount,
        );

        // Step 3: Calculate correlation matrix
        console.log('🔍 Step 3: Calculating correlations...');
        const correlationResponse = await request(app.getHttpServer())
          .post('/api/analysis/calculate-correlation')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: testStudyId,
          })
          .expect(201);

        expect(correlationResponse.body.correlationMatrix).toBeDefined();
        expect(correlationResponse.body.correlationMatrix).toHaveLength(20);
        console.log('✅ Correlation matrix calculated');

        // Step 4: Extract factors
        console.log('🔍 Step 4: Extracting factors...');
        const extractionResponse = await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: testStudyId,
            correlationMatrix: correlationResponse.body.correlationMatrix,
            numberOfFactors: 3,
            extractionMethod: 'pca',
          })
          .expect(201);

        expect(extractionResponse.body.factors).toHaveLength(3);
        expect(extractionResponse.body.eigenvalues).toBeDefined();
        testAnalysisId = extractionResponse.body.analysisId;
        console.log(
          '✅ Factors extracted:',
          extractionResponse.body.factors.length,
        );

        // Step 5: Rotate factors
        console.log('🔍 Step 5: Rotating factors...');
        const rotationResponse = await request(app.getHttpServer())
          .post('/api/analysis/rotate-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            analysisId: testAnalysisId,
            studyId: testStudyId,
            loadingMatrix: extractionResponse.body.loadingMatrix,
            rotationType: 'varimax',
          })
          .expect(201);

        expect(rotationResponse.body.rotatedMatrix).toBeDefined();
        console.log('✅ Factors rotated');

        // Step 6: Calculate z-scores
        console.log('🔍 Step 6: Calculating z-scores...');
        const zScoreResponse = await request(app.getHttpServer())
          .post('/api/analysis/calculate-z-scores')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            analysisId: testAnalysisId,
            studyId: testStudyId,
          })
          .expect(201);

        expect(zScoreResponse.body.zScores).toBeDefined();
        console.log('✅ Z-scores calculated');

        // Step 7: Identify distinguishing statements
        console.log('🔍 Step 7: Finding distinguishing statements...');
        const distinguishingResponse = await request(app.getHttpServer())
          .post('/api/analysis/identify-distinguishing')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            analysisId: testAnalysisId,
            studyId: testStudyId,
          })
          .expect(201);

        expect(
          distinguishingResponse.body.distinguishingStatements,
        ).toBeDefined();
        expect(distinguishingResponse.body.consensusStatements).toBeDefined();
        console.log('✅ Distinguishing statements identified');

        // Step 8: Retrieve final results
        console.log('🔍 Step 8: Retrieving final results...');
        const resultsResponse = await request(app.getHttpServer())
          .get(`/api/analysis/${testStudyId}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(resultsResponse.body.factors).toBeDefined();
        expect(resultsResponse.body.eigenvalues).toBeDefined();
        expect(resultsResponse.body.varianceExplained).toBeDefined();
        expect(resultsResponse.body.status).toBe('completed');
        console.log('✅ Final results retrieved');

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        expect(totalTime).toBeLessThan(SMOKE_TEST_TIMEOUT);

        console.log(
          `\n✅ Complete pipeline executed in ${totalTime.toFixed(2)}ms`,
        );
        console.log('   All critical steps passed successfully');
      },
      SMOKE_TEST_TIMEOUT,
    );

    it('should handle analysis with pre-existing data', async () => {
      // Quick test using existing study data
      const response = await request(app.getHttpServer())
        .post('/api/analysis/quick-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.processingTime).toBeDefined();
      expect(response.body.processingTime).toBeLessThan(5000); // Should be fast with cached data

      console.log(
        `✅ Quick analysis completed in ${response.body.processingTime}ms`,
      );
    });

    it('should validate data integrity throughout pipeline', async () => {
      const validationResponse = await request(app.getHttpServer())
        .post('/api/analysis/validate-pipeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          analysisId: testAnalysisId,
        })
        .expect(200);

      expect(validationResponse.body.dataIntegrity).toBe(true);
      expect(validationResponse.body.pipelineStages).toEqual([
        'study_created',
        'data_uploaded',
        'correlation_calculated',
        'factors_extracted',
        'factors_rotated',
        'zscores_calculated',
        'distinguishing_identified',
        'results_available',
      ]);

      console.log('✅ Data integrity validated across all pipeline stages');
    });
  });

  describe('Pipeline Error Recovery', () => {
    it('should handle partial pipeline failures gracefully', async () => {
      // Test with invalid data to trigger controlled failure
      const response = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'non-existent-study',
          correlationMatrix: [[]], // Invalid matrix
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Invalid');

      console.log('✅ Pipeline handles invalid input gracefully');
    });

    it('should resume pipeline from last successful step', async () => {
      const resumeResponse = await request(app.getHttpServer())
        .post('/api/analysis/resume-pipeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          fromStep: 'factors_extracted',
        })
        .expect(200);

      expect(resumeResponse.body.resumed).toBe(true);
      expect(resumeResponse.body.completedSteps).toContain('factors_rotated');

      console.log('✅ Pipeline successfully resumed from checkpoint');
    });
  });

  describe('Pipeline Performance Checks', () => {
    it('should complete small dataset analysis quickly', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/quick-pipeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qSorts: generateTestQSorts(10, 20), // Small: 10 participants, 20 statements
        })
        .expect(201);

      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete in 5 seconds
      expect(response.body.status).toBe('completed');

      console.log(`✅ Small dataset pipeline: ${processingTime.toFixed(2)}ms`);
    });

    it('should stream results for better perceived performance', async () => {
      let firstChunkTime: number | null = null;
      let chunks = 0;

      await new Promise<void>((resolve, reject) => {
        const req = request(app.getHttpServer())
          .get(`/api/analysis/${testStudyId}/stream-results`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Accept', 'text/event-stream');

        req.on('response', (res: any) => {
          const startTime = performance.now();

          res.on('data', (chunk: any) => {
            chunks++;
            if (!firstChunkTime) {
              firstChunkTime = performance.now() - startTime;
            }
          });

          res.on('end', () => {
            resolve();
          });

          res.on('error', reject);
        });

        req.end();
      });

      expect(firstChunkTime).toBeLessThan(500); // First chunk within 500ms
      expect(chunks).toBeGreaterThan(0);

      console.log(
        `✅ Streaming results: First chunk in ${firstChunkTime}ms, ${chunks} total chunks`,
      );
    });
  });

  describe('Pipeline State Management', () => {
    it('should track pipeline progress accurately', async () => {
      const progressUpdates: number[] = [];

      // Start pipeline with progress tracking
      const pipelinePromise = request(app.getHttpServer())
        .post('/api/analysis/pipeline-with-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          trackProgress: true,
        });

      // Poll for progress updates
      const progressInterval = setInterval(async () => {
        const progressResponse = await request(app.getHttpServer())
          .get(`/api/analysis/${testStudyId}/progress`)
          .set('Authorization', `Bearer ${authToken}`);

        if (progressResponse.status === 200) {
          progressUpdates.push(progressResponse.body.progress);
        }
      }, 100);

      const result = await pipelinePromise;
      clearInterval(progressInterval);

      expect(result.status).toBe(201);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(
        progressUpdates[progressUpdates.length - 1],
      ).toBeGreaterThanOrEqual(95);

      console.log(
        `✅ Progress tracking: ${progressUpdates.length} updates received`,
      );
    });

    it('should maintain pipeline state across requests', async () => {
      const stateResponse = await request(app.getHttpServer())
        .get(`/api/analysis/${testStudyId}/pipeline-state`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(stateResponse.body.state).toBeDefined();
      expect(stateResponse.body.completedSteps).toBeInstanceOf(Array);
      expect(stateResponse.body.currentStep).toBeDefined();
      expect(stateResponse.body.lastUpdated).toBeDefined();

      console.log('✅ Pipeline state persisted and retrievable');
    });
  });

  // Helper function to generate test Q-sorts
  function generateTestQSorts(
    participantCount: number,
    statementCount: number,
  ): any[] {
    const qSorts = [];
    const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const frequency = [2, 3, 4, 5, 6, 5, 4, 3, 2]; // Total: 34 (close to 36)

    for (let p = 0; p < participantCount; p++) {
      const sort: { [key: number]: number } = {};
      let statementId = 1;

      // Assign statements according to forced distribution
      for (let i = 0; i < distribution.length; i++) {
        const value = distribution[i];
        const count = frequency[i];

        for (let j = 0; j < count && statementId <= statementCount; j++) {
          sort[statementId] = value;
          statementId++;
        }
      }

      // Fill remaining statements with 0 if needed
      while (statementId <= statementCount) {
        sort[statementId] = 0;
        statementId++;
      }

      qSorts.push({
        participantId: `participant-${p + 1}`,
        sortData: sort,
        completedAt: new Date(),
      });
    }

    return qSorts;
  }
});
