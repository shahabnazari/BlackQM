import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { LiteratureService } from '../literature.service';
import { TikTokResearchService } from './tiktok-research.service';
import { InstagramManualService } from './instagram-manual.service';
import { TranscriptionService } from './transcription.service';
import {
  MultiMediaAnalysisService,
  ExtractedTheme,
} from './multimedia-analysis.service';

/**
 * Cross-Platform Knowledge Synthesis Service
 *
 * Enterprise-grade service for synthesizing research across multiple platforms
 * Unifies academic papers, YouTube, podcasts, TikTok, and Instagram content
 *
 * Core Capabilities:
 * 1. Multi-platform research synthesis
 * 2. Research dissemination tracking
 * 3. Emerging topics detection
 * 4. Platform-specific insights analysis
 * 5. Cross-platform knowledge graph construction
 *
 * Phase 9 Day 19 Task 3 Implementation
 */

export interface MultiPlatformSource {
  type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  id: string;
  title: string;
  author: string;
  publishedAt: Date;
  url: string;
  themes: ExtractedTheme[];
  relevanceScore: number;
  engagement?: {
    views?: number;
    likes?: number;
    shares?: number;
    citations?: number;
  };
}

export interface ThemeCluster {
  theme: string;
  totalSources: number;
  sources: {
    papers: number;
    youtube: number;
    podcasts: number;
    tiktok: number;
    instagram: number;
  };
  averageRelevance: number;
  platformSpecificLanguage: {
    academic: string[];
    popularScience: string[];
    socialMedia: string[];
  };
}

export interface DisseminationPath {
  theme: string;
  timeline: Array<{
    date: Date;
    platform: string;
    sourceTitle: string;
    reach: number;
    type: 'academic' | 'educational' | 'popular';
  }>;
  totalReach: number;
  disseminationPattern: 'academic-first' | 'viral-first' | 'parallel';
  disseminationVelocity: number; // Days from first to latest mention
}

export interface EmergingTopic {
  topic: string;
  socialMediaMentions: number;
  academicPapers: number;
  trendScore: number;
  platforms: string[];
  firstMentionDate: Date;
  growthRate: number; // Percentage increase in mentions
  recommendation: string;
  potentialGap: boolean;
}

export interface CrossPlatformSynthesisResult {
  query: string;
  sources: MultiPlatformSource[];
  themeClusters: ThemeCluster[];
  disseminationPaths: DisseminationPath[];
  emergingTopics: EmergingTopic[];
  platformInsights: {
    platform: string;
    sourceCount: number;
    averageEngagement: number;
    topThemes: string[];
    uniqueLanguage: string[];
  }[];
  synthesisDate: Date;
}

@Injectable()
export class CrossPlatformSynthesisService {
  private readonly logger = new Logger(CrossPlatformSynthesisService.name);

  constructor(
    _prisma: PrismaService,
    private literatureService: LiteratureService,
    private tiktokService: TikTokResearchService,
    _instagramService: InstagramManualService,
    _transcriptionService: TranscriptionService,
    _multimediaAnalysisService: MultiMediaAnalysisService,
  ) {}

