import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAIService } from './services/openai.service';
import { AICostService } from './services/ai-cost.service';
import { StatementGeneratorService } from './services/statement-generator.service';
import { GridRecommendationService } from './services/grid-recommendation.service';
import { QuestionnaireGeneratorService } from './services/questionnaire-generator.service';
import { VideoRelevanceService } from './services/video-relevance.service'; // Phase 9 Day 21
import { QueryExpansionService } from './services/query-expansion.service'; // Phase 9 Day 21
import { AIController } from './controllers/ai.controller';
import { PrismaService } from '../../common/prisma.service';

// Phase 10.190: Netflix-Grade Unified AI Service
import { UnifiedAIService } from './services/unified-ai.service';
import { GroqProvider } from './services/providers/groq.provider';
import { GeminiProvider } from './services/providers/gemini.provider';
import { OpenAIProvider } from './services/providers/openai.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AIController],
  providers: [
    // Existing services
    OpenAIService,
    AICostService,
    StatementGeneratorService,
    GridRecommendationService,
    QuestionnaireGeneratorService,
    VideoRelevanceService,
    QueryExpansionService,
    PrismaService,

    // Phase 10.190: Unified AI Service with multi-provider support
    UnifiedAIService,
    GroqProvider,
    GeminiProvider,
    OpenAIProvider,
  ],
  exports: [
    // Existing exports
    OpenAIService,
    AICostService,
    StatementGeneratorService,
    GridRecommendationService,
    QuestionnaireGeneratorService,
    VideoRelevanceService,
    QueryExpansionService,

    // Phase 10.190: Export unified AI service
    UnifiedAIService,
    GroqProvider,
    GeminiProvider,
    OpenAIProvider,
  ],
})
export class AIModule implements OnModuleInit {
  constructor(
    private readonly unifiedAIService: UnifiedAIService,
    private readonly aiCostService: AICostService,
  ) {}

  /**
   * Phase 10.185 Week 1: Wire AICostService to UnifiedAIService
   * Enables budget checking and cost persistence
   */
  onModuleInit(): void {
    // Wire cost service for budget checking and cost tracking
    this.unifiedAIService.setAICostService(this.aiCostService);
  }
}
