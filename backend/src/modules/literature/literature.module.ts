import { Module } from '@nestjs/common';
import { LiteratureController } from './literature.controller';
import { LiteratureService } from './literature.service';
import { ReferenceService } from './services/reference.service';
import { ThemeExtractionService } from './services/theme-extraction.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { AuthModule } from '../auth/auth.module';
import { LiteratureGateway } from './literature.gateway';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../common/prisma.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    PrismaModule,
    AIModule,
    CacheModule.register({
      ttl: 3600, // 1 hour cache
      max: 1000, // Maximum items in cache
    }),
  ],
  controllers: [LiteratureController],
  providers: [LiteratureService, LiteratureGateway, ReferenceService, ThemeExtractionService, GapAnalyzerService],
  exports: [LiteratureService, ReferenceService, ThemeExtractionService, GapAnalyzerService],
})
export class LiteratureModule {}