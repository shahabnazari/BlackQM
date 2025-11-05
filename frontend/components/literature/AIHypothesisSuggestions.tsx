'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Beaker,
  CheckCircle2,
  Circle,
  TrendingUp,
  GitBranch,
  Filter,
  Target,
  Info,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

/**
 * AI Hypothesis Suggestions Component
 * Phase 10 Day 5.12
 *
 * Purpose: Display AI-generated hypotheses from themes
 * Features:
 * - Hypothesis type badges (correlational/causal/mediation/moderation/interaction)
 * - Variables identified (IV → DV, with moderators/mediators)
 * - Confidence scores with evidence strength
 * - Expected effect sizes
 * - Statistical test recommendations
 * - One-click hypothesis testing (integrates with Day 5.11)
 * - Research backing citations
 *
 * Enterprise-Grade Features:
 * - Type-safe interfaces
 * - Accessible UI (WCAG 2.1 AA)
 * - Animation states
 * - Selection management
 * - Responsive design
 */

export interface HypothesisSuggestion {
  id: string;
  hypothesis: string;
  type: 'correlational' | 'causal' | 'mediation' | 'moderation' | 'interaction';
  independentVariable: string;
  dependentVariable: string;
  moderator?: string;
  mediator?: string;
  confidenceScore: number; // 0-1
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  relatedThemes: string[]; // theme IDs
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest: string;
  researchBacking: string;
}

interface AIHypothesisSuggestionsProps {
  hypotheses: HypothesisSuggestion[];
  onSelectHypothesis?: (hypothesis: HypothesisSuggestion) => void;
  onTestHypothesis?: (hypothesis: HypothesisSuggestion) => void;
  className?: string;
}

const hypothesisTypeConfig = {
  correlational: {
    label: 'Correlational',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Tests association between variables',
    icon: TrendingUp,
  },
  causal: {
    label: 'Causal',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Tests cause-effect relationship',
    icon: Target,
  },
  mediation: {
    label: 'Mediation',
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Tests indirect effect through mediator',
    icon: GitBranch,
  },
  moderation: {
    label: 'Moderation',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    description: 'Tests when/for whom effect occurs',
    icon: Filter,
  },
  interaction: {
    label: 'Interaction',
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Tests combined effects of variables',
    icon: GitBranch,
  },
};

const evidenceStrengthConfig = {
  strong: {
    color: 'text-green-600',
    label: 'Strong Evidence',
    badgeColor: 'bg-green-100',
  },
  moderate: {
    color: 'text-amber-600',
    label: 'Moderate Evidence',
    badgeColor: 'bg-amber-100',
  },
  weak: {
    color: 'text-red-600',
    label: 'Weak Evidence',
    badgeColor: 'bg-red-100',
  },
};

const effectSizeConfig = {
  small: { color: 'text-blue-600', label: 'Small', description: '(d ≈ 0.2)' },
  medium: {
    color: 'text-purple-600',
    label: 'Medium',
    description: '(d ≈ 0.5)',
  },
  large: { color: 'text-green-600', label: 'Large', description: '(d ≈ 0.8)' },
};

export const AIHypothesisSuggestions: React.FC<
  AIHypothesisSuggestionsProps
> = ({ hypotheses, onSelectHypothesis, onTestHypothesis, className = '' }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSelection = (hypothesisId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(hypothesisId)) {
      newSelection.delete(hypothesisId);
    } else {
      newSelection.add(hypothesisId);
    }
    setSelectedIds(newSelection);
  };

  const toggleExpanded = (hypothesisId: string) => {
    setExpandedId(expandedId === hypothesisId ? null : hypothesisId);
  };

  if (hypotheses.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hypothesis suggestions available.</p>
        <p className="text-sm text-gray-500 mt-2">
          Extract themes first to generate hypothesis suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-purple-600" />
            AI-Generated Hypotheses ({hypotheses.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Testable hypotheses generated from extracted themes
          </p>
        </div>
      </div>

      {/* Hypotheses List */}
      <div className="space-y-3">
        {hypotheses.map((hyp, index) => {
          const isSelected = selectedIds.has(hyp.id);
          const isExpanded = expandedId === hyp.id;
          const typeConfig = hypothesisTypeConfig[hyp.type];
          const evidenceConfig = evidenceStrengthConfig[hyp.evidenceStrength];
          const TypeIcon = typeConfig.icon;

          return (
            <motion.div
              key={hyp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
              `}
            >
              {/* Header Row */}
              <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                <button
                  onClick={() => {
                    toggleSelection(hyp.id);
                    onSelectHypothesis?.(hyp);
                  }}
                  className="mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  aria-label={
                    isSelected ? 'Deselect hypothesis' : 'Select hypothesis'
                  }
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Type Badge & Confidence */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${typeConfig.color}`}
                      title={typeConfig.description}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeConfig.label}
                    </span>

                    {/* Confidence Score */}
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${evidenceConfig.badgeColor} ${evidenceConfig.color}`}
                      title={`Confidence: ${(hyp.confidenceScore * 100).toFixed(0)}%`}
                    >
                      {evidenceConfig.label} (
                      {(hyp.confidenceScore * 100).toFixed(0)}%)
                    </span>

                    {/* Expected Effect Size */}
                    {hyp.expectedEffectSize && (
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium bg-gray-100 ${effectSizeConfig[hyp.expectedEffectSize].color}`}
                        title={
                          effectSizeConfig[hyp.expectedEffectSize].description
                        }
                      >
                        Effect: {effectSizeConfig[hyp.expectedEffectSize].label}
                      </span>
                    )}
                  </div>

                  {/* Hypothesis Statement */}
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {hyp.hypothesis}
                  </p>

                  {/* Variables Display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium">
                          Independent Variable (IV):
                        </span>
                        <p className="text-gray-900 mt-0.5">
                          {hyp.independentVariable}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Dependent Variable (DV):
                        </span>
                        <p className="text-gray-900 mt-0.5">
                          {hyp.dependentVariable}
                        </p>
                      </div>
                      {hyp.moderator && (
                        <div>
                          <span className="text-amber-600 font-medium">
                            Moderator:
                          </span>
                          <p className="text-gray-900 mt-0.5">
                            {hyp.moderator}
                          </p>
                        </div>
                      )}
                      {hyp.mediator && (
                        <div>
                          <span className="text-green-600 font-medium">
                            Mediator:
                          </span>
                          <p className="text-gray-900 mt-0.5">{hyp.mediator}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistical Test Recommendation */}
                  <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Suggested Test:</span>{' '}
                      <span className="text-gray-900">
                        {hyp.suggestedStatisticalTest}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Research Backing */}
                  {hyp.researchBacking && (
                    <button
                      onClick={() => toggleExpanded(hyp.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:outline-none focus:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isExpanded ? 'Hide' : 'Show'} Research Backing
                    </button>
                  )}

                  {/* Research Backing Expanded */}
                  {isExpanded && hyp.researchBacking && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
                    >
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {hyp.researchBacking}
                      </p>
                    </motion.div>
                  )}

                  {/* Related Themes Count */}
                  {hyp.relatedThemes.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Based on {hyp.relatedThemes.length} theme
                      {hyp.relatedThemes.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => onTestHypothesis?.(hyp)}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  title="Opens Day 5.11 Hypothesis Testing Battery"
                >
                  Test This Hypothesis
                </button>
                <button
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  title="Customize hypothesis wording"
                >
                  Customize
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {selectedIds.size > 0 && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">{selectedIds.size}</span> hypothesis
            {selectedIds.size !== 1 ? 'es' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};
