import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { StatementGeneratorService } from '../../ai/services/statement-generator.service';
import * as crypto from 'crypto';

export interface ExtractedTheme {
  id: string;
  label: string;
  keywords: string[];
  papers: string[];
  weight: number;
  description?: string;
  controversial?: boolean;
  opposingViews?: string[];
  citationPatterns?: {
    supporting: number;
    opposing: number;
    neutral: number;
  };
}

export interface Controversy {
  id: string;
  topic: string;
  viewpointA: {
    description: string;
    papers: string[];
    supportingAuthors: string[];
  };
  viewpointB: {
    description: string;
    papers: string[];
    supportingAuthors: string[];
  };
  strength: number;
  citationPattern: 'polarized' | 'mixed' | 'emerging';
}

export interface StatementHint {
  theme: string;
  suggestedStatement: string;
  perspective: 'supportive' | 'critical' | 'neutral' | 'balanced';
  confidence: number;
  sourceEvidence: string[];
  provenance?: {
    sourceDocuments: string[];
    extractedThemes: string[];
    citationChain: string[];
    generationTimestamp: Date;
    aiModel?: string;
  };
}

/**
 * Phase 10.106 Phase 9: TF-IDF analysis result type
 */
export interface TfidfResult {
  topTerms: string[];
  scores?: Map<string, number>;
}

/**
 * Phase 10.106 Phase 9: Term cluster type
 */
export interface TermCluster {
  centroid: string;
  terms: string[];
  weight: number;
}

/**
 * Phase 10.106 Phase 9: AI viewpoint response type
 */
export interface AIViewpointResponse {
  description: string;
  paperIndices: number[];
  rationale?: string;
}

/**
 * Phase 10.106 Phase 9: Theme extraction cache data type
 */
export type ThemeCacheData = ExtractedTheme[] | Controversy[] | StatementHint[];

// Enterprise configuration constants
const ENTERPRISE_CONFIG = {
  MAX_PAPERS_PER_REQUEST: 100,
  MAX_PAPER_ABSTRACT_LENGTH: 5000,
  MAX_THEMES_TO_EXTRACT: 15,
  MIN_PAPERS_FOR_THEME: 1,
  CACHE_TTL_SECONDS: 3600, // 1 hour
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  MAX_PROMPT_LENGTH: 8000,
  MIN_ABSTRACT_LENGTH: 50,
  MAX_STATEMENTS_PER_THEME: 5,
  RATE_LIMIT_PER_MINUTE: 10,
};

