/**
 * Theme Extraction Workflow Hook - Phase 10.1 Day 6 Sub-Phase 2A
 *
 * Enterprise-grade hook for managing theme extraction preparation workflow.
 * Extracts the 761-line handleExtractThemes function from God Component.
 *
 * @module useThemeExtractionWorkflow
 * @since Phase 10.1 Day 6
 * @author VQMethod Team
 *
 * **Features:**
 * - Paper selection validation
 * - Duplicate extraction prevention
 * - Automatic metadata refresh for stale papers
 * - Paper database synchronization with retry logic
 * - Content analysis and filtering
 * - Content type breakdown (full-text, abstract, etc.)
 * - Modal state management
 * - Request ID tracking for debugging
 *
 * **Workflow Steps:**
 * 1. Validate paper/video selection
 * 2. Prevent duplicate extraction sessions
 * 3. Open modal with preparing state
 * 4. Check for stale paper metadata
 * 5. Refresh metadata if needed
 * 6. Save papers to database (with retry)
 * 7. Perform content analysis
 * 8. Filter sources by content length
 * 9. Calculate content type breakdown
 * 10. Update modal state for mode selection
 *
 * **Usage:**
 * ```typescript
 * const {
 *   // State
 *   isExtractionInProgress,
 *   preparingMessage,
 *   contentAnalysis,
 *   currentRequestId,
 *   showModeSelectionModal,
 *
 *   // Handlers
 *   handleExtractThemes,
 *
 *   // Setters
 *   setShowModeSelectionModal,
 *   setIsExtractionInProgress,
 * } = useThemeExtractionWorkflow({
 *   selectedPapers,
 *   papers,
 *   setPapers,
 *   transcribedVideos,
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { literatureAPI } from '@/lib/services/literature-api.service';
import { retryApiCall } from '@/lib/utils/retry';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum content length for analysis (characters) */
const MIN_CONTENT_LENGTH = 50;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Content analysis data structure
 */
export interface ContentAnalysis {
  /** Number of papers with full-text */
  fullTextCount: number;
  /** Number of papers with abstract overflow (>250 words) */
  abstractOverflowCount: number;
  /** Number of papers with abstract only */
  abstractCount: number;
  /** Number of papers with no content */
  noContentCount: number;
  /** Average content length across all sources */
  avgContentLength: number;
  /** Whether any full-text content is available */
  hasFullTextContent: boolean;
  /** All valid source content objects */
  sources: SourceContent[];
}

/**
 * Paper object structure (minimal required fields)
 */
export interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  source: string;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  keywords?: string[];
  hasFullText?: boolean;
  fullText?: string;
  fullTextStatus?: string;
  contentType?: 'full_text' | 'abstract_overflow' | 'abstract' | 'none';
}

/**
 * Transcribed video structure
 */
export interface TranscribedVideo {
  id: string;
  title: string;
  sourceId: string;
  url: string;
  channel?: string;
  duration: number;
  cost: number;
  transcript: string;
  themes?: any[];
  extractedAt: string;
  cached: boolean;
}

/**
 * Hook configuration
 */
export interface UseThemeExtractionWorkflowConfig {
  /** Currently selected paper IDs */
  selectedPapers: Set<string>;
  /** All papers in search results */
  papers: Paper[];
  /** Setter for updating papers array */
  setPapers: (papers: Paper[]) => void;
  /** Transcribed videos for extraction */
  transcribedVideos: TranscribedVideo[];
}

/**
 * Hook return type
 */
export interface UseThemeExtractionWorkflowReturn {
  // State
  isExtractionInProgress: boolean;
  preparingMessage: string;
  contentAnalysis: ContentAnalysis | null;
  currentRequestId: string | null;
  showModeSelectionModal: boolean;

  // Handlers
  handleExtractThemes: () => Promise<void>;

  // Setters (for external control)
  setShowModeSelectionModal: (show: boolean) => void;
  setIsExtractionInProgress: (inProgress: boolean) => void;
  setPreparingMessage: (message: string) => void;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing theme extraction preparation workflow
 *
 * **Architecture:**
 * - Validates selection before starting
 * - Prevents concurrent extraction sessions
 * - Automatically refreshes stale metadata
 * - Saves papers to database with retry logic
 * - Analyzes content quality and availability
 * - Prepares data for mode selection wizard
 *
 * **Error Handling:**
 * - Graceful degradation on metadata refresh failure
 * - Retry logic with exponential backoff for paper saving
 * - User-friendly error messages in modal
 * - Automatic cleanup on errors
 *
 * @param {UseThemeExtractionWorkflowConfig} config - Configuration object
 * @returns {UseThemeExtractionWorkflowReturn} State and handlers
 */
export function useThemeExtractionWorkflow(
  config: UseThemeExtractionWorkflowConfig
): UseThemeExtractionWorkflowReturn {
  const { selectedPapers, papers, setPapers, transcribedVideos } = config;

  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [isExtractionInProgress, setIsExtractionInProgress] = useState(false);
  const [preparingMessage, setPreparingMessage] = useState<string>('');
  const [contentAnalysis, setContentAnalysis] =
    useState<ContentAnalysis | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);

