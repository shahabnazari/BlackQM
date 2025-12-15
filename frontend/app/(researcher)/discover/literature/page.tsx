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

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lightbulb, Search, Network } from 'lucide-react';

// Self-contained containers
import { LiteratureSearchContainer } from './containers/LiteratureSearchContainer';
import { SearchResultsContainerEnhanced } from './containers/SearchResultsContainerEnhanced';
// Phase 10.144: AcademicResourcesPanel removed - too complex for search flow
// ORCID integration will be added to search bar instead
import { ThemeExtractionActionCard } from './components/ThemeExtractionActionCard';
import { PaperManagementContainer } from './containers/PaperManagementContainer';

// Stores for stats display only
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { usePaperManagementStore } from '@/lib/stores/paper-management.store';
import { useGapAnalysisStore } from '@/lib/stores/gap-analysis.store';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

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
  // Store State - Display counts only (read-only)
  // ==========================================================================
  const papers = useLiteratureSearchStore((state) => state.papers);
  const savedPapers = usePaperManagementStore((state) => state.savedPapers);
  const unifiedThemes = useThemeExtractionStore((state) => state.unifiedThemes);
  const gaps = useGapAnalysisStore((state) => state.gaps);

  // ==========================================================================
  // Hydration-safe counts - Use initial values until mounted
  // Prevents hydration mismatch from Zustand persist middleware
  // ==========================================================================
  const safePapersCount = mounted ? papers.length : 0;
  const safeSavedPapersCount = mounted ? savedPapers.length : 0;
  const safeUnifiedThemesCount = mounted ? unifiedThemes.length : 0;
  const safeGapsCount = mounted ? gaps.length : 0;

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
    </div>
  );
}
