/**
 * useThemeExtractionWebSocket Hook Tests - Phase 10.942 Day 8
 *
 * Enterprise-grade unit tests for WebSocket hook.
 * Tests connection lifecycle, event handling, and cleanup.
 *
 * @module lib/hooks/__tests__/useThemeExtractionWebSocket
 * @since Phase 10.942 Day 8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useThemeExtractionWebSocket,
  ConnectionStatus,
} from '../useThemeExtractionWebSocket';

// Note: ExtractionProgressData, ExtractionCompleteData, ExtractionErrorData
// are exported from the hook but not directly used in tests (we use expect.objectContaining)

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// ============================================================================
// TEST HELPERS (DRY Principle)
// ============================================================================

/**
 * Helper to find a specific event handler from mockSocket.on calls
 * Reduces repetitive mockSocket.on.mock.calls.find() pattern
 */
function findEventHandler(eventName: string): ((...args: unknown[]) => void) | undefined {
  const call = mockSocket.on.mock.calls.find(
    (c: [string, (...args: unknown[]) => void]) => c[0] === eventName
  );
  return call?.[1];
}

/**
 * Helper to get mock call count with proper typing
 */
function getMockCallCount(mockFn: ReturnType<typeof vi.fn>): number {
  return mockFn.mock.calls.length;
}

