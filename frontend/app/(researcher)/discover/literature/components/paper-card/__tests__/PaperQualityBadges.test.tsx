/**
 * PaperQualityBadges Component Tests
 * Phase 10.154 - Apple-Grade Simplification
 *
 * Tests for:
 * - Citations per year badge display
 * - Memoization optimization
 * - Accessibility
 * - Edge cases
 *
 * NOTE: Quality score badge was removed in Phase 10.154
 * Quality info is now shown exclusively in MatchScoreBadge tooltip
 *
 * @file frontend/app/(researcher)/discover/literature/components/paper-card/__tests__/PaperQualityBadges.test.tsx
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaperQualityBadges } from '../PaperQualityBadges';

// ============================================================================
// Test Utilities
// ============================================================================

const defaultProps = {
  citationsPerYear: 25.5,
  citationCount: 150,
};

const renderPaperQualityBadges = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<PaperQualityBadges {...props} />);
};

// ============================================================================
// Test Suites
// ============================================================================

describe('PaperQualityBadges Component (Phase 10.154)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render citations per year badge', () => {
      renderPaperQualityBadges();

      expect(screen.getByText('25.5')).toBeInTheDocument();
      expect(screen.getByText('cites/yr')).toBeInTheDocument();
    });

    it('should return null when citationsPerYear is null', () => {
      const { container } = renderPaperQualityBadges({
        citationsPerYear: null,
      });

      expect(container.firstChild).toBeNull();
    });

    it('should return null when citationsPerYear is undefined', () => {
      const { container } = renderPaperQualityBadges({
        citationsPerYear: undefined,
      });

      expect(container.firstChild).toBeNull();
    });

    it('should return null when citationsPerYear is 0', () => {
      const { container } = renderPaperQualityBadges({
        citationsPerYear: 0,
      });

      expect(container.firstChild).toBeNull();
    });

    it('should return null when citationsPerYear is negative', () => {
      const { container } = renderPaperQualityBadges({
        citationsPerYear: -5,
      });

      expect(container.firstChild).toBeNull();
    });

    it('should format decimal citations per year correctly', () => {
      renderPaperQualityBadges({ citationsPerYear: 12.789 });

      // toFixed(1) rounds to 1 decimal place
      expect(screen.getByText('12.8')).toBeInTheDocument();
    });

    it('should handle high citation rates', () => {
      renderPaperQualityBadges({ citationsPerYear: 999.9 });

      expect(screen.getByText('999.9')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have accessible aria-label', () => {
      renderPaperQualityBadges();

      const badge = screen.getByLabelText(/citations per year/i);
      expect(badge).toBeInTheDocument();
    });

    it('should include citation count in aria-label when available', () => {
      renderPaperQualityBadges({ citationCount: 150 });

      const badge = screen.getByLabelText(/150 total citations/i);
      expect(badge).toBeInTheDocument();
    });

    it('should have informative title tooltip', () => {
      renderPaperQualityBadges();

      const badge = screen.getByTitle(/citation velocity/i);
      expect(badge).toBeInTheDocument();
    });

    it('should include total citations in tooltip when available', () => {
      renderPaperQualityBadges({ citationCount: 150 });

      const badge = screen.getByTitle(/total citations: 150/i);
      expect(badge).toBeInTheDocument();
    });

    it('should have hidden decorative icon', () => {
      renderPaperQualityBadges();

      // TrendingUp icon should be aria-hidden
      const svg = document.querySelector('svg[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Memoization
  // ==========================================================================

  describe('Memoization', () => {
    it('should have displayName set', () => {
      expect(PaperQualityBadges.displayName).toBe('PaperQualityBadges');
    });

    it('should re-render when citations per year changes', () => {
      const { rerender } = renderPaperQualityBadges({ citationsPerYear: 25.5 });

      expect(screen.getByText('25.5')).toBeInTheDocument();

      rerender(<PaperQualityBadges citationsPerYear={30.0} citationCount={150} />);

      expect(screen.getByText('30.0')).toBeInTheDocument();
      expect(screen.queryByText('25.5')).not.toBeInTheDocument();
    });

    it('should re-render when citation count changes', () => {
      const { rerender } = renderPaperQualityBadges({ citationCount: 100 });

      // Check tooltip contains 100
      expect(screen.getByTitle(/total citations: 100/i)).toBeInTheDocument();

      rerender(<PaperQualityBadges citationsPerYear={25.5} citationCount={200} />);

      // Check tooltip now contains 200
      expect(screen.getByTitle(/total citations: 200/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle null citation count gracefully', () => {
      renderPaperQualityBadges({ citationCount: null });

      // Should still render badge
      expect(screen.getByText('25.5')).toBeInTheDocument();

      // But should not include total citations in label
      const badge = screen.getByLabelText(/citations per year/i);
      expect(badge.getAttribute('aria-label')).not.toContain('total citations');
    });

    it('should handle undefined citation count gracefully', () => {
      renderPaperQualityBadges({ citationCount: undefined });

      // Should still render badge
      expect(screen.getByText('25.5')).toBeInTheDocument();
    });

    it('should handle very small citation rates', () => {
      renderPaperQualityBadges({ citationsPerYear: 0.1 });

      expect(screen.getByText('0.1')).toBeInTheDocument();
    });

    it('should handle whole number citation rates', () => {
      renderPaperQualityBadges({ citationsPerYear: 10 });

      expect(screen.getByText('10.0')).toBeInTheDocument();
    });
  });
});
