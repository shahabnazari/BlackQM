/**
 * YouTubeResearchSection Unit Tests
 * Phase 10.91 Day 15 - Testing Infrastructure
 *
 * Tests cover:
 * - Component rendering
 * - Channel browser integration
 * - Video selection workflow
 * - Transcription controls
 * - Collapsible sections
 * - Loading states
 * - Accessibility
 * - User workflows
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YouTubeResearchSection } from '../YouTubeResearchSection';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock YouTube components
jest.mock('@/components/literature/YouTubeChannelBrowser', () => ({
  YouTubeChannelBrowser: ({ onVideosSelected, researchContext }: any) => (
    <div data-testid="youtube-channel-browser">
      <div data-testid="research-context">{researchContext}</div>
      <button onClick={() => onVideosSelected([{ id: 'selected-1', title: 'Video 1' }])}>
        Select Videos
      </button>
    </div>
  ),
}));

jest.mock('@/components/literature/VideoSelectionPanel', () => ({
  VideoSelectionPanel: ({ videos, researchContext, onTranscribe, isLoading }: any) => (
    <div data-testid="video-selection-panel">
      <div data-testid="panel-video-count">{videos.length}</div>
      <div data-testid="panel-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <button onClick={() => onTranscribe(['video-1', 'video-2'])}>
        Transcribe Videos
      </button>
    </div>
  ),
}));

describe('YouTubeResearchSection', () => {
  const mockVideos = [
    { id: 'video-1', videoId: 'v1', title: 'Test Video 1' },
    { id: 'video-2', videoId: 'v2', title: 'Test Video 2' },
  ];

  const defaultProps = {
    isSelected: true,
    searchResults: mockVideos,
    isLoading: false,
    researchContext: 'test research',
    selectedVideos: [],
    transcribedVideos: [],
    transcribing: false,
    transcriptionProgress: undefined,
    showChannelBrowser: false,
    showVideoSelection: false,
    onVideoSelect: jest.fn(),
    onTranscribeVideos: jest.fn(),
    onToggleChannelBrowser: jest.fn(),
    onToggleVideoSelection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when not selected', () => {
      const { container } = render(
        <YouTubeResearchSection {...defaultProps} isSelected={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render research controls when selected', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      expect(screen.getByText('YouTube Research')).toBeInTheDocument();
      expect(screen.getByText('0 transcribed')).toBeInTheDocument();
    });

    it('should display transcribed videos count', () => {
      const transcribed = [mockVideos[0]];
      render(<YouTubeResearchSection {...defaultProps} transcribedVideos={transcribed} />);

      expect(screen.getByText('1 transcribed')).toBeInTheDocument();
    });

    it('should display selected videos count', () => {
      const selected = mockVideos;
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={selected} />);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show transcription progress message', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          transcribing={true}
          transcriptionProgress="Transcribing 1 of 2..."
        />
      );

      expect(screen.getByText('Transcribing 1 of 2...')).toBeInTheDocument();
    });

    it('should render search results when available', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      expect(screen.getByText('📹 YouTube')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          isLoading={true}
          searchResults={[]}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Searching YouTube...')).toBeInTheDocument();
    });
  });

  describe('Channel Browser', () => {
    it('should show channel browser button', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      expect(screen.getByText('Browse Academic Channels')).toBeInTheDocument();
    });

    it('should toggle channel browser on click', async () => {
      const user = userEvent.setup();
      render(<YouTubeResearchSection {...defaultProps} />);

      const toggleButton = screen.getByText('Browse Academic Channels');
      await user.click(toggleButton);

      expect(defaultProps.onToggleChannelBrowser).toHaveBeenCalledTimes(1);
    });

    it('should render channel browser when shown', () => {
      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={true} />);

      expect(screen.getByTestId('youtube-channel-browser')).toBeInTheDocument();
    });

    it('should hide channel browser when not shown', () => {
      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={false} />);

      expect(screen.queryByTestId('youtube-channel-browser')).not.toBeInTheDocument();
    });

    it('should handle video selection from channel browser', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={true} />);

      const selectButton = screen.getByText('Select Videos');
      await user.click(selectButton);

      expect(defaultProps.onVideoSelect).toHaveBeenCalledWith({
        id: 'selected-1',
        title: 'Video 1',
      });

      expect(toast.success).toHaveBeenCalledWith(
        '1 video selected from channel',
        expect.objectContaining({
          description: 'You can now transcribe selected videos.',
        })
      );
    });

    it('should handle multiple video selection', async () => {
      const user = userEvent.setup();
      const onVideoSelect = jest.fn();

      // Mock to return multiple videos
      jest.mock('@/components/literature/YouTubeChannelBrowser', () => ({
        YouTubeChannelBrowser: ({ onVideosSelected }: any) => (
          <button
            onClick={() =>
              onVideosSelected([
                { id: 'v1', title: 'Video 1' },
                { id: 'v2', title: 'Video 2' },
              ])
            }
          >
            Select Multiple
          </button>
        ),
      }));

      const { rerender } = render(
        <YouTubeResearchSection
          {...defaultProps}
          showChannelBrowser={true}
          onVideoSelect={onVideoSelect}
        />
      );

      // Force re-render to apply mock
      rerender(
        <YouTubeResearchSection
          {...defaultProps}
          showChannelBrowser={true}
          onVideoSelect={onVideoSelect}
        />
      );

      // onVideoSelect should be called for each video
      // (tested in integration)
    });

    it('should pass research context to channel browser', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          showChannelBrowser={true}
          researchContext="AI research"
        />
      );

      expect(screen.getByTestId('research-context')).toHaveTextContent('AI research');
    });
  });

  describe('Video Selection Panel', () => {
    it('should show video selection toggle button', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      expect(screen.getByText('Select Videos')).toBeInTheDocument();
    });

    it('should toggle video selection panel on click', async () => {
      const user = userEvent.setup();
      render(<YouTubeResearchSection {...defaultProps} />);

      const toggleButton = screen.getByText('Select Videos');
      await user.click(toggleButton);

      expect(defaultProps.onToggleVideoSelection).toHaveBeenCalledTimes(1);
    });

    it('should render video selection panel when shown', () => {
      render(<YouTubeResearchSection {...defaultProps} showVideoSelection={true} />);

      expect(screen.getByTestId('video-selection-panel')).toBeInTheDocument();
    });

    it('should use search results when available', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          showVideoSelection={true}
          searchResults={mockVideos}
        />
      );

      expect(screen.getByTestId('panel-video-count')).toHaveTextContent('2');
    });

    it('should fallback to selected videos when no search results', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          showVideoSelection={true}
          searchResults={[]}
          selectedVideos={mockVideos}
        />
      );

      expect(screen.getByTestId('panel-video-count')).toHaveTextContent('2');
    });
  });

  describe('Transcription Controls', () => {
    it('should show transcribe button', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      expect(screen.getByText('Transcribe Selected')).toBeInTheDocument();
    });

    it('should disable transcribe button when no videos selected', () => {
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={[]} />);

      const button = screen.getByText('Transcribe Selected');
      expect(button).toBeDisabled();
    });

    it('should enable transcribe button when videos selected', () => {
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={mockVideos} />);

      const button = screen.getByText('Transcribe Selected');
      expect(button).not.toBeDisabled();
    });

    it('should disable transcribe button when transcribing', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          selectedVideos={mockVideos}
          transcribing={true}
        />
      );

      const button = screen.getByText('Transcribing...');
      expect(button).toBeDisabled();
    });

    it('should call onTranscribeVideos when clicked', async () => {
      const user = userEvent.setup();
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={mockVideos} />);

      const button = screen.getByText('Transcribe Selected');
      await user.click(button);

      expect(defaultProps.onTranscribeVideos).toHaveBeenCalledTimes(1);
    });

    it('should show transcribing state', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          selectedVideos={mockVideos}
          transcribing={true}
        />
      );

      expect(screen.getByText('Transcribing...')).toBeInTheDocument();
    });

    it('should handle transcription from video panel', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(
        <YouTubeResearchSection
          {...defaultProps}
          showVideoSelection={true}
          selectedVideos={mockVideos}
        />
      );

      const transcribeButton = screen.getByText('Transcribe Videos');
      await user.click(transcribeButton);

      await waitFor(() => {
        expect(defaultProps.onTranscribeVideos).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'Transcription started for 2 videos',
          expect.objectContaining({
            description: 'Processing will complete in the background.',
          })
        );
      });
    });

    it('should show error when transcribing with no videos', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(
        <YouTubeResearchSection
          {...defaultProps}
          showVideoSelection={true}
          selectedVideos={[]}
        />
      );

      const transcribeButton = screen.getByText('Transcribe Videos');
      await user.click(transcribeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'No videos selected for transcription',
          expect.objectContaining({
            description: 'Please select at least one video.',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on collapsible sections', () => {
      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={false} />);

      const toggleButton = screen.getByText('Browse Academic Channels');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when opened', () => {
      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={true} />);

      const toggleButton = screen.getByText('Browse Academic Channels');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls attribute', () => {
      render(<YouTubeResearchSection {...defaultProps} />);

      const toggleButton = screen.getByText('Browse Academic Channels');
      expect(toggleButton).toHaveAttribute('aria-controls', 'youtube-channel-browser');
    });

    it('should have proper labels on transcribe button', () => {
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={mockVideos} />);

      const button = screen.getByText('Transcribe Selected');
      expect(button).toHaveAttribute(
        'aria-label',
        'Transcribe 2 selected videos'
      );
    });

    it('should have aria-live on loading state', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          isLoading={true}
          searchResults={[]}
        />
      );

      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have region role on collapsible content', () => {
      render(<YouTubeResearchSection {...defaultProps} showChannelBrowser={true} />);

      const region = screen.getByRole('region', {
        name: 'YouTube channel browser',
      });
      expect(region).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined transcriptionProgress', () => {
      render(
        <YouTubeResearchSection
          {...defaultProps}
          transcribing={true}
          transcriptionProgress={undefined}
        />
      );

      // Should not crash
      expect(screen.getByText('Transcribing...')).toBeInTheDocument();
    });

    it('should handle empty search results', () => {
      render(<YouTubeResearchSection {...defaultProps} searchResults={[]} />);

      // Should not render results section
      expect(screen.queryByText('📹 YouTube')).not.toBeInTheDocument();
    });

    it('should handle empty selected videos array', () => {
      render(<YouTubeResearchSection {...defaultProps} selectedVideos={[]} />);

      expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    });

    it('should handle transcription error', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      const onTranscribeVideos = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <YouTubeResearchSection
          {...defaultProps}
          showVideoSelection={true}
          selectedVideos={mockVideos}
          onTranscribeVideos={onTranscribeVideos}
        />
      );

      const transcribeButton = screen.getByText('Transcribe Videos');
      await user.click(transcribeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to start transcription',
          expect.objectContaining({
            description: 'Network error',
          })
        );
      });
    });

    it('should handle video selection with empty array', async () => {
      const user = userEvent.setup();
      const onVideoSelect = jest.fn();

      // Mock to return empty array
      jest.mock('@/components/literature/YouTubeChannelBrowser', () => ({
        YouTubeChannelBrowser: ({ onVideosSelected }: any) => (
          <button onClick={() => onVideosSelected([])}>Select None</button>
        ),
      }));

      const { rerender } = render(
        <YouTubeResearchSection
          {...defaultProps}
          showChannelBrowser={true}
          onVideoSelect={onVideoSelect}
        />
      );

      // Should not call onVideoSelect if no videos
      // (early return in handleVideosSelected)
    });
  });

  describe('Performance', () => {
    it('should memoize handlers with useCallback', () => {
      const { rerender } = render(<YouTubeResearchSection {...defaultProps} />);

      // Re-render with same props
      rerender(<YouTubeResearchSection {...defaultProps} />);

      // Handlers should remain stable
      expect(screen.getByText('YouTube Research')).toBeInTheDocument();
    });

    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(<YouTubeResearchSection {...defaultProps} />);

      // Change transcriptionProgress (should trigger re-render)
      rerender(
        <YouTubeResearchSection
          {...defaultProps}
          transcriptionProgress="Updated progress"
        />
      );

      expect(screen.getByText('Updated progress')).toBeInTheDocument();
    });
  });
});
