/**
 * Phase 10.175: Thematization Pricing Card Component
 *
 * Netflix-grade component for displaying thematization pricing breakdown.
 * Shows base cost, feature costs, discounts, and total with transparency.
 *
 * DESIGN PRINCIPLES:
 * - Clear cost breakdown with line items
 * - Visual discount indicators
 * - Responsive layout
 * - Accessible pricing information
 *
 * @module ThematizationPricingCard
 * @since Phase 10.175
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Coins,
  Info,
  CheckCircle2,
  GitBranch,
  AlertTriangle,
  MessageSquare,
  Target,
  Percent,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import {
  ThematizationTierCount,
  ThematizationPipelineFlags,
  FEATURE_METADATA,
  SubscriptionTier,
  SUBSCRIPTION_CONFIGS,
  calculateDetailedCost,
  formatCredits,
  formatUSD,
  getTierConfig,
} from '@/lib/types/thematization-pricing.types';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// FEATURE ICONS
// ============================================================================

const FEATURE_ICONS: Record<string, LucideIcon> = {
  target: Target,
  'git-branch': GitBranch,
  'alert-triangle': AlertTriangle,
  'message-square': MessageSquare,
};

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface ThematizationPricingCardProps {
  /** Selected tier */
  selectedTier: ThematizationTierCount;
  /** Pipeline feature flags */
  flags: ThematizationPipelineFlags;
  /** Callback when flags change */
  onFlagsChange: (flags: ThematizationPipelineFlags) => void;
  /** User's subscription tier */
  subscriptionTier: SubscriptionTier;
  /** User's remaining credits */
  remainingCredits: number;
  /** Callback when user clicks proceed */
  onProceed?: () => void;
  /** Whether proceed button is loading */
  isLoading?: boolean;
  /** Whether to show proceed button */
  showProceedButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// FEATURE TOGGLE COMPONENT
// ============================================================================

interface FeatureToggleProps {
  displayName: string;
  description: string;
  costCredits: number;
  icon: string;
  isEnabled: boolean;
  isIncluded: boolean;
  onToggle: (enabled: boolean) => void;
}

const FeatureToggle = React.memo(function FeatureToggle({
  displayName,
  description,
  costCredits,
  icon,
  isEnabled,
  isIncluded,
  onToggle,
}: FeatureToggleProps) {
  const Icon = FEATURE_ICONS[icon] || Target;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{displayName}</span>
            {isIncluded && (
              <Badge variant="secondary" className="text-xs">
                Included
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isIncluded && costCredits > 0 && (
          <span className="text-sm text-muted-foreground">
            +{formatCredits(costCredits)}
          </span>
        )}
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isIncluded}
          aria-label={`Toggle ${displayName}`}
        />
      </div>
    </div>
  );
});

FeatureToggle.displayName = 'FeatureToggle';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ThematizationPricingCard Component
 *
 * Displays detailed pricing breakdown for thematization analysis.
 * Includes feature toggles, discount information, and affordability check.
 *
 * @component
 * @memoized
 */
