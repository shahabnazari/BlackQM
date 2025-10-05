/**
 * Video Relevance Scoring Service
 *
 * Phase 9 Day 21 Task 3 Implementation
 *
 * Enterprise-grade AI-powered video relevance scoring using GPT-4.
 * Evaluates YouTube videos for research relevance based on metadata and context.
 *
 * Features:
 * - Relevance scoring (0-100)
 * - Academic vs entertainment classification
 * - AI reasoning and recommendations
 * - Batch processing support
 * - Result caching (24 hours)
 * - Cost optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  duration: number; // seconds
  publishedAt: Date;
  viewCount?: number;
}

export interface RelevanceScore {
  videoId: string;
  score: number; // 0-100
  reasoning: string;
  topics: string[];
  isAcademic: boolean;
  confidence: number; // 0-1
  recommendations: {
    transcribe: boolean;
    priority: 'high' | 'medium' | 'low';
  };
}

@Injectable()
export class VideoRelevanceService {
  private readonly logger = new Logger(VideoRelevanceService.name);
  private cache: Map<string, { score: RelevanceScore; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Score single video relevance
   */
  async scoreVideoRelevance(
    video: VideoMetadata,
    researchContext: string,
  ): Promise<RelevanceScore> {
    const cacheKey = `${video.videoId}:${researchContext}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for video ${video.videoId}`);
      return cached.score;
    }

    const prompt = this.buildScoringPrompt(video, researchContext);

    try {
      const response = await this.openaiService.generateCompletion(prompt, {
        model: 'smart', // GPT-4 for accuracy
        temperature: 0.3, // Lower for consistency
        maxTokens: 500,
        cache: false, // We handle caching ourselves
      });

      const score = this.parseAIResponse(response.content, video.videoId);

      // Cache result
      this.cache.set(cacheKey, { score, timestamp: Date.now() });

      return score;
    } catch (error: any) {
      this.logger.error(`Failed to score video ${video.videoId}: ${error.message}`);
      // Return default low score on error
      return {
        videoId: video.videoId,
        score: 0,
        reasoning: 'Failed to analyze video relevance',
        topics: [],
        isAcademic: false,
        confidence: 0,
        recommendations: {
          transcribe: false,
          priority: 'low',
        },
      };
    }
  }

  /**
   * Batch score multiple videos
   */
  async batchScoreVideos(
    videos: VideoMetadata[],
    researchContext: string,
  ): Promise<RelevanceScore[]> {
    this.logger.log(`Batch scoring ${videos.length} videos`);

    // Process in parallel with Promise.all
    const scores = await Promise.all(
      videos.map(video => this.scoreVideoRelevance(video, researchContext)),
    );

    return scores;
  }

  /**
   * AI auto-select top N relevant videos
   */
  async selectTopVideos(
    videos: VideoMetadata[],
    researchContext: string,
    topN: number = 5,
  ): Promise<{
    selectedVideos: string[];
    scores: RelevanceScore[];
    totalCost: number;
    reasoning: string;
  }> {
    const scores = await this.batchScoreVideos(videos, researchContext);

    // Sort by score descending
    const sortedScores = scores.sort((a, b) => b.score - a.score);

    // Select top N
    const topScores = sortedScores.slice(0, topN);
    const selectedVideoIds = topScores.map(s => s.videoId);

    // Calculate total transcription cost
    const totalCost = topScores.reduce((sum, score) => {
      const video = videos.find(v => v.videoId === score.videoId);
      if (!video) return sum;
      const durationMinutes = video.duration / 60;
      return sum + (durationMinutes * 0.006); // $0.006 per minute
    }, 0);

    const reasoning = this.generateSelectionReasoning(topScores);

    return {
      selectedVideos: selectedVideoIds,
      scores: topScores,
      totalCost,
      reasoning,
    };
  }

  /**
   * Build GPT-4 scoring prompt
   */
  private buildScoringPrompt(video: VideoMetadata, researchContext: string): string {
    return `Research Topic: "${researchContext}"
Video Title: "${video.title}"
Video Description: "${video.description}"
Channel: "${video.channelName}"
Duration: ${Math.round(video.duration / 60)} minutes
Views: ${video.viewCount || 'N/A'}

Score this video's relevance to the research topic (0-100):
- 0-30: Irrelevant (entertainment, unrelated)
- 31-60: Tangentially related (mentions topic)
- 61-80: Moderately relevant (discusses topic)
- 81-100: Highly relevant (research, methodology, findings)

Consider:
- Academic vs entertainment content
- Research methodology discussions
- Empirical findings or data
- Theoretical frameworks
- Educational value for researchers

Return JSON with this exact structure:
{
  "score": <number 0-100>,
  "reasoning": "<1-2 sentence explanation>",
  "topics": ["<topic1>", "<topic2>", "<topic3>"],
  "isAcademic": <true|false>,
  "confidence": <number 0-1>,
  "transcribe": <true|false>,
  "priority": "<high|medium|low>"
}`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(content: string, videoId: string): RelevanceScore {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        videoId,
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        topics: parsed.topics || [],
        isAcademic: parsed.isAcademic || false,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        recommendations: {
          transcribe: parsed.transcribe || parsed.score > 60,
          priority: parsed.priority || (parsed.score > 80 ? 'high' : parsed.score > 60 ? 'medium' : 'low'),
        },
      };
    } catch (error: any) {
      this.logger.warn(`Failed to parse AI response for video ${videoId}: ${error.message}`);
      // Return safe default
      return {
        videoId,
        score: 50,
        reasoning: 'Unable to determine relevance',
        topics: [],
        isAcademic: false,
        confidence: 0.3,
        recommendations: {
          transcribe: false,
          priority: 'low',
        },
      };
    }
  }

  /**
   * Generate reasoning for auto-selection
   */
  private generateSelectionReasoning(topScores: RelevanceScore[]): string {
    const avgScore = topScores.reduce((sum, s) => sum + s.score, 0) / topScores.length;
    const academicCount = topScores.filter(s => s.isAcademic).length;

    return `Selected ${topScores.length} videos with average relevance score of ${avgScore.toFixed(0)}%. ${academicCount} videos identified as academic content. Recommended for transcription based on research value and topic alignment.`;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
