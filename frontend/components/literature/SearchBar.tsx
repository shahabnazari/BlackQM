/**
 * Literature Search Bar Component
 * Enterprise-grade search input with AI suggestions and query correction
 * Phase 10.1 Day 3 - Component Extraction
 *
 * Features:
 * - Real-time search with debouncing
 * - AI-powered query suggestions
 * - Query correction feedback
 * - Keyboard shortcuts (Cmd/Ctrl + K)
 * - Error boundary integration
 *
 * @module SearchBar
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

// ============================================================================
// Types
// ============================================================================

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  debounceMs?: number;
}

// ============================================================================
// Search Bar Component
// ============================================================================

export const SearchBar = React.memo(function SearchBar({
  onSearch,
  placeholder = 'Search academic literature...',
  autoFocus = false,
  showSuggestions = true,
  debounceMs = 300,
}: SearchBarProps) {
  // Store state
  const {
    query,
    setQuery,
    clearQuery,
    aiSuggestions,
    showSuggestions: showSuggestionsState,
    loadingSuggestions,
    queryCorrectionMessage,
  } = useLiteratureSearchStore();

  // Local state
  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local query with store query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Debounced search
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setQuery(searchQuery);
        if (onSearch) {
          onSearch(searchQuery);
        }
      }, debounceMs);
    },
    [setQuery, onSearch, debounceMs]
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalQuery('');
    clearQuery();
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  }, [clearQuery, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setLocalQuery(suggestion);
      setQuery(suggestion);
      if (onSearch) {
        onSearch(suggestion);
      }
    },
    [setQuery, onSearch]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear
      if (e.key === 'Escape' && isFocused) {
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, handleClear]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const showSuggestionsDropdown =
    showSuggestions &&
    showSuggestionsState &&
    isFocused &&
    aiSuggestions.length > 0;

  return (
    <div className="relative w-full">
      {/* Query Correction Message */}
      {queryCorrectionMessage && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <div className="flex items-start space-x-2">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-blue-900">
                Using corrected query: "{queryCorrectionMessage.corrected}"
              </p>
              {queryCorrectionMessage.original && (
                <button
                  onClick={() =>
                    handleSuggestionClick(queryCorrectionMessage.original)
                  }
                  className="mt-1 text-blue-700 hover:text-blue-900 font-medium underline"
                >
                  Use original: "{queryCorrectionMessage.original}"
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          aria-label="Search literature"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {/* Loading indicator */}
          {loadingSuggestions && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          )}

          {/* Keyboard shortcut hint */}
          {!isFocused && !localQuery && (
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
              ⌘K
            </kbd>
          )}

          {/* Clear button */}
          {localQuery && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2">
              AI Suggestions
            </div>
            {aiSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4 text-purple-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchBar;
