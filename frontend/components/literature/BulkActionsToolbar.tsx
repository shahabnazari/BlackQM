/**
 * Bulk Actions Toolbar Component
 * Toolbar for performing actions on multiple selected papers
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module BulkActionsToolbar
 */

'use client';

import React, { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

export interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  actions?: BulkAction[];
  showSelectAll?: boolean;
}

// ============================================================================
// Bulk Actions Toolbar Component
// ============================================================================

export const BulkActionsToolbar = React.memo(function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  actions = [],
  showSelectAll = true,
}: BulkActionsToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const handleSelectAll = useCallback(() => {
    if (allSelected && onClearSelection) {
      onClearSelection();
    } else if (onSelectAll) {
      onSelectAll();
    }
  }, [allSelected, onSelectAll, onClearSelection]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} selected
            </span>
          </div>

          {showSelectAll && onSelectAll && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              {allSelected ? 'Deselect all' : `Select all ${totalCount}`}
            </button>
          )}

          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map(action => {
              const variantStyles = {
                default:
                  'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                primary:
                  'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
                danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
              };

              const buttonStyle = variantStyles[action.variant || 'default'];

              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default BulkActionsToolbar;
