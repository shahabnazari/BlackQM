/**
 * Unit Tests for ProgressBar Component
 * Phase 10.91 Day 11 - Enterprise-Grade Testing
 *
 * Tests ProgressBar component with comprehensive edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar } from '../ProgressBar';
import { vi } from 'vitest';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    ),
  },
}));

describe('ProgressBar', () => {
  const defaultProps = {
    current: 50,
    total: 100,
    status: 'loading' as const,
  };

  describe('Rendering', () => {
    it('should render progress bar with correct ARIA attributes', () => {
      render(<ProgressBar {...defaultProps} />);
      const progressbar = screen.getByRole('progressbar');

      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render status text', () => {
      render(<ProgressBar {...defaultProps} />);
      expect(screen.getByText(/Stage 1: Fetching eligible papers/i)).toBeInTheDocument();
    });

    it('should render percentage', () => {
      render(<ProgressBar {...defaultProps} visualPercentage={25} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Division by Zero', () => {
    it('should handle total = 0 without crashing', () => {
      render(<ProgressBar {...defaultProps} total={0} />);
      expect(screen.getByText('Initializing search...')).toBeInTheDocument();
    });

    it('should handle negative total without crashing', () => {
      render(<ProgressBar {...defaultProps} total={-10} />);
      expect(screen.getByText('Initializing search...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases - Zero Results', () => {
    it('should show zero results message when stage2FinalSelected is 0', () => {
      render(
        <ProgressBar
          {...defaultProps}
          status="complete"
          stage2FinalSelected={0}
        />
      );
      expect(screen.getByText('No papers found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search query')).toBeInTheDocument();
    });

    it('should show zero results when stage1TotalCollected is 0 and complete', () => {
      render(
        <ProgressBar
          {...defaultProps}
          status="complete"
          stage1TotalCollected={0}
        />
      );
      expect(screen.getByText('No papers found')).toBeInTheDocument();
    });
  });

  describe('Stage-based Progress', () => {
    it('should show Stage 1 message when currentStage is 1', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentStage={1}
          visualPercentage={25}
          stage1={{ totalCollected: 1000, sourcesSearched: 6, sourceBreakdown: {} }}
        />
      );
      expect(screen.getByText(/Stage 1: Fetching eligible papers from 6 sources/i)).toBeInTheDocument();
    });

    it('should show Stage 2 message when currentStage is 2', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentStage={2}
          visualPercentage={75}
        />
      );
      expect(screen.getByText('Stage 2: Filtering to highest quality papers')).toBeInTheDocument();
    });

    it('should show transition message at 50%', () => {
      render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={50}
          stage1TotalCollected={1500}
        />
      );
      expect(screen.getByText(/Fetched 1,500 papers - Starting quality filtering/i)).toBeInTheDocument();
    });
  });

  describe('Complete Status', () => {
    it('should show completion message when status is complete', () => {
      render(
        <ProgressBar
          {...defaultProps}
          status="complete"
          visualPercentage={100}
          stage2FinalSelected={200}
        />
      );
      expect(screen.getByText(/Finalized 200 high-quality papers/i)).toBeInTheDocument();
    });

    it('should show green text color when complete', () => {
      render(
        <ProgressBar
          {...defaultProps}
          status="complete"
          visualPercentage={100}
          stage2FinalSelected={200}
        />
      );
      const percentage = screen.getByText('100%');
      expect(percentage).toHaveClass('text-green-600');
    });
  });

  describe('Counter Display Logic', () => {
    it('should return null when no backend data available', () => {
      const { container } = render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={25}
        />
      );
      // Counter badge should not be visible
      expect(container.querySelector('.whitespace-nowrap')).not.toBeInTheDocument();
    });

    it('should show final count when complete', () => {
      render(
        <ProgressBar
          {...defaultProps}
          status="complete"
          stage2FinalSelected={200}
          visualPercentage={100}
        />
      );
      expect(screen.getByText(/Finalized 200 high-quality papers/i)).toBeInTheDocument();
    });

    it('should interpolate count in Stage 1', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentStage={1}
          stage1TotalCollected={1000}
          visualPercentage={25}
        />
      );
      // At 25% of stage 1 (which is 0-50% total), counter should show ~500
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('should clamp percentage to 0-100 range', () => {
      const { rerender } = render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={150}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();

      rerender(<ProgressBar {...defaultProps} visualPercentage={-10} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate percentage from current/total if visualPercentage not provided', () => {
      render(
        <ProgressBar
          {...defaultProps}
          current={50}
          total={100}
          currentStage={1}
        />
      );
      // Stage 1 is 0-50%, so 50/100 at stage 1 = 25% total
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Starting Search States', () => {
    it('should show "Starting search..." at 0%', () => {
      render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={0}
        />
      );
      expect(screen.getByText('Starting search...')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show connecting message at < 1%', () => {
      render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={0.5}
        />
      );
      expect(screen.getByText('Connecting to academic databases...')).toBeInTheDocument();
      expect(screen.getByText('0.5%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label with stage information', () => {
      render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={75}
          currentStage={2}
        />
      );
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', expect.stringContaining('Stage 2 of 2'));
    });

    it('should update aria-valuenow based on percentage', () => {
      const { rerender } = render(
        <ProgressBar
          {...defaultProps}
          visualPercentage={25}
        />
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');

      rerender(<ProgressBar {...defaultProps} visualPercentage={75} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });
  });
});
