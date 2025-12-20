/**
 * Literature Discovery Page - Phase 10.96
 *
 * Enterprise-grade literature discovery with unified header design.
 *
 * @module discover/literature
 * @since Phase 10.96
 *
 * **Architecture:**
 * - Self-contained containers (zero props)
 * - Zustand store state management
 * - Unified header with inline stats and navigation
 *
 * **Features:**
 * - Literature Search: Multi-source academic search
 * - Paper Management: Save and organize papers
 * - Theme Extraction: AI-powered theme analysis
 * - Gap Analysis: Research opportunity identification
 *
 * **Navigation:**
 * - Sequential workflow: Search → Results → Library
 * - Non-sequential tools: Inline buttons (Themes, Gaps, Knowledge Map)
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAutoFullTextDetection } from '@/lib/hooks/useAutoFullTextDetection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lightbulb, Search, Network, Loader2 } from 'lucide-react';

// Self-contained containers
import { LiteratureSearchContainer } from './containers/LiteratureSearchContainer';
import { SearchResultsContainerEnhanced } from './containers/SearchResultsContainerEnhanced';
// Phase 10.144: AcademicResourcesPanel removed - too complex for search flow
// ORCID integration will be added to search bar instead
import { ThemeExtractionActionCard } from './components/ThemeExtractionActionCard';
import { PaperManagementContainer } from './containers/PaperManagementContainer';

// Phase 10.180: Modals for theme extraction flow
import { ThematizationConfigModal } from '@/components/literature';
import type { ThematizationConfig } from '@/components/literature';
import { NavigatingToThemesModal } from '@/components/literature/NavigatingToThemesModal';
import { analyzeContentForExtraction } from './utils/content-analysis';
import { useExtractionWorkflow } from '@/lib/hooks/useExtractionWorkflow';
import { useUserUsage } from '@/lib/hooks/useUserUsage';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import type { ResearchPurpose, UserExpertiseLevel } from '@/lib/api/services/unified-theme-api.service';

// Lazy-loaded modals
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

// Stores for stats display only
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { useGapAnalysisStore } from '@/lib/stores/gap-analysis.store';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// ============================================================================
// Constants (moved outside component for performance)
// ============================================================================

const VALID_EXPERTISE_LEVELS: readonly UserExpertiseLevel[] = ['novice', 'researcher', 'expert'] as const;

/**
 * Validates and sanitizes user expertise level
 * Pure function - no React dependencies, can be module-level
 */