  // ===========================
  // MAIN EXTRACTION HANDLER
  // ===========================

  /**
   * Main theme extraction preparation handler
   *
   * **Process:**
   * 1. Validation - Check if papers/videos selected
   * 2. Duplication Check - Prevent concurrent extractions
   * 3. Modal Opening - Show preparing state
   * 4. Metadata Refresh - Update stale paper data
   * 5. Database Sync - Save papers for full-text extraction
   * 6. Content Analysis - Evaluate source quality
   * 7. Filtering - Remove sources without content
   * 8. Ready State - Clear preparing message for mode selection
   */
  const handleExtractThemes = useCallback(async () => {
    // ===========================
    // STEP 0: VALIDATION
    // ===========================

    // Phase 10 Day 34: CRITICAL FIX - Prevent duplicate extraction sessions
    if (isExtractionInProgress) {
      console.warn(
        '⚠️ Extraction already in progress - ignoring duplicate click'
      );
      return; // Silently ignore, modal already shows progress
    }

    // Phase 10 Day 34: Check if any papers are selected
    const totalSources = selectedPapers.size + transcribedVideos.length;
    if (totalSources === 0) {
      console.error('❌ No sources selected - aborting');
      toast.error(
        'Please select at least one paper or video for theme extraction'
      );
      return;
    }

    // Set extraction in progress
    setIsExtractionInProgress(true);

    // Phase 10 Day 34: Open modal immediately with preparing state
    setPreparingMessage('Analyzing papers and preparing for extraction...');
    setShowModeSelectionModal(true);

    // PHASE 10 DAY 5.17.3: Generate unique request ID for tracing
    const requestId = `extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 [${requestId}] THEME EXTRACTION STARTED`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📊 [${requestId}] Initial counts:`, {
      selectedPapers: selectedPapers.size,
      transcribedVideos: transcribedVideos.length,
      totalSources,
    });

    const papersToAnalyze = selectedPapers; // Use existing selection

    // ===========================
    // STEP 0.5: METADATA REFRESH
    // ===========================

    console.log(
      `\n╔════════════════════════════════════════════════════════════╗`
    );
    console.log(`║   🔄 STEP 0.5: AUTO-REFRESH STALE METADATA               ║`);
    console.log(
      `╚════════════════════════════════════════════════════════════╝`
    );
    console.log(`   Checking for papers with outdated full-text metadata...`);

    const papersToCheck = papers.filter(p => papersToAnalyze.has(p.id));
    const stalePapers = papersToCheck.filter(
      p =>
        (p.doi || p.url) && // Has identifiers (can fetch full-text)
        (!p.hasFullText || p.fullTextStatus === 'not_fetched') // Missing full-text metadata
    );

    console.log(`   📊 Analysis:`);
    console.log(`      • Total selected papers: ${papersToCheck.length}`);
    console.log(`      • Papers with stale metadata: ${stalePapers.length}`);
    console.log(
      `      • Papers with up-to-date metadata: ${papersToCheck.length - stalePapers.length}`
    );

    if (stalePapers.length > 0) {
      console.log(
        `\n   🔄 Refreshing metadata for ${stalePapers.length} papers...`
      );
      setPreparingMessage(
        `Updating metadata for ${stalePapers.length} papers...`
      );

      try {
        const paperIdsToRefresh = stalePapers.map(p => p.id);
        const refreshResult =
          await literatureAPI.refreshPaperMetadata(paperIdsToRefresh);

        console.log(`   ✅ Metadata refresh complete:`);
        console.log(
          `      • Successfully refreshed: ${refreshResult.refreshed}`
        );
        console.log(`      • Failed: ${refreshResult.failed}`);
        console.log(
          `      • Papers with full-text: ${refreshResult.papers.filter(p => p.hasFullText).length}`
        );

        // Update the papers array with refreshed metadata
        const refreshedPapersMap = new Map(
          refreshResult.papers.map(p => [p.id, p])
        );
        const updatedPapers = papers.map(
          p => refreshedPapersMap.get(p.id) || p
        );
        setPapers(updatedPapers);

        console.log(`   ✅ Papers array updated with fresh metadata`);
      } catch (error: any) {
        console.error(`   ❌ Metadata refresh failed:`, error);
        // Continue anyway - not critical for extraction
      }
    } else {
      console.log(
        `   ✅ All selected papers have up-to-date metadata - skipping refresh`
      );
    }
    console.log(``);

    // ===========================
    // STEP 1: CONTENT ANALYSIS
    // ===========================

    console.log(
      `📄 [${requestId}] STEP 1: Content Analysis - Analyzing ${papersToAnalyze.size} papers...`
    );

    // Phase 10 Day 31.5: CRITICAL FIX - Save papers to database FIRST
    console.log(
      `💾 [${requestId}] Saving papers to database to enable full-text extraction...`
    );

    const papersToSave = papers.filter(p => papersToAnalyze.has(p.id));
    let savedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failedPapers: Array<{ title: string; error: string }> = [];

    // Paper save function with retry logic
    const savePaperWithRetry = async (
      paper: Paper
    ): Promise<{ success: boolean; error?: string }> => {
      // Build save payload with only defined fields
      const savePayload: any = {
        title: paper.title,
        authors: paper.authors || [],
        year: paper.year,
        source: paper.source,
      };

      // Add optional fields only if defined
      if (paper.abstract) savePayload.abstract = paper.abstract;
      if (paper.doi) savePayload.doi = paper.doi;
      if (paper.url) savePayload.url = paper.url;
      if (paper.venue) savePayload.venue = paper.venue;
      if (paper.citationCount !== undefined)
        savePayload.citationCount = paper.citationCount;
      if (paper.keywords) savePayload.keywords = paper.keywords;

      // Use shared retry utility with jitter and exponential backoff
      const result = await retryApiCall(
        async () => {
          const saveResult = await literatureAPI.savePaper(savePayload);
          if (!saveResult.success) {
            throw new Error('Save returned false');
          }
          return saveResult;
        },
        {
          maxRetries: 3,
          onRetry: (attempt: number, error: Error, delayMs: number) => {
            console.warn(
              `   ⚠️  Retry ${attempt}/3 for "${paper.title?.substring(0, 40)}..." - waiting ${Math.round(delayMs)}ms (${error.message})`
            );
          },
        }
      );

      return result;
    };

    // Save all papers sequentially
    for (const paper of papersToSave) {
      const saveResult = await savePaperWithRetry(paper);

      if (saveResult.success) {
        savedCount++;
        console.log(
          `   ✅ Saved: "${paper.title?.substring(0, 50)}..." (${paper.doi || paper.url || 'no identifier'})`
        );
      } else {
        // Check if it's a duplicate error (non-critical)
        if (
          saveResult.error?.includes('already exists') ||
          saveResult.error?.includes('duplicate')
        ) {
          skippedCount++;
          console.log(
            `   ⏭️  Skipped (duplicate): "${paper.title?.substring(0, 50)}..."`
          );
        } else {
          failedCount++;
          failedPapers.push({
            title: paper.title || 'Unknown',
            error: saveResult.error || 'Unknown error',
          });
          console.error(
            `   ❌ Failed after retries: "${paper.title?.substring(0, 50)}..." - ${saveResult.error}`
          );
        }
      }

      // Update progress message
      const progress = savedCount + skippedCount + failedCount;
      setPreparingMessage(
        `Saving papers (${progress}/${papersToSave.length})...`
      );
    }

    console.log(`\n✅ Paper saving complete:`);
    console.log(`   • Saved: ${savedCount}`);
    console.log(`   • Skipped (duplicates): ${skippedCount}`);
    console.log(`   • Failed: ${failedCount}`);

    if (failedCount > 0) {
      console.warn(`\n⚠️  ${failedCount} papers failed to save:`);
      failedPapers.forEach(({ title, error }) => {
        console.warn(`   • "${title.substring(0, 50)}...": ${error}`);
      });
    }

    // Phase 10 Day 34: Update preparing message for content analysis
    setPreparingMessage('Analyzing paper content...');

    // Prepare paper sources
    const paperSources: SourceContent[] = papers
      .filter(p => papersToAnalyze.has(p.id))
      .map(p => {
        // Determine content type and text
        let content = '';
        let contentType:
          | 'full_text'
          | 'abstract_overflow'
          | 'abstract'
          | 'none' = 'none';

        if (p.hasFullText && p.fullText) {
          content = p.fullText;
          contentType = 'full_text';
        } else if (p.abstract) {
          const wordCount = p.abstract.split(/\s+/).length;
          content = p.abstract;
          contentType = wordCount > 250 ? 'abstract_overflow' : 'abstract';
        }

        return {
          id: p.id,
          type: 'paper' as const,
          title: p.title,
          content,
          keywords: p.keywords || [],
          url: p.url || p.doi || '',
          metadata: {
            authors: p.authors?.join(', ') || '',
            year: p.year,
            venue: p.venue,
            citationCount: p.citationCount,
            contentType,
            fullTextStatus: p.hasFullText
              ? ('success' as const)
              : ('failed' as const),
          },
        };
      });

    // Add transcribed videos
    const videoSources: SourceContent[] = transcribedVideos.map(video => ({
      id: video.id,
      type: 'youtube' as const,
      title: video.title,
      content: video.transcript,
      keywords: video.themes?.map((t: any) => t.label || t) || [],
      url: video.url,
      metadata: {
        videoId: video.sourceId,
        duration: video.duration,
        channel: video.channel,
      },
    }));

    // Filter out sources without content
    console.log(
      `\n🔍 [${requestId}] Filtering sources with sufficient content (>${MIN_CONTENT_LENGTH} chars)...`
    );
    const beforeFilter = paperSources.length;
    const allSources = [
      ...paperSources.filter(
        s => s.content && s.content.length > MIN_CONTENT_LENGTH
      ),
      ...videoSources,
    ];
    const afterFilter = allSources.length;
    console.log(
      `   Filtered: ${beforeFilter} papers → ${afterFilter} valid sources (removed ${beforeFilter - afterFilter})`
    );

    if (allSources.length === 0) {
      console.error(`❌ [${requestId}] No sources with content - aborting`);
      setPreparingMessage(
        '❌ Selected papers have no content. Please select papers with abstracts or full-text.'
      );
      // Wait 3 seconds to show error, then close modal
      await new Promise(resolve => setTimeout(resolve, 3000));
      setShowModeSelectionModal(false);
      setPreparingMessage('');
      setIsExtractionInProgress(false);
      return;
    }

    // Calculate content type breakdown
    const contentTypeBreakdown = {
      fullText: paperSources.filter(
        s => s.metadata?.contentType === 'full_text'
      ).length,
      abstractOverflow: paperSources.filter(
        s => s.metadata?.contentType === 'abstract_overflow'
      ).length,
      abstract: paperSources.filter(s => s.metadata?.contentType === 'abstract')
        .length,
      noContent: paperSources.filter(s => s.metadata?.contentType === 'none')
        .length,
    };

    const totalContentLength = allSources.reduce(
      (sum, s) => sum + (s.content?.length || 0),
      0
    );
    const avgContentLength = totalContentLength / allSources.length;
    const hasFullTextContent =
      contentTypeBreakdown.fullText + contentTypeBreakdown.abstractOverflow > 0;

    // Store content analysis for Purpose Wizard
    setContentAnalysis({
      fullTextCount: contentTypeBreakdown.fullText,
      abstractOverflowCount: contentTypeBreakdown.abstractOverflow,
      abstractCount: contentTypeBreakdown.abstract,
      noContentCount: contentTypeBreakdown.noContent,
      avgContentLength,
      hasFullTextContent,
      sources: allSources,
    });

    console.log(
      `\n✅ [${requestId}] STEP 1 COMPLETE: Content Analysis Summary`
    );
    console.log(`${'─'.repeat(60)}`);
    console.log(`   📊 Content Type Breakdown:`);
    console.log(`      • Full-text papers: ${contentTypeBreakdown.fullText}`);
    console.log(
      `      • Abstract overflow: ${contentTypeBreakdown.abstractOverflow}`
    );
    console.log(
      `      • Abstract-only papers: ${contentTypeBreakdown.abstract}`
    );
    console.log(`      • No content: ${contentTypeBreakdown.noContent}`);
    console.log(`      • Videos: ${videoSources.length}`);
    console.log(`   📏 Content Quality:`);
    console.log(
      `      • Total sources: ${allSources.length} (${((allSources.length / totalSources) * 100).toFixed(1)}% of selected)`
    );
    console.log(
      `      • Average content length: ${Math.round(avgContentLength)} chars`
    );
    console.log(
      `      • Has full-text: ${hasFullTextContent ? 'Yes ✅' : 'No ⚠️'}`
    );
    console.log(`${'─'.repeat(60)}`);

    // Phase 10 Day 34: Clear preparing message when ready for mode selection
    setPreparingMessage('');
  }, [
    isExtractionInProgress,
    selectedPapers,
    transcribedVideos,
    papers,
    setPapers,
  ]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // State
    isExtractionInProgress,
    preparingMessage,
    contentAnalysis,
    currentRequestId,
    showModeSelectionModal,

    // Handlers
    handleExtractThemes,

    // Setters
    setShowModeSelectionModal,
    setIsExtractionInProgress,
    setPreparingMessage,
    setContentAnalysis,
  };
}
