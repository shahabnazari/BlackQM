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
 *
 * **Phase 10.94 Strict Audit Fixes:**
 * - HOOKS-001: Stabilized callback references with useRef pattern
 * - HOOKS-002: Memoized disconnect function with useCallback
 * - TYPES-001: Added WebSocketProgressData interface
 * - BUG-001: Added null checks before spreading data
 * - SEC-001: Added data validation before use
 * - DX-001: Added WebSocket event name constants
 * - PERF-001: Conditional logging based on NODE_ENV
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
// Phase 10.1 Day 6 Audit Fix: Import TransparentProgressMessage from source of truth
import type { TransparentProgressMessage } from '@/lib/api/services/unified-theme-api.service';
import { logger } from '@/lib/utils/logger';

type Socket = ReturnType<typeof io>;

// ============================================================================
// CONSTANTS (DX-001 FIX: Eliminate magic strings)
// ============================================================================

/**
 * WebSocket event names - centralized for type safety and refactoring
 * @constant
 */
const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  EXTRACTION_PROGRESS: 'extraction-progress',
  EXTRACTION_COMPLETE: 'extraction-complete',
  EXTRACTION_ERROR: 'extraction-error',
  JOIN: 'join',
  LEAVE: 'leave',
} as const;

/**
 * WebSocket configuration constants
 * @constant
 */
const WS_CONFIG = {
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  CONNECTION_TIMEOUT: 10000,
} as const;

/**
 * Whether to enable debug logging (PERF-001 FIX)
 * @constant
 */
const IS_DEV = process.env.NODE_ENV === 'development';

// ============================================================================
// TYPE DEFINITIONS (TYPES-001 FIX: Proper typing)
// ============================================================================

/**
 * Raw WebSocket progress data structure (TYPES-001 FIX)
 * @interface WebSocketProgressData
 */
