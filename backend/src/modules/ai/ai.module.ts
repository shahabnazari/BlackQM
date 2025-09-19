import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAIService } from './services/openai.service';
import { AICostService } from './services/ai-cost.service';
import { StatementGeneratorService } from './services/statement-generator.service';
import { GridRecommendationService } from './services/grid-recommendation.service';
import { QuestionnaireGeneratorService } from './services/questionnaire-generator.service';
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
    PrismaService,
  ],
  exports: [
    OpenAIService,
    AICostService,
    StatementGeneratorService,
    GridRecommendationService,
    QuestionnaireGeneratorService,
  ],
})
export class AIModule {}