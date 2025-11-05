import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QMethodValidatorService } from './qmethod-validator.service';
import { QAnalysisService } from './services/q-analysis.service';
import { FactorExtractionService } from './services/factor-extraction.service';
import { RotationEngineService } from './services/rotation-engine.service';
import { StatisticalOutputService } from './services/statistical-output.service';
import { PQMethodCompatibilityService } from './services/pqmethod-compatibility.service';
import { CacheService } from '../../common/cache.service';
import { AnalysisLoggerService } from './services/analysis-logger.service';
import { StatisticsService } from './services/statistics.service';
import { HubService } from './services/hub.service';
import { InterpretationService } from './services/interpretation.service';
import { ExplainabilityService } from './services/explainability.service';
import { CollaborationService } from './services/collaboration.service';
import { SchedulingService } from './services/scheduling.service';
import { AnalysisController } from './controllers/analysis.controller';
import { HubController } from './controllers/hub.controller';
import { InterpretationController } from './controllers/interpretation.controller';
import { CollaborationController } from './controllers/collaboration.controller';
import { SchedulingController } from './controllers/scheduling.controller';
import { AnalysisGateway } from './gateways/analysis.gateway';
import { PrismaService } from '../../common/prisma.service';
import { StudyModule } from '../study/study.module';
import { ParticipantModule } from '../participant/participant.module';
import { AIModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';
import { WebSocketService } from '../../services/websocket.service';

/**
 * Q-Analytics Engine Module
 * Enterprise-grade implementation of Q-methodology analysis
 * Provides PQMethod-compatible statistical analysis with modern architecture
 *
 * Features:
 * - Multiple factor extraction methods (Centroid, PCA, ML)
 * - Advanced rotation algorithms (Varimax, Quartimax, Promax, Oblimin)
 * - Real-time interactive rotation with preview
 * - PQMethod file format compatibility (≥0.99 correlation)
 * - Bootstrap analysis for confidence intervals
 * - Redis caching for performance optimization
 * - Comprehensive logging and monitoring
 * - WebSocket support for real-time updates
 * - Enterprise-grade error handling and recovery
 */
@Module({
  imports: [
    ConfigModule,
    StudyModule,
    ParticipantModule,
    AIModule,
    EmailModule,
  ],
  controllers: [
    AnalysisController,
    HubController,
    InterpretationController,
    CollaborationController,
    SchedulingController,
  ],
  providers: [
    // Core Analysis Services
    QMethodValidatorService,
    QAnalysisService,
    FactorExtractionService,
    RotationEngineService,
    StatisticalOutputService,
    StatisticsService,
    PQMethodCompatibilityService,

    // Hub Service (Phase 7 Day 2)
    HubService,

    // Interpretation Service (Phase 7 Day 5)
    InterpretationService,

    // Explainability Service (Phase 10 Days 9-10)
    ExplainabilityService,

    // Collaboration Service (Phase 7 Day 7)
    CollaborationService,

    // Scheduling Service (Phase 7 Day 7)
    SchedulingService,

    // Real-time WebSocket Gateway
    AnalysisGateway,
    {
      provide: WebSocketService,
      useFactory: () => WebSocketService.getInstance(),
    },

    // Enterprise Features
    CacheService,
    AnalysisLoggerService,

    // Database
    PrismaService,
  ],
  exports: [
    QAnalysisService,
    QMethodValidatorService,
    FactorExtractionService,
    RotationEngineService,
    StatisticalOutputService,
    StatisticsService,
    PQMethodCompatibilityService,
    HubService,
    InterpretationService,
    ExplainabilityService,
    CollaborationService,
    SchedulingService,
    CacheService,
    AnalysisLoggerService,
  ],
})
export class AnalysisModule {}
