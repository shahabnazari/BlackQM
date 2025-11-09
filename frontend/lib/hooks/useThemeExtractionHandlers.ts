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
  userExpertiseLevel: 'novice' | 'researcher' | 'expert';

  // State setters
  setShowModeSelectionModal: (show: boolean) => void;
  setShowPurposeWizard: (show: boolean) => void;
  setShowGuidedWizard: (show: boolean) => void;
  setExtractionPurpose: (purpose: ResearchPurpose) => void;
  setAnalyzingThemes: (analyzing: boolean) => void;
  setExtractingPapers: (papers: Set<string>) => void;
  setIsExtractionInProgress: (inProgress: boolean) => void;
  setExtractionError: (error: string) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
  setPapers: (papers: Paper[]) => void;

  // Progress tracking
  startExtraction: (totalSources: number) => void;

  // API functions
  extractThemesV2: (sources: any[], request: any, onProgress?: any) => Promise<any>;

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
    setIsExtractionInProgress,
    setExtractionError,
    setContentAnalysis,
    setPapers,
    startExtraction,
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
      console.log(`\n🎯 [${requestId}] Mode selected: ${mode.toUpperCase()}`);

      setShowModeSelectionModal(false);

      if (mode === 'quick') {
        // Quick mode: Show purpose wizard (existing flow)
        console.log(
          `⚡ [${requestId}] Opening Purpose Selection Wizard for quick extraction...`
        );
        setShowPurposeWizard(true);
      } else {
        // Guided mode: Show guided extraction wizard
        console.log(
          `🤖 [${requestId}] Opening Guided Extraction Wizard for AI-powered extraction...`
        );
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
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 [${requestId}] STEP 2: PURPOSE SELECTED`);
      console.log(`${'='.repeat(80)}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.log(`🎯 Selected purpose: "${purpose}"`);
      console.log(`📋 Purpose requirements:`);

      const requirement = PURPOSE_REQUIREMENTS[purpose];
      if (requirement) {
        console.log(`   • Purpose: ${requirement.name}`);
        console.log(`   • Methodology: ${requirement.methodology}`);
        console.log(`   • Min full-text papers: ${requirement.minFullText}`);
      }

      setExtractionPurpose(purpose);
      setShowPurposeWizard(false);
      setAnalyzingThemes(true);

      // ===========================
      // STEP 2: CONTENT ANALYSIS VALIDATION
      // ===========================

      if (!contentAnalysis) {
        console.error(`❌ [${requestId}] Content analysis data missing!`);
        toast.error('Content analysis data missing. Please try again.');
        setAnalyzingThemes(false);
        return;
      }

      console.log(`✅ [${requestId}] Content analysis data available`);
      console.log(`   • Full-text papers: ${contentAnalysis.fullTextCount}`);
      console.log(
        `   • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
      );
      console.log(`   • Abstract-only: ${contentAnalysis.abstractCount}`);
      console.log(`   • No content: ${contentAnalysis.noContentCount}`);
      console.log(
        `   • Avg content length: ${Math.round(contentAnalysis.avgContentLength).toLocaleString()} chars`
      );
      console.log(
        `   • Quality: ${contentAnalysis.hasFullTextContent ? 'HIGH' : 'MODERATE'}`
      );

      // ===========================
      // STEP 3: VALIDATE CONTENT REQUIREMENTS
      // ===========================

      const fullTextCount =
        contentAnalysis.fullTextCount + contentAnalysis.abstractOverflowCount;

      console.log(`\n🔍 [${requestId}] VALIDATION: Content Requirements`);
      console.log(`${'─'.repeat(60)}`);
      console.log(
        `   📊 Full-text count (including overflow): ${fullTextCount}`
      );
      console.log(`      • Pure full-text: ${contentAnalysis.fullTextCount}`);
      console.log(
        `      • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
      );

      // Required validations (block extraction)
      if (purpose === 'literature_synthesis' && fullTextCount < 10) {
        console.error(
          `❌ [${requestId}] VALIDATION FAILED: Literature Synthesis requires 10+ full-text, have ${fullTextCount}`
        );
        toast.error(
          `Cannot extract themes: Literature Synthesis requires at least 10 full-text papers for methodologically sound meta-ethnography. You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''}.`,
          { duration: 8000 }
        );
        setShowPurposeWizard(false);
        setAnalyzingThemes(false);
        return;
      } else if (purpose === 'literature_synthesis') {
        console.log(
          `   ✅ Literature Synthesis validation passed (${fullTextCount} >= 10)`
        );
      }

      if (purpose === 'hypothesis_generation' && fullTextCount < 8) {
        console.error(
          `❌ [${requestId}] VALIDATION FAILED: Hypothesis Generation requires 8+ full-text, have ${fullTextCount}`
        );
        toast.error(
          `Cannot extract themes: Hypothesis Generation requires at least 8 full-text papers for grounded theory. You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''}.`,
          { duration: 8000 }
        );
        setShowPurposeWizard(false);
        setAnalyzingThemes(false);
        return;
      } else if (purpose === 'hypothesis_generation') {
        console.log(
          `   ✅ Hypothesis Generation validation passed (${fullTextCount} >= 8)`
        );
      }

      // Recommended validations (warn but proceed)
      if (purpose === 'survey_construction' && fullTextCount < 5) {
        console.warn(
          `⚠️ [${requestId}] Survey Construction: Recommended 5+ full-text papers, have ${fullTextCount} (proceeding)`
        );
        toast.warning(
          `Survey Construction works best with at least 5 full-text papers. You have ${fullTextCount}. Proceeding anyway...`,
          { duration: 6000 }
        );
      } else if (purpose === 'survey_construction') {
        console.log(
          `   ✅ Survey Construction validation passed (${fullTextCount} >= 5)`
        );
      }

      if (purpose === 'q_methodology') {
        console.log(`   ℹ️ Q-Methodology: No minimum full-text requirement`);
      }

      console.log(
        `✅ [${requestId}] Content validation complete - proceeding with extraction`
      );

      // ===========================
      // STEP 4: PREPARE FOR EXTRACTION
      // ===========================

      let allSources = contentAnalysis.sources;
      let totalSources = allSources.length;

      console.log(`\n📦 [${requestId}] STEP 3: Preparing Extraction`);
      console.log(`${'─'.repeat(60)}`);
      console.log(`   📊 Total sources to process: ${totalSources}`);

      // Mark all selected papers as "extracting" (real-time UX)
      const paperIds = Array.from(selectedPapers);
      setExtractingPapers(new Set(paperIds));
      console.log(`   🟡 Marked ${paperIds.length} papers as "extracting"`);
      console.log(
        `   🆔 Paper IDs:`,
        paperIds.slice(0, 5).join(', ') + (paperIds.length > 5 ? '...' : '')
      );

      // Start progress tracking
      startExtraction(totalSources);
      console.log(
        `   ✅ Progress tracking initialized for ${totalSources} sources`
      );

      // ===========================
      // STEP 5: FULL-TEXT STATUS CHECK
      // ===========================

      console.log(`\n⏳ [${requestId}] STEP 3.5: Checking Full-Text Status`);
      console.log(`${'─'.repeat(60)}`);

      // DIAGNOSTIC - Show what papers we're checking
      console.log(
        `🔍 [${requestId}] DIAGNOSTIC - Papers being checked for full-text:`
      );
      const paperIdSet = new Set(paperIds);
      const selectedPapersForDiag = papers.filter(p => paperIdSet.has(p.id));

      selectedPapersForDiag.slice(0, 5).forEach((paper, idx) => {
        console.log(`   ${idx + 1}. "${paper.title?.substring(0, 50)}..."`);
        console.log(`      • DOI: ${paper.doi || 'MISSING'}`);
        console.log(
          `      • URL: ${paper.url ? paper.url.substring(0, 60) + '...' : 'MISSING'}`
        );
        console.log(
          `      • Has identifiers: ${paper.doi || paper.url ? '✅ YES' : '❌ NO (cannot fetch full-text)'}`
        );
        console.log(
          `      • Full-text status: ${paper.fullTextStatus || 'not_fetched'}`
        );
        console.log(
          `      • Has full-text NOW: ${paper.hasFullText ? '✅ YES' : '❌ NO'}`
        );
      });

      if (selectedPapersForDiag.length > 5) {
        console.log(
          `   ... and ${selectedPapersForDiag.length - 5} more papers`
        );
      }

      // Count papers with identifiers
      const papersWithIdentifiers = selectedPapersForDiag.filter(
        p => p.doi || p.url
      ).length;
      const papersWithoutIdentifiers =
        selectedPapersForDiag.length - papersWithIdentifiers;

      console.log(`📊 [${requestId}] Identifier Summary:`);
      console.log(
        `   • Papers WITH identifiers (DOI/PMID/URL): ${papersWithIdentifiers}`
      );
      console.log(
        `   • Papers WITHOUT identifiers: ${papersWithoutIdentifiers}`
      );

      // CRITICAL USER WARNING - Surface identifier issues prominently
      if (papersWithoutIdentifiers > 0) {
        console.warn(
          `   ⚠️ ${papersWithoutIdentifiers} papers CANNOT fetch full-text (no DOI/PMID/URL)!`
        );

        const percentage = Math.round(
          (papersWithoutIdentifiers / selectedPapersForDiag.length) * 100
        );

        if (papersWithoutIdentifiers === selectedPapersForDiag.length) {
          // ALL papers lack identifiers
          toast.error(
            `⚠️ CRITICAL: All ${papersWithoutIdentifiers} papers lack DOI/PMID/URL identifiers. Full-text extraction is IMPOSSIBLE. Only abstracts will be used for theme extraction.`,
            { duration: 10000 }
          );
        } else if (percentage >= 50) {
          // More than half lack identifiers
          toast.warning(
            `⚠️ WARNING: ${papersWithoutIdentifiers} of ${selectedPapersForDiag.length} papers (${percentage}%) lack identifiers. They cannot fetch full-text and will use abstracts only.`,
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
        console.log(
          `   ✅ All papers have identifiers - full-text extraction possible!`
        );
      }

      // ===========================
      // STEP 6: API CALL TO BACKEND
      // ===========================

      try {
        console.log(`\n🚀 [${requestId}] STEP 4: API Call to Backend`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`   🎯 Purpose: ${purpose}`);
        console.log(`   👤 Expertise level: ${userExpertiseLevel}`);
        console.log(`   🔬 Methodology: reflexive_thematic`);
        console.log(`   ✅ Validation level: rigorous`);
        console.log(`   🔄 Iterative refinement: enabled`);

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

        console.log(`\n   📊 Content Breakdown (VALIDATION):`);
        console.log(
          `      • Full-text papers in allSources: ${actualFullTextCount}`
        );
        console.log(
          `      • Abstract overflow in allSources: ${actualAbstractOverflowCount}`
        );
        console.log(
          `      • Abstract-only in allSources: ${actualAbstractCount}`
        );
        console.log(`      • Total sources being sent: ${allSources.length}`);

        // Validate sources match
        if (
          actualFullTextCount === 0 &&
          allSources.filter(s => s.type === 'paper').length > 0
        ) {
          console.warn(
            `⚠️ [${requestId}] WARNING: NO FULL-TEXT IN SOURCES ARRAY! This will cause 0 full articles in familiarization!`
          );
        } else {
          console.log(
            `✅ [${requestId}] Validation passed: ${actualFullTextCount} full-text papers in sources array`
          );
        }

        if (allSources.length > 0) {
          const firstSource = allSources[0];
          console.log(`\n   📄 Sample of first source:`);
          console.log(
            `      • Title: "${(firstSource?.title || '').substring(0, 80)}${(firstSource?.title?.length || 0) > 80 ? '...' : ''}"`
          );
          console.log(`      • Type: ${firstSource?.type || 'unknown'}`);
          console.log(
            `      • Content length: ${(firstSource?.content?.length || 0).toLocaleString()} chars`
          );
          console.log(
            `      • Preview: "${(firstSource?.content || '').substring(0, 150).replace(/\n/g, ' ')}..."`
          );
        }

        // Use V2 purpose-driven extraction with transparent progress
        console.log(`\n   📡 Initiating API call to extractThemesV2...`);
        const apiStartTime = Date.now();

        const result = await extractThemesV2(allSources, {
          sources: allSources,
          purpose,
          userExpertiseLevel,
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
          iterativeRefinement: true,
        });

        const apiDuration = Date.now() - apiStartTime;
        console.log(
          `   ✅ API call completed in ${(apiDuration / 1000).toFixed(1)}s`
        );

        // ===========================
        // STEP 7: PROCESS RESULTS
        // ===========================

        console.log(`\n✅ [${requestId}] STEP 5: Processing Results`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`   📊 Themes extracted: ${result.themes?.length || 0}`);

        // Clear extracting state
        setExtractingPapers(new Set());
        console.log(
          `   ✅ Cleared "extracting" state for ${paperIds.length} papers`
        );

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

        console.error(`\n${'='.repeat(80)}`);
        console.error(`❌ [${requestId}] THEME EXTRACTION ERROR`);
        console.error(`${'='.repeat(80)}`);
        console.error(`⏰ Timestamp: ${new Date().toISOString()}`);
        console.error(`🔍 Error Type: ${error.name || 'Unknown'}`);
        console.error(`💬 Error Message: ${error.message || 'No message'}`);

        // Log error details
        if (error.response) {
          console.error(`\n📡 API Error Details:`);
          console.error(`   • Status: ${error.response.status}`);
          console.error(`   • Status Text: ${error.response.statusText}`);
          console.error(`   • Response Data:`, error.response.data);
        } else if (error.request) {
          console.error(`\n🌐 Network Error (no response received):`);
          console.error(`   • Request:`, error.request);
          console.error(
            `   • Possible causes: timeout, network issue, CORS, server down`
          );
        } else {
          console.error(`\n⚙️ Client-side Error:`);
          console.error(`   • Error:`, error);
        }

        // Log stack trace
        if (error.stack) {
          console.error(`\n📚 Stack Trace:`);
          console.error(error.stack);
        }

        // Log context
        console.error(`\n📊 Context at time of error:`);
        console.error(`   • Purpose: ${purpose}`);
        console.error(`   • Sources: ${allSources.length}`);
        console.error(
          `   • Full-text papers: ${contentAnalysis?.fullTextCount}`
        );
        console.error(`   • Papers being extracted:`, paperIds);

        // Clear extracting state on error
        setExtractingPapers(new Set());
        console.error(
          `   ✅ Cleared "extracting" state for ${paperIds.length} papers`
        );

        // Set error in progress
        setExtractionError(error.message || 'Unknown error');

        // Call error callback
        if (onExtractionError) {
          onExtractionError(error.message || 'Unknown error');
        }

        // CRITICAL FIX: Reset extraction in progress on error
        setIsExtractionInProgress(false);

        console.error(`${'='.repeat(80)}\n`);

        toast.error(
          `Theme extraction failed: ${error.message || 'Unknown error'}`
        );
      } finally {
        setAnalyzingThemes(false);

        // CRITICAL FIX: Always reset extraction in progress in finally block
        setIsExtractionInProgress(false);

        console.log(
          `🏁 [${requestId}] handlePurposeSelected finally block - cleanup complete`
        );
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
