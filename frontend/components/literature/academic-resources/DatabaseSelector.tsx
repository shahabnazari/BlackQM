/**
 * DatabaseSelector Component
 * Phase 10.91 Day 12 - Extracted from AcademicResourcesPanel.tsx (lines 296-542)
 *
 * ============================================================================
 * 🏗️ ARCHITECTURAL PATTERN - COMPONENT EXTRACTION
 * ============================================================================
 *
 * REFACTORING STRATEGY:
 * Extracted database selection UI into focused component to reduce parent from
 * 711 lines → < 400 lines. Follows Single Responsibility Principle.
 *
 * BEFORE REFACTORING (Anti-Pattern):
 * - 711-line monolithic component
 * - Database UI, auth, metrics, and actions all mixed
 * - Hard to test, maintain, or reuse
 * - Violates SRP and component size guidelines (< 400 lines)
 *
 * AFTER REFACTORING (Clean Pattern):
 * - Focused 250-line component for database selection only
 * - Clear props interface with TypeScript
 * - Reusable across different contexts
 * - Easier to test in isolation
 * - Follows Next.js App Router best practices
 *
 * ============================================================================
 * ⚠️ CRITICAL: MODIFICATION STRATEGY
 * ============================================================================
 *
 * IF YOU NEED TO MODIFY THIS:
 * ✅ DO:
 * - Add new database sources to constants.ts (ACADEMIC_DATABASES array)
 * - Update categories ('Free' | 'Premium') in constants.ts
 * - Enhance accessibility (ARIA labels, keyboard navigation)
 * - Improve visual design (animations, colors, responsiveness)
 *
 * ❌ DON'T:
 * - Mix business logic here (keep in parent/hooks)
 * - Add API calls directly (use callbacks via props)
 * - Hardcode database list (use constants.ts)
 * - Exceed 400 lines (extract further if needed)
 * - Use `any` types (maintain strict TypeScript)
 *
 * ============================================================================
 * 📊 PRINCIPLES FOLLOWED
 * ============================================================================
 *
 * 1. **Single Responsibility**: Only handles database selection UI
 * 2. **Composition**: Renders list of database cards from configuration
 * 3. **Accessibility**: Full ARIA support, keyboard navigation, semantic HTML
 * 4. **TypeScript**: Strong typing, no `any`, explicit interfaces
 * 5. **Performance**: React.memo for re-render optimization
 * 6. **Maintainability**: Clear structure, DRY, constants extracted
 * 7. **Responsive Design**: Grid adapts to screen size (sm/lg/xl breakpoints)
 * 8. **Visual Hierarchy**: Clear Free vs Premium categorization
 */

'use client';

