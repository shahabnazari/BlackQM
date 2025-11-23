/**
 * Theme API Handlers Hook
 * Phase 10.935 Day 2 Evening: Component Size Reduction
 *
 * **Purpose:**
 * Extract API handler logic from ThemeExtractionContainer to reduce component size.
 * Handles all API calls for research output generation (questions, hypotheses, constructs, surveys, Q-statements).
 *
 * **Responsibilities:**
 * - Generate research questions from themes
 * - Generate hypotheses from themes
 * - Map themes to psychological/theoretical constructs
 * - Generate complete surveys from themes
 * - Generate Q-methodology statements from themes
 * - Trigger survey modal with default config
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper memoization (useCallback)
 * - ✅ Comprehensive error handling
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Input validation
 * - ✅ Toast notifications for user feedback
 *
 * @module useThemeApiHandlers
 * @since Phase 10.935 Day 2 Evening
 */

'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Store
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// API Service
import { enhancedThemeIntegrationService } from '@/lib/api/services/enhanced-theme-integration-api.service';

// Types
import type {
  ResearchPurpose,
} from '@/lib/api/services/unified-theme-api.service';
import type { SurveyGenerationConfig } from '@/components/literature';
import type { Theme } from '@/lib/api/services/enhanced-theme-integration-api.service';

// ============================================================================
// Constants
// ============================================================================

/**
 * Map ResearchPurpose to SurveyGenerationConfig purpose
 * Research purposes are domain-specific, survey purposes are methodological
 */
const RESEARCH_PURPOSE_TO_SURVEY_PURPOSE: Record<
  ResearchPurpose,
  'exploratory' | 'confirmatory' | 'mixed'
> = {
  literature_synthesis: 'exploratory',
  hypothesis_generation: 'confirmatory',
  survey_construction: 'exploratory',
  q_methodology: 'exploratory',
  qualitative_analysis: 'mixed',
};

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseThemeApiHandlersReturn {
  handleGenerateQuestions: () => Promise<void>;
  handleGenerateHypotheses: () => Promise<void>;
  handleMapConstructs: () => Promise<void>;
  handleGenerateSurvey: (config: SurveyGenerationConfig) => Promise<void>;
  handleGenerateStatements: () => void;
  handleShowSurveyModal: () => void;
  loadingQuestions: boolean;
  loadingHypotheses: boolean;
  loadingConstructs: boolean;
  loadingSurvey: boolean;
}

// ============================================================================
// Hook Parameters
// ============================================================================

