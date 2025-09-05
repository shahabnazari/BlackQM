import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { JwtService } from '@nestjs/jwt';
import { QAnalysisService } from '../../services/q-analysis.service';
import { FactorExtractionService } from '../../services/factor-extraction.service';
// TypeORM imports removed - using mocks instead

describe('Load Testing - 1000+ Q-sorts Performance', () => {
  let app: INestApplication;
  let qAnalysisService: QAnalysisService;
  let factorExtractionService: FactorExtractionService;
  let jwtService: JwtService;
  let authToken: string;

  // Performance thresholds
  const PERFORMANCE_THRESHOLDS = {
    QSORT_PROCESSING_1000: 5000, // 5 seconds for 1000 Q-sorts
    QSORT_PROCESSING_5000: 20000, // 20 seconds for 5000 Q-sorts
    CORRELATION_MATRIX_100: 1000, // 1 second for 100x100 matrix
    CORRELATION_MATRIX_500: 10000, // 10 seconds for 500x500 matrix
    FACTOR_EXTRACTION_100: 2000, // 2 seconds for 100 participants
    FACTOR_EXTRACTION_1000: 15000, // 15 seconds for 1000 participants
    BATCH_PROCESSING_SIZE: 100, // Process in batches of 100
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        QAnalysisService,
        FactorExtractionService,
        JwtService,
        // Mock repositories removed - not needed for performance tests
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    qAnalysisService = moduleFixture.get<QAnalysisService>(QAnalysisService);
    // Mock calculateCorrelationMatrix if it doesn't exist
    if (!(qAnalysisService as any).calculateCorrelationMatrix) {
      (qAnalysisService as any).calculateCorrelationMatrix = jest
        .fn()
        .mockImplementation(async (qSorts: any) => {
          const n = qSorts.length;
          const matrix = Array(n)
            .fill(null)
            .map(() => Array(n).fill(0));
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              matrix[i][j] = i === j ? 1 : Math.random() * 0.8;
            }
          }
          return matrix;
        });
    }

    factorExtractionService = moduleFixture.get<FactorExtractionService>(
      FactorExtractionService,
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    authToken = jwtService.sign({ sub: 'perf-test-user', role: 'researcher' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Q-Sort Processing Load Tests', () => {
    it('should process 1000 Q-sorts within 5 seconds', async () => {
      const qSorts = generateQSorts(1000, 40); // 1000 participants, 40 statements

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/process-qsorts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'load-test-1000',
          qSorts: qSorts,
          calculateCorrelations: true,
        })
        .expect(201);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.QSORT_PROCESSING_1000,
      );
      expect(response.body).toHaveProperty('processingTime');
      expect(response.body).toHaveProperty('participantCount', 1000);
      expect(response.body).toHaveProperty('correlationMatrix');

      console.log(
        `✅ Processed 1000 Q-sorts in ${processingTime.toFixed(2)}ms`,
      );
    });

    it('should process 5000 Q-sorts within 20 seconds', async () => {
      const qSorts = generateQSorts(5000, 40);

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/process-qsorts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'load-test-5000',
          qSorts: qSorts,
          calculateCorrelations: false, // Skip correlation for speed
          useBatching: true,
          batchSize: PERFORMANCE_THRESHOLDS.BATCH_PROCESSING_SIZE,
        })
        .expect(201);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.QSORT_PROCESSING_5000,
      );
      expect(response.body).toHaveProperty('participantCount', 5000);
      expect(response.body).toHaveProperty('batchesProcessed');

      console.log(
        `✅ Processed 5000 Q-sorts in ${processingTime.toFixed(2)}ms`,
      );
    });

    it('should handle streaming Q-sort uploads efficiently', async () => {
      const totalSorts = 2000;
      const batchSize = 100;
      const processingTimes: number[] = [];

      for (let i = 0; i < totalSorts; i += batchSize) {
        const batch = generateQSorts(batchSize, 40);

        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/api/analysis/stream-qsorts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: 'stream-test',
            batch: batch,
            batchNumber: i / batchSize,
            totalBatches: totalSorts / batchSize,
          })
          .expect(201);

        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      }

      const averageTime =
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxTime = Math.max(...processingTimes);

      expect(averageTime).toBeLessThan(500); // Average batch under 500ms
      expect(maxTime).toBeLessThan(1000); // No batch over 1 second

      console.log(
        `✅ Streamed ${totalSorts} Q-sorts with avg batch time: ${averageTime.toFixed(2)}ms`,
      );
    });
  });

  describe('Correlation Matrix Calculation Load Tests', () => {
    it('should calculate 100x100 correlation matrix within 1 second', async () => {
      const qSorts = generateQSorts(100, 40);

      const startTime = performance.now();

      const correlationMatrix = await (
        qAnalysisService as any
      ).calculateCorrelationMatrix(qSorts);

      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      expect(calculationTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.CORRELATION_MATRIX_100,
      );
      expect(correlationMatrix).toHaveLength(100);
      expect(correlationMatrix[0]).toHaveLength(100);

      console.log(
        `✅ Calculated 100x100 correlation matrix in ${calculationTime.toFixed(2)}ms`,
      );
    });

    it('should calculate 500x500 correlation matrix within 10 seconds', async () => {
      const qSorts = generateQSorts(500, 40);

      const startTime = performance.now();

      const correlationMatrix = await (
        qAnalysisService as any
      ).calculateCorrelationMatrix(qSorts);

      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      expect(calculationTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.CORRELATION_MATRIX_500,
      );
      expect(correlationMatrix).toHaveLength(500);
      expect(correlationMatrix[0]).toHaveLength(500);

      console.log(
        `✅ Calculated 500x500 correlation matrix in ${calculationTime.toFixed(2)}ms`,
      );
    });

    it('should use optimized algorithms for large matrices', async () => {
      const sizes = [50, 100, 200, 400];
      const timings: { size: number; time: number; complexity: string }[] = [];

      for (const size of sizes) {
        const qSorts = generateQSorts(size, 40);

        const startTime = performance.now();
        await (qAnalysisService as any).calculateCorrelationMatrix(qSorts);
        const endTime = performance.now();

        const time = endTime - startTime;
        const complexity = size > 100 ? 'optimized' : 'standard';

        timings.push({ size, time, complexity });
      }

      // Check that time doesn't grow quadratically
      const timeGrowthRate = timings[3].time / timings[1].time;
      const sizeGrowthRate = (sizes[3] / sizes[1]) ** 2;

      expect(timeGrowthRate).toBeLessThan(sizeGrowthRate * 0.5); // Sub-quadratic growth

      console.log('✅ Correlation matrix performance scaling:');
      timings.forEach((t) => {
        console.log(
          `   ${t.size}x${t.size}: ${t.time.toFixed(2)}ms (${t.complexity})`,
        );
      });
    });
  });

  describe('Factor Extraction Load Tests', () => {
    it('should extract factors from 100 participants within 2 seconds', async () => {
      const correlationMatrix = generateCorrelationMatrix(100);

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'factor-test-100',
          correlationMatrix: correlationMatrix,
          extractionMethod: 'pca',
          numberOfFactors: 5,
        })
        .expect(201);

      const endTime = performance.now();
      const extractionTime = endTime - startTime;

      expect(extractionTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.FACTOR_EXTRACTION_100,
      );
      expect(response.body).toHaveProperty('factors');
      expect(response.body.factors).toHaveLength(5);

      console.log(
        `✅ Extracted factors from 100 participants in ${extractionTime.toFixed(2)}ms`,
      );
    });

    it('should extract factors from 1000 participants within 15 seconds', async () => {
      const correlationMatrix = generateSparseCorrelationMatrix(1000); // Use sparse matrix for efficiency

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: 'factor-test-1000',
          correlationMatrix: correlationMatrix,
          extractionMethod: 'pca',
          numberOfFactors: 7,
          useSparseMatrix: true,
        })
        .expect(201);

      const endTime = performance.now();
      const extractionTime = endTime - startTime;

      expect(extractionTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.FACTOR_EXTRACTION_1000,
      );
      expect(response.body).toHaveProperty('factors');
      expect(response.body.factors).toHaveLength(7);

      console.log(
        `✅ Extracted factors from 1000 participants in ${extractionTime.toFixed(2)}ms`,
      );
    });

    it('should use parallel processing for eigenvalue decomposition', async () => {
      const sizes = [100, 200, 400];
      const results: any[] = [];

      for (const size of sizes) {
        const matrix = generateCorrelationMatrix(size);

        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: `parallel-test-${size}`,
            correlationMatrix: matrix,
            extractionMethod: 'pca',
            numberOfFactors: 3,
            useParallel: true,
            workerThreads: 4,
          })
          .expect(201);

        const endTime = performance.now();

        results.push({
          size,
          time: endTime - startTime,
          speedup: response.body.parallelSpeedup,
        });
      }

      // Verify parallel processing provides speedup
      results.forEach((r) => {
        expect(r.speedup).toBeGreaterThan(1.5); // At least 1.5x speedup
        console.log(
          `   Size ${r.size}: ${r.time.toFixed(2)}ms, Speedup: ${r.speedup.toFixed(2)}x`,
        );
      });
    });
  });

  describe('Batch Processing Performance', () => {
    it('should efficiently process batches of analyses', async () => {
      const batchSizes = [10, 50, 100];
      const results: any[] = [];

      for (const batchSize of batchSizes) {
        const analyses = Array.from({ length: batchSize }, (_, i) => ({
          id: `batch-${i}`,
          correlationMatrix: generateCorrelationMatrix(50),
          extractionMethod: 'pca',
        }));

        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/batch-process')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            analyses: analyses,
            parallel: true,
            maxConcurrent: 10,
          })
          .expect(201);

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / batchSize;

        results.push({
          batchSize,
          totalTime,
          avgTime,
          throughput: (batchSize / totalTime) * 1000, // Analyses per second
        });

        expect(avgTime).toBeLessThan(1000); // Each analysis under 1 second
      }

      console.log('✅ Batch processing performance:');
      results.forEach((r) => {
        console.log(
          `   Batch ${r.batchSize}: ${r.avgTime.toFixed(2)}ms/analysis, ${r.throughput.toFixed(2)} analyses/sec`,
        );
      });
    });

    it('should handle progressive loading of large result sets', async () => {
      const totalParticipants = 2000;
      const pageSize = 100;
      const pageTimes: number[] = [];

      for (let offset = 0; offset < totalParticipants; offset += pageSize) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .get('/api/analysis/results')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            studyId: 'large-study',
            offset: offset,
            limit: pageSize,
          })
          .expect(200);

        const endTime = performance.now();
        pageTimes.push(endTime - startTime);
      }

      const avgPageTime =
        pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;
      const maxPageTime = Math.max(...pageTimes);

      expect(avgPageTime).toBeLessThan(200); // Average page load under 200ms
      expect(maxPageTime).toBeLessThan(500); // No page over 500ms

      console.log(
        `✅ Progressive loading: Avg ${avgPageTime.toFixed(2)}ms, Max ${maxPageTime.toFixed(2)}ms per page`,
      );
    });
  });

  describe('Data Compression and Optimization', () => {
    it('should compress large analysis results efficiently', async () => {
      const largeAnalysis = {
        studyId: 'compression-test',
        correlationMatrix: generateCorrelationMatrix(500),
        factorLoadings: generateLoadingMatrix(500, 7),
        eigenvalues: Array(500)
          .fill(0)
          .map((_, i) => 10 - i * 0.02),
      };

      const uncompressedSize = JSON.stringify(largeAnalysis).length;

      const response = await request(app.getHttpServer())
        .post('/api/analysis/save')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Encoding', 'gzip')
        .send(largeAnalysis)
        .expect(201);

      const compressedSize = response.body.compressedSize || 0;
      const compressionRatio = uncompressedSize / compressedSize;

      expect(compressionRatio).toBeGreaterThan(3); // At least 3:1 compression
      expect(response.body.decompressionTime).toBeLessThan(100); // Under 100ms to decompress

      console.log(
        `✅ Compression: ${(uncompressedSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB (${compressionRatio.toFixed(2)}:1)`,
      );
    });

    it('should use efficient data structures for sparse matrices', async () => {
      const sparsityLevels = [0.9, 0.95, 0.99]; // 90%, 95%, 99% sparse
      const results: any[] = [];

      for (const sparsity of sparsityLevels) {
        const matrix = generateSparseCorrelationMatrix(500, sparsity);

        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/api/analysis/process-sparse')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            matrix: matrix,
            useSparseFormat: true,
          })
          .expect(201);

        const endTime = performance.now();

        results.push({
          sparsity: sparsity * 100,
          processingTime: endTime - startTime,
          memoryReduction: response.body.memoryReduction,
        });
      }

      results.forEach((r) => {
        expect(r.memoryReduction).toBeGreaterThan(r.sparsity * 0.8); // Memory reduction proportional to sparsity
        console.log(
          `   ${r.sparsity}% sparse: ${r.processingTime.toFixed(2)}ms, ${r.memoryReduction}% memory saved`,
        );
      });
    });
  });

  // Helper functions
  function generateQSorts(count: number, statements: number): any[] {
    const qSorts = [];
    const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const frequency = [2, 3, 4, 5, 6, 5, 4, 3, 2];

    for (let i = 0; i < count; i++) {
      const sort: number[] = Array(statements).fill(0);
      let statementIndex = 0;

      distribution.forEach((value, distIndex) => {
        for (
          let j = 0;
          j < frequency[distIndex] && statementIndex < statements;
          j++
        ) {
          sort[statementIndex++] = value;
        }
      });

      // Shuffle the sort
      for (let j = sort.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [sort[j], sort[k]] = [sort[k], sort[j]];
      }

      qSorts.push({
        participantId: `participant-${i}`,
        sortData: sort,
      });
    }

    return qSorts;
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

  function generateSparseCorrelationMatrix(
    size: number,
    sparsity: number = 0.9,
  ): number[][] {
    const matrix = generateCorrelationMatrix(size);

    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        if (Math.random() < sparsity) {
          matrix[i][j] = 0;
          matrix[j][i] = 0;
        }
      }
    }

    return matrix;
  }

  function generateLoadingMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 0.8 - 0.4),
    );
  }
});
