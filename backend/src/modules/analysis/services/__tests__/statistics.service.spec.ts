import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from '../statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  describe('Z-Score Calculations', () => {
    it('should calculate z-scores correctly', () => {
      const data = [2, 4, 6, 8, 10];
      const zScores = service.calculateZScores(data);

      expect(zScores).toHaveLength(5);

      // Mean should be 6, SD should be ~2.83
      expect(zScores[0]).toBeCloseTo(-1.414, 2); // (2-6)/2.83
      expect(zScores[2]).toBeCloseTo(0, 2); // (6-6)/2.83
      expect(zScores[4]).toBeCloseTo(1.414, 2); // (10-6)/2.83
    });

    it('should handle data with zero variance', () => {
      const data = [5, 5, 5, 5, 5];
      const zScores = service.calculateZScores(data);

      // All z-scores should be 0 when variance is 0
      zScores.forEach((z) => {
        expect(z).toBe(0);
      });
    });

    it('should standardize Q-sort data correctly', () => {
      const qSort = [-3, -2, -1, 0, 1, 2, 3];
      const zScores = service.calculateZScores(qSort);

      // Sum of z-scores should be 0
      const sum = zScores.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(0, 10);

      // Standard deviation should be 1
      const variance = service.calculateVariance(zScores);
      expect(Math.sqrt(variance)).toBeCloseTo(1, 5);
    });

    it('should handle empty array', () => {
      expect(() => service.calculateZScores([])).toThrow(
        'Cannot calculate z-scores for empty array',
      );
    });

    it('should handle single value', () => {
      const zScores = service.calculateZScores([42]);
      expect(zScores).toEqual([0]); // Single value has z-score of 0
    });
  });

  describe('Correlation Calculations', () => {
    it('should calculate Pearson correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];

      const correlation = service.calculateCorrelation(x, y);
      expect(correlation).toBeCloseTo(1, 5); // Perfect positive correlation
    });

    it('should calculate negative correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];

      const correlation = service.calculateCorrelation(x, y);
      expect(correlation).toBeCloseTo(-1, 5); // Perfect negative correlation
    });

    it('should calculate zero correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 3, 3, 3, 3];

      const correlation = service.calculateCorrelation(x, y);
      expect(correlation).toBe(0); // No correlation
    });

    it('should calculate correlation matrix correctly', () => {
      const data = [
        [1, 2, 3],
        [2, 4, 6],
        [3, 6, 9],
        [4, 8, 12],
      ];

      const corrMatrix = service.calculateCorrelationMatrix(data);

      expect(corrMatrix).toHaveLength(3);
      expect(corrMatrix[0]).toHaveLength(3);

      // Diagonal should be 1
      expect(corrMatrix[0][0]).toBe(1);
      expect(corrMatrix[1][1]).toBe(1);
      expect(corrMatrix[2][2]).toBe(1);

      // Matrix should be symmetric
      expect(corrMatrix[0][1]).toBe(corrMatrix[1][0]);
      expect(corrMatrix[0][2]).toBe(corrMatrix[2][0]);
      expect(corrMatrix[1][2]).toBe(corrMatrix[2][1]);

      // All correlations should be perfect (1) for this linear data
      expect(corrMatrix[0][1]).toBeCloseTo(1, 5);
      expect(corrMatrix[0][2]).toBeCloseTo(1, 5);
      expect(corrMatrix[1][2]).toBeCloseTo(1, 5);
    });

    it('should handle arrays of different lengths', () => {
      const x = [1, 2, 3];
      const y = [4, 5];

      expect(() => service.calculateCorrelation(x, y)).toThrow(
        'Arrays must have the same length',
      );
    });

    it('should calculate Spearman rank correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 6, 7, 8, 7]; // Not perfectly linear

      const spearman = service.calculateSpearmanCorrelation(x, y);
      expect(spearman).toBeGreaterThan(0.7);
      expect(spearman).toBeLessThanOrEqual(1);
    });

    it('should handle tied ranks in Spearman correlation', () => {
      const x = [1, 2, 2, 4, 5];
      const y = [3, 4, 4, 6, 7];

      const spearman = service.calculateSpearmanCorrelation(x, y);
      expect(spearman).toBeGreaterThan(0.8);
    });
  });

  describe('Eigenvalue Calculations', () => {
    it('should calculate eigenvalues for 2x2 matrix', () => {
      const matrix = [
        [4, 2],
        [2, 4],
      ];

      const eigenvalues = service.calculateEigenvalues(matrix);

      expect(eigenvalues).toHaveLength(2);
      expect(eigenvalues[0]).toBeCloseTo(6, 5); // Larger eigenvalue
      expect(eigenvalues[1]).toBeCloseTo(2, 5); // Smaller eigenvalue
    });

    it('should calculate eigenvalues for correlation matrix', () => {
      const correlationMatrix = [
        [1.0, 0.8, 0.6],
        [0.8, 1.0, 0.7],
        [0.6, 0.7, 1.0],
      ];

      const eigenvalues = service.calculateEigenvalues(correlationMatrix);

      expect(eigenvalues).toHaveLength(3);

      // Sum of eigenvalues should equal trace (3 for 3x3 correlation matrix)
      const sum = eigenvalues.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(3, 5);

      // First eigenvalue should be largest (positive definite matrix)
      expect(eigenvalues[0]).toBeGreaterThan(eigenvalues[1]);
      expect(eigenvalues[1]).toBeGreaterThan(eigenvalues[2]);

      // All eigenvalues should be positive for correlation matrix
      eigenvalues.forEach((ev) => {
        expect(ev).toBeGreaterThan(0);
      });
    });

    it('should calculate eigenvectors along with eigenvalues', () => {
      const matrix = [
        [3, 1],
        [1, 3],
      ];

      const { values, vectors } = service.calculateEigen(matrix);

      expect(values).toHaveLength(2);
      expect(vectors).toHaveLength(2);
      expect(vectors[0]).toHaveLength(2);

      // Verify Av = λv for each eigenpair
      for (let i = 0; i < values.length; i++) {
        const eigenvalue = values[i];
        const eigenvector = vectors.map((row) => row[i]);

        // Calculate A * v
        const Av = matrix.map((row) =>
          row.reduce((sum, val, j) => sum + val * eigenvector[j], 0),
        );

        // Calculate λ * v
        const lambdaV = eigenvector.map((val) => eigenvalue * val);

        // They should be equal
        Av.forEach((val, j) => {
          expect(val).toBeCloseTo(lambdaV[j], 5);
        });
      }
    });

    it('should handle singular matrices', () => {
      const singularMatrix = [
        [1, 2],
        [2, 4],
      ];

      const eigenvalues = service.calculateEigenvalues(singularMatrix);

      // One eigenvalue should be 0 for singular matrix
      expect(Math.min(...eigenvalues)).toBeCloseTo(0, 5);
    });

    it('should use power iteration for large matrices', () => {
      // Create a 10x10 matrix
      const size = 10;
      const matrix: number[][] = [];
      for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
          matrix[i][j] = i === j ? 2 : 0.1;
        }
      }

      const eigenvalues = service.calculateEigenvalues(matrix, {
        method: 'power',
      });

      expect(eigenvalues).toHaveLength(size);
      expect(eigenvalues[0]).toBeGreaterThan(2);
    });
  });

  describe('Variance and Standard Deviation', () => {
    it('should calculate variance correctly', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const variance = service.calculateVariance(data);

      expect(variance).toBeCloseTo(4, 1); // Population variance
    });

    it('should calculate sample variance correctly', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const variance = service.calculateVariance(data, true); // Sample variance

      expect(variance).toBeCloseTo(4.571, 2);
    });

    it('should calculate standard deviation correctly', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const sd = service.calculateStandardDeviation(data);

      expect(sd).toBeCloseTo(2, 1);
    });

    it('should handle edge cases for variance', () => {
      expect(() => service.calculateVariance([])).toThrow();
      expect(service.calculateVariance([5])).toBe(0);
      expect(service.calculateVariance([1, 1, 1])).toBe(0);
    });

    it('should calculate coefficient of variation', () => {
      const data = [10, 20, 30, 40, 50];
      const cv = service.calculateCoefficientOfVariation(data);

      const mean = 30;
      const sd = Math.sqrt(200);
      const expectedCV = (sd / mean) * 100;

      expect(cv).toBeCloseTo(expectedCV, 1);
    });
  });

  describe('Statistical Tests', () => {
    it('should perform t-test for independent samples', () => {
      const group1 = [1, 2, 3, 4, 5];
      const group2 = [6, 7, 8, 9, 10];

      const result = service.performTTest(group1, group2);

      expect(result.tStatistic).toBeLessThan(0); // Group1 mean < Group2 mean
      expect(result.pValue).toBeLessThan(0.05); // Significant difference
      expect(result.degreesOfFreedom).toBe(8);
    });

    it('should perform paired t-test', () => {
      const before = [1, 2, 3, 4, 5];
      const after = [2, 3, 4, 5, 6];

      const result = service.performPairedTTest(before, after);

      expect(result.tStatistic).toBeLessThan(0); // Before < After
      expect(result.pValue).toBeLessThan(0.05); // Significant difference
      expect(result.meanDifference).toBe(-1);
    });

    it('should calculate chi-square statistic', () => {
      const observed = [20, 30, 25, 25];
      const expected = [25, 25, 25, 25];

      const chiSquare = service.calculateChiSquare(observed, expected);

      expect(chiSquare).toBeCloseTo(2, 1);
    });

    it('should perform ANOVA', () => {
      const groups = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      const result = service.performANOVA(groups);

      expect(result.fStatistic).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.001); // Highly significant
      expect(result.degreesOfFreedomBetween).toBe(2);
      expect(result.degreesOfFreedomWithin).toBe(6);
    });
  });

  describe('Q-Methodology Specific Calculations', () => {
    it('should calculate factor scores correctly', () => {
      const loadings = [0.8, 0.6, 0.4, 0.2];
      const zScores = [1.5, -0.5, 0.5, -1.5];

      const factorScore = service.calculateFactorScore(loadings, zScores);

      const expected = 0.8 * 1.5 + 0.6 * -0.5 + 0.4 * 0.5 + 0.2 * -1.5;
      expect(factorScore).toBeCloseTo(expected, 5);
    });

    it('should calculate distinguishing statements', () => {
      const factorScores = [
        [2.5, -1.0, 0.5], // Statement 1
        [0.3, 0.2, 0.4], // Statement 2
        [-1.5, 2.0, -0.5], // Statement 3
      ];

      const distinguishing = service.identifyDistinguishingStatements(
        factorScores,
        0, // Factor 1
      );

      expect(distinguishing).toContain(0); // Statement 1 is distinguishing for Factor 1
      expect(distinguishing).not.toContain(1); // Statement 2 is not distinguishing
    });

    it('should calculate consensus statements', () => {
      const factorScores = [
        [1.0, 1.1, 0.9], // Consensus
        [2.0, -1.0, 0.0], // Not consensus
        [0.5, 0.6, 0.4], // Consensus
      ];

      const consensus = service.identifyConsensusStatements(factorScores, 0.3);

      expect(consensus).toContain(0);
      expect(consensus).not.toContain(1);
      expect(consensus).toContain(2);
    });

    it('should calculate factor characteristics', () => {
      const factorMatrix = [
        [0.8, 0.1],
        [0.7, 0.2],
        [0.2, 0.9],
        [0.1, 0.85],
      ];

      const characteristics =
        service.calculateFactorCharacteristics(factorMatrix);

      expect(characteristics).toHaveLength(2);

      // Factor 1 characteristics
      expect(characteristics[0].eigenvalue).toBeGreaterThan(0);
      expect(characteristics[0].percentVariance).toBeGreaterThan(0);
      expect(characteristics[0].numberOfDefiningVariables).toBe(2);

      // Factor 2 characteristics
      expect(characteristics[1].numberOfDefiningVariables).toBe(2);
    });
  });

  describe('Matrix Operations', () => {
    it('should transpose matrix correctly', () => {
      const matrix = [
        [1, 2, 3],
        [4, 5, 6],
      ];

      const transposed = service.transposeMatrix(matrix);

      expect(transposed).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });

    it('should multiply matrices correctly', () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      const B = [
        [5, 6],
        [7, 8],
      ];

      const product = service.multiplyMatrices(A, B);

      expect(product).toEqual([
        [19, 22], // 1*5 + 2*7, 1*6 + 2*8
        [43, 50], // 3*5 + 4*7, 3*6 + 4*8
      ]);
    });

    it('should calculate matrix determinant', () => {
      const matrix = [
        [1, 2],
        [3, 4],
      ];

      const det = service.calculateDeterminant(matrix);
      expect(det).toBe(-2); // 1*4 - 2*3
    });

    it('should calculate matrix inverse', () => {
      const matrix = [
        [4, 7],
        [2, 6],
      ];

      const inverse = service.invertMatrix(matrix);

      // Verify A * A^-1 = I
      const product = service.multiplyMatrices(matrix, inverse);

      expect(product[0][0]).toBeCloseTo(1, 5);
      expect(product[0][1]).toBeCloseTo(0, 5);
      expect(product[1][0]).toBeCloseTo(0, 5);
      expect(product[1][1]).toBeCloseTo(1, 5);
    });

    it('should handle singular matrix inversion', () => {
      const singularMatrix = [
        [1, 2],
        [2, 4],
      ];

      expect(() => service.invertMatrix(singularMatrix)).toThrow(
        'Matrix is singular and cannot be inverted',
      );
    });
  });

  describe('Descriptive Statistics', () => {
    it('should calculate mean correctly', () => {
      const data = [1, 2, 3, 4, 5];
      expect(service.calculateMean(data)).toBe(3);
    });

    it('should calculate median correctly', () => {
      const oddData = [1, 3, 5, 7, 9];
      expect(service.calculateMedian(oddData)).toBe(5);

      const evenData = [1, 2, 3, 4];
      expect(service.calculateMedian(evenData)).toBe(2.5);
    });

    it('should calculate mode correctly', () => {
      const data = [1, 2, 2, 3, 3, 3, 4];
      expect(service.calculateMode(data)).toEqual([3]);

      const bimodalData = [1, 1, 2, 2, 3];
      const modes = service.calculateMode(bimodalData);
      expect(modes).toContain(1);
      expect(modes).toContain(2);
    });

    it('should calculate quartiles correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const quartiles = service.calculateQuartiles(data);

      expect(quartiles.Q1).toBe(2.5);
      expect(quartiles.Q2).toBe(5);
      expect(quartiles.Q3).toBe(7.5);
      expect(quartiles.IQR).toBe(5);
    });

    it('should calculate skewness', () => {
      const normalData = [1, 2, 3, 4, 5];
      const skewness = service.calculateSkewness(normalData);
      expect(Math.abs(skewness)).toBeLessThan(0.1); // Nearly symmetric

      const rightSkewed = [1, 1, 1, 2, 3, 4, 10];
      const rightSkew = service.calculateSkewness(rightSkewed);
      expect(rightSkew).toBeGreaterThan(0);
    });

    it('should calculate kurtosis', () => {
      const normalData = [1, 2, 3, 4, 5];
      const kurtosis = service.calculateKurtosis(normalData);

      // Normal distribution has kurtosis around 3 (or 0 for excess kurtosis)
      expect(kurtosis).toBeGreaterThan(-2);
      expect(kurtosis).toBeLessThan(5);
    });
  });

  describe('Confidence Intervals', () => {
    it('should calculate confidence interval for mean', () => {
      const data = [1, 2, 3, 4, 5];
      const ci = service.calculateConfidenceInterval(data, 0.95);

      expect(ci.lower).toBeLessThan(3);
      expect(ci.upper).toBeGreaterThan(3);
      expect(ci.mean).toBe(3);
      expect(ci.confidence).toBe(0.95);
    });

    it('should calculate bootstrap confidence interval', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const bootCI = service.bootstrapConfidenceInterval(data, 1000, 0.95);

      expect(bootCI.lower).toBeLessThan(5.5);
      expect(bootCI.upper).toBeGreaterThan(5.5);
      expect(bootCI.bootstrapMean).toBeCloseTo(5.5, 1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from(
        { length: 10000 },
        () => Math.random() * 100,
      );

      const startTime = Date.now();
      const mean = service.calculateMean(largeData);
      const sd = service.calculateStandardDeviation(largeData);
      const zScores = service.calculateZScores(largeData);
      const endTime = Date.now();

      expect(mean).toBeCloseTo(50, 0);
      expect(sd).toBeGreaterThan(20);
      expect(zScores).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should handle large correlation matrix efficiently', () => {
      const size = 100;
      const data: number[][] = [];

      // Generate random data
      for (let i = 0; i < 500; i++) {
        const row = Array.from({ length: size }, () => Math.random());
        data.push(row);
      }

      const startTime = Date.now();
      const corrMatrix = service.calculateCorrelationMatrix(data);
      const endTime = Date.now();

      expect(corrMatrix).toHaveLength(size);
      expect(corrMatrix[0]).toHaveLength(size);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
