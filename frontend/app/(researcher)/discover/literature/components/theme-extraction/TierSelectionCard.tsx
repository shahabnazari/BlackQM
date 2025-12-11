/**
 * Phase 10.113 Week 6: Tier Selection Card
 *
 * Netflix-grade component for selecting thematization paper count tiers.
 * Displays all tier options with pricing, estimated time, and descriptions.
 *
 * Features:
 * - Interactive tier selection (50-300 papers)
 * - Pricing display per tier
 * - Feature toggles (hierarchical, controversy, claims)
 * - Cost estimate calculation
 * - Visual tier comparison
 *
 * @module ThematizationUI
 * @since Phase 10.113 Week 6
 */

'use client';

import React, { useCallback, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Clock,
  CreditCard,
  Zap,
  BookOpen,
  Search,
  Loader2,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip } from '@/components/ui/tooltip';
import * as ThematizationPricingAPI from '@/lib/api/services/thematization-pricing-api.service';
import type {
  ThematizationTierCount,
  TierPricing,
  ThematizationPipelineFlags,
  CostEstimateResponse,
} from '@/lib/api/services/thematization-pricing-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_ICONS: Record<ThematizationTierCount, React.ReactNode> = {
  50: <Zap className="w-5 h-5" />,
  100: <BookOpen className="w-5 h-5" />,
  150: <Search className="w-5 h-5" />,
  200: <Layers className="w-5 h-5" />,
  250: <Clock className="w-5 h-5" />,
  300: <CreditCard className="w-5 h-5" />,
};

const TIER_COLORS: Record<ThematizationTierCount, string> = {
  50: 'border-blue-300 bg-blue-50',
  100: 'border-green-300 bg-green-50',
  150: 'border-purple-300 bg-purple-50',
  200: 'border-orange-300 bg-orange-50',
  250: 'border-red-300 bg-red-50',
  300: 'border-indigo-300 bg-indigo-50',
};

