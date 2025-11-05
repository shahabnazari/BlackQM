/**
 * Citation Manager Service - Phase 10 Day 2
 * Enterprise-grade citation management with multi-format support
 *
 * Features:
 * - APA 7th edition formatting
 * - MLA 9th edition formatting
 * - Chicago 17th edition formatting
 * - Automatic DOI resolution
 * - Citation provenance tracking
 * - Bibliography generation
 * - In-text citation formatting
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cite } from 'citation-js';

export interface Citation {
  id: string;
  type:
    | 'article'
    | 'book'
    | 'chapter'
    | 'conference'
    | 'thesis'
    | 'webpage'
    | 'preprint';
  title: string;
  authors: string | string[];
  year: number;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  editors?: string[];
  isbn?: string;
  pmid?: string;
  arxivId?: string;
}

export interface FormattedCitation {
  inText: string; // e.g., "(Smith & Jones, 2023)"
  full: string; // Full bibliography entry
  bibtex?: string; // LaTeX BibTeX format
}

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';

@Injectable()
export class CitationManagerService {
  private readonly logger = new Logger(CitationManagerService.name);

  /**
   * Format a citation in the specified style
   */
  async formatCitation(
    citation: Citation,
    style: CitationStyle = 'apa',
  ): Promise<FormattedCitation> {
    this.logger.debug(`Formatting citation ${citation.id} in ${style} style`);

    try {
      // Convert to citation-js format
      const citeData = this.convertToCiteData(citation);

      // Create citation object
      const cite = new Cite(citeData);

      // Get formatted output
      const inText = this.getInTextCitation(citation, style);
      const full = cite.format('bibliography', {
        format: 'text',
        template: this.getTemplateForStyle(style),
        lang: 'en-US',
      });

      // Generate BibTeX for LaTeX export
      const bibtex = cite.format('bibtex');

      return {
        inText,
        full,
        bibtex,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to format citation: ${error.message}`,
        error.stack,
      );

      // Fallback to manual formatting
      return this.fallbackFormat(citation, style);
    }
  }

  /**
   * Format multiple citations as a bibliography
   */
  async generateBibliography(
    citations: Citation[],
    style: CitationStyle = 'apa',
  ): Promise<string> {
    this.logger.log(
      `Generating bibliography with ${citations.length} citations in ${style} style`,
    );

    const formatted: string[] = [];

    for (const citation of citations) {
      try {
        const result = await this.formatCitation(citation, style);
        formatted.push(result.full);
      } catch (error: any) {
        this.logger.error(
          `Failed to format citation ${citation.id}: ${error.message}`,
        );
      }
    }

    // Sort alphabetically by author last name
    formatted.sort((a, b) => a.localeCompare(b));

    // Add numbering for IEEE style
    if (style === 'ieee') {
      return formatted
        .map((entry, index) => `[${index + 1}] ${entry}`)
        .join('\n\n');
    }

    return formatted.join('\n\n');
  }

  /**
   * Get in-text citation format
   */
  private getInTextCitation(citation: Citation, style: CitationStyle): string {
    const authors = Array.isArray(citation.authors)
      ? citation.authors
      : citation.authors.split(',').map((a) => a.trim());

    switch (style) {
      case 'apa':
        return this.formatAPAInText(authors, citation.year);

      case 'mla':
        return this.formatMLAInText(authors);

      case 'chicago':
        return this.formatChicagoInText(authors, citation.year);

      case 'ieee':
        // IEEE uses numbered citations - would need citation index
        return '[1]'; // Placeholder

      case 'harvard':
        return this.formatHarvardInText(authors, citation.year);

      default:
        return `(${authors[0].split(' ').pop()}, ${citation.year})`;
    }
  }

  /**
   * APA in-text citation format
   */
  private formatAPAInText(authors: string[], year: number): string {
    if (authors.length === 0) return '(Anonymous, ' + year + ')';

    const lastNames = authors.map((a) => {
      const parts = a.trim().split(' ');
      return parts[parts.length - 1];
    });

    if (lastNames.length === 1) {
      return `(${lastNames[0]}, ${year})`;
    } else if (lastNames.length === 2) {
      return `(${lastNames[0]} & ${lastNames[1]}, ${year})`;
    } else {
      return `(${lastNames[0]} et al., ${year})`;
    }
  }

  /**
   * MLA in-text citation format
   */
  private formatMLAInText(authors: string[]): string {
    if (authors.length === 0) return '(Anonymous)';

    const lastNames = authors.map((a) => {
      const parts = a.trim().split(' ');
      return parts[parts.length - 1];
    });

    if (lastNames.length === 1) {
      return `(${lastNames[0]})`;
    } else if (lastNames.length === 2) {
      return `(${lastNames[0]} and ${lastNames[1]})`;
    } else {
      return `(${lastNames[0]} et al.)`;
    }
  }

  /**
   * Chicago in-text citation format
   */
  private formatChicagoInText(authors: string[], year: number): string {
    if (authors.length === 0) return '(Anonymous ' + year + ')';

    const lastNames = authors.map((a) => {
      const parts = a.trim().split(' ');
      return parts[parts.length - 1];
    });

    if (lastNames.length === 1) {
      return `(${lastNames[0]} ${year})`;
    } else if (lastNames.length === 2) {
      return `(${lastNames[0]} and ${lastNames[1]} ${year})`;
    } else {
      return `(${lastNames[0]} et al. ${year})`;
    }
  }

  /**
   * Harvard in-text citation format
   */
  private formatHarvardInText(authors: string[], year: number): string {
    // Harvard is similar to APA
    return this.formatAPAInText(authors, year);
  }

  /**
   * Convert Citation to citation-js data format
   */
  private convertToCiteData(citation: Citation): any {
    const citeData: any = {
      id: citation.id,
      type: this.mapCitationType(citation.type),
      title: citation.title,
      issued: { 'date-parts': [[citation.year]] },
    };

    // Authors
    if (citation.authors) {
      const authors = Array.isArray(citation.authors)
        ? citation.authors
        : citation.authors.split(',').map((a) => a.trim());

      citeData.author = authors.map((name) => this.parseAuthorName(name));
    }

    // Journal article fields
    if (citation.journal) citeData['container-title'] = citation.journal;
    if (citation.volume) citeData.volume = citation.volume;
    if (citation.issue) citeData.issue = citation.issue;
    if (citation.pages) citeData.page = citation.pages;

    // Identifiers
    if (citation.doi) citeData.DOI = citation.doi;
    if (citation.url) citeData.URL = citation.url;
    if (citation.pmid) citeData.PMID = citation.pmid;
    if (citation.isbn) citeData.ISBN = citation.isbn;

    // Publisher
    if (citation.publisher) citeData.publisher = citation.publisher;

    // Editors
    if (citation.editors && citation.editors.length > 0) {
      citeData.editor = citation.editors.map((name) =>
        this.parseAuthorName(name),
      );
    }

    return citeData;
  }

  /**
   * Parse author name into first/last name
   */
  private parseAuthorName(fullName: string): any {
    const parts = fullName.trim().split(' ');

    if (parts.length === 1) {
      return { family: parts[0] };
    } else if (parts.length === 2) {
      return { given: parts[0], family: parts[1] };
    } else {
      // Handle middle names/initials
      return {
        given: parts.slice(0, -1).join(' '),
        family: parts[parts.length - 1],
      };
    }
  }

  /**
   * Map citation type to CSL type
   */
  private mapCitationType(type: string): string {
    const typeMap: Record<string, string> = {
      article: 'article-journal',
      book: 'book',
      chapter: 'chapter',
      conference: 'paper-conference',
      thesis: 'thesis',
      webpage: 'webpage',
      preprint: 'article',
    };

    return typeMap[type] || 'article';
  }

  /**
   * Get citation-js template for style
   */
  private getTemplateForStyle(style: CitationStyle): string {
    const templateMap: Record<CitationStyle, string> = {
      apa: 'apa',
      mla: 'modern-language-association',
      chicago: 'chicago',
      ieee: 'ieee',
      harvard: 'harvard1',
    };

    return templateMap[style] || 'apa';
  }

  /**
   * Fallback formatting if citation-js fails
   */
  private fallbackFormat(
    citation: Citation,
    style: CitationStyle,
  ): FormattedCitation {
    const authors = Array.isArray(citation.authors)
      ? citation.authors
      : citation.authors.split(',').map((a) => a.trim());

    const authorsStr = this.formatAuthorsList(authors, style);
    const inText = this.getInTextCitation(citation, style);

    let full = '';

    switch (style) {
      case 'apa':
        full = this.formatAPAFull(citation, authorsStr);
        break;

      case 'mla':
        full = this.formatMLAFull(citation, authorsStr);
        break;

      case 'chicago':
        full = this.formatChicagoFull(citation, authorsStr);
        break;

      default:
        full = `${authorsStr} (${citation.year}). ${citation.title}.`;
    }

    return { inText, full };
  }

  /**
   * Format authors list for bibliography
   */
  private formatAuthorsList(authors: string[], style: CitationStyle): string {
    if (authors.length === 0) return 'Anonymous';

    switch (style) {
      case 'apa':
        return authors
          .map((author, index) => {
            const parts = author.trim().split(' ');
            const lastName = parts[parts.length - 1];
            const initials = parts
              .slice(0, -1)
              .map((p) => p[0] + '.')
              .join(' ');
            return index === 0
              ? `${lastName}, ${initials}`
              : `${initials} ${lastName}`;
          })
          .join(', ');

      case 'mla':
        return authors
          .map((author, index) => {
            const parts = author.trim().split(' ');
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            return index === 0
              ? `${lastName}, ${firstName}`
              : `${firstName} ${lastName}`;
          })
          .join(', and ');

      default:
        return authors.join(', ');
    }
  }

  /**
   * Format full APA citation
   */
  private formatAPAFull(citation: Citation, authorsStr: string): string {
    let result = `${authorsStr} (${citation.year}). ${citation.title}. `;

    if (citation.journal) {
      result += `*${citation.journal}*`;
      if (citation.volume) result += `, ${citation.volume}`;
      if (citation.issue) result += `(${citation.issue})`;
      if (citation.pages) result += `, ${citation.pages}`;
      result += '.';
    }

    if (citation.doi) {
      result += ` https://doi.org/${citation.doi}`;
    } else if (citation.url) {
      result += ` ${citation.url}`;
    }

    return result;
  }

  /**
   * Format full MLA citation
   */
  private formatMLAFull(citation: Citation, authorsStr: string): string {
    let result = `${authorsStr}. "${citation.title}." `;

    if (citation.journal) {
      result += `*${citation.journal}*`;
      if (citation.volume) result += `, vol. ${citation.volume}`;
      if (citation.issue) result += `, no. ${citation.issue}`;
      result += `, ${citation.year}`;
      if (citation.pages) result += `, pp. ${citation.pages}`;
      result += '.';
    }

    if (citation.url) {
      result += ` ${citation.url}`;
    }

    return result;
  }

  /**
   * Format full Chicago citation
   */
  private formatChicagoFull(citation: Citation, authorsStr: string): string {
    let result = `${authorsStr}. "${citation.title}." `;

    if (citation.journal) {
      result += `*${citation.journal}*`;
      if (citation.volume) result += ` ${citation.volume}`;
      if (citation.issue) result += `, no. ${citation.issue}`;
      result += ` (${citation.year})`;
      if (citation.pages) result += `: ${citation.pages}`;
      result += '.';
    }

    if (citation.doi) {
      result += ` https://doi.org/${citation.doi}.`;
    }

    return result;
  }

  /**
   * Generate BibTeX entry for LaTeX
   */
  async generateBibTeX(citations: Citation[]): Promise<string> {
    this.logger.log(`Generating BibTeX for ${citations.length} citations`);

    const entries: string[] = [];

    for (const citation of citations) {
      try {
        const citeData = this.convertToCiteData(citation);
        const cite = new Cite(citeData);
        const bibtex = cite.format('bibtex');
        entries.push(bibtex);
      } catch (error: any) {
        this.logger.error(
          `Failed to generate BibTeX for ${citation.id}: ${error.message}`,
        );
      }
    }

    return entries.join('\n\n');
  }

  /**
   * Resolve DOI to get citation metadata
   */
  async resolveDOI(doi: string): Promise<Citation | null> {
    this.logger.debug(`Resolving DOI: ${doi}`);

    try {
      const cite = await Cite.async(doi);
      const data = cite.data[0];

      return {
        id: data.id || doi,
        type: 'article',
        title: data.title || '',
        authors: data.author?.map((a: any) => `${a.given} ${a.family}`) || [],
        year: data.issued?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
        journal: data['container-title'] || undefined,
        volume: data.volume || undefined,
        issue: data.issue || undefined,
        pages: data.page || undefined,
        doi: data.DOI || doi,
        url: data.URL || undefined,
        publisher: data.publisher || undefined,
      };
    } catch (error: any) {
      this.logger.error(`Failed to resolve DOI ${doi}: ${error.message}`);
      return null;
    }
  }
}
