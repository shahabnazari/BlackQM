import { Test, TestingModule } from '@nestjs/testing';
import { RotationEngineService } from '../rotation-engine.service';
import { StatisticsService } from '../statistics.service';
import { AnalysisLoggerService } from '../analysis-logger.service';
import { RotationMethod } from '../../types/rotation.types';

describe('RotationEngineService', () => {
  let service: RotationEngineService;
  let statisticsService: StatisticsService;

  // Test loading matrix (unrotated factor loadings)
  const testLoadingMatrix = [
    [0.741, 0.387, -0.123],
    [0.803, 0.291, -0.089],
    [0.687, 0.432, 0.156],
    [0.592, -0.518, 0.234],
    [0.556, -0.489, 0.301],
    [0.478, -0.623, -0.187],
  ];

  // Simple 2-factor loading matrix for basic tests
  const simpleLoadingMatrix = [
    [0.8, 0.2],
    [0.75, 0.3],
    [0.25, 0.85],
    [0.15, 0.9],
  ];

  // Loading matrix with clear simple structure (for testing convergence)
  const simpleStructureMatrix = [
    [0.9, 0.1],
    [0.85, 0.05],
    [0.88, 0.15],
    [0.05, 0.92],
    [0.1, 0.89],
    [0.08, 0.87],
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotationEngineService,
        StatisticsService,
        {
          provide: AnalysisLoggerService,
          useValue: {
            logRotation: jest.fn(),
            logError: jest.fn(),
            logWarning: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RotationEngineService>(RotationEngineService);
    statisticsService = module.get<StatisticsService>(StatisticsService);
  });

  describe('Varimax Rotation', () => {
    it('should perform Varimax rotation successfully', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.VARIMAX,
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(RotationMethod.VARIMAX);
      expect(result.rotatedLoadings).toHaveLength(6);
      expect(result.rotatedLoadings[0]).toHaveLength(3);
      expect(result.rotationMatrix).toHaveLength(3);
      expect(result.rotationMatrix[0]).toHaveLength(3);
    });

    it('should maximize variance of squared loadings (simple structure)', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleLoadingMatrix,
        method: RotationMethod.VARIMAX,
      });

      // Calculate variance of squared loadings for each factor
      const factor1Squared = result.rotatedLoadings.map((row) => row[0] ** 2);
      const factor2Squared = result.rotatedLoadings.map((row) => row[1] ** 2);

      // After Varimax, variance should be higher than before
      const originalFactor1Squared = simpleLoadingMatrix.map(
        (row) => row[0] ** 2,
      );
      const originalFactor2Squared = simpleLoadingMatrix.map(
        (row) => row[1] ** 2,
      );

      const rotatedVariance1 =
        statisticsService.calculateVariance(factor1Squared);
      const rotatedVariance2 =
        statisticsService.calculateVariance(factor2Squared);
      const originalVariance1 = statisticsService.calculateVariance(
        originalFactor1Squared,
      );
      const originalVariance2 = statisticsService.calculateVariance(
        originalFactor2Squared,
      );

      // Varimax should increase the variance of squared loadings
      const totalRotatedVariance = rotatedVariance1 + rotatedVariance2;
      const totalOriginalVariance = originalVariance1 + originalVariance2;

      expect(totalRotatedVariance).toBeGreaterThanOrEqual(
        totalOriginalVariance,
      );
    });

    it('should converge within iteration limit', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.VARIMAX,
        maxIterations: 100,
        convergenceCriterion: 0.00001,
      });

      expect(result.iterations).toBeLessThanOrEqual(100);
      expect(result.converged).toBe(true);
    });

    it('should maintain orthogonality of factors', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.VARIMAX,
      });

      // Check that rotation matrix is orthogonal (R * R' = I)
      const R = result.rotationMatrix;
      const RT = R[0].map((_, colIndex) => R.map((row) => row[colIndex]));

      // Multiply R * R'
      const product = R.map((row) =>
        RT.map((col) => row.reduce((sum, val, i) => sum + val * col[i], 0)),
      );

      // Should be identity matrix
      product.forEach((row, i) => {
        row.forEach((val, j) => {
          if (i === j) {
            expect(val).toBeCloseTo(1, 5);
          } else {
            expect(val).toBeCloseTo(0, 5);
          }
        });
      });
    });

    it('should handle Kaiser normalization correctly', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
        normalize: true,
      });

      expect(result.normalized).toBe(true);

      // Verify communalities are preserved
      const originalCommunalities = simpleStructureMatrix.map((row) =>
        row.reduce((sum, loading) => sum + loading ** 2, 0),
      );

      const rotatedCommunalities = result.rotatedLoadings.map((row) =>
        row.reduce((sum, loading) => sum + loading ** 2, 0),
      );

      originalCommunalities.forEach((comm, i) => {
        expect(rotatedCommunalities[i]).toBeCloseTo(comm, 3);
      });
    });
  });

  describe('Quartimax Rotation', () => {
    it('should perform Quartimax rotation successfully', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.QUARTIMAX,
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(RotationMethod.QUARTIMAX);
      expect(result.rotatedLoadings).toHaveLength(6);
    });

    it('should minimize complexity of variables', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleLoadingMatrix,
        method: RotationMethod.QUARTIMAX,
      });

      // Quartimax should minimize the number of factors needed to explain each variable
      // This means maximizing the variance of squared loadings across factors for each variable
      const originalComplexity = simpleLoadingMatrix.map((row) => {
        const squared = row.map((l) => l ** 2);
        return statisticsService.calculateVariance(squared);
      });

      const rotatedComplexity = result.rotatedLoadings.map((row) => {
        const squared = row.map((l) => l ** 2);
        return statisticsService.calculateVariance(squared);
      });

      // Average complexity should be higher (clearer loading pattern)
      const avgOriginal =
        originalComplexity.reduce((a, b) => a + b, 0) /
        originalComplexity.length;
      const avgRotated =
        rotatedComplexity.reduce((a, b) => a + b, 0) / rotatedComplexity.length;

      expect(avgRotated).toBeGreaterThanOrEqual(avgOriginal * 0.95); // Allow small tolerance
    });
  });

  describe('Promax Rotation (Oblique)', () => {
    it('should perform Promax rotation successfully', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.PROMAX,
        kappa: 4, // Power parameter
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(RotationMethod.PROMAX);
      expect(result.rotatedLoadings).toHaveLength(6);
      expect(result.factorCorrelations).toBeDefined();
      expect(result.oblique).toBe(true);
    });

    it('should produce oblique factors with correlations', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.PROMAX,
        kappa: 4,
      });

      // Factor correlations should be computed
      expect(result.factorCorrelations).toBeDefined();
      expect(result.factorCorrelations).toHaveLength(2);
      expect(result.factorCorrelations[0]).toHaveLength(2);

      // Diagonal should be 1
      expect(result.factorCorrelations[0][0]).toBeCloseTo(1, 5);
      expect(result.factorCorrelations[1][1]).toBeCloseTo(1, 5);

      // Off-diagonal should be the same (symmetric)
      expect(result.factorCorrelations[0][1]).toBeCloseTo(
        result.factorCorrelations[1][0],
        5,
      );
    });

    it('should handle different kappa values', async () => {
      const kappa2Result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.PROMAX,
        kappa: 2,
      });

      const kappa4Result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.PROMAX,
        kappa: 4,
      });

      // Higher kappa should produce more oblique solution
      const corr2 = Math.abs(kappa2Result.factorCorrelations[0][1]);
      const corr4 = Math.abs(kappa4Result.factorCorrelations[0][1]);

      // Generally, higher kappa leads to higher factor correlations
      expect(corr4).toBeGreaterThanOrEqual(corr2 * 0.9); // Allow some tolerance
    });

    it('should compute pattern and structure matrices', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.PROMAX,
        kappa: 4,
      });

      // Pattern matrix
      expect(result.patternMatrix).toBeDefined();
      expect(result.patternMatrix).toHaveLength(6);

      // Structure matrix
      expect(result.structureMatrix).toBeDefined();
      expect(result.structureMatrix).toHaveLength(6);

      // Structure = Pattern * FactorCorrelations
      // Verify this relationship for first element
      if (result.patternMatrix && result.structureMatrix) {
        const calculatedStructure = result.patternMatrix.map((row) =>
          result.factorCorrelations[0].map((_, j) =>
            row.reduce(
              (sum, val, k) => sum + val * result.factorCorrelations[k][j],
              0,
            ),
          ),
        );

        calculatedStructure.forEach((row, i) => {
          row.forEach((val, j) => {
            expect(val).toBeCloseTo(result.structureMatrix![i][j], 3);
          });
        });
      }
    });
  });

  describe('Direct Oblimin Rotation', () => {
    it('should perform Direct Oblimin rotation successfully', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.OBLIMIN,
        gamma: 0, // Quartimin
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(RotationMethod.OBLIMIN);
      expect(result.rotatedLoadings).toHaveLength(6);
      expect(result.factorCorrelations).toBeDefined();
      expect(result.oblique).toBe(true);
    });

    it('should handle different gamma values correctly', async () => {
      // Gamma = 0 (Quartimin)
      const quartiminResult = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.OBLIMIN,
        gamma: 0,
      });

      // Gamma = 0.5 (Biquartimin)
      const biquartiminResult = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.OBLIMIN,
        gamma: 0.5,
      });

      // Gamma = 1 (Covarimin)
      const covariminResult = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.OBLIMIN,
        gamma: 1,
      });

      // All should produce valid results
      expect(quartiminResult.converged).toBe(true);
      expect(biquartiminResult.converged).toBe(true);
      expect(covariminResult.converged).toBe(true);

      // Different gamma values should produce different solutions
      const corr0 = Math.abs(quartiminResult.factorCorrelations[0][1]);
      const corr05 = Math.abs(biquartiminResult.factorCorrelations[0][1]);
      const corr1 = Math.abs(covariminResult.factorCorrelations[0][1]);

      // Correlations should differ
      expect(corr0).not.toBeCloseTo(corr1, 2);
    });

    it('should converge for well-conditioned problems', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.OBLIMIN,
        gamma: 0,
        maxIterations: 100,
        convergenceCriterion: 0.00001,
      });

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(100);
    });
  });

  describe('Interactive Rotation', () => {
    it('should support interactive manual rotation', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.MANUAL,
        rotationAngles: {
          theta: Math.PI / 4, // 45 degrees
          phi: 0,
          psi: 0,
        },
      });

      expect(result).toBeDefined();
      expect(result.method).toBe(RotationMethod.MANUAL);
      expect(result.rotatedLoadings).toHaveLength(6);
    });

    it('should apply rotation angles correctly', async () => {
      // Rotate by 90 degrees around first axis
      const result = await service.rotate({
        loadingMatrix: simpleLoadingMatrix,
        method: RotationMethod.MANUAL,
        rotationAngles: {
          theta: Math.PI / 2, // 90 degrees
          phi: 0,
          psi: 0,
        },
      });

      // After 90-degree rotation, factors should be swapped (approximately)
      const original = simpleLoadingMatrix;
      const rotated = result.rotatedLoadings;

      // First variable had high loading on factor 1, should now have high on factor 2
      expect(Math.abs(rotated[0][1])).toBeGreaterThan(Math.abs(rotated[0][0]));
    });

    it('should support incremental rotation', async () => {
      // First rotation
      const result1 = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.MANUAL,
        rotationAngles: {
          theta: Math.PI / 6, // 30 degrees
          phi: 0,
          psi: 0,
        },
      });

      // Second rotation starting from first result
      const result2 = await service.rotate({
        loadingMatrix: result1.rotatedLoadings,
        method: RotationMethod.MANUAL,
        rotationAngles: {
          theta: Math.PI / 6, // Another 30 degrees
          phi: 0,
          psi: 0,
        },
      });

      // Combined rotation of 60 degrees
      const combinedResult = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.MANUAL,
        rotationAngles: {
          theta: Math.PI / 3, // 60 degrees
          phi: 0,
          psi: 0,
        },
      });

      // Results should be similar
      result2.rotatedLoadings.forEach((row, i) => {
        row.forEach((val, j) => {
          expect(val).toBeCloseTo(combinedResult.rotatedLoadings[i][j], 3);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty loading matrix', async () => {
      await expect(
        service.rotate({
          loadingMatrix: [],
          method: RotationMethod.VARIMAX,
        }),
      ).rejects.toThrow('Loading matrix cannot be empty');
    });

    it('should handle single factor (no rotation needed)', async () => {
      const singleFactorMatrix = [[0.8], [0.7], [0.6], [0.5]];

      await expect(
        service.rotate({
          loadingMatrix: singleFactorMatrix,
          method: RotationMethod.VARIMAX,
        }),
      ).rejects.toThrow('Cannot rotate single factor');
    });

    it('should handle non-convergence gracefully', async () => {
      const result = await service.rotate({
        loadingMatrix: testLoadingMatrix,
        method: RotationMethod.VARIMAX,
        maxIterations: 1, // Force non-convergence
        convergenceCriterion: 0.00000001,
      });

      expect(result.converged).toBe(false);
      expect(result.warnings).toContain('Rotation did not converge');
    });

    it('should validate rotation angles for manual rotation', async () => {
      await expect(
        service.rotate({
          loadingMatrix: testLoadingMatrix,
          method: RotationMethod.MANUAL,
          // Missing rotation angles
        }),
      ).rejects.toThrow('Rotation angles required for manual rotation');
    });

    it('should handle invalid kappa values for Promax', async () => {
      await expect(
        service.rotate({
          loadingMatrix: testLoadingMatrix,
          method: RotationMethod.PROMAX,
          kappa: -1, // Invalid
        }),
      ).rejects.toThrow('Kappa must be greater than 1');
    });

    it('should handle invalid gamma values for Oblimin', async () => {
      await expect(
        service.rotate({
          loadingMatrix: testLoadingMatrix,
          method: RotationMethod.OBLIMIN,
          gamma: 2, // Invalid (should be <= 1)
        }),
      ).rejects.toThrow('Gamma must be between -1 and 1');
    });
  });

  describe('Rotation Quality Metrics', () => {
    it('should calculate rotation quality metrics', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
      });

      expect(result.quality).toBeDefined();
      expect(result.quality.simplicityIndex).toBeDefined();
      expect(result.quality.hyperplaneCount).toBeDefined();
      expect(result.quality.complexityIndex).toBeDefined();
    });

    it('should identify hyperplane items', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
      });

      // Count items with loadings < 0.10 on all factors
      const hyperplaneItems = result.rotatedLoadings.filter((row) =>
        row.every((loading) => Math.abs(loading) < 0.1),
      );

      if (result.quality) {
        expect(result.quality.hyperplaneCount).toBe(hyperplaneItems.length);
      }
    });

    it('should calculate simplicity index correctly', async () => {
      const result = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
      });

      if (result.quality) {
        // Simplicity index should be between 0 and 1
        expect(result.quality.simplicityIndex).toBeGreaterThanOrEqual(0);
        expect(result.quality.simplicityIndex).toBeLessThanOrEqual(1);

        // For simple structure matrix, should be relatively high
        expect(result.quality.simplicityIndex).toBeGreaterThan(0.7);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large loading matrices efficiently', async () => {
      // Create a 100x10 loading matrix
      const largeMatrix: number[][] = [];
      for (let i = 0; i < 100; i++) {
        const row = [];
        for (let j = 0; j < 10; j++) {
          // Generate realistic loading values
          row.push((Math.random() - 0.5) * 1.5);
        }
        largeMatrix.push(row);
      }

      const startTime = Date.now();
      const result = await service.rotate({
        loadingMatrix: largeMatrix,
        method: RotationMethod.VARIMAX,
        maxIterations: 500,
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain numerical stability with extreme values', async () => {
      const extremeMatrix = [
        [0.999, 0.001],
        [0.998, 0.002],
        [0.001, 0.999],
        [0.002, 0.998],
      ];

      const result = await service.rotate({
        loadingMatrix: extremeMatrix,
        method: RotationMethod.VARIMAX,
      });

      // Should not produce NaN or Infinity
      result.rotatedLoadings.forEach((row) => {
        row.forEach((val) => {
          expect(isFinite(val)).toBe(true);
          expect(isNaN(val)).toBe(false);
        });
      });
    });
  });

  describe('Comparison Tests', () => {
    it('should produce similar results for Varimax across different starting points', async () => {
      // Test rotation invariance
      const result1 = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
      });

      // Start from a randomly rotated version
      const randomRotation = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.MANUAL,
        rotationAngles: { theta: 0.5, phi: 0.3, psi: 0.2 },
      });

      const result2 = await service.rotate({
        loadingMatrix: randomRotation.rotatedLoadings,
        method: RotationMethod.VARIMAX,
      });

      // Should converge to similar simple structure
      const variance1 = result1.rotatedLoadings.flat().map((x) => x ** 2);
      const variance2 = result2.rotatedLoadings.flat().map((x) => x ** 2);

      const totalVar1 = statisticsService.calculateVariance(variance1);
      const totalVar2 = statisticsService.calculateVariance(variance2);

      expect(totalVar1).toBeCloseTo(totalVar2, 2);
    });

    it('should produce orthogonal solution for Varimax and oblique for Promax', async () => {
      const varimaxResult = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.VARIMAX,
      });

      const promaxResult = await service.rotate({
        loadingMatrix: simpleStructureMatrix,
        method: RotationMethod.PROMAX,
        kappa: 4,
      });

      // Varimax should be orthogonal
      expect(varimaxResult.oblique).toBe(false);

      // Promax should be oblique with factor correlations
      expect(promaxResult.oblique).toBe(true);
      expect(promaxResult.factorCorrelations).toBeDefined();

      // Factor correlation should be non-zero for oblique
      const offDiagonalCorr = Math.abs(promaxResult.factorCorrelations[0][1]);
      expect(offDiagonalCorr).toBeGreaterThan(0.01);
    });
  });
});