export interface UseThemeApiHandlersParams {
  selectedThemeIds: string[];
  mappedSelectedThemes: Theme[];
  extractionPurpose: ResearchPurpose | null;
  setLoadingQuestions: (loading: boolean) => void;
  setLoadingHypotheses: (loading: boolean) => void;
  setLoadingConstructs: (loading: boolean) => void;
  setLoadingSurvey: (loading: boolean) => void;
  loadingQuestions: boolean;
  loadingHypotheses: boolean;
  loadingConstructs: boolean;
  loadingSurvey: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useThemeApiHandlers - Hook for theme-related API operations
 *
 * **Extracted from ThemeExtractionContainer to reduce component size.**
 *
 * Provides memoized handlers for:
 * - Generating research questions from selected themes
 * - Generating hypotheses from selected themes
 * - Mapping themes to constructs
 * - Generating complete surveys
 * - Generating Q-methodology statements
 *
 * @param params - Hook parameters including selected themes, loading states, and purpose
 * @returns Memoized API handlers and loading states
 *
 * @example
 * ```tsx
 * const apiHandlers = useThemeApiHandlers({
 *   selectedThemeIds,
 *   mappedSelectedThemes,
 *   extractionPurpose,
 *   setLoadingQuestions,
 *   setLoadingHypotheses,
 *   setLoadingConstructs,
 *   setLoadingSurvey,
 *   loadingQuestions,
 *   loadingHypotheses,
 *   loadingConstructs,
 *   loadingSurvey,
 * });
 *
 * // Use handlers
 * await apiHandlers.handleGenerateQuestions();
 * ```
 */
export function useThemeApiHandlers(
  params: UseThemeApiHandlersParams
): UseThemeApiHandlersReturn {
  const {
    selectedThemeIds,
    mappedSelectedThemes,
    extractionPurpose,
    setLoadingQuestions,
    setLoadingHypotheses,
    setLoadingConstructs,
    setLoadingSurvey,
    loadingQuestions,
    loadingHypotheses,
    loadingConstructs,
    loadingSurvey,
  } = params;

  // Store actions
  const {
    setResearchQuestions,
    setHypotheses,
    setConstructMappings,
    setGeneratedSurvey,
    setQStatements,
  } = useThemeExtractionStore();

  // ==========================================================================
  // API HANDLERS
  // ==========================================================================

  /**
   * Generate research questions from selected themes
   * Calls API, updates store with results
   */
  const handleGenerateQuestions = useCallback(async (): Promise<void> => {
    // Validation
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      logger.warn('Generate questions called with no themes selected', 'useThemeApiHandlers');
      return;
    }

    logger.info('Generating research questions', 'useThemeApiHandlers', {
      selectedCount: selectedThemeIds.length,
      purpose: extractionPurpose,
    });

    setLoadingQuestions(true);
    try {
      const result = await enhancedThemeIntegrationService.suggestQuestions({
        themes: mappedSelectedThemes,
        maxQuestions: 5,
        researchGoal: extractionPurpose || 'qualitative_analysis',
      });

      setResearchQuestions(result);
      toast.success(`Generated ${result.length} research questions`);

      logger.info('Research questions generated successfully', 'useThemeApiHandlers', {
        count: result.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate questions', 'useThemeApiHandlers', error);
      toast.error(`Failed to generate questions: ${errorMessage}`);
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedThemeIds.length, mappedSelectedThemes, extractionPurpose, setResearchQuestions, setLoadingQuestions]);

  /**
   * Generate hypotheses from selected themes
   * Calls API, updates store with results
   */
  const handleGenerateHypotheses = useCallback(async (): Promise<void> => {
    // Validation
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      logger.warn('Generate hypotheses called with no themes selected', 'useThemeApiHandlers');
      return;
    }

    logger.info('Generating hypotheses', 'useThemeApiHandlers', {
      selectedCount: selectedThemeIds.length,
    });

    setLoadingHypotheses(true);
    try {
      const result = await enhancedThemeIntegrationService.suggestHypotheses({
        themes: mappedSelectedThemes,
        maxHypotheses: 5,
        hypothesisTypes: ['correlational', 'causal', 'mediation'],
      });

      setHypotheses(result);
      toast.success(`Generated ${result.length} hypotheses`);

      logger.info('Hypotheses generated successfully', 'useThemeApiHandlers', {
        count: result.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate hypotheses', 'useThemeApiHandlers', error);
      toast.error(`Failed to generate hypotheses: ${errorMessage}`);
    } finally {
      setLoadingHypotheses(false);
    }
  }, [selectedThemeIds.length, mappedSelectedThemes, setHypotheses, setLoadingHypotheses]);

  /**
   * Map themes to psychological/theoretical constructs
   * Calls API, updates store with results
   */
  const handleMapConstructs = useCallback(async (): Promise<void> => {
    // Validation
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      logger.warn('Map constructs called with no themes selected', 'useThemeApiHandlers');
      return;
    }

    logger.info('Mapping constructs', 'useThemeApiHandlers', {
      selectedCount: selectedThemeIds.length,
    });

    setLoadingConstructs(true);
    try {
      const result = await enhancedThemeIntegrationService.mapConstructs({
        themes: mappedSelectedThemes,
        includeRelationships: true,
      });

      setConstructMappings(result);
      toast.success(`Mapped ${result.length} constructs`);

      logger.info('Constructs mapped successfully', 'useThemeApiHandlers', {
        count: result.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to map constructs', 'useThemeApiHandlers', error);
      toast.error(`Failed to map constructs: ${errorMessage}`);
    } finally {
      setLoadingConstructs(false);
    }
  }, [selectedThemeIds.length, mappedSelectedThemes, setConstructMappings, setLoadingConstructs]);

  /**
   * Generate complete survey from selected themes
   * Calls API, updates store with results
   */
  const handleGenerateSurvey = useCallback(
    async (config: SurveyGenerationConfig): Promise<void> => {
      // Validation
      if (selectedThemeIds.length === 0) {
        toast.error('Please select themes first');
        logger.warn('Generate survey called with no themes selected', 'useThemeApiHandlers');
        return;
      }

      logger.info('Generating survey', 'useThemeApiHandlers', {
        selectedCount: selectedThemeIds.length,
        purpose: config.purpose,
      });

      setLoadingSurvey(true);
      try {
        const result = await enhancedThemeIntegrationService.generateCompleteSurvey({
          themes: mappedSelectedThemes,
          surveyPurpose: config.purpose,
          targetRespondentCount: config.targetRespondents,
          complexityLevel: config.complexityLevel,
          includeDemographics: config.includeDemographics,
          includeValidityChecks: config.includeValidityChecks,
        });

        // Transform CompleteSurvey to GeneratedSurvey format
        const transformedSurvey = {
          sections: result.sections,
          metadata: {
            totalItems: result.metadata.totalItems,
            estimatedCompletionTime: result.metadata.estimatedCompletionTime,
            themeCoverage: mappedSelectedThemes.map(theme => ({
              themeId: theme.id,
              themeName: theme.name,
              itemCount: result.sections.reduce(
                (count, section) =>
                  count +
                  section.items.filter(item =>
                    item.themeProvenance.includes(theme.id)
                  ).length,
                0
              ),
            })),
            generatedAt: new Date().toISOString(),
            purpose: config.purpose,
          },
        };

        setGeneratedSurvey(transformedSurvey);
        toast.success('Survey generated successfully!');

        logger.info('Survey generated successfully', 'useThemeApiHandlers', {
          totalItems: result.metadata.totalItems,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to generate survey', 'useThemeApiHandlers', error);
        toast.error(`Failed to generate survey: ${errorMessage}`);
      } finally {
        setLoadingSurvey(false);
      }
    },
    [selectedThemeIds.length, mappedSelectedThemes, setGeneratedSurvey, setLoadingSurvey]
  );

  /**
   * Generate Q-methodology statements from selected themes
   * Placeholder for Q-statements generation
   */
  const handleGenerateStatements = useCallback((): void => {
    // Validation
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      logger.warn('Generate statements called with no themes selected', 'useThemeApiHandlers');
      return;
    }

    logger.info('Generating Q-statements', 'useThemeApiHandlers', {
      selectedCount: selectedThemeIds.length,
    });

    // TODO: Implement Q-statements generation API call
    // For now, create placeholder statements from themes
    const statements = mappedSelectedThemes.map(theme =>
      `${theme.name}: ${theme.description}`
    );

    setQStatements(statements);
    toast.success(`Generated ${statements.length} Q-statements from themes`);

    logger.info('Q-statements generated', 'useThemeApiHandlers', {
      count: statements.length,
    });
  }, [selectedThemeIds.length, mappedSelectedThemes, setQStatements]);

  /**
   * Show survey modal (trigger survey generation UI)
   */
  const handleShowSurveyModal = useCallback((): void => {
    // This would typically trigger a modal, but for now just generate with default config
    logger.info('Survey modal requested', 'useThemeApiHandlers');

    // Map research purpose to survey methodology
    const surveyPurpose = extractionPurpose
      ? RESEARCH_PURPOSE_TO_SURVEY_PURPOSE[extractionPurpose]
      : 'mixed';

    const defaultConfig: SurveyGenerationConfig = {
      purpose: surveyPurpose,
      targetRespondents: 100,
      complexityLevel: 'intermediate',
      includeDemographics: true,
      includeValidityChecks: true,
      includeOpenEnded: true,
    };

    handleGenerateSurvey(defaultConfig);
  }, [extractionPurpose, handleGenerateSurvey]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    handleGenerateQuestions,
    handleGenerateHypotheses,
    handleMapConstructs,
    handleGenerateSurvey,
    handleGenerateStatements,
    handleShowSurveyModal,
    loadingQuestions,
    loadingHypotheses,
    loadingConstructs,
    loadingSurvey,
  };
}
