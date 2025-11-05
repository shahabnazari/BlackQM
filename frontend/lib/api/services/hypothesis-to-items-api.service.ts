/**
 * Hypothesis to Items API Service
 *
 * Phase 10 Day 5.11 - Frontend API integration for hypothesis-to-items conversion
 *
 * Purpose: Convert research hypotheses into testable survey measurement items
 *
 * @date January 2025
 */

import { apiClient } from '../client';
import { secureStorage } from '@/lib/services/secure-storage.service';
import type {
  HypothesisToItemRequest,
  HypothesisToItemResult,
  ImportableItem,
  HypothesisSurveyItem,
} from '@/lib/types/questionnaire-import.types';

class HypothesisToItemsApiService {
  /**
   * Convert hypothesis into testable survey items
   */
  async convertHypothesisToItems(
    request: HypothesisToItemRequest,
  ): Promise<HypothesisToItemResult> {
    try {
      const response = await apiClient.post<HypothesisToItemResult>(
        '/research-design/hypothesis-to-items',
        request,
      );

      // Cache the result for later use
      if (response.data) {
        secureStorage.saveHypothesisResult(response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to convert hypothesis to items:', error);
      throw error;
    }
  }

  /**
   * Get previously converted hypotheses from cache
   */
  getHypothesisHistory(): HypothesisToItemResult[] {
    try {
      return secureStorage.getHypothesisResults();
    } catch (error: any) {
      console.error('Failed to get hypothesis history:', error);
      return [];
    }
  }

  /**
   * Convert hypothesis survey items to importable questionnaire items
   */
  convertToImportableItems(
    items: HypothesisSurveyItem[],
    variableName?: string,
  ): ImportableItem[] {
    return items.map((item, index) => ({
      id: `hyp-item-${item.id}`,
      type: this.mapScaleTypeToQuestionType(item.scaleType),
      title: item.text,
      description: `${variableName ? `Variable: ${variableName} | ` : ''}${item.purpose}`,
      required: false,
      order: index,
      options: item.scaleLabels,
      metadata: {
        source: 'hypothesis' as const,
        confidence: 0.90,
        reversed: item.reversed,
        generationMethod: item.researchBacking,
      },
      settings: {
        scaleType: this.mapScaleTypeToSettings(item.scaleType),
        ...(variableName && { construct: variableName }),
        showLabels: true,
      },
    }));
  }

  /**
   * Map hypothesis scale types to frontend question types
   */
  private mapScaleTypeToQuestionType(
    scaleType: HypothesisSurveyItem['scaleType'],
  ): ImportableItem['type'] {
    const mapping: Record<HypothesisSurveyItem['scaleType'], ImportableItem['type']> = {
      likert_5: 'likert',
      likert_7: 'likert',
      semantic_differential: 'scale',
      frequency: 'likert',
      agreement: 'likert',
      satisfaction: 'likert',
    };
    return mapping[scaleType] || 'likert';
  }

  /**
   * Map hypothesis scale types to frontend settings
   */
  private mapScaleTypeToSettings(
    scaleType: HypothesisSurveyItem['scaleType'],
  ): '1-5' | '1-7' | '1-10' | 'agree-disagree' | 'frequency' | 'satisfaction' {
    const mapping: Record<HypothesisSurveyItem['scaleType'], string> = {
      likert_5: '1-5',
      likert_7: '1-7',
      semantic_differential: '1-7',
      frequency: 'frequency',
      agreement: 'agree-disagree',
      satisfaction: 'satisfaction',
    };
    return (mapping[scaleType] as any) || '1-7';
  }

  /**
   * Save hypothesis for later use
   */
  async saveHypothesis(hypothesis: string, hypothesisType: string): Promise<void> {
    try {
      const history = secureStorage.getHypothesesList();
      history.push({ hypothesis, hypothesisType, timestamp: Date.now() });
      secureStorage.saveHypothesesList(history);
    } catch (error: any) {
      console.error('Failed to save hypothesis:', error);
    }
  }

  /**
   * Get saved hypotheses
   */
  getSavedHypotheses(): Array<{ hypothesis: string; hypothesisType: string; timestamp: number }> {
    try {
      return secureStorage.getHypothesesList();
    } catch (error: any) {
      console.error('Failed to get saved hypotheses:', error);
      return [];
    }
  }
}

export const hypothesisToItemsApiService = new HypothesisToItemsApiService();
