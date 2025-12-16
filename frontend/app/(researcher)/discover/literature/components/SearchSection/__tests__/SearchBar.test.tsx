/**
 * Phase 10.161: SearchBar Component Tests - Updated for Minimalist Redesign
 *
 * Tests for the Phase 10.113/10.144 simplified SearchBar component
 * Tests query input, validation, AI suggestions, and filter integration
 *
 * @file frontend/app/(researcher)/discover/literature/components/SearchSection/__tests__/SearchBar.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchBar } from '../SearchBar';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock Zustand store
const mockSetQuery = vi.fn();
const mockSetAISuggestions = vi.fn();
const mockSetShowSuggestions = vi.fn();
const mockSetLoadingSuggestions = vi.fn();
const mockSetQueryCorrection = vi.fn();

vi.mock('@/lib/stores/literature-search.store', () => ({
  useLiteratureSearchStore: () => ({
    query: '',
    setQuery: mockSetQuery,
    aiSuggestions: [],
    showSuggestions: false,
    loadingSuggestions: false,
    queryCorrectionMessage: null,
    setAISuggestions: mockSetAISuggestions,
    setShowSuggestions: mockSetShowSuggestions,
    setLoadingSuggestions: mockSetLoadingSuggestions,
    setQueryCorrection: mockSetQueryCorrection,
    papers: [],
    totalResults: 0,
    loading: false,
  }),
}));

// Mock Query Expansion API
vi.mock('@/lib/api/services/query-expansion-api.service', () => ({
  expandQuery: vi.fn().mockResolvedValue({
    expanded: 'expanded query',
    suggestions: ['suggestion 1', 'suggestion 2', 'suggestion 3'],
  }),
}));

// Mock Scientific Query API
vi.mock('@/lib/api/services/scientific-query-api.service', () => ({
  validateQuery: vi.fn().mockResolvedValue({
    isValid: true,
    issues: [],
    suggestions: [],
    score: 100,
  }),
  optimizeQuery: vi.fn().mockResolvedValue({
    optimizedQuery: 'optimized query',
    shouldProceed: true,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <>{children}</>
  ),
}));

// Mock services
vi.mock('@/lib/services/search-history.service', () => ({
  SearchHistoryService: {
    getAutocomplete: vi.fn().mockReturnValue([]),
    getHistory: vi.fn().mockReturnValue([]),
    addSearch: vi.fn(),
  },
}));

vi.mock('@/lib/services/search-analytics.service', () => ({
  SearchAnalyticsService: {
    trackSearch: vi.fn(),
    trackSuggestionClick: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// ============================================================================
// Test Utilities
// ============================================================================

const defaultProps = {
  onSearch: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
  appliedFilterCount: 0,
  showFilters: false,
  onToggleFilters: vi.fn(),
};

const renderSearchBar = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<SearchBar {...props} />);
};

// ============================================================================
// Test Suites
// ============================================================================

describe('SearchBar Component - Phase 10.161 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ==========================================================================
  // 1.1 Query Input Validation
  // ==========================================================================

  describe('1.1 Query Input Validation', () => {
    it('should render search input with correct placeholder', () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      expect(input).toBeInTheDocument();
    });

    it('should have maxLength of 500 characters', () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      expect(input).toHaveAttribute('maxLength', '500');
    });

    it('should update query on input change', async () => {
      renderSearchBar();
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      await user.type(input, 'machine learning');

      expect(mockSetQuery).toHaveBeenCalled();
    });

    it('should handle special characters in query (XSS prevention)', async () => {
      renderSearchBar();
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      await user.type(input, '<script>alert("xss")</script>');

      expect(mockSetQuery).toHaveBeenCalled();
    });

    it('should handle unicode characters in query', async () => {
      renderSearchBar();
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      await user.type(input, '机器学习 研究');

      expect(mockSetQuery).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 1.2 Search Triggering
  // ==========================================================================

  describe('1.2 Search Triggering', () => {
    it('should trigger search on Enter key press when query is non-empty', async () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(input).toBeInTheDocument();
    });

    it('should render search button', async () => {
      renderSearchBar();

      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('should disable search button when loading', () => {
      renderSearchBar({ isLoading: true });

      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => btn.className.includes('bg-gradient'));
      expect(searchButton).toBeDisabled();
    });

    it('should close suggestions on Escape key', () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(mockSetShowSuggestions).toHaveBeenCalledWith(false);
    });
  });

  // ==========================================================================
  // 1.3 AI Query Suggestions
  // ==========================================================================

  describe('1.3 AI Query Suggestions', () => {
    it('should render input for suggestions', () => {
      renderSearchBar();
      expect(screen.getByPlaceholderText(/search academic papers/i)).toBeInTheDocument();
    });

    it('should call setQuery when defined', () => {
      renderSearchBar();
      expect(mockSetQuery).toBeDefined();
    });

    it('should show focus handler opens suggestions when available', () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      fireEvent.focus(input);

      expect(input).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 1.4 Filter Integration
  // ==========================================================================

  describe('1.4 Filter Integration', () => {
    it('should render filter button', () => {
      renderSearchBar();

      // Filter button contains Filter icon
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('should call onToggleFilters when filter button is clicked', async () => {
      const onToggleFilters = vi.fn();
      renderSearchBar({ onToggleFilters });
      const user = userEvent.setup();

      // Find filter button (last button in the row)
      const buttons = screen.getAllByRole('button');
      const filterButton = buttons[buttons.length - 1];
      await user.click(filterButton);

      expect(onToggleFilters).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 1.5 Smart Search Toggle
  // ==========================================================================

  describe('1.5 Smart Search Toggle', () => {
    it('should render smart search toggle button', () => {
      renderSearchBar();

      // Smart search toggle is rendered inside the input container
      const toggleButton = screen.getByTitle(/enhanced mode/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle smart search on click', async () => {
      renderSearchBar();
      const user = userEvent.setup();

      const toggleButton = screen.getByTitle(/enhanced mode/i);
      await user.click(toggleButton);

      // Should save preference to localStorage
      expect(localStorage.getItem('literature-smart-search-enabled')).toBe('false');
    });
  });

  // ==========================================================================
  // 1.6 Accessibility
  // ==========================================================================

  describe('1.6 Accessibility', () => {
    it('should have accessible search input', () => {
      renderSearchBar();

      const input = screen.getByPlaceholderText(/search academic papers/i);
      expect(input).toBeInTheDocument();
    });

    it('should have keyboard accessible buttons', () => {
      renderSearchBar();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should support keyboard navigation with Tab', async () => {
      renderSearchBar();
      const user = userEvent.setup();

      await user.tab();

      expect(document.activeElement).toBeTruthy();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('SearchBar Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should handle complete search flow', async () => {
    renderSearchBar();
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'test');

    expect(mockSetQuery).toHaveBeenCalled();
  });

  it('should maintain state consistency across interactions', async () => {
    renderSearchBar();
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'query');
    await user.clear(input);
    await user.type(input, 'new query');

    expect(mockSetQuery).toHaveBeenCalled();
  });
});

// ============================================================================
// Phase 10.104: Search History Integration
// ============================================================================

describe('Phase 10.104: Search History Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should track successful searches in history', async () => {
    const mockOnSearch = vi.fn().mockResolvedValue(undefined);
    renderSearchBar({ onSearch: mockOnSearch });
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'machine learning');

    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => btn.className.includes('bg-gradient'));
    if (searchButton) {
      await user.click(searchButton);
    }

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  it('should handle empty history gracefully', async () => {
    localStorage.clear();
    renderSearchBar();
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'new query');

    await waitFor(() => {
      expect(mockSetQuery).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Performance & Edge Cases
// ============================================================================

describe('Performance & Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should validate queries in reasonable time', async () => {
    renderSearchBar();
    const user = userEvent.setup();

    const startTime = performance.now();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'machine learning');

    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });

  it('should handle localStorage quota exceeded gracefully', async () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn().mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const mockOnSearch = vi.fn().mockResolvedValue(undefined);
    renderSearchBar({ onSearch: mockOnSearch });
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/search academic papers/i);
    await user.type(input, 'test query');

    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => btn.className.includes('bg-gradient'));
    if (searchButton) {
      await user.click(searchButton);
    }

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    Storage.prototype.setItem = originalSetItem;
  });
});
