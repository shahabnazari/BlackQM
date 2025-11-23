/**
 * Research Output Handlers Hook
 * Phase 10.935 Day 2 Evening: Component Size Reduction
 *
 * **Purpose:**
 * Extract research output interaction handlers from ThemeExtractionContainer.
 * Handles user interactions with generated research outputs (questions, hypotheses, constructs, surveys).
 *
 * **Responsibilities:**
 * - Handle research question selection and operationalization
 * - Handle hypothesis selection and testing
 * - Handle construct and relationship clicks
 * - Handle survey editing and exporting
 * - Navigate to appropriate design pages
 * - Save data to localStorage/storage
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper memoization (useCallback)
 * - ✅ Comprehensive error handling
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Input validation
 * - ✅ Toast notifications for user feedback
 *
 * @module useResearchOutputHandlers
 * @since Phase 10.935 Day 2 Evening
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Storage services
import {
  saveResearchQuestions as saveResearchQuestionsToStorage,
  saveHypotheses as saveHypothesesToStorage,
} from '@/lib/api/services/enhanced-theme-integration-api.service';

// Types
import type {
  ResearchQuestionSuggestion as ResearchQuestion,
  Theme,
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import type { HypothesisSuggestion as HypothesisSuggestionType } from '@/components/literature';
import type { ResearchPurpose } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// Constants
// ============================================================================

/**
 * Export format options for survey export
 */
const EXPORT_FORMATS = {
  JSON: 'json' as const,
  CSV: 'csv' as const,
  PDF: 'pdf' as const,
  WORD: 'word' as const,
} as const;

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseResearchOutputHandlersReturn {
  handleSelectQuestion: (q: ResearchQuestion) => void;
  handleOperationalizeQuestion: (q: ResearchQuestion) => void;
  handleSelectHypothesis: (h: HypothesisSuggestionType) => void;
  handleTestHypothesis: (h: HypothesisSuggestionType) => void;
  handleConstructClick: (id: string) => void;
  handleRelationshipClick: (source: string, target: string) => void;
  handleEditSurvey: () => void;
  handleExportSurvey: (format: string) => void;
}

// ============================================================================
// Hook Parameters
// ============================================================================

