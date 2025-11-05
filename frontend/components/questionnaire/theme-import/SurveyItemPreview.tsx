/**
 * Survey Item Preview Component
 * Extracted from ThemeImportModal for better organization
 * Phase 10 Day 5.9 - Enterprise Grade
 */

import React from 'react';
import { Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SurveyItem } from '@/lib/api/services/theme-to-survey.service';

interface SurveyItemPreviewProps {
  item: SurveyItem;
  index: number;
  isSelected: boolean;
  onToggleSelect: (itemId: string) => void;
}

export const SurveyItemPreview: React.FC<SurveyItemPreviewProps> = ({
  item,
  index,
  isSelected,
  onToggleSelect,
}) => {
  const renderScalePreview = () => {
    const labels = item.scaleLabels;
    if (labels && labels.length > 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          {labels.map((label, i) => (
            <React.Fragment key={i}>
              <span>{label}</span>
              {i < labels.length - 1 && <span>•</span>}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (item.leftPole && item.rightPole) {
      return (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>{item.leftPole}</span>
          <span className="text-gray-400">↔</span>
          <span>{item.rightPole}</span>
        </div>
      );
    }

    return null;
  };

  const renderOptions = () => {
    if (!item.options || item.options.length === 0) return null;

    return (
      <div className="space-y-1 mt-2">
        {item.options.map((option, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <Square className="w-3 h-3" />
            <span>{option}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="mt-1"
          aria-label={`Select item ${index + 1}`}
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">
              #{index + 1}
            </span>
            <Badge variant="secondary" className="text-xs">
              {item.type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.themeName}
            </Badge>
            {item.reversed && (
              <Badge
                variant="outline"
                className="text-xs border-orange-300 text-orange-600"
              >
                Reverse-coded
              </Badge>
            )}
            {item.metadata.confidence >= 0.9 && (
              <Badge
                variant="outline"
                className="text-xs border-green-300 text-green-600"
              >
                High confidence
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2">
            {item.text}
          </p>

          {renderScalePreview()}
          {renderOptions()}

          {item.reliability?.reverseCodedReason && (
            <div className="mt-2 text-xs text-gray-500 italic">
              Reverse-coded: {item.reliability.reverseCodedReason}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};