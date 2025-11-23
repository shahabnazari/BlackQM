/**
 * Theme Extraction Store - Results Management Actions
 * Phase 10.91 Day 8: Store Architecture Refactoring (Remediated)
 *
 * **Purpose:**
 * Manage research outputs generated from themes
 *
 * **Responsibilities:**
 * - Research questions management
 * - Hypotheses management
 * - Construct mappings management
 * - Survey and Q-statements management
 * - Purpose-specific result clearing
 *
 * **Enterprise Standards:**
 * - ✅ Immutable array operations
 * - ✅ Logging for result updates
 * - ✅ Purpose-aware clearing logic
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Input validation and error handling
 *
 * @since Phase 10.91 Day 8
 * @remediated Phase 10.91 Day 8 (Type safety + validation + error handling)
 */

import { logger } from '@/lib/utils/logger';
import type {
  ResearchQuestionSuggestion,
  HypothesisSuggestion,
  ConstructMapping,
  GeneratedSurvey,
  ResearchGap,
} from './types';

/**
 * Creates results management actions with type-safe state updates
 * @template T Store state type extending results properties
 * @param set Zustand setState function
 * @returns Object with results functions
 */
export function createResultsActions<T extends {
  researchQuestions: ResearchQuestionSuggestion[];
  hypotheses: HypothesisSuggestion[];
  constructMappings: ConstructMapping[];
  generatedSurvey: GeneratedSurvey | null;
  qStatements: string[];
  researchGaps: ResearchGap[];
}>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
) {
  return {
    // ===========================
    // Research Questions
    // ===========================

    setResearchQuestions: (questions: ResearchQuestionSuggestion[]): void => {
      // Input validation
      if (!Array.isArray(questions)) {
        logger.warn('setResearchQuestions: Invalid questions array', 'ThemeStore', { questions });
        return;
      }

      logger.debug('Setting research questions', 'ThemeStore', { count: questions.length });
      set({ researchQuestions: questions } as Partial<T>);
    },

    addResearchQuestion: (question: ResearchQuestionSuggestion): void => {
      // Input validation
      if (!question || typeof question !== 'object' || !question.id) {
        logger.warn('addResearchQuestion: Invalid question object', 'ThemeStore', { question });
        return;
      }

      set((state) => {
        // Defensive: Check for duplicate
        if (state.researchQuestions.some((q) => q.id === question.id)) {
          logger.debug('addResearchQuestion: Question already exists', 'ThemeStore', { id: question.id });
          return state as Partial<T>;
        }

        return {
          researchQuestions: [...state.researchQuestions, question],
        } as Partial<T>;
      });
    },

    removeResearchQuestion: (questionId: string): void => {
      // Input validation
      if (!questionId || typeof questionId !== 'string') {
        logger.warn('removeResearchQuestion: Invalid questionId', 'ThemeStore', { questionId });
        return;
      }

      set((state) => ({
        researchQuestions: state.researchQuestions.filter((q) => q.id !== questionId),
      } as Partial<T>));
    },

    // ===========================
    // Hypotheses
    // ===========================

    setHypotheses: (hypotheses: HypothesisSuggestion[]): void => {
      // Input validation
      if (!Array.isArray(hypotheses)) {
        logger.warn('setHypotheses: Invalid hypotheses array', 'ThemeStore', { hypotheses });
        return;
      }

      logger.debug('Setting hypotheses', 'ThemeStore', { count: hypotheses.length });
      set({ hypotheses } as Partial<T>);
    },

    addHypothesis: (hypothesis: HypothesisSuggestion): void => {
      // Input validation
      if (!hypothesis || typeof hypothesis !== 'object' || !hypothesis.id) {
        logger.warn('addHypothesis: Invalid hypothesis object', 'ThemeStore', { hypothesis });
        return;
      }

      set((state) => {
        // Defensive: Check for duplicate
        if (state.hypotheses.some((h) => h.id === hypothesis.id)) {
          logger.debug('addHypothesis: Hypothesis already exists', 'ThemeStore', { id: hypothesis.id });
          return state as Partial<T>;
        }

        return {
          hypotheses: [...state.hypotheses, hypothesis],
        } as Partial<T>;
      });
    },

    removeHypothesis: (hypothesisId: string): void => {
      // Input validation
      if (!hypothesisId || typeof hypothesisId !== 'string') {
        logger.warn('removeHypothesis: Invalid hypothesisId', 'ThemeStore', { hypothesisId });
        return;
      }

      set((state) => ({
        hypotheses: state.hypotheses.filter((h) => h.id !== hypothesisId),
      } as Partial<T>));
    },

    // ===========================
    // Construct Mappings
    // ===========================

    setConstructMappings: (mappings: ConstructMapping[]): void => {
      // Input validation
      if (!Array.isArray(mappings)) {
        logger.warn('setConstructMappings: Invalid mappings array', 'ThemeStore', { mappings });
        return;
      }

      logger.debug('Setting construct mappings', 'ThemeStore', { count: mappings.length });
      set({ constructMappings: mappings } as Partial<T>);
    },

    addConstructMapping: (mapping: ConstructMapping): void => {
      // Input validation
      if (!mapping || typeof mapping !== 'object') {
        logger.warn('addConstructMapping: Invalid mapping object', 'ThemeStore', { mapping });
        return;
      }

      set((state) => ({
        constructMappings: [...state.constructMappings, mapping],
      } as Partial<T>));
    },

    removeConstructMapping: (mappingId: string): void => {
      // Input validation
      if (!mappingId || typeof mappingId !== 'string') {
        logger.warn('removeConstructMapping: Invalid mappingId', 'ThemeStore', { mappingId });
        return;
      }

      set((state) => ({
        constructMappings: state.constructMappings.filter((m) => m.construct.id !== mappingId),
      } as Partial<T>));
    },

    // ===========================
    // Survey & Q-Statements
    // ===========================

    setGeneratedSurvey: (survey: GeneratedSurvey | null): void => {
      // Input validation
      if (survey !== null && typeof survey !== 'object') {
        logger.warn('setGeneratedSurvey: Invalid survey object', 'ThemeStore', { survey });
        return;
      }

      logger.debug('Setting generated survey', 'ThemeStore', { hasSurvey: !!survey });
      set({ generatedSurvey: survey } as Partial<T>);
    },

    setQStatements: (statements: string[]): void => {
      // Input validation
      if (!Array.isArray(statements)) {
        logger.warn('setQStatements: Invalid statements array', 'ThemeStore', { statements });
        return;
      }

      // Defensive: Filter out non-string items
      const validStatements = statements.filter((s) => typeof s === 'string');
      if (validStatements.length !== statements.length) {
        logger.debug('setQStatements: Filtered out invalid statements', 'ThemeStore', {
          provided: statements.length,
          valid: validStatements.length,
        });
      }

      logger.debug('Setting Q statements', 'ThemeStore', { count: validStatements.length });
      set({ qStatements: validStatements } as Partial<T>);
    },

    setResearchGaps: (gaps: ResearchGap[]): void => {
      // Input validation
      if (!Array.isArray(gaps)) {
        logger.warn('setResearchGaps: Invalid gaps array', 'ThemeStore', { gaps });
        return;
      }

      logger.debug('Setting research gaps', 'ThemeStore', { count: gaps.length });
      set({ researchGaps: gaps } as Partial<T>);
    },

    // ===========================
    // Bulk Operations
    // ===========================

    clearResults: (): void => {
      logger.info('Clearing all results', 'ThemeStore');
      set({
        researchQuestions: [] as ResearchQuestionSuggestion[],
        hypotheses: [] as HypothesisSuggestion[],
        constructMappings: [] as ConstructMapping[],
        generatedSurvey: null,
        qStatements: [] as string[],
      } as Partial<T>);
    },

    /**
     * Clear results incompatible with selected purpose
     * Implements purpose-specific result compatibility rules
     * @param purpose Research purpose identifier
     */
    clearIncompatibleResults: (purpose: string): void => {
      try {
        // Input validation
        if (!purpose || typeof purpose !== 'string') {
          logger.warn('clearIncompatibleResults: Invalid purpose', 'ThemeStore', { purpose });
          return;
        }

        logger.info('Clearing incompatible results', 'ThemeStore', { purpose });

        switch (purpose) {
          case 'q_methodology':
            // Q-methodology: Only Q-statements allowed
            set({
              researchQuestions: [] as ResearchQuestionSuggestion[],
              hypotheses: [] as HypothesisSuggestion[],
              constructMappings: [] as ConstructMapping[],
              generatedSurvey: null,
            } as Partial<T>);
            logger.debug('Cleared results for Q-methodology (kept Q-statements)', 'ThemeStore');
            break;

          case 'survey_construction':
            // Survey construction: Only survey allowed
            set({
              researchQuestions: [] as ResearchQuestionSuggestion[],
              hypotheses: [] as HypothesisSuggestion[],
              constructMappings: [] as ConstructMapping[],
            } as Partial<T>);
            logger.debug('Cleared results for survey construction (kept survey)', 'ThemeStore');
            break;

          case 'literature_synthesis':
          case 'hypothesis_generation':
          case 'qualitative_analysis':
            // These purposes allow multiple result types - no clearing needed
            logger.debug('No incompatible results to clear for purpose', 'ThemeStore', { purpose });
            break;

          default:
            logger.debug('Unknown purpose, no results cleared', 'ThemeStore', { purpose });
            break;
        }
      } catch (error) {
        logger.error('Failed to clear incompatible results', 'ThemeStore', { error, purpose });
        // Graceful degradation: Don't crash, just log error
      }
    },
  };
}
