import { Module } from '@nestjs/common';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from './participant.service';
import { QSortService } from './qsort.service';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../common/prisma.service';
import { StudyModule } from '../study/study.module';

@Module({
  imports: [StudyModule],
  controllers: [ParticipantController],
  providers: [
    ParticipantService,
    QSortService,
    ProgressService,
    PrismaService,
  ],
  exports: [ParticipantService, QSortService, ProgressService],
})
export class ParticipantModule {}