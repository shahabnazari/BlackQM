/**
 * Research Purpose Selector Component
 * Phase 10.170: Purpose-Aware Search Integration
 *
 * Netflix-grade dropdown for selecting research purpose that affects:
 * - Quality weights (citation impact, journal prestige, recency)
 * - Paper limits (target count based on methodology)
 * - Full-text requirements (critical for qualitative analysis)
 * - Diversity metrics (important for Q-methodology)
 *
 * @module ResearchPurposeSelector
 * @since Phase 10.170
 * @author VQMethod Team
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Target, Lightbulb, BookOpen, FlaskConical, ClipboardList, HelpCircle, type LucideIcon } from 'lucide-react';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import type { ResearchPurpose } from '@/lib/services/literature-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Purpose Validation
// ============================================================================

/**
 * Valid research purpose values
 * Used for runtime validation before type casting
 * SECURITY: Prevents invalid purpose values from being set
 */
const VALID_PURPOSES: readonly ResearchPurpose[] = [
  'q_methodology',
  'qualitative_analysis',
  'literature_synthesis',
  'hypothesis_generation',
  'survey_construction',
] as const;

/**
 * Type guard to validate if a string is a valid ResearchPurpose
 * @param value - String value to validate
 * @returns True if value is a valid ResearchPurpose
 */
function isValidResearchPurpose(value: string): value is ResearchPurpose {
  return VALID_PURPOSES.includes(value as ResearchPurpose);
}

// ============================================================================
// Purpose Configuration
// ============================================================================

interface PurposeConfig {
  label: string;
  description: string;
  Icon: LucideIcon;
  paperRange: string;
  emphasis: string;
  color: string;
}

/**
 * Purpose metadata for UI display
 * Synchronized with backend PURPOSE_FETCHING_CONFIG
 */
const PURPOSE_CONFIGS: Record<ResearchPurpose, PurposeConfig> = {
  q_methodology: {
    label: 'Q-Methodology',
    description: 'Subjective viewpoint analysis requiring diverse perspectives',
    Icon: Target,
    paperRange: '500-800 papers',
    emphasis: 'Diversity over prestige (Einstein Insight)',
    color: 'text-purple-600',
  },
  qualitative_analysis: {
    label: 'Qualitative Analysis',
    description: 'Deep textual analysis requiring full-text access',
    Icon: BookOpen,
    paperRange: '50-200 papers',
    emphasis: 'Full-text content priority',
    color: 'text-blue-600',
  },
  literature_synthesis: {
    label: 'Literature Synthesis',
    description: 'Comprehensive review of research landscape',
    Icon: Lightbulb,
    paperRange: '400-500 papers',
    emphasis: 'Coverage and citations',
    color: 'text-amber-600',
  },
  hypothesis_generation: {
    label: 'Hypothesis Generation',
    description: 'Identifying patterns for new research directions',
    Icon: FlaskConical,
    paperRange: '100-300 papers',
    emphasis: 'Novel findings and gaps',
    color: 'text-green-600',
  },
  survey_construction: {
    label: 'Survey Construction',
    description: 'Building validated survey instruments',
    Icon: ClipboardList,
    paperRange: '100-200 papers',
    emphasis: 'Validated scales and items',
    color: 'text-rose-600',
  },
};

/**
 * Pre-computed entries array for PURPOSE_CONFIGS
 * OPTIMIZATION: Computed once at module load, not on every render
 * Prevents unnecessary array creation in render loop
 */
const PURPOSE_CONFIG_ENTRIES = Object.entries(PURPOSE_CONFIGS) as [ResearchPurpose, PurposeConfig][];

// ============================================================================
// Component Props
// ============================================================================

