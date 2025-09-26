import { Module } from '@nestjs/common';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import { StatementService } from './statement.service';

@Module({
  controllers: [StudyController],
  providers: [StudyService, StatementService],
  exports: [StudyService, StatementService],
})
export class StudyModule {}