/**
 * Navigating To Themes Page Modal - Phase 10.98.3
 *
 * Shows a spinner and message when navigating to themes page before extraction starts
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';

interface NavigatingToThemesModalProps {
  isOpen: boolean;
}

export const NavigatingToThemesModal = React.memo(function NavigatingToThemesModal({
  isOpen,
}: NavigatingToThemesModalProps): JSX.Element {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="navigating-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4"
          >
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" aria-hidden="true" />
                <ArrowRight className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <h2
                id="navigating-title"
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Taking you to themes page...
              </h2>
              <p className="text-gray-600">
                Preparing your extraction workflow
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              <motion.div
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NavigatingToThemesModal.displayName = 'NavigatingToThemesModal';
