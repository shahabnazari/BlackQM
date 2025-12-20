/**
 * UnifiedFilterSection Component
 * Phase 10.96 - Integrated Filter Experience
 *
 * Combines source selection and search filters into a cohesive UI.
 * Sources ARE filters - they determine which databases to search.
 *
 * **Architecture:**
 * - Tab-based organization (Sources | Filters | Presets)
 * - Self-contained with Zustand store access
 * - Zero props required for core functionality
 *
 * **UX Principles:**
 * - Progressive disclosure: Show most important options first
 * - Consistent visual language across all source types
 * - Clear feedback on selection state
 * - Mobile-responsive design
 *
 * **WCAG 2.1 AA Compliance:**
 * - Proper ARIA roles for tabs and accordions
 * - Keyboard navigation support
 * - Label-input associations
 *
 * @module UnifiedFilterSection
 * @since Phase 10.96
 */

'use client';

import React, { memo, useCallback, useState, useMemo, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  GitBranch,
  MessageSquare,
  Filter,
  Star,
  X,
  Check,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  BookX,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

// Stores
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useAlternativeSourcesStore } from '@/lib/stores/alternative-sources.store';
import { useSocialMediaStore, type SocialPlatform } from '@/lib/stores/social-media.store';

// Source Icons
import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';

// ============================================================================
// Constants - Extracted Magic Numbers
// ============================================================================

const YEAR_MIN = 1900;
const YEAR_DEFAULT_FROM = 2010;
const AUTHOR_MAX_LENGTH = 200;
const CITATIONS_MAX = 100000;

// Current year computed once at module load (doesn't change during session)
const CURRENT_YEAR = new Date().getFullYear();

// ============================================================================
// Type-safe filter types (matching SearchFilters from literature.types.ts)
// ============================================================================

type PublicationType = 'all' | 'journal' | 'conference' | 'preprint' | 'book' | 'thesis';
type SortByType = 'relevance' | 'date' | 'citations';
type SourceCategoryColor = 'blue' | 'indigo' | 'purple';

// ============================================================================
// Types
// ============================================================================

interface UnifiedFilterSectionProps {
  /** Controls visibility of the filter panel */
  isVisible: boolean;
}

type FilterTab = 'sources' | 'filters' | 'presets';

// ============================================================================
// Source Configuration
// ============================================================================

/**
 * Academic database definitions
 * All sources are free tier (open access)
 */
const ACADEMIC_DATABASES = [
  { id: 'pubmed', label: 'PubMed', tier: 'free', category: 'Medical' },
  { id: 'semantic_scholar', label: 'Semantic Scholar', tier: 'free', category: 'General' },
  { id: 'openalex', label: 'OpenAlex', tier: 'free', category: 'General' },
  { id: 'crossref', label: 'Crossref', tier: 'free', category: 'General' },
  { id: 'core', label: 'CORE', tier: 'free', category: 'Open Access' },
  { id: 'eric', label: 'ERIC', tier: 'free', category: 'Education' },
  { id: 'arxiv', label: 'arXiv', tier: 'free', category: 'Preprints' },
  { id: 'springer', label: 'Springer', tier: 'free', category: 'General' },
  { id: 'doaj', label: 'DOAJ', tier: 'free', category: 'Open Access' },
] as const;

/**
 * Alternative source definitions
 */
const ALTERNATIVE_SOURCES = [
  { id: 'podcasts', label: 'Podcasts', icon: '🎙️', status: 'beta' },
  { id: 'github', label: 'GitHub', icon: '💻', status: 'active' },
  { id: 'stackoverflow', label: 'Stack Overflow', icon: '📚', status: 'active' },
  { id: 'medium', label: 'Medium', icon: '✍️', status: 'planned' },
] as const;

/**
 * Social media platform definitions with store-compatible IDs
 */
const SOCIAL_PLATFORMS: ReadonlyArray<{
  id: SocialPlatform;
  label: string;
  icon: string;
  color: string;
}> = [
  { id: 'youtube', label: 'YouTube', icon: '📹', color: 'red' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'pink' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'purple' },
] as const;

// ============================================================================
// Tab Configuration - Icons as component types to avoid JSX in module scope
// ============================================================================

