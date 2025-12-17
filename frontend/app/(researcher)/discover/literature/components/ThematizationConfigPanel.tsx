/**
 * Phase 10.175: Thematization Configuration Panel
 *
 * Apple Human Interface Guidelines inspired configuration panel.
 * Integrates tier selection, pricing, and feature toggles in a unified experience.
 *
 * DESIGN PRINCIPLES (Apple HIG):
 * - Clean, minimal aesthetic with generous whitespace
 * - Smooth, purposeful animations (60fps)
 * - Clear visual hierarchy with SF Pro-inspired typography
 * - Subtle depth through shadows and blur
 * - Accessible with proper ARIA and keyboard navigation
 *
 * @module ThematizationConfigPanel
 * @since Phase 10.175
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  CreditCard,
  Check,
  ChevronRight,
  Zap,
  GitBranch,
  AlertTriangle,
  MessageSquareQuote,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  ThematizationTierCount,
  THEMATIZATION_TIERS,
  ThematizationPipelineFlags,
  DEFAULT_PIPELINE_FLAGS,
  getTierConfig,
  calculateDetailedCost,
  formatCredits,
  formatUSD,
  formatTimeEstimate,
  SubscriptionTier,
} from '@/lib/types/thematization-pricing.types';

// ============================================================================
// APPLE DESIGN TOKENS
// ============================================================================

const APPLE_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

const APPLE_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const TIER_GRADIENTS: Record<ThematizationTierCount, string> = {
  50: 'from-blue-50 to-blue-100/50',
  100: 'from-indigo-50 to-indigo-100/50',
  150: 'from-violet-50 to-violet-100/50',
  200: 'from-purple-50 to-purple-100/50',
  250: 'from-fuchsia-50 to-fuchsia-100/50',
  300: 'from-pink-50 to-pink-100/50',
};

const TIER_ACCENTS: Record<ThematizationTierCount, string> = {
  50: 'bg-blue-500',
  100: 'bg-indigo-500',
  150: 'bg-violet-500',
  200: 'bg-purple-500',
  250: 'bg-fuchsia-500',
  300: 'bg-pink-500',
};

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface ThematizationConfigPanelProps {
  /** Number of available papers for analysis */
  availablePapers: number;
  /** User's subscription tier */
  subscriptionTier?: SubscriptionTier;
  /** User's remaining credits */
  remainingCredits?: number;
  /** Callback when user confirms configuration */
  onConfirm: (config: ThematizationConfig) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether the panel is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface ThematizationConfig {
  tier: ThematizationTierCount;
  flags: ThematizationPipelineFlags;
  estimatedCost: number;
  estimatedTimeMinutes: number;
}

// ============================================================================
// TIER CARD COMPONENT (Apple Style)
// ============================================================================

interface TierCardProps {
  tier: ThematizationTierCount;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}

const TierCard = React.memo(function TierCard({
  tier,
  isSelected,
  isDisabled,
  onSelect,
}: TierCardProps) {
  const config = getTierConfig(tier);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      {...(!isDisabled && { whileHover: { scale: 1.02, y: -2 } })}
      {...(!isDisabled && { whileTap: { scale: 0.98 } })}
      transition={APPLE_SPRING}
      className={cn(
        'relative w-full p-5 rounded-2xl text-left transition-all duration-300',
        'bg-gradient-to-br border-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        isSelected
          ? `${TIER_GRADIENTS[tier]} border-transparent shadow-lg shadow-black/5`
          : 'from-white to-gray-50/50 border-gray-200/60 hover:border-gray-300/80',
        isDisabled && 'opacity-40 cursor-not-allowed'
      )}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
    >
      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={APPLE_SPRING}
            className={cn(
              'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center',
              TIER_ACCENTS[tier]
            )}
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          'text-2xl font-semibold tracking-tight',
          isSelected ? 'text-gray-900' : 'text-gray-700'
        )}>
          {tier}
        </span>
        <span className="text-sm text-gray-500 font-medium">papers</span>
      </div>

      {/* Tier name */}
      <p className={cn(
        'text-sm font-medium mb-2',
        isSelected ? 'text-gray-800' : 'text-gray-600'
      )}>
        {config.displayName}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5" />
          {config.baseCostCredits}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatTimeEstimate(config.estimatedTimeMinutes)}
        </span>
      </div>

      {/* Recommended badge */}
      {config.isRecommended && (
        <div className="absolute top-3 left-3">
          <Badge className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 font-medium">
            Recommended
          </Badge>
        </div>
      )}
    </motion.button>
  );
});

