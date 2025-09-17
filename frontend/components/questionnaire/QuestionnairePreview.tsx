'use client';

import React from 'react';
import { Question } from '@/lib/stores/questionnaire.store';

interface QuestionnairePreviewProps {
  questions: Question[];
}

export const QuestionnairePreview: React.FC<QuestionnairePreviewProps> = ({ questions }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Questionnaire Preview
      </h3>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {index + 1}.
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {question.text}
                  {question.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </p>
                <div className="mt-2">
                  {renderQuestionInput(question)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function renderQuestionInput(question: Question) {
  switch (question.type) {
    case 'text_short':
      return (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
          placeholder="Your answer..."
          disabled
        />
      );
    case 'text_long':
      return (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
          rows={3}
          placeholder="Your answer..."
          disabled
        />
      );
    case 'multiple_choice_single':
      return (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`question-${question.id}`}
                disabled
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.text}
              </span>
            </label>
          ))}
        </div>
      );
    case 'multiple_choice_multi':
      return (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.text}
              </span>
            </label>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
          disabled
        >
          <option>Select an option...</option>
          {question.options?.map((option, idx) => (
            <option key={idx} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
      );
    case 'rating_scale':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              disabled
              className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
            >
              {rating}
            </button>
          ))}
        </div>
      );
    default:
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Preview not available for {question.type}
        </div>
      );
  }
}