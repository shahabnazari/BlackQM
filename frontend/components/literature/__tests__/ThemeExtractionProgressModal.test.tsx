/**
 * ThemeExtractionProgressModal Component Tests - Phase 10.93 Day 5
 *
 * Enterprise-grade component testing for theme extraction progress modal.
 * Tests all workflow phases, error handling, accessibility, and user interactions.
 *
 * @module components/literature/__tests__/ThemeExtractionProgressModal
 * @since Phase 10.93 Day 5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ThemeExtractionProgressModal from '../ThemeExtractionProgressModal';
import { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('ThemeExtractionProgressModal', () => {
  // Helper function to create mock progress
  const createMockProgress = (overrides?: Partial<ExtractionProgress>): ExtractionProgress => ({
    isExtracting: false,
    stage: 'preparing',
    progress: 0,
    currentSource: 0,
    totalSources: 0,
    message: '',
    error: null,
    transparentMessage: undefined,
    ...overrides,
  });

  describe('Modal Visibility', () => {
    it('renders modal when isExtracting is true', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
        progress: 0,
        totalSources: 5,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Modal should be visible - check for stage content
      expect(screen.getByText(/Familiarization with Data/i)).toBeInTheDocument();
    });

    it('renders modal when stage is complete', () => {
      const progress = createMockProgress({
        isExtracting: false,
        stage: 'complete',
        progress: 100,
        message: 'Extraction complete!',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Complete state should be visible - use heading role to be specific
      expect(screen.getByRole('heading', { name: /Extraction Complete!/i })).toBeInTheDocument();
      expect(screen.getByText('Extraction complete!')).toBeInTheDocument();
    });

    it('renders modal when stage is error', () => {
      const progress = createMockProgress({
        isExtracting: false,
        stage: 'error',
        error: 'Network connection failed',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Error state should be visible
      expect(screen.getByText(/Extraction Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument();
    });

    it('does not render modal when not extracting and not complete/error', () => {
      const progress = createMockProgress({
        isExtracting: false,
        stage: 'preparing',
        progress: 0,
      });

      const { container } = render(<ThemeExtractionProgressModal progress={progress} />);

      // Modal should not be visible
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Stage Mapping', () => {
    it('maps preparing stage correctly (Stage 1: Familiarization)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
        progress: 10,
        totalSources: 5,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Familiarization stage
      expect(screen.getByText(/Familiarization with Data/i)).toBeInTheDocument();
    });

    it('maps extracting stage at <25% correctly (Stage 2: Coding)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 20,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Coding stage
      expect(screen.getByText(/Systematic Code Generation/i)).toBeInTheDocument();
    });

    it('maps extracting stage at 25-49% correctly (Stage 3: Theme Generation)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 40,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Theme Generation stage
      expect(screen.getByText(/Candidate Theme Construction/i)).toBeInTheDocument();
    });

    it('maps extracting stage at 50-74% correctly (Stage 4: Theme Review)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 60,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Theme Review stage
      expect(screen.getByText(/Theme Quality Review/i)).toBeInTheDocument();
    });

    it('maps extracting stage at 75%+ correctly (Stage 5: Theme Definition)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 80,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Theme Definition stage
      expect(screen.getByText(/Theme Naming & Definition/i)).toBeInTheDocument();
    });

    it('maps deduplicating stage correctly (Stage 5: Theme Definition)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'deduplicating',
        progress: 90,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Theme Definition stage
      expect(screen.getByText(/Theme Naming & Definition/i)).toBeInTheDocument();
    });

    it('maps complete stage correctly (Stage 6: Report Production)', () => {
      const progress = createMockProgress({
        isExtracting: false,
        stage: 'complete',
        progress: 100,
        message: 'Successfully extracted 15 themes',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show complete state
      expect(screen.getByText(/Extraction Complete!/i)).toBeInTheDocument();
      expect(screen.getByText(/Successfully extracted 15 themes/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose on Escape key when stage is complete', async () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      render(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose on Escape key when stage is error', async () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'error',
        error: 'Test error',
      });

      render(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does NOT call onClose on Escape key during active extraction', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 50,
      });

      render(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      // Should NOT call onClose during extraction
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose on backdrop click when stage is complete', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      const { container } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Click backdrop (first div)
      const backdrop = container.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on backdrop click when stage is error', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'error',
        error: 'Test error',
      });

      const { container } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Click backdrop
      const backdrop = container.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose on backdrop click during active extraction', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 50,
      });

      const { container } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Click backdrop
      const backdrop = container.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);

      // Should NOT call onClose during extraction
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose on modal content click', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      const { container } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Click modal content (should not close)
      const modalContent = container.querySelector('.max-w-4xl');
      fireEvent.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('displays error message when provided', () => {
      const progress = createMockProgress({
        stage: 'error',
        error: 'Database connection timeout',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(screen.getByText(/Extraction Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Database connection timeout/i)).toBeInTheDocument();
    });

    it('displays default error message when error is null', () => {
      const progress = createMockProgress({
        stage: 'error',
        error: null,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(screen.getByText(/An unknown error occurred/i)).toBeInTheDocument();
    });

    it('shows close instructions in error state', () => {
      const progress = createMockProgress({
        stage: 'error',
        error: 'Test error',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(screen.getByText(/Press ESC or click outside to close/i)).toBeInTheDocument();
    });
  });

  describe('Complete State', () => {
    it('displays success message when provided', () => {
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
        message: 'Successfully extracted 12 themes from 8 sources',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(screen.getByRole('heading', { name: /Extraction Complete!/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Successfully extracted 12 themes from 8 sources/i)
      ).toBeInTheDocument();
    });

    it('shows methodology reference in complete state', () => {
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(
        screen.getByText(/Backed by Braun & Clarke \(2006\) Reflexive Thematic Analysis/i)
      ).toBeInTheDocument();
    });

    it('shows close instructions in complete state', () => {
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      expect(screen.getByText(/Press ESC or click outside to close/i)).toBeInTheDocument();
    });
  });

  describe('WebSocket transparentMessage Integration', () => {
    it('uses WebSocket transparentMessage when provided', () => {
      const transparentMessage = {
        stageName: 'Custom Stage from WebSocket',
        stageNumber: 3,
        totalStages: 6,
        percentage: 45,
        whatWeAreDoing: 'Custom WebSocket operation',
        whyItMatters: 'Custom WebSocket explanation',
        liveStats: {
          sourcesAnalyzed: 10,
          currentOperation: 'WebSocket operation',
          codesGenerated: 85,
        },
      };

      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 45,
        transparentMessage,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should use WebSocket data instead of fallback mapping
      expect(screen.getByText(/Custom Stage from WebSocket/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom WebSocket operation/i)).toBeInTheDocument();
    });

    it('falls back to stage mapping when transparentMessage is not provided', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 30,
        totalSources: 5,
        transparentMessage: undefined,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should use fallback stage mapping
      expect(screen.getByText(/Candidate Theme Construction/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper modal role', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
      });

      const { container } = render(<ThemeExtractionProgressModal progress={progress} />);

      // Modal should have dialog role
      const modal = container.querySelector('.fixed.inset-0');
      expect(modal).toBeInTheDocument();
    });

    it('has backdrop with proper z-index for modal overlay', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
      });

      const { container } = render(<ThemeExtractionProgressModal progress={progress} />);

      const backdrop = container.querySelector('.fixed.inset-0');
      expect(backdrop).toHaveClass('z-[9999]');
    });

    it('supports keyboard navigation (Escape key)', async () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      render(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('ignores non-Escape keys', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      render(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      // Press Enter key (should be ignored)
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('cleans up event listeners on unmount', () => {
      const onClose = vi.fn();
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      const { unmount } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Unmount component
      unmount();

      // Press Escape (should not call onClose after unmount)
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('updates event listener when onClose function changes', async () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();

      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      const { rerender } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose1} />
      );

      // Change onClose prop (triggers useEffect dependency update)
      rerender(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose2} />
      );

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        // Should call NEW onClose, not old one (prevents stale closure bug)
        expect(onClose1).not.toHaveBeenCalled();
        expect(onClose2).toHaveBeenCalledTimes(1);
      });
    });

    it('updates event listener when canClose changes from false to true', async () => {
      const onClose = vi.fn();

      // Start with extracting (canClose = false)
      let progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 50,
      });

      const { rerender } = render(
        <ThemeExtractionProgressModal progress={progress} onClose={onClose} />
      );

      // Press Escape - should NOT work during extraction
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();

      // Change to complete (canClose = true)
      progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      rerender(<ThemeExtractionProgressModal progress={progress} onClose={onClose} />);

      // Press Escape - should NOW work
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose callback gracefully', () => {
      const progress = createMockProgress({
        stage: 'complete',
        progress: 100,
      });

      // Should not throw error when onClose is not provided
      expect(() => {
        render(<ThemeExtractionProgressModal progress={progress} />);
      }).not.toThrow();

      // Escape key should not cause errors
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });

    // Boundary condition tests - critical for off-by-one error detection
    // Component uses < comparisons: <25, <50, <75
    it('maps progress 0% to Stage 1 (Familiarization)', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 0,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Systematic Code Generation')).toBeInTheDocument();
    });

    it('maps progress 24% to Stage 2 (Coding) - just before boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 24,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Systematic Code Generation')).toBeInTheDocument();
    });

    it('maps progress 25% to Stage 3 (Theme Construction) - at boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 25,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Candidate Theme Construction')).toBeInTheDocument();
    });

    it('maps progress 49% to Stage 3 (Theme Construction) - just before boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 49,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Candidate Theme Construction')).toBeInTheDocument();
    });

    it('maps progress 50% to Stage 4 (Quality Review) - at boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 50,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Theme Quality Review')).toBeInTheDocument();
    });

    it('maps progress 74% to Stage 4 (Quality Review) - just before boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 74,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Theme Quality Review')).toBeInTheDocument();
    });

    it('maps progress 75% to Stage 5 (Theme Definition) - at boundary', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 75,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Theme Naming & Definition')).toBeInTheDocument();
    });

    it('maps progress 99% to Stage 5 (Theme Definition) - high percentage', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'extracting',
        progress: 99,
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);
      expect(screen.getByText('Theme Naming & Definition')).toBeInTheDocument();
    });

    it('handles empty error message', () => {
      const progress = createMockProgress({
        stage: 'error',
        error: '',
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show default error message for empty string
      expect(screen.getByText(/An unknown error occurred/i)).toBeInTheDocument();
    });

    it('handles zero totalSources gracefully', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
        progress: 0,
        totalSources: 0,
      });

      // Should not throw error
      expect(() => {
        render(<ThemeExtractionProgressModal progress={progress} />);
      }).not.toThrow();
    });

    it('clamps percentage to 15 for preparing stage with abnormally high progress', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'preparing',
        progress: 99, // Abnormally high for preparing stage
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should still show Stage 1 (Familiarization), not advanced to later stages
      // Component line 51: percentage = Math.min(15, progress.progress);
      expect(screen.getByText('Familiarization with Data')).toBeInTheDocument();
    });

    it('clamps deduplicating stage percentage to 90', () => {
      const progress = createMockProgress({
        isExtracting: true,
        stage: 'deduplicating',
        progress: 50, // Lower than the clamped value
        totalSources: 10,
      });

      render(<ThemeExtractionProgressModal progress={progress} />);

      // Should show Stage 5 (Theme Definition) with percentage set to 90
      // Component line 67: percentage = 90;
      expect(screen.getByText('Theme Naming & Definition')).toBeInTheDocument();
    });
  });
});
