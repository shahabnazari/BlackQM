import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';
import { PQMethodCompatibilityService } from '../services/pqmethod-compatibility.service';
import { QAnalysisService } from '../services/q-analysis.service';

describe('PQMethod File Import/Export Integration Tests', () => {
  let app: INestApplication;
  let pqMethodService: PQMethodCompatibilityService;
  let qAnalysisService: QAnalysisService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testStudyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PQMethodCompatibilityService, QAnalysisService, JwtService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    pqMethodService = moduleFixture.get<PQMethodCompatibilityService>(
      PQMethodCompatibilityService,
    );
    qAnalysisService = moduleFixture.get<QAnalysisService>(QAnalysisService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    testUserId = 'test-user-import-export';
    testStudyId = 'test-study-import-export';
    authToken = jwtService.sign({ sub: testUserId, role: 'researcher' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PQMethod File Import', () => {
    it('should import PQMethod .DAT file format', async () => {
      const datFileContent = generatePQMethodDATFile();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/import/pqmethod')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(datFileContent), 'test-study.dat')
        .field('studyId', testStudyId)
        .expect(201);

      expect(response.body).toHaveProperty('studyData');
      expect(response.body).toHaveProperty('statements');
      expect(response.body).toHaveProperty('sorts');
      expect(response.body.statements).toHaveLength(36);
      expect(response.body.sorts).toHaveLength(20);
    });

    it('should import PQMethod .STA statements file', async () => {
      const staFileContent = generatePQMethodSTAFile();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/import/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(staFileContent), 'statements.sta')
        .field('studyId', testStudyId)
        .expect(201);

      expect(response.body).toHaveProperty('statements');
      expect(response.body.statements).toHaveLength(40);
      expect(response.body.statements[0]).toHaveProperty('id');
      expect(response.body.statements[0]).toHaveProperty('text');
    });

    it('should import PQMethod project file with correlation matrix', async () => {
      const projectContent = generatePQMethodProjectFile();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/import/project')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(projectContent), 'project.prj')
        .field('studyId', testStudyId)
        .expect(201);

      expect(response.body).toHaveProperty('correlationMatrix');
      expect(response.body).toHaveProperty('factorLoadings');
      expect(response.body).toHaveProperty('eigenvalues');
      expect(response.body.correlationMatrix).toHaveLength(25);
    });

    it('should validate PQMethod file structure', async () => {
      const invalidContent = 'This is not a valid PQMethod file';

      await request(app.getHttpServer())
        .post('/api/analysis/import/pqmethod')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(invalidContent), 'invalid.dat')
        .field('studyId', testStudyId)
        .expect(400);
    });

    it('should handle large PQMethod datasets', async () => {
      const largeDataset = generateLargePQMethodFile(100, 50); // 100 participants, 50 statements

      const response = await request(app.getHttpServer())
        .post('/api/analysis/import/pqmethod')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(largeDataset), 'large-study.dat')
        .field('studyId', testStudyId)
        .field('validateOnly', 'true') // Validation mode
        .expect(200);

      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('participantCount', 100);
      expect(response.body).toHaveProperty('statementCount', 50);
    });

    it('should preserve PQMethod factor rotation settings', async () => {
      const rotationFile = generatePQMethodRotationFile();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/import/rotation')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(rotationFile), 'rotation.rot')
        .field('studyId', testStudyId)
        .expect(201);

      expect(response.body).toHaveProperty('rotationType', 'varimax');
      expect(response.body).toHaveProperty('rotatedLoadings');
      expect(response.body).toHaveProperty('factorCorrelations');
    });
  });

  describe('PQMethod File Export', () => {
    it('should export analysis to PQMethod .DAT format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/pqmethod')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          format: 'dat',
          includeRotation: true,
        })
        .expect(200);

      expect(response.headers['content-type']).toContain(
        'application/octet-stream',
      );
      expect(response.headers['content-disposition']).toContain('.dat');

      // Validate PQMethod format structure
      const exportedContent = response.text;
      expect(exportedContent).toContain('QMETHOD');
      expect(exportedContent).toMatch(/^\d{2}\s+\d{2}\s+/); // PQMethod header format
    });

    it('should export factor arrays in PQMethod format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/factor-arrays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          factors: generateTestFactorArrays(3, 36),
        })
        .expect(200);

      const lines = response.text.split('\n');
      expect(lines[0]).toContain('Factor Arrays');
      expect(lines.length).toBeGreaterThan(36); // At least one line per statement
    });

    it('should export distinguishing statements report', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/distinguishing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          format: 'pqmethod-report',
        })
        .expect(200);

      expect(response.text).toContain('Distinguishing Statements');
      expect(response.text).toContain('Factor 1');
      expect(response.text).toContain('P < 0.05');
    });

    it('should export correlation matrix in PQMethod format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/correlation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          matrix: generateTestCorrelationMatrix(20),
        })
        .expect(200);

      const lines = response.text.split('\n');
      // PQMethod correlation matrix format validation
      expect(lines[0]).toMatch(/^\s+1\s+2\s+3/); // Column headers
      expect(lines[1]).toMatch(/^1\s+1\.000/); // First row starts with 1.000
    });

    it('should export with PQMethod-compatible statement numbering', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          format: 'pqmethod-sta',
        })
        .expect(200);

      const lines = response.text.split('\n');
      lines.forEach((line, index) => {
        if (line.trim() && index > 0) {
          // Check PQMethod statement format: number (3 digits) + space + text
          expect(line).toMatch(/^\d{3}\s+.+/);
        }
      });
    });

    it('should handle batch export of multiple formats', async () => {
      const formats = ['dat', 'sta', 'rot', 'fac'];
      const exportPromises = formats.map((format) =>
        request(app.getHttpServer())
          .post('/api/analysis/export/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studyId: testStudyId,
            formats: [format],
          }),
      );

      const responses = await Promise.all(exportPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('files');
        expect(response.body.files[0]).toHaveProperty('format', formats[index]);
        expect(response.body.files[0]).toHaveProperty('content');
      });
    });

    it('should preserve statistical precision in exports', async () => {
      const precisionData = {
        eigenvalues: [4.56789, 2.34567, 1.23456],
        loadings: [[0.75432, -0.34521, 0.12345]],
        zScores: [2.345, -1.234, 0.567],
      };

      const response = await request(app.getHttpServer())
        .post('/api/analysis/export/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyId: testStudyId,
          data: precisionData,
          precision: 3, // 3 decimal places
        })
        .expect(200);

      // Verify precision is maintained
      expect(response.text).toContain('4.568');
      expect(response.text).toContain('0.754');
      expect(response.text).toContain('2.345');
    });
  });

  describe('File Format Conversion', () => {
    it('should convert between CSV and PQMethod formats', async () => {
      const csvContent = generateCSVQSortData();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceFormat: 'csv',
          targetFormat: 'pqmethod',
          content: csvContent,
        })
        .expect(200);

      expect(response.body).toHaveProperty('converted');
      expect(response.body).toHaveProperty('format', 'pqmethod');
    });

    it('should convert SPSS data to PQMethod format', async () => {
      const spssData = generateSPSSDataStructure();

      const response = await request(app.getHttpServer())
        .post('/api/analysis/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceFormat: 'spss',
          targetFormat: 'pqmethod',
          data: spssData,
        })
        .expect(200);

      expect(response.body).toHaveProperty('converted');
      expect(response.body.converted).toContain('QMETHOD');
    });

    it('should validate data integrity during conversion', async () => {
      const originalData = {
        sorts: generateTestQSorts(10, 30),
        statements: generateTestStatements(30),
      };

      const response = await request(app.getHttpServer())
        .post('/api/analysis/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceFormat: 'json',
          targetFormat: 'pqmethod',
          data: originalData,
          validateIntegrity: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('integrityCheck');
      expect(response.body.integrityCheck).toHaveProperty('sortCount', 10);
      expect(response.body.integrityCheck).toHaveProperty('statementCount', 30);
      expect(response.body.integrityCheck).toHaveProperty(
        'checksumMatch',
        true,
      );
    });
  });

  // Helper functions for generating test data
  function generatePQMethodDATFile(): string {
    let content = '20 36  9\n'; // 20 sorts, 36 statements, 9 columns
    content += ' -4 -3 -2 -1  0  1  2  3  4\n'; // Distribution
    content += '  2  3  4  5  6  5  4  3  2\n'; // Frequency distribution

    // Add 20 Q-sorts
    for (let i = 1; i <= 20; i++) {
      const sort = generateRandomQSort(36);
      content += sort.join(' ') + '\n';
    }

    return content;
  }

  function generatePQMethodSTAFile(): string {
    let content = '';
    for (let i = 1; i <= 40; i++) {
      content += `${String(i).padStart(3, '0')} Statement ${i}: This is the text content of statement number ${i}\n`;
    }
    return content;
  }

  function generatePQMethodProjectFile(): string {
    let content = 'QMETHOD PROJECT FILE V2.0\n';
    content += 'Study Title: Test Study\n';
    content += 'Number of Statements: 36\n';
    content += 'Number of Sorts: 25\n';
    content += 'Distribution: -4 -3 -2 -1 0 1 2 3 4\n';
    content += '\nCORRELATION MATRIX\n';

    // Add correlation matrix
    for (let i = 0; i < 25; i++) {
      const row = [];
      for (let j = 0; j < 25; j++) {
        if (i === j) {
          row.push('1.000');
        } else if (j < i) {
          row.push(row[j]); // Symmetric
        } else {
          row.push((Math.random() * 0.8 - 0.4).toFixed(3));
        }
      }
      content += row.join(' ') + '\n';
    }

    return content;
  }

  function generatePQMethodRotationFile(): string {
    let content = 'ROTATED FACTOR MATRIX\n';
    content += 'Rotation: Varimax\n';
    content += 'Factors: 3\n\n';

    // Add rotated loadings
    for (let i = 1; i <= 20; i++) {
      const loadings = [
        (Math.random() * 0.8).toFixed(3),
        (Math.random() * 0.6 - 0.3).toFixed(3),
        (Math.random() * 0.4 - 0.2).toFixed(3),
      ];
      content += `${String(i).padStart(3)} ${loadings.join(' ')}\n`;
    }

    return content;
  }

  function generateLargePQMethodFile(
    participants: number,
    statements: number,
  ): string {
    let content = `${participants} ${statements}  9\n`;
    content += ' -4 -3 -2 -1  0  1  2  3  4\n';

    // Calculate distribution for statements
    const dist = [2, 3, 4, 5, 6, 5, 4, 3, 2];
    content += dist.join(' ') + '\n';

    // Generate sorts
    for (let i = 0; i < participants; i++) {
      const sort = generateRandomQSort(statements);
      content += sort.join(' ') + '\n';
    }

    return content;
  }

  function generateCSVQSortData(): string {
    let csv = 'Participant,Statement,Ranking\n';
    for (let p = 1; p <= 10; p++) {
      for (let s = 1; s <= 30; s++) {
        const ranking = Math.floor(Math.random() * 9) - 4;
        csv += `P${p},S${s},${ranking}\n`;
      }
    }
    return csv;
  }

  function generateSPSSDataStructure(): any {
    return {
      variables: [
        { name: 'ID', type: 'numeric' },
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `Q${i + 1}`,
          type: 'numeric',
          label: `Statement ${i + 1}`,
        })),
      ],
      data: Array.from({ length: 20 }, (_, i) => ({
        ID: i + 1,
        ...Object.fromEntries(
          Array.from({ length: 30 }, (_, j) => [
            `Q${j + 1}`,
            Math.floor(Math.random() * 9) - 4,
          ]),
        ),
      })),
    };
  }

  function generateRandomQSort(statementCount: number): number[] {
    const sort = Array(statementCount).fill(0);
    const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const frequency = [2, 3, 4, 5, 6, 5, 4, 3, 2];

    let statements = Array.from({ length: statementCount }, (_, i) => i);

    distribution.forEach((value, index) => {
      for (let i = 0; i < frequency[index] && statements.length > 0; i++) {
        const randIndex = Math.floor(Math.random() * statements.length);
        const statement = statements.splice(randIndex, 1)[0];
        sort[statement] = value;
      }
    });

    return sort;
  }

  function generateTestCorrelationMatrix(size: number): number[][] {
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

  function generateTestFactorArrays(
    factors: number,
    statements: number,
  ): number[][] {
    const arrays: number[][] = [];
    for (let i = 0; i < factors; i++) {
      arrays[i] = generateRandomQSort(statements);
    }
    return arrays;
  }

  function generateTestQSorts(
    participants: number,
    statements: number,
  ): number[][] {
    const sorts: number[][] = [];
    for (let i = 0; i < participants; i++) {
      sorts[i] = generateRandomQSort(statements);
    }
    return sorts;
  }

  function generateTestStatements(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      text: `Statement ${i + 1}: This is test statement number ${i + 1}`,
    }));
  }
});
