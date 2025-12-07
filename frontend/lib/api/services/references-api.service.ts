/**
 * References API Service - Phase 10.97 Day 1
 *
 * Enterprise-grade API service for reference management with:
 * - BibTeX/RIS parsing and generation
 * - Citation formatting (6 styles: APA, MLA, Chicago, Harvard, IEEE, Vancouver)
 * - Zotero sync integration
 * - PDF attachment management
 *
 * @module ReferencesAPIService
 * @since Phase 10.97 Day 1
 */

import { BaseApiService, type RequestOptions } from './base-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGGER_CONTEXT = 'ReferencesAPIService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Supported citation styles (aligns with backend CitationStyle enum) */
export type CitationStyle =
  | 'apa'
  | 'mla'
  | 'chicago'
  | 'harvard'
  | 'ieee'
  | 'vancouver';

/** Citation style display names for UI */
export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa: 'APA 7th Edition',
  mla: 'MLA 9th Edition',
  chicago: 'Chicago 17th Edition',
  harvard: 'Harvard',
  ieee: 'IEEE',
  vancouver: 'Vancouver',
} as const;

/** Reference type enumeration */
export type ReferenceType =
  | 'article'
  | 'book'
  | 'inproceedings'
  | 'conference'
  | 'thesis'
  | 'website'
  | 'report'
  | 'misc';

/** Read status for references */
export type ReadStatus = 'unread' | 'reading' | 'read';

/** Paper data for citation formatting */
export interface PaperForCitation {
  readonly id: string;
  readonly title: string;
  readonly authors: ReadonlyArray<string>;
  readonly year: number;
  readonly journal?: string;
  readonly volume?: string;
  readonly issue?: string;
  readonly pages?: string;
  readonly doi?: string;
  readonly url?: string;
  readonly publisher?: string;
  readonly abstract?: string;
  readonly type?: ReferenceType;
}

/** Attachment data structure */
export interface ReferenceAttachment {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly url: string;
  readonly uploadedAt: Date;
}

/** Full reference data structure */
export interface Reference extends PaperForCitation {
  readonly keywords: ReadonlyArray<string>;
  readonly collections: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly starred: boolean;
  readonly citationKey: string;
  readonly addedDate: Date;
  readonly modifiedDate: Date;
  readonly readStatus: ReadStatus;
  readonly notes?: string;
  readonly attachments?: ReadonlyArray<ReferenceAttachment>;
}

/** Parsed BibTeX entry */
export interface ParsedBibTeXEntry {
  readonly type: ReferenceType;
  readonly citationKey: string;
  readonly title: string;
  readonly authors: ReadonlyArray<string>;
  readonly year: number;
  readonly journal?: string;
  readonly volume?: string;
  readonly issue?: string;
  readonly pages?: string;
  readonly doi?: string;
  readonly url?: string;
  readonly publisher?: string;
  readonly abstract?: string;
  readonly keywords?: ReadonlyArray<string>;
}

/** BibTeX parse response */
export interface ParseBibTeXResponse {
  readonly entries: ReadonlyArray<ParsedBibTeXEntry>;
  readonly parseErrors?: ReadonlyArray<string>;
  readonly totalParsed: number;
}

/** BibTeX generation response */
export interface GenerateBibTeXResponse {
  readonly bibtex: string;
}

/** Parsed RIS entry */
export interface ParsedRISEntry {
  readonly type: ReferenceType;
  readonly title: string;
  readonly authors: ReadonlyArray<string>;
  readonly year: number;
  readonly journal?: string;
  readonly volume?: string;
  readonly issue?: string;
  readonly pages?: string;
  readonly doi?: string;
  readonly url?: string;
  readonly abstract?: string;
  readonly keywords?: ReadonlyArray<string>;
}

/** RIS parse response */
export interface ParseRISResponse {
  readonly entries: ReadonlyArray<ParsedRISEntry>;
  readonly parseErrors?: ReadonlyArray<string>;
  readonly totalParsed: number;
}

/** RIS generation response */
export interface GenerateRISResponse {
  readonly ris: string;
}

/** Citation format response */
export interface FormatCitationResponse {
  readonly citation: string;
  readonly style: CitationStyle;
}