import React from 'react';
import { Badge } from '@/components/apple-ui/Badge/Badge';
import { FREE_DATABASES, PREMIUM_DATABASES, DATABASE_COUNTS } from './constants';
import type { AcademicDatabase } from './constants';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseSelectorProps {
  /** Currently selected database IDs */
  selectedDatabases: string[];
  /** Callback when database selection changes */
  onDatabaseToggle: (databaseId: string) => void;
  /** Function to get icon component for a source */
  getSourceIcon: (
    source: string
  ) => React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Component
// ============================================================================

export const DatabaseSelector = React.memo<DatabaseSelectorProps>(
  function DatabaseSelector({
    selectedDatabases,
    onDatabaseToggle,
    getSourceIcon,
  }) {
    return (
      <div className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Select Academic Databases
          </label>
          <Badge
            variant={selectedDatabases.length > 0 ? 'success' : 'outline'}
            size="md"
            className="font-medium"
          >
            {selectedDatabases.length} selected
          </Badge>
        </div>

        {/* Open Access Sources */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="success"
              size="sm"
              className="uppercase text-xs font-bold"
            >
              Open Access ({DATABASE_COUNTS.FREE} sources)
            </Badge>
            <span className="text-xs text-gray-500">
              Free to access • No authentication required
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {FREE_DATABASES.map(source => (
              <DatabaseCard
                key={source.id}
                database={source}
                isSelected={selectedDatabases.includes(source.id)}
                onToggle={() => onDatabaseToggle(source.id)}
                getSourceIcon={getSourceIcon}
                variant="free"
              />
            ))}
          </div>
        </div>

        {/* Premium Sources */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="warning"
              size="sm"
              className="uppercase text-xs font-bold"
            >
              Premium ({DATABASE_COUNTS.PREMIUM} sources)
            </Badge>
            <span className="text-xs text-gray-500">
              Authentication required for access
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {PREMIUM_DATABASES.map(source => (
              <DatabaseCard
                key={source.id}
                database={source}
                isSelected={selectedDatabases.includes(source.id)}
                onToggle={() => onDatabaseToggle(source.id)}
                getSourceIcon={getSourceIcon}
                variant="premium"
              />
            ))}
          </div>
        </div>

        {/* Helper Text */}
        {selectedDatabases.length === 0 && (
          <div className="text-center py-4 px-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Select at least one database to begin your search
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Tip: Start with open access sources for free full-text articles
            </p>
          </div>
        )}
      </div>
    );
  }
);

// ============================================================================
// Sub-Component: DatabaseCard
// ============================================================================

interface DatabaseCardProps {
  database: AcademicDatabase;
  isSelected: boolean;
  onToggle: () => void;
  getSourceIcon: (
    source: string
  ) => React.ComponentType<{ className?: string }>;
  variant: 'free' | 'premium';
}

const DatabaseCard = React.memo<DatabaseCardProps>(function DatabaseCard({
  database,
  isSelected,
  onToggle,
  getSourceIcon,
  variant,
}) {
  const IconComponent = getSourceIcon(database.id);

  const colors = {
    free: {
      selected: {
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
        border: 'border-green-400 dark:border-green-600',
        shadow: 'shadow-lg shadow-green-100 dark:shadow-green-900/30',
        text: 'text-green-900 dark:text-green-100',
        icon: 'text-green-600 dark:text-green-400',
        indicator: 'bg-green-500',
      },
      unselected: {
        border: 'hover:border-green-300 dark:hover:border-green-700',
        text: 'text-gray-800 dark:text-gray-200 group-hover:text-green-800 dark:group-hover:text-green-200',
        icon: 'text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400',
        hover: 'from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20',
      },
      ring: 'focus-visible:ring-green-500',
    },
    premium: {
      selected: {
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950',
        border: 'border-amber-400 dark:border-amber-600',
        shadow: 'shadow-lg shadow-amber-100 dark:shadow-amber-900/30',
        text: 'text-amber-900 dark:text-amber-100',
        icon: 'text-amber-600 dark:text-amber-400',
        indicator: 'bg-amber-500',
      },
      unselected: {
        border: 'hover:border-amber-300 dark:hover:border-amber-700',
        text: 'text-gray-800 dark:text-gray-200 group-hover:text-amber-800 dark:group-hover:text-amber-200',
        icon: 'text-gray-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400',
        hover: 'from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20',
      },
      ring: 'focus-visible:ring-amber-500',
    },
  };

  const theme = colors[variant];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        group relative overflow-hidden
        rounded-lg border-2 p-3
        transition-all duration-300 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 ${theme.ring} focus-visible:ring-offset-2
        ${
          isSelected
            ? `${theme.selected.bg} ${theme.selected.border} ${theme.selected.shadow}`
            : `bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 ${theme.unselected.border} hover:shadow-md backdrop-blur-sm`
        }
      `}
      title={database.desc}
      aria-pressed={isSelected}
      aria-label={`${database.label} - ${database.desc}`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div
          className={`absolute top-1.5 right-1.5 w-4 h-4 ${theme.selected.indicator} rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200`}
        >
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* Premium Badge */}
      {variant === 'premium' && !isSelected && (
        <div className="absolute top-1.5 right-1.5">
          <Badge
            variant="warning"
            size="sm"
            className="text-[9px] px-1 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            API
          </Badge>
        </div>
      )}

      {/* Icon */}
      <div
        className={`
          mb-1.5 transition-transform duration-300
          ${isSelected ? 'scale-110' : 'group-hover:scale-110'}
        `}
      >
        <IconComponent className={`w-5 h-5 ${isSelected ? theme.selected.icon : theme.unselected.icon}`} />
      </div>

      {/* Label */}
      <div className="text-left space-y-0.5">
        <div className={`font-semibold text-xs transition-colors ${isSelected ? theme.selected.text : theme.unselected.text}`}>
          {database.label}
        </div>
        <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight min-h-[1.25rem]">
          {database.desc}
        </div>
      </div>

      {/* Glassmorphism effect on hover */}
      <div
        className={`
          absolute inset-0 -z-10 opacity-0 group-hover:opacity-100
          bg-gradient-to-br ${theme.unselected.hover}
          transition-opacity duration-300 rounded-xl backdrop-blur-sm
        `}
      />
    </button>
  );
});
