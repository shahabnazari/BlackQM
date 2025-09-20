import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { StudyModule } from '../study/study.module';
import { AnalysisModule } from '../analysis/analysis.module';

/**
 * Report Module - Phase 7 Day 6
 * 
 * Foundation module for report generation
 * Will be enhanced in Phase 10 with full features
 */
@Module({
  imports: [
    StudyModule,
    AnalysisModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    PrismaService,
    CacheService,
  ],
  exports: [ReportService],
})
export class ReportModule {}