/**
 * Literature Theme Store
 * Centralized Zustand store for theme extraction and downstream research outputs
 * Phase 10.1 Day 1 - Enhanced Enterprise Refactoring
 *
 * @module literature-theme.store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  UnifiedTheme,
  SaturationData,
  ResearchPurpose,
} from '@/lib/types/literature.types';

// ============================================================================
// Additional Types
// ============================================================================

export interface ResearchQuestion {
  id: string;
  question: string;
  subQuestions?: string[];
  derivedFromThemes: string[];
  confidence: number;
}

export interface Hypothesis {
  id: string;
  hypothesis: string;
  type: 'directional' | 'non-directional' | 'null';
  derivedFromThemes: string[];
  variables: string[];
  confidence: number;
}

export interface ConstructMapping {
  themeId: string;
  themeName: string;
  construct: string;
  items: string[];
  reliability: number;
}

export interface GeneratedSurvey {
  id: string;
  title: string;
  sections: SurveySection[];
  generatedAt: string;
  basedOnThemes: string[];
}

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  items: SurveyItem[];
}

export interface SurveyItem {
  id: string;
  question: string;
  type: 'likert' | 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  required: boolean;
}

export interface ContentAnalysis {
  totalPapers: number;
  withFullText: number;
  withAbstractOnly: number;
  averageLength: number;
}

export interface ExtractionProgress {
  stage: number;
  totalStages: number;
  currentStage: string;
  message: string;
  progress: number;
}

// ============================================================================
// Store Interface
// ============================================================================

interface ThemeState {
  // Theme state
  themes: UnifiedTheme[];
  selectedThemeIds: string[];
  analyzingThemes: boolean;
  analyzingGaps: boolean;

  // Extraction configuration
  extractionPurpose: ResearchPurpose | null;
  saturationData: SaturationData | null;
  userExpertiseLevel: 'novice' | 'researcher' | 'expert';

  // Extraction progress
  isExtractionInProgress: boolean;
  extractionProgress: ExtractionProgress | null;
  currentRequestId: string | null;
  preparingMessage: string;
  contentAnalysis: ContentAnalysis | null;

  // Downstream outputs - Research Questions
  researchQuestions: ResearchQuestion[];
  loadingQuestions: boolean;

  // Downstream outputs - Hypotheses
  hypotheses: Hypothesis[];
  loadingHypotheses: boolean;

  // Downstream outputs - Survey Construction
  constructMappings: ConstructMapping[];
  loadingConstructs: boolean;
  generatedSurvey: GeneratedSurvey | null;
  loadingSurvey: boolean;

  // Actions - Theme management
  setThemes: (themes: UnifiedTheme[]) => void;
  addTheme: (theme: UnifiedTheme) => void;
  removeTheme: (themeId: string) => void;
  clearThemes: () => void;

  // Actions - Selection
  toggleThemeSelection: (themeId: string) => void;
  selectAllThemes: () => void;
  clearSelection: () => void;
  isThemeSelected: (themeId: string) => boolean;
  getSelectedThemes: () => UnifiedTheme[];

  // Actions - Extraction
  setExtractionPurpose: (purpose: ResearchPurpose | null) => void;
  setSaturationData: (data: SaturationData | null) => void;
  setUserExpertiseLevel: (level: 'novice' | 'researcher' | 'expert') => void;
  setAnalyzingThemes: (analyzing: boolean) => void;
  setAnalyzingGaps: (analyzing: boolean) => void;

  // Actions - Extraction progress
  setIsExtractionInProgress: (inProgress: boolean) => void;
  setExtractionProgress: (progress: ExtractionProgress | null) => void;
  setCurrentRequestId: (id: string | null) => void;
  setPreparingMessage: (message: string) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;

  // Actions - Research Questions
  setResearchQuestions: (questions: ResearchQuestion[]) => void;
  addResearchQuestion: (question: ResearchQuestion) => void;
  removeResearchQuestion: (questionId: string) => void;
  setLoadingQuestions: (loading: boolean) => void;

  // Actions - Hypotheses
  setHypotheses: (hypotheses: Hypothesis[]) => void;
  addHypothesis: (hypothesis: Hypothesis) => void;
  removeHypothesis: (hypothesisId: string) => void;
  setLoadingHypotheses: (loading: boolean) => void;

  // Actions - Survey Construction
  setConstructMappings: (mappings: ConstructMapping[]) => void;
  setLoadingConstructs: (loading: boolean) => void;
  setGeneratedSurvey: (survey: GeneratedSurvey | null) => void;
  setLoadingSurvey: (loading: boolean) => void;

  // Actions - Reset
  reset: () => void;
  resetDownstream: () => void; // Reset only downstream outputs
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useLiteratureThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        themes: [],
        selectedThemeIds: [],
        analyzingThemes: false,
        analyzingGaps: false,
        extractionPurpose: null,
        saturationData: null,
        userExpertiseLevel: 'researcher',
        isExtractionInProgress: false,
        extractionProgress: null,
        currentRequestId: null,
        preparingMessage: '',
        contentAnalysis: null,
        researchQuestions: [],
        loadingQuestions: false,
        hypotheses: [],
        loadingHypotheses: false,
        constructMappings: [],
        loadingConstructs: false,
        generatedSurvey: null,
        loadingSurvey: false,

        // Theme management actions
        setThemes: (themes) => set({ themes }),

        addTheme: (theme) =>
          set((state) => ({
            themes: [...state.themes, theme],
          })),

        removeTheme: (themeId) =>
          set((state) => ({
            themes: state.themes.filter((t) => t.id !== themeId),
            selectedThemeIds: state.selectedThemeIds.filter((id) => id !== themeId),
          })),

        clearThemes: () => set({ themes: [], selectedThemeIds: [] }),

        // Selection actions
        toggleThemeSelection: (themeId) =>
          set((state) => ({
            selectedThemeIds: state.selectedThemeIds.includes(themeId)
              ? state.selectedThemeIds.filter((id) => id !== themeId)
              : [...state.selectedThemeIds, themeId],
          })),

        selectAllThemes: () =>
          set((state) => ({
            selectedThemeIds: state.themes.map((t) => t.id),
          })),

        clearSelection: () => set({ selectedThemeIds: [] }),

        isThemeSelected: (themeId) => get().selectedThemeIds.includes(themeId),

        getSelectedThemes: () => {
          const { themes, selectedThemeIds } = get();
          return themes.filter((t) => selectedThemeIds.includes(t.id));
        },

        // Extraction actions
        setExtractionPurpose: (purpose) => set({ extractionPurpose: purpose }),

        setSaturationData: (data) => set({ saturationData: data }),

        setUserExpertiseLevel: (level) => set({ userExpertiseLevel: level }),

        setAnalyzingThemes: (analyzing) => set({ analyzingThemes: analyzing }),

        setAnalyzingGaps: (analyzing) => set({ analyzingGaps: analyzing }),

        // Extraction progress actions
        setIsExtractionInProgress: (inProgress) =>
          set({ isExtractionInProgress: inProgress }),

        setExtractionProgress: (progress) => set({ extractionProgress: progress }),

        setCurrentRequestId: (id) => set({ currentRequestId: id }),

        setPreparingMessage: (message) => set({ preparingMessage: message }),

        setContentAnalysis: (analysis) => set({ contentAnalysis: analysis }),

        // Research Questions actions
        setResearchQuestions: (questions) => set({ researchQuestions: questions }),

        addResearchQuestion: (question) =>
          set((state) => ({
            researchQuestions: [...state.researchQuestions, question],
          })),

        removeResearchQuestion: (questionId) =>
          set((state) => ({
            researchQuestions: state.researchQuestions.filter((q) => q.id !== questionId),
          })),

        setLoadingQuestions: (loading) => set({ loadingQuestions: loading }),

        // Hypotheses actions
        setHypotheses: (hypotheses) => set({ hypotheses }),

        addHypothesis: (hypothesis) =>
          set((state) => ({
            hypotheses: [...state.hypotheses, hypothesis],
          })),

        removeHypothesis: (hypothesisId) =>
          set((state) => ({
            hypotheses: state.hypotheses.filter((h) => h.id !== hypothesisId),
          })),

        setLoadingHypotheses: (loading) => set({ loadingHypotheses: loading }),

        // Survey Construction actions
        setConstructMappings: (mappings) => set({ constructMappings: mappings }),

        setLoadingConstructs: (loading) => set({ loadingConstructs: loading }),

        setGeneratedSurvey: (survey) => set({ generatedSurvey: survey }),

        setLoadingSurvey: (loading) => set({ loadingSurvey: loading }),

        // Reset actions
        reset: () =>
          set({
            themes: [],
            selectedThemeIds: [],
            analyzingThemes: false,
            analyzingGaps: false,
            extractionPurpose: null,
            saturationData: null,
            userExpertiseLevel: 'researcher',
            isExtractionInProgress: false,
            extractionProgress: null,
            currentRequestId: null,
            preparingMessage: '',
            contentAnalysis: null,
            researchQuestions: [],
            loadingQuestions: false,
            hypotheses: [],
            loadingHypotheses: false,
            constructMappings: [],
            loadingConstructs: false,
            generatedSurvey: null,
            loadingSurvey: false,
          }),

        resetDownstream: () =>
          set({
            researchQuestions: [],
            hypotheses: [],
            constructMappings: [],
            generatedSurvey: null,
            loadingQuestions: false,
            loadingHypotheses: false,
            loadingConstructs: false,
            loadingSurvey: false,
          }),
      }),
      {
        name: 'literature-theme-store',
        // Persist themes, extraction config, and downstream outputs
        partialize: (state) => ({
          themes: state.themes,
          extractionPurpose: state.extractionPurpose,
          saturationData: state.saturationData,
          userExpertiseLevel: state.userExpertiseLevel,
          researchQuestions: state.researchQuestions,
          hypotheses: state.hypotheses,
          constructMappings: state.constructMappings,
          generatedSurvey: state.generatedSurvey,
        }),
      }
    ),
    { name: 'LiteratureTheme' }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectThemeState = (state: ThemeState) => ({
  themes: state.themes,
  selectedThemeIds: state.selectedThemeIds,
  analyzingThemes: state.analyzingThemes,
  analyzingGaps: state.analyzingGaps,
});

export const selectExtractionState = (state: ThemeState) => ({
  extractionPurpose: state.extractionPurpose,
  saturationData: state.saturationData,
  userExpertiseLevel: state.userExpertiseLevel,
  isExtractionInProgress: state.isExtractionInProgress,
  extractionProgress: state.extractionProgress,
  currentRequestId: state.currentRequestId,
  preparingMessage: state.preparingMessage,
  contentAnalysis: state.contentAnalysis,
});

export const selectDownstreamState = (state: ThemeState) => ({
  researchQuestions: state.researchQuestions,
  hypotheses: state.hypotheses,
  constructMappings: state.constructMappings,
  generatedSurvey: state.generatedSurvey,
  loadingQuestions: state.loadingQuestions,
  loadingHypotheses: state.loadingHypotheses,
  loadingConstructs: state.loadingConstructs,
  loadingSurvey: state.loadingSurvey,
});