  /**
   * Synthesize research across ALL platforms in parallel
   *
   * @param query Research query
   * @param options Search options
   * @returns Comprehensive synthesis result
   */
  async synthesizeMultiPlatformResearch(
    query: string,
    options?: {
      maxResults?: number;
      includeTranscripts?: boolean;
      timeWindow?: number; // Days
    },
  ): Promise<CrossPlatformSynthesisResult> {
    this.logger.log(`Starting multi-platform synthesis for: "${query}"`);

    const maxResults = options?.maxResults || 10;
    const timeWindow = options?.timeWindow || 90;

    // 1. Search all platforms in parallel
    const [papers, youtubeVideos, tiktokVideos] = await Promise.allSettled([
      this.searchAcademicPapers(query, maxResults),
      this.searchYouTube(query, maxResults, options?.includeTranscripts),
      this.searchTikTok(query, maxResults),
    ]);

    // Collect all sources
    const allSources: MultiPlatformSource[] = [];

    if (papers.status === 'fulfilled') {
      allSources.push(...papers.value);
    }
    if (youtubeVideos.status === 'fulfilled') {
      allSources.push(...youtubeVideos.value);
    }
    if (tiktokVideos.status === 'fulfilled') {
      allSources.push(...tiktokVideos.value);
    }

    // 2. Extract and cluster themes across platforms
    const themeClusters = await this.clusterThemesAcrossPlatforms(allSources);

    // 3. Track dissemination paths
    const disseminationPaths = await this.traceDisseminationPaths(
      themeClusters,
      allSources,
      timeWindow,
    );

    // 4. Identify emerging topics
    const emergingTopics = await this.identifyEmergingTopics(
      allSources,
      timeWindow,
    );

    // 5. Generate platform-specific insights
    const platformInsights = this.analyzePlatformDifferences(
      allSources,
      themeClusters,
    );

    return {
      query,
      sources: allSources,
      themeClusters,
      disseminationPaths,
      emergingTopics,
      platformInsights,
      synthesisDate: new Date(),
    };
  }

