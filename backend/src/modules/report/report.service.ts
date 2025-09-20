import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';
import { StudyService } from '../study/study.service';
import { QAnalysisService } from '../analysis/services/q-analysis.service';
import { InterpretationService } from '../analysis/services/interpretation.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReportSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  enabled: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';
  sections: ReportSection[];
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'latex' | 'markdown' | 'html';
  template?: string;
  includeRawData?: boolean;
  includeAnalysis?: boolean;
  includeVisualizations?: boolean;
}

/**
 * Report Service - Phase 7 Day 6 Implementation (Foundation)
 *
 * Basic report generation service that will be enhanced in Phase 10
 * Provides export functionality for study reports
 *
 * @features
 * - PDF generation
 * - Multiple format support preparation
 * - Template-based reports
 * - Integration with analysis data
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly studyService: StudyService,
    private readonly qAnalysisService: QAnalysisService,
    private readonly interpretationService: InterpretationService,
  ) {}

  /**
   * Generate a study report
   */
  async generateReport(
    studyId: string,
    userId: string,
    options: ExportOptions,
  ): Promise<{ filename: string; buffer: Buffer; mimeType: string }> {
    // Validate study access
    const study = await this.studyService.findOne(studyId, userId);
    if (!study) {
      throw new NotFoundException('Study not found');
    }

    // Check cache
    const cacheKey = `report:${studyId}:${options.format}:${options.template || 'default'}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    try {
      let result: { filename: string; buffer: Buffer; mimeType: string };

      switch (options.format) {
        case 'pdf':
          result = await this.generatePDF(study, options);
          break;
        case 'markdown':
          result = await this.generateMarkdown(study, options);
          break;
        case 'html':
          result = await this.generateHTML(study, options);
          break;
        case 'docx':
        case 'latex':
          // Phase 10 will implement these
          throw new BadRequestException(
            `${options.format} format coming in Phase 10`,
          );
        default:
          throw new BadRequestException('Unsupported export format');
      }

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error: any) {
      console.error('Report generation failed:', error);
      throw new BadRequestException('Failed to generate report');
    }
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(
    study: any,
    options: ExportOptions,
  ): Promise<{ filename: string; buffer: Buffer; mimeType: string }> {
    const doc = new (PDFDocument as any)();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Title Page
    doc.fontSize(24).text(study.title || 'Q-Methodology Study Report', {
      align: 'center',
    });
    doc.moveDown();
    doc.fontSize(12).text(new Date().toLocaleDateString(), { align: 'center' });
    doc.addPage();

    // Abstract
    if (study.description) {
      doc.fontSize(16).text('Abstract', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(study.description);
      doc.addPage();
    }

    // Methodology
    doc.fontSize(16).text('Methodology', { underline: true });
    doc.moveDown();
    doc
      .fontSize(11)
      .text(`Study Type: Q-Methodology`)
      .text(`Number of Statements: ${study.statements?.length || 0}`)
      .text(
        `Grid Configuration: ${study.gridConfig?.minValue || -4} to ${study.gridConfig?.maxValue || 4}`,
      )
      .text(
        `Collection Period: ${study.createdAt ? new Date(study.createdAt).toLocaleDateString() : 'N/A'}`,
      );
    doc.moveDown();

    // Participants
    if (options.includeRawData) {
      doc.addPage();
      doc.fontSize(16).text('Participants', { underline: true });
      doc.moveDown();
      // Add participant summary (Phase 10 will add detailed data)
      doc
        .fontSize(11)
        .text('Participant data will be included in Phase 10 implementation');
    }

    // Analysis Results
    if (options.includeAnalysis) {
      doc.addPage();
      doc.fontSize(16).text('Analysis Results', { underline: true });
      doc.moveDown();
      // Add analysis summary (Phase 10 will add detailed results)
      doc
        .fontSize(11)
        .text('Detailed analysis results will be included in Phase 10');
    }

    // Finalize PDF
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const filename = `${study.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}_${Date.now()}.pdf`;
        resolve({
          filename,
          buffer,
          mimeType: 'application/pdf',
        });
      });
    });
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdown(
    study: any,
    options: ExportOptions,
  ): Promise<{ filename: string; buffer: Buffer; mimeType: string }> {
    let content = `# ${study.title || 'Q-Methodology Study Report'}\n\n`;
    content += `**Date:** ${new Date().toLocaleDateString()}\n\n`;

    if (study.description) {
      content += `## Abstract\n\n${study.description}\n\n`;
    }

    content += `## Methodology\n\n`;
    content += `- **Study Type:** Q-Methodology\n`;
    content += `- **Number of Statements:** ${study.statements?.length || 0}\n`;
    content += `- **Grid Configuration:** ${study.gridConfig?.minValue || -4} to ${study.gridConfig?.maxValue || 4}\n`;
    content += `- **Collection Period:** ${study.createdAt ? new Date(study.createdAt).toLocaleDateString() : 'N/A'}\n\n`;

    if (options.includeRawData) {
      content += `## Data\n\n`;
      content += `*Raw data export will be available in Phase 10*\n\n`;
    }

    if (options.includeAnalysis) {
      content += `## Analysis Results\n\n`;
      content += `*Detailed analysis will be available in Phase 10*\n\n`;
    }

    const buffer = Buffer.from(content, 'utf-8');
    const filename = `${study.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}_${Date.now()}.md`;

    return {
      filename,
      buffer,
      mimeType: 'text/markdown',
    };
  }

  /**
   * Generate HTML report
   */
  private async generateHTML(
    study: any,
    options: ExportOptions,
  ): Promise<{ filename: string; buffer: Buffer; mimeType: string }> {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${study.title || 'Q-Methodology Study Report'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .section { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${study.title || 'Q-Methodology Study Report'}</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    `;

    if (study.description) {
      html += `
    <div class="section">
        <h2>Abstract</h2>
        <p>${study.description}</p>
    </div>`;
    }

    html += `
    <div class="section">
        <h2>Methodology</h2>
        <div class="metadata">
            <p><strong>Study Type:</strong> Q-Methodology</p>
            <p><strong>Number of Statements:</strong> ${study.statements?.length || 0}</p>
            <p><strong>Grid Configuration:</strong> ${study.gridConfig?.minValue || -4} to ${study.gridConfig?.maxValue || 4}</p>
            <p><strong>Collection Period:</strong> ${study.createdAt ? new Date(study.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
    </div>`;

    if (options.includeRawData) {
      html += `
    <div class="section">
        <h2>Data</h2>
        <p><em>Raw data export will be available in Phase 10</em></p>
    </div>`;
    }

    if (options.includeAnalysis) {
      html += `
    <div class="section">
        <h2>Analysis Results</h2>
        <p><em>Detailed analysis will be available in Phase 10</em></p>
    </div>`;
    }

    html += `
</body>
</html>`;

    const buffer = Buffer.from(html, 'utf-8');
    const filename = `${study.title?.replace(/[^a-z0-9]/gi, '_') || 'report'}_${Date.now()}.html`;

    return {
      filename,
      buffer,
      mimeType: 'text/html',
    };
  }

  /**
   * Get available export formats
   */
  async getExportFormats(): Promise<string[]> {
    return ['pdf', 'markdown', 'html'];
    // Phase 10 will add: 'docx', 'latex'
  }

  /**
   * Get report templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    return [
      {
        id: 'apa',
        name: 'APA 7th Edition',
        format: 'apa',
        sections: [
          {
            id: 'title',
            type: 'title',
            title: 'Title Page',
            content: '',
            order: 1,
            enabled: true,
          },
          {
            id: 'abstract',
            type: 'abstract',
            title: 'Abstract',
            content: '',
            order: 2,
            enabled: true,
          },
          {
            id: 'intro',
            type: 'introduction',
            title: 'Introduction',
            content: '',
            order: 3,
            enabled: true,
          },
          {
            id: 'method',
            type: 'methodology',
            title: 'Method',
            content: '',
            order: 4,
            enabled: true,
          },
          {
            id: 'results',
            type: 'results',
            title: 'Results',
            content: '',
            order: 5,
            enabled: true,
          },
          {
            id: 'discussion',
            type: 'discussion',
            title: 'Discussion',
            content: '',
            order: 6,
            enabled: true,
          },
          {
            id: 'references',
            type: 'references',
            title: 'References',
            content: '',
            order: 7,
            enabled: true,
          },
        ],
      },
      {
        id: 'mla',
        name: 'MLA 9th Edition',
        format: 'mla',
        sections: [
          {
            id: 'intro',
            type: 'introduction',
            title: 'Introduction',
            content: '',
            order: 1,
            enabled: true,
          },
          {
            id: 'body',
            type: 'body',
            title: 'Body',
            content: '',
            order: 2,
            enabled: true,
          },
          {
            id: 'conclusion',
            type: 'conclusion',
            title: 'Conclusion',
            content: '',
            order: 3,
            enabled: true,
          },
          {
            id: 'works',
            type: 'references',
            title: 'Works Cited',
            content: '',
            order: 4,
            enabled: true,
          },
        ],
      },
    ];
  }
}