TierCard.displayName = 'TierCard';

// ============================================================================
// FEATURE TOGGLE COMPONENT (Apple Style)
// ============================================================================

interface FeatureToggleProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cost: number;
  isEnabled: boolean;
  isIncluded: boolean;
  onToggle: (enabled: boolean) => void;
}

const FeatureToggle = React.memo(function FeatureToggle({
  id,
  icon,
  title,
  description,
  cost,
  isEnabled,
  isIncluded,
  onToggle,
}: FeatureToggleProps) {
  return (
    <motion.div
      layout
      className={cn(
        'flex items-center justify-between p-4 rounded-xl transition-colors duration-200',
        isEnabled ? 'bg-gray-50/80' : 'bg-transparent'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200',
          isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
        )}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{title}</span>
            {isIncluded && (
              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                Included
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isIncluded && cost > 0 && (
          <span className="text-xs text-gray-400 font-medium">+{cost}</span>
        )}
        <Switch
          id={id}
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isIncluded}
          className="data-[state=checked]:bg-blue-500"
        />
      </div>
    </motion.div>
  );
});

FeatureToggle.displayName = 'FeatureToggle';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ThematizationConfigPanel Component
 *
 * Apple-inspired configuration panel for thematization settings.
 * Provides tier selection, feature toggles, and pricing summary.
 */
