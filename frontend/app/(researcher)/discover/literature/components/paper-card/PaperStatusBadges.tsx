/**
 * PaperStatusBadges Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 *
 * Displays extraction status badges (extracting/extracted) at top-right corner
 *
 * @module PaperStatusBadges
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface PaperStatusBadgesProps {
  /** Whether themes are currently being extracted */
  isExtracting: boolean;
  /** Whether themes have been extracted */
  isExtracted: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PaperStatusBadges({
  isExtracting,
  isExtracted,
}: PaperStatusBadgesProps) {
  return (
    <>
      {/* Real-time Extracting Status Badge */}
      {isExtracting && !isExtracted && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <Badge
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white animate-pulse"
            aria-label="Extracting themes in progress"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            <span className="text-xs font-semibold">Extracting...</span>
          </Badge>
        </motion.div>
      )}

      {/* Extracted Status Badge */}
      {isExtracted && !isExtracting && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <Badge
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white"
            aria-label="Themes successfully extracted"
            role="status"
          >
            <Check className="w-3 h-3" aria-hidden="true" />
            <span className="text-xs font-semibold">Extracted</span>
          </Badge>
        </motion.div>
      )}
    </>
  );
}
