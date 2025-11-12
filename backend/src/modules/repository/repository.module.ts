import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { ResearchRepositoryService } from './services/research-repository.service';
import { RepositoryController } from './controllers/repository.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { ReportModule } from '../report/report.module';

/**
 * Phase 10 Days 26-30: Research Repository Module
 *
 * Provides research knowledge management and search capabilities:
 * - Entity extraction from studies, papers, analyses
 * - Full-text search with faceting
 * - Citation lineage tracking
 * - Knowledge discovery and recommendations
 *
 * Day 30 Integrations:
 * - Analysis Hub: Auto-index factors and statements from analysis results
 * - Report Generation: Link insights to generated reports
 * - AI Services: Integrate AI-generated insights via AnalysisModule
 */

@Module({
  imports: [
    forwardRef(() => AnalysisModule), // Prevent circular dependency
    forwardRef(() => ReportModule), // Prevent circular dependency
  ],
  controllers: [RepositoryController],
  providers: [ResearchRepositoryService, PrismaService, CacheService],
  exports: [ResearchRepositoryService],
})
export class RepositoryModule {}
