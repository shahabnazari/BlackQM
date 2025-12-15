/**
 * PaperCard Component (Refactored)
 * Phase 10.123 - Netflix-Grade PaperCard Redesign
 * Phase 10.145 - Apple-Grade Simplicity (removed redundant badges)
 *
 * **Refactored:** Reduced from 961 lines to < 400 lines using composition
 * **Pattern:** Component composition with focused sub-components
 *
 * PHASE 10.123 INTEGRATION:
 * ✅ Phase 1: Core sub-components (PaperHeader, PaperMetadata, etc.)
 * ✅ Phase 2: MatchScoreBadge with touch/keyboard/hover support
 * ✅ Phase 3: CollapsibleMetadata with progressive disclosure
 * ✅ Phase 4: Memoized PaperCard with custom comparison
 * ✅ Phase 5: Analytics integration (tooltip + metadata tracking)
 *
 * PHASE 10.145 SIMPLIFICATION:
 * ✅ Removed PaperStatusBadges (checkbox shows extraction state)
 * ✅ Removed BM25 from PaperQualityBadges (MatchScoreBadge shows combined ranking)
 *
 * Displays individual paper with rich metadata, quality indicators, and actions
 *
 * @module PaperCard
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Paper } from '@/lib/types/literature.types';
import {
  PaperHeader,
  PaperMetadata,
  PaperAccessBadges,
  PaperQualityBadges,
  // Phase 10.145: PaperStatusBadges REMOVED - checkbox already shows extraction state
  PaperActions,
  CollapsibleMetadata,
  PaperCardErrorBoundary,
  MatchScoreBadge,
  // Phase 10.123 Phase 5: Analytics integration
  trackTooltipOpened,
  trackTooltipClosed,
  trackMetadataExpanded,
  trackMetadataCollapsed,
} from './paper-card';

// ============================================================================
// Component Props
// ============================================================================

export interface PaperCardProps {
  /** Paper data to display */
  paper: Paper;
  /** Whether the paper is currently selected */
  isSelected: boolean;
  /** Whether the paper is saved to the user's library */
  isSaved: boolean;
  /** Whether themes are currently being extracted from this paper */
  isExtracting: boolean;
  /** Whether themes have been extracted from this paper */
  isExtracted: boolean;
  /** Handler for toggling paper selection */
  onToggleSelection: (paperId: string) => void;
  /** Handler for saving/unsaving the paper */
  onToggleSave: (paper: Paper) => void;
  /** Function to get academic source icon */
  getSourceIcon: (source: string) => React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Component
// ============================================================================

