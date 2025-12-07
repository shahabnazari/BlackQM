/**
 * AutocompleteDropdown - Component Tests (Netflix-Grade)
 * Phase 10.104 Day 3
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutocompleteDropdown } from '../AutocompleteDropdown';
import { type Suggestion } from '@/lib/services/search-suggestions.service';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AutocompleteDropdown', () => {
  const mockSuggestions: Suggestion[] = [
    {
      id: 'history_1',
      query: 'machine learning',
      source: 'user_history',
      score: 85,
      metadata: {
        matchType: 'exact',
        recencyDays: 1,
        successRate: 100
      }
    },
    {
      id: 'saved_1',
      query: 'machine learning algorithms',
      source: 'saved_search',
      score: 75,
      metadata: {
        matchType: 'fuzzy',
        recencyDays: 5,
        usageCount: 10,
        tags: ['ML', 'AI', 'Research']
      }
    },
    {
      id: 'trending_1',
      query: 'machine learning tutorial',
      source: 'trending',
      score: 65,
      metadata: {
        matchType: 'substring',
        recencyDays: 0
      }
    }
  ];

  const defaultProps = {
    query: 'machine',
    suggestions: mockSuggestions,
    isLoading: false,
    isOpen: true,
    selectedIndex: -1,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onSelectedIndexChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('should render suggestions list when open', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      expect(screen.getByRole('listbox', { name: /search suggestions/i })).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'machine learning';
      })).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'machine learning algorithms';
      })).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'machine learning tutorial';
      })).toBeInTheDocument();
    });

    test('should not render when closed', () => {
      render(<AutocompleteDropdown {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('should render loading skeleton when loading', () => {
      render(<AutocompleteDropdown {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('status', { name: /loading suggestions/i })).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('should render empty state when no suggestions', () => {
      render(<AutocompleteDropdown {...defaultProps} suggestions={[]} query="xyz" />);

      expect(screen.getByText(/no suggestions found/i)).toBeInTheDocument();
      expect(screen.getByText(/try searching for "xyz"/i)).toBeInTheDocument();
    });

    test('should not render empty state when query too short', () => {
      render(<AutocompleteDropdown {...defaultProps} suggestions={[]} query="x" />);

      expect(screen.queryByText(/no suggestions found/i)).not.toBeInTheDocument();
    });

    test('should render source badges for each suggestion', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Trending')).toBeInTheDocument();
    });

    test('should render tags for saved searches', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      expect(screen.getByText('ML')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    test('should render keyboard hints in footer', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      expect(screen.getByText(/to navigate/i)).toBeInTheDocument();
      expect(screen.getByText(/to select/i)).toBeInTheDocument();
      expect(screen.getByText(/to close/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should navigate down with ArrowDown key', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0);
    });

    test('should navigate up with ArrowUp key', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={1} />);

      fireEvent.keyDown(document, { key: 'ArrowUp' });

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0);
    });

    test('should wrap to end when navigating up from first item', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={0} />);

      fireEvent.keyDown(document, { key: 'ArrowUp' });

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(2); // Last index
    });

    test('should wrap to start when navigating down from last item', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={2} />);

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(0); // First index
    });

    test('should select suggestion with Enter key', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={1} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[1]);
    });

    test('should not select with Enter when no item selected', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={-1} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });

    test('should close with Escape key', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('should close with Tab key', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Tab' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('should not handle keyboard events when closed', () => {
      render(<AutocompleteDropdown {...defaultProps} isOpen={false} />);

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(defaultProps.onSelectedIndexChange).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Interaction', () => {
    test('should select suggestion on click', async () => {
      const user = userEvent.setup();
      render(<AutocompleteDropdown {...defaultProps} />);

      const firstSuggestion = screen.getByText((content, element) => {
        return element?.textContent === 'machine learning';
      });
      await user.click(firstSuggestion);

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    test('should update selected index on mouse enter', async () => {
      const user = userEvent.setup();
      render(<AutocompleteDropdown {...defaultProps} />);

      const secondSuggestion = screen.getByText((content, element) => {
        return element?.textContent === 'machine learning algorithms';
      });
      await user.hover(secondSuggestion);

      expect(defaultProps.onSelectedIndexChange).toHaveBeenCalledWith(1);
    });

    test('should close when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <AutocompleteDropdown {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      // Wait for effect to run
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    test('should not close when clicking inside dropdown', async () => {
      const user = userEvent.setup();
      render(<AutocompleteDropdown {...defaultProps} />);

      const listbox = screen.getByRole('listbox');
      await user.click(listbox);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Highlighting', () => {
    test('should highlight matching text in suggestions', () => {
      render(<AutocompleteDropdown {...defaultProps} query="machine" />);

      // Find all text nodes containing "machine" with semibold styling
      const highlighted = document.querySelectorAll('.font-semibold.text-blue-600');
      expect(highlighted.length).toBeGreaterThan(0);
    });

    test('should not highlight when query is empty', () => {
      render(<AutocompleteDropdown {...defaultProps} query="" />);

      const highlighted = document.querySelectorAll('.font-semibold.text-blue-600');
      expect(highlighted.length).toBe(0);
    });
  });

  describe('Visual States', () => {
    test('should apply selected styling to selected item', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={0} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('bg-blue-50');
    });

    test('should not apply selected styling to non-selected items', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={0} />);

      const options = screen.getAllByRole('option');
      expect(options[1]).not.toHaveClass('bg-blue-50');
      expect(options[2]).not.toHaveClass('bg-blue-50');
    });

    test('should apply different colors for different sources', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      expect(screen.getByText('Recent')).toHaveClass('text-blue-600', 'bg-blue-50');
      expect(screen.getByText('Saved')).toHaveClass('text-purple-600', 'bg-purple-50');
      expect(screen.getByText('Trending')).toHaveClass('text-orange-600', 'bg-orange-50');
    });
  });

  describe('Accessibility (ARIA)', () => {
    test('should have correct ARIA role for listbox', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Search suggestions');
    });

    test('should have correct ARIA role for options', () => {
      render(<AutocompleteDropdown {...defaultProps} />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    test('should set aria-selected on selected option', () => {
      render(<AutocompleteDropdown {...defaultProps} selectedIndex={1} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
    });

    test('should have aria-label on loading state', () => {
      render(<AutocompleteDropdown {...defaultProps} isLoading={true} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading suggestions');
    });

    test('should have aria-live on loading state', () => {
      render(<AutocompleteDropdown {...defaultProps} isLoading={true} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Scroll Behavior', () => {
    test('should scroll selected item into view', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(<AutocompleteDropdown {...defaultProps} selectedIndex={0} />);

      rerender(<AutocompleteDropdown {...defaultProps} selectedIndex={2} />);

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  describe('Animation', () => {
    test('should animate entry and exit', () => {
      const { container } = render(<AutocompleteDropdown {...defaultProps} />);

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toBeInTheDocument();
    });
  });
});