/** Zotero sync status */
export type ZoteroSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/** Zotero sync response */
export interface ZoteroSyncResponse {
  readonly success: boolean;
  readonly itemsSynced: number;
  readonly errors?: ReadonlyArray<string>;
  readonly lastSyncedAt: Date;
}

/** Zotero sync request body */
export interface ZoteroSyncRequest {
  readonly apiKey: string;
  readonly zoteroUserId: string;
}

/** PDF attachment response */
export interface AttachPDFResponse {
  readonly success: boolean;
  readonly paperId: string;
}

// ============================================================================
// REFERENCES API SERVICE
// ============================================================================

class ReferencesApiService extends BaseApiService {
  constructor() {
    super('/literature');
  }

  // ==========================================================================
  // BIBTEX OPERATIONS
  // ==========================================================================

  /**
   * Parse BibTeX format references
   * @param bibtex - Raw BibTeX string to parse
   * @returns Parsed entries with metadata
   */
  async parseBibTeX(
    bibtex: string,
    options?: RequestOptions
  ): Promise<ParseBibTeXResponse> {
    logger.info('Parsing BibTeX input', LOGGER_CONTEXT, {
      inputLength: bibtex.length,
    });

    try {
      const response = await this.post<ParseBibTeXResponse>(
        '/references/parse/bibtex',
        { bibtex },
        options
      );

      logger.info('BibTeX parsed successfully', LOGGER_CONTEXT, {
        entriesCount: response.data.totalParsed,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to parse BibTeX', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  /**
   * Generate BibTeX from paper data
   * @param paper - Paper data to convert to BibTeX
   * @returns Generated BibTeX string
   */
  async generateBibTeX(
    paper: PaperForCitation,
    options?: RequestOptions
  ): Promise<GenerateBibTeXResponse> {
    logger.info('Generating BibTeX', LOGGER_CONTEXT, {
      paperId: paper.id,
      title: paper.title.substring(0, 50),
    });

    try {
      const response = await this.post<GenerateBibTeXResponse>(
        '/references/generate/bibtex',
        paper,
        options
      );

      logger.info('BibTeX generated successfully', LOGGER_CONTEXT, {
        paperId: paper.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate BibTeX', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  /**
   * Generate BibTeX for multiple papers
   * @param papers - Array of papers to convert
   * @returns Combined BibTeX string
   */
  async generateBulkBibTeX(
    papers: ReadonlyArray<PaperForCitation>,
    options?: RequestOptions
  ): Promise<string> {
    logger.info('Generating bulk BibTeX', LOGGER_CONTEXT, {
      paperCount: papers.length,
    });

    const results = await this.batch(
      papers.map((paper) => () => this.generateBibTeX(paper, options))
    );

    const combinedBibTeX = results.map((r) => r.bibtex).join('\n\n');

    logger.info('Bulk BibTeX generated', LOGGER_CONTEXT, {
      paperCount: papers.length,
      totalLength: combinedBibTeX.length,
    });

    return combinedBibTeX;
  }

  // ==========================================================================
  // RIS OPERATIONS
  // ==========================================================================

  /**
   * Parse RIS format references
   * @param ris - Raw RIS string to parse
   * @returns Parsed entries with metadata
   */
  async parseRIS(
    ris: string,
    options?: RequestOptions
  ): Promise<ParseRISResponse> {
    logger.info('Parsing RIS input', LOGGER_CONTEXT, {
      inputLength: ris.length,
    });

    try {
      const response = await this.post<ParseRISResponse>(
        '/references/parse/ris',
        { ris },
        options
      );

      logger.info('RIS parsed successfully', LOGGER_CONTEXT, {
        entriesCount: response.data.totalParsed,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to parse RIS', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  /**
   * Generate RIS from paper data
   * @param paper - Paper data to convert to RIS
   * @returns Generated RIS string
   */
  async generateRIS(
    paper: PaperForCitation,
    options?: RequestOptions
  ): Promise<GenerateRISResponse> {
    logger.info('Generating RIS', LOGGER_CONTEXT, {
      paperId: paper.id,
    });

    try {
      const response = await this.post<GenerateRISResponse>(
        '/references/generate/ris',
        paper,
        options
      );

      logger.info('RIS generated successfully', LOGGER_CONTEXT, {
        paperId: paper.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate RIS', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  /**
   * Generate RIS for multiple papers
   * @param papers - Array of papers to convert
   * @returns Combined RIS string
   */
  async generateBulkRIS(
    papers: ReadonlyArray<PaperForCitation>,
    options?: RequestOptions
  ): Promise<string> {
    logger.info('Generating bulk RIS', LOGGER_CONTEXT, {
      paperCount: papers.length,
    });

    const results = await this.batch(
      papers.map((paper) => () => this.generateRIS(paper, options))
    );

    const combinedRIS = results.map((r) => r.ris).join('\n\n');

    logger.info('Bulk RIS generated', LOGGER_CONTEXT, {
      paperCount: papers.length,
    });

    return combinedRIS;
  }

  // ==========================================================================
  // CITATION FORMATTING
  // ==========================================================================

  /**
   * Format citation in specified style
   * @param paper - Paper data to format
   * @param style - Citation style to use
   * @returns Formatted citation string
   */
  async formatCitation(
    paper: PaperForCitation,
    style: CitationStyle,
    options?: RequestOptions
  ): Promise<FormatCitationResponse> {
    logger.info('Formatting citation', LOGGER_CONTEXT, {
      paperId: paper.id,
      style,
    });

    try {
      const response = await this.post<FormatCitationResponse>(
        '/references/format',
        { paper, style },
        options
      );

      logger.info('Citation formatted successfully', LOGGER_CONTEXT, {
        paperId: paper.id,
        style,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to format citation', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  /**
   * Format multiple citations in specified style
   * @param papers - Array of papers to format
   * @param style - Citation style to use
   * @returns Array of formatted citation strings
   */
  async formatBulkCitations(
    papers: ReadonlyArray<PaperForCitation>,
    style: CitationStyle,
    options?: RequestOptions
  ): Promise<ReadonlyArray<string>> {
    logger.info('Formatting bulk citations', LOGGER_CONTEXT, {
      paperCount: papers.length,
      style,
    });

    const results = await this.batch(
      papers.map((paper) => () => this.formatCitation(paper, style, options))
    );

    const citations = results.map((r) => r.citation);

    logger.info('Bulk citations formatted', LOGGER_CONTEXT, {
      paperCount: papers.length,
      style,
    });

    return citations;
  }

  // ==========================================================================
  // ZOTERO INTEGRATION
  // ==========================================================================

  /**
   * Sync with Zotero library
   * @param apiKey - Zotero API key
   * @param zoteroUserId - Zotero user ID
   * @returns Sync result with item count
   */
  async syncWithZotero(
    request: ZoteroSyncRequest,
    options?: RequestOptions
  ): Promise<ZoteroSyncResponse> {
    logger.info('Starting Zotero sync', LOGGER_CONTEXT, {
      zoteroUserId: request.zoteroUserId.substring(0, 4) + '***',
    });

    try {
      const response = await this.post<ZoteroSyncResponse>(
        '/references/zotero/sync',
        request,
        options
      );

      logger.info('Zotero sync completed', LOGGER_CONTEXT, {
        itemsSynced: response.data.itemsSynced,
        success: response.data.success,
      });

      return response.data;
    } catch (error) {
      logger.error('Zotero sync failed', LOGGER_CONTEXT, error);
      throw error;
    }
  }

  // ==========================================================================
  // PDF ATTACHMENT
  // ==========================================================================

  /**
   * Attach PDF to a paper
   * @param paperId - ID of the paper
   * @param pdfPath - Path or URL to the PDF
   * @returns Attachment result
   */
  async attachPDF(
    paperId: string,
    pdfPath: string,
    options?: RequestOptions
  ): Promise<AttachPDFResponse> {
    logger.info('Attaching PDF to paper', LOGGER_CONTEXT, {
      paperId,
    });

    try {
      const response = await this.post<AttachPDFResponse>(
        `/references/pdf/${paperId}`,
        { pdfPath },
        options
      );

      logger.info('PDF attached successfully', LOGGER_CONTEXT, {
        paperId,
        success: response.data.success,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to attach PDF', LOGGER_CONTEXT, error);
      throw error;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton instance of the References API Service */
export const referencesAPI = new ReferencesApiService();

/** Export class for custom instances or testing */
export { ReferencesApiService };
