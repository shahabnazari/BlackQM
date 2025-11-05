/**
 * Research Question to Items API Service
 *
 * Phase 10 Day 5.10 - Frontend API integration for research question operationalization
 *
 * Purpose: Convert research questions into measurable survey items
 *
 * @date January 2025
 */

import { apiClient } from '../client';
import { secureStorage } from '@/lib/services/secure-storage.service';
import type {
  OperationalizationRequest,
  OperationalizationResult,
  ImportableItem,
  SurveyMeasurementItem,
} from '@/lib/types/questionnaire-import.types';

class ResearchQuestionToItemsApiService {
  /**
   * Operationalize a research question into survey items
   */
  async operationalizeQuestion(
    request: OperationalizationRequest
  ): Promise<OperationalizationResult> {
    try {
      const response = await apiClient.post<OperationalizationResult>(
        '/research-design/question-to-items',
        request
      );

      // Cache the result for later use
      if (response.data) {
        secureStorage.saveOperationalizationResult(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to operationalize research question:', error);
      throw error;
    }
  }

  /**
   * Get previously operationalized questions from cache
   */
  getOperationalizationHistory(): OperationalizationResult[] {
    try {
      return secureStorage.getOperationalizationResults();
    } catch (error) {
      console.error('Failed to get operationalization history:', error);
      return [];
    }
  }

  /**
   * Convert survey measurement items to importable questionnaire items
   */
  convertToImportableItems(
    measurementItems: SurveyMeasurementItem[],
    constructName?: string
  ): ImportableItem[] {
    return measurementItems.map((item, index) => ({
      id: `rq-item-${item.id}`,
      type: this.mapScaleTypeToQuestionType(item.scaleType),
      title: item.text,
      description: `${constructName ? `Construct: ${constructName} | ` : ''}${item.psychometricNote}`,
      required: false,
      order: index,
      options: item.scaleLabels,
      metadata: {
        source: 'research-question' as const,
        confidence: 0.85,
        reversed: item.reversed,
        generationMethod: item.researchBacking,
      },
      settings: {
        scaleType: this.mapScaleTypeToSettings(item.scaleType),
        ...(constructName && { construct: constructName }),
        showLabels: true,
      },
    }));
  }

  /**
   * Map backend scale types to frontend question types
   */
  private mapScaleTypeToQuestionType(
    scaleType: SurveyMeasurementItem['scaleType']
  ): ImportableItem['type'] {
    const mapping: Record<
      SurveyMeasurementItem['scaleType'],
      ImportableItem['type']
    > = {
      likert_5: 'likert',
      likert_7: 'likert',
      semantic_differential: 'scale',
      frequency: 'likert',
      agreement: 'likert',
      satisfaction: 'likert',
      importance: 'likert',
    };
    return mapping[scaleType] || 'likert';
  }

  /**
   * Map backend scale types to frontend settings
   */
  private mapScaleTypeToSettings(
    scaleType: SurveyMeasurementItem['scaleType']
  ): '1-5' | '1-7' | '1-10' | 'agree-disagree' | 'frequency' | 'satisfaction' {
    const mapping: Record<SurveyMeasurementItem['scaleType'], string> = {
      likert_5: '1-5',
      likert_7: '1-7',
      semantic_differential: '1-7',
      frequency: 'frequency',
      agreement: 'agree-disagree',
      satisfaction: 'satisfaction',
      importance: '1-5',
    };
    return (mapping[scaleType] as any) || '1-5';
  }

  /**
   * Save research question for later use
   */
  async saveResearchQuestion(
    question: string,
    studyType: string
  ): Promise<void> {
    try {
      const history = secureStorage.getResearchQuestions();
      history.push({ question, studyType, timestamp: Date.now() });
      secureStorage.saveResearchQuestions(history);
    } catch (error) {
      console.error('Failed to save research question:', error);
    }
  }

  /**
   * Get saved research questions
   */
  getSavedQuestions(): Array<{
    question: string;
    studyType: string;
    timestamp: number;
  }> {
    try {
      return secureStorage.getResearchQuestions();
    } catch (error) {
      console.error('Failed to get saved questions:', error);
      return [];
    }
  }
}

export const researchQuestionToItemsApiService =
  new ResearchQuestionToItemsApiService();
