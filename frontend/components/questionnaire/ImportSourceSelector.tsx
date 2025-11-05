'use client';

import React, { useState } from 'react';
import {
  FileText,
  Brain,
  Target,
  Lightbulb,
  Database,
  Package,
  Clock,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ImportSourceSelectorProps {
  onClose: () => void;
  onSelectSource: (source: ImportSource) => void;
}

export type ImportSource =
  | 'themes'
  | 'research-question'
  | 'hypothesis'
  | 'complete-survey'
  | 'item-bank'
  | 'ai-suggestions';

interface ImportOption {
  id: ImportSource;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

const importOptions: ImportOption[] = [
  {
    id: 'themes',
    title: 'Import from Themes',
    description: 'Convert extracted themes from literature into survey items',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    badge: 'Day 5.9',
  },
  {
    id: 'research-question',
    title: 'Import from Research Question',
    description: 'Operationalize research questions into measurable survey items',
    icon: Target,
    color: 'from-blue-500 to-cyan-600',
    badge: 'Day 5.10',
  },
  {
    id: 'hypothesis',
    title: 'Import from Hypothesis',
    description: 'Generate test battery from research hypotheses',
    icon: Lightbulb,
    color: 'from-green-500 to-emerald-600',
    badge: 'Day 5.11',
  },
  {
    id: 'complete-survey',
    title: 'Import Complete Survey',
    description: 'Get AI-suggested complete survey based on research context',
    icon: Package,
    color: 'from-orange-500 to-red-600',
    badge: 'Day 5.12',
    comingSoon: true,
  },
  {
    id: 'item-bank',
    title: 'Import from Item Bank',
    description: 'Access validated survey items from research repository',
    icon: Database,
    color: 'from-teal-500 to-green-600',
    badge: 'Repository',
    disabled: true,
  },
  {
    id: 'ai-suggestions',
    title: 'AI Suggestions',
    description: 'Get AI-powered question recommendations based on your study',
    icon: Sparkles,
    color: 'from-pink-500 to-purple-600',
    badge: 'Premium',
    disabled: true,
  },
];

export const ImportSourceSelector: React.FC<ImportSourceSelectorProps> = ({
  onClose,
  onSelectSource,
}) => {
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [recentImports] = useState([
    {
      id: '1',
      source: 'themes',
      title: 'Climate Change Themes',
      date: '2 hours ago',
      itemCount: 15,
    },
    {
      id: '2',
      source: 'themes',
      title: 'Healthcare Access Study',
      date: 'Yesterday',
      itemCount: 22,
    },
    {
      id: '3',
      source: 'research-question',
      title: 'Educational Technology RQ',
      date: '3 days ago',
      itemCount: 8,
    },
  ]);

  const handleSelectSource = (source: ImportSource) => {
    setSelectedSource(source);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelectSource(source);
    }, 200);
  };

  const getSourceIcon = (source: string) => {
    const option = importOptions.find(opt => opt.id === source);
    return option?.icon || FileText;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Import Survey Items
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a source to import survey questions from
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Import Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {importOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedSource === option.id;

              return (
                <Card
                  key={option.id}
                  className={cn(
                    'relative overflow-hidden cursor-pointer transition-all duration-300',
                    'hover:shadow-lg hover:scale-[1.02]',
                    isSelected && 'ring-2 ring-blue-500 shadow-lg scale-[1.02]',
                    (option.disabled || option.comingSoon) && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => !option.disabled && !option.comingSoon && handleSelectSource(option.id)}
                >
                  {/* Gradient Background */}
                  <div
                    className={cn(
                      'absolute inset-0 opacity-10 bg-gradient-to-br',
                      option.color
                    )}
                  />

                  <div className="relative p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-3 rounded-xl bg-gradient-to-br text-white',
                        option.color
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {option.title}
                          </h3>
                          {option.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                          {option.comingSoon && (
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                              Coming Soon
                            </Badge>
                          )}
                          {option.disabled && (
                            <Badge variant="outline" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>

                      {!option.disabled && !option.comingSoon && (
                        <ArrowRight className={cn(
                          'w-5 h-5 text-gray-400 transition-transform',
                          isSelected && 'translate-x-1 text-blue-500'
                        )} />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Imports */}
          {recentImports.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Imports
              </h3>
              <div className="space-y-2">
                {recentImports.map((recent) => {
                  const Icon = getSourceIcon(recent.source);
                  return (
                    <div
                      key={recent.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectSource(recent.source as ImportSource)}
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {recent.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {recent.date} • {recent.itemCount} items
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">
            Import features unlock the full research-to-survey pipeline
          </p>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};