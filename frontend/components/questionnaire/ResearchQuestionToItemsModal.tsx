'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  X,
  Brain,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';
import { researchQuestionToItemsApiService } from '@/lib/api/services/research-question-to-items-api.service';
import { SPSSExportUtil } from '@/lib/utils/spss-export.util';
import { AnalysisPlanExportUtil } from '@/lib/utils/analysis-plan-export.util';
import type {
  ResearchQuestionToItemsModalProps,
  OperationalizationRequest,
  OperationalizationResult,
  ResearchQuestionConstruct,
} from '@/lib/types/questionnaire-import.types';

/**
 * Phase 10 Day 5.10: Research Question to Items Modal
 *
 * 3-step wizard for operationalizing research questions:
 * 1. Input & Configuration
 * 2. Review Constructs & Variables
 * 3. Select Survey Items to Import
 */
export const ResearchQuestionToItemsModal: React.FC<
  ResearchQuestionToItemsModalProps
> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<'input' | 'results' | 'select'>('input');
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Input
  const [researchQuestion, setResearchQuestion] = useState('');
  const [studyType, setStudyType] =
    useState<OperationalizationRequest['studyType']>('exploratory');
  const [methodology, setMethodology] = useState<
    'survey' | 'experiment' | 'mixed_methods'
  >('survey');
  const [itemsPerVariable, setItemsPerVariable] = useState(5);
  const [includeReverseItems, setIncludeReverseItems] = useState(true);

  // Step 2 & 3: Results
  const [result, setResult] = useState<OperationalizationResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedConstructs, setExpandedConstructs] = useState<Set<string>>(
    new Set()
  );

  const handleGenerate = useCallback(async () => {
    if (!researchQuestion.trim()) {
      toast.error('Please enter a research question');
      return;
    }

    setIsGenerating(true);
    try {
      const request: OperationalizationRequest = {
        researchQuestion,
        studyType,
        methodology,
        itemsPerVariable,
        includeReverseItems,
      };

      const operationalizationResult =
        await researchQuestionToItemsApiService.operationalizeQuestion(request);
      setResult(operationalizationResult);

      // Auto-select all items
      const allItemIds = new Set(
        operationalizationResult.measurementItems.map(item => item.id)
      );
      setSelectedItems(allItemIds);

      // Expand first construct
      const firstConstruct = operationalizationResult.constructs[0];
      if (firstConstruct) {
        setExpandedConstructs(new Set([firstConstruct.id]));
      }

      setStep('results');
      toast.success(
        `Generated ${operationalizationResult.measurementItems.length} survey items`
      );
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(error.message || 'Failed to operationalize question');
    } finally {
      setIsGenerating(false);
    }
  }, [
    researchQuestion,
    studyType,
    methodology,
    itemsPerVariable,
    includeReverseItems,
  ]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleConstruct = (constructId: string) => {
    setExpandedConstructs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(constructId)) {
        newSet.delete(constructId);
      } else {
        newSet.add(constructId);
      }
      return newSet;
    });
  };

  const handleImport = () => {
    if (!result || selectedItems.size === 0) {
      toast.warning('Please select at least one item to import');
      return;
    }

    const itemsToImport = result.measurementItems.filter(item =>
      selectedItems.has(item.id)
    );
    const constructs = result.constructs;

    const importableItems = itemsToImport.flatMap(item => {
      const construct = constructs.find(c => c.id === item.constructId);
      return researchQuestionToItemsApiService.convertToImportableItems(
        [item],
        construct?.name
      );
    });

    onImport(importableItems);
    toast.success(`Imported ${importableItems.length} items`);
    onClose();
  };

  const handleExportSPSS = useCallback(() => {
    if (!result) return;

    try {
      SPSSExportUtil.downloadSyntax(result);
      toast.success('SPSS syntax file downloaded');
    } catch (error) {
      console.error('SPSS export failed:', error);
      toast.error('Failed to export SPSS syntax');
    }
  }, [result]);

  const handleExportAnalysisPlan = useCallback(() => {
    if (!result) return;

    try {
      AnalysisPlanExportUtil.downloadTextPlan(result);
      toast.success('Analysis plan downloaded');
    } catch (error) {
      console.error('Analysis plan export failed:', error);
      toast.error('Failed to export analysis plan');
    }
  }, [result]);

  const handleExportJSON = useCallback(() => {
    if (!result) return;

    try {
      AnalysisPlanExportUtil.downloadJSONPlan(result);
      toast.success('JSON file downloaded');
    } catch (error) {
      console.error('JSON export failed:', error);
      toast.error('Failed to export JSON');
    }
  }, [result]);

  const getConstructTypeBadgeColor = (
    type: ResearchQuestionConstruct['type']
  ) => {
    const colors = {
      independent_variable: 'bg-blue-100 text-blue-800',
      dependent_variable: 'bg-green-100 text-green-800',
      moderator: 'bg-purple-100 text-purple-800',
      mediator: 'bg-pink-100 text-pink-800',
      control: 'bg-gray-100 text-gray-800',
      outcome: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Operationalize Research Question
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Convert theoretical questions into measurable survey items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Research Question Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Research Question *
                </label>
                <textarea
                  value={researchQuestion}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setResearchQuestion(e.target.value)
                  }
                  placeholder="e.g., How does leadership style affect team innovation in remote work environments?"
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Study Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(
                    [
                      'exploratory',
                      'explanatory',
                      'evaluative',
                      'predictive',
                      'descriptive',
                    ] as const
                  ).map(type => (
                    <button
                      key={type}
                      onClick={() => setStudyType(type)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        studyType === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Methodology */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Methodology
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['survey', 'experiment', 'mixed_methods'] as const).map(
                    method => (
                      <button
                        key={method}
                        onClick={() => setMethodology(method)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          methodology === method
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Items Per Variable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Items per Variable: {itemsPerVariable}
                </label>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={itemsPerVariable}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setItemsPerVariable(parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3 (Quick)</span>
                  <span>5 (Reliable)</span>
                  <span>7 (High Reliability)</span>
                </div>
              </div>

              {/* Reverse Items */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="reverse-items"
                  checked={includeReverseItems}
                  onCheckedChange={checked =>
                    setIncludeReverseItems(checked as boolean)
                  }
                />
                <label
                  htmlFor="reverse-items"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Include reverse-coded items (recommended for reliability
                  checking)
                </label>
              </div>
            </div>
          )}

          {step === 'results' && result && (
            <div className="space-y-6">
              {/* Quality Metrics */}
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Constructs Identified
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {result.constructs.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Survey Items
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {result.measurementItems.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Expected Reliability (α)
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {result.qualityMetrics.reliabilityExpectation.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Constructs & Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Constructs & Measurement Items
                </h3>
                <div className="space-y-3">
                  {result.constructs.map(construct => {
                    const constructItems = result.measurementItems.filter(
                      item => item.constructId === construct.id
                    );
                    const isExpanded = expandedConstructs.has(construct.id);
                    const variable = result.variables.find(
                      v => v.constructId === construct.id
                    );

                    return (
                      <Card key={construct.id} className="overflow-hidden">
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => toggleConstruct(construct.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {construct.name}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${getConstructTypeBadgeColor(construct.type)}`}
                                  >
                                    {construct.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {construct.definition}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {constructItems.length} items
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                            {variable && (
                              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <div className="font-medium text-sm">
                                  {variable.variableName}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {variable.operationalDefinition}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Measurement: {variable.measurementLevel} |
                                  Expected α:{' '}
                                  {variable.reliability.expectedAlpha.toFixed(
                                    2
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              {constructItems.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded"
                                >
                                  <Checkbox
                                    checked={selectedItems.has(item.id)}
                                    onCheckedChange={() =>
                                      toggleItemSelection(item.id)
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        Item {item.itemNumber}:
                                      </span>
                                      <span className="text-sm">
                                        {item.text}
                                      </span>
                                      {item.reversed && (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                                          Reversed
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {item.psychometricNote}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Statistical Analysis Plan */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Recommended Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">
                      {result.statisticalPlan.primaryAnalysis.method}
                    </span>
                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                      {result.statisticalPlan.primaryAnalysis.description}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Recommended sample size: N ≥{' '}
                    {
                      result.statisticalPlan.primaryAnalysis
                        .sampleSizeRecommendation
                    }
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === 'results' && (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedItems.size} of{' '}
                    {result?.measurementItems.length || 0} items selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportSPSS}
                      className="gap-2"
                    >
                      <Code className="w-4 h-4" />
                      SPSS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAnalysisPlan}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Analysis Plan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJSON}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      JSON
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {step === 'input' && (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !researchQuestion.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Items
                      </>
                    )}
                  </Button>
                </>
              )}

              {step === 'results' && (
                <>
                  <Button variant="outline" onClick={() => setStep('input')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedItems.size === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Import {selectedItems.size} Items
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
