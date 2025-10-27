import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { PrismaService } from './common/prisma.service';
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
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { ArchiveService } from './services/archive.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule, // Global database service
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
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ArchiveService, // Phase 8.5 Day 4: Archive service for version control
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}
