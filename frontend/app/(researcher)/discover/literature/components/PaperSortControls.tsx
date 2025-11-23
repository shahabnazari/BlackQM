/**
 * Paper Sort Controls Component
 * Sorting options for research papers
 * 
 * Features:
 * - Sort by quality score
 * - Sort by publication year
 * - Sort by citations
 * - Sort by citations per year
 * - Sort by relevance
 * - Sort by author count
 * - Ascending/Descending toggle
 * 
 * @module PaperSortControls
 */

'use client';

import React, { memo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type SortField = 
  | 'quality_score'
  | 'publication_year'
  | 'citations'
  | 'citations_per_year'
  | 'relevance'
  | 'author_count'
  | 'title';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface PaperSortControlsProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { value: 'quality_score', label: 'Quality Score', defaultDirection: 'desc' as const },
  { value: 'publication_year', label: 'Publication Year', defaultDirection: 'desc' as const },
  { value: 'citations', label: 'Total Citations', defaultDirection: 'desc' as const },
  { value: 'citations_per_year', label: 'Citations/Year', defaultDirection: 'desc' as const },
  { value: 'relevance', label: 'Relevance Score', defaultDirection: 'desc' as const },
  { value: 'author_count', label: 'Number of Authors', defaultDirection: 'asc' as const },
  { value: 'title', label: 'Title (A-Z)', defaultDirection: 'asc' as const },
] as const;

// ============================================================================
// Component
// ============================================================================

export const PaperSortControls = memo(function PaperSortControls({
  sortConfig,
  onSortChange,
}: PaperSortControlsProps) {
  // ========================================================================
  // Handlers
  // ========================================================================

  const handleSortFieldChange = (value: string) => {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    onSortChange({
      field: value as SortField,
      direction: option?.defaultDirection || 'desc',
    });
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
        Sort by:
      </span>
      
      <Select value={sortConfig.field} onValueChange={handleSortFieldChange}>
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Select sort option" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="h-9 px-3"
        title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortConfig.direction === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
        <span className="ml-2 text-xs">
          {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
        </span>
      </Button>
    </div>
  );
});

