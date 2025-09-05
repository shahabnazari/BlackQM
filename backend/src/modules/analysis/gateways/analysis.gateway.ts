import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { QAnalysisService } from '../services/q-analysis.service';

@WebSocketGateway(3001, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'analysis',
})
export class AnalysisGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('AnalysisGateway');
  private activeAnalyses: Map<string, any> = new Map();

  constructor(private readonly analysisService: QAnalysisService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { id: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeAnalyses.delete(client.id);
  }

  @SubscribeMessage('start_extraction')
  async handleStartExtraction(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { params } = data;
    const analysisId = `analysis_${client.id}_${Date.now()}`;

    try {
      // Store active analysis
      this.activeAnalyses.set(client.id, analysisId);

      // Send progress updates
      client.emit('progress', { type: 'progress', value: 25 });

      // Run extraction using the quick analysis service
      const extractionResults = await this.analysisService.performQuickAnalysis(
        params.surveyId,
      );

      // Send progress
      client.emit('progress', { type: 'progress', value: 40 });

      // Send results
      client.emit('extraction_complete', {
        type: 'extraction_complete',
        results: extractionResults,
        factors: extractionResults.extraction.factors,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Extraction failed: ${errorMessage}`);
      client.emit('error', {
        type: 'extraction_error',
        message: errorMessage,
      });
    }
  }

  @SubscribeMessage('start_rotation')
  async handleStartRotation(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { params } = data;

    try {
      // Send progress
      client.emit('progress', { type: 'progress', value: 60 });

      // Perform rotation using interactive analysis
      const rotationResults =
        await this.analysisService.performInteractiveAnalysis(params.surveyId, {
          extractionMethod: params.method || 'pca',
          numberOfFactors: params.numberOfFactors || 3,
          rotationHistory: params.rotationHistory || [],
          redoStack: [],
          cachedExtraction: params.cachedExtraction,
        });

      // Send progress
      client.emit('progress', { type: 'progress', value: 70 });

      // Send results
      client.emit('rotation_complete', {
        type: 'rotation_complete',
        results: rotationResults.currentRotation,
        factors: rotationResults.currentRotation.rotatedLoadings,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Rotation failed: ${errorMessage}`);
      client.emit('error', {
        type: 'rotation_error',
        message: errorMessage,
      });
    }
  }

  @SubscribeMessage('preview_rotation')
  async handlePreviewRotation(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // Fast preview calculation for <16ms response
    const { angle, method } = data;

    try {
      // Quick client-side preview calculation
      const preview = this.calculateRotationPreview(angle, method);

      // Immediate response for smooth interaction
      client.emit('rotation_preview', {
        type: 'rotation_preview',
        angle,
        preview,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Preview failed: ${errorMessage}`);
    }
  }

  private calculateRotationPreview(angle: number, method: string) {
    // Fast rotation preview calculation
    // This is just for UI responsiveness
    const radians = (angle * Math.PI) / 180;
    return {
      cos: Math.cos(radians),
      sin: Math.sin(radians),
      method,
      timestamp: Date.now(),
    };
  }

  // Broadcast analysis updates to all connected clients
  broadcastAnalysisUpdate(studyId: string, update: any) {
    this.server.emit('analysis_update', {
      studyId,
      ...update,
    });
  }
}
