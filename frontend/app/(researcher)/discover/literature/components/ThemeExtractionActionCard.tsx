/**
 * Theme Extraction Action Card
 * Phase 10.935 - Self-Contained Component
 *
 * **Purpose:**
 * Prominent call-to-action card for initiating theme extraction.
 * Shows stats, warnings, and large "Extract Themes" button.
 *
 * **Responsibilities:**
 * - Display extraction statistics (papers, videos, themes)
 * - Show minimum source warnings
 * - Trigger purpose selection wizard modal
 * - Show extraction progress state
 *
 * **Architecture Pattern:**
 * Self-Contained Component (Phase 10.935)
 * - ZERO required props
 * - Gets ALL data from Zustand stores
 * - Fully independent and reusable
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode
 * - ✅ React.memo() for performance
 * - ✅ Enterprise logging
 * - ✅ Accessibility (ARIA labels, semantic HTML)
 */

'use client';

import React, { useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Stores
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
// BUGFIX Phase 10.942: Removed usePaperManagementStore for selection
// Selection state is managed by useLiteratureSearchStore (where SearchResultsContainer puts it)
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { useVideoManagementStore } from '@/lib/stores/video-management.store';

// Utils
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

const MIN_SOURCES_BASIC = 3;
const MIN_SOURCES_RECOMMENDED = 5;

// ============================================================================
// Component
// ============================================================================

/**
 * ThemeExtractionActionCard
 * Self-contained call-to-action card for theme extraction
 */
export const ThemeExtractionActionCard = React.memo(function ThemeExtractionActionCard() {
  // ==========================================================================
  // STORE STATE
  // ==========================================================================

  // BUGFIX Phase 10.942: Get selectedPapers from useLiteratureSearchStore (NOT usePaperManagementStore)
  // SearchResultsContainerEnhanced manages selections in useLiteratureSearchStore
  const { papers, selectedPapers } = useLiteratureSearchStore();
  const {
    unifiedThemes,
    analyzingThemes,
    setShowPurposeWizard,
  } = useThemeExtractionStore();
  const { transcribedVideos } = useVideoManagementStore();

  // ==========================================================================
  // COMPUTED VALUES
  // Phase 10.180: Removed excessive useMemo for O(1) operations
  // useMemo has overhead - only use for expensive computations
  // ==========================================================================

  // Direct property access (O(1) - no memo needed)
  const selectedCount = selectedPapers.size;
  const transcribedCount = transcribedVideos.size;
  const themesCount = unifiedThemes.length;

  // Derived values (simple arithmetic - no memo needed)
  const totalSources = selectedCount + transcribedCount;
  const totalAvailable = papers.length + transcribedCount;

  // Boolean flags (simple comparisons - no memo needed)
  const hasNoSelection = totalSources === 0;
  const hasNoSources = totalAvailable === 0;
  const hasLowSources = totalSources > 0 && totalSources < MIN_SOURCES_BASIC;
  const needsSelection = papers.length > 0 && selectedCount === 0;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle Extract Themes button click
   * Opens purpose selection wizard modal
   *
   * Phase 10.180: Added defense-in-depth validation with user feedback
   */
  const handleExtractThemes = useCallback(() => {
    logger.info('Theme extraction initiated from action card', 'ThemeExtractionActionCard', {
      totalPapers: papers.length,
      selectedPapers: selectedCount,
      transcribedVideos: transcribedCount,
      totalSources,
    });

    // Defense-in-depth: Validate selection before opening wizard
    if (totalSources === 0) {
      logger.warn('Theme extraction blocked: no sources selected', 'ThemeExtractionActionCard');
      if (papers.length > 0) {
        toast.error('Please select papers to extract themes from. Use the checkboxes in the search results.');
      } else {
        toast.error('No papers available. Please search for papers first.');
      }
      return;
    }

    // Open purpose wizard modal
    setShowPurposeWizard(true);
  }, [papers.length, selectedCount, transcribedCount, totalSources, setShowPurposeWizard]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Extract Research Themes
              </h3>
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              >
                Purpose-Driven AI
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select your research purpose (Q-methodology, survey construction, etc.) and extract
              themes using purpose-adaptive algorithms with full provenance tracking.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="text-sm">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedCount}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">papers selected</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {transcribedCount}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">videos transcribed</span>
              </div>
              {themesCount > 0 && (
                <div className="text-sm">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {themesCount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">themes extracted</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {/* Phase 10.180 BUGFIX: Disable when no SELECTION, not when no AVAILABLE papers */}
            <Button
              size="lg"
              onClick={handleExtractThemes}
              disabled={hasNoSelection || analyzingThemes}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={
                analyzingThemes
                  ? 'Extracting themes in progress'
                  : hasNoSelection
                    ? 'Select papers to extract themes'
                    : `Extract themes from ${totalSources} sources`
              }
            >
              {analyzingThemes ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  Extracting Themes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                  {hasNoSelection ? 'Select Papers to Extract' : `Extract Themes from ${totalSources} Sources`}
                </>
              )}
            </Button>

            {/* No Sources Warning - No papers available at all */}
            {hasNoSources && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                Search for papers above or transcribe videos to begin extraction
              </p>
            )}

            {/* Selection Prompt - Papers exist but none selected */}
            {needsSelection && !hasNoSources && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                Use the checkboxes in search results to select papers for theme extraction
              </p>
            )}

            {/* Low Source Count Warning */}
            {/* Phase 10.180: Show totalSources (selected) not totalAvailable */}
            {hasLowSources && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Low Source Count
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You have {totalSources} source(s) selected. For reliable theme extraction, we
                  recommend:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc ml-4 mt-1 space-y-0.5">
                  <li>
                    <strong>Minimum: {MIN_SOURCES_BASIC}-{MIN_SOURCES_RECOMMENDED} sources</strong>{' '}
                    for basic themes
                  </li>
                  <li>
                    <strong>Recommended: {MIN_SOURCES_RECOMMENDED}-10 sources</strong> for robust
                    analysis
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ThemeExtractionActionCard.displayName = 'ThemeExtractionActionCard';
