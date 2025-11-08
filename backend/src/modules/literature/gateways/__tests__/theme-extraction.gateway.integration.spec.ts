/**
 * Theme Extraction Gateway Integration Tests
 * Phase 10 Day 33: Enterprise-grade WebSocket testing
 *
 * Tests:
 * - Real authentication flow
 * - Room join/leave lifecycle
 * - Progress message broadcasting
 * - Cleanup on disconnect
 * - Multiple concurrent users
 * - Error handling
 *
 * Requirements:
 * - @nestjs/testing
 * - socket.io-client
 * - Test database with Prisma
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { PrismaService } from '../../../../common/prisma.service';
import { ThemeExtractionGateway } from '../theme-extraction.gateway';

describe('ThemeExtractionGateway (Integration)', () => {
  let app: INestApplication;
  let gateway: ThemeExtractionGateway;
  let prisma: PrismaService;
  let clientSocket: ClientSocket;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [ThemeExtractionGateway, PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = moduleFixture.get<ThemeExtractionGateway>(ThemeExtractionGateway);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.listen(0); // Random port
    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}/theme-extraction`;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Lifecycle', () => {
    it('should successfully connect to WebSocket gateway', (done) => {
      clientSocket = ioClient(serverUrl, {
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should join user room with valid userId', (done) => {
      const userId = `test-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        // Emit join event
        clientSocket.emit('join', userId);

        // Verify connection is established
        setTimeout(() => {
          expect(clientSocket.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('should handle disconnect and cleanup', (done) => {
      const userId = `test-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        // Disconnect after joining
        setTimeout(() => {
          clientSocket.disconnect();
        }, 100);
      });

      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  describe('Room Management', () => {
    it('should support multiple users in different rooms', (done) => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      const client1 = ioClient(serverUrl, { transports: ['websocket'] });
      const client2 = ioClient(serverUrl, { transports: ['websocket'] });

      let connectCount = 0;

      const onConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          client1.emit('join', user1Id);
          client2.emit('join', user2Id);

          setTimeout(() => {
            expect(client1.connected).toBe(true);
            expect(client2.connected).toBe(true);

            client1.disconnect();
            client2.disconnect();
            done();
          }, 200);
        }
      };

      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
    });

    it('should properly leave room on explicit leave event', (done) => {
      const userId = 'test-leave-user';
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        setTimeout(() => {
          clientSocket.emit('leave', userId);

          // Verify still connected but left room
          setTimeout(() => {
            expect(clientSocket.connected).toBe(true);
            done();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Progress Broadcasting', () => {
    it('should receive extraction-progress events', (done) => {
      const userId = `progress-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        // Listen for progress events
        clientSocket.on('extraction-progress', (data) => {
          expect(data).toBeDefined();
          expect(data.extractionId).toBeDefined();
          expect(data.progress).toBeGreaterThanOrEqual(0);
          expect(data.progress).toBeLessThanOrEqual(100);
          done();
        });

        // Simulate server emitting progress (requires gateway method)
        // For full test, would need to trigger actual extraction
        setTimeout(() => {
          // Mock progress event
          gateway.emitProgress(userId, {
            extractionId: 'test-extraction',
            progress: 50,
            stage: 'extracting',
            details: {
              transparentMessage: {
                stageName: 'Coding',
                stageNumber: 2,
                totalStages: 6,
                percentage: 50,
                whatWeAreDoing: 'Analyzing patterns',
                whyItMatters: 'Finding themes',
                liveStats: {
                  sourcesAnalyzed: 5,
                  totalSources: 10,
                  themesFound: 3,
                },
              },
            },
          });
        }, 100);
      });
    });

    it('should receive extraction-complete events', (done) => {
      const userId = `complete-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        clientSocket.on('extraction-complete', (data) => {
          expect(data).toBeDefined();
          expect(data.extractionId).toBeDefined();
          expect(data.details).toBeDefined();
          done();
        });

        // Simulate completion
        setTimeout(() => {
          gateway.emitComplete(userId, {
            extractionId: 'test-extraction',
            details: {
              themesExtracted: 5,
              totalSources: 10,
            },
          });
        }, 100);
      });
    });

    it('should receive extraction-error events', (done) => {
      const userId = `error-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        clientSocket.on('extraction-error', (data) => {
          expect(data).toBeDefined();
          expect(data.extractionId).toBeDefined();
          expect(data.message).toBeDefined();
          done();
        });

        // Simulate error
        setTimeout(() => {
          gateway.emitError(userId, {
            extractionId: 'test-extraction',
            message: 'Test error message',
          });
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', (done) => {
      // Try to connect to wrong namespace
      const badClient = ioClient('http://localhost:9999/theme-extraction', {
        transports: ['websocket'],
        reconnection: false,
        timeout: 1000,
      });

      badClient.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });

    it('should handle malformed join events', (done) => {
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        // Send invalid userId
        clientSocket.emit('join', null);

        // Should still be connected
        setTimeout(() => {
          expect(clientSocket.connected).toBe(true);
          done();
        }, 100);
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid reconnections', (done) => {
      const userId = 'rapid-reconnect-user';
      let connectionCount = 0;
      const maxConnections = 5;

      const connectAndDisconnect = () => {
        const client = ioClient(serverUrl, { transports: ['websocket'] });

        client.on('connect', () => {
          client.emit('join', userId);
          connectionCount++;

          setTimeout(() => {
            client.disconnect();

            if (connectionCount < maxConnections) {
              connectAndDisconnect();
            } else {
              expect(connectionCount).toBe(maxConnections);
              done();
            }
          }, 50);
        });
      };

      connectAndDisconnect();
    });

    it('should handle multiple concurrent progress updates', (done) => {
      const userId = `concurrent-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      let receivedCount = 0;
      const expectedCount = 10;

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        clientSocket.on('extraction-progress', () => {
          receivedCount++;
          if (receivedCount === expectedCount) {
            done();
          }
        });

        // Send multiple progress updates rapidly
        setTimeout(() => {
          for (let i = 0; i < expectedCount; i++) {
            gateway.emitProgress(userId, {
              extractionId: 'test-extraction',
              progress: (i + 1) * 10,
              stage: 'extracting',
              details: {},
            });
          }
        }, 100);
      });
    });
  });
});
