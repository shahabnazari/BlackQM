'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavigationMode } from './PrimaryToolbar';
import { cn } from '@/lib/utils';

interface NavigationPreferences {
  mode: NavigationMode;
  showTooltips: boolean;
  showProgress: boolean;
  showKeyboardHints: boolean;
  autoCollapse: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'off';
  phaseColors: 'default' | 'muted' | 'vibrant' | 'monochrome';
  density: 'comfortable' | 'compact' | 'dense';
  showPhaseNumbers: boolean;
  showPhaseDescriptions: boolean;
}

interface NavigationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (prefs: NavigationPreferences) => void;
}

const DEFAULT_PREFERENCES: NavigationPreferences = {
  mode: 'expanded',
  showTooltips: true,
  showProgress: true,
  showKeyboardHints: true,
  autoCollapse: false,
  animationSpeed: 'normal',
  phaseColors: 'default',
  density: 'comfortable',
  showPhaseNumbers: true,
  showPhaseDescriptions: true,
};

export function NavigationPreferences({
  isOpen,
  onClose,
  onPreferencesChange,
}: NavigationPreferencesProps) {
  const [preferences, setPreferences] = useState<NavigationPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('navigationPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Save preferences to localStorage
  const updatePreference = <K extends keyof NavigationPreferences>(
    key: K,
    value: NavigationPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('navigationPreferences', JSON.stringify(updated));
    onPreferencesChange?.(updated);
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('navigationPreferences', JSON.stringify(DEFAULT_PREFERENCES));
    onPreferencesChange?.(DEFAULT_PREFERENCES);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Preferences Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Navigation Preferences
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preferences Content */}
            <div className="p-6 space-y-6">
              {/* Navigation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Navigation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['expanded', 'compact', 'minimal', 'icons'] as NavigationMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => updatePreference('mode', mode)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        preferences.mode === mode
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Density */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Density
                </label>
                <select
                  value={preferences.density}
                  onChange={(e) => updatePreference('density', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                  <option value="dense">Dense</option>
                </select>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phase Colors
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['default', 'muted', 'vibrant', 'monochrome'].map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => updatePreference('phaseColors', scheme as any)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        preferences.phaseColors === scheme
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animation Speed
                </label>
                <select
                  value={preferences.animationSpeed}
                  onChange={(e) => updatePreference('animationSpeed', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                  <option value="off">Off</option>
                </select>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Options
                </label>
                
                {[
                  { key: 'showTooltips', label: 'Show tooltips on hover' },
                  { key: 'showProgress', label: 'Show phase progress bars' },
                  { key: 'showKeyboardHints', label: 'Show keyboard shortcuts' },
                  { key: 'showPhaseNumbers', label: 'Show phase numbers' },
                  { key: 'showPhaseDescriptions', label: 'Show phase descriptions' },
                  { key: 'autoCollapse', label: 'Auto-collapse inactive panels' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      onClick={() => updatePreference(key as any, !preferences[key as keyof NavigationPreferences])}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        preferences[key as keyof NavigationPreferences]
                          ? 'bg-indigo-600'
                          : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          preferences[key as keyof NavigationPreferences]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        )}
                      />
                    </button>
                  </label>
                ))}
              </div>

              {/* Keyboard Shortcuts Reference */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    ['⌘1-9', 'Jump to phase'],
                    ['⌘0', 'Archive phase'],
                    ['⌘K', 'Search'],
                    ['⌘,', 'Preferences'],
                    ['⌘\\', 'Toggle nav mode'],
                    ['Esc', 'Close panels'],
                  ].map(([shortcut, description]) => (
                    <div key={shortcut} className="flex justify-between">
                      <span className="text-gray-500">{description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                        {shortcut}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={resetToDefaults}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useNavigationPreferences() {
  const [preferences, setPreferences] = useState<NavigationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('navigationPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch {
        // Invalid JSON, use defaults
      }
    }

    // Listen for preference changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('navigationPreferences');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch {
          // Invalid JSON, use defaults
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return preferences;
}