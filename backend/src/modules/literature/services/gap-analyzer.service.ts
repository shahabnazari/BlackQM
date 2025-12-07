import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { OpenAIService } from '../../ai/services/openai.service';
import { ThemeExtractionService } from './theme-extraction.service';

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  relatedPapers: string[];
  importance: number; // 0-10 scale
  feasibility: number; // 0-10 scale
  marketPotential: number; // 0-10 scale
  suggestedMethodology?: string;
  suggestedStudyDesign?: string;
  estimatedImpact?: string;
  trendDirection?: 'emerging' | 'growing' | 'stable' | 'declining';
  confidenceScore: number; // 0-1 scale
}

export interface ResearchOpportunity {
  gap: ResearchGap;
  opportunityScore: number; // Combined score
  rationale: string;
  suggestedApproach: string;
  potentialChallenges: string[];
  requiredResources: string[];
  timelineEstimate: string;
  collaborationSuggestions?: string[];
  fundingOpportunities?: string[];
}

export interface TrendAnalysis {
  topic: string;
  trendType: 'emerging' | 'growing' | 'stable' | 'declining' | 'cyclical';
  timeSeriesData: { year: number; frequency: number }[];
  projectedGrowth: number; // Percentage
  inflectionPoints: { year: number; event: string }[];
  relatedTopics: string[];
  confidence: number;
}

export interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  growth: number; // Year-over-year growth
  coOccurrences: { keyword: string; frequency: number }[];
  contexts: string[]; // Contexts where keyword appears
  importance: number;
}

export interface TopicModel {
  topicId: string;
  label: string;
  keywords: string[];
  papers: string[];
  coherenceScore: number;
  prevalence: number;
  evolution: { year: number; prevalence: number }[];
}

@Injectable()
export class GapAnalyzerService {
  private readonly logger = new Logger(GapAnalyzerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAIService: OpenAIService,
    private readonly themeExtractionService: ThemeExtractionService,
  ) {}

