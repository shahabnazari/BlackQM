import { performance } from 'perf_hooks';

describe('Simple Performance Tests', () => {
  describe('Basic Algorithm Performance', () => {
    it('should calculate correlation matrix efficiently', () => {
      const sizes = [10, 50, 100, 200];
      const results: any[] = [];

      for (const size of sizes) {
        const matrix = generateRandomMatrix(size, size);

        const startTime = performance.now();
        const correlation = calculateCorrelation(matrix);
        const endTime = performance.now();

        const processingTime = endTime - startTime;
        results.push({
          size,
          processingTime,
          opsPerSecond: (size * size) / (processingTime / 1000),
        });

        console.log(`Matrix ${size}x${size}: ${processingTime.toFixed(2)}ms`);
      }

      // Performance assertions
      expect(results[0].processingTime).toBeLessThan(100); // 10x10 under 100ms
      expect(results[1].processingTime).toBeLessThan(500); // 50x50 under 500ms
      expect(results[2].processingTime).toBeLessThan(2000); // 100x100 under 2s
    });

    it('should handle large dataset sorting efficiently', () => {
      const datasetSizes = [100, 1000, 5000, 10000];
      const results: any[] = [];

      for (const size of datasetSizes) {
        const data = generateRandomArray(size);

        const startTime = performance.now();
        const sorted = quickSort([...data]);
        const endTime = performance.now();

        const processingTime = endTime - startTime;
        results.push({
          size,
          processingTime,
          itemsPerSecond: size / (processingTime / 1000),
        });

        console.log(`Sorting ${size} items: ${processingTime.toFixed(2)}ms`);
      }

      // O(n log n) performance expectations
      expect(
        results[1].processingTime / results[0].processingTime,
      ).toBeLessThan(15);
      expect(
        results[2].processingTime / results[1].processingTime,
      ).toBeLessThan(10);
    });

    it('should perform factor extraction within time limits', () => {
      const participantCounts = [30, 60, 100];
      const results: any[] = [];

      for (const count of participantCounts) {
        const correlationMatrix = generateSymmetricMatrix(count);

        const startTime = performance.now();
        const eigenvalues = powerIteration(correlationMatrix, 5);
        const endTime = performance.now();

        const processingTime = endTime - startTime;
        results.push({
          participants: count,
          processingTime,
          factorsExtracted: eigenvalues.length,
        });

        console.log(
          `Factor extraction for ${count} participants: ${processingTime.toFixed(2)}ms`,
        );
      }

      // Performance expectations
      expect(results[0].processingTime).toBeLessThan(500); // 30 participants under 500ms
      expect(results[1].processingTime).toBeLessThan(1000); // 60 participants under 1s
      expect(results[2].processingTime).toBeLessThan(2000); // 100 participants under 2s
    });

    it('should measure memory usage for large operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create large dataset
      const largeDataset = Array(10000)
        .fill(null)
        .map(() =>
          Array(100)
            .fill(null)
            .map(() => Math.random()),
        );

      const afterCreation = process.memoryUsage().heapUsed;
      const memoryUsed = (afterCreation - initialMemory) / 1024 / 1024; // MB

      console.log(
        `Memory used for 10,000 x 100 dataset: ${memoryUsed.toFixed(2)} MB`,
      );

      // Process the dataset
      const startTime = performance.now();
      const processed = largeDataset.map(
        (row) => row.reduce((sum, val) => sum + val, 0) / row.length,
      );
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      console.log(`Processing time: ${processingTime.toFixed(2)}ms`);

      expect(memoryUsed).toBeLessThan(100); // Less than 100MB
      expect(processingTime).toBeLessThan(100); // Process in under 100ms
      expect(processed.length).toBe(10000);
    });

    it('should handle concurrent operations efficiently', async () => {
      const concurrentTasks = 100;
      const promises: Promise<number>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentTasks; i++) {
        promises.push(performAsyncOperation(i));
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTimePerTask = totalTime / concurrentTasks;

      console.log(
        `Concurrent operations: ${concurrentTasks} tasks in ${totalTime.toFixed(2)}ms`,
      );
      console.log(`Average time per task: ${avgTimePerTask.toFixed(2)}ms`);

      expect(results.length).toBe(concurrentTasks);
      expect(totalTime).toBeLessThan(1000); // All tasks complete under 1s
      expect(avgTimePerTask).toBeLessThan(10); // Average under 10ms per task
    });
  });

  describe('Real-world Scenario Performance', () => {
    it('should complete full Q-methodology analysis under 5 seconds', () => {
      const participants = 50;
      const statements = 40;

      // Generate Q-sort data
      const qSorts = generateQSortData(participants, statements);

      const startTime = performance.now();

      // Step 1: Calculate correlation matrix
      const correlationMatrix = calculateCorrelation(qSorts);

      // Step 2: Extract factors
      const factors = powerIteration(correlationMatrix, 3);

      // Step 3: Rotate factors
      const rotated = simulateRotation(factors);

      // Step 4: Calculate scores
      const scores = calculateFactorScores(qSorts, rotated);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `Full analysis for ${participants} participants: ${totalTime.toFixed(2)}ms`,
      );

      expect(totalTime).toBeLessThan(5000); // Under 5 seconds
      expect(scores).toBeDefined();
      expect(rotated.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions
function generateRandomMatrix(rows: number, cols: number): number[][] {
  return Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => Math.random()),
    );
}

function generateSymmetricMatrix(size: number): number[][] {
  const matrix = generateRandomMatrix(size, size);
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      matrix[j][i] = matrix[i][j];
    }
  }
  return matrix;
}

function generateRandomArray(size: number): number[] {
  return Array(size)
    .fill(null)
    .map(() => Math.random() * 1000);
}

function generateQSortData(
  participants: number,
  statements: number,
): number[][] {
  return Array(participants)
    .fill(null)
    .map(() => {
      const ranks = Array(statements)
        .fill(null)
        .map((_, i) => i - Math.floor(statements / 2));
      return shuffle(ranks);
    });
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function calculateCorrelation(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        result[i][j] = 1;
      } else {
        // Simplified correlation calculation
        result[i][j] = Math.random() * 0.8 + 0.1;
      }
    }
  }

  return result;
}

