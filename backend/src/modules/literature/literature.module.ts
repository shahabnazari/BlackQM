import { Module } from '@nestjs/common';
import { LiteratureController } from './literature.controller';
import { LiteratureService } from './literature.service';
import { ReferenceService } from './services/reference.service';
import { ThemeExtractionService } from './services/theme-extraction.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { ThemeToStatementService } from './services/theme-to-statement.service';
import { KnowledgeGraphService } from './services/knowledge-graph.service';
import { PredictiveGapService } from './services/predictive-gap.service';
import { TranscriptionService } from './services/transcription.service';
import { MultiMediaAnalysisService } from './services/multimedia-analysis.service';
import { TikTokResearchService } from './services/tiktok-research.service';
import { InstagramManualService } from './services/instagram-manual.service';
import { CrossPlatformSynthesisService } from './services/cross-platform-synthesis.service';
import { UnifiedThemeExtractionService } from './services/unified-theme-extraction.service';
import { SearchCoalescerService } from './services/search-coalescer.service';
import { APIQuotaMonitorService } from './services/api-quota-monitor.service';
import { AuthModule } from '../auth/auth.module';
import { LiteratureGateway } from './literature.gateway';
import { ThemeExtractionGateway } from './gateways/theme-extraction.gateway';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../common/prisma.module';
import { CacheService } from '../../common/cache.service';
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
  providers: [
    LiteratureService,
    LiteratureGateway,
    ThemeExtractionGateway, // Phase 9 Day 28
    ReferenceService,
    ThemeExtractionService,
    GapAnalyzerService,
    ThemeToStatementService,
    KnowledgeGraphService, // Phase 9 Day 14
    PredictiveGapService, // Phase 9 Day 15
    TranscriptionService, // Phase 9 Day 18
    MultiMediaAnalysisService, // Phase 9 Day 18
    TikTokResearchService, // Phase 9 Day 19
    InstagramManualService, // Phase 9 Day 19
    CrossPlatformSynthesisService, // Phase 9 Day 19
    UnifiedThemeExtractionService, // Phase 9 Day 20
    SearchCoalescerService, // Phase 10 Days 2-3 - Request deduplication
    CacheService, // Phase 10 Days 2-3 - Enhanced multi-tier cache
    APIQuotaMonitorService, // Phase 10 Days 2-3 - API quota monitoring
  ],
  exports: [
    LiteratureService,
    ReferenceService,
    ThemeExtractionService,
    GapAnalyzerService,
    ThemeToStatementService,
    KnowledgeGraphService, // Phase 9 Day 14
    PredictiveGapService, // Phase 9 Day 15
    TranscriptionService, // Phase 9 Day 18
    MultiMediaAnalysisService, // Phase 9 Day 18
    TikTokResearchService, // Phase 9 Day 19
    InstagramManualService, // Phase 9 Day 19
    CrossPlatformSynthesisService, // Phase 9 Day 19
    UnifiedThemeExtractionService, // Phase 9 Day 20
  ],
})
export class LiteratureModule {}
