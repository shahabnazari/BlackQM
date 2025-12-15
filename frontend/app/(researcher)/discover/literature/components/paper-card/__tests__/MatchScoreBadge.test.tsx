/**
 * MatchScoreBadge Component Tests
 * Phase 10.123 - Netflix-Grade PaperCard Redesign
 *
 * Tests for:
 * - Touch/click conflict bug fix (mobile devices)
 * - Keyboard accessibility
 * - Tooltip behavior
 * - Memoization
 * - Analytics callbacks
 *
 * @file frontend/app/(researcher)/discover/literature/components/paper-card/__tests__/MatchScoreBadge.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MatchScoreBadge } from '../MatchScoreBadge';

// ============================================================================
// Mock Dependencies
// ============================================================================

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// Test Utilities
// ============================================================================

const defaultProps = {
  neuralRelevanceScore: 75,
  neuralRank: 5,
  neuralExplanation: 'BM25=45, Sem=72, ThemeFit=58',
  qualityScore: 80,
  citationCount: 150,
  citationsPerYear: 25.5,
  venue: 'Nature Medicine',
  onTooltipOpen: vi.fn(),
  onTooltipClose: vi.fn(),
};

const renderMatchScoreBadge = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<MatchScoreBadge {...props} />);
};

// ============================================================================
// Test Suites
// ============================================================================

describe('MatchScoreBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Phase 10.155: Ensure cleanup between tests to prevent DOM pollution
    cleanup();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render score badge with correct score', () => {
      renderMatchScoreBadge();

      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should render match label', () => {
      renderMatchScoreBadge();

      expect(screen.getByText('Strong Match')).toBeInTheDocument();
    });

    it('should render rank badge', () => {
      renderMatchScoreBadge();

      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('should render quality tier icon', () => {
      renderMatchScoreBadge({ qualityScore: 80 });

      // Gold tier icon should be present
      const tierIcon = screen.getByRole('img', { name: /high quality/i });
      expect(tierIcon).toBeInTheDocument();
    });

    it('should return null when score is null', () => {
      const { container } = renderMatchScoreBadge({ neuralRelevanceScore: null });

      expect(container.firstChild).toBeNull();
    });

    it('should return null when score is undefined', () => {
      const { container } = renderMatchScoreBadge({ neuralRelevanceScore: undefined });

      expect(container.firstChild).toBeNull();
    });

    it('should handle NaN score gracefully', () => {
      const { container } = renderMatchScoreBadge({ neuralRelevanceScore: NaN });

      expect(container.firstChild).toBeNull();
    });

    it('should clamp score to 0-100 range', () => {
      renderMatchScoreBadge({ neuralRelevanceScore: 150 });

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should clamp negative score to 0', () => {
      renderMatchScoreBadge({ neuralRelevanceScore: -50 });

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Touch/Click Conflict Bug Fix (Critical)
  // ==========================================================================

  describe('Touch/Click Conflict Bug Fix', () => {
    it('should open tooltip on touch start', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should NOT toggle tooltip on click after touch (prevents double-fire)', () => {
      const onTooltipOpen = vi.fn();
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen, onTooltipClose });

      const button = screen.getByRole('button');

      // Simulate touch event followed by click (mobile behavior)
      fireEvent.touchStart(button);
      expect(onTooltipOpen).toHaveBeenCalledTimes(1);

      // Click should be ignored because touch already handled it
      fireEvent.click(button);
      expect(onTooltipClose).not.toHaveBeenCalled();

      // Tooltip should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should reset touch flag after touchEnd + delay', async () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');

      // Touch start
      fireEvent.touchStart(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Touch end
      fireEvent.touchEnd(button);

      // Advance timers past the 100ms reset delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now close the tooltip (auto-dismiss or manually)
      act(() => {
        vi.advanceTimersByTime(3000); // Auto-dismiss timeout
      });

      // Click should work again after touch flag reset
      fireEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should auto-dismiss tooltip after 3 seconds on touch', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Advance timer to just before auto-dismiss
      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Advance past auto-dismiss
      act(() => {
        vi.advanceTimersByTime(2);
      });

      expect(onTooltipClose).toHaveBeenCalled();
    });

    it('should toggle tooltip on click (desktop - no touch event)', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');

      // Click without prior touch event
      fireEvent.click(button);

      expect(onTooltipOpen).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close tooltip on second click (desktop)', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');

      // First click - opens
      fireEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Second click - closes
      fireEvent.click(button);
      expect(onTooltipClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Keyboard Accessibility
  // ==========================================================================

  describe('Keyboard Accessibility', () => {
    it('should toggle tooltip on Enter key', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onTooltipOpen).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should toggle tooltip on Space key', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });

      expect(onTooltipOpen).toHaveBeenCalled();
    });

    it('should close tooltip on Escape key', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');

      // Open first
      fireEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close with Escape
      fireEvent.keyDown(button, { key: 'Escape' });
      expect(onTooltipClose).toHaveBeenCalled();
    });

    it('should have proper aria-label', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Match score: 75');
      expect(button.getAttribute('aria-label')).toContain('Rank #5');
    });

    it('should have aria-expanded attribute', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-haspopup="dialog"', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    });
  });

  // ==========================================================================
  // Hover Behavior (Desktop)
  // ==========================================================================

  describe('Hover Behavior', () => {
    it('should open tooltip on mouse enter', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(onTooltipOpen).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close tooltip on mouse leave', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.mouseLeave(button);
      expect(onTooltipClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Focus Behavior
  // ==========================================================================

  describe('Focus Behavior', () => {
    it('should open tooltip on focus', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      expect(onTooltipOpen).toHaveBeenCalled();
    });

    it('should close tooltip on blur after delay', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');

      fireEvent.focus(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.blur(button);

      // Should not close immediately (150ms delay)
      expect(onTooltipClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(onTooltipClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Tooltip Content
  // ==========================================================================

  // Phase 10.155: Updated tests for compact 2-column tooltip design
  describe('Tooltip Content', () => {
    it('should display overall score', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Score shown prominently - may appear in button and tooltip
      const scoreElements = screen.getAllByText('75');
      expect(scoreElements.length).toBeGreaterThan(0);
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('should display BM25 breakdown in relevance column', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Compact labels
      expect(screen.getByText('Keywords')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should display semantic score in relevance column', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Compact labels
      expect(screen.getByText('Semantic')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('should display theme fit in relevance column', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Topic Fit')).toBeInTheDocument();
      expect(screen.getByText('58')).toBeInTheDocument();
    });

    it('should display quality tier in quality column', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Quality tier shown - may appear multiple times
      const qualityElements = screen.getAllByText(/Quality/);
      expect(qualityElements.length).toBeGreaterThan(0);
      expect(screen.getByText('High Quality')).toBeInTheDocument();
    });

    it('should display citation info in quality column', () => {
      renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Citations in quality column - use getAllByText for multiple matches
      expect(screen.getByText('Citations')).toBeInTheDocument();
      const countElements = screen.getAllByText('150');
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should handle missing explanation gracefully', () => {
      renderMatchScoreBadge({ neuralExplanation: null });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Phase 10.155: Compact error message
      expect(screen.getByText('Breakdown unavailable')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Analytics Callbacks
  // ==========================================================================

  describe('Analytics Callbacks', () => {
    it('should call onTooltipOpen when tooltip opens', () => {
      const onTooltipOpen = vi.fn();
      renderMatchScoreBadge({ onTooltipOpen });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onTooltipOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onTooltipClose when tooltip closes', () => {
      const onTooltipClose = vi.fn();
      renderMatchScoreBadge({ onTooltipClose });

      const button = screen.getByRole('button');

      // Open
      fireEvent.click(button);
      // Close
      fireEvent.click(button);

      expect(onTooltipClose).toHaveBeenCalledTimes(1);
    });

    it('should not throw when callbacks are undefined', () => {
      renderMatchScoreBadge({ onTooltipOpen: undefined, onTooltipClose: undefined });

      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.click(button);
        fireEvent.click(button);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Memoization
  // ==========================================================================

  describe('Memoization', () => {
    it('should not re-render when props are the same', () => {
      const { rerender } = renderMatchScoreBadge();

      const button = screen.getByRole('button');
      const initialText = button.textContent;

      rerender(<MatchScoreBadge {...defaultProps} />);

      expect(button.textContent).toBe(initialText);
    });

    it('should re-render when score changes', () => {
      const { rerender } = renderMatchScoreBadge({ neuralRelevanceScore: 75 });

      expect(screen.getByText('75')).toBeInTheDocument();

      rerender(<MatchScoreBadge {...defaultProps} neuralRelevanceScore={90} />);

      expect(screen.getByText('90')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Memory Leak Prevention
  // ==========================================================================

  describe('Memory Leak Prevention', () => {
    it('should cleanup timeout on unmount', () => {
      const { unmount } = renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      // Unmount before auto-dismiss
      unmount();

      // Should not throw or cause memory leak
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });

    it('should cleanup blur timeout on unmount', () => {
      const { unmount } = renderMatchScoreBadge();

      const button = screen.getByRole('button');
      fireEvent.focus(button);
      fireEvent.blur(button);

      // Unmount before blur delay
      unmount();

      // Should not throw or cause memory leak
      act(() => {
        vi.advanceTimersByTime(200);
      });
    });
  });
});
