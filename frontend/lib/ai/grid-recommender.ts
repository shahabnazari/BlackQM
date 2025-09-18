/**
 * Grid Recommender Service for Phase 6.86
 * AI-powered Q-sort grid configuration recommendations
 */

import { aiService } from '@/lib/services/ai.service';
import {
  GridConfig,
  GridRecommendationRequest,
  GridRecommendation
} from '@/lib/types/ai.types';

// Predefined grid patterns for fallback
const PREDEFINED_GRIDS: Record<string, GridConfig[]> = {
  exploratory: [
    {
      columns: 9,
      distribution: [2, 3, 4, 5, 6, 5, 4, 3, 2],
      rationale: 'Normal distribution for exploratory studies. Allows nuanced sorting with a clear center.',
      bestFor: 'Studies exploring diverse viewpoints without strong preconceptions',
      statementCount: 34
    },
    {
      columns: 11,
      distribution: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1],
      rationale: 'Extended normal distribution for detailed exploration',
      bestFor: 'Complex topics requiring fine-grained distinctions',
      statementCount: 36
    },
    {
      columns: 7,
      distribution: [3, 4, 6, 7, 6, 4, 3],
      rationale: 'Simplified distribution for quicker sorting',
      bestFor: 'Time-constrained studies or less complex topics',
      statementCount: 33
    }
  ],
  confirmatory: [
    {
      columns: 9,
      distribution: [3, 3, 4, 4, 4, 4, 4, 3, 3],
      rationale: 'Flatter distribution for confirmatory studies. More items in neutral positions.',
      bestFor: 'Testing specific hypotheses with expected distributions',
      statementCount: 32
    },
    {
      columns: 11,
      distribution: [2, 2, 3, 4, 4, 4, 4, 4, 3, 2, 2],
      rationale: 'Extended flat distribution for hypothesis testing',
      bestFor: 'Detailed confirmatory analysis with multiple factors',
      statementCount: 34
    }
  ],
  mixed: [
    {
      columns: 9,
      distribution: [2, 3, 4, 4, 5, 4, 4, 3, 2],
      rationale: 'Balanced distribution for mixed-method studies',
      bestFor: 'Studies combining exploratory and confirmatory elements',
      statementCount: 31
    }
  ]
};

export class GridRecommenderService {
  private static instance: GridRecommenderService;
  
  private constructor() {}
  
  static getInstance(): GridRecommenderService {
    if (!GridRecommenderService.instance) {
      GridRecommenderService.instance = new GridRecommenderService();
    }
    return GridRecommenderService.instance;
  }
  
  async getRecommendations(
    request: GridRecommendationRequest
  ): Promise<GridRecommendation> {
    try {
      // Try AI-powered recommendations first
      const aiRecommendation = await this.getAIRecommendations(request);
      return aiRecommendation;
    } catch (error) {
      console.warn('AI recommendation failed, falling back to predefined grids', error);
      return this.getFallbackRecommendations(request);
    }
  }
  
  private async getAIRecommendations(
    request: GridRecommendationRequest
  ): Promise<GridRecommendation> {
    const prompt = this.buildPrompt(request);
    
    const response = await aiService.generateJSON<{
      configs: Array<{
        columns: number;
        distribution: number[];
        rationale: string;
        bestFor: string;
      }>;
      recommended: number;
      reasoning: string;
    }>(prompt);
    
    // Validate and adjust the response
    const configs = response.configs.map(config => this.validateGridConfig({
      ...config,
      statementCount: config.distribution.reduce((a, b) => a + b, 0)
    }, request.statementCount));
    
    return {
      configs,
      recommended: configs && configs.length > 0 
        ? (configs[response.recommended] || configs[0])
        : this.getDefaultGridConfig(request.statementCount),
      reasoning: response.reasoning
    };
  }
  
  private getDefaultGridConfig(statementCount: number): GridConfig {
    return {
      columns: 9,
      distribution: this.calculateDistribution(9, statementCount, 'normal'),
      rationale: 'Default normal distribution',
      bestFor: 'General Q-methodology studies',
      statementCount
    };
  }
  
  private buildPrompt(request: GridRecommendationRequest): string {
    return `You are an expert in Q-methodology research design. Generate 3 Q-sort grid configurations for the following study:

Study Type: ${request.studyType}
Number of Statements: ${request.statementCount}
${request.participantCount ? `Expected Participants: ${request.participantCount}` : ''}
${request.context ? `Additional Context: ${request.context}` : ''}

Requirements:
1. Each grid must have an odd number of columns (typically 7-13)
2. The distribution must be roughly symmetrical (quasi-normal)
3. The sum of all positions in the distribution must equal ${request.statementCount}
4. Consider the study type when recommending distributions:
   - Exploratory: More normal/peaked distribution
   - Confirmatory: Flatter distribution
   - Mixed: Balanced approach

Return a JSON object with:
{
  "configs": [
    {
      "columns": <number of columns>,
      "distribution": [<array of numbers representing cards per column>],
      "rationale": "<explanation of why this grid works>",
      "bestFor": "<what this grid is best suited for>"
    }
  ],
  "recommended": <index of recommended config (0-2)>,
  "reasoning": "<why this is recommended for this specific study>"
}

Important: Ensure the sum of the distribution array equals exactly ${request.statementCount}.`;
  }
  
