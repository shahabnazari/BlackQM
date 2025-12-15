/**
 * PaperHeader Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 * Phase 10.145 - Semantic HTML (address for authors), dark mode support
 *
 * Displays paper title, authors, source, and selection checkbox
 * ✅ FIXED: Keyboard accessibility for checkbox (WCAG 2.1.1)
 * ✅ FIXED: Magic numbers replaced with constants
 * ✅ Phase 10.145: Semantic address element for authors
 * ✅ Phase 10.145: Dark mode support
 *
 * @module PaperHeader
 */

'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MAX_DISPLAYED_AUTHORS } from './constants';

// ============================================================================
// Types
// ============================================================================

interface PaperHeaderProps {
  /** Paper title */
  title: string;
  /** Array of author names */
  authors?: string[];
  /** Source database name (e.g., "PubMed", "arXiv") */
  source?: string;
  /** Whether the paper is selected */
  isSelected: boolean;
  /** Whether themes are currently being extracted */
  isExtracting: boolean;
  /** Whether themes have been extracted */
  isExtracted: boolean;
  /** Source icon component */
  SourceIcon: React.ComponentType<{ className?: string }>;
  /** Handler for toggling selection (called by parent card) */
  onToggleSelection?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function PaperHeader({
  title,
  authors,
  source,
  isSelected,
  isExtracting,
  isExtracted,
  SourceIcon,
  onToggleSelection,
}: PaperHeaderProps) {
  /**
   * Handle checkbox keyboard interaction
   * Supports Enter and Space keys for WCAG 2.1.1 compliance
   */
  const handleCheckboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection?.();
    }
  };

  /**
   * Handle checkbox click
   * Stops propagation to prevent parent card selection
   */
  const handleCheckboxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onToggleSelection?.();
  };

  return (
    <div className="flex items-start gap-3">
      {/* Selection Checkbox - Now Fully Keyboard Accessible */}
      <div
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center mt-1 transition-all cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300',
          isExtracted && !isSelected && 'border-green-500',
          isExtracting && !isSelected && 'border-amber-500 bg-amber-50'
        )}
        aria-label={isSelected ? 'Selected' : 'Not selected'}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onClick={handleCheckboxClick}
        onKeyDown={handleCheckboxKeyDown}
      >
        {isSelected && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
        {!isSelected && isExtracting && (
          <Loader2 className="w-3 h-3 text-amber-600 animate-spin" aria-hidden="true" />
        )}
        {!isSelected && !isExtracting && isExtracted && (
          <Check className="w-3 h-3 text-green-500" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1">
        {/* Title and Source */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight flex-1 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {source && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 shrink-0 px-2 py-1"
              aria-label={`Source: ${source}`}
            >
              <SourceIcon className="w-3 h-3" aria-hidden="true" />
              <span className="text-xs">{source}</span>
            </Badge>
          )}
        </div>

        {/* Authors - Phase 10.145: Semantic HTML with address element */}
        {authors && authors.length > 0 && (
          <address
            className="text-sm text-gray-600 dark:text-gray-400 mt-1 not-italic"
            aria-label={`Authors: ${authors.join(', ')}`}
          >
            {authors.slice(0, MAX_DISPLAYED_AUTHORS).join(', ')}
            {authors.length > MAX_DISPLAYED_AUTHORS && (
              <span className="text-gray-500 dark:text-gray-500">
                {` +${authors.length - MAX_DISPLAYED_AUTHORS} more`}
              </span>
            )}
          </address>
        )}
      </div>
    </div>
  );
}