const TAB_CONFIG: ReadonlyArray<{ id: FilterTab; label: string; IconComponent: typeof Database }> = [
  { id: 'sources', label: 'Sources', IconComponent: Database },
  { id: 'filters', label: 'Filters', IconComponent: Filter },
  { id: 'presets', label: 'Presets', IconComponent: Star },
];

// ============================================================================
// Color Class Maps - Tailwind JIT requires full class names at build time
// ============================================================================

const BORDER_COLORS: Record<SourceCategoryColor, string> = {
  blue: 'border-blue-200',
  indigo: 'border-indigo-200',
  purple: 'border-purple-200',
};

const BG_COLORS: Record<SourceCategoryColor, string> = {
  blue: 'bg-blue-50/50',
  indigo: 'bg-indigo-50/50',
  purple: 'bg-purple-50/50',
};

const TEXT_COLORS: Record<SourceCategoryColor, string> = {
  blue: 'text-blue-600',
  indigo: 'text-indigo-600',
  purple: 'text-purple-600',
};

const BADGE_BG_COLORS: Record<SourceCategoryColor, string> = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  purple: 'bg-purple-600',
};

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Source category accordion component for consistent display
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */
interface SourceCategoryProps {
  /** Unique identifier for ARIA associations */
  id: string;
  /** Category title */
  title: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Child content */
  children: React.ReactNode;
  /** Number of selected items */
  count: number;
  /** Total items available */
  total: number;
  /** Color theme */
  color: SourceCategoryColor;
  /** Expansion state */
  expanded: boolean;
  /** Toggle handler */
  onToggle: () => void;
}

const SourceCategory = memo(function SourceCategory({
  id,
  title,
  icon,
  children,
  count,
  total,
  color,
  expanded,
  onToggle,
}: SourceCategoryProps): JSX.Element {
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className={cn('border rounded-lg overflow-hidden', BORDER_COLORS[color])}>
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-gray-50 transition-colors',
          BG_COLORS[color]
        )}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <div className="flex items-center gap-2">
          <span className={TEXT_COLORS[color]}>{icon}</span>
          <span className="font-medium text-gray-900">{title}</span>
          <Badge
            variant={count > 0 ? 'default' : 'outline'}
            className={cn('text-xs', count > 0 ? BADGE_BG_COLORS[color] : '')}
          >
            {count}/{total}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 bg-white"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SourceCategory.displayName = 'SourceCategory';

// ============================================================================
// Main Component
// ============================================================================