export interface UseResearchOutputHandlersParams {
  mappedSelectedThemes: Theme[];
  constructMappings: Array<{
    construct: {
      id: string;
      name: string;
      themes: string[];
    };
    relatedConstructs: Array<{
      constructId: string;
      relationshipType: string;
      confidence: number;
    }>;
  }>;
  generatedSurvey: {
    sections: Array<{
      title: string;
      items: Array<{
        id: string;
        text: string;
        type: string;
        themeProvenance: string[];
        options?: string[];
        scaleType?: string;
      }>;
    }>;
    metadata: {
      totalItems: number;
      estimatedCompletionTime: number;
      themeCoverage: Array<{
        themeId: string;
        themeName: string;
        itemCount: number;
      }>;
      generatedAt: string;
      purpose: string;
    };
  } | null;
  extractionPurpose: ResearchPurpose | null;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useResearchOutputHandlers - Hook for research output interactions
 *
 * **Extracted from ThemeExtractionContainer to reduce component size.**
 *
 * Provides memoized handlers for:
 * - Selecting and operationalizing research questions
 * - Selecting and testing hypotheses
 * - Interacting with construct mappings
 * - Editing and exporting surveys
 *
 * @param params - Hook parameters including mapped themes, constructs, survey, and purpose
 * @returns Memoized output interaction handlers
 *
 * @example
 * ```tsx
 * const outputHandlers = useResearchOutputHandlers({
 *   mappedSelectedThemes,
 *   constructMappings,
 *   generatedSurvey,
 *   extractionPurpose,
 * });
 *
 * // Use handlers
 * outputHandlers.handleSelectQuestion(question);
 * outputHandlers.handleExportSurvey('json');
 * ```
 */
export function useResearchOutputHandlers(
  params: UseResearchOutputHandlersParams
): UseResearchOutputHandlersReturn {
  const {
    mappedSelectedThemes,
    constructMappings,
    generatedSurvey,
    extractionPurpose,
  } = params;

  const router = useRouter();

  // ==========================================================================
  // RESEARCH QUESTION HANDLERS
  // ==========================================================================

  /**
   * Handle research question selection
   * Saves to storage and navigates to design page
   */
  const handleSelectQuestion = useCallback(
    (q: ResearchQuestion): void => {
      saveResearchQuestionsToStorage([q], mappedSelectedThemes);
      toast.success('Research question saved. Opening design page...');
      router.push('/design?source=themes&step=question');
    },
    [mappedSelectedThemes, router]
  );

  /**
   * Handle research question operationalization
   * Saves to storage and navigates to design page
   */
  const handleOperationalizeQuestion = useCallback(
    (q: ResearchQuestion): void => {
      saveResearchQuestionsToStorage([q], mappedSelectedThemes);
      toast.success('Opening operationalization panel...');
      router.push('/design?source=themes&step=question');
    },
    [mappedSelectedThemes, router]
  );

  // ==========================================================================
  // HYPOTHESIS HANDLERS
  // ==========================================================================

  /**
   * Handle hypothesis selection
   * Saves to storage and navigates to design page
   */
  const handleSelectHypothesis = useCallback(
    (h: HypothesisSuggestionType): void => {
      saveHypothesesToStorage([h], mappedSelectedThemes);
      toast.success('Hypothesis saved. Opening design page...');
      router.push('/design?source=themes&step=hypotheses');
    },
    [mappedSelectedThemes, router]
  );

  /**
   * Handle hypothesis testing
   * Saves to storage and navigates to design page
   */
  const handleTestHypothesis = useCallback(
    (h: HypothesisSuggestionType): void => {
      saveHypothesesToStorage([h], mappedSelectedThemes);
      toast.success('Opening hypothesis testing panel...');
      router.push('/design?source=themes&step=hypotheses');
    },
    [mappedSelectedThemes, router]
  );

  // ==========================================================================
  // CONSTRUCT HANDLERS
  // ==========================================================================

  /**
   * Handle construct click
   * Shows construct details in toast
   */
  const handleConstructClick = useCallback(
    (id: string): void => {
      const mapping = constructMappings.find(m => m.construct.id === id);
      if (mapping) {
        toast.info(
          `${mapping.construct.name}: ${mapping.construct.themes.length} themes, ${mapping.relatedConstructs.length} relationships`,
          { duration: 4000 }
        );
      }
    },
    [constructMappings]
  );

  /**
   * Handle relationship click
   * Shows relationship details in toast
   */
  const handleRelationshipClick = useCallback(
    (source: string, target: string): void => {
      const sourceMapping = constructMappings.find(m => m.construct.id === source);
      const targetMapping = constructMappings.find(m => m.construct.id === target);
      if (sourceMapping && targetMapping) {
        toast.info(
          `Relationship: ${sourceMapping.construct.name} → ${targetMapping.construct.name}`,
          { duration: 3000 }
        );
      }
    },
    [constructMappings]
  );

  // ==========================================================================
  // SURVEY HANDLERS
  // ==========================================================================

  /**
   * Handle survey edit
   * Saves survey to localStorage and navigates to builder
   */
  const handleEditSurvey = useCallback((): void => {
    try {
      const surveyData = {
        survey: generatedSurvey,
        themes: mappedSelectedThemes,
        purpose: extractionPurpose || 'qualitative_analysis',
        generatedAt: new Date().toISOString(),
      };
      localStorage.setItem('theme_generated_survey', JSON.stringify(surveyData));
      toast.success('Survey saved. Opening Questionnaire Builder...');
      router.push('/questionnaire/builder-pro?import=survey&source=themes');

      logger.info('Survey saved for editing', 'useResearchOutputHandlers');
    } catch (error) {
      logger.error('Failed to save survey', 'useResearchOutputHandlers', error);
      toast.error('Failed to save survey. Please try again.');
    }
  }, [generatedSurvey, mappedSelectedThemes, extractionPurpose, router]);

  /**
   * Handle survey export
   * Exports survey in specified format
   */
  const handleExportSurvey = useCallback(
    (format: string): void => {
      try {
        if (format === EXPORT_FORMATS.JSON) {
          const data = {
            survey: generatedSurvey,
            themes: mappedSelectedThemes,
            metadata: {
              generatedAt: new Date().toISOString(),
              purpose: extractionPurpose || 'qualitative_analysis',
              platform: 'VQMethod',
            },
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `survey-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Survey exported as JSON');

          logger.info('Survey exported', 'useResearchOutputHandlers', { format: 'JSON' });
        } else if (format === EXPORT_FORMATS.CSV && generatedSurvey) {
          const csvRows: string[] = [];
          csvRows.push('Section,Item ID,Text,Type,Scale');

          generatedSurvey.sections.forEach(section => {
            section.items.forEach(item => {
              const scaleText = item.options ? item.options.join(' | ') : item.scaleType || '';
              csvRows.push(
                `"${section.title}","${item.id}","${item.text.replace(/"/g, '""')}","${item.type}","${scaleText}"`
              );
            });
          });

          const blob = new Blob([csvRows.join('\n')], {
            type: 'text/csv',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `survey-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Survey exported as CSV');

          logger.info('Survey exported', 'useResearchOutputHandlers', { format: 'CSV' });
        } else if (format === EXPORT_FORMATS.PDF || format === EXPORT_FORMATS.WORD) {
          toast.info(`${format.toUpperCase()} export coming soon! Use JSON/CSV for now.`);
        } else {
          toast.error('Unsupported export format');
          logger.warn('Unsupported export format requested', 'useResearchOutputHandlers', { format });
        }
      } catch (error) {
        logger.error('Export failed', 'useResearchOutputHandlers', error);
        toast.error('Failed to export survey. Please try again.');
      }
    },
    [generatedSurvey, mappedSelectedThemes, extractionPurpose]
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    handleSelectQuestion,
    handleOperationalizeQuestion,
    handleSelectHypothesis,
    handleTestHypothesis,
    handleConstructClick,
    handleRelationshipClick,
    handleEditSurvey,
    handleExportSurvey,
  };
}
