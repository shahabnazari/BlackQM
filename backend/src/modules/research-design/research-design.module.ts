import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import { ResearchQuestionService } from './services/research-question.service';
import { HypothesisGeneratorService } from './services/hypothesis-generator.service';
import { ResearchDesignController } from './controllers/research-design.controller';

/**
 * Phase 9.5: Research Design Intelligence Module
 *
 * Bridges the gap between DISCOVER (Phase 9) and BUILD (Phase 10)
 *
 * Services:
 * - ResearchQuestionService: SQUARE-IT framework, sub-question decomposition
 * - HypothesisGeneratorService: Multi-source hypothesis generation
 *
 * Integration:
 * - Uses Phase 9 LiteratureService outputs (papers, themes, gaps)
 * - Feeds into Phase 10 ThemeToStatementService
 */
@Module({
  imports: [ConfigModule],
  controllers: [ResearchDesignController],
  providers: [
    PrismaService,
    ResearchQuestionService,
    HypothesisGeneratorService,
  ],
  exports: [ResearchQuestionService, HypothesisGeneratorService],
})
export class ResearchDesignModule {}
