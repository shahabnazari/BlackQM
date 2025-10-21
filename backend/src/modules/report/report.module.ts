import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportController as ReportControllerV2 } from './controllers/report.controller';
import { ReportGeneratorService } from './services/report-generator.service';
import { CacheService } from '../../common/cache.service';
import { PrismaService } from '../../common/prisma.service';
import { StudyModule } from '../study/study.module';
import { AnalysisModule } from '../analysis/analysis.module';

/**
 * Report Module
 * Phase 7 Day 6 + Phase 10 Day 1 Step 5
 *
 * Comprehensive report generation module with:
 * - Phase 7: Foundation report service (basic reports)
 * - Phase 10: Advanced report generation with full pipeline integration
 *   - Full Phase 9 → 9.5 → 10 pipeline integration
 *   - Multiple export formats (PDF, Word, LaTeX, HTML, Markdown)
 *   - JWT-protected REST API
 *   - Swagger documentation
 *   - Provenance chain tracking
 */
@Module({
  imports: [ConfigModule, StudyModule, AnalysisModule],
  controllers: [
    ReportController, // Phase 7 controller (basic reports)
    ReportControllerV2, // Phase 10 controller (advanced reports)
  ],
  providers: [
    ReportService, // Phase 7 service
    ReportGeneratorService, // Phase 10 service
    CacheService,
    PrismaService,
  ],
  exports: [
    ReportService, // Export for backward compatibility
    ReportGeneratorService, // Export for other modules
  ],
})
export class ReportModule {}
