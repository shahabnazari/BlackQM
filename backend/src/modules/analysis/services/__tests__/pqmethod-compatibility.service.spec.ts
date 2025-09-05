import { Test, TestingModule } from '@nestjs/testing';
import { PQMethodCompatibilityService } from '../pqmethod-compatibility.service';
import { StatisticsService } from '../statistics.service';
import { AnalysisLoggerService } from '../analysis-logger.service';

describe('PQMethodCompatibilityService', () => {
  let service: PQMethodCompatibilityService;
  let statisticsService: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PQMethodCompatibilityService,
        StatisticsService,
        {
          provide: AnalysisLoggerService,
          useValue: {
            logImport: jest.fn(),
            logExport: jest.fn(),
            logValidation: jest.fn(),
            logError: jest.fn(),
            logWarning: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PQMethodCompatibilityService>(
      PQMethodCompatibilityService,
    );
    statisticsService = module.get<StatisticsService>(StatisticsService);
  });

  describe('PQMethod File Import', () => {
    it('should parse .DAT file format correctly', () => {
      const datContent = `Study: Environmental Attitudes
Statements: 40
Sorts: 25
-4 -3 -2 -1  0  1  2  3  4
 2  3  4  5  6  5  4  3  2
Sort 1: Participant001
-3 -2 -1  0  1  2  3  4 -4 -3
15 23  8 12  5  9 17 21  1  7
14 28 19 11  6 10 18 35  2 13
   31 24 16 20 22 25 36     26
      32 27 29 30 33 37
         34 38 39 40`;

      const result = service.parseDATFile(datContent);

      expect(result.studyName).toBe('Environmental Attitudes');
      expect(result.numberOfStatements).toBe(40);
      expect(result.numberOfSorts).toBe(25);
      expect(result.distribution).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
      expect(result.distributionFrequencies).toEqual([
        2, 3, 4, 5, 6, 5, 4, 3, 2,
      ]);
      expect(result.sorts).toHaveLength(1);
      expect(result.sorts[0].participantId).toBe('Participant001');
    });

    it('should parse .STA file format (statements) correctly', () => {
      const staContent = `40 Statements
1. Climate change is a serious threat
2. Renewable energy should be prioritized
3. Economic growth is more important than environment
4. Individual actions can make a difference
5. Government regulations are necessary`;

      const statements = service.parseSTAFile(staContent);

      expect(statements).toHaveLength(5);
      expect(statements[0].number).toBe(1);
      expect(statements[0].text).toBe('Climate change is a serious threat');
      expect(statements[4].text).toBe('Government regulations are necessary');
    });

    it('should parse .LIS file format (loadings) correctly', () => {
      const lisContent = `Factor Matrix with an X Indicating a Defining Sort
                       Factor 1    Factor 2    Factor 3
Sort  1 Participant001  0.7234X    0.1523     0.2341
Sort  2 Participant002  0.1234     0.8123X    0.1234
Sort  3 Participant003  0.2341     0.1234     0.7891X
Sort  4 Participant004  0.6789X    0.2345    -0.1234
Sort  5 Participant005 -0.1234     0.7456X    0.2345`;

      const loadings = service.parseLISFile(lisContent);

      expect(loadings.factors).toBe(3);
      expect(loadings.sorts).toHaveLength(5);
      expect(loadings.sorts[0].loadings).toEqual([0.7234, 0.1523, 0.2341]);
      expect(loadings.sorts[0].definingFactor).toBe(0); // Factor 1 (0-indexed)
      expect(loadings.sorts[1].definingFactor).toBe(1); // Factor 2
    });

    it('should handle malformed DAT files gracefully', () => {
      const malformedContent = `Study: Test
Statements: not_a_number
Sorts: 10`;

      expect(() => service.parseDATFile(malformedContent)).toThrow(
        'Invalid DAT file format: Invalid number of statements',
      );
    });

    it('should validate Q-sort distribution', () => {
      const validSort = {
        distribution: [-3, -2, -1, 0, 1, 2, 3],
        frequencies: [1, 2, 3, 4, 3, 2, 1],
        statements: [7, 3, 5, 2, 6, 1, 4], // 7 statements ranked
      };

      const isValid = service.validateQSortDistribution(validSort);
      expect(isValid).toBe(true);
    });

    it('should detect invalid Q-sort distribution', () => {
      const invalidSort = {
        distribution: [-3, -2, -1, 0, 1, 2, 3],
        frequencies: [1, 2, 3, 4, 3, 2, 1],
        statements: [7, 3, 5, 2, 6, 1, 4, 8], // Too many statements
      };

      const isValid = service.validateQSortDistribution(invalidSort);
      expect(isValid).toBe(false);
    });
  });

  describe('PQMethod File Export', () => {
    it('should generate DAT file format correctly', () => {
      const studyData = {
        name: 'Test Study',
        statements: 33,
        sorts: [
          {
            id: 'P001',
            rankings: [
              -2, -1, 0, 1, 2, -2, -1, 0, 1, 2, -3, -2, -1, 0, 1, 2, 3, -3, -2,
              -1, 0, 1, 2, 3, -1, 0, 1, -1, 0, 1, 0, 1, 0,
            ],
          },
        ],
        distribution: [-3, -2, -1, 0, 1, 2, 3],
        frequencies: [2, 4, 6, 7, 6, 4, 2],
      };

      const datContent = service.generateDATFile(studyData);

      expect(datContent).toContain('Study: Test Study');
      expect(datContent).toContain('Statements: 33');
      expect(datContent).toContain('Sort 1: P001');
      expect(datContent).toMatch(/-3\s+-2\s+-1\s+0\s+1\s+2\s+3/);
    });

    it('should generate LIS file with factor loadings', () => {
      const factorData = {
        numberOfFactors: 3,
        sorts: [
          { id: 'P001', loadings: [0.723, 0.152, 0.234], defining: 0 },
          { id: 'P002', loadings: [0.123, 0.812, 0.123], defining: 1 },
          { id: 'P003', loadings: [0.234, 0.123, 0.789], defining: 2 },
        ],
      };

      const lisContent = service.generateLISFile(factorData);

      expect(lisContent).toContain('Factor Matrix');
      expect(lisContent).toContain('P001');
      expect(lisContent).toContain('0.723X'); // X for defining sort
      expect(lisContent).toContain('P002');
      expect(lisContent).toContain('0.812X');
    });

    it('should format numbers according to PQMethod conventions', () => {
      const formatted = service.formatPQMethodNumber(0.7234567, 4);
      expect(formatted).toBe(' 0.7235'); // Space for positive, 4 decimals

      const negative = service.formatPQMethodNumber(-0.1234567, 4);
      expect(negative).toBe('-0.1235');

      const large = service.formatPQMethodNumber(1.0, 4);
      expect(large).toBe(' 1.0000');
    });

    it('should generate statement scores file', () => {
      const scoresData = {
        statements: [
          { number: 1, text: 'Statement 1', scores: [2.34, -1.23, 0.45] },
          { number: 2, text: 'Statement 2', scores: [-0.12, 1.89, -0.56] },
        ],
        factors: ['Factor 1', 'Factor 2', 'Factor 3'],
      };

      const scoresContent = service.generateStatementScoresFile(scoresData);

      expect(scoresContent).toContain('Statement 1');
      expect(scoresContent).toContain('2.34');
      expect(scoresContent).toContain('-1.23');
      expect(scoresContent).toContain('Factor 1');
    });
  });

  describe('Statistical Validation', () => {
    it('should validate factor extraction results match PQMethod', async () => {
      const ourResults = {
        eigenvalues: [2.543, 1.234, 0.876, 0.347],
        variance: [63.575, 30.85, 3.65, 1.925],
        factorLoadings: [
          [0.723, 0.152],
          [0.812, -0.123],
          [0.234, 0.789],
          [0.567, 0.432],
        ],
      };

      const pqmethodResults = {
        eigenvalues: [2.544, 1.233, 0.877, 0.346],
        variance: [63.6, 30.825, 3.675, 1.9],
        factorLoadings: [
          [0.724, 0.151],
          [0.813, -0.124],
          [0.233, 0.79],
          [0.568, 0.431],
        ],
      };

      const correlation = await service.validateAgainstPQMethod(
        ourResults,
        pqmethodResults,
      );

      expect(correlation.eigenvalueCorrelation).toBeGreaterThan(0.999);
      expect(correlation.varianceCorrelation).toBeGreaterThan(0.999);
      expect(correlation.loadingsCorrelation).toBeGreaterThan(0.999);
      expect(correlation.overallMatch).toBeGreaterThan(0.99);
    });

    it('should detect significant deviations from PQMethod', async () => {
      const ourResults = {
        eigenvalues: [3.0, 1.5, 0.5, 0.0], // Very different
        variance: [75, 20, 5, 0],
        factorLoadings: [
          [0.9, 0.1],
          [0.1, 0.9],
          [0.5, 0.5],
          [0.3, 0.7],
        ],
      };

      const pqmethodResults = {
        eigenvalues: [2.0, 1.0, 0.7, 0.3],
        variance: [50, 25, 17.5, 7.5],
        factorLoadings: [
          [0.7, 0.3],
          [0.3, 0.7],
          [0.6, 0.4],
          [0.4, 0.6],
        ],
      };

      const correlation = await service.validateAgainstPQMethod(
        ourResults,
        pqmethodResults,
      );

      expect(correlation.overallMatch).toBeLessThan(0.9);
      expect(correlation.warnings).toContain('Significant deviation detected');
    });

    it('should validate rotation results', async () => {
      const rotationResults = {
        method: 'VARIMAX',
        rotatedLoadings: [
          [0.823, 0.052],
          [0.112, 0.892],
          [0.734, 0.189],
          [0.067, 0.756],
        ],
        variance: [45.2, 44.8],
        converged: true,
        iterations: 7,
      };

      const isValid = await service.validateRotationResults(rotationResults);

      expect(isValid.valid).toBe(true);
      expect(isValid.communalitiesPreserved).toBe(true);
      expect(isValid.varianceExplained).toBeCloseTo(90, 1);
    });
  });

  describe('Correlation and Compatibility Metrics', () => {
    it('should calculate correlation with PQMethod outputs', () => {
      const ourValues = [1, 2, 3, 4, 5];
      const pqValues = [1.1, 1.9, 3.1, 3.9, 5.1];

      const correlation = service.calculateCompatibilityCorrelation(
        ourValues,
        pqValues,
      );

      expect(correlation).toBeGreaterThan(0.99);
    });

    it('should calculate RMSE with PQMethod outputs', () => {
      const ourValues = [1, 2, 3, 4, 5];
      const pqValues = [1.1, 1.9, 3.1, 3.9, 5.1];

      const rmse = service.calculateRMSE(ourValues, pqValues);

      expect(rmse).toBeCloseTo(0.1, 2);
    });

    it('should generate compatibility report', () => {
      const comparisonData = {
        eigenvalues: { ours: [2.5, 1.2], pqmethod: [2.51, 1.19] },
        loadings: {
          ours: [
            [0.7, 0.3],
            [0.3, 0.7],
          ],
          pqmethod: [
            [0.71, 0.29],
            [0.29, 0.71],
          ],
        },
        scores: { ours: [1.5, -0.5], pqmethod: [1.51, -0.49] },
      };

      const report = service.generateCompatibilityReport(comparisonData);

      expect(report).toContain('Compatibility Report');
      expect(report).toContain('Eigenvalues');
      expect(report).toContain('Correlation:');
      expect(report).toContain('RMSE:');
      expect(report).toContain('Match: ✓'); // Should show checkmark for high correlation
    });
  });

  describe('Data Format Conversions', () => {
    it('should convert between JSON and PQMethod formats', () => {
      const jsonData = {
        sorts: [
          { id: 'P1', rankings: [1, -1, 0, 2, -2] },
          { id: 'P2', rankings: [0, 1, -1, 2, -2] },
        ],
        statements: ['S1', 'S2', 'S3', 'S4', 'S5'],
      };

      const pqFormat = service.convertJSONToPQMethod(jsonData);
      const backToJSON = service.convertPQMethodToJSON(pqFormat);

      expect(backToJSON.sorts).toHaveLength(2);
      expect(backToJSON.statements).toHaveLength(5);
      expect(backToJSON.sorts[0].rankings).toEqual(jsonData.sorts[0].rankings);
    });

    it('should handle CSV to PQMethod conversion', () => {
      const csvContent = `Participant,S1,S2,S3,S4,S5
P001,1,-1,0,2,-2
P002,0,1,-1,2,-2
P003,2,0,1,-1,-2`;

      const pqData = service.convertCSVToPQMethod(csvContent);

      expect(pqData.numberOfSorts).toBe(3);
      expect(pqData.numberOfStatements).toBe(5);
      expect(pqData.sorts[0].id).toBe('P001');
    });

    it('should export to SPSS format', () => {
      const data = {
        sorts: [
          { id: 'P1', rankings: [1, -1, 0], factors: [0.7, 0.3] },
          { id: 'P2', rankings: [0, 1, -1], factors: [0.3, 0.7] },
        ],
      };

      const spssContent = service.exportToSPSS(data);

      expect(spssContent).toContain('DATA LIST');
      expect(spssContent).toContain('VARIABLE LABELS');
      expect(spssContent).toContain('BEGIN DATA');
      expect(spssContent).toContain('P1');
      expect(spssContent).toContain('0.7');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty files gracefully', () => {
      expect(() => service.parseDATFile('')).toThrow('Empty file');
      expect(() => service.parseSTAFile('')).toThrow('Empty file');
      expect(() => service.parseLISFile('')).toThrow('Empty file');
    });

    it('should handle files with wrong encoding', () => {
      const binaryContent = Buffer.from([0xff, 0xfe, 0x00, 0x00]);

      expect(() => service.parseDATFile(binaryContent.toString())).toThrow(
        'Invalid file encoding',
      );
    });

    it('should validate file size limits', () => {
      const largeContent = 'a'.repeat(10 * 1024 * 1024); // 10MB

      expect(() => service.parseDATFile(largeContent)).toThrow(
        'File size exceeds maximum limit',
      );
    });

    it('should handle missing required fields', () => {
      const incompleteData = {
        name: 'Study',
        // Missing statements and sorts
      };

      expect(() => service.generateDATFile(incompleteData as any)).toThrow(
        'Missing required fields',
      );
    });

    it('should validate statement numbers consistency', () => {
      const inconsistentData = {
        numberOfStatements: 10,
        sorts: [
          { rankings: [1, 2, 3, 4, 5] }, // Only 5 rankings for 10 statements
        ],
      };

      expect(() => service.validateDataConsistency(inconsistentData)).toThrow(
        'Inconsistent number of statements',
      );
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple files in batch', async () => {
      const files = [
        {
          name: 'study1.dat',
          content: 'Study: Test1\nStatements: 10\nSorts: 5',
        },
        {
          name: 'study2.dat',
          content: 'Study: Test2\nStatements: 15\nSorts: 8',
        },
      ];

      const results = await service.processBatch(files);

      expect(results).toHaveLength(2);
      expect(results[0].studyName).toBe('Test1');
      expect(results[1].studyName).toBe('Test2');
    });

    it('should handle batch processing errors gracefully', async () => {
      const files = [
        { name: 'good.dat', content: 'Study: Test\nStatements: 10\nSorts: 5' },
        { name: 'bad.dat', content: 'Invalid content' },
      ];

      const results = await service.processBatch(files, {
        continueOnError: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet PQMethod correlation threshold (≥0.99)', async () => {
      // Generate test data similar to PQMethod
      const testData = {
        correlationMatrix: generateTestCorrelationMatrix(40),
        numberOfFactors: 3,
      };

      const ourAnalysis = await service.runAnalysis(testData);
      const pqMethodSimulation = simulatePQMethodAnalysis(testData);

      const compatibility = await service.validateAgainstPQMethod(
        ourAnalysis,
        pqMethodSimulation,
      );

      expect(compatibility.overallMatch).toBeGreaterThanOrEqual(0.99);
    });

    it('should process large studies efficiently', async () => {
      const largeStudy = {
        statements: 100,
        sorts: 200,
        data: generateLargeTestData(100, 200),
      };

      const startTime = Date.now();
      const result = await service.processLargeStudy(largeStudy);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Within 10 seconds
    });
  });
});

// Helper functions for testing
function generateTestCorrelationMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i];
      } else {
        matrix[i][j] = Math.random() * 0.8 - 0.4; // Random correlation
      }
    }
  }
  return matrix;
}

function simulatePQMethodAnalysis(data: any): any {
  // Simulate PQMethod's analysis results for testing
  return {
    eigenvalues: [2.5, 1.8, 1.2, 0.8, 0.5],
    variance: [50, 30, 15, 3, 2],
    factorLoadings: generateRandomLoadings(40, 3),
  };
}

function generateRandomLoadings(items: number, factors: number): number[][] {
  const loadings: number[][] = [];
  for (let i = 0; i < items; i++) {
    loadings[i] = [];
    for (let j = 0; j < factors; j++) {
      loadings[i][j] = Math.random() * 1.8 - 0.9;
    }
  }
  return loadings;
}

function generateLargeTestData(statements: number, sorts: number): any {
  return {
    sorts: Array.from({ length: sorts }, (_, i) => ({
      id: `P${i + 1}`,
      rankings: Array.from(
        { length: statements },
        () => Math.floor(Math.random() * 9) - 4,
      ),
    })),
  };
}