  /**
   * Main method to analyze research gaps from a collection of papers
   */
  async analyzeResearchGaps(paperIds: string[]): Promise<ResearchGap[]> {
    this.logger.log(`Analyzing research gaps for ${paperIds.length} papers`);

    // Validate input
    if (!paperIds || paperIds.length === 0) {
      this.logger.warn('No papers provided for gap analysis');
      return [];
    }

    try {
      // Fetch papers with all metadata
      const papers = await this.fetchPapersWithMetadata(paperIds);

      if (papers.length === 0) {
        this.logger.warn('No valid papers found for gap analysis');
        return [];
      }

      // Extract keywords from all papers
      const keywordAnalysis = await this.extractAndAnalyzeKeywords(papers);

      // Perform topic modeling
      const topicModels = await this.performTopicModeling(papers);

      // Detect trends
      const trends = await this.detectTrends(papers, keywordAnalysis);

      // Identify gaps using AI
      const gaps = await this.identifyGapsWithAI(papers, topicModels, trends);

      // Score and rank gaps
      const scoredGaps = await this.scoreGaps(gaps, trends);

      this.logger.log(`Identified ${scoredGaps.length} research gaps`);

      return scoredGaps;
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to analyze research gaps: ${err.message || 'Unknown error'}`,
        err.stack,
      );
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  /**
   * NEW: Analyze research gaps from paper content directly (no database lookup)
   * This method accepts paper content from the frontend instead of fetching from DB
   */
  async analyzeResearchGapsFromContent(papers: any[]): Promise<ResearchGap[]> {
    this.logger.log(
      `Analyzing research gaps from ${papers.length} papers (content provided)`,
    );

    // Validate input
    if (!papers || papers.length === 0) {
      this.logger.warn('No papers provided for gap analysis');
      return [];
    }

    try {
      // Transform frontend paper format to internal format
      const transformedPapers = papers.map((paper) => ({
        id: paper.id,
        title: paper.title || '',
        abstract: (paper as any).fullText || paper.abstract || '', // Phase 10 Day 5.15: Prioritize full-text
        authors: paper.authors || [],
        year: paper.year || new Date().getFullYear(),
        keywords: paper.keywords || [],
        doi: paper.doi,
        venue: paper.venue,
        citationCount: paper.citationCount || 0,
      }));

      this.logger.log(
        `Transformed ${transformedPapers.length} papers for analysis`,
      );

      // Extract keywords from all papers
      const keywordAnalysis =
        await this.extractAndAnalyzeKeywords(transformedPapers);

      // Perform topic modeling
      const topicModels = await this.performTopicModeling(transformedPapers);

      // Detect trends
      const trends = await this.detectTrends(
        transformedPapers,
        keywordAnalysis,
      );

      // Identify gaps using AI
      const gaps = await this.identifyGapsWithAI(
        transformedPapers,
        topicModels,
        trends,
      );

      // Score and rank gaps
      const scoredGaps = await this.scoreGaps(gaps, trends);

      this.logger.log(`Identified ${scoredGaps.length} research gaps`);

      return scoredGaps;
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to analyze research gaps from content: ${err.message || 'Unknown error'}`,
        err.stack,
      );
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  /**
   * Generate research opportunities from identified gaps
   */
  async generateOpportunities(
    gaps: ResearchGap[],
  ): Promise<ResearchOpportunity[]> {
    const opportunities: ResearchOpportunity[] = [];

    for (const gap of gaps) {
      const opportunity = await this.createOpportunity(gap);
      opportunities.push(opportunity);
    }

    // Sort by opportunity score
    return opportunities.sort(
      (a, b) => b.opportunityScore - a.opportunityScore,
    );
  }

  /**
   * Extract and analyze keywords from papers
   */
  async extractAndAnalyzeKeywords(papers: any[]): Promise<KeywordAnalysis[]> {
    const keywordMap = new Map<string, KeywordAnalysis>();

    for (const paper of papers) {
      // Phase 10 Day 5.15: Prioritize full-text over abstract
      const content = (paper as any).fullText || paper.abstract || '';
      const text = `${paper.title} ${content}`;
      const keywords = await this.extractKeywords(text);

      for (const keyword of keywords) {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            keyword,
            frequency: 0,
            growth: 0,
            coOccurrences: [],
            contexts: [],
            importance: 0,
          });
        }

        const analysis = keywordMap.get(keyword)!;
        analysis.frequency++;
        analysis.contexts.push(paper.title);

        // Track co-occurrences
        for (const otherKeyword of keywords) {
          if (otherKeyword !== keyword) {
            const coOccurrence = analysis.coOccurrences.find(
              (c) => c.keyword === otherKeyword,
            );
            if (coOccurrence) {
              coOccurrence.frequency++;
            } else {
              analysis.coOccurrences.push({
                keyword: otherKeyword,
                frequency: 1,
              });
            }
          }
        }
      }
    }

    // Calculate importance scores
    const analyses = Array.from(keywordMap.values());
    for (const analysis of analyses) {
      analysis.importance = this.calculateKeywordImportance(analysis, analyses);
      analysis.coOccurrences.sort((a, b) => b.frequency - a.frequency);
      analysis.coOccurrences = analysis.coOccurrences.slice(0, 10); // Top 10 co-occurrences
    }

    return analyses.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Perform topic modeling on papers using LDA-like approach
   */
  async performTopicModeling(
    papers: any[],
    numTopics: number = 10,
  ): Promise<TopicModel[]> {
    const topics: TopicModel[] = [];

    // Simple clustering-based topic modeling
    // In production, would use proper LDA or other topic modeling algorithms
    const documents = papers.map((p) => ({
      id: p.id,
      text: `${p.title} ${p.abstract || ''}`,
      year: p.year || new Date().getFullYear(),
    }));

    // Extract themes as proxy for topics
    const themes = await this.themeExtractionService.extractThemes(
      papers.map((p) => p.id),
    );

    for (let i = 0; i < Math.min(numTopics, themes.length); i++) {
      const theme = themes[i];
      const topicModel: TopicModel = {
        topicId: `topic-${i}`,
        label: theme.label,
        keywords: theme.keywords,
        papers: theme.papers,
        coherenceScore: this.calculateCoherence(theme.keywords, documents),
        prevalence: theme.papers.length / papers.length,
        evolution: this.calculateTopicEvolution(theme.papers, papers),
      };

      topics.push(topicModel);
    }

    return topics;
  }

  /**
   * Detect trends in research topics
   */
  async detectTrends(
    papers: any[],
    keywordAnalysis: KeywordAnalysis[],
  ): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];

    // Group papers by year
    const papersByYear = this.groupPapersByYear(papers);

    // Analyze top keywords for trends
    const topKeywords = keywordAnalysis.slice(0, 20);

    for (const keyword of topKeywords) {
      const timeSeries = this.buildTimeSeries(keyword.keyword, papersByYear);
      const trendType = this.detectTrendType(timeSeries);
      const projectedGrowth = this.projectGrowth(timeSeries);

      const trend: TrendAnalysis = {
        topic: keyword.keyword,
        trendType,
        timeSeriesData: timeSeries,
        projectedGrowth,
        inflectionPoints: this.detectInflectionPoints(timeSeries),
        relatedTopics: keyword.coOccurrences.slice(0, 5).map((c) => c.keyword),
        confidence: this.calculateTrendConfidence(timeSeries),
      };

      trends.push(trend);
    }

    return trends;
  }

  /**
   * Use AI to identify research gaps
   */
  async identifyGapsWithAI(
    papers: any[],
    topics: TopicModel[],
    trends: TrendAnalysis[],
  ): Promise<ResearchGap[]> {
    const gaps: ResearchGap[] = [];

    // Create detailed context with actual paper content
    const paperSummaries = papers
      .slice(0, 10)
      .map(
        (p, idx) =>
          `${idx + 1}. "${p.title}" (${p.year})\n   Abstract: ${(p.abstract || 'No abstract').substring(0, 200)}...`,
      )
      .join('\n\n');

    // Use AI to identify gaps with actual paper content
    const prompt = `
You are a research analyst. Analyze these ${papers.length} academic papers and identify 5 specific research gaps.

PAPERS ANALYZED:
${paperSummaries}

KEY TOPICS COVERED: ${topics.map((t) => t.label).join(', ')}
EMERGING TRENDS: ${trends
      .filter((t) => t.trendType === 'emerging')
      .map((t) => t.topic)
      .join(', ')}

For each gap, provide:
1. A SPECIFIC title (use actual concepts from the papers, not placeholders like "X" or "Y")
2. A detailed description explaining what's missing
3. Importance score (1-10)
4. Suggested methodology
5. Potential impact

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Specific gap title using real concepts",
    "description": "Detailed description of what's missing",
    "importance": 8,
    "methodology": "Suggested research approach",
    "impact": "Expected impact on the field"
  }
]

IMPORTANT: Use specific terminology from the papers. Do NOT use generic placeholders like "X", "Y", or "Z".
    `;

    try {
      const response = await this.openAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.7,
        maxTokens: 1500,
      });

      // Parse AI response
      const aiGaps = this.parseAIGapsResponse(response.content);

      this.logger.log(`AI identified ${aiGaps.length} gaps`);

      // Enhance gaps with additional analysis
      for (const aiGap of aiGaps) {
        // Ensure numeric values are valid
        const importance =
          typeof aiGap.importance === 'number' && !isNaN(aiGap.importance)
            ? Math.min(Math.max(aiGap.importance, 1), 10)
            : this.estimateImportance(aiGap, trends);

        const feasibility = this.estimateFeasibility(aiGap);
        const marketPotential = this.estimateMarketPotential(aiGap, trends);

        const gap: ResearchGap = {
          id: `gap-${Date.now()}-${Math.random()}`,
          title: aiGap.title || 'Untitled Research Gap',
          description: aiGap.description || 'No description provided',
          keywords: await this.extractKeywords(
            aiGap.description || aiGap.title || '',
          ),
          relatedPapers: this.findRelatedPapers(aiGap, papers),
          importance,
          feasibility,
          marketPotential,
          suggestedMethodology: aiGap.methodology || 'Mixed methods approach',
          estimatedImpact: aiGap.impact || 'Potential to advance the field',
          trendDirection: this.determineTrendDirection(aiGap, trends),
          confidenceScore: 0.75, // Default confidence for AI-identified gaps
        };

        gaps.push(gap);
      }

      this.logger.log(`Enhanced ${gaps.length} gaps with scores`);
    } catch (error) {
      this.logger.error('Error using AI for gap identification:', error);
      // Fall back to rule-based gap identification
      return this.identifyGapsRuleBased(papers, topics, trends);
    }

    return gaps;
  }

  /**
   * Score gaps based on multiple factors
   */
  async scoreGaps(
    gaps: ResearchGap[],
    trends: TrendAnalysis[],
  ): Promise<ResearchGap[]> {
    for (const gap of gaps) {
      // Note: Composite scores (_trendScore, _noveltyScore, _impactScore) can be calculated
      // here for future use in gap scoring refinement

      // Adjust scores based on trend analysis
      if (gap.trendDirection === 'emerging') {
        gap.importance *= 1.2;
        gap.marketPotential *= 1.3;
      } else if (gap.trendDirection === 'declining') {
        gap.importance *= 0.8;
        gap.marketPotential *= 0.7;
      }

      // Update confidence based on evidence
      gap.confidenceScore = this.calculateConfidence(gap, trends);
    }

    // Sort by combined score (importance * feasibility * market potential)
    return gaps.sort((a, b) => {
      const scoreA = a.importance * a.feasibility * a.marketPotential;
      const scoreB = b.importance * b.feasibility * b.marketPotential;
      return scoreB - scoreA;
    });
  }

  /**
   * Create a research opportunity from a gap
   */
  private async createOpportunity(
    gap: ResearchGap,
  ): Promise<ResearchOpportunity> {
    const opportunityScore = this.calculateOpportunityScore(gap);

    let analysis: any = {};

    try {
      // Generate detailed opportunity analysis using AI
      const prompt = `
        For the research gap: "${gap.title}"
        Description: ${gap.description}

        Provide:
        1. A rationale for why this is a valuable opportunity
        2. Suggested approach to address this gap
        3. Potential challenges (list 3-5)
        4. Required resources (list 3-5)
        5. Timeline estimate
        6. Potential collaborators or expertise needed
        7. Funding opportunities that might support this research
      `;

      const response = await this.openAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.6,
        maxTokens: 800,
      });

      analysis = this.parseOpportunityAnalysis(response.content);
    } catch (error: unknown) {
      // Phase 10.106 Phase 8: Use unknown with type narrowing
      const err = error as { message?: string };
      this.logger.warn(
        `Failed to generate AI opportunity analysis for gap "${gap.title}": ${err.message || 'Unknown error'}`,
      );
      // Continue with empty analysis - will use fallback values below
    }

    return {
      gap,
      opportunityScore,
      rationale: analysis.rationale || 'High-impact research opportunity',
      suggestedApproach: analysis.approach || gap.suggestedMethodology || '',
      potentialChallenges: analysis.challenges || [],
      requiredResources: analysis.resources || [],
      timelineEstimate: analysis.timeline || '12-18 months',
      collaborationSuggestions: analysis.collaborators,
      fundingOpportunities: analysis.funding,
    };
  }

  /**
   * Helper: Extract keywords from text
   */
  private async extractKeywords(text: string): Promise<string[]> {
    // Simple keyword extraction - in production, use NLP libraries
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4);

    // Remove common words
    const stopWords = new Set([
      'about',
      'above',
      'after',
      'again',
      'against',
      'being',
      'below',
      'between',
      'through',
      'during',
      'before',
      'under',
      'while',
      'where',
      'which',
      'these',
      'those',
      'their',
      'there',
      'would',
      'could',
      'should',
    ]);

    const keywords = words.filter((word) => !stopWords.has(word));

    // Get unique keywords with frequency
    const frequency = new Map<string, number>();
    for (const keyword of keywords) {
      frequency.set(keyword, (frequency.get(keyword) || 0) + 1);
    }

    // Return top keywords by frequency
    return Array.from(frequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * Helper: Calculate keyword importance
   */
  private calculateKeywordImportance(
    keyword: KeywordAnalysis,
    allKeywords: KeywordAnalysis[],
  ): number {
    const maxFrequency = Math.max(...allKeywords.map((k) => k.frequency));
    const normalizedFrequency = keyword.frequency / maxFrequency;

    const coOccurrenceScore = keyword.coOccurrences.length / 10;
    const contextDiversity = Math.min(keyword.contexts.length / 10, 1);

    return (
      normalizedFrequency * 0.5 +
      coOccurrenceScore * 0.3 +
      contextDiversity * 0.2
    );
  }

  /**
   * Helper: Calculate topic coherence
   */
  private calculateCoherence(keywords: string[], documents: any[]): number {
    // Simplified coherence calculation
    // In production, use proper coherence metrics like C_v or UMass
    let coherence = 0;
    let pairs = 0;

    for (let i = 0; i < keywords.length - 1; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const coOccurrences = documents.filter(
          (doc) =>
            doc.text.includes(keywords[i]) && doc.text.includes(keywords[j]),
        ).length;

        coherence += coOccurrences / documents.length;
        pairs++;
      }
    }

    return pairs > 0 ? coherence / pairs : 0;
  }

  /**
   * Helper: Calculate topic evolution over time
   */
  private calculateTopicEvolution(
    topicPapers: string[],
    allPapers: any[],
  ): any[] {
    const evolution: any[] = [];
    const papersByYear = this.groupPapersByYear(allPapers);

    for (const [year, yearPapers] of papersByYear) {
      const topicPapersInYear = yearPapers.filter((p) =>
        topicPapers.includes(p.id),
      );
      evolution.push({
        year,
        prevalence: topicPapersInYear.length / yearPapers.length,
      });
    }

    return evolution.sort((a, b) => a.year - b.year);
  }

  /**
   * Helper: Group papers by year
   */
  private groupPapersByYear(papers: any[]): Map<number, any[]> {
    const grouped = new Map<number, any[]>();

    for (const paper of papers) {
      const year = paper.year || new Date().getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(paper);
    }

    return grouped;
  }

  /**
   * Helper: Build time series data for a keyword
   */
  private buildTimeSeries(
    keyword: string,
    papersByYear: Map<number, any[]>,
  ): any[] {
    const timeSeries: any[] = [];

    for (const [year, papers] of papersByYear) {
      const frequency = papers.filter((p) =>
        (p.title + ' ' + (p.abstract || ''))
          .toLowerCase()
          .includes(keyword.toLowerCase()),
      ).length;

      timeSeries.push({ year, frequency });
    }

    return timeSeries.sort((a, b) => a.year - b.year);
  }

  /**
   * Helper: Detect trend type from time series
   */
  private detectTrendType(timeSeries: any[]): TrendAnalysis['trendType'] {
    if (timeSeries.length < 3) return 'stable';

    const recentGrowth = this.calculateRecentGrowth(timeSeries);
    const volatility = this.calculateVolatility(timeSeries);

    if (recentGrowth > 0.5) return 'growing';
    if (recentGrowth > 0.2 && volatility < 0.3) return 'emerging';
    if (recentGrowth < -0.3) return 'declining';
    if (volatility > 0.5) return 'cyclical';

    return 'stable';
  }

  /**
   * Helper: Calculate recent growth rate
   */
  private calculateRecentGrowth(timeSeries: any[]): number {
    if (timeSeries.length < 2) return 0;

    const recent = timeSeries.slice(-3);
    const earlier = timeSeries.slice(-6, -3);

    const recentAvg =
      recent.reduce((sum, point) => sum + point.frequency, 0) / recent.length;
    const earlierAvg =
      earlier.length > 0
        ? earlier.reduce((sum, point) => sum + point.frequency, 0) /
          earlier.length
        : recent[0].frequency;

    return earlierAvg > 0 ? (recentAvg - earlierAvg) / earlierAvg : 0;
  }

  /**
   * Helper: Calculate volatility
   */
  private calculateVolatility(timeSeries: any[]): number {
    if (timeSeries.length < 2) return 0;

    const frequencies = timeSeries.map((point) => point.frequency);
    const mean =
      frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
    const variance =
      frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) /
      frequencies.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Helper: Project future growth
   */
  private projectGrowth(timeSeries: any[]): number {
    if (timeSeries.length < 3) return 0;

    // Simple linear regression for projection
    const n = timeSeries.length;
    const sumX = timeSeries.reduce((sum, _point, i) => sum + i, 0);
    const sumY = timeSeries.reduce((sum, point) => sum + point.frequency, 0);
    const sumXY = timeSeries.reduce(
      (sum, point, i) => sum + i * point.frequency,
      0,
    );
    const sumX2 = timeSeries.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const currentValue = slope * (n - 1) + intercept;
    const projectedValue = slope * n + intercept;

    return currentValue > 0
      ? ((projectedValue - currentValue) / currentValue) * 100
      : 0;
  }

  /**
   * Helper: Detect inflection points in trend
   */
  private detectInflectionPoints(timeSeries: any[]): any[] {
    const inflectionPoints: any[] = [];

    if (timeSeries.length < 3) return inflectionPoints;

    for (let i = 1; i < timeSeries.length - 1; i++) {
      const prev = timeSeries[i - 1].frequency;
      const curr = timeSeries[i].frequency;
      const next = timeSeries[i + 1].frequency;

      // Detect peaks and troughs
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        inflectionPoints.push({
          year: timeSeries[i].year,
          event: curr > prev ? 'Peak' : 'Trough',
        });
      }
    }

    return inflectionPoints;
  }

  /**
   * Helper: Calculate trend confidence
   */
  private calculateTrendConfidence(timeSeries: any[]): number {
    if (timeSeries.length < 3) return 0.3;

    // Factors affecting confidence:
    // 1. Length of time series
    // 2. Consistency of trend
    // 3. Data completeness

    const lengthScore = Math.min(timeSeries.length / 10, 1);
    const volatility = this.calculateVolatility(timeSeries);
    const consistencyScore = Math.max(0, 1 - volatility);
    const dataCompleteness =
      timeSeries.filter((point) => point.frequency > 0).length /
      timeSeries.length;

    return lengthScore * 0.3 + consistencyScore * 0.4 + dataCompleteness * 0.3;
  }

  /**
   * Helper: Parse AI response for gaps
   */
  private parseAIGapsResponse(content: string): any[] {
    try {
      // Try to parse as JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fall back to text parsing
      const gaps: any[] = [];
      const sections = content.split(/\d+\.\s+/);

      for (const section of sections) {
        if (section.trim()) {
          const lines = section.split('\n');
          const gap = {
            title: lines[0]?.trim() || 'Untitled Gap',
            description: lines[1]?.trim() || '',
            importance: 7,
            methodology:
              lines.find((l) => l.toLowerCase().includes('method'))?.trim() ||
              '',
            impact:
              lines.find((l) => l.toLowerCase().includes('impact'))?.trim() ||
              '',
          };
          gaps.push(gap);
        }
      }

      return gaps;
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
      return [];
    }
  }

  /**
   * Helper: Find papers related to a gap
   */
  private findRelatedPapers(gap: any, papers: any[]): string[] {
    const relatedPapers: string[] = [];
    const gapKeywords = gap.title.toLowerCase().split(/\s+/);

    for (const paper of papers) {
      // Phase 10 Day 5.15: Prioritize full-text over abstract
      const content = (paper as any).fullText || paper.abstract || '';
      const paperText = `${paper.title} ${content}`.toLowerCase();
      const matchCount = gapKeywords.filter((keyword: string) =>
        paperText.includes(keyword),
      ).length;

      if (matchCount >= gapKeywords.length * 0.3) {
        relatedPapers.push(paper.id);
      }
    }

    return relatedPapers.slice(0, 10);
  }

  /**
   * Helper: Estimate importance of a gap
   */
  private estimateImportance(gap: any, trends: TrendAnalysis[]): number {
    let importance = 5; // Base importance

    // Check if gap relates to trending topics
    const gapKeywords = gap.title.toLowerCase().split(/\s+/);
    for (const trend of trends) {
      if (gapKeywords.includes(trend.topic.toLowerCase())) {
        if (trend.trendType === 'emerging' || trend.trendType === 'growing') {
          importance += 2;
        }
      }
    }

    return Math.min(importance, 10);
  }

  /**
   * Helper: Estimate feasibility
   * Phase 10.106 Phase 10: Typed gap input
   */
  private estimateFeasibility(gap: { description?: string }): number {
    // Simple heuristic - in production, use more sophisticated analysis
    let feasibility = 7;

    const description = gap.description?.toLowerCase() || '';

    // Adjust based on complexity indicators
    if (description.includes('complex') || description.includes('difficult')) {
      feasibility -= 2;
    }
    if (
      description.includes('simple') ||
      description.includes('straightforward')
    ) {
      feasibility += 1;
    }
    if (
      description.includes('novel') ||
      description.includes('unprecedented')
    ) {
      feasibility -= 1;
    }

    return Math.max(1, Math.min(feasibility, 10));
  }

  /**
   * Helper: Estimate market potential
   */
  private estimateMarketPotential(gap: any, trends: TrendAnalysis[]): number {
    let potential = 5;

    // Check trend alignment
    const gapKeywords = gap.title.toLowerCase().split(/\s+/);
    for (const trend of trends) {
      if (gapKeywords.includes(trend.topic.toLowerCase())) {
        if (trend.projectedGrowth > 20) {
          potential += 3;
        } else if (trend.projectedGrowth > 10) {
          potential += 2;
        }
      }
    }

    return Math.min(potential, 10);
  }

  /**
   * Helper: Determine trend direction for a gap
   */
  private determineTrendDirection(
    gap: any,
    trends: TrendAnalysis[],
  ): ResearchGap['trendDirection'] {
    const gapKeywords = gap.title.toLowerCase().split(/\s+/);

    for (const trend of trends) {
      if (gapKeywords.includes(trend.topic.toLowerCase())) {
        if (trend.trendType === 'emerging' || trend.trendType === 'growing') {
          return trend.trendType === 'emerging' ? 'emerging' : 'growing';
        }
        if (trend.trendType === 'declining') {
          return 'declining';
        }
      }
    }

    return 'stable';
  }

  /**
   * Helper: Rule-based gap identification fallback
   */
  private identifyGapsRuleBased(
    papers: any[],
    topics: TopicModel[],
    trends: TrendAnalysis[],
  ): ResearchGap[] {
    const gaps: ResearchGap[] = [];

    // Identify gaps based on topic coverage
    const wellCoveredTopics = topics.filter((t) => t.prevalence > 0.2);
    // Note: Under-covered topics (prevalence < 0.05) can be used for future gap detection

    // Gap 1: Under-researched emerging topics
    for (const trend of trends.filter((t) => t.trendType === 'emerging')) {
      const isUnderCovered = !wellCoveredTopics.some((topic) =>
        topic.keywords.includes(trend.topic),
      );

      if (isUnderCovered) {
        gaps.push({
          id: `gap-${Date.now()}-${Math.random()}`,
          title: `Emerging area: ${trend.topic}`,
          description: `Limited research on ${trend.topic} despite growing interest`,
          keywords: [trend.topic, ...trend.relatedTopics],
          relatedPapers: [],
          importance: 8,
          feasibility: 7,
          marketPotential: 8,
          suggestedMethodology: 'Exploratory study',
          trendDirection: 'emerging',
          confidenceScore: 0.6,
        });
      }
    }

    // Gap 2: Intersection of topics
    for (let i = 0; i < topics.length - 1; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const intersection = this.findTopicIntersection(
          topics[i],
          topics[j],
          papers,
        );
        if (intersection.gapIdentified) {
          gaps.push(intersection.gap);
        }
      }
    }

    return gaps;
  }

  /**
   * Helper: Find intersection gaps between topics
   */
  private findTopicIntersection(
    topic1: TopicModel,
    topic2: TopicModel,
    _papers: any[],
  ): any {
    const intersection = topic1.papers.filter((p) => topic2.papers.includes(p));

    if (intersection.length === 0) {
      return {
        gapIdentified: true,
        gap: {
          id: `gap-${Date.now()}-${Math.random()}`,
          title: `Integration of ${topic1.label} and ${topic2.label}`,
          description: `No studies found combining ${topic1.label} with ${topic2.label}`,
          keywords: [...topic1.keywords, ...topic2.keywords],
          relatedPapers: [
            ...topic1.papers.slice(0, 3),
            ...topic2.papers.slice(0, 3),
          ],
          importance: 6,
          feasibility: 6,
          marketPotential: 5,
          suggestedMethodology: 'Interdisciplinary approach',
          trendDirection: 'stable',
          confidenceScore: 0.5,
        },
      };
    }

    return { gapIdentified: false };
  }

  /**
   * Helper: Calculate confidence score
   */
  private calculateConfidence(
    gap: ResearchGap,
    trends: TrendAnalysis[],
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if gap aligns with trends
    const alignedTrends = trends.filter((t) =>
      gap.keywords.some((k) => k.toLowerCase() === t.topic.toLowerCase()),
    );

    confidence += alignedTrends.length * 0.1;

    // Increase confidence based on related papers
    if (gap.relatedPapers.length > 5) confidence += 0.1;
    if (gap.relatedPapers.length > 10) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * Helper: Calculate opportunity score
   */
  private calculateOpportunityScore(gap: ResearchGap): number {
    const weightedScore =
      gap.importance * 0.35 +
      gap.feasibility * 0.25 +
      gap.marketPotential * 0.25 +
      gap.confidenceScore * 15;

    return Math.round(weightedScore * 10) / 10;
  }

  /**
   * Helper: Parse opportunity analysis from AI
   */
  private parseOpportunityAnalysis(content: string): any {
    const analysis: any = {
      rationale: '',
      approach: '',
      challenges: [],
      resources: [],
      timeline: '',
      collaborators: [],
      funding: [],
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('rationale')) currentSection = 'rationale';
      else if (lowerLine.includes('approach')) currentSection = 'approach';
      else if (lowerLine.includes('challenge')) currentSection = 'challenges';
      else if (lowerLine.includes('resource')) currentSection = 'resources';
      else if (lowerLine.includes('timeline')) currentSection = 'timeline';
      else if (lowerLine.includes('collaborat'))
        currentSection = 'collaborators';
      else if (lowerLine.includes('funding')) currentSection = 'funding';
      else if (line.trim() && currentSection) {
        const cleanLine = line.replace(/^[-•*]\s*/, '').trim();

        if (
          ['challenges', 'resources', 'collaborators', 'funding'].includes(
            currentSection,
          )
        ) {
          if (cleanLine) analysis[currentSection].push(cleanLine);
        } else {
          analysis[currentSection] = cleanLine;
        }
      }
    }

    return analysis;
  }

  /**
   * Helper: Fetch papers with all metadata
   */
  private async fetchPapersWithMetadata(paperIds: string[]): Promise<any[]> {
    return await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
      include: {
        themes: true,
        collection: true,
      },
    });
  }
}
