/**
 * Theme Extraction Container - Phase 10.95 REFACTORED
 *
 * Self-contained container for theme extraction display and research output generation.
 * Refactored to use extracted services and hooks for enterprise-grade architecture.
 *
 * @module ThemeExtractionContainer
 * @since Phase 10.95
 *
 * **Architecture (Phase 10.95 Refactoring):**
 * - Component: ~390 lines (under 400 limit)
 * - Business logic extracted to: ExtractionOrchestratorService, useExtractionWorkflow
 * - ZERO required props (fully self-contained)
 * - Gets ALL data from Zustand stores
 *
 * **Performance Optimizations (Phase 10.95):**
 * - Extracted ExtractionModals component to reduce re-renders
 * - Memoized handlers with stable dependencies
 * - Set-based O(1) lookups for theme/paper selection
 *
 * **Enterprise Standards:**
 * - TypeScript strict mode (NO 'any')
 * - Enterprise logging (no console.log)
 * - Component size compliance (<400 lines)
 * - Service extraction pattern
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { PurposeSpecificActions } from '../components/PurposeSpecificActions';
import { ThemeList } from '../components/theme-extraction/ThemeList';
import { ThemeEmptyState } from '../components/theme-extraction/ThemeEmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

// Phase 10.97 Day 2: Theme to Statement modal
import { ThemeToStatementModal } from '@/components/literature';

// Phase 10.98.3: Inline progress display
import EnhancedThemeExtractionProgress from '@/components/literature/EnhancedThemeExtractionProgress';
import type { TransparentProgressMessage } from '@/components/literature/EnhancedThemeExtractionProgress';

// Phase 10.98.3: Navigation modal for "Taking you to themes page..."
import { NavigatingToThemesModal } from '@/components/literature/NavigatingToThemesModal';

// Lazy-loaded modals (performance optimization)
const PurposeSelectionWizard = dynamic(
  () => import('@/components/literature/PurposeSelectionWizard'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading purpose selection wizard...</span>
      </div>
    ),
    ssr: false,
  }
);

const ModeSelectionModal = dynamic(
  () => import('@/components/literature/ModeSelectionModal').then(mod => mod.ModeSelectionModal),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading mode selection...</span>
      </div>
    ),
    ssr: false,
  }
);

const ThemeExtractionProgressModal = dynamic(
  () => import('@/components/literature/ThemeExtractionProgressModal'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading extraction progress...</span>
      </div>
    ),
    ssr: false,
  }
);

// Stores
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useAlternativeSourcesStore } from '@/lib/stores/alternative-sources.store';

// Hooks
import { useThemeApiHandlers } from '@/lib/hooks/useThemeApiHandlers';
import { useResearchOutputHandlers } from '@/lib/hooks/useResearchOutputHandlers';
import { useExtractionWorkflow } from '@/lib/hooks/useExtractionWorkflow';

// Utils
import { mapUnifiedThemeToTheme } from '../utils/theme-mapping';
import { analyzeContentForExtraction, type ContentAnalysisResult } from '../utils/content-analysis';

// Types
import type { ResearchPurpose, UserExpertiseLevel } from '@/lib/api/services/unified-theme-api.service';
import type { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';

// ============================================================================
// Validators
// ============================================================================

const VALID_EXPERTISE_LEVELS: UserExpertiseLevel[] = ['novice', 'researcher', 'expert'];

function validateExpertiseLevel(level: string | undefined): UserExpertiseLevel {
  if (level && VALID_EXPERTISE_LEVELS.includes(level as UserExpertiseLevel)) {
    return level as UserExpertiseLevel;
  }
  return 'researcher'; // Safe default
}

// ============================================================================
// Constants
// ============================================================================

const TARGET_THEME_RANGES: Record<ResearchPurpose, { min: number; max: number }> = {
  q_methodology: { min: 30, max: 80 },
  survey_construction: { min: 5, max: 15 },
  qualitative_analysis: { min: 5, max: 20 },
  literature_synthesis: { min: 10, max: 25 },
  hypothesis_generation: { min: 8, max: 15 },
};

const DEFAULT_TARGET_RANGE = { min: 8, max: 15 };

/**
 * Phase 10.95 PERF-FIX: Module-level no-op handler
 * Prevents function recreation on every ExtractionModals render
 * Modal auto-closes on completion; manual close is not allowed during extraction
 */
