'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'study' | 'participant' | 'analysis' | 'help' | 'action';
  url: string;
  icon?: React.ReactNode;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showShortcut?: boolean;
}

export function GlobalSearch({
  className = '',
  placeholder = 'Search studies, participants, or help...',
  showShortcut = true,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;

    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(
      0,
      5
    );

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Mock search function - in production, this would call an API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock results based on query
    const mockResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Studies
    if (lowerQuery.includes('stud')) {
      mockResults.push(
        {
          id: '1',
          title: 'Climate Change Perceptions Study',
          description: '45 participants • Active',
          type: 'study',
          url: '/studies/1',
          icon: <StudyIcon />,
        },
        {
          id: '2',
          title: 'Healthcare Policy Q-Sort',
          description: '32 participants • Draft',
          type: 'study',
          url: '/studies/2',
          icon: <StudyIcon />,
        }
      );
    }

    // Participants
    if (lowerQuery.includes('participant')) {
      mockResults.push({
        id: '3',
        title: 'View All Participants',
        description: '127 total participants',
        type: 'participant',
        url: '/participants',
        icon: <ParticipantIcon />,
      });
    }

    // Analysis
    if (lowerQuery.includes('analys') || lowerQuery.includes('report')) {
      mockResults.push({
        id: '4',
        title: 'Factor Analysis Dashboard',
        description: 'View all analysis reports',
        type: 'analysis',
        url: '/analytics',
        icon: <AnalysisIcon />,
      });
    }

    // Help articles
    if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
      mockResults.push(
        {
          id: '5',
          title: 'How to Create a Study',
          description: 'Step-by-step guide',
          type: 'help',
          url: '/help/create-study',
          icon: <HelpIcon />,
        },
        {
          id: '6',
          title: 'Understanding Q-Methodology',
          description: 'Learn the basics',
          type: 'help',
          url: '/help/q-methodology',
          icon: <HelpIcon />,
        }
      );
    }

    // Quick actions
    mockResults.push({
      id: '7',
      title: `Create New Study with "${searchQuery}"`,
      type: 'action',
      url: `/studies/create?title=${encodeURIComponent(searchQuery)}`,
      icon: <PlusIcon />,
    });

    setResults(mockResults);
    setIsLoading(false);
    setSelectedIndex(0);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Navigate with keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const getTypeColor = (type: SearchResult['type']) => {
    const colors = {
      study: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      participant:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      analysis:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      help: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      action: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[type];
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />

        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <SearchIcon className="w-4 h-4 text-gray-400" />
        </div>

        {/* Keyboard Shortcut */}
        {showShortcut && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">{result.icon}</div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.title}
                    </p>
                    {result.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {result.description}
                      </p>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(result.type)}`}
                    >
                      {result.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && query === '' && recentSearches.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Recent Searches
              </p>
              <div className="space-y-1">
                {recentSearches.map(search => (
                  <div
                    key={search}
                    className="flex items-center justify-between group"
                  >
                    <button
                      onClick={() => handleRecentSearch(search)}
                      className="flex-1 text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <ClockIcon className="inline w-3 h-3 mr-2 text-gray-400" />
                      {search}
                    </button>
                    <button
                      onClick={e => removeRecentSearch(search, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query !== '' && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try searching for studies, participants, or help topics
              </p>
            </div>
          )}

          {/* Footer Tips */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>esc Close</span>
              </div>
              <span>Powered by AI suggestions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon Components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function StudyIcon() {
  return (
    <div className="w-5 h-5 text-blue-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  );
}

function ParticipantIcon() {
  return (
    <div className="w-5 h-5 text-green-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    </div>
  );
}

function AnalysisIcon() {
  return (
    <div className="w-5 h-5 text-purple-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </div>
  );
}

function HelpIcon() {
  return (
    <div className="w-5 h-5 text-yellow-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

function PlusIcon() {
  return (
    <div className="w-5 h-5 text-gray-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
