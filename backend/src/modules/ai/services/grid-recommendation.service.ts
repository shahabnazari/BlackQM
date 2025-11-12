import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { AICostService } from './ai-cost.service';
import * as crypto from 'crypto';

export interface GridConfig {
  columns: number;
  distribution: number[];
  labels: string[];
  reasoning: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

@Injectable()
export class GridRecommendationService {
  private readonly logger = new Logger(GridRecommendationService.name);
  private readonly cache = new Map<string, { data: GridConfig[]; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly costService: AICostService,
  ) {}

  async getRecommendations(
    studyTopic: string,
    expectedStatements: number,
    participantExperience: string = 'intermediate',
    researchType: string = 'exploratory',
    userId: string,
  ): Promise<GridConfig[]> {
    // Check cache
    const cacheKey = this.getCacheKey(studyTopic, expectedStatements, participantExperience);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached grid recommendations');
      return cached;
    }

    try {
      const prompt = this.buildPrompt(
        studyTopic,
        expectedStatements,
        participantExperience,
        researchType,
      );

      const response = await this.openaiService.generateCompletion(
        prompt,
        { model: 'smart', temperature: 0.7, maxTokens: 1500, userId },
      );

      const recommendations = this.parseRecommendations(response.content);
      
      // Add fallback if AI doesn't return valid grids
      if (recommendations.length === 0) {
        this.logger.warn('AI returned no valid grids, using fallback');
        return this.getFallbackGrids(expectedStatements);
      }

      // Cache the result
      this.setCache(cacheKey, recommendations);
      
      // Cost tracking is handled by OpenAIService

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to generate grid recommendations:', error);
      return this.getFallbackGrids(expectedStatements);
    }
  }

  private buildPrompt(
    topic: string,
    statementCount: number,
    experience: string,
    researchType: string,
  ): string {
    return `Generate 3 Q-methodology grid configurations for a study about "${topic}".

Requirements:
- Total statements: ${statementCount}
- Participant experience: ${experience}
- Research type: ${researchType}
- Each grid should have a forced normal distribution
- Columns should range from -4 to +4 (or similar)
- Distribution must sum to exactly ${statementCount}

Return a JSON array with 3 grid options. Each should have:
{
  "columns": number of columns,
  "distribution": [array of counts per column],
  "labels": [array of column labels like "-4", "-3", ..., "+4"],
  "reasoning": "explanation of why this grid works",
  "complexity": "simple" | "moderate" | "complex"
}

Consider:
- Novice participants need simpler grids (7-9 columns)
- Expert participants can handle complex grids (9-11 columns)
- Exploratory research benefits from wider distributions
- Confirmatory research needs more centered distributions`;
  }

  private parseRecommendations(response: string): GridConfig[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate each grid
      return parsed
        .filter((grid: any) => this.isValidGrid(grid))
        .map((grid: any) => ({
          columns: grid.columns,
          distribution: grid.distribution,
          labels: grid.labels,
          reasoning: grid.reasoning,
          complexity: grid.complexity,
        }));
    } catch (error) {
      this.logger.error('Failed to parse grid recommendations:', error);
      return [];
    }
  }

  private isValidGrid(grid: any): boolean {
    return (
      typeof grid.columns === 'number' &&
      Array.isArray(grid.distribution) &&
      Array.isArray(grid.labels) &&
      grid.distribution.length === grid.columns &&
      grid.labels.length === grid.columns &&
      grid.distribution.reduce((a: number, b: number) => a + b, 0) > 0
    );
  }

  private getFallbackGrids(statementCount: number): GridConfig[] {
    // Standard Q-sort distributions
    const distributions = {
      25: {
        simple: [1, 2, 3, 5, 6, 5, 3],
        moderate: [1, 1, 2, 3, 4, 5, 4, 3, 2],
        complex: [1, 1, 2, 2, 3, 4, 5, 4, 3],
      },
      40: {
        simple: [2, 3, 4, 6, 10, 6, 4, 3, 2],
        moderate: [1, 2, 3, 4, 5, 6, 7, 6, 5, 1],
        complex: [1, 2, 2, 3, 4, 5, 6, 7, 6, 4],
      },
      60: {
        simple: [2, 3, 5, 8, 12, 14, 8, 5, 3],
        moderate: [2, 3, 4, 6, 8, 10, 12, 8, 5, 2],
        complex: [1, 2, 3, 5, 7, 9, 11, 9, 7, 4, 2],
      },
    };

    // Find closest distribution
    const counts = Object.keys(distributions).map(Number);
    const closest = counts.reduce((prev, curr) =>
      Math.abs(curr - statementCount) < Math.abs(prev - statementCount) ? curr : prev,
    );

    const config = distributions[closest as keyof typeof distributions];

    return [
      {
        columns: config.simple.length,
        distribution: config.simple,
        labels: this.generateLabels(config.simple.length),
        reasoning: 'Simple grid suitable for novice participants with clear extremes',
        complexity: 'simple',
      },
      {
        columns: config.moderate.length,
        distribution: config.moderate,
        labels: this.generateLabels(config.moderate.length),
        reasoning: 'Moderate complexity balancing detail with usability',
        complexity: 'moderate',
      },
      {
        columns: config.complex.length,
        distribution: config.complex,
        labels: this.generateLabels(config.complex.length),
        reasoning: 'Complex grid for nuanced sorting with expert participants',
        complexity: 'complex',
      },
    ];
  }

  private generateLabels(columns: number): string[] {
    const mid = Math.floor(columns / 2);
    return Array.from({ length: columns }, (_, i) => {
      const value = i - mid;
      if (value === 0) return '0';
      return value > 0 ? `+${value}` : `${value}`;
    });
  }

  private getCacheKey(...args: any[]): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(args))
      .digest('hex');
  }

  private getFromCache(key: string): GridConfig[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: GridConfig[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
}