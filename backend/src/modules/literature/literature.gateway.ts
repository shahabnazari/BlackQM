import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LiteratureService } from './literature.service';
import { getCorrelationId } from '../../common/middleware/correlation-id.middleware';
import { ErrorCodes, ErrorCode } from '../../common/constants/error-codes';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/literature',
})
export class LiteratureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiteratureGateway.name);
  private activeSearches = new Map<string, Set<string>>();

  constructor(_literatureService: LiteratureService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to literature: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from literature: ${client.id}`);
    // Clean up any active searches
    this.activeSearches.forEach((clients, searchId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.activeSearches.delete(searchId);
      }
    });
  }

  @SubscribeMessage('join-search')
  handleJoinSearch(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId } = data;
      if (!searchId) {
        this.emitError(client, 'VAL002', undefined, 'searchId is required');
        return;
      }

      client.join(`search-${searchId}`);

      if (!this.activeSearches.has(searchId)) {
        this.activeSearches.set(searchId, new Set());
      }
      this.activeSearches.get(searchId)?.add(client.id);

      this.logger.log(`Client ${client.id} joined search ${searchId}`);
    } catch (error) {
      this.logger.error(`Failed to join search: ${(error as Error).message}`, (error as Error).stack);
      this.emitError(client, 'WS003', undefined, (error as Error).message);
    }
  }

  @SubscribeMessage('leave-search')
  handleLeaveSearch(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { searchId } = data;
      if (!searchId) {
        return; // Silent fail for leave - not critical
      }

      client.leave(`search-${searchId}`);

      if (this.activeSearches.has(searchId)) {
        this.activeSearches.get(searchId)?.delete(client.id);
        if (this.activeSearches.get(searchId)?.size === 0) {
          this.activeSearches.delete(searchId);
        }
      }

      this.logger.log(`Client ${client.id} left search ${searchId}`);
    } catch (error) {
      this.logger.error(`Failed to leave search: ${(error as Error).message}`, (error as Error).stack);
      // Don't emit error for leave - not critical
    }
  }

  @SubscribeMessage('knowledge-graph-update')
  handleKnowledgeGraphUpdate(
    @MessageBody() data: { graphId: string; nodes: any[]; edges: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data?.graphId) {
        this.emitError(client, 'VAL002', undefined, 'graphId is required');
        return;
      }
      // Broadcast knowledge graph updates to all clients viewing the same graph
      client.to(`graph-${data.graphId}`).emit('graph-updated', data);
    } catch (error) {
      this.logger.error(`Failed to update graph: ${(error as Error).message}`, (error as Error).stack);
      this.emitError(client, 'WS002', undefined, (error as Error).message);
    }
  }

  // Server-side methods to emit events

  emitSearchProgress(searchId: string, progress: number, message: string) {
    this.server.to(`search-${searchId}`).emit('search-progress', {
      searchId,
      progress,
      message,
    });
  }

  emitPaperFound(searchId: string, paper: any) {
    this.server.to(`search-${searchId}`).emit('paper-found', {
      searchId,
      paper,
    });
  }

  emitSearchComplete(searchId: string, results: any) {
    this.server.to(`search-${searchId}`).emit('search-complete', {
      searchId,
      results,
    });
  }

  emitThemeExtracted(userId: string, theme: any) {
    this.server.to(`user-${userId}`).emit('theme-extracted', theme);
  }

  emitGapIdentified(userId: string, gap: any) {
    this.server.to(`user-${userId}`).emit('gap-identified', gap);
  }

  emitGraphNodeAdded(graphId: string, node: any) {
    this.server.to(`graph-${graphId}`).emit('node-added', node);
  }

  emitGraphEdgeAdded(graphId: string, edge: any) {
    this.server.to(`graph-${graphId}`).emit('edge-added', edge);
  }

  /**
   * Phase 10.943: Emit standardized error to client
   * Use this to notify clients when operations fail
   */
  emitError(
    target: string | Socket,
    errorCode: ErrorCode,
    correlationId?: string,
    additionalMessage?: string,
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
      recoverable: !['WS001', 'WS004', 'AUTH001', 'SYS001'].includes(errorCode),
    };

    this.logger.error(
      `[WS][${errorDetails.code}] ${errorPayload.message}`,
      JSON.stringify({ correlationId: corrId, target: typeof target === 'string' ? target : target.id }),
    );

    if (typeof target === 'string') {
      this.server.to(target).emit('error', errorPayload);
    } else {
      target.emit('error', errorPayload);
    }
  }

  /**
   * Phase 10.943: Emit search error to search room
   */
  emitSearchError(searchId: string, errorCode: ErrorCode, message?: string) {
    this.emitError(`search-${searchId}`, errorCode, getCorrelationId() || undefined, message);
  }
}
