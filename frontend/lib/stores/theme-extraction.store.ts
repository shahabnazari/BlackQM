/**
 * Theme Extraction Store
 * Phase 10.91 Day 8: Store Architecture Refactoring - REMEDIATED
 *
 * **Refactoring Summary:**
 * - Before: 658 lines (monolithic)
 * - After: 315 lines (modular)
 * - Reduction: 52% smaller (343 lines removed)
 *
 * **Architecture:**
 * Main store orchestrates helper modules for:
 * - Theme management (add/remove/update) - theme-actions.ts
 * - Selection management (toggle/select all) - selection-actions.ts
 * - Progress tracking (WebSocket updates) - progress-actions.ts
 * - Results management (questions/hypotheses/surveys) - results-actions.ts
 * - Configuration (purpose/expertise/modals) - config-modal-actions.ts
 *
 * **Enterprise Standards:**
 * - ✅ Single Responsibility Principle
 * - ✅ DRY (helpers reusable across stores)
 * - ✅ Modular (5 helper files + types)
 * - ✅ TypeScript strict mode (NO 'any', only 'Partial<T>')
 * - ✅ Defensive programming (input validation)
 * - ✅ Bounded data structures (MAX_TRACKED_PAPERS = 10,000)
 * - ✅ Maintainability (easy to modify and test)
 *
 * @since Phase 10.91 Day 4 (created)
 * @refactored Phase 10.91 Day 8 (modular architecture)
 * @remediated Phase 10.91 Day 8 (type safety + validation + bounds)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';

// Import helper action creators
import {
  createThemeActions,
  createSelectionActions,
  createProgressActions,
  createResultsActions,
  createConfigModalActions,
} from './helpers/theme-extraction';

// Import types
import type {
  UnifiedTheme,
  ResearchPurpose,
  UserExpertiseLevel,
  SaturationData,
  ExtractionProgress,
  ContentAnalysis,
  ResearchQuestionSuggestion,
  HypothesisSuggestion,
  ConstructMapping,
  GeneratedSurvey,
  ResearchGap,
} from './helpers/theme-extraction';

// Re-export types for convenience
export type { UnifiedTheme, ResearchPurpose, UserExpertiseLevel, SaturationData };
export type { ExtractionProgress, ContentAnalysis };

// ============================================================================
// Store Interface
// ============================================================================

/**
 * Theme Extraction Store State
 * Manages theme extraction, selection, progress tracking, and research outputs
 */
interface ThemeExtractionState {
  // ========================================================================
  // Core Theme State
  // ========================================================================

  /** All extracted themes from papers (populated by theme extraction API) */
  unifiedThemes: UnifiedTheme[];

  /** IDs of themes selected by user for export/analysis (subset of unifiedThemes) */
  selectedThemeIds: string[];

  /** Set of paper IDs currently being extracted (bounded to 10,000 max) */
  extractingPapers: Set<string>;

  /** Set of paper IDs that have been extracted (bounded to 10,000 max) */
  extractedPapers: Set<string>;

  // ========================================================================
  // Extraction Configuration
  // ========================================================================

  /** Selected research purpose (e.g., 'literature_synthesis', 'hypothesis_generation') */
  extractionPurpose: ResearchPurpose | null;

  /** User's research expertise level ('novice', 'intermediate', 'advanced', 'expert') */
  userExpertiseLevel: UserExpertiseLevel;

  /** Current WebSocket request ID for theme extraction */
  currentRequestId: string | null;

  // ========================================================================
  // Progress State
  // ========================================================================

  /** Whether theme extraction is currently in progress */
  analyzingThemes: boolean;

  /** Current extraction progress (percentage, stage, live stats) */
  extractionProgress: ExtractionProgress | null;

  /** Error message if extraction failed */
  extractionError: string | null;

  /** Saturation analysis data (theoretical saturation detection) */
  v2SaturationData: SaturationData | null;

  /** Preparing stage message (e.g., "Analyzing paper content...") */
  preparingMessage: string | null;

  /** Content analysis metadata (total papers, avg length, full-text availability) */
  contentAnalysis: ContentAnalysis | null;

  // ========================================================================
  // Modal State
  // ========================================================================

  /** Show/hide mode selection modal (batch vs. incremental) */
  showModeSelectionModal: boolean;

  /** Show/hide purpose wizard modal (research purpose selection) */
  showPurposeWizard: boolean;