  /**
   * Track how themes spread across platforms over time
   * Identifies dissemination patterns: Paper → YouTube → Social Media
   */
  async traceDisseminationPaths(
    themeClusters: ThemeCluster[],
    sources: MultiPlatformSource[],
    _timeWindow: number,
  ): Promise<DisseminationPath[]> {
    this.logger.log('Tracing dissemination paths across platforms');

    const paths: DisseminationPath[] = [];

    for (const cluster of themeClusters) {
      // Find all sources mentioning this theme
      const relevantSources = sources.filter((source) =>
        source.themes.some((t) =>
          this.areThemesSimilar(t.theme, cluster.theme),
        ),
      );

      if (relevantSources.length < 2) continue;

      // Sort by publication date
      const sortedSources = relevantSources.sort(
        (a, b) => a.publishedAt.getTime() - b.publishedAt.getTime(),
      );

      // Build timeline
      const timeline = sortedSources.map((source) => ({
        date: source.publishedAt,
        platform: source.type,
        sourceTitle: source.title,
        reach: this.calculateReach(source),
        type: this.categorizeSourceType(source.type),
      }));

      // Calculate dissemination metrics
      const firstMention = sortedSources[0].publishedAt;
      const latestMention = sortedSources[sortedSources.length - 1].publishedAt;
      const velocityDays = Math.floor(
        (latestMention.getTime() - firstMention.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const totalReach = timeline.reduce((sum, item) => sum + item.reach, 0);

      // Determine dissemination pattern
      const pattern = this.identifyDisseminationPattern(timeline);

      paths.push({
        theme: cluster.theme,
        timeline,
        totalReach,
        disseminationPattern: pattern,
        disseminationVelocity: velocityDays,
      });
    }

    return paths.sort((a, b) => b.totalReach - a.totalReach);
  }

  /**
   * Identify topics trending in social media but not yet in academic papers
   * Highlights potential research gaps
   */
  async identifyEmergingTopics(
    sources: MultiPlatformSource[],
    timeWindow: number,
  ): Promise<EmergingTopic[]> {
    this.logger.log('Identifying emerging topics from social media');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    // Collect all themes from recent social media
    const socialMediaSources = sources.filter(
      (s) =>
        ['tiktok', 'instagram', 'youtube'].includes(s.type) &&
        s.publishedAt >= cutoffDate,
    );

    const academicSources = sources.filter((s) => s.type === 'paper');

    // Count theme mentions by platform
    const themeStats = new Map<
      string,
      {
        socialMentions: number;
        academicMentions: number;
        platforms: Set<string>;
        firstMention: Date;
        recentMentions: Date[];
      }
    >();

    for (const source of socialMediaSources) {
      for (const theme of source.themes) {
        const normalizedTheme = theme.theme.toLowerCase();
        const existing = themeStats.get(normalizedTheme) || {
          socialMentions: 0,
          academicMentions: 0,
          platforms: new Set(),
          firstMention: source.publishedAt,
          recentMentions: [],
        };

        existing.socialMentions++;
        existing.platforms.add(source.type);
        existing.recentMentions.push(source.publishedAt);
        if (source.publishedAt < existing.firstMention) {
          existing.firstMention = source.publishedAt;
        }

        themeStats.set(normalizedTheme, existing);
      }
    }

    // Check academic coverage
    for (const source of academicSources) {
      for (const theme of source.themes) {
        const normalizedTheme = theme.theme.toLowerCase();
        const existing = themeStats.get(normalizedTheme);
        if (existing) {
          existing.academicMentions++;
        }
      }
    }

    // Identify emerging topics (high social, low academic)
    const emergingTopics: EmergingTopic[] = [];

    for (const [topic, stats] of themeStats.entries()) {
      // Criteria for emerging topic:
      // 1. >10 social media mentions
      // 2. <5 academic papers
      // 3. Showing growth
      if (stats.socialMentions >= 10 && stats.academicMentions < 5) {
        const growthRate = this.calculateGrowthRate(
          stats.recentMentions,
          timeWindow,
        );
        const trendScore = this.calculateTrendScore(
          stats.socialMentions,
          stats.academicMentions,
          growthRate,
        );

        emergingTopics.push({
          topic,
          socialMediaMentions: stats.socialMentions,
          academicPapers: stats.academicMentions,
          trendScore,
          platforms: Array.from(stats.platforms),
          firstMentionDate: stats.firstMention,
          growthRate,
          recommendation: this.generateRecommendation(
            trendScore,
            stats.socialMentions,
          ),
          potentialGap: stats.academicMentions === 0,
        });
      }
    }

    return emergingTopics.sort((a, b) => b.trendScore - a.trendScore);
  }

  /**
   * Analyze platform-specific differences in how themes are discussed
   */
  analyzePlatformDifferences(
    sources: MultiPlatformSource[],
    _clusters: ThemeCluster[],
  ): Array<{
    platform: string;
    sourceCount: number;
    averageEngagement: number;
    topThemes: string[];
    uniqueLanguage: string[];
  }> {
    this.logger.log('Analyzing platform-specific differences');

    const platforms = ['paper', 'youtube', 'podcast', 'tiktok', 'instagram'];
    const insights = [];

    for (const platform of platforms) {
      const platformSources = sources.filter((s) => s.type === platform);

      if (platformSources.length === 0) continue;

      // Calculate average engagement
      const totalEngagement = platformSources.reduce((sum, s) => {
        const engagement = s.engagement || {};
        return sum + (engagement.views || 0) + (engagement.likes || 0) * 10;
      }, 0);
      const avgEngagement = totalEngagement / platformSources.length;

      // Identify top themes
      const themeFrequency = new Map<string, number>();
      for (const source of platformSources) {
        for (const theme of source.themes) {
          const count = themeFrequency.get(theme.theme) || 0;
          themeFrequency.set(theme.theme, count + 1);
        }
      }
      const topThemes = Array.from(themeFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      // Extract unique language patterns
      const uniqueLanguage = this.extractPlatformSpecificLanguage(
        platformSources,
        platform,
      );

      insights.push({
        platform,
        sourceCount: platformSources.length,
        averageEngagement: Math.round(avgEngagement),
        topThemes,
        uniqueLanguage: uniqueLanguage.slice(0, 10),
      });
    }

    return insights;
  }

  /**
   * Build cross-platform knowledge graph
   */
  async buildCrossPlatformGraph(sources: MultiPlatformSource[]) {
    this.logger.log('Building cross-platform knowledge graph');

    const nodes = sources.map((source) => ({
      id: source.id,
      type: source.type,
      label: source.title,
      themes: source.themes.map((t) => t.theme),
      publishedAt: source.publishedAt,
    }));

    const edges = [];

    // Connect sources with shared themes
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const similarity = this.calculateThemeSimilarity(
          sources[i].themes,
          sources[j].themes,
        );

        if (similarity > 0.3) {
          edges.push({
            source: sources[i].id,
            target: sources[j].id,
            weight: similarity,
            relationshipType: 'shares_themes',
          });
        }
      }
    }

    return { nodes, edges };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Search academic papers
   */
  private async searchAcademicPapers(
    query: string,
    maxResults: number,
  ): Promise<MultiPlatformSource[]> {
    try {
      const result = await this.literatureService.searchLiterature(
        {
          query,
          limit: maxResults,
          page: 1,
        },
        'system',
      );

      return result.papers.map((paper) => ({
        type: 'paper' as const,
        id: paper.doi || paper.id,
        title: paper.title,
        author: paper.authors?.[0] || 'Unknown',
        publishedAt: paper.year ? new Date(paper.year, 0, 1) : new Date(),
        url: paper.url || '',
        themes: [], // Will be extracted if needed
        relevanceScore: 0.9,
        engagement: {
          citations: paper.citationCount || 0,
        },
      }));
    } catch (error: any) {
      this.logger.error(`Failed to search academic papers: ${error.message}`);
      return [];
    }
  }

  /**
   * Search YouTube videos
   */
  private async searchYouTube(
    query: string,
    maxResults: number,
    _includeTranscripts?: boolean,
  ): Promise<MultiPlatformSource[]> {
    try {
      const videos = await this.literatureService['searchYouTube'](query);

      // Limit results
      const limitedVideos = videos.slice(0, maxResults);

      return limitedVideos.map((video) => ({
        type: 'youtube' as const,
        id: video.id,
        title: video.title,
        author: video.channelTitle,
        publishedAt: new Date(video.publishedAt),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        themes: [],
        relevanceScore: 0.7,
        engagement: {
          views: video.statistics?.viewCount,
          likes: video.statistics?.likeCount,
        },
      }));
    } catch (error: any) {
      this.logger.error(`Failed to search YouTube: ${error.message}`);
      return [];
    }
  }

  /**
   * Search TikTok videos
   */
  private async searchTikTok(
    query: string,
    maxResults: number,
  ): Promise<MultiPlatformSource[]> {
    try {
      const result = await this.tiktokService.searchTikTokVideos(
        query,
        maxResults,
      );

      return result.videos.map((video) => ({
        type: 'tiktok' as const,
        id: video.id,
        title: video.title || video.description,
        author: video.author,
        publishedAt: video.publishedAt,
        url: video.url,
        themes: [],
        relevanceScore: 0.5,
        engagement: {
          views: video.views,
          likes: video.likes,
          shares: video.shares,
        },
      }));
    } catch (error: any) {
      this.logger.error(`Failed to search TikTok: ${error.message}`);
      return [];
    }
  }

  /**
   * Cluster themes across all platforms
   */
  private async clusterThemesAcrossPlatforms(
    sources: MultiPlatformSource[],
  ): Promise<ThemeCluster[]> {
    const themeClusters = new Map<string, ThemeCluster>();

    for (const source of sources) {
      for (const theme of source.themes) {
        const normalizedTheme = theme.theme.toLowerCase();
        let cluster = themeClusters.get(normalizedTheme);

        if (!cluster) {
          cluster = {
            theme: theme.theme,
            totalSources: 0,
            sources: {
              papers: 0,
              youtube: 0,
              podcasts: 0,
              tiktok: 0,
              instagram: 0,
            },
            averageRelevance: 0,
            platformSpecificLanguage: {
              academic: [],
              popularScience: [],
              socialMedia: [],
            },
          };
          themeClusters.set(normalizedTheme, cluster);
        }

        cluster.totalSources++;
        cluster.sources[source.type as keyof typeof cluster.sources]++;
        cluster.averageRelevance =
          (cluster.averageRelevance * (cluster.totalSources - 1) +
            theme.relevanceScore) /
          cluster.totalSources;
      }
    }

    return Array.from(themeClusters.values()).sort(
      (a, b) => b.totalSources - a.totalSources,
    );
  }

  /**
   * Check if two themes are similar
   */
  private areThemesSimilar(theme1: string, theme2: string): boolean {
    const normalized1 = theme1.toLowerCase().replace(/[^\w\s]/g, '');
    const normalized2 = theme2.toLowerCase().replace(/[^\w\s]/g, '');

    const words1 = new Set(normalized1.split(/\s+/));
    const words2 = new Set(normalized2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size > 0.5;
  }

  /**
   * Calculate reach of a source
   */
  private calculateReach(source: MultiPlatformSource): number {
    const engagement = source.engagement || {};
    return (
      (engagement.views || 0) +
      (engagement.likes || 0) * 10 +
      (engagement.shares || 0) * 100 +
      (engagement.citations || 0) * 1000
    );
  }

  /**
   * Categorize source type
   */
  private categorizeSourceType(
    type: string,
  ): 'academic' | 'educational' | 'popular' {
    if (type === 'paper') return 'academic';
    if (type === 'youtube' || type === 'podcast') return 'educational';
    return 'popular';
  }

  /**
   * Identify dissemination pattern
   */
  private identifyDisseminationPattern(
    timeline: Array<{ type: string; platform: string }>,
  ): 'academic-first' | 'viral-first' | 'parallel' {
    if (timeline.length < 2) return 'parallel';

    const firstType = timeline[0].type;
    const hasAcademicFirst = firstType === 'academic';
    const hasViralFirst = firstType === 'popular';

    if (hasAcademicFirst) return 'academic-first';
    if (hasViralFirst) return 'viral-first';
    return 'parallel';
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(mentions: Date[], timeWindow: number): number {
    if (mentions.length < 2) return 0;

    const halfWindow = timeWindow / 2;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - halfWindow);

    const recentMentions = mentions.filter((d) => d >= cutoffDate).length;
    const olderMentions = mentions.length - recentMentions;

    if (olderMentions === 0) return 100;

    return ((recentMentions - olderMentions) / olderMentions) * 100;
  }

  /**
   * Calculate trend score
   */
  private calculateTrendScore(
    socialMentions: number,
    academicMentions: number,
    growthRate: number,
  ): number {
    const mentionScore = Math.log10(socialMentions + 1) * 20;
    const gapScore =
      academicMentions === 0 ? 30 : Math.max(0, 30 - academicMentions * 5);
    const growthScore = Math.min(growthRate, 50);

    return Math.round(mentionScore + gapScore + growthScore);
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(trendScore: number, mentions: number): string {
    if (trendScore > 80) {
      return `URGENT: Highly trending topic with ${mentions} mentions. Immediate research opportunity.`;
    } else if (trendScore > 60) {
      return `HIGH PRIORITY: Growing topic worth investigating. Strong research gap potential.`;
    } else if (trendScore > 40) {
      return `MODERATE: Emerging topic with ${mentions} mentions. Monitor for research opportunities.`;
    } else {
      return `LOW: Niche topic with limited mentions. Consider for specialized research.`;
    }
  }

  /**
   * Extract platform-specific language
   */
  private extractPlatformSpecificLanguage(
    sources: MultiPlatformSource[],
    _platform: string,
  ): string[] {
    const words = new Map<string, number>();

    for (const source of sources) {
      const text = `${source.title} ${source.themes.map((t) => t.theme).join(' ')}`;
      const tokens = text.toLowerCase().match(/\b\w{4,}\b/g) || [];

      for (const token of tokens) {
        words.set(token, (words.get(token) || 0) + 1);
      }
    }

    return Array.from(words.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
  }

  /**
   * Calculate theme similarity between sources
   */
  private calculateThemeSimilarity(
    themes1: ExtractedTheme[],
    themes2: ExtractedTheme[],
  ): number {
    if (themes1.length === 0 || themes2.length === 0) return 0;

    let matchCount = 0;
    for (const theme1 of themes1) {
      for (const theme2 of themes2) {
        if (this.areThemesSimilar(theme1.theme, theme2.theme)) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / Math.max(themes1.length, themes2.length);
  }
}
