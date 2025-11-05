'use client';

import React, { useState, useCallback } from 'react';
import { ImportSourceSelector, ImportSource } from './ImportSourceSelector';
import { ThemeImportModal } from './ThemeImportModal';
import { ResearchQuestionToItemsModal } from './ResearchQuestionToItemsModal';
import { HypothesisToItemsModal } from './HypothesisToItemsModal';
import { toast } from 'sonner';
import type {
  ImportManagerProps,
  ImportableItem,
} from '@/lib/types/questionnaire-import.types';

// Re-export the props interface
export type { ImportManagerProps };

/**
 * ImportManager Component
 *
 * Coordinates the import flow for questionnaire items from various sources.
 * Part of Phase 10 Day 5.9-5.13 implementation.
 *
 * Flow:
 * 1. User clicks "Import" button in questionnaire builder
 * 2. ImportSourceSelector modal opens showing available sources
 * 3. User selects a source (themes, research question, hypothesis, etc.)
 * 4. Appropriate import modal opens for that source
 * 5. Items are generated and imported into questionnaire
 */
export const ImportManager: React.FC<ImportManagerProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [currentModal, setCurrentModal] = useState<'selector' | ImportSource>(
    'selector'
  );

  if (!isOpen) return null;

  const handleSelectSource = (source: ImportSource) => {
    setCurrentModal(source);
  };

  const handleBackToSelector = useCallback(() => {
    setCurrentModal('selector');
  }, []);

  const handleImportComplete = useCallback(
    (items: ImportableItem[]) => {
      try {
        // Validate items before passing to parent
        if (!Array.isArray(items) || items.length === 0) {
          toast.warning('No items selected for import');
          return;
        }

        onImport(items);
        onClose();
      } catch (error) {
        console.error('Import completion failed:', error);
        toast.error('Failed to complete import');
      }
    },
    [onImport, onClose]
  );

  // Render source selector
  if (currentModal === 'selector') {
    return (
      <ImportSourceSelector
        onClose={onClose}
        onSelectSource={handleSelectSource}
      />
    );
  }

  // Render theme import modal
  if (currentModal === 'themes') {
    return (
      <ThemeImportModal
        onClose={handleBackToSelector}
        onImport={handleImportComplete}
      />
    );
  }

  // Phase 10 Day 5.10: Research Question Import Modal
  if (currentModal === 'research-question') {
    return (
      <ResearchQuestionToItemsModal
        onClose={handleBackToSelector}
        onImport={handleImportComplete}
      />
    );
  }

  // Day 5.11: Hypothesis Test Battery
  if (currentModal === 'hypothesis') {
    return (
      <HypothesisToItemsModal
        onClose={handleBackToSelector}
        onImport={handleImportComplete}
      />
    );
  }

  if (currentModal === 'complete-survey') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md">
          <h2 className="text-xl font-bold mb-4">Complete Survey Import</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This feature will be available in Day 5.12 implementation.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleBackToSelector}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={() => {
                toast.info('Complete survey import coming soon!');
                handleBackToSelector();
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: item bank and AI suggestions are disabled
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Feature Unavailable</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This import source is not yet available.
        </p>
        <button
          onClick={handleBackToSelector}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Import Options
        </button>
      </div>
    </div>
  );
};