export const UnifiedFilterSection = memo(function UnifiedFilterSection({
  isVisible,
}: UnifiedFilterSectionProps): JSX.Element | null {
  // ==========================================================================
  // Unique IDs for ARIA associations
  // ==========================================================================

  const baseId = useId();

  // ==========================================================================
  // Hydration Safety - Prevent mismatch with persisted stores
  // ==========================================================================

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================================================
  // Local State
  // ==========================================================================

  const [activeTab, setActiveTab] = useState<FilterTab>('sources');
  const [expandedCategories, setExpandedCategories] = useState({
    academic: true,
    alternative: false,
    social: false,
  });
  const [presetName, setPresetName] = useState('');

  // ==========================================================================
  // Store State - Literature Search
  // ==========================================================================

  const {
    filters,
    savedPresets,
    academicDatabases,
    setFilters,
    applyFilters,
    resetFilters,
    addPreset,
    loadPreset,
    deletePreset,
    setAcademicDatabases,
  } = useLiteratureSearchStore();

  // ==========================================================================
  // Store State - Alternative Sources
  // ==========================================================================

  const alternativeSources = useAlternativeSourcesStore((s) => s.sources);
  const setAlternativeSources = useAlternativeSourcesStore((s) => s.setSources);

  // ==========================================================================
  // Store State - Social Media
  // ==========================================================================

  const getEnabledPlatforms = useSocialMediaStore((s) => s.getEnabledPlatforms);
  const togglePlatform = useSocialMediaStore((s) => s.togglePlatform);

  // Hydration-safe computed value
  const socialPlatforms = useMemo(
    () => (mounted ? getEnabledPlatforms() : []),
    [mounted, getEnabledPlatforms]
  );

  // ==========================================================================
  // Handlers - Category Expansion
  // ==========================================================================

  /** Toggle accordion category expansion */
  const toggleCategory = useCallback((category: keyof typeof expandedCategories) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // ==========================================================================
  // Handlers - Academic Database Toggle
  // ==========================================================================

  /** Toggle academic database selection */
  const handleDatabaseToggle = useCallback(
    (databaseId: string) => {
      const newDatabases = academicDatabases.includes(databaseId)
        ? academicDatabases.filter((d) => d !== databaseId)
        : [...academicDatabases, databaseId];

      setAcademicDatabases(newDatabases);

      logger.debug('Academic database toggled', 'UnifiedFilterSection', {
        databaseId,
        selected: newDatabases.includes(databaseId),
      });
    },
    [academicDatabases, setAcademicDatabases]
  );

  // ==========================================================================
  // Handlers - Alternative Source Toggle
  // ==========================================================================

  /** Toggle alternative source selection */
  const handleAlternativeToggle = useCallback(
    (sourceId: string) => {
      const newSources = alternativeSources.includes(sourceId)
        ? alternativeSources.filter((s) => s !== sourceId)
        : [...alternativeSources, sourceId];

      setAlternativeSources(newSources);

      logger.debug('Alternative source toggled', 'UnifiedFilterSection', {
        sourceId,
        selected: newSources.includes(sourceId),
      });
    },
    [alternativeSources, setAlternativeSources]
  );

  // ==========================================================================
  // Handlers - Social Platform Toggle
  // ==========================================================================

  /** Toggle social media platform selection */
  const handleSocialToggle = useCallback(
    (platformId: SocialPlatform) => {
      togglePlatform(platformId);
      logger.debug('Social platform toggled', 'UnifiedFilterSection', { platformId });
    },
    [togglePlatform]
  );

  // ==========================================================================
  // Handlers - Bulk Selection
  // ==========================================================================

  /** Select all sources across all categories */
  const handleSelectAll = useCallback(() => {
    setAcademicDatabases(ACADEMIC_DATABASES.map((d) => d.id));
    setAlternativeSources(ALTERNATIVE_SOURCES.map((s) => s.id));
    // Enable all social platforms
    SOCIAL_PLATFORMS.forEach((platform) => {
      if (!socialPlatforms.includes(platform.id)) {
        togglePlatform(platform.id);
      }
    });
  }, [setAcademicDatabases, setAlternativeSources, socialPlatforms, togglePlatform]);

  /** Clear all sources across all categories */
  const handleClearAll = useCallback(() => {
    setAcademicDatabases([]);
    setAlternativeSources([]);
    // Disable all social platforms
    SOCIAL_PLATFORMS.forEach((platform) => {
      if (socialPlatforms.includes(platform.id)) {
        togglePlatform(platform.id);
      }
    });
  }, [setAcademicDatabases, setAlternativeSources, socialPlatforms, togglePlatform]);

  // ==========================================================================
  // Handlers - Filter Changes
  // ==========================================================================

  /** Handle year from filter change with validation */
  const handleYearFromChange = useCallback(
    (value: string) => {
      if (value === '') {
        setFilters({ yearFrom: YEAR_DEFAULT_FROM });
        return;
      }
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0) return;

      let correctedVal = Math.max(YEAR_MIN, Math.min(val, CURRENT_YEAR));
      if (filters.yearTo && correctedVal > filters.yearTo) {
        correctedVal = filters.yearTo;
      }
      setFilters({ yearFrom: correctedVal });
    },
    [filters.yearTo, setFilters]
  );

  /** Handle year to filter change with validation */
  const handleYearToChange = useCallback(
    (value: string) => {
      if (value === '') {
        setFilters({ yearTo: CURRENT_YEAR });
        return;
      }
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0) return;

      let correctedVal = Math.max(YEAR_MIN, Math.min(val, CURRENT_YEAR));
      if (filters.yearFrom && correctedVal < filters.yearFrom) {
        correctedVal = filters.yearFrom;
      }
      setFilters({ yearTo: correctedVal });
    },
    [filters.yearFrom, setFilters]
  );

  /** Handle author filter change with sanitization */
  const handleAuthorChange = useCallback(
    (value: string) => {
      const trimmedValue = value.replace(/\s+/g, ' ').trimStart().slice(0, AUTHOR_MAX_LENGTH);
      setFilters({ author: trimmedValue });
    },
    [setFilters]
  );

  /** Handle minimum citations filter change with validation */
  const handleMinCitationsChange = useCallback(
    (value: string) => {
      if (value === '') {
        setFilters({ minCitations: 0 });
        return;
      }
      const val = parseInt(value, 10);
      if (isNaN(val)) return;
      setFilters({ minCitations: Math.max(0, Math.min(val, CITATIONS_MAX)) });
    },
    [setFilters]
  );

  /** Handle publication type filter change with type guard */
  const handlePublicationTypeChange = useCallback(
    (value: string) => {
      const validTypes: PublicationType[] = ['all', 'journal', 'conference', 'preprint', 'book', 'thesis'];
      if (validTypes.includes(value as PublicationType)) {
        setFilters({ publicationType: value as PublicationType });
      }
    },
    [setFilters]
  );

  /** Handle sort by filter change with type guard */
  const handleSortByChange = useCallback(
    (value: string) => {
      const validSorts: SortByType[] = ['relevance', 'date', 'citations'];
      if (validSorts.includes(value as SortByType)) {
        setFilters({ sortBy: value as SortByType });
      }
    },
    [setFilters]
  );

  // ==========================================================================
  // Handlers - Presets
  // ==========================================================================

  /** Save current filter configuration as preset */
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;
    addPreset(presetName.trim());
    setPresetName('');
    logger.info('Filter preset saved', 'UnifiedFilterSection', { name: presetName });
  }, [presetName, addPreset]);

  /** Load a saved preset */
  const handleLoadPreset = useCallback(
    (presetId: string) => {
      loadPreset(presetId);
      logger.info('Filter preset loaded', 'UnifiedFilterSection', { presetId });
    },
    [loadPreset]
  );

  /** Delete a saved preset */
  const handleDeletePreset = useCallback(
    (presetId: string) => {
      deletePreset(presetId);
      logger.info('Filter preset deleted', 'UnifiedFilterSection', { presetId });
    },
    [deletePreset]
  );

  // ==========================================================================
  // Computed Values - Hydration Safe
  // ==========================================================================

  const safeAcademicCount = mounted ? academicDatabases.length : 0;
  const safeAlternativeCount = mounted ? alternativeSources.length : 0;
  const safeSocialCount = mounted ? socialPlatforms.length : 0;
  const totalSourceCount = safeAcademicCount + safeAlternativeCount + safeSocialCount;

  // ==========================================================================
  // Render
  // ==========================================================================

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-t mt-4 pt-4"
    >
      {/* Tab Navigation - WCAG Compliant */}
      <div
        role="tablist"
        aria-label="Filter categories"
        className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit"
      >
        {TAB_CONFIG.map((tab) => {
          const isSelected = activeTab === tab.id;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                // Arrow key navigation for tabs (WCAG 2.1 AA requirement)
                const currentIndex = TAB_CONFIG.findIndex((t) => t.id === tab.id);
                if (currentIndex === -1) return;

                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextIndex = (currentIndex + 1) % TAB_CONFIG.length;
                  const nextTab = TAB_CONFIG[nextIndex];
                  if (nextTab) setActiveTab(nextTab.id);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevIndex = (currentIndex - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
                  const prevTab = TAB_CONFIG[prevIndex];
                  if (prevTab) setActiveTab(prevTab.id);
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <tab.IconComponent className="w-4 h-4" aria-hidden="true" />
              {tab.label}
              {tab.id === 'sources' && totalSourceCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700">
                  {totalSourceCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* SOURCES TAB */}
        {activeTab === 'sources' && (
          <motion.div
            key="sources"
            id={`${baseId}-panel-sources`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-sources`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {totalSourceCount} source{totalSourceCount !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Academic Databases */}
            <SourceCategory
              id={`${baseId}-academic`}
              title="Academic Databases"
              icon={<Database className="w-4 h-4" aria-hidden="true" />}
              count={safeAcademicCount}
              total={ACADEMIC_DATABASES.length}
              color="blue"
              expanded={expandedCategories.academic}
              onToggle={() => toggleCategory('academic')}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACADEMIC_DATABASES.map((db) => {
                  const isSelected = mounted && academicDatabases.includes(db.id);
                  const IconComponent = getAcademicIcon(db.id);
                  const checkboxId = `${baseId}-db-${db.id}`;

                  return (
                    <button
                      key={db.id}
                      id={checkboxId}
                      onClick={() => handleDatabaseToggle(db.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all',
                        'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                        isSelected
                          ? 'border-blue-300 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      )}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded shrink-0" aria-hidden="true" />
                      )}
                      <span className="shrink-0">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                      </span>
                      <span className="text-sm truncate">{db.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                All academic databases are free to search
              </p>
            </SourceCategory>

            {/* Alternative Sources */}
            <SourceCategory
              id={`${baseId}-alternative`}
              title="Alternative Sources"
              icon={<GitBranch className="w-4 h-4" aria-hidden="true" />}
              count={safeAlternativeCount}
              total={ALTERNATIVE_SOURCES.length}
              color="indigo"
              expanded={expandedCategories.alternative}
              onToggle={() => toggleCategory('alternative')}
            >
              <div className="flex flex-wrap gap-2">
                {ALTERNATIVE_SOURCES.map((source) => {
                  const isSelected = mounted && alternativeSources.includes(source.id);

                  return (
                    <button
                      key={source.id}
                      onClick={() => handleAlternativeToggle(source.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                        isSelected
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      )}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <span aria-hidden="true">{source.icon}</span>
                      <span>{source.label}</span>
                      {source.status === 'beta' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Beta
                        </Badge>
                      )}
                      {source.status === 'planned' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400">
                          Soon
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Expert knowledge beyond traditional databases
              </p>
            </SourceCategory>

            {/* Social Media */}
            <SourceCategory
              id={`${baseId}-social`}
              title="Social Media"
              icon={<MessageSquare className="w-4 h-4" aria-hidden="true" />}
              count={safeSocialCount}
              total={SOCIAL_PLATFORMS.length}
              color="purple"
              expanded={expandedCategories.social}
              onToggle={() => toggleCategory('social')}
            >
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const isSelected = mounted && socialPlatforms.includes(platform.id);

                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleSocialToggle(platform.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
                        isSelected
                          ? 'border-purple-300 bg-purple-50 text-purple-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      )}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <span aria-hidden="true">{platform.icon}</span>
                      <span>{platform.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Trending discussions and expert insights
              </p>
            </SourceCategory>
          </motion.div>
        )}

        {/* FILTERS TAB */}
        {activeTab === 'filters' && (
          <motion.div
            key="filters"
            id={`${baseId}-panel-filters`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-filters`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Year Range */}
              <div>
                <label
                  htmlFor={`${baseId}-year-from`}
                  className="text-sm font-medium block mb-1"
                >
                  Year Range
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({YEAR_DEFAULT_FROM}-{CURRENT_YEAR})
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id={`${baseId}-year-from`}
                    type="number"
                    placeholder="From"
                    min={YEAR_MIN}
                    max={CURRENT_YEAR}
                    value={filters.yearFrom ?? ''}
                    onChange={(e) => handleYearFromChange(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    id={`${baseId}-year-to`}
                    type="number"
                    placeholder="To"
                    min={YEAR_MIN}
                    max={CURRENT_YEAR}
                    value={filters.yearTo ?? ''}
                    onChange={(e) => handleYearToChange(e.target.value)}
                    className="w-full"
                    aria-label="Year to"
                  />
                </div>
              </div>

              {/* Author Filter */}
              <div>
                <label htmlFor={`${baseId}-author`} className="text-sm font-medium block mb-1">
                  Author
                </label>
                <Input
                  id={`${baseId}-author`}
                  type="text"
                  placeholder="e.g., Smith"
                  value={filters.author}
                  onChange={(e) => handleAuthorChange(e.target.value)}
                  maxLength={AUTHOR_MAX_LENGTH}
                />
              </div>

              {/* Min Citations */}
              <div>
                <label htmlFor={`${baseId}-citations`} className="text-sm font-medium block mb-1">
                  Min Citations
                </label>
                <Input
                  id={`${baseId}-citations`}
                  type="number"
                  placeholder="e.g., 10"
                  value={filters.minCitations ?? ''}
                  onChange={(e) => handleMinCitationsChange(e.target.value)}
                  min={0}
                  max={CITATIONS_MAX}
                />
              </div>

              {/* Publication Type */}
              <div>
                <label htmlFor={`${baseId}-pub-type`} className="text-sm font-medium block mb-1">
                  Publication Type
                </label>
                <select
                  id={`${baseId}-pub-type`}
                  value={filters.publicationType}
                  onChange={(e) => handlePublicationTypeChange(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="journal">Journal Articles</option>
                  <option value="conference">Conference Papers</option>
                  <option value="preprint">Preprints</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor={`${baseId}-sort-by`} className="text-sm font-medium block mb-1">
                  Sort By
                </label>
                <select
                  id={`${baseId}-sort-by`}
                  value={filters.sortBy}
                  onChange={(e) => handleSortByChange(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="citations">Citations</option>
                  <option value="date">Date (Newest)</option>
                </select>
              </div>
            </div>

            {/* Phase 10.195: Advanced Research Filters */}
            <div className="flex flex-wrap gap-4 pt-2">
              {/* Full-Text Only Toggle */}
              <button
                type="button"
                onClick={() => setFilters({ hasFullTextOnly: !filters.hasFullTextOnly })}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
                  filters.hasFullTextOnly
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
                role="checkbox"
                aria-checked={filters.hasFullTextOnly}
              >
                <FileText className={cn('w-4 h-4', filters.hasFullTextOnly ? 'text-green-600' : 'text-gray-400')} />
                <span className="text-sm font-medium">Full-Text Only</span>
                {filters.hasFullTextOnly && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </button>

              {/* Exclude Books Toggle */}
              <button
                type="button"
                onClick={() => setFilters({ excludeBooks: !filters.excludeBooks })}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1',
                  filters.excludeBooks
                    ? 'border-orange-300 bg-orange-50 text-orange-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
                role="checkbox"
                aria-checked={filters.excludeBooks}
              >
                <BookX className={cn('w-4 h-4', filters.excludeBooks ? 'text-orange-600' : 'text-gray-400')} />
                <span className="text-sm font-medium">Exclude Books</span>
                {filters.excludeBooks && (
                  <Check className="w-4 h-4 text-orange-600" />
                )}
              </button>
            </div>

            {/* Quality Info */}
            <Alert className="bg-blue-50 border-blue-200">
              <Award className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Quality Scoring:</strong> Papers scored using v4.0 methodology -{' '}
                <span className="text-blue-700">30% Citations</span>,{' '}
                <span className="text-blue-700">50% Journal Prestige</span>,{' '}
                <span className="text-blue-700">20% Recency</span>.
                Papers with score 50+ are "Good Quality"; 70+ are "Excellent."
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button
                onClick={applyFilters}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}

        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <motion.div
            key="presets"
            id={`${baseId}-panel-presets`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-presets`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Save New Preset */}
            <div className="flex gap-2">
              <Input
                id={`${baseId}-preset-name`}
                placeholder="Preset name (e.g., Recent AI Papers)"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                aria-label="Preset name"
                className="flex-1"
              />
              <Button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Star className="w-4 h-4 mr-2" aria-hidden="true" />
                Save Current
              </Button>
            </div>

            {/* Saved Presets */}
            {savedPresets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Saved Presets ({savedPresets.length})
                </p>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Saved filter presets">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      role="listitem"
                      className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2"
                    >
                      <button
                        onClick={() => handleLoadPreset(preset.id)}
                        className="text-sm font-medium text-purple-700 hover:text-purple-900 focus:outline-none focus:underline"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="text-gray-400 hover:text-red-600 ml-1 focus:outline-none focus:text-red-600"
                        aria-label={`Delete preset: ${preset.name}`}
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" role="status">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-sm">No saved presets yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Configure your filters and save them for quick access
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

UnifiedFilterSection.displayName = 'UnifiedFilterSection';
