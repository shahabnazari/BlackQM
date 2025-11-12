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

import React, { memo, useState, useEffect } from 'react';
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
  Loader2,
  Unlock,
  Lock,
  FileCheck,
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
  getSourceIcon: (
    source: string
  ) => React.ComponentType<{ className?: string }>;
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

  // Phase 10.1 Day 12: Quality score breakdown state
  const [showQualityTooltip, setShowQualityTooltip] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Phase 10.1 Day 12: Debug logging for quality badge visibility
  useEffect(() => {
    if (paper.qualityScore !== null && paper.qualityScore !== undefined) {
      if (!paper.qualityScoreBreakdown) {
        console.warn(
          `[PaperCard] Paper "${paper.title.substring(0, 50)}..." has qualityScore (${paper.qualityScore}) but NO qualityScoreBreakdown`,
          paper
        );
      }
      if (!currentYear) {
        console.warn(
          `[PaperCard] Paper "${paper.title.substring(0, 50)}..." has qualityScore but currentYear not set yet`
        );
      }
    }
  }, [paper, currentYear]);

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
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300',
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
                {paper.authors &&
                  paper.authors.length > 3 &&
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
                  {paper.citationCount === null ||
                  paper.citationCount === undefined
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

                {/* Access Status Badges - Phase 10.6 Day 8.3.1: Smart paywall detection */}
                {(() => {
                  // Determine access status based on available data
                  const hasFullText = paper.hasFullText === true || paper.fullTextStatus === 'success';
                  const isFetching = paper.fullTextStatus === 'fetching';

                  // Smart paywall detection - 22 major paywalled publishers
                  const isPaywalledPublisher = paper.url && (
                    // Major paywalled publishers (12 original)
                    paper.url.includes('ieeexplore.ieee.org') ||
                    paper.url.includes('sciencedirect.com') ||
                    paper.url.includes('springer.com') ||
                    paper.url.includes('springerlink.com') ||
                    paper.url.includes('wiley.com') ||
                    paper.url.includes('onlinelibrary.wiley.com') ||
                    paper.url.includes('nature.com') ||
                    paper.url.includes('science.org') ||
                    paper.url.includes('acs.org') ||
                    paper.url.includes('tandfonline.com') ||
                    paper.url.includes('sagepub.com') ||
                    paper.url.includes('journals.lww.com') ||
                    // Additional paywalled publishers (10 new - Phase 10.6 Day 8.3.1)
                    paper.url.includes('webofknowledge.com') ||
                    paper.url.includes('webofscience.com') ||
                    paper.url.includes('scopus.com') ||
                    paper.url.includes('oxfordjournals.org') ||
                    paper.url.includes('academic.oup.com') ||
                    paper.url.includes('cambridge.org') ||
                    paper.url.includes('bmj.com') ||
                    paper.url.includes('jamanetwork.com') ||
                    paper.url.includes('nejm.org') ||
                    paper.url.includes('thelancet.com')
                  );

                  // Verified open access sources
                  const isKnownOpenSource = paper.url && (
                    // Preprint servers (always open access)
                    paper.url.includes('arxiv.org') ||
                    paper.url.includes('biorxiv.org') ||
                    paper.url.includes('medrxiv.org') ||
                    paper.url.includes('chemrxiv.org') ||
                    paper.url.includes('eric.ed.gov') ||
                    paper.url.includes('europepmc.org') ||
                    // Open access publishers
                    paper.url.includes('plos.org') ||
                    paper.url.includes('frontiersin.org') ||
                    paper.url.includes('mdpi.com') ||
                    paper.url.includes('biomedcentral.com')
                  );

                  // Verified open access: Unpaywall/PMC OR known open source (but NOT paywalled)
                  const isVerifiedOpenAccess = (
                    (paper.fullTextSource === 'unpaywall' || paper.fullTextSource === 'pmc' || isKnownOpenSource) &&
                    !isPaywalledPublisher
                  );

                  // Show subscription required if: paywalled OR (has DOI but no full text)
                  const hasRestrictedAccess = isPaywalledPublisher || (paper.doi && !hasFullText && !isFetching);

                  return (
                    <>
                      {/* Open Access Badge - Verified free access */}
                      {isVerifiedOpenAccess && (
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm"
                          title="This article is freely available to read without subscription (verified via Unpaywall or PubMed Central)"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span className="font-semibold">Open Access</span>
                        </span>
                      )}

                      {/* Full-Text Available Badge - Only for non-paywalled sources */}
                      {hasFullText && !isVerifiedOpenAccess && !isPaywalledPublisher && (
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-green-700 bg-green-50 border border-green-200 shadow-sm"
                          title="Full-text content available in our database for analysis and theme extraction"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span className="font-semibold">Full-Text Available</span>
                        </span>
                      )}

                      {/* Fetching Access Badge */}
                      {isFetching && (
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-blue-700 bg-blue-50 border border-blue-200 shadow-sm animate-pulse"
                          title="Checking open access availability and fetching full-text..."
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="font-semibold">Checking Access...</span>
                        </span>
                      )}

                      {/* Restricted Access Badge - Likely requires subscription */}
                      {hasRestrictedAccess && (
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-200 shadow-sm"
                          title="This article may require institutional access or subscription. Sign in with ORCID for institutional access, or click 'Full Text' to check availability."
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span className="font-semibold">Subscription Required</span>
                        </span>
                      )}
                    </>
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

                {/* Quality Score Badge - Phase 10.1 Day 12 Enhanced with Breakdown */}
                {paper.qualityScore !== null &&
                  paper.qualityScore !== undefined &&
                  paper.qualityScoreBreakdown &&
                  currentYear && (
                    <span className="relative inline-block">
                      <span
                        className={cn(
                          'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md cursor-help',
                          paper.qualityScore >= 70
                            ? 'text-green-700 bg-green-50 border border-green-200'
                            : paper.qualityScore >= 50
                              ? 'text-purple-700 bg-purple-50 border border-purple-200'
                              : paper.qualityScore >= 30
                                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                : 'text-gray-700 bg-gray-50 border border-gray-200'
                        )}
                        onMouseEnter={() => setShowQualityTooltip(true)}
                        onMouseLeave={() => setShowQualityTooltip(false)}
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
                        <svg
                          className="w-3 h-3 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>

                      {/* Detailed Breakdown Tooltip */}
                      {showQualityTooltip && (
                        <div
                          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
                          style={{ width: '420px' }}
                        >
                          <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4 border border-gray-700">
                            <div className="font-bold text-sm text-purple-300 mb-3">
                              📊 QUALITY SCORE BREAKDOWN
                            </div>

                            <div className="mb-3 pb-3 border-b border-gray-700">
                              <div className="text-lg font-bold text-white">
                                🎯 FINAL SCORE: {paper.qualityScore}/100
                              </div>
                            </div>

                            {/* Citation Impact */}
                            <div className="mb-3 pb-3 border-b border-gray-700">
                              <div className="font-semibold text-blue-300 mb-1">
                                📈 CITATION IMPACT (40% weight)
                              </div>
                              <div className="ml-3 space-y-1 text-gray-300">
                                <div>
                                  Component Score:{' '}
                                  <span className="text-white font-semibold">
                                    {paper.qualityScoreBreakdown.citationImpact.toFixed(
                                      1
                                    )}
                                    /100
                                  </span>
                                </div>
                                <div>
                                  Contribution:{' '}
                                  <span className="text-yellow-300 font-semibold">
                                    {(
                                      paper.qualityScoreBreakdown
                                        .citationImpact * 0.4
                                    ).toFixed(1)}{' '}
                                    points
                                  </span>
                                </div>
                                <div className="ml-2 text-gray-400 space-y-0.5">
                                  <div>
                                    ├─ Citations: {paper.citationCount || 0}
                                  </div>
                                  <div>
                                    ├─ Paper Age:{' '}
                                    {paper.year
                                      ? currentYear - paper.year
                                      : 'N/A'}{' '}
                                    years
                                  </div>
                                  <div>
                                    └─ Citations/Year:{' '}
                                    {paper.citationsPerYear?.toFixed(2) ||
                                      'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Journal Prestige */}
                            <div className="mb-3 pb-3 border-b border-gray-700">
                              <div className="font-semibold text-green-300 mb-1">
                                🏆 JOURNAL PRESTIGE (35% weight)
                              </div>
                              <div className="ml-3 space-y-1 text-gray-300">
                                <div>
                                  Component Score:{' '}
                                  <span className="text-white font-semibold">
                                    {paper.qualityScoreBreakdown.journalPrestige.toFixed(
                                      1
                                    )}
                                    /100
                                  </span>
                                </div>
                                <div>
                                  Contribution:{' '}
                                  <span className="text-yellow-300 font-semibold">
                                    {(
                                      paper.qualityScoreBreakdown
                                        .journalPrestige * 0.35
                                    ).toFixed(1)}{' '}
                                    points
                                  </span>
                                </div>
                                <div className="ml-2 text-gray-400 space-y-0.5">
                                  {/* Primary Metric: Impact Factor OR h-index */}
                                  {paper.impactFactor !== null &&
                                  paper.impactFactor !== undefined ? (
                                    <>
                                      <div className="text-green-200">
                                        ├─ ⭐ Impact Factor (PRIMARY):{' '}
                                        {paper.impactFactor.toFixed(2)}
                                      </div>
                                      {paper.hIndexJournal && (
                                        <div className="text-gray-500 text-xs ml-3">
                                          Note: h-index ({paper.hIndexJournal}
                                          ) available but IF used
                                        </div>
                                      )}
                                    </>
                                  ) : paper.hIndexJournal ? (
                                    <div className="text-amber-200">
                                      ├─ ⭐ Journal h-index (FALLBACK):{' '}
                                      {paper.hIndexJournal}
                                    </div>
                                  ) : (
                                    <div className="text-gray-500">
                                      ├─ No IF or h-index available
                                      <div className="text-xs ml-3 text-amber-300">
                                        {paper.qualityScoreBreakdown.journalPrestige === 0
                                          ? '⚠ No journal metrics = 0 points (baseline)'
                                          : ''}
                                      </div>
                                      <div className="text-xs ml-3 text-gray-500">
                                        {paper.qualityScoreBreakdown.journalPrestige === 0
                                          ? 'Score based on citations + content only'
                                          : ''}
                                      </div>
                                    </div>
                                  )}
                                  {/* Bonus Metrics */}
                                  <div>
                                    ├─ Quartile (BONUS):{' '}
                                    {paper.quartile || 'N/A'}
                                  </div>
                                  <div>
                                    └─ SJR Score (BONUS): N/A (planned)
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Content Depth */}
                            <div className="mb-3 pb-3 border-b border-gray-700">
                              <div className="font-semibold text-amber-300 mb-1">
                                📄 CONTENT DEPTH (25% weight)
                              </div>
                              <div className="ml-3 space-y-1 text-gray-300">
                                <div>
                                  Component Score:{' '}
                                  <span className="text-white font-semibold">
                                    {paper.qualityScoreBreakdown.contentDepth.toFixed(
                                      1
                                    )}
                                    /100
                                  </span>
                                </div>
                                <div>
                                  Contribution:{' '}
                                  <span className="text-yellow-300 font-semibold">
                                    {(
                                      paper.qualityScoreBreakdown.contentDepth *
                                      0.25
                                    ).toFixed(1)}{' '}
                                    points
                                  </span>
                                </div>
                                <div className="ml-2 text-gray-400">
                                  └─ Word Count:{' '}
                                  {paper.wordCount ||
                                    paper.abstractWordCount ||
                                    'Abstract only'}
                                </div>
                              </div>
                            </div>

                            {/* Calculation */}
                            <div className="bg-purple-900/30 rounded p-2 mb-2">
                              <div className="font-semibold text-purple-300 mb-1">
                                ✅ CALCULATION:
                              </div>
                              <div className="text-gray-300 font-mono text-xs">
                                {(
                                  paper.qualityScoreBreakdown.citationImpact *
                                  0.4
                                ).toFixed(1)}{' '}
                                +{' '}
                                {(
                                  paper.qualityScoreBreakdown.journalPrestige *
                                  0.35
                                ).toFixed(1)}{' '}
                                +{' '}
                                {(
                                  paper.qualityScoreBreakdown.contentDepth *
                                  0.25
                                ).toFixed(1)}{' '}
                                ={' '}
                                <span className="text-yellow-300 font-bold">
                                  {paper.qualityScore}/100
                                </span>
                              </div>
                            </div>

                            <div className="text-gray-500 text-xs italic">
                              Data sources: OpenAlex, {paper.source}
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                            <div className="border-8 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
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
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Phase 10.6 Day 2: Enhanced PubMed Metadata */}
              {(paper.publicationType || paper.meshTerms || paper.authorAffiliations || paper.grants) && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  {/* Publication Types */}
                  {paper.publicationType && paper.publicationType.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">Type:</span>
                      <div className="flex gap-1 flex-wrap">
                        {paper.publicationType.slice(0, 3).map((type, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            title="Publication type from PubMed"
                          >
                            {type}
                          </Badge>
                        ))}
                        {paper.publicationType.length > 3 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{paper.publicationType.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MeSH Terms */}
                  {paper.meshTerms && paper.meshTerms.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">MeSH:</span>
                      <div className="flex gap-1 flex-wrap">
                        {paper.meshTerms.slice(0, 4).map((term, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                            title={`MeSH: ${term.descriptor}${term.qualifiers.length > 0 ? ' [' + term.qualifiers.join(', ') + ']' : ''}`}
                          >
                            {term.descriptor}
                          </Badge>
                        ))}
                        {paper.meshTerms.length > 4 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{paper.meshTerms.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Author Affiliations - Show first affiliation only */}
                  {paper.authorAffiliations && paper.authorAffiliations.length > 0 && paper.authorAffiliations[0] && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">Institution:</span>
                      <span className="text-xs text-gray-600" title={`${paper.authorAffiliations[0].author}: ${paper.authorAffiliations[0].affiliation}`}>
                        {paper.authorAffiliations[0].affiliation.substring(0, 60)}
                        {paper.authorAffiliations[0].affiliation.length > 60 ? '...' : ''}
                        {paper.authorAffiliations.length > 1 && (
                          <span className="text-gray-400 ml-1">
                            (+{paper.authorAffiliations.length - 1} more)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Grants */}
                  {paper.grants && paper.grants.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">Funding:</span>
                      <div className="flex gap-1 flex-wrap">
                        {paper.grants.slice(0, 2).map((grant, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                            title={`${grant.agency || 'Unknown agency'}${grant.grantId ? ' - ' + grant.grantId : ''}`}
                          >
                            {grant.agency?.substring(0, 30) || 'Grant'}
                            {grant.agency && grant.agency.length > 30 ? '...' : ''}
                          </Badge>
                        ))}
                        {paper.grants.length > 2 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{paper.grants.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div
                className="flex gap-2 mt-4"
                onClick={e => e.stopPropagation()}
              >
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

                {/* Full-Text Access - Enterprise-Grade PDF Fetch */}
                {/* Phase 10.6 Day 8.3.1: Color-coded with comprehensive paywall detection */}
                {paper.doi && (() => {
                  // Calculate access status for button styling (MUST match badge logic exactly)
                  const hasFullText = paper.hasFullText === true || paper.fullTextStatus === 'success';

                  // Smart paywall detection - 22 major paywalled publishers (matches badge logic)
                  const isPaywalledPublisher = paper.url && (
                    paper.url.includes('ieeexplore.ieee.org') ||
                    paper.url.includes('sciencedirect.com') ||
                    paper.url.includes('springer.com') ||
                    paper.url.includes('springerlink.com') ||
                    paper.url.includes('wiley.com') ||
                    paper.url.includes('onlinelibrary.wiley.com') ||
                    paper.url.includes('nature.com') ||
                    paper.url.includes('science.org') ||
                    paper.url.includes('acs.org') ||
                    paper.url.includes('tandfonline.com') ||
                    paper.url.includes('sagepub.com') ||
                    paper.url.includes('journals.lww.com') ||
                    paper.url.includes('webofknowledge.com') ||
                    paper.url.includes('webofscience.com') ||
                    paper.url.includes('scopus.com') ||
                    paper.url.includes('oxfordjournals.org') ||
                    paper.url.includes('academic.oup.com') ||
                    paper.url.includes('cambridge.org') ||
                    paper.url.includes('bmj.com') ||
                    paper.url.includes('jamanetwork.com') ||
                    paper.url.includes('nejm.org') ||
                    paper.url.includes('thelancet.com')
                  );

                  // Verified open access sources (matches badge logic)
                  const isKnownOpenSource = paper.url && (
                    paper.url.includes('arxiv.org') ||
                    paper.url.includes('biorxiv.org') ||
                    paper.url.includes('medrxiv.org') ||
                    paper.url.includes('chemrxiv.org') ||
                    paper.url.includes('eric.ed.gov') ||
                    paper.url.includes('europepmc.org') ||
                    paper.url.includes('plos.org') ||
                    paper.url.includes('frontiersin.org') ||
                    paper.url.includes('mdpi.com') ||
                    paper.url.includes('biomedcentral.com')
                  );

                  const isVerifiedOpenAccess = (
                    (paper.fullTextSource === 'unpaywall' || paper.fullTextSource === 'pmc' || isKnownOpenSource) &&
                    !isPaywalledPublisher
                  );
                  const isAvailable = (hasFullText && !isPaywalledPublisher) || isVerifiedOpenAccess;

                  // Green for truly available, Amber for paywalled or restricted
                  const buttonColor = isAvailable
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700';

                  return (
                    <Button
                      size="sm"
                      variant="default"
                      className={`${buttonColor} text-white`}
                      onClick={async (e) => {
                      e.stopPropagation();

                      console.log(`[Full-Text Fetch] Starting for paper:`, {
                        id: paper.id,
                        doi: paper.doi,
                        title: paper.title,
                      });

                      try {
                        const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
                        const endpoint = `${apiUrl}/pdf/fetch/${paper.id}`;

                        console.log(`[Full-Text Fetch] Calling backend API:`, endpoint);

                        // Step 1: Queue enterprise waterfall fetch job
                        const response = await fetch(endpoint, {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });

                        console.log(`[Full-Text Fetch] Backend response:`, {
                          status: response.status,
                          statusText: response.statusText,
                          ok: response.ok,
                        });

                        if (!response.ok) {
                          const errorText = await response.text();
                          console.error(`[Full-Text Fetch] Backend error:`, {
                            status: response.status,
                            error: errorText,
                          });

                          if (response.status === 401) {
                            alert('Authentication required. Please log in and try again.');
                          } else if (response.status === 404) {
                            alert('Paper not found. Please refresh and try again.');
                          } else {
                            alert(`Failed to queue full-text fetch (HTTP ${response.status}). Please try again.`);
                          }
                          return;
                        }

                        const jobData = await response.json();
                        console.log(`[Full-Text Fetch] Job queued successfully:`, jobData);

                        // Step 2: Try immediate Unpaywall access for instant PDF
                        console.log(`[Full-Text Fetch] Checking Unpaywall for immediate access...`);

                        try {
                          const unpaywallResponse = await fetch(
                            `https://api.unpaywall.org/v2/${paper.doi}?email=research@blackqmethod.com`
                          );

                          if (!unpaywallResponse.ok) {
                            console.warn(`[Full-Text Fetch] Unpaywall failed:`, unpaywallResponse.status);
                            alert(`Full-text fetch queued (Job ID: ${jobData.jobId?.slice(0, 8)}...). Background processing in progress. Please refresh in a moment.`);
                            return;
                          }

                          const unpaywallData = await unpaywallResponse.json();
                          console.log(`[Full-Text Fetch] Unpaywall data:`, {
                            is_oa: unpaywallData.is_oa,
                            has_best_oa: !!unpaywallData.best_oa_location,
                            oa_status: unpaywallData.oa_status,
                          });

                          const pdfUrl = unpaywallData.best_oa_location?.url_for_pdf ||
                                         unpaywallData.best_oa_location?.url;

                          if (pdfUrl) {
                            console.log(`[Full-Text Fetch] Opening PDF:`, pdfUrl);
                            window.open(pdfUrl, '_blank');

                            // Success feedback
                            console.log(`[Full-Text Fetch] ✅ Complete - PDF opened + background job queued`);
                          } else {
                            console.warn(`[Full-Text Fetch] No immediate PDF available. Background job will try PMC/HTML scraping.`);
                            alert(`Full-text fetch queued (Job ID: ${jobData.jobId?.slice(0, 8)}...). No immediate PDF available. Background processing will try PMC/HTML scraping. Please check back in a moment.`);
                          }
                        } catch (unpaywallError) {
                          console.error(`[Full-Text Fetch] Unpaywall error:`, unpaywallError);
                          alert(`Full-text fetch queued (Job ID: ${jobData.jobId?.slice(0, 8)}...). Could not check Unpaywall. Background processing in progress.`);
                        }

                      } catch (error) {
                        console.error('[Full-Text Fetch] Unexpected error:', error);
                        alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`);
                      }
                    }}
                    title="Enterprise-grade full-text access. Tries: 1) Database cache, 2) PMC HTML, 3) Unpaywall PDF, 4) Publisher HTML scraping. Opens PDF if immediately available, otherwise queues background fetch."
                  >
                      <BookOpen className="w-3 h-3 mr-1" />
                      {isAvailable ? 'Access Full Text' : 'Check Availability'}
                    </Button>
                  );
                })()}

                {/* Save Button */}
                <Button
                  size="sm"
                  variant={isSaved ? 'secondary' : 'outline'}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleSave(paper);
                  }}
                >
                  <Star
                    className={cn('w-3 h-3 mr-1', isSaved && 'fill-current')}
                  />
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
