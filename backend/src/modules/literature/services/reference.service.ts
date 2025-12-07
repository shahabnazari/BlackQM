import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Phase 10.106 Phase 9: Typed interface for paper input
 * Netflix-grade: No loose `any` types for paper formatting
 */
export interface ReferencePaperInput {
  title?: string;
  authors?: string[] | string;
  year?: number | string;
  journal?: string;
  venue?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  abstract?: string;
  type?: string;
  booktitle?: string;
  conference?: string;
  isbn?: string;
  issn?: string;
  keywords?: string[];
}

/**
 * Phase 10.106 Phase 9: Zotero API types
 * Netflix-grade: Full type safety for external API integration
 */
export interface ZoteroCreator {
  creatorType?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface ZoteroTag {
  tag: string;
  type?: number;
}

export interface ZoteroItemData {
  key?: string;
  version?: number;
  itemType?: string;
  title?: string;
  creators?: ZoteroCreator[];
  date?: string;
  publicationTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  DOI?: string;
  url?: string;
  abstractNote?: string;
  tags?: ZoteroTag[];
}

export interface ZoteroItem {
  key: string;
  version: number;
  library?: {
    type: string;
    id: number;
    name: string;
  };
  data: ZoteroItemData;
}

export interface ConvertedPaper {
  title?: string;
  authors?: string[];
  year?: number | null;
  journal?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  type?: string;
  tags?: string[];
}

export interface ZoteroSyncResult {
  synced: number;
  papers: ConvertedPaper[];
}

// BibTeX entry types
export enum BibTeXType {
  ARTICLE = 'article',
  BOOK = 'book',
  INPROCEEDINGS = 'inproceedings',
  INCOLLECTION = 'incollection',
  PHDTHESIS = 'phdthesis',
  MASTERSTHESIS = 'mastersthesis',
  TECHREPORT = 'techreport',
  MISC = 'misc',
  UNPUBLISHED = 'unpublished',
}

// Citation styles
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  HARVARD = 'harvard',
  IEEE = 'ieee',
  VANCOUVER = 'vancouver',
}

export interface BibTeXEntry {
  type: BibTeXType;
  citationKey: string;
  fields: Record<string, string>;
}

export interface RISEntry {
  type: string;
  fields: Record<string, string[]>;
}

@Injectable()
export class ReferenceService {
  private readonly logger = new Logger(ReferenceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Parse BibTeX format string into structured data
   */
  parseBibTeX(bibtex: string): BibTeXEntry[] {
    const entries: BibTeXEntry[] = [];
    const entryRegex = /@(\w+)\{([^,]+),([^@]*)\}/g;
    let match;

    while ((match = entryRegex.exec(bibtex)) !== null) {
      const type = match[1].toLowerCase() as BibTeXType;
      const citationKey = match[2].trim();
      const fieldsStr = match[3];

      const fields: Record<string, string> = {};
      const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(fieldsStr)) !== null) {
        fields[fieldMatch[1].toLowerCase()] = fieldMatch[2].trim();
      }

      entries.push({ type, citationKey, fields });
    }