  /** Show/hide guided wizard modal (step-by-step extraction) */
  showGuidedWizard: boolean;

  // ========================================================================
  // Results State
  // ========================================================================

  /** Generated research questions from themes */
  researchQuestions: ResearchQuestionSuggestion[];

  /** Generated hypotheses from themes */
  hypotheses: HypothesisSuggestion[];

  /** Construct-to-theme mappings for theory building */
  constructMappings: ConstructMapping[];

  /** Generated survey instrument (questions, scales, demographics) */
  generatedSurvey: GeneratedSurvey | null;

  /** Q-methodology statements for Q-sort studies */
  qStatements: string[];

  /** Identified research gaps from literature */
  researchGaps: ResearchGap[];

  // ========================================================================
  // Actions - Organized by helper modules
  // ========================================================================

  // Theme Management (from createThemeActions)
  setUnifiedThemes: (themes: UnifiedTheme[]) => void;
  addTheme: (theme: UnifiedTheme) => void;
  removeTheme: (themeId: string) => void;
  updateTheme: (themeId: string, updates: Partial<UnifiedTheme>) => void;
  clearThemes: () => void;

  // Selection Management (from createSelectionActions)
  setSelectedThemeIds: (ids: string[]) => void;
  toggleThemeSelection: (themeId: string) => void;
  selectAllThemes: () => void;
  clearThemeSelection: () => void;

  // Progress Tracking (from createProgressActions)
  setAnalyzingThemes: (analyzing: boolean) => void;
  setExtractionProgress: (progress: ExtractionProgress | null) => void;
  setExtractionError: (error: string | null) => void;
  setV2SaturationData: (data: SaturationData | null) => void;
  setPreparingMessage: (message: string | null) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
  setCurrentRequestId: (id: string | null) => void;
  updateExtractionProgress: (updates: Partial<ExtractionProgress>) => void;
  completeExtraction: (themesCount: number) => void;
  resetExtractionProgress: () => void;
  setExtractingPapers: (paperIds: Set<string>) => void;
  addExtractingPaper: (paperId: string) => void;
  removeExtractingPaper: (paperId: string) => void;
  setExtractedPapers: (paperIds: Set<string>) => void;
  addExtractedPaper: (paperId: string) => void;
  markPapersAsExtracted: (paperIds: string[]) => void;

  // Configuration & Modals (from createConfigModalActions)
  setExtractionPurpose: (purpose: ResearchPurpose | null) => void;
  setUserExpertiseLevel: (level: UserExpertiseLevel) => void;
  setShowModeSelectionModal: (show: boolean) => void;
  setShowPurposeWizard: (show: boolean) => void;
  setShowGuidedWizard: (show: boolean) => void;
  closeAllModals: () => void;

  // Results Management (from createResultsActions)
  setResearchQuestions: (questions: ResearchQuestionSuggestion[]) => void;
  addResearchQuestion: (question: ResearchQuestionSuggestion) => void;
  removeResearchQuestion: (questionId: string) => void;
  setHypotheses: (hypotheses: HypothesisSuggestion[]) => void;
  addHypothesis: (hypothesis: HypothesisSuggestion) => void;
  removeHypothesis: (hypothesisId: string) => void;
  setConstructMappings: (mappings: ConstructMapping[]) => void;
  addConstructMapping: (mapping: ConstructMapping) => void;
  removeConstructMapping: (mappingId: string) => void;
  setGeneratedSurvey: (survey: GeneratedSurvey | null) => void;
  setQStatements: (statements: string[]) => void;
  setResearchGaps: (gaps: ResearchGap[]) => void;
  clearResults: () => void;
  clearIncompatibleResults: (purpose: string) => void;

  // Cleanup & Reset
  reset: () => void;
}

// ============================================================================
// Store Implementation (Modular)
// ============================================================================

