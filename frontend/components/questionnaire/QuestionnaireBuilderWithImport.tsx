'use client';

import React, { useState, useMemo, useCallback } from 'react';
// Import everything from the original QuestionnaireBuilderPro
import { QuestionnaireBuilderPro } from './QuestionnaireBuilderPro';
import { ImportManager } from './ImportManager';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import type {
  QuestionnaireData,
  ImportableItem,
  QuestionnaireBuilderWithImportProps,
} from '@/lib/types/questionnaire-import.types';

/**
 * QuestionnaireBuilderWithImport
 *
 * Enhanced version of QuestionnaireBuilderPro that includes import functionality
 * from Phase 10 Day 5.9-5.13 implementation.
 *
 * This wrapper component adds:
 * - Import button in toolbar
 * - ImportManager modal system
 * - Integration with theme-to-survey conversion
 * - Future support for research question and hypothesis imports
 */
export const QuestionnaireBuilderWithImport: React.FC<
  QuestionnaireBuilderWithImportProps
> = props => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedItems, setImportedItems] = useState<ImportableItem[]>([]);

  const handleImport = useCallback((items: ImportableItem[]) => {
    try {
      // Validate items before import
      if (!Array.isArray(items) || items.length === 0) {
        toast.error('No valid items to import');
        return;
      }

      // Store imported items in state
      setImportedItems(prev => [...prev, ...items]);

      // Show success message
      toast.success(`Successfully imported ${items.length} items`);
      setShowImportModal(false);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import items. Please try again.');
    }
  }, []);

  // Create an enhanced initial data that includes imported items
  // This creates a new object without mutating the original props
  const enhancedInitialData = useMemo((): QuestionnaireData | undefined => {
    if (!props.initialData && importedItems.length === 0) {
      return undefined;
    }

    // Create a deep copy to avoid mutations
    const baseData: QuestionnaireData = props.initialData
      ? JSON.parse(JSON.stringify(props.initialData))
      : {
          title: 'New Questionnaire',
          description: '',
          questions: [],
          settings: {
            showProgressBar: true,
            allowBackNavigation: true,
            autoSave: false,
          },
        };

    // Add imported items to questions
    if (importedItems.length > 0) {
      baseData.questions = [...(baseData.questions || []), ...importedItems];
    }

    return baseData;
  }, [props.initialData, importedItems]);

  return (
    <>
      {/* Render the original QuestionnaireBuilderPro with enhanced data */}
      <div className="relative">
        {/* Floating Import Button */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            onClick={() => setShowImportModal(true)}
            variant="default"
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="w-4 h-4" />
            Import Items
          </Button>
        </div>

        {/* Original Builder */}
        <QuestionnaireBuilderPro {...props} initialData={enhancedInitialData} />
      </div>

      {/* Import Manager Modal */}
      <ImportManager
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  );
};

/**
 * Export a convenience function to use this enhanced builder
 * in place of the original QuestionnaireBuilderPro
 */
export const useEnhancedQuestionnaireBuilder = () => {
  return QuestionnaireBuilderWithImport;
};
