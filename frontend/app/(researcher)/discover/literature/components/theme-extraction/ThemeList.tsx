/**
 * Theme List Component
 * Phase 10.935 Day 2 Evening: Component Size Reduction
 *
 * **Purpose:**
 * Extract theme list rendering logic from ThemeExtractionContainer.
 * Renders theme cards with guidance components (source summary, count guidance, methodology).
 *
 * **Responsibilities:**
 * - Render source summary card
 * - Render theme count guidance (conditional based on purpose and saturation data)
 * - Render methodology explainer
 * - Render theme cards with selection controls
 * - Handle theme selection toggle
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO 'any')
 * - ✅ Proper memoization (React.memo)
 * - ✅ Defensive programming (null checks)
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Accessibility (semantic HTML, ARIA labels)
 *
 * @module ThemeList
 * @since Phase 10.935 Day 2 Evening
 */

'use client';

import React from 'react';
import EnterpriseThemeCard from '@/components/literature/EnterpriseThemeCard';
import ThemeCountGuidance from '@/components/literature/ThemeCountGuidance';
import { ThemeMethodologyExplainer } from '@/components/literature/ThemeMethodologyExplainer';
import { SourceSummaryCard } from './SourceSummaryCard';
import { logger } from '@/lib/utils/logger';

// Types
import type { UnifiedTheme } from '@/lib/api/services/unified-theme-api.service';
import type { ResearchPurpose } from '@/lib/api/services/unified-theme-api.service';
import type { SaturationData } from '@/lib/stores/theme-extraction.store';

// ============================================================================
// Component Props
// ============================================================================

export interface ThemeListProps {
  /** Array of unified themes to display */
  unifiedThemes: UnifiedTheme[];
  /** Research purpose for theme extraction */
  extractionPurpose: ResearchPurpose | null;
  /** Saturation data from theme extraction (v2) */
  v2SaturationData: SaturationData | null;
  /** Array of selected theme IDs */
  selectedThemeIds: string[];
  /** Target theme count range for current purpose */
  targetRange: { min: number; max: number };
  /** Total number of sources (papers + alternative sources) */
  totalSources: number;
  /** Handler for theme selection toggle */
  onToggleSelection: (themeId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ThemeList - Presentational component for theme display
 *
 * **Extracted from ThemeExtractionContainer to reduce component size.**
 *
 * Renders:
 * - Source summary card (showing theme count and sources)
 * - Theme count guidance (conditional on purpose and saturation data)
 * - Methodology explainer
 * - Theme cards with selection controls
 *
 * @param props - Component props
 * @returns Rendered theme list
 *
 * @example
 * ```tsx
 * <ThemeList
 *   unifiedThemes={unifiedThemes}
 *   extractionPurpose={extractionPurpose}
 *   v2SaturationData={v2SaturationData}
 *   selectedThemeIds={selectedThemeIds}
 *   targetRange={targetRange}
 *   totalSources={totalSources}
 *   onToggleSelection={handleToggleSelection}
 * />
 * ```
 */
export const ThemeList = React.memo(function ThemeList({
  unifiedThemes,
  extractionPurpose,
  v2SaturationData,
  selectedThemeIds,
  targetRange,
  totalSources,
  onToggleSelection,
}: ThemeListProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Source Summary Card */}
      <SourceSummaryCard unifiedThemes={unifiedThemes} />

      {/* Theme Count Guidance */}
      {extractionPurpose && v2SaturationData && (
        <ThemeCountGuidance
          purpose={extractionPurpose}
          currentThemeCount={unifiedThemes.length}
          targetRange={targetRange}
          saturationData={v2SaturationData}
          totalSources={totalSources}
        />
      )}

      {/* Methodology Explainer */}
      <ThemeMethodologyExplainer />

      {/* Theme Cards */}
      {unifiedThemes.map((theme, index) => {
        if (!theme || !theme.id) {
          logger.error('Invalid theme at index', 'ThemeList', { index, theme });
          return null;
        }

        return (
          <EnterpriseThemeCard
            key={theme.id}
            theme={theme}
            index={index}
            totalThemes={unifiedThemes.length}
            purpose={extractionPurpose || 'qualitative_analysis'}
            showConfidenceBadge={true}
            showEvidence={true}
            isSelectable={true}
            isSelected={selectedThemeIds.includes(theme.id)}
            onToggleSelect={onToggleSelection}
          />
        );
      })}
    </div>
  );
});

ThemeList.displayName = 'ThemeList';