interface WebSocketProgressData {
  stage?: string;
  percentage?: number;
  message?: string;
  details?: TransparentProgressMessage | {
    transparentMessage?: TransparentProgressMessage;
    stageNumber?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Raw WebSocket complete data structure
 * @interface WebSocketCompleteData
 */
interface WebSocketCompleteData {
  themes?: unknown[];
  details?: {
    themesExtracted?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Raw WebSocket error data structure
 * @interface WebSocketErrorData
 */
interface WebSocketErrorData {
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * Progress update data from WebSocket (exported for consumers)
 */
export interface ExtractionProgressData {
  stage: string;
  progress: number;
  details?: {
    transparentMessage?: TransparentProgressMessage;
    [key: string]: unknown;
  } | undefined;
}

/**
 * Completion data from WebSocket (exported for consumers)
 */
export interface ExtractionCompleteData {
  themes: unknown[];
  details?: {
    themesExtracted?: number;
    [key: string]: unknown;
  } | undefined;
}

/**
 * Error data from WebSocket (exported for consumers)
 */
export interface ExtractionErrorData {
  message: string;
  code?: string | undefined;
  details?: unknown;
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard to check if data has transparentMessage at root level
 * (SEC-001 FIX: Validate data structure)
 */
function isTransparentMessage(obj: unknown): obj is TransparentProgressMessage {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate['stageNumber'] === 'number' &&
    typeof candidate['stageName'] === 'string'
  );
}

/**
 * Safely extract transparentMessage from WebSocket data
 * (BUG-001 FIX: Null-safe extraction)
 *
 * Handles two formats:
 * 1. Backend sends transparentMessage directly as "details"
 * 2. Legacy path where details.transparentMessage exists
 *
 * @param data - Raw WebSocket progress data
 * @returns TransparentProgressMessage or undefined
 */
function extractTransparentMessage(
  data: WebSocketProgressData | null | undefined
): TransparentProgressMessage | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const details = data.details;

  if (!details || typeof details !== 'object') {
    return undefined;
  }

  // Path 1: details IS the transparentMessage (Phase 10.94 format)
  if (isTransparentMessage(details)) {
    return details;
  }

  // Path 2: details.transparentMessage (legacy format)
  const nested = (details as { transparentMessage?: unknown }).transparentMessage;
  if (isTransparentMessage(nested)) {
    return nested;
  }

  return undefined;
}

/**
 * Create enriched progress data with transparentMessage accessible via both paths
 * (BUG-001 FIX: Safe object creation with null checks)
 *
 * @param data - Original WebSocket data
 * @param transparentMsg - Extracted transparent message
 * @returns Enriched ExtractionProgressData
 */
function createEnrichedProgressData(
  data: WebSocketProgressData,
  transparentMsg: TransparentProgressMessage
): ExtractionProgressData {
  return {
    stage: data.stage || String(transparentMsg.stageNumber),
    progress: data.percentage ?? transparentMsg.percentage ?? 0,
    details: {
      // Only spread if details exists and is an object (BUG-001 FIX)
      ...(data.details && typeof data.details === 'object' ? data.details : {}),
      transparentMessage: transparentMsg,
    },
  };
}

/**
 * Conditional logger (PERF-001 FIX: No console in production)
 * Migrated to enterprise logger with structured context
 */
const devLog = {
  log: (message: string, data?: Record<string, unknown>) => {
    if (IS_DEV) logger.debug(message, 'useThemeExtractionWebSocket', data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (IS_DEV) logger.warn(message, 'useThemeExtractionWebSocket', data);
  },
  error: (message: string, data?: Record<string, unknown>) => {
    // Always log errors, even in production
    logger.error(message, 'useThemeExtractionWebSocket', data);
  },
};

// ============================================================================
// MAIN HOOK
// ============================================================================

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
 * **Phase 10.94 Strict Audit:**
 * - Uses refs for callbacks to prevent reconnection on every render (HOOKS-001)
 * - Validates WebSocket data before use (SEC-001)
 * - Null-safe spreading (BUG-001)
 * - Conditional logging (PERF-001)
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

  // HOOKS-001 FIX: Store callbacks in refs to prevent reconnection
  // when parent passes inline functions
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const enableCelebrationRef = useRef(enableCelebration);

  // Keep refs in sync with latest props (without causing reconnection)
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    enableCelebrationRef.current = enableCelebration;
  }, [enableCelebration]);

  // ===========================
  // WEBSOCKET LIFECYCLE
  // ===========================

  useEffect(() => {
    // Don't connect if user is not authenticated
    if (!userId) {
      devLog.log('User not authenticated, skipping connection');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      return;
    }

    // Store user ID for cleanup
    userIdRef.current = userId;
    setConnectionStatus(ConnectionStatus.CONNECTING);

    // Get API URL from environment
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';

    devLog.log('Connecting to WebSocket', { url: `${apiUrl}/theme-extraction` });

    // Connect to theme-extraction WebSocket namespace
    const socket = io(`${apiUrl}/theme-extraction`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: WS_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: WS_CONFIG.RECONNECTION_DELAY,
      timeout: WS_CONFIG.CONNECTION_TIMEOUT,
    });

    socketRef.current = socket;

    // ===========================
    // CONNECTION EVENT HANDLERS
    // ===========================

    socket.on(WS_EVENTS.CONNECT, () => {
      devLog.log('WebSocket connected to theme-extraction gateway');
      setConnectionStatus(ConnectionStatus.CONNECTED);

      // Join user-specific room
      socket.emit(WS_EVENTS.JOIN, userId);
      devLog.log('Joined room for user', { userId });
    });

    socket.on(WS_EVENTS.DISCONNECT, () => {
      devLog.log('WebSocket disconnected from theme-extraction gateway');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    });

    socket.on(WS_EVENTS.CONNECT_ERROR, (error: Error) => {
      devLog.error('WebSocket connection error', { error: error.message });
      setConnectionStatus(ConnectionStatus.ERROR);
    });

    // ===========================
    // THEME EXTRACTION EVENTS
    // ===========================

    /**
     * Progress updates during extraction
     * Implements Patent Claim #9: 4-Part Transparent Progress Messaging
     *
     * Phase 10.94 FIX: Properly extracts transparentMessage from both:
     * - Direct format (details IS transparentMessage)
     * - Nested format (details.transparentMessage)
     */
    socket.on(WS_EVENTS.EXTRACTION_PROGRESS, (data: WebSocketProgressData) => {
      devLog.log('WebSocket progress received', { stage: data.stage, percentage: data.percentage });

      // SEC-001 FIX: Validate and extract transparentMessage safely
      const transparentMsg = extractTransparentMessage(data);

      if (transparentMsg) {
        devLog.log('Using REAL WebSocket transparentMessage', {
          stage: transparentMsg.stageName,
          stageNumber: transparentMsg.stageNumber,
          percentage: transparentMsg.percentage,
          sourcesAnalyzed: transparentMsg.liveStats?.sourcesAnalyzed,
        });

        // BUG-001 FIX: Safe object creation with null checks
        const enrichedData = createEnrichedProgressData(data, transparentMsg);

        // Call user's progress callback with enriched data
        // HOOKS-001 FIX: Use ref to avoid reconnection
        onProgressRef.current?.(enrichedData);
      } else {
        // Fallback to basic progress update
        devLog.warn('WebSocket data missing transparentMessage, using basic update', { stage: data.stage });

        const fallbackData: ExtractionProgressData = {
          stage: data.stage || 'unknown',
          progress: data.percentage ?? 0,
          details: data.details && typeof data.details === 'object'
            ? { ...data.details }
            : undefined,
        };

        onProgressRef.current?.(fallbackData);
      }
    });

    /**
     * Extraction completion event
     */
    socket.on(WS_EVENTS.EXTRACTION_COMPLETE, (data: WebSocketCompleteData) => {
      devLog.log('WebSocket extraction complete', { themesCount: data.themes?.length || 0 });

      const themesCount = data.details?.themesExtracted || 0;

      // Create typed completion data
      const completeData: ExtractionCompleteData = {
        themes: data.themes || [],
        details: data.details,
      };

      // Call user's completion callback (HOOKS-001 FIX: Use ref)
      onCompleteRef.current?.(completeData);

      // Celebration animation (optional)
      if (enableCelebrationRef.current && themesCount > 0) {
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
    socket.on(WS_EVENTS.EXTRACTION_ERROR, (data: WebSocketErrorData) => {
      devLog.error('WebSocket extraction error', { message: data.message, code: data.code });

      const errorData: ExtractionErrorData = {
        message: data.message || 'Theme extraction failed',
        code: data.code,
        details: data.details,
      };

      // Call user's error callback (HOOKS-001 FIX: Use ref)
      onErrorRef.current?.(errorData);
    });

    // ===========================
    // CLEANUP ON UNMOUNT
    // ===========================

    return () => {
      if (socketRef.current && userIdRef.current) {
        devLog.log('Disconnecting WebSocket on unmount', { userId: userIdRef.current });

        // Leave user room
        socketRef.current.emit(WS_EVENTS.LEAVE, userIdRef.current);

        // Disconnect socket
        socketRef.current.disconnect();
        socketRef.current = null;

        setConnectionStatus(ConnectionStatus.DISCONNECTED);
      }
    };
    // HOOKS-001 FIX: Only userId in dependency array
    // Callbacks are stored in refs and updated separately
  }, [userId]);

  // ===========================
  // MANUAL DISCONNECT (HOOKS-002 FIX: Memoized with useCallback)
  // ===========================

  const disconnect = useCallback(() => {
    if (socketRef.current && userIdRef.current) {
      devLog.log('Manual WebSocket disconnect', { userId: userIdRef.current });
      socketRef.current.emit(WS_EVENTS.LEAVE, userIdRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, []);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    connectionStatus,
    disconnect,
  };
}
