/**
 * Theme Extraction Handlers Hook - Phase 10.1 Day 6 Sub-Phase 2B
 *
 * Enterprise-grade hook for mode selection and theme extraction execution.
 * Extracts handleModeSelected (20 lines) + handlePurposeSelected (873 lines).
 *
 * @module useThemeExtractionHandlers
 * @since Phase 10.1 Day 6
 * @author VQMethod Team
 *
 * **Features:**
 * - Mode selection handling (Quick vs Guided)
 * - Purpose-driven extraction orchestration
 * - Content requirement validation
 * - Full-text extraction coordination
 * - Theme extraction API integration
 * - WebSocket progress tracking
 * - Result processing and storage
 * - Comprehensive error handling
 *
 * **Workflow:**
 * 1. User selects mode (Quick/Guided) → handleModeSelected
 * 2. User selects purpose → handlePurposeSelected
 * 3. Validate content requirements
 * 4. Wait for full-text extraction
 * 5. Call theme extraction API
 * 6. Track progress via WebSocket
 * 7. Process and store results
 *
 * **Usage:**
 * ```typescript
 * const {
 *   handleModeSelected,
 *   handlePurposeSelected,
 * } = useThemeExtractionHandlers({
 *   currentRequestId,
 *   contentAnalysis,
 *   papers,
 *   selectedPapers,
 *   // ... other config
 * });
 * ```
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { ContentAnalysis, Paper } from './useThemeExtractionWorkflow';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Research purpose types for theme extraction
 */
export type ResearchPurpose =
  | 'literature_synthesis'
  | 'hypothesis_generation'
  | 'survey_construction'
  | 'q_methodology'
  | 'qualitative_analysis';

/**
 * Extraction mode types
 */
export type ExtractionMode = 'quick' | 'guided';

/**
 * Purpose requirements configuration
 */
interface PurposeRequirement {
  minFullText: number;
  name: string;
  methodology: string;
}

/**
 * Hook configuration
 */
export interface UseThemeExtractionHandlersConfig {
  // Core state
  currentRequestId: string | null;
  contentAnalysis: ContentAnalysis | null;
  papers: Paper[];
  selectedPapers: Set<string>;
  userExpertiseLevel: 'novice' | 'intermediate' | 'advanced' | 'researcher' | 'expert';

  // State setters
  setShowModeSelectionModal: (show: boolean) => void;
  setShowPurposeWizard: (show: boolean) => void;
  setShowGuidedWizard: (show: boolean) => void;
  setExtractionPurpose: (purpose: ResearchPurpose) => void;
  setAnalyzingThemes: (analyzing: boolean) => void;
  setExtractingPapers: (papers: Set<string>) => void;
  setExtractedPapers: (updater: (prev: Set<string>) => Set<string>) => void; // Phase 10.1 Day 12: Added
  setIsExtractionInProgress: (inProgress: boolean) => void;
  setExtractionError: (error: string) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
  setPapers: (papers: Paper[]) => void;

  // Progress tracking
  startExtraction: (totalSources: number) => void;
  updateProgress: (
    currentSource: number,
    totalSources: number,
    transparentMessage?: any
  ) => void;
  completeExtraction: (themesCount: number) => void; // CRITICAL FIX (Nov 18, 2025): Set progress to 'complete' state

  // API functions
  extractThemesV2: (
    sources: any[],
    request: any,
    onProgress?: any
  ) => Promise<any>;

  // Optional callbacks
  onExtractionComplete?: (themes: any[]) => void;
  onExtractionError?: (error: string) => void;
}

/**
 * Hook return type
 */
