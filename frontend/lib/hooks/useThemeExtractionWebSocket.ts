/**
 * Theme Extraction WebSocket Hook - Phase 10.1 Day 6 Sub-Phase 1
 *
 * Enterprise-grade hook for managing WebSocket connections to theme extraction service.
 * Implements Patent Claim #9 (4-Part Transparent Progress Messaging).
 *
 * @module useThemeExtractionWebSocket
 * @since Phase 10.1 Day 6
 * @author VQMethod Team
 *
 * **Features:**
 * - Real-time theme extraction progress updates
 * - Transparent progress messaging (4-part patent claim)
 * - Automatic reconnection with exponential backoff
 * - Proper cleanup on unmount
 * - Connection status tracking
 * - Type-safe event handlers
 *
 * **WebSocket Events:**
 * - `connect` - Connection established
 * - `disconnect` - Connection lost
 * - `connect_error` - Connection failed
 * - `extraction-progress` - Real-time progress updates
 * - `extraction-complete` - Extraction finished successfully
 * - `extraction-error` - Extraction failed
 *
 * **Usage:**
 * ```typescript
 * const { isConnected, connectionStatus } = useThemeExtractionWebSocket({
 *   userId: user.id,
 *   onProgress: (data) => console.log('Progress:', data),
 *   onComplete: (data) => console.log('Complete:', data),
 *   onError: (error) => console.error('Error:', error),
 * });
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';

type Socket = ReturnType<typeof io>;

/**
 * Transparent progress message structure (Patent Claim #9)
 */
export interface TransparentProgressMessage {
  stageName: string;
  stageNumber: number;
  totalStages: number;
  percentage: number;
  liveStats?: {
    themesFound?: number;
    papersProcessed?: number;
    currentActivity?: string;
  };
}

/**
 * Progress update data from WebSocket
 */
export interface ExtractionProgressData {
  stage: string;
  progress: number;
  details?: {
    transparentMessage?: TransparentProgressMessage;
    [key: string]: any;
  };
}

/**
 * Completion data from WebSocket
 */
export interface ExtractionCompleteData {
  themes: any[];
  details?: {
    themesExtracted?: number;
    [key: string]: any;
  };
}

/**
 * Error data from WebSocket
 */
export interface ExtractionErrorData {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Hook configuration
 */
export interface UseThemeExtractionWebSocketConfig {
  /** User ID for room joining */
  userId: string | null | undefined;

  /** Callback for progress updates */
  onProgress?: (data: ExtractionProgressData) => void;

  /** Callback for completion */
  onComplete?: (data: ExtractionCompleteData) => void;

  /** Callback for errors */
  onError?: (error: ExtractionErrorData) => void;

  /** Enable celebration animation on completion (default: true) */
  enableCelebration?: boolean;
}

/**
 * Hook return type
 */
export interface UseThemeExtractionWebSocketReturn {
  /** Whether WebSocket is connected */
  isConnected: boolean;

  /** Current connection status */
  connectionStatus: ConnectionStatus;

  /** Manually disconnect (for cleanup) */
  disconnect: () => void;
}

/**
 * Hook for managing theme extraction WebSocket connection
 *
 * **Architecture:**
 * - Connects to `/theme-extraction` namespace
 * - Auto-reconnects on disconnect (5 attempts)
 * - Joins user-specific room for targeted updates
 * - Cleans up properly on unmount
 *
 * **Progress Flow:**
 * 1. Backend sends `extraction-progress` events
 * 2. Hook extracts transparent message
 * 3. Calls `onProgress` callback with data
 * 4. UI updates in real-time
 *
 * @param {UseThemeExtractionWebSocketConfig} config - Configuration object
 * @returns {UseThemeExtractionWebSocketReturn} Connection state and controls
 */
export function useThemeExtractionWebSocket(
  config: UseThemeExtractionWebSocketConfig
): UseThemeExtractionWebSocketReturn {
  const {
    userId,
    onProgress,
    onComplete,
    onError,
    enableCelebration = true,
  } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );

  // Refs for socket and user ID (for cleanup)
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null);

  // ===========================
  // WEBSOCKET LIFECYCLE
  // ===========================

  useEffect(() => {
    // Don't connect if user is not authenticated
    if (!userId) {
      console.log('⚠️ WebSocket: User not authenticated, skipping connection');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      return;
    }

    // Store user ID for cleanup
    userIdRef.current = userId;
    setConnectionStatus(ConnectionStatus.CONNECTING);

    // Get API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    console.log(`🔌 Connecting to WebSocket: ${apiUrl}/theme-extraction`);

    // Connect to theme-extraction WebSocket namespace
    const socket = io(`${apiUrl}/theme-extraction`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    // ===========================
    // CONNECTION EVENT HANDLERS
    // ===========================

    socket.on('connect', () => {
      console.log('✅ WebSocket connected to theme-extraction gateway');
      setConnectionStatus(ConnectionStatus.CONNECTED);

      // Join user-specific room
      socket.emit('join', userId);
      console.log(`📡 Joined room for user: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected from theme-extraction gateway');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    });

    socket.on('connect_error', (error: any) => {
      console.error('❌ WebSocket connection error:', error.message);
      setConnectionStatus(ConnectionStatus.ERROR);
    });

    // ===========================
    // THEME EXTRACTION EVENTS
    // ===========================

    /**
     * Progress updates during extraction
     * Implements Patent Claim #9: 4-Part Transparent Progress Messaging
     */
    socket.on('extraction-progress', (data: any) => {
      console.log('🟢 WebSocket progress received:', data);

      // Extract transparent message from details (Patent Claim #9)
      if (data.details?.transparentMessage) {
        const transparentMsg = data.details.transparentMessage;

        console.log('🟢 Using REAL WebSocket transparentMessage:', {
          stage: transparentMsg.stageName,
          stageNumber: transparentMsg.stageNumber,
          percentage: transparentMsg.percentage,
          liveStats: transparentMsg.liveStats,
        });

        // Call user's progress callback
        onProgress?.(data);
      } else {
        // Fallback to basic progress update
        console.warn(
          '⚠️ WebSocket data missing transparentMessage, using basic update'
        );
        onProgress?.(data);
      }
    });

    /**
     * Extraction completion event
     */
    socket.on('extraction-complete', (data: any) => {
      console.log('✅ WebSocket extraction complete:', data);

      const themesCount = data.details?.themesExtracted || 0;

      // Call user's completion callback
      onComplete?.(data);

      // Celebration animation (optional)
      if (enableCelebration && themesCount > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    });

    /**
     * Extraction error event
     */
    socket.on('extraction-error', (data: any) => {
      console.error('❌ WebSocket extraction error:', data);

      const errorData: ExtractionErrorData = {
        message: data.message || 'Theme extraction failed',
        code: data.code,
        details: data.details,
      };

      // Call user's error callback
      onError?.(errorData);
    });

    // ===========================
    // CLEANUP ON UNMOUNT
    // ===========================

    return () => {
      if (socketRef.current && userIdRef.current) {
        console.log('🔌 Disconnecting WebSocket on unmount');

        // Leave user room
        socketRef.current.emit('leave', userIdRef.current);

        // Disconnect socket
        socketRef.current.disconnect();
        socketRef.current = null;

        setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    };
  }, [userId, onProgress, onComplete, onError, enableCelebration]);

  // ===========================
  // MANUAL DISCONNECT
  // ===========================

  const disconnect = () => {
    if (socketRef.current && userIdRef.current) {
      console.log('🔌 Manual WebSocket disconnect');
      socketRef.current.emit('leave', userIdRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  };

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    connectionStatus,
    disconnect,
  };
}
