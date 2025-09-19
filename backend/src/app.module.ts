import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { RateLimitingModule } from './modules/rate-limiting/rate-limiting.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { StudyModule } from './modules/study/study.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { HealthModule } from './modules/health/health.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AIModule } from './modules/ai/ai.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
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
    AnalysisModule,
    AIModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware, CsrfMiddleware).forRoutes('*');
  }
}
