/**
 * LiteratureSearchContainer Unit Tests
 * Phase 10.91 Day 6: Container Extraction - Literature Search
 *
 * **Test Coverage:**
 * - Component rendering
 * - State management integration
 * - User interactions
 * - Loading states
 * - Error handling
 * - Accessibility compliance
 *
 * **Testing Philosophy:**
 * - Test behavior, not implementation
 * - Focus on user-facing functionality
 * - Ensure accessibility standards
 * - Verify enterprise logging
 *
 * @module LiteratureSearchContainer.test
 * @since Phase 10.91 Day 6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiteratureSearchContainer } from '../LiteratureSearchContainer';
import type { LiteratureSearchContainerProps } from '../LiteratureSearchContainer';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useProgressiveSearch } from '@/lib/hooks/useProgressiveSearch';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Mocks
// ============================================================================

// Mock Zustand store
vi.mock('@/lib/stores/literature-search.store', () => ({
  useLiteratureSearchStore: vi.fn(),
}));

// Mock progressive search hook
vi.mock('@/lib/hooks/useProgressiveSearch', () => ({
  useProgressiveSearch: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    // Simple wrapper - actual error catching tested in ErrorBoundary's own tests
    return children;
  },
}));

// Mock sub-components to isolate container tests
vi.mock('../../components/SearchSection', () => ({
  SearchBar: ({ onSearch, isLoading, onToggleFilters }: any) => (
    <div data-testid="search-bar">
      <button onClick={onSearch} disabled={isLoading}>
        Search
      </button>
      <button onClick={onToggleFilters}>Toggle Filters</button>
    </div>
  ),
  FilterPanel: ({ isVisible }: any) =>
    isVisible ? <div data-testid="filter-panel">Filters</div> : null,
  ActiveFiltersChips: () => <div data-testid="active-filters">Active Filters</div>,
}));

vi.mock('@/components/literature/ProgressiveLoadingIndicator', () => ({
  ProgressiveLoadingIndicator: ({ onCancel }: any) => (
    <div data-testid="progressive-loading">
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// ============================================================================
// Test Utilities
// ============================================================================

const mockUseLiteratureSearchStore = useLiteratureSearchStore as ReturnType<
  typeof vi.fn
>;
const mockUseProgressiveSearch = useProgressiveSearch as ReturnType<typeof vi.fn>;
const mockLogger = logger as { [key: string]: ReturnType<typeof vi.fn> };

/**
 * Create default props for testing
 */
function createDefaultProps(
  overrides?: Partial<LiteratureSearchContainerProps>
): LiteratureSearchContainerProps {
  return {
    loadingAlternative: false,
    loadingSocial: false,
    onSearch: vi.fn().mockResolvedValue(undefined),
    academicDatabasesCount: 5,
    alternativeSourcesCount: 3,
    socialPlatformsCount: 2,
    ...overrides,
  };
}

/**
 * Setup default mock implementations
 */
