/**
 * PaperQualityBadges Component Tests
 * Phase 10.123 - Netflix-Grade PaperCard Redesign
 *
 * Tests for:
 * - Memoization optimization
 * - Quality score display
 * - Accessibility
 *
 * @file frontend/app/(researcher)/discover/literature/components/paper-card/__tests__/PaperQualityBadges.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaperQualityBadges } from '../PaperQualityBadges';
import type { MetadataCompleteness } from '@/lib/types/literature.types';

// ============================================================================
// Mock Dependencies
// ============================================================================

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// Test Utilities
// ============================================================================

const createMetadataCompleteness = (
  overrides: Partial<MetadataCompleteness> = {}
): MetadataCompleteness => ({
  availableMetrics: 4,
  totalMetrics: 4,
  hasCitations: true,
  hasJournalMetrics: true,
  hasYear: true,
  hasAbstract: true,
  ...overrides,
});

const defaultProps = {
  citationsPerYear: 25.5,
  qualityScore: 75,
  qualityScoreBreakdown: {
    citationImpact: 80,
    journalPrestige: 70,
    recencyBoost: 60,
    openAccessBonus: 10,
    reproducibilityBonus: 0,
    altmetricBonus: 5,
    coreScore: 70,
    metadataCompleteness: createMetadataCompleteness(),
  },
  citationCount: 150,
  relevanceScore: 85,
  metadataCompleteness: createMetadataCompleteness(),
};

const renderPaperQualityBadges = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<PaperQualityBadges {...props} />);
};

// ============================================================================
// Test Suites
// ============================================================================

describe('PaperQualityBadges Component', () => {
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

      expect(screen.getAllByText('25.5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('cites/yr').length).toBeGreaterThan(0);
    });

    it('should render quality score badge', () => {
      renderPaperQualityBadges();

      // Multiple elements may have this text
      const scoreElements = screen.getAllByText('75');
      expect(scoreElements.length).toBeGreaterThan(0);
    });

    it('should render relevance badge', () => {
      renderPaperQualityBadges();

      // Check for relevance tier label (Very Relevant for score 85)
      // May appear multiple times, use getAllByText
      const relevanceLabels = screen.getAllByText('Very Relevant');
      expect(relevanceLabels.length).toBeGreaterThan(0);
    });

    it('should return null when no quality data available', () => {
      const { container } = renderPaperQualityBadges({
        citationsPerYear: null,
        qualityScore: null,
        relevanceScore: null,
      });

      expect(container.firstChild).toBeNull();
    });

    it('should render with only citations per year', () => {
      renderPaperQualityBadges({
        qualityScore: null,
        relevanceScore: null,
      });

      expect(screen.getAllByText('25.5').length).toBeGreaterThan(0);
    });

    it('should render with only quality score', () => {
      renderPaperQualityBadges({
        citationsPerYear: null,
        relevanceScore: null,
      });

      const scoreElements = screen.getAllByText('75');
      expect(scoreElements.length).toBeGreaterThan(0);
    });

    it('should handle zero citations per year', () => {
      renderPaperQualityBadges({
        citationsPerYear: 0,
        qualityScore: 75,
        relevanceScore: null, // Explicitly nullify to test only citations behavior
      });

      // citationsPerYear === 0 should not render citations badge
      const citesElements = screen.queryAllByText('cites/yr');
      expect(citesElements.length).toBe(0);
      // But quality score should still render
      const scoreElements = screen.getAllByText('75');
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Confidence Indicator
  // ==========================================================================

  describe('Confidence Indicator', () => {
    it('should display high confidence for 4/4 metrics', () => {
      renderPaperQualityBadges({
        metadataCompleteness: createMetadataCompleteness({ availableMetrics: 4 }),
      });

      // May have multiple elements with 4/4 text
      expect(screen.getAllByText('4/4').length).toBeGreaterThan(0);
    });

    it('should display low confidence for 1/4 metrics', () => {
      renderPaperQualityBadges({
        qualityScoreBreakdown: {
          ...defaultProps.qualityScoreBreakdown,
          metadataCompleteness: createMetadataCompleteness({
            availableMetrics: 1,
            hasCitations: true,
            hasJournalMetrics: false,
            hasYear: false,
            hasAbstract: false,
          }),
        },
      });

      expect(screen.getAllByText('1/4').length).toBeGreaterThan(0);
    });

    it('should handle undefined metadataCompleteness', () => {
      renderPaperQualityBadges({
        metadataCompleteness: undefined,
        qualityScoreBreakdown: {
          ...defaultProps.qualityScoreBreakdown,
          metadataCompleteness: undefined,
        },
      });

      // Should default to 0/4
      expect(screen.getAllByText('0/4').length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have accessible labels on citations badge', () => {
      renderPaperQualityBadges();

      // Check for aria-label containing citations per year (may have multiple)
      const citationsBadges = screen.getAllByLabelText(/citations per year/i);
      expect(citationsBadges.length).toBeGreaterThan(0);
    });

    it('should have accessible labels on relevance badge', () => {
      renderPaperQualityBadges();

      // Check for aria-label containing BM25 (may have multiple)
      const relevanceBadges = screen.getAllByLabelText(/BM25/i);
      expect(relevanceBadges.length).toBeGreaterThan(0);
    });

    it('should have accessible label on quality button', () => {
      renderPaperQualityBadges();

      // Quality button should have aria-label
      const buttons = screen.getAllByRole('button');
      const qualityButton = buttons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Quality score')
      );
      expect(qualityButton).toBeDefined();
    });
  });

  // ==========================================================================
  // Memoization
  // ==========================================================================

  describe('Memoization', () => {
    it('should have displayName set', () => {
      expect(PaperQualityBadges.displayName).toBe('PaperQualityBadges');
    });

    it('should re-render when quality score changes', () => {
      const { rerender } = renderPaperQualityBadges({ qualityScore: 75 });

      expect(screen.getAllByText('75').length).toBeGreaterThan(0);

      rerender(<PaperQualityBadges {...defaultProps} qualityScore={90} />);

      expect(screen.getAllByText('90').length).toBeGreaterThan(0);
    });

    it('should re-render when citations per year changes', () => {
      const { rerender } = renderPaperQualityBadges({ citationsPerYear: 25.5 });

      expect(screen.getAllByText('25.5').length).toBeGreaterThan(0);

      rerender(<PaperQualityBadges {...defaultProps} citationsPerYear={30.0} />);

      expect(screen.getAllByText('30.0').length).toBeGreaterThan(0);
    });

    it('should re-render when relevance score changes', () => {
      const { rerender } = renderPaperQualityBadges({ relevanceScore: 85 });

      expect(screen.getAllByText('Very Relevant').length).toBeGreaterThan(0);

      rerender(<PaperQualityBadges {...defaultProps} relevanceScore={45} />);

      expect(screen.getAllByText('Somewhat Relevant').length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // useCallback Optimization
  // ==========================================================================

  describe('useCallback Optimization', () => {
    it('should handle tooltip interactions without errors', () => {
      renderPaperQualityBadges();

      // Find quality button by aria-label
      const buttons = screen.getAllByRole('button');
      const qualityButton = buttons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Quality score')
      );

      if (qualityButton) {
        // Should not throw on hover interactions
        expect(() => {
          fireEvent.mouseEnter(qualityButton);
          fireEvent.mouseLeave(qualityButton);
        }).not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle null citation count gracefully', () => {
      // Should not crash
      expect(() => {
        renderPaperQualityBadges({ citationCount: null });
      }).not.toThrow();
    });

    it('should handle missing breakdown fields', () => {
      // Should not crash
      expect(() => {
        renderPaperQualityBadges({
          qualityScoreBreakdown: {
            metadataCompleteness: createMetadataCompleteness(),
          },
        });
      }).not.toThrow();
    });

    it('should handle zero bonuses', () => {
      // Should not crash with zero bonuses
      expect(() => {
        renderPaperQualityBadges({
          qualityScoreBreakdown: {
            ...defaultProps.qualityScoreBreakdown,
            openAccessBonus: 0,
            reproducibilityBonus: 0,
            altmetricBonus: 0,
          },
        });
      }).not.toThrow();
    });
  });
});
