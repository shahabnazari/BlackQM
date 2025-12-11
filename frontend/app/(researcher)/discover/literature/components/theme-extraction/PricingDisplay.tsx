/**
 * Phase 10.113 Week 6: Pricing Display Component
 *
 * Netflix-grade component for displaying subscription pricing and tier comparison.
 * Shows available plans and helps users choose the right subscription.
 *
 * Features:
 * - Subscription tier comparison
 * - Feature comparison table
 * - Current plan highlighting
 * - Upgrade CTAs
 * - Usage stats display
 *
 * @module ThematizationUI
 * @since Phase 10.113 Week 6
 */

'use client';

import React, { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Loader2,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import * as ThematizationPricingAPI from '@/lib/api/services/thematization-pricing-api.service';
import type {
  SubscriptionConfig,
  SubscriptionTier,
  UserUsageStats,
} from '@/lib/api/services/thematization-pricing-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const PLAN_COLORS: Record<SubscriptionTier, { bg: string; border: string; badge: string }> = {
  free: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
  },
  basic: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  pro: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-700',
  },
  enterprise: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700',
  },
};

const PLAN_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <CreditCard className="w-6 h-6" />,
  basic: <TrendingUp className="w-6 h-6" />,
  pro: <Sparkles className="w-6 h-6" />,
  enterprise: <Crown className="w-6 h-6" />,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PricingDisplayProps {
  /** Current user's subscription tier */
  currentTier?: SubscriptionTier;
  /** Callback when upgrade is requested */
  onUpgrade?: (tier: SubscriptionTier) => void;
  /** Whether to show usage statistics */
  showUsageStats?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PricingDisplay = memo(function PricingDisplay({
  currentTier = 'free',
  onUpgrade,
  showUsageStats = true,
  className = '',
}: PricingDisplayProps) {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [subscriptions, setSubscriptions] = useState<readonly SubscriptionConfig[]>([]);
  const [usage, setUsage] = useState<UserUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [subsData, usageData] = await Promise.all([
          ThematizationPricingAPI.getSubscriptionOptions(),
          showUsageStats ? ThematizationPricingAPI.getUserUsage() : Promise.resolve(null),
        ]);

        setSubscriptions(subsData);
        setUsage(usageData);

        logger.debug('Pricing data loaded', 'PricingDisplay', {
          planCount: subsData.length,
          hasUsage: !!usageData,
        });
      } catch (error) {
        logger.error('Failed to load pricing data', 'PricingDisplay', { error });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [showUsageStats]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderUsageCard = () => {
    if (!showUsageStats || !usage) return null;

    const usedPercent = Math.round(
      (usage.creditsUsed / (usage.creditsUsed + usage.creditsRemaining)) * 100
    );

    return (
      <Card className="mb-6 border-2 border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Your Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Credits Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Credits Used</span>
                <span className="font-medium">
                  {usage.creditsUsed} / {usage.creditsUsed + usage.creditsRemaining}
                </span>
              </div>
              <Progress value={usedPercent} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {usage.creditsRemaining}
                </div>
                <div className="text-xs text-gray-500">Credits Left</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{usage.jobsThisMonth}</div>
                <div className="text-xs text-gray-500">Jobs This Month</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{usage.totalJobsAllTime}</div>
                <div className="text-xs text-gray-500">Total Jobs</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Badge variant="outline" className={PLAN_COLORS[usage.subscription].badge}>
                  {usage.subscription.charAt(0).toUpperCase() + usage.subscription.slice(1)}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">Current Plan</div>
              </div>
            </div>

            {/* Low Credits Warning */}
            {usage.creditsRemaining < 10 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Running low on credits! Consider upgrading your plan.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600">Loading pricing...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Usage Card */}
      {renderUsageCard()}

      {/* Pricing Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-1">
          Select the plan that best fits your research needs
        </p>
      </div>

      {/* Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subscriptions.map((sub, index) => {
          const isCurrent = sub.tier === currentTier;
          const isPopular = sub.tier === 'pro';
          const colors = PLAN_COLORS[sub.tier];

          return (
            <motion.div
              key={sub.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative h-full ${colors.bg} border-2 ${colors.border} ${
                  isCurrent ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white">Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2 text-purple-600">
                    {PLAN_ICONS[sub.tier]}
                  </div>
                  <CardTitle className="text-xl capitalize">{sub.tier}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {sub.priceUSD === 0
                        ? 'Free'
                        : `$${sub.priceUSD.toFixed(2)}`}
                    </span>
                    {sub.priceUSD > 0 && (
                      <span className="text-gray-500 text-sm">/month</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {ThematizationPricingAPI.formatCredits(sub.monthlyCredits)} / month
                  </div>
                  {sub.discountPercent > 0 && (
                    <Badge variant="outline" className="mt-2 bg-green-100 text-green-700">
                      {sub.discountPercent}% discount on all jobs
                    </Badge>
                  )}
                </CardHeader>

                <CardContent>
                  {/* Features List */}
                  <ul className="space-y-2 mb-4">
                    {sub.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        isPopular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-800 hover:bg-gray-900'
                      }`}
                      onClick={() => onUpgrade?.(sub.tier)}
                    >
                      {sub.priceUSD === 0 ? 'Get Started' : 'Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Feature</th>
                  {subscriptions.map((sub) => (
                    <th key={sub.tier} className="text-center py-2 px-3 capitalize">
                      {sub.tier}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3">Monthly Credits</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3 font-medium">
                      {sub.monthlyCredits}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">All Tiers (50-300)</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3">
                      {sub.tier === 'free' ? (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Claim Extraction</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3">
                      {sub.tier === 'free' ? (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">API Access</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3">
                      {sub.tier === 'free' || sub.tier === 'basic' ? (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Priority Support</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3">
                      {sub.tier === 'free' || sub.tier === 'basic' ? (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3">Job Discount</td>
                  {subscriptions.map((sub) => (
                    <td key={sub.tier} className="text-center py-2 px-3 font-medium">
                      {sub.discountPercent > 0 ? `${sub.discountPercent}%` : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default PricingDisplay;
