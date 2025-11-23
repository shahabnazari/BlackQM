/**
 * Themes Analysis Page - Phase 10.96
 *
 * Dedicated page for theme extraction and analysis.
 * Provides full-featured theme management with research output generation.
 *
 * @module discover/themes
 * @since Phase 10.96
 *
 * **Features:**
 * - Theme extraction from saved papers
 * - AI-powered theme analysis
 * - Research output generation (Q-statements, surveys, hypotheses)
 * - Theme filtering and organization
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowLeft } from 'lucide-react';

// Container with all theme extraction logic
import { ThemeExtractionContainer } from '../literature/containers/ThemeExtractionContainer';

// Stores for stats
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// ============================================================================
// Component
// ============================================================================

export default function ThemesPage(): JSX.Element {
  // ==========================================================================
  // Hydration Fix - Prevent mismatch with persisted stores
  // ==========================================================================
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================================================
  // Store State
  // ==========================================================================
  const unifiedThemes = useThemeExtractionStore((state) => state.unifiedThemes);

  // Hydration-safe count - Use 0 until mounted to prevent SSR mismatch
  const themesCount = mounted ? unifiedThemes.length : 0;

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4 space-y-6">
      {/* ================================================================== */}
      {/* Header */}
      {/* ================================================================== */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/discover/literature" aria-label="Back to literature discovery">
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 shrink-0" aria-hidden="true" />
                <span>Research Themes</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Extract and analyze themes from your literature
                {themesCount > 0 && (
                  <span className="ml-2 font-medium">
                    · {themesCount} theme{themesCount !== 1 ? 's' : ''} extracted
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* Theme Extraction Container */}
      {/* ================================================================== */}
      <main>
        <ThemeExtractionContainer />
      </main>
    </div>
  );
}
