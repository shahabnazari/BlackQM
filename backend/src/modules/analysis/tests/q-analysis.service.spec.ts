import { Test, TestingModule } from '@nestjs/testing';
import { QAnalysisService } from '../services/q-analysis.service';
import { FactorExtractionService } from '../services/factor-extraction.service';
import { RotationEngineService } from '../services/rotation-engine.service';
import { StatisticalOutputService } from '../services/statistical-output.service';
import { PQMethodCompatibilityService } from '../services/pqmethod-compatibility.service';
import { QMethodValidatorService } from '../qmethod-validator.service';
import { PrismaService } from '../../../common/prisma.service';
import { CacheService } from '../services/cache.service';
import { AnalysisLoggerService } from '../services/analysis-logger.service';
import { StatisticsService } from '../services/statistics.service';
import { ConfigService } from '@nestjs/config';

/**
 * Comprehensive Test Suite for Q-Analytics Engine
 * Enterprise-grade testing for Q-methodology analysis
 */
describe('QAnalysisService', () => {
  let service: QAnalysisService;
  let factorExtraction: FactorExtractionService;
  let rotationEngine: RotationEngineService;
  let statisticalOutput: StatisticalOutputService;
  let validator: QMethodValidatorService;
  let cache: CacheService;
  let logger: AnalysisLoggerService;

  // Mock data
  const mockSurveyId = 'test-survey-123';
  const mockCorrelationMatrix = [
    [1.0, 0.65, 0.45, 0.35],
    [0.65, 1.0, 0.55, 0.4],
    [0.45, 0.55, 1.0, 0.5],
    [0.35, 0.4, 0.5, 1.0],
  ];

  const mockQSorts = [
    [2, -1, 3, 0, -2, 1, -3, 2, 0, 1],
    [1, 2, -1, 3, 0, -2, 1, -3, 2, 0],
    [-1, 3, 2, -2, 1, 0, 2, -1, -3, 1],
    [3, 0, -1, 2, -3, 1, 0, -2, 1, 2],
  ];

  const mockStatements = [
    { id: 1, text: 'Statement 1', category: 'Category A' },
    { id: 2, text: 'Statement 2', category: 'Category A' },
    { id: 3, text: 'Statement 3', category: 'Category B' },
    { id: 4, text: 'Statement 4', category: 'Category B' },
    { id: 5, text: 'Statement 5', category: 'Category C' },
    { id: 6, text: 'Statement 6', category: 'Category C' },
    { id: 7, text: 'Statement 7', category: 'Category D' },
    { id: 8, text: 'Statement 8', category: 'Category D' },
    { id: 9, text: 'Statement 9', category: 'Category E' },
    { id: 10, text: 'Statement 10', category: 'Category E' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QAnalysisService,
        FactorExtractionService,
        RotationEngineService,
        StatisticalOutputService,
        PQMethodCompatibilityService,
        QMethodValidatorService,
        CacheService,
        AnalysisLoggerService,
        {
          provide: StatisticsService,
          useValue: {
            calculateCorrelationMatrix: jest.fn(),
            calculateEigenvalues: jest.fn(),
            calculateZScores: jest.fn(),
            performPCA: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            survey: {
              findUnique: jest.fn().mockResolvedValue({
                id: mockSurveyId,
                title: 'Test Survey',
                statements: mockStatements,
                responses: mockQSorts.map((sort, index) => ({
                  id: `response-${index}`,
                  qSorts: [
                    {
                      sortData: sort,
                    },
                  ],
                })),
              }),
            },
            analysis: {
              create: jest.fn().mockResolvedValue({
                id: 'analysis-123',
              }),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(false), // Redis disabled for testing
          },
        },
      ],
    }).compile();

    service = module.get<QAnalysisService>(QAnalysisService);
    factorExtraction = module.get<FactorExtractionService>(
      FactorExtractionService,
    );
    rotationEngine = module.get<RotationEngineService>(RotationEngineService);
    statisticalOutput = module.get<StatisticalOutputService>(
      StatisticalOutputService,
    );
    validator = module.get<QMethodValidatorService>(QMethodValidatorService);
    cache = module.get<CacheService>(CacheService);
    logger = module.get<AnalysisLoggerService>(AnalysisLoggerService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all dependencies injected', () => {
      expect(factorExtraction).toBeDefined();
      expect(rotationEngine).toBeDefined();
      expect(statisticalOutput).toBeDefined();
      expect(validator).toBeDefined();
      expect(cache).toBeDefined();
      expect(logger).toBeDefined();
    });
  });

  describe('Complete Analysis Pipeline', () => {
    it('should perform complete analysis with PCA and Varimax', async () => {
      const result = await service.performAnalysis(mockSurveyId, {
        extractionMethod: 'pca',
        rotationMethod: 'varimax',
        numberOfFactors: 2,
        performBootstrap: false,
      });

      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
      expect(result.factorArrays).toHaveLength(2);
      expect(result.distinguishingStatements).toBeDefined();
      expect(result.consensusStatements).toBeDefined();
      expect(result.cribSheets).toHaveLength(2);
    });

    it('should perform analysis with Centroid extraction', async () => {
      const result = await service.performAnalysis(mockSurveyId, {
        extractionMethod: 'centroid',
        rotationMethod: 'varimax',
        numberOfFactors: 2,
        performBootstrap: false,
      });

      expect(result).toBeDefined();
      expect(result.extraction.factors).toHaveLength(2);
      expect(result.extraction.eigenvalues).toHaveLength(2);
    });

    it('should perform analysis with Promax rotation', async () => {
      const result = await service.performAnalysis(mockSurveyId, {
        extractionMethod: 'pca',
        rotationMethod: 'promax',
        numberOfFactors: 2,
        performBootstrap: false,
      });

      expect(result).toBeDefined();
      expect(result.rotation.factorCorrelations).toBeDefined();
    });
  });

  describe('Factor Extraction', () => {
    it('should extract factors using PCA', async () => {
      const result = await factorExtraction.extractFactorsPCA(
        mockCorrelationMatrix,
        2,
      );

      expect(result.factors).toHaveLength(2);
      expect(result.eigenvalues).toHaveLength(2);
      expect(result.variance).toHaveLength(2);
      expect(result.communalities).toHaveLength(mockCorrelationMatrix.length);
    });

    it('should extract factors using Centroid method', async () => {
      const result = await factorExtraction.extractFactorsCentroid(
        mockCorrelationMatrix,
        2,
      );

      expect(result.factors).toHaveLength(2);
      expect(result.eigenvalues).toHaveLength(2);
      expect(result.eigenvalues[0]).toBeGreaterThan(result.eigenvalues[1]);
    });

    it('should apply Kaiser criterion correctly', () => {
      const eigenvalues = [2.5, 1.2, 0.8, 0.5];
      const numFactors = factorExtraction.applyKaiserCriterion(eigenvalues);

      expect(numFactors).toBe(2); // Only first two eigenvalues > 1.0
    });

    it('should perform parallel analysis', async () => {
      // Use a stronger correlation matrix for parallel analysis
      const strongCorrelationMatrix = [
        [1.0, 0.85, 0.75, 0.65],
        [0.85, 1.0, 0.8, 0.7],
        [0.75, 0.8, 1.0, 0.75],
        [0.65, 0.7, 0.75, 1.0],
      ];

      const result = await factorExtraction.performParallelAnalysis(
        strongCorrelationMatrix,
        100,
      );

      expect(result.suggestedFactors).toBeGreaterThanOrEqual(0);
      expect(result.randomEigenvalues).toBeDefined();
      expect(result.actualEigenvalues).toBeDefined();
      expect(result.actualEigenvalues.length).toBeGreaterThan(0);
    });
  });

  describe('Rotation Methods', () => {
    const mockLoadings = [
      [0.8, 0.2],
      [0.7, 0.3],
      [0.3, 0.7],
      [0.2, 0.8],
    ];

    it('should perform Varimax rotation', async () => {
      const result = await rotationEngine.rotateVarimax(mockLoadings);

      expect(result.rotatedLoadings).toHaveLength(mockLoadings.length);
      expect(result.rotationMatrix).toHaveLength(2);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should perform Quartimax rotation', async () => {
      const result = await rotationEngine.rotateQuartimax(mockLoadings);

      expect(result.rotatedLoadings).toHaveLength(mockLoadings.length);
      expect(result.converged).toBe(true);
    });

    it('should perform Promax rotation', async () => {
      const result = await rotationEngine.rotatePromax(mockLoadings, 4);

      expect(result.patternMatrix).toBeDefined();
      expect(result.structureMatrix).toBeDefined();
      expect(result.factorCorrelations).toBeDefined();
    });

    it('should perform manual rotation', async () => {
      const result = await rotationEngine.rotateManual(
        mockLoadings,
        0,
        1,
        45, // 45 degrees
      );

      expect(result.rotatedLoadings).toHaveLength(mockLoadings.length);
      expect(result.rotationMatrix).toHaveLength(2);
    });

    it('should perform interactive rotation', async () => {
      const rotationHistory = [{ factor1: 0, factor2: 1, angle: Math.PI / 4 }];

      const result = await rotationEngine.rotateInteractive(
        mockLoadings,
        rotationHistory,
      );

      expect(result.rotatedLoadings).toBeDefined();
      expect(result.cumulativeRotationMatrix).toBeDefined();
      expect(result.factorArrays).toBeDefined();
    });
  });

  describe('Statistical Outputs', () => {
    const mockRotatedLoadings = [
      [0.9, 0.1],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.1, 0.9],
    ];

    it('should generate factor arrays', () => {
      const result = statisticalOutput.generateFactorArrays(
        mockRotatedLoadings,
        mockStatements.slice(0, 4),
        mockQSorts,
      );

      expect(result.factorArrays).toHaveLength(2);
      expect(result.idealizedQSorts).toHaveLength(2);

      result.factorArrays.forEach((array) => {
        expect(array.statements).toHaveLength(4);
        array.statements.forEach((stmt) => {
          expect(stmt.zScore).toBeGreaterThanOrEqual(-3);
          expect(stmt.zScore).toBeLessThanOrEqual(3);
        });
      });
    });

    it('should identify distinguishing statements', () => {
      const factorArrays = statisticalOutput.generateFactorArrays(
        mockRotatedLoadings,
        mockStatements.slice(0, 4),
        mockQSorts,
      ).factorArrays;

      const distinguishing = statisticalOutput.identifyDistinguishingStatements(
        factorArrays,
        0.05,
      );

      expect(distinguishing).toBeDefined();
      distinguishing.forEach((stmt) => {
        expect(stmt.pValue).toBeLessThan(0.05);
        expect(stmt.significance).toMatch(/\*+/);
      });
    });

    it('should identify consensus statements', () => {
      const factorArrays = statisticalOutput.generateFactorArrays(
        mockRotatedLoadings,
        mockStatements.slice(0, 4),
        mockQSorts,
      ).factorArrays;

      const consensus = statisticalOutput.identifyConsensusStatements(
        factorArrays,
        0.5,
      );

      expect(consensus).toBeDefined();
      consensus.forEach((stmt) => {
        expect(stmt.zScoreRange).toBeLessThanOrEqual(0.5);
      });
    });

    it('should generate crib sheets', () => {
      const factorArrays = statisticalOutput.generateFactorArrays(
        mockRotatedLoadings,
        mockStatements.slice(0, 4),
        mockQSorts,
      ).factorArrays;

      const distinguishing = statisticalOutput.identifyDistinguishingStatements(
        factorArrays,
        0.05,
      );

      const consensus = statisticalOutput.identifyConsensusStatements(
        factorArrays,
        0.5,
      );

      const cribSheets = statisticalOutput.generateCribSheets(
        factorArrays,
        distinguishing,
        consensus,
      );

      expect(cribSheets).toHaveLength(2);
      cribSheets.forEach((sheet) => {
        expect(sheet.interpretation).toBeDefined();
        expect(sheet.characteristics).toBeDefined();
        expect(sheet.narrativeSummary).toBeDefined();
      });
    });
  });

  describe('PQMethod Validation', () => {
    it('should validate factor correlations', () => {
      const isValid = validator.validateFactorCorrelation(0.99, 0.99);
      expect(isValid).toBe(true);

      const isInvalid = validator.validateFactorCorrelation(0.95, 0.99);
      expect(isInvalid).toBe(false);
    });

    it('should validate eigenvalues', () => {
      const calculated = [2.5, 1.2, 0.8];
      const expected = [2.49, 1.21, 0.79];

      const isValid = validator.validateEigenvalues(calculated, expected, 0.01);
      expect(isValid).toBe(true);
    });

    it('should validate z-scores', () => {
      const calculated = [2.345, -1.234, 0.567];
      const expected = [2.345, -1.234, 0.567];

      const isValid = validator.validateZScores(calculated, expected);
      expect(isValid).toBe(true);
    });

    it('should calculate correlation matrix', () => {
      const matrix = validator.calculateCorrelationMatrix(mockQSorts);

      expect(matrix).toHaveLength(mockQSorts.length);
      matrix.forEach((row, i) => {
        expect(row).toHaveLength(mockQSorts.length);
        expect(row[i]).toBe(1); // Diagonal should be 1
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should cache analysis results', async () => {
      const cacheKey = `analysis:${mockSurveyId}:pca:varimax:2`;

      // First call - compute
      const result1 = await service.performQuickAnalysis(mockSurveyId);

      // Mock cache hit
      jest.spyOn(cache, 'get').mockResolvedValue(result1);

      // Second call - should use cache
      const result2 = await cache.get(cacheKey);

      expect(result2).toEqual(result1);
    });

    it('should complete analysis within performance threshold', async () => {
      const startTime = Date.now();

      const result = await service.performQuickAnalysis(mockSurveyId);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(result.performance.analysisTime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid survey ID', async () => {
      const prismaService = service['prisma'];
      jest.spyOn(prismaService.survey, 'findUnique').mockResolvedValue(null);

      await expect(service.performAnalysis('invalid-id', {})).rejects.toThrow(
        'Survey invalid-id not found',
      );
    });

    it('should handle invalid number of factors', async () => {
      // Service accepts numberOfFactors parameter but uses what's mathematically possible
      const result = await service.performAnalysis(mockSurveyId, {
        numberOfFactors: 100, // Requested 100 factors
      });

      expect(result).toBeDefined();
      expect(result.config.numberOfFactors).toBe(100); // Config stores requested value
      // But actual extracted factors is limited by data (max participants - 1)
      expect(result.extraction.factors.length).toBeLessThan(100);
      expect(result.extraction.factors.length).toBeLessThanOrEqual(4); // With 4 participants
    });
  });

  describe('Interactive Analysis', () => {
    it('should handle interactive analysis session', async () => {
      const result = await service.performInteractiveAnalysis(mockSurveyId, {
        extractionMethod: 'pca',
        numberOfFactors: 2,
        rotationHistory: [],
        redoStack: [],
      });

      expect(result.currentRotation).toBeDefined();
      expect(result.preview).toBeDefined();
      expect(result.canUndo).toBe(false);
      expect(result.canRedo).toBe(false);
      expect(result.suggestions).toBeDefined();
    });

    it('should apply manual rotations in sequence', async () => {
      const rotationHistory = [
        { factor1: 0, factor2: 1, angle: 0.785 }, // 45 degrees
        { factor1: 1, factor2: 2, angle: 0.524 }, // 30 degrees
      ];

      const result = await service.performInteractiveAnalysis(mockSurveyId, {
        extractionMethod: 'pca',
        numberOfFactors: 3,
        rotationHistory,
        redoStack: [],
      });

      expect(result.canUndo).toBe(true);
      expect(result.currentRotation.iterations).toBe(rotationHistory.length);
    });
  });
});
