/**
 * PaperMetadata Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 *
 * Displays paper metadata: year, venue, citations, word count
 * ✅ FIXED: Magic numbers replaced with constants
 * ✅ FIXED: Improved tooltip accessibility
 *
 * @module PaperMetadata
 */

'use client';

import React from 'react';
import { Calendar, BookOpen, GitBranch, MessageSquare } from 'lucide-react';
// PHASE 10.942: Removed unused imports (cn, MIN_WORD_COUNT_THRESHOLD) after eligibility removal

// ============================================================================
// Types
// ============================================================================

interface PaperMetadataProps {
  /** Publication year */
  year?: number | undefined;
  /** Publication venue (journal/conference) */
  venue?: string | undefined;
  /** Number of citations */
  citationCount?: number | null | undefined;
  /** Word count (title + abstract) */
  wordCount?: number | null | undefined;
  /** Abstract-only word count */
  abstractWordCount?: number | null | undefined;
  /** PHASE 10.942: Kept for backward compatibility but no longer used for visual styling */
  isEligible?: boolean | undefined;
}

// ============================================================================
// Component
// ============================================================================

export function PaperMetadata({
  year,
  venue,
  citationCount,
  wordCount,
  abstractWordCount,
  // PHASE 10.942: isEligible kept for backward compatibility but no longer used
  isEligible: _isEligible = true,
}: PaperMetadataProps) {
  /**
   * Generate accessible word count tooltip text
   * Split into semantic parts for better screen reader support
   * PHASE 10.942: Simplified - all listed papers are eligible (passed quality scoring)
   */
  const getWordCountTooltip = (): string => {
    const parts = [
      `Word count: Title + Abstract (${wordCount?.toLocaleString() || 0} words)`,
      `Excludes: references, bibliography, indexes, glossaries, appendices, acknowledgments.`,
      `Abstract only: ${abstractWordCount?.toLocaleString() || 'N/A'} words`,
    ];

    // PHASE 10.942: All listed papers are eligible since they passed quality scoring
    // No need to show eligibility warnings - eligibility is now purely informational
    return parts.join(' | ');
  };

  return (
    <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
      {/* Year */}
      {year && (
        <span className="flex items-center gap-1" aria-label={`Published ${year}`}>
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {year}
        </span>
      )}

      {/* Venue */}
      {venue && (
        <span className="flex items-center gap-1" aria-label={`Published in ${venue}`}>
          <BookOpen className="w-3 h-3" aria-hidden="true" />
          {venue}
        </span>
      )}

      {/* Citations */}
      <span
        className="flex items-center gap-1"
        aria-label={`${citationCount ?? 0} citations`}
      >
        <GitBranch className="w-3 h-3" aria-hidden="true" />
        {citationCount === null || citationCount === undefined
          ? 'No citation info'
          : `${citationCount} citation${citationCount === 1 ? '' : 's'}`}
      </span>

      {/* Word Count Badge */}
      {/* PHASE 10.942: Removed eligibility color coding - all papers are eligible */}
      {wordCount !== null && wordCount !== undefined && (
        <span
          className="flex items-center gap-1 font-medium text-gray-600"
          title={getWordCountTooltip()}
          aria-label={`${wordCount.toLocaleString()} words from title and abstract`}
        >
          <MessageSquare className="w-3 h-3" aria-hidden="true" />
          {wordCount.toLocaleString()} words
          <span className="text-xs opacity-75">(Title+Abstract)</span>
        </span>
      )}
    </div>
  );
}
