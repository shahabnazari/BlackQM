/**
 * Phase 10.175: Thematization Configuration Modal
 *
 * Apple-inspired modal for thematization configuration.
 * Wraps ThematizationConfigPanel in a Dialog for integration into extraction flow.
 *
 * @module ThematizationConfigModal
 * @since Phase 10.175
 */

'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog';
import {
  ThematizationConfigPanel,
  type ThematizationConfig,
} from '@/app/(researcher)/discover/literature/components/ThematizationConfigPanel';
import type { SubscriptionTier } from '@/lib/types/thematization-pricing.types';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface ThematizationConfigModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Number of available papers for analysis */
  availablePapers: number;
  /** User's subscription tier */
  subscriptionTier?: SubscriptionTier;
  /** User's remaining credits */
  remainingCredits?: number;
  /** Callback when user confirms configuration */
  onConfirm: (config: ThematizationConfig) => void;
  /** Whether the panel is in loading state */
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ThematizationConfigModal Component
 *
 * Modal wrapper for thematization configuration with Apple-style animations.
 */
export function ThematizationConfigModal({
  isOpen,
  onClose,
  availablePapers,
  subscriptionTier = 'free',
  remainingCredits = 0,
  onConfirm,
  isLoading = false,
}: ThematizationConfigModalProps) {
  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleConfirm = useCallback((config: ThematizationConfig) => {
    onConfirm(config);
    onClose();
  }, [onConfirm, onClose]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Custom backdrop with blur */}
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />
            </DialogOverlay>

            {/* Modal content */}
            <DialogContent
              className={cn(
                'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'z-50 p-0 border-0 bg-transparent shadow-none',
                'w-full max-w-2xl',
                'focus:outline-none'
              )}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <ThematizationConfigPanel
                  availablePapers={availablePapers}
                  subscriptionTier={subscriptionTier}
                  remainingCredits={remainingCredits}
                  onConfirm={handleConfirm}
                  onCancel={onClose}
                  isLoading={isLoading}
                />
              </motion.div>
            </DialogContent>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ThematizationConfigModal;
export type { ThematizationConfig };
