/**
 * LaTeX Export Service - Phase 10 Day 2
 * Enterprise-grade LaTeX document generation for academic publishing
 *
 * Features:
 * - Multiple document classes (article, report, book, thesis)
 * - Journal-specific templates (Springer, Elsevier, IEEE, PLOS, etc.)
 * - Automatic BibTeX bibliography
 * - Figure and table generation
 * - Mathematical notation support
 * - Cross-referencing
 * - Provenance tracking in appendices
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ProvenanceChain,
  ReportSection,
  ReportMetadata,
} from '../report-generator.service';
import { Citation, CitationManagerService } from './citation-manager.service';

export interface LaTeXExportOptions {
  documentClass: 'article' | 'report' | 'book' | 'thesis';
  journalTemplate?:
    | 'springer'
    | 'elsevier'
    | 'ieee'
    | 'plos'
    | 'nature'
    | 'apa';
  includeAbstract: boolean;
  includeTableOfContents: boolean;
  includeProvenance: boolean;
  fontSize: '10pt' | '11pt' | '12pt';
  paperSize: 'a4paper' | 'letterpaper';
  // Dissertation-specific options
  dissertationOptions?: {
    degree?: string; // e.g., "Doctor of Philosophy"
    department?: string;
    institution?: string;
    committee?: { name: string; title: string }[];
    dedication?: string;
    acknowledgements?: string;
    includeCopyrightPage?: boolean;
    includeListOfFigures?: boolean;
    includeListOfTables?: boolean;
  };
}

@Injectable()
export class LaTeXExportService {
  private readonly logger = new Logger(LaTeXExportService.name);

  constructor(private readonly citationManager: CitationManagerService) {}

  /**
   * Generate LaTeX document from report sections
   */
  async generateLaTeXDocument(
    metadata: ReportMetadata,
    sections: ReportSection[],
    provenance: ProvenanceChain[],
    citations: Citation[],
    options: LaTeXExportOptions,
  ): Promise<string> {
    this.logger.log(`Generating LaTeX document for study ${metadata.studyId}`);

    try {
      let latex = '';

      // Document preamble
      latex += this.generatePreamble(metadata, options);

      // Begin document
      latex += '\\begin{document}\n\n';

      // Dissertation front matter
      if (options.documentClass === 'thesis' && options.dissertationOptions) {
        // Title page
        latex += this.generateDissertationTitlePage(metadata, options);

        // Copyright page
        if (options.dissertationOptions.includeCopyrightPage) {
          latex += this.generateCopyrightPage(metadata);
        }

        // Committee approval page
        if (
          options.dissertationOptions.committee &&
          options.dissertationOptions.committee.length > 0
        ) {
          latex += this.generateCommitteeApprovalPage(metadata, options);
        }

        // Dedication
        if (options.dissertationOptions.dedication) {
          latex += this.generateDedicationPage(
            options.dissertationOptions.dedication,
          );
        }

        // Acknowledgements
        if (options.dissertationOptions.acknowledgements) {
          latex += this.generateAcknowledgementsPage(
            options.dissertationOptions.acknowledgements,
          );
        }

        // Abstract (for dissertation)
        const abstractSection = sections.find((s) => s.id === 'abstract');
        if (options.includeAbstract && abstractSection) {
          latex += this.generateAbstract(abstractSection.content);
        }

        // Table of contents
        latex += '\\tableofcontents\n';
        latex += '\\newpage\n\n';

        // List of figures
        if (options.dissertationOptions.includeListOfFigures) {
          latex += '\\listoffigures\n';
          latex += '\\newpage\n\n';
        }

        // List of tables
        if (options.dissertationOptions.includeListOfTables) {
          latex += '\\listoftables\n';
          latex += '\\newpage\n\n';
        }
      } else {
        // Standard title and authors
        latex += this.generateTitlePage(metadata, options);

        // Abstract (if applicable)
        const abstractSection = sections.find((s) => s.id === 'abstract');
        if (options.includeAbstract && abstractSection) {
          latex += this.generateAbstract(abstractSection.content);
        }

        // Table of contents
        if (options.includeTableOfContents) {
          latex += '\\tableofcontents\n';
          latex += '\\newpage\n\n';
        }
      }

      // Main sections
      latex += this.generateSections(
        sections.filter((s) => s.id !== 'abstract'),
        options,
      );

      // Provenance appendix
      if (options.includeProvenance && provenance.length > 0) {
        latex += this.generateProvenanceAppendix(provenance);
      }

      // Bibliography
      if (citations.length > 0) {
        latex += await this.generateBibliography(citations);
      }

      // End document
      latex += '\\end{document}\n';

      this.logger.log(
        `LaTeX document generated successfully (${latex.length} characters)`,
      );

      return latex;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate LaTeX document: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate LaTeX preamble with packages and settings
   */
  private generatePreamble(
    metadata: ReportMetadata,
    options: LaTeXExportOptions,
  ): string {
    let preamble = '';

    // Document class
    preamble += `\\documentclass[${options.fontSize},${options.paperSize}]{${options.documentClass}}\n\n`;

    // Packages
    preamble += '% Essential packages\n';
    preamble += '\\usepackage[utf8]{inputenc}\n';
    preamble += '\\usepackage[T1]{fontenc}\n';
    preamble += '\\usepackage{lmodern}\n';
    preamble += '\\usepackage{graphicx}\n';
    preamble += '\\usepackage{hyperref}\n';
    preamble += '\\usepackage{amsmath}\n';
    preamble += '\\usepackage{amssymb}\n';
    preamble += '\\usepackage{booktabs}\n';
    preamble += '\\usepackage{longtable}\n';
    preamble += '\\usepackage{array}\n';
    preamble += '\\usepackage{multirow}\n';
    preamble += '\\usepackage{enumitem}\n';
    preamble += '\\usepackage{natbib}\n';

    // Dissertation-specific packages
    if (options.documentClass === 'thesis' && options.dissertationOptions) {
      preamble += '\n% Dissertation formatting\n';
      preamble += '\\usepackage{setspace}\n';
      preamble += '\\usepackage{geometry}\n';
      preamble += '\\geometry{margin=1.5in}\n';
      preamble += '\\doublespacing\n';
      preamble += '\\usepackage{tocloft}\n';
      preamble += '\\setlength{\\cftchapnumwidth}{3em}\n';
    }

    preamble += '\n';

    // Journal-specific packages
    if (options.journalTemplate) {
      preamble += this.getJournalPackages(options.journalTemplate);
    }

    // Title and author metadata
    preamble += '% Document metadata\n';
    preamble += `\\title{${this.escapeLatex(metadata.title)}}\n`;
    preamble += `\\author{${metadata.authors.map((a) => this.escapeLatex(a)).join(' \\and ')}}\n`;
    preamble += `\\date{${new Date(metadata.date).toLocaleDateString()}}\n\n`;

    // Hyperref setup
    preamble += '% Hyperref setup\n';
    preamble += '\\hypersetup{\n';
    preamble += `    pdftitle={${this.escapeLatex(metadata.title)}},\n`;
    preamble += `    pdfauthor={${metadata.authors.join(', ')}},\n`;
    preamble += '    pdfsubject={Q-Methodology Research Report},\n';
    preamble += '    colorlinks=true,\n';
    preamble += '    linkcolor=blue,\n';
    preamble += '    citecolor=blue,\n';
    preamble += '    urlcolor=blue\n';
    preamble += '}\n\n';

    return preamble;
  }

  /**
   * Get journal-specific packages
   */
  private getJournalPackages(template: string): string {
    const templates: Record<string, string> = {
      springer: '\\usepackage{springer}\n',
      elsevier: '\\usepackage{elsarticle}\n',
      ieee: '\\usepackage{IEEEtrantools}\n',
      plos: '\\usepackage{plos2015}\n',
      nature: '\\usepackage{nature}\n',
      apa: '\\usepackage{apa7}\n',
    };

    return templates[template] || '';
  }

  /**
   * Generate title page
   */
  private generateTitlePage(
    metadata: ReportMetadata,
    options: LaTeXExportOptions,
  ): string {
    let title = '';

    title += '\\maketitle\n\n';

    // Add institution if available
    if (metadata.institution) {
      title += `\\begin{center}\n`;
      title += `    ${this.escapeLatex(metadata.institution)}\n`;
      title += `\\end{center}\n\n`;
    }

    return title;
  }

  /**
   * Generate dissertation title page
   */
  private generateDissertationTitlePage(
    metadata: ReportMetadata,
    options: LaTeXExportOptions,
  ): string {
    const dissOpts = options.dissertationOptions!;
    let title = '';

    title += '\\begin{titlepage}\n';
    title += '\\begin{center}\n\n';

    // Title
    title += '\\vspace*{2cm}\n';
    title += `{\\Huge\\bfseries ${this.escapeLatex(metadata.title)}\\par}\n`;
    title += '\\vspace{2cm}\n\n';

    // Author
    title += `{\\Large by\\par}\n`;
    title += '\\vspace{0.5cm}\n';
    title += `{\\Large\\bfseries ${this.escapeLatex(metadata.authors[0])}\\par}\n`;
    title += '\\vspace{2cm}\n\n';

    // Submission statement
    title += '\\raggedright\n';
    title += '\\hspace{5cm}\n';
    title += 'A dissertation submitted in partial fulfillment\\\\\n';
    title += `\\hspace{5cm} of the requirements for the degree of\\\\\n`;
    title += '\\vspace{0.5cm}\n\n';

    // Degree
    title += '\\centering\n';
    title += `{\\Large ${this.escapeLatex(dissOpts.degree || 'Doctor of Philosophy')}\\par}\n`;
    title += '\\vspace{0.5cm}\n\n';

    // Department and institution
    if (dissOpts.department) {
      title += `${this.escapeLatex(dissOpts.department)}\\\\\n`;
    }
    title += `${this.escapeLatex(dissOpts.institution || metadata.institution || 'University')}\\par\n`;
    title += '\\vspace{1cm}\n\n';

    // Date
    title += `${new Date(metadata.date).getFullYear()}\\par\n`;

    title += '\\end{center}\n';
    title += '\\end{titlepage}\n\n';

    return title;
  }

  /**
   * Generate copyright page
   */
  private generateCopyrightPage(metadata: ReportMetadata): string {
    let page = '';

    page += '\\newpage\n';
    page += '\\thispagestyle{empty}\n';
    page += '\\vspace*{\\fill}\n';
    page += '\\begin{center}\n';
    page += `Copyright \\copyright\\ ${new Date(metadata.date).getFullYear()} ${this.escapeLatex(metadata.authors[0])}\\\\\n`;
    page += 'All rights reserved.\n';
    page += '\\end{center}\n';
    page += '\\vspace*{\\fill}\n';
    page += '\\newpage\n\n';

    return page;
  }

  /**
   * Generate committee approval page
   */
  private generateCommitteeApprovalPage(
    metadata: ReportMetadata,
    options: LaTeXExportOptions,
  ): string {
    const committee = options.dissertationOptions!.committee!;
    let page = '';

    page += '\\newpage\n';
    page += '\\thispagestyle{empty}\n';
    page += '\\begin{center}\n';
    page += '{\\Large\\bfseries Committee Approval}\\par\n';
    page += '\\vspace{2cm}\n\n';
    page += '\\raggedright\n';
    page +=
      'The dissertation committee for ' +
      this.escapeLatex(metadata.authors[0]) +
      '\\\\';
    page +=
      'certifies that this is the approved version of the following dissertation:\\par\n';
    page += '\\vspace{1cm}\n\n';
    page += '\\centering\n';
    page += `{\\Large\\bfseries ${this.escapeLatex(metadata.title)}}\\par\n`;
    page += '\\vspace{2cm}\n\n';
    page += '\\raggedright\n';

    // Committee members with signature lines
    committee.forEach((member) => {
      page += '\\vspace{1.5cm}\n';
      page += '\\rule{8cm}{0.4pt}\\par\n';
      page += `${this.escapeLatex(member.name)}\\par\n`;
      page += `{\\small ${this.escapeLatex(member.title)}}\\par\n`;
    });

    page += '\\end{center}\n';
    page += '\\newpage\n\n';

    return page;
  }

  /**
   * Generate dedication page
   */
  private generateDedicationPage(dedication: string): string {
    let page = '';

    page += '\\newpage\n';
    page += '\\thispagestyle{empty}\n';
    page += '\\vspace*{\\fill}\n';
    page += '\\begin{center}\n';
    page += '{\\large\\itshape\n';
    page += this.escapeLatex(dedication) + '\n';
    page += '}\\par\n';
    page += '\\end{center}\n';
    page += '\\vspace*{\\fill}\n';
    page += '\\newpage\n\n';

    return page;
  }

  /**
   * Generate acknowledgements page
   */
  private generateAcknowledgementsPage(acknowledgements: string): string {
    let page = '';

    page += '\\newpage\n';
    page += '\\chapter*{Acknowledgements}\n';
    page += '\\addcontentsline{toc}{chapter}{Acknowledgements}\n\n';
    page += this.convertMarkdownToLatex(acknowledgements) + '\n\n';
    page += '\\newpage\n\n';

    return page;
  }

  /**
   * Generate abstract
   */
  private generateAbstract(content: string): string {
    let abstract = '';

    abstract += '\\begin{abstract}\n';
    abstract += this.convertMarkdownToLatex(content);
    abstract += '\\end{abstract}\n\n';

    return abstract;
  }

  /**
   * Generate main sections
   */
  private generateSections(
    sections: ReportSection[],
    options?: LaTeXExportOptions,
  ): string {
    let latex = '';

    // Use chapters for thesis, sections for other documents
    const isThesis = options?.documentClass === 'thesis';
    const topLevel = isThesis ? 'chapter' : 'section';
    const secondLevel = isThesis ? 'section' : 'subsection';

    // Sort by order
    const sorted = [...sections].sort((a, b) => a.order - b.order);

    for (const section of sorted) {
      // Section heading
      latex += `\\${topLevel}{${this.escapeLatex(section.title)}}\\label{${topLevel === 'chapter' ? 'chap' : 'sec'}:${this.sanitizeLabel(section.id)}}\n\n`;

      // Section content
      latex += this.convertMarkdownToLatex(section.content);
      latex += '\n\n';

      // Subsections
      if (section.subsections && section.subsections.length > 0) {
        for (const subsection of section.subsections) {
          latex += `\\${secondLevel}{${this.escapeLatex(subsection.title)}}\\label{${secondLevel === 'section' ? 'sec' : 'subsec'}:${this.sanitizeLabel(subsection.id)}}\n\n`;
          latex += this.convertMarkdownToLatex(subsection.content);
          latex += '\n\n';
        }
      }
    }

    return latex;
  }

  /**
   * Convert markdown content to LaTeX
   */
  private convertMarkdownToLatex(markdown: string): string {
    let latex = this.escapeLatex(markdown);

    // Headers (already handled in sections)
    latex = latex.replace(/^### (.+)$/gm, '\\subsubsection{$1}');
    latex = latex.replace(/^## (.+)$/gm, '\\subsection{$1}');
    latex = latex.replace(/^# (.+)$/gm, '\\section{$1}');

    // Bold and italic
    latex = latex.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
    latex = latex.replace(/\*(.+?)\*/g, '\\textit{$1}');

    // Lists (bullet)
    latex = latex.replace(/^- (.+)$/gm, '\\item $1');
    latex = latex.replace(/(\\item .+\n)+/g, (match) => {
      return '\\begin{itemize}\n' + match + '\\end{itemize}\n';
    });

    // Tables (basic support)
    latex = this.convertTablesToLatex(latex);

    // Citations (e.g., (Smith, 2023) -> \citep{smith2023})
    latex = latex.replace(/\(([A-Z][a-z]+),\s*(\d{4})\)/g, '\\citep{$1$2}');

    return latex;
  }

  /**
   * Convert markdown tables to LaTeX tables
   */
  private convertTablesToLatex(text: string): string {
    const lines = text.split('\n');
    let result = '';
    let inTable = false;
    let tableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
        }
        tableLines.push(line);
      } else {
        if (inTable) {
          // Process accumulated table
          result += this.createLatexTable(tableLines) + '\n';
          inTable = false;
          tableLines = [];
        }
        result += line + '\n';
      }
    }

    // Handle table at end of text
    if (inTable && tableLines.length > 0) {
      result += this.createLatexTable(tableLines);
    }

    return result;
  }

  /**
   * Create LaTeX table from markdown table lines
   */
  private createLatexTable(lines: string[]): string {
    if (lines.length < 2) return '';

    // Parse header
    const headerCells = lines[0]
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);

    const numCols = headerCells.length;

    let latex = '\\begin{table}[htbp]\n';
    latex += '\\centering\n';
    latex += `\\begin{tabular}{${'l'.repeat(numCols)}}\n`;
    latex += '\\toprule\n';

    // Header row
    latex +=
      headerCells.map((c) => this.escapeLatex(c)).join(' & ') + ' \\\\\n';
    latex += '\\midrule\n';

    // Data rows (skip separator row)
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i]
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c);

      if (cells.length === numCols) {
        latex += cells.map((c) => this.escapeLatex(c)).join(' & ') + ' \\\\\n';
      }
    }

    latex += '\\bottomrule\n';
    latex += '\\end{tabular}\n';
    latex += '\\caption{Table caption}\n';
    latex += '\\label{tab:table}\n';
    latex += '\\end{table}\n';

    return latex;
  }

  /**
   * Generate provenance appendix
   */
  private generateProvenanceAppendix(provenance: ProvenanceChain[]): string {
    let latex = '';

    latex += '\\newpage\n';
    latex += '\\appendix\n';
    latex += '\\section{Statement Provenance}\\label{app:provenance}\n\n';

    latex +=
      'This appendix provides complete lineage information for all statements used in this study, ';
    latex +=
      'showing the path from original literature sources through gap identification, research question ';
    latex +=
      'refinement, hypothesis generation, theme extraction, and final statement formulation.\n\n';

    // Create provenance table
    latex +=
      '\\begin{longtable}{p{0.08\\textwidth}p{0.25\\textwidth}p{0.2\\textwidth}p{0.15\\textwidth}p{0.15\\textwidth}p{0.1\\textwidth}}\n';
    latex += '\\toprule\n';
    latex +=
      '\\textbf{\\#} & \\textbf{Statement} & \\textbf{Source} & \\textbf{Theme} & \\textbf{Gap} & \\textbf{Question} \\\\\n';
    latex += '\\midrule\n';
    latex += '\\endfirsthead\n\n';

    latex +=
      '\\multicolumn{6}{c}{{\\tablename\\ \\thetable{} -- continued from previous page}} \\\\\n';
    latex += '\\toprule\n';
    latex +=
      '\\textbf{\\#} & \\textbf{Statement} & \\textbf{Source} & \\textbf{Theme} & \\textbf{Gap} & \\textbf{Question} \\\\\n';
    latex += '\\midrule\n';
    latex += '\\endhead\n\n';

    latex += '\\midrule\n';
    latex += '\\multicolumn{6}{r}{{Continued on next page}} \\\\\n';
    latex += '\\endfoot\n\n';

    latex += '\\bottomrule\n';
    latex += '\\endlastfoot\n\n';

    // Data rows
    provenance.forEach((chain) => {
      const stmtNum = chain.statement?.statementNumber?.toString() || '-';
      const stmtText = this.escapeLatex(
        chain.statement?.text?.substring(0, 80) || '-',
      );
      const paper = chain.paper
        ? this.escapeLatex(`${chain.paper.authors} (${chain.paper.year})`)
        : 'N/A';
      const theme = this.escapeLatex(chain.theme?.label || 'N/A');
      const gap = this.escapeLatex(
        chain.gap?.description?.substring(0, 40) || 'N/A',
      );
      const question = this.escapeLatex(
        chain.question?.text?.substring(0, 40) || 'N/A',
      );

      latex += `${stmtNum} & ${stmtText} & ${paper} & ${theme} & ${gap} & ${question} \\\\\n`;
    });

    latex += '\\end{longtable}\n\n';

    return latex;
  }

  /**
   * Generate bibliography from citations
   */
  private async generateBibliography(citations: Citation[]): Promise<string> {
    let latex = '';

    // Generate BibTeX entries
    const bibtex = await this.citationManager.generateBibTeX(citations);

    // Write BibTeX to separate file (in comments)
    latex += '% BibTeX entries (save to separate .bib file):\n';
    latex += '% \\begin{filecontents}{references.bib}\n';
    bibtex.split('\n').forEach((line) => {
      latex += `% ${line}\n`;
    });
    latex += '% \\end{filecontents}\n\n';

    // Bibliography section
    latex += '\\bibliographystyle{apalike}\n';
    latex += '\\bibliography{references}\n\n';

    return latex;
  }

  /**
   * Escape special LaTeX characters
   */
  private escapeLatex(text: string): string {
    if (!text) return '';

    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  /**
   * Sanitize label for LaTeX references
   */
  private sanitizeLabel(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
