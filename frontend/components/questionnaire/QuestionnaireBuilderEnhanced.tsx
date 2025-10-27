'use client';

import { questionTypesByCategory } from '@/lib/data/question-types';
import { getTemplateQuestions } from '@/lib/data/questionnaire-templates';
import { useQuestionnaireStore } from '@/lib/stores/questionnaire.store';
import { QuestionType } from '@/lib/types/questionnaire';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Eye,
  FileText,
  GitBranch,
  Grid3x3,
  Library,
  List,
  Maximize2,
  Minimize2,
  Package,
  Plus,
  Redo,
  Save,
  Search,
  Sparkles,
  Trash2,
  Undo,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Import sub-components (we'll create stubs for these)
import { AIQuestionSuggestions } from './AIQuestionSuggestions';
import { ImportExportModal } from './ImportExportModal';
import { QuestionBankPanel } from './QuestionBankPanel';
import { QuestionEditor } from './QuestionEditor';
import { QuestionnairePreview } from './QuestionnairePreview';
import { SkipLogicBuilder } from './SkipLogicBuilder';
import { SortableQuestionItem } from './SortableQuestionItem';
import { TemplateLibrary } from './TemplateLibrary';

interface QuestionnaireBuilderEnhancedProps {
  surveyId: string;
  onSave?: () => void;
  onPublish?: () => void;
}

export const QuestionnaireBuilderEnhanced: React.FC<
  QuestionnaireBuilderEnhancedProps
> = ({ surveyId: _surveyId, onSave, onPublish }) => {
  const {
    questions,
    selectedQuestionIds,
    undoStack,
    redoStack,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    selectQuestion,
    deselectQuestion,
    clearSelection,
    bulkDeleteQuestions,
    copyQuestions,
    undo,
    redo,
    importQuestions,
  } = useQuestionnaireStore();

  // Panel visibility states
  const [leftPanelView, setLeftPanelView] = useState<
    'library' | 'templates' | 'bank'
  >('library');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<
    'preview' | 'logic' | 'ai'
  >('ai');

  // UI states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showImportExport, setShowImportExport] = useState(false);
  const [selectedQuestionForLogic, setSelectedQuestionForLogic] = useState<
    string | null
  >(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [useOverlayMode, setUseOverlayMode] = useState(false);

  // Handle drag end for reordering questions
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderQuestions(oldIndex, newIndex);
    }
  };

  // Add a new question
  const handleAddQuestion = (type: QuestionType, data?: any) => {
    const newQuestion = addQuestion(type);

    // If data is provided (from AI suggestions), update the question
    if (data) {
      updateQuestion(newQuestion.id, {
        text: data.text || 'New Question',
        options: data.options,
        config: data.settings,
        validation: data.validation,
        skipLogic: data.logic,
      });
    }

    setEditingQuestionId(newQuestion.id);
  };

  // Add questions from template
  const handleAddFromTemplate = (template: any) => {
    const templateQuestions = getTemplateQuestions(template.id);

    if (templateQuestions.length === 0) {
      // Fallback to template.questions if no predefined questions
      if (template.questions && template.questions.length > 0) {
        template.questions.forEach((q: any) => {
          addQuestion(q.type, undefined, q);
        });
      } else {
        console.log('Template has no questions defined');
      }
    } else {
      // Add each question from the template
      templateQuestions.forEach((q: any) => {
        const newQuestion = addQuestion(q.type);
        // Update the question with template data
        updateQuestion(newQuestion.id, {
          text: q.text,
          required: q.required,
          options: q.options,
          config: q.settings,
          validation: q.validation,
        });
      });
    }
  };

  // Add question from bank
  const handleAddFromBank = (bankQuestion: any) => {
    const newQuestion = addQuestion(bankQuestion.type, undefined, bankQuestion);
    setEditingQuestionId(newQuestion.id);
  };

  // Handle bulk actions
  const handleBulkAction = (action: 'delete' | 'copy' | 'export') => {
    const selectedIds = Array.from(selectedQuestionIds);

    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedIds.length} question(s)?`)) {
          bulkDeleteQuestions(selectedIds);
          clearSelection();
        }
        break;
      case 'copy':
        copyQuestions(selectedIds);
        clearSelection();
        break;
      case 'export':
        setShowImportExport(true);
        break;
    }
  };

  // Filter question types based on search and category
  const filteredQuestionTypes = useCallback(() => {
    let types = Object.entries(questionTypesByCategory);

    if (selectedCategory) {
      types = types.filter(([category]) => category === selectedCategory);
    }

    if (searchQuery) {
      types = types
        .map(
          ([category, items]) =>
            [
              category,
              items.filter(
                item =>
                  item.label
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  item.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              ),
            ] as [string, typeof items]
        )
        .filter(([_, items]) => items.length > 0);
    }

    return types;
  }, [selectedCategory, searchQuery]);

  // Responsive layout management
  useEffect(() => {
    const checkViewport = () => {
      setUseOverlayMode(window.innerWidth < 1440);
      // Auto-close panels on small screens if both are open
      if (window.innerWidth < 1024 && showLeftPanel && showRightPanel) {
        setShowRightPanel(false);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [showLeftPanel, showRightPanel]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto overflow-y-hidden relative">
      {/* Backdrop for overlay mode */}
      {useOverlayMode && (showLeftPanel || showRightPanel) && (
        <div
          className="absolute inset-0 bg-black/50 z-10"
          onClick={() => {
            setShowLeftPanel(false);
            setShowRightPanel(false);
          }}
        />
      )}

      {/* LEFT PANEL - Library / Templates / Bank */}
      <AnimatePresence>
        {showLeftPanel && !isFullScreen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
            className={cn(
              'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative z-15',
              'w-64 lg:w-72 xl:w-80 flex-shrink-0',
              useOverlayMode && 'absolute left-0 top-0 bottom-0 z-20 shadow-xl'
            )}
          >
            {/* Panel Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setLeftPanelView('library')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    leftPanelView === 'library'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Library className="w-4 h-4" />
                    <span>Library</span>
                  </div>
                  {leftPanelView === 'library' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>

                <button
                  onClick={() => setLeftPanelView('templates')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    leftPanelView === 'templates'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Templates</span>
                  </div>
                  {leftPanelView === 'templates' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>

                <button
                  onClick={() => setLeftPanelView('bank')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    leftPanelView === 'bank'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>Bank</span>
                  </div>
                  {leftPanelView === 'bank' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {leftPanelView === 'library' && (
                <>
                  {/* Search and Filter */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search question types..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          !selectedCategory
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                        )}
                      >
                        All
                      </button>
                      {Object.keys(questionTypesByCategory).map(
                        (category: any) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                              'px-2 py-1 text-xs rounded-md transition-colors',
                              selectedCategory === category
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                            )}
                          >
                            {category}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Question Types List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {filteredQuestionTypes().map(([category, items]) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          {category}
                        </h3>
                        <div className="space-y-1">
                          {items.map((item: any) => (
                            <button
                              key={item.type}
                              onClick={() => handleAddQuestion(item.type)}
                              className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                            >
                              <span className="text-xl mt-0.5">
                                {item.icon}
                              </span>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.description}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {leftPanelView === 'templates' && (
                <TemplateLibrary onSelectTemplate={handleAddFromTemplate} />
              )}

              {leftPanelView === 'bank' && (
                <QuestionBankPanel onSelectQuestion={handleAddFromBank} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER PANEL - Canvas */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ minWidth: '800px' }}
      >
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 relative z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle Left Panel"
              >
                {showLeftPanel ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              <button
                onClick={() => undo()}
                disabled={undoStack.length === 0}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Undo"
              >
                <Undo className="w-5 h-5" />
              </button>

              <button
                onClick={() => redo()}
                disabled={redoStack.length === 0}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Redo"
              >
                <Redo className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              <button
                onClick={() =>
                  setViewMode(viewMode === 'list' ? 'grid' : 'list')
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} View`}
              >
                {viewMode === 'list' ? (
                  <Grid3x3 className="w-5 h-5" />
                ) : (
                  <List className="w-5 h-5" />
                )}
              </button>

              {selectedQuestionIds.size > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedQuestionIds.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('copy')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy Selected"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
                    title="Delete Selected"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImportExport(true)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span className="text-sm">Import/Export</span>
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle Right Panel"
              >
                {showRightPanel ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => {
                  setIsFullScreen(!isFullScreen);
                  if (!isFullScreen) {
                    setShowLeftPanel(false);
                    setShowRightPanel(false);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              <button
                onClick={onSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span className="text-sm">Save</span>
              </button>

              <button
                onClick={onPublish}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 bg-gray-50 dark:bg-gray-900">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
                <Plus className="w-12 h-12 mb-4 mx-auto" />
                <p className="text-lg font-medium text-center">
                  Start Building Your Questionnaire
                </p>
                <p className="text-sm mt-2 text-center max-w-sm">
                  Choose from the question library, select a template, or use AI
                  suggestions to get started
                </p>
                <div className="flex flex-col space-y-2 mt-6">
                  <button
                    onClick={() => setLeftPanelView('library')}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Library className="w-4 h-4" />
                    <span className="text-sm">Browse Question Types</span>
                  </button>
                  <button
                    onClick={() => setLeftPanelView('templates')}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Use a Template</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowRightPanel(true);
                      setRightPanelView('ai');
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-blue-600 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Open AI Assistant</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-none">
              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q: any) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={cn(
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                        : 'space-y-3'
                    )}
                  >
                    {questions.map((question, index) => (
                      <div key={question.id} className="relative group">
                        <SortableQuestionItem
                          question={question}
                          index={index}
                          isSelected={selectedQuestionIds.has(question.id)}
                          onSelect={() => {
                            if (selectedQuestionIds.has(question.id)) {
                              deselectQuestion(question.id);
                            } else {
                              selectQuestion(question.id);
                            }
                          }}
                          onEdit={() => setEditingQuestionId(question.id)}
                          onDuplicate={() => duplicateQuestion(question.id)}
                          onDelete={() => deleteQuestion(question.id)}
                          viewMode={viewMode}
                        />
                        {/* Skip Logic Indicator */}
                        {question.skipLogic &&
                          Object.keys(question.skipLogic).length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedQuestionForLogic(question.id);
                                setRightPanelView('logic');
                                setShowRightPanel(true);
                              }}
                              className="absolute top-2 right-12 p-1.5 bg-purple-100 text-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Skip Logic"
                            >
                              <GitBranch className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null} className="z-[60]">
                  {/* Drag overlay content */}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Preview / Logic / AI */}
      <AnimatePresence>
        {showRightPanel && !isFullScreen && (
          <motion.div
            initial={{ x: 384 }}
            animate={{ x: 0 }}
            exit={{ x: 384 }}
            transition={{ type: 'spring', damping: 25 }}
            className={cn(
              'bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative z-25',
              'w-72 lg:w-80 xl:w-96 flex-shrink-0',
              useOverlayMode && 'absolute right-0 top-0 bottom-0 z-40 shadow-xl'
            )}
          >
            {/* Panel Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setRightPanelView('preview')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    rightPanelView === 'preview'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </div>
                  {rightPanelView === 'preview' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>

                <button
                  onClick={() => setRightPanelView('logic')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    rightPanelView === 'logic'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <GitBranch className="w-4 h-4" />
                    <span>Skip Logic</span>
                  </div>
                  {rightPanelView === 'logic' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>

                <button
                  onClick={() => setRightPanelView('ai')}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                    rightPanelView === 'ai'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Assistant</span>
                  </div>
                  {rightPanelView === 'ai' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelView === 'preview' && (
                <div className="h-full overflow-y-auto">
                  <QuestionnairePreview questions={questions} />
                </div>
              )}

              {rightPanelView === 'logic' && (
                <SkipLogicBuilder
                  questions={questions}
                  selectedQuestionId={selectedQuestionForLogic}
                  onUpdateLogic={(questionId, logic) => {
                    const question = questions.find(q => q.id === questionId);
                    if (question) {
                      updateQuestion(questionId, {
                        ...question,
                        skipLogic: logic,
                      });
                    }
                  }}
                />
              )}

              {rightPanelView === 'ai' && (
                <div className="h-full overflow-y-auto">
                  <AIQuestionSuggestions
                    surveyContext={{
                      title: 'Survey Title',
                      existingQuestions: questions,
                      category: selectedCategory,
                    }}
                    onAddQuestion={handleAddQuestion}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals - Highest z-index layer */}
      {showImportExport && (
        <div className="fixed inset-0 z-50">
          <ImportExportModal
            questions={questions}
            onImport={importQuestions}
            onClose={() => setShowImportExport(false)}
          />
        </div>
      )}

      {/* Editing Modal */}
      {editingQuestionId && (
        <div className="fixed inset-0 z-50">
          <QuestionEditor
            question={questions.find(q => q.id === editingQuestionId)!}
            onSave={updated => {
              updateQuestion(editingQuestionId, updated);
              setEditingQuestionId(null);
            }}
            onCancel={() => setEditingQuestionId(null)}
            onDelete={() => {
              deleteQuestion(editingQuestionId);
              setEditingQuestionId(null);
            }}
            questionTypes={Object.values(QuestionType)}
            existingQuestions={questions}
          />
        </div>
      )}
    </div>
  );
};
