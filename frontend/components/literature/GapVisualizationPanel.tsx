/**
 * Gap Visualization Panel - Phase 10.7 Day 4
 *
 * Enterprise-grade component for displaying research gaps with comprehensive details.
 * Shows importance, feasibility, market potential, methodologies, and more.
 *
 * @module GapVisualizationPanel
 * @since Phase 10.7 Day 4
 * @author VQMethod Team
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResearchGap } from '@/lib/services/literature-api.service';
import {
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useState, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface GapVisualizationPanelProps {
  /** Array of research gaps to display */
  gaps: ResearchGap[];
  /** Loading state */
  loading?: boolean;
  /** Class name for styling */
  className?: string;
}

type SortField = 'importance' | 'feasibility' | 'marketPotential' | 'confidence';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color class for score (0-10 or 0-1 scale)
 */
function getScoreColor(score: number, max: number = 10): string {
  const normalized = max === 1 ? score * 10 : score;
  if (normalized >= 8) return 'text-green-600 bg-green-50 border-green-200';
  if (normalized >= 6) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (normalized >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

/**
 * Get trend direction badge color
 */
function getTrendColor(trend?: string): string {
  switch (trend) {
    case 'emerging': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'growing': return 'bg-green-100 text-green-700 border-green-200';
    case 'stable': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'declining': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GapVisualizationPanel({
  gaps,
  loading = false,
  className = '',
}: GapVisualizationPanelProps) {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('importance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minImportance, setMinImportance] = useState<number>(0);

  // ===========================
  // SORTING & FILTERING
  // ===========================

  const sortedAndFilteredGaps = useMemo(() => {
    // Filter by minimum importance
    let filtered = gaps.filter(gap => gap.importance >= minImportance);

    // Sort by selected field
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case 'importance':
          aValue = a.importance;
          bValue = b.importance;
          break;
        case 'feasibility':
          aValue = a.feasibility;
          bValue = b.feasibility;
          break;
        case 'marketPotential':
          aValue = a.marketPotential;
          bValue = b.marketPotential;
          break;
        case 'confidence':
          aValue = a.confidenceScore;
          bValue = b.confidenceScore;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [gaps, sortField, sortDirection, minImportance]);

  // ===========================
  // HANDLERS
  // ===========================

  const toggleExpanded = (gapId: string) => {
    setExpandedGaps(prev => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ===========================
  // RENDER
  // ===========================

  if (loading) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
        <p className="text-gray-500">Analyzing research gaps...</p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No research gaps found</p>
        <p className="text-sm text-gray-400">
          Select papers and click "Analyze Gaps" to identify opportunities
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            <ArrowUpDown className="w-4 h-4 inline mr-1" />
            Sort by:
          </span>
          <Button
            variant={sortField === 'importance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('importance')}
          >
            Importance
          </Button>
          <Button
            variant={sortField === 'feasibility' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('feasibility')}
          >
            Feasibility
          </Button>
          <Button
            variant={sortField === 'marketPotential' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('marketPotential')}
          >
            Market
          </Button>
          <Button
            variant={sortField === 'confidence' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('confidence')}
          >
            Confidence
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 inline mr-1" />
            Min Importance:
          </span>
          {[0, 5, 7, 8].map(value => (
            <Button
              key={value}
              variant={minImportance === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinImportance(value)}
            >
              {value}+
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <div className="ml-auto text-sm text-gray-600">
          Showing {sortedAndFilteredGaps.length} of {gaps.length} gaps
        </div>
      </div>

      {/* Gap Cards */}
      {sortedAndFilteredGaps.map(gap => {
        const isExpanded = expandedGaps.has(gap.id);

        return (
          <Card
            key={gap.id}
            className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{gap.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {gap.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(gap.id)}
                  className="ml-4"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Score Metrics (Always Visible) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Importance */}
                <div className={`p-3 rounded-lg border ${getScoreColor(gap.importance)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-medium">Importance</span>
                  </div>
                  <div className="text-2xl font-bold">{gap.importance}/10</div>
                </div>

                {/* Feasibility */}
                <div className={`p-3 rounded-lg border ${getScoreColor(gap.feasibility)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Feasibility</span>
                  </div>
                  <div className="text-2xl font-bold">{gap.feasibility}/10</div>
                </div>

                {/* Market Potential */}
                <div className={`p-3 rounded-lg border ${getScoreColor(gap.marketPotential)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Market</span>
                  </div>
                  <div className="text-2xl font-bold">{gap.marketPotential}/10</div>
                </div>

                {/* Confidence */}
                <div className={`p-3 rounded-lg border ${getScoreColor(gap.confidenceScore, 1)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Confidence</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(gap.confidenceScore * 100)}%
                  </div>
                </div>
              </div>

              {/* Keywords & Trend (Always Visible) */}
              <div className="flex flex-wrap items-center gap-2">
                {gap.keywords.slice(0, isExpanded ? undefined : 5).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {!isExpanded && gap.keywords.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{gap.keywords.length - 5} more
                  </Badge>
                )}
                {gap.trendDirection && (
                  <Badge className={`text-xs ${getTrendColor(gap.trendDirection)}`}>
                    {gap.trendDirection}
                  </Badge>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Full Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Full Description
                    </h4>
                    <p className="text-sm text-gray-700">{gap.description}</p>
                  </div>

                  {/* Suggested Methodology */}
                  {gap.suggestedMethodology && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Suggested Methodology
                      </h4>
                      <p className="text-sm text-gray-700">{gap.suggestedMethodology}</p>
                    </div>
                  )}

                  {/* Suggested Study Design */}
                  {gap.suggestedStudyDesign && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Suggested Study Design
                      </h4>
                      <p className="text-sm text-gray-700">{gap.suggestedStudyDesign}</p>
                    </div>
                  )}

                  {/* Estimated Impact */}
                  {gap.estimatedImpact && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Estimated Impact
                      </h4>
                      <p className="text-sm text-gray-700">{gap.estimatedImpact}</p>
                    </div>
                  )}

                  {/* Related Papers */}
                  {gap.relatedPapers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Related Papers ({gap.relatedPapers.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {gap.relatedPapers.map((_paperId, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            Paper {idx + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
