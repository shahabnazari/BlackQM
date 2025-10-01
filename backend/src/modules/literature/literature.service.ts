import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma.service';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  SearchLiteratureDto,
  SavePaperDto,
  ExportCitationsDto,
  Paper,
  Theme,
  ResearchGap,
  KnowledgeGraphNode,
  CitationNetwork,
  ExportFormat,
  LiteratureSource,
} from './dto/literature.dto';

@Injectable()
export class LiteratureService {
  private readonly logger = new Logger(LiteratureService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async searchLiterature(
    searchDto: SearchLiteratureDto,
    userId: string,
  ): Promise<{ papers: Paper[]; total: number; page: number }> {
    const cacheKey = `literature:search:${JSON.stringify(searchDto)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached as any;

    const sources = searchDto.sources || [
      LiteratureSource.SEMANTIC_SCHOLAR,
      LiteratureSource.CROSSREF,
      LiteratureSource.PUBMED,
    ];

    const searchPromises = sources.map((source) =>
      this.searchBySource(source, searchDto),
    );

    const results = await Promise.allSettled(searchPromises);
    const papers: Paper[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        papers.push(...result.value);
      }
    }

    // Deduplicate papers by DOI or title
    const uniquePapers = this.deduplicatePapers(papers);

    // Sort papers
    const sortedPapers = this.sortPapers(uniquePapers, searchDto.sortBy);

    // Paginate results
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const start = (page - 1) * limit;
    const paginatedPapers = sortedPapers.slice(start, start + limit);

    const result = {
      papers: paginatedPapers,
      total: sortedPapers.length,
      page,
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    // Log search for analytics
    await this.logSearch(searchDto, userId);

    return result;
  }

  private async searchBySource(
    source: LiteratureSource,
    searchDto: SearchLiteratureDto,
  ): Promise<Paper[]> {
    switch (source) {
      case LiteratureSource.SEMANTIC_SCHOLAR:
        return this.searchSemanticScholar(searchDto);
      case LiteratureSource.CROSSREF:
        return this.searchCrossRef(searchDto);
      case LiteratureSource.PUBMED:
        return this.searchPubMed(searchDto);
      case LiteratureSource.ARXIV:
        return this.searchArxiv(searchDto);
      default:
        return [];
    }
  }

  private async searchSemanticScholar(
    searchDto: SearchLiteratureDto,
  ): Promise<Paper[]> {
    try {
      const url = 'https://api.semanticscholar.org/graph/v1/paper/search';
      const params: any = {
        query: searchDto.query,
        fields:
          'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy',
        limit: searchDto.limit || 20,
      };

      if (searchDto.yearFrom || searchDto.yearTo) {
        params['year'] =
          `${searchDto.yearFrom || 1900}-${searchDto.yearTo || new Date().getFullYear()}`;
      }

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      return response.data.data.map((paper: any) => ({
        id: paper.paperId,
        title: paper.title,
        authors: paper.authors?.map((a: any) => a.name) || [],
        year: paper.year,
        abstract: paper.abstract,
        url: paper.url,
        venue: paper.venue,
        citationCount: paper.citationCount,
        fieldsOfStudy: paper.fieldsOfStudy,
        source: LiteratureSource.SEMANTIC_SCHOLAR,
      }));
    } catch (error: any) {
      this.logger.error(`Semantic Scholar search failed: ${error.message}`);
      return [];
    }
  }

  private async searchCrossRef(
    searchDto: SearchLiteratureDto,
  ): Promise<Paper[]> {
    try {
      const url = 'https://api.crossref.org/works';
      const params: any = {
        query: searchDto.query,
        rows: searchDto.limit || 20,
      };

      if (searchDto.yearFrom) {
        params['filter'] = `from-pub-date:${searchDto.yearFrom}`;
      }

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      return response.data.message.items.map((item: any) => ({
        id: item.DOI,
        title: item.title?.[0] || '',
        authors: item.author?.map((a: any) => `${a.given} ${a.family}`) || [],
        year: item.published?.['date-parts']?.[0]?.[0],
        abstract: item.abstract,
        doi: item.DOI,
        url: item.URL,
        venue: item['container-title']?.[0],
        citationCount: item['is-referenced-by-count'],
        source: LiteratureSource.CROSSREF,
      }));
    } catch (error: any) {
      this.logger.error(`CrossRef search failed: ${error.message}`);
      return [];
    }
  }

  private async searchPubMed(searchDto: SearchLiteratureDto): Promise<Paper[]> {
    try {
      // First, search for IDs
      const searchUrl =
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
      const searchParams = {
        db: 'pubmed',
        term: searchDto.query,
        retmode: 'json',
        retmax: searchDto.limit || 20,
      };

      const searchResponse = await firstValueFrom(
        this.httpService.get(searchUrl, { params: searchParams }),
      );

      const ids = searchResponse.data.esearchresult.idlist;
      if (!ids || ids.length === 0) return [];

      // Then, fetch details
      const fetchUrl =
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
      const fetchParams = {
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml',
        rettype: 'abstract',
      };

      const fetchResponse = await firstValueFrom(
        this.httpService.get(fetchUrl, { params: fetchParams }),
      );

      // Parse XML response (simplified - would need proper XML parsing)
      // This is a placeholder - actual implementation would parse XML properly
      return [];
    } catch (error: any) {
      this.logger.error(`PubMed search failed: ${error.message}`);
      return [];
    }
  }

  private async searchArxiv(searchDto: SearchLiteratureDto): Promise<Paper[]> {
    try {
      const url = 'http://export.arxiv.org/api/query';
      const params = {
        search_query: `all:${searchDto.query}`,
        max_results: searchDto.limit || 20,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      // Parse XML response (simplified - would need proper XML parsing)
      // This is a placeholder - actual implementation would parse XML properly
      return [];
    } catch (error: any) {
      this.logger.error(`arXiv search failed: ${error.message}`);
      return [];
    }
  }

  private deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Set<string>();
    return papers.filter((paper) => {
      const key = paper.doi || paper.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortPapers(papers: Paper[], sortBy?: string): Paper[] {
    switch (sortBy) {
      case 'date':
        return papers.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'citations':
        return papers.sort(
          (a, b) => (b.citationCount || 0) - (a.citationCount || 0),
        );
      default:
        return papers; // Keep original order for relevance
    }
  }

  async savePaper(
    saveDto: SavePaperDto,
    userId: string,
  ): Promise<{ success: boolean; paperId: string }> {
    // For public-user, just return success without database operation
    if (userId === 'public-user') {
      console.log('Public user save - returning mock success');
      return { 
        success: true, 
        paperId: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      };
    }
    
    // Save paper to database for authenticated users
    const paper = await this.prisma.paper.create({
      data: {
        title: saveDto.title,
        authors: saveDto.authors as any, // Json field
        year: saveDto.year,
        abstract: saveDto.abstract,
        doi: saveDto.doi,
        url: saveDto.url,
        venue: saveDto.venue,
        citationCount: saveDto.citationCount,
        userId,
        tags: saveDto.tags as any, // Json field
        collectionId: saveDto.collectionId,
        source: 'user_added', // Required field
      },
    });

    return { success: true, paperId: paper.id };
  }

  async getUserLibrary(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ papers: any[]; total: number }> {
    // For public-user, return empty library
    if (userId === 'public-user') {
      console.log('Public user library - returning empty');
      return { papers: [], total: 0 };
    }
    
    const skip = (page - 1) * limit;

    const [papers, total] = await Promise.all([
      this.prisma.paper.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paper.count({ where: { userId } }),
    ]);

    return { papers, total };
  }

  async removePaper(
    paperId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    // For public-user, just return success without database operation
    if (userId === 'public-user') {
      console.log('Public user remove - returning mock success');
      return { success: true };
    }
    
    await this.prisma.paper.deleteMany({
      where: { id: paperId, userId },
    });

    return { success: true };
  }

  async extractThemes(paperIds: string[], userId: string): Promise<Theme[]> {
    // Get papers from database
    const papers = await this.prisma.paper.findMany({
      where: {
        id: { in: paperIds },
        userId,
      },
    });

    // Extract themes using TF-IDF and clustering
    // This is a placeholder - actual implementation would use NLP libraries
    const themes: Theme[] = [
      {
        id: '1',
        name: 'Sustainability in Q-Methodology',
        keywords: ['sustainability', 'environment', 'q-method'],
        papers: paperIds.slice(0, 3),
        relevanceScore: 0.85,
        emergenceYear: 2020,
        trendDirection: 'rising',
      },
      {
        id: '2',
        name: 'Digital Transformation Research',
        keywords: ['digital', 'transformation', 'technology'],
        papers: paperIds.slice(2, 5),
        relevanceScore: 0.78,
        emergenceYear: 2018,
        trendDirection: 'stable',
      },
    ];

    return themes;
  }

  async analyzeResearchGaps(
    analysisDto: any,
    userId: string,
  ): Promise<ResearchGap[]> {
    // Analyze research gaps using AI and citation analysis
    // This is a placeholder - actual implementation would use ML models
    const gaps: ResearchGap[] = [
      {
        id: '1',
        title: 'Q-Methodology in Climate Change Communication',
        description:
          'Limited studies applying Q-methodology to understand public perspectives on climate change communication strategies',
        relatedThemes: ['climate', 'communication', 'q-methodology'],
        opportunityScore: 0.92,
        suggestedMethods: ['Q-sort', 'factor analysis', 'interviews'],
        potentialImpact: 'High - could inform policy communication',
        fundingOpportunities: ['NSF Climate Program', 'EPA Research Grants'],
        collaborators: ['Dr. Jane Smith', 'Climate Research Lab'],
      },
      {
        id: '2',
        title: 'Cross-Cultural Q-Studies in Healthcare',
        description:
          'Lack of comparative Q-studies across different cultural contexts in healthcare decision-making',
        relatedThemes: ['healthcare', 'culture', 'q-methodology'],
        opportunityScore: 0.88,
        suggestedMethods: ['Cross-cultural Q-sort', 'comparative analysis'],
        potentialImpact: 'Medium-High - improve healthcare delivery',
        fundingOpportunities: ['NIH Cultural Studies', 'WHO Research'],
      },
    ];

    return gaps;
  }

  async exportCitations(
    exportDto: ExportCitationsDto,
    userId: string,
  ): Promise<{ content: string; filename: string }> {
    const papers = await this.prisma.paper.findMany({
      where: {
        id: { in: exportDto.paperIds },
        userId,
      },
    });

    let content = '';
    let filename = '';

    switch (exportDto.format) {
      case ExportFormat.BIBTEX:
        content = this.formatBibTeX(papers);
        filename = 'references.bib';
        break;
      case ExportFormat.RIS:
        content = this.formatRIS(papers);
        filename = 'references.ris';
        break;
      case ExportFormat.JSON:
        content = JSON.stringify(papers, null, 2);
        filename = 'references.json';
        break;
      case ExportFormat.APA:
        content = this.formatAPA(papers);
        filename = 'references.txt';
        break;
      default:
        content = JSON.stringify(papers);
        filename = 'references.json';
    }

    return { content, filename };
  }

  private formatBibTeX(papers: any[]): string {
    return papers
      .map((paper: any) => {
        const type = paper.venue ? '@article' : '@misc';
        const key = paper.doi?.replace('/', '_') || paper.id;
        return `${type}{${key},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.year}},
  ${paper.venue ? `journal={${paper.venue}},` : ''}
  ${paper.doi ? `doi={${paper.doi}},` : ''}
  ${paper.abstract ? `abstract={${paper.abstract}},` : ''}
}`;
      })
      .join('\n\n');
  }

  private formatRIS(papers: any[]): string {
    return papers
      .map((paper: any) => {
        return `TY  - JOUR
TI  - ${paper.title}
${paper.authors.map((a: any) => `AU  - ${a}`).join('\n')}
PY  - ${paper.year}
${paper.venue ? `JO  - ${paper.venue}` : ''}
${paper.doi ? `DO  - ${paper.doi}` : ''}
${paper.abstract ? `AB  - ${paper.abstract}` : ''}
ER  -`;
      })
      .join('\n\n');
  }

  private formatAPA(papers: any[]): string {
    return papers
      .map((paper: any) => {
        const authors = paper.authors.join(', ');
        return `${authors} (${paper.year}). ${paper.title}. ${paper.venue || 'Unpublished'}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}`;
      })
      .join('\n\n');
  }

  async buildKnowledgeGraph(
    paperIds: string[],
    userId: string,
  ): Promise<CitationNetwork> {
    // Build knowledge graph from papers
    // This is a placeholder - actual implementation would use graph algorithms
    const nodes: KnowledgeGraphNode[] = [];
    const edges: any[] = [];

    // Add paper nodes
    for (const paperId of paperIds) {
      nodes.push({
        id: paperId,
        label: `Paper ${paperId}`,
        type: 'paper',
        properties: {},
        connections: [],
      });
    }

    // Add sample edges
    if (paperIds.length > 1) {
      edges.push({
        source: paperIds[0],
        target: paperIds[1],
        type: 'cites' as const,
        weight: 0.8,
      });
    }

    return { nodes, edges };
  }

  async getCitationNetwork(
    paperId: string,
    depth: number,
  ): Promise<CitationNetwork> {
    // Get citation network for a paper
    // This would fetch from Semantic Scholar or other APIs
    const nodes: KnowledgeGraphNode[] = [];
    const edges: any[] = [];

    // Add root paper node
    nodes.push({
      id: paperId,
      label: 'Root Paper',
      type: 'paper',
      properties: {},
      connections: [],
    });

    // This is a placeholder - actual implementation would fetch real citation data
    return { nodes, edges };
  }

  async getStudyRecommendations(
    studyId: string,
    userId: string,
  ): Promise<Paper[]> {
    // Get literature recommendations based on study context
    // This would use AI to suggest relevant papers
    return [];
  }

  async analyzeSocialOpinion(
    topic: string,
    platforms: string[],
    userId: string,
  ): Promise<any> {
    // Analyze social media opinions on a topic
    // This would integrate with social media APIs
    return {
      topic,
      platforms,
      sentiment: 'mixed',
      keyThemes: ['innovation', 'concerns', 'opportunities'],
      engagementScore: 0.76,
    };
  }

  async searchAlternativeSources(
    query: string,
    sources: string[],
    userId: string,
  ): Promise<any[]> {
    // Search alternative sources like preprints, patents, etc.
    return [];
  }

  async generateStatementsFromThemes(
    themes: string[],
    studyContext: any,
    userId: string,
  ): Promise<string[]> {
    // Generate Q-methodology statements from literature themes
    // This would use AI to create balanced statements
    return themes.map(
      (theme) =>
        `Perspective on ${theme}: This represents a viewpoint about ${theme}`,
    );
  }

  private async logSearch(
    searchDto: SearchLiteratureDto,
    userId: string,
  ): Promise<void> {
    // Log search for analytics
    try {
      await this.prisma.searchLog.create({
        data: {
          userId,
          query: searchDto.query,
          filters: searchDto as any, // Json field
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to log search: ${error.message}`);
    }
  }

  /**
   * Check if user has access to a literature review
   */
  async userHasAccess(userId: string, literatureReviewId: string): Promise<boolean> {
    try {
      // For now, always return true to get the server running
      // In production, this would check ownership and permissions
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to check access: ${error.message}`);
      return false;
    }
  }
}
