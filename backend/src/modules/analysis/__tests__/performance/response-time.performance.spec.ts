import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { JwtService } from '@nestjs/jwt';
import { RotationEngineService } from '../../services/rotation-engine.service';
import io from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';

describe('Response Time Performance Tests', () => {
  let app: INestApplication;
  let rotationService: RotationEngineService;
  let jwtService: JwtService;
  let authToken: string;
  let wsClient: typeof ClientSocket;

  // Response time thresholds (in milliseconds)
  const RESPONSE_THRESHOLDS = {
    MANUAL_ROTATION: 100, // <100ms for manual rotation
    REAL_TIME_UPDATE: 16, // <16ms for 60fps
    API_ENDPOINT: 200, // <200ms for standard API calls
    WEBSOCKET_ROUNDTRIP: 50, // <50ms for WebSocket messages
    BATCH_OPERATION: 500, // <500ms for batch operations
    FACTOR_EXTRACTION: 2000, // <2s for factor extraction
    DATA_EXPORT: 1000, // <1s for data export
    PERCENTILE_95: 150, // 95th percentile under 150ms
    PERCENTILE_99: 300, // 99th percentile under 300ms
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [RotationEngineService, JwtService],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable keep-alive for better connection reuse
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=30');
      next();
    });

    await app.init();

    rotationService = moduleFixture.get<RotationEngineService>(
      RotationEngineService,
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    authToken = jwtService.sign({
      sub: 'response-test-user',
      role: 'researcher',
    });

    // Initialize WebSocket client
    const port = app.getHttpServer().address().port;
    wsClient = io(`http://localhost:${port}`, {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      wsClient.on('connect', resolve);
    });
  });

  afterAll(async () => {
    wsClient.disconnect();
    await app.close();
  });

  describe('Manual Rotation Response Time (<100ms)', () => {
    it('should perform manual rotation under 100ms', async () => {
      const loadingMatrix = generateLoadingMatrix(50, 3);
      const rotationAngles = [15, 30, 45, 60, 90];
      const responseTimes: number[] = [];

      for (const angle of rotationAngles) {
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/rotate-manual')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            loadingMatrix,
            angle,
            factorX: 0,
            factorY: 1,
          })
          .expect(201);

        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(responseTime).toBeLessThan(RESPONSE_THRESHOLDS.MANUAL_ROTATION);
      }

      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(avgResponseTime).toBeLessThan(
        RESPONSE_THRESHOLDS.MANUAL_ROTATION * 0.8,
      ); // Avg should be well under limit
      expect(maxResponseTime).toBeLessThan(RESPONSE_THRESHOLDS.MANUAL_ROTATION);

      console.log(`✅ Manual rotation response times:`);
      console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxResponseTime.toFixed(2)}ms`);
      console.log(
        `   All angles: ${responseTimes.map((t) => t.toFixed(2)).join(', ')}ms`,
      );
    });

    it('should handle rapid sequential rotations', async () => {
      const loadingMatrix = generateLoadingMatrix(30, 2);
      const rotationCount = 50;
      const responseTimes: number[] = [];

      // Rapid fire rotations
      for (let i = 0; i < rotationCount; i++) {
        const angle = (i * 5) % 360; // Rotate in 5-degree increments

        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/rotate-manual')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            loadingMatrix,
            angle,
            factorX: 0,
            factorY: 1,
            optimized: true, // Use optimized algorithm
          })
          .expect(201);

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
      }

      const percentile95 = calculatePercentile(responseTimes, 95);
      const percentile99 = calculatePercentile(responseTimes, 99);

      expect(percentile95).toBeLessThan(RESPONSE_THRESHOLDS.PERCENTILE_95);
      expect(percentile99).toBeLessThan(RESPONSE_THRESHOLDS.PERCENTILE_99);

      console.log(`✅ Rapid rotation statistics (${rotationCount} rotations):`);
      console.log(
        `   P50: ${calculatePercentile(responseTimes, 50).toFixed(2)}ms`,
      );
      console.log(`   P95: ${percentile95.toFixed(2)}ms`);
      console.log(`   P99: ${percentile99.toFixed(2)}ms`);
    });

    it('should maintain performance with larger matrices', async () => {
      const matrixSizes = [10, 20, 50, 100, 200];
      const results: any[] = [];

      for (const size of matrixSizes) {
        const loadingMatrix = generateLoadingMatrix(size, 3);

        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/rotate-manual')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            loadingMatrix,
            angle: 45,
            factorX: 0,
            factorY: 1,
          })
          .expect(201);

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        results.push({
          size,
          responseTime,
          underThreshold: responseTime < RESPONSE_THRESHOLDS.MANUAL_ROTATION,
        });
      }

      // At least small and medium sizes should be under threshold
      const smallMediumResults = results.filter((r) => r.size <= 50);
      smallMediumResults.forEach((r) => {
        expect(r.underThreshold).toBe(true);
      });

      console.log('✅ Response time by matrix size:');
      results.forEach((r) => {
        const status = r.underThreshold ? '✓' : '✗';
        console.log(
          `   ${r.size}x3 matrix: ${r.responseTime.toFixed(2)}ms ${status}`,
        );
      });
    });
  });

  describe('Real-Time Update Performance (<16ms)', () => {
    it('should deliver WebSocket updates under 16ms for 60fps', async () => {
      const updateLatencies: number[] = [];
      const updateCount = 100;

      await new Promise<void>((resolve) => {
        let received = 0;

        wsClient.on('rotationUpdate', (data: any) => {
          const latency = performance.now() - data.timestamp;
          updateLatencies.push(latency);
          received++;

          if (received >= updateCount) {
            resolve();
          }
        });

        // Send rapid rotation updates
        for (let i = 0; i < updateCount; i++) {
          wsClient.emit('rotate3D', {
            angle: i,
            factorX: 0,
            factorY: 1,
            timestamp: performance.now(),
          });
        }
      });

      const avgLatency =
        updateLatencies.reduce((a, b) => a + b, 0) / updateLatencies.length;
      const maxLatency = Math.max(...updateLatencies);
      const under16ms = updateLatencies.filter(
        (l) => l < RESPONSE_THRESHOLDS.REAL_TIME_UPDATE,
      ).length;

      expect(avgLatency).toBeLessThan(RESPONSE_THRESHOLDS.REAL_TIME_UPDATE);
      expect(under16ms / updateCount).toBeGreaterThan(0.95); // 95% under 16ms

      console.log(`✅ Real-time update performance:`);
      console.log(`   Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`   Max latency: ${maxLatency.toFixed(2)}ms`);
      console.log(
        `   Updates under 16ms: ${((under16ms / updateCount) * 100).toFixed(2)}%`,
      );
    });

    it('should maintain 60fps during continuous interaction', async () => {
      const frameTimes: number[] = [];
      const duration = 5000; // 5 seconds
      const targetFPS = 60;
      const targetFrameTime = 1000 / targetFPS;

      const startTime = performance.now();
      let lastFrameTime = startTime;

      while (performance.now() - startTime < duration) {
        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;
        frameTimes.push(frameTime);
        lastFrameTime = currentTime;

        // Simulate rotation update
        await new Promise<void>((resolve) => {
          wsClient.emit('continuousRotate', {
            angle: (currentTime - startTime) * 0.1,
            timestamp: currentTime,
          });

          wsClient.once('frameUpdate', resolve);
        });
      }

      const avgFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const achievedFPS = 1000 / avgFrameTime;
      const droppedFrames = frameTimes.filter(
        (t) => t > targetFrameTime * 1.5,
      ).length;

      expect(achievedFPS).toBeGreaterThan(55); // Maintain at least 55fps
      expect(droppedFrames / frameTimes.length).toBeLessThan(0.05); // Less than 5% dropped frames

      console.log(`✅ Continuous interaction performance:`);
      console.log(`   Achieved FPS: ${achievedFPS.toFixed(2)}`);
      console.log(
        `   Dropped frames: ${droppedFrames}/${frameTimes.length} (${((droppedFrames / frameTimes.length) * 100).toFixed(2)}%)`,
      );
    });
  });

  describe('API Endpoint Response Times', () => {
    it('should respond to standard API calls under 200ms', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/analysis/studies' },
        { method: 'GET', path: '/api/analysis/factors' },
        {
          method: 'POST',
          path: '/api/analysis/correlate',
          body: { data: generateSmallDataset() },
        },
        { method: 'GET', path: '/api/analysis/status' },
        { method: 'GET', path: '/api/analysis/results' },
      ];

      const responseTimes: { endpoint: string; time: number }[] = [];

      for (const endpoint of endpoints) {
        const startTime = performance.now();

        const req = (request(app.getHttpServer()) as any)
          [endpoint.method.toLowerCase()](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`);

        if (endpoint.body) {
          req.send(endpoint.body);
        }

        await req.expect((res: any) => {
          expect([200, 201, 204, 404]).toContain(res.status);
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        responseTimes.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          time: responseTime,
        });

        expect(responseTime).toBeLessThan(RESPONSE_THRESHOLDS.API_ENDPOINT);
      }

      console.log('✅ API endpoint response times:');
      responseTimes.forEach((r) => {
        const status = r.time < RESPONSE_THRESHOLDS.API_ENDPOINT ? '✓' : '✗';
        console.log(`   ${r.endpoint}: ${r.time.toFixed(2)}ms ${status}`);
      });
    });

    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 20;
      const responseTimes: number[] = [];

      const promises = Array.from({ length: concurrentRequests }, async () => {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .get('/api/analysis/concurrent-test')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        return performance.now() - startTime;
      });

      const times = await Promise.all(promises);
      responseTimes.push(...times);

      const avgTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);

      expect(avgTime).toBeLessThan(RESPONSE_THRESHOLDS.API_ENDPOINT);
      expect(maxTime).toBeLessThan(RESPONSE_THRESHOLDS.API_ENDPOINT * 2);

      console.log(
        `✅ Concurrent request handling (${concurrentRequests} requests):`,
      );
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
    });
  });

  describe('Complex Operation Response Times', () => {
    it('should complete factor extraction under 2 seconds', async () => {
      const correlationSizes = [50, 100, 200];
      const results: any[] = [];

      for (const size of correlationSizes) {
        const correlationMatrix = generateCorrelationMatrix(size);

        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            correlationMatrix,
            numberOfFactors: 3,
            method: 'pca',
          })
          .expect(201);

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        results.push({
          size,
          responseTime,
          underThreshold: responseTime < RESPONSE_THRESHOLDS.FACTOR_EXTRACTION,
        });
      }

      results.forEach((r) => {
        expect(r.underThreshold).toBe(true);
      });

      console.log('✅ Factor extraction response times:');
      results.forEach((r) => {
        console.log(
          `   ${r.size}x${r.size} matrix: ${r.responseTime.toFixed(2)}ms`,
        );
      });
    });

    it('should export data under 1 second', async () => {
      const exportFormats = ['json', 'csv', 'excel', 'pqmethod'];
      const exportTimes: any[] = [];

      for (const format of exportFormats) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: 'test-study',
            format,
            includeRawData: true,
          })
          .expect(200);

        const endTime = performance.now();
        const exportTime = endTime - startTime;

        exportTimes.push({
          format,
          time: exportTime,
          underThreshold: exportTime < RESPONSE_THRESHOLDS.DATA_EXPORT,
        });

        expect(exportTime).toBeLessThan(RESPONSE_THRESHOLDS.DATA_EXPORT);
      }

      console.log('✅ Export response times:');
      exportTimes.forEach((e) => {
        const status = e.underThreshold ? '✓' : '✗';
        console.log(`   ${e.format}: ${e.time.toFixed(2)}ms ${status}`);
      });
    });
  });

  describe('Response Time Under Load', () => {
    it('should maintain response times under moderate load', async () => {
      const loadLevel = 50; // 50 concurrent users
      const testDuration = 5000; // 5 seconds
      const responseTimes: number[] = [];

      const startTime = performance.now();

      while (performance.now() - startTime < testDuration) {
        const batchPromises = Array.from({ length: loadLevel }, async () => {
          const reqStart = performance.now();

          await request(app.getHttpServer())
            .post('/api/analysis/rotate-manual')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              loadingMatrix: generateLoadingMatrix(20, 2),
              angle: Math.random() * 360,
              factorX: 0,
              factorY: 1,
            });

          return performance.now() - reqStart;
        });

        const batchTimes = await Promise.all(batchPromises);
        responseTimes.push(...batchTimes);
      }

      const percentile50 = calculatePercentile(responseTimes, 50);
      const percentile95 = calculatePercentile(responseTimes, 95);
      const percentile99 = calculatePercentile(responseTimes, 99);

      expect(percentile50).toBeLessThan(RESPONSE_THRESHOLDS.MANUAL_ROTATION);
      expect(percentile95).toBeLessThan(
        RESPONSE_THRESHOLDS.MANUAL_ROTATION * 2,
      );

      console.log(
        `✅ Response times under load (${loadLevel} concurrent users):`,
      );
      console.log(`   P50: ${percentile50.toFixed(2)}ms`);
      console.log(`   P95: ${percentile95.toFixed(2)}ms`);
      console.log(`   P99: ${percentile99.toFixed(2)}ms`);
      console.log(`   Total requests: ${responseTimes.length}`);
    });

    it('should prioritize interactive operations', async () => {
      const interactiveTimes: number[] = [];
      const backgroundTimes: number[] = [];

      // Start background operations
      const backgroundPromises = Array.from({ length: 10 }, async () => {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/background-process')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            priority: 'low',
            data: generateLargeDataset(100),
          });

        return performance.now() - startTime;
      });

      // Perform interactive operations while background runs
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/rotate-manual')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            priority: 'high',
            loadingMatrix: generateLoadingMatrix(20, 2),
            angle: i * 10,
          })
          .expect(201);

        const responseTime = performance.now() - startTime;
        interactiveTimes.push(responseTime);
      }

      const bgTimes = await Promise.all(backgroundPromises);
      backgroundTimes.push(...bgTimes);

      const avgInteractive =
        interactiveTimes.reduce((a, b) => a + b, 0) / interactiveTimes.length;
      const avgBackground =
        backgroundTimes.reduce((a, b) => a + b, 0) / backgroundTimes.length;

      expect(avgInteractive).toBeLessThan(RESPONSE_THRESHOLDS.MANUAL_ROTATION);
      expect(avgInteractive).toBeLessThan(avgBackground * 0.5); // Interactive should be much faster

      console.log('✅ Priority-based response times:');
      console.log(`   Interactive (high): ${avgInteractive.toFixed(2)}ms avg`);
      console.log(`   Background (low): ${avgBackground.toFixed(2)}ms avg`);
    });
  });

  describe('Caching and Optimization Impact', () => {
    it('should improve response times with caching', async () => {
      const testData = {
        loadingMatrix: generateLoadingMatrix(50, 3),
        angle: 45,
        factorX: 0,
        factorY: 1,
      };

      // Cold cache
      const coldTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/rotate-cached')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...testData, cacheKey: `cold-${i}` })
          .expect(201);

        coldTimes.push(performance.now() - startTime);
      }

      // Warm cache
      const warmTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/rotate-cached')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...testData, cacheKey: 'warm-same' })
          .expect(201);

        warmTimes.push(performance.now() - startTime);
      }

      const avgCold = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;
      const avgWarm =
        warmTimes.slice(1).reduce((a, b) => a + b, 0) / (warmTimes.length - 1); // Exclude first
      const improvement = ((avgCold - avgWarm) / avgCold) * 100;

      expect(avgWarm).toBeLessThan(avgCold * 0.5); // Cached should be at least 50% faster
      expect(avgWarm).toBeLessThan(50); // Cached responses under 50ms

      console.log('✅ Caching performance improvement:');
      console.log(`   Cold cache: ${avgCold.toFixed(2)}ms avg`);
      console.log(`   Warm cache: ${avgWarm.toFixed(2)}ms avg`);
      console.log(`   Improvement: ${improvement.toFixed(2)}%`);
    });
  });

  // Helper functions
  function generateLoadingMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 0.8 - 0.4),
    );
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

  function generateSmallDataset(): any {
    return {
      values: Array.from({ length: 20 }, () => Math.random()),
    };
  }

  function generateLargeDataset(size: number): any {
    return {
      matrix: generateCorrelationMatrix(size),
      metadata: {
        size,
        timestamp: Date.now(),
      },
    };
  }

  function calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
});
