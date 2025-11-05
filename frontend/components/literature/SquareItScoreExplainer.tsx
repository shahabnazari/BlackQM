/**
 * Phase 10 Day 5.17.4: SQUARE-IT Framework Score Explainer
 *
 * Purpose: Enterprise-grade explanation of research question quality scores
 * User requirement: "unclear what the square it means... communicate what those scores are about in detail"
 *
 * SQUARE-IT Framework validates research questions across 8 dimensions:
 * S - Specific
 * Q - Quantifiable
 * U - Usable
 * A - Accurate
 * R - Restricted
 * E - Eligible
 * I - Investigable
 * T - Timely
 *
 * Reference: Research question quality assessment framework (Butler et al., 2016)
 */

'use client';

import React, { useState } from 'react';
import {
  Info,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface SquareItScore {
  specific: number;
  quantifiable: number;
  usable: number;
  accurate: number;
  restricted: number;
  eligible: number;
  investigable: number;
  timely: number;
  overallScore: number;
}

interface SquareItScoreExplainerProps {
  score: SquareItScore;
  compact?: boolean; // If true, show minimal view with tooltip
  className?: string;
}

const DIMENSION_DETAILS = {
  specific: {
    name: 'Specific',
    shortDesc: 'Clear and focused question scope',
    fullDesc:
      'The research question should have a well-defined scope with clear boundaries. Avoid vague or overly broad questions. A specific question targets a particular phenomenon, population, or context.',
    examples: {
      good: 'How does mindfulness meditation affect anxiety levels in college students?',
      bad: 'What is the impact of meditation on mental health?',
    },
    interpretation: {
      high: '≥0.8: Question is highly focused with clear boundaries',
      medium:
        '0.6-0.79: Question has reasonable focus but could be more precise',
      low: '<0.6: Question is too broad or vague',
    },
  },
  quantifiable: {
    name: 'Quantifiable',
    shortDesc: 'Can be measured or assessed',
    fullDesc:
      'The question should allow for clear measurement or assessment of outcomes. Even qualitative questions should specify what will be examined. This dimension ensures the question can be answered with empirical data.',
    examples: {
      good: 'What barriers do nurses experience when implementing new protocols?',
      bad: 'Are nurses generally happy with their work?',
    },
    interpretation: {
      high: '≥0.8: Clear measurable outcomes or observable phenomena',
      medium: '0.6-0.79: Outcomes can be assessed but need clarification',
      low: '<0.6: Unclear what will be measured or how',
    },
  },
  usable: {
    name: 'Usable',
    shortDesc: 'Practical and actionable findings',
    fullDesc:
      'The question should lead to findings that stakeholders can use. Research should inform decision-making, policy, or practice. Usability ensures the question has real-world relevance beyond academic interest.',
    examples: {
      good: 'Which intervention strategies reduce hospital readmission rates for heart failure patients?',
      bad: 'What color scrubs do doctors prefer on Tuesdays?',
    },
    interpretation: {
      high: '≥0.8: Clear practical applications for findings',
      medium: '0.6-0.79: Some practical value but indirect application',
      low: '<0.6: Limited real-world applicability',
    },
  },
  accurate: {
    name: 'Accurate',
    shortDesc: 'Methodologically sound and valid',
    fullDesc:
      'The question should be answerable using rigorous research methods that produce valid results. This includes appropriate study design, reliable measurement tools, and valid inference. Accuracy ensures scientific credibility.',
    examples: {
      good: 'Do cognitive-behavioral therapy interventions reduce depression symptoms compared to standard care?',
      bad: 'Can we prove that positive thinking cures cancer?',
    },
    interpretation: {
      high: '≥0.8: Can be answered with established valid methods',
      medium: '0.6-0.79: Methods available but may have limitations',
      low: '<0.6: Difficult to answer with scientific rigor',
    },
  },
  restricted: {
    name: 'Restricted',
    shortDesc: 'Appropriate scope for resources',
    fullDesc:
      'The question should be answerable within available time, budget, and resources. Overly ambitious questions that require multi-year studies or massive budgets should be broken down. Restriction ensures feasibility.',
    examples: {
      good: 'What is the relationship between sleep quality and academic performance in undergraduate students at University X?',
      bad: 'How can we eliminate all mental health issues globally?',
    },
    interpretation: {
      high: '≥0.8: Feasible within typical research constraints',
      medium: '0.6-0.79: Feasible but may require significant resources',
      low: '<0.6: Likely requires excessive time or resources',
    },
  },
  eligible: {
    name: 'Eligible',
    shortDesc: 'Ethical and accessible participants',
    fullDesc:
      'The question should involve populations that can be ethically recruited and studied. Researchers must have access to participants, and participation should not pose undue risks. Eligibility ensures ethical and practical access.',
    examples: {
      good: 'How do cancer survivors perceive quality of life 5 years post-treatment?',
      bad: 'What are the psychological effects of solitary confinement on prisoners in maximum security?',
    },
    interpretation: {
      high: '≥0.8: Clear ethical approval path and participant access',
      medium: '0.6-0.79: Possible but may face ethical or access challenges',
      low: '<0.6: Significant ethical concerns or access barriers',
    },
  },
  investigable: {
    name: 'Investigable',
    shortDesc: 'Can be researched scientifically',
    fullDesc:
      'The question should be answerable through scientific investigation, not philosophical speculation or personal opinion. It should address empirical phenomena that can be observed, measured, or analyzed systematically.',
    examples: {
      good: 'What factors predict patient adherence to diabetes medication?',
      bad: 'What is the meaning of life for humanity?',
    },
    interpretation: {
      high: '≥0.8: Clearly empirical and scientifically answerable',
      medium: '0.6-0.79: Empirical but may require conceptual refinement',
      low: '<0.6: Philosophical or outside scientific inquiry',
    },
  },
  timely: {
    name: 'Timely',
    shortDesc: 'Relevant to current priorities',
    fullDesc:
      'The question should address current gaps in knowledge, align with contemporary health/social priorities, or respond to emerging issues. Timeliness ensures the research contributes to ongoing scientific or societal needs.',
    examples: {
      good: 'How effective are mRNA vaccines in preventing COVID-19 variants?',
      bad: 'What were the causes of the 1918 influenza pandemic?',
    },
    interpretation: {
      high: '≥0.8: Addresses current knowledge gaps or urgent priorities',
      medium: '0.6-0.79: Relevant but not at the forefront of current needs',
      low: '<0.6: Outdated or low priority for current research',
    },
  },
};

function getScoreIcon(score: number) {
  if (score >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (score >= 0.6) return <AlertCircle className="w-4 h-4 text-amber-600" />;
  return <XCircle className="w-4 h-4 text-red-600" />;
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBackground(score: number): string {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-amber-500';
  return 'bg-red-500';
}

export const SquareItScoreExplainer: React.FC<SquareItScoreExplainerProps> = ({
  score,
  compact = false,
  className = '',
}) => {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(
    null
  );
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  if (compact) {
    // Compact view: Just bars with tooltips
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              SQUARE-IT Quality Score
            </span>
            <button
              onClick={() => setShowFullExplanation(!showFullExplanation)}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <span
            className={`text-xs font-bold ${getScoreColor(score.overallScore)}`}
          >
            {(score.overallScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-1">
          {Object.entries(score)
            .filter(([key]) => key !== 'overallScore')
            .map(([key, value]) => {
              const details =
                DIMENSION_DETAILS[key as keyof typeof DIMENSION_DETAILS];
              return (
                <div
                  key={key}
                  className="flex-1 group relative"
                  title={`${details.name}: ${(value * 100).toFixed(0)}%`}
                >
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getScoreBackground(value)}`}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div className="font-bold">{details.name}</div>
                      <div>{(value * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Full explanation modal overlay */}
        {showFullExplanation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <SquareItScoreExplainer score={score} compact={false} />
              <div className="p-4 border-t">
                <button
                  onClick={() => setShowFullExplanation(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            SQUARE-IT Research Question Quality Assessment
          </h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Enterprise-grade framework for evaluating research question rigor
          across 8 dimensions
        </p>
      </div>

      {/* Overall Score */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Overall Quality Score
          </span>
          <div className="flex items-center gap-2">
            {getScoreIcon(score.overallScore)}
            <span
              className={`text-2xl font-bold ${getScoreColor(score.overallScore)}`}
            >
              {(score.overallScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {score.overallScore >= 0.8
            ? '✅ Excellent: This question meets high standards for research quality'
            : score.overallScore >= 0.6
              ? '⚠️ Good: This question is solid but could be refined in some areas'
              : '❌ Needs Improvement: Consider revising this question based on dimension feedback below'}
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="divide-y divide-gray-200">
        {Object.entries(score)
          .filter(([key]) => key !== 'overallScore')
          .map(([key, value]) => {
            const details =
              DIMENSION_DETAILS[key as keyof typeof DIMENSION_DETAILS];
            const isExpanded = expandedDimension === key;

            return (
              <div key={key} className="px-6 py-4">
                <button
                  onClick={() => setExpandedDimension(isExpanded ? null : key)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getScoreIcon(value)}
                      <span className="font-medium text-gray-900">
                        {details.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {details.shortDesc}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${getScoreColor(value)}`}
                    >
                      {(value * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getScoreBackground(value)}`}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        What it means:
                      </h4>
                      <p className="text-gray-700">{details.fullDesc}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Good Example
                        </h4>
                        <p className="text-green-800 text-xs italic">
                          "{details.examples.good}"
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <h4 className="font-semibold text-red-900 mb-1 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Poor Example
                        </h4>
                        <p className="text-red-800 text-xs italic">
                          "{details.examples.bad}"
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Score Interpretation:
                      </h4>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>{details.interpretation.high}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <span>{details.interpretation.medium}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <span>{details.interpretation.low}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Reference:</strong> SQUARE-IT framework adapted from Butler et
          al. (2016) and evidence-based research question quality assessment.
          This AI-generated score should be validated by domain experts before
          finalizing research questions.
        </p>
      </div>
    </div>
  );
};
