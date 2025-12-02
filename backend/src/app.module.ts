import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { RateLimitingModule } from './modules/rate-limiting/rate-limiting.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { StudyModule } from './modules/study/study.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { HealthModule } from './modules/health/health.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AIModule } from './modules/ai/ai.module';
import { VisualizationModule } from './modules/visualization/visualization.module';
import { ReportModule } from './modules/report/report.module';
import { QuestionModule } from './modules/question.module';
import { PostSurveyModule } from './modules/post-survey.module';
import { ParticipantFlowModule } from './modules/participant-flow.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { LiteratureModule } from './modules/literature/literature.module';
import { ResearchDesignModule } from './modules/research-design/research-design.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { LogsModule } from './modules/logs/logs.module'; // Phase 10.943: Unified Logging
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware'; // Phase 10.943
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter'; // Phase 10.943
import { ArchiveService } from './services/archive.service';
// Phase 8.6-8.8: Enterprise Observability & Distributed Tracing
// Phase 10.102 Phase 4: CommonModule ENABLED (SemanticCacheService + BulkheadService + RetryService)
import { CommonModule } from './common/common.module';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsService } from './common/services/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule, // Global database service
    LoggerModule, // Global logger service
    CommonModule, // Phase 10.102 Phase 4: Semantic Caching + Bulkhead + Retry
    // Global rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 attempts per 15 minutes for auth endpoints
      },
      {
        name: 'upload',
        ttl: 3600000, // 1 hour
        limit: 10, // 10 uploads per hour
      },
    ]),
    AuthModule,
    RateLimitingModule,
    FileUploadModule,
    StudyModule,
    ParticipantModule,
    QuestionModule, // Phase 8.2 Day 1: Dynamic questionnaire infrastructure
    PostSurveyModule, // Phase 8.2 Day 2: Post-survey management
    ParticipantFlowModule, // Phase 8.2 Day 3: Flow orchestration and state management
    AnalysisModule,
    AIModule,
    VisualizationModule,
    ReportModule,
    NavigationModule, // Phase 8.5: Research Lifecycle Navigation
    LiteratureModule, // Phase 9: Literature Review & Discovery System
    ResearchDesignModule, // Phase 9.5: Research Design Intelligence
    RepositoryModule, // Phase 10 Days 26-30: Research Repository & Knowledge Management
    LogsModule, // Phase 10.943: Frontend Log Shipping & Error Analytics
    HealthModule,
  ],
  controllers: [
    AppController,
    MetricsController, // Phase 8.6: Prometheus metrics endpoint
  ],
  providers: [
    AppService,
    ArchiveService, // Phase 8.5 Day 4: Archive service for version control
    // Phase 8.90: Monitoring services
    MetricsService, // Phase 8.6: Prometheus metrics collection
    // Phase 8.90: Services NOT YET IMPLEMENTED (Phase 10.101 Task 3 - Phase 9 complete, Phase 8.90 pending)
    // DeduplicationService, // Phase 8.7: Request deduplication
    // TelemetryService, // Phase 8.8: Distributed tracing with OpenTelemetry
    // Phase 10.943: Global exception filter for standardized error handling
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    // Apply throttler guard globally (disabled in test environment)
    ...(process.env.NODE_ENV !== 'test'
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Phase 10.943: Correlation ID middleware for request tracing (must be first)
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    // Security middleware
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}
