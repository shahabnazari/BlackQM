'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  CheckCircle2,
  Circle,
  ExternalLink,
  Info,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SquareItScoreExplainer } from './SquareItScoreExplainer';

/**
 * AI Research Question Suggestions Component
 * Phase 10 Day 5.12
 *
 * Purpose: Display AI-generated research questions from themes
 * Features:
 * - Question type badges
 * - Relevance scores
 * - SQUARE-IT quality indicators
 * - One-click question selection
 * - Integration with Day 5.10 operationalization
 */

export interface ResearchQuestionSuggestion {
  id: string;
  question: string;
  type: 'exploratory' | 'explanatory' | 'evaluative' | 'descriptive';
  relevanceScore: number;
  rationale: string;
  relatedThemes: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  squareItScore?: {
    specific: number;
    quantifiable: number;
    usable: number;
    accurate: number;
    restricted: number;
    eligible: number;
    investigable: number;
    timely: number;
    overallScore: number;
  };
  suggestedMethodology:
    | 'qualitative'
    | 'quantitative'
    | 'mixed_methods'
    | 'q_methodology';
}

interface AIResearchQuestionSuggestionsProps {
  questions: ResearchQuestionSuggestion[];
  onSelectQuestion?: (question: ResearchQuestionSuggestion) => void;
  onOperationalizeQuestion?: (question: ResearchQuestionSuggestion) => void;
  className?: string;
}

const questionTypeConfig = {
  exploratory: {
    label: 'Exploratory',
    color: 'bg-blue-100 text-blue-700',
    description: 'Discover new insights',
  },
  explanatory: {
    label: 'Explanatory',
    color: 'bg-purple-100 text-purple-700',
    description: 'Explain relationships',
  },
  evaluative: {
    label: 'Evaluative',
    color: 'bg-green-100 text-green-700',
    description: 'Assess effectiveness',
  },
  descriptive: {
    label: 'Descriptive',
    color: 'bg-amber-100 text-amber-700',
    description: 'Characterize phenomena',
  },
};

const complexityConfig = {
  basic: { color: 'text-green-600', label: 'Basic' },
  intermediate: { color: 'text-amber-600', label: 'Intermediate' },
  advanced: { color: 'text-red-600', label: 'Advanced' },
};

export const AIResearchQuestionSuggestions: React.FC<
  AIResearchQuestionSuggestionsProps
> = ({
  questions,
  onSelectQuestion,
  onOperationalizeQuestion,
  className = '',
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSquareItHelp, setShowSquareItHelp] = useState(false);

  const toggleSelection = (questionId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedIds(newSelection);
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-gray-600';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Research Question Suggestions
            </h3>
          </div>
          <span className="text-sm text-gray-600">
            {questions.length} questions generated
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-gray-600">
            AI-generated questions using SQUARE-IT framework for research
            quality
          </p>
          <button
            onClick={() => setShowSquareItHelp(true)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            What is SQUARE-IT?
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="divide-y divide-gray-200">
        {questions.map((question, index) => {
          const isSelected = selectedIds.has(question.id);
          const typeConfig = questionTypeConfig[question.type];
          const complexityConf = complexityConfig[question.complexity];

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-6 hover:bg-gray-50 transition-colors
                ${isSelected ? 'bg-blue-50' : ''}
              `}
            >
              {/* Question Header */}
              <div className="flex items-start gap-4">
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelection(question.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  {/* Question Text */}
                  <p className="text-base font-medium text-gray-900 leading-relaxed mb-3">
                    {question.question}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
                    >
                      {typeConfig.label}
                    </span>
                    <span
                      className={`text-xs font-medium ${complexityConf.color}`}
                    >
                      {complexityConf.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {question.suggestedMethodology.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-xs font-semibold ${getRelevanceColor(question.relevanceScore)}`}
                    >
                      {(question.relevanceScore * 100).toFixed(0)}% relevance
                    </span>
                  </div>

                  {/* Rationale */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {question.rationale}
                      </p>
                    </div>
                  </div>

                  {/* SQUARE-IT Score - Updated with detailed explainer */}
                  {question.squareItScore && (
                    <SquareItScoreExplainer
                      score={question.squareItScore}
                      compact={true}
                      className="mb-3"
                    />
                  )}

                  {/* Related Themes */}
                  {question.relatedThemes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="font-medium">Related to:</span>
                      <span>{question.relatedThemes.length} theme(s)</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectQuestion?.(question)}
                      className="
                        px-3 py-1.5 bg-blue-600 text-white rounded-md
                        text-sm font-medium
                        hover:bg-blue-700 transition-colors
                        flex items-center gap-1
                      "
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Use This Question
                    </button>

                    {onOperationalizeQuestion && (
                      <button
                        onClick={() => onOperationalizeQuestion(question)}
                        className="
                          px-3 py-1.5 border border-purple-600 text-purple-600 rounded-md
                          text-sm font-medium
                          hover:bg-purple-50 transition-colors
                          flex items-center gap-1
                        "
                      >
                        <TrendingUp className="w-4 h-4" />
                        Operationalize
                      </button>
                    )}

                    <button
                      className="
                        px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md
                        text-sm font-medium
                        hover:bg-gray-50 transition-colors
                        flex items-center gap-1
                      "
                    >
                      <ExternalLink className="w-4 h-4" />
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      {questions.length === 0 && (
        <div className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No research questions generated yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Select themes and click &quot;Generate Research Questions&quot; to get started
          </p>
        </div>
      )}

      {/* SQUARE-IT Help Modal */}
      {showSquareItHelp &&
        questions.length > 0 &&
        questions[0]?.squareItScore && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <SquareItScoreExplainer
                score={questions[0].squareItScore}
                compact={false}
              />
              <div className="p-4 border-t flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  This framework helps evaluate research question quality across
                  8 critical dimensions
                </p>
                <button
                  onClick={() => setShowSquareItHelp(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
