'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  X,
  FlaskConical,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { hypothesisToItemsApiService } from '@/lib/api/services/hypothesis-to-items-api.service';
import type {
  HypothesisToItemsModalProps,
  HypothesisToItemRequest,
  HypothesisToItemResult,
  HypothesisVariable,
} from '@/lib/types/questionnaire-import.types';

/**
 * Phase 10 Day 5.11: Hypothesis to Items Modal
 *
 * 2-step wizard for converting hypotheses into testable survey items:
 * 1. Input & Configuration
 * 2. Review Test Battery & Select Items
 */
export const HypothesisToItemsModal: React.FC<HypothesisToItemsModalProps> = ({
  onClose,
  onImport,
}) => {
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Input
  const [hypothesis, setHypothesis] = useState('');
  const [hypothesisType, setHypothesisType] =
    useState<HypothesisToItemRequest['hypothesisType']>('correlational');
  const [itemsPerVariable, setItemsPerVariable] = useState(5);
  const [targetReliability, setTargetReliability] = useState(0.8);
  const [includeReverseItems, setIncludeReverseItems] = useState(true);
  const [studyContext, setStudyContext] = useState('');

  // Step 2: Results
  const [result, setResult] = useState<HypothesisToItemResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(
    new Set()
  );

  const handleGenerate = useCallback(async () => {
    if (!hypothesis.trim()) {
      toast.error('Please enter a hypothesis');
      return;
    }

    setIsGenerating(true);
    try {
      const request: HypothesisToItemRequest = {
        hypothesis,
        ...(hypothesisType && { hypothesisType }),
        itemsPerVariable,
        targetReliability,
        includeReverseItems,
        ...(studyContext.trim() && { studyContext: studyContext.trim() }),
      };

      const testBattery =
        await hypothesisToItemsApiService.convertHypothesisToItems(request);
      setResult(testBattery);

      // Auto-select all items
      const allItemIds = new Set(testBattery.allItems.map(item => item.id));
      setSelectedItems(allItemIds);

      // Expand first variable
      const firstVar = testBattery.variables[0];
      if (firstVar) {
        setExpandedVariables(new Set([firstVar.id]));
      }

      setStep('results');
      toast.success(`Generated ${testBattery.allItems.length} survey items`);
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(error.message || 'Failed to convert hypothesis');
    } finally {
      setIsGenerating(false);
    }
  }, [
    hypothesis,
    hypothesisType,
    itemsPerVariable,
    targetReliability,
    includeReverseItems,
    studyContext,
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

  const toggleVariable = (variableId: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableId)) {
        newSet.delete(variableId);
      } else {
        newSet.add(variableId);
      }
      return newSet;
    });
  };

  const handleImport = () => {
    if (!result || selectedItems.size === 0) {
      toast.warning('Please select at least one item to import');
      return;
    }

    const itemsToImport = result.allItems.filter(item =>
      selectedItems.has(item.id)
    );
    const variables = result.variables;

    const importableItems = itemsToImport.flatMap(item => {
      const variable = variables.find(v => v.id === item.variableId);
      return hypothesisToItemsApiService.convertToImportableItems(
        [item],
        variable?.name
      );
    });

    onImport(importableItems);
    toast.success(`Imported ${importableItems.length} items`);
    onClose();
  };

  const getVariableRoleBadgeColor = (role: HypothesisVariable['role']) => {
    const colors = {
      independent: 'bg-blue-100 text-blue-800',
      dependent: 'bg-green-100 text-green-800',
      moderator: 'bg-purple-100 text-purple-800',
      mediator: 'bg-pink-100 text-pink-800',
      covariate: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Hypothesis Test Battery Generator
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step === 'input'
                  ? 'Enter your hypothesis'
                  : 'Review and select survey items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Hypothesis Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Research Hypothesis *
                </label>
                <textarea
                  value={hypothesis}
                  onChange={e => setHypothesis(e.target.value)}
                  placeholder="e.g., Social media usage positively influences employee engagement, moderated by organizational support"
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Hypothesis Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hypothesis Type
                </label>
                <select
                  value={hypothesisType}
                  onChange={e => setHypothesisType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="correlational">
                    Correlational - Test relationship
                  </option>
                  <option value="causal">Causal - Test cause and effect</option>
                  <option value="mediation">
                    Mediation - Test indirect effect
                  </option>
                  <option value="moderation">
                    Moderation - Test interaction effect
                  </option>
                  <option value="interaction">
                    Interaction - Test combined effect
                  </option>
                </select>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items per Variable
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={itemsPerVariable}
                    onChange={e =>
                      setItemsPerVariable(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-10 items for reliability
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Reliability (α)
                  </label>
                  <select
                    value={targetReliability}
                    onChange={e =>
                      setTargetReliability(parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={0.7}>0.70 - Acceptable</option>
                    <option value={0.8}>0.80 - Good (Recommended)</option>
                    <option value={0.9}>0.90 - Excellent</option>
                  </select>
                </div>
              </div>

              {/* Study Context (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Context (Optional)
                </label>
                <input
                  type="text"
                  value={studyContext}
                  onChange={e => setStudyContext(e.target.value)}
                  placeholder="e.g., Healthcare industry, university students"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Reverse Items Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reverse-items"
                  checked={includeReverseItems}
                  onCheckedChange={checked => setIncludeReverseItems(!!checked)}
                />
                <label
                  htmlFor="reverse-items"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Include reverse-coded items (recommended for reliability)
                </label>
              </div>
            </div>
          )}

          {step === 'results' && result && (
            <div className="space-y-6">
              {/* Hypothesis Summary */}
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Hypothesis
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {result.hypothesis}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-purple-700 dark:text-purple-300 font-medium">
                    {result.hypothesisType}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {result.variables.length} variables •{' '}
                    {result.allItems.length} items
                  </span>
                </div>
              </Card>

              {/* Statistical Test Battery */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Statistical Test Plan
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Primary Analysis:
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.testBattery.primaryTest.method}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Sample Size:
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      N ≥ {result.testBattery.primaryTest.requiredSampleSize}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected Power:
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(
                        result.testBattery.primaryTest.expectedPower * 100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                </div>
              </Card>

              {/* Variables and Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Survey Items by Variable
                </h3>
                {result.variables.map(variable => {
                  const varItems = result.allItems.filter(
                    item => item.variableId === variable.id
                  );
                  const isExpanded = expandedVariables.has(variable.id);

                  return (
                    <Card key={variable.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleVariable(variable.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getVariableRoleBadgeColor(variable.role)}`}
                          >
                            {variable.role.toUpperCase()}
                          </span>
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {variable.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {varItems.length} items
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                          {varItems.map(item => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                            >
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() =>
                                  toggleItemSelection(item.id)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {item.text}
                                </p>
                                {item.reversed && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded">
                                    Reverse-coded
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Quality Metrics */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quality Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(result.qualityMetrics.overallReliability * 100).toFixed(
                        0
                      )}
                      %
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Reliability
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(result.qualityMetrics.constructCoverage * 100).toFixed(
                        0
                      )}
                      %
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Coverage
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(result.qualityMetrics.validityScore * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Validity
                    </p>
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItems.size} of {result?.allItems.length || 0} items
                  selected
                </div>
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
                    disabled={isGenerating || !hypothesis.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Generate Test Battery
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
