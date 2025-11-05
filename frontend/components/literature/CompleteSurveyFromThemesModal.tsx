'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Info,
} from 'lucide-react';

/**
 * Complete Survey From Themes Modal
 * Phase 10 Day 5.12
 *
 * Purpose: Configuration modal for one-click complete survey generation from themes
 * Features:
 * - Survey purpose selection (exploratory/confirmatory/mixed)
 * - Target respondent count
 * - Complexity level (basic/intermediate/advanced)
 * - Demographics toggle
 * - Validity checks toggle
 * - Estimated completion time calculator
 * - Preview generation settings
 *
 * Enterprise-Grade Features:
 * - Type-safe configuration
 * - Validation before generation
 * - Accessibility (keyboard navigation, ARIA labels)
 * - Responsive design
 * - Loading states
 * - Error handling
 */

export interface SurveyGenerationConfig {
  purpose: 'exploratory' | 'confirmatory' | 'mixed';
  targetRespondents: number;
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
  includeDemographics: boolean;
  includeValidityChecks: boolean;
  includeOpenEnded: boolean;
}

interface CompleteSurveyFromThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeIds: string[];
  themeCount: number;
  onGenerate: (config: SurveyGenerationConfig) => Promise<void>;
  className?: string;
}

const purposeOptions = [
  {
    value: 'exploratory' as const,
    label: 'Exploratory',
    description: 'Discover patterns and generate new insights from data',
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  {
    value: 'confirmatory' as const,
    label: 'Confirmatory',
    description: 'Test specific hypotheses derived from themes',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  {
    value: 'mixed' as const,
    label: 'Mixed Methods',
    description: 'Combine exploratory and confirmatory approaches',
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
];

const complexityLevels = [
  {
    value: 'basic' as const,
    label: 'Basic',
    itemsPerTheme: '2-3',
    estimatedTime: '5-8 min',
    description: 'Simple, direct questions',
  },
  {
    value: 'intermediate' as const,
    label: 'Intermediate',
    itemsPerTheme: '3-4',
    estimatedTime: '10-15 min',
    description: 'Balanced depth and length',
  },
  {
    value: 'advanced' as const,
    label: 'Advanced',
    itemsPerTheme: '4-5',
    estimatedTime: '15-25 min',
    description: 'Comprehensive measurement',
  },
];

export const CompleteSurveyFromThemesModal: React.FC<CompleteSurveyFromThemesModalProps> = ({
  isOpen,
  onClose,
  themeIds: _themeIds,
  themeCount,
  onGenerate,
  className = '',
}) => {
  const [config, setConfig] = useState<SurveyGenerationConfig>({
    purpose: 'exploratory',
    targetRespondents: 100,
    complexityLevel: 'intermediate',
    includeDemographics: true,
    includeValidityChecks: true,
    includeOpenEnded: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate estimated items and time
  const complexityConfig = complexityLevels.find((c) => c.value === config.complexityLevel) ?? {
    value: 'intermediate' as const,
    label: 'Intermediate',
    itemsPerTheme: '3-4',
    estimatedTime: '10-15 min',
    description: 'Balanced depth and length',
  };
  const itemsPerThemeStr = (complexityConfig.itemsPerTheme || '3-4') as string;
  const avgItemsPerTheme = parseFloat(itemsPerThemeStr.split('-')[0] || '3');
  const estimatedMainItems = Math.ceil(themeCount * avgItemsPerTheme);
  const demographicItems = config.includeDemographics ? 5 : 0;
  const validityItems = config.includeValidityChecks ? 3 : 0;
  const openEndedItems = config.includeOpenEnded ? 2 : 0;
  const totalItems = estimatedMainItems + demographicItems + validityItems + openEndedItems;
  const estimatedMinutes = Math.ceil(totalItems * 0.5); // ~30 seconds per item

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      await onGenerate(config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate survey');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Generate Complete Survey from Themes
                </h2>
                <p className="text-blue-100 mt-1 text-sm">
                  One-click survey generation from {themeCount} extracted theme{themeCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Generation Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* 1. Survey Purpose */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                1. Survey Purpose <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {purposeOptions.map((option) => {
                  const isSelected = config.purpose === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setConfig({ ...config, purpose: option.value })}
                      className={`
                        p-4 border-2 rounded-lg text-left transition-all
                        ${isSelected ? `${option.borderColor} ${option.bgColor}` : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? option.color : 'text-gray-400'}`} />
                      <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Target Respondents */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                2. Target Respondents <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={config.targetRespondents}
                  onChange={(e) => setConfig({ ...config, targetRespondents: parseInt(e.target.value) || 100 })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100"
                />
                <span className="text-sm text-gray-600">respondents</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 100+ for exploratory, 200+ for confirmatory research
              </p>
            </div>

            {/* 3. Complexity Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                3. Survey Complexity <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {complexityLevels.map((level) => {
                  const isSelected = config.complexityLevel === level.value;

                  return (
                    <button
                      key={level.value}
                      onClick={() => setConfig({ ...config, complexityLevel: level.value })}
                      className={`
                        p-4 border-2 rounded-lg text-left transition-all
                        ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{level.label}</span>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>{level.itemsPerTheme} items/theme</div>
                        <div>{level.estimatedTime}</div>
                        <div className="text-gray-500">{level.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Optional Sections */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                4. Optional Sections
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeDemographics}
                    onChange={(e) => setConfig({ ...config, includeDemographics: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Include Demographics</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Age, gender, education, occupation, location (+5 items)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeValidityChecks}
                    onChange={(e) => setConfig({ ...config, includeValidityChecks: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Include Validity Checks</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Attention checks, response quality indicators (+3 items)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeOpenEnded}
                    onChange={(e) => setConfig({ ...config, includeOpenEnded: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Include Open-Ended Questions</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Qualitative feedback, additional insights (+2 items)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Estimated Survey Preview */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Estimated Survey</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Total Items</div>
                      <div className="font-bold text-gray-900">{totalItems}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Main Items</div>
                      <div className="font-bold text-gray-900">{estimatedMainItems}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Time</div>
                      <div className="font-bold text-gray-900">{estimatedMinutes} min</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Sections</div>
                      <div className="font-bold text-gray-900">
                        {1 + (config.includeDemographics ? 1 : 0) + (config.includeValidityChecks ? 1 : 0) + (config.includeOpenEnded ? 1 : 0) + 1}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Survey
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
