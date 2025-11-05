/**
 * Theme-to-Survey Item API Service
 *
 * Purpose: Frontend API integration for converting themes to survey items
 * Part of Phase 10 Day 5.9 implementation
 *
 * @date January 2025
 */

import { apiClient } from '../client';
import { secureStorage } from '@/lib/services/secure-storage.service';
import type { ImportableItem } from '@/lib/types/questionnaire-import.types';

export interface Theme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  confidence: number;
  sources?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  keyPhrases?: string[];
  subthemes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface SurveyItem {
  id: string;
  type:
    | 'likert'
    | 'multiple_choice'
    | 'semantic_differential'
    | 'matrix_grid'
    | 'rating_scale';
  themeId: string;
  themeName: string;
  text: string;
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';
  scaleLabels?: string[];
  options?: string[];
  reversed?: boolean;
  dimension?: string;
  leftPole?: string;
  rightPole?: string;
  construct?: string;
  itemNumber?: number;
  reliability?: {
    reverseCodedReason?: string;
    expectedCorrelation?: 'positive' | 'negative';
  };
  metadata: {
    generationMethod: string;
    researchBacking: string;
    confidence: number;
    themePrevalence: number;
  };
}

export interface GenerateSurveyItemsOptions {
  themes: Theme[];
  itemType:
    | 'likert'
    | 'multiple_choice'
    | 'semantic_differential'
    | 'matrix_grid'
    | 'rating_scale'
    | 'mixed';
  scaleType?:
    | '1-5'
    | '1-7'
    | '1-10'
    | 'agree-disagree'
    | 'frequency'
    | 'satisfaction';
  itemsPerTheme?: number;
  includeReverseCoded?: boolean;
  researchContext?: string;
  targetAudience?: string;
}

export interface SurveyItemGenerationResult {
  items: SurveyItem[];
  summary: {
    totalItems: number;
    itemsByType: Record<string, number>;
    reverseCodedCount: number;
    averageConfidence: number;
  };
  methodology: {
    approach: string;
    researchBacking: string;
    validation: string;
    reliability: string;
  };
  recommendations: {
    pilotTesting: string;
    reliabilityAnalysis: string;
    validityChecks: string;
  };
}

class ThemeToSurveyService {
  /**
   * Generate survey items from themes
   */
  async generateSurveyItems(
    options: GenerateSurveyItemsOptions
  ): Promise<SurveyItemGenerationResult> {
    try {
      const response = await apiClient.post<SurveyItemGenerationResult>(
        '/literature/themes/survey-items',
        options
      );
      return response.data;
    } catch (error) {
      console.error('Failed to generate survey items:', error);
      throw error;
    }
  }

  /**
   * Get previously extracted themes for a user
   * This would typically fetch from a saved study or research session
   */
  async getUserThemes(_userId?: string): Promise<Theme[]> {
    try {
      // Try to get themes from secure storage first
      const cachedThemes = secureStorage.getThemes();
      if (cachedThemes.length > 0) {
        return cachedThemes;
      }

      // In production, this would call an API endpoint
      // For now, return empty array if no cached themes
      return [];
    } catch (error) {
      console.error('Failed to get user themes:', error);
      return [];
    }
  }

  /**
   * Save extracted themes for later use
   */
  async saveThemes(themes: Theme[]): Promise<void> {
    try {
      // Validate themes before saving
      if (!Array.isArray(themes)) {
        throw new Error('Invalid themes data: must be an array');
      }

      // Save to secure storage
      const success = secureStorage.saveThemes(themes);
      if (!success) {
        throw new Error('Failed to save themes to secure storage');
      }

      // In production, this would also save to the backend
    } catch (error) {
      console.error('Failed to save themes:', error);
      throw error;
    }
  }

  /**
   * Convert survey items to questionnaire format for import
   */
  convertToQuestionnaireFormat(items: SurveyItem[]): ImportableItem[] {
    return items.map((item, index) => ({
      id: `imported-${item.id}`,
      type: this.mapItemTypeToQuestionType(item.type),
      title: item.text,
      description: `Generated from theme: ${item.themeName}`,
      required: false,
      order: index,
      options:
        item.options ||
        item.scaleLabels ||
        this.generateScaleOptions(item.scaleType),
      metadata: {
        source: 'theme-extraction' as const,
        themeId: item.themeId,
        themeName: item.themeName,
        confidence: item.metadata.confidence,
        reversed: item.reversed || false,
        generationMethod: item.metadata.generationMethod,
      },
      settings: {
        ...(item.scaleType && { scaleType: item.scaleType }),
        ...(item.leftPole && { leftPole: item.leftPole }),
        ...(item.rightPole && { rightPole: item.rightPole }),
        ...(item.construct && { construct: item.construct }),
      },
    }));
  }

  private mapItemTypeToQuestionType(itemType: string): ImportableItem['type'] {
    const typeMap: Record<string, ImportableItem['type']> = {
      likert: 'likert',
      multiple_choice: 'radio',
      semantic_differential: 'scale',
      matrix_grid: 'matrix',
      rating_scale: 'scale',
    };
    return typeMap[itemType] || 'text';
  }

  private generateScaleOptions(scaleType?: string): string[] {
    switch (scaleType) {
      case '1-5':
        return ['1', '2', '3', '4', '5'];
      case '1-7':
        return ['1', '2', '3', '4', '5', '6', '7'];
      case '1-10':
        return Array.from({ length: 10 }, (_, i) => String(i + 1));
      case 'agree-disagree':
        return [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree',
        ];
      case 'frequency':
        return ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
      case 'satisfaction':
        return [
          'Very Dissatisfied',
          'Dissatisfied',
          'Neutral',
          'Satisfied',
          'Very Satisfied',
        ];
      default:
        return ['1', '2', '3', '4', '5'];
    }
  }
}

export const themeToSurveyService = new ThemeToSurveyService();
