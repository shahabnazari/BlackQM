/**
 * FilterPanel Component
 * Extracted from literature page (Week 1 Day 1-2)
 * Handles advanced filtering, presets, and filter management
 * Phase 10 Day 31 - Enterprise Refactoring
 */

'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { logger } from '@/lib/utils/logger';
import type { SearchFilters } from '@/lib/types/literature.types';

// ============================================================================
// Component Props
// ============================================================================

interface FilterPanelProps {
  /** Show/hide the filter panel */
  isVisible: boolean;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const FilterPanel = memo(function FilterPanel({
  isVisible,
}: FilterPanelProps) {
  // ============================================================================
  // State from Zustand Store
  // ============================================================================

  const {
    filters,
    savedPresets,
    showPresets,
    setFilters,
    applyFilters,
    resetFilters,
    addPreset,
    loadPreset,
    deletePreset,
    toggleShowPresets,
  } = useLiteratureSearchStore();

  const [presetName, setPresetName] = React.useState('');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleYearFromChange = (value: string) => {
    // Edge case: empty string - reset to default (2010)
    if (value === '') {
      setFilters({ yearFrom: 2010 });
      return;
    }

    const val = parseInt(value, 10);
    // Edge case: invalid number (NaN, decimals, negative)
    if (isNaN(val) || val < 0) return;

    let correctedVal = val;
    const currentYear = new Date().getFullYear();

    // Edge case: year before modern publishing era
    if (correctedVal < 1900) correctedVal = 1900;
    // Edge case: future year
    if (correctedVal > currentYear) correctedVal = currentYear;
    // Edge case: from year after to year
    if (filters.yearTo && correctedVal > filters.yearTo) {
      correctedVal = filters.yearTo;
    }

    logger.debug('[FilterPanel] Year from changed', { yearFrom: correctedVal });
    setFilters({ yearFrom: correctedVal });
  };

  const handleYearToChange = (value: string) => {
    // Edge case: empty string - reset to current year
    if (value === '') {
      setFilters({ yearTo: new Date().getFullYear() });
      return;
    }

    const val = parseInt(value, 10);
    // Edge case: invalid number (NaN, decimals, negative)
    if (isNaN(val) || val < 0) return;

    let correctedVal = val;
    const currentYear = new Date().getFullYear();

    // Edge case: year before modern publishing era
    if (correctedVal < 1900) correctedVal = 1900;
    // Edge case: future year
    if (correctedVal > currentYear) correctedVal = currentYear;
    // Edge case: to year before from year
    if (filters.yearFrom && correctedVal < filters.yearFrom) {
      correctedVal = filters.yearFrom;
    }

    logger.debug('[FilterPanel] Year to changed', { yearTo: correctedVal });
    setFilters({ yearTo: correctedVal });
  };

  const handleAuthorChange = (value: string) => {
    // Edge case: trim excessive whitespace but preserve internal spaces
    const trimmedValue = value.replace(/\s+/g, ' ').trimStart();
    
    // Edge case: prevent extremely long author names (likely input error)
    const maxLength = 200;
    const sanitizedValue = trimmedValue.slice(0, maxLength);

    logger.debug('[FilterPanel] Author filter changed', { author: sanitizedValue });
    setFilters({ author: sanitizedValue });
  };

  const handleMinCitationsChange = (value: string) => {
    // Edge case: empty string - reset to 0 (no minimum)
    if (value === '') {
      setFilters({ minCitations: 0 });
      return;
    }

    const val = parseInt(value, 10);
    // Edge case: invalid number (NaN, decimals)
    if (isNaN(val)) return;

    // Edge case: negative citations don't make sense
    let correctedVal = Math.max(0, val);
    // Edge case: unreasonably high citation counts (likely typo)
    // Papers with 50k+ citations are extremely rare (e.g., "Structure of DNA" has ~12k)
    if (correctedVal > 100000) correctedVal = 100000;

    logger.debug('[FilterPanel] Min citations changed', { minCitations: correctedVal });
    setFilters({ minCitations: correctedVal });
  };

  const handlePublicationTypeChange = (value: string) => {
    logger.debug('[FilterPanel] Publication type changed', {
      publicationType: value,
    });
    const publicationType = value as SearchFilters['publicationType'];
    if (publicationType !== undefined) {
      setFilters({ publicationType });
    }
  };

  const handleSortByChange = (value: string) => {
    logger.debug('[FilterPanel] Sort by changed', { sortBy: value });
    const sortBy = value as SearchFilters['sortBy'];
    if (sortBy !== undefined) {
      setFilters({ sortBy });
    }
  };

  const handleAuthorSearchModeChange = (value: string) => {
    logger.debug('[FilterPanel] Author search mode changed', { mode: value });
    const authorSearchMode = value as SearchFilters['authorSearchMode'];
    if (authorSearchMode !== undefined) {
      setFilters({ authorSearchMode });
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      logger.warn('[FilterPanel] Attempted to save preset with empty name');
      return;
    }

    logger.info('[FilterPanel] Saving filter preset', { name: presetName });
    addPreset(presetName.trim());
    setPresetName('');
  };

  const handleLoadPreset = (presetId: string) => {
    logger.info('[FilterPanel] Loading filter preset', { presetId });
    loadPreset(presetId);
  };

  const handleDeletePreset = (presetId: string) => {
    logger.info('[FilterPanel] Deleting filter preset', { presetId });
    deletePreset(presetId);
  };

  const handleApplyFilters = () => {
    logger.info('[FilterPanel] Applying filters', { filters });
    applyFilters();
  };

  const handleResetFilters = () => {
    logger.info('[FilterPanel] Resetting filters to defaults');
    resetFilters();
  };

  const handleShowQualityInfo = () => {
    alert(`Quality Score Algorithm (Enterprise Research-Grade):

🏆 5-Dimensional Composite Score (0-100):

1. Citation Impact (30%):
   • 50+ cites/year = World-class (100 pts)
   • 10+ cites/year = Excellent (70 pts)
   • 5+ cites/year = Good (50 pts)
   • 1+ cites/year = Average (20 pts)

2. Journal Prestige (25%):
   • Impact Factor (IF)
   • SCImago Journal Rank (SJR)
   • Quartile (Q1-Q4)
   • Journal h-index

3. Content Depth (15%):
   • 8000+ words = Extensive (100 pts)
   • 3000-8000 = Comprehensive (70-100 pts)
   • 1000-3000 = Standard (40-70 pts)

4. Recency Boost (15%):
   • Current year = 100 pts
   • 1 year old = 80 pts
   • 2 years old = 60 pts

5. Venue Quality (15%):
   • Top-tier (Nature/Science) = 100 pts
   • Peer-reviewed journal = 70-90 pts
   • Conference = 50-70 pts
   • Preprint = 30-50 pts

Quality Tiers:
✅ Exceptional (80-100): Breakthrough research
✅ Excellent (70-79): High-quality methodology
✅ Very Good (60-69): Solid research
✅ Good (50-59): Acceptable research quality
⚠️  Acceptable (40-49): Marginal quality, use with caution
⚠️  Fair (30-39): Limited quality, consider excluding
❌ Limited (<30): Below research-grade standards`);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!isVisible) return null;

  const currentYear = new Date().getFullYear();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="space-y-4 pt-4 border-t mt-4"
      >
        {/* Filter Controls Grid - Phase 10.8 Day 1: Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Year Range */}
          <div>
            <label className="text-sm font-medium">
              Year Range <span className="text-xs text-gray-500 font-normal">(default: 2010-{currentYear})</span>
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder="2010"
                min="1900"
                max={currentYear}
                value={filters.yearFrom ?? ''}
                onChange={e => handleYearFromChange(e.target.value)}
                className="w-full"
                aria-label="Year from"
              />
              <Input
                type="number"
                placeholder={currentYear.toString()}
                min="1900"
                max={currentYear}
                value={filters.yearTo ?? ''}
                onChange={e => handleYearToChange(e.target.value)}
                className="w-full"
                aria-label="Year to"
              />
            </div>
          </div>

          {/* Author Filter */}
          <div>
            <label className="text-sm font-medium">Author</label>
            <Input
              type="text"
              placeholder="e.g., Smith"
              value={filters.author}
              onChange={e => handleAuthorChange(e.target.value)}
              className="mt-1"
              aria-label="Author name"
            />
            <select
              value={filters.authorSearchMode}
              onChange={e => handleAuthorSearchModeChange(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Author search mode"
            >
              <option value="contains">Contains (partial match)</option>
              <option value="fuzzy">Fuzzy (typo-tolerant)</option>
              <option value="exact">Exact match</option>
            </select>
          </div>

          {/* Min Citations */}
          <div>
            <label className="text-sm font-medium">Min Citations</label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={filters.minCitations ?? ''}
              onChange={e => handleMinCitationsChange(e.target.value)}
              className="mt-1"
              aria-label="Minimum citations"
            />
          </div>

          {/* Publication Type */}
          <div>
            <label className="text-sm font-medium">Publication Type</label>
            <select
              value={filters.publicationType}
              onChange={e => handlePublicationTypeChange(e.target.value)}
              className="mt-1 w-full h-10 px-3 border rounded-md"
              aria-label="Publication type"
            >
              <option value="all">All Types</option>
              <option value="journal">Journal Articles</option>
              <option value="conference">Conference Papers</option>
              <option value="preprint">Preprints</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-medium">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={e => handleSortByChange(e.target.value)}
              className="mt-1 w-full h-10 px-3 border rounded-md"
              aria-label="Sort by"
            >
              <option value="relevance">Relevance</option>
              <option value="citations">Citations (Total)</option>
              <option value="citations_per_year">
                Citations/Year (Impact)
              </option>
              <option value="quality_score">Quality Score (Enterprise)</option>
              <option value="word_count">Word Count (Depth)</option>
              <option value="date">Date (Newest)</option>
            </select>
          </div>
        </div>

        {/* Enterprise Quality Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Award className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            <strong>Enterprise Research-Grade Filtering:</strong> Quality scores (0-100) use bias-resistant v3.0 methodology: <strong className="text-blue-700">60% Field-Weighted Citation Impact</strong> (fair across disciplines), <strong className="text-blue-700">40% Journal Prestige</strong> (impact factor, h-index, quartile). <strong className="text-green-700">Optional bonuses:</strong> +10 Open Access, +5 Data/Code Sharing, +5 Social Impact.
            <strong className="text-green-700">
              {' '}
              Papers scoring ≥50 are "Good Quality"; ≥70 are "Excellent."
            </strong>
            <a
              href="#"
              className="underline ml-1"
              onClick={e => {
                e.preventDefault();
                handleShowQualityInfo();
              }}
            >
              Learn more
            </a>
          </AlertDescription>
        </Alert>

        {/* Presets Section */}
        <div className="space-y-3">
          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">📁 Saved Presets</label>
              <div className="flex gap-2 flex-wrap">
                {savedPresets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <button
                      onClick={() => handleLoadPreset(preset.id)}
                      className="hover:text-purple-700 font-medium"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Delete preset"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Preset Form */}
          {showPresets && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 items-end"
            >
              <div className="flex-1">
                <label className="text-sm font-medium">Preset Name</label>
                <Input
                  placeholder="e.g., Recent AI Papers"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                  className="mt-1"
                  aria-label="Preset name"
                />
              </div>
              <Button onClick={handleSavePreset} variant="outline">
                Save
              </Button>
              <Button onClick={toggleShowPresets} variant="ghost">
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Action Buttons - Phase 10.8 Day 1: Mobile Touch-Friendly */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Reset Filters
              </Button>
              {!showPresets && (
                <Button
                  variant="outline"
                  onClick={toggleShowPresets}
                  className="w-full sm:w-auto min-h-[44px] border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Save as Preset
                </Button>
              )}
            </div>
            <Button
              onClick={handleApplyFilters}
              className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
