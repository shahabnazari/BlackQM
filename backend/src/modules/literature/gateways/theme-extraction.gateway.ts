/**
 * Theme Extraction Gateway
 * Day 28: Real-time Progress Updates
 *
 * WebSocket gateway for broadcasting theme extraction progress to frontend
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
import { getCorrelationId } from '../../../common/middleware/correlation-id.middleware';
import { ErrorCodes, ErrorCode } from '../../../common/constants/error-codes';

// STRICT AUDIT FIX T3: Proper type for liveStats in progress details
// Replaces `any` with proper interface (matches TransparentProgressMessage structure)
export interface ExtractionProgressLiveStats {
  sourcesAnalyzed: number;
  codesGenerated?: number;
  themesIdentified?: number;
  currentOperation: string;
  fullTextRead?: number;
  abstractsRead?: number;
  totalWordsRead?: number;
  currentArticle?: number;
  totalArticles?: number;
  articleTitle?: string;
  articleType?: 'full-text' | 'abstract';
  articleWords?: number;
  embeddingStats?: {
    dimensions: number;
    model: string;
    totalEmbeddingsGenerated: number;
    averageEmbeddingMagnitude?: number;
    processingMethod: 'single' | 'chunked-averaged';
    chunksProcessed?: number;
    scientificExplanation?: string;
  };
  familiarizationReport?: {
    downloadUrl?: string;
    embeddingVectors?: boolean;
    completedAt?: string;
  };
}

// STRICT AUDIT FIX T3: Proper type for progress details
export interface ExtractionProgressDetails {
  stageName?: string;
  stageNumber?: number;
  totalStages?: number;
  percentage?: number;
  whatWeAreDoing?: string;
  whyItMatters?: string;
  liveStats?: ExtractionProgressLiveStats;
  themesExtracted?: number; // Used in completion message
}

export interface ExtractionProgress {
  userId: string;
  stage: string; // Phase 10 Day 5.17.3: Flexible stage names (familiarization, coding, generation, review, refinement, provenance)
  percentage: number;
  message: string;
  details?: ExtractionProgressDetails; // STRICT AUDIT FIX T3: Proper type instead of any
}

@WebSocketGateway({
  namespace: '/theme-extraction',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ThemeExtractionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ThemeExtractionGateway.name);
  private userRooms = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.userRooms.get(client.id);
    if (userId) {
      this.userRooms.delete(client.id);
      this.logger.log(`User ${userId} disconnected`);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, userId: string) {
    try {
      if (!userId) {
        this.emitStandardizedError(client, 'VAL002', 'userId is required');
        return { success: false, error: 'userId is required' };
      }
      this.userRooms.set(client.id, userId);
      client.join(userId);
      this.logger.log(`User ${userId} joined their room`);
      return { success: true, userId };
    } catch (error) {
      this.logger.error(`Failed to join room: ${(error as Error).message}`, (error as Error).stack);
      this.emitStandardizedError(client, 'WS003', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('leave')
  handleLeaveRoom(client: Socket, userId: string) {
    try {
      if (!userId) {
        return { success: false };
      }
      this.userRooms.delete(client.id);
      client.leave(userId);
      this.logger.log(`User ${userId} left their room`);
      return { success: true, userId };
    } catch (error) {
      this.logger.error(`Failed to leave room: ${(error as Error).message}`, (error as Error).stack);
      // Don't emit error for leave - not critical
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Emit progress update to specific user
   * 🚨 STRICT AUDIT FIX: Enhanced logging for Stage 1 familiarization stats issue
   */
  emitProgress(progress: ExtractionProgress) {
    this.server.to(progress.userId).emit('extraction-progress', progress);

    // 🚨 CRITICAL DIAGNOSTIC: Log Stage 1 familiarization stats to verify backend is sending correct data
    // STRICT AUDIT FIX T3: Removed `as any` - using properly typed ExtractionProgressDetails
    if (progress.stage === 'familiarization' && progress.details) {
      const details = progress.details;
      this.logger.log(
        `📊 Familiarization progress emitted: fullTextRead=${details.liveStats?.fullTextRead || 0}, ` +
        `abstractsRead=${details.liveStats?.abstractsRead || 0}, ` +
        `totalWordsRead=${details.liveStats?.totalWordsRead || 0}, ` +
        `currentArticle=${details.liveStats?.currentArticle || 0}/${details.liveStats?.totalArticles || 0}`,
      );
    }

    this.logger.debug(
      `Progress emitted to user ${progress.userId}: ${progress.stage} - ${progress.percentage}%`,
    );
  }

  /**
   * Emit error to specific user (legacy format for backward compatibility)
   */
  emitError(userId: string, error: string) {
    const errorProgress: ExtractionProgress = {
      userId,
      stage: 'error',
      percentage: 0,
      message: error,
    };
    this.server.to(userId).emit('extraction-error', errorProgress);
    this.logger.error(`Error emitted to user ${userId}: ${error}`);
  }

  /**
   * Phase 10.943: Emit standardized error with error code
   */
  emitStandardizedError(
    target: string | Socket,
    errorCode: ErrorCode,
    additionalMessage?: string,
    correlationId?: string,
  ) {
    const errorDetails = ErrorCodes[errorCode];
    const corrId = correlationId || getCorrelationId() || 'unknown';

    const errorPayload = {
      event: 'error',
      errorCode: errorDetails.code,
      message: additionalMessage
        ? `${errorDetails.message}: ${additionalMessage}`
        : errorDetails.message,
      correlationId: corrId,
      timestamp: new Date().toISOString(),
      recoverable: !['WS001', 'WS004', 'AUTH001', 'SYS001', 'THEME001'].includes(errorCode),
    };

    this.logger.error(
      `[WS][${errorDetails.code}] ${errorPayload.message}`,
      JSON.stringify({ correlationId: corrId }),
    );

    if (typeof target === 'string') {
      this.server.to(target).emit('error', errorPayload);
      this.server.to(target).emit('extraction-error', {
        userId: target,
        stage: 'error',
        percentage: 0,
        message: errorPayload.message,
        details: { errorCode: errorDetails.code, correlationId: corrId },
      });
    } else {
      target.emit('error', errorPayload);
    }
  }

  /**
   * Phase 10.943: Emit theme extraction specific error
   */
  emitThemeError(userId: string, errorCode: ErrorCode, message?: string) {
    this.emitStandardizedError(userId, errorCode, message);
  }

  /**
   * Emit completion to specific user
   */
  emitComplete(userId: string, themesCount: number) {
    const completeProgress: ExtractionProgress = {
      userId,
      stage: 'complete',
      percentage: 100,
      message: `Successfully extracted ${themesCount} themes`,
      details: {
        themesExtracted: themesCount,
      },
    };
    this.server.to(userId).emit('extraction-complete', completeProgress);
    this.logger.log(
      `Completion emitted to user ${userId}: ${themesCount} themes`,
    );
  }
}
