import { Module } from '@nestjs/common';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { StatementService } from './statement.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [StudyController],
  providers: [StudyService, StatementService, PrismaService],
  exports: [StudyService, StatementService],
})
export class StudyModule {}