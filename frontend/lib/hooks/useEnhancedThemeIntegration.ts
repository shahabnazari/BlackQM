/**
 * Enhanced Theme Integration Hook - Phase 10.1 Day 7
 *
 * Enterprise-grade hook for managing theme-to-research integration workflows.
 * Extracts research question generation, hypothesis generation, construct mapping,
 * and survey generation logic from God Component.
 *
 * @module useEnhancedThemeIntegration
 * @since Phase 10.1 Day 7
 * @author VQMethod Team
 *
 * **Features:**
 * - Research question generation from themes
 * - Hypothesis generation with multiple types
 * - Construct mapping with relationships
 * - Complete survey generation from themes
 * - State management for all integration artifacts
 * - Loading states for async operations
 * - Comprehensive error handling
 *
 * **Usage:**
 * ```typescript
 * const {
 *   selectedThemeIds,
 *   researchQuestions,
 *   hypotheses,
 *   handleGenerateQuestions,
 *   handleGenerateHypotheses,
 * } = useEnhancedThemeIntegration({
 *   unifiedThemes,
 *   extractionPurpose,
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  enhancedThemeIntegrationService,
  // saveHypotheses, // Available if needed
  // saveResearchQuestions, // Available if needed
  type Theme, // Import Theme type from API service
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';
import type {
  ConstructMapping as ConstructMappingType,
  GeneratedSurvey,
  HypothesisSuggestion as HypothesisSuggestionType,
  SurveyGenerationConfig,
} from '@/components/literature';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Research purpose types
 */
export type ResearchPurpose =
  | 'literature_synthesis'
  | 'hypothesis_generation'
  | 'survey_construction'
  | 'q_methodology'
  | 'qualitative_analysis'
  | null;

/**
 * Hook configuration
 */
export interface UseEnhancedThemeIntegrationConfig {
  /** Unified themes from extraction */
  unifiedThemes: UnifiedTheme[];
  /** Research purpose from extraction */
  extractionPurpose: ResearchPurpose;
}

/**
 * Hook return type
 */
export interface UseEnhancedThemeIntegrationReturn {
  // State
  selectedThemeIds: string[];
  researchQuestions: any[];
  hypotheses: HypothesisSuggestionType[];
  constructMappings: ConstructMappingType[];
  generatedSurvey: GeneratedSurvey | null;
  showSurveyModal: boolean;

  // Loading states
  loadingQuestions: boolean;
  loadingHypotheses: boolean;
  loadingConstructs: boolean;
  loadingSurvey: boolean;

  // Handlers
  handleGenerateQuestions: () => Promise<void>;
  handleGenerateHypotheses: () => Promise<void>;
  handleMapConstructs: () => Promise<void>;
  handleGenerateSurvey: (config: SurveyGenerationConfig) => Promise<void>;

