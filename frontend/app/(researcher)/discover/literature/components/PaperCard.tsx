/**
 * PaperCard Component (Refactored)
 * Phase 10.91 Day 10 - Component Refactoring
 *
 * **Refactored:** Reduced from 961 lines to < 400 lines using composition
 * **Pattern:** Component composition with focused sub-components
 * ✅ FIXED: Performance - useMemo for SourceIcon computation
 * ✅ FIXED: Magic numbers replaced with constants
 * ✅ FIXED: Pass onToggleSelection to PaperHeader for checkbox functionality
 *
 * Displays individual paper with rich metadata, quality indicators, and actions
 *
 * @module PaperCard
 */

'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Paper } from '@/lib/types/literature.types';
import {
  PaperHeader,
  PaperMetadata,
  PaperAccessBadges,
  PaperQualityBadges,
  PaperStatusBadges,
  PaperActions,
  MAX_DISPLAYED_PUBLICATION_TYPES,
  MAX_DISPLAYED_MESH_TERMS,
  MAX_DISPLAYED_GRANTS,
  MAX_AFFILIATION_LENGTH,
  MAX_GRANT_AGENCY_LENGTH,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      transition={{ layout: { duration: 0.2 } }}
      className={cn(
        'border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected && 'border-blue-500 bg-blue-50/50',
        isExtracted && 'border-green-200 bg-green-50/30',
        isExtracting && 'border-amber-300 bg-amber-50/30'
      )}
      onClick={handleToggleSelection}
      role="article"
      aria-label={`Paper: ${paper.title}`}
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
    >
      {/* Status Badges (top-right corner) */}
      <PaperStatusBadges
        isExtracting={isExtracting}
        isExtracted={isExtracted}
      />

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

          {/* Access and Quality Badges */}
          <div className="flex gap-4 mt-2 flex-wrap">
            {/* Access Status Badges */}
            <PaperAccessBadges
              url={paper.url}
              doi={paper.doi}
              hasFullText={paper.hasFullText}
              fullTextStatus={paper.fullTextStatus}
              fullTextSource={paper.fullTextSource}
            />

            {/* Quality Indicators - Phase 10.942 v4.0 */}
            <PaperQualityBadges
              citationsPerYear={paper.citationsPerYear}
              qualityScore={paper.qualityScore}
              qualityScoreBreakdown={paper.qualityScoreBreakdown}
              citationCount={paper.citationCount}
              relevanceScore={paper.relevanceScore}
            />
          </div>

          {/* Extended Metadata Section */}
          {(paper.publicationType ||
            paper.meshTerms ||
            paper.authorAffiliations ||
            paper.grants) && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {/* Publication Types */}
              {paper.publicationType && paper.publicationType.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">
                    Type:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {paper.publicationType
                      .slice(0, MAX_DISPLAYED_PUBLICATION_TYPES)
                      .map((type, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          title="Publication type from PubMed"
                        >
                          {type}
                        </Badge>
                      ))}
                    {paper.publicationType.length >
                      MAX_DISPLAYED_PUBLICATION_TYPES && (
                      <span className="text-xs text-gray-400 self-center">
                        +
                        {paper.publicationType.length -
                          MAX_DISPLAYED_PUBLICATION_TYPES}{' '}
                        more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* MeSH Terms */}
              {paper.meshTerms && paper.meshTerms.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">
                    MeSH:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {paper.meshTerms
                      .slice(0, MAX_DISPLAYED_MESH_TERMS)
                      .map((term, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                          title={`MeSH: ${term.descriptor}${
                            term.qualifiers.length > 0
                              ? ' [' + term.qualifiers.join(', ') + ']'
                              : ''
                          }`}
                        >
                          {term.descriptor}
                        </Badge>
                      ))}
                    {paper.meshTerms.length > MAX_DISPLAYED_MESH_TERMS && (
                      <span className="text-xs text-gray-400 self-center">
                        +{paper.meshTerms.length - MAX_DISPLAYED_MESH_TERMS} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Author Affiliations */}
              {paper.authorAffiliations &&
                paper.authorAffiliations.length > 0 &&
                paper.authorAffiliations[0] && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">
                      Institution:
                    </span>
                    <span
                      className="text-xs text-gray-600"
                      title={`${paper.authorAffiliations[0].author}: ${paper.authorAffiliations[0].affiliation}`}
                    >
                      {paper.authorAffiliations[0].affiliation.substring(
                        0,
                        MAX_AFFILIATION_LENGTH
                      )}
                      {paper.authorAffiliations[0].affiliation.length >
                      MAX_AFFILIATION_LENGTH
                        ? '...'
                        : ''}
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
                  <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">
                    Funding:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {paper.grants
                      .slice(0, MAX_DISPLAYED_GRANTS)
                      .map((grant, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                          title={`${grant.agency || 'Unknown agency'}${
                            grant.grantId ? ' - ' + grant.grantId : ''
                          }`}
                        >
                          {grant.agency?.substring(0, MAX_GRANT_AGENCY_LENGTH) ||
                            'Grant'}
                          {grant.agency &&
                          grant.agency.length > MAX_GRANT_AGENCY_LENGTH
                            ? '...'
                            : ''}
                        </Badge>
                      ))}
                    {paper.grants.length > MAX_DISPLAYED_GRANTS && (
                      <span className="text-xs text-gray-400 self-center">
                        +{paper.grants.length - MAX_DISPLAYED_GRANTS} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
});