const NOOP_CLOSE_HANDLER = (): void => {
  // Intentionally empty - progress modal auto-closes on completion
};

// ============================================================================
// Types
// ============================================================================

export interface ThemeExtractionContainerProps {
  emptyStateMessage?: string;
  /**
   * Phase 10.98.3: Show progress inline instead of as modal
   * When true, renders extraction progress embedded in page content
   * When false (default), renders as overlay modal
   */
  showProgressInline?: boolean;
}

/**
 * Phase 10.95 PERF-FIX: Props interface for extracted modals component
 * Reduces dependency array complexity by consolidating modal-related props
 * Phase 10.98.3: Added showProgressInline to conditionally hide progress modal
 * Phase 10.98.3: Added isNavigatingToThemes for "Taking you to themes page..." modal
 */
interface ExtractionModalsProps {
  showPurposeWizard: boolean;
  showModeSelectionModal: boolean;
  progress: ExtractionProgress | null;
  contentAnalysis: ContentAnalysisResult | null;
  selectedPaperCount: number;
  isLoading: boolean;
  showProgressInline: boolean;
  isNavigatingToThemes: boolean;
  extractionPurpose: ResearchPurpose | null | undefined;
  onPurposeSelected: (purpose: ResearchPurpose) => void;
  onPurposeCancel: () => void;
  onModeSelected: (mode: 'quick' | 'guided') => Promise<void>;
  onCloseModeModal: () => void;
}

/**
 * Phase 10.95 PERF-FIX: Extracted modals component
 * Prevents parent re-renders from recreating modal JSX unnecessarily
 *
 * Phase 10.97 Day 3 BUGFIX: Added error handling when contentAnalysis is null
 * Phase 10.98.3: Hide progress modal when showProgressInline is true
 * Phase 10.98.3: Added NavigatingToThemesModal for smooth navigation UX
 */
const ExtractionModals = React.memo(function ExtractionModals({
  showPurposeWizard,
  showModeSelectionModal,
  progress,
  contentAnalysis,
  selectedPaperCount,
  isLoading,
  showProgressInline,
  isNavigatingToThemes,
  extractionPurpose,
  onPurposeSelected,
  onPurposeCancel,
  onModeSelected,
  onCloseModeModal,
}: ExtractionModalsProps): JSX.Element | null {
  // Phase 10.98.3: Don't show progress modal when inline mode is enabled
  const shouldShowProgressModal = progress !== null && !showProgressInline;

  // Only render when at least one modal is visible
  const hasVisibleModal = showPurposeWizard || showModeSelectionModal || shouldShowProgressModal || isNavigatingToThemes;
  if (!hasVisibleModal) return null;

  // Phase 10.97 Day 3 BUGFIX: Log warning if wizard should show but no content analysis
  // This is a fallback - primary validation is in ThemeExtractionActionCard
  if (showPurposeWizard && !contentAnalysis) {
    logger.warn('Purpose wizard requested but contentAnalysis is null - no papers available', 'ExtractionModals');
    // Don't call handlers during render - just return null and let wizard not appear
    // ThemeExtractionActionCard should have shown a toast already
    return null;
  }

  // ENTERPRISE LOGGING: Log modal rendering conditions
  if (hasVisibleModal) {
    logger.info('', 'ExtractionModals');
    logger.info('🎭 ExtractionModals Render Check', 'ExtractionModals', {
      hasVisibleModal,
      showPurposeWizard,
      showModeSelectionModal,
      shouldShowProgressModal,
      isNavigatingToThemes,
      contentAnalysisExists: contentAnalysis !== null,
    });
    logger.info('', 'ExtractionModals');

    if (showPurposeWizard) {
      if (contentAnalysis) {
        logger.info('✅ RENDERING: PurposeSelectionWizard', 'ExtractionModals', {
          condition: 'showPurposeWizard && contentAnalysis',
          contentAnalysisValid: true,
        });
      } else {
        logger.error('❌ NOT RENDERING: PurposeSelectionWizard', 'ExtractionModals', {
          reason: 'contentAnalysis is NULL',
          showPurposeWizard,
        });
      }
    }
  }

  return (
    <>
      {showPurposeWizard && contentAnalysis && (
        <PurposeSelectionWizard
          onPurposeSelected={onPurposeSelected}
          onCancel={onPurposeCancel}
          contentAnalysis={contentAnalysis}
          {...(extractionPurpose ? { initialPurpose: extractionPurpose } : {})}
        />
      )}
      {showModeSelectionModal && (
        <ModeSelectionModal
          isOpen={showModeSelectionModal}
          onClose={onCloseModeModal}
          onModeSelected={onModeSelected}
          selectedPaperCount={selectedPaperCount}
          loading={isLoading}
        />
      )}
      {/* Phase 10.98.3: Only show progress modal when NOT in inline mode */}
      {shouldShowProgressModal && (
        <ThemeExtractionProgressModal
          progress={progress}
          onClose={NOOP_CLOSE_HANDLER}
        />
      )}
      {/* Phase 10.98.3: Show "Taking you to themes page..." spinner during navigation */}
      <NavigatingToThemesModal isOpen={isNavigatingToThemes} />
    </>
  );
});

