import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { performance } from 'perf_hooks';

describe('Smoke Tests - Critical User Journeys', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshToken: string;
  let userId: string;
  let studyId: string;
  let analysisId: string;

  const JOURNEY_TIMEOUT = 60000; // 60 seconds for complete journey

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule(
      {},
    ).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Researcher Journey: Login → Analysis → Export', () => {
    it(
      'should complete full researcher journey from login to export',
      async () => {
        const journeyStart = performance.now();
        const journeySteps: { step: string; time: number; success: boolean }[] =
          [];

        // Step 1: User Registration (if new user)
        console.log('\n🚀 Starting Critical User Journey Test\n');
        console.log('📍 Step 1: User Registration');

        const stepStart = performance.now();
        const registerResponse = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `researcher-${Date.now()}@test.com`,
            password: 'SecurePassword123!',
            firstName: 'Test',
            lastName: 'Researcher',
            institution: 'Test University',
          })
          .expect((res) => {
            expect([201, 409]).toContain(res.status); // 201 for new, 409 if exists
          });

        journeySteps.push({
          step: 'registration',
          time: performance.now() - stepStart,
          success: true,
        });
        console.log(
          `✅ Registration: ${(performance.now() - stepStart).toFixed(2)}ms`,
        );

        // Step 2: User Login
        console.log('📍 Step 2: User Login');
        const loginStart = performance.now();

        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email:
              registerResponse.body.email ||
              `researcher-${Date.now()}@test.com`,
            password: 'SecurePassword123!',
          })
          .expect(200);

        authToken = loginResponse.body.accessToken;
        refreshToken = loginResponse.body.refreshToken;
        userId = loginResponse.body.user.id;

        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        journeySteps.push({
          step: 'login',
          time: performance.now() - loginStart,
          success: true,
        });
        console.log(
          `✅ Login: ${(performance.now() - loginStart).toFixed(2)}ms`,
        );

        // Step 3: Dashboard Access
        console.log('📍 Step 3: Accessing Dashboard');
        const dashboardStart = performance.now();

        const dashboardResponse = await request(app.getHttpServer())
          .get('/api/dashboard/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(dashboardResponse.body).toHaveProperty('studies');
        expect(dashboardResponse.body).toHaveProperty('recentActivity');

        journeySteps.push({
          step: 'dashboard',
          time: performance.now() - dashboardStart,
          success: true,
        });
        console.log(
          `✅ Dashboard: ${(performance.now() - dashboardStart).toFixed(2)}ms`,
        );

        // Step 4: Create New Study
        console.log('📍 Step 4: Creating New Study');
        const studyStart = performance.now();

        const studyResponse = await request(app.getHttpServer())
          .post('/api/studies/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Smoke Test Study',
            description: 'Testing critical user journey',
            configuration: {
              gridColumns: 9,
              distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
              statements: generateTestStatements(36),
            },
          })
          .expect(201);

        studyId = studyResponse.body.id;
        expect(studyId).toBeDefined();

        journeySteps.push({
          step: 'create_study',
          time: performance.now() - studyStart,
          success: true,
        });
        console.log(
          `✅ Study Created: ${(performance.now() - studyStart).toFixed(2)}ms`,
        );

        // Step 5: Add Participants
        console.log('📍 Step 5: Adding Participants');
        const participantsStart = performance.now();

        const participantsResponse = await request(app.getHttpServer())
          .post('/api/studies/add-participants')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId,
            participants: generateTestParticipants(20),
          })
          .expect(201);

        expect(participantsResponse.body.added).toBe(20);

        journeySteps.push({
          step: 'add_participants',
          time: performance.now() - participantsStart,
          success: true,
        });
        console.log(
          `✅ Participants Added: ${(performance.now() - participantsStart).toFixed(2)}ms`,
        );

        // Step 6: Upload Q-Sort Data
        console.log('📍 Step 6: Uploading Q-Sort Data');
        const uploadStart = performance.now();

        const uploadResponse = await request(app.getHttpServer())
          .post('/api/analysis/upload-sorts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId,
            qSorts: generateTestQSorts(20, 36),
          })
          .expect(201);

        expect(uploadResponse.body.processed).toBe(20);

        journeySteps.push({
          step: 'upload_qsorts',
          time: performance.now() - uploadStart,
          success: true,
        });
        console.log(
          `✅ Q-Sorts Uploaded: ${(performance.now() - uploadStart).toFixed(2)}ms`,
        );

        // Step 7: Run Analysis
        console.log('📍 Step 7: Running Analysis');
        const analysisStart = performance.now();

        const analysisResponse = await request(app.getHttpServer())
          .post('/api/analysis/run')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId,
            analysisType: 'complete',
            parameters: {
              extractionMethod: 'pca',
              numberOfFactors: 3,
              rotationType: 'varimax',
            },
          })
          .expect(201);

        analysisId = analysisResponse.body.analysisId;
        expect(analysisId).toBeDefined();
        expect(analysisResponse.body.status).toBe('completed');

        journeySteps.push({
          step: 'run_analysis',
          time: performance.now() - analysisStart,
          success: true,
        });
        console.log(
          `✅ Analysis Complete: ${(performance.now() - analysisStart).toFixed(2)}ms`,
        );

        // Step 8: View Results
        console.log('📍 Step 8: Viewing Results');
        const resultsStart = performance.now();

        const resultsResponse = await request(app.getHttpServer())
          .get(`/api/analysis/${analysisId}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(resultsResponse.body.factors).toBeDefined();
        expect(resultsResponse.body.eigenvalues).toBeDefined();
        expect(resultsResponse.body.varianceExplained).toBeDefined();

        journeySteps.push({
          step: 'view_results',
          time: performance.now() - resultsStart,
          success: true,
        });
        console.log(
          `✅ Results Retrieved: ${(performance.now() - resultsStart).toFixed(2)}ms`,
        );

        // Step 9: Export Data
        console.log('📍 Step 9: Exporting Data');
        const exportStart = performance.now();

        const exportResponse = await request(app.getHttpServer())
          .post('/api/analysis/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            analysisId,
            format: 'excel',
            includeRawData: true,
            includeCharts: true,
          })
          .expect(200);

        expect(exportResponse.headers['content-type']).toContain(
          'application/vnd.openxmlformats',
        );
        expect(exportResponse.body).toBeDefined();

        journeySteps.push({
          step: 'export_data',
          time: performance.now() - exportStart,
          success: true,
        });
        console.log(
          `✅ Data Exported: ${(performance.now() - exportStart).toFixed(2)}ms`,
        );

        // Step 10: Logout
        console.log('📍 Step 10: Logout');
        const logoutStart = performance.now();

        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ refreshToken })
          .expect(200);

        journeySteps.push({
          step: 'logout',
          time: performance.now() - logoutStart,
          success: true,
        });
        console.log(
          `✅ Logout: ${(performance.now() - logoutStart).toFixed(2)}ms`,
        );

        // Journey Summary
        const journeyTime = performance.now() - journeyStart;
        const allStepsSuccessful = journeySteps.every((s) => s.success);

        console.log('\n📊 Journey Summary:');
        console.log(`   Total Time: ${journeyTime.toFixed(2)}ms`);
        console.log(`   Steps Completed: ${journeySteps.length}/10`);
        console.log(
          `   Success Rate: ${allStepsSuccessful ? '100%' : 'Failed'}`,
        );

        expect(journeyTime).toBeLessThan(JOURNEY_TIMEOUT);
        expect(allStepsSuccessful).toBe(true);
      },
      JOURNEY_TIMEOUT,
    );
  });

  describe('Participant Journey: Join → Complete Q-Sort → Submit', () => {
    it('should complete participant journey successfully', async () => {
      const participantToken = 'test-participant-token';

      // Step 1: Join Study via Invitation Link
      console.log('\n🚀 Starting Participant Journey Test\n');
      console.log('📍 Step 1: Joining Study');

      const joinResponse = await request(app.getHttpServer())
        .post('/api/participant/join')
        .send({
          invitationCode: 'TEST-INVITE-CODE',
          participantInfo: {
            name: 'Test Participant',
            email: 'participant@test.com',
            demographics: {
              age: 30,
              gender: 'prefer-not-to-say',
            },
          },
        })
        .expect(200);

      const sessionToken = joinResponse.body.sessionToken;
      expect(sessionToken).toBeDefined();
      console.log('✅ Joined study successfully');

      // Step 2: View Instructions
      console.log('📍 Step 2: Viewing Instructions');

      const instructionsResponse = await request(app.getHttpServer())
        .get('/api/participant/instructions')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200);

      expect(instructionsResponse.body.instructions).toBeDefined();
      console.log('✅ Instructions retrieved');

      // Step 3: Complete Pre-Sort
      console.log('📍 Step 3: Completing Pre-Sort');

      const preSortResponse = await request(app.getHttpServer())
        .post('/api/participant/pre-sort')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          sortData: {
            agree: [1, 5, 9, 13, 17],
            neutral: [2, 6, 10, 14, 18],
            disagree: [3, 7, 11, 15, 19],
          },
        })
        .expect(200);

      expect(preSortResponse.body.saved).toBe(true);
      console.log('✅ Pre-sort completed');

      // Step 4: Complete Q-Sort
      console.log('📍 Step 4: Completing Q-Sort');

      const qSortResponse = await request(app.getHttpServer())
        .post('/api/participant/q-sort')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          sortData: generateParticipantQSort(36),
          timeSpent: 1234567, // milliseconds
        })
        .expect(200);

      expect(qSortResponse.body.saved).toBe(true);
      console.log('✅ Q-sort completed');

      // Step 5: Submit Comments
      console.log('📍 Step 5: Submitting Comments');

      const commentsResponse = await request(app.getHttpServer())
        .post('/api/participant/comments')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          comments: [
            { statementId: 1, comment: 'Strongly agree with this' },
            { statementId: 36, comment: 'Completely disagree' },
          ],
        })
        .expect(200);

      expect(commentsResponse.body.saved).toBe(true);
      console.log('✅ Comments submitted');

      // Step 6: Complete Session
      console.log('📍 Step 6: Completing Session');

      const completeResponse = await request(app.getHttpServer())
        .post('/api/participant/complete')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200);

      expect(completeResponse.body.completed).toBe(true);
      console.log('✅ Session completed successfully');

      console.log('\n✅ Participant journey completed successfully');
    });
  });

  describe('Admin Journey: Monitor → Intervene → Report', () => {
    it('should complete admin monitoring and management journey', async () => {
      // Get admin token
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPassword123!',
        })
        .expect(200);

      const adminToken = adminLoginResponse.body.accessToken;

      // Step 1: View System Dashboard
      console.log('\n🚀 Starting Admin Journey Test\n');
      console.log('📍 Step 1: System Dashboard');

      const systemResponse = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(systemResponse.body.systemHealth).toBeDefined();
      expect(systemResponse.body.activeUsers).toBeDefined();
      console.log('✅ System dashboard loaded');

      // Step 2: Monitor Active Studies
      console.log('📍 Step 2: Monitoring Studies');

      const monitorResponse = await request(app.getHttpServer())
        .get('/api/admin/studies/active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(monitorResponse.body.studies).toBeDefined();
      console.log('✅ Active studies monitored');

      // Step 3: Review User Activity
      console.log('📍 Step 3: User Activity Review');

      const activityResponse = await request(app.getHttpServer())
        .get('/api/admin/users/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ timeframe: '24h' })
        .expect(200);

      expect(activityResponse.body.activities).toBeDefined();
      console.log('✅ User activity reviewed');

      // Step 4: Generate System Report
      console.log('📍 Step 4: Generating Report');

      const reportResponse = await request(app.getHttpServer())
        .post('/api/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'system-health',
          format: 'pdf',
          period: 'last-7-days',
        })
        .expect(200);

      expect(reportResponse.body.reportUrl).toBeDefined();
      console.log('✅ System report generated');

      console.log('\n✅ Admin journey completed successfully');
    });
  });

  describe('Cross-Journey Integration', () => {
    it('should handle multiple concurrent user journeys', async () => {
      const journeyPromises = [];

      // Launch 5 concurrent researcher journeys
      for (let i = 0; i < 5; i++) {
        journeyPromises.push(simulateQuickResearcherJourney(`researcher-${i}`));
      }

      // Launch 10 concurrent participant journeys
      for (let i = 0; i < 10; i++) {
        journeyPromises.push(
          simulateQuickParticipantJourney(`participant-${i}`),
        );
      }

      const results = await Promise.all(journeyPromises);
      const successCount = results.filter((r) => r.success).length;
      const avgTime =
        results.reduce((acc, r) => acc + r.time, 0) / results.length;

      expect(successCount).toBe(15); // All should succeed
      expect(avgTime).toBeLessThan(10000); // Average under 10 seconds

      console.log(`\n✅ Concurrent journeys: ${successCount}/15 successful`);
      console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
    });
  });

  // Helper functions
  function generateTestStatements(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      text: `Statement ${i + 1}: Test statement for smoke testing`,
    }));
  }

  function generateTestParticipants(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `participant-${i + 1}`,
      email: `participant${i + 1}@test.com`,
      invitationSent: false,
    }));
  }

  function generateTestQSorts(
    participantCount: number,
    statementCount: number,
  ): any[] {
    return Array.from({ length: participantCount }, (_, i) => ({
      participantId: `participant-${i + 1}`,
      sortData: generateParticipantQSort(statementCount),
      completedAt: new Date(),
    }));
  }

  function generateParticipantQSort(statementCount: number): any {
    const sort: { [key: number]: number } = {};
    const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const frequency = [2, 3, 4, 5, 6, 5, 4, 3, 2];

    let statementId = 1;
    for (let i = 0; i < distribution.length; i++) {
      for (let j = 0; j < frequency[i] && statementId <= statementCount; j++) {
        sort[statementId] = distribution[i];
        statementId++;
      }
    }

    return sort;
  }

  async function simulateQuickResearcherJourney(userId: string): Promise<any> {
    const startTime = performance.now();

    try {
      // Quick login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/quick-login')
        .send({ userId })
        .expect(200);

      const token = loginResponse.body.token;

      // Quick analysis
      await request(app.getHttpServer())
        .post('/api/analysis/quick-run')
        .set('Authorization', `Bearer ${token}`)
        .send({ preset: 'smoke-test' })
        .expect(200);

      return {
        success: true,
        time: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        time: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  async function simulateQuickParticipantJourney(
    participantId: string,
  ): Promise<any> {
    const startTime = performance.now();

    try {
      // Quick join
      const joinResponse = await request(app.getHttpServer())
        .post('/api/participant/quick-join')
        .send({ participantId })
        .expect(200);

      const token = joinResponse.body.token;

      // Quick sort submission
      await request(app.getHttpServer())
        .post('/api/participant/quick-sort')
        .set('Authorization', `Bearer ${token}`)
        .send({ preset: 'random' })
        .expect(200);

      return {
        success: true,
        time: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        time: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }
});
