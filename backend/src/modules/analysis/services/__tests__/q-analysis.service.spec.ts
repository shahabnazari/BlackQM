import { Test, TestingModule } from '@nestjs/testing';
import { QAnalysisService } from '../q-analysis.service';
import { FactorExtractionService } from '../factor-extraction.service';
import { RotationEngineService } from '../rotation-engine.service';
import { StatisticalOutputService } from '../statistical-output.service';
import { PQMethodCompatibilityService } from '../pqmethod-compatibility.service';
import { StatisticsService } from '../statistics.service';
import { CacheService } from '../cache.service';
import { AnalysisLoggerService } from '../analysis-logger.service';
import { PrismaService } from '../../../../common/prisma.service';
import { ExtractionMethod } from '../../types/extraction.types';
import { RotationMethod } from '../../types/rotation.types';

describe('QAnalysisService - Comprehensive Error Handling', () => {
  let service: QAnalysisService;
  let factorExtractionService: FactorExtractionService;
  let rotationEngineService: RotationEngineService;
  let statisticalOutputService: StatisticalOutputService;
  let pqMethodCompatibilityService: PQMethodCompatibilityService;
  let cacheService: CacheService;

  // Mock data
  const validStudyData = {
    id: 'test-study-123',
    name: 'Test Study',
    numberOfStatements: 30,
    numberOfSorts: 20,
    distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    frequencies: [1, 2, 3, 4, 4, 4, 3, 2, 1],
    sorts: generateValidSorts(20, 30),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QAnalysisService,
        FactorExtractionService,
        RotationEngineService,
        StatisticalOutputService,
        PQMethodCompatibilityService,
        StatisticsService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            flush: jest.fn(),
          },
        },
        {
          provide: AnalysisLoggerService,
          useValue: {
            logAnalysis: jest.fn(),
            logError: jest.fn(),
            logWarning: jest.fn(),
            logPerformance: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            study: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            analysisResult: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QAnalysisService>(QAnalysisService);
    factorExtractionService = module.get<FactorExtractionService>(
      FactorExtractionService,
    );
    rotationEngineService = module.get<RotationEngineService>(
      RotationEngineService,
    );
    statisticalOutputService = module.get<StatisticalOutputService>(
      StatisticalOutputService,
    );
    pqMethodCompatibilityService = module.get<PQMethodCompatibilityService>(
      PQMethodCompatibilityService,
    );
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('Input Validation Errors', () => {
    it('should reject analysis with no sorts', async () => {
      const invalidData = { ...validStudyData, sorts: [] };

      await expect(service.runAnalysis(invalidData)).rejects.toThrow(
        'Cannot run analysis without sort data',
      );
    });

    it('should reject analysis with inconsistent sort lengths', async () => {
      const invalidData = {
        ...validStudyData,
        sorts: [
          { id: 'P1', rankings: [1, 2, 3] }, // Too few
          { id: 'P2', rankings: Array(30).fill(0) }, // Correct
        ],
      };

      await expect(service.runAnalysis(invalidData)).rejects.toThrow(
        'Inconsistent sort lengths',
      );
    });

    it('should reject invalid extraction method', async () => {
      await expect(
        service.runAnalysis({
          ...validStudyData,
          extractionMethod: 'INVALID_METHOD' as any,
        }),
      ).rejects.toThrow('Invalid extraction method');
    });

    it('should reject invalid rotation method', async () => {
      await expect(
        service.runAnalysis({
          ...validStudyData,
          rotationMethod: 'INVALID_ROTATION' as any,
        }),
      ).rejects.toThrow('Invalid rotation method');
    });

    it('should reject negative number of factors', async () => {
      await expect(
        service.runAnalysis({
          ...validStudyData,
          numberOfFactors: -1,
        }),
      ).rejects.toThrow('Number of factors must be positive');
    });

    it('should reject more factors than variables', async () => {
      await expect(
        service.runAnalysis({
          ...validStudyData,
          numberOfFactors: 25, // More than 20 sorts
        }),
      ).rejects.toThrow('Number of factors cannot exceed number of sorts');
    });

    it('should validate Q-sort distribution integrity', async () => {
      const invalidData = {
        ...validStudyData,
        sorts: [
          {
            id: 'P1',
            rankings: [5, 5, 5, 5, 5], // Invalid rankings outside distribution
          },
        ],
      };

      await expect(service.runAnalysis(invalidData)).rejects.toThrow(
        'Invalid Q-sort rankings',
      );
    });
  });

  describe('Data Quality Errors', () => {
    it('should detect and handle multicollinearity', async () => {
      // Create sorts that are perfectly correlated
      const collinearSorts = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `P${i}`,
          rankings: Array(30)
            .fill(0)
            .map((_, j) => (j % 9) - 4),
        }));

      const result = await service.runAnalysis({
        ...validStudyData,
        sorts: collinearSorts,
      });

      expect(result.warnings).toContain('High multicollinearity detected');
      expect(result.dataQuality.multicollinearity).toBe(true);
    });

    it('should detect insufficient variance in sorts', async () => {
      const lowVarianceSorts = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `P${i}`,
          rankings: Array(30).fill(0), // All neutral rankings
        }));

      await expect(
        service.runAnalysis({
          ...validStudyData,
          sorts: lowVarianceSorts,
        }),
      ).rejects.toThrow('Insufficient variance in sort data');
    });

    it('should handle missing data appropriately', async () => {
      const sortsWithMissing = [
        { id: 'P1', rankings: [1, 2, null, 4, 5] as any },
        { id: 'P2', rankings: [1, 2, 3, 4, 5] },
      ];

      const result = await service.runAnalysis({
        ...validStudyData,
        sorts: sortsWithMissing,
        handleMissing: 'impute',
      });

      expect(result.dataQuality.missingDataHandled).toBe(true);
      expect(result.warnings).toContain('Missing data was imputed');
    });

    it('should reject analysis with too much missing data', async () => {
      const tooMuchMissing = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `P${i}`,
          rankings: Array(30).fill(null),
        }));

      await expect(
        service.runAnalysis({
          ...validStudyData,
          sorts: tooMuchMissing as any,
        }),
      ).rejects.toThrow('Too much missing data');
    });
  });

  describe('Computational Errors', () => {
    it('should handle non-positive definite correlation matrix', async () => {
      // Mock a scenario where correlation matrix is not positive definite
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockRejectedValueOnce(new Error('Matrix is not positive definite'));

      const result = await service.runAnalysis(validStudyData);

      expect(result.errors).toContain(
        'Correlation matrix is not positive definite',
      );
      expect(result.fallbackMethod).toBe('regularized');
    });

    it('should handle extraction convergence failure', async () => {
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockResolvedValueOnce({
          converged: false,
          iterations: 1000,
          eigenvalues: [],
          factorLoadings: [],
          warnings: ['Failed to converge'],
        } as any);

      const result = await service.runAnalysis({
        ...validStudyData,
        extractionMethod: ExtractionMethod.ML,
      });

      expect(result.warnings).toContain('Extraction did not converge');
      expect(result.extractionConverged).toBe(false);
    });

    it('should handle rotation convergence failure', async () => {
      jest.spyOn(rotationEngineService, 'rotate').mockResolvedValueOnce({
        converged: false,
        iterations: 500,
        rotatedLoadings: [],
        warnings: ['Rotation did not converge'],
      } as any);

      const result = await service.runAnalysis({
        ...validStudyData,
        rotationMethod: RotationMethod.OBLIMIN,
      });

      expect(result.warnings).toContain('Rotation did not converge');
      expect(result.rotationConverged).toBe(false);
    });

    it('should handle Heywood cases', async () => {
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockResolvedValueOnce({
          heywoodCase: true,
          communalities: [1.05, 0.98, 1.02], // Some > 1
          warnings: ['Heywood case detected'],
        } as any);

      const result = await service.runAnalysis(validStudyData);

      expect(result.warnings).toContain('Heywood case detected and corrected');
      expect(result.heywoodCaseCorrected).toBe(true);
    });

    it('should handle numerical instability', async () => {
      const extremeData = {
        ...validStudyData,
        sorts: Array(20)
          .fill(null)
          .map((_, i) => ({
            id: `P${i}`,
            rankings: Array(30)
              .fill(0)
              .map(
                () => (Math.random() < 0.5 ? -4 : 4), // Extreme bimodal distribution
              ),
          })),
      };

      const result = await service.runAnalysis(extremeData);

      expect(result.warnings).toContain('Numerical instability detected');
      expect(result.numericallyStable).toBe(false);
    });
  });

  describe('Memory and Performance Errors', () => {
    it('should handle large dataset memory constraints', async () => {
      const largeData = {
        ...validStudyData,
        numberOfStatements: 1000,
        numberOfSorts: 500,
        sorts: generateValidSorts(500, 1000),
      };

      // Mock memory check
      jest
        .spyOn(service as any, 'checkMemoryRequirements')
        .mockReturnValueOnce({
          sufficient: false,
          required: 8192,
          available: 4096,
        });

      await expect(service.runAnalysis(largeData)).rejects.toThrow(
        'Insufficient memory for analysis',
      );
    });

    it('should timeout on extremely long computations', async () => {
      jest.spyOn(factorExtractionService, 'extractFactors').mockImplementation(
        () =>
          new Promise(
            (resolve) => setTimeout(resolve, 70000), // 70 seconds
          ),
      );

      await expect(
        service.runAnalysis(validStudyData, { timeout: 60000 }),
      ).rejects.toThrow('Analysis timeout exceeded');
    });

    it('should handle stack overflow in recursive algorithms', async () => {
      // Mock a deep recursion scenario
      jest
        .spyOn(rotationEngineService as any, 'recursiveOptimization')
        .mockRejectedValueOnce(
          new RangeError('Maximum call stack size exceeded'),
        );

      await expect(
        service.runAnalysis({
          ...validStudyData,
          rotationMethod: RotationMethod.OBLIMIN,
          optimizationDepth: 10000,
        } as any),
      ).rejects.toThrow('Stack overflow in rotation optimization');
    });
  });

  describe('Cache and Storage Errors', () => {
    it('should handle cache retrieval failure gracefully', async () => {
      jest
        .spyOn(cacheService, 'get')
        .mockRejectedValueOnce(new Error('Redis connection lost'));

      // Should continue without cache
      const result = await service.runAnalysis(validStudyData);

      expect(result).toBeDefined();
      expect(result.cacheUsed).toBe(false);
    });

    it('should handle cache write failure gracefully', async () => {
      jest
        .spyOn(cacheService, 'set')
        .mockRejectedValueOnce(new Error('Cache storage full'));

      const result = await service.runAnalysis(validStudyData);

      expect(result).toBeDefined();
      expect(result.warnings).toContain('Failed to cache results');
    });

    it('should handle database save failure', async () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      jest
        .spyOn(prismaService.analysisResult, 'create')
        .mockRejectedValueOnce(new Error('Database connection lost'));

      const result = await service.runAnalysis({
        ...validStudyData,
        saveToDatabase: true,
      });

      expect(result.savedToDatabase).toBe(false);
      expect(result.errors).toContain('Failed to save to database');
    });
  });

  describe('Concurrent Analysis Errors', () => {
    it('should handle concurrent analysis conflicts', async () => {
      const analysisPromises = Array(5)
        .fill(null)
        .map(() => service.runAnalysis(validStudyData));

      const results = await Promise.allSettled(analysisPromises);

      const successful = results.filter((r) => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate analysis runs', async () => {
      // Start first analysis
      const firstAnalysis = service.runAnalysis({
        ...validStudyData,
        id: 'duplicate-test',
      });

      // Try to start same analysis again
      await expect(
        service.runAnalysis({
          ...validStudyData,
          id: 'duplicate-test',
        }),
      ).rejects.toThrow('Analysis already in progress');

      await firstAnalysis; // Wait for first to complete
    });

    it('should handle resource contention', async () => {
      // Simulate multiple analyses competing for resources
      const analyses = Array(10)
        .fill(null)
        .map((_, i) =>
          service.runAnalysis({
            ...validStudyData,
            id: `resource-test-${i}`,
            priority: Math.random() > 0.5 ? 'high' : 'low',
          }),
        );

      const results = await Promise.allSettled(analyses);

      // High priority should complete more often
      const highPrioritySuccess = results.filter(
        (r, i) => r.status === 'fulfilled' && i < 5,
      ).length;

      expect(highPrioritySuccess).toBeGreaterThan(2);
    });
  });

  describe('PQMethod Compatibility Errors', () => {
    it('should handle PQMethod format incompatibility', async () => {
      jest
        .spyOn(pqMethodCompatibilityService, 'validateAgainstPQMethod')
        .mockResolvedValueOnce({
          overallMatch: 0.85, // Below threshold
          warnings: ['Significant deviation from PQMethod'],
        } as any);

      const result = await service.runAnalysis({
        ...validStudyData,
        validatePQMethod: true,
      });

      expect(result.pqMethodCompatible).toBe(false);
      expect(result.warnings).toContain('Results differ from PQMethod');
    });

    it('should handle PQMethod file parsing errors', async () => {
      await expect(
        service.importPQMethodFile('corrupted.dat', 'invalid content'),
      ).rejects.toThrow('Invalid PQMethod file format');
    });

    it('should handle PQMethod export failures', async () => {
      jest
        .spyOn(pqMethodCompatibilityService, 'generateDATFile')
        .mockImplementation(() => {
          throw new Error('Export format error');
        });

      const result = await service.runAnalysis(validStudyData);

      await expect(service.exportToPQMethod(result)).rejects.toThrow(
        'Failed to export to PQMethod format',
      );
    });
  });

  describe('Recovery and Fallback Mechanisms', () => {
    it('should fallback to PCA when ML fails', async () => {
      let callCount = 0;
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockImplementation(async (params: any) => {
          if (params.method === ExtractionMethod.ML && callCount === 0) {
            callCount++;
            throw new Error('ML extraction failed');
          }
          return {
            method: params.method,
            eigenvalues: [2, 1],
            factorLoadings: [[0.7, 0.3]],
            converged: true,
          } as any;
        });

      const result = await service.runAnalysis({
        ...validStudyData,
        extractionMethod: ExtractionMethod.ML,
      });

      expect(result.extractionMethod).toBe(ExtractionMethod.PCA);
      expect(result.warnings).toContain('Fallback to PCA from ML');
    });

    it('should retry with regularization on singular matrix', async () => {
      let attempts = 0;
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockImplementation(async () => {
          if (attempts === 0) {
            attempts++;
            throw new Error('Singular matrix');
          }
          return {
            eigenvalues: [2, 1],
            factorLoadings: [[0.7, 0.3]],
            regularized: true,
          } as any;
        });

      const result = await service.runAnalysis(validStudyData);

      expect(result.regularizationApplied).toBe(true);
      expect(result.warnings).toContain('Regularization applied');
    });

    it('should handle partial failure gracefully', async () => {
      // Extraction succeeds but rotation fails
      jest
        .spyOn(rotationEngineService, 'rotate')
        .mockRejectedValueOnce(new Error('Rotation failed'));

      const result = await service.runAnalysis(validStudyData);

      expect(result.extractionComplete).toBe(true);
      expect(result.rotationComplete).toBe(false);
      expect(result.partialResults).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle single participant analysis', async () => {
      const singleSort = {
        ...validStudyData,
        numberOfSorts: 1,
        sorts: [{ id: 'P1', rankings: Array(30).fill(0) }],
      };

      await expect(service.runAnalysis(singleSort)).rejects.toThrow(
        'Cannot perform factor analysis with single sort',
      );
    });

    it('should handle single statement analysis', async () => {
      const singleStatement = {
        ...validStudyData,
        numberOfStatements: 1,
        sorts: generateValidSorts(20, 1),
      };

      await expect(service.runAnalysis(singleStatement)).rejects.toThrow(
        'Insufficient statements for analysis',
      );
    });

    it('should handle zero variance in all factors', async () => {
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockResolvedValueOnce({
          eigenvalues: [0, 0, 0],
          factorLoadings: [[0, 0, 0]],
          variance: [0, 0, 0],
        } as any);

      await expect(service.runAnalysis(validStudyData)).rejects.toThrow(
        'No variance explained by factors',
      );
    });

    it('should handle NaN and Infinity in calculations', async () => {
      const dataWithNaN = {
        ...validStudyData,
        sorts: [{ id: 'P1', rankings: [NaN, 1, 2, 3] as any }],
      };

      await expect(service.runAnalysis(dataWithNaN)).rejects.toThrow(
        'Invalid numeric values in data',
      );
    });

    it('should handle extremely small eigenvalues', async () => {
      jest
        .spyOn(factorExtractionService, 'extractFactors')
        .mockResolvedValueOnce({
          eigenvalues: [2, 0.0000001, 0.00000001],
          factorLoadings: [[0.7, 0.0001, 0.00001]],
        } as any);

      const result = await service.runAnalysis({
        ...validStudyData,
        minEigenvalue: 0.000001,
      });

      expect(result.numberOfFactors).toBe(2); // Should exclude extremely small
      expect(result.warnings).toContain('Extremely small eigenvalues detected');
    });
  });

  describe('Bootstrap and Confidence Interval Errors', () => {
    it('should handle bootstrap sampling failures', async () => {
      await expect(
        service.runBootstrapAnalysis({
          ...validStudyData,
          bootstrapIterations: 10000,
          sorts: [{ id: 'P1', rankings: [1] }], // Too few for resampling
        }),
      ).rejects.toThrow('Insufficient data for bootstrap analysis');
    });

    it('should handle confidence interval calculation errors', async () => {
      jest
        .spyOn(statisticalOutputService, 'calculateConfidenceIntervals')
        .mockRejectedValueOnce(
          new Error('Cannot calculate CI with single sample'),
        );

      const result = await service.runAnalysis({
        ...validStudyData,
        calculateConfidenceIntervals: true,
        ciMethod: 'bootstrap',
      });

      expect(result.confidenceIntervals).toBeUndefined();
      expect(result.warnings).toContain(
        'Could not calculate confidence intervals',
      );
    });

    it('should detect bootstrap instability', async () => {
      const result = await service.runBootstrapAnalysis({
        ...validStudyData,
        bootstrapIterations: 100,
        stabilityThreshold: 0.95,
      });

      if (result.bootstrapStability < 0.95) {
        expect(result.warnings).toContain('Bootstrap results unstable');
      }
    });
  });
});

// Helper function to generate valid sorts
function generateValidSorts(
  numberOfSorts: number,
  numberOfStatements: number,
): any[] {
  return Array(numberOfSorts)
    .fill(null)
    .map((_, i) => ({
      id: `P${i + 1}`,
      rankings: Array(numberOfStatements)
        .fill(0)
        .map((_, j) => {
          // Generate valid Q-sort rankings
          if (j < 3) return -4 + Math.floor(j / 3);
          if (j < 9) return -3 + Math.floor((j - 3) / 3);
          if (j < 21) return -1 + Math.floor((j - 9) / 4);
          if (j < 27) return 2 + Math.floor((j - 21) / 3);
          return 3 + Math.floor((j - 27) / 2);
        }),
    }));
}
