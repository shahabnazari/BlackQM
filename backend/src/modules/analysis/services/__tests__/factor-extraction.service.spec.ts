import { Test, TestingModule } from '@nestjs/testing';
import { FactorExtractionService } from '../factor-extraction.service';
import { StatisticsService } from '../statistics.service';
import { AnalysisLoggerService } from '../analysis-logger.service';
import { ExtractionMethod } from '../../types/extraction.types';

describe('FactorExtractionService', () => {
  let service: FactorExtractionService;
  let statisticsService: StatisticsService;

  // Test data: Small correlation matrix for predictable results
  const testCorrelationMatrix = [
    [1.0, 0.8, 0.6, 0.4],
    [0.8, 1.0, 0.7, 0.5],
    [0.6, 0.7, 1.0, 0.65],
    [0.4, 0.5, 0.65, 1.0],
  ];

  // Larger test matrix for more complex scenarios
  const largeTestMatrix = [
    [1.0, 0.85, 0.72, 0.45, 0.38, 0.29],
    [0.85, 1.0, 0.68, 0.52, 0.41, 0.33],
    [0.72, 0.68, 1.0, 0.61, 0.55, 0.42],
    [0.45, 0.52, 0.61, 1.0, 0.78, 0.65],
    [0.38, 0.41, 0.55, 0.78, 1.0, 0.71],
    [0.29, 0.33, 0.42, 0.65, 0.71, 1.0],
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactorExtractionService,
        StatisticsService,
        {
          provide: AnalysisLoggerService,
          useValue: {
            logExtraction: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FactorExtractionService>(FactorExtractionService);
    statisticsService = module.get<StatisticsService>(StatisticsService);
  });

  describe('Principal Component Analysis (PCA)', () => {
    it('should extract factors using PCA method', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 2,
      });

      expect(result).toBeDefined();
      expect(result.eigenvalues).toHaveLength(4);
      expect(result.factorLoadings).toHaveLength(4);
      expect(result.factorLoadings[0]).toHaveLength(2);
    });

    it('should calculate correct eigenvalues for PCA', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 2,
      });

      // First eigenvalue should be the largest
      expect(result.eigenvalues[0]).toBeGreaterThan(result.eigenvalues[1]);
      expect(result.eigenvalues[1]).toBeGreaterThan(result.eigenvalues[2]);

      // Sum of eigenvalues should equal trace of correlation matrix
      const eigenSum = result.eigenvalues.reduce((sum, val) => sum + val, 0);
      expect(eigenSum).toBeCloseTo(4.0, 5); // Trace of 4x4 identity diagonal
    });

    it('should extract specified number of factors', async () => {
      const result = await service.extractFactors({
        correlationMatrix: largeTestMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 3,
      });

      expect(result.factorLoadings[0]).toHaveLength(3);
      expect(result.numberOfFactors).toBe(3);
    });

    it('should use Kaiser criterion when numberOfFactors not specified', async () => {
      const result = await service.extractFactors({
        correlationMatrix: largeTestMatrix,
        method: ExtractionMethod.PCA,
        minEigenvalue: 1.0,
      });

      // Should only extract factors with eigenvalues > 1.0
      const significantFactors = result.eigenvalues.filter(
        (e) => e > 1.0,
      ).length;
      expect(result.numberOfFactors).toBe(significantFactors);
    });

    it('should calculate variance explained correctly', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 2,
      });

      expect(result.variance).toBeDefined();
      expect(result.cumulativeVariance).toBeDefined();

      // Variance percentages should sum to less than or equal to 100
      const totalVariance = result.variance.reduce((sum, v) => sum + v, 0);
      expect(totalVariance).toBeLessThanOrEqual(100);

      // Cumulative variance should be increasing
      for (let i = 1; i < result.cumulativeVariance.length; i++) {
        expect(result.cumulativeVariance[i]).toBeGreaterThanOrEqual(
          result.cumulativeVariance[i - 1],
        );
      }
    });
  });

  describe('Centroid Method', () => {
    it('should extract factors using Centroid method', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.CENTROID,
        numberOfFactors: 2,
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(ExtractionMethod.CENTROID);
      expect(result.factorLoadings).toHaveLength(4);
    });

    it('should produce orthogonal factors in Centroid method', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.CENTROID,
        numberOfFactors: 2,
      });

      // Check that factors are reasonably orthogonal
      // Calculate correlation between factor loadings
      const factor1 = result.factorLoadings.map((row) => row[0]);
      const factor2 = result.factorLoadings.map((row) => row[1]);

      const correlation = statisticsService.calculateCorrelation(
        factor1,
        factor2,
      );
      expect(Math.abs(correlation)).toBeLessThan(0.3); // Should be close to 0
    });
  });

  describe('Maximum Likelihood (ML)', () => {
    it('should extract factors using ML method', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.ML,
        numberOfFactors: 2,
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(ExtractionMethod.ML);
      expect(result.factorLoadings).toHaveLength(4);
    });

    it('should converge within iteration limit', async () => {
      const result = await service.extractFactors({
        correlationMatrix: largeTestMatrix,
        method: ExtractionMethod.ML,
        numberOfFactors: 2,
        maxIterations: 100,
      });

      expect(result.iterations).toBeLessThanOrEqual(100);
      expect(result.converged).toBeDefined();
    });

    it('should calculate chi-square goodness of fit for ML', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.ML,
        numberOfFactors: 2,
        sampleSize: 100,
      });

      expect(result.chiSquare).toBeDefined();
      expect(result.chiSquare).toBeGreaterThanOrEqual(0);
      expect(result.degreesOfFreedom).toBeDefined();
    });
  });

  describe('Communalities Calculation', () => {
    it('should calculate initial communalities correctly', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 2,
      });

      expect(result.communalities).toBeDefined();
      expect(result.communalities).toHaveLength(4);

      // Communalities should be between 0 and 1
      result.communalities.forEach((communality) => {
        expect(communality).toBeGreaterThanOrEqual(0);
        expect(communality).toBeLessThanOrEqual(1);
      });
    });

    it('should update communalities iteratively in ML method', async () => {
      const result = await service.extractFactors({
        correlationMatrix: testCorrelationMatrix,
        method: ExtractionMethod.ML,
        numberOfFactors: 2,
      });

      // Final communalities should reflect extracted variance
      const communalities = result.communalities;

      // Calculate communalities from loadings
      const calculatedCommunalities = result.factorLoadings.map((row) =>
        row.reduce((sum, loading) => sum + loading * loading, 0),
      );

      // Should match calculated values
      communalities.forEach((comm, i) => {
        expect(comm).toBeCloseTo(calculatedCommunalities[i], 3);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle singular correlation matrix', async () => {
      const singularMatrix = [
        [1.0, 1.0, 0.5],
        [1.0, 1.0, 0.5],
        [0.5, 0.5, 1.0],
      ];

      await expect(
        service.extractFactors({
          correlationMatrix: singularMatrix,
          method: ExtractionMethod.PCA,
          numberOfFactors: 2,
        }),
      ).rejects.toThrow();
    });

    it('should handle non-positive definite matrix', async () => {
      const invalidMatrix = [
        [1.0, 1.2, 0.5], // Invalid correlation > 1
        [1.2, 1.0, 0.3],
        [0.5, 0.3, 1.0],
      ];

      await expect(
        service.extractFactors({
          correlationMatrix: invalidMatrix,
          method: ExtractionMethod.PCA,
          numberOfFactors: 2,
        }),
      ).rejects.toThrow('Invalid correlation matrix');
    });

    it('should handle requesting more factors than variables', async () => {
      await expect(
        service.extractFactors({
          correlationMatrix: testCorrelationMatrix,
          method: ExtractionMethod.PCA,
          numberOfFactors: 5, // More than 4 variables
        }),
      ).rejects.toThrow('Number of factors cannot exceed number of variables');
    });

    it('should handle empty correlation matrix', async () => {
      await expect(
        service.extractFactors({
          correlationMatrix: [],
          method: ExtractionMethod.PCA,
          numberOfFactors: 2,
        }),
      ).rejects.toThrow('Correlation matrix cannot be empty');
    });

    it('should handle non-square correlation matrix', async () => {
      const nonSquareMatrix = [
        [1.0, 0.5, 0.3],
        [0.5, 1.0],
      ];

      await expect(
        service.extractFactors({
          correlationMatrix: nonSquareMatrix,
          method: ExtractionMethod.PCA,
          numberOfFactors: 2,
        }),
      ).rejects.toThrow('Correlation matrix must be square');
    });
  });

  describe('Heywood Cases Detection', () => {
    it('should detect Heywood cases (communalities > 1)', async () => {
      // Create a problematic matrix that might produce Heywood cases
      const problematicMatrix = [
        [1.0, 0.95, 0.95],
        [0.95, 1.0, 0.95],
        [0.95, 0.95, 1.0],
      ];

      const result = await service.extractFactors({
        correlationMatrix: problematicMatrix,
        method: ExtractionMethod.ML,
        numberOfFactors: 2,
      });

      // Check if Heywood case was detected and handled
      if (result.heywoodCase) {
        expect(result.warnings).toContain('Heywood case detected');
        // All communalities should be <= 1 after correction
        result.communalities.forEach((comm) => {
          expect(comm).toBeLessThanOrEqual(1.0);
        });
      }
    });
  });

  describe('Scree Data Generation', () => {
    it('should generate scree plot data', async () => {
      const result = await service.extractFactors({
        correlationMatrix: largeTestMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 3,
      });

      expect(result.screeData).toBeDefined();
      expect(result.screeData).toHaveLength(6); // For 6x6 matrix

      result.screeData.forEach((point, index) => {
        expect(point.factor).toBe(index + 1);
        expect(point.eigenvalue).toBe(result.eigenvalues[index]);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large correlation matrices efficiently', async () => {
      // Create a 50x50 correlation matrix
      const size = 50;
      const largeMatrix: number[][] = [];

      for (let i = 0; i < size; i++) {
        largeMatrix[i] = [];
        for (let j = 0; j < size; j++) {
          if (i === j) {
            largeMatrix[i][j] = 1.0;
          } else {
            // Generate realistic correlation values
            largeMatrix[i][j] = Math.max(
              -0.9,
              Math.min(0.9, 0.7 * Math.exp(-Math.abs(i - j) / 10)),
            );
          }
        }
      }

      const startTime = Date.now();
      const result = await service.extractFactors({
        correlationMatrix: largeMatrix,
        method: ExtractionMethod.PCA,
        numberOfFactors: 5,
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
