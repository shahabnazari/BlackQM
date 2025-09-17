'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Question } from '@/lib/stores/questionnaire.store';
import { QuestionType } from '@/lib/types/questionnaire';

interface QuestionEditorProps {
  question: Question;
  onSave: (updated: Partial<Question>) => void;
  onCancel: () => void;
  onDelete: () => void;
  questionTypes: QuestionType[];
  existingQuestions: Question[];
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  onDelete,
  questionTypes,
  existingQuestions
}) => {
  const [editedQuestion, setEditedQuestion] = React.useState<Question>(question);

  const handleSave = () => {
    onSave(editedQuestion);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Question
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question Text
            </label>
            <textarea
              value={editedQuestion.text}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question Type
            </label>
            <select
              value={editedQuestion.type}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, type: e.target.value as QuestionType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {questionTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Required */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedQuestion.required}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Required question
              </span>
            </label>
          </div>

          {/* Options (for choice questions) */}
          {(editedQuestion.type === QuestionType.MULTIPLE_CHOICE_SINGLE ||
            editedQuestion.type === QuestionType.MULTIPLE_CHOICE_MULTI ||
            editedQuestion.type === QuestionType.DROPDOWN) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {(editedQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...(editedQuestion.options || [])];
                        newOptions[index].text = e.target.value;
                        setEditedQuestion({ ...editedQuestion, options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Option text"
                    />
                    <button
                      onClick={() => {
                        const newOptions = editedQuestion.options?.filter((_, i) => i !== index);
                        setEditedQuestion({ ...editedQuestion, options: newOptions });
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(editedQuestion.options || []), { text: '', value: '' }];
                    setEditedQuestion({ ...editedQuestion, options: newOptions });
                  }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Question
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};