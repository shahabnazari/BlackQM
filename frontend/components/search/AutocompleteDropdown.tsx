/**
 * AutocompleteDropdown Component - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104 Day 3: Search Suggestions Autocomplete UI
 *
 * Features:
 * - Keyboard navigation (↑↓ arrows, Enter, Esc, Tab)
 * - ARIA accessibility (WCAG 2.1 Level AA)
 * - Loading skeleton states
 * - Empty state messaging
 * - Click outside to close
 * - Highlight matching text
 * - Source badges (history, saved, trending, AI)
 *
 * Inspired by: Google Search, Netflix search, Amazon autocomplete
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Bookmark,
  TrendingUp,
  Sparkles,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { type Suggestion, type SuggestionSource } from '@/lib/services/search-suggestions.service';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface AutocompleteDropdownProps {
  /** Current search query */
  query: string;
  /** Suggestions to display */
  suggestions: Suggestion[];
  /** Loading state */
  isLoading: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Currently selected suggestion index (-1 = none) */
  selectedIndex: number;
  /** Callback when user selects a suggestion */
  onSelect: (suggestion: Suggestion) => void;
  /** Callback when user closes dropdown */
  onClose: () => void;
  /** Callback when selected index changes (for keyboard navigation) */
  onSelectedIndexChange: (index: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════

// Phase 10.106: Use LucideIcon type for proper type compatibility
const SOURCE_ICONS: Record<SuggestionSource, LucideIcon> = {
  user_history: Clock,
  saved_search: Bookmark,
  trending: TrendingUp,
  ai_semantic: Sparkles,
};

const SOURCE_LABELS: Record<SuggestionSource, string> = {
  user_history: 'Recent',
  saved_search: 'Saved',
  trending: 'Trending',
  ai_semantic: 'AI Suggested',
};

const SOURCE_COLORS: Record<SuggestionSource, string> = {
  user_history: 'text-blue-600 bg-blue-50',
  saved_search: 'text-purple-600 bg-purple-50',
  trending: 'text-orange-600 bg-orange-50',
  ai_semantic: 'text-pink-600 bg-pink-50',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export const AutocompleteDropdown = React.memo(function AutocompleteDropdown({
  query,
  suggestions,
  isLoading,
  isOpen,
  selectedIndex,
  onSelect,
  onClose,
  onSelectedIndexChange,
}: AutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ═════════════════════════════════════════════════════════════════════════
  // CLICK OUTSIDE HANDLER
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        logger.debug('Autocomplete closed: click outside', 'AutocompleteDropdown');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ═════════════════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION HANDLER
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          onSelectedIndexChange(
            selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0
          );
          logger.debug('Autocomplete navigation: down', 'AutocompleteDropdown', {
            newIndex: selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0,
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          onSelectedIndexChange(
            selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1
          );
          logger.debug('Autocomplete navigation: up', 'AutocompleteDropdown', {
            newIndex: selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1,
          });
          break;

        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            logger.info('Autocomplete suggestion selected: Enter key', 'AutocompleteDropdown', {
              query: suggestions[selectedIndex]!.query,
              source: suggestions[selectedIndex]!.source,
            });
            onSelect(suggestions[selectedIndex]!);
          }
          break;

        case 'Escape':
          event.preventDefault();
          logger.debug('Autocomplete closed: Escape key', 'AutocompleteDropdown');
          onClose();
          break;

        case 'Tab':
          // Allow tab to close dropdown (don't prevent default - let it move focus)
          logger.debug('Autocomplete closed: Tab key', 'AutocompleteDropdown');
          onClose();
          break;

        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, suggestions, onSelect, onClose, onSelectedIndexChange]);

  // ═════════════════════════════════════════════════════════════════════════
  // SCROLL SELECTED ITEM INTO VIEW
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(
        `[data-suggestion-index="${selectedIndex}"]`
      );
      if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // ═════════════════════════════════════════════════════════════════════════
  // HIGHLIGHT MATCHING TEXT
  // ═════════════════════════════════════════════════════════════════════════

  const highlightMatch = useCallback((text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="font-semibold text-blue-600">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING SKELETON
  // ═════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
        role="status"
        aria-live="polite"
        aria-label="Loading suggestions"
      >
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: EMPTY STATE
  // ═════════════════════════════════════════════════════════════════════════

  if (suggestions.length === 0 && query.length >= 2) {
    return (
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
        role="status"
        aria-live="polite"
      >
        <div className="p-6 text-center text-gray-500">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium">No suggestions found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching for "{query}"</p>
        </div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: SUGGESTIONS LIST
  // ═════════════════════════════════════════════════════════════════════════

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
          aria-activedescendant={
            selectedIndex >= 0 && suggestions[selectedIndex]
              ? `suggestion-option-${suggestions[selectedIndex]!.id}`
              : undefined
          }
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => {
              const Icon = SOURCE_ICONS[suggestion.source];
              const isSelected = index === selectedIndex;

              return (
                <li
                  key={suggestion.id}
                  id={`suggestion-option-${suggestion.id}`}
                  data-suggestion-index={index}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors duration-150
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => {
                    logger.info('Autocomplete suggestion selected: click', 'AutocompleteDropdown', {
                      query: suggestion.query,
                      source: suggestion.source,
                    });
                    onSelect(suggestion);
                  }}
                  onMouseEnter={() => onSelectedIndexChange(index)}
                >
                  <div className="flex items-center gap-3">
                    {/* Source Icon */}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`} />

                    {/* Query Text (with highlight) */}
                    <span className={`flex-1 text-sm ${
                      isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'
                    }`}>
                      {highlightMatch(suggestion.query, query)}
                    </span>

                    {/* Source Badge */}
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${SOURCE_COLORS[suggestion.source]}
                    `}>
                      {SOURCE_LABELS[suggestion.source]}
                    </span>

                    {/* Score (for debugging - can be removed in production) */}
                    {process.env.NODE_ENV === 'development' && (
                      <span className="text-xs text-gray-400 font-mono">
                        {suggestion.score.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Metadata (tags for saved searches) */}
                  {suggestion.source === 'saved_search' && suggestion.metadata.tags && suggestion.metadata.tags.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {suggestion.metadata.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Footer (keyboard hints) */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">↑</kbd>
                {' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">↓</kbd>
                {' '}
                to navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">↵</kbd>
                {' '}
                to select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">esc</kbd>
                {' '}
                to close
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
