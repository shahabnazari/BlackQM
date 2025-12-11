/**
 * Phase 10.113 Week 5: Claim Extraction Panel
 *
 * Netflix-grade component for displaying extracted claims from papers.
 * Shows claims with statement potential, perspective classification,
 * and quality metrics.
 *
 * Features:
 * - Claim list with perspective badges
 * - Statement potential visualization
 * - Quality metrics summary
 * - Filtering by perspective
 * - Sorting by potential score
 *
 * @module ThematizationUI
 * @since Phase 10.113 Week 5
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Filter,
  SortDesc,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as ClaimExtractionAPI from '@/lib/api/services/claim-extraction-api.service';
import type {
  ExtractedClaim,
  ClaimPerspective,
  ClaimExtractionQualityMetrics,
} from '@/lib/api/services/claim-extraction-api.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const PERSPECTIVE_ICONS: Record<ClaimPerspective, React.ReactNode> = {
  supportive: <ThumbsUp className="w-4 h-4" />,
  critical: <ThumbsDown className="w-4 h-4" />,
  neutral: <Minus className="w-4 h-4" />,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ClaimExtractionPanelProps {
  /** Extracted claims to display */
  claims: readonly ExtractedClaim[];
  /** Quality metrics from extraction */
  qualityMetrics?: ClaimExtractionQualityMetrics;
  /** Whether extraction is in progress */
  isLoading?: boolean;
  /** Loading progress (0-100) */
  loadingProgress?: number;
  /** Loading stage message */
  loadingMessage?: string;
  /** Callback when a claim is selected */
  onClaimSelect?: (claim: ExtractedClaim) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ClaimExtractionPanel = memo(function ClaimExtractionPanel({
  claims,
  qualityMetrics,
  isLoading = false,
  loadingProgress = 0,
  loadingMessage = 'Extracting claims...',
  onClaimSelect,
  className = '',
}: ClaimExtractionPanelProps) {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isExpanded, setIsExpanded] = useState(true);
  const [filterPerspective, setFilterPerspective] = useState<ClaimPerspective | 'all'>('all');
  const [sortBy, setSortBy] = useState<'potential' | 'confidence'>('potential');

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const filteredAndSortedClaims = useMemo(() => {
    let result = [...claims];

    // Filter by perspective
    if (filterPerspective !== 'all') {
      result = result.filter((c) => c.perspective === filterPerspective);
    }

    // Sort
    if (sortBy === 'potential') {
      result.sort((a, b) => b.statementPotential - a.statementPotential);
    } else {
      result.sort((a, b) => b.confidence - a.confidence);
    }

    return result;
  }, [claims, filterPerspective, sortBy]);

  const perspectiveCounts = useMemo(() => {
    const grouped = ClaimExtractionAPI.groupClaimsByPerspective(claims);
    return {
      supportive: grouped.get('supportive')?.length ?? 0,
      critical: grouped.get('critical')?.length ?? 0,
      neutral: grouped.get('neutral')?.length ?? 0,
    };
  }, [claims]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderClaimCard = (claim: ExtractedClaim, index: number) => {
    const potentialIndicator = ClaimExtractionAPI.getStatementPotentialIndicator(
      claim.statementPotential
    );
    const perspectiveColor = ClaimExtractionAPI.getPerspectiveBadgeColor(claim.perspective);

    return (
      <motion.div
        key={claim.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
        onClick={() => onClaimSelect?.(claim)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={perspectiveColor}>
              {PERSPECTIVE_ICONS[claim.perspective]}
              <span className="ml-1">
                {ClaimExtractionAPI.getPerspectiveLabel(claim.perspective)}
              </span>
            </Badge>
            {claim.metadata.isDeduplicated && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Merged ({claim.sourcePapers.length} sources)
              </Badge>
            )}
          </div>
          <div className={`flex items-center gap-1 ${potentialIndicator.color}`}>
            <span>{potentialIndicator.emoji}</span>
            <span className="text-sm font-medium">
              {ClaimExtractionAPI.formatPotential(claim.statementPotential)}
            </span>
          </div>
        </div>

        {/* Claim Text */}
        <p className="text-gray-900 text-sm mb-3">{claim.normalizedClaim}</p>

        {/* Original Text (collapsed) */}
        {claim.originalText !== claim.normalizedClaim && (
          <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">
            Original: "{claim.originalText}"
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{claim.sourcePapers.length} paper(s)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Confidence: {ClaimExtractionAPI.formatConfidence(claim.confidence)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{claim.metadata.normalizedWordCount} words</span>
          </div>
        </div>

        {/* Key Terms */}
        {claim.metadata.keyTerms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {claim.metadata.keyTerms.slice(0, 5).map((term, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
              >
                {term}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderQualityMetrics = () => {
    if (!qualityMetrics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {qualityMetrics.claimsAfterDedup}
          </div>
          <div className="text-xs text-gray-500">Total Claims</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {qualityMetrics.highQualityClaims}
          </div>
          <div className="text-xs text-gray-500">High Quality</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {ClaimExtractionAPI.formatPotential(qualityMetrics.avgStatementPotential)}
          </div>
          <div className="text-xs text-gray-500">Avg Potential</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {qualityMetrics.papersProcessed}
          </div>
          <div className="text-xs text-gray-500">Papers Analyzed</div>
        </div>
      </div>
    );
  };

  const renderPerspectiveBalance = () => {
    const total = perspectiveCounts.supportive + perspectiveCounts.critical + perspectiveCounts.neutral;
    if (total === 0) return null;

    return (
      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Perspective Balance</div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600">Supportive</span>
              <span>{perspectiveCounts.supportive}</span>
            </div>
            <Progress
              value={(perspectiveCounts.supportive / total) * 100}
              className="h-2 bg-gray-200"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-600">Critical</span>
              <span>{perspectiveCounts.critical}</span>
            </div>
            <Progress
              value={(perspectiveCounts.critical / total) * 100}
              className="h-2 bg-gray-200"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Neutral</span>
              <span>{perspectiveCounts.neutral}</span>
            </div>
            <Progress
              value={(perspectiveCounts.neutral / total) * 100}
              className="h-2 bg-gray-200"
            />
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Card className={`border-2 border-purple-200 ${className}`}>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Claim Extraction</CardTitle>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Week 5
            </Badge>
            {!isLoading && claims.length > 0 && (
              <Badge className="bg-purple-600">
                {claims.length} claims
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {/* Loading State */}
              {isLoading && (
                <div className="py-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="text-gray-600">{loadingMessage}</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {loadingProgress}% complete
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && claims.length === 0 && (
                <div className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-2">No claims extracted yet</p>
                  <p className="text-sm text-gray-400">
                    Run thematization to extract claims from papers
                  </p>
                </div>
              )}

              {/* Claims Display */}
              {!isLoading && claims.length > 0 && (
                <>
                  {/* Quality Metrics */}
                  {renderQualityMetrics()}

                  {/* Perspective Balance */}
                  {renderPerspectiveBalance()}

                  {/* Filters and Sort */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Select
                        value={filterPerspective}
                        onValueChange={(value) =>
                          setFilterPerspective(value as ClaimPerspective | 'all')
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="All perspectives" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ({claims.length})</SelectItem>
                          <SelectItem value="supportive">
                            Supportive ({perspectiveCounts.supportive})
                          </SelectItem>
                          <SelectItem value="critical">
                            Critical ({perspectiveCounts.critical})
                          </SelectItem>
                          <SelectItem value="neutral">
                            Neutral ({perspectiveCounts.neutral})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <SortDesc className="w-4 h-4 text-gray-500" />
                      <Select
                        value={sortBy}
                        onValueChange={(value) =>
                          setSortBy(value as 'potential' | 'confidence')
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="potential">By Potential</SelectItem>
                          <SelectItem value="confidence">By Confidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                      Showing {filteredAndSortedClaims.length} of {claims.length}
                    </div>
                  </div>

                  {/* Claims List */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredAndSortedClaims.map((claim, index) =>
                      renderClaimCard(claim, index)
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
});

export default ClaimExtractionPanel;
