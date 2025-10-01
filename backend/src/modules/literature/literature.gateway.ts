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

  constructor(private readonly literatureService: LiteratureService) {}

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
    const { searchId } = data;
    client.join(`search-${searchId}`);

    if (!this.activeSearches.has(searchId)) {
      this.activeSearches.set(searchId, new Set());
    }
    this.activeSearches.get(searchId)?.add(client.id);

    this.logger.log(`Client ${client.id} joined search ${searchId}`);
  }

  @SubscribeMessage('leave-search')
  handleLeaveSearch(
    @MessageBody() data: { searchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { searchId } = data;
    client.leave(`search-${searchId}`);

    if (this.activeSearches.has(searchId)) {
      this.activeSearches.get(searchId)?.delete(client.id);
      if (this.activeSearches.get(searchId)?.size === 0) {
        this.activeSearches.delete(searchId);
      }
    }

    this.logger.log(`Client ${client.id} left search ${searchId}`);
  }

  @SubscribeMessage('knowledge-graph-update')
  handleKnowledgeGraphUpdate(
    @MessageBody() data: { graphId: string; nodes: any[]; edges: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast knowledge graph updates to all clients viewing the same graph
    client.to(`graph-${data.graphId}`).emit('graph-updated', data);
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
}
