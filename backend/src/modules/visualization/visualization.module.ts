import { Module } from '@nestjs/common';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
// import { WebSocketService } from '../../services/websocket.service'; // WebSocket is singleton, not provider

/**
 * Visualization Module - Phase 7 Day 4 Implementation
 * 
 * Provides server-side chart generation capabilities
 * Part of VISUALIZE phase in Research Lifecycle
 * 
 * @exports
 * - VisualizationService for other modules
 * - REST API endpoints via controller
 */
@Module({
  controllers: [VisualizationController],
  providers: [
    VisualizationService,
    PrismaService,
    CacheService,
  ],
  exports: [VisualizationService],
})
export class VisualizationModule {}