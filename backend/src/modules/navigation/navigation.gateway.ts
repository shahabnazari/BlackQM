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
import { Injectable } from '@nestjs/common';
import {
  NavigationStateService,
  ResearchPhase,
  NavigationState,
} from './navigation-state.service';

@WebSocketGateway({
  namespace: 'navigation',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NavigationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server = null as any;

  constructor(
    private readonly navigationStateService: NavigationStateService,
  ) {}

  handleConnection(client: Socket): void {
    console.log(`Navigation client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Navigation client disconnected: ${client.id}`);
  }

  /**
   * Handle phase change events
   */
  @SubscribeMessage('changePhase')
  async handlePhaseChange(
    @MessageBody()
    data: { userId: string; phase: ResearchPhase; studyId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.navigationStateService.updateCurrentPhase(
      data.userId,
      data.phase,
      data.studyId,
    );

    // Emit to all clients in the room
    this.server.emit('phaseChanged', {
      userId: data.userId,
      studyId: data.studyId,
      phase: data.phase,
      timestamp: new Date(),
    });
  }

  /**
   * Handle action completion events
   */
  @SubscribeMessage('trackAction')
  async handleActionTracking(
    @MessageBody()
    data: {
      userId: string;
      studyId: string;
      phase: ResearchPhase;
      action: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.navigationStateService.trackActionCompletion(
      data.userId,
      data.studyId,
      data.phase,
      data.action,
    );

    // Get updated navigation state
    const newState = await this.navigationStateService.getNavigationState(
      data.userId,
      data.studyId,
    );

    // Emit updated state to all clients
    this.server.emit('stateUpdated', newState);
  }

  /**
   * Handle state request
   */
  @SubscribeMessage('getState')
  async handleGetState(
    @MessageBody() data: { userId: string; studyId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<NavigationState> {
    const state = await this.navigationStateService.getNavigationState(
      data.userId,
      data.studyId,
    );
    return state;
  }

  /**
   * Emit phase change to all connected clients
   */
  emitPhaseChange(
    userId: string,
    phase: ResearchPhase,
    studyId?: string,
  ): void {
    this.server.emit('phaseChanged', {
      userId,
      studyId,
      phase,
      timestamp: new Date(),
    });
  }

  /**
   * Emit action completion to all connected clients
   */
  emitActionCompleted(
    userId: string,
    studyId: string,
    phase: ResearchPhase,
    action: string,
  ): void {
    this.server.emit('actionCompleted', {
      userId,
      studyId,
      phase,
      action,
      timestamp: new Date(),
    });
  }

  /**
   * Emit state update to all connected clients
   */
  emitStateUpdate(state: NavigationState): void {
    this.server.emit('stateUpdated', state);
  }
}
