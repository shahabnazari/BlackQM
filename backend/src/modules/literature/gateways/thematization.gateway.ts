/**
 * Phase 10.113 Week 7: Thematization WebSocket Gateway
 *
 * Netflix-grade WebSocket gateway for real-time thematization progress updates.
 * Implements enterprise-grade features: room-based messaging, standardized errors,
 * and comprehensive logging.
 *
 * ============================================================================
 * NAMESPACE & EVENTS
 * ============================================================================
 *
 * Namespace: /thematization
 *
 * Client → Server Events:
 * - 'join'   - Join user-specific room for progress updates
 * - 'leave'  - Leave room (explicit disconnect)
 *
 * Server → Client Events:
 * - 'thematization-progress' - Stage progress updates
 * - 'thematization-complete' - Pipeline completion
 * - 'thematization-error'    - Error notifications
 * - 'error'                  - Standardized error (with error codes)
 *
 * @module ThematizationGateway
 * @since Phase 10.113 Week 7
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { ThematizationPipelineStage, PIPELINE_STAGE_INFO } from '../types/unified-thematization.types';
import { ErrorCodes, ErrorCode } from '../../../common/constants/error-codes';
import { getCorrelationId } from '../../../common/middleware/correlation-id.middleware';

// ============================================================================
// TYPE DEFINITIONS (Strict Typing)
// ============================================================================

/**
 * Live statistics for thematization progress
 */
export interface ThematizationProgressLiveStats {
  readonly papersProcessed: number;
  readonly totalPapers: number;
  readonly themesFound?: number;
  readonly claimsExtracted?: number;
  readonly currentOperation: string;
  readonly substageProgress?: number;
  readonly elapsedTimeMs?: number;
}

/**
 * Progress message structure for WebSocket emission
 */
export interface ThematizationProgressMessage {
  readonly userId: string;
  readonly requestId: string;
  readonly stage: ThematizationPipelineStage;
  readonly stageDisplayName: string;
  readonly stageDescription: string;
  readonly overallProgress: number;
  readonly stageProgress: number;
  readonly message: string;
  readonly liveStats?: ThematizationProgressLiveStats;
  readonly timestamp: string;
}

/**
 * Completion message structure
 */
export interface ThematizationCompleteMessage {
  readonly userId: string;
  readonly requestId: string;
  readonly themesCount: number;
  readonly claimsCount?: number;
  readonly processingTimeMs: number;
  readonly tier: number;
  readonly timestamp: string;
}

/**
 * Error message structure
 */
export interface ThematizationErrorMessage {
  readonly userId: string;
  readonly requestId?: string;
  readonly errorCode: string;
  readonly message: string;
  readonly correlationId: string;
  readonly recoverable: boolean;
  readonly timestamp: string;
}

/**
 * Interface for progress emission (used by services)
 */
export interface IThematizationProgressEmitter {
  emitProgress(progress: ThematizationProgressMessage): void;
  emitComplete(complete: ThematizationCompleteMessage): void;
  emitError(userId: string, errorCode: ErrorCode, message?: string, requestId?: string): void;
}

// ============================================================================
// GATEWAY IMPLEMENTATION
// ============================================================================