interface ResearchPurposeSelectorProps {
  /** Compact mode for inline display */
  compact?: boolean;
  /** Show tooltip with purpose details */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * ResearchPurposeSelector Component
 *
 * Allows researchers to select their research purpose for optimized search.
 * Purpose selection affects backend quality scoring and paper limits.
 *
 * @component
 * @memoized
 */
export const ResearchPurposeSelector = React.memo(
  function ResearchPurposeSelector({
    compact = false,
    showTooltip = true,
    className = '',
  }: ResearchPurposeSelectorProps): JSX.Element {
    // ==========================================================================
    // Store State
    // ==========================================================================

    const researchPurpose = useLiteratureSearchStore((state) => state.researchPurpose);
    const setResearchPurpose = useLiteratureSearchStore((state) => state.setResearchPurpose);

    // ==========================================================================
    // Handlers
    // ==========================================================================

    /**
     * Handle purpose selection change
     * @memoized
     */
    const handlePurposeChange = useCallback(
      (value: string) => {
        // Handle 'none' selection (clears purpose)
        if (value === 'none') {
          logger.info('Research purpose cleared', 'ResearchPurposeSelector', {
            from: researchPurpose,
            to: null,
          });
          setResearchPurpose(null);
          return;
        }

        // SECURITY: Validate purpose before setting
        if (!isValidResearchPurpose(value)) {
          logger.error('Invalid research purpose value rejected', 'ResearchPurposeSelector', {
            invalidValue: value,
            validValues: VALID_PURPOSES,
          });
          return; // Silently reject invalid values
        }

        logger.info('Research purpose changed', 'ResearchPurposeSelector', {
          from: researchPurpose,
          to: value,
        });

        setResearchPurpose(value);
      },
      [researchPurpose, setResearchPurpose]
    );

    // ==========================================================================
    // Computed Values
    // ==========================================================================

    /**
     * Current purpose configuration
     */
    const currentConfig = useMemo(() => {
      if (!researchPurpose) return null;
      return PURPOSE_CONFIGS[researchPurpose];
    }, [researchPurpose]);

    /**
     * Select value for controlled component
     */
    const selectValue = useMemo(() => {
      return researchPurpose ?? 'none';
    }, [researchPurpose]);

    /**
     * Tooltip content for current purpose
     */
    const tooltipContent = useMemo(() => {
      if (!currentConfig) return null;
      return (
        <div className="space-y-1">
          <p className="font-medium">{currentConfig.label}</p>
          <p className="text-xs text-gray-300">{currentConfig.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
              {currentConfig.paperRange}
            </span>
            <span className="text-xs text-gray-400">{currentConfig.emphasis}</span>
          </div>
        </div>
      );
    }, [currentConfig]);

    // ==========================================================================
    // Render
    // ==========================================================================

    const selector = (
      <div className={`flex items-center gap-2 ${className}`}>
        {!compact && (
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Research Purpose:
          </span>
        )}

        <Select value={selectValue} onValueChange={handlePurposeChange}>
          <SelectTrigger
            className={`${compact ? 'w-[180px]' : 'w-[220px]'} bg-background`}
            aria-label="Select research purpose"
          >
            <SelectValue placeholder="Select purpose..." />
          </SelectTrigger>

          <SelectContent>
            {/* Default option */}
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span>General Search</span>
              </div>
            </SelectItem>

            {/* Purpose options - using pre-computed entries for optimization */}
            {PURPOSE_CONFIG_ENTRIES.map(([purpose, config]) => {
              const Icon = config.Icon;
              return (
                <SelectItem key={purpose} value={purpose}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Purpose badge with details */}
        {currentConfig && !compact && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {currentConfig.paperRange}
          </Badge>
        )}
      </div>
    );

    // Wrap with tooltip if enabled and purpose is selected
    if (showTooltip && currentConfig && tooltipContent) {
      return (
        <Tooltip content={tooltipContent} position="bottom">
          {selector}
        </Tooltip>
      );
    }

    return selector;
  }
);

ResearchPurposeSelector.displayName = 'ResearchPurposeSelector';

// ============================================================================
// Exports
// ============================================================================

export { PURPOSE_CONFIGS };
export type { PurposeConfig, ResearchPurposeSelectorProps };
