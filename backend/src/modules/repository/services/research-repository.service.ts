import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { CacheService } from '../../../common/cache.service';

/**
 * Phase 10 Days 26-30: Research Repository & Knowledge Management Service
 *
 * Enterprise-grade research repository for indexing, searching, and managing
 * research insights across the entire research lifecycle
 *
 * Features:
 * - Entity extraction from studies, papers, analyses
 * - Full-text search with faceting
 * - Citation lineage tracking
 * - Real-time indexing pipeline
 * - Knowledge discovery and recommendations
 *
 * Research Backing:
 * - Elasticsearch relevance scoring principles
 * - TF-IDF weighting for keyword extraction
 * - Citation network analysis (Garfield, 1955)
 * - Knowledge graph construction (Bollen et al., 2009)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ResearchInsight {
  id: string;
  title: string;
  content: string;
  type:
    | 'statement'
    | 'factor'
    | 'theme'
    | 'gap'
    | 'quote'
    | 'paper_finding'
    | 'hypothesis';
  sourceType: 'study' | 'paper' | 'response' | 'analysis' | 'literature';
  sourceId: string;
  studyId?: string;
  userId: string;
  citationChain: CitationNode[];
  provenance: ProvenanceMetadata;
  keywords: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  relatedInsights?: string[];
  relatedPapers?: string[];
  relatedThemes?: string[];
  searchVector?: string;
  isPublic: boolean;
  shareLevel: 'private' | 'team' | 'institution' | 'public';
  viewCount: number;
  citationCount: number;
  version: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CitationNode {
  type:
    | 'paper'
    | 'gap'
    | 'question'
    | 'hypothesis'
    | 'theme'
    | 'statement'
    | 'factor'
    | 'insight';
  id: string;
  title: string;
  metadata?: Record<string, any>;
}

export interface ProvenanceMetadata {
  extractionMethod: string;
  confidence: number;
  sources: Array<{
    type: string;
    id: string;
    weight: number;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface SearchQuery {
  query: string;
  filters?: {
    types?: string[];
    sourceTypes?: string[];
    studyIds?: string[];
    userIds?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    shareLevel?: string[];
    keywords?: string[];
  };
  sort?: {
    field: 'relevance' | 'date' | 'popularity' | 'citationCount';
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  results: Array<{
    insight: ResearchInsight;
    score: number;
    highlights: string[];
  }>;
  total: number;
  facets: {
    types: Map<string, number>;
    sourceTypes: Map<string, number>;
    studies: Map<string, number>;
    dateRanges: Map<string, number>;
  };
  query: SearchQuery;
}

export interface IndexingOptions {
  reindex?: boolean;
  entityTypes?: string[];
  studyIds?: string[];
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class ResearchRepositoryService {
  private readonly logger = new Logger(ResearchRepositoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ==========================================================================
  // ENTITY EXTRACTION PIPELINE (Day 26 Morning)
  // ==========================================================================

  /**
   * Extract all research insights from a study
   * Includes statements, factors, quotes, and derived insights
   */
  async extractInsightsFromStudy(
    studyId: string,
    userId: string,
  ): Promise<ResearchInsight[]> {
    this.logger.log(`Extracting insights from study: ${studyId}`);

    const insights: ResearchInsight[] = [];

    // Extract statement insights
    const statementInsights = await this.extractStatementInsights(
      studyId,
      userId,
    );
    insights.push(...statementInsights);

    // Extract factor insights
    const factorInsights = await this.extractFactorInsights(studyId, userId);
    insights.push(...factorInsights);

    // Extract quote insights
    const quoteInsights = await this.extractQuoteInsights(studyId, userId);
    insights.push(...quoteInsights);

    this.logger.log(
      `Extracted ${insights.length} insights from study ${studyId}`,
    );
    return insights;
  }

  /**
   * Extract statement insights with full provenance
   */
  private async extractStatementInsights(
    studyId: string,
    userId: string,
  ): Promise<ResearchInsight[]> {
    const statements = await this.prisma.statement.findMany({
      where: { surveyId: studyId },
      include: {
        statementProvenance: {
          include: {
            sourcePaper: true,
            sourceTheme: true,
          },
        },
      },
    });

    return statements.map((statement) => {
      const citationChain: CitationNode[] = [];

      // Build citation chain
      if (statement.statementProvenance?.sourcePaper) {
        citationChain.push({
          type: 'paper',
          id: statement.statementProvenance.sourcePaper.id,
          title: statement.statementProvenance.sourcePaper.title,
          metadata: {
            authors: statement.statementProvenance.sourcePaper.authors,
            year: statement.statementProvenance.sourcePaper.year,
            doi: statement.statementProvenance.sourcePaper.doi,
          },
        });
      }

      if (statement.statementProvenance?.sourceTheme) {
        citationChain.push({
          type: 'theme',
          id: statement.statementProvenance.sourceTheme.id,
          title: statement.statementProvenance.sourceTheme.name,
          metadata: {
            keywords: statement.statementProvenance.sourceTheme.keywords,
            relevanceScore:
              statement.statementProvenance.sourceTheme.relevanceScore,
          },
        });
      }

      citationChain.push({
        type: 'statement',
        id: statement.id,
        title: statement.text.substring(0, 100),
      });

      return {
        id: `statement_${statement.id}`,
        title: `Statement ${statement.order + 1}`,
        content: statement.text,
        type: 'statement' as const,
        sourceType: 'study' as const,
        sourceId: statement.id,
        studyId,
        userId,
        citationChain,
        provenance: {
          extractionMethod: statement.generationMethod || 'unknown',
          confidence: statement.confidence || 0.8,
          sources: [
            {
              type: 'statement',
              id: statement.id,
              weight: 1.0,
            },
          ],
          generatedAt: new Date(),
          generatedBy: 'research-repository-service',
        },
        keywords: this.extractKeywords(statement.text),
        searchVector: this.buildSearchVector(
          statement.text,
          statement.perspective || '',
          statement.text,
        ),
        isPublic: false,
        shareLevel: 'private' as const,
        viewCount: 0,
        citationCount: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Extract factor insights from analysis results
   */
  private async extractFactorInsights(
    studyId: string,
    userId: string,
  ): Promise<ResearchInsight[]> {
    const analysisResults = await this.prisma.analysisResult.findMany({
      where: { surveyId: studyId },
    });

    const insights: ResearchInsight[] = [];

    for (const result of analysisResults) {
      if (!result.factors) continue;

      const factors = result.factors as any;

      if (Array.isArray(factors)) {
        for (const factor of factors) {
          insights.push({
            id: `factor_${result.id}_${factor.factorNumber || factor.number}`,
            title:
              factor.label ||
              factor.name ||
              `Factor ${factor.factorNumber || factor.number}`,
            content:
              factor.description ||
              factor.interpretation ||
              JSON.stringify(factor),
            type: 'factor' as const,
            sourceType: 'analysis' as const,
            sourceId: result.id,
            studyId,
            userId,
            citationChain: [
              {
                type: 'factor',
                id: result.id,
                title:
                  factor.label ||
                  `Factor ${factor.factorNumber || factor.number}`,
                metadata: {
                  variance: factor.variance || factor.explainedVariance,
                  eigenvalue: factor.eigenvalue,
                  participantCount: factor.loadings?.length || 0,
                },
              },
            ],
            provenance: {
              extractionMethod: 'factor-analysis',
              confidence: 0.95,
              sources: [
                {
                  type: 'analysis',
                  id: result.id,
                  weight: 1.0,
                },
              ],
              generatedAt: result.createdAt,
              generatedBy: 'q-analysis-service',
            },
            keywords: this.extractKeywords(
              factor.description || factor.interpretation || '',
            ),
            searchVector: this.buildSearchVector(
              factor.label || '',
              factor.description || '',
              factor.interpretation || '',
            ),
            isPublic: false,
            shareLevel: 'private' as const,
            viewCount: 0,
            citationCount: 0,
            version: 1,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract quote insights from participant responses
   */
  private async extractQuoteInsights(
    studyId: string,
    userId: string,
  ): Promise<ResearchInsight[]> {
    const responses = await this.prisma.response.findMany({
      where: { surveyId: studyId },
      include: {
        answers: true,
      },
    });

    const insights: ResearchInsight[] = [];

    for (const response of responses) {
      // Extract meaningful quotes from open-ended answers
      const openEndedAnswers = response.answers.filter((answer) => {
        // Check if value is a string (text answer) and has sufficient length
        if (typeof answer.value === 'string' && answer.value.length > 50) {
          return true;
        }
        return false;
      });

      for (const answer of openEndedAnswers) {
        const textValue = answer.value as string;

        insights.push({
          id: `quote_${answer.id}`,
          title: `Participant Quote - Response ${response.id}`,
          content: textValue,
          type: 'quote' as const,
          sourceType: 'response' as const,
          sourceId: response.id,
          studyId,
          userId,
          citationChain: [
            {
              type: 'factor',
              id: response.id,
              title: `Response ${response.id}`,
              metadata: {
                participantId: response.participantId,
                completedAt: response.completedAt,
              },
            },
          ],
          provenance: {
            extractionMethod: 'response-mining',
            confidence: 0.9,
            sources: [
              {
                type: 'response',
                id: response.id,
                weight: 1.0,
              },
            ],
            generatedAt: new Date(),
            generatedBy: 'research-repository-service',
          },
          keywords: this.extractKeywords(textValue),
          searchVector: this.buildSearchVector(textValue, '', ''),
          isPublic: false,
          shareLevel: 'private' as const,
          viewCount: 0,
          citationCount: 0,
          version: 1,
          createdAt: response.createdAt,
          updatedAt: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Extract insights from literature (papers and themes)
   */
  async extractInsightsFromLiterature(
    userId: string,
    paperIds?: string[],
  ): Promise<ResearchInsight[]> {
    const whereClause = paperIds
      ? { userId, id: { in: paperIds } }
      : { userId };

    const papers = await this.prisma.paper.findMany({
      where: whereClause,
      take: 100, // Limit to prevent overwhelming extraction
    });

    return papers.map((paper) => ({
      id: `paper_${paper.id}`,
      title: paper.title,
      content: paper.abstract || paper.title,
      type: 'paper_finding' as const,
      sourceType: 'literature' as const,
      sourceId: paper.id,
      userId: paper.userId,
      citationChain: [
        {
          type: 'paper',
          id: paper.id,
          title: paper.title,
          metadata: {
            authors: paper.authors,
            year: paper.year,
            doi: paper.doi,
            citationCount: paper.citationCount,
          },
        },
      ],
      provenance: {
        extractionMethod: 'literature-mining',
        confidence: 0.85,
        sources: [
          {
            type: 'paper',
            id: paper.id,
            weight: 1.0,
          },
        ],
        generatedAt: new Date(),
        generatedBy: 'research-repository-service',
      },
      keywords: [
        ...(Array.isArray(paper.keywords) ? (paper.keywords as string[]) : []),
        ...(Array.isArray(paper.fieldsOfStudy)
          ? (paper.fieldsOfStudy as string[])
          : []),
      ].filter(Boolean),
      searchVector: this.buildSearchVector(
        paper.title,
        paper.abstract || '',
        '',
      ),
      isPublic: false,
      shareLevel: 'private' as const,
      viewCount: 0,
      citationCount: paper.citationCount || 0,
      version: 1,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
    }));
  }

  // ==========================================================================
  // INDEXING SYSTEM (Day 26 Morning)
  // ==========================================================================

  /**
   * Index a research insight for search
   */
  async indexInsight(insight: ResearchInsight): Promise<void> {
    await this.prisma.researchInsight.upsert({
      where: { id: insight.id },
      create: {
        id: insight.id,
        title: insight.title,
        content: insight.content,
        type: insight.type,
        sourceType: insight.sourceType,
        sourceId: insight.sourceId,
        studyId: insight.studyId,
        userId: insight.userId,
        citationChain: insight.citationChain as any,
        provenance: insight.provenance as any,
        keywords: insight.keywords,
        tags: insight.tags || [],
        metadata: insight.metadata || {},
        relatedInsights: insight.relatedInsights || [],
        relatedPapers: insight.relatedPapers || [],
        relatedThemes: insight.relatedThemes || [],
        searchVector: insight.searchVector,
        isPublic: insight.isPublic,
        shareLevel: insight.shareLevel,
        viewCount: insight.viewCount,
        citationCount: insight.citationCount,
        version: insight.version,
        parentId: insight.parentId,
      },
      update: {
        title: insight.title,
        content: insight.content,
        keywords: insight.keywords,
        searchVector: insight.searchVector,
        updatedAt: new Date(),
      },
    });

    // Create repository index entry
    const indexId = `${insight.type}_${insight.sourceId}`;
    await this.prisma.repositoryIndex.upsert({
      where: {
        id: indexId,
      },
      create: {
        id: indexId,
        entityType: insight.type,
        entityId: insight.sourceId,
        title: insight.title,
        content: insight.content,
        keywords: insight.keywords,
        studyId: insight.studyId,
        userId: insight.userId,
        sourceType: insight.sourceType,
        createdDate: insight.createdAt,
        relevanceScore: this.calculateRelevanceScore(insight),
        popularity: insight.viewCount + insight.citationCount,
      },
      update: {
        title: insight.title,
        content: insight.content,
        keywords: insight.keywords,
        relevanceScore: this.calculateRelevanceScore(insight),
        popularity: insight.viewCount + insight.citationCount,
        updatedAt: new Date(),
      },
    });

    this.logger.debug(`Indexed insight: ${insight.id}`);
  }

  /**
   * Batch index multiple insights
   */
  async indexInsights(insights: ResearchInsight[]): Promise<number> {
    let indexed = 0;
    for (const insight of insights) {
      try {
        await this.indexInsight(insight);
        indexed++;
      } catch (error: any) {
        this.logger.error(
          `Failed to index insight ${insight.id}: ${error?.message || error}`,
        );
      }
    }
    return indexed;
  }

  /**
   * Reindex all entities for a study
   */
  async reindexStudy(studyId: string, userId: string): Promise<number> {
    this.logger.log(`Reindexing study: ${studyId}`);

    const insights = await this.extractInsightsFromStudy(studyId, userId);
    const indexed = await this.indexInsights(insights);

    this.logger.log(`Reindexed ${indexed} insights for study ${studyId}`);
    return indexed;
  }

  /**
   * Reindex all entities for a user
   */
  async reindexAll(
    userId: string,
    options: IndexingOptions = {},
  ): Promise<number> {
    this.logger.log(`Reindexing all entities for user: ${userId}`);

    let totalIndexed = 0;

    // Index studies
    const studies = await this.prisma.survey.findMany({
      where: { createdBy: userId },
      select: { id: true },
    });

    for (const study of studies) {
      totalIndexed += await this.reindexStudy(study.id, userId);
    }

    // Index literature
    const literatureInsights = await this.extractInsightsFromLiterature(userId);
    totalIndexed += await this.indexInsights(literatureInsights);

    this.logger.log(
      `Reindexed ${totalIndexed} total insights for user ${userId}`,
    );
    return totalIndexed;
  }

  // ==========================================================================
  // SEARCH & DISCOVERY (Day 26 Afternoon / Day 28)
  // ==========================================================================

  /**
   * Search across all repository entities
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const cacheKey = `repo_search:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as SearchResult;

    this.logger.log(`Searching repository: "${query.query}"`);

    // Build Prisma where clause
    const where: any = {};

    // Text search (case-insensitive contains)
    if (query.query) {
      where.OR = [
        { title: { contains: query.query, mode: 'insensitive' } },
        { content: { contains: query.query, mode: 'insensitive' } },
        { searchVector: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (query.filters) {
      if (query.filters.types?.length) {
        where.type = { in: query.filters.types };
      }
      if (query.filters.sourceTypes?.length) {
        where.sourceType = { in: query.filters.sourceTypes };
      }
      if (query.filters.studyIds?.length) {
        where.studyId = { in: query.filters.studyIds };
      }
      if (query.filters.userIds?.length) {
        where.userId = { in: query.filters.userIds };
      }
      if (query.filters.dateRange) {
        where.createdAt = {};
        if (query.filters.dateRange.from) {
          where.createdAt.gte = query.filters.dateRange.from;
        }
        if (query.filters.dateRange.to) {
          where.createdAt.lte = query.filters.dateRange.to;
        }
      }
      if (query.filters.shareLevel?.length) {
        where.shareLevel = { in: query.filters.shareLevel };
      }
    }

    // Execute search
    const [insights, total] = await Promise.all([
      this.prisma.researchInsight.findMany({
        where,
        take: query.limit || 20,
        skip: query.offset || 0,
        orderBy: this.buildOrderBy(query.sort),
      }),
      this.prisma.researchInsight.count({ where }),
    ]);

    // Calculate facets
    const facets = await this.calculateFacets(where);

    // Build results with scoring
    const results = insights.map((insight) => {
      const typedInsight = {
        ...insight,
        citationChain: insight.citationChain as any,
        provenance: insight.provenance as any,
        keywords: insight.keywords as any,
        tags: insight.tags as any,
        metadata: insight.metadata as any,
        relatedInsights: insight.relatedInsights as any,
        relatedPapers: insight.relatedPapers as any,
        relatedThemes: insight.relatedThemes as any,
      } as ResearchInsight;

      return {
        insight: typedInsight,
        score: this.calculateSearchScore(typedInsight, query.query),
        highlights: this.extractHighlights(insight.content, query.query),
      };
    });

    const searchResult: SearchResult = {
      results,
      total,
      facets,
      query,
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, searchResult, 300);

    return searchResult;
  }

  /**
   * Get a single insight with full details
   */
  async getInsight(
    insightId: string,
    userId: string,
  ): Promise<ResearchInsight | null> {
    const insight = await this.prisma.researchInsight.findFirst({
      where: {
        id: insightId,
        OR: [{ userId }, { isPublic: true }, { shareLevel: 'public' }],
      },
      include: {
        annotations: true,
        versions: true,
      },
    });

    if (!insight) return null;

    // Increment view count
    await this.prisma.researchInsight.update({
      where: { id: insightId },
      data: { viewCount: { increment: 1 } },
    });

    const typedInsight = {
      ...insight,
      citationChain: insight.citationChain as any,
      provenance: insight.provenance as any,
      keywords: insight.keywords as any,
      tags: insight.tags as any,
      metadata: insight.metadata as any,
      relatedInsights: insight.relatedInsights as any,
      relatedPapers: insight.relatedPapers as any,
      relatedThemes: insight.relatedThemes as any,
    } as ResearchInsight;

    return typedInsight;
  }

  /**
   * Get related insights (similar content, same study, etc.)
   */
  async getRelatedInsights(
    insightId: string,
    limit: number = 5,
  ): Promise<ResearchInsight[]> {
    const insight = await this.prisma.researchInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight) return [];

    // Find insights with similar keywords or from same study
    const related = await this.prisma.researchInsight.findMany({
      where: {
        id: { not: insightId },
        OR: [{ studyId: insight.studyId }, { type: insight.type }],
      },
      take: limit,
      orderBy: [
        { citationCount: 'desc' as const },
        { viewCount: 'desc' as const },
      ],
    });

    return related.map(
      (r) =>
        ({
          ...r,
          citationChain: r.citationChain as any,
          provenance: r.provenance as any,
          keywords: r.keywords as any,
          tags: r.tags as any,
          metadata: r.metadata as any,
          relatedInsights: r.relatedInsights as any,
          relatedPapers: r.relatedPapers as any,
          relatedThemes: r.relatedThemes as any,
        }) as ResearchInsight,
    );
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Extract keywords from text using simple TF-IDF approach
   */
  private extractKeywords(text: string, maxKeywords: number = 10): string[] {
    if (!text) return [];

    // Simple keyword extraction: lowercase, split, filter stop words, take unique
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'this',
      'that',
      'these',
      'those',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    // Count frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Sort by frequency and take top N
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Build search vector from multiple text fields
   */
  private buildSearchVector(...texts: string[]): string {
    return texts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate relevance score for an insight
   */
  private calculateRelevanceScore(insight: ResearchInsight): number {
    let score = 0.5; // Base score

    // Boost by citation count
    score += Math.min(insight.citationCount * 0.05, 0.2);

    // Boost by view count
    score += Math.min(insight.viewCount * 0.01, 0.1);

    // Boost by provenance confidence
    score += insight.provenance.confidence * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate search score for an insight
   */
  private calculateSearchScore(
    insight: ResearchInsight,
    query: string,
  ): number {
    if (!query) return insight.viewCount + insight.citationCount;

    const queryLower = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (insight.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Content match (medium weight)
    if (insight.content.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Keyword match (medium weight)
    const keywordMatches = insight.keywords.filter((k) =>
      k.includes(queryLower),
    ).length;
    score += keywordMatches * 3;

    // Popularity boost
    score += Math.log(1 + insight.viewCount + insight.citationCount);

    return score;
  }

  /**
   * Extract highlights from text
   */
  private extractHighlights(
    text: string,
    query: string,
    contextLength: number = 100,
  ): string[] {
    if (!query || !text) return [];

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const highlights: string[] = [];

    let index = textLower.indexOf(queryLower);
    while (index !== -1 && highlights.length < 3) {
      const start = Math.max(0, index - contextLength);
      const end = Math.min(text.length, index + query.length + contextLength);
      const snippet = text.substring(start, end);
      highlights.push(
        (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : ''),
      );
      index = textLower.indexOf(queryLower, index + 1);
    }

    return highlights;
  }

  /**
   * Build Prisma orderBy clause from sort options
   */
  private buildOrderBy(sort?: SearchQuery['sort']): any {
    if (!sort) return [{ createdAt: 'desc' as const }];

    const order = sort.order as 'asc' | 'desc';

    switch (sort.field) {
      case 'relevance':
        return [{ viewCount: order }, { citationCount: order }];
      case 'date':
        return [{ createdAt: order }];
      case 'popularity':
        return [{ viewCount: order }, { citationCount: order }];
      case 'citationCount':
        return [{ citationCount: order }];
      default:
        return [{ createdAt: 'desc' as const }];
    }
  }

  /**
   * Calculate facets for search results
   */
  private async calculateFacets(where: any): Promise<SearchResult['facets']> {
    // Get aggregated counts
    const [typeGroups, sourceTypeGroups, studyGroups] = await Promise.all([
      this.prisma.researchInsight.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.researchInsight.groupBy({
        by: ['sourceType'],
        where,
        _count: true,
      }),
      this.prisma.researchInsight.groupBy({
        by: ['studyId'],
        where: { ...where, studyId: { not: null } },
        _count: true,
      }),
    ]);

    return {
      types: new Map(typeGroups.map((g) => [g.type, g._count])),
      sourceTypes: new Map(
        sourceTypeGroups.map((g) => [g.sourceType, g._count]),
      ),
      studies: new Map(studyGroups.map((g) => [g.studyId!, g._count])),
      dateRanges: new Map(), // TODO: Implement date range facets
    };
  }

  // ==========================================================================
  // ANNOTATIONS (Day 27)
  // ==========================================================================

  /**
   * Get all annotations for an insight
   */
  async getAnnotations(insightId: string, userId: string) {
    // Verify access
    const insight = await this.prisma.researchInsight.findFirst({
      where: {
        id: insightId,
        OR: [{ userId }, { isPublic: true }, { shareLevel: 'public' }],
      },
    });

    if (!insight) {
      return [];
    }

    return await this.prisma.insightAnnotation.findMany({
      where: { insightId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new annotation
   */
  async createAnnotation(
    insightId: string,
    userId: string,
    content: string,
    type: string,
    parentId?: string,
  ) {
    // Verify access
    const insight = await this.prisma.researchInsight.findFirst({
      where: {
        id: insightId,
        OR: [{ userId }, { isPublic: true }, { shareLevel: 'public' }],
      },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    return await this.prisma.insightAnnotation.create({
      data: {
        insightId,
        userId,
        content,
        type,
        parentId,
        replies: [],
      },
    });
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(
    annotationId: string,
    userId: string,
    content: string,
  ) {
    const annotation = await this.prisma.insightAnnotation.findFirst({
      where: { id: annotationId, userId },
    });

    if (!annotation) {
      throw new BadRequestException('Annotation not found or access denied');
    }

    return await this.prisma.insightAnnotation.update({
      where: { id: annotationId },
      data: { content, updatedAt: new Date() },
    });
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string, userId: string) {
    const annotation = await this.prisma.insightAnnotation.findFirst({
      where: { id: annotationId, userId },
    });

    if (!annotation) {
      throw new BadRequestException('Annotation not found or access denied');
    }

    await this.prisma.insightAnnotation.delete({
      where: { id: annotationId },
    });

    return { deleted: true };
  }

  // ==========================================================================
  // VERSION HISTORY (Day 27)
  // ==========================================================================

  /**
   * Get version history for an insight
   */
  async getVersionHistory(insightId: string, userId: string) {
    // Verify access
    const insight = await this.prisma.researchInsight.findFirst({
      where: {
        id: insightId,
        OR: [{ userId }, { isPublic: true }, { shareLevel: 'public' }],
      },
    });

    if (!insight) {
      return [];
    }

    return await this.prisma.insightVersion.findMany({
      where: { insightId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(insightId: string, version: number, userId: string) {
    // Verify access
    const insight = await this.prisma.researchInsight.findFirst({
      where: {
        id: insightId,
        OR: [{ userId }, { isPublic: true }, { shareLevel: 'public' }],
      },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    return await this.prisma.insightVersion.findFirst({
      where: { insightId, version },
    });
  }

  // ==========================================================================
  // SEARCH HISTORY (Phase 10 Day 28)
  // ==========================================================================

  /**
   * Save search to history
   */
  async saveSearchHistory(
    userId: string,
    query: string,
    filters: any,
    resultCount: number,
  ) {
    return await this.prisma.searchHistory.create({
      data: {
        userId,
        query,
        filters,
        resultCount,
      },
    });
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: string, limit: number = 20) {
    return await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Clear user's search history
   */
  async clearSearchHistory(userId: string) {
    await this.prisma.searchHistory.deleteMany({
      where: { userId },
    });
    return { deleted: true };
  }

  // ==========================================================================
  // PERMISSIONS & COLLABORATION (Phase 10 Day 29)
  // ==========================================================================

  /**
   * Update insight visibility and share level
   *
   * @param insightId - Insight to update
   * @param userId - User performing the update (must be owner)
   * @param isPublic - Whether insight is publicly visible
   * @param shareLevel - Sharing level: 'private' | 'team' | 'institution' | 'public'
   */
  async updateInsightVisibility(
    insightId: string,
    userId: string,
    isPublic: boolean,
    shareLevel: 'private' | 'team' | 'institution' | 'public',
  ) {
    // Verify user is owner
    const insight = await this.prisma.researchInsight.findFirst({
      where: { id: insightId, userId },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    return await this.prisma.researchInsight.update({
      where: { id: insightId },
      data: { isPublic, shareLevel },
    });
  }

  /**
   * Grant access to a user for an insight
   *
   * @param insightId - Insight to grant access to
   * @param grantedByUserId - User granting access (must be owner)
   * @param targetUserId - User receiving access
   * @param role - Access role: VIEWER, COMMENTER, EDITOR, OWNER
   * @param expiresAt - Optional expiration date
   */
  async grantAccess(
    insightId: string,
    grantedByUserId: string,
    targetUserId: string,
    role: 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER',
    expiresAt?: Date,
  ) {
    // Verify granting user is owner
    const insight = await this.prisma.researchInsight.findFirst({
      where: { id: insightId, userId: grantedByUserId },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    // Create or update access grant
    return await this.prisma.insightAccess.upsert({
      where: {
        insightId_userId: {
          insightId,
          userId: targetUserId,
        },
      },
      update: {
        role,
        grantedBy: grantedByUserId,
        expiresAt,
      },
      create: {
        insightId,
        userId: targetUserId,
        role,
        grantedBy: grantedByUserId,
        expiresAt,
      },
    });
  }

  /**
   * Revoke access from a user
   */
  async revokeAccess(insightId: string, ownerId: string, targetUserId: string) {
    // Verify owner
    const insight = await this.prisma.researchInsight.findFirst({
      where: { id: insightId, userId: ownerId },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    await this.prisma.insightAccess.delete({
      where: {
        insightId_userId: {
          insightId,
          userId: targetUserId,
        },
      },
    });

    return { revoked: true };
  }

  /**
   * Check if a user has access to an insight
   *
   * @returns Access role if user has access, null otherwise
   */
  async checkAccess(
    insightId: string,
    userId: string,
  ): Promise<{ hasAccess: boolean; role?: string; isOwner: boolean }> {
    // Check if user is owner
    const insight = await this.prisma.researchInsight.findFirst({
      where: { id: insightId },
      include: {
        accessGrants: {
          where: {
            userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!insight) {
      return { hasAccess: false, isOwner: false };
    }

    const isOwner = insight.userId === userId;

    // Owner always has access
    if (isOwner) {
      return { hasAccess: true, role: 'OWNER', isOwner: true };
    }

    // Check if publicly accessible
    if (insight.isPublic) {
      return { hasAccess: true, role: 'VIEWER', isOwner: false };
    }

    // Check explicit access grants
    const accessGrant = insight.accessGrants[0];
    if (accessGrant) {
      return { hasAccess: true, role: accessGrant.role, isOwner: false };
    }

    return { hasAccess: false, isOwner: false };
  }

  /**
   * Get list of users with access to an insight
   */
  async getInsightAccessList(insightId: string, ownerId: string) {
    // Verify owner
    const insight = await this.prisma.researchInsight.findFirst({
      where: { id: insightId, userId: ownerId },
    });

    if (!insight) {
      throw new BadRequestException('Insight not found or access denied');
    }

    return await this.prisma.insightAccess.findMany({
      where: {
        insightId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * Bulk grant access for all insights in a study
   */
  async grantStudyAccess(
    studyId: string,
    ownerId: string,
    targetUserId: string,
    role: 'VIEWER' | 'COMMENTER' | 'EDITOR',
  ) {
    // Get all insights for this study owned by the user
    const insights = await this.prisma.researchInsight.findMany({
      where: { studyId, userId: ownerId },
      select: { id: true },
    });

    if (insights.length === 0) {
      throw new BadRequestException('No insights found for this study');
    }

    // Grant access to all insights
    const accessGrants = await Promise.all(
      insights.map((insight) =>
        this.grantAccess(insight.id, ownerId, targetUserId, role),
      ),
    );

    return {
      granted: accessGrants.length,
      insights: insights.map((i) => i.id),
    };
  }

  /**
   * Bulk revoke access for all insights in a study
   */
  async revokeStudyAccess(
    studyId: string,
    ownerId: string,
    targetUserId: string,
  ) {
    // Get all insights for this study owned by the user
    const insights = await this.prisma.researchInsight.findMany({
      where: { studyId, userId: ownerId },
      select: { id: true },
    });

    if (insights.length === 0) {
      throw new BadRequestException('No insights found for this study');
    }

    // Revoke access from all insights
    await this.prisma.insightAccess.deleteMany({
      where: {
        insightId: { in: insights.map((i) => i.id) },
        userId: targetUserId,
      },
    });

    return {
      revoked: insights.length,
      insights: insights.map((i) => i.id),
    };
  }
}
