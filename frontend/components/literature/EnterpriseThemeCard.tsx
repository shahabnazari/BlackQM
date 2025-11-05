'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Quote,
  TrendingUp,
  BookOpen,
  Award,
  AlertCircle,
  Check,
} from 'lucide-react';
import { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';

/**
 * EnterpriseThemeCard Component
 *
 * Clear, publication-ready theme representation (Patent Claim #6)
 * with AI confidence calibration and purpose-specific displays.
 *
 * Week 2 Day 5.13 - Enterprise-Grade UX Implementation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ResearchPurpose =
  | 'q_methodology'
  | 'survey_construction'
  | 'qualitative_analysis'
  | 'literature_synthesis'
  | 'hypothesis_generation';

export interface EnterpriseThemeCardProps {
  theme: UnifiedTheme;
  index: number;
  totalThemes: number;
  purpose: ResearchPurpose;
  onThemeClick?: (theme: UnifiedTheme) => void;
  showConfidenceBadge?: boolean;
  showEvidence?: boolean;
  className?: string;
  // Phase 10 Day 5.12: Selection support
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (themeId: string) => void;
}

// ============================================================================
// CONFIDENCE CALIBRATION (Nature/Science 2024 Guidelines)
// ============================================================================

interface ConfidenceLevel {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  description: string;
}

const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.8) {
    return {
      label: 'High',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      icon: Check,
      description: '80%+ sources, strong semantic coherence',
    };
  } else if (confidence >= 0.6) {
    return {
      label: 'Medium',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      icon: TrendingUp,
      description: '50-80% sources, moderate coherence',
    };
  } else {
    return {
      label: 'Low',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      icon: AlertCircle,
      description: '<50% sources, emerging pattern',
    };
  }
};

// ============================================================================
// PURPOSE-SPECIFIC DISPLAYS
// ============================================================================

const getPurposeSpecificDisplay = (purpose: ResearchPurpose) => {
  const displays = {
    q_methodology: {
      label: 'Q-Statement',
      description: 'Concourse statement for Q-sort',
      showQuotes: true,
      emphasis: 'diversity',
    },
    survey_construction: {
      label: 'Construct',
      description: 'Latent factor for scale items',
      showQuotes: false,
      emphasis: 'clarity',
    },
    qualitative_analysis: {
      label: 'Theme',
      description: 'Interpretive pattern in data',
      showQuotes: true,
      emphasis: 'depth',
    },
    literature_synthesis: {
      label: 'Meta-Theme',
      description: 'Cross-study synthesis',
      showQuotes: true,
      emphasis: 'breadth',
    },
    hypothesis_generation: {
      label: 'Theoretical Theme',
      description: 'Hypothesis-generating concept',
      showQuotes: false,
      emphasis: 'relationships',
    },
  };

  return displays[purpose];
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function EnterpriseThemeCard({
  theme,
  index,
  totalThemes,
  purpose,
  onThemeClick,
  showConfidenceBadge = true,
  showEvidence = true,
  className = '',
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
}: EnterpriseThemeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceLevel = getConfidenceLevel(theme.confidence);
  const purposeDisplay = getPurposeSpecificDisplay(purpose);
  const ConfidenceIcon = confidenceLevel.icon;

  // Calculate statistics
  const topSources = [...theme.sources]
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all ${className}`}
    >
      {/* Card Header */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (onThemeClick && !isExpanded) {
            onThemeClick(theme);
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Phase 10 Day 5.12: Selection Checkbox */}
          {isSelectable && (
            <div className="flex-shrink-0 pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(theme.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* Theme Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                {purposeDisplay.label} {index + 1}/{totalThemes}
              </span>
              <span className="text-xs text-gray-500">{purposeDisplay.description}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{theme.label}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{theme.description}</p>

            {/* Keywords */}
            {theme.keywords && theme.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {theme.keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Badges & Expand */}
          <div className="flex flex-col items-end gap-2">
            {/* AI Confidence Badge (Patent Claim #6) */}
            {showConfidenceBadge && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${confidenceLevel.bgColor} ${confidenceLevel.borderColor}`}
              >
                <ConfidenceIcon className={`w-4 h-4 ${confidenceLevel.color}`} />
                <div>
                  <p className={`text-xs font-bold ${confidenceLevel.color}`}>
                    {confidenceLevel.label} Confidence
                  </p>
                  <p className="text-xs text-gray-600">{(theme.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            )}

            {/* Prevalence Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
              <BookOpen className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">
                {theme.sources.length} / {totalThemes} sources
              </span>
            </div>

            {/* Expand/Collapse */}
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar for Confidence */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                theme.confidence >= 0.8
                  ? 'bg-green-500'
                  : theme.confidence >= 0.6
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${theme.confidence * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-200"
          >
            <div className="p-5 space-y-4 bg-gray-50">
              {/* AI Confidence Explanation */}
              <div className={`rounded-lg border-2 p-4 ${confidenceLevel.bgColor} ${confidenceLevel.borderColor}`}>
                <div className="flex items-start gap-3">
                  <ConfidenceIcon className={`w-5 h-5 ${confidenceLevel.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-sm font-semibold ${confidenceLevel.color} mb-1`}>
                      {confidenceLevel.label} Confidence - What This Means
                    </p>
                    <p className="text-sm text-gray-700">{confidenceLevel.description}</p>
                    {theme.confidence < 0.8 && (
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Recommendation:</strong> Review this theme carefully before publication.
                        Consider gathering additional sources or refining the definition.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Contributing Sources */}
              {showEvidence && topSources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    Top Contributing Sources
                  </h4>
                  <div className="space-y-2">
                    {topSources.map((source) => (
                      <div
                        key={source.sourceId}
                        className="bg-white rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{source.sourceTitle}</p>
                            {source.excerpts && source.excerpts.length > 0 && source.excerpts[0] && purposeDisplay.showQuotes && (
                              <div className="mt-2 pl-3 border-l-2 border-blue-300">
                                <p className="text-xs text-gray-600 italic">
                                  "{source.excerpts[0]!.substring(0, 150)}
                                  {source.excerpts[0]!.length > 150 ? '...' : ''}"
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-blue-600">
                              {(source.influence * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-500">influence</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Statistics */}
              {showEvidence && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600">Sources</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{theme.sources.length}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Quote className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600">Evidence</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {theme.sources?.reduce((sum, s) => sum + (s.excerpts?.length || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600">Weight</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {((theme.weight || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Related Concepts feature not yet implemented in API */}
              {/* Future enhancement: Add relatedConcepts to UnifiedTheme interface */}

              {/* Purpose-Specific Guidance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  {purpose === 'q_methodology' && (
                    <>
                      <strong>Q-Methodology Usage:</strong> This statement can be used in your Q-sort. Ensure
                      it's distinct from other statements and represents a clear viewpoint.
                    </>
                  )}
                  {purpose === 'survey_construction' && (
                    <>
                      <strong>Survey Construction:</strong> Use this construct to generate 4-6 survey items.
                      Ensure items are clear, unidimensional, and suitable for factor analysis.
                    </>
                  )}
                  {purpose === 'qualitative_analysis' && (
                    <>
                      <strong>Qualitative Analysis:</strong> This theme should be supported by rich evidence
                      from your data. Consider adding vivid quotes to your report.
                    </>
                  )}
                  {purpose === 'literature_synthesis' && (
                    <>
                      <strong>Literature Synthesis:</strong> This meta-theme synthesizes findings across
                      multiple studies. Check for consistency and note any contradictions.
                    </>
                  )}
                  {purpose === 'hypothesis_generation' && (
                    <>
                      <strong>Hypothesis Generation:</strong> Use this theme to formulate testable hypotheses.
                      Consider relationships with other themes and potential operationalizations.
                    </>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Export Theme
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  View All Sources
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
