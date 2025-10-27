'use client';

import React from 'react';
import { Question } from '@/lib/types/questionnaire';

interface SkipLogicBuilderProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onUpdateLogic: (questionId: string, logic: any) => void;
}

export const SkipLogicBuilder: React.FC<SkipLogicBuilderProps> = ({
  questions,
  selectedQuestionId,
  onUpdateLogic
}) => {
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  if (!selectedQuestion) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Select a question to configure skip logic
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Skip Logic Builder
      </h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedQuestion.text}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Condition
          </h4>
          <button
            onClick={() => {
              // Add logic here
              if (selectedQuestionId) {
                onUpdateLogic(selectedQuestionId, {
                  conditions: []
                });
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Skip Logic Condition
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Configure conditions to show, hide, or skip questions based on responses.
        </div>
      </div>
    </div>
  );
};