    return entries;
  }

  /**
   * Generate BibTeX format string from paper data
   */
  generateBibTeX(paper: ReferencePaperInput): string {
    const citationKey = this.generateCitationKey(paper);
    const type = this.determineBibTeXType(paper);

    let bibtex = `@${type}{${citationKey},\n`;

    // Add required fields
    if (paper.title) bibtex += `  title = {${paper.title}},\n`;
    if (paper.authors) {
      const authorStr = Array.isArray(paper.authors)
        ? paper.authors.join(' and ')
        : paper.authors;
      bibtex += `  author = {${authorStr}},\n`;
    }
    if (paper.year) bibtex += `  year = {${paper.year}},\n`;

    // Add optional fields
    if (paper.journal) bibtex += `  journal = {${paper.journal}},\n`;
    if (paper.volume) bibtex += `  volume = {${paper.volume}},\n`;
    if (paper.number) bibtex += `  number = {${paper.number}},\n`;
    if (paper.pages) bibtex += `  pages = {${paper.pages}},\n`;
    if (paper.doi) bibtex += `  doi = {${paper.doi}},\n`;
    if (paper.url) bibtex += `  url = {${paper.url}},\n`;
    if (paper.publisher) bibtex += `  publisher = {${paper.publisher}},\n`;
    if (paper.abstract) bibtex += `  abstract = {${paper.abstract}},\n`;

    bibtex = bibtex.slice(0, -2) + '\n}';
    return bibtex;
  }

  /**
   * Parse RIS format string into structured data
   */
  parseRIS(ris: string): RISEntry[] {
    const entries: RISEntry[] = [];
    const lines = ris.split('\n');
    let currentEntry: RISEntry | null = null;

    for (const line of lines) {
      const match = line.match(/^([A-Z]{2})\s+-\s+(.*)$/);
      if (!match) continue;

      const [, tag, value] = match;

      if (tag === 'TY') {
        // Start new entry
        if (currentEntry) entries.push(currentEntry);
        currentEntry = { type: value, fields: {} };
      } else if (tag === 'ER') {
        // End entry
        if (currentEntry) entries.push(currentEntry);
        currentEntry = null;
      } else if (currentEntry) {
        // Add field to current entry
        if (!currentEntry.fields[tag]) {
          currentEntry.fields[tag] = [];
        }
        currentEntry.fields[tag].push(value);
      }
    }

    return entries;
  }

  /**
   * Generate RIS format string from paper data
   */
  generateRIS(paper: ReferencePaperInput): string {
    let ris = '';

    // Type
    ris += `TY  - ${this.determineRISType(paper)}\n`;

    // Title
    if (paper.title) ris += `TI  - ${paper.title}\n`;

    // Authors
    if (paper.authors) {
      const authors = Array.isArray(paper.authors)
        ? paper.authors
        : [paper.authors];
      for (const author of authors) {
        ris += `AU  - ${author}\n`;
      }
    }

    // Year
    if (paper.year) ris += `PY  - ${paper.year}\n`;

    // Journal
    if (paper.journal) ris += `JO  - ${paper.journal}\n`;

    // Volume and Issue
    if (paper.volume) ris += `VL  - ${paper.volume}\n`;
    if (paper.number) ris += `IS  - ${paper.number}\n`;

    // Pages
    if (paper.pages) {
      const pages = paper.pages.split('-');
      if (pages[0]) ris += `SP  - ${pages[0]}\n`;
      if (pages[1]) ris += `EP  - ${pages[1]}\n`;
    }

    // DOI and URL
    if (paper.doi) ris += `DO  - ${paper.doi}\n`;
    if (paper.url) ris += `UR  - ${paper.url}\n`;

    // Abstract
    if (paper.abstract) ris += `AB  - ${paper.abstract}\n`;

    // End
    ris += 'ER  - \n';

    return ris;
  }

  /**
   * Format citation according to specified style
   */
  formatCitation(paper: ReferencePaperInput, style: CitationStyle): string {
    switch (style) {
      case CitationStyle.APA:
        return this.formatAPA(paper);
      case CitationStyle.MLA:
        return this.formatMLA(paper);
      case CitationStyle.CHICAGO:
        return this.formatChicago(paper);
      case CitationStyle.HARVARD:
        return this.formatHarvard(paper);
      case CitationStyle.IEEE:
        return this.formatIEEE(paper);
      case CitationStyle.VANCOUVER:
        return this.formatVancouver(paper);
      default:
        return this.formatAPA(paper);
    }
  }

  /**
   * APA Citation Style
   */
  private formatAPA(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsAPA(paper.authors);
    const year = paper.year || 'n.d.';
    const title = paper.title || 'Untitled';
    const journal = paper.journal ? ` ${paper.journal}` : '';
    const volume = paper.volume ? `, ${paper.volume}` : '';
    const issue = paper.number ? `(${paper.number})` : '';
    const pages = paper.pages ? `, ${paper.pages}` : '';
    const doi = paper.doi ? ` https://doi.org/${paper.doi}` : '';

    return `${authors} (${year}). ${title}.${journal}${volume}${issue}${pages}.${doi}`;
  }

  /**
   * MLA Citation Style
   */
  private formatMLA(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsMLA(paper.authors);
    const title = `"${paper.title || 'Untitled'}"`;
    const journal = paper.journal ? ` ${paper.journal}` : '';
    const volume = paper.volume ? ` ${paper.volume}` : '';
    const issue = paper.number ? `.${paper.number}` : '';
    const year = paper.year ? ` (${paper.year})` : '';
    const pages = paper.pages ? `: ${paper.pages}` : '';

    return `${authors}. ${title}.${journal}${volume}${issue}${year}${pages}. Print.`;
  }

  /**
   * Chicago Citation Style
   */
  private formatChicago(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsChicago(paper.authors);
    const title = `"${paper.title || 'Untitled'}"`;
    const journal = paper.journal || '';
    const volume = paper.volume ? ` ${paper.volume}` : '';
    const issue = paper.number ? `, no. ${paper.number}` : '';
    const year = paper.year ? ` (${paper.year})` : '';
    const pages = paper.pages ? `: ${paper.pages}` : '';

    return `${authors}. ${title}. ${journal}${volume}${issue}${year}${pages}.`;
  }

  /**
   * Harvard Citation Style
   */
  private formatHarvard(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsHarvard(paper.authors);
    const year = paper.year || 'n.d.';
    const title = `'${paper.title || 'Untitled'}'`;
    const journal = paper.journal ? `, ${paper.journal}` : '';
    const volume = paper.volume ? `, vol. ${paper.volume}` : '';
    const issue = paper.number ? `, no. ${paper.number}` : '';
    const pages = paper.pages ? `, pp. ${paper.pages}` : '';

    return `${authors} ${year}, ${title}${journal}${volume}${issue}${pages}.`;
  }

  /**
   * IEEE Citation Style
   */
  private formatIEEE(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsIEEE(paper.authors);
    const title = `"${paper.title || 'Untitled'},"`;
    const journal = paper.journal ? ` ${paper.journal},` : '';
    const volume = paper.volume ? ` vol. ${paper.volume},` : '';
    const issue = paper.number ? ` no. ${paper.number},` : '';
    const pages = paper.pages ? ` pp. ${paper.pages},` : '';
    const year = paper.year ? ` ${paper.year}.` : '';

    return `${authors}, ${title}${journal}${volume}${issue}${pages}${year}`;
  }

  /**
   * Vancouver Citation Style
   */
  private formatVancouver(paper: ReferencePaperInput): string {
    const authors = this.formatAuthorsVancouver(paper.authors);
    const title = paper.title || 'Untitled';
    const journal = paper.journal ? ` ${paper.journal}` : '';
    const year = paper.year ? ` ${paper.year}` : '';
    const volume = paper.volume ? `;${paper.volume}` : '';
    const issue = paper.number ? `(${paper.number})` : '';
    const pages = paper.pages ? `:${paper.pages}` : '';

    return `${authors}. ${title}.${journal}${year}${volume}${issue}${pages}.`;
  }

  // Helper methods for author formatting
  private formatAuthorsAPA(authors: string[] | string | undefined): string {
    if (!authors) return 'Unknown';
    const authList = Array.isArray(authors) ? authors : [authors];
    if (authList.length === 1) return authList[0];
    if (authList.length === 2) return `${authList[0]} & ${authList[1]}`;
    return `${authList[0]} et al.`;
  }

  private formatAuthorsMLA(authors: string[] | string | undefined): string {
    if (!authors) return 'Unknown';
    const authList = Array.isArray(authors) ? authors : [authors];
    if (authList.length === 1) return authList[0];
    if (authList.length === 2) return `${authList[0]} and ${authList[1]}`;
    return `${authList[0]}, et al`;
  }

  private formatAuthorsChicago(authors: string[] | string | undefined): string {
    return this.formatAuthorsMLA(authors);
  }

  private formatAuthorsHarvard(authors: string[] | string | undefined): string {
    return this.formatAuthorsAPA(authors);
  }

  private formatAuthorsIEEE(authors: string[] | string | undefined): string {
    if (!authors) return 'Unknown';
    const authList = Array.isArray(authors) ? authors : [authors];
    const formatted = authList.map((author: string) => {
      const parts = author.split(/,\s*/);
      if (parts.length >= 2) {
        // Format: "Last, First" -> "F. Last"
        const lastName = parts[0];
        const firstName = parts[1];
        return `${firstName[0]}. ${lastName}`;
      } else {
        // Format: "First Last" -> "F. Last"
        const nameParts = author.split(' ');
        if (nameParts.length >= 2) {
          const initials = nameParts
            .slice(0, -1)
            .map((p: string) => p[0] + '.')
            .join(' ');
          const lastName = nameParts[nameParts.length - 1];
          return `${initials} ${lastName}`;
        }
      }
      return author;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
    return `${formatted[0]} et al.`;
  }

  private formatAuthorsVancouver(authors: string[] | string | undefined): string {
    if (!authors) return 'Unknown';
    const authList = Array.isArray(authors) ? authors : [authors];
    const formatted = authList.slice(0, 6).map((author: string) => {
      const parts = author.split(/,\s*/);
      if (parts.length >= 2) {
        // Format: "Last, First" -> "Last F"
        const lastName = parts[0];
        const firstName = parts[1];
        return `${lastName} ${firstName[0]}`;
      } else {
        // Format: "First Last" -> "Last F"
        const nameParts = author.split(' ');
        if (nameParts.length >= 2) {
          const lastName = nameParts[nameParts.length - 1];
          const initials = nameParts
            .slice(0, -1)
            .map((p: string) => p[0])
            .join('');
          return `${lastName} ${initials}`;
        }
      }
      return author;
    });

    const result = formatted.join(', ');
    return authList.length > 6 ? `${result}, et al` : result;
  }

  // Helper methods for type determination
  private determineBibTeXType(paper: ReferencePaperInput): BibTeXType {
    if (paper.type) {
      const type = paper.type.toLowerCase();
      if (type.includes('book')) return BibTeXType.BOOK;
      if (type.includes('thesis') && type.includes('phd'))
        return BibTeXType.PHDTHESIS;
      if (type.includes('thesis') && type.includes('master'))
        return BibTeXType.MASTERSTHESIS;
      if (type.includes('proceedings') || type.includes('conference'))
        return BibTeXType.INPROCEEDINGS;
      if (type.includes('report')) return BibTeXType.TECHREPORT;
    }

    if (paper.journal) return BibTeXType.ARTICLE;
    if (paper.booktitle || paper.conference) return BibTeXType.INPROCEEDINGS;

    return BibTeXType.MISC;
  }

  private determineRISType(paper: ReferencePaperInput): string {
    if (paper.type) {
      const type = paper.type.toLowerCase();
      if (type.includes('journal')) return 'JOUR';
      if (type.includes('book')) return 'BOOK';
      if (type.includes('thesis')) return 'THES';
      if (type.includes('conference')) return 'CONF';
      if (type.includes('report')) return 'RPRT';
    }

    if (paper.journal) return 'JOUR';
    if (paper.booktitle || paper.conference) return 'CONF';

    return 'GEN';
  }

  private generateCitationKey(paper: ReferencePaperInput): string {
    const year = paper.year || 'XXXX';
    const authors = Array.isArray(paper.authors)
      ? paper.authors
      : [paper.authors || 'Unknown'];
    const firstAuthor = authors[0];
    let firstAuthorLastName = 'Unknown';

    // Handle "Last, First" or "First Last" formats
    if (firstAuthor.includes(',')) {
      firstAuthorLastName = firstAuthor.split(',')[0].trim();
    } else {
      const parts = firstAuthor.split(' ');
      firstAuthorLastName = parts[parts.length - 1] || 'Unknown';
    }

    const titleWord = (paper.title || 'untitled').split(' ')[0].toLowerCase();

    return `${firstAuthorLastName}${year}${titleWord}`;
  }

  /**
   * Zotero integration methods
   * Phase 10.106 Phase 9: Fully typed Zotero API integration
   */
  async syncWithZotero(apiKey: string, userId: string): Promise<ZoteroSyncResult> {
    try {
      // Zotero API endpoint
      const baseUrl = `https://api.zotero.org/users/${userId}`;
      const headers = {
        'Zotero-API-Key': apiKey,
        'Zotero-API-Version': '3',
      };

      // Fetch library items
      const response = await fetch(`${baseUrl}/items?limit=100`, { headers });
      const items = (await response.json()) as ZoteroItem[];

      // Convert Zotero items to our paper format and save
      const papers = items.map((item: ZoteroItem) => this.convertZoteroItem(item));

      // Save to database
      for (const paper of papers) {
        await this.savePaperToLibrary(paper, userId);
      }

      return { synced: papers.length, papers };
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.error(`Zotero sync failed: ${err.message || 'Unknown error'}`);
      throw error;
    }
  }

  private convertZoteroItem(item: ZoteroItem): ConvertedPaper {
    const data = item.data;
    return {
      title: data.title,
      authors: data.creators?.map((c: ZoteroCreator) =>
        c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()
      ),
      year: data.date ? new Date(data.date).getFullYear() : null,
      journal: data.publicationTitle,
      volume: data.volume,
      number: data.issue,
      pages: data.pages,
      doi: data.DOI,
      url: data.url,
      abstract: data.abstractNote,
      type: data.itemType,
      tags: data.tags?.map((t: ZoteroTag) => t.tag),
    };
  }

  private async savePaperToLibrary(paper: ConvertedPaper, userId: string): Promise<void> {
    await this.prisma.paper.create({
      data: {
        title: paper.title || 'Untitled',
        authors: paper.authors || [],
        year: paper.year ?? 0,
        journal: paper.journal,
        volume: paper.volume,
        issue: paper.number,
        pages: paper.pages,
        doi: paper.doi,
        url: paper.url,
        abstract: paper.abstract,
        keywords: paper.tags,
        source: 'ZOTERO', // From Zotero sync
        userId,
      },
    });
  }

  /**
   * PDF attachment support
   */
  async attachPDF(paperId: string, pdfPath: string): Promise<void> {
    await this.prisma.paper.update({
      where: { id: paperId },
      data: {
        pdfPath,
        hasFullText: true,
      },
    });
  }

  async extractTextFromPDF(_pdfPath: string): Promise<string> {
    // This would use a PDF parsing library like pdf-parse
    // For now, return a placeholder
    this.logger.warn('PDF text extraction not yet implemented');
    return '';
  }
}
