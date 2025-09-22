import { Module } from '@nestjs/common';
import { PostSurveyController } from '../controllers/post-survey.controller';
import { PostSurveyService } from '../services/post-survey.service';
import { PrismaService } from '../common/prisma.service';
import { QuestionModule } from './question.module';

/**
 * PostSurvey Module - Phase 8.2 Day 2
 * 
 * Module configuration for post-survey functionality
 * Integrates with question management and analysis pipeline
 */
@Module({
  imports: [
    QuestionModule
  ],
  controllers: [PostSurveyController],
  providers: [PostSurveyService, PrismaService],
  exports: [PostSurveyService]
})
export class PostSurveyModule {}