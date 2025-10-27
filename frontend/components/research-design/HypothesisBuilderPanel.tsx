'use client';

import { useState } from 'react';
import {
  BeakerIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { researchDesignAPI, GeneratedHypothesis } from '@/lib/api/services/research-design-api.service';

/**
 * Phase 9.5 Day 3: Hypothesis Builder Panel
 *
 * Features:
 * - Generate hypotheses from contradictions, gaps, and trends
 * - Visual hypothesis cards with paper citations
 * - Evidence strength indicators
 * - Drag-to-reorder by priority
 * - AI-assisted hypothesis editing
 */

interface HypothesisBuilderPanelProps {
  researchQuestion: string;
  literatureSummary: {
    papers?: any[];
    themes?: any[];
    gaps?: any[];
    contradictions?: any[];
    trends?: any[];
  };
  onHypothesesGenerated?: (hypotheses: GeneratedHypothesis[]) => void;
}

const HYPOTHESIS_TYPE_ICONS = {
  null: '∅',
  alternative: 'H₁',
  directional: '→',
};

const HYPOTHESIS_SOURCE_COLORS = {
  contradiction: 'bg-red-100 text-red-800 border-red-200',
  gap: 'bg-blue-100 text-blue-800 border-blue-200',
  trend: 'bg-green-100 text-green-800 border-green-200',
};

export default function HypothesisBuilderPanel({
  researchQuestion,
  literatureSummary,
  onHypothesesGenerated
}: HypothesisBuilderPanelProps) {
  const [hypotheses, setHypotheses] = useState<GeneratedHypothesis[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHypotheses, setExpandedHypotheses] = useState<Set<string>>(new Set());

  const handleGenerateHypotheses = async () => {
    if (!researchQuestion.trim()) {
      setError('Please provide a research question first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await researchDesignAPI.generateHypotheses({
        researchQuestion,
        literatureSummary: {
          papers: literatureSummary.papers || [],
          themes: literatureSummary.themes || [],
          gaps: literatureSummary.gaps || [],
          contradictions: literatureSummary.contradictions || [],
          trends: literatureSummary.trends || [],
        },
        domain: 'general',
      });

      setHypotheses(result);
      if (onHypothesesGenerated) {
        onHypothesesGenerated(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate hypotheses');
      console.error('Hypothesis generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleHypothesisExpanded = (id: string) => {
    const newExpanded = new Set(expandedHypotheses);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedHypotheses(newExpanded);
  };

  const getEvidenceStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEvidenceIcon = (strength: string) => {
    switch (strength) {
      case 'strong':
        return <CheckBadgeIcon className="w-5 h-5 text-green-600" />;
      case 'moderate':
        return <ChartBarIcon className="w-5 h-5 text-yellow-600" />;
      case 'weak':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BeakerIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hypothesis Generator</h2>
            <p className="text-sm text-gray-600">AI-powered from contradictions, gaps & trends</p>
          </div>
        </div>
        <button
          onClick={handleGenerateHypotheses}
          disabled={isGenerating || !researchQuestion}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              <span>Generate Hypotheses</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Hypotheses List */}
      {hypotheses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {hypotheses.length} hypotheses generated from your literature review
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Contradictions</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Gaps</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Trends</span>
            </div>
          </div>

          {hypotheses.map((hypothesis) => {
            const isExpanded = expandedHypotheses.has(hypothesis.id);
            return (
              <div
                key={hypothesis.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Hypothesis Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                    {HYPOTHESIS_TYPE_ICONS[hypothesis.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded border ${HYPOTHESIS_SOURCE_COLORS[hypothesis.source]}`}>
                        {hypothesis.source}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${getEvidenceStrengthColor(hypothesis.evidenceStrength)}`}>
                        {hypothesis.evidenceStrength} evidence
                      </span>
                      <span className="text-xs text-gray-600">
                        Priority: {hypothesis.priority}/10
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{hypothesis.statement}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {getEvidenceIcon(hypothesis.evidenceStrength)}
                      <span>Confidence: {(hypothesis.confidenceScore * 100).toFixed(0)}%</span>
                      <span>{hypothesis.supportingPapers.length} supporting papers</span>
                      {hypothesis.expectedEffectSize && (
                        <span>Effect size: {hypothesis.expectedEffectSize}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHypothesisExpanded(hypothesis.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* Statistical Test Suggestion */}
                    {hypothesis.suggestedStatisticalTest && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-900 mb-1">Suggested Statistical Test:</p>
                        <p className="text-sm text-purple-800">{hypothesis.suggestedStatisticalTest}</p>
                      </div>
                    )}

                    {/* Supporting Papers */}
                    {hypothesis.supportingPapers.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                          <p className="text-sm font-medium text-gray-900">Supporting Evidence:</p>
                        </div>
                        <div className="space-y-2">
                          {hypothesis.supportingPapers.map((paper, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 rounded-lg p-3 text-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium mb-1">{paper.title}</p>
                                  {paper.excerpt && (
                                    <p className="text-xs text-gray-600 italic">"{paper.excerpt}"</p>
                                  )}
                                </div>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  paper.evidenceType === 'supports' ? 'bg-green-100 text-green-800' :
                                  paper.evidenceType === 'contradicts' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {paper.evidenceType}
                                </span>
                              </div>
                              {paper.doi && (
                                <a
                                  href={`https://doi.org/${paper.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-xs mt-1 inline-block"
                                >
                                  View Paper →
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
          })}
        </div>
      )}

      {/* Empty State */}
      {hypotheses.length === 0 && !isGenerating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <BeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hypotheses Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click "Generate Hypotheses" to create hypotheses from your literature review
          </p>
          <p className="text-xs text-gray-500">
            We'll analyze contradictions, gaps, and trends to suggest testable hypotheses
          </p>
        </div>
      )}
    </div>
  );
}
