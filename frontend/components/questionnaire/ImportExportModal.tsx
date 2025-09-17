'use client';

import React from 'react';
import { X, Download, Upload } from 'lucide-react';
import { Question } from '@/lib/stores/questionnaire.store';

interface ImportExportModalProps {
  questions: Question[];
  onImport: (questions: Question[]) => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  questions,
  onImport,
  onClose
}) => {
  const [importText, setImportText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'import' | 'export'>('export');

  const handleExport = () => {
    const jsonString = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questionnaire.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importText);
      onImport(imported);
      onClose();
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Import/Export Questions
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Import
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your questionnaire as a JSON file. You can later import this file to restore your questions.
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Current questionnaire contains:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {questions.length} questions
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import questions from a JSON file. Paste the JSON content below:
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your JSON here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
              />
              <button
                onClick={handleImport}
                disabled={!importText}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Import Questions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};