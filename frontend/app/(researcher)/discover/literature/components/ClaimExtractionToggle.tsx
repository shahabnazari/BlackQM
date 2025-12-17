/**
 * Phase 10.175: Claim Extraction Toggle Component
 *
 * Netflix-grade toggle component for enabling claim extraction in thematization.
 * Provides clear explanation of the feature and its credit cost.
 *
 * DESIGN PRINCIPLES:
 * - Clear value proposition
 * - Visual cost indicator
 * - Accessible toggle with proper ARIA
 * - Smooth state transitions
 *
 * @module ClaimExtractionToggle
 * @since Phase 10.175
 */

'use client';

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import {
  MessageSquareQuote,
  Info,
  Sparkles,
  FileText,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { FEATURE_METADATA, FEATURE_COST_CREDITS, formatCredits } from '@/lib/types/thematization-pricing.types';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface ClaimExtractionToggleProps {
  /** Whether claim extraction is enabled */
  enabled: boolean;
  /** Callback when toggle changes */
  onToggle: (enabled: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Whether to show detailed explanation */
  showDetails?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// FEATURE INFO
// ============================================================================

const CLAIM_EXTRACTION_INFO = {
  title: 'Claim Extraction',
  description: 'Extract specific claims and evidence from themes for deeper analysis',
  benefits: [
    'Extract precise claims from each theme',
    'Identify supporting evidence and citations',
    'Track claim provenance to source papers',
    'Enable claim-based filtering and grouping',
  ],
  useCases: [
    'Building evidence-based arguments',
    'Systematic review claim mapping',
    'Q-methodology statement generation',
    'Survey item development',
  ],
};

// Get cost from metadata (use FEATURE_COST_CREDITS as consistent fallback)
const CLAIM_EXTRACTION_COST = FEATURE_METADATA.find(f => f.flag === 'enableClaimExtraction')?.costCredits ?? FEATURE_COST_CREDITS;

// ============================================================================
// COMPACT TOGGLE COMPONENT
// ============================================================================

interface CompactToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled: boolean;
  className?: string;
}

const CompactToggle = React.memo(function CompactToggle({
  enabled,
  onToggle,
  disabled,
  className = '',
}: CompactToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border',
        disabled && 'opacity-50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <MessageSquareQuote className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{CLAIM_EXTRACTION_INFO.title}</span>
            {enabled && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            +{formatCredits(CLAIM_EXTRACTION_COST)} credits
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label="Toggle claim extraction"
      />
    </div>
  );
});

CompactToggle.displayName = 'CompactToggle';

// ============================================================================
// DETAILED CARD COMPONENT
// ============================================================================

interface DetailedCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled: boolean;
  showDetails: boolean;
  className?: string;
}

const DetailedCard = React.memo(function DetailedCard({
  enabled,
  onToggle,
  disabled,
  showDetails,
  className = '',
}: DetailedCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        enabled ? 'border-primary/30 shadow-sm' : 'border-border',
        disabled && 'opacity-50',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-lg',
                enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {CLAIM_EXTRACTION_INFO.title}
                <Tooltip content="Advanced feature for extracting structured claims" position="top">
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </Tooltip>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {CLAIM_EXTRACTION_INFO.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={enabled ? 'default' : 'secondary'} className="font-mono">
              +{formatCredits(CLAIM_EXTRACTION_COST)}
            </Badge>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={disabled}
              aria-label="Toggle claim extraction"
            />
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0 space-y-4">
          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>What you get</span>
            </div>
            <ul className="space-y-1.5">
              {CLAIM_EXTRACTION_INFO.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Use Cases */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-primary" />
              <span>Best for</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLAIM_EXTRACTION_INFO.useCases.map((useCase, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {useCase}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active indicator */}
          {enabled && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">
                Claim extraction will be applied to all themes
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});

DetailedCard.displayName = 'DetailedCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ClaimExtractionToggle Component
 *
 * Toggle for enabling claim extraction in thematization pipeline.
 * Provides clear value proposition and cost information.
 *
 * @component
 * @memoized
 *
 * @example
 * ```tsx
 * const [enableClaims, setEnableClaims] = useState(false);
 *
 * return (
 *   <ClaimExtractionToggle
 *     enabled={enableClaims}
 *     onToggle={setEnableClaims}
 *     showDetails
 *   />
 * );
 * ```
 */
export const ClaimExtractionToggle = React.memo(function ClaimExtractionToggle({
  enabled,
  onToggle,
  disabled = false,
  showDetails = true,
  compact = false,
  className = '',
}: ClaimExtractionToggleProps) {
  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleToggle = useCallback(
    (newEnabled: boolean) => {
      if (!disabled) {
        logger.info('Claim extraction toggled', 'ClaimExtractionToggle', {
          enabled: newEnabled,
          cost: CLAIM_EXTRACTION_COST,
        });
        onToggle(newEnabled);
      }
    },
    [disabled, onToggle]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  if (compact) {
    return (
      <CompactToggle
        enabled={enabled}
        onToggle={handleToggle}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <DetailedCard
      enabled={enabled}
      onToggle={handleToggle}
      disabled={disabled}
      showDetails={showDetails}
      className={className}
    />
  );
});

ClaimExtractionToggle.displayName = 'ClaimExtractionToggle';

// ============================================================================
// EXPORTS
// ============================================================================

export default ClaimExtractionToggle;