ExtractionModals.displayName = 'ExtractionModals';

// ============================================================================
// Main Component
// ============================================================================

export const ThemeExtractionContainer = React.memo(function ThemeExtractionContainer({
  emptyStateMessage,
  showProgressInline = false,
}: ThemeExtractionContainerProps = {}): JSX.Element {
  // ==========================================================================
  // Router for navigation to themes page
  // ==========================================================================
  const router = useRouter();
  const pathname = usePathname();

  // ==========================================================================
  // Store State
  // ==========================================================================
  const {
    unifiedThemes,
    extractionPurpose,
    v2SaturationData,
    selectedThemeIds,
    toggleThemeSelection,
    clearThemeSelection,
    analyzingThemes,
    extractedPapers,
    researchQuestions,
    hypotheses,
    constructMappings,
    generatedSurvey,
    showPurposeWizard,
    setShowPurposeWizard,
    setExtractionPurpose,
    userExpertiseLevel,
    showModeSelectionModal,
    setShowModeSelectionModal,
    isNavigatingToThemes,
    setIsNavigatingToThemes,
  } = useThemeExtractionStore();

  const { papers, selectedPapers } = useLiteratureSearchStore();
  const { results: alternativeSources } = useAlternativeSourcesStore();

  // Phase 10.98.3 FIX: Track selected extraction mode
  const [selectedExtractionMode, setSelectedExtractionMode] = useState<'quick' | 'guided' | null>(null);

  // ==========================================================================
  // Hooks
  // ==========================================================================
  const { executeWorkflow, progress, isExecuting } = useExtractionWorkflow();

  // ==========================================================================
  // Local State
  // ==========================================================================
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingHypotheses, setLoadingHypotheses] = useState(false);
  const [loadingConstructs, setLoadingConstructs] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const extractionInProgressRef = useRef<boolean>(false);

  // Phase 10.97 Day 2: Theme to Statement modal state
  const [showStatementModal, setShowStatementModal] = useState(false);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /**
   * Phase 10.98 FIX (Issue #4): Calculate totalSources from unique source IDs in themes
   * Previous: papers.length + alternativeSources.length
   * Problem: May count wrong entity if papers array contains unexpected data
   * Solution: Extract unique source IDs directly from themes (most accurate)
   */
  const totalSources = useMemo(() => {
    // If we have themes, count unique sources from theme metadata
    if (unifiedThemes && unifiedThemes.length > 0) {
      const uniqueSourceIds = new Set<string>();

      unifiedThemes.forEach(theme => {
        // Each theme has sources array with source IDs
        if (theme.sources && Array.isArray(theme.sources)) {
          theme.sources.forEach(source => {
            if (source.sourceId) {
              uniqueSourceIds.add(source.sourceId);
            }
          });
        }
      });

      // Return unique source count (most accurate)
      if (uniqueSourceIds.size > 0) {
        return uniqueSourceIds.size;
      }
    }

    // Fallback: Use papers count if no themes yet
    return papers.length + alternativeSources.length;
  }, [unifiedThemes, papers.length, alternativeSources.length]);

  const hasThemes = useMemo(() => unifiedThemes.length > 0, [unifiedThemes.length]);
  const hasSelection = useMemo(() => selectedThemeIds.length > 0, [selectedThemeIds.length]);

  const targetRange = useMemo(() => {
    if (!extractionPurpose) return DEFAULT_TARGET_RANGE;
    return TARGET_THEME_RANGES[extractionPurpose] || DEFAULT_TARGET_RANGE;
  }, [extractionPurpose]);

  // Use Set for O(1) lookup instead of O(n) includes()
  const selectedThemeIdsSet = useMemo(
    () => new Set(selectedThemeIds),
    [selectedThemeIds]
  );

  const selectedThemes = useMemo(
    () => unifiedThemes.filter(theme => selectedThemeIdsSet.has(theme.id)),
    [unifiedThemes, selectedThemeIdsSet]
  );

  const mappedSelectedThemes = useMemo(
    () => selectedThemes.map(mapUnifiedThemeToTheme),
    [selectedThemes]
  );

  // Use Set for O(1) paper ID lookup (same optimization as selectedThemeIdsSet)
  const selectedPaperIdsSet = useMemo(() => {
    if (!selectedPapers || !(selectedPapers instanceof Set)) return new Set<string>();
    return selectedPapers;
  }, [selectedPapers]);

  const selectedPapersList = useMemo(() => {
    // CRITICAL BUGFIX Phase 10.97.2: Strict selection enforcement
    // User MUST explicitly select papers - no silent fallbacks to all papers

    // Validation: papers must be an array
    if (!Array.isArray(papers)) {
      logger.warn('Papers is not an array', 'ThemeExtractionContainer');
      return [];
    }

    // No papers available
    if (papers.length === 0) {
      return [];
    }

    // No selection made - require explicit selection
    if (selectedPaperIdsSet.size === 0) {
      logger.info('No papers selected - user must select papers first', 'ThemeExtractionContainer', {
        availablePapers: papers.length,
      });
      // Return empty array - extraction will be blocked at validation
      return [];
    }

    // Filter by selection
    const filtered = papers.filter((p) => p && p.id && selectedPaperIdsSet.has(p.id));

    // Selection exists but no matches - CRITICAL ERROR (ID mismatch)
    if (filtered.length === 0) {
      logger.error('CRITICAL: Selection IDs do not match paper IDs', 'ThemeExtractionContainer', {
        selectedIdsSample: Array.from(selectedPaperIdsSet).slice(0, 3),
        paperIdsSample: papers.slice(0, 3).map(p => p?.id || 'null'),
        selectedCount: selectedPaperIdsSet.size,
        papersCount: papers.length,
      });

      toast.error(
        'Selection error: Your selected papers don\'t match the current search results. Please re-select papers.',
        { duration: 10000 }
      );

      // Return empty array to prevent processing wrong papers
      return [];
    }

    // Success: Return filtered papers
    logger.info('Papers filtered by selection', 'ThemeExtractionContainer', {
      selectedCount: filtered.length,
      totalPapers: papers.length,
    });

    return filtered;
  }, [papers, selectedPaperIdsSet]);

  // Content analysis for purpose wizard
  // Phase 10.97 Day 3 BUGFIX: Always compute (not lazy) to prevent timing issues
  // where wizard opens but contentAnalysis is null
  const generatedContentAnalysis = useMemo(() => {
    const analysis = analyzeContentForExtraction(selectedPapersList);

    // Phase 10.101 FIX #2: Only log in development to reduce production noise
    // This useMemo runs every time selectedPapersList changes (could be 50+ times)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Content Analysis Generated', 'ThemeExtractionContainer', {
        totalSelected: analysis?.totalSelected || 0,
        totalWithContent: analysis?.totalWithContent || 0,
        hasFullTextContent: analysis?.hasFullTextContent || false,
      });
    }

    return analysis;
  }, [selectedPapersList]);

  // Purpose-specific action visibility
  const showQStatements = extractionPurpose === 'q_methodology';
  const showSurveyPrimary = extractionPurpose === 'survey_construction';
  const showResearchOutputs = ['literature_synthesis', 'qualitative_analysis', 'hypothesis_generation'].includes(extractionPurpose || '') || !extractionPurpose;
  const showSurveySecondary = extractionPurpose === 'qualitative_analysis' || !extractionPurpose;

  // ==========================================================================
  // Extracted Handlers (API and Output)
  // ==========================================================================
  const apiHandlers = useThemeApiHandlers({
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
  });

  const outputHandlers = useResearchOutputHandlers({
    mappedSelectedThemes,
    constructMappings,
    generatedSurvey,
    extractionPurpose,
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================
  const handleToggleSelection = useCallback((themeId: string): void => {
    if (!themeId || typeof themeId !== 'string') return;
    toggleThemeSelection(themeId);
  }, [toggleThemeSelection]);

  const handleClearSelection = useCallback((): void => {
    clearThemeSelection();
  }, [clearThemeSelection]);

  const handlePurposeSelected = useCallback(async (purpose: ResearchPurpose): Promise<void> => {
    if (!purpose) return;

    logger.info('', 'ThemeExtractionContainer');
    logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
    logger.info('🎬 FLOW STEP 6: HANDLE PURPOSE SELECTED CALLBACK', 'ThemeExtractionContainer');
    logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
    logger.info('', 'ThemeExtractionContainer');

    // Phase 10.98.3 FIX: After purpose selection, start extraction with the selected mode
    const mode = selectedExtractionMode || 'guided';
    logger.info('📋 Callback Parameters:', 'ThemeExtractionContainer', {
      purpose,
      mode,
      selectedPapersCount: selectedPapersList.length,
    });

    logger.info('🔧 Setting extraction purpose in store...', 'ThemeExtractionContainer');
    setExtractionPurpose(purpose);

    logger.info('🔧 Closing purpose wizard...', 'ThemeExtractionContainer');
    setShowPurposeWizard(false);

    // CRITICAL BUGFIX Phase 10.97.2: Validate papers exist with specific error messages
    if (selectedPapersList.length === 0) {
      logger.error('❌ FLOW BLOCKED: No selected papers', 'ThemeExtractionContainer');

      if (papers.length === 0) {
        logger.error('   → Reason: No search results', 'ThemeExtractionContainer');
        toast.error('No papers found. Please search for papers first.');
      } else if (selectedPaperIdsSet.size === 0) {
        logger.error('   → Reason: User did not select any papers', 'ThemeExtractionContainer', {
          availablePapers: papers.length,
        });
        toast.error('Please select papers to extract themes from. Click the checkboxes next to papers you want to analyze.');
      } else {
        logger.error('   → Reason: Selection ID mismatch', 'ThemeExtractionContainer', {
          selectedIds: selectedPaperIdsSet.size,
          availablePapers: papers.length,
        });
      }
      return;
    }

    logger.info('✅ Paper validation passed', 'ThemeExtractionContainer');
    logger.info('', 'ThemeExtractionContainer');

    // Phase 10.98.3: Navigate to themes page before starting extraction
    const isOnThemesPage = pathname === '/discover/themes';
    if (!isOnThemesPage) {
      logger.info('🧭 Navigating to themes page...', 'ThemeExtractionContainer', {
        from: pathname,
        to: '/discover/themes',
      });

      setIsNavigatingToThemes(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/discover/themes');
      setIsNavigatingToThemes(false);
    }

    logger.info('', 'ThemeExtractionContainer');
    logger.info('🚀 Starting Extraction Workflow', 'ThemeExtractionContainer', {
      purpose,
      mode,
      papers: selectedPapersList.length,
      userExpertiseLevel: validateExpertiseLevel(userExpertiseLevel),
    });
    logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
    logger.info('', 'ThemeExtractionContainer');

    // Start extraction
    extractionInProgressRef.current = true;

    await executeWorkflow({
      papers: selectedPapersList,
      purpose,
      mode,
      userExpertiseLevel: validateExpertiseLevel(userExpertiseLevel),
    });

    extractionInProgressRef.current = false;
    setSelectedExtractionMode(null); // Reset for next extraction
  }, [selectedExtractionMode, selectedPapersList, papers.length, selectedPaperIdsSet.size, userExpertiseLevel, setExtractionPurpose, setShowPurposeWizard, setIsNavigatingToThemes, executeWorkflow, pathname, router]);

  const handleModeSelected = useCallback(
    async (mode: 'quick' | 'guided'): Promise<void> => {
      if (extractionInProgressRef.current) return;

      logger.info('', 'ThemeExtractionContainer');
      logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
      logger.info('🎬 FLOW STEP 3: HANDLE MODE SELECTED CALLBACK', 'ThemeExtractionContainer');
      logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
      logger.info('', 'ThemeExtractionContainer');
      logger.info('📋 Callback Parameters:', 'ThemeExtractionContainer', {
        mode,
        selectedPapersCount: selectedPapersList.length,
        totalPapers: papers.length,
        selectedIdsCount: selectedPaperIdsSet.size,
      });

      // CRITICAL BUGFIX Phase 10.97.2: Validate papers exist with specific error messages
      if (selectedPapersList.length === 0) {
        logger.error('❌ FLOW BLOCKED: No selected papers', 'ThemeExtractionContainer');
        setShowModeSelectionModal(false);

        if (papers.length === 0) {
          logger.error('   → Reason: No search results', 'ThemeExtractionContainer');
          toast.error('No papers found. Please search for papers first.');
        } else if (selectedPaperIdsSet.size === 0) {
          logger.error('   → Reason: User did not select any papers', 'ThemeExtractionContainer', {
            availablePapers: papers.length,
          });
          toast.error('Please select papers to extract themes from. Click the checkboxes next to papers you want to analyze.');
        } else {
          logger.error('   → Reason: Selection ID mismatch', 'ThemeExtractionContainer', {
            selectedIds: selectedPaperIdsSet.size,
            availablePapers: papers.length,
          });
        }
        return;
      }

      logger.info('✅ Paper validation passed', 'ThemeExtractionContainer');
      logger.info('', 'ThemeExtractionContainer');

      // BUGFIX: BOTH modes show purpose wizard (different UX)
      // Quick mode: Pre-selected default purpose + Skip button
      // Guided mode: No pre-selection, user must choose
      if (mode === 'quick') {
        logger.info('⚡ QUICK MODE PATH', 'ThemeExtractionContainer');
        logger.info('─────────────────────────────────────────────────────────────', 'ThemeExtractionContainer');
        logger.info('   ✨ Pre-selecting default purpose (qualitative_analysis)', 'ThemeExtractionContainer');
        logger.info('   ✨ PURPOSE WIZARD WILL BE SHOWN (with Skip button)', 'ThemeExtractionContainer');

        // Pre-select default purpose for quick mode
        setExtractionPurpose('qualitative_analysis');
        logger.info('   Papers: ' + selectedPapersList.length, 'ThemeExtractionContainer');
        logger.info('', 'ThemeExtractionContainer');
      } else {
        logger.info('🧭 GUIDED MODE PATH', 'ThemeExtractionContainer');
        logger.info('─────────────────────────────────────────────────────────────', 'ThemeExtractionContainer');
        logger.info('   ✨ User must select purpose (no pre-selection)', 'ThemeExtractionContainer');
        logger.info('   ✨ PURPOSE WIZARD WILL BE SHOWN NEXT', 'ThemeExtractionContainer');

        // Clear any previous purpose selection
        setExtractionPurpose(null);
        logger.info('', 'ThemeExtractionContainer');
      }

      // Common logic for both modes: Show purpose wizard
      logger.info('📊 Content Analysis for Purpose Wizard:', 'ThemeExtractionContainer', {
        mode,
        preSelectedPurpose: mode === 'quick' ? 'qualitative_analysis' : 'none',
        selectedPapers: selectedPapersList.length,
        contentAnalysisExists: generatedContentAnalysis !== null,
        fullTextCount: generatedContentAnalysis?.fullTextCount || 0,
        abstractOverflowCount: generatedContentAnalysis?.abstractOverflowCount || 0,
        abstractCount: generatedContentAnalysis?.abstractCount || 0,
        hasFullTextContent: generatedContentAnalysis?.hasFullTextContent || false,
      });

      if (!generatedContentAnalysis) {
        logger.error('❌ CRITICAL: Content analysis is NULL', 'ThemeExtractionContainer');
        logger.error('   → Purpose wizard requires content analysis to show', 'ThemeExtractionContainer');
        logger.error('   → This should never happen if selectedPapersList has papers', 'ThemeExtractionContainer');
      } else {
        logger.info('✅ Content analysis ready for wizard', 'ThemeExtractionContainer');
      }

      logger.info('', 'ThemeExtractionContainer');
      logger.info('   Closing mode selection modal...', 'ThemeExtractionContainer');
      logger.info('   Setting showPurposeWizard = true...', 'ThemeExtractionContainer');
      logger.info('', 'ThemeExtractionContainer');

      // Store selected mode and show purpose wizard
      setSelectedExtractionMode(mode);
      setShowModeSelectionModal(false);
      setShowPurposeWizard(true);

      logger.info('✅ Purpose wizard state updated', 'ThemeExtractionContainer', {
        mode,
        showPurposeWizard: true,
        showModeSelectionModal: false,
        preSelectedPurpose: mode === 'quick' ? 'qualitative_analysis' : null,
      });
      logger.info('', 'ThemeExtractionContainer');
      logger.info('🔜 NEXT: PurposeSelectionWizard should render', 'ThemeExtractionContainer');
      logger.info('   Check: ExtractionModals component at line ~220', 'ThemeExtractionContainer');
      logger.info('   Condition: showPurposeWizard && contentAnalysis', 'ThemeExtractionContainer');
      logger.info('═══════════════════════════════════════════════════════════════', 'ThemeExtractionContainer');
      logger.info('', 'ThemeExtractionContainer');
    },
    [selectedPapersList, papers.length, selectedPaperIdsSet.size, userExpertiseLevel, generatedContentAnalysis, setExtractionPurpose, setShowModeSelectionModal, setShowPurposeWizard, setSelectedExtractionMode]
  );

  const handlePurposeCancel = useCallback(() => {
    setShowPurposeWizard(false);
  }, [setShowPurposeWizard]);

  const handleCloseModeModal = useCallback(() => {
    setShowModeSelectionModal(false);
  }, [setShowModeSelectionModal]);

  /**
   * Phase 10.97 Day 2: Open the statement generation modal
   * Validates theme selection before opening
   */
  const handleOpenStatementModal = useCallback((): void => {
    if (selectedThemeIds.length === 0) {
      logger.warn('Cannot open statement modal: no themes selected', 'ThemeExtractionContainer');
      return;
    }
    logger.info('Opening statement generation modal', 'ThemeExtractionContainer', {
      selectedThemeCount: selectedThemeIds.length,
    });
    setShowStatementModal(true);
  }, [selectedThemeIds.length, setShowStatementModal]);

  /**
   * Phase 10.97 Day 2: Handle statement modal open/close state changes
   * Signature matches Dialog onOpenChange prop: (open: boolean) => void
   */
  const handleStatementModalChange = useCallback((open: boolean): void => {
    setShowStatementModal(open);
  }, [setShowStatementModal]);

  // ==========================================================================
  // Derived loading state for modals
  // ==========================================================================
  const isModalLoading = analyzingThemes || isExecuting;

  // ==========================================================================
  // Phase 10.98.3: Map progress for inline display (same logic as modal)
  // BUGFIX Phase 10.97.2: Keep progress visible after completion for traceability
  // ==========================================================================
  const inlineProgressData = useMemo(() => {
    if (!showProgressInline || !progress) return null;

    // BUGFIX: Don't hide when isExtracting becomes false - keep showing completed progress!
    // This provides traceability and shows final stats alongside extracted themes

    // Use transparentMessage directly if available
    if (progress.transparentMessage) {
      return {
        currentStage: progress.transparentMessage.stageNumber,
        totalStages: progress.transparentMessage.totalStages || 7,
        percentage: progress.transparentMessage.percentage,
        transparentMessage: progress.transparentMessage,
      };
    }

    // Fallback for when transparentMessage is not available yet
    return {
      currentStage: 0,
      totalStages: 7,
      percentage: progress.progress,
      transparentMessage: {
        stageName: 'Preparing',
        stageNumber: 0,
        totalStages: 7,
        percentage: progress.progress,
        whatWeAreDoing: 'Initializing extraction workflow...',
        whyItMatters: 'Setting up the analysis pipeline.',
        liveStats: {
          sourcesAnalyzed: 0,
          currentOperation: progress.message || 'Starting...',
        },
      } as TransparentProgressMessage,
    };
  }, [showProgressInline, progress]);

  // ==========================================================================
  // Render - Main content
  // ==========================================================================
  if (!hasThemes) {
    return (
      <ErrorBoundary>
        {/* Phase 10.98.3: Show inline progress at top when extracting */}
        {showProgressInline && inlineProgressData && (
          <div
            className="mb-6 bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-100"
            role="status"
            aria-label="Theme extraction progress"
            aria-live="polite"
          >
            <EnhancedThemeExtractionProgress
              currentStage={inlineProgressData.currentStage}
              totalStages={inlineProgressData.totalStages}
              percentage={inlineProgressData.percentage}
              transparentMessage={inlineProgressData.transparentMessage}
              allowIterativeRefinement={false}
              {...(progress?.accumulatedStageMetrics && {
                accumulatedStageMetrics: progress.accumulatedStageMetrics,
              })}
            />
          </div>
        )}
        <ThemeEmptyState
          analyzingThemes={isModalLoading}
          extractedPapers={extractedPapers}
          unifiedThemes={unifiedThemes}
          emptyStateMessage={emptyStateMessage}
        />
        <ExtractionModals
          showPurposeWizard={showPurposeWizard}
          showModeSelectionModal={showModeSelectionModal}
          progress={progress}
          contentAnalysis={generatedContentAnalysis}
          selectedPaperCount={selectedPapersList.length}
          isLoading={isModalLoading}
          showProgressInline={showProgressInline}
          isNavigatingToThemes={isNavigatingToThemes}
          extractionPurpose={extractionPurpose}
          onPurposeSelected={handlePurposeSelected}
          onPurposeCancel={handlePurposeCancel}
          onModeSelected={handleModeSelected}
          onCloseModeModal={handleCloseModeModal}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* Phase 10.98.3: Show inline progress at top when extracting */}
        {showProgressInline && inlineProgressData && (
          <div
            className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-100"
            role="status"
            aria-label="Theme extraction progress"
            aria-live="polite"
          >
            <EnhancedThemeExtractionProgress
              currentStage={inlineProgressData.currentStage}
              totalStages={inlineProgressData.totalStages}
              percentage={inlineProgressData.percentage}
              transparentMessage={inlineProgressData.transparentMessage}
              allowIterativeRefinement={false}
              {...(progress?.accumulatedStageMetrics && {
                accumulatedStageMetrics: progress.accumulatedStageMetrics,
              })}
            />
          </div>
        )}
        <ThemeList
          unifiedThemes={unifiedThemes}
          extractionPurpose={extractionPurpose}
          v2SaturationData={v2SaturationData}
          selectedThemeIds={selectedThemeIds}
          targetRange={targetRange}
          totalSources={totalSources}
          onToggleSelection={handleToggleSelection}
        />
        <PurposeSpecificActions
          extractionPurpose={extractionPurpose}
          hasThemes={hasThemes}
          hasSelection={hasSelection}
          selectedCount={selectedThemeIds.length}
          onClearSelection={handleClearSelection}
          showQStatements={showQStatements}
          onGenerateStatements={handleOpenStatementModal}
          showSurveyPrimary={showSurveyPrimary}
          showSurveySecondary={showSurveySecondary}
          loadingSurvey={loadingSurvey}
          generatedSurvey={generatedSurvey}
          onShowSurveyModal={apiHandlers.handleShowSurveyModal}
          onEditSurvey={outputHandlers.handleEditSurvey}
          onExportSurvey={outputHandlers.handleExportSurvey}
          showResearchOutputs={showResearchOutputs}
          loadingQuestions={loadingQuestions}
          researchQuestions={researchQuestions}
          onGenerateQuestions={apiHandlers.handleGenerateQuestions}
          onSelectQuestion={outputHandlers.handleSelectQuestion}
          onOperationalizeQuestion={outputHandlers.handleOperationalizeQuestion}
          loadingHypotheses={loadingHypotheses}
          hypotheses={hypotheses}
          onGenerateHypotheses={apiHandlers.handleGenerateHypotheses}
          onSelectHypothesis={outputHandlers.handleSelectHypothesis}
          onTestHypothesis={outputHandlers.handleTestHypothesis}
          loadingConstructs={loadingConstructs}
          constructMappings={constructMappings}
          onMapConstructs={apiHandlers.handleMapConstructs}
          onConstructClick={outputHandlers.handleConstructClick}
          onRelationshipClick={outputHandlers.handleRelationshipClick}
        />
        <ExtractionModals
          showPurposeWizard={showPurposeWizard}
          showModeSelectionModal={showModeSelectionModal}
          progress={progress}
          contentAnalysis={generatedContentAnalysis}
          selectedPaperCount={selectedPapersList.length}
          isLoading={isModalLoading}
          showProgressInline={showProgressInline}
          isNavigatingToThemes={isNavigatingToThemes}
          extractionPurpose={extractionPurpose}
          onPurposeSelected={handlePurposeSelected}
          onPurposeCancel={handlePurposeCancel}
          onModeSelected={handleModeSelected}
          onCloseModeModal={handleCloseModeModal}
        />

        {/* Phase 10.97 Day 2: Theme to Q-Statement Generation Modal */}
        <ThemeToStatementModal
          open={showStatementModal}
          onOpenChange={handleStatementModalChange}
        />
      </div>
    </ErrorBoundary>
  );
});

ThemeExtractionContainer.displayName = 'ThemeExtractionContainer';