function validateExpertiseLevel(level: string | undefined): UserExpertiseLevel {
  if (level && (VALID_EXPERTISE_LEVELS as readonly string[]).includes(level)) {
    return level as UserExpertiseLevel;
  }
  return 'researcher';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Literature Discovery Page
 *
 * Main entry point for literature search and analysis workflows.
 */
export default function LiteratureSearchPage(): JSX.Element {
  // ==========================================================================
  // Hydration Fix - Prevent mismatch with persisted stores
  // ==========================================================================
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================================================
  // Router for navigation
  // ==========================================================================
  const router = useRouter();

  // ==========================================================================
  // Store State - Display counts only (read-only)
  // ==========================================================================
  const papers = useLiteratureSearchStore((state) => state.papers);
  const selectedPapers = useLiteratureSearchStore((state) => state.selectedPapers);
  const savedPapers = usePaperManagementStore((state) => state.savedPapers);
  const unifiedThemes = useThemeExtractionStore((state) => state.unifiedThemes);
  const gaps = useGapAnalysisStore((state) => state.gaps);

  // Phase 10.180: Theme extraction modal state
  const showPurposeWizard = useThemeExtractionStore((state) => state.showPurposeWizard);
  const setShowPurposeWizard = useThemeExtractionStore((state) => state.setShowPurposeWizard);
  const extractionPurpose = useThemeExtractionStore((state) => state.extractionPurpose);
  const setExtractionPurpose = useThemeExtractionStore((state) => state.setExtractionPurpose);
  const userExpertiseLevel = useThemeExtractionStore((state) => state.userExpertiseLevel);
  const showThematizationConfig = useThemeExtractionStore((state) => state.showThematizationConfig);
  const setShowThematizationConfig = useThemeExtractionStore((state) => state.setShowThematizationConfig);
  const isNavigatingToThemes = useThemeExtractionStore((state) => state.isNavigatingToThemes);
  const setIsNavigatingToThemes = useThemeExtractionStore((state) => state.setIsNavigatingToThemes);

  // Phase 10.180: Extraction workflow hook
  const { executeWorkflow, isExecuting } = useExtractionWorkflow();

  // Phase 10.180: User subscription and credits data
  const { subscriptionTier, remainingCredits } = useUserUsage();

  // Phase 10.180: Pending purpose for config modal flow
  const [pendingPurpose, setPendingPurpose] = useState<ResearchPurpose | null>(null);

  // ==========================================================================
  // Hydration-safe counts - Use initial values until mounted
  // Prevents hydration mismatch from Zustand persist middleware
  // ==========================================================================
  const safePapersCount = mounted ? papers.length : 0;
  const safeSavedPapersCount = mounted ? savedPapers.length : 0;
  const safeUnifiedThemesCount = mounted ? unifiedThemes.length : 0;
  const safeGapsCount = mounted ? gaps.length : 0;

  // ==========================================================================
  // Phase 10.180: Computed values for extraction modals
  // ==========================================================================

  // Selected papers list for extraction
  const selectedPapersList = useMemo(() => {
    if (!Array.isArray(papers) || papers.length === 0) return [];
    if (!selectedPapers || !(selectedPapers instanceof Set) || selectedPapers.size === 0) return [];
    return papers.filter((p) => p && p.id && selectedPapers.has(p.id));
  }, [papers, selectedPapers]);

  // Netflix-Grade: Auto full-text detection for accurate counts
  // Automatically detects full-text when papers are selected so Content Analysis shows accurate stats
  // Triggers automatically when 10+ papers are selected (no user action needed)
  const { isDetecting: isDetectingFullText, detectedCount, totalDetecting } = useAutoFullTextDetection({
    papers: selectedPapersList,
    enabled: selectedPapersList.length >= 10, // Only detect if 10+ papers selected
    minPapers: 10,
    onDetectionComplete: (count) => {
      logger.info(`Auto full-text detection complete: ${count} papers have full-text available`, 'LiteratureSearchPage');
      // Content analysis will automatically update via useMemo dependency on selectedPapersList
      if (count > 0) {
        toast.success(`Full-text detected for ${count} papers`, { duration: 3000 });
      }
    },
  });

  // Content analysis for purpose wizard (re-runs when papers update after detection)
  const contentAnalysis = useMemo(() => {
    return analyzeContentForExtraction(selectedPapersList);
  }, [selectedPapersList]);

  // ==========================================================================
  // Phase 10.180: Handlers for extraction modals
  // ==========================================================================

  const handlePurposeSelected = useCallback(async (purpose: ResearchPurpose): Promise<void> => {
    if (!purpose) return;

    logger.info('Purpose selected on literature page', 'LiteratureSearchPage', {
      purpose,
      selectedPapers: selectedPapersList.length,
    });

    if (selectedPapersList.length === 0) {
      toast.error('Please select papers to extract themes from.');
      return;
    }

    // Store purpose and show config modal
    setExtractionPurpose(purpose);
    setPendingPurpose(purpose);
    setShowPurposeWizard(false);
    setShowThematizationConfig(true);
  }, [selectedPapersList, setExtractionPurpose, setShowPurposeWizard, setShowThematizationConfig]);

  const handlePurposeCancel = useCallback(() => {
    setShowPurposeWizard(false);
  }, [setShowPurposeWizard]);

  const handleConfigConfirm = useCallback(async (config: ThematizationConfig): Promise<void> => {
    if (!pendingPurpose) {
      toast.error('Invalid configuration. Please try again.');
      return;
    }

    if (config.tier > selectedPapersList.length) {
      toast.error(
        `Selected tier (${config.tier} papers) exceeds available papers (${selectedPapersList.length}). Please select a lower tier.`
      );
      return;
    }

    logger.info('Config confirmed on literature page', 'LiteratureSearchPage', {
      tier: config.tier,
      flags: config.flags,
      purpose: pendingPurpose,
    });

    setShowThematizationConfig(false);

    try {
      // Navigate to themes page
      logger.info('Navigating to themes page...', 'LiteratureSearchPage');
      setIsNavigatingToThemes(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/discover/themes');
      setIsNavigatingToThemes(false);

      // Start extraction
      await executeWorkflow({
        papers: selectedPapersList,
        purpose: pendingPurpose,
        mode: 'guided',
        userExpertiseLevel: validateExpertiseLevel(userExpertiseLevel),
        tier: config.tier,
        flags: config.flags,
      });

      setPendingPurpose(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Workflow execution failed', 'LiteratureSearchPage', { error: message });
      toast.error('Failed to start theme extraction. Please try again.');
      setShowThematizationConfig(true);
    }
  }, [pendingPurpose, selectedPapersList, userExpertiseLevel, setShowThematizationConfig, setIsNavigatingToThemes, executeWorkflow, router]);

  const handleConfigCancel = useCallback((): void => {
    setShowThematizationConfig(false);
    setPendingPurpose(null);
  }, [setShowThematizationConfig]);

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4 space-y-6">
      {/* ================================================================== */}
      {/* Unified Header - Title, Stats, and Navigation in One Clean Row */}
      {/* ================================================================== */}
      <header className="space-y-4">
        {/* Main row: Title + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Title and subtitle with inline stats */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate">Literature Discovery</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Search and analyze academic literature</span>
              <span className="hidden sm:inline text-border">·</span>
              <span
                role="status"
                aria-label="Research statistics"
                className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
              >
                <span className="font-medium">{safePapersCount} papers</span>
                <span className="text-border">·</span>
                <span className="font-medium">{safeSavedPapersCount} saved</span>
              </span>
            </p>
          </div>

          {/* Right: Analysis Tools as clean inline buttons */}
          <nav aria-label="Analysis tools" className="flex flex-wrap items-center gap-2">
            {/* Themes - dedicated page */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="transition-all hover:bg-primary/5 hover:border-primary/30"
            >
              <Link href="/discover/themes" aria-label={`Research themes: ${safeUnifiedThemesCount} extracted`}>
                <Lightbulb className="w-4 h-4 mr-1.5 text-amber-500" aria-hidden="true" />
                <span>Themes</span>
                {safeUnifiedThemesCount > 0 && (
                  <Badge variant="default" className="ml-1.5 px-1.5 py-0 text-xs h-5">
                    {safeUnifiedThemesCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Gaps - external page */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="transition-all hover:bg-primary/5 hover:border-primary/30"
            >
              <Link href="/discover/gaps" aria-label={`Research gaps: ${safeGapsCount} identified`}>
                <Search className="w-4 h-4 mr-1.5 text-blue-500" aria-hidden="true" />
                <span>Gaps</span>
                {safeGapsCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs h-5">
                    {safeGapsCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Knowledge Map - external page */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="transition-all hover:bg-primary/5 hover:border-primary/30"
            >
              <Link href="/discover/knowledge-map" aria-label="View knowledge map">
                <Network className="w-4 h-4 mr-1.5 text-purple-500" aria-hidden="true" />
                <span>Map</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ================================================================== */}
      {/* Search Workflow Section */}
      {/* Sequential: Search → Results → Library */}
      {/* ================================================================== */}
      <section aria-labelledby="search-section-title">
        <h2 id="search-section-title" className="sr-only">
          Literature Search
        </h2>
        <LiteratureSearchContainer />
      </section>

      {/* Search Results */}
      <section aria-labelledby="results-section-title">
        <h2 id="results-section-title" className="sr-only">
          Search Results
        </h2>
        <SearchResultsContainerEnhanced />
      </section>

      {/* Phase 10.144: AcademicResourcesPanel removed for Apple-grade simplicity */}
      {/* Source selection is now automatic. ORCID unlock indicator in search bar. */}

      {/* Theme Extraction Action Card */}
      <ThemeExtractionActionCard />

      {/* Paper Management (Library) */}
      <section aria-labelledby="library-section-title">
        <h2 id="library-section-title" className="sr-only">
          Paper Library
        </h2>
        <PaperManagementContainer />
      </section>

      {/* ================================================================== */}
      {/* Phase 10.180: Theme Extraction Modals */}
      {/* ================================================================== */}
      {showPurposeWizard && contentAnalysis && (
        <PurposeSelectionWizard
          onPurposeSelected={handlePurposeSelected}
          onCancel={handlePurposeCancel}
          contentAnalysis={contentAnalysis}
          isDetectingFullText={isDetectingFullText}
          detectedCount={detectedCount}
          totalDetecting={totalDetecting}
          {...(extractionPurpose ? { initialPurpose: extractionPurpose } : {})}
        />
      )}

      {/* Phase 10.180: Use totalWithContentAvailable, not raw selection count
          This ensures tier selection is based on papers that CAN be used:
          - Papers with content ready (abstracts/fullText)
          - Papers with fullText available (will be fetched) */}
      <ThematizationConfigModal
        isOpen={showThematizationConfig}
        onClose={handleConfigCancel}
        availablePapers={contentAnalysis?.totalWithContentAvailable ?? selectedPapersList.length}
        subscriptionTier={subscriptionTier}
        remainingCredits={remainingCredits}
        onConfirm={handleConfigConfirm}
        isLoading={isExecuting}
      />

      <NavigatingToThemesModal isOpen={isNavigatingToThemes} />
    </div>
  );
}