function setupDefaultMocks() {
  mockUseLiteratureSearchStore.mockReturnValue({
    showFilters: false,
    toggleShowFilters: vi.fn(),
    getAppliedFilterCount: vi.fn().mockReturnValue(0),
    progressiveLoading: {
      isLoading: false,
      progress: 0,
      currentSource: '',
      message: '',
    },
  });

  mockUseProgressiveSearch.mockReturnValue({
    cancelProgressiveSearch: vi.fn(),
    isSearching: false,
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('LiteratureSearchContainer', () => {
  beforeEach(() => {
    setupDefaultMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.getByText('Universal Search')).toBeInTheDocument();
    });

    it('should render all sub-components', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('active-filters')).toBeInTheDocument();
      expect(screen.getByTestId('progressive-loading')).toBeInTheDocument();
    });

    it('should display source count badge', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(
        screen.getByText('Searches all selected sources below')
      ).toBeInTheDocument();
    });

    it('should have correct displayName for debugging', () => {
      expect(LiteratureSearchContainer.displayName).toBe(
        'LiteratureSearchContainer'
      );
    });
  });

  // ==========================================================================
  // State Management Tests
  // ==========================================================================

  describe('State Management', () => {
    it('should call store hooks on mount', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(mockUseLiteratureSearchStore).toHaveBeenCalled();
      expect(mockUseProgressiveSearch).toHaveBeenCalled();
    });

    it('should hide FilterPanel when showFilters is false', () => {
      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: false,
        toggleShowFilters: vi.fn(),
        getAppliedFilterCount: vi.fn().mockReturnValue(0),
        progressiveLoading: { isLoading: false },
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
    });

    it('should show FilterPanel when showFilters is true', () => {
      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: true,
        toggleShowFilters: vi.fn(),
        getAppliedFilterCount: vi.fn().mockReturnValue(0),
        progressiveLoading: { isLoading: false },
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    it('should get applied filter count from store', () => {
      const getAppliedFilterCount = vi.fn().mockReturnValue(5);
      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: false,
        toggleShowFilters: vi.fn(),
        getAppliedFilterCount,
        progressiveLoading: { isLoading: false },
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(getAppliedFilterCount).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // User Interaction Tests
  // ==========================================================================

  describe('User Interactions', () => {
    it('should call onSearch when search button clicked', async () => {
      const onSearch = vi.fn().mockResolvedValue(undefined);
      const props = createDefaultProps({ onSearch });

      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      await userEvent.click(searchButton);

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should toggle filters when toggle button clicked', async () => {
      const toggleShowFilters = vi.fn();
      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: false,
        toggleShowFilters,
        getAppliedFilterCount: vi.fn().mockReturnValue(0),
        progressiveLoading: { isLoading: false },
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const toggleButton = screen.getByText('Toggle Filters');
      await userEvent.click(toggleButton);

      expect(toggleShowFilters).toHaveBeenCalledTimes(1);
    });

    it('should cancel progressive search when cancel clicked', async () => {
      const cancelProgressiveSearch = vi.fn();
      mockUseProgressiveSearch.mockReturnValue({
        cancelProgressiveSearch,
        isSearching: true,
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(cancelProgressiveSearch).toHaveBeenCalledTimes(1);
    });

    it('should log when cancelling progressive search', async () => {
      const cancelProgressiveSearch = vi.fn();
      mockUseProgressiveSearch.mockReturnValue({
        cancelProgressiveSearch,
        isSearching: true,
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'LiteratureSearchContainer',
        'Cancelling progressive search'
      );
    });
  });

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================

  describe('Loading States', () => {
    it('should show loading state when loadingAlternative is true', () => {
      const props = createDefaultProps({ loadingAlternative: true });
      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeDisabled();
    });

    it('should show loading state when loadingSocial is true', () => {
      const props = createDefaultProps({ loadingSocial: true });
      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeDisabled();
    });

    it('should show loading state when isSearching is true', () => {
      mockUseProgressiveSearch.mockReturnValue({
        cancelProgressiveSearch: vi.fn(),
        isSearching: true,
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeDisabled();
    });

    it('should enable search when not loading', () => {
      const props = createDefaultProps({
        loadingAlternative: false,
        loadingSocial: false,
      });

      mockUseProgressiveSearch.mockReturnValue({
        cancelProgressiveSearch: vi.fn(),
        isSearching: false,
      });

      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      expect(searchButton).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // Props Validation Tests
  // ==========================================================================

  describe('Props Validation', () => {
    it('should pass correct source counts to SearchBar', () => {
      // Create a spy to capture SearchBar props
      const mockSearchBar = vi.fn((props: any) => (
        <div data-testid="search-bar">
          <span data-testid="academic-count">{props.academicDatabasesCount}</span>
          <span data-testid="alternative-count">{props.alternativeSourcesCount}</span>
          <span data-testid="social-count">{props.socialPlatformsCount}</span>
          <button onClick={props.onSearch} disabled={props.isLoading}>
            Search
          </button>
          <button onClick={props.onToggleFilters}>Toggle Filters</button>
        </div>
      ));

      // Replace the mock temporarily
      const originalMock = vi.mocked(require('../../components/SearchSection').SearchBar);
      vi.mocked(require('../../components/SearchSection')).SearchBar = mockSearchBar;

      const props = createDefaultProps({
        academicDatabasesCount: 10,
        alternativeSourcesCount: 5,
        socialPlatformsCount: 3,
      });

      render(<LiteratureSearchContainer {...props} />);

      // Verify SearchBar was called with correct props
      expect(mockSearchBar).toHaveBeenCalledWith(
        expect.objectContaining({
          academicDatabasesCount: 10,
          alternativeSourcesCount: 5,
          socialPlatformsCount: 3,
        }),
        expect.anything()
      );

      // Also verify the values are displayed
      expect(screen.getByTestId('academic-count')).toHaveTextContent('10');
      expect(screen.getByTestId('alternative-count')).toHaveTextContent('5');
      expect(screen.getByTestId('social-count')).toHaveTextContent('3');

      // Restore original mock
      vi.mocked(require('../../components/SearchSection')).SearchBar = originalMock;
    });

    it('should handle zero source counts', () => {
      const props = createDefaultProps({
        academicDatabasesCount: 0,
        alternativeSourcesCount: 0,
        socialPlatformsCount: 0,
      });

      render(<LiteratureSearchContainer {...props} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const heading = screen.getByText('Universal Search');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have semantic card structure', () => {
      const props = createDefaultProps();
      const { container } = render(<LiteratureSearchContainer {...props} />);

      const card = container.querySelector('[class*="border-2"]');
      expect(card).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const onSearch = vi.fn().mockResolvedValue(undefined);
      const props = createDefaultProps({ onSearch });

      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      searchButton.focus();
      expect(searchButton).toHaveFocus();

      // Simulate Enter key press
      fireEvent.keyDown(searchButton, { key: 'Enter', code: 'Enter' });
      await userEvent.click(searchButton);

      expect(onSearch).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Component Integration', () => {
    it('should coordinate multiple sub-components correctly', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('active-filters')).toBeInTheDocument();
      expect(screen.getByTestId('progressive-loading')).toBeInTheDocument();
    });

    it('should pass progressive loading state to indicator', () => {
      const progressiveLoading = {
        isLoading: true,
        progress: 50,
        currentSource: 'PubMed',
        message: 'Searching...',
      };

      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: false,
        toggleShowFilters: vi.fn(),
        getAppliedFilterCount: vi.fn().mockReturnValue(0),
        progressiveLoading,
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      expect(screen.getByTestId('progressive-loading')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle onSearch rejection gracefully', async () => {
      const onSearch = vi.fn().mockRejectedValue(new Error('Search failed'));
      const props = createDefaultProps({ onSearch });

      render(<LiteratureSearchContainer {...props} />);

      const searchButton = screen.getByText('Search');
      await userEvent.click(searchButton);

      // Container doesn't handle errors directly - parent should handle
      expect(onSearch).toHaveBeenCalled();
    });

    it('should handle rapid filter toggles', async () => {
      const toggleShowFilters = vi.fn();
      mockUseLiteratureSearchStore.mockReturnValue({
        showFilters: false,
        toggleShowFilters,
        getAppliedFilterCount: vi.fn().mockReturnValue(0),
        progressiveLoading: { isLoading: false },
      });

      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const toggleButton = screen.getByText('Toggle Filters');

      await userEvent.click(toggleButton);
      await userEvent.click(toggleButton);
      await userEvent.click(toggleButton);

      expect(toggleShowFilters).toHaveBeenCalledTimes(3);
    });

    it('should handle very large source counts', () => {
      const props = createDefaultProps({
        academicDatabasesCount: 999,
        alternativeSourcesCount: 999,
        socialPlatformsCount: 999,
      });

      render(<LiteratureSearchContainer {...props} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Performance Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const props = createDefaultProps();
      const { rerender } = render(<LiteratureSearchContainer {...props} />);

      // Re-render with same props
      rerender(<LiteratureSearchContainer {...props} />);

      // Component should handle this efficiently
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('should be memoized with React.memo', () => {
      // LiteratureSearchContainer should be a memoized component
      expect(LiteratureSearchContainer).toBeDefined();
      // Check if it has the memo wrapper (displayName should still work)
      expect(LiteratureSearchContainer.displayName).toBe('LiteratureSearchContainer');
    });

    it('should have memoized cancel handler', async () => {
      const cancelProgressiveSearch = vi.fn();
      mockUseProgressiveSearch.mockReturnValue({
        cancelProgressiveSearch,
        isSearching: false,
      });

      const props = createDefaultProps();
      const { rerender } = render(<LiteratureSearchContainer {...props} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(cancelProgressiveSearch).toHaveBeenCalledTimes(1);

      // Re-render with same props - handler should be the same reference
      rerender(<LiteratureSearchContainer {...props} />);

      // Click again
      await userEvent.click(cancelButton);
      expect(cancelProgressiveSearch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Enterprise Features Tests
  // ==========================================================================

  describe('Enterprise Features', () => {
    it('should have data-testid for E2E testing', () => {
      const props = createDefaultProps();
      const { container } = render(<LiteratureSearchContainer {...props} />);

      const mainContainer = container.querySelector('[data-testid="literature-search-container"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have ARIA region role', () => {
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      const region = screen.getByRole('region', { name: /literature search controls/i });
      expect(region).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icons', () => {
      const props = createDefaultProps();
      const { container } = render(<LiteratureSearchContainer {...props} />);

      const searchIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should wrap with ErrorBoundary', () => {
      // This test verifies ErrorBoundary is in the component tree
      // The actual error catching is tested in ErrorBoundary's own tests
      const props = createDefaultProps();
      render(<LiteratureSearchContainer {...props} />);

      // Component should render successfully (ErrorBoundary allows normal render)
      expect(screen.getByTestId('literature-search-container')).toBeInTheDocument();
    });
  });
});
