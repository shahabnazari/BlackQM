import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { LiteratureService } from '../../literature/literature.service';
import { LiteratureComparisonService } from '../../analysis/services/literature-comparison.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { ReportService } from '../report.service';
import { CacheService } from '../../../common/cache.service';

/**
 * Literature-Enhanced Report Service - Phase 9 Day 10
 *
 * Enterprise-grade service that generates comprehensive academic reports
 * by integrating literature review, methodology, analysis, and discussion.
 *
 * Key features:
 * - Auto-populates literature review section from cited papers
 * - Generates citations in correct academic format
 * - Creates bibliography from paper collection
 * - Adds theoretical framework section
 * - Compares findings to existing research
 * - Generates discussion points from research gaps
 *
 * Part of the critical Literature → Analysis → Report pipeline
 */
@Injectable()
export class LiteratureReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly literatureService: LiteratureService,
    private readonly literatureComparisonService: LiteratureComparisonService,
    private readonly openAIService: OpenAIService,
    private readonly reportService: ReportService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Generate comprehensive report with full literature integration
   * This is the main entry point for Phase 10 report generation
   */
  async generateComprehensiveReport(
    studyId: string,
    userId: string,
    format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' = 'apa',
  ) {
    const cacheKey = `comprehensive-report:${studyId}:${format}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Get study with full context
      const study = await this.prisma.survey.findUnique({
        where: { id: studyId },
        include: {
          statements: true,
          researchGap: true,
          researchPipeline: true,
        },
      });

      if (!study) {
        throw new NotFoundException('Study not found');
      }

      // Get analysis results
      const analysisResults = await this.getAnalysisResults(studyId);

      // Get literature comparison
      const literatureComparison = await this.literatureComparisonService.compareFindings(
        studyId,
        analysisResults,
      );

      // Generate each section
      const sections = {
        title: await this.generateTitle(study),
        abstract: await this.generateAbstract(study, analysisResults),
        keywords: await this.generateKeywords(study),
        introduction: await this.generateIntroduction(study, literatureComparison),
        literatureReview: await this.generateLiteratureReview(study),
        theoreticalFramework: await this.generateTheoreticalFramework(study),
        methodology: await this.generateMethodology(study),
        results: await this.generateResults(analysisResults),
        discussion: await this.generateDiscussion(study, literatureComparison),
        conclusions: await this.generateConclusions(study, literatureComparison),
        limitations: await this.generateLimitations(study),
        futureResearch: await this.generateFutureResearch(literatureComparison),
        references: await this.generateBibliography(study, format),
        appendices: await this.generateAppendices(study, analysisResults),
      };

      // Format according to academic style
      const formattedReport = await this.formatReport(sections, format);

      // Cache for 24 hours
      await this.cacheService.set(cacheKey, formattedReport, 86400);

      return formattedReport;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to generate comprehensive report: ${error.message}`,
      );
    }
  }

  /**
   * Auto-populate literature review section
   * Synthesizes information from all cited papers
   */
  async generateLiteratureReview(study: any): Promise<string> {
    if (!study.researchPipeline?.literaturePapers?.length) {
      return this.generateDefaultLiteratureReview(study);
    }

    const papers = study.researchPipeline.literaturePapers;
    const themes = study.researchPipeline.extractedThemes;

    // Group papers by theme
    const papersByTheme = this.groupPapersByTheme(papers, themes);

    // Generate review for each theme
    const thematicReviews = await Promise.all(
      Object.entries(papersByTheme).map(async ([theme, themePapers]) => {
        return this.generateThematicReview(theme, themePapers as any[]);
      }),
    );

    // Generate synthesis
    const synthesis = await this.generateSynthesis(papers, themes);

    // Identify gaps
    const gapAnalysis = await this.generateGapAnalysis(papers, study.researchGap);

    return `
## Literature Review

${thematicReviews.join('\n\n')}

### Synthesis of Literature

${synthesis}

### Identified Research Gaps

${gapAnalysis}

### Justification for Current Study

Based on the comprehensive review of the literature, this study addresses the identified gap of "${study.researchGap?.description || 'unspecified research gap'}" by employing Q-methodology to explore diverse perspectives on ${study.title}.
    `.trim();
  }

  /**
   * Generate citations in correct format
   * Supports APA, MLA, Chicago, IEEE, and Harvard styles
   */
  async generateCitation(paper: any, format: string): Promise<string> {
    const { authors, year, title, journal, volume, issue, pages, doi } = paper;
    const authorList = authors?.join(', ') || 'Unknown Author';

    switch (format) {
      case 'apa':
        return `${authorList} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}. ${doi ? `https://doi.org/${doi}` : ''}`;

      case 'mla':
        return `${authorList}. "${title}." ${journal}${volume ? ` ${volume}` : ''}${issue ? `.${issue}` : ''} (${year})${pages ? `: ${pages}` : ''}. ${doi ? `Web. doi:${doi}` : 'Print'}.`;

      case 'chicago':
        return `${authorList}. "${title}." ${journal} ${volume ? `${volume}` : ''}${issue ? `, no. ${issue}` : ''} (${year})${pages ? `: ${pages}` : ''}. ${doi ? `https://doi.org/${doi}` : ''}`;

      case 'ieee':
        return `[${paper.citationNumber || ''}] ${authorList}, "${title}," ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `, pp. ${pages}` : ''}, ${year}. ${doi ? `doi: ${doi}` : ''}`;

      case 'harvard':
        return `${authorList} ${year}, '${title}', ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `, pp. ${pages}` : ''}. ${doi ? `Available at: https://doi.org/${doi}` : ''}`;

      default:
        return `${authorList} (${year}). ${title}. ${journal}.`;
    }
  }

  /**
   * Create bibliography from paper collection
   * Generates properly formatted reference list
   */
  async generateBibliography(study: any, format: string): Promise<string> {
    const allPapers = new Set<any>();

    // Collect papers from various sources
    if (study.researchPipeline?.literaturePapers) {
      study.researchPipeline.literaturePapers.forEach((p: any) => allPapers.add(p));
    }

    if (study.basedOnPapersIds?.length) {
      const basedOnPapers = await this.prisma.paper.findMany({
        where: { id: { in: study.basedOnPapersIds } },
      });
      basedOnPapers.forEach(p => allPapers.add(p));
    }

    // Sort papers alphabetically by author
    const sortedPapers = Array.from(allPapers).sort((a, b) => {
      const authorA = a.authors?.[0] || 'Unknown';
      const authorB = b.authors?.[0] || 'Unknown';
      return authorA.localeCompare(authorB);
    });

    // Generate citations
    const citations = await Promise.all(
      sortedPapers.map(async (paper, index) => {
        paper.citationNumber = index + 1; // For IEEE format
        return this.generateCitation(paper, format);
      }),
    );

    const header = format === 'apa' ? 'References' :
                   format === 'mla' ? 'Works Cited' :
                   'Bibliography';

    return `
## ${header}

${citations.join('\n\n')}
    `.trim();
  }

  /**
   * Add theoretical framework section
   * Explains the theoretical lens used for the study
   */
  async generateTheoreticalFramework(study: any): Promise<string> {
    const papers = study.researchPipeline?.literaturePapers || [];

    // Extract theoretical concepts
    const theories = await this.extractTheories(papers);

    // Generate framework narrative
    const prompt = `
      Based on these theoretical concepts: ${JSON.stringify(theories)}
      Generate a theoretical framework section for a Q-methodology study on: ${study.title}

      Include:
      1. Main theoretical perspectives
      2. How they relate to the research questions
      3. How Q-methodology helps explore these theories
      4. Key concepts and definitions
    `;

    const frameworkResponse = await this.openAIService.generateCompletion(prompt);

    return `
## Theoretical Framework

${frameworkResponse.content}

### Application to Q-Methodology

Q-methodology is particularly suited to explore these theoretical perspectives as it allows for the systematic study of subjectivity. By examining how participants sort statements derived from the literature, we can identify distinct viewpoints that may align with or challenge existing theoretical frameworks.

The theoretical lens guides both the statement generation process and the interpretation of emergent factors, ensuring that findings are grounded in established scholarly discourse while remaining open to novel perspectives.
    `.trim();
  }

  /**
   * Generate methodology section with statement provenance
   * Documents how statements were derived from literature
   */
  async generateMethodology(study: any): Promise<string> {
    const statements = study.statements || [];
    const statementsWithProvenance = await this.getStatementProvenance(statements);

    return `
## Methodology

### Research Design

This study employed Q-methodology to investigate subjective viewpoints on ${study.title}. Q-methodology combines qualitative and quantitative approaches to systematically study human subjectivity (Brown, 1980; Watts & Stenner, 2012).

### Statement Development

The Q-set consisted of ${statements.length} statements developed through a systematic process:

1. **Literature-Based Extraction**: Statements were derived from key themes identified in ${study.researchPipeline?.literaturePapers?.length || 0} academic papers
2. **Theme Coverage**: Statements ensured coverage of ${study.researchPipeline?.extractedThemes?.length || 0} major themes
3. **Balance and Representation**: Statements represented diverse perspectives including ${this.categorizeStatements(statementsWithProvenance)}

### Statement Provenance

Each statement can be traced to specific sources in the literature:
${this.generateProvenanceTable(statementsWithProvenance.slice(0, 5))}

### Q-Sort Procedure

Participants were asked to sort the ${statements.length} statements according to their level of agreement using a quasi-normal distribution grid ranging from ${study.gridConfig?.minValue || -4} to ${study.gridConfig?.maxValue || 4}.

### Participants

${study.targetParticipants || 'Target participants'} were recruited using ${study.recruitmentMethod || 'purposive sampling'}. The final sample consisted of ${study.participantCount || 'N'} participants.

### Data Analysis

Factor analysis was performed using centroid factor extraction followed by varimax rotation. The number of factors was determined using parallel analysis and scree plot examination.
    `.trim();
  }

  /**
   * Generate discussion comparing with literature
   * Creates intelligent discussion based on literature comparison
   */
  async generateDiscussion(study: any, comparison: any): Promise<string> {
    const discussionPoints = comparison.discussionPoints || [];
    const summary = comparison.summary || {};

    let discussion = '## Discussion\n\n';

    // Main findings summary
    discussion += `### Summary of Main Findings\n\n`;
    discussion += `This study identified ${summary.novelFindings?.length || 0} novel findings, `;
    discussion += `${summary.confirmatoryFindings?.length || 0} confirmatory findings, `;
    discussion += `and ${summary.contradictoryFindings?.length || 0} findings that challenge existing literature.\n\n`;

    // Add each discussion point
    for (const point of discussionPoints) {
      discussion += `### ${point.title}\n\n`;
      discussion += `${point.content}\n\n`;

      if (point.citations?.length) {
        discussion += `Relevant citations: ${point.citations.join('; ')}\n\n`;
      }
    }

    // Theoretical implications
    if (comparison.theoreticalAlignment) {
      discussion += `### Theoretical Implications\n\n`;
      discussion += await this.generateTheoreticalImplications(comparison.theoreticalAlignment);
      discussion += '\n\n';
    }

    // Practical implications
    discussion += `### Practical Implications\n\n`;
    discussion += await this.generatePracticalImplications(study, comparison);

    return discussion;
  }

  // Private helper methods

  private async getAnalysisResults(studyId: string) {
    // Get analysis results from database or service
    try {
      const results = await this.prisma.analysisResult.findFirst({
        where: { surveyId: studyId },
      });
      return results || {};
    } catch (error) {
      console.warn('No analysis results found for study:', studyId);
      return {};
    }
  }

  private groupPapersByTheme(papers: any[], themes: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const theme of themes || []) {
      grouped[theme.name] = papers.filter(p =>
        p.themes?.some((t: any) => t.id === theme.id)
      );
    }

    // Add papers without themes
    const unthemed = papers.filter(p => !p.themes || p.themes.length === 0);
    if (unthemed.length > 0) {
      grouped['General'] = unthemed;
    }

    return grouped;
  }

  private async generateThematicReview(theme: string, papers: any[]): Promise<string> {
    if (papers.length === 0) return '';

    const paperSummaries = papers.map(p => ({
      authors: p.authors?.join(', '),
      year: p.year,
      key_finding: p.abstract?.substring(0, 200),
    }));

    const prompt = `
      Generate a thematic literature review paragraph for the theme "${theme}"
      based on these papers: ${JSON.stringify(paperSummaries)}

      Write in academic style, synthesizing findings rather than listing them.
      Include in-text citations in (Author, Year) format.
    `;

    const reviewResponse = await this.openAIService.generateCompletion(prompt);

    return `### ${theme}\n\n${reviewResponse.content}`;
  }

  private async generateSynthesis(papers: any[], themes: any[]): Promise<string> {
    const prompt = `
      Synthesize the following research themes into a coherent narrative:
      Themes: ${themes?.map(t => t.name).join(', ')}
      Number of papers reviewed: ${papers.length}

      Create a synthesis paragraph that:
      1. Identifies common threads across the literature
      2. Notes areas of consensus and disagreement
      3. Highlights the evolution of thought over time
      4. Identifies emerging trends
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }

  private async generateGapAnalysis(papers: any[], gap: any): Promise<string> {
    const prompt = `
      Based on ${papers.length} reviewed papers and the identified research gap:
      "${gap?.description || 'No specific gap identified'}"

      Write a paragraph explaining:
      1. What the literature currently addresses
      2. What remains unexplored or contentious
      3. Why this gap is significant
      4. How Q-methodology can address this gap
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }

  private async generateDefaultLiteratureReview(study: any): Promise<string> {
    return `
## Literature Review

While a comprehensive literature review was not conducted using the integrated literature system, existing research on ${study.title} suggests multiple perspectives that warrant investigation through Q-methodology.

Q-methodology is particularly suited for this investigation as it allows for the systematic study of subjectivity and the identification of shared viewpoints among participants.
    `.trim();
  }

  private async extractTheories(papers: any[]): Promise<string[]> {
    const theories = new Set<string>();

    // Extract theory mentions from abstracts
    const theoryKeywords = [
      'theory', 'framework', 'model', 'paradigm', 'approach',
      'perspective', 'lens', 'construct', 'concept'
    ];

    for (const paper of papers) {
      if (paper.abstract) {
        for (const keyword of theoryKeywords) {
          const regex = new RegExp(`(\\w+\\s+)?${keyword}`, 'gi');
          const matches = paper.abstract.match(regex);
          if (matches) {
            matches.forEach((m: string) => theories.add(m.trim()));
          }
        }
      }
    }

    return Array.from(theories).slice(0, 10);
  }

  private async getStatementProvenance(statements: any[]): Promise<any[]> {
    // Get provenance information for statements
    return Promise.all(
      statements.map(async (statement) => {
        const provenance = await this.prisma.statementProvenance.findFirst({
          where: { statementId: statement.id },
          include: {
            sourcePaper: true,
            sourceTheme: true,
          },
        });

        return {
          ...statement,
          provenance,
        };
      })
    );
  }

  private categorizeStatements(statements: any[]): string {
    const categories = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    // Simplified categorization - could be enhanced with NLP
    for (const stmt of statements) {
      if (stmt.text?.includes('not') || stmt.text?.includes('disagree')) {
        categories.negative++;
      } else if (stmt.text?.includes('agree') || stmt.text?.includes('support')) {
        categories.positive++;
      } else {
        categories.neutral++;
      }
    }

    return `${categories.positive} positive, ${categories.negative} negative, and ${categories.neutral} neutral perspectives`;
  }

  private generateProvenanceTable(statements: any[]): string {
    let table = '\n| Statement | Source | Theme |\n|-----------|--------|-------|\n';

    for (const stmt of statements) {
      const text = stmt.text?.substring(0, 50) + '...';
      const source = stmt.provenance?.sourcePaper?.title || 'Generated';
      const theme = stmt.provenance?.sourceTheme?.name || 'N/A';
      table += `| ${text} | ${source} | ${theme} |\n`;
    }

    return table;
  }

  private async generateTitle(study: any): Promise<string> {
    return study.title || 'Untitled Q-Methodology Study';
  }

  private async generateAbstract(study: any, results: any): Promise<string> {
    const prompt = `
      Generate a 250-word academic abstract for this Q-methodology study:
      Title: ${study.title}
      Participants: ${study.participantCount || 'N'}
      Factors identified: ${results.factors?.length || 0}

      Include: Purpose, Methods, Results, Conclusions
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }

  private async generateKeywords(study: any): Promise<string> {
    const keywords = [
      'Q-methodology',
      study.field || 'research',
      ...study.researchPipeline?.extractedThemes?.map((t: any) => t.name) || [],
    ].slice(0, 6);

    return `**Keywords:** ${keywords.join(', ')}`;
  }

  private async generateIntroduction(study: any, comparison: any): Promise<string> {
    const prompt = `
      Generate an introduction section for this Q-methodology study:
      Topic: ${study.title}
      Research Gap: ${study.researchGap?.description}
      Novel findings: ${comparison.summary?.novelFindings?.length || 0}

      Include:
      1. Problem statement
      2. Research significance
      3. Research questions
      4. Study objectives
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }

  private async generateResults(results: any): Promise<string> {
    let resultsSection = '## Results\n\n';

    if (results.factors?.length) {
      resultsSection += `### Factor Structure\n\n`;
      resultsSection += `The analysis revealed ${results.factors.length} distinct factors accounting for ${results.totalVariance || 'X'}% of the variance.\n\n`;

      for (const factor of results.factors) {
        resultsSection += `#### Factor ${factor.number}: ${factor.label || 'Unnamed'}\n\n`;
        resultsSection += `This factor explains ${factor.variance}% of the variance and represents the viewpoint of ${factor.participantCount || 'N'} participants.\n\n`;
      }
    }

    if (results.consensus?.length) {
      resultsSection += `### Consensus Statements\n\n`;
      resultsSection += `${results.consensus.length} statements showed consensus across all factors.\n\n`;
    }

    if (results.distinguishing?.length) {
      resultsSection += `### Distinguishing Statements\n\n`;
      resultsSection += `${results.distinguishing.length} statements significantly distinguished between factors.\n\n`;
    }

    return resultsSection;
  }

  private async generateConclusions(study: any, comparison: any): Promise<string> {
    const prompt = `
      Generate conclusions for this Q-methodology study:
      Main findings: ${comparison.summary?.novelFindings?.length || 0} novel, ${comparison.summary?.confirmatoryFindings?.length || 0} confirmatory
      Research gap addressed: ${study.researchGap?.description}

      Include:
      1. Summary of key findings
      2. Contribution to knowledge
      3. Addressing the research questions
      4. Final thoughts
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }

  private async generateLimitations(study: any): Promise<string> {
    return `
## Limitations

This study has several limitations that should be considered when interpreting the results:

1. **Sample Size**: The study included ${study.participantCount || 'N'} participants, which may limit generalizability.
2. **Geographic Scope**: Participants were primarily from ${study.location || 'a specific geographic region'}.
3. **Q-Sort Constraints**: The forced distribution may have constrained participants' ability to express their views fully.
4. **Statement Selection**: While statements were derived from literature, the selection process may not capture all relevant perspectives.
5. **Temporal Factors**: Data was collected during ${study.dataCollectionPeriod || 'a specific time period'}, which may influence responses.
    `.trim();
  }

  private async generateFutureResearch(comparison: any): Promise<string> {
    const suggestions = comparison.discussionPoints
      ?.filter((p: any) => p.type === 'future_research')
      .map((p: any) => p.content)
      .join('\n\n') || 'Future research should explore the generalizability of these findings.';

    return `
## Suggestions for Future Research

${suggestions}

Additional avenues for investigation include:
- Replication with diverse populations
- Longitudinal studies to track viewpoint evolution
- Cross-cultural comparisons
- Integration with other methodologies
    `.trim();
  }

  private async generateAppendices(study: any, results: any): Promise<string> {
    return `
## Appendices

### Appendix A: Q-Sort Statements
[Full list of ${study.statements?.length || 0} statements]

### Appendix B: Q-Sort Grid Configuration
[Grid structure with ${study.gridConfig?.columns || 'distribution'} configuration]

### Appendix C: Factor Arrays
[Complete factor arrays for all ${results.factors?.length || 0} identified factors]

### Appendix D: Statistical Tables
[Correlation matrices, factor loadings, and other statistical outputs]
    `.trim();
  }

  private async formatReport(sections: any, format: string): Promise<any> {
    // Format the report according to academic style guide
    const orderedSections = [
      sections.title,
      sections.abstract,
      sections.keywords,
      sections.introduction,
      sections.literatureReview,
      sections.theoreticalFramework,
      sections.methodology,
      sections.results,
      sections.discussion,
      sections.conclusions,
      sections.limitations,
      sections.futureResearch,
      sections.references,
      sections.appendices,
    ];

    const fullReport = orderedSections.filter(s => s).join('\n\n---\n\n');

    return {
      format,
      content: fullReport,
      metadata: {
        generatedAt: new Date().toISOString(),
        wordCount: fullReport.split(/\s+/).length,
        sections: Object.keys(sections).length,
        style: format.toUpperCase(),
      },
    };
  }

  private async generateTheoreticalImplications(alignment: any): Promise<string> {
    const implications = [];

    if (alignment.aligned?.length) {
      implications.push(`The findings align with ${alignment.aligned.length} theoretical frameworks, providing empirical support.`);
    }

    if (alignment.contradictory?.length) {
      implications.push(`Some findings challenge existing theory, suggesting the need for theoretical refinement.`);
    }

    if (alignment.novel?.length) {
      implications.push(`Novel findings suggest new theoretical directions not previously considered.`);
    }

    return implications.join(' ');
  }

  private async generatePracticalImplications(study: any, comparison: any): Promise<string> {
    const prompt = `
      Generate practical implications based on:
      Study topic: ${study.title}
      Novel findings: ${comparison.summary?.novelFindings?.length || 0}
      Target audience: ${study.targetAudience || 'practitioners'}

      Focus on actionable insights and real-world applications.
    `;

    const response = await this.openAIService.generateCompletion(prompt);
    return response.content;
  }
}