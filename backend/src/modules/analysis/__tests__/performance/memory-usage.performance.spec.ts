import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import * as v8 from 'v8';
import * as os from 'os';
import { JwtService } from '@nestjs/jwt';
import { QAnalysisService } from '../../services/q-analysis.service';

describe('Memory Usage Performance Tests', () => {
  let app: INestApplication;
  let qAnalysisService: QAnalysisService;
  let jwtService: JwtService;
  let authToken: string;

  // Memory thresholds (in MB)
  const MEMORY_THRESHOLDS = {
    SMALL_ANALYSIS: 50, // 50MB for <100 participants
    MEDIUM_ANALYSIS: 200, // 200MB for 100-500 participants
    LARGE_ANALYSIS: 500, // 500MB for 500-1000 participants
    XLARGE_ANALYSIS: 1024, // 1GB for 1000+ participants
    LEAK_DETECTION_THRESHOLD: 10, // 10MB growth per iteration indicates leak
    GC_EFFICIENCY: 0.7, // 70% memory should be freed after GC
  };

  // Helper to force garbage collection
  const forceGC = () => {
    if (global.gc) {
      global.gc();
      global.gc(); // Run twice to be thorough
    }
  };

  // Helper to get memory usage in MB
  const getMemoryUsageMB = () => {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      heapUsed: usage.heapUsed / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      arrayBuffers: usage.arrayBuffers / 1024 / 1024,
    };
  };

  // Helper to get heap statistics
  const getHeapStats = () => {
    const stats = v8.getHeapStatistics();
    return {
      totalHeapSize: stats.total_heap_size / 1024 / 1024,
      usedHeapSize: stats.used_heap_size / 1024 / 1024,
      heapSizeLimit: stats.heap_size_limit / 1024 / 1024,
      mallocedMemory: stats.malloced_memory / 1024 / 1024,
      peakMallocedMemory: stats.peak_malloced_memory / 1024 / 1024,
    };
  };

  beforeAll(async () => {
    // Enable garbage collection for tests
    if (!global.gc) {
      console.warn(
        '⚠️  Garbage collection not exposed. Run tests with --expose-gc flag',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [QAnalysisService, JwtService],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure memory monitoring
    app.use((req: Request, res: Response, next: NextFunction) => {
      (req as any).memoryStart = getMemoryUsageMB();
      next();
    });

    await app.init();

    qAnalysisService = moduleFixture.get<QAnalysisService>(QAnalysisService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    authToken = jwtService.sign({
      sub: 'memory-test-user',
      role: 'researcher',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Memory Usage During Analysis Operations', () => {
    it('should maintain memory usage within limits for small datasets', async () => {
      const participants = 50;
      const statements = 36;

      forceGC();
      const initialMemory = getMemoryUsageMB();

      const qSorts = generateQSorts(participants, statements);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'memory-test-small',
          qSorts: qSorts,
        })
        .expect(201);

      const peakMemory = getMemoryUsageMB();
      const memoryGrowth = peakMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryGrowth).toBeLessThan(MEMORY_THRESHOLDS.SMALL_ANALYSIS);

      // Check memory is released after processing
      forceGC();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalMemory = getMemoryUsageMB();
      const retainedMemory = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(retainedMemory).toBeLessThan(memoryGrowth * 0.3); // Should release 70% of memory

      console.log(`✅ Small dataset memory usage:`);
      console.log(`   Peak growth: ${memoryGrowth.toFixed(2)}MB`);
      console.log(`   Retained: ${retainedMemory.toFixed(2)}MB`);
    });

    it('should handle medium datasets efficiently', async () => {
      const participants = 300;
      const statements = 40;

      forceGC();
      const initialMemory = getMemoryUsageMB();
      const memorySnapshots: any[] = [];

      // Process in stages and monitor memory
      const stages = [
        { name: 'correlation', endpoint: '/api/analysis/correlate' },
        { name: 'extraction', endpoint: '/api/analysis/extract' },
        { name: 'rotation', endpoint: '/api/analysis/rotate' },
      ];

      for (const stage of stages) {
        const stageStart = getMemoryUsageMB();

        await request(app.getHttpServer())
          .post(stage.endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: 'memory-test-medium',
            data: generateAnalysisData(participants),
          })
          .expect(201);

        const stageEnd = getMemoryUsageMB();

        memorySnapshots.push({
          stage: stage.name,
          memoryUsed: stageEnd.heapUsed - stageStart.heapUsed,
          heapTotal: stageEnd.heapTotal,
        });
      }

      const totalMemoryUsed = memorySnapshots.reduce(
        (acc, s) => acc + s.memoryUsed,
        0,
      );
      expect(totalMemoryUsed).toBeLessThan(MEMORY_THRESHOLDS.MEDIUM_ANALYSIS);

      console.log('✅ Medium dataset memory by stage:');
      memorySnapshots.forEach((s) => {
        console.log(`   ${s.stage}: ${s.memoryUsed.toFixed(2)}MB`);
      });
    });

    it('should process large datasets without memory errors', async () => {
      const participants = 1000;
      const statements = 50;

      forceGC();
      const initialHeap = getHeapStats();

      // Monitor memory during processing
      const memoryMonitor = setInterval(() => {
        const current = getHeapStats();
        if (current.usedHeapSize > current.heapSizeLimit * 0.9) {
          console.warn('⚠️  Approaching heap limit!');
        }
      }, 100);

      try {
        const response = await request(app.getHttpServer())
          .post('/api/analysis/process-large')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: 'memory-test-large',
            participantCount: participants,
            statementCount: statements,
            useStreaming: true, // Stream processing to manage memory
          })
          .expect(201);

        clearInterval(memoryMonitor);

        const finalHeap = getHeapStats();
        const maxMemoryUsed = finalHeap.usedHeapSize - initialHeap.usedHeapSize;

        expect(maxMemoryUsed).toBeLessThan(MEMORY_THRESHOLDS.LARGE_ANALYSIS);
        expect(response.body).toHaveProperty('processedInBatches', true);

        console.log(`✅ Large dataset processed:`);
        console.log(`   Max memory used: ${maxMemoryUsed.toFixed(2)}MB`);
        console.log(
          `   Heap utilization: ${((finalHeap.usedHeapSize / finalHeap.heapSizeLimit) * 100).toFixed(2)}%`,
        );
      } finally {
        clearInterval(memoryMonitor);
      }
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 20;
      const memoryGrowthPerIteration: number[] = [];

      forceGC();
      let previousMemory = getMemoryUsageMB().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const qSorts = generateQSorts(50, 30);

        await request(app.getHttpServer())
          .post('/api/analysis/quick-process')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            iteration: i,
            qSorts: qSorts,
          })
          .expect(201);

        forceGC();
        await new Promise((resolve) => setTimeout(resolve, 50));

        const currentMemory = getMemoryUsageMB().heapUsed;
        const growth = currentMemory - previousMemory;
        memoryGrowthPerIteration.push(growth);
        previousMemory = currentMemory;
      }

      // Calculate average growth per iteration (excluding first few warm-up iterations)
      const stableIterations = memoryGrowthPerIteration.slice(5);
      const avgGrowth =
        stableIterations.reduce((a, b) => a + b, 0) / stableIterations.length;

      expect(Math.abs(avgGrowth)).toBeLessThan(
        MEMORY_THRESHOLDS.LEAK_DETECTION_THRESHOLD,
      );

      console.log(`✅ Memory leak detection (${iterations} iterations):`);
      console.log(`   Average growth per iteration: ${avgGrowth.toFixed(2)}MB`);
      console.log(
        `   Max growth: ${Math.max(...memoryGrowthPerIteration).toFixed(2)}MB`,
      );
      console.log(
        `   Min growth: ${Math.min(...memoryGrowthPerIteration).toFixed(2)}MB`,
      );
    });

    it('should properly cleanup WebSocket connections', async () => {
      const WebSocket = require('ws');
      const connectionCount = 100;
      const connections: any[] = [];

      forceGC();
      const initialMemory = getMemoryUsageMB();

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(
          `ws://localhost:${app.getHttpServer().address().port}`,
        );
        connections.push(ws);

        await new Promise((resolve) => {
          ws.on('open', resolve);
        });
      }

      const afterConnectionsMemory = getMemoryUsageMB();
      const connectionMemory =
        afterConnectionsMemory.heapUsed - initialMemory.heapUsed;

      // Close all connections
      connections.forEach((ws) => ws.close());
      await new Promise((resolve) => setTimeout(resolve, 500));

      forceGC();
      const afterCleanupMemory = getMemoryUsageMB();
      const retainedMemory =
        afterCleanupMemory.heapUsed - initialMemory.heapUsed;

      const cleanupEfficiency = 1 - retainedMemory / connectionMemory;
      expect(cleanupEfficiency).toBeGreaterThan(
        MEMORY_THRESHOLDS.GC_EFFICIENCY,
      );

      console.log(`✅ WebSocket cleanup efficiency:`);
      console.log(`   Connections created: ${connectionMemory.toFixed(2)}MB`);
      console.log(`   Memory after cleanup: ${retainedMemory.toFixed(2)}MB`);
      console.log(
        `   Cleanup efficiency: ${(cleanupEfficiency * 100).toFixed(2)}%`,
      );
    });

    it('should handle circular references properly', async () => {
      forceGC();
      const initialMemory = getMemoryUsageMB();

      // Create analysis with potential circular references
      const analysisData = {
        studyId: 'circular-ref-test',
        participants: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          factors: null as any, // Will create circular reference
        })),
      };

      // Create circular references
      analysisData.participants.forEach((p) => {
        p.factors = analysisData.participants; // Circular reference
      });

      await request(app.getHttpServer())
        .post('/api/analysis/process-circular')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData)
        .expect(201);

      // Clear references
      analysisData.participants.forEach((p) => {
        p.factors = null;
      });

      forceGC();
      const finalMemory = getMemoryUsageMB();
      const retainedMemory = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(retainedMemory).toBeLessThan(10); // Should release almost all memory

      console.log(`✅ Circular reference handling:`);
      console.log(`   Retained memory: ${retainedMemory.toFixed(2)}MB`);
    });
  });

  describe('Memory Optimization Strategies', () => {
    it('should use memory pooling for repeated allocations', async () => {
      const pooledMemoryUsage: number[] = [];
      const nonPooledMemoryUsage: number[] = [];

      // Test without pooling
      for (let i = 0; i < 10; i++) {
        forceGC();
        const startMemory = getMemoryUsageMB();

        await request(app.getHttpServer())
          .post('/api/analysis/matrix-operation')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            size: 100,
            usePooling: false,
          })
          .expect(201);

        const endMemory = getMemoryUsageMB();
        nonPooledMemoryUsage.push(endMemory.heapUsed - startMemory.heapUsed);
      }

      // Test with pooling
      for (let i = 0; i < 10; i++) {
        forceGC();
        const startMemory = getMemoryUsageMB();

        await request(app.getHttpServer())
          .post('/api/analysis/matrix-operation')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            size: 100,
            usePooling: true,
          })
          .expect(201);

        const endMemory = getMemoryUsageMB();
        pooledMemoryUsage.push(endMemory.heapUsed - startMemory.heapUsed);
      }

      const avgPooled =
        pooledMemoryUsage.reduce((a, b) => a + b, 0) / pooledMemoryUsage.length;
      const avgNonPooled =
        nonPooledMemoryUsage.reduce((a, b) => a + b, 0) /
        nonPooledMemoryUsage.length;

      expect(avgPooled).toBeLessThan(avgNonPooled * 0.7); // Pooling should reduce memory by 30%

      console.log('✅ Memory pooling efficiency:');
      console.log(`   Without pooling: ${avgNonPooled.toFixed(2)}MB avg`);
      console.log(`   With pooling: ${avgPooled.toFixed(2)}MB avg`);
      console.log(
        `   Improvement: ${((1 - avgPooled / avgNonPooled) * 100).toFixed(2)}%`,
      );
    });

    it('should use streaming for large data exports', async () => {
      const exportSizes = [100, 500, 1000];
      const memoryUsage: any[] = [];

      for (const size of exportSizes) {
        forceGC();
        const startMemory = getMemoryUsageMB();

        // Stream export
        const streamResponse = await request(app.getHttpServer())
          .get('/api/analysis/export-stream')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            studyId: 'export-test',
            participantCount: size,
            format: 'csv',
          })
          .expect(200);

        const streamMemory = getMemoryUsageMB();
        const streamUsage = streamMemory.heapUsed - startMemory.heapUsed;

        forceGC();
        const startMemory2 = getMemoryUsageMB();

        // Buffered export (for comparison)
        const bufferResponse = await request(app.getHttpServer())
          .get('/api/analysis/export-buffer')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            studyId: 'export-test',
            participantCount: size,
            format: 'csv',
          })
          .expect(200);

        const bufferMemory = getMemoryUsageMB();
        const bufferUsage = bufferMemory.heapUsed - startMemory2.heapUsed;

        memoryUsage.push({
          size,
          stream: streamUsage,
          buffer: bufferUsage,
          savings: ((bufferUsage - streamUsage) / bufferUsage) * 100,
        });
      }

      // Streaming should use significantly less memory for large exports
      const largeSizeResult = memoryUsage.find((m) => m.size === 1000);
      expect(largeSizeResult.savings).toBeGreaterThan(30);

      console.log('✅ Streaming vs Buffered export:');
      memoryUsage.forEach((m) => {
        console.log(
          `   ${m.size} participants: Stream ${m.stream.toFixed(2)}MB vs Buffer ${m.buffer.toFixed(2)}MB (${m.savings.toFixed(2)}% savings)`,
        );
      });
    });

    it('should efficiently handle sparse matrices', async () => {
      const matrixSizes = [100, 200, 500];
      const sparsity = 0.9; // 90% sparse
      const memoryComparison: any[] = [];

      for (const size of matrixSizes) {
        // Dense matrix
        forceGC();
        const denseStart = getMemoryUsageMB();

        await request(app.getHttpServer())
          .post('/api/analysis/matrix-multiply')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            size,
            sparse: false,
            matrix: generateDenseMatrix(size),
          })
          .expect(201);

        const denseEnd = getMemoryUsageMB();
        const denseUsage = denseEnd.heapUsed - denseStart.heapUsed;

        // Sparse matrix
        forceGC();
        const sparseStart = getMemoryUsageMB();

        await request(app.getHttpServer())
          .post('/api/analysis/matrix-multiply')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            size,
            sparse: true,
            matrix: generateSparseMatrix(size, sparsity),
          })
          .expect(201);

        const sparseEnd = getMemoryUsageMB();
        const sparseUsage = sparseEnd.heapUsed - sparseStart.heapUsed;

        memoryComparison.push({
          size,
          dense: denseUsage,
          sparse: sparseUsage,
          savings: ((denseUsage - sparseUsage) / denseUsage) * 100,
        });
      }

      // Sparse matrices should use significantly less memory
      memoryComparison.forEach((m) => {
        expect(m.savings).toBeGreaterThan(50); // At least 50% savings for 90% sparse
      });

      console.log('✅ Sparse matrix memory optimization:');
      memoryComparison.forEach((m) => {
        console.log(
          `   ${m.size}x${m.size}: Dense ${m.dense.toFixed(2)}MB vs Sparse ${m.sparse.toFixed(2)}MB (${m.savings.toFixed(2)}% savings)`,
        );
      });
    });
  });

  describe('Memory Monitoring and Alerts', () => {
    it('should track memory usage over time', async () => {
      const duration = 5000; // 5 seconds
      const interval = 100; // Sample every 100ms
      const memoryTimeline: any[] = [];

      const startTime = Date.now();
      const monitor = setInterval(() => {
        const memory = getMemoryUsageMB();
        const heap = getHeapStats();

        memoryTimeline.push({
          time: Date.now() - startTime,
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
          utilization: (heap.usedHeapSize / heap.heapSizeLimit) * 100,
        });
      }, interval);

      // Perform various operations
      const operations = [
        { delay: 500, size: 100 },
        { delay: 1500, size: 200 },
        { delay: 2500, size: 300 },
        { delay: 3500, size: 200 },
      ];

      for (const op of operations) {
        setTimeout(async () => {
          await request(app.getHttpServer())
            .post('/api/analysis/timed-operation')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ size: op.size });
        }, op.delay);
      }

      await new Promise((resolve) => setTimeout(resolve, duration));
      clearInterval(monitor);

      // Analyze memory timeline
      const maxHeap = Math.max(...memoryTimeline.map((m) => m.heapUsed));
      const avgHeap =
        memoryTimeline.reduce((acc, m) => acc + m.heapUsed, 0) /
        memoryTimeline.length;
      const maxUtilization = Math.max(
        ...memoryTimeline.map((m) => m.utilization),
      );

      expect(maxUtilization).toBeLessThan(80); // Should not exceed 80% heap utilization

      console.log('✅ Memory timeline analysis:');
      console.log(`   Samples collected: ${memoryTimeline.length}`);
      console.log(`   Max heap used: ${maxHeap.toFixed(2)}MB`);
      console.log(`   Avg heap used: ${avgHeap.toFixed(2)}MB`);
      console.log(`   Max utilization: ${maxUtilization.toFixed(2)}%`);
    });

    it('should detect and report memory pressure', async () => {
      const pressureEvents: any[] = [];
      let isUnderPressure = false;

      // Monitor for memory pressure
      const pressureMonitor = setInterval(() => {
        const heap = getHeapStats();
        const utilization = heap.usedHeapSize / heap.heapSizeLimit;

        if (utilization > 0.75 && !isUnderPressure) {
          isUnderPressure = true;
          pressureEvents.push({
            type: 'enter',
            utilization: utilization * 100,
            timestamp: Date.now(),
          });
        } else if (utilization < 0.6 && isUnderPressure) {
          isUnderPressure = false;
          pressureEvents.push({
            type: 'exit',
            utilization: utilization * 100,
            timestamp: Date.now(),
          });
        }
      }, 50);

      // Generate memory pressure
      const largeAllocations = [];
      for (let i = 0; i < 5; i++) {
        largeAllocations.push(
          request(app.getHttpServer())
            .post('/api/analysis/allocate-large')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              sizeMB: 100,
              holdTime: 1000,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      await Promise.all(largeAllocations);
      clearInterval(pressureMonitor);

      console.log('✅ Memory pressure detection:');
      console.log(`   Pressure events: ${pressureEvents.length}`);
      pressureEvents.forEach((e) => {
        console.log(
          `   ${e.type} pressure at ${e.utilization.toFixed(2)}% utilization`,
        );
      });
    });
  });

  // Helper functions
  function generateQSorts(participants: number, statements: number): any[] {
    return Array.from({ length: participants }, (_, i) => ({
      participantId: `p-${i}`,
      sorts: Array.from(
        { length: statements },
        () => Math.floor(Math.random() * 9) - 4,
      ),
    }));
  }

  function generateAnalysisData(size: number): any {
    return {
      correlationMatrix: generateCorrelationMatrix(size),
      participants: size,
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

  function generateDenseMatrix(size: number): number[][] {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.random()),
    );
  }

  function generateSparseMatrix(size: number, sparsity: number): any {
    const values: { row: number; col: number; value: number }[] = [];

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (Math.random() > sparsity) {
          values.push({ row: i, col: j, value: Math.random() });
        }
      }
    }

    return {
      size,
      values,
      format: 'coo', // Coordinate format
    };
  }
});