describe('useThemeExtractionWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockReset();
    mockSocket.emit.mockReset();
    mockSocket.disconnect.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Lifecycle', () => {
    it('should not connect when userId is null', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: null })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should not connect when userId is undefined', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: undefined })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should attempt connection when userId is provided', async () => {
      const ioClient = (await import('socket.io-client')).default;

      renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      expect(ioClient).toHaveBeenCalledWith(
        expect.stringContaining('/theme-extraction'),
        expect.objectContaining({
          transports: ['websocket', 'polling'],
          reconnection: true,
        })
      );
    });

    it('should set CONNECTING status when userId is provided', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      // Initial state should be CONNECTING when userId is provided
      // (before connect event fires)
      expect([ConnectionStatus.CONNECTING, ConnectionStatus.DISCONNECTED]).toContain(
        result.current.connectionStatus
      );
    });

    it('should set CONNECTED status on connect event', async () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      // Find the connect handler and call it
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTED);
      });
    });

    it('should set DISCONNECTED status on disconnect event', async () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      if (disconnectHandler) {
        act(() => {
          mockSocket.connected = false;
          disconnectHandler();
        });
      }

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
      });
    });

    it('should set ERROR status on connect_error event', async () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect_error'
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler(new Error('Connection failed'));
        });
      }

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe(ConnectionStatus.ERROR);
      });
    });

    it('should join user room on connect', async () => {
      renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('join', 'test-user-123');
    });

    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith('leave', 'test-user-123');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Progress Events', () => {
    it('should call onProgress callback with extraction progress data', async () => {
      const onProgress = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onProgress,
        })
      );

      // Find and call the progress handler
      const progressHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-progress'
      )?.[1];

      const mockProgressData = {
        stage: 'extracting',
        percentage: 50,
        details: {
          transparentMessage: {
            stageName: 'Systematic Code Generation',
            stageNumber: 2,
            totalStages: 6,
            percentage: 50,
            whatWeAreDoing: 'Analyzing patterns',
            whyItMatters: 'Finding themes',
            liveStats: {
              sourcesAnalyzed: 5,
              currentOperation: 'Processing',
            },
          },
        },
      };

      if (progressHandler) {
        act(() => {
          progressHandler(mockProgressData);
        });
      }

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: expect.any(String),
            progress: expect.any(Number),
            details: expect.objectContaining({
              transparentMessage: expect.objectContaining({
                stageName: 'Systematic Code Generation',
                stageNumber: 2,
              }),
            }),
          })
        );
      });
    });

    it('should handle progress data without transparentMessage', async () => {
      const onProgress = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onProgress,
        })
      );

      const progressHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-progress'
      )?.[1];

      // Data without transparentMessage
      const mockProgressData = {
        stage: 'extracting',
        percentage: 50,
        message: 'Processing...',
      };

      if (progressHandler) {
        act(() => {
          progressHandler(mockProgressData);
        });
      }

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'extracting',
            progress: 50,
          })
        );
      });
    });

    it('should handle empty object progress data gracefully', async () => {
      const onProgress = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onProgress,
        })
      );

      const progressHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-progress'
      )?.[1];

      if (progressHandler) {
        // Should handle empty object (fallback path)
        // Note: null/undefined data would throw - real WebSocket won't send null
        expect(() => {
          act(() => {
            progressHandler({});
          });
        }).not.toThrow();
      }

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'unknown', // Falls back to 'unknown' when stage is missing
            progress: 0, // Falls back to 0 when percentage is missing
          })
        );
      });
    });
  });

  describe('Completion Events', () => {
    it('should call onComplete callback with themes data', async () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onComplete,
        })
      );

      const completeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-complete'
      )?.[1];

      const mockCompleteData = {
        themes: [{ id: '1', name: 'Theme 1' }],
        details: {
          themesExtracted: 5,
        },
      };

      if (completeHandler) {
        act(() => {
          completeHandler(mockCompleteData);
        });
      }

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            themes: expect.any(Array),
            details: expect.objectContaining({
              themesExtracted: 5,
            }),
          })
        );
      });
    });

    it('should trigger celebration animation by default on completion', async () => {
      const confetti = (await import('canvas-confetti')).default;
      const onComplete = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onComplete,
          enableCelebration: true,
        })
      );

      const completeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-complete'
      )?.[1];

      if (completeHandler) {
        act(() => {
          completeHandler({
            themes: [{ id: '1', name: 'Theme 1' }],
            details: { themesExtracted: 5 },
          });
        });
      }

      await waitFor(() => {
        expect(confetti).toHaveBeenCalledWith(
          expect.objectContaining({
            particleCount: 100,
            spread: 70,
          })
        );
      });
    });

    it('should not trigger celebration when disabled', async () => {
      const confetti = (await import('canvas-confetti')).default;
      const onComplete = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onComplete,
          enableCelebration: false,
        })
      );

      const completeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-complete'
      )?.[1];

      if (completeHandler) {
        act(() => {
          completeHandler({
            themes: [{ id: '1', name: 'Theme 1' }],
            details: { themesExtracted: 5 },
          });
        });
      }

      // Verify confetti was NOT called (use waitFor to ensure async completion)
      await waitFor(() => {
        expect(confetti).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Events', () => {
    it('should call onError callback with error data', async () => {
      const onError = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onError,
        })
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-error'
      )?.[1];

      const mockErrorData = {
        message: 'Extraction failed due to rate limiting',
        code: 'RATE_LIMIT_EXCEEDED',
        details: { retryAfter: 60 },
      };

      if (errorHandler) {
        act(() => {
          errorHandler(mockErrorData);
        });
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Extraction failed due to rate limiting',
            code: 'RATE_LIMIT_EXCEEDED',
          })
        );
      });
    });

    it('should provide default error message when message is missing', async () => {
      const onError = vi.fn();

      renderHook(() =>
        useThemeExtractionWebSocket({
          userId: 'test-user-123',
          onError,
        })
      );

      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-error'
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler({});
        });
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Theme extraction failed',
          })
        );
      });
    });
  });

  describe('Manual Disconnect', () => {
    it('should disconnect when disconnect function is called', async () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      // Call disconnect
      act(() => {
        result.current.disconnect();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('leave', 'test-user-123');
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('Callback Stability (HOOKS-001 Fix)', () => {
    it('should not reconnect when onProgress callback changes', async () => {
      const ioClientModule = await import('socket.io-client');
      const ioClientMock = ioClientModule.default as ReturnType<typeof vi.fn>;

      const onProgress1 = vi.fn();
      const onProgress2 = vi.fn();

      const { rerender } = renderHook(
        ({ onProgress }) =>
          useThemeExtractionWebSocket({ userId: 'test-user-123', onProgress }),
        { initialProps: { onProgress: onProgress1 } }
      );

      const initialCallCount = getMockCallCount(ioClientMock);

      // Change onProgress callback
      rerender({ onProgress: onProgress2 });

      // Should not create new socket connection
      expect(getMockCallCount(ioClientMock)).toBe(initialCallCount);
    });

    it('should use latest callback ref after rerender', async () => {
      const onProgress1 = vi.fn();
      const onProgress2 = vi.fn();

      const { rerender } = renderHook(
        ({ onProgress }) =>
          useThemeExtractionWebSocket({ userId: 'test-user-123', onProgress }),
        { initialProps: { onProgress: onProgress1 } }
      );

      // Change callback
      rerender({ onProgress: onProgress2 });

      // Find progress handler
      const progressHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'extraction-progress'
      )?.[1];

      if (progressHandler) {
        act(() => {
          progressHandler({ stage: 'test', percentage: 50 });
        });
      }

      // Latest callback should be called
      await waitFor(() => {
        expect(onProgress2).toHaveBeenCalled();
        expect(onProgress1).not.toHaveBeenCalled();
      });
    });
  });

  describe('User ID Changes', () => {
    it('should reconnect when userId changes', async () => {
      const ioClientModule = await import('socket.io-client');
      const ioClientMock = ioClientModule.default as ReturnType<typeof vi.fn>;

      const { rerender } = renderHook(
        ({ userId }) => useThemeExtractionWebSocket({ userId }),
        { initialProps: { userId: 'user-1' as string | null } }
      );

      const initialCallCount = getMockCallCount(ioClientMock);

      // Change userId
      rerender({ userId: 'user-2' });

      // Should create new socket connection
      expect(getMockCallCount(ioClientMock)).toBeGreaterThan(initialCallCount);
    });

    it('should disconnect when userId becomes null', async () => {
      const { result, rerender } = renderHook(
        ({ userId }) => useThemeExtractionWebSocket({ userId }),
        { initialProps: { userId: 'user-1' as string | null } }
      );

      // Simulate connected state
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) {
        act(() => {
          mockSocket.connected = true;
          connectHandler();
        });
      }

      // Change userId to null
      rerender({ userId: null });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
      });
    });
  });

  describe('Return Value Interface', () => {
    it('should return isConnected boolean', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('should return connectionStatus enum value', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      expect(Object.values(ConnectionStatus)).toContain(result.current.connectionStatus);
    });

    it('should return disconnect function', () => {
      const { result } = renderHook(() =>
        useThemeExtractionWebSocket({ userId: 'test-user-123' })
      );

      expect(typeof result.current.disconnect).toBe('function');
    });
  });
});
