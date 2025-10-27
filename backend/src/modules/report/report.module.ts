import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportController as ReportControllerV2 } from './controllers/report.controller';
import { ReportGeneratorService } from './services/report-generator.service';
import { CitationManagerService } from './services/export/citation-manager.service';
import { WordExportService } from './services/export/word-export.service';
import { LaTeXExportService } from './services/export/latex-export.service';
import { AIManuscriptGeneratorService } from './services/export/ai-manuscript-generator.service';
import { ReportCollaborationService } from './services/report-collaboration.service';
import { ReportVersionService } from './services/report-version.service';
import { ReportCommentService } from './services/report-comment.service';
import { ReportChangeService } from './services/report-change.service';
import { ReportApprovalService } from './services/report-approval.service';
import { CacheService } from '../../common/cache.service';
import { PrismaService } from '../../common/prisma.service';
import { StudyModule } from '../study/study.module';
import { AnalysisModule } from '../analysis/analysis.module';

/**
 * Report Module
 * Phase 7 Day 6 + Phase 10 Days 1-4
 *
 * Comprehensive report generation module with:
 * - Phase 7: Foundation report service (basic reports)
 * - Phase 10 Day 1: Advanced report generation with full pipeline integration
 *   - Full Phase 9 → 9.5 → 10 pipeline integration
 *   - Multiple export formats (PDF, Word, LaTeX, HTML, Markdown)
 *   - JWT-protected REST API
 *   - Swagger documentation
 *   - Provenance chain tracking
 * - Phase 10 Day 2: Export Services & AI Manuscript Generation (ENTERPRISE-GRADE)
 *   - Citation Manager (APA, MLA, Chicago, IEEE, Harvard)
 *   - Word Export (.docx) with full formatting
 *   - LaTeX Export with journal templates
 *   - AI Manuscript Generator (Patent #8)
 *   - Journal-specific formatting
 *   - Complete provenance tracking in appendices
 * - Phase 10 Day 4: Collaboration Features (ENTERPRISE-GRADE)
 *   - Co-author management with role-based permissions
 *   - Version control with snapshots and diffs
 *   - Threaded commenting system
 *   - Track changes (Google Docs style)
 *   - Approval workflow for publishing
 */
@Module({
  imports: [ConfigModule, StudyModule, AnalysisModule],
  controllers: [
    ReportController, // Phase 7 controller (basic reports)
    ReportControllerV2, // Phase 10 controller (advanced reports)
  ],
  providers: [
    ReportService, // Phase 7 service
    ReportGeneratorService, // Phase 10 Day 1 service
    CitationManagerService, // Phase 10 Day 2 - Citation management
    WordExportService, // Phase 10 Day 2 - Word export
    LaTeXExportService, // Phase 10 Day 2 - LaTeX export
    AIManuscriptGeneratorService, // Phase 10 Day 2 - AI manuscript generation
    ReportCollaborationService, // Phase 10 Day 4 - Co-author management
    ReportVersionService, // Phase 10 Day 4 - Version control
    ReportCommentService, // Phase 10 Day 4 - Comment system
    ReportChangeService, // Phase 10 Day 4 - Track changes
    ReportApprovalService, // Phase 10 Day 4 - Approval workflow
    CacheService,
    PrismaService,
  ],
  exports: [
    ReportService, // Export for backward compatibility
    ReportGeneratorService, // Export for other modules
    CitationManagerService, // Export for citation management
    WordExportService, // Export for Word generation
    LaTeXExportService, // Export for LaTeX generation
    AIManuscriptGeneratorService, // Export for AI manuscript generation
    ReportCollaborationService, // Export for collaboration
    ReportVersionService, // Export for version control
    ReportCommentService, // Export for comments
    ReportChangeService, // Export for track changes
    ReportApprovalService, // Export for approval workflow
  ],
})
export class ReportModule {}
