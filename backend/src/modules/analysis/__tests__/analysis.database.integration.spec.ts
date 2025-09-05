import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Analysis } from '../entities/analysis.entity';
import { Study } from '../../studies/entities/study.entity';
import { User } from '../../users/entities/user.entity';
import { QSortResponse } from '../../responses/entities/qsort-response.entity';

describe('Analysis Database Integration Tests', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let analysisRepository: Repository<Analysis>;
  let studyRepository: Repository<Study>;
  let userRepository: Repository<User>;
  let qSortResponseRepository: Repository<QSortResponse>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432'),
          username: process.env.TEST_DB_USERNAME || 'test',
          password: process.env.TEST_DB_PASSWORD || 'test',
          database: process.env.TEST_DB_NAME || 'vqmethod_test',
          entities: [Analysis, Study, User, QSortResponse],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Analysis, Study, User, QSortResponse]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    analysisRepository = module.get<Repository<Analysis>>(
      getRepositoryToken(Analysis),
    );
    studyRepository = module.get<Repository<Study>>(getRepositoryToken(Study));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    qSortResponseRepository = module.get<Repository<QSortResponse>>(
      getRepositoryToken(QSortResponse),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await analysisRepository.delete({});
    await qSortResponseRepository.delete({});
    await studyRepository.delete({});
    await userRepository.delete({});
  });

  describe('Analysis Data Persistence', () => {
    let testUser: User;
    let testStudy: Study;

    beforeEach(async () => {
      // Create test user
      testUser = await userRepository.save({
        email: 'researcher@test.com',
        firstName: 'Test',
        lastName: 'Researcher',
        passwordHash: 'hashed_password',
        role: 'researcher',
      });

      // Create test study
      testStudy = await studyRepository.save({
        title: 'Test Q-Methodology Study',
        description: 'Testing database persistence',
        userId: testUser.id,
        configuration: {
          gridColumns: 9,
          distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
          forcedDistribution: true,
          statements: generateTestStatements(30),
        },
        status: 'active',
      });
    });

    it('should persist analysis with complete factor extraction results', async () => {
      const analysisData = {
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'factor-extraction',
        status: 'completed',
        factors: generateDetailedFactors(3),
        eigenvalues: [4.5, 2.8, 1.9, 1.2, 0.9, 0.7],
        varianceExplained: [45, 28, 19, 12, 9, 7],
        correlationMatrix: generateCorrelationMatrix(10),
        loadingMatrix: generateLoadingMatrix(10, 3),
        communalities: generateCommunalities(10),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedAnalysis = await analysisRepository.save(analysisData);

      expect(savedAnalysis.id).toBeDefined();
      expect(savedAnalysis.factors).toHaveLength(3);
      expect(savedAnalysis.eigenvalues).toHaveLength(6);
      expect(savedAnalysis.varianceExplained).toHaveLength(6);
      expect(savedAnalysis.correlationMatrix).toHaveLength(10);
      expect(savedAnalysis.loadingMatrix).toHaveLength(10);
      expect(savedAnalysis.communalities).toHaveLength(10);
    });

    it('should persist rotated factor analysis', async () => {
      const rotationData = {
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'factor-rotation',
        status: 'completed',
        rotationType: 'varimax',
        rotatedMatrix: generateLoadingMatrix(10, 3),
        rotationMatrix: generateRotationMatrix(3),
        factorCorrelations: generateFactorCorrelations(3),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedRotation = await analysisRepository.save(rotationData);

      expect(savedRotation.rotationType).toBe('varimax');
      expect(savedRotation.rotatedMatrix).toHaveLength(10);
      expect(savedRotation.rotationMatrix).toHaveLength(3);
      expect(savedRotation.factorCorrelations).toHaveLength(3);
    });

    it('should persist distinguishing statements analysis', async () => {
      const distinguishingData = {
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'distinguishing-analysis',
        status: 'completed',
        distinguishingStatements: [
          {
            statementId: 1,
            factorDifferences: [2.3, -1.5, 0.8],
            significance: 0.001,
            distinguishingFactors: [1, 2],
          },
          {
            statementId: 5,
            factorDifferences: [1.9, 0.3, -2.1],
            significance: 0.002,
            distinguishingFactors: [1, 3],
          },
        ],
        consensusStatements: [
          {
            statementId: 10,
            averageScore: 1.2,
            variance: 0.3,
            agreement: 0.85,
          },
          {
            statementId: 15,
            averageScore: -0.5,
            variance: 0.2,
            agreement: 0.9,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedAnalysis = await analysisRepository.save(distinguishingData);

      expect(savedAnalysis.distinguishingStatements).toHaveLength(2);
      expect(savedAnalysis.consensusStatements).toHaveLength(2);
      expect(savedAnalysis.distinguishingStatements[0].significance).toBe(
        0.001,
      );
    });

    it('should handle cascade operations with related entities', async () => {
      // Create Q-sort responses
      const qSortResponses = [];
      for (let i = 0; i < 5; i++) {
        const response = await qSortResponseRepository.save({
          studyId: testStudy.id,
          participantId: `participant-${i}`,
          sortData: generateQSortData(30),
          completedAt: new Date(),
        });
        qSortResponses.push(response);
      }

      // Create analysis linked to study and responses
      const analysis = await analysisRepository.save({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'complete-analysis',
        status: 'completed',
        responseIds: qSortResponses.map((r) => r.id),
        participantCount: 5,
        factors: generateDetailedFactors(2),
      });

      expect(analysis.responseIds).toHaveLength(5);
      expect(analysis.participantCount).toBe(5);

      // Test that analysis persists even if responses are deleted
      await qSortResponseRepository.delete({ studyId: testStudy.id });

      const retrievedAnalysis = await analysisRepository.findOne({
        where: { id: analysis.id },
      });

      expect(retrievedAnalysis).toBeDefined();
      expect(retrievedAnalysis?.responseIds).toHaveLength(5);
    });

    it('should enforce unique constraints on analysis versions', async () => {
      // Create initial analysis
      const analysis1 = await analysisRepository.save({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'factor-extraction',
        status: 'completed',
        version: 1,
        factors: generateDetailedFactors(2),
      });

      // Try to create duplicate version
      const analysis2 = analysisRepository.create({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'factor-extraction',
        status: 'completed',
        version: 1, // Same version
        factors: generateDetailedFactors(3),
      });

      await expect(analysisRepository.save(analysis2)).rejects.toThrow();
    });

    it('should handle concurrent analysis updates', async () => {
      const analysis = await analysisRepository.save({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'in-progress',
        status: 'processing',
        progress: 0,
      });

      // Simulate concurrent updates
      const updates = [];
      for (let i = 1; i <= 10; i++) {
        updates.push(
          analysisRepository.update(analysis.id, {
            progress: i * 10,
            updatedAt: new Date(),
          }),
        );
      }

      await Promise.all(updates);

      const finalAnalysis = await analysisRepository.findOne({
        where: { id: analysis.id },
      });

      expect(finalAnalysis?.progress).toBeGreaterThanOrEqual(10);
      expect(finalAnalysis?.progress).toBeLessThanOrEqual(100);
    });

    it('should persist large datasets efficiently', async () => {
      const largeMatrix = generateCorrelationMatrix(100);
      const largeLoadings = generateLoadingMatrix(100, 7);

      const startTime = Date.now();

      const analysis = await analysisRepository.save({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'large-dataset',
        status: 'completed',
        correlationMatrix: largeMatrix,
        loadingMatrix: largeLoadings,
        participantCount: 100,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(analysis.correlationMatrix).toHaveLength(100);
      expect(analysis.loadingMatrix).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should save within 5 seconds
    });

    it('should maintain data integrity with transactions', async () => {
      await dataSource.transaction(async (manager) => {
        const analysis1 = await manager.save(Analysis, {
          studyId: testStudy.id,
          userId: testUser.id,
          type: 'transaction-test-1',
          status: 'completed',
        });

        const analysis2 = await manager.save(Analysis, {
          studyId: testStudy.id,
          userId: testUser.id,
          type: 'transaction-test-2',
          status: 'completed',
        });

        expect(analysis1.id).toBeDefined();
        expect(analysis2.id).toBeDefined();
      });

      const count = await analysisRepository.count({
        where: { studyId: testStudy.id },
      });

      expect(count).toBe(2);
    });

    it('should handle JSON field queries', async () => {
      await analysisRepository.save({
        studyId: testStudy.id,
        userId: testUser.id,
        type: 'json-query-test',
        status: 'completed',
        metadata: {
          software: 'VQMethod',
          version: '2.0',
          settings: {
            extractionMethod: 'pca',
            rotationType: 'varimax',
            convergenceCriteria: 0.001,
          },
        },
      });

      const result = await analysisRepository
        .createQueryBuilder('analysis')
        .where("analysis.metadata->>'software' = :software", {
          software: 'VQMethod',
        })
        .getOne();

      expect(result).toBeDefined();
      expect(result?.metadata.version).toBe('2.0');
      expect(result?.metadata.settings.extractionMethod).toBe('pca');
    });
  });

  // Helper functions
  function generateTestStatements(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      text: `Statement ${i + 1}`,
      category: `Category ${Math.floor(i / 10) + 1}`,
    }));
  }

  function generateDetailedFactors(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      label: `Factor ${i + 1}`,
      eigenvalue: 4.5 - i * 0.8,
      varianceExplained: 45 - i * 10,
      loadings: generateRandomArray(30, -0.8, 0.8),
      interpretation: `Interpretation for factor ${i + 1}`,
    }));
  }

  function generateCorrelationMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = matrix[j]?.[i] ?? Math.random() * 0.8 - 0.4;
        }
      }
    }
    return matrix;
  }

  function generateLoadingMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
      generateRandomArray(cols, -0.8, 0.8),
    );
  }

  function generateCommunalities(count: number): number[] {
    return generateRandomArray(count, 0.3, 0.9);
  }

  function generateRotationMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = generateRandomArray(size, -1, 1);
    }
    return matrix;
  }

  function generateFactorCorrelations(size: number): number[][] {
    return generateCorrelationMatrix(size);
  }

  function generateQSortData(statementCount: number): any {
    const positions: { [key: number]: number } = {};
    const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    let statementId = 1;

    for (const value of distribution) {
      const count = Math.abs(value) === 4 ? 2 : Math.abs(value) + 3;
      for (let i = 0; i < count && statementId <= statementCount; i++) {
        positions[statementId] = value;
        statementId++;
      }
    }

    return { positions, completedAt: new Date() };
  }

  function generateRandomArray(
    length: number,
    min: number,
    max: number,
  ): number[] {
    return Array.from({ length }, () => Math.random() * (max - min) + min);
  }
});
