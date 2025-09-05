import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket as ClientSocket, io } from 'socket.io-client';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AnalysisGateway } from '../gateways/analysis.gateway';
import { QAnalysisService } from '../services/q-analysis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from '../entities/analysis.entity';
import { Study } from '../../studies/entities/study.entity';

describe('Analysis WebSocket Integration Tests', () => {
  let app: INestApplication;
  let gateway: AnalysisGateway;
  let jwtService: JwtService;
  let clientSocket: ClientSocket;
  let serverSocket: Server;
  let authToken: string;
  let testUserId: string;
  let testStudyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisGateway,
        QAnalysisService,
        JwtService,
        {
          provide: getRepositoryToken(Analysis),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Study),
          useClass: Repository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Random port

    gateway = app.get<AnalysisGateway>(AnalysisGateway);
    jwtService = app.get<JwtService>(JwtService);

    // Generate test auth token
    testUserId = 'test-user-ws-123';
    testStudyId = 'test-study-ws-456';
    authToken = jwtService.sign({ sub: testUserId, role: 'researcher' });

    // Get server address
    const address = app.getHttpServer().address();
    const port = address.port;

    // Connect client socket
    clientSocket = io(`http://localhost:${port}`, {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    await app.close();
  });

  describe('Real-time Analysis Updates', () => {
    it('should establish WebSocket connection with authentication', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it('should join analysis room for specific study', (done) => {
      clientSocket.emit('joinAnalysis', { studyId: testStudyId });

      clientSocket.on('joinedAnalysis', (data) => {
        expect(data.studyId).toBe(testStudyId);
        expect(data.status).toBe('joined');
        done();
      });
    });

    it('should receive real-time factor extraction progress updates', (done) => {
      const progressUpdates: number[] = [];

      clientSocket.on('analysisProgress', (data) => {
        progressUpdates.push(data.progress);

        if (data.progress === 100) {
          expect(progressUpdates).toContain(25);
          expect(progressUpdates).toContain(50);
          expect(progressUpdates).toContain(75);
          expect(progressUpdates).toContain(100);
          done();
        }
      });

      // Trigger analysis
      clientSocket.emit('startAnalysis', {
        studyId: testStudyId,
        type: 'factor-extraction',
        parameters: {
          method: 'pca',
          numberOfFactors: 3,
        },
      });
    });

    it('should receive real-time rotation updates', (done) => {
      let rotationSteps = 0;

      clientSocket.on('rotationUpdate', (data) => {
        rotationSteps++;

        expect(data).toHaveProperty('iteration');
        expect(data).toHaveProperty('convergence');
        expect(data).toHaveProperty('rotatedMatrix');

        if (data.converged) {
          expect(rotationSteps).toBeGreaterThan(0);
          expect(data.convergence).toBeLessThan(0.001);
          done();
        }
      });

      clientSocket.emit('startRotation', {
        studyId: testStudyId,
        method: 'varimax',
        loadingMatrix: generateTestMatrix(10, 3),
      });
    });

    it('should broadcast analysis completion to all room participants', (done) => {
      // Create second client
      const secondClient = io(
        `http://localhost:${app.getHttpServer().address().port}`,
        {
          auth: { token: authToken },
          transports: ['websocket'],
        },
      );

      secondClient.on('connect', () => {
        secondClient.emit('joinAnalysis', { studyId: testStudyId });
      });

      let completionCount = 0;
      const checkCompletion = (data: any) => {
        expect(data.studyId).toBe(testStudyId);
        expect(data.status).toBe('completed');
        completionCount++;

        if (completionCount === 2) {
          secondClient.disconnect();
          done();
        }
      };

      clientSocket.on('analysisCompleted', checkCompletion);
      secondClient.on('analysisCompleted', checkCompletion);

      // Trigger completion event
      setTimeout(() => {
        clientSocket.emit('completeAnalysis', {
          studyId: testStudyId,
          results: { factors: 3, variance: 70 },
        });
      }, 100);
    });

    it('should handle interactive 3D rotation commands', (done) => {
      const rotationHistory: any[] = [];

      clientSocket.on('3dRotationUpdate', (data) => {
        rotationHistory.push(data);

        if (rotationHistory.length === 3) {
          expect(rotationHistory[0].angle).toBe(15);
          expect(rotationHistory[1].angle).toBe(30);
          expect(rotationHistory[2].angle).toBe(45);
          done();
        }
      });

      // Send rotation commands
      [15, 30, 45].forEach((angle, index) => {
        setTimeout(() => {
          clientSocket.emit('rotate3D', {
            studyId: testStudyId,
            factorX: 0,
            factorY: 1,
            angle: angle,
          });
        }, index * 50);
      });
    });

    it('should handle participant loading updates in real-time', (done) => {
      const participants = ['p1', 'p2', 'p3', 'p4', 'p5'];
      const loadingUpdates: string[] = [];

      clientSocket.on('participantLoaded', (data) => {
        loadingUpdates.push(data.participantId);

        if (loadingUpdates.length === participants.length) {
          expect(loadingUpdates).toEqual(participants);
          done();
        }
      });

      // Simulate participants being loaded
      participants.forEach((id, index) => {
        setTimeout(() => {
          clientSocket.emit('loadParticipant', {
            studyId: testStudyId,
            participantId: id,
            loadings: [0.7, -0.3, 0.2],
          });
        }, index * 20);
      });
    });

    it('should handle export generation progress', (done) => {
      const exportSteps: string[] = [];

      clientSocket.on('exportProgress', (data) => {
        exportSteps.push(data.step);

        if (data.step === 'completed') {
          expect(exportSteps).toContain('preparing');
          expect(exportSteps).toContain('generating');
          expect(exportSteps).toContain('formatting');
          expect(exportSteps).toContain('completed');
          expect(data.downloadUrl).toBeDefined();
          done();
        }
      });

      clientSocket.emit('generateExport', {
        studyId: testStudyId,
        format: 'pqmethod',
        includeRawData: true,
      });
    });

    it('should handle error broadcasting', (done) => {
      clientSocket.on('analysisError', (error) => {
        expect(error.message).toContain('Invalid correlation matrix');
        expect(error.code).toBe('INVALID_MATRIX');
        done();
      });

      clientSocket.emit('startAnalysis', {
        studyId: testStudyId,
        type: 'factor-extraction',
        parameters: {
          correlationMatrix: [[]], // Invalid matrix
        },
      });
    });

    it('should handle concurrent analysis requests', (done) => {
      const results: any[] = [];

      clientSocket.on('concurrentResult', (data) => {
        results.push(data);

        if (results.length === 3) {
          expect(results).toHaveLength(3);
          results.forEach((result) => {
            expect(result.studyId).toBe(testStudyId);
            expect(result.completed).toBe(true);
          });
          done();
        }
      });

      // Send multiple concurrent requests
      ['pca', 'centroid', 'maximum-likelihood'].forEach((method) => {
        clientSocket.emit('quickAnalysis', {
          studyId: testStudyId,
          method: method,
        });
      });
    });

    it('should handle room leave and cleanup', (done) => {
      clientSocket.emit('leaveAnalysis', { studyId: testStudyId });

      clientSocket.on('leftAnalysis', (data) => {
        expect(data.studyId).toBe(testStudyId);
        expect(data.status).toBe('left');
        done();
      });
    });

    it('should handle reconnection with session recovery', (done) => {
      const originalSocketId = clientSocket.id;

      clientSocket.disconnect();

      setTimeout(() => {
        clientSocket.connect();

        clientSocket.on('connect', () => {
          expect(clientSocket.id).not.toBe(originalSocketId);

          clientSocket.emit('recoverSession', {
            studyId: testStudyId,
            lastEventId: 'event-123',
          });

          clientSocket.on('sessionRecovered', (data) => {
            expect(data.studyId).toBe(testStudyId);
            expect(data.missedEvents).toBeDefined();
            done();
          });
        });
      }, 100);
    });

    it('should handle collaborative analysis sessions', (done) => {
      const collaborators: ClientSocket[] = [];
      const updates: any[] = [];

      // Create 3 collaborator sockets
      for (let i = 0; i < 3; i++) {
        const collaborator = io(
          `http://localhost:${app.getHttpServer().address().port}`,
          {
            auth: { token: authToken },
            transports: ['websocket'],
          },
        );

        collaborator.on('collaboratorUpdate', (data) => {
          updates.push({ id: i, data });

          if (updates.length === 9) {
            // 3 updates per collaborator
            expect(updates).toHaveLength(9);
            collaborators.forEach((c) => c.disconnect());
            done();
          }
        });

        collaborators.push(collaborator);
      }

      // Wait for connections then join room
      setTimeout(() => {
        collaborators.forEach((c) => {
          c.emit('joinCollaboration', { studyId: testStudyId });
        });

        // Send updates from first collaborator
        setTimeout(() => {
          collaborators[0].emit('collaborativeAction', {
            studyId: testStudyId,
            action: 'rotate',
            data: { angle: 45 },
          });
        }, 200);
      }, 100);
    });

    it('should throttle high-frequency updates', (done) => {
      const receivedUpdates: number[] = [];
      let sentCount = 0;

      clientSocket.on('throttledUpdate', (data) => {
        receivedUpdates.push(data.value);
      });

      // Send 100 updates rapidly
      const interval = setInterval(() => {
        clientSocket.emit('highFrequencyUpdate', {
          studyId: testStudyId,
          value: sentCount++,
        });

        if (sentCount >= 100) {
          clearInterval(interval);

          // Check that updates were throttled
          setTimeout(() => {
            expect(receivedUpdates.length).toBeLessThan(100);
            expect(receivedUpdates.length).toBeGreaterThan(5);
            done();
          }, 500);
        }
      }, 5);
    });
  });

  // Helper functions
  function generateTestMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = Math.random() * 0.8 - 0.4;
      }
    }
    return matrix;
  }
});
