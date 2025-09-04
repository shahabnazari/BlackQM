import { Test, TestingModule } from '@nestjs/testing';
import { QMethodValidatorService } from './qmethod-validator.service';

describe('QMethodValidatorService', () => {
  let service: QMethodValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QMethodValidatorService],
    }).compile();

    service = module.get<QMethodValidatorService>(QMethodValidatorService);
  });

  describe('validateFactorCorrelation', () => {
    it('should validate correlations ≥0.99', () => {
      // The calculated value itself must be >= 0.99
      expect(service.validateFactorCorrelation(0.995, 0.99)).toBe(true);
      expect(service.validateFactorCorrelation(0.99, 0.99)).toBe(true);
      expect(service.validateFactorCorrelation(0.985, 0.99)).toBe(false);
      expect(service.validateFactorCorrelation(-0.99, 0.99)).toBe(true); // absolute value
      expect(service.validateFactorCorrelation(0.98, 0.99)).toBe(false);
    });
  });

  describe('validateEigenvalues', () => {
    it('should validate eigenvalues within tolerance', () => {
      const calculated = [3.45, 2.12, 1.89];
      const expected = [3.44, 2.13, 1.88];
      
      expect(service.validateEigenvalues(calculated, expected)).toBe(true);
    });

    it('should reject eigenvalues outside tolerance', () => {
      const calculated = [3.45, 2.12, 1.89];
      const expected = [3.40, 2.13, 1.88];
      
      expect(service.validateEigenvalues(calculated, expected)).toBe(false);
    });
  });

  describe('validateFactorLoadings', () => {
    it('should validate factor loadings within tolerance', () => {
      const calculated = [[0.851, 0.342], [0.743, 0.456]];
      const expected = [[0.850, 0.343], [0.744, 0.455]];
      
      expect(service.validateFactorLoadings(calculated, expected)).toBe(true);
    });

    it('should reject factor loadings outside tolerance', () => {
      const calculated = [[0.851, 0.342], [0.743, 0.456]];
      const expected = [[0.860, 0.343], [0.744, 0.455]];
      
      expect(service.validateFactorLoadings(calculated, expected)).toBe(false);
    });
  });

  describe('validateZScores', () => {
    it('should validate z-scores to 3 decimal places', () => {
      const calculated = [1.2345, -0.5678, 0.9012];
      const expected = [1.2349, -0.5674, 0.9015];
      
      expect(service.validateZScores(calculated, expected)).toBe(true);
    });

    it('should reject z-scores with different decimal values', () => {
      const calculated = [1.234, -0.567, 0.901];
      const expected = [1.235, -0.567, 0.901];
      
      expect(service.validateZScores(calculated, expected)).toBe(false);
    });
  });

  describe('calculatePearsonCorrelation', () => {
    it('should calculate correct correlation coefficient', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const correlation = service['calculatePearsonCorrelation'](x, y);
      expect(correlation).toBeCloseTo(1.0, 5);
    });

    it('should handle negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 4, 3, 2, 1];
      
      const correlation = service['calculatePearsonCorrelation'](x, y);
      expect(correlation).toBeCloseTo(-1.0, 5);
    });
  });

  describe('validateAgainstBenchmark', () => {
    it('should perform comprehensive validation', () => {
      const studyData = {
        eigenvalues: [3.45, 2.12, 1.89],
        factorLoadings: [[0.851, 0.342], [0.743, 0.456]],
        zScores: [1.234, -0.567, 0.901],
        correlationMatrix: [[1, 0.99], [0.99, 1]]
      };

      const benchmark = {
        eigenvalues: [3.44, 2.13, 1.88],
        factorLoadings: [[0.850, 0.343], [0.744, 0.455]],
        zScores: [1.234, -0.567, 0.901],
        expectedCorrelation: 0.99
      };

      const result = service.validateAgainstBenchmark(studyData, benchmark);
      
      expect(result.isValid).toBe(true);
      expect(result.eigenvaluesValid).toBe(true);
      expect(result.factorLoadingsValid).toBe(true);
      expect(result.zScoresValid).toBe(true);
      expect(result.correlationValid).toBe(true);
      expect(result.details).toHaveLength(4);
    });
  });
});