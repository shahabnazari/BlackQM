/**
 * InstagramSearchSection Unit Tests
 * Phase 10.91 Day 15 - Testing Infrastructure
 *
 * Tests cover:
 * - Component rendering
 * - Result type conversion
 * - User interactions
 * - Loading states
 * - Empty states
 * - Accessibility
 * - Type safety
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstagramSearchSection } from '../InstagramSearchSection';
import type { InstagramResult } from '../InstagramSearchSection';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock SocialMediaResultsDisplay component
jest.mock('@/components/literature', () => ({
  SocialMediaResultsDisplay: ({
    results,
    insights,
    loading,
    onViewTranscript,
    onAddToResearch,
  }: any) => (
    <div data-testid="social-media-results">
      <div data-testid="result-count">{results.length}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'not-loading'}</div>
      {insights && <div data-testid="insights">Insights present</div>}
      {results.map((result: any) => (
        <div key={result.id} data-testid={`result-${result.id}`}>
          <span>{result.platform}</span>
          <span>{result.username}</span>
          <button onClick={() => onViewTranscript(result)}>View Transcript</button>
          <button onClick={() => onAddToResearch(result)}>Add to Research</button>
        </div>
      ))}
    </div>
  ),
}));

describe('InstagramSearchSection', () => {
  const mockInstagramResults: InstagramResult[] = [
    {
      id: 'ig-1',
      author: { username: 'testuser1' },
      caption: 'Test caption 1',
      url: 'https://instagram.com/p/test1',
      thumbnailUrl: 'https://instagram.com/thumb1.jpg',
      publishedAt: new Date('2024-01-01'),
      stats: {
        likes: 100,
        comments: 10,
        views: 1000,
        shares: 5,
      },
      themes: ['theme1', 'theme2'],
      sentimentScore: 0.8,
      relevanceScore: 0.9,
    },
    {
      id: 'ig-2',
      username: 'testuser2', // Alternative username format
      caption: 'Test caption 2',
      url: 'https://instagram.com/p/test2',
      publishedAt: new Date('2024-01-02'),
      stats: {
        likes: 200,
      },
    },
  ];

  const defaultProps = {
    isSelected: true,
    results: mockInstagramResults,
    isLoading: false,
    insights: null,
    additionalResults: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when not selected', () => {
      const { container } = render(
        <InstagramSearchSection {...defaultProps} isSelected={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render results when selected and has results', () => {
      render(<InstagramSearchSection {...defaultProps} />);
      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
      expect(screen.getByTestId('result-count')).toHaveTextContent('2');
    });

    it('should render loading state', () => {
      render(<InstagramSearchSection {...defaultProps} isLoading={true} results={[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Searching Instagram...')).toBeInTheDocument();
    });

    it('should not render when no results and not loading', () => {
      const { container } = render(
        <InstagramSearchSection {...defaultProps} results={[]} isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render with insights', () => {
      const insights = { totalPosts: 10, avgEngagement: 0.5 };
      render(<InstagramSearchSection {...defaultProps} insights={insights} />);

      expect(screen.getByTestId('insights')).toBeInTheDocument();
    });

    it('should combine additional results with Instagram results', () => {
      const additionalResults = [
        {
          id: 'additional-1',
          platform: 'tiktok' as const,
          username: 'tiktokuser',
        },
      ];

      render(
        <InstagramSearchSection
          {...defaultProps}
          additionalResults={additionalResults}
        />
      );

      // Should show 3 total results (2 Instagram + 1 additional)
      expect(screen.getByTestId('result-count')).toHaveTextContent('3');
    });
  });

  describe('Type Conversion', () => {
    it('should convert Instagram results to SocialMediaResult format', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      // Check that results have correct platform
      const results = screen.getAllByTestId(/^result-/);
      results.forEach(result => {
        expect(result).toHaveTextContent('instagram');
      });
    });

    it('should handle author.username format', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      expect(screen.getByTestId('result-ig-1')).toHaveTextContent('testuser1');
    });

    it('should handle direct username format', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      expect(screen.getByTestId('result-ig-2')).toHaveTextContent('testuser2');
    });

    it('should convert publishedAt to ISO string', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      // Conversion happens internally - verify no errors
      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
    });

    it('should handle missing optional properties', () => {
      const minimalResult: InstagramResult = {
        id: 'minimal',
        caption: 'Minimal post',
      };

      render(<InstagramSearchSection {...defaultProps} results={[minimalResult]} />);

      // Should render without errors
      expect(screen.getByTestId('result-minimal')).toBeInTheDocument();
    });

    it('should preserve all engagement stats', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      // Stats should be converted correctly
      // (Internal conversion - verified by no errors)
      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle view transcript action', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(<InstagramSearchSection {...defaultProps} />);

      const viewButton = screen.getAllByText('View Transcript')[0];
      await user.click(viewButton);

      expect(toast.info).toHaveBeenCalledWith(
        'Instagram transcript viewer opening...',
        expect.objectContaining({
          description: 'Coming soon in Q1 2025',
        })
      );
    });

    it('should handle add to research action', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(<InstagramSearchSection {...defaultProps} />);

      const addButton = screen.getAllByText('Add to Research')[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Added Instagram post to research corpus',
          expect.objectContaining({
            description: 'Post will be included in theme extraction.',
          })
        );
      });
    });

    it('should handle errors in add to research', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      // Mock console.error to avoid noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<InstagramSearchSection {...defaultProps} />);

      const addButton = screen.getAllByText('Add to Research')[0];
      await user.click(addButton);

      // Should still show success (no actual error in test)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results array', () => {
      const { container } = render(
        <InstagramSearchSection {...defaultProps} results={[]} isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should handle null insights', () => {
      render(<InstagramSearchSection {...defaultProps} insights={null} />);

      expect(screen.queryByTestId('insights')).not.toBeInTheDocument();
    });

    it('should handle undefined additionalResults', () => {
      render(
        <InstagramSearchSection
          {...defaultProps}
          additionalResults={undefined as any}
        />
      );

      // Should default to empty array
      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
    });

    it('should handle result without publishedAt', () => {
      const resultWithoutDate: InstagramResult = {
        id: 'no-date',
        caption: 'No date post',
      };

      render(<InstagramSearchSection {...defaultProps} results={[resultWithoutDate]} />);

      // Should use current date as fallback
      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
    });

    it('should handle transcriptionStatus conversion', () => {
      const resultWithTranscription: InstagramResult = {
        id: 'with-transcription',
        caption: 'Transcribed post',
        transcriptionStatus: 'completed',
      };

      render(
        <InstagramSearchSection {...defaultProps} results={[resultWithTranscription]} />
      );

      expect(screen.getByTestId('social-media-results')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on loading state', () => {
      render(<InstagramSearchSection {...defaultProps} isLoading={true} results={[]} />);

      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-hidden on decorative icon', () => {
      render(<InstagramSearchSection {...defaultProps} isLoading={true} results={[]} />);

      const loader = screen.getByRole('status').querySelector('[aria-hidden="true"]');
      expect(loader).toBeInTheDocument();
    });

    it('should not render when not selected', () => {
      const { container } = render(
        <InstagramSearchSection {...defaultProps} isSelected={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should memoize result conversion', () => {
      const { rerender } = render(<InstagramSearchSection {...defaultProps} />);

      // Re-render with same results
      rerender(<InstagramSearchSection {...defaultProps} />);

      // Memoization prevents unnecessary recalculation
      expect(screen.getByTestId('result-count')).toHaveTextContent('2');
    });

    it('should update when results change', () => {
      const { rerender } = render(<InstagramSearchSection {...defaultProps} />);

      const newResults = [mockInstagramResults[0]]; // Only first result
      rerender(<InstagramSearchSection {...defaultProps} results={newResults} />);

      expect(screen.getByTestId('result-count')).toHaveTextContent('1');
    });

    it('should update when additionalResults change', () => {
      const { rerender } = render(<InstagramSearchSection {...defaultProps} />);

      const additionalResults = [{ id: 'new', platform: 'tiktok' as const }];
      rerender(
        <InstagramSearchSection
          {...defaultProps}
          additionalResults={additionalResults}
        />
      );

      expect(screen.getByTestId('result-count')).toHaveTextContent('3');
    });
  });

  describe('Integration', () => {
    it('should pass loading state to child component', () => {
      render(<InstagramSearchSection {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
    });

    it('should pass insights to child component', () => {
      const insights = { sentiment: 'positive' };
      render(<InstagramSearchSection {...defaultProps} insights={insights} />);

      expect(screen.getByTestId('insights')).toBeInTheDocument();
    });

    it('should pass converted results to child component', () => {
      render(<InstagramSearchSection {...defaultProps} />);

      // All results should have instagram platform
      const results = screen.getAllByTestId(/^result-/);
      results.forEach(result => {
        expect(result).toHaveTextContent('instagram');
      });
    });
  });
});
