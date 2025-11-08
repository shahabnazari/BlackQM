'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  BookOpen,
} from 'lucide-react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

/**
 * ThemeCountGuidance Component
 *
 * Ideal theme count recommendations with saturation visualization (Patent Claim #13)
 * Provides purpose-specific guidance and visual saturation tracking.
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

export interface SaturationDataPoint {
  sourceNumber: number;
  newThemesDiscovered: number;
  cumulativeThemes: number;
}

export interface SaturationData {
  sourceProgression: SaturationDataPoint[];
  saturationReached: boolean;
  saturationPoint?: number;
  recommendation: string;
}

export interface ThemeCountGuidanceProps {
  purpose: ResearchPurpose;
  currentThemeCount: number;
  targetRange: { min: number; max: number };
  saturationData?: SaturationData;
  totalSources: number;
}

// ============================================================================
// PURPOSE-SPECIFIC CONFIGURATIONS
// ============================================================================

interface PurposeGuidanceConfig {
  name: string;
  targetRange: { min: number; max: number };
  rationale: string;
  citation: string;
  tooFewWarning: string;
  tooManyWarning: string;
  optimal: string;
}

const PURPOSE_GUIDANCE: Record<ResearchPurpose, PurposeGuidanceConfig> = {
  q_methodology: {
    name: 'Q-Methodology',
    targetRange: { min: 30, max: 80 },
    rationale:
      'Q-methodology requires a broad concourse of 30-80 statements representing the full diversity of viewpoints. While 40-60 is typical, focused studies can use as few as 30 statements. Too few statements limit participant expression; too many cause cognitive overload during sorting.',
    citation:
      'Stephenson, W. (1953). The Study of Behavior: Q-Technique and Its Methodology.',
    tooFewWarning:
      'Below 30 statements may not capture the full diversity of perspectives. Consider analyzing more sources or adjusting extraction parameters.',
    tooManyWarning:
      'Above 80 statements can cause participant fatigue during Q-sorting. Consider consolidating similar statements.',
    optimal:
      'Your theme count is within the optimal range for Q-methodology. Each statement should represent a distinct viewpoint.',
  },
  survey_construction: {
    name: 'Survey Construction',
    targetRange: { min: 5, max: 15 },
    rationale:
      'Survey construction paradigm recommends 5-15 latent constructs, each measured by 4-6 items. Too few constructs oversimplify; too many create participant burden and statistical challenges.',
    citation:
      'Churchill, G. A. (1979); DeVellis, R. F. (2016). Scale Development.',
    tooFewWarning:
      'Fewer than 5 constructs may oversimplify complex phenomena. Consider broader extraction or additional sources.',
    tooManyWarning:
      'More than 15 constructs may indicate need for higher-order grouping or may cause survey fatigue (>60 items).',
    optimal:
      'Your construct count is ideal for psychometric scale development. Each construct should be unidimensional.',
  },
  qualitative_analysis: {
    name: 'Qualitative Analysis',
    targetRange: { min: 5, max: 20 },
    rationale:
      'Reflexive thematic analysis aims for conceptual saturation—typically 5-20 themes depending on data richness. The goal is analytical depth, not exhaustive cataloging.',
    citation: 'Braun & Clarke (2006, 2019). Reflexive Thematic Analysis.',
    tooFewWarning:
      'Fewer than 5 themes may indicate overly broad analysis. Consider whether sub-themes could be elevated.',
    tooManyWarning:
      'More than 20 themes may indicate insufficient abstraction. Consider hierarchical grouping or theme merging.',
    optimal:
      'Your theme count allows for meaningful interpretation. Ensure each theme has sufficient evidence and conceptual coherence.',
  },
  literature_synthesis: {
    name: 'Literature Synthesis',
    targetRange: { min: 10, max: 25 },
    rationale:
      'Meta-ethnography synthesizes 10-25 cross-study themes, balancing comprehensiveness with interpretive parsimony. Themes should be abstract enough to span studies yet specific enough to guide synthesis.',
    citation:
      'Noblit & Hare (1988). Meta-Ethnography: Synthesizing Qualitative Studies.',
    tooFewWarning:
      'Fewer than 10 meta-themes may miss important cross-study patterns. Review if key concepts are adequately represented.',
    tooManyWarning:
      'More than 25 meta-themes may hinder synthesis. Consider higher-order synthesis or reciprocal translation.',
    optimal:
      'Your meta-theme count is appropriate for literature synthesis. Ensure themes translate across different study contexts.',
  },
  hypothesis_generation: {
    name: 'Hypothesis Generation',
    targetRange: { min: 8, max: 15 },
    rationale:
      'Grounded theory generates 8-15 theoretical themes suitable for hypothesis formulation. Themes should be abstract enough for operationalization yet specific enough to be testable.',
    citation: 'Glaser & Strauss (1967). The Discovery of Grounded Theory.',
    tooFewWarning:
      'Fewer than 8 themes may limit theoretical richness. Consider whether additional conceptual categories emerged.',
    tooManyWarning:
      'More than 15 themes may indicate descriptive rather than theoretical coding. Consider axial coding to identify core categories.',
    optimal:
      'Your theme count is ideal for hypothesis generation. Each theme should suggest testable relationships or mechanisms.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCountStatus = (
  current: number,
  target: { min: number; max: number }
): 'too_few' | 'optimal' | 'too_many' => {
  if (current < target.min) return 'too_few';
  if (current > target.max) return 'too_many';
  return 'optimal';
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ThemeCountGuidance({
  purpose,
  currentThemeCount,
  targetRange,
  saturationData,
  totalSources,
}: ThemeCountGuidanceProps) {
  const guidance = PURPOSE_GUIDANCE[purpose];
  const status = getCountStatus(currentThemeCount, targetRange);

  // Status styling
  const statusConfig = {
    too_few: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      label: 'Below Target Range',
    },
    optimal: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Optimal Range',
    },
    too_many: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Above Target Range',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header: Current Count vs. Target */}
      <div
        className={`rounded-lg border-2 p-5 ${currentStatus.bgColor} ${currentStatus.borderColor}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg bg-white shadow-sm ${currentStatus.color}`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {currentThemeCount} Theme{currentThemeCount !== 1 ? 's' : ''}{' '}
                Identified
              </h3>
              <p className={`text-sm font-semibold ${currentStatus.color}`}>
                {currentStatus.label}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Target: {targetRange.min}-{targetRange.max} themes for{' '}
                {guidance.name}
              </p>
            </div>
          </div>

          {/* Visual Target Indicator */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Target Range
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {targetRange.min}-{targetRange.max}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 relative">
          <div className="h-4 bg-white rounded-full overflow-hidden border border-gray-300">
            {/* Target range shading */}
            <div
              className="absolute h-full bg-green-200 opacity-30"
              style={{
                left: `${(targetRange.min / targetRange.max) * 100}%`,
                width: `${((targetRange.max - targetRange.min) / targetRange.max) * 100}%`,
              }}
            />
            {/* Current count indicator */}
            <motion.div
              className={`h-full ${
                status === 'optimal'
                  ? 'bg-green-500'
                  : status === 'too_few'
                    ? 'bg-orange-500'
                    : 'bg-amber-500'
              }`}
              initial={{ width: 0 }}
              animate={{
                width: `${(currentThemeCount / targetRange.max) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0</span>
            <span className="font-semibold">{targetRange.min} (min)</span>
            <span className="font-semibold">{targetRange.max} (max)</span>
          </div>
        </div>
      </div>

      {/* Status-Specific Guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {status === 'optimal' &&
                'Excellent - Your theme count is optimal'}
              {status === 'too_few' && 'Recommendation: Consider more themes'}
              {status === 'too_many' &&
                'Recommendation: Consider consolidation'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {status === 'optimal' && guidance.optimal}
              {status === 'too_few' && guidance.tooFewWarning}
              {status === 'too_many' && guidance.tooManyWarning}
            </p>
          </div>
        </div>
      </div>

      {/* Scientific Rationale */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-600" />
          Scientific Rationale
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          {guidance.rationale}
        </p>
        <p className="text-xs text-gray-600 italic">
          Citation: {guidance.citation}
        </p>
      </div>

      {/* Saturation Visualization (Patent Claim #13) */}
      {saturationData && saturationData.sourceProgression.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Theme Saturation Analysis
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Track how many new themes are discovered as each source is
              analyzed
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-900 font-medium mb-1">
                📊 Sources Sorted by Contribution
              </p>
              <p className="text-xs text-purple-800">
                Sources are ranked by how many themes they primarily contribute to
                (based on influence scores), not by the order they were added.
                Source #1 = highest contributor, not necessarily first paper analyzed.
              </p>
            </div>
          </div>

          {/* Saturation Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={saturationData.sourceProgression}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="sourceNumber"
                label={{
                  value: 'Source Rank (by contribution)',
                  position: 'insideBottom',
                  offset: -5,
                }}
                stroke="#6b7280"
              />
              <YAxis
                yAxisId="left"
                label={{
                  value: 'Cumulative Themes',
                  angle: -90,
                  position: 'insideLeft',
                }}
                stroke="#6b7280"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: 'New Themes',
                  angle: 90,
                  position: 'insideRight',
                }}
                stroke="#6b7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                }}
              />

              {/* Shaded area for cumulative themes */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeThemes"
                fill="#93c5fd"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={0.2}
                name="Cumulative Themes"
              />

              {/* Line for new themes per source */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="newThemesDiscovered"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 4 }}
                name="New Themes Discovered"
              />

              {/* Saturation point marker */}
              {saturationData.saturationReached &&
                saturationData.saturationPoint && (
                  <ReferenceLine
                    x={saturationData.saturationPoint}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{
                      value: 'Saturation',
                      position: 'top',
                      fill: '#10b981',
                      fontWeight: 'bold',
                    }}
                  />
                )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Saturation Status */}
          <div
            className={`mt-4 rounded-lg border-2 p-4 ${
              saturationData.saturationReached
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {saturationData.saturationReached ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold mb-1 ${
                    saturationData.saturationReached
                      ? 'text-green-900'
                      : 'text-yellow-900'
                  }`}
                >
                  {saturationData.saturationReached
                    ? 'Theoretical Saturation Reached'
                    : 'Saturation Not Yet Reached'}
                </p>
                <p className="text-sm text-gray-700">
                  {saturationData.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span>Cumulative Themes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>New Themes per Source</span>
            </div>
            {saturationData.saturationReached && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span>Saturation Point</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Current Themes</p>
          <p className="text-3xl font-bold text-gray-900">
            {currentThemeCount}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Sources Analyzed</p>
          <p className="text-3xl font-bold text-gray-900">{totalSources}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Themes per Source</p>
          <p className="text-3xl font-bold text-gray-900">
            {totalSources > 0
              ? (currentThemeCount / totalSources).toFixed(1)
              : '0'}
          </p>
        </div>
      </div>
    </div>
  );
}
