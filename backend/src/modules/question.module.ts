import { Module } from '@nestjs/common';
import { QuestionController } from '../controllers/question.controller';
import { QuestionService } from '../services/question.service';
import { ScreeningService } from '../services/screening.service';
import { PrismaService } from '../common/prisma.service';

/**
 * Phase 8.2 Day 1: Question Module
 * 
 * Wires together all question-related functionality
 */
@Module({
  imports: [],
  controllers: [QuestionController],
  providers: [
    QuestionService,
    ScreeningService,
    PrismaService
  ],
  exports: [QuestionService, ScreeningService]
})
export class QuestionModule {}