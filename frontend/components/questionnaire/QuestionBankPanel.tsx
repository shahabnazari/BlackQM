'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface QuestionBankPanelProps {
  onSelectQuestion: (question: any) => void;
}

export const QuestionBankPanel: React.FC<QuestionBankPanelProps> = ({
  onSelectQuestion
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const bankQuestions = [
    {
      id: 'bank-1',
      type: 'likert_scale',
      text: 'How satisfied are you with our service?',
      category: 'Satisfaction'
    },
    {
      id: 'bank-2',
      type: 'text_long',
      text: 'Please provide any additional feedback or suggestions.',
      category: 'Feedback'
    },
    {
      id: 'bank-3',
      type: 'net_promoter_score',
      text: 'How likely are you to recommend us to a friend or colleague?',
      category: 'NPS'
    }
  ];

  const filteredQuestions = bankQuestions.filter((q: any) =>
    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search question bank..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredQuestions.map((question: any) => (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question)}
              className="w-full text-left p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {question.text}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {question.category}
                </span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                  {question.type.replace(/_/g, ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};