'use client';

import { useState, useEffect } from 'react';
import {
  LightBulbIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  researchDesignAPI,
  RefinedQuestion,
} from '@/lib/api/services/research-design-api.service';

/**
 * Phase 9.5 Day 3: Question Refinement Panel
 *
 * Features:
 * - SQUARE-IT framework scoring visualization
 * - Sub-question hierarchy display
 * - Interactive question editing with AI assistance
 * - Real-time quality scoring
 */

interface QuestionRefinementPanelProps {
  literatureSummary: {
    papers?: any[];
    themes?: any[];
    gaps?: any[];
    contradictions?: any[];
    trends?: any[];
  };
  onQuestionRefined?: (question: RefinedQuestion) => void;
  initialQuestion?: string;
}

const SQUARE_IT_CRITERIA = [
  {
    key: 'specific',
    label: 'Specific',
    tooltip: 'Is the question narrow and focused?',
  },
  {
    key: 'quantifiable',
    label: 'Quantifiable',
    tooltip: 'Can the outcomes be measured?',
  },
  {
    key: 'usable',
    label: 'Usable',
    tooltip: 'Will findings contribute to knowledge?',
  },
  {
    key: 'accurate',
    label: 'Accurate',
    tooltip: 'Is the problem precisely defined?',
  },
  {
    key: 'restricted',
    label: 'Restricted',
    tooltip: 'Is the scope manageable?',
  },
  {
    key: 'eligible',
    label: 'Eligible',
    tooltip: 'Is Q-methodology suitable for this?',
  },
  {
    key: 'investigable',
    label: 'Investigable',
    tooltip: 'Is it feasible to study?',
  },
  { key: 'timely', label: 'Timely', tooltip: 'Is this gap still relevant?' },
];

export default function QuestionRefinementPanel({
  literatureSummary,
  onQuestionRefined,
  initialQuestion = '',
}: QuestionRefinementPanelProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [refinedQuestion, setRefinedQuestion] =
    useState<RefinedQuestion | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubQuestions, setExpandedSubQuestions] = useState(false);

  // Auto-refine when question changes (with debounce)
  useEffect(() => {
    if (!question || question.length < 10) return;

    const timeoutId = setTimeout(() => {
      handleRefineQuestion();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [question]);

  const handleRefineQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a research question');
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const result = await researchDesignAPI.refineQuestion({
        question,
        literatureSummary: {
          papers: literatureSummary.papers || [],
          themes: literatureSummary.themes || [],
          gaps: literatureSummary.gaps || [],
        },
        domain: 'general',
      });

      setRefinedQuestion(result);
      if (onQuestionRefined) {
        onQuestionRefined(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refine question');
      console.error('Question refinement error:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOverallScore = (refinedQuestion: RefinedQuestion): number => {
    return refinedQuestion.squareitScore.overall;
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8)
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (score >= 6)
      return <InformationCircleIcon className="w-5 h-5 text-yellow-500" />;
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
          <LightBulbIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Research Question Refinement
          </h2>
          <p className="text-sm text-gray-600">
            SQUARE-IT framework powered by AI
          </p>
        </div>
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Research Question
        </label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Enter your research question here..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {question.length} characters · Minimum 10 characters
          </p>
          <button
            onClick={handleRefineQuestion}
            disabled={isRefining || question.length < 10}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isRefining ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Refining...</span>
              </>
            ) : (
              <>
                <LightBulbIcon className="w-4 h-4" />
                <span>Refine Question</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Refined Question Results */}
      {refinedQuestion && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Quality Score
                </h3>
                <p className="text-sm text-gray-600">
                  Based on SQUARE-IT framework
                </p>
              </div>
              <div
                className={`text-4xl font-bold ${getScoreColor(getOverallScore(refinedQuestion))}`}
              >
                {getOverallScore(refinedQuestion).toFixed(1)}/10
              </div>
            </div>

            {/* Refined Question */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Refined Question:
                  </p>
                  <p className="text-base text-gray-900">
                    {refinedQuestion.refinedQuestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Improvements */}
            {refinedQuestion.improvementSuggestions &&
              refinedQuestion.improvementSuggestions.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    💡 AI Suggestions:
                  </p>
                  <ul className="space-y-1">
                    {refinedQuestion.improvementSuggestions.map(
                      (improvement: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-800">
                          • {improvement}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>

          {/* SQUARE-IT Criteria Grid */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              SQUARE-IT Criteria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SQUARE_IT_CRITERIA.map(criterion => {
                const score =
                  (refinedQuestion.squareitScore as any)[criterion.key] || 0;
                return (
                  <div
                    key={criterion.key}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getScoreIcon(score)}
                        <span className="font-medium text-gray-900">
                          {criterion.label}
                        </span>
                      </div>
                      <span
                        className={`text-lg font-bold ${getScoreColor(score)} px-2 py-1 rounded`}
                      >
                        {score}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{criterion.tooltip}</p>
                    {/* Score Bar */}
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-Questions */}
          {refinedQuestion.subQuestions &&
            refinedQuestion.subQuestions.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedSubQuestions(!expandedSubQuestions)}
                  className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Sub-Questions ({refinedQuestion.subQuestions.length})
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedSubQuestions ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedSubQuestions && (
                  <div className="mt-4 space-y-3">
                    {refinedQuestion.subQuestions.map(
                      (subQ: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-4 ml-4"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-yellow-700">
                                {idx + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 mb-2">
                                {subQ.question}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                <span>Priority: {subQ.priority}/10</span>
                                {subQ.mappedGapIds &&
                                  subQ.mappedGapIds.length > 0 && (
                                    <span>
                                      Gaps: {subQ.mappedGapIds.length}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Supporting Papers */}
          {refinedQuestion.supportingPapers &&
            refinedQuestion.supportingPapers.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">
                    Supporting Literature (
                    {refinedQuestion.supportingPapers.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {refinedQuestion.supportingPapers
                    .slice(0, 5)
                    .map((paper: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="text-gray-900">{paper.title}</span>
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-yellow-600 hover:text-yellow-700"
                          >
                            DOI
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
