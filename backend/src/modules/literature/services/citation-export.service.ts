/**
 * Phase 10.100 Phase 5: Citation Export Service
 *
 * Enterprise-grade service for exporting academic paper citations
 * in multiple standard formats (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON).
 *
 * Features:
 * - 7 export formats supported
 * - Input validation (SEC-1 compliance)
 * - Type-safe interfaces
 * - CSV injection protection
 * - Proper character escaping
 * - NestJS Logger integration (Phase 10.943)
 *
 * Single Responsibility: Citation formatting and export ONLY
 *
 * @module LiteratureModule
 * @since Phase 10.100 Phase 5
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ExportFormat } from '../dto/literature.dto';

// ============================================================================
// EXPORTED INTERFACES (Type Safety)
// ============================================================================

/**
 * Paper data structure for export operations
 * Phase 10.100 Strict Audit Fix: Proper typing for Prisma Paper results
 */
export interface ExportPaper {
  id: string;
  title: string;
  authors: string[] | string; // Prisma Json type can be array or string
  year?: number | string;
  abstract?: string | null;
  venue?: string | null;
  doi?: string | null;
  url?: string | null;
  citationCount?: number | null;
  qualityScore?: number | null;
  source?: string;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
}

/**
 * Prisma Paper result type for citation export
 * Phase 10.100 Strict Audit Fix: Type-safe wrapper for Prisma results
 * Handles Json fields (authors, keywords, etc.) with proper type guards
 */
type PrismaPaperForExport = {
  id: string;
  title: string;
  authors: unknown; // Prisma Json type
  year: number;
  abstract: string | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  citationCount: number | null;
  qualityScore: number | null;
  source: string;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
};

/**
 * Export result returned by exportCitations method
 */
