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

export interface ExtractionProgress {
  userId: string;
  stage:
    | 'analyzing'
    | 'papers'
    | 'videos'
    | 'social'
    | 'merging'
    | 'complete'
    | 'error';
  percentage: number;
  message: string;
  details?: {
    sourcesProcessed?: number;
    totalSources?: number;
    currentSource?: string;
    themesExtracted?: number;
  };
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
    this.userRooms.set(client.id, userId);
    client.join(userId);
    this.logger.log(`User ${userId} joined their room`);
    return { success: true, userId };
  }

  @SubscribeMessage('leave')
  handleLeaveRoom(client: Socket, userId: string) {
    this.userRooms.delete(client.id);
    client.leave(userId);
    this.logger.log(`User ${userId} left their room`);
    return { success: true, userId };
  }

  /**
   * Emit progress update to specific user
   */
  emitProgress(progress: ExtractionProgress) {
    this.server.to(progress.userId).emit('extraction-progress', progress);
    this.logger.debug(
      `Progress emitted to user ${progress.userId}: ${progress.stage} - ${progress.percentage}%`,
    );
  }

  /**
   * Emit error to specific user
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