export const useThemeExtractionStore = create<ThemeExtractionState>()(
  persist(
    (set) => ({
      // ======================================================================
      // Initial State
      // ======================================================================
      unifiedThemes: [],
      selectedThemeIds: [],
      extractingPapers: new Set(),
      extractedPapers: new Set(),

      extractionPurpose: null,
      userExpertiseLevel: 'intermediate',
      currentRequestId: null,

      analyzingThemes: false,
      extractionProgress: null,
      extractionError: null,
      v2SaturationData: null,
      preparingMessage: null,
      contentAnalysis: null,

      showModeSelectionModal: false,
      showPurposeWizard: false,
      showGuidedWizard: false,

      researchQuestions: [],
      hypotheses: [],
      constructMappings: [],
      generatedSurvey: null,
      qStatements: [],
      researchGaps: [],

      // ======================================================================
      // Actions - Composed from helper modules
      // ======================================================================

      // Theme management actions
      ...createThemeActions(set),

      // Selection actions
      ...createSelectionActions(set),

      // Progress tracking actions
      ...createProgressActions(set),

      // Configuration & modal actions
      ...createConfigModalActions(set),

      // Results management actions
      ...createResultsActions(set),

      // ======================================================================
      // Reset Action (Store-specific)
      // ======================================================================

      reset: () => {
        logger.info('Resetting theme extraction store', 'ThemeStore');
        set({
          unifiedThemes: [],
          selectedThemeIds: [],
          extractingPapers: new Set(),
          extractedPapers: new Set(),

          extractionPurpose: null,
          userExpertiseLevel: 'intermediate',
          currentRequestId: null,

          analyzingThemes: false,
          extractionProgress: null,
          extractionError: null,
          v2SaturationData: null,
          preparingMessage: null,
          contentAnalysis: null,

          showModeSelectionModal: false,
          showPurposeWizard: false,
          showGuidedWizard: false,

          researchQuestions: [],
          hypotheses: [],
          constructMappings: [],
          generatedSurvey: null,
          qStatements: [],
          researchGaps: [],
        });
      },
    }),
    {
      name: 'theme-extraction-store',
      version: 1,
      // Persist themes and results (not transient state)
      partialize: (state) => ({
        unifiedThemes: state.unifiedThemes,
        extractingPapers: Array.from(state.extractingPapers), // Convert Set to Array for persistence
        extractedPapers: Array.from(state.extractedPapers), // Convert Set to Array for persistence
        extractionPurpose: state.extractionPurpose,
        userExpertiseLevel: state.userExpertiseLevel,
        researchQuestions: state.researchQuestions,
        hypotheses: state.hypotheses,
        constructMappings: state.constructMappings,
        generatedSurvey: state.generatedSurvey,
        qStatements: state.qStatements,
      }),
      // Hydrate Sets from Arrays
      onRehydrateStorage: () => (state) => {
        if (state) {
          // ✅ Type-safe Set hydration - persisted state has arrays that need conversion
          // During persistence, Sets are converted to arrays, so rehydrated state has array type
          const persistedState = state as unknown as Partial<
            Omit<ThemeExtractionState, 'extractingPapers' | 'extractedPapers'> & {
              extractingPapers?: string[];
              extractedPapers?: string[];
            }
          >;

          // Hydrate extractingPapers Set
          if (Array.isArray(persistedState.extractingPapers)) {
            state.extractingPapers = new Set(persistedState.extractingPapers);
          } else {
            state.extractingPapers = new Set();
          }

          // Hydrate extractedPapers Set
          if (Array.isArray(persistedState.extractedPapers)) {
            state.extractedPapers = new Set(persistedState.extractedPapers);
          } else {
            state.extractedPapers = new Set();
          }

          logger.debug('Hydrated theme extraction store from localStorage', 'ThemeStore', {
            extractingCount: state.extractingPapers.size,
            extractedCount: state.extractedPapers.size,
            themesCount: state.unifiedThemes?.length || 0,
          });
        }
      },
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectThemes = (state: ThemeExtractionState) => state.unifiedThemes;

export const selectSelectedThemes = (state: ThemeExtractionState) =>
  state.unifiedThemes.filter((t) => state.selectedThemeIds.includes(t.id));

export const selectExtractionStatus = (state: ThemeExtractionState) => ({
  analyzing: state.analyzingThemes,
  progress: state.extractionProgress,
  error: state.extractionError,
});

export const selectModalState = (state: ThemeExtractionState) => ({
  modeSelection: state.showModeSelectionModal,
  purpose: state.showPurposeWizard,
  guided: state.showGuidedWizard,
});

export const selectResults = (state: ThemeExtractionState) => ({
  questions: state.researchQuestions,
  hypotheses: state.hypotheses,
  constructs: state.constructMappings,
  survey: state.generatedSurvey,
  qStatements: state.qStatements,
});
