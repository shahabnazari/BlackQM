/**
 * PaperCard Component
 * Extracted from literature page (Phase 10.1 Day 3 - Enterprise Refactoring)
 * Displays individual paper with rich metadata, quality indicators, and actions
 *
 * Features:
 * - Selection and extraction status badges
 * - Quality score and citation metrics
 * - Full-text availability indicators
 * - Paper actions (view, save, full-text access)
 * - Smooth animations and transitions
 *
 * @module PaperCard
 */

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  BookOpen,
  GitBranch,
  MessageSquare,
  TrendingUp,
  Award,
  ExternalLink,
  Star,
  Check,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Paper } from '@/lib/types/literature.types';

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

export const PaperCard = memo(function PaperCard({
  paper,
  isSelected,
  isSaved,
  isExtracting,
  isExtracted,
  onToggleSelection,
  onToggleSave,
  getSourceIcon,
}: PaperCardProps) {
  const SourceIcon = getSourceIcon(
    paper.source?.toLowerCase().replace(/ /g, '_') || ''
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      transition={{ layout: { duration: 0.2 } }}
      className={cn(
        'border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative',
        isSelected && 'border-blue-500 bg-blue-50/50',
        isExtracted && 'border-green-200 bg-green-50/30',
        isExtracting && 'border-amber-300 bg-amber-50/30'
      )}
      onClick={() => onToggleSelection(paper.id)}
    >
      {/* Real-time Extracting Status Badge */}
      {isExtracting && !isExtracted && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <Badge
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white animate-pulse"
            aria-label="Extracting themes"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs font-semibold">Extracting...</span>
          </Badge>
        </motion.div>
      )}

      {/* Extracted Status Badge */}
      {isExtracted && !isExtracting && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <Badge
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white"
            aria-label="Themes extracted"
          >
            <Check className="w-3 h-3" />
            <span className="text-xs font-semibold">Extracted</span>
          </Badge>
        </motion.div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            {/* Selection Checkbox */}
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center mt-1 transition-all',
                isSelected
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300',
                isExtracted && !isSelected && 'border-green-500',
                isExtracting && !isSelected && 'border-amber-500 bg-amber-50'
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
              {!isSelected && isExtracting && (
                <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
              )}
              {!isSelected && !isExtracting && isExtracted && (
                <Check className="w-3 h-3 text-green-500" />
              )}
            </div>

            <div className="flex-1">
              {/* Title and Source */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-tight flex-1">
                  {paper.title}
                </h3>
                {paper.source && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 shrink-0 px-2 py-1"
                  >
                    <SourceIcon className="w-3 h-3" />
                    <span className="text-xs">{paper.source}</span>
                  </Badge>
                )}
              </div>

              {/* Authors */}
              <p className="text-sm text-gray-600 mt-1">
                {paper.authors?.slice(0, 3).join(', ')}
                {paper.authors && paper.authors.length > 3 &&
                  ` +${paper.authors.length - 3} more`}
              </p>

              {/* Metadata Badges */}
              <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                {/* Year */}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {paper.year}
                </span>

                {/* Venue */}
                {paper.venue && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {paper.venue}
                  </span>
                )}

                {/* Citations */}
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {paper.citationCount === null || paper.citationCount === undefined
                    ? 'No citation info'
                    : `${paper.citationCount} citation${paper.citationCount === 1 ? '' : 's'}`}
                </span>

                {/* Word Count Badge */}
                {paper.wordCount !== null && paper.wordCount !== undefined && (
                  <span
                    className={cn(
                      'flex items-center gap-1 font-medium',
                      paper.isEligible ? 'text-green-600' : 'text-amber-600'
                    )}
                    title={
                      `Word count: Title + Abstract (${paper.wordCount.toLocaleString()} words)\n\n` +
                      `Excludes: references, bibliography, indexes, glossaries, appendices, acknowledgments.\n\n` +
                      `Abstract only: ${paper.abstractWordCount?.toLocaleString() || 'N/A'} words\n\n` +
                      (paper.isEligible
                        ? '✓ Meets minimum 1,000 word threshold for theme extraction'
                        : '⚠ Below 1,000 word threshold - may lack sufficient content for theme extraction')
                    }
                  >
                    <MessageSquare className="w-3 h-3" />
                    {paper.wordCount.toLocaleString()} words
                    <span className="text-xs opacity-75">(Title+Abstract)</span>
                    {!paper.isEligible && (
                      <span className="text-xs ml-1 bg-amber-100 px-1 rounded">
                        short
                      </span>
                    )}
                  </span>
                )}

                {/* Full-Text Status Badge */}
                {(() => {
                  const hasFullText = paper.fullTextStatus === 'success';
                  const isFetching = paper.fullTextStatus === 'fetching';
                  const hasFailed = paper.fullTextStatus === 'failed';
                  const abstractLength = paper.abstract?.length || 0;
                  const isAbstractOverflow = abstractLength > 2000;

                  if (!hasFullText && !isFetching && !hasFailed && !isAbstractOverflow)
                    return null;

                  return (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
                        hasFullText
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : isAbstractOverflow
                            ? 'text-purple-700 bg-purple-50 border border-purple-200'
                            : isFetching
                              ? 'text-blue-700 bg-blue-50 border border-blue-200 animate-pulse'
                              : 'text-gray-600 bg-gray-50 border border-gray-200'
                      )}
                      title={
                        hasFullText
                          ? `✅ Full-text available (${paper.fullTextWordCount?.toLocaleString() || 'N/A'} words). Provides 40-50x more content for deeper theme extraction.`
                          : isAbstractOverflow
                            ? `📄 Full article detected in abstract field (${abstractLength.toLocaleString()} chars). System will treat as full-text for validation.`
                            : isFetching
                              ? 'Fetching full-text PDF from open-access sources (Unpaywall API)...'
                              : `📝 Abstract-only (${abstractLength} chars). System will automatically adjust validation thresholds for abstract-length content.`
                      }
                    >
                      {hasFullText ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Full-text ({paper.fullTextWordCount?.toLocaleString() || '?'} words)
                        </>
                      ) : isAbstractOverflow ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Full article ({Math.round(abstractLength / 1000)}k chars)
                        </>
                      ) : isFetching ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Fetching full-text...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Abstract ({Math.round(abstractLength)} chars)
                        </>
                      )}
                    </span>
                  );
                })()}

                {/* Citations per Year */}
                {paper.citationsPerYear !== null &&
                  paper.citationsPerYear !== undefined &&
                  paper.citationsPerYear > 0 && (
                    <span
                      className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
                      title="Citation velocity (citations per year) - measures ongoing research impact. Higher values indicate influential work that continues to be cited."
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-semibold">
                        {paper.citationsPerYear.toFixed(1)}
                      </span>
                      <span className="text-xs opacity-75">cites/yr</span>
                    </span>
                  )}

                {/* Quality Score Badge */}
                {paper.qualityScore !== null && paper.qualityScore !== undefined && (
                  <span
                    className={cn(
                      'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md',
                      paper.qualityScore >= 70
                        ? 'text-green-700 bg-green-50 border border-green-200'
                        : paper.qualityScore >= 50
                          ? 'text-blue-700 bg-blue-50 border border-blue-200'
                          : paper.qualityScore >= 30
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-gray-700 bg-gray-50 border border-gray-200'
                    )}
                    title="Enterprise quality score based on citation impact (30%), journal prestige (25%), content depth (15%), recency (15%), and venue quality (15%)"
                  >
                    <Award className="w-3 h-3" />
                    <span className="font-semibold">
                      {paper.qualityScore.toFixed(0)}
                    </span>
                    <span className="text-xs opacity-75">
                      {paper.qualityScore >= 80
                        ? 'Exceptional'
                        : paper.qualityScore >= 70
                          ? 'Excellent'
                          : paper.qualityScore >= 60
                            ? 'V.Good'
                            : paper.qualityScore >= 50
                              ? 'Good'
                              : paper.qualityScore >= 40
                                ? 'Acceptable'
                                : paper.qualityScore >= 30
                                  ? 'Fair'
                                  : 'Limited'}
                    </span>
                  </span>
                )}
              </div>

              {/* Abstract */}
              {paper.abstract && (
                <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                  {paper.abstract}
                </p>
              )}

              {/* Keywords */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {paper.keywords.slice(0, 5).map(keyword => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                {/* View Paper Button */}
                {(paper.doi || paper.url) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = paper.doi
                        ? `https://doi.org/${paper.doi}`
                        : paper.url;
                      if (link) {
                        window.open(link, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Paper
                  </Button>
                )}

                {/* Full-Text Access for High-Quality Papers */}
                {paper.doi && (paper.qualityScore ?? 0) >= 70 && (
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      window.open(
                        `https://api.unpaywall.org/v2/${paper.doi}?email=research@blackqmethod.com`,
                        '_blank'
                      );
                    }}
                    title="High-quality paper (≥70) - Full-text may be available via open access. Scientific justification: Purposive sampling (Patton 2002) - deep analysis of best papers."
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Full Text
                  </Button>
                )}

                {/* Save Button */}
                <Button
                  size="sm"
                  variant={isSaved ? 'secondary' : 'outline'}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleSave(paper);
                  }}
                >
                  <Star className={cn('w-3 h-3 mr-1', isSaved && 'fill-current')} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
