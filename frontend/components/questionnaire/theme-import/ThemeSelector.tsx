/**
 * Theme Selector Component
 * Extracted from ThemeImportModal for better organization
 * Phase 10 Day 5.9 - Enterprise Grade
 */

import React from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Theme } from '@/lib/api/services/theme-to-survey.service';

interface ThemeSelectorProps {
  theme: Theme;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: (themeId: string) => void;
  onToggleExpand: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
}) => {
  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isSelected && 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(theme.id)}
            className="mt-1"
            aria-label={`Select theme: ${theme.name}`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {theme.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {Math.round(theme.confidence * 100)}% confidence
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(theme.prevalence * 100)}% prevalence
              </Badge>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {theme.description}
            </p>

            {theme.keyPhrases && theme.keyPhrases.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {theme.keyPhrases.map(phrase => (
                  <Badge key={phrase} variant="outline" className="text-xs">
                    {phrase}
                  </Badge>
                ))}
              </div>
            )}

            <button
              onClick={() => onToggleExpand(theme.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3" />
                  Show details
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-7 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {theme.sources && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sources ({theme.sources.length}):
                </p>
                <div className="space-y-1">
                  {theme.sources.map(source => (
                    <div
                      key={source.id}
                      className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{source.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {theme.subthemes && theme.subthemes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subthemes:
                </p>
                <div className="space-y-1">
                  {theme.subthemes.map(subtheme => (
                    <div key={subtheme.name} className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {subtheme.name}:
                      </span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {subtheme.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};