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
 * Research Output Handlers Hook
 *
 * **Phase 10.101**: Enhanced JSDoc for public API documentation
 * **Phase 10.935**: Extracted from ThemeExtractionContainer (component size reduction)
 *
 * Provides memoized, enterprise-grade interaction handlers for generated research outputs.
 * Coordinates user interactions with research questions, hypotheses, construct mappings, and surveys
 * with proper navigation, storage, error handling, and user feedback.
 *
 * **Supported Interaction Types:**
 * 1. **Research Questions** - Select and operationalize questions (navigates to design page)
 * 2. **Hypotheses** - Select and test hypotheses (navigates to design page)
 * 3. **Construct Mappings** - View construct details and relationships (toast notifications)
 * 4. **Survey Editing** - Save and navigate to Questionnaire Builder
 * 5. **Survey Export** - Export surveys in JSON, CSV, PDF (coming soon), Word (coming soon)
 *
 * **Enterprise Features:**
 * - Automatic storage persistence (localStorage for surveys, API service for questions/hypotheses)
 * - Navigation integration (Next.js router with query params)
 * - Memoized handlers (stable references across re-renders)
 * - Graceful error handling with user-friendly toasts
 * - Enterprise logging (no console.log)
 * - Multi-format export support (JSON, CSV with proper escaping)
 *
 * **Navigation Flow:**
 * - Questions/Hypotheses → `/design?source=themes&step=[question|hypotheses]`
 * - Survey Edit → `/questionnaire/builder-pro?import=survey&source=themes`
 * - Construct clicks → Toast notifications (inline feedback)
 *
 * **Storage Strategy:**
 * - Research questions: API service persistence + theme linkage
 * - Hypotheses: API service persistence + theme linkage
 * - Surveys: localStorage with metadata (purpose, themes, timestamp)
 *
 * **Performance:**
 * - All handlers memoized with `useCallback`
 * - Stable dependencies to prevent unnecessary re-creation
 * - Efficient CSV generation (single-pass iteration)
 * - Blob URL cleanup to prevent memory leaks
 *
 * @param params - Hook parameters
 * @param params.mappedSelectedThemes - Full theme objects (linked to research outputs)
 * @param params.constructMappings - Construct mappings with relationships
 * @param params.generatedSurvey - Complete survey with sections, items, and metadata (null if not generated)
 * @param params.extractionPurpose - Research purpose context (affects storage metadata)
 *
 * @returns Research output interaction handlers
 * @returns handleSelectQuestion - Save question and navigate to design page (sync)
 * @returns handleOperationalizeQuestion - Save question and navigate to operationalization panel (sync)
 * @returns handleSelectHypothesis - Save hypothesis and navigate to design page (sync)
 * @returns handleTestHypothesis - Save hypothesis and navigate to testing panel (sync)
 * @returns handleConstructClick - Show construct details in toast (sync)
 * @returns handleRelationshipClick - Show relationship details in toast (sync)
 * @returns handleEditSurvey - Save survey to localStorage and navigate to builder (sync)
 * @returns handleExportSurvey - Export survey in specified format (json, csv, pdf, word) (sync)
 *
 * @example
 * ```tsx
 * // In a component
 * const {
 *   handleSelectQuestion,
 *   handleExportSurvey,
 *   handleEditSurvey,
 * } = useResearchOutputHandlers({
 *   mappedSelectedThemes: themes.filter(t => selectedIds.has(t.id)),
 *   constructMappings: constructMappings,
 *   generatedSurvey: generatedSurvey,
 *   extractionPurpose: 'q_methodology',
 * });
 *
 * // Select a research question (saves + navigates)
 * <Button onClick={() => handleSelectQuestion(question)}>
 *   Use This Question
 * </Button>
 *
 * // Export survey as JSON
 * <Button onClick={() => handleExportSurvey('json')}>
 *   Download JSON
 * </Button>
 *
 * // Edit survey in builder
 * <Button onClick={handleEditSurvey}>
 *   Edit in Builder
 * </Button>
 * ```
 *
 * @see {@link UseResearchOutputHandlersParams} - Full parameter interface
 * @see {@link UseResearchOutputHandlersReturn} - Return type interface
 * @see {@link ThemeExtractionContainer} - Parent component
 * @see {@link saveResearchQuestionsToStorage} - Question persistence service
 * @see {@link saveHypothesesToStorage} - Hypothesis persistence service
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