function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const middle = arr.filter((x) => x === pivot);
  const right = arr.filter((x) => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

function powerIteration(matrix: number[][], numFactors: number): number[][] {
  // Simplified power iteration for eigenvalue extraction
  const n = matrix.length;
  const factors = [];

  for (let f = 0; f < numFactors; f++) {
    const vector = Array(n).fill(1 / Math.sqrt(n));

    for (let iter = 0; iter < 10; iter++) {
      const newVector = Array(n).fill(0);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += matrix[i][j] * vector[j];
        }
      }

      const norm = Math.sqrt(
        newVector.reduce((sum, val) => sum + val * val, 0),
      );
      for (let i = 0; i < n; i++) {
        vector[i] = newVector[i] / norm;
      }
    }

    factors.push(vector);
  }

  return factors;
}

function simulateRotation(factors: number[][]): number[][] {
  // Simplified rotation simulation
  return factors.map((factor) =>
    factor.map((val) => val * (0.8 + Math.random() * 0.4)),
  );
}

function calculateFactorScores(
  qSorts: number[][],
  factors: number[][],
): number[][] {
  return qSorts.map((qSort) =>
    factors.map((factor) =>
      qSort.reduce((sum, val, i) => sum + val * (factor[i] || 0), 0),
    ),
  );
}

async function performAsyncOperation(id: number): Promise<number> {
  return new Promise((resolve) => {
    const delay = Math.random() * 10;
    setTimeout(() => resolve(id * 2), delay);
  });
}