function PaperCardComponent({
  paper,
  isSelected,
  isSaved,
  isExtracting,
  isExtracted,
  onToggleSelection,
  onToggleSave,
  getSourceIcon,
}: PaperCardProps) {
  // Memoize SourceIcon to prevent unnecessary recalculation on every render
  const SourceIcon = useMemo(
    () => getSourceIcon(paper.source?.toLowerCase().replace(/ /g, '_') || ''),
    [paper.source, getSourceIcon]
  );

  // Memoize selection handler for PaperHeader
  const handleToggleSelection = useCallback(() => {
    onToggleSelection(paper.id);
  }, [paper.id, onToggleSelection]);

  // Keyboard handler for card itself
  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Only trigger selection if target is the card itself (not a child button/input)
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        e.target === e.currentTarget
      ) {
        e.preventDefault();
        onToggleSelection(paper.id);
      }
    },
    [paper.id, onToggleSelection]
  );

  // ============================================================================
  // Phase 10.123 Phase 5: Analytics Callbacks
  // ============================================================================

  /** Track when MatchScoreBadge tooltip is opened */
  const handleTooltipOpen = useCallback(() => {
    trackTooltipOpened(
      paper.id,
      paper.neuralRelevanceScore ?? null,
      paper.qualityTier ?? null,
      paper.neuralRank ?? null
    );
  }, [paper.id, paper.neuralRelevanceScore, paper.qualityTier, paper.neuralRank]);

  /** Track when MatchScoreBadge tooltip is closed */
  const handleTooltipClose = useCallback(() => {
    trackTooltipClosed(paper.id);
  }, [paper.id]);

  /** Track when CollapsibleMetadata is expanded */
  const handleMetadataExpand = useCallback(() => {
    trackMetadataExpanded(
      paper.id,
      paper.meshTerms?.length ?? 0,
      paper.grants?.length ?? 0,
      paper.authorAffiliations?.length ?? 0,
      paper.publicationType?.length ?? 0
    );
  }, [paper.id, paper.meshTerms?.length, paper.grants?.length, paper.authorAffiliations?.length, paper.publicationType?.length]);

  /** Track when CollapsibleMetadata is collapsed */
  const handleMetadataCollapse = useCallback(() => {
    trackMetadataCollapsed(paper.id);
  }, [paper.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      transition={{ layout: { duration: 0.2 } }}
      className={cn(
        'border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative',
        'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        isSelected && 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/50',
        isExtracted && 'border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-950/30',
        isExtracting && 'border-amber-300 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/30'
      )}
      onClick={handleToggleSelection}
      role="article"
      aria-label={`Paper: ${paper.title}`}
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
    >
      {/* Phase 10.145: PaperStatusBadges REMOVED for Apple simplicity
        * Extraction status now shown only via checkbox indicators:
        * - Spinner when extracting
        * - Checkmark when extracted
        * - Colored borders for visual feedback
        */}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Paper Header (title, authors, source, checkbox) */}
          <PaperHeader
            title={paper.title}
            authors={paper.authors}
            source={paper.source}
            isSelected={isSelected}
            isExtracting={isExtracting}
            isExtracted={isExtracted}
            SourceIcon={SourceIcon}
            onToggleSelection={handleToggleSelection}
          />

          {/* Paper Metadata (year, venue, citations, word count) */}
          <PaperMetadata
            year={paper.year}
            venue={paper.venue}
            citationCount={paper.citationCount}
            wordCount={paper.wordCount}
            abstractWordCount={paper.abstractWordCount}
            isEligible={paper.isEligible}
          />

          {/* Phase 10.145: Abstract Preview - Apple-grade simplicity */}
          {paper.abstract && (
            <p
              className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2"
              title={paper.abstract}
              aria-label="Paper abstract preview"
            >
              {paper.abstract}
            </p>
          )}

          {/* Access and Quality Badges */}
          <div className="flex gap-4 mt-2 flex-wrap items-center">
            {/* Phase 10.123 Phase 2: Netflix-Grade Match Score Badge */}
            <MatchScoreBadge
              neuralRelevanceScore={paper.neuralRelevanceScore}
              neuralRank={paper.neuralRank}
              neuralExplanation={paper.neuralExplanation}
              qualityScore={paper.qualityScore}
              overallScore={paper.overallScore}
              citationCount={paper.citationCount}
              citationsPerYear={paper.citationsPerYear}
              venue={paper.venue}
              onTooltipOpen={handleTooltipOpen}
              onTooltipClose={handleTooltipClose}
            />

            {/* Access Status Badges */}
            <PaperAccessBadges
              url={paper.url}
              doi={paper.doi}
              hasFullText={paper.hasFullText}
              fullTextStatus={paper.fullTextStatus}
              fullTextSource={paper.fullTextSource}
              pdfUrl={paper.pdfUrl}
              hasPdf={paper.hasPdf}
            />

            {/* Phase 10.154: Simplified - only citations/year shown here */}
            {/* Quality score moved to MatchScoreBadge composite breakdown */}
            <PaperQualityBadges
              citationsPerYear={paper.citationsPerYear}
              citationCount={paper.citationCount}
            />
          </div>

          {/* Phase 10.123 Phase 3: Collapsible Extended Metadata (Netflix-Grade) */}
          <CollapsibleMetadata
            paper={paper}
            onExpand={handleMetadataExpand}
            onCollapse={handleMetadataCollapse}
          />

          {/* Action Buttons */}
          <PaperActions
            paper={paper}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Phase 10.123: Memoized Export with Custom Comparison
// ============================================================================

/**
 * Memoized PaperCard with custom comparison for optimal performance
 * Only re-renders when relevant props change
 */
export const PaperCard = React.memo(PaperCardComponent, (prev, next) => {
  // Fast comparison for primitive props
  if (
    prev.isSelected !== next.isSelected ||
    prev.isSaved !== next.isSaved ||
    prev.isExtracting !== next.isExtracting ||
    prev.isExtracted !== next.isExtracted
  ) {
    return false; // Props changed, should re-render
  }

  // Paper ID changed = definitely re-render
  if (prev.paper.id !== next.paper.id) {
    return false;
  }

  // Check key paper properties that affect display
  // Phase 10.147: Include overallScore in comparison (critical for composite scoring)
  if (
    prev.paper.neuralRelevanceScore !== next.paper.neuralRelevanceScore ||
    prev.paper.neuralRank !== next.paper.neuralRank ||
    prev.paper.qualityScore !== next.paper.qualityScore ||
    prev.paper.overallScore !== next.paper.overallScore ||
    prev.paper.citationCount !== next.paper.citationCount
  ) {
    return false;
  }

  // All checks passed - props are equal, skip re-render
  return true;
});

PaperCard.displayName = 'PaperCard';

// ============================================================================
// Phase 10.123: Error Boundary Wrapped Export
// ============================================================================

/**
 * PaperCard wrapped with ErrorBoundary for cascade failure prevention
 * Use this in lists to prevent one broken card from crashing the entire list
 */
export function PaperCardWithErrorBoundary(props: PaperCardProps) {
  return (
    <PaperCardErrorBoundary
      paperId={props.paper.id}
      paperTitle={props.paper.title}
    >
      <PaperCard {...props} />
    </PaperCardErrorBoundary>
  );
}