@WebSocketGateway({
  namespace: '/thematization',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ThematizationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, IThematizationProgressEmitter
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ThematizationGateway.name);

  /**
   * Socket ID → User ID mapping for room management
   */
  private readonly userRooms = new Map<string, string>();

  // ==========================================================================
  // LIFECYCLE HANDLERS
  // ==========================================================================

  handleConnection(client: Socket): void {
    this.logger.log(`🔌 [WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const userId = this.userRooms.get(client.id);
    if (userId) {
      this.userRooms.delete(client.id);
      this.logger.log(`🔌 [WS] User ${userId} disconnected`);
    }
    this.logger.debug(`🔌 [WS] Client disconnected: ${client.id}`);
  }

  // ==========================================================================
  // CLIENT → SERVER MESSAGE HANDLERS
  // ==========================================================================

  /**
   * Join user-specific room for progress updates
   */
  @SubscribeMessage('join')
  handleJoinRoom(
    client: Socket,
    payload: string | { userId: string; requestId?: string },
  ): { success: boolean; userId?: string; error?: string } {
    try {
      // Handle both string and object payloads
      const userId = typeof payload === 'string' ? payload : payload.userId;

      if (!userId || userId.trim().length === 0) {
        this.emitStandardizedError(client, 'VAL002', 'userId is required');
        return { success: false, error: 'userId is required' };
      }

      // Store mapping and join room
      this.userRooms.set(client.id, userId);
      void client.join(userId);

      // Also join request-specific room if provided
      if (typeof payload !== 'string' && payload.requestId) {
        void client.join(`request:${payload.requestId}`);
        this.logger.log(`👤 [WS] User ${userId} joined room for request ${payload.requestId}`);
      } else {
        this.logger.log(`👤 [WS] User ${userId} joined their room`);
      }

      return { success: true, userId };
    } catch (error: unknown) {
      const errorMsg = isError(error) ? error.message : 'Unknown error';
      this.logger.error(`❌ [WS] Failed to join room: ${errorMsg}`);
      this.emitStandardizedError(client, 'WS003', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Leave user room
   */
  @SubscribeMessage('leave')
  handleLeaveRoom(
    client: Socket,
    payload: string | { userId: string; requestId?: string },
  ): { success: boolean } {
    try {
      const userId = typeof payload === 'string' ? payload : payload.userId;

      if (!userId) {
        return { success: false };
      }

      this.userRooms.delete(client.id);
      void client.leave(userId);

      if (typeof payload !== 'string' && payload.requestId) {
        void client.leave(`request:${payload.requestId}`);
      }

      this.logger.log(`👤 [WS] User ${userId} left their room`);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // ==========================================================================
  // SERVER → CLIENT EMISSION METHODS
  // ==========================================================================

  /**
   * Emit progress update to user
   */
  emitProgress(progress: ThematizationProgressMessage): void {
    const { userId, requestId } = progress;

    // Emit to user room
    this.server.to(userId).emit('thematization-progress', progress);

    // Also emit to request-specific room
    this.server.to(`request:${requestId}`).emit('thematization-progress', progress);

    // Debug logging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(
        `📡 [Progress] ${progress.stageDisplayName} (${progress.overallProgress}%) → ${userId}`,
      );
    }
  }

  /**
   * Emit completion to user
   */
  emitComplete(complete: ThematizationCompleteMessage): void {
    const { userId, requestId } = complete;

    // Emit to user room
    this.server.to(userId).emit('thematization-complete', complete);

    // Also emit to request-specific room
    this.server.to(`request:${requestId}`).emit('thematization-complete', complete);

    this.logger.log(
      `✅ [Complete] ${complete.themesCount} themes in ${complete.processingTimeMs}ms → ${userId}`,
    );
  }

  /**
   * Emit error to user with standardized error codes
   */
  emitError(
    userId: string,
    errorCode: ErrorCode,
    message?: string,
    requestId?: string,
  ): void {
    const errorDetails = ErrorCodes[errorCode];
    const correlationId = getCorrelationId() || 'unknown';

    const errorPayload: ThematizationErrorMessage = {
      userId,
      requestId,
      errorCode: errorDetails.code,
      message: message
        ? `${errorDetails.message}: ${message}`
        : errorDetails.message,
      correlationId,
      recoverable: !['WS001', 'WS004', 'AUTH001', 'SYS001'].includes(errorCode),
      timestamp: new Date().toISOString(),
    };

    // Emit to user room
    this.server.to(userId).emit('thematization-error', errorPayload);
    this.server.to(userId).emit('error', errorPayload);

    // Also emit to request-specific room if provided
    if (requestId) {
      this.server.to(`request:${requestId}`).emit('thematization-error', errorPayload);
    }

    this.logger.error(
      `❌ [Error][${errorDetails.code}] ${errorPayload.message} → ${userId}`,
    );
  }

  // ==========================================================================
  // INTERNAL HELPER METHODS
  // ==========================================================================

  /**
   * Emit standardized error to specific socket
   */
  private emitStandardizedError(
    client: Socket,
    errorCode: ErrorCode,
    additionalMessage?: string,
  ): void {
    const errorDetails = ErrorCodes[errorCode];
    const correlationId = getCorrelationId() || 'unknown';

    const errorPayload = {
      event: 'error',
      errorCode: errorDetails.code,
      message: additionalMessage
        ? `${errorDetails.message}: ${additionalMessage}`
        : errorDetails.message,
      correlationId,
      timestamp: new Date().toISOString(),
      recoverable: !['WS001', 'WS004', 'AUTH001'].includes(errorCode),
    };

    client.emit('error', errorPayload);
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for Error instances
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create progress message from stage and stats
 */
export function createProgressMessage(
  userId: string,
  requestId: string,
  stage: ThematizationPipelineStage,
  overallProgress: number,
  stageProgress: number,
  message: string,
  liveStats?: ThematizationProgressLiveStats,
): ThematizationProgressMessage {
  const stageInfo = PIPELINE_STAGE_INFO[stage];

  return {
    userId,
    requestId,
    stage,
    stageDisplayName: stageInfo.displayName,
    stageDescription: stageInfo.description,
    overallProgress,
    stageProgress,
    message,
    liveStats,
    timestamp: new Date().toISOString(),
  };
}
