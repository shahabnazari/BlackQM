import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

describe('Smoke Tests - Core Functionality', () => {
  let app: INestApplication;
  let authToken: string;

  const CORE_FUNCTIONALITY_TIMEOUT = 15000; // 15 seconds for core operations

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret-key',
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'core-test-user', role: 'researcher' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Factor Extraction Core Functions', () => {
    it(
      'should perform PCA factor extraction correctly',
      async () => {
        console.log('\n🔬 Testing PCA Factor Extraction\n');

        const correlationMatrix = generateCorrelationMatrix(20);

        const response = await request(app.getHttpServer())
          .post('/api/analysis/extract-factors')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            method: 'pca',
            correlationMatrix,
            numberOfFactors: 3,
          })
          .expect(201);

        // Validate PCA results
        expect(response.body.factors).toHaveLength(3);
        expect(response.body.eigenvalues).toBeDefined();
        expect(response.body.eigenvalues).toHaveLength(20); // All eigenvalues
        expect(response.body.varianceExplained).toBeDefined();

        // Check eigenvalues are in descending order
        const eigenvalues = response.body.eigenvalues;
        for (let i = 1; i < eigenvalues.length; i++) {
          expect(eigenvalues[i]).toBeLessThanOrEqual(eigenvalues[i - 1]);
        }

        // Check variance explained sums to ~100%
        const totalVariance = response.body.varianceExplained.reduce(
          (a: number, b: number) => a + b,
          0,
        );
        expect(totalVariance).toBeGreaterThan(95);
        expect(totalVariance).toBeLessThanOrEqual(100);

        console.log('✅ PCA extraction successful');
        console.log(
          `   Eigenvalues: ${eigenvalues
            .slice(0, 3)
            .map((e: number) => e.toFixed(2))
            .join(', ')}`,
        );
        console.log(
          `   Variance explained: ${response.body.varianceExplained
            .slice(0, 3)
            .map((v: number) => v.toFixed(2))
            .join('%, ')}%`,
        );
      },
      CORE_FUNCTIONALITY_TIMEOUT,
    );

    it('should perform centroid factor extraction correctly', async () => {
      console.log('\n🔬 Testing Centroid Factor Extraction\n');

      const correlationMatrix = generateCorrelationMatrix(15);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'centroid',
          correlationMatrix,
          numberOfFactors: 2,
        })
        .expect(201);

      expect(response.body.factors).toHaveLength(2);
      expect(response.body.loadingMatrix).toBeDefined();
      expect(response.body.loadingMatrix).toHaveLength(15);
      expect(response.body.loadingMatrix[0]).toHaveLength(2);

      console.log('✅ Centroid extraction successful');
    });

    it('should determine optimal number of factors automatically', async () => {
      console.log('\n🔬 Testing Automatic Factor Detection\n');

      const correlationMatrix = generateCorrelationMatrix(30);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/determine-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          correlationMatrix,
          criteria: ['kaiser', 'scree', 'parallel'],
        })
        .expect(200);

      expect(response.body.recommendedFactors).toBeDefined();
      expect(response.body.criteria).toBeDefined();
      expect(response.body.criteria.kaiser).toBeDefined();
      expect(response.body.criteria.scree).toBeDefined();
      expect(response.body.criteria.parallel).toBeDefined();

      console.log('✅ Automatic factor detection successful');
      console.log(
        `   Kaiser criterion: ${response.body.criteria.kaiser} factors`,
      );
      console.log(`   Scree test: ${response.body.criteria.scree} factors`);
      console.log(
        `   Parallel analysis: ${response.body.criteria.parallel} factors`,
      );
      console.log(
        `   Recommended: ${response.body.recommendedFactors} factors`,
      );
    });
  });

  describe('Factor Rotation Core Functions', () => {
    it('should perform varimax rotation correctly', async () => {
      console.log('\n🔬 Testing Varimax Rotation\n');

      const loadingMatrix = generateLoadingMatrix(20, 3);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/rotate-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'varimax',
          loadingMatrix,
          normalize: true,
        })
        .expect(201);

      expect(response.body.rotatedMatrix).toBeDefined();
      expect(response.body.rotatedMatrix).toHaveLength(20);
      expect(response.body.rotatedMatrix[0]).toHaveLength(3);
      expect(response.body.convergenceInfo).toBeDefined();
      expect(response.body.convergenceInfo.converged).toBe(true);
      expect(response.body.convergenceInfo.iterations).toBeLessThan(50);

      // Check that rotation maintains orthogonality
      const rotMatrix = response.body.rotationMatrix;
      if (rotMatrix) {
        const isOrthogonal = checkOrthogonality(rotMatrix);
        expect(isOrthogonal).toBe(true);
      }

      console.log('✅ Varimax rotation successful');
      console.log(
        `   Converged in ${response.body.convergenceInfo.iterations} iterations`,
      );
    });

    it('should perform manual rotation correctly', async () => {
      console.log('\n🔬 Testing Manual Rotation\n');

      const loadingMatrix = generateLoadingMatrix(15, 2);
      const rotationAngle = 45; // degrees

      const response = await request(app.getHttpServer())
        .post('/api/analysis/rotate-manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          loadingMatrix,
          angle: rotationAngle,
          factorX: 0,
          factorY: 1,
        })
        .expect(201);

      expect(response.body.rotatedMatrix).toBeDefined();
      expect(response.body.rotatedMatrix).toHaveLength(15);
      expect(response.body.appliedAngle).toBe(rotationAngle);

      console.log('✅ Manual rotation successful');
      console.log(`   Rotated ${rotationAngle}° between factors 0 and 1`);
    });

    it('should perform oblique rotation correctly', async () => {
      console.log('\n🔬 Testing Oblique Rotation\n');

      const loadingMatrix = generateLoadingMatrix(25, 3);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/rotate-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'oblimin',
          loadingMatrix,
          delta: 0, // Direct oblimin
        })
        .expect(201);

      expect(response.body.patternMatrix).toBeDefined();
      expect(response.body.structureMatrix).toBeDefined();
      expect(response.body.factorCorrelations).toBeDefined();

      // Check factor correlations exist for oblique rotation
      const factorCorr = response.body.factorCorrelations;
      expect(factorCorr).toHaveLength(3);
      expect(factorCorr[0]).toHaveLength(3);

      console.log('✅ Oblique rotation successful');
      console.log('   Factor correlations calculated');
    });
  });

  describe('Q-Methodology Specific Functions', () => {
    it('should calculate z-scores correctly', async () => {
      console.log('\n🔬 Testing Z-Score Calculation\n');

      const factorArrays = generateFactorArrays(3, 36);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/calculate-z-scores')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          factorArrays,
          distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
        })
        .expect(201);

      expect(response.body.zScores).toBeDefined();
      expect(response.body.zScores).toHaveLength(3);

      // Check z-scores are normalized
      response.body.zScores.forEach((factorScores: number[]) => {
        const mean =
          factorScores.reduce((a, b) => a + b, 0) / factorScores.length;
        const variance =
          factorScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
          factorScores.length;

        expect(Math.abs(mean)).toBeLessThan(0.1); // Mean ~0
        expect(Math.abs(variance - 1)).toBeLessThan(0.1); // Variance ~1
      });

      console.log('✅ Z-score calculation successful');
    });

    it('should identify distinguishing statements correctly', async () => {
      console.log('\n🔬 Testing Distinguishing Statements\n');

      const factorLoadings = generateLoadingMatrix(36, 3);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/identify-distinguishing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          factorLoadings,
          significanceLevel: 0.05,
        })
        .expect(201);

      expect(response.body.distinguishingStatements).toBeDefined();
      expect(response.body.consensusStatements).toBeDefined();
      expect(Array.isArray(response.body.distinguishingStatements)).toBe(true);
      expect(Array.isArray(response.body.consensusStatements)).toBe(true);

      // Check that distinguishing and consensus are mutually exclusive
      const distinguishing = new Set(
        response.body.distinguishingStatements.map((s: any) => s.statementId),
      );
      const consensus = new Set(
        response.body.consensusStatements.map((s: any) => s.statementId),
      );
      const intersection = new Set(
        [...distinguishing].filter((x) => consensus.has(x)),
      );

      expect(intersection.size).toBe(0);

      console.log('✅ Distinguishing statements identified');
      console.log(
        `   Distinguishing: ${response.body.distinguishingStatements.length} statements`,
      );
      console.log(
        `   Consensus: ${response.body.consensusStatements.length} statements`,
      );
    });

    it('should generate factor arrays correctly', async () => {
      console.log('\n🔬 Testing Factor Array Generation\n');

      const qSorts = generateTestQSorts(30, 36);
      const factorLoadings = generateLoadingMatrix(30, 3);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/generate-factor-arrays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qSorts,
          factorLoadings,
          significantLoadingThreshold: 0.4,
        })
        .expect(201);

      expect(response.body.factorArrays).toBeDefined();
      expect(response.body.factorArrays).toHaveLength(3);

      // Check factor arrays follow Q-sort distribution
      response.body.factorArrays.forEach((array: number[]) => {
        expect(array).toHaveLength(36);

        // Check values are within expected range
        array.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(-4);
          expect(value).toBeLessThanOrEqual(4);
        });
      });

      console.log('✅ Factor arrays generated successfully');
    });

    it('should calculate factor correlations correctly', async () => {
      console.log('\n🔬 Testing Factor Correlations\n');

      const factorArrays = generateFactorArrays(4, 36);

      const response = await request(app.getHttpServer())
        .post('/api/analysis/calculate-factor-correlations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          factorArrays,
        })
        .expect(200);

      expect(response.body.correlationMatrix).toBeDefined();
      expect(response.body.correlationMatrix).toHaveLength(4);

      // Check correlation matrix properties
      const corrMatrix = response.body.correlationMatrix;

      // Diagonal should be 1
      for (let i = 0; i < 4; i++) {
        expect(Math.abs(corrMatrix[i][i] - 1)).toBeLessThan(0.001);
      }

      // Matrix should be symmetric
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(Math.abs(corrMatrix[i][j] - corrMatrix[j][i])).toBeLessThan(
            0.001,
          );
        }
      }

      // Correlations should be between -1 and 1
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(corrMatrix[i][j]).toBeGreaterThanOrEqual(-1);
          expect(corrMatrix[i][j]).toBeLessThanOrEqual(1);
        }
      }

      console.log('✅ Factor correlations calculated successfully');
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should validate correlation matrix properties', async () => {
      console.log('\n🔬 Testing Data Validation\n');

      // Test with invalid matrix (non-symmetric)
      const invalidMatrix = [
        [1, 0.5, 0.3],
        [0.4, 1, 0.2], // Should be 0.5, not 0.4
        [0.3, 0.2, 1],
      ];

      const response = await request(app.getHttpServer())
        .post('/api/analysis/validate-correlation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matrix: invalidMatrix,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('symmetric');

      console.log('✅ Invalid matrix correctly rejected');

      // Test with valid matrix
      const validMatrix = generateCorrelationMatrix(10);

      const validResponse = await request(app.getHttpServer())
        .post('/api/analysis/validate-correlation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matrix: validMatrix,
        })
        .expect(200);

      expect(validResponse.body.valid).toBe(true);
      console.log('✅ Valid matrix accepted');
    });

    it('should handle edge cases gracefully', async () => {
      console.log('\n🔬 Testing Edge Cases\n');

      // Test with minimum data
      const minMatrix = [[1]];

      const minResponse = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'pca',
          correlationMatrix: minMatrix,
          numberOfFactors: 1,
        })
        .expect(201);

      expect(minResponse.body.factors).toHaveLength(1);
      console.log('✅ Minimum data handled');

      // Test with large dataset
      const largeMatrix = generateCorrelationMatrix(100);

      const largeResponse = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'pca',
          correlationMatrix: largeMatrix,
          numberOfFactors: 5,
        })
        .expect(201);

      expect(largeResponse.body.factors).toHaveLength(5);
      console.log('✅ Large dataset handled');

      // Test with perfect correlation
      const perfectCorr = Array(5)
        .fill(null)
        .map(() => Array(5).fill(1));
      for (let i = 0; i < 5; i++) {
        perfectCorr[i][i] = 1;
      }

      const perfectResponse = await request(app.getHttpServer())
        .post('/api/analysis/extract-factors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'pca',
          correlationMatrix: perfectCorr,
          numberOfFactors: 1,
        })
        .expect(201);

      expect(perfectResponse.body.warning).toContain('singular');
      console.log('✅ Singular matrix handled with warning');
    });
  });

  // Helper functions
  function generateCorrelationMatrix(size: number): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (j < i) {
          matrix[i][j] = matrix[j][i]; // Ensure symmetry
        } else {
          matrix[i][j] = Math.random() * 0.8 - 0.4; // Random correlation
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

  function generateFactorArrays(
    factors: number,
    statements: number,
  ): number[][] {
    return Array.from({ length: factors }, () => {
      const array = Array.from(
        { length: statements },
        () => Math.floor(Math.random() * 9) - 4,
      );
      // Sort to create realistic Q-sort distribution
      return array.sort((a, b) => Math.random() - 0.5);
    });
  }

  function generateTestQSorts(participants: number, statements: number): any[] {
    return Array.from({ length: participants }, (_, i) => ({
      participantId: `p-${i}`,
      sortData: generateFactorArrays(1, statements)[0],
    }));
  }

  function checkOrthogonality(matrix: number[][]): boolean {
    const n = matrix.length;

    // Multiply matrix by its transpose
    const product: number[][] = [];
    for (let i = 0; i < n; i++) {
      product[i] = [];
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += matrix[i][k] * matrix[j][k];
        }
        product[i][j] = sum;
      }
    }

    // Check if product is identity matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const expected = i === j ? 1 : 0;
        if (Math.abs(product[i][j] - expected) > 0.001) {
          return false;
        }
      }
    }

    return true;
  }
});
