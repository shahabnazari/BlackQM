/**
 * Phase 10.113 Week 10: Query Intelligence Panel
 *
 * Displays query analysis before search execution:
 * - Spell corrections with undo option
 * - Methodology detection badge
 * - Controversy meter for Q-methodology
 * - Query quality score
 * - Smart suggestions
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 10
 */

'use client';

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Microscope,
  Scale,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Undo2,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  QueryIntelligence,
  QueryQuality,
  MethodologyDetection,
  ControversyScore,
  QuerySuggestion,
} from '@/lib/types/search-stream.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUALITY_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
} as const;

const CONTROVERSY_THRESHOLDS = {
  HIGH: 0.7,
  MEDIUM: 0.4,
} as const;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface QueryIntelligencePanelProps {
  /** Query intelligence from backend */
  intelligence: QueryIntelligence | null;
  /** Whether panel is visible */
  visible: boolean;
  /** Callback when user accepts correction */
  onAcceptCorrection?: (correctedQuery: string) => void;
  /** Callback when user undoes correction */
  onUndoCorrection?: (originalQuery: string) => void;
  /** Callback when user selects suggestion */
  onSelectSuggestion?: (suggestion: QuerySuggestion) => void;
  /** Whether corrections are currently applied */
  correctionApplied?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Quality Score Display
 */
const QualityScoreDisplay = memo(function QualityScoreDisplay({
  quality,
}: {
  quality: QueryQuality;
}) {
  const getQualityColor = (score: number) => {
    if (score >= QUALITY_THRESHOLDS.EXCELLENT) return 'text-green-600';
    if (score >= QUALITY_THRESHOLDS.GOOD) return 'text-blue-600';
    if (score >= QUALITY_THRESHOLDS.FAIR) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= QUALITY_THRESHOLDS.EXCELLENT) return 'Excellent';
    if (score >= QUALITY_THRESHOLDS.GOOD) return 'Good';
    if (score >= QUALITY_THRESHOLDS.FAIR) return 'Fair';
    return 'Needs Improvement';
  };

  const getProgressColor = (score: number) => {
    if (score >= QUALITY_THRESHOLDS.EXCELLENT) return 'bg-green-500';
    if (score >= QUALITY_THRESHOLDS.GOOD) return 'bg-blue-500';
    if (score >= QUALITY_THRESHOLDS.FAIR) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Query Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getQualityColor(quality.score)}`}>
            {quality.score}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 ${getProgressColor(quality.score)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${quality.score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${getQualityColor(quality.score)}`}>
          {getQualityLabel(quality.score)}
        </span>
        {quality.issues.length > 0 && (
          <span className="text-gray-500">
            {quality.issues.length} issue{quality.issues.length > 1 ? 's' : ''} found
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * Methodology Detection Badge
 */
const MethodologyBadge = memo(function MethodologyBadge({
  methodology,
}: {
  methodology: MethodologyDetection;
}) {
  if (!methodology.detected) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <Microscope className="w-5 h-5 text-purple-600" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-purple-900">
            Methodology Detected
          </span>
          <Badge className="bg-purple-600 text-white text-xs">
            {methodology.detected}
          </Badge>
        </div>
        {methodology.relatedTerms.length > 0 && (
          <p className="text-xs text-purple-700 mt-1">
            Related: {methodology.relatedTerms.slice(0, 3).join(', ')}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className="text-xs text-purple-600">
          {Math.round(methodology.confidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
});

/**
 * Controversy Meter (for Q-methodology)
 */
const ControversyMeter = memo(function ControversyMeter({
  controversy,
}: {
  controversy: ControversyScore;
}) {
  const getControversyLevel = (score: number) => {
    if (score >= CONTROVERSY_THRESHOLDS.HIGH) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-500' };
    if (score >= CONTROVERSY_THRESHOLDS.MEDIUM) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { label: 'Low', color: 'text-green-600', bg: 'bg-green-500' };
  };

  const level = getControversyLevel(controversy.score);

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Controversy Potential
          </span>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Q-method
          </Badge>
        </div>
        <span className={`text-sm font-bold ${level.color}`}>
          {level.label}
        </span>
      </div>

      {/* Animated gauge */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full bg-green-200" />
          <div className="w-1/3 h-full bg-yellow-200" />
          <div className="w-1/3 h-full bg-orange-200" />
        </div>
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-gray-800 rounded-full shadow-lg"
          initial={{ left: 0 }}
          animate={{ left: `${Math.min(controversy.score * 100, 98)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {controversy.terms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {controversy.terms.slice(0, 4).map((term, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-gray-100 text-gray-700"
            >
              {term}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600">{controversy.explanation}</p>
    </div>
  );
});

/**
 * Smart Suggestions List
 */
const SuggestionsList = memo(function SuggestionsList({
  suggestions,
  onSelect,
}: {
  suggestions: QuerySuggestion[];
  onSelect?: (suggestion: QuerySuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (suggestions.length === 0) return null;

  const displayedSuggestions = expanded ? suggestions : suggestions.slice(0, 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-gray-700">Suggested Refinements</span>
      </div>

      <div className="space-y-2">
        {displayedSuggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect?.(suggestion)}
            className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 group-hover:text-amber-700 truncate">
                  &ldquo;{suggestion.query}&rdquo;
                </p>
                <p className="text-xs text-amber-700 mt-1">{suggestion.reason}</p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-xs bg-amber-100 text-amber-800 border-amber-300">
                {suggestion.expectedImprovement}
              </Badge>
            </div>
          </motion.button>
        ))}
      </div>

      {suggestions.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show {suggestions.length - 2} more
            </>
          )}
        </button>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const QueryIntelligencePanel = memo(function QueryIntelligencePanel({
  intelligence,
  visible,
  onAcceptCorrection,
  onUndoCorrection,
  onSelectSuggestion,
  correctionApplied = false,
}: QueryIntelligencePanelProps) {
  if (!intelligence || !visible) return null;

  const hasCorrection = intelligence.corrections !== null;
  const hasIssues = intelligence.quality.issues.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-200 rounded-lg p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">
                Query Intelligence
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Analyzed in {intelligence.analysisTimeMs}ms
            </span>
          </div>

          {/* Spell Correction Banner */}
          {hasCorrection && (
            <div className={`p-3 rounded-lg flex items-center justify-between ${
              correctionApplied
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {correctionApplied ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <p className="text-sm">
                    <span className="text-gray-500 line-through">
                      {intelligence.corrections!.original}
                    </span>
                    {' '}&rarr;{' '}
                    <span className="font-semibold text-gray-900">
                      {intelligence.corrections!.corrected}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Math.round(intelligence.corrections!.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!correctionApplied ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcceptCorrection?.(intelligence.corrections!.corrected)}
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Accept
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUndoCorrection?.(intelligence.corrections!.original)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quality Score */}
          <QualityScoreDisplay quality={intelligence.quality} />

          {/* Quality Issues */}
          {hasIssues && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Suggestions</span>
              </div>
              <ul className="space-y-1">
                {intelligence.quality.issues.slice(0, 3).map((issue, index) => (
                  <li key={index} className="text-xs text-yellow-700 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">&bull;</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Methodology Detection */}
          <MethodologyBadge methodology={intelligence.methodology} />

          {/* Controversy Meter */}
          <ControversyMeter controversy={intelligence.controversy} />

          {/* Broadness Warning */}
          {intelligence.broadness.isTooBroad && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Query may be too broad
                </span>
              </div>
              {intelligence.broadness.suggestions.length > 0 && (
                <p className="text-xs text-orange-700">
                  Try: {intelligence.broadness.suggestions.slice(0, 2).join(' or ')}
                </p>
              )}
            </div>
          )}

          {/* Result Estimate */}
          <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
            <span>Estimated results:</span>
            <span className="font-medium">
              {intelligence.estimate.min} - {intelligence.estimate.max} papers
              <span className="text-gray-400 ml-1">
                ({Math.round(intelligence.estimate.confidence * 100)}% confidence)
              </span>
            </span>
          </div>

          {/* Smart Suggestions */}
          <SuggestionsList
            suggestions={intelligence.suggestions}
            {...(onSelectSuggestion ? { onSelect: onSelectSuggestion } : {})}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default QueryIntelligencePanel;
