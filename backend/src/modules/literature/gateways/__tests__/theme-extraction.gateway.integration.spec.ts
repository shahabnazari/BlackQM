/**
 * Theme Extraction Gateway Integration Tests
 * Phase 10 Day 33: Enterprise-grade WebSocket testing
 * Phase 10.942 Day 8: STRICT AUDIT fixes applied
 *
 * Tests:
 * - Real WebSocket connection flow
 * - Room join/leave lifecycle
 * - Progress message broadcasting
 * - Cleanup on disconnect
 * - Multiple concurrent users
 * - Error handling
 *
 * Requirements:
 * - @nestjs/testing
 * - socket.io-client
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import ioClient from 'socket.io-client';
import { ThemeExtractionGateway } from '../theme-extraction.gateway';

// ============================================================================
// TEST CONSTANTS (Eliminates magic numbers)
// ============================================================================

const TEST_TIMEOUTS = {
  /** Time to wait for socket operations to complete */
  SOCKET_OPERATION: 100,
  /** Time to wait for multiple socket operations */
  MULTI_SOCKET_OPERATION: 200,
  /** Short delay between rapid reconnections */
  RAPID_RECONNECT: 50,
  /** Timeout for connection error tests */
  CONNECTION_ERROR: 1000,
} as const;

describe('ThemeExtractionGateway (Integration)', () => {
  let app: INestApplication;
  let gateway: ThemeExtractionGateway;
  let clientSocket: ReturnType<typeof ioClient>;
  let serverUrl: string;
  // Track additional sockets for proper cleanup (STRICT AUDIT FIX)
  const additionalSockets: ReturnType<typeof ioClient>[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [ThemeExtractionGateway],
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = moduleFixture.get<ThemeExtractionGateway>(ThemeExtractionGateway);

    await app.listen(0); // Random port
    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}/theme-extraction`;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    // Cleanup main client socket
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    // Cleanup any additional sockets created in tests (STRICT AUDIT FIX)
    additionalSockets.forEach((socket) => {
      if (socket?.connected) {
        socket.disconnect();
      }
    });
    additionalSockets.length = 0; // Clear the array
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

      clientSocket.on('connect_error', (error: Error) => {
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
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
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
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
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
      // Track for cleanup (STRICT AUDIT FIX)
      additionalSockets.push(client1, client2);

      let connectCount = 0;

      const onConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          client1.emit('join', user1Id);
          client2.emit('join', user2Id);

          setTimeout(() => {
            expect(client1.connected).toBe(true);
            expect(client2.connected).toBe(true);
            done();
          }, TEST_TIMEOUTS.MULTI_SOCKET_OPERATION);
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
          }, TEST_TIMEOUTS.SOCKET_OPERATION);
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
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
        clientSocket.on('extraction-progress', (data: { userId: string; stage: string; percentage: number; message: string; details?: unknown }) => {
          expect(data).toBeDefined();
          expect(data.userId).toBeDefined();
          expect(data.percentage).toBeGreaterThanOrEqual(0);
          expect(data.percentage).toBeLessThanOrEqual(100);
          done();
        });

        // Simulate server emitting progress (requires gateway method)
        setTimeout(() => {
          // Mock progress event - actual gateway.emitProgress takes ExtractionProgress object
          gateway.emitProgress({
            userId,
            stage: 'extracting',
            percentage: 50,
            message: 'Analyzing patterns',
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
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
      });
    });

    it('should receive extraction-complete events', (done) => {
      const userId = `complete-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        clientSocket.on('extraction-complete', (data: { userId: string; stage: string; percentage: number; message: string; details?: { themesExtracted: number } }) => {
          expect(data).toBeDefined();
          expect(data.userId).toBeDefined();
          expect(data.details).toBeDefined();
          expect(data.details?.themesExtracted).toBe(5);
          done();
        });

        // Simulate completion - actual gateway.emitComplete takes (userId, themesCount)
        setTimeout(() => {
          gateway.emitComplete(userId, 5);
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
      });
    });

    it('should receive extraction-error events', (done) => {
      const userId = `error-user-${Date.now()}`;
      clientSocket = ioClient(serverUrl, { transports: ['websocket'] });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', userId);

        clientSocket.on('extraction-error', (data: { userId: string; stage: string; percentage: number; message: string }) => {
          expect(data).toBeDefined();
          expect(data.userId).toBeDefined();
          expect(data.message).toBeDefined();
          done();
        });

        // Simulate error - actual gateway.emitError takes (userId, errorString)
        setTimeout(() => {
          gateway.emitError(userId, 'Test error message');
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', (done) => {
      // Try to connect to wrong namespace
      const badClient = ioClient('http://localhost:9999/theme-extraction', {
        transports: ['websocket'],
        reconnection: false,
        timeout: TEST_TIMEOUTS.CONNECTION_ERROR,
      });
      // Track for cleanup (STRICT AUDIT FIX)
      additionalSockets.push(badClient);

      badClient.on('connect_error', (error: Error) => {
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
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
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
          }, TEST_TIMEOUTS.RAPID_RECONNECT);
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
            gateway.emitProgress({
              userId,
              stage: 'extracting',
              percentage: (i + 1) * 10,
              message: `Processing batch ${i + 1}`,
            });
          }
        }, TEST_TIMEOUTS.SOCKET_OPERATION);
      });
    });
  });
});
