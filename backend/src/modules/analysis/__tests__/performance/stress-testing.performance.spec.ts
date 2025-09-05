import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { JwtService } from '@nestjs/jwt';
import { QAnalysisService } from '../../services/q-analysis.service';
import * as os from 'os';

describe('Stress Testing - Large Datasets & Concurrent Users', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Stress test parameters
  const STRESS_TEST_CONFIG = {
    CONCURRENT_USERS: [10, 50, 100, 200, 500],
    DATASET_SIZES: [100, 500, 1000, 5000, 10000],
    MAX_RESPONSE_TIME: 5000, // 5 seconds max per request
    SUCCESS_RATE_THRESHOLD: 0.95, // 95% success rate required
    CPU_THRESHOLD: 0.9, // 90% CPU usage threshold
    MEMORY_THRESHOLD: 0.85, // 85% memory usage threshold
    TEST_DURATION: 60000, // 1 minute sustained load
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [QAnalysisService, JwtService],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure for high concurrency
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=120');
      next();
    });

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Concurrent User Stress Tests', () => {
    it('should handle 100 concurrent users analyzing data', async () => {
      const concurrentUsers = 100;
      const tokens = generateUserTokens(concurrentUsers);
      const results: any[] = [];

      const promises = tokens.map((token, index) =>
        performUserAnalysis(token, index, results),
      );

      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successCount = results.filter((r) => r.success).length;
      const successRate = successCount / concurrentUsers;
      const avgResponseTime =
        results.reduce((acc, r) => acc + r.responseTime, 0) / results.length;

      expect(successRate).toBeGreaterThanOrEqual(
        STRESS_TEST_CONFIG.SUCCESS_RATE_THRESHOLD,
      );
      expect(avgResponseTime).toBeLessThan(
        STRESS_TEST_CONFIG.MAX_RESPONSE_TIME,
      );

      console.log(`✅ Handled ${concurrentUsers} concurrent users:`);
      console.log(`   Success rate: ${(successRate * 100).toFixed(2)}%`);
      console.log(`   Avg response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    });

    it('should handle 500 concurrent WebSocket connections', async () => {
      const WebSocket = require('ws');
      const connections: any[] = [];
      const connectionMetrics: any[] = [];

      const startTime = performance.now();

      // Create 500 WebSocket connections
      const connectionPromises = Array.from({ length: 500 }, (_, i) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(
            `ws://localhost:${app.getHttpServer().address().port}`,
          );

          ws.on('open', () => {
            connections.push(ws);
            connectionMetrics.push({
              id: i,
              connected: true,
              connectionTime: performance.now() - startTime,
            });
            resolve(ws);
          });

          ws.on('error', (error: any) => {
            connectionMetrics.push({
              id: i,
              connected: false,
              error: (error as Error).message,
            });
            reject(error);
          });

          // Set timeout for connection
          setTimeout(() => {
            if (!connectionMetrics.find((m) => m.id === i)) {
              reject(new Error('Connection timeout'));
            }
          }, 10000);
        });
      });

      const connectedSockets = await Promise.allSettled(connectionPromises);
      const successfulConnections = connectedSockets.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const connectionRate = successfulConnections / 500;

      expect(connectionRate).toBeGreaterThanOrEqual(0.9); // 90% connection success

      // Test message broadcasting
      const messagePromises = connections.map((ws, index) => {
        return new Promise((resolve) => {
          const startMsg = performance.now();

          ws.on('message', (data: any) => {
            resolve({
              id: index,
              latency: performance.now() - startMsg,
            });
          });

          ws.send(JSON.stringify({ type: 'analysis', data: { value: index } }));
        });
      });

      const messageResults = await Promise.all(messagePromises);
      const avgLatency =
        messageResults.reduce((acc: number, r: any) => acc + r.latency, 0) /
        messageResults.length;

      expect(avgLatency).toBeLessThan(100); // Average latency under 100ms

      // Cleanup connections
      connections.forEach((ws) => ws.close());

      console.log(
        `✅ WebSocket stress test: ${successfulConnections}/500 connected`,
      );
      console.log(`   Average message latency: ${avgLatency.toFixed(2)}ms`);
    });

    it('should maintain performance under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestsPerSecond = 50;
      const metrics: any[] = [];

      const startTime = performance.now();
      const endTime = startTime + testDuration;

      while (performance.now() < endTime) {
        const batchPromises = Array.from({ length: requestsPerSecond }, () => {
          const reqStart = performance.now();

          return request(app.getHttpServer())
            .post('/api/analysis/quick-process')
            .send({
              data: generateSmallDataset(),
            })
            .then((res) => ({
              success: res.status === 200 || res.status === 201,
              responseTime: performance.now() - reqStart,
              timestamp: performance.now() - startTime,
            }))
            .catch(() => ({
              success: false,
              responseTime: performance.now() - reqStart,
              timestamp: performance.now() - startTime,
            }));
        });

        const batchResults = await Promise.all(batchPromises);
        metrics.push(...batchResults);

        // Wait for next second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Analyze metrics over time
      const windows = [];
      for (let i = 0; i < testDuration; i += 5000) {
        // 5-second windows
        const windowMetrics = metrics.filter(
          (m) => m.timestamp >= i && m.timestamp < i + 5000,
        );

        if (windowMetrics.length > 0) {
          windows.push({
            time: i / 1000,
            successRate:
              windowMetrics.filter((m) => m.success).length /
              windowMetrics.length,
            avgResponseTime:
              windowMetrics.reduce((acc, m) => acc + m.responseTime, 0) /
              windowMetrics.length,
          });
        }
      }

      // Check that performance doesn't degrade over time
      const firstWindow = windows[0];
      const lastWindow = windows[windows.length - 1];

      const degradation =
        (lastWindow.avgResponseTime - firstWindow.avgResponseTime) /
        firstWindow.avgResponseTime;

      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
      expect(lastWindow.successRate).toBeGreaterThan(0.9); // Still >90% success at end

      console.log('✅ Sustained load test results:');
      windows.forEach((w) => {
        console.log(
          `   ${w.time}s: ${(w.successRate * 100).toFixed(2)}% success, ${w.avgResponseTime.toFixed(2)}ms avg`,
        );
      });
    });
  });

  describe('Large Dataset Stress Tests', () => {
    it('should process increasingly large datasets', async () => {
      const datasetSizes = [100, 500, 1000, 2000, 5000];
      const results: any[] = [];

      for (const size of datasetSizes) {
        const dataset = generateLargeDataset(size);

        const startTime = performance.now();

        try {
          const response = await request(app.getHttpServer())
            .post('/api/analysis/process-large')
            .send({
              dataset: dataset,
              size: size,
            })
            .timeout(30000) // 30 second timeout
            .expect(201);

          const endTime = performance.now();

          results.push({
            size,
            success: true,
            processingTime: endTime - startTime,
            throughput: size / ((endTime - startTime) / 1000), // Items per second
          });
        } catch (error) {
          results.push({
            size,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      // Verify scaling behavior
      const successfulResults = results.filter((r) => r.success);
      expect(successfulResults.length).toBeGreaterThanOrEqual(4); // At least 4 out of 5 successful

      console.log('✅ Large dataset processing:');
      results.forEach((r) => {
        if (r.success) {
          console.log(
            `   ${r.size} items: ${r.processingTime.toFixed(2)}ms (${r.throughput.toFixed(2)} items/sec)`,
          );
        } else {
          console.log(`   ${r.size} items: FAILED - ${r.error}`);
        }
      });
    });

    it('should handle mixed workload patterns', async () => {
      const workloadPatterns = [
        { type: 'small-frequent', size: 10, count: 100, interval: 10 },
        { type: 'medium-periodic', size: 100, count: 20, interval: 500 },
        { type: 'large-burst', size: 1000, count: 5, interval: 0 },
        { type: 'mixed', sizes: [10, 100, 500], count: 30, interval: 100 },
      ];

      const patternResults: any[] = [];

      for (const pattern of workloadPatterns) {
        const startTime = performance.now();
        const requests: any[] = [];

        if (pattern.type === 'mixed') {
          for (let i = 0; i < pattern.count; i++) {
            const size = pattern.sizes![i % pattern.sizes!.length];
            requests.push(processDataset(size, pattern.interval));
          }
        } else {
          for (let i = 0; i < pattern.count; i++) {
            requests.push(
              processDataset(pattern.size || 100, pattern.interval),
            );
          }
        }

        const results = await Promise.all(requests);
        const endTime = performance.now();

        const successCount = results.filter((r) => r.success).length;
        const avgResponseTime =
          results.reduce((acc, r) => acc + r.time, 0) / results.length;

        patternResults.push({
          pattern: pattern.type,
          totalTime: endTime - startTime,
          successRate: successCount / pattern.count,
          avgResponseTime,
        });
      }

      // All patterns should maintain high success rate
      patternResults.forEach((r) => {
        expect(r.successRate).toBeGreaterThan(0.9);
        console.log(
          `   Pattern '${r.pattern}': ${(r.successRate * 100).toFixed(2)}% success, ${r.avgResponseTime.toFixed(2)}ms avg`,
        );
      });
    });
  });

  describe('Resource Utilization Under Stress', () => {
    it('should monitor CPU usage during high load', async () => {
      const cpuMetrics: number[] = [];
      const loadDuration = 10000; // 10 seconds

      // Start monitoring CPU
      const monitorInterval = setInterval(() => {
        const cpus = os.cpus();
        const totalUsage =
          cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            return acc + (1 - idle / total);
          }, 0) / cpus.length;

        cpuMetrics.push(totalUsage);
      }, 100); // Sample every 100ms

      // Generate load
      const loadPromises = Array.from({ length: 200 }, () =>
        request(app.getHttpServer())
          .post('/api/analysis/cpu-intensive')
          .send({
            matrix: generateCorrelationMatrix(200),
            iterations: 1000,
          }),
      );

      await Promise.all(loadPromises);
      clearInterval(monitorInterval);

      const avgCpu = cpuMetrics.reduce((a, b) => a + b, 0) / cpuMetrics.length;
      const maxCpu = Math.max(...cpuMetrics);

      expect(maxCpu).toBeLessThan(STRESS_TEST_CONFIG.CPU_THRESHOLD);

      console.log(`✅ CPU usage under load:`);
      console.log(`   Average: ${(avgCpu * 100).toFixed(2)}%`);
      console.log(`   Peak: ${(maxCpu * 100).toFixed(2)}%`);
    });

    it('should handle database connection pool exhaustion', async () => {
      const connectionRequests = 200; // More than typical pool size
      const results: any[] = [];

      const promises = Array.from({ length: connectionRequests }, (_, i) => {
        const startTime = performance.now();

        return request(app.getHttpServer())
          .post('/api/analysis/db-intensive')
          .send({
            operation: 'complex-query',
            studyId: `stress-test-${i}`,
          })
          .then((res) => ({
            id: i,
            success: true,
            time: performance.now() - startTime,
            poolWaitTime: res.body.poolWaitTime,
          }))
          .catch((err) => ({
            id: i,
            success: false,
            error: err.message,
          }));
      });

      const queryResults = await Promise.all(promises);
      const successfulQueries = queryResults.filter((r) => r.success);
      const avgWaitTime =
        successfulQueries.reduce(
          (acc, r: any) => acc + (r.poolWaitTime || 0),
          0,
        ) / successfulQueries.length;

      expect(successfulQueries.length / connectionRequests).toBeGreaterThan(
        0.95,
      );
      expect(avgWaitTime).toBeLessThan(1000); // Average pool wait under 1 second

      console.log(
        `✅ Database pool stress: ${successfulQueries.length}/${connectionRequests} successful`,
      );
      console.log(`   Average pool wait: ${avgWaitTime.toFixed(2)}ms`);
    });

    it('should recover gracefully from overload conditions', async () => {
      const phases = [
        { name: 'normal', load: 10, duration: 5000 },
        { name: 'spike', load: 500, duration: 5000 },
        { name: 'recovery', load: 10, duration: 5000 },
      ];

      const phaseMetrics: any[] = [];

      for (const phase of phases) {
        const phaseStart = performance.now();
        const metrics: any[] = [];

        while (performance.now() - phaseStart < phase.duration) {
          const batchPromises = Array.from({ length: phase.load }, () => {
            const reqStart = performance.now();

            return request(app.getHttpServer())
              .post('/api/analysis/health-check')
              .send({ timestamp: reqStart })
              .then((res) => ({
                success: true,
                responseTime: performance.now() - reqStart,
              }))
              .catch(() => ({
                success: false,
                responseTime: performance.now() - reqStart,
              }));
          });

          const results = await Promise.all(batchPromises);
          metrics.push(...results);

          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const successRate =
          metrics.filter((m) => m.success).length / metrics.length;
        const avgResponseTime =
          metrics.reduce((acc, m) => acc + m.responseTime, 0) / metrics.length;

        phaseMetrics.push({
          phase: phase.name,
          successRate,
          avgResponseTime,
          totalRequests: metrics.length,
        });
      }

      // Check recovery behavior
      const normalPhase = phaseMetrics.find((p) => p.phase === 'normal');
      const spikePhase = phaseMetrics.find((p) => p.phase === 'spike');
      const recoveryPhase = phaseMetrics.find((p) => p.phase === 'recovery');

      expect(recoveryPhase.successRate).toBeGreaterThan(spikePhase.successRate);
      expect(recoveryPhase.avgResponseTime).toBeLessThan(
        spikePhase.avgResponseTime * 2,
      );

      console.log('✅ Overload recovery test:');
      phaseMetrics.forEach((p) => {
        console.log(
          `   ${p.phase}: ${(p.successRate * 100).toFixed(2)}% success, ${p.avgResponseTime.toFixed(2)}ms avg`,
        );
      });
    });
  });

  describe('Edge Case Stress Scenarios', () => {
    it('should handle rapid connection churn', async () => {
      const churnDuration = 10000; // 10 seconds
      const connectionsPerSecond = 50;
      let totalConnections = 0;
      let successfulConnections = 0;

      const startTime = performance.now();

      while (performance.now() - startTime < churnDuration) {
        const connectionPromises = Array.from(
          { length: connectionsPerSecond },
          async () => {
            totalConnections++;

            try {
              const response = await request(app.getHttpServer())
                .get('/api/analysis/ping')
                .timeout(1000);

              if (response.status === 200) {
                successfulConnections++;
              }

              // Immediately close connection
              return true;
            } catch {
              return false;
            }
          },
        );

        await Promise.all(connectionPromises);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const successRate = successfulConnections / totalConnections;
      expect(successRate).toBeGreaterThan(0.9);

      console.log(
        `✅ Connection churn test: ${successfulConnections}/${totalConnections} successful`,
      );
      console.log(
        `   Rate: ${(totalConnections / (churnDuration / 1000)).toFixed(2)} connections/sec`,
      );
    });

    it('should handle memory pressure scenarios', async () => {
      const memoryIntensiveTasks = [
        { size: 100, count: 10 },
        { size: 500, count: 5 },
        { size: 1000, count: 2 },
      ];

      const initialMemory = process.memoryUsage();
      const memorySnapshots: any[] = [];

      for (const task of memoryIntensiveTasks) {
        const promises = Array.from({ length: task.count }, () =>
          request(app.getHttpServer())
            .post('/api/analysis/memory-intensive')
            .send({
              matrixSize: task.size,
              holdTime: 1000, // Hold data in memory for 1 second
            }),
        );

        await Promise.all(promises);

        const currentMemory = process.memoryUsage();
        memorySnapshots.push({
          task: `${task.size}x${task.count}`,
          heapUsed:
            (currentMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024, // MB
          external:
            (currentMemory.external - initialMemory.external) / 1024 / 1024,
        });

        // Allow garbage collection
        if (global.gc) {
          global.gc();
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Check memory is released after tasks
      const finalMemory = process.memoryUsage();
      const memoryGrowth =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(memoryGrowth).toBeLessThan(100); // Less than 100MB growth after cleanup

      console.log('✅ Memory pressure test:');
      memorySnapshots.forEach((s) => {
        console.log(
          `   Task ${s.task}: ${s.heapUsed.toFixed(2)}MB heap, ${s.external.toFixed(2)}MB external`,
        );
      });
      console.log(`   Final memory growth: ${memoryGrowth.toFixed(2)}MB`);
    });
  });

  // Helper functions
  function generateUserTokens(count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
      jwtService.sign({
        sub: `stress-user-${i}`,
        role: 'researcher',
        sessionId: `session-${i}`,
      }),
    );
  }

  async function performUserAnalysis(
    token: string,
    userId: number,
    results: any[],
  ): Promise<void> {
    const startTime = performance.now();

    try {
      await request(app.getHttpServer())
        .post('/api/analysis/user-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: userId,
          data: generateSmallDataset(),
        })
        .expect(201);

      results.push({
        userId,
        success: true,
        responseTime: performance.now() - startTime,
      });
    } catch (error) {
      results.push({
        userId,
        success: false,
        responseTime: performance.now() - startTime,
        error: error.message,
      });
    }
  }

  function generateSmallDataset(): any {
    return {
      correlationMatrix: generateCorrelationMatrix(20),
      statements: Array.from({ length: 20 }, (_, i) => `Statement ${i + 1}`),
    };
  }

  function generateLargeDataset(size: number): any {
    return {
      participants: Array.from({ length: size }, (_, i) => ({
        id: `p-${i}`,
        sorts: Array.from(
          { length: 40 },
          () => Math.floor(Math.random() * 9) - 4,
        ),
      })),
      statements: Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        text: `Statement ${i + 1}`,
      })),
    };
  }

  function generateCorrelationMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (j < i) {
          matrix[i][j] = matrix[j][i];
        } else {
          matrix[i][j] = Math.random() * 0.8 - 0.4;
        }
      }
    }
    return matrix;
  }

  async function processDataset(size: number, interval: number): Promise<any> {
    if (interval > 0) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    const startTime = performance.now();

    try {
      await request(app.getHttpServer())
        .post('/api/analysis/process')
        .send({
          data: generateSmallDataset(),
          size: size,
        })
        .expect(201);

      return {
        success: true,
        time: performance.now() - startTime,
      };
    } catch {
      return {
        success: false,
        time: performance.now() - startTime,
      };
    }
  }
});