export const ThematizationPricingCard = React.memo(function ThematizationPricingCard({
  selectedTier,
  flags,
  onFlagsChange,
  subscriptionTier,
  remainingCredits,
  onProceed,
  isLoading = false,
  showProceedButton = true,
  className = '',
}: ThematizationPricingCardProps) {
  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /**
   * Calculate detailed cost breakdown
   */
  const costBreakdown = useMemo(() => {
    return calculateDetailedCost(selectedTier, flags, subscriptionTier, remainingCredits);
  }, [selectedTier, flags, subscriptionTier, remainingCredits]);

  /**
   * Get tier configuration
   */
  const tierConfig = useMemo(() => getTierConfig(selectedTier), [selectedTier]);

  /**
   * Get subscription configuration
   */
  const subscriptionConfig = useMemo(
    () => SUBSCRIPTION_CONFIGS[subscriptionTier],
    [subscriptionTier]
  );

  /**
   * Check if user can afford
   */
  const canAfford = useMemo(() => {
    return remainingCredits >= costBreakdown.finalCost;
  }, [remainingCredits, costBreakdown.finalCost]);

  /**
   * Total discounts applied
   */
  const totalDiscounts = useMemo(() => {
    const { subscriptionDiscount = 0, bulkDiscount = 0, promoDiscount = 0 } =
      costBreakdown.discounts;
    return subscriptionDiscount + bulkDiscount + promoDiscount;
  }, [costBreakdown.discounts]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Handle feature toggle
   */
  const handleFeatureToggle = useCallback(
    (flag: keyof ThematizationPipelineFlags, enabled: boolean) => {
      logger.info('Feature toggled', 'ThematizationPricingCard', { flag, enabled });
      onFlagsChange({
        ...flags,
        [flag]: enabled,
      });
    },
    [flags, onFlagsChange]
  );

  /**
   * Handle proceed click
   */
  const handleProceed = useCallback(() => {
    if (canAfford && onProceed) {
      logger.info('Proceeding with thematization', 'ThematizationPricingCard', {
        tier: selectedTier,
        flags,
        cost: costBreakdown.finalCost,
      });
      onProceed();
    }
  }, [canAfford, onProceed, selectedTier, flags, costBreakdown.finalCost]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
          <Badge variant="outline" className={cn('text-sm', `border-${subscriptionConfig.color}-500`)}>
            {subscriptionConfig.displayName} Plan
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Base Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{tierConfig.displayName}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedTier} papers
              </Badge>
            </div>
            <span className="font-mono">{formatCredits(costBreakdown.baseCost)}</span>
          </div>
        </div>

        <Separator />

        {/* Optional Features */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Optional Features</span>
            <Tooltip
              content="Additional features incur extra credit costs"
              position="top"
            >
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </Tooltip>
          </div>

          {FEATURE_METADATA.map((feature) => (
            <FeatureToggle
              key={feature.flag}
              displayName={feature.displayName}
              description={feature.description}
              costCredits={feature.costCredits}
              icon={feature.icon}
              isEnabled={flags[feature.flag]}
              isIncluded={feature.costCredits === 0}
              onToggle={(enabled) => handleFeatureToggle(feature.flag, enabled)}
            />
          ))}
        </div>

        <Separator />

        {/* Cost Summary */}
        <div className="space-y-2">
          {/* Feature costs */}
          {costBreakdown.featureCosts > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Feature costs</span>
              <span className="font-mono">+{formatCredits(costBreakdown.featureCosts)}</span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCredits(costBreakdown.totalCost)}</span>
          </div>

          {/* Discounts */}
          {totalDiscounts > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <div className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                <span>
                  {subscriptionConfig.displayName} discount ({subscriptionConfig.discountPercent}%)
                </span>
              </div>
              <span className="font-mono">-{formatCredits(totalDiscounts)}</span>
            </div>
          )}

          {/* Final cost */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-semibold">Total Cost</span>
            <div className="text-right">
              <div className="font-mono font-semibold text-lg">
                {formatCredits(costBreakdown.finalCost)}
              </div>
              <div className="text-xs text-muted-foreground">
                ≈ {formatUSD(costBreakdown.costUSD)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Credits Status */}
        <div
          className={cn(
            'p-3 rounded-lg',
            canAfford ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200',
            'border'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canAfford ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={cn('font-medium text-sm', canAfford ? 'text-green-700' : 'text-red-700')}>
                  {canAfford ? 'Sufficient credits' : 'Insufficient credits'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCredits(remainingCredits)} available
                </p>
              </div>
            </div>
            {canAfford && costBreakdown.remainingCredits !== undefined && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">After job:</p>
                <p className="font-mono text-sm">
                  {formatCredits(costBreakdown.remainingCredits)}
                </p>
              </div>
            )}
          </div>

          {!canAfford && (
            <Button variant="link" className="p-0 h-auto mt-2 text-red-600" asChild>
              <a href="/settings/billing">
                <CreditCard className="w-4 h-4 mr-1" />
                Upgrade to add credits
              </a>
            </Button>
          )}
        </div>
      </CardContent>

      {/* Proceed Button */}
      {showProceedButton && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleProceed}
            disabled={!canAfford || isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Start Analysis ({formatCredits(costBreakdown.finalCost)})
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
});

ThematizationPricingCard.displayName = 'ThematizationPricingCard';

// ============================================================================
// EXPORTS
// ============================================================================

export default ThematizationPricingCard;
