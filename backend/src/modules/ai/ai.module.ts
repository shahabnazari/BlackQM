import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [AIController],
  providers: [
    OpenAIService,
    AICostService,
    StatementGeneratorService,
    GridRecommendationService,
    QuestionnaireGeneratorService,
    VideoRelevanceService,
    QueryExpansionService,
    PrismaService,
  ],
  exports: [
    OpenAIService,
    AICostService,
    StatementGeneratorService,
    GridRecommendationService,
    QuestionnaireGeneratorService,
    VideoRelevanceService,
    QueryExpansionService,
  ],
})
export class AIModule {}