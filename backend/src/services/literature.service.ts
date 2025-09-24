/**
 * Literature Service - DISCOVER Phase
 * World-class implementation for academic literature discovery
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../common/prisma.service';

export interface LiteratureSearchParams {
  query: string;
  yearRange?: [number, number];
  journals?: string[];
  authors?: string[];
  keywords?: string[];
  citationMin?: number;
  qMethodologyOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  citations: number;
  doi: string;
  keywords: string[];
  relevanceScore?: number;
  qMethodology?: boolean;
  fullText?: string;
  references?: string[];
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  relatedPapers: string[];
  importance: 'high' | 'medium' | 'low';
  suggestedMethods: string[];
  estimatedImpact: number;
}

@Injectable()
export class LiteratureService {
  private readonly logger = new Logger(LiteratureService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Search academic literature across multiple databases
   */
  async searchLiterature(params: LiteratureSearchParams): Promise<Paper[]> {
    try {
      const papers: Paper[] = [];

      // Search multiple sources in parallel
      const searchPromises = [
        this.searchCrossRef(params),
        this.searchPubMed(params),
        this.searchArXiv(params),
        this.searchSemanticScholar(params),
      ];

      const results = await Promise.allSettled(searchPromises);

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          papers.push(...result.value);
        }
      });

      // Remove duplicates based on DOI
      const uniquePapers = this.deduplicatePapers(papers);

      // Calculate relevance scores
      const scoredPapers = this.calculateRelevanceScores(uniquePapers, params);

      // Sort by relevance
      scoredPapers.sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
      );

      // Apply limit and offset
      const limit = params.limit || 20;
      const offset = params.offset || 0;

      return scoredPapers.slice(offset, offset + limit);
    } catch (error: any) {
      this.logger.error('Literature search failed', error);
      throw new Error('Failed to search literature');
    }
  }

  /**
   * Search CrossRef database
   */
  private async searchCrossRef(
    params: LiteratureSearchParams,
  ): Promise<Paper[]> {
    try {
      const baseUrl = 'https://api.crossref.org/works';
      const queryParams = new URLSearchParams({
        query: params.query,
        rows: '100',
      });

      if (params.yearRange) {
        queryParams.append(
          'filter',
          `from-pub-date:${params.yearRange[0]},until-pub-date:${params.yearRange[1]}`,
        );
      }

      const response: any = await firstValueFrom(
        this.httpService.get(`${baseUrl}?${queryParams}`),
      );

      return response.data.message.items.map((item: any) => ({
        id: item.DOI,
        title: item.title?.[0] || '',
        authors: (item.author || []).map((a: any) => `${a.given} ${a.family}`),
        year: item.published?.['date-parts']?.[0]?.[0] || 0,
        journal: item['container-title']?.[0] || '',
        abstract: item.abstract || '',
        citations: item['is-referenced-by-count'] || 0,
        doi: item.DOI,
        keywords: item.subject || [],
        qMethodology: this.detectQMethodology(item),
      }));
    } catch (error: any) {
      this.logger.warn('CrossRef search failed', error);
      return [];
    }
  }

  /**
   * Search PubMed database
   */
  private async searchPubMed(params: LiteratureSearchParams): Promise<Paper[]> {
    try {
      // PubMed E-utilities API
      const searchUrl =
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
      const fetchUrl =
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

      // Build search query
      let searchQuery = params.query;
      if (params.qMethodologyOnly) {
        searchQuery +=
          ' AND ("Q methodology" OR "Q-methodology" OR "Q sort" OR "Q-sort")';
      }

      // Search for IDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: searchQuery,
        retmax: '100',
        retmode: 'json',
      });

      const searchResponse: any = await firstValueFrom(
        this.httpService.get(`${searchUrl}?${searchParams}`),
      );

      if (!searchResponse.data.esearchresult?.idlist?.length) {
        return [];
      }

      // Fetch full records
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: searchResponse.data.esearchresult.idlist.join(','),
        retmode: 'xml',
      });

      const fetchResponse: any = await firstValueFrom(
        this.httpService.get(`${fetchUrl}?${fetchParams}`),
      );

      // Parse XML response (simplified)
      return this.parsePubMedXML(fetchResponse.data);
    } catch (error: any) {
      this.logger.warn('PubMed search failed', error);
      return [];
    }
  }

  /**
   * Search arXiv database
   */
  private async searchArXiv(params: LiteratureSearchParams): Promise<Paper[]> {
    try {
      const baseUrl = 'http://export.arxiv.org/api/query';
      const queryParams = new URLSearchParams({
        search_query: `all:${params.query}`,
        max_results: '100',
      });

      const response: any = await firstValueFrom(
        this.httpService.get(`${baseUrl}?${queryParams}`),
      );

      // Parse XML response (simplified - would need proper XML parsing)
      return this.parseArXivXML(response.data);
    } catch (error: any) {
      this.logger.warn('arXiv search failed', error);
      return [];
    }
  }

  /**
   * Search Semantic Scholar
   */
  private async searchSemanticScholar(
    params: LiteratureSearchParams,
  ): Promise<Paper[]> {
    try {
      const baseUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
      const queryParams = new URLSearchParams({
        query: params.query,
        limit: '100',
        fields:
          'title,authors,year,abstract,citationCount,externalIds,fieldsOfStudy',
      });

      if (params.yearRange) {
        queryParams.append(
          'year',
          `${params.yearRange[0]}-${params.yearRange[1]}`,
        );
      }

      const response: any = await firstValueFrom(
        this.httpService.get(`${baseUrl}?${queryParams}`),
      );

      return response.data.data.map((item: any) => ({
        id: item.paperId,
        title: item.title,
        authors: (item.authors || []).map((a: any) => a.name),
        year: item.year || 0,
        journal: '', // Not provided by Semantic Scholar
        abstract: item.abstract || '',
        citations: item.citationCount || 0,
        doi: item.externalIds?.DOI || '',
        keywords: item.fieldsOfStudy || [],
        qMethodology: this.detectQMethodologyFromText(
          item.title + ' ' + item.abstract,
        ),
      }));
    } catch (error: any) {
      this.logger.warn('Semantic Scholar search failed', error);
      return [];
    }
  }

  /**
   * Detect if a paper is about Q methodology
   */
  private detectQMethodology(item: any): boolean {
    const qTerms = [
      'q methodology',
      'q-methodology',
      'q sort',
      'q-sort',
      'q method',
      'q-method',
    ];
    const textToSearch = [
      item.title?.[0] || '',
      item.abstract || '',
      ...(item.subject || []),
    ]
      .join(' ')
      .toLowerCase();

    return qTerms.some((term) => textToSearch.includes(term));
  }

  /**
   * Detect Q methodology from text
   */
  private detectQMethodologyFromText(text: string): boolean {
    const qTerms = [
      'q methodology',
      'q-methodology',
      'q sort',
      'q-sort',
      'q method',
      'q-method',
    ];
    const lowerText = text.toLowerCase();
    return qTerms.some((term) => lowerText.includes(term));
  }

  /**
   * Remove duplicate papers based on DOI
   */
  private deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Set<string>();
    return papers.filter((paper) => {
      if (!paper.doi || seen.has(paper.doi)) {
        return false;
      }
      seen.add(paper.doi);
      return true;
    });
  }

  /**
   * Calculate relevance scores for papers
   */
  private calculateRelevanceScores(
    papers: Paper[],
    params: LiteratureSearchParams,
  ): Paper[] {
    const queryTerms = params.query.toLowerCase().split(/\s+/);

    return papers.map((paper) => {
      let score = 0;
      const paperText = [paper.title, paper.abstract, ...paper.keywords]
        .join(' ')
        .toLowerCase();

      // Term frequency scoring
      queryTerms.forEach((term) => {
        const matches = (paperText.match(new RegExp(term, 'g')) || []).length;
        score += matches * 0.1;
      });

      // Citation boost
      score += Math.log10(paper.citations + 1) * 0.2;

      // Recency boost
      const age = new Date().getFullYear() - paper.year;
      score += Math.max(0, 1 - age / 20) * 0.1;

      // Q methodology boost if requested
      if (params.qMethodologyOnly && paper.qMethodology) {
        score += 0.3;
      }

      return {
        ...paper,
        relevanceScore: Math.min(1, score),
      };
    });
  }

  /**
   * Analyze research gaps in a field
   */
  async analyzeResearchGaps(params: {
    field: string;
    papers: Paper[];
    minGapSize?: number;
  }): Promise<ResearchGap[]> {
    try {
      // Analyze papers to identify gaps
      const gaps: ResearchGap[] = [];

      // Group papers by topics/methods
      const topicClusters = this.clusterPapersByTopic(params.papers);

      // Identify underexplored areas
      topicClusters.forEach((cluster, topic) => {
        if (cluster.length < (params.minGapSize || 3)) {
          gaps.push({
            id: `gap-${Date.now()}-${Math.random()}`,
            title: `Limited research on ${topic}`,
            description: `Only ${cluster.length} papers found on this topic, suggesting an opportunity for further research.`,
            relatedPapers: cluster.map((p) => p.id),
            importance: cluster.length === 0 ? 'high' : 'medium',
            suggestedMethods: [
              'Q methodology',
              'Mixed methods',
              'Systematic review',
            ],
            estimatedImpact: this.estimateGapImpact(cluster, params.papers),
          });
        }
      });

      // Identify methodological gaps
      const methodGaps = this.identifyMethodologicalGaps(params.papers);
      gaps.push(...methodGaps);

      return gaps;
    } catch (error: any) {
      this.logger.error('Research gap analysis failed', error);
      throw new Error('Failed to analyze research gaps');
    }
  }

  /**
   * Cluster papers by topic using simple keyword analysis
   */
  private clusterPapersByTopic(papers: Paper[]): Map<string, Paper[]> {
    const clusters = new Map<string, Paper[]>();

    papers.forEach((paper) => {
      paper.keywords.forEach((keyword) => {
        if (!clusters.has(keyword)) {
          clusters.set(keyword, []);
        }
        clusters.get(keyword)!.push(paper);
      });
    });

    return clusters;
  }

  /**
   * Identify methodological gaps
   */
  private identifyMethodologicalGaps(papers: Paper[]): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    const methods = new Map<string, number>();

    // Count methodology mentions
    papers.forEach((paper) => {
      if (paper.abstract.toLowerCase().includes('quantitative')) {
        methods.set('quantitative', (methods.get('quantitative') || 0) + 1);
      }
      if (paper.abstract.toLowerCase().includes('qualitative')) {
        methods.set('qualitative', (methods.get('qualitative') || 0) + 1);
      }
      if (paper.qMethodology) {
        methods.set('q-methodology', (methods.get('q-methodology') || 0) + 1);
      }
    });

    // Check for underused methods
    if ((methods.get('q-methodology') || 0) < papers.length * 0.1) {
      gaps.push({
        id: `gap-qmethod-${Date.now()}`,
        title: 'Q Methodology underutilized in this field',
        description:
          'Q methodology could provide unique insights into subjective viewpoints in this research area.',
        relatedPapers: papers.filter((p) => p.qMethodology).map((p) => p.id),
        importance: 'high',
        suggestedMethods: ['Q methodology'],
        estimatedImpact: 0.8,
      });
    }

    return gaps;
  }

  /**
   * Estimate the impact of filling a research gap
   */
  private estimateGapImpact(gapPapers: Paper[], allPapers: Paper[]): number {
    if (gapPapers.length === 0) return 0.9;

    const avgCitations =
      gapPapers.reduce((sum, p) => sum + p.citations, 0) / gapPapers.length;
    const overallAvgCitations =
      allPapers.reduce((sum, p) => sum + p.citations, 0) / allPapers.length;

    return Math.min(1, avgCitations / (overallAvgCitations + 1));
  }

  /**
   * Save paper to user's library
   */
  async savePaperToLibrary(userId: string, paper: Paper): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO user_library (user_id, paper_id, paper_data, saved_at)
        VALUES (${userId}, ${paper.id}, ${JSON.stringify(paper)}, NOW())
        ON CONFLICT (user_id, paper_id) DO NOTHING
      `;
    } catch (error: any) {
      this.logger.error('Failed to save paper to library', error);
      throw new Error('Failed to save paper');
    }
  }

  /**
   * Export papers in various formats
   */
  async exportPapers(
    papers: Paper[],
    format: 'bibtex' | 'ris' | 'json',
  ): Promise<string> {
    switch (format) {
      case 'bibtex':
        return this.exportAsBibtex(papers);
      case 'ris':
        return this.exportAsRIS(papers);
      case 'json':
        return JSON.stringify(papers, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export papers as BibTeX
   */
  private exportAsBibtex(papers: Paper[]): string {
    return papers
      .map((paper) => {
        const type = paper.journal ? '@article' : '@misc';
        const key = paper.doi?.replace(/[^\w]/g, '_') || `paper_${paper.id}`;

        return `${type}{${key},
  title = {${paper.title}},
  author = {${paper.authors.join(' and ')}},
  year = {${paper.year}},
  journal = {${paper.journal}},
  doi = {${paper.doi}},
  abstract = {${paper.abstract}}
}`;
      })
      .join('\n\n');
  }

  /**
   * Export papers as RIS
   */
  private exportAsRIS(papers: Paper[]): string {
    return papers
      .map((paper) => {
        return `TY  - JOUR
TI  - ${paper.title}
AU  - ${paper.authors.join('\nAU  - ')}
PY  - ${paper.year}
JO  - ${paper.journal}
DO  - ${paper.doi}
AB  - ${paper.abstract}
KW  - ${paper.keywords.join('\nKW  - ')}
ER  -`;
      })
      .join('\n\n');
  }

  /**
   * Parse PubMed XML response (simplified implementation)
   */
  private parsePubMedXML(xml: string): Paper[] {
    // This would need proper XML parsing library
    // Simplified placeholder implementation
    return [];
  }

  /**
   * Parse arXiv XML response (simplified implementation)
   */
  private parseArXivXML(xml: string): Paper[] {
    // This would need proper XML parsing library
    // Simplified placeholder implementation
    return [];
  }
}