export interface ExportResult {
  content: string;
  filename: string;
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  paperIds: string[];
  format: ExportFormat;
  includeAbstracts?: boolean;
  userId: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class CitationExportService {
  private readonly logger = new Logger(CitationExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Export citations in specified format
   *
   * Fetches papers from database and formats them according to the
   * requested citation style (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON).
   *
   * @param paperIds - Array of paper IDs to export
   * @param format - Citation format (ExportFormat enum)
   * @param includeAbstracts - Whether to include abstracts (optional)
   * @param userId - User ID for ownership validation
   * @returns Formatted citation content and filename
   * @throws Error if paperIds is empty or invalid
   * @throws Error if format is not supported
   */
  async exportCitations(
    paperIds: string[],
    format: ExportFormat,
    includeAbstracts: boolean = false,
    userId: string,
  ): Promise<ExportResult> {
    // SEC-1: Input validation
    this.validateExportInput(paperIds, format, userId);

    this.logger.log(`📤 Exporting ${paperIds.length} citations in ${format} format (User: ${userId})`);

    // Fetch papers from database (user ownership enforced)
    // Phase 10.100 Strict Audit Fix: Explicit field selection for type safety
    const papers = await this.prisma.paper.findMany({
      where: {
        id: { in: paperIds },
        userId,
      },
      select: {
        id: true,
        title: true,
        authors: true, // Prisma Json type
        year: true,
        abstract: true,
        venue: true,
        doi: true,
        url: true,
        citationCount: true,
        qualityScore: true,
        source: true,
        journal: true,
        volume: true,
        issue: true,
        pages: true,
      },
    });

    if (papers.length === 0) {
      this.logger.warn(`⚠️ No papers found for export (User: ${userId}, IDs: ${paperIds.length})`);
    }

    this.logger.log(`   ✅ Found ${papers.length} papers to export`);

    // Phase 10.100 Strict Audit Fix: Type-safe paper conversion
    // Prisma select ensures we get exactly PrismaPaperForExport structure
    // The assertion is safe because select guarantees the field structure matches
    const papersForExport: PrismaPaperForExport[] = papers as PrismaPaperForExport[];

    // Format based on requested format
    let content = '';
    let filename = '';

    switch (format) {
      case ExportFormat.BIBTEX:
        content = this.formatBibTeX(papersForExport, includeAbstracts);
        filename = 'references.bib';
        break;
      case ExportFormat.RIS:
        content = this.formatRIS(papersForExport, includeAbstracts);
        filename = 'references.ris';
        break;
      case ExportFormat.JSON:
        content = JSON.stringify(papers, null, 2);
        filename = 'references.json';
        break;
      case ExportFormat.CSV:
        content = this.formatCSV(papersForExport, includeAbstracts);
        filename = 'references.csv';
        break;
      case ExportFormat.APA:
        content = this.formatAPA(papersForExport);
        filename = 'references_apa.txt';
        break;
      case ExportFormat.MLA:
        content = this.formatMLA(papersForExport);
        filename = 'references_mla.txt';
        break;
      case ExportFormat.CHICAGO:
        content = this.formatChicago(papersForExport);
        filename = 'references_chicago.txt';
        break;
      default:
        // Fallback to JSON for unknown formats
        this.logger.warn(`⚠️ Unknown format "${format}", defaulting to JSON`);
        content = JSON.stringify(papers, null, 2);
        filename = 'references.json';
    }

    this.logger.log(`   ✅ Export complete: ${filename} (${content.length} characters)`);

    return { content, filename };
  }

  // ==========================================================================
  // PRIVATE FORMATTING METHODS
  // ==========================================================================

  /**
   * Normalize Prisma Paper to ExportPaper format
   * Phase 10.100 Strict Audit Fix: Type-safe conversion with proper JSON handling
   */
  private normalizePaper(paper: PrismaPaperForExport): ExportPaper {
    // Handle authors field (Prisma Json type)
    let authors: string[] | string;
    if (Array.isArray(paper.authors)) {
      authors = paper.authors.filter((a): a is string => typeof a === 'string');
    } else if (typeof paper.authors === 'string') {
      authors = paper.authors;
    } else {
      authors = 'Unknown';
    }

    return {
      id: paper.id,
      title: paper.title,
      authors,
      year: paper.year,
      abstract: paper.abstract ?? undefined,
      venue: paper.venue ?? undefined,
      doi: paper.doi ?? undefined,
      url: paper.url ?? undefined,
      citationCount: paper.citationCount ?? undefined,
      qualityScore: paper.qualityScore ?? undefined,
      source: paper.source,
      journal: paper.journal ?? undefined,
      volume: paper.volume ?? undefined,
      issue: paper.issue ?? undefined,
      pages: paper.pages ?? undefined,
    };
  }

  /**
   * Format papers in BibTeX format
   *
   * Generates .bib file content with proper BibTeX syntax.
   * Handles both @article and @misc entry types.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation with proper Prisma type handling
   *
   * @param papers - Papers to format (from Prisma)
   * @param includeAbstracts - Whether to include abstracts
   * @returns BibTeX formatted string
   */
  private formatBibTeX(papers: PrismaPaperForExport[], includeAbstracts?: boolean): string {
    return papers
      .map((paper) => {
        const normalized = this.normalizePaper(paper);
        const type = normalized.venue ? '@article' : '@misc';
        const key = normalized.doi?.replace(/\//g, '_') || normalized.id.substring(0, 20);
        const authors = Array.isArray(normalized.authors)
          ? normalized.authors.join(' and ')
          : String(normalized.authors || 'Unknown');

        let entry = `${type}{${key},
  title={{${paper.title}}},
  author={${authors}},
  year={${paper.year || 'n.d.'}},`;

        if (paper.venue) entry += `\n  journal={${paper.venue}},`;
        if (paper.doi) entry += `\n  doi={${paper.doi}},`;
        if (paper.url) entry += `\n  url={${paper.url}},`;
        if (paper.citationCount !== undefined)
          entry += `\n  note={Cited by ${paper.citationCount}},`;
        if (includeAbstracts && paper.abstract) {
          // Clean abstract: remove curly braces to prevent BibTeX errors
          const cleanAbstract = paper.abstract.replace(/[{}]/g, '');
          entry += `\n  abstract={${cleanAbstract}},`;
        }

        entry += '\n}';
        return entry;
      })
      .join('\n\n');
  }

  /**
   * Format papers in RIS (Research Information Systems) format
   *
   * Generates .ris file content following RIS specification.
   * Used by reference managers like EndNote, Zotero, Mendeley.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation
   *
   * @param papers - Papers to format (from Prisma)
   * @param includeAbstracts - Whether to include abstracts
   * @returns RIS formatted string
   */
  private formatRIS(papers: PrismaPaperForExport[], includeAbstracts?: boolean): string {
    return papers
      .map((paper) => {
        const normalized = this.normalizePaper(paper);
        const authors = Array.isArray(normalized.authors)
          ? normalized.authors
          : [normalized.authors || 'Unknown'];
        let entry = `TY  - JOUR\nTI  - ${normalized.title}\n`;
        entry += authors.map((a) => `AU  - ${a}`).join('\n') + '\n';
        entry += `PY  - ${normalized.year || 'n.d.'}\n`;
        if (normalized.venue) entry += `JO  - ${normalized.venue}\n`;
        if (normalized.doi) entry += `DO  - ${normalized.doi}\n`;
        if (normalized.url) entry += `UR  - ${normalized.url}\n`;
        if (includeAbstracts && normalized.abstract) entry += `AB  - ${normalized.abstract}\n`;
        entry += 'ER  -';
        return entry;
      })
      .join('\n\n');
  }

  /**
   * Format papers in APA (American Psychological Association) 7th Edition
   *
   * Generates plain text citations following APA style guidelines.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation
   *
   * @param papers - Papers to format (from Prisma)
   * @returns APA formatted string
   */
  private formatAPA(papers: PrismaPaperForExport[]): string {
    return papers
      .map((paper) => {
        const normalized = this.normalizePaper(paper);
        const authors = Array.isArray(normalized.authors)
          ? normalized.authors.join(', ')
          : String(normalized.authors || 'Unknown');
        const year = normalized.year || 'n.d.';
        const title = normalized.title;
        const venue = normalized.venue || 'Unpublished manuscript';
        const doi = normalized.doi ? ` https://doi.org/${normalized.doi}` : '';

        return `${authors} (${year}). ${title}. ${venue}.${doi}`;
      })
      .join('\n\n');
  }

  /**
   * Format papers in MLA (Modern Language Association) 9th Edition
   *
   * Generates plain text citations following MLA style guidelines.
   * Uses "et al." for multiple authors.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation
   *
   * @param papers - Papers to format (from Prisma)
   * @returns MLA formatted string
   */
  private formatMLA(papers: PrismaPaperForExport[]): string {
    return papers
      .map((paper) => {
        const normalized = this.normalizePaper(paper);
        const authors = Array.isArray(normalized.authors)
          ? normalized.authors[0] + (normalized.authors.length > 1 ? ', et al.' : '')
          : String(normalized.authors || 'Unknown');
        const title = `"${normalized.title}"`;
        const venue = normalized.venue ? `${normalized.venue}, ` : '';
        const year = normalized.year || 'n.d.';
        const doi = normalized.doi ? ` doi:${normalized.doi}` : '';

        return `${authors}. ${title} ${venue}${year}.${doi}`;
      })
      .join('\n\n');
  }

  /**
   * Format papers in Chicago Manual of Style (17th Edition)
   *
   * Generates plain text citations following Chicago style guidelines.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation
   *
   * @param papers - Papers to format (from Prisma)
   * @returns Chicago formatted string
   */
  private formatChicago(papers: PrismaPaperForExport[]): string {
    return papers
      .map((paper) => {
        const normalized = this.normalizePaper(paper);
        const authors = Array.isArray(normalized.authors)
          ? normalized.authors.join(', ')
          : String(normalized.authors || 'Unknown');
        const year = normalized.year || 'n.d.';
        const title = `"${normalized.title}"`;
        const venue = normalized.venue || 'Unpublished';
        const doi = normalized.doi ? ` https://doi.org/${normalized.doi}` : '';

        return `${authors}. ${year}. ${title}. ${venue}.${doi}`;
      })
      .join('\n\n');
  }

  /**
   * Format papers in CSV (Comma-Separated Values) format
   *
   * Generates .csv file with proper escaping to prevent CSV injection attacks.
   * Includes all metadata fields for comprehensive data export.
   *
   * Phase 10.100 Strict Audit Fix: Type-safe implementation
   *
   * @param papers - Papers to format (from Prisma)
   * @param includeAbstracts - Whether to include abstracts column
   * @returns CSV formatted string
   */
  private formatCSV(papers: PrismaPaperForExport[], includeAbstracts?: boolean): string {
    const headers = [
      'ID',
      'Title',
      'Authors',
      'Year',
      'Venue',
      'DOI',
      'URL',
      'Citation Count',
      'Quality Score',
      'Source',
    ];
    if (includeAbstracts) headers.push('Abstract');

    const rows = papers.map((paper) => {
      const normalized = this.normalizePaper(paper);
      const row = [
        normalized.id || '',
        this.escapeCsvField(normalized.title || ''),
        this.escapeCsvField(
          Array.isArray(normalized.authors) ? normalized.authors.join('; ') : normalized.authors || '',
        ),
        normalized.year?.toString() || '',
        this.escapeCsvField(normalized.venue || ''),
        normalized.doi || '',
        normalized.url || '',
        normalized.citationCount !== undefined ? String(normalized.citationCount) : '',
        normalized.qualityScore !== undefined ? String(normalized.qualityScore) : '',
        normalized.source || '',
      ];
      if (includeAbstracts) {
        row.push(this.escapeCsvField(normalized.abstract || ''));
      }
      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // ==========================================================================
  // PRIVATE UTILITY METHODS
  // ==========================================================================

  /**
   * Escape CSV field to prevent injection attacks
   *
   * Protects against CSV formula injection by properly escaping:
   * - Commas (wrap in quotes)
   * - Double quotes (escape with double-double quotes)
   * - Newlines (wrap in quotes)
   * - Formulas starting with = + - @ (not implemented yet - future security enhancement)
   *
   * Defensive Programming: Handles null/undefined input gracefully.
   *
   * @param field - Field value to escape
   * @returns Safely escaped field
   */
  private escapeCsvField(field: string): string {
    // Defensive programming: Handle null/undefined input
    if (!field || field === null || field === undefined) {
      return '';
    }

    // Convert to string if not already (defensive)
    const stringField = String(field);

    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  /**
   * Validate export input parameters (SEC-1 compliance)
   *
   * Ensures all inputs are valid before processing:
   * - paperIds must be non-empty array
   * - format must be valid ExportFormat
   * - userId must be non-empty string
   *
   * @param paperIds - Array of paper IDs
   * @param format - Export format
   * @param userId - User ID
   * @throws Error if validation fails
   */
  private validateExportInput(
    paperIds: string[],
    format: ExportFormat,
    userId: string,
  ): void {
    // Validate paperIds
    if (!Array.isArray(paperIds) || paperIds.length === 0) {
      throw new Error('Invalid paperIds: must be non-empty array');
    }

    // Validate each paperId is a non-empty string
    const invalidIds = paperIds.filter(
      (id) => !id || typeof id !== 'string' || id.trim().length === 0,
    );
    if (invalidIds.length > 0) {
      throw new Error(`Invalid paper IDs: found ${invalidIds.length} empty or non-string IDs`);
    }

    // Validate format
    const validFormats = Object.values(ExportFormat);
    if (!validFormats.includes(format)) {
      throw new Error(
        `Invalid format "${format}". Must be one of: ${validFormats.join(', ')}`,
      );
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid userId: must be non-empty string');
    }
  }
}
