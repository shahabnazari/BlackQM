'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface TemplateLibraryProps {
  onSelectTemplate: (template: any) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate
}) => {
  const templates = [
    {
      id: 'customer-1',
      name: 'Customer Satisfaction Survey',
      description: 'Measure customer satisfaction with your product or service',
      questionCount: 10,
      category: 'Customer Feedback'
    },
    {
      id: 'employee-1',
      name: 'Employee Engagement Survey',
      description: 'Assess employee satisfaction and engagement levels',
      questionCount: 15,
      category: 'HR'
    },
    {
      id: 'market-1',
      name: 'Market Research Survey',
      description: 'Gather insights about your target market',
      questionCount: 12,
      category: 'Market Research'
    },
    {
      id: 'academic-1',
      name: 'Course Evaluation Survey',
      description: 'Evaluate course effectiveness and instructor performance',
      questionCount: 8,
      category: 'Education'
    },
    {
      id: 'health-1',
      name: 'Patient Satisfaction Survey',
      description: 'Measure patient experience and satisfaction',
      questionCount: 10,
      category: 'Healthcare'
    }
  ];

  return (
    <div className="p-4">
      <div className="grid gap-3">
        {templates.map((template: any) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {template.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {template.questionCount} questions
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    {template.category}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};