import { Module } from '@nestjs/common';
import { ParticipantFlowService } from '../services/participant-flow.service';
import { ParticipantFlowController } from '../controllers/participant-flow.controller';
import { PrismaService } from '../common/prisma.service';
import { ScreeningService } from '../services/screening.service';
import { PostSurveyModule } from './post-survey.module';
import { PostSurveyService } from '../services/post-survey.service';
import { QuestionService } from '../services/question.service';

@Module({
  imports: [
    PostSurveyModule
  ],
  controllers: [ParticipantFlowController],
  providers: [
    ParticipantFlowService,
    PrismaService,
    ScreeningService,
    PostSurveyService,
    QuestionService
  ],
  exports: [ParticipantFlowService]
})
export class ParticipantFlowModule {}