const TIER_SELECTED_COLORS: Record<ThematizationTierCount, string> = {
  50: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500',
  100: 'border-green-500 bg-green-100 ring-2 ring-green-500',
  150: 'border-purple-500 bg-purple-100 ring-2 ring-purple-500',
  200: 'border-orange-500 bg-orange-100 ring-2 ring-orange-500',
  250: 'border-red-500 bg-red-100 ring-2 ring-red-500',
  300: 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-500',
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface TierSelectionCardProps {
  /** Callback when tier is selected */
  onTierSelect: (tier: ThematizationTierCount) => void;
  /** Callback when features change */
  onFeaturesChange?: (flags: ThematizationPipelineFlags) => void;
  /** Initial selected tier */
  initialTier?: ThematizationTierCount;
  /** Initial feature flags */
  initialFlags?: Partial<ThematizationPipelineFlags>;
  /** Whether to show feature toggles */
  showFeatures?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TierSelectionCard = memo(function TierSelectionCard({
  onTierSelect,
  onFeaturesChange,
  initialTier = 100,
  initialFlags,
  showFeatures = true,
  className = '',
}: TierSelectionCardProps) {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [tiers, setTiers] = useState<readonly TierPricing[]>([]);
  const [selectedTier, setSelectedTier] = useState<ThematizationTierCount>(initialTier);
  const [isLoading, setIsLoading] = useState(true);
  const [costEstimate, setCostEstimate] = useState<CostEstimateResponse | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [flags, setFlags] = useState<ThematizationPipelineFlags>({
    enableHierarchicalExtraction: initialFlags?.enableHierarchicalExtraction ?? true,
    enableControversyAnalysis: initialFlags?.enableControversyAnalysis ?? true,
    enableClaimExtraction: initialFlags?.enableClaimExtraction ?? true,
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  useEffect(() => {
    async function fetchTiers() {
      setIsLoading(true);
      try {
        const tierData = await ThematizationPricingAPI.getTierPricing();
        setTiers(tierData);
        logger.debug('Tiers loaded', 'TierSelectionCard', { count: tierData.length });
      } catch (error) {
        logger.error('Failed to load tiers', 'TierSelectionCard', { error });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTiers();
  }, []);

  // Fetch cost estimate when tier or flags change
  useEffect(() => {
    async function fetchEstimate() {
      try {
        const estimate = await ThematizationPricingAPI.getCostEstimate(selectedTier, flags);
        setCostEstimate(estimate);
      } catch (error) {
        logger.error('Failed to get cost estimate', 'TierSelectionCard', { error });
      }
    }

    fetchEstimate();
  }, [selectedTier, flags]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleTierSelect = useCallback(
    (tier: ThematizationTierCount) => {
      setSelectedTier(tier);
      onTierSelect(tier);
      logger.debug('Tier selected', 'TierSelectionCard', { tier });
    },
    [onTierSelect]
  );

  const handleFlagChange = useCallback(
    (flag: keyof ThematizationPipelineFlags, value: boolean) => {
      const newFlags = { ...flags, [flag]: value };
      setFlags(newFlags);
      onFeaturesChange?.(newFlags);
      logger.debug('Feature flag changed', 'TierSelectionCard', { flag, value });
    },
    [flags, onFeaturesChange]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600">Loading tier options...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-purple-200 ${className}`}>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Select Analysis Tier</CardTitle>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Week 6
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {/* Tier Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {tiers.map((tier) => {
                    const isSelected = selectedTier === tier.tier;
                    const displayInfo = ThematizationPricingAPI.getTierDisplayInfo(tier.tier);

                    return (
                      <button
                        key={tier.tier}
                        type="button"
                        onClick={() => handleTierSelect(tier.tier)}
                        className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? TIER_SELECTED_COLORS[tier.tier]
                            : `${TIER_COLORS[tier.tier]} hover:border-opacity-75`
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-purple-600">{TIER_ICONS[tier.tier]}</span>
                          <span className="font-semibold text-gray-900">{tier.tier} Papers</span>
                        </div>

                        <Badge variant="outline" className={displayInfo.badgeColor}>
                          {displayInfo.icon} {displayInfo.name}
                        </Badge>

                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <CreditCard className="w-3 h-3" />
                            <span>{ThematizationPricingAPI.formatCredits(tier.baseCost)} base</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{tier.estimatedTime}</span>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                          {tier.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Feature Toggles */}
                {showFeatures && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-gray-900">Optional Features</span>
                      <Tooltip
                        content="Each feature adds +5 credits to the total cost but provides deeper analysis capabilities."
                      >
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="hierarchical"
                            checked={flags.enableHierarchicalExtraction}
                            onCheckedChange={(checked) =>
                              handleFlagChange('enableHierarchicalExtraction', checked)
                            }
                          />
                          <Label htmlFor="hierarchical" className="cursor-pointer">
                            Hierarchical Theme Extraction
                          </Label>
                        </div>
                        <span className="text-sm text-gray-500">+5 credits</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="controversy"
                            checked={flags.enableControversyAnalysis}
                            onCheckedChange={(checked) =>
                              handleFlagChange('enableControversyAnalysis', checked)
                            }
                          />
                          <Label htmlFor="controversy" className="cursor-pointer">
                            Controversy Analysis
                          </Label>
                        </div>
                        <span className="text-sm text-gray-500">+5 credits</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="claims"
                            checked={flags.enableClaimExtraction}
                            onCheckedChange={(checked) =>
                              handleFlagChange('enableClaimExtraction', checked)
                            }
                          />
                          <Label htmlFor="claims" className="cursor-pointer">
                            Claim Extraction
                          </Label>
                        </div>
                        <span className="text-sm text-gray-500">+5 credits</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Summary */}
                {costEstimate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-purple-900">Cost Estimate</span>
                      <span className="text-sm text-purple-600">
                        Est. {Math.ceil(costEstimate.estimatedTimeSeconds / 60)} min
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>Base cost ({costEstimate.tier} papers)</span>
                        <span>{ThematizationPricingAPI.formatCredits(costEstimate.baseCost)}</span>
                      </div>

                      {costEstimate.featureCosts.hierarchicalExtraction && (
                        <div className="flex justify-between text-gray-600">
                          <span>+ Hierarchical extraction</span>
                          <span>
                            {ThematizationPricingAPI.formatCredits(
                              costEstimate.featureCosts.hierarchicalExtraction
                            )}
                          </span>
                        </div>
                      )}

                      {costEstimate.featureCosts.controversyAnalysis && (
                        <div className="flex justify-between text-gray-600">
                          <span>+ Controversy analysis</span>
                          <span>
                            {ThematizationPricingAPI.formatCredits(
                              costEstimate.featureCosts.controversyAnalysis
                            )}
                          </span>
                        </div>
                      )}

                      {costEstimate.featureCosts.claimExtraction && (
                        <div className="flex justify-between text-gray-600">
                          <span>+ Claim extraction</span>
                          <span>
                            {ThematizationPricingAPI.formatCredits(
                              costEstimate.featureCosts.claimExtraction
                            )}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-purple-200 pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-purple-900">
                          <span>Total</span>
                          <span>
                            {ThematizationPricingAPI.formatCredits(costEstimate.finalCost)} (
                            {ThematizationPricingAPI.formatUSD(costEstimate.costUSD)})
                          </span>
                        </div>
                      </div>

                      {costEstimate.remainingCredits !== undefined && (
                        <div className="flex justify-between text-gray-500 text-xs">
                          <span>After this job</span>
                          <span>
                            {ThematizationPricingAPI.formatCredits(costEstimate.remainingCredits)}{' '}
                            remaining
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
    </Card>
  );
});

export default TierSelectionCard;
