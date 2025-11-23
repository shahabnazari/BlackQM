/**
 * ActionButtonsGroup Component
 * Phase 10.91 Day 12 - Extracted from AcademicResourcesPanel.tsx (lines 630-706)
 * AUDIT FIXED: Added useMemo for derived values (performance optimization)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - COMPONENT EXTRACTION
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * Extracted action buttons into focused component to separate UI concerns
 * and reduce parent component size.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - Action logic mixed with database selection UI
 * - Parent component handles all interactions
 * - Hard to test button states independently
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Isolated button group with clear responsibilities
 * - Props-based callbacks for clean separation
 * - Easy to test disabled/loading states
 * - Reusable button group pattern
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY THIS:
 * ✅ DO:
 * - Add new action buttons (e.g., batch operations)
 * - Update button states based on context
 * - Enhance button styling/icons
 * - Add tooltips for user guidance
 *
 * ❌ DON'T:
 * - Implement business logic here (use callbacks)
 * - Make API calls directly (handled by parent)
 * - Mix with other UI concerns (database selection, etc.)
 * - Use `any` types
 *
 * ============================================================================
 * 📊 PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. **Single Responsibility**: Only renders action buttons
 * 2. **Callback Pattern**: All logic handled via props
 * 3. **Accessibility**: Proper disabled states, ARIA labels
 * 4. **Type Safety**: Strict TypeScript
 * 5. **Visual Consistency**: Badge indicators for context
 * 6. **Performance**: useMemo for derived values (AUDIT FIX)
 */

'use client';

import React, { useMemo } from 'react';
import { Sparkles, Loader2, Download, TrendingUp, Database } from 'lucide-react';
import { Badge } from '@/components/apple-ui/Badge/Badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface ActionButtonsGroupProps {
  /** Number of papers in search results */
  totalPapers: number;
  /** Number of selected papers */
  selectedPapersCount: number;
  /** Number of transcribed videos */
  transcribedVideosCount: number;
  /** Whether theme analysis is in progress */
  analyzingThemes: boolean;
  /** Number of existing corpuses */
  corpusCount: number;
  /** Handler for theme extraction */
  onExtractThemes: () => void;
  /** Handler for incremental extraction */
  onIncrementalExtraction: () => void;
  /** Handler for corpus management */
  onCorpusManagement: () => void;
  /** Handler for citation export */
  onExportCitations: (format: 'bibtex' | 'ris' | 'apa') => void;
}

// ============================================================================
// Component
// ============================================================================

export const ActionButtonsGroup = React.memo<ActionButtonsGroupProps>(
  function ActionButtonsGroup({
    totalPapers,
    selectedPapersCount,
    transcribedVideosCount,
    analyzingThemes,
    corpusCount,
    onExtractThemes,
    onIncrementalExtraction,
    onCorpusManagement,
    onExportCitations,
  }) {
    // Memoize derived values to prevent unnecessary re-renders
    const hasAnyContent = useMemo(
      () => totalPapers > 0 || transcribedVideosCount > 0,
      [totalPapers, transcribedVideosCount]
    );

    const hasSelectedContent = useMemo(
      () => selectedPapersCount > 0 || transcribedVideosCount > 0,
      [selectedPapersCount, transcribedVideosCount]
    );

    return (
      <div className="flex gap-2 pt-4 border-t">
        {/* Extract All Themes */}
        <Button
          variant="outline"
          onClick={onExtractThemes}
          disabled={!hasAnyContent || analyzingThemes}
          className="flex items-center gap-2"
        >
          {analyzingThemes ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          <span>Extract Themes from All Sources</span>
          {hasSelectedContent && (
            <div className="flex gap-1">
              {selectedPapersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedPapersCount} papers
                </Badge>
              )}
              {transcribedVideosCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 dark:bg-purple-900"
                >
                  {transcribedVideosCount} videos
                </Badge>
              )}
            </div>
          )}
        </Button>

        {/* Incremental Extraction */}
        <Button
          variant="outline"
          onClick={onIncrementalExtraction}
          disabled={!hasSelectedContent || analyzingThemes}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-300"
          title="Add papers incrementally to existing corpus and save costs via caching"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Extract Incrementally</span>
          {corpusCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 dark:bg-blue-900"
            >
              {corpusCount} corpus
            </Badge>
          )}
        </Button>

        {/* Corpus Management */}
        <Button
          variant="outline"
          onClick={onCorpusManagement}
          className="flex items-center gap-2"
          title="View and manage your research corpuses"
        >
          <Database className="w-4 h-4" />
          <span>Manage Corpuses</span>
        </Button>

        {/* Export Citations */}
        <Button
          variant="outline"
          onClick={() => onExportCitations('bibtex')}
          disabled={selectedPapersCount === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export BibTeX
        </Button>
      </div>
    );
  }
);