@Injectable()
export class ThemeExtractionService {
  private readonly logger = new Logger(ThemeExtractionService.name);
  private readonly themeCache = new Map<
    string,
    { data: ThemeCacheData; timestamp: number }
  >();
  private readonly requestCount = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    private prisma: PrismaService,
    private openAIService: OpenAIService,
    private statementGeneratorService: StatementGeneratorService,
  ) {}

  /**
   * Extract themes from a collection of papers with full provenance tracking
   * @enterprise Enhanced with validation, caching, and error handling
   */
  async extractThemes(
    paperIds: string[],
    userId?: string,
  ): Promise<ExtractedTheme[]> {
    const startTime = Date.now();

    // Enterprise validation
    this.validatePaperIds(paperIds);

    // Check rate limiting
    if (userId) {
      await this.checkRateLimit(userId);
    }

    // Check cache first
    const cacheKey = this.getCacheKey('themes', paperIds);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for theme extraction: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Starting theme extraction for ${paperIds.length} papers`);

    let papers;
    try {
      papers = await this.prisma.paper.findMany({
        where: { id: { in: paperIds } },
        include: {
          themes: true,
          collection: true,
        },
      });
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.error(`Database error fetching papers: ${err.message || 'Unknown error'}`);
      throw new BadRequestException('Failed to fetch papers from database');
    }

    if (papers.length === 0) {
      this.logger.warn('No papers found for theme extraction');
      return [];
    }

    // Log performance metrics
    const fetchTime = Date.now() - startTime;
    this.logger.debug(`Papers fetched in ${fetchTime}ms`);

    // Use AI for comprehensive theme extraction if we have abstracts
    const papersWithContent = papers.filter(
      (p) => p.abstract && p.abstract.length > 50,
    );

    if (papersWithContent.length > 0) {
      // Use AI-powered extraction for papers with abstracts
      const themes = await this.extractThemesWithAI(papersWithContent);

      // Detect controversial themes
      const controversialThemes = await this.detectControversialThemes(
        themes,
        papersWithContent,
      );

      // Merge controversial information and add provenance
      const finalThemes = themes.map((theme) => {
        const controversy = controversialThemes.find(
          (c) => c.topic === theme.label,
        );
        if (controversy) {
          return {
            ...theme,
            controversial: true,
            opposingViews: [
              controversy.viewpointA.description,
              controversy.viewpointB.description,
            ],
            citationPatterns: {
              supporting: controversy.viewpointA.papers.length,
              opposing: controversy.viewpointB.papers.length,
              neutral:
                theme.papers.length -
                controversy.viewpointA.papers.length -
                controversy.viewpointB.papers.length,
            },
          };
        }
        return theme;
      });

      // Cache the results
      const cacheKey = this.getCacheKey('themes', paperIds);
      this.setCachedResult(cacheKey, finalThemes);

      // Log performance metrics
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `Theme extraction completed in ${totalTime}ms for ${paperIds.length} papers`,
      );

      return finalThemes;
    } else {
      // Fallback to TF-IDF for papers without abstracts
      this.logger.warn('Using TF-IDF fallback due to lack of abstracts');

      // Extract text content from papers
      const documents = papers.map((p) => ({
        id: p.id,
        text: `${p.title} ${p.abstract || ''}`,
        keywords: p.keywords || [],
      }));

      // Perform TF-IDF analysis
      const tfidfResults = await this.performTFIDF(documents);

      // Cluster related terms
      const clusters = await this.clusterTerms(tfidfResults);

      // Convert clusters to themes
      const themes = await this.clustersToThemes(clusters, papers);

      // Detect controversial themes
      const controversialThemes = await this.detectControversialThemes(
        themes,
        papers,
      );

      // Merge controversial information
      return themes.map((theme) => {
        const controversy = controversialThemes.find(
          (c) => c.topic === theme.label,
        );
        if (controversy) {
          return {
            ...theme,
            controversial: true,
            opposingViews: [
              controversy.viewpointA.description,
              controversy.viewpointB.description,
            ],
          };
        }
        return theme;
      });
    }
  }

  /**
   * Extract themes using AI for better semantic understanding
   * @enterprise Enhanced with sanitization, validation, and retry logic
   */
  private async extractThemesWithAI(papers: any[]): Promise<ExtractedTheme[]> {
    // Sanitize and prepare paper data
    const sanitizedPapers = papers.slice(0, 20).map((p, i) => ({
      index: i + 1,
      title: this.sanitizeForPrompt(p.title, 200),
      abstract: this.sanitizeForPrompt(p.abstract, 300),
      keywords: (p.keywords || [])
        .slice(0, 10)
        .map((k: string) => this.sanitizeForPrompt(k, 50))
        .join(', '),
    }));

    const prompt = `
      Extract major research themes from these papers. Identify ${Math.min(papers.length, ENTERPRISE_CONFIG.MAX_THEMES_TO_EXTRACT)} distinct themes.

      Papers:
      ${sanitizedPapers
        .map(
          (p) => `
        Paper ${p.index}: "${p.title}"
        Abstract: ${p.abstract}
        Keywords: ${p.keywords}
      `,
        )
        .join('\n')}

      For each theme return JSON array with:
      [{
        "label": "Theme Name",
        "description": "One sentence description",
        "keywords": ["keyword1", "keyword2"],
        "paperIndices": [1, 3, 5],
        "strength": 0.0-1.0
      }]

      IMPORTANT: Return valid JSON only. Maximum ${ENTERPRISE_CONFIG.MAX_THEMES_TO_EXTRACT} themes.
    `;

    // Ensure prompt doesn't exceed limits
    const truncatedPrompt =
      prompt.length > ENTERPRISE_CONFIG.MAX_PROMPT_LENGTH
        ? prompt.substring(0, ENTERPRISE_CONFIG.MAX_PROMPT_LENGTH) + '...\n]'
        : prompt;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.openAIService.generateCompletion(truncatedPrompt, {
          model: 'smart',
          temperature: 0.4,
          maxTokens: 1500,
          cache: true,
        });
      });

      let aiThemes;
      try {
        aiThemes = JSON.parse(response.content);
      } catch (parseError: unknown) {
        const err = parseError as { message?: string };
        this.logger.error(`Failed to parse AI response: ${err.message || 'Unknown error'}`);
        // Try to extract JSON from response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            aiThemes = JSON.parse(jsonMatch[0]);
          } catch (_secondParseError: unknown) {
            throw new Error('Invalid JSON response from AI');
          }
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }

      // Validate AI response structure
      if (!Array.isArray(aiThemes)) {
        throw new Error('AI response is not an array');
      }

      const themes: ExtractedTheme[] = [];

      for (const aiTheme of aiThemes.slice(
        0,
        ENTERPRISE_CONFIG.MAX_THEMES_TO_EXTRACT,
      )) {
        // Validate theme structure
        if (
          !aiTheme.label ||
          !aiTheme.paperIndices ||
          !Array.isArray(aiTheme.paperIndices)
        ) {
          this.logger.warn('Skipping invalid theme from AI response');
          continue;
        }

        const relevantPapers = aiTheme.paperIndices
          .filter(
            (idx: unknown) =>
              typeof idx === 'number' && idx > 0 && idx <= papers.length,
          )
          .map((idx: number) => papers[idx - 1])
          .filter(Boolean);

        if (relevantPapers.length < ENTERPRISE_CONFIG.MIN_PAPERS_FOR_THEME) {
          continue;
        }

        themes.push({
          id: `theme-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          label: this.sanitizeForPrompt(aiTheme.label, 100),
          keywords: (aiTheme.keywords || [])
            .filter((k: unknown) => typeof k === 'string')
            .slice(0, 20)
            .map((k: string) => this.sanitizeForPrompt(k, 50)),
          papers: relevantPapers.map((p: { id: string }) => p.id),
          weight: Math.min(1, Math.max(0, aiTheme.strength || 0.5)),
          description: aiTheme.description
            ? this.sanitizeForPrompt(aiTheme.description, 500)
            : undefined,
          controversial: false, // Will be determined later
        });
      }

      if (themes.length === 0) {
        throw new Error('No valid themes extracted from AI response');
      }

      return themes;
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.error(`AI theme extraction failed: ${err.message || 'Unknown error'}`);
      // Fallback to simple keyword extraction
      return this.extractThemesFallback(papers);
    }
  }

  /**
   * Fallback theme extraction using simple keyword analysis
   */
  private async extractThemesFallback(
    papers: any[],
  ): Promise<ExtractedTheme[]> {
    const keywordFreq = new Map<string, number>();
    const keywordPapers = new Map<string, string[]>();

    for (const paper of papers) {
      const keywords = paper.keywords || [];
      for (const keyword of keywords) {
        keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
        if (!keywordPapers.has(keyword)) {
          keywordPapers.set(keyword, []);
        }
        keywordPapers.get(keyword)!.push(paper.id);
      }
    }

    const themes: ExtractedTheme[] = [];
    const sortedKeywords = Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    for (const [keyword, freq] of sortedKeywords) {
      if (freq > 1) {
        themes.push({
          id: `theme-${Date.now()}-${Math.random()}`,
          label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          keywords: [keyword],
          papers: keywordPapers.get(keyword) || [],
          weight: freq / papers.length,
          description: `Research theme around ${keyword}`,
        });
      }
    }

    return themes;
  }

  /**
   * Detect controversies by analyzing citation patterns and semantic opposition
   */
  async detectControversies(paperIds: string[]): Promise<Controversy[]> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
    });

    // Analyze citation patterns
    const citationAnalysis = await this.analyzeCitationPatterns(papers);

    // Detect semantic oppositions in abstracts
    const semanticOppositions = await this.detectSemanticOppositions(papers);

    // Combine analyses to identify controversies
    const controversies: Controversy[] = [];

    for (const opposition of semanticOppositions) {
      const citationSupport = citationAnalysis.find(
        (c) => c.topic === opposition.topic,
      );

      if (citationSupport && citationSupport.polarization > 0.5) {
        controversies.push({
          id: `controversy-${Date.now()}-${Math.random()}`,
          topic: opposition.topic,
          viewpointA: opposition.viewpointA,
          viewpointB: opposition.viewpointB,
          strength: (opposition.strength + citationSupport.polarization) / 2,
          citationPattern: this.categorizeCitationPattern(
            citationSupport.polarization,
          ),
        });
      }
    }

    return controversies;
  }

  /**
   * Generate statement hints from extracted themes with full provenance
   */
  async generateStatementHints(
    themes: ExtractedTheme[],
    paperIds?: string[],
  ): Promise<StatementHint[]> {
    const hints: StatementHint[] = [];
    const generationTimestamp = new Date();

    // Get paper details for provenance if paperIds provided
    let papers: any[] = [];
    if (paperIds && paperIds.length > 0) {
      papers = await this.prisma.paper.findMany({
        where: { id: { in: paperIds } },
        select: { id: true, title: true, doi: true, authors: true },
      });
    }

    for (const theme of themes) {
      // Generate balanced statement for controversial themes
      if (theme.controversial && theme.opposingViews) {
        const balancedHint = await this.generateBalancedStatement(theme);

        // Add provenance to balanced hint
        balancedHint.provenance = {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: this.buildCitationChain(papers, theme),
          generationTimestamp,
          aiModel: 'gpt-4-turbo-preview',
        };

        hints.push(balancedHint);

        // Also generate perspective-specific statements
        const supportiveHint = await this.generatePerspectiveStatement(
          theme,
          'supportive',
        );
        supportiveHint.provenance = {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: this.buildCitationChain(papers, theme),
          generationTimestamp,
          aiModel: 'gpt-4-turbo-preview',
        };

        const criticalHint = await this.generatePerspectiveStatement(
          theme,
          'critical',
        );
        criticalHint.provenance = {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: this.buildCitationChain(papers, theme),
          generationTimestamp,
          aiModel: 'gpt-4-turbo-preview',
        };

        hints.push(supportiveHint, criticalHint);
      } else {
        // Generate neutral statement for non-controversial themes
        const neutralHint = await this.generatePerspectiveStatement(
          theme,
          'neutral',
        );
        neutralHint.provenance = {
          sourceDocuments: theme.papers,
          extractedThemes: [theme.id],
          citationChain: this.buildCitationChain(papers, theme),
          generationTimestamp,
          aiModel: 'gpt-4-turbo-preview',
        };
        hints.push(neutralHint);
      }
    }

    return hints;
  }

  /**
   * Build citation chain for provenance tracking
   */
  private buildCitationChain(papers: any[], theme: ExtractedTheme): string[] {
    const chain: string[] = [];
    const themePapers = papers.filter((p) => theme.papers.includes(p.id));

    for (const paper of themePapers.slice(0, 5)) {
      // Limit to 5 citations for readability
      const citation = paper.doi
        ? `DOI:${paper.doi}`
        : `${paper.authors?.[0]?.split(' ').pop() || 'Unknown'} et al. - ${paper.title.substring(0, 50)}...`;
      chain.push(citation);
    }

    if (themePapers.length > 5) {
      chain.push(`... and ${themePapers.length - 5} more papers`);
    }

    return chain;
  }

  /**
   * Connect themes to AI statement generator with full pipeline integration
   */
  async themeToStatements(
    themes: ExtractedTheme[],
    studyContext: any,
  ): Promise<{
    statements: string[];
    provenance: Map<string, any>;
    metadata: {
      totalThemes: number;
      controversialThemes: number;
      statementsGenerated: number;
      perspectivesIncluded: string[];
    };
  }> {
    this.logger.log(`Converting ${themes.length} themes to statements`);

    // Generate statement hints with provenance
    const paperIds = [...new Set(themes.flatMap((t) => t.papers))];
    const hints = await this.generateStatementHints(themes, paperIds);

    // Use statement generator for additional diverse statements if needed
    const statements: string[] = [];
    const provenance = new Map<string, any>();
    const perspectivesSet = new Set<string>();

    // Add statements from hints with provenance tracking
    for (const hint of hints) {
      statements.push(hint.suggestedStatement);
      perspectivesSet.add(hint.perspective);

      // Track provenance for each statement
      provenance.set(hint.suggestedStatement, {
        sourceTheme: hint.theme,
        perspective: hint.perspective,
        confidence: hint.confidence,
        provenance: hint.provenance,
        generationMethod: 'theme-based',
      });
    }

    // If we need more statements, generate additional ones
    const targetStatementCount = studyContext?.targetStatements || 40;
    if (statements.length < targetStatementCount) {
      const additionalCount = targetStatementCount - statements.length;
      const topicDescription = themes.map((t) => t.label).join(', ');

      try {
        const additionalStatements =
          await this.statementGeneratorService.generateStatements(
            topicDescription,
            {
              count: additionalCount,
              perspectives: Array.from(perspectivesSet),
              avoidBias: true,
              academicLevel: studyContext?.academicLevel || 'intermediate',
            },
          );

        for (const stmt of additionalStatements) {
          statements.push(stmt.text);
          perspectivesSet.add(stmt.perspective || 'General');

          // Track provenance for generated statements
          provenance.set(stmt.text, {
            sourceTheme: 'AI-generated',
            perspective: stmt.perspective,
            polarity: stmt.polarity,
            provenance: {
              sourceDocuments: paperIds,
              extractedThemes: themes.map((t) => t.id),
              generationTimestamp: new Date(),
              aiModel: 'gpt-4-turbo-preview',
            },
            generationMethod: 'ai-augmented',
          });
        }
      } catch (error) {
        this.logger.warn('Failed to generate additional statements', error);
      }
    }

    // Ensure diversity and balance
    const balancedStatements = this.balanceStatements(statements);

    // Create comprehensive metadata
    const metadata = {
      totalThemes: themes.length,
      controversialThemes: themes.filter((t) => t.controversial).length,
      statementsGenerated: balancedStatements.length,
      perspectivesIncluded: Array.from(perspectivesSet),
    };

    return {
      statements: balancedStatements,
      provenance,
      metadata,
    };
  }

  /**
   * Perform TF-IDF analysis on documents
   */
  private async performTFIDF(documents: any[]): Promise<any> {
    // Calculate term frequencies
    const termFrequencies = new Map<string, Map<string, number>>();
    const documentFrequencies = new Map<string, number>();

    for (const doc of documents) {
      const terms = this.tokenize(doc.text);
      const docTerms = new Map<string, number>();

      for (const term of terms) {
        docTerms.set(term, (docTerms.get(term) || 0) + 1);
        if (!docTerms.has(term)) {
          documentFrequencies.set(
            term,
            (documentFrequencies.get(term) || 0) + 1,
          );
        }
      }

      termFrequencies.set(doc.id, docTerms);
    }

    // Calculate TF-IDF scores
    const tfidfScores = new Map<string, Map<string, number>>();
    const totalDocs = documents.length;

    for (const [docId, terms] of termFrequencies) {
      const scores = new Map<string, number>();

      for (const [term, freq] of terms) {
        const tf = freq / terms.size;
        const idf = Math.log(totalDocs / (documentFrequencies.get(term) || 1));
        scores.set(term, tf * idf);
      }

      tfidfScores.set(docId, scores);
    }

    return {
      scores: tfidfScores,
      topTerms: this.extractTopTerms(tfidfScores),
    };
  }

  /**
   * Cluster related terms using similarity metrics
   */
  private async clusterTerms(tfidfResults: TfidfResult): Promise<TermCluster[]> {
    const { topTerms } = tfidfResults;
    const clusters: TermCluster[] = [];
    const visited = new Set<string>();

    for (const term of topTerms) {
      if (!visited.has(term)) {
        const cluster = {
          centroid: term,
          terms: [term],
          weight: 1,
        };

        // Find similar terms
        for (const otherTerm of topTerms) {
          if (!visited.has(otherTerm) && this.areSimilar(term, otherTerm)) {
            cluster.terms.push(otherTerm);
            cluster.weight++;
            visited.add(otherTerm);
          }
        }

        visited.add(term);
        if (cluster.terms.length > 1) {
          clusters.push(cluster);
        }
      }
    }

    return clusters;
  }

  /**
   * Convert term clusters to themes
   */
  private async clustersToThemes(
    clusters: any[],
    papers: any[],
  ): Promise<ExtractedTheme[]> {
    const themes: ExtractedTheme[] = [];

    for (const cluster of clusters) {
      const relevantPapers = papers.filter((p) => {
        const text = `${p.title} ${p.abstract || ''}`.toLowerCase();
        return cluster.terms.some((term: string) =>
          text.includes(term.toLowerCase()),
        );
      });

      const theme: ExtractedTheme = {
        id: `theme-${Date.now()}-${Math.random()}`,
        label: await this.generateThemeLabel(cluster.terms),
        keywords: cluster.terms,
        papers: relevantPapers.map((p) => p.id),
        weight: cluster.weight,
        description: await this.generateThemeDescription(
          cluster.terms,
          relevantPapers,
        ),
      };

      themes.push(theme);
    }

    return themes;
  }

  /**
   * Detect controversial themes by analyzing disagreements
   */
  private async detectControversialThemes(
    themes: ExtractedTheme[],
    papers: any[],
  ): Promise<Controversy[]> {
    const controversies: Controversy[] = [];

    for (const theme of themes) {
      const themePapers = papers.filter((p) => theme.papers.includes(p.id));

      // Analyze sentiment and stance in abstracts
      const stanceAnalysis = await this.analyzeStances(themePapers);

      if (stanceAnalysis.polarization > 0.6) {
        const controversy: Controversy = {
          id: `controversy-${theme.id}`,
          topic: theme.label,
          viewpointA: {
            description: stanceAnalysis.viewpoints[0].description,
            papers: stanceAnalysis.viewpoints[0].papers,
            supportingAuthors: stanceAnalysis.viewpoints[0].authors,
          },
          viewpointB: {
            description: stanceAnalysis.viewpoints[1].description,
            papers: stanceAnalysis.viewpoints[1].papers,
            supportingAuthors: stanceAnalysis.viewpoints[1].authors,
          },
          strength: stanceAnalysis.polarization,
          citationPattern: 'polarized',
        };

        controversies.push(controversy);
      }
    }

    return controversies;
  }

  /**
   * Analyze citation patterns to detect disagreements using AI
   */
  private async analyzeCitationPatterns(papers: any[]): Promise<any[]> {
    const patterns: any[] = [];

    // Group papers by topic keywords
    const topicGroups = new Map<string, any[]>();

    for (const paper of papers) {
      const keywords = paper.keywords || [];
      for (const keyword of keywords) {
        if (!topicGroups.has(keyword)) {
          topicGroups.set(keyword, []);
        }
        topicGroups.get(keyword)!.push(paper);
      }
    }

    // Analyze each topic group with sufficient papers
    for (const [topic, topicPapers] of topicGroups) {
      if (topicPapers.length > 3) {
        const prompt = `
          Analyze citation patterns and research positions for topic: "${topic}"

          Papers (${topicPapers.length} total):
          ${topicPapers.map((p, i) => `${i + 1}. "${p.title}" - ${(p.abstract || '').substring(0, 100)}...`).join('\n')}

          Analyze if these papers show:
          1. Consensus (all agree)
          2. Debate (some disagreement)
          3. Polarization (strong opposing camps)

          Return JSON: {"polarization": 0-1, "pattern": "consensus|debate|polarized", "explanation": "brief reason"}
        `;

        try {
          const response = await this.openAIService.generateCompletion(prompt, {
            model: 'fast',
            temperature: 0.3,
            maxTokens: 200,
          });

          const analysis = JSON.parse(response.content);
          patterns.push({
            topic,
            polarization: analysis.polarization || 0.3,
            paperCount: topicPapers.length,
            pattern: analysis.pattern || 'mixed',
            explanation: analysis.explanation,
          });
        } catch (error) {
          // Fallback for failed analysis
          patterns.push({
            topic,
            polarization: 0.5,
            paperCount: topicPapers.length,
            pattern: 'unknown',
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect semantic oppositions in paper abstracts
   */
  private async detectSemanticOppositions(papers: any[]): Promise<any[]> {
    const oppositions: any[] = [];

    // Look for opposing language patterns
    const opposingPatterns = [
      { positive: 'support', negative: 'oppose' },
      { positive: 'confirm', negative: 'refute' },
      { positive: 'validate', negative: 'challenge' },
      { positive: 'agree', negative: 'disagree' },
      { positive: 'consistent', negative: 'inconsistent' },
    ];

    for (const pattern of opposingPatterns) {
      const supportingPapers = papers.filter((p) =>
        p.abstract?.toLowerCase().includes(pattern.positive),
      );
      const opposingPapers = papers.filter((p) =>
        p.abstract?.toLowerCase().includes(pattern.negative),
      );

      if (supportingPapers.length > 0 && opposingPapers.length > 0) {
        oppositions.push({
          topic: `${pattern.positive} vs ${pattern.negative}`,
          strength:
            (supportingPapers.length + opposingPapers.length) / papers.length,
          viewpointA: {
            description: `Papers supporting/confirming`,
            papers: supportingPapers.map((p) => p.id),
          },
          viewpointB: {
            description: `Papers opposing/challenging`,
            papers: opposingPapers.map((p) => p.id),
          },
        });
      }
    }

    return oppositions;
  }

  /**
   * Generate a balanced statement for controversial themes
   * @enterprise Enhanced with sanitization and retry logic
   */
  private async generateBalancedStatement(
    theme: ExtractedTheme,
  ): Promise<StatementHint> {
    const sanitizedLabel = this.sanitizeForPrompt(theme.label, 100);
    const sanitizedViewA = this.sanitizeForPrompt(
      theme.opposingViews?.[0] || '',
      200,
    );
    const sanitizedViewB = this.sanitizeForPrompt(
      theme.opposingViews?.[1] || '',
      200,
    );

    const prompt = `
      Generate a balanced Q-methodology statement about "${sanitizedLabel}" that acknowledges both perspectives:
      Perspective A: ${sanitizedViewA}
      Perspective B: ${sanitizedViewB}

      Requirements:
      - Maximum 100 characters
      - Neutral tone allowing participants to project their own views
      - No leading language
      - Suitable for agree/disagree sorting

      Return ONLY the statement text, nothing else.
    `;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.openAIService.generateCompletion(prompt, {
          model: 'smart',
          temperature: 0.7,
          maxTokens: 150,
          cache: true,
        });
      });

      const statement = this.sanitizeForPrompt(response.content.trim(), 100);

      return {
        theme: theme.label,
        suggestedStatement: statement,
        perspective: 'balanced',
        confidence: 0.85,
        sourceEvidence: theme.papers,
      };
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.error(
        `Failed to generate balanced statement: ${err.message || 'Unknown error'}`,
      );
      // Fallback statement
      return {
        theme: theme.label,
        suggestedStatement: `Views on ${sanitizedLabel} vary significantly`,
        perspective: 'balanced',
        confidence: 0.5,
        sourceEvidence: theme.papers,
      };
    }
  }

  /**
   * Generate a perspective-specific statement
   */
  private async generatePerspectiveStatement(
    theme: ExtractedTheme,
    perspective: 'supportive' | 'critical' | 'neutral',
  ): Promise<StatementHint> {
    const prompt = `
      Generate a ${perspective} Q-methodology statement about "${theme.label}".
      Keywords: ${theme.keywords.join(', ')}
      Description: ${theme.description}
      The statement should be clear and suitable for Q-sorting.
    `;

    const response = await this.openAIService.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.7,
      maxTokens: 150,
    });
    const statement = response.content;

    return {
      theme: theme.label,
      suggestedStatement: statement,
      perspective,
      confidence: 0.75,
      sourceEvidence: theme.papers,
    };
  }

  /**
   * Balance statements to ensure diversity
   */
  private balanceStatements(statements: string[]): string[] {
    // Ensure we have a good mix of perspectives
    // Remove duplicates and overly similar statements
    const unique = [...new Set(statements)];

    // Limit to reasonable number for Q-sort
    if (unique.length > 60) {
      // Select most diverse subset
      return this.selectDiverseSubset(unique, 60);
    }

    return unique;
  }

  /**
   * Helper: Tokenize text
   */
  private tokenize(text: string): string[] {
    // Remove punctuation and split into words
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3); // Filter out short words
  }

  /**
   * Helper: Extract top terms from TF-IDF scores
   */
  private extractTopTerms(scores: Map<string, Map<string, number>>): string[] {
    const termScores = new Map<string, number>();

    for (const docScores of scores.values()) {
      for (const [term, score] of docScores) {
        termScores.set(term, (termScores.get(term) || 0) + score);
      }
    }

    return Array.from(termScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([term]) => term);
  }

  /**
   * Helper: Check if two terms are similar
   */
  private areSimilar(term1: string, term2: string): boolean {
    // Simple similarity check - could use more sophisticated methods
    const distance = this.levenshteinDistance(term1, term2);
    return distance < 3 || term1.includes(term2) || term2.includes(term1);
  }

  /**
   * Helper: Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Enterprise validation for paper IDs
   */
  private validatePaperIds(paperIds: string[]): void {
    if (!paperIds || !Array.isArray(paperIds)) {
      throw new BadRequestException('Paper IDs must be an array');
    }

    if (paperIds.length === 0) {
      throw new BadRequestException('At least one paper ID is required');
    }

    if (paperIds.length > ENTERPRISE_CONFIG.MAX_PAPERS_PER_REQUEST) {
      throw new BadRequestException(
        `Maximum ${ENTERPRISE_CONFIG.MAX_PAPERS_PER_REQUEST} papers allowed per request`,
      );
    }

    // Validate each paper ID format
    const invalidIds = paperIds.filter(
      (id) => !id || typeof id !== 'string' || id.length > 100,
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException('Invalid paper ID format detected');
    }

    // Check for duplicates
    const uniqueIds = new Set(paperIds);
    if (uniqueIds.size !== paperIds.length) {
      this.logger.warn('Duplicate paper IDs detected in request');
    }
  }

  /**
   * Enterprise rate limiting per user
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const userLimit = this.requestCount.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= ENTERPRISE_CONFIG.RATE_LIMIT_PER_MINUTE) {
          const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
          throw new BadRequestException(
            `Rate limit exceeded. Please wait ${waitTime} seconds`,
          );
        }
        userLimit.count++;
      } else {
        // Reset the counter
        this.requestCount.set(userId, {
          count: 1,
          resetTime: now + 60000, // 1 minute from now
        });
      }
    } else {
      this.requestCount.set(userId, {
        count: 1,
        resetTime: now + 60000,
      });
    }
  }

  /**
   * Generate cache key for theme extraction
   */
  private getCacheKey(prefix: string, paperIds: string[]): string {
    const sortedIds = [...paperIds].sort();
    const hash = crypto
      .createHash('sha256')
      .update(`${prefix}:${sortedIds.join(',')}`)
      .digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(cacheKey: string): any | null {
    const cached = this.themeCache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      const age = (now - cached.timestamp) / 1000;

      if (age < ENTERPRISE_CONFIG.CACHE_TTL_SECONDS) {
        this.logger.debug(`Cache hit (age: ${Math.round(age)}s): ${cacheKey}`);
        return cached.data;
      } else {
        this.logger.debug(
          `Cache expired (age: ${Math.round(age)}s): ${cacheKey}`,
        );
        this.themeCache.delete(cacheKey);
      }
    }
    return null;
  }

  /**
   * Store result in cache
   */
  private setCachedResult(cacheKey: string, data: ThemeCacheData): void {
    this.themeCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (this.themeCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.themeCache.forEach((value, key) => {
      const age = (now - value.timestamp) / 1000;
      if (age > ENTERPRISE_CONFIG.CACHE_TTL_SECONDS) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.themeCache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug(
        `Cleaned up ${expiredKeys.length} expired cache entries`,
      );
    }
  }

  /**
   * Sanitize text for AI prompts
   */
  private sanitizeForPrompt(text: string, maxLength: number = 1000): string {
    if (!text) return '';

    // Remove potential injection attempts
    let sanitized = text
      .replace(/```/g, "'''") // Prevent code block escapes
      .replace(/\n{3,}/g, '\n\n') // Limit newlines
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable chars
      .trim();

    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }

    return sanitized;
  }

  /**
   * Retry logic for AI operations
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = ENTERPRISE_CONFIG.MAX_RETRY_ATTEMPTS,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        // Phase 10.106 Phase 8: Use unknown with type narrowing
        const err = error as Error;
        lastError = err;
        this.logger.warn(
          `Operation failed (attempt ${attempt}/${retries}): ${err.message || 'Unknown error'}`,
        );

        if (attempt < retries) {
          const delay =
            ENTERPRISE_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Helper: Generate theme label from terms
   */
  private async generateThemeLabel(terms: string[]): Promise<string> {
    const prompt = `
      Generate a concise, academic theme label (2-4 words) for a cluster of related terms:
      Terms: ${terms.join(', ')}

      Return only the theme label, nothing else.
      Example: "Climate Change Adaptation" or "Digital Transformation"
    `;

    try {
      const response = await this.openAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.3,
        maxTokens: 50,
      });
      return (
        response.content.trim() ||
        terms[0].charAt(0).toUpperCase() + terms[0].slice(1)
      );
    } catch (error) {
      // Fallback to simple label generation
      return terms[0].charAt(0).toUpperCase() + terms[0].slice(1);
    }
  }

  /**
   * Helper: Generate theme description
   */
  private async generateThemeDescription(
    terms: string[],
    papers: any[],
  ): Promise<string> {
    const titles = papers
      .slice(0, 3)
      .map((p) => p.title)
      .join('; ');
    const prompt = `
      Generate a one-sentence academic description for a research theme.
      Keywords: ${terms.slice(0, 5).join(', ')}
      Sample paper titles: ${titles}

      Return only the description sentence, be concise and academic.
    `;

    try {
      const response = await this.openAIService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.5,
        maxTokens: 100,
      });
      return (
        response.content.trim() ||
        `Theme encompassing ${terms.slice(0, 3).join(', ')} across ${papers.length} papers`
      );
    } catch (error) {
      // Fallback to simple description
      return `Theme encompassing ${terms.slice(0, 3).join(', ')} across ${papers.length} papers`;
    }
  }

  /**
   * Helper: Analyze stances in papers using AI
   * @enterprise Enhanced with sanitization and validation
   */
  private async analyzeStances(papers: any[]): Promise<any> {
    if (papers.length < 2) {
      return {
        polarization: 0,
        viewpoints: [],
      };
    }

    // Prepare and sanitize abstracts for analysis
    const abstractsData = papers.slice(0, 15).map((p) => ({
      id: p.id,
      title: this.sanitizeForPrompt(p.title, 150),
      abstract: this.sanitizeForPrompt(p.abstract || p.title, 200),
      authors: (p.authors || []).slice(0, 3),
    }));

    const prompt = `
      Analyze the following research papers for stance polarization. Identify if there are opposing viewpoints.

      Papers:
      ${abstractsData.map((p, i) => `${i + 1}. "${p.title}": ${p.abstract}`).join('\n')}

      Return a JSON object with:
      {
        "polarization": (0-1 score, 0=consensus, 1=highly polarized),
        "viewpoints": [
          {
            "description": "description of viewpoint A",
            "paperIndices": [indices of papers supporting this view],
            "rationale": "why these papers support this view"
          },
          {
            "description": "description of viewpoint B (if exists)",
            "paperIndices": [indices],
            "rationale": "why"
          }
        ]
      }

      IMPORTANT: Return valid JSON only. Paper indices must be integers between 1 and ${abstractsData.length}.
    `;

    try {
      const response = await this.openAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.3,
        maxTokens: 800,
      });

      const analysis = JSON.parse(response.content);

      // Map paper indices back to paper IDs and authors
      const viewpoints = analysis.viewpoints.map((vp: AIViewpointResponse) => ({
        description: vp.description,
        papers: vp.paperIndices
          .map((idx: number) => abstractsData[idx - 1]?.id)
          .filter(Boolean),
        authors: vp.paperIndices
          .map((idx: number) => abstractsData[idx - 1]?.authors)
          .flat()
          .filter(Boolean),
        rationale: vp.rationale,
      }));

      return {
        polarization: analysis.polarization || 0,
        viewpoints,
      };
    } catch (error) {
      // Fallback to simple split if AI fails
      this.logger.warn('AI stance analysis failed, using fallback', error);
      return {
        polarization: 0.5,
        viewpoints: [
          {
            description: 'Primary perspective',
            papers: papers
              .slice(0, Math.ceil(papers.length / 2))
              .map((p) => p.id),
            authors: [],
          },
          {
            description: 'Alternative perspective',
            papers: papers.slice(Math.ceil(papers.length / 2)).map((p) => p.id),
            authors: [],
          },
        ],
      };
    }
  }

  /**
   * Helper: Categorize citation pattern
   */
  private categorizeCitationPattern(
    polarization: number,
  ): 'polarized' | 'mixed' | 'emerging' {
    if (polarization > 0.7) return 'polarized';
    if (polarization > 0.4) return 'mixed';
    return 'emerging';
  }

  /**
   * Helper: Select diverse subset of statements
   */
  private selectDiverseSubset(
    statements: string[],
    targetSize: number,
  ): string[] {
    // Simple diversity selection - could use more sophisticated methods
    const selected: string[] = [];
    const remaining = [...statements];

    while (selected.length < targetSize && remaining.length > 0) {
      // Select statement most different from those already selected
      let mostDifferent = remaining[0];
      let maxDifference = 0;

      for (const statement of remaining) {
        let totalDifference = 0;
        for (const selectedStatement of selected) {
          totalDifference += this.statementDifference(
            statement,
            selectedStatement,
          );
        }

        if (totalDifference > maxDifference) {
          maxDifference = totalDifference;
          mostDifferent = statement;
        }
      }

      selected.push(mostDifferent);
      remaining.splice(remaining.indexOf(mostDifferent), 1);
    }

    return selected;
  }

  /**
   * Helper: Calculate difference between statements
   */
  private statementDifference(s1: string, s2: string): number {
    // Simple difference metric based on shared words
    const words1 = new Set(s1.toLowerCase().split(/\s+/));
    const words2 = new Set(s2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return 1 - intersection.size / union.size;
  }
}
