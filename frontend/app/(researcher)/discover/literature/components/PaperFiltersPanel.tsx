/**
 * Paper Filters Panel Component
 * Advanced filtering system for research papers
 * 
 * Features:
 * - Publication year range slider
 * - Citations per year range
 * - Author count filter
 * - Access type filter (Open Access, Subscription)
 * - Publication type filter
 * - Has PDF filter
 * - Journal quality filter
 * 
 * @module PaperFiltersPanel
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface PaperFilters {
  yearRange: [number, number];
  citationsPerYearRange: [number, number];
  authorCountRange: [number, number];
  openAccessOnly: boolean;
  hasPdfOnly: boolean;
  publicationTypes: string[];
  minimumQualityScore: number;
}

export interface PaperFiltersPanelProps {
  filters: PaperFilters;
  onFiltersChange: (filters: PaperFilters) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

const PUBLICATION_TYPES = [
  { id: 'journal-article', label: 'Journal Article' },
  { id: 'conference-paper', label: 'Conference Paper' },
  { id: 'review', label: 'Review Article' },
  { id: 'preprint', label: 'Preprint' },
  { id: 'book-chapter', label: 'Book Chapter' },
  { id: 'thesis', label: 'Thesis/Dissertation' },
];

// ============================================================================
// Component
// ============================================================================

export const PaperFiltersPanel = memo(function PaperFiltersPanel({
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
}: PaperFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleYearRangeChange = useCallback(
    (value: number[]) => {
      // Type guard: Ensure both values exist and are numbers
      if (value[0] !== undefined && value[1] !== undefined) {
        onFiltersChange({
          ...filters,
          yearRange: [value[0], value[1]],
        });
      }
    },
    [filters, onFiltersChange]
  );

  const handleCitationsRangeChange = useCallback(
    (value: number[]) => {
      // Type guard: Ensure both values exist and are numbers
      if (value[0] !== undefined && value[1] !== undefined) {
        onFiltersChange({
          ...filters,
          citationsPerYearRange: [value[0], value[1]],
        });
      }
    },
    [filters, onFiltersChange]
  );

  const handleAuthorCountRangeChange = useCallback(
    (value: number[]) => {
      // Type guard: Ensure both values exist and are numbers
      if (value[0] !== undefined && value[1] !== undefined) {
        onFiltersChange({
          ...filters,
          authorCountRange: [value[0], value[1]],
        });
      }
    },
    [filters, onFiltersChange]
  );

  const handleQualityScoreChange = useCallback(
    (value: number[]) => {
      // Type guard: Ensure value exists and is a number
      if (value[0] !== undefined) {
        onFiltersChange({
          ...filters,
          minimumQualityScore: value[0],
        });
      }
    },
    [filters, onFiltersChange]
  );

  const handlePublicationTypeToggle = useCallback(
    (typeId: string) => {
      const newTypes = filters.publicationTypes.includes(typeId)
        ? filters.publicationTypes.filter((t) => t !== typeId)
        : [...filters.publicationTypes, typeId];

      onFiltersChange({
        ...filters,
        publicationTypes: newTypes,
      });
    },
    [filters, onFiltersChange]
  );

  const handleOpenAccessToggle = useCallback(() => {
    onFiltersChange({
      ...filters,
      openAccessOnly: !filters.openAccessOnly,
    });
  }, [filters, onFiltersChange]);

  const handleHasPdfToggle = useCallback(() => {
    onFiltersChange({
      ...filters,
      hasPdfOnly: !filters.hasPdfOnly,
    });
  }, [filters, onFiltersChange]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-purple-600" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="bg-purple-600">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilters();
                }}
                className="text-xs"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* Publication Year Range */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Publication Year: {filters.yearRange[0]} - {filters.yearRange[1]}
            </Label>
            <Slider
              min={MIN_YEAR}
              max={CURRENT_YEAR}
              step={1}
              value={filters.yearRange}
              onValueChange={handleYearRangeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{MIN_YEAR}</span>
              <span>{CURRENT_YEAR}</span>
            </div>
          </div>

          {/* Citations Per Year Range */}
          {/* Phase 10.160: Widened range to 1000+ to include all papers by default */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Citations/Year: {filters.citationsPerYearRange[0]} -{' '}
              {filters.citationsPerYearRange[1] >= 1000
                ? '1000+'
                : filters.citationsPerYearRange[1]}
            </Label>
            <Slider
              min={0}
              max={1000}
              step={10}
              value={filters.citationsPerYearRange}
              onValueChange={handleCitationsRangeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>1000+</span>
            </div>
          </div>

          {/* Author Count Range */}
          {/* Phase 10.160: Widened range to 0-100 to include all papers by default */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Number of Authors: {filters.authorCountRange[0]} -{' '}
              {filters.authorCountRange[1] >= 100
                ? '100+'
                : filters.authorCountRange[1]}
            </Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={filters.authorCountRange}
              onValueChange={handleAuthorCountRangeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>100+</span>
            </div>
          </div>

          {/* Minimum Quality Score */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Minimum Quality Score: {filters.minimumQualityScore}/10
            </Label>
            <Slider
              min={0}
              max={10}
              step={0.5}
              value={[filters.minimumQualityScore]}
              onValueChange={handleQualityScoreChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Any)</span>
              <span>10 (Highest)</span>
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open-access"
                checked={filters.openAccessOnly}
                onCheckedChange={handleOpenAccessToggle}
              />
              <Label
                htmlFor="open-access"
                className="text-sm font-normal cursor-pointer"
              >
                Open Access Only (Free full-text)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-pdf"
                checked={filters.hasPdfOnly}
                onCheckedChange={handleHasPdfToggle}
              />
              <Label
                htmlFor="has-pdf"
                className="text-sm font-normal cursor-pointer"
              >
                Has PDF Available
              </Label>
            </div>
          </div>

          {/* Publication Types */}
          <div className="pt-2 border-t">
            <Label className="text-sm font-medium mb-3 block">
              Publication Types
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PUBLICATION_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={filters.publicationTypes.includes(type.id)}
                    onCheckedChange={() => handlePublicationTypeToggle(type.id)}
                  />
                  <Label
                    htmlFor={type.id}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

