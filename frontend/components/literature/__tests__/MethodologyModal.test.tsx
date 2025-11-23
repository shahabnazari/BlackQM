/**
 * MethodologyModal Component Tests
 * Phase 10.942 Day 5 - Testing & Validation
 *
 * Tests for:
 * - Modal rendering and accessibility
 * - Tab navigation
 * - Quality weights display (30/50/20)
 * - PDF download functionality
 * - WCAG 2.1 compliance
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MethodologyModal } from '../MethodologyModal';

// Mock window.open for PDF download tests
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen });

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
  },
}));

describe('MethodologyModal (Phase 10.942)', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('should render when open is true', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('Search Engine Methodology')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<MethodologyModal open={false} onClose={jest.fn()} />);

      expect(screen.queryByText('Search Engine Methodology')).not.toBeInTheDocument();
    });

    it('should display version 4.0 in description', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText(/v4.0 Enterprise-Grade/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Quality Weights Display Tests (30/50/20)
  // ============================================================================

  describe('Quality Weights Display (30/50/20)', () => {
    it('should display 30% for Citation Impact', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('Citation Impact')).toBeInTheDocument();
    });

    it('should display 50% for Journal Prestige', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Journal Prestige')).toBeInTheDocument();
    });

    it('should display 20% for Recency Boost', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('Recency Boost')).toBeInTheDocument();
    });

    it('should display optional bonuses (+10, +5, +5)', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getAllByText('+5').length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // Tab Navigation Tests
  // ============================================================================

  describe('Tab Navigation', () => {
    it('should show Quality Scoring tab by default', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Core Quality Weights (100%)')).toBeInTheDocument();
    });

    it('should switch to Relevance Algorithm tab', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Relevance Algorithm'));

      expect(screen.getByText('BM25 Algorithm (Best Match 25)')).toBeInTheDocument();
    });

    it('should switch to Data Sources tab', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Data Sources'));

      expect(screen.getByText('250M+ Papers from 9 Databases')).toBeInTheDocument();
    });

    it('should switch to Scientific References tab', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Scientific References'));

      expect(screen.getByText('Peer-Reviewed Foundations')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // BM25 Algorithm Display Tests
  // ============================================================================

  describe('BM25 Algorithm Display', () => {
    it('should display BM25 formula', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Relevance Algorithm'));

      expect(screen.getByText(/BM25 Formula/)).toBeInTheDocument();
    });

    it('should display k1 and b parameters', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Relevance Algorithm'));

      expect(screen.getByText(/k1 = 1.2/)).toBeInTheDocument();
      expect(screen.getByText(/b = 0.75/)).toBeInTheDocument();
    });

    it('should display position weighting (3x title, 1x abstract)', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Relevance Algorithm'));

      expect(screen.getByText('3x')).toBeInTheDocument();
      expect(screen.getByText('1x')).toBeInTheDocument();
    });

    it('should display relevance tiers', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Relevance Algorithm'));

      expect(screen.getByText('Highly Relevant')).toBeInTheDocument();
      expect(screen.getByText('Very Relevant')).toBeInTheDocument();
      expect(screen.getByText('Relevant')).toBeInTheDocument();
      expect(screen.getByText('Somewhat Relevant')).toBeInTheDocument();
      expect(screen.getByText('Low Relevance')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PDF Download Tests
  // ============================================================================

  describe('PDF Download', () => {
    it('should have Download PDF button', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('should open methodology docs on PDF click', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Download PDF'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION'),
        '_blank'
      );
    });
  });

  // ============================================================================
  // Accessibility Tests (WCAG 2.1)
  // ============================================================================

  describe('Accessibility (WCAG 2.1)', () => {
    it('should have accessible close button', () => {
      render(<MethodologyModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      render(<MethodologyModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible tab buttons', () => {
      render(<MethodologyModal {...defaultProps} />);

      const tabButtons = screen.getAllByRole('button');
      expect(tabButtons.length).toBeGreaterThan(0);
    });

    it('should call onClose when close button clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      render(<MethodologyModal open={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Scientific References Display
  // ============================================================================

  describe('Scientific References', () => {
    it('should display Robertson & Walker (1994) reference', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Scientific References'));

      expect(screen.getByText(/Robertson, S.E. & Walker, S./)).toBeInTheDocument();
      expect(screen.getByText('1994')).toBeInTheDocument();
    });

    it('should display Waltman & van Eck (2019) reference', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Scientific References'));

      expect(screen.getByText(/Waltman, L. & van Eck, N.J./)).toBeInTheDocument();
    });

    it('should display Garfield (1980) reference', async () => {
      const user = userEvent.setup();
      render(<MethodologyModal {...defaultProps} />);

      await user.click(screen.getByText('Scientific References'));

      expect(screen.getByText(/Garfield, E./)).toBeInTheDocument();
    });
  });
});
