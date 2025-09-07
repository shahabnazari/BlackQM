import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as cluster from 'cluster';
import { JwtService } from '@nestjs/jwt';
import { QAnalysisService } from '../../services/q-analysis.service';
import { FactorExtractionService } from '../../services/factor-extraction.service';
import { RotationEngineService } from '../../services/rotation-engine.service';
import { StatisticalOutputService } from '../../services/statistical-output.service';
import { PQMethodCompatibilityService } from '../../services/pqmethod-compatibility.service';
import { QMethodValidatorService } from '../../qmethod-validator.service';
import { PrismaService } from '../../../../common/prisma.service';
import { StatisticsService } from '../../services/statistics.service';
import { AnalysisLoggerService } from '../../services/analysis-logger.service';

describe('Scalability Tests - Multiple Simultaneous Analyses', () => {
  let app: INestApplication;
  let qAnalysisService: QAnalysisService;
  let jwtService: JwtService;

  // Scalability thresholds
  const SCALABILITY_METRICS = {
    SIMULTANEOUS_ANALYSES: [1, 5, 10, 20, 50, 100],
    LINEAR_SCALING_THRESHOLD: 1.2, // Max 20% deviation from linear scaling
    THROUGHPUT_MINIMUM: 10, // Minimum 10 analyses per second
    RESOURCE_EFFICIENCY: 0.8, // 80% resource utilization efficiency
    SCALE_UP_FACTOR: 4, // Should scale up to 4x load
    SCALE_OUT_FACTOR: 8, // Should scale out to 8 instances
    DEGRADATION_THRESHOLD: 0.3, // Max 30% performance degradation at peak
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        QAnalysisService,
        JwtService,
        {
          provide: FactorExtractionService,
          useValue: {
            extractFactors: jest.fn(),
            calculateEigenvalues: jest.fn(),
          },
        },
        {
          provide: RotationEngineService,
          useValue: {
            rotate: jest.fn(),
            manualRotate: jest.fn(),
          },
        },
        {
          provide: StatisticalOutputService,
          useValue: {
            generateOutputs: jest.fn(),
            calculateStatistics: jest.fn(),
          },
        },
        {
          provide: PQMethodCompatibilityService,
          useValue: {
            validate: jest.fn(),
            export: jest.fn(),
          },
        },
        {
          provide: QMethodValidatorService,
          useValue: {
            validate: jest.fn(),
            checkData: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            study: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            analysisSession: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: StatisticsService,
          useValue: {
            mean: jest.fn(),
            standardDeviation: jest.fn(),
            correlationMatrix: jest.fn(),
          },
        },
        {
          provide: AnalysisLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure for high concurrency
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Connection', 'keep-alive');
      next();
    });

    await app.init();

    qAnalysisService = moduleFixture.get<QAnalysisService>(QAnalysisService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Horizontal Scalability', () => {
    it('should scale linearly with simultaneous analyses', async () => {
      const results: any[] = [];

      for (const count of SCALABILITY_METRICS.SIMULTANEOUS_ANALYSES) {
        const tokens = generateAuthTokens(count);
        const startTime = performance.now();

        // Launch simultaneous analyses
        const promises = tokens.map(
          (token, index) => performAnalysis(token, `study-${index}`, 50), // 50 participants each
        );

        const analysisResults = await Promise.all(promises);
        const endTime = performance.now();

        const totalTime = endTime - startTime;
        const throughput = count / (totalTime / 1000); // Analyses per second
        const avgTimePerAnalysis = totalTime / count;
        const successRate =
          analysisResults.filter((r) => r.success).length / count;

        results.push({
          count,
          totalTime,
          throughput,
          avgTimePerAnalysis,
          successRate,
        });
      }

      // Check for linear scaling
      const baselineTime = results[0].avgTimePerAnalysis;
      results.forEach((r, index) => {
        if (index > 0) {
          const scalingFactor = r.avgTimePerAnalysis / baselineTime;
          expect(scalingFactor).toBeLessThan(
            SCALABILITY_METRICS.LINEAR_SCALING_THRESHOLD,
          );
        }
      });

      // Check minimum throughput
      const lastResult = results[results.length - 1];
      expect(lastResult.throughput).toBeGreaterThan(
        SCALABILITY_METRICS.THROUGHPUT_MINIMUM,
      );

      console.log('✅ Horizontal scalability results:');
      results.forEach((r) => {
        console.log(
          `   ${r.count} analyses: ${r.totalTime.toFixed(2)}ms total, ${r.throughput.toFixed(2)} analyses/sec`,
        );
      });
    });

    it('should distribute load across worker threads', async () => {
      const workerCounts = [1, 2, 4, 8];
      const results: any[] = [];
      const analysisCount = 40;

      for (const workers of workerCounts) {
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/distributed-process')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            analyses: Array.from({ length: analysisCount }, (_, i) => ({
              id: `analysis-${i}`,
              data: generateAnalysisData(50),
            })),
            workerThreads: workers,
          })
          .expect(201);

        const endTime = performance.now();
        const processingTime = endTime - startTime;
        const speedup = results[0]?.processingTime / processingTime || 1;

        results.push({
          workers,
          processingTime,
          speedup,
          efficiency: speedup / workers,
          throughput: analysisCount / (processingTime / 1000),
        });
      }

      // Check scaling efficiency
      results.forEach((r, index) => {
        if (index > 0) {
          expect(r.efficiency).toBeGreaterThan(
            SCALABILITY_METRICS.RESOURCE_EFFICIENCY * 0.7,
          );
        }
      });

      console.log('✅ Worker thread distribution:');
      results.forEach((r) => {
        console.log(
          `   ${r.workers} workers: ${r.processingTime.toFixed(2)}ms, ${r.speedup.toFixed(2)}x speedup, ${(r.efficiency * 100).toFixed(2)}% efficiency`,
        );
      });
    });

    it('should handle mixed workload sizes efficiently', async () => {
      const workloads = [
        { name: 'small', participants: 20, count: 50 },
        { name: 'medium', participants: 100, count: 20 },
        { name: 'large', participants: 500, count: 5 },
        { name: 'mixed', sizes: [20, 100, 500], count: 25 },
      ];

      const results: any[] = [];

      for (const workload of workloads) {
        const startTime = performance.now();
        const promises: Promise<any>[] = [];

        if (workload.name === 'mixed') {
          for (let i = 0; i < workload.count; i++) {
            const size = workload.sizes![i % workload.sizes!.length];
            promises.push(
              performAnalysis(generateAuthToken(), `mixed-${i}`, size),
            );
          }
        } else {
          for (let i = 0; i < workload.count; i++) {
            promises.push(
              performAnalysis(
                generateAuthToken(),
                `${workload.name}-${i}`,
                workload.participants || 30,
              ),
            );
          }
        }

        const analysisResults = await Promise.all(promises);
        const endTime = performance.now();

        const totalTime = endTime - startTime;
        const successCount = analysisResults.filter((r) => r.success).length;
        const totalParticipants =
          workload.name === 'mixed'
            ? workload.sizes!.reduce(
                (acc, size) =>
                  acc +
                  size * Math.ceil(workload.count / workload.sizes!.length),
                0,
              )
            : (workload.participants || 30) * workload.count;

        results.push({
          workload: workload.name,
          totalTime,
          analysisCount: workload.count,
          successRate: successCount / workload.count,
          participantsPerSecond: totalParticipants / (totalTime / 1000),
        });
      }

      // All workloads should complete successfully
      results.forEach((r) => {
        expect(r.successRate).toBeGreaterThan(0.95);
      });

      console.log('✅ Mixed workload scalability:');
      results.forEach((r) => {
        console.log(
          `   ${r.workload}: ${r.totalTime.toFixed(2)}ms, ${r.participantsPerSecond.toFixed(2)} participants/sec`,
        );
      });
    });
  });

  describe('Vertical Scalability', () => {
    it('should scale with increased resources', async () => {
      const resourceConfigs = [
        { name: 'baseline', memoryMB: 512, cpuCores: 1 },
        { name: 'scaled-2x', memoryMB: 1024, cpuCores: 2 },
        { name: 'scaled-4x', memoryMB: 2048, cpuCores: 4 },
        { name: 'scaled-8x', memoryMB: 4096, cpuCores: 8 },
      ];

      const results: any[] = [];
      const testLoad = 100; // Number of analyses

      for (const config of resourceConfigs) {
        // Simulate resource constraints (in real tests, this would be done via container limits)
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/resource-constrained')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            analysisCount: testLoad,
            resourceLimit: config,
            dataSize: 100, // 100 participants per analysis
          })
          .expect(201);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        results.push({
          config: config.name,
          processingTime,
          throughput: testLoad / (processingTime / 1000),
          resourceUtilization: response.body.resourceUtilization,
        });
      }

      // Check that performance scales with resources
      const baselineThroughput = results[0].throughput;
      expect(results[1].throughput).toBeGreaterThan(baselineThroughput * 1.7); // 2x resources
      expect(results[2].throughput).toBeGreaterThan(baselineThroughput * 3.2); // 4x resources

      console.log('✅ Vertical scaling results:');
      results.forEach((r) => {
        console.log(`   ${r.config}: ${r.throughput.toFixed(2)} analyses/sec`);
      });
    });

    it('should utilize multi-core CPUs effectively', async () => {
      const cpuCount = os.cpus().length;
      const coreUtilizations = [1, Math.floor(cpuCount / 2), cpuCount];
      const results: any[] = [];

      for (const cores of coreUtilizations) {
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/cpu-intensive')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            operations: 50,
            complexity: 'high',
            maxCores: cores,
            matrixSize: 200,
          })
          .expect(201);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        results.push({
          cores,
          processingTime,
          speedup: results[0]?.processingTime / processingTime || 1,
          efficiency: response.body.cpuEfficiency,
        });
      }

      // Check CPU scaling efficiency
      const lastResult = results[results.length - 1];
      expect(lastResult.speedup).toBeGreaterThan(cpuCount * 0.6); // At least 60% efficiency

      console.log(`✅ CPU scaling (${cpuCount} cores available):`);
      results.forEach((r) => {
        console.log(
          `   ${r.cores} cores: ${r.processingTime.toFixed(2)}ms, ${r.speedup.toFixed(2)}x speedup`,
        );
      });
    });
  });

  describe('Auto-Scaling Behavior', () => {
    it('should scale up under increasing load', async () => {
      const loadPattern = [10, 20, 50, 100, 50, 20, 10]; // Ramp up and down
      const results: any[] = [];

      for (const load of loadPattern) {
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/auto-scale-test')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            concurrentRequests: load,
            duration: 2000, // 2 seconds per load level
          })
          .expect(201);

        const endTime = performance.now();

        results.push({
          load,
          responseTime: endTime - startTime,
          instancesActive: response.body.instancesActive,
          avgResponseTime: response.body.avgResponseTime,
          successRate: response.body.successRate,
        });
      }

      // Check that instances scale with load
      const peakLoad = results.find((r) => r.load === 100);
      const lowLoad = results.find((r) => r.load === 10);

      expect(peakLoad.instancesActive).toBeGreaterThan(lowLoad.instancesActive);
      expect(peakLoad.avgResponseTime).toBeLessThan(1000); // Still responsive at peak

      console.log('✅ Auto-scaling behavior:');
      results.forEach((r) => {
        console.log(
          `   Load ${r.load}: ${r.instancesActive} instances, ${r.avgResponseTime.toFixed(2)}ms avg response`,
        );
      });
    });

    it('should handle sudden traffic spikes', async () => {
      const spikePattern = [
        { duration: 2000, load: 10 }, // Normal
        { duration: 1000, load: 200 }, // Sudden spike
        { duration: 2000, load: 10 }, // Return to normal
      ];

      const results: any[] = [];

      for (const phase of spikePattern) {
        const phaseStart = performance.now();
        const phaseMetrics: any[] = [];

        while (performance.now() - phaseStart < phase.duration) {
          const batchStart = performance.now();

          const promises = Array.from({ length: phase.load }, () =>
            request(app.getHttpServer())
              .post('/api/analysis/quick-analysis')
              .set('Authorization', `Bearer ${generateAuthToken()}`)
              .send({ data: generateSmallDataset() }),
          );

          const responses = await Promise.all(
            promises.map((p) => p.catch((e) => ({ error: e }))),
          );
          const successCount = responses.filter((r) => !r.error).length;

          phaseMetrics.push({
            responseTime: performance.now() - batchStart,
            successRate: successCount / phase.load,
          });

          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const avgResponseTime =
          phaseMetrics.reduce((acc, m) => acc + m.responseTime, 0) /
          phaseMetrics.length;
        const avgSuccessRate =
          phaseMetrics.reduce((acc, m) => acc + m.successRate, 0) /
          phaseMetrics.length;

        results.push({
          load: phase.load,
          avgResponseTime,
          avgSuccessRate,
          samples: phaseMetrics.length,
        });
      }

      // System should handle spike without complete failure
      const spikeResult = results.find((r) => r.load === 200);
      expect(spikeResult.avgSuccessRate).toBeGreaterThan(0.7); // At least 70% success during spike

      console.log('✅ Traffic spike handling:');
      results.forEach((r) => {
        console.log(
          `   Load ${r.load}: ${r.avgResponseTime.toFixed(2)}ms, ${(r.avgSuccessRate * 100).toFixed(2)}% success`,
        );
      });
    });
  });

  describe('Database Connection Scalability', () => {
    it('should scale database connections efficiently', async () => {
      const connectionTests = [10, 50, 100, 200];
      const results: any[] = [];

      for (const connections of connectionTests) {
        const startTime = performance.now();

        const promises = Array.from({ length: connections }, (_, i) =>
          request(app.getHttpServer())
            .post('/api/analysis/db-query')
            .set('Authorization', `Bearer ${generateAuthToken()}`)
            .send({
              queryId: `query-${i}`,
              complexity: 'medium',
            }),
        );

        const responses = await Promise.all(
          promises.map((p) => p.catch((e) => ({ error: e }))),
        );
        const endTime = performance.now();

        const successCount = responses.filter((r) => !r.error).length;
        const avgTime = (endTime - startTime) / connections;

        results.push({
          connections,
          totalTime: endTime - startTime,
          avgTime,
          successRate: successCount / connections,
        });
      }

      // Check that connection pooling is effective
      results.forEach((r) => {
        expect(r.successRate).toBeGreaterThan(0.95);
        expect(r.avgTime).toBeLessThan(500); // Each query under 500ms average
      });

      console.log('✅ Database connection scalability:');
      results.forEach((r) => {
        console.log(
          `   ${r.connections} connections: ${r.avgTime.toFixed(2)}ms avg, ${(r.successRate * 100).toFixed(2)}% success`,
        );
      });
    });

    it('should handle connection pool exhaustion gracefully', async () => {
      const poolSize = 20; // Typical pool size
      const requestCount = 100; // Much more than pool size

      const startTime = performance.now();

      const promises = Array.from({ length: requestCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/analysis/long-db-operation')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            operationId: `op-${i}`,
            holdTime: 500, // Hold connection for 500ms
          })
          .timeout(10000),
      );

      const responses = await Promise.all(
        promises.map((p) =>
          p.catch((e) => ({
            error: e,
            timeout: e.message.includes('timeout'),
          })),
        ),
      );

      const endTime = performance.now();

      const successCount = responses.filter((r) => !r.error).length;
      const timeoutCount = responses.filter(
        (r) => 'timeout' in r && r.timeout,
      ).length;

      expect(successCount).toBeGreaterThan(poolSize); // Should process more than pool size
      expect(successCount / requestCount).toBeGreaterThan(0.8); // At least 80% success

      console.log('✅ Connection pool exhaustion handling:');
      console.log(`   Pool size: ${poolSize}`);
      console.log(`   Requests: ${requestCount}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Timeouts: ${timeoutCount}`);
      console.log(`   Total time: ${(endTime - startTime).toFixed(2)}ms`);
    });
  });

  describe('Long-Running Analysis Scalability', () => {
    it('should handle multiple long-running analyses', async () => {
      const longRunningCount = 10;
      const analysisPromises: Promise<any>[] = [];

      for (let i = 0; i < longRunningCount; i++) {
        analysisPromises.push(
          request(app.getHttpServer())
            .post('/api/analysis/long-running')
            .set('Authorization', `Bearer ${generateAuthToken()}`)
            .send({
              analysisId: `long-${i}`,
              dataSize: 1000, // Large dataset
              iterations: 100,
              method: 'iterative-refinement',
            })
            .timeout(30000), // 30 second timeout
        );
      }

      const startTime = performance.now();
      const results = await Promise.all(
        analysisPromises.map((p) =>
          p
            .then((r) => ({ success: true, data: r.body }))
            .catch((e) => ({ success: false, error: e })),
        ),
      );
      const endTime = performance.now();

      const successCount = results.filter((r) => r.success).length;
      const totalTime = endTime - startTime;
      const avgTime = totalTime / longRunningCount;

      expect(successCount).toBe(longRunningCount); // All should complete
      expect(avgTime).toBeLessThan(10000); // Average under 10 seconds

      console.log('✅ Long-running analysis scalability:');
      console.log(`   Analyses: ${longRunningCount}`);
      console.log(`   Success: ${successCount}/${longRunningCount}`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
    });

    it('should maintain responsiveness during background processing', async () => {
      // Start background analyses
      const backgroundPromises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/analysis/background-analysis')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .send({
            analysisId: `background-${i}`,
            dataSize: 5000,
            priority: 'low',
          }),
      );

      // Wait for background to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test interactive operations while background runs
      const interactiveResults: number[] = [];

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .get('/api/analysis/quick-status')
          .set('Authorization', `Bearer ${generateAuthToken()}`)
          .expect(200);

        const responseTime = performance.now() - startTime;
        interactiveResults.push(responseTime);
      }

      const avgInteractiveTime =
        interactiveResults.reduce((a, b) => a + b, 0) /
        interactiveResults.length;
      const maxInteractiveTime = Math.max(...interactiveResults);

      expect(avgInteractiveTime).toBeLessThan(100); // Interactive queries under 100ms
      expect(maxInteractiveTime).toBeLessThan(200); // Max under 200ms

      // Wait for background to complete
      await Promise.all(backgroundPromises);

      console.log('✅ Responsiveness during background processing:');
      console.log(`   Interactive avg: ${avgInteractiveTime.toFixed(2)}ms`);
      console.log(`   Interactive max: ${maxInteractiveTime.toFixed(2)}ms`);
    });
  });

  // Helper functions
  function generateAuthTokens(count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
      jwtService.sign({
        sub: `scalability-user-${i}`,
        role: 'researcher',
        sessionId: `session-${i}`,
      }),
    );
  }

  function generateAuthToken(): string {
    return jwtService.sign({
      sub: `scalability-user-${Math.random()}`,
      role: 'researcher',
    });
  }

  async function performAnalysis(
    token: string,
    studyId: string,
    participantCount: number,
  ): Promise<any> {
    try {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/full-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studyId,
          data: generateAnalysisData(participantCount),
          extractFactors: true,
          rotate: true,
        })
        .timeout(15000);

      return {
        success: true,
        studyId,
        processingTime: response.body.processingTime,
      };
    } catch (error) {
      return {
        success: false,
        studyId,
        error: (error as Error).message,
      };
    }
  }

  function generateAnalysisData(participantCount: number): any {
    return {
      participants: participantCount,
      statements: 40,
      qSorts: Array.from({ length: participantCount }, (_, i) => ({
        participantId: `p-${i}`,
        sorts: Array.from(
          { length: 40 },
          () => Math.floor(Math.random() * 9) - 4,
        ),
      })),
    };
  }

  function generateSmallDataset(): any {
    return {
      matrix: Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => Math.random()),
      ),
    };
  }
});
