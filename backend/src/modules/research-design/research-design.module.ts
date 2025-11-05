import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import { ResearchQuestionService } from './services/research-question.service';
import { HypothesisGeneratorService } from './services/hypothesis-generator.service';
import { QuestionOperationalizationService } from './services/question-operationalization.service';
import { HypothesisToItemService } from './services/hypothesis-to-item.service';
import { ResearchDesignController } from './controllers/research-design.controller';

/**
 * Phase 9.5 + Phase 10 Day 5.10-5.11: Research Design Intelligence Module
 *
 * Bridges the gap between DISCOVER (Phase 9) and BUILD (Phase 10)
 *
 * Services:
 * - ResearchQuestionService: SQUARE-IT framework, sub-question decomposition
 * - HypothesisGeneratorService: Multi-source hypothesis generation
 * - QuestionOperationalizationService: Research question to survey items (Day 5.10)
 * - HypothesisToItemService: Hypothesis to test battery generation (Day 5.11)
 *
 * Integration:
 * - Uses Phase 9 LiteratureService outputs (papers, themes, gaps)
 * - Feeds into Phase 10 Questionnaire Builder (Day 5.13)
 */
@Module({
  imports: [ConfigModule],
  controllers: [ResearchDesignController],
  providers: [
    PrismaService,
    ResearchQuestionService,
    HypothesisGeneratorService,
    QuestionOperationalizationService,
    HypothesisToItemService,
  ],
  exports: [
    ResearchQuestionService,
    HypothesisGeneratorService,
    QuestionOperationalizationService,
    HypothesisToItemService,
  ],
})
export class ResearchDesignModule {}