  // Setters
  setSelectedThemeIds: (ids: string[]) => void;
  setResearchQuestions: (questions: any[]) => void;
  setHypotheses: (hypotheses: HypothesisSuggestionType[]) => void;
  setConstructMappings: (mappings: ConstructMappingType[]) => void;
  setGeneratedSurvey: (survey: GeneratedSurvey | null) => void;
  setShowSurveyModal: (show: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert UnifiedTheme to Theme format for API
 */
function mapUnifiedThemeToTheme(unifiedTheme: UnifiedTheme): Theme {
  // Convert sources to simplified format expected by API
  const sources = unifiedTheme.sources?.slice(0, 3).map(source => ({
    id: source.sourceId,
    title: source.sourceTitle,
    type: source.sourceType,
  })) || [];

  return {
    id: unifiedTheme.id,
    name: unifiedTheme.label,
    description: unifiedTheme.description || '',
    prevalence: unifiedTheme.weight || 0,
    confidence: unifiedTheme.confidence || 0,
    sources,
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing enhanced theme integration workflows
 *
 * **Architecture:**
 * - Manages state for all integration artifacts (questions, hypotheses, etc.)
 * - Provides handlers for generating integration artifacts from themes
 * - Handles API communication with error recovery
 * - Manages loading states for UI feedback
 *
 * **Error Handling:**
 * - Validates theme selection before API calls
 * - User-friendly error messages via toast
 * - Proper cleanup of loading states
 * - Detailed logging for debugging
 *
 * @param {UseEnhancedThemeIntegrationConfig} config - Configuration object
 * @returns {UseEnhancedThemeIntegrationReturn} State and handlers
 */
export function useEnhancedThemeIntegration(
  config: UseEnhancedThemeIntegrationConfig
): UseEnhancedThemeIntegrationReturn {
  const { unifiedThemes, extractionPurpose } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [researchQuestions, setResearchQuestions] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<HypothesisSuggestionType[]>([]);
  const [constructMappings, setConstructMappings] = useState<
    ConstructMappingType[]
  >([]);
  const [generatedSurvey, setGeneratedSurvey] =
    useState<GeneratedSurvey | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Loading states
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingHypotheses, setLoadingHypotheses] = useState(false);
  const [loadingConstructs, setLoadingConstructs] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  // ===========================
  // RESEARCH QUESTIONS HANDLER
  // ===========================

  /**
   * Generate research questions from selected themes
   */
  const handleGenerateQuestions = useCallback(async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    console.log('[handleGenerateQuestions] Starting...');
    console.log('[handleGenerateQuestions] selectedThemeIds:', selectedThemeIds);
    console.log('[handleGenerateQuestions] unifiedThemes count:', unifiedThemes.length);

    setLoadingQuestions(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      console.log('[handleGenerateQuestions] selectedThemes count:', selectedThemes.length);
      console.log('[handleGenerateQuestions] selectedThemes:', selectedThemes);

      const requestPayload = {
        themes: selectedThemes,
        maxQuestions: 5,
        researchGoal: extractionPurpose || 'qualitative_analysis',
      };
      console.log('[handleGenerateQuestions] Request payload:', requestPayload);

      const result =
        await enhancedThemeIntegrationService.suggestQuestions(requestPayload);
      console.log('[handleGenerateQuestions] Success! Result:', result);
      setResearchQuestions(result);
      toast.success(`Generated ${result.length} research questions`);
    } catch (error: any) {
      console.error('[handleGenerateQuestions] Error:', error);
      console.error('[handleGenerateQuestions] Error message:', error.message);
      console.error('[handleGenerateQuestions] Error response:', error.response);
      toast.error(`Failed to generate questions: ${error.message}`);
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedThemeIds, unifiedThemes, extractionPurpose]);

  // ===========================
  // HYPOTHESES HANDLER
  // ===========================

  /**
   * Generate hypotheses from selected themes
   */
  const handleGenerateHypotheses = useCallback(async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    setLoadingHypotheses(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      const result = await enhancedThemeIntegrationService.suggestHypotheses({
        themes: selectedThemes,
        maxHypotheses: 5,
        hypothesisTypes: ['correlational', 'causal', 'mediation'],
      });
      setHypotheses(result);
      toast.success(`Generated ${result.length} hypotheses`);
    } catch (error: any) {
      console.error('Error generating hypotheses:', error);
      toast.error(`Failed to generate hypotheses: ${error.message}`);
    } finally {
      setLoadingHypotheses(false);
    }
  }, [selectedThemeIds, unifiedThemes]);

  // ===========================
  // CONSTRUCT MAPPING HANDLER
  // ===========================

  /**
   * Map themes to psychological/theoretical constructs
   */
  const handleMapConstructs = useCallback(async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    setLoadingConstructs(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      const result = await enhancedThemeIntegrationService.mapConstructs({
        themes: selectedThemes,
        includeRelationships: true,
      });
      setConstructMappings(result);
      toast.success(`Mapped ${result.length} constructs`);
    } catch (error: any) {
      console.error('Error mapping constructs:', error);
      toast.error(`Failed to map constructs: ${error.message}`);
    } finally {
      setLoadingConstructs(false);
    }
  }, [selectedThemeIds, unifiedThemes]);

  // ===========================
  // SURVEY GENERATION HANDLER
  // ===========================

  /**
   * Generate complete survey from selected themes
   */
  const handleGenerateSurvey = useCallback(
    async (config: SurveyGenerationConfig) => {
      if (selectedThemeIds.length === 0) {
        toast.error('Please select themes first');
        return;
      }

      setLoadingSurvey(true);
      try {
        // Map theme IDs to full theme objects and convert to API format
        const selectedThemes = unifiedThemes
          .filter(theme => selectedThemeIds.includes(theme.id))
          .map(mapUnifiedThemeToTheme);

        const result =
          await enhancedThemeIntegrationService.generateCompleteSurvey({
            themes: selectedThemes,
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
            themeCoverage: selectedThemes.map(theme => ({
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
      } catch (error: any) {
        console.error('Error generating survey:', error);
        toast.error(`Failed to generate survey: ${error.message}`);
      } finally {
        setLoadingSurvey(false);
      }
    },
    [selectedThemeIds, unifiedThemes]
  );

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // State
    selectedThemeIds,
    researchQuestions,
    hypotheses,
    constructMappings,
    generatedSurvey,
    showSurveyModal,

    // Loading states
    loadingQuestions,
    loadingHypotheses,
    loadingConstructs,
    loadingSurvey,

    // Handlers
    handleGenerateQuestions,
    handleGenerateHypotheses,
    handleMapConstructs,
    handleGenerateSurvey,

    // Setters
    setSelectedThemeIds,
    setResearchQuestions,
    setHypotheses,
    setConstructMappings,
    setGeneratedSurvey,
    setShowSurveyModal,
  };
}