export const ThematizationConfigPanel = React.memo(function ThematizationConfigPanel({
  availablePapers,
  subscriptionTier = 'free',
  remainingCredits = 0,
  onConfirm,
  onCancel,
  isLoading = false,
  className = '',
}: ThematizationConfigPanelProps) {
  // ==========================================================================
  // State
  // ==========================================================================

  const [selectedTier, setSelectedTier] = useState<ThematizationTierCount>(100);
  const [flags, setFlags] = useState<ThematizationPipelineFlags>(DEFAULT_PIPELINE_FLAGS);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const costBreakdown = useMemo(() => {
    return calculateDetailedCost(selectedTier, flags, subscriptionTier, remainingCredits);
  }, [selectedTier, flags, subscriptionTier, remainingCredits]);

  const tierConfig = useMemo(() => getTierConfig(selectedTier), [selectedTier]);

  // Simple comparison - no memo needed
  const canAfford = remainingCredits >= costBreakdown.finalCost;

  // Phase 10.180: Removed wasteful useMemo - THEMATIZATION_TIERS is a constant
  // Just use the constant directly in the render

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleTierSelect = useCallback((tier: ThematizationTierCount) => {
    logger.info('Tier selected', 'ThematizationConfigPanel', { tier });
    setSelectedTier(tier);
  }, []);

  const handleFlagToggle = useCallback((flag: keyof ThematizationPipelineFlags, enabled: boolean) => {
    logger.info('Feature toggled', 'ThematizationConfigPanel', { flag, enabled });
    setFlags(prev => ({ ...prev, [flag]: enabled }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canAfford) return;

    const config: ThematizationConfig = {
      tier: selectedTier,
      flags,
      estimatedCost: costBreakdown.finalCost,
      estimatedTimeMinutes: tierConfig.estimatedTimeMinutes,
    };

    logger.info('Configuration confirmed', 'ThematizationConfigPanel', config);
    onConfirm(config);
  }, [canAfford, selectedTier, flags, costBreakdown.finalCost, tierConfig.estimatedTimeMinutes, onConfirm]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: APPLE_EASE }}
      className={cn(
        'w-full max-w-2xl mx-auto',
        'bg-white/80 backdrop-blur-xl',
        'rounded-3xl shadow-2xl shadow-black/10',
        'border border-gray-200/50',
        'overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Configure Analysis
            </h2>
            <p className="text-sm text-gray-500">
              Choose your analysis depth and features
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Tier Selection */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Analysis Tier
            </h3>
            <span className="text-xs text-gray-500">
              {availablePapers} papers available
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {THEMATIZATION_TIERS.map(tier => (
              <TierCard
                key={tier}
                tier={tier}
                isSelected={selectedTier === tier}
                isDisabled={tier > availablePapers}
                onSelect={() => handleTierSelect(tier)}
              />
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Features
            </h3>
            <Info className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-1 -mx-4">
            <FeatureToggle
              id="theme-fit"
              icon={<Zap className="w-5 h-5" />}
              title="Theme-Fit Scoring"
              description="Pre-filter papers by relevance"
              cost={0}
              isEnabled={flags.enableThemeFit}
              isIncluded={true}
              onToggle={(enabled) => handleFlagToggle('enableThemeFit', enabled)}
            />
            <FeatureToggle
              id="hierarchical"
              icon={<GitBranch className="w-5 h-5" />}
              title="Hierarchical Themes"
              description="Extract parent-child relationships"
              cost={5}
              isEnabled={flags.enableHierarchical}
              isIncluded={false}
              onToggle={(enabled) => handleFlagToggle('enableHierarchical', enabled)}
            />
            <FeatureToggle
              id="controversy"
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Controversy Analysis"
              description="Identify opposing viewpoints"
              cost={5}
              isEnabled={flags.enableControversy}
              isIncluded={false}
              onToggle={(enabled) => handleFlagToggle('enableControversy', enabled)}
            />
            <FeatureToggle
              id="claims"
              icon={<MessageSquareQuote className="w-5 h-5" />}
              title="Claim Extraction"
              description="Extract key claims for Q-methodology"
              cost={5}
              isEnabled={flags.enableClaimExtraction}
              isIncluded={false}
              onToggle={(enabled) => handleFlagToggle('enableClaimExtraction', enabled)}
            />
          </div>
        </section>

        {/* Cost Summary */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Base cost</span>
            <span className="text-sm text-gray-900">{formatCredits(costBreakdown.baseCost)}</span>
          </div>

          {costBreakdown.featureCosts > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Features</span>
              <span className="text-sm text-gray-900">+{formatCredits(costBreakdown.featureCosts)}</span>
            </div>
          )}

          {costBreakdown.discounts.subscriptionDiscount && costBreakdown.discounts.subscriptionDiscount > 0 && (
            <div className="flex items-center justify-between mb-4 text-green-600">
              <span className="text-sm font-medium">Discount</span>
              <span className="text-sm">-{formatCredits(costBreakdown.discounts.subscriptionDiscount)}</span>
            </div>
          )}

          <div className="border-t border-gray-200/60 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">
                  {formatCredits(costBreakdown.finalCost)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ≈ {formatUSD(costBreakdown.costUSD)}
                </span>
              </div>
            </div>
          </div>

          {/* Credits status */}
          <div className={cn(
            'mt-4 p-3 rounded-xl flex items-center gap-2',
            canAfford ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            {canAfford ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {formatCredits(remainingCredits)} available
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Insufficient credits ({formatCredits(remainingCredits)} available)
                </span>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={!canAfford || isLoading}
          className={cn(
            'px-6 h-11 rounded-xl font-medium',
            'bg-gradient-to-r from-blue-500 to-indigo-600',
            'hover:from-blue-600 hover:to-indigo-700',
            'text-white shadow-lg shadow-blue-500/25',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.span>
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Start Analysis
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
});

ThematizationConfigPanel.displayName = 'ThematizationConfigPanel';

// ============================================================================
// EXPORTS
// ============================================================================

export default ThematizationConfigPanel;