export interface UseThemeExtractionHandlersReturn {
  handleModeSelected: (mode: ExtractionMode) => Promise<void>;
  handlePurposeSelected: (purpose: ResearchPurpose) => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Purpose requirements configuration
 */
const PURPOSE_REQUIREMENTS: Record<string, PurposeRequirement> = {
  literature_synthesis: {
    minFullText: 10,
    name: 'Literature Synthesis',
    methodology: 'Meta-ethnography',
  },
  hypothesis_generation: {
    minFullText: 8,
    name: 'Hypothesis Generation',
    methodology: 'Grounded Theory',
  },
  survey_construction: {
    minFullText: 5,
    name: 'Survey Construction',
    methodology: 'Scale Development',
  },
  q_methodology: {
    minFullText: 0,
    name: 'Q-Methodology',
    methodology: 'Statement Generation',
  },
  qualitative_analysis: {
    minFullText: 3,
    name: 'Qualitative Analysis',
    methodology: 'Thematic Analysis',
  },
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing theme extraction mode and purpose selection
 *
 * **Architecture:**
 * - handleModeSelected: Routes to Quick (purpose wizard) or Guided (AI wizard)
 * - handlePurposeSelected: Orchestrates full extraction process with validation
 *
 * **Error Handling:**
 * - Content requirement validation
 * - Full-text availability checks
 * - API error recovery
 * - Progress state cleanup
 *
 * @param {UseThemeExtractionHandlersConfig} config - Configuration object
 * @returns {UseThemeExtractionHandlersReturn} Handler functions
 */
export function useThemeExtractionHandlers(
  config: UseThemeExtractionHandlersConfig
): UseThemeExtractionHandlersReturn {
  const {
    currentRequestId,
    contentAnalysis,
    papers,
    selectedPapers,
    userExpertiseLevel,
    setShowModeSelectionModal,
    setShowPurposeWizard,
    setShowGuidedWizard,
    setExtractionPurpose,
    setAnalyzingThemes,
    setExtractingPapers,
    setExtractedPapers, // Phase 10.1 Day 12: Added for extraction completion tracking
    setIsExtractionInProgress,
    setExtractionError,
    setContentAnalysis,
    setPapers,
    startExtraction,
    updateProgress, // CRITICAL FIX (Nov 18, 2025): Added for WebSocket progress updates
    completeExtraction, // CRITICAL FIX (Nov 18, 2025): Added for modal close functionality
    extractThemesV2,
    onExtractionComplete,
    onExtractionError,
  } = config;

  // ===========================
  // MODE SELECTION HANDLER
  // ===========================

  /**
   * Handle extraction mode selection
   *
   * **Modes:**
   * - Quick: Show purpose wizard for manual purpose selection
   * - Guided: Show AI-powered guided extraction wizard
   *
   * @param {ExtractionMode} mode - Selected extraction mode
   */
  const handleModeSelected = useCallback(
    async (mode: ExtractionMode) => {
      const requestId = currentRequestId || 'unknown';
      logger.info('Mode selected', 'ThemeExtractionHandlers', { requestId, mode });

      setShowModeSelectionModal(false);

      if (mode === 'quick') {
        // Quick mode: Show purpose wizard (existing flow)
        logger.info('Opening Purpose Selection Wizard', 'ThemeExtractionHandlers', { requestId });
        setShowPurposeWizard(true);
      } else {
        // Guided mode: Show guided extraction wizard
        logger.info('Opening Guided Extraction Wizard', 'ThemeExtractionHandlers', { requestId });
        setShowGuidedWizard(true);
      }
    },
    [
      currentRequestId,
      setShowModeSelectionModal,
      setShowPurposeWizard,
      setShowGuidedWizard,
    ]
  );

  // ===========================
  // PURPOSE SELECTION HANDLER
  // ===========================

  /**
   * Handle theme extraction with selected purpose
   *
   * **Process Flow:**
   * 1. Validation - Check content requirements for purpose
   * 2. Preparation - Mark papers as extracting, start progress
   * 3. Full-text Waiting - Ensure full-text extraction complete
   * 4. Content Refresh - Update content analysis with new full-text
   * 5. API Call - Execute theme extraction via extractThemesV2
   * 6. Progress Tracking - WebSocket updates handled externally
   * 7. Result Processing - Store themes and update UI
   * 8. Error Handling - Comprehensive logging and recovery
   *
   * **Content Requirements:**
   * - Literature Synthesis: 10+ full-text (required)
   * - Hypothesis Generation: 8+ full-text (required)
   * - Survey Construction: 5+ full-text (recommended)
   * - Q-Methodology: No minimum
   * - Qualitative Analysis: 3+ full-text (recommended)
   *
   * @param {ResearchPurpose} purpose - Selected research purpose
   */
  const handlePurposeSelected = useCallback(
    async (purpose: ResearchPurpose) => {
      // ===========================
      // STEP 1: INITIALIZATION & LOGGING
      // ===========================

      const requestId = currentRequestId || 'unknown';
      const requirement = PURPOSE_REQUIREMENTS[purpose];

      logger.info('Purpose selected - handlePurposeSelected called', 'ThemeExtractionHandlers', {
        requestId,
        purpose,
        purposeName: requirement?.name,
        methodology: requirement?.methodology,
        minFullTextRequired: requirement?.minFullText,
        timestamp: new Date().toISOString(),
      });

      setExtractionPurpose(purpose);
      setShowPurposeWizard(false);
      setAnalyzingThemes(true);

      // ===========================
      // STEP 2: CONTENT ANALYSIS VALIDATION
      // ===========================

      if (!contentAnalysis) {
        logger.error('Content analysis data missing', 'ThemeExtractionHandlers', { requestId });
        toast.error('Content analysis data missing. Please try again.');
        setAnalyzingThemes(false);
        setIsExtractionInProgress(false);
        return;
      }

      // BUGFIX: Validate sources array exists and has content
      if (!contentAnalysis.sources || contentAnalysis.sources.length === 0) {
        logger.error('No sources in contentAnalysis', 'ThemeExtractionHandlers', {
          requestId,
          contentAnalysis,
        });
        toast.error(
          'No papers with content available for extraction. Please select papers with abstracts or full-text.',
          { duration: 8000 }
        );
        setAnalyzingThemes(false);
        setIsExtractionInProgress(false);
        return;
      }

      logger.info('Content analysis data available', 'ThemeExtractionHandlers', {
        requestId,
        fullTextCount: contentAnalysis.fullTextCount,
        abstractOverflowCount: contentAnalysis.abstractOverflowCount,
        abstractCount: contentAnalysis.abstractCount,
        noContentCount: contentAnalysis.noContentCount,
        avgContentLength: Math.round(contentAnalysis.avgContentLength),
        quality: contentAnalysis.hasFullTextContent ? 'HIGH' : 'MODERATE',
      });

      // ===========================
      // STEP 3: VALIDATE CONTENT REQUIREMENTS
      // ===========================

      // ✅ FIXED (Phase 10.92 Day 2): Count ONLY actual full-text, not abstract overflow
      // Abstract overflow (250-500 words) is NOT equivalent to full-text (3000-15000 words)
      const fullTextCount = contentAnalysis.fullTextCount;
      const abstractOverflowCount = contentAnalysis.abstractOverflowCount;
      const abstractCount = contentAnalysis.abstractCount;

      logger.info('Validating content requirements', 'ThemeExtractionHandlers', {
        requestId,
        fullTextCount,
        abstractOverflowCount,
        abstractCount,
        noContentCount: contentAnalysis.noContentCount,
      });

      // Required validations (block extraction)
      // ✅ FIXED (Phase 10.92 Day 2): Updated validation with nuanced messaging
      if (purpose === 'literature_synthesis' && fullTextCount < 10) {
        // Check if we have abstract overflow papers as partial mitigation
        if (abstractOverflowCount >= 5) {
          // Soft warning - can proceed but quality may suffer
          logger.warn('Literature Synthesis: Insufficient full-text papers', 'ThemeExtractionHandlers', {
            requestId,
            fullTextCount,
            required: 10,
            abstractOverflowCount,
          });
          toast.warning(
            `Literature Synthesis works best with 10+ full-text papers for methodologically sound meta-ethnography. ` +
              `You have ${fullTextCount} full-text and ${abstractOverflowCount} extended abstract${abstractOverflowCount !== 1 ? 's' : ''}. ` +
              `Theme extraction will proceed, but quality may be lower than expected. ` +
              `Consider waiting for full-text extraction to complete for better results.`,
            { duration: 10000 }
          );
        } else {
          // Hard error - block extraction
          logger.error('Validation failed: Literature Synthesis requires 10+ full-text', 'ThemeExtractionHandlers', {
            requestId,
            fullTextCount,
            required: 10,
          });
          toast.error(
            `Cannot extract themes: Literature Synthesis requires at least 10 full-text papers ` +
              `for methodologically sound meta-ethnography. You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''} ` +
              `and ${abstractOverflowCount} extended abstract${abstractOverflowCount !== 1 ? 's' : ''}. ` +
              `Please select more papers with full-text or wait for full-text extraction to complete.`,
            { duration: 10000 }
          );
          setShowPurposeWizard(false);
          setAnalyzingThemes(false);
          return;
        }
      } else if (purpose === 'literature_synthesis') {
        logger.info('Literature Synthesis validation passed', 'ThemeExtractionHandlers', {
          requestId,
          fullTextCount,
        });
      }

      if (purpose === 'hypothesis_generation' && fullTextCount < 8) {
        // ✅ FIXED (Phase 10.92 Day 2): Updated validation with nuanced messaging
        if (abstractOverflowCount >= 4) {
          // Soft warning - can proceed but quality may suffer
          logger.warn('Hypothesis Generation: Insufficient full-text papers', 'ThemeExtractionHandlers', {
            requestId,
            fullTextCount,
            required: 8,
            abstractOverflowCount,
          });
          toast.warning(
            `Hypothesis Generation works best with 8+ full-text papers for grounded theory analysis. ` +
              `You have ${fullTextCount} full-text and ${abstractOverflowCount} extended abstract${abstractOverflowCount !== 1 ? 's' : ''}. ` +
              `Theme extraction will proceed, but hypothesis quality may be lower than expected.`,
            { duration: 10000 }
          );
        } else {
          // Hard error - block extraction
          logger.error('Validation failed: Hypothesis Generation requires 8+ full-text', 'ThemeExtractionHandlers', {
            requestId,
            fullTextCount,
            required: 8,
          });
          toast.error(
            `Cannot extract themes: Hypothesis Generation requires at least 8 full-text papers for grounded theory. ` +
              `You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''} ` +
              `and ${abstractOverflowCount} extended abstract${abstractOverflowCount !== 1 ? 's' : ''}. ` +
              `Please select more papers with full-text or wait for full-text extraction to complete.`,
            { duration: 10000 }
          );
          setShowPurposeWizard(false);
          setAnalyzingThemes(false);
          return;
        }
      } else if (purpose === 'hypothesis_generation') {
        logger.info('Hypothesis Generation validation passed', 'ThemeExtractionHandlers', {
          requestId,
          fullTextCount,
        });
      }

      // Recommended validations (warn but proceed)
      // ✅ FIXED (Phase 10.92 Day 2): Updated validation with content breakdown
      if (purpose === 'survey_construction' && fullTextCount < 5) {
        logger.warn('Survey Construction: Below recommended full-text papers', 'ThemeExtractionHandlers', {
          requestId,
          fullTextCount,
          recommended: 5,
          abstractOverflowCount,
        });
        toast.warning(
          `Survey Construction works best with at least 5 full-text papers. ` +
            `You have ${fullTextCount} full-text and ${abstractOverflowCount} extended abstract${abstractOverflowCount !== 1 ? 's' : ''}. ` +
            `Proceeding with theme extraction...`,
          { duration: 6000 }
        );
      } else if (purpose === 'survey_construction') {
        logger.info('Survey Construction validation passed', 'ThemeExtractionHandlers', {
          requestId,
          fullTextCount,
        });
      }

      if (purpose === 'q_methodology') {
        logger.info('Q-Methodology: No minimum full-text requirement', 'ThemeExtractionHandlers', { requestId });
      }

      logger.info('Content validation complete - proceeding with extraction', 'ThemeExtractionHandlers', { requestId });

      // ===========================
      // STEP 4: PREPARE FOR EXTRACTION
      // ===========================

      let allSources = contentAnalysis.sources;
      let totalSources = allSources.length;

      // Mark all selected papers as "extracting" (real-time UX)
      const paperIds = Array.from(selectedPapers);
      setExtractingPapers(new Set(paperIds));

      logger.info('Preparing extraction', 'ThemeExtractionHandlers', {
        requestId,
        totalSources,
        paperIdsCount: paperIds.length,
        samplePaperIds: paperIds.slice(0, 5),
      });

      // Start progress tracking
      startExtraction(totalSources);

      // ===========================
      // STEP 5: FULL-TEXT STATUS CHECK
      // ===========================

      const paperIdSet = new Set(paperIds);
      const selectedPapersForDiag = papers.filter(p => paperIdSet.has(p.id));

      // Count papers with identifiers
      const papersWithIdentifiers = selectedPapersForDiag.filter(
        p => p.doi || p.url
      ).length;
      const papersWithoutIdentifiers =
        selectedPapersForDiag.length - papersWithIdentifiers;

      logger.info('Checking full-text status', 'ThemeExtractionHandlers', {
        requestId,
        totalPapers: selectedPapersForDiag.length,
        papersWithIdentifiers,
        papersWithoutIdentifiers,
        samplePapers: selectedPapersForDiag.slice(0, 3).map(p => ({
          title: p.title?.substring(0, 50),
          hasDoi: !!p.doi,
          hasUrl: !!p.url,
          fullTextStatus: p.fullTextStatus || 'not_fetched',
          hasFullText: p.hasFullText,
        })),
      });

      // CRITICAL USER WARNING - Surface identifier issues prominently
      if (papersWithoutIdentifiers > 0) {
        const percentage = Math.round(
          (papersWithoutIdentifiers / selectedPapersForDiag.length) * 100
        );

        logger.warn('Papers missing identifiers for full-text extraction', 'ThemeExtractionHandlers', {
          requestId,
          papersWithoutIdentifiers,
          totalPapers: selectedPapersForDiag.length,
          percentageMissing: percentage,
        });

        if (papersWithoutIdentifiers === selectedPapersForDiag.length) {
          // ALL papers lack identifiers
          toast.error(
            `CRITICAL: All ${papersWithoutIdentifiers} papers lack DOI/PMID/URL identifiers. Full-text extraction is IMPOSSIBLE. Only abstracts will be used for theme extraction.`,
            { duration: 10000 }
          );
        } else if (percentage >= 50) {
          // More than half lack identifiers
          toast.warning(
            `WARNING: ${papersWithoutIdentifiers} of ${selectedPapersForDiag.length} papers (${percentage}%) lack identifiers. They cannot fetch full-text and will use abstracts only.`,
            { duration: 8000 }
          );
        } else {
          // Some papers lack identifiers
          toast.warning(
            `${papersWithoutIdentifiers} papers lack identifiers and will use abstracts only. ${papersWithIdentifiers} papers can fetch full-text.`,
            { duration: 6000 }
          );
        }
      } else {
        logger.info('All papers have identifiers - full-text extraction possible', 'ThemeExtractionHandlers', { requestId });
      }

      // ===========================
      // STEP 6: API CALL TO BACKEND
      // ===========================

      try {
        // CRITICAL VALIDATION - Count actual full-text in sources array
        const actualFullTextCount = allSources.filter(
          s => s.type === 'paper' && s.metadata?.contentType === 'full_text'
        ).length;
        const actualAbstractCount = allSources.filter(
          s => s.type === 'paper' && s.metadata?.contentType === 'abstract'
        ).length;
        const actualAbstractOverflowCount = allSources.filter(
          s =>
            s.type === 'paper' &&
            s.metadata?.contentType === 'abstract_overflow'
        ).length;

        logger.info('Initiating API call to extractThemesV2', 'ThemeExtractionHandlers', {
          requestId,
          purpose,
          userExpertiseLevel,
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
          iterativeRefinement: true,
          contentBreakdown: {
            fullText: actualFullTextCount,
            abstractOverflow: actualAbstractOverflowCount,
            abstractOnly: actualAbstractCount,
            totalSources: allSources.length,
          },
          firstSourceSample: allSources.length > 0 ? {
            title: allSources[0]?.title?.substring(0, 80),
            type: allSources[0]?.type,
            contentLength: allSources[0]?.content?.length || 0,
          } : null,
        });

        // Validate sources match
        if (
          actualFullTextCount === 0 &&
          allSources.filter(s => s.type === 'paper').length > 0
        ) {
          logger.warn('No full-text in sources array - only abstracts available', 'ThemeExtractionHandlers', { requestId });
        }

        const apiStartTime = Date.now();

        // CRITICAL FIX (Nov 18, 2025): Pass onProgress callback for WebSocket progress updates
        // This enables real-time modal progress (prevents stuck on familiarization)
        const result = await extractThemesV2(
          allSources,
          {
            sources: allSources,
            purpose,
            userExpertiseLevel,
            methodology: 'reflexive_thematic',
            validationLevel: 'rigorous',
            iterativeRefinement: true,
          },
          (stageNumber: number, totalStages: number, message: string, transparentMessage?: any) => {
            logger.debug('Progress update received', 'ThemeExtractionHandlers', {
              requestId,
              stageNumber,
              totalStages,
              message,
            });
            updateProgress(stageNumber, totalStages, transparentMessage);
          }
        );

        const apiDuration = Date.now() - apiStartTime;
        logger.info('API call completed', 'ThemeExtractionHandlers', {
          requestId,
          durationMs: apiDuration,
          durationSeconds: (apiDuration / 1000).toFixed(1),
        });

        // Phase 10.7 Day 5 FIX: Validate result before processing
        // extractThemesV2 hook returns null on error instead of throwing
        if (!result) {
          throw new Error(
            'Theme extraction failed: API returned null (authentication or network error)'
          );
        }

        // ===========================
        // STEP 7: PROCESS RESULTS
        // ===========================

        logger.info('Processing extraction results', 'ThemeExtractionHandlers', {
          requestId,
          themesExtracted: result.themes?.length || 0,
        });

        // Phase 10.1 Day 12: Move papers from extracting to extracted state
        // This ensures "Extracted" badges show on papers even if WebSocket fails
        setExtractedPapers(prev => {
          const newExtracted = new Set(prev);
          paperIds.forEach(id => newExtracted.add(id));
          logger.info('Papers marked as extracted', 'ThemeExtractionHandlers', {
            requestId,
            papersMarked: paperIds.length,
            totalExtracted: newExtracted.size,
          });
          return newExtracted;
        });

        // Clear extracting state
        setExtractingPapers(new Set());

        // CRITICAL FIX (Nov 18, 2025): Set progress to 'complete' state
        // This enables modal close handlers (ESC key and click-outside)
        completeExtraction(result.themes?.length || 0);

        // Call completion callback
        if (onExtractionComplete && result.themes) {
          onExtractionComplete(result.themes);
        }

        toast.success(
          `Successfully extracted ${result.themes?.length || 0} themes!`
        );
      } catch (error: any) {
        // ===========================
        // STEP 8: ERROR HANDLING
        // ===========================

        logger.error('Theme extraction error', 'ThemeExtractionHandlers', {
          requestId,
          timestamp: new Date().toISOString(),
          errorType: error.name || 'Unknown',
          errorMessage: error.message || 'No message',
          apiError: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          } : null,
          isNetworkError: !error.response && !!error.request,
          context: {
            purpose,
            sourcesCount: allSources.length,
            fullTextPapers: contentAnalysis?.fullTextCount,
            paperIds,
          },
          stack: error.stack,
        });

        // Clear extracting state on error
        setExtractingPapers(new Set());

        // Set error in progress
        setExtractionError(error.message || 'Unknown error');

        // Call error callback
        if (onExtractionError) {
          onExtractionError(error.message || 'Unknown error');
        }

        // CRITICAL FIX: Reset extraction in progress on error
        setIsExtractionInProgress(false);

        toast.error(
          `Theme extraction failed: ${error.message || 'Unknown error'}`
        );
      } finally {
        setAnalyzingThemes(false);

        // CRITICAL FIX: Always reset extraction in progress in finally block
        setIsExtractionInProgress(false);

        logger.info('handlePurposeSelected cleanup complete', 'ThemeExtractionHandlers', { requestId });
      }
    },
    [
      currentRequestId,
      contentAnalysis,
      papers,
      selectedPapers,
      userExpertiseLevel,
      setExtractionPurpose,
      setShowPurposeWizard,
      setAnalyzingThemes,
      setExtractingPapers,
      setIsExtractionInProgress,
      setExtractionError,
      setContentAnalysis,
      setPapers,
      startExtraction,
      updateProgress, // CRITICAL FIX (Nov 18, 2025): Added for WebSocket progress updates
      completeExtraction, // CRITICAL FIX (Nov 18, 2025): Added for modal close functionality
      extractThemesV2,
      onExtractionComplete,
      onExtractionError,
    ]
  );

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    handleModeSelected,
    handlePurposeSelected,
  };
}
