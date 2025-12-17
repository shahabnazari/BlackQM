/**
 * Phase 10.175: Tier Selection Card Component
 *
 * Netflix-grade component for selecting thematization analysis tiers.
 * Displays all 6 tiers with pricing, estimated time, and use cases.
 *
 * DESIGN PRINCIPLES:
 * - Clear visual hierarchy for tier comparison
 * - Responsive grid layout (1-3 columns)
 * - Accessible keyboard navigation
 * - Memoized for performance
 *
 * @module TierSelectionCard
 * @since Phase 10.175
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Clock,
  Coins,
  CheckCircle2,
  Star,
} from 'lucide-react';
import {
  ThematizationTierCount,
  THEMATIZATION_TIERS,
  TierConfig,
  getTierConfig,
  formatCredits,
  formatTimeEstimate,
  getTierBadgeColor,
} from '@/lib/types/thematization-pricing.types';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface TierSelectionCardProps {
  /** Currently selected tier */
  selectedTier: ThematizationTierCount | null;
  /** Callback when tier is selected */
  onTierSelect: (tier: ThematizationTierCount) => void;
  /** Available papers count (for tier availability) */
  availablePapers?: number;
  /** User's remaining credits (for affordability check) */
  remainingCredits?: number;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Compact mode (smaller cards) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SINGLE TIER CARD COMPONENT
// ============================================================================

interface SingleTierCardProps {
  tier: ThematizationTierCount;
  config: TierConfig;
  isSelected: boolean;
  isDisabled: boolean;
  disabledReason: string | undefined;
  onSelect: () => void;
  compact: boolean;
}

const SingleTierCard = React.memo(function SingleTierCard({
  tier,
  config,
  isSelected,
  isDisabled,
  disabledReason,
  onSelect,
  compact,
}: SingleTierCardProps) {
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onSelect();
    }
  }, [isDisabled, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
        e.preventDefault();
        onSelect();
      }
    },
    [isDisabled, onSelect]
  );

  const cardContent = (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected && 'border-primary border-2 shadow-md bg-primary/5',
        isDisabled && 'opacity-50 cursor-not-allowed hover:shadow-none hover:border-border',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isDisabled ? -1 : 0}
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      aria-label={`${config.displayName}: ${tier} papers, ${formatCredits(config.baseCostCredits)}`}
    >
      {/* Recommended badge */}
      {config.isRecommended && (
        <Badge
          className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
          variant="default"
        >
          <Star className="w-3 h-3 mr-1" />
          Recommended
        </Badge>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
        </div>
      )}

      <CardHeader className={cn('p-0', compact ? 'mb-2' : 'mb-3')}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
            {config.displayName}
          </CardTitle>
          <Badge className={cn(getTierBadgeColor(tier), 'font-mono')}>
            {tier} papers
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {/* Description */}
        {!compact && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="w-4 h-4" />
            <span className="font-medium text-foreground">
              {formatCredits(config.baseCostCredits)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTimeEstimate(config.estimatedTimeMinutes)}</span>
          </div>
        </div>

        {/* Use cases (only in non-compact mode) */}
        {!compact && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Best for:
            </p>
            <div className="flex flex-wrap gap-1">
              {config.useCases.map((useCase, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {useCase}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Wrap with tooltip if disabled
  if (isDisabled && disabledReason) {
    return (
      <Tooltip content={disabledReason} position="top">
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
});

SingleTierCard.displayName = 'SingleTierCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TierSelectionCard Component
 *
 * Displays a grid of tier options for thematization analysis selection.
 * Handles selection state, availability checks, and affordability validation.
 *
 * @component
 * @memoized
 */
export const TierSelectionCard = React.memo(function TierSelectionCard({
  selectedTier,
  onTierSelect,
  availablePapers,
  remainingCredits,
  disabled = false,
  compact = false,
  className = '',
}: TierSelectionCardProps) {
  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /**
   * Pre-compute tier availability and affordability
   */
  const tierStates = useMemo(() => {
    return THEMATIZATION_TIERS.map((tier) => {
      const config = getTierConfig(tier);
      let isDisabled = disabled;
      let disabledReason: string | undefined;

      // Check paper availability
      if (availablePapers !== undefined && availablePapers < tier) {
        isDisabled = true;
        disabledReason = `Need at least ${tier} papers (you have ${availablePapers})`;
      }

      // Check credit affordability
      if (remainingCredits !== undefined && remainingCredits < config.baseCostCredits) {
        isDisabled = true;
        disabledReason = `Insufficient credits (need ${config.baseCostCredits}, have ${remainingCredits})`;
      }

      return {
        tier,
        config,
        isDisabled,
        disabledReason,
      };
    });
  }, [availablePapers, remainingCredits, disabled]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Handle tier selection
   */
  const handleTierSelect = useCallback(
    (tier: ThematizationTierCount) => {
      logger.info('Tier selected', 'TierSelectionCard', {
        previousTier: selectedTier,
        newTier: tier,
      });
      onTierSelect(tier);
    },
    [selectedTier, onTierSelect]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Analysis Tier</h3>
          <p className="text-sm text-muted-foreground">
            Choose how many papers to include in your thematic analysis
          </p>
        </div>
        {remainingCredits !== undefined && (
          <Badge variant="outline" className="text-sm">
            <Coins className="w-4 h-4 mr-1" />
            {formatCredits(remainingCredits)} available
          </Badge>
        )}
      </div>

      {/* Tier Grid */}
      <div
        className={cn(
          'grid gap-4',
          compact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
        role="radiogroup"
        aria-label="Analysis tier selection"
      >
        {tierStates.map(({ tier, config, isDisabled, disabledReason }) => (
          <SingleTierCard
            key={tier}
            tier={tier}
            config={config}
            isSelected={selectedTier === tier}
            isDisabled={isDisabled}
            disabledReason={disabledReason}
            onSelect={() => handleTierSelect(tier)}
            compact={compact}
          />
        ))}
      </div>

      {/* Selection summary */}
      {selectedTier && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Selected: {getTierConfig(selectedTier).displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedTier} papers • {formatCredits(getTierConfig(selectedTier).baseCostCredits)} base cost
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated time</p>
              <p className="font-medium">
                {formatTimeEstimate(getTierConfig(selectedTier).estimatedTimeMinutes)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TierSelectionCard.displayName = 'TierSelectionCard';

// ============================================================================
// EXPORTS
// ============================================================================

export default TierSelectionCard;
