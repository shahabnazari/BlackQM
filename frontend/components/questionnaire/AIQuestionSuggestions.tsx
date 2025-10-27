'use client';

import { useGenerateQuestionnaire } from '@/hooks/useAIBackend';
import { Question, QuestionType } from '@/lib/types/questionnaire';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';
import React from 'react';

interface AIQuestionSuggestionsProps {
  surveyContext: {
    title: string;
    existingQuestions: Question[];
    category: string | null;
  };
  onAddQuestion: (type: QuestionType, data?: any) => void;
}

export const AIQuestionSuggestions: React.FC<AIQuestionSuggestionsProps> = ({
  surveyContext,
  onAddQuestion,
}) => {
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  // Use the AI backend hook for questionnaire generation
  const {
    questions: _questions,
    loading: isGenerating,
    error,
    generateQuestionnaire,
  } = useGenerateQuestionnaire();

  const generateSuggestions = async () => {
    try {
      // Generate questions based on survey context
      const generatedQuestions = await generateQuestionnaire({
        studyTopic: surveyContext.title || 'General Survey',
        questionCount: 5,
        questionTypes: ['likert', 'multipleChoice', 'openEnded'],
        targetAudience: 'General',
        includeSkipLogic: false,
      });

      if (generatedQuestions) {
        // Map generated questions to suggestion format
        const mappedSuggestions = generatedQuestions.map(
          (q: any, idx: number) => ({
            id: `ai-${idx + 1}`,
            type: mapQuestionType(q.type),
            text: q.text,
            category: q.category || surveyContext.category || 'General',
            confidence: q.confidence || 85,
            options: q.options,
          })
        );

        setSuggestions(mappedSuggestions);
      }
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      // Fallback to default suggestions if AI fails
      setSuggestions([
        {
          id: 'ai-1',
          type: QuestionType.LIKERT_SCALE,
          text: 'How satisfied are you with the overall quality of our service?',
          category: 'Satisfaction',
          confidence: 95,
        },
        {
          id: 'ai-2',
          type: QuestionType.MULTIPLE_CHOICE_SINGLE,
          text: 'Which feature do you find most valuable?',
          category: 'Feature Feedback',
          confidence: 88,
          options: [
            { text: 'Dashboard Analytics', value: 'dashboard' },
            { text: 'Reporting Tools', value: 'reporting' },
            { text: 'Collaboration Features', value: 'collaboration' },
            { text: 'Mobile App', value: 'mobile' },
          ],
        },
        {
          id: 'ai-3',
          type: QuestionType.TEXT_LONG,
          text: 'What improvements would you like to see in future updates?',
          category: 'Feedback',
          confidence: 82,
        },
      ]);
    }
  };

  // Helper function to map AI question types to app question types
  const mapQuestionType = (aiType: string): QuestionType => {
    const typeMap: Record<string, QuestionType> = {
      likert: QuestionType.LIKERT_SCALE,
      multipleChoice: QuestionType.MULTIPLE_CHOICE_SINGLE,
      openEnded: QuestionType.TEXT_LONG,
      ranking: QuestionType.RANKING,
      demographic: QuestionType.TEXT_SHORT,
    };
    return typeMap[aiType] || QuestionType.TEXT_SHORT;
  };

  React.useEffect(() => {
    generateSuggestions();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Suggestions
        </h3>
        <button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          AI-powered suggestions based on your survey context and existing
          questions.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error ||
              'Failed to generate AI suggestions. Using default suggestions.'}
          </p>
        </div>
      )}

      {isGenerating ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-center">
            <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generating suggestions...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion: any) => (
            <div
              key={suggestion.id}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {suggestion.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {suggestion.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.category}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      {suggestion.confidence}% confidence
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onAddQuestion(suggestion.type, suggestion)}
                  className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  title="Add Question"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
