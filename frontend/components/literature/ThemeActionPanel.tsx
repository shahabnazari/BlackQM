'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/utils/logger';
import {
  Lightbulb,
  FlaskConical,
  Network,
  FileText,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/**
 * Theme Action Panel Component
 * Phase 10 Day 5.12
 *
 * Purpose: Main interface for theme-based research design actions
 * Features:
 * - Quick action buttons for generating questions/hypotheses/surveys
 * - Theme selection interface
 * - Integration with Enhanced Theme Integration Service
 *
 * Enterprise UX: Clear visual hierarchy, loading states, error handling
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  keyPhrases?: string[];
  subthemes?: Array<{
    name: string;
    description: string;
  }>;
}

interface ThemeActionPanelProps {
  themes: Theme[];
  onGenerateQuestions?: (selectedThemes: Theme[]) => Promise<void>;
  onGenerateHypotheses?: (selectedThemes: Theme[]) => Promise<void>;
  onGenerateSurvey?: (selectedThemes: Theme[]) => Promise<void>;
  onMapConstructs?: (selectedThemes: Theme[]) => Promise<void>;
  className?: string;
}

export const ThemeActionPanel: React.FC<ThemeActionPanelProps> = ({
  themes,
  onGenerateQuestions,
  onGenerateHypotheses,
  onGenerateSurvey,
  onMapConstructs,
  className = '',
}) => {
  const [selectedThemeIds, setSelectedThemeIds] = useState<Set<string>>(
    new Set(themes.map(t => t.id))
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const toggleThemeSelection = (themeId: string) => {
    const newSelection = new Set(selectedThemeIds);
    if (newSelection.has(themeId)) {
      newSelection.delete(themeId);
    } else {
      newSelection.add(themeId);
    }
    setSelectedThemeIds(newSelection);
  };

  const selectAllThemes = () => {
    setSelectedThemeIds(new Set(themes.map(t => t.id)));
  };

  const deselectAllThemes = () => {
    setSelectedThemeIds(new Set());
  };

  const getSelectedThemes = (): Theme[] => {
    return themes.filter(t => selectedThemeIds.has(t.id));
  };

  const handleAction = async (
    actionName: string,
    actionFn?: (themes: Theme[]) => Promise<void>
  ) => {
    if (!actionFn) return;
    if (selectedThemeIds.size === 0) {
      alert('Please select at least one theme');
      return;
    }

    setLoadingAction(actionName);
    try {
      await actionFn(getSelectedThemes());
    } catch (error) {
      logger.error('Theme action failed', 'ThemeActionPanel', { actionName, error });
    } finally {
      setLoadingAction(null);
    }
  };

  const actions = [
    {
      id: 'questions',
      title: 'Generate Research Questions',
      description: 'AI-powered SQUARE-IT compliant questions',
      icon: Lightbulb,
      color: 'from-amber-500 to-orange-500',
      onClick: () => handleAction('questions', onGenerateQuestions),
    },
    {
      id: 'hypotheses',
      title: 'Generate Hypotheses',
      description: 'Testable hypotheses with statistical guidance',
      icon: FlaskConical,
      color: 'from-blue-500 to-indigo-500',
      onClick: () => handleAction('hypotheses', onGenerateHypotheses),
    },
    {
      id: 'constructs',
      title: 'Map Constructs',
      description: 'Identify underlying psychological constructs',
      icon: Network,
      color: 'from-purple-500 to-pink-500',
      onClick: () => handleAction('constructs', onMapConstructs),
    },
    {
      id: 'survey',
      title: 'Generate Complete Survey',
      description: 'One-click publication-ready survey',
      icon: FileText,
      color: 'from-green-500 to-teal-500',
      onClick: () => handleAction('survey', onGenerateSurvey),
    },
  ];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            What can I do with these themes?
          </h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Select themes and choose an action to continue your research design
        </p>
      </div>

      {/* Theme Selection */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Selected Themes ({selectedThemeIds.size}/{themes.length})
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAllThemes}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAllThemes}
              className="text-xs text-gray-600 hover:text-gray-700 font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => toggleThemeSelection(theme.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${
                  selectedThemeIds.has(theme.id)
                    ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Quick Actions
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map(action => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;

            return (
              <motion.button
                key={action.id}
                onClick={action.onClick}
                disabled={selectedThemeIds.size === 0 || loadingAction !== null}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative overflow-hidden rounded-lg p-4 text-left
                  border-2 border-gray-200 hover:border-gray-300
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group
                `}
              >
                {/* Gradient Background */}
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-br ${action.color}
                    opacity-0 group-hover:opacity-10 transition-opacity
                  `}
                />

                {/* Content */}
                <div className="relative flex items-start gap-3">
                  <div
                    className={`
                      p-2 rounded-lg bg-gradient-to-br ${action.color}
                      flex-shrink-0
                    `}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="flex items-center gap-2 text-purple-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">
                          Processing...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Select 2-5 themes for focused research
          questions, or select all themes for comprehensive survey generation.
        </p>
      </div>
    </div>
  );
};