  private validateGridConfig(
    config: GridConfig,
    targetCount: number
  ): GridConfig {
    const actualCount = config.distribution.reduce((a, b) => a + b, 0);
    
    // If the count doesn't match, adjust the middle column
    if (actualCount !== targetCount) {
      const diff = targetCount - actualCount;
      const middleIndex = Math.floor(config.distribution.length / 2);
      
      // Create a new array to avoid mutation
      const adjustedDistribution = [...config.distribution];
      adjustedDistribution[middleIndex] += diff;
      
      // Ensure no negative values
      if (adjustedDistribution[middleIndex] < 0) {
        // Redistribute if middle column would be negative
        return this.redistributeGrid(config, targetCount);
      }
      
      return {
        ...config,
        distribution: adjustedDistribution,
        statementCount: targetCount
      };
    }
    
    return config;
  }
  
  private redistributeGrid(
    config: GridConfig,
    targetCount: number
  ): GridConfig {
    // Calculate ideal distribution for the given column count
    const columns = config.columns;
    const baseCount = Math.floor(targetCount / columns);
    
    // Create a quasi-normal distribution
    const distribution: number[] = [];
    const middle = Math.floor(columns / 2);
    
    for (let i = 0; i < columns; i++) {
      const distanceFromMiddle = Math.abs(i - middle);
      distribution[i] = Math.max(1, baseCount - distanceFromMiddle);
    }
    
    // Add remainder to middle columns
    let remainingToAdd = targetCount - distribution.reduce((a, b) => a + b, 0);
    for (let i = 0; remainingToAdd > 0 && i < columns; i++) {
      const index = middle + (i % 2 === 0 ? Math.floor(i / 2) : -Math.ceil(i / 2));
      if (index >= 0 && index < columns && distribution[index] !== undefined) {
        distribution[index]++;
        remainingToAdd--;
      }
    }
    
    return {
      ...config,
      distribution,
      statementCount: targetCount
    };
  }
  
  private getFallbackRecommendations(
    request: GridRecommendationRequest
  ): GridRecommendation {
    const configs = PREDEFINED_GRIDS[request.studyType] || PREDEFINED_GRIDS.mixed;
    
    // Adjust configs for the specific statement count
    const adjustedConfigs = configs ? configs.map(config => 
      this.validateGridConfig(config, request.statementCount)
    ) : [];
    
    // Select the best match based on statement count
    const recommended = this.selectBestGrid(adjustedConfigs, request);
    
    return {
      configs: adjustedConfigs,
      recommended,
      reasoning: `Based on your ${request.studyType} study with ${request.statementCount} statements, ` +
                `this grid provides an optimal balance between discrimination and ease of sorting.`
    };
  }
  
  private selectBestGrid(
    configs: GridConfig[],
    request: GridRecommendationRequest
  ): GridConfig {
    // Simple heuristic: prefer grids closer to the target statement count
    let bestConfig = configs[0];
    let bestDiff = Math.abs(configs[0].statementCount - request.statementCount);
    
    for (const config of configs) {
      const diff = Math.abs(config.statementCount - request.statementCount);
      if (diff < bestDiff) {
        bestConfig = config;
        bestDiff = diff;
      }
    }
    
    return bestConfig;
  }
  
  // Additional utility methods
  
  generateCustomGrid(
    columns: number,
    statementCount: number,
    distributionType: 'normal' | 'flat' | 'steep' = 'normal'
  ): GridConfig {
    const distribution = this.calculateDistribution(columns, statementCount, distributionType);
    
    return {
      columns,
      distribution,
      rationale: `Custom ${distributionType} distribution with ${columns} columns`,
      bestFor: 'Custom study requirements',
      statementCount
    };
  }
  
  private calculateDistribution(
    columns: number,
    total: number,
    type: 'normal' | 'flat' | 'steep'
  ): number[] {
    const distribution: number[] = new Array(columns).fill(0);
    const middle = Math.floor(columns / 2);
    
    // Calculate weights based on distribution type
    const weights: number[] = [];
    for (let i = 0; i < columns; i++) {
      const distanceFromMiddle = Math.abs(i - middle);
      let weight: number;
      
      switch (type) {
        case 'flat':
          weight = 1 - (distanceFromMiddle * 0.1);
          break;
        case 'steep':
          weight = Math.exp(-distanceFromMiddle * 0.5);
          break;
        case 'normal':
        default:
          weight = Math.exp(-Math.pow(distanceFromMiddle, 2) / (2 * Math.pow(columns / 4, 2)));
      }
      
      weights[i] = Math.max(0.1, weight);
    }
    
    // Normalize weights to sum to 1
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    // Distribute statements according to weights
    let distributed = 0;
    for (let i = 0; i < columns; i++) {
      const value = Math.round(normalizedWeights[i] * total);
      distribution[i] = value;
      distributed += value;
    }
    
    // Adjust for rounding errors
    let diff = total - distributed;
    let index = middle;
    while (diff !== 0) {
      if (distribution[index] !== undefined) {
        if (diff > 0) {
          distribution[index]++;
          diff--;
        } else {
          if (distribution[index] > 1) {
            distribution[index]--;
            diff++;
          }
        }
      }
      
      // Move to next position
      index = (index + 1) % columns;
    }
    
    return distribution;
  }
}

// Export singleton instance
export const gridRecommender = GridRecommenderService.getInstance();

// Export convenience functions
export async function getGridRecommendations(
  statementCount: number,
  studyType: 'exploratory' | 'confirmatory' | 'mixed' = 'exploratory',
  context?: string
): Promise<GridRecommendation> {
  return gridRecommender.getRecommendations({
    statementCount,
    studyType,
    context
  });
}

export function generateCustomGrid(
  columns: number,
  statementCount: number,
  distributionType?: 'normal' | 'flat' | 'steep'
): GridConfig {
  return gridRecommender.generateCustomGrid(columns, statementCount, distributionType);
}