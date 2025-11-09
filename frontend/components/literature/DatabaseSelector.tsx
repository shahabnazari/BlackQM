/**
 * Database Selector Component
 * Multi-database selection for literature search
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module DatabaseSelector
 */

'use client';

import React, { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Database {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface DatabaseSelectorProps {
  databases: Database[];
  selectedDatabases: string[];
  onSelectionChange: (selected: string[]) => void;
  multiSelect?: boolean;
  showCounts?: boolean;
}

const DEFAULT_DATABASES: Database[] = [
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'Biomedical and life sciences literature',
  },
  {
    id: 'semantic_scholar',
    name: 'Semantic Scholar',
    description: 'AI-powered academic search',
  },
  {
    id: 'arxiv',
    name: 'arXiv',
    description: 'Open-access preprints',
  },
  {
    id: 'google_scholar',
    name: 'Google Scholar',
    description: 'Comprehensive academic search',
  },
];

// ============================================================================
// Database Selector Component
// ============================================================================

export const DatabaseSelector = React.memo(function DatabaseSelector({
  databases = DEFAULT_DATABASES,
  selectedDatabases,
  onSelectionChange,
  multiSelect = true,
  showCounts = false,
}: DatabaseSelectorProps) {
  const handleToggle = useCallback(
    (databaseId: string) => {
      if (multiSelect) {
        const newSelection = selectedDatabases.includes(databaseId)
          ? selectedDatabases.filter(id => id !== databaseId)
          : [...selectedDatabases, databaseId];
        onSelectionChange(newSelection);
      } else {
        onSelectionChange([databaseId]);
      }
    },
    [selectedDatabases, onSelectionChange, multiSelect]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedDatabases.length === databases.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(databases.map(db => db.id));
    }
  }, [selectedDatabases, databases, onSelectionChange]);

  const isSelected = useCallback(
    (databaseId: string) => selectedDatabases.includes(databaseId),
    [selectedDatabases]
  );

  const allSelected = selectedDatabases.length === databases.length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Databases</h3>
        {multiSelect && (
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Database List */}
      <div className="space-y-2">
        {databases.map(database => {
          const selected = isSelected(database.id);
          return (
            <button
              key={database.id}
              onClick={() => handleToggle(database.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Database Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {database.name}
                    </p>
                    {showCounts && database.count !== undefined && (
                      <span className="text-xs text-gray-500">
                        {database.count.toLocaleString()} papers
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {database.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="text-xs text-gray-500">
        {selectedDatabases.length} of {databases.length} databases selected
      </div>
    </div>
  );
});

export default DatabaseSelector;
