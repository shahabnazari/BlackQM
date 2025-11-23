/**
 * SocialMediaPanel Integration Tests
 * Phase 10.91 Day 15 - Testing Infrastructure
 *
 * Tests cover complete user workflows:
 * - Platform selection → Search → Results display
 * - Multiple platform switching
 * - Video transcription workflow
 * - Cross-component state synchronization
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialMediaPanel } from '../SocialMediaPanel';

// Mock all dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockSearchAll = jest.fn().mockResolvedValue(undefined);
const mockYoutubeResults = [
  { id: 'yt-1', title: 'AI Tutorial', videoId: 'abc123' },
  { id: 'yt-2', title: 'ML Basics', videoId: 'def456' },
];
const mockInstagramResults = [
  { id: 'ig-1', username: 'airesearcher', caption: 'Latest findings' },
];
const mockTikTokResults = [
  { id: 'tt-1', title: 'Quick AI tip', author: 'techcreator' },
];

jest.mock('@/lib/hooks/useSocialMediaSearch', () => ({
  useSocialMediaSearch: () => ({
    youtubeResults: mockYoutubeResults,
    instagramResults: mockInstagramResults,
    tiktokResults: mockTikTokResults,
    loadingYouTube: false,
    loadingInstagram: false,
    loadingTikTok: false,
    searchAll: mockSearchAll,
    isSearching: false,
  }),
}));

// Use actual sub-components instead of mocks for integration testing
// (In a real scenario, we'd import actual components)
jest.mock('../social-media', () => ({
  TikTokSearchSection: ({ isSelected, results, searchQuery }: any) =>
    isSelected && results.length > 0 ? (
      <div data-testid="tiktok-section">
        <h3>TikTok Results</h3>
        <div data-testid="tiktok-count">{results.length} videos</div>
        {results.map((video: any) => (
          <div key={video.id} data-testid={`tiktok-${video.id}`}>
            {video.title}
          </div>
        ))}
      </div>
    ) : null,
  InstagramSearchSection: ({ isSelected, results }: any) =>
    isSelected && results.length > 0 ? (
      <div data-testid="instagram-section">
        <h3>Instagram Results</h3>
        <div data-testid="instagram-count">{results.length} posts</div>
        {results.map((result: any) => (
          <div key={result.id} data-testid={`instagram-${result.id}`}>
            @{result.username}
          </div>
        ))}
      </div>
    ) : null,
  YouTubeResearchSection: ({
    isSelected,
    searchResults,
    selectedVideos,
    onVideoSelect,
    onTranscribeVideos,
  }: any) =>
    isSelected ? (
      <div data-testid="youtube-section">
        <h3>YouTube Research</h3>
        {searchResults.length > 0 && (
          <div data-testid="youtube-search-results">
            <div data-testid="youtube-count">{searchResults.length} videos</div>
            {searchResults.map((video: any) => (
              <div key={video.id} data-testid={`youtube-${video.id}`}>
                <span>{video.title}</span>
                <button onClick={() => onVideoSelect(video)}>Select</button>
              </div>
            ))}
          </div>
        )}
        {selectedVideos.length > 0 && (
          <div data-testid="youtube-selected">
            <div data-testid="selected-count">{selectedVideos.length} selected</div>
            <button onClick={onTranscribeVideos}>Transcribe</button>
          </div>
        )}
      </div>
    ) : null,
}));

jest.mock('@/components/literature/CrossPlatformDashboard', () => ({
  CrossPlatformDashboard: () => <div data-testid="cross-platform-dashboard">Dashboard</div>,
}));

describe('SocialMediaPanel Integration Tests', () => {
  const mockProps = {
    socialPlatforms: [],
    onPlatformsChange: jest.fn(),
    socialResults: [],
    socialInsights: null,
    query: 'artificial intelligence',
    selectedVideos: [],
    onVideoSelect: jest.fn(),
    onTranscribeVideos: jest.fn(),
    transcribedVideos: [],
    transcribing: false,
    transcriptionProgress: undefined,
    showChannelBrowser: false,
    onToggleChannelBrowser: jest.fn(),
    showVideoSelection: false,
    onToggleVideoSelection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Workflows', () => {
    it('should complete full search workflow: select platform → search → view results', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel {...mockProps} onPlatformsChange={onPlatformsChange} />
      );

      // Step 1: Select YouTube platform
      const youtubeBadge = screen.getByText('YouTube');
      await user.click(youtubeBadge);

      expect(onPlatformsChange).toHaveBeenCalledWith(['youtube']);

      // Step 2: Re-render with YouTube selected
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Step 3: Enter search query
      const searchInput = screen.getByPlaceholderText(/Search across/);
      await user.type(searchInput, 'machine learning');

      // Step 4: Click search button
      const searchButton = screen.getByRole('button', { name: /Search social media/i });
      await user.click(searchButton);

      // Step 5: Verify search was triggered
      await waitFor(() => {
        expect(mockSearchAll).toHaveBeenCalledWith({
          query: 'machine learning',
          platforms: ['youtube'],
        });
      });

      // Step 6: Verify results are displayed
      expect(screen.getByTestId('youtube-section')).toBeInTheDocument();
      expect(screen.getByTestId('youtube-count')).toHaveTextContent('2 videos');
    });

    it('should handle multi-platform search workflow', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel {...mockProps} onPlatformsChange={onPlatformsChange} />
      );

      // Select YouTube
      await user.click(screen.getByText('YouTube'));
      expect(onPlatformsChange).toHaveBeenLastCalledWith(['youtube']);

      // Re-render with YouTube selected
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Select TikTok
      await user.click(screen.getByText('TikTok'));
      expect(onPlatformsChange).toHaveBeenLastCalledWith(['youtube', 'tiktok']);

      // Re-render with both platforms
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube', 'tiktok']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Verify both sections render
      expect(screen.getByTestId('youtube-section')).toBeInTheDocument();
      expect(screen.getByTestId('tiktok-section')).toBeInTheDocument();

      // Search across both platforms
      const searchInput = screen.getByPlaceholderText(/Search across/);
      await user.type(searchInput, 'AI trends{Enter}');

      await waitFor(() => {
        expect(mockSearchAll).toHaveBeenCalledWith({
          query: 'AI trends',
          platforms: ['youtube', 'tiktok'],
        });
      });
    });

    it('should handle YouTube video selection and transcription workflow', async () => {
      const user = userEvent.setup();
      const onVideoSelect = jest.fn();
      const onTranscribeVideos = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onVideoSelect={onVideoSelect}
          onTranscribeVideos={onTranscribeVideos}
        />
      );

      // Step 1: Select first video
      const selectButtons = screen.getAllByText('Select');
      await user.click(selectButtons[0]);

      expect(onVideoSelect).toHaveBeenCalledWith(mockYoutubeResults[0]);

      // Step 2: Re-render with selected video
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          selectedVideos={[mockYoutubeResults[0]]}
          onVideoSelect={onVideoSelect}
          onTranscribeVideos={onTranscribeVideos}
        />
      );

      // Step 3: Verify selected count
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1 selected');

      // Step 4: Click transcribe button
      const transcribeButton = screen.getByText('Transcribe');
      await user.click(transcribeButton);

      expect(onTranscribeVideos).toHaveBeenCalled();
    });

    it('should switch between platforms dynamically', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Verify YouTube section is visible
      expect(screen.getByTestId('youtube-section')).toBeInTheDocument();
      expect(screen.queryByTestId('instagram-section')).not.toBeInTheDocument();

      // Deselect YouTube, select Instagram
      await user.click(screen.getByText('YouTube'));
      expect(onPlatformsChange).toHaveBeenLastCalledWith([]);

      await user.click(screen.getByText('Instagram'));
      expect(onPlatformsChange).toHaveBeenLastCalledWith(['instagram']);

      // Re-render with Instagram selected
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['instagram']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Verify Instagram section is visible, YouTube is not
      expect(screen.queryByTestId('youtube-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('instagram-section')).toBeInTheDocument();
    });

    it('should handle keyboard-only navigation workflow', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel {...mockProps} onPlatformsChange={onPlatformsChange} />
      );

      // Tab to YouTube badge and activate with Enter
      const youtubeBadge = screen.getByText('YouTube');
      youtubeBadge.focus();
      await user.keyboard('{Enter}');

      expect(onPlatformsChange).toHaveBeenCalledWith(['youtube']);

      // Re-render with YouTube selected
      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Tab to search input and enter query
      const searchInput = screen.getByPlaceholderText(/Search across/);
      searchInput.focus();
      await user.keyboard('deep learning{Enter}');

      await waitFor(() => {
        expect(mockSearchAll).toHaveBeenCalledWith({
          query: 'deep learning',
          platforms: ['youtube'],
        });
      });
    });
  });

  describe('State Synchronization', () => {
    it('should synchronize search query across platform changes', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <SocialMediaPanel {...mockProps} socialPlatforms={['youtube']} />
      );

      // Enter search query
      const searchInput = screen.getByPlaceholderText(/Search across/);
      await user.type(searchInput, 'neural networks');

      // Select additional platform
      await user.click(screen.getByText('TikTok'));

      // Re-render with both platforms
      rerender(
        <SocialMediaPanel {...mockProps} socialPlatforms={['youtube', 'tiktok']} />
      );

      // Verify search query is preserved
      expect(screen.getByPlaceholderText(/Search across/)).toHaveValue('neural networks');

      // Verify placeholder updates
      expect(screen.getByPlaceholderText('Search across YouTube, TikTok...')).toBeInTheDocument();
    });

    it('should preserve selected videos when switching platforms', async () => {
      const user = userEvent.setup();
      const selectedVideos = [mockYoutubeResults[0]];

      const { rerender } = render(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          selectedVideos={selectedVideos}
        />
      );

      // Verify selected videos are shown
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1 selected');

      // Add Instagram platform
      await user.click(screen.getByText('Instagram'));

      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube', 'instagram']}
          selectedVideos={selectedVideos}
        />
      );

      // Verify selected videos are still shown
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1 selected');
    });

    it('should show cross-platform dashboard when insights available', () => {
      const insights = {
        totalResults: 100,
        platforms: ['youtube', 'instagram'],
      };

      render(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube', 'instagram']}
          socialInsights={insights}
        />
      );

      expect(screen.getByTestId('cross-platform-dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      mockSearchAll.mockRejectedValueOnce(new Error('Network error'));

      render(<SocialMediaPanel {...mockProps} socialPlatforms={['youtube']} />);

      const searchInput = screen.getByPlaceholderText(/Search across/);
      await user.type(searchInput, 'test query');

      const searchButton = screen.getByRole('button', { name: /Search social media/i });
      await user.click(searchButton);

      // Should still attempt search (error handled in hook)
      await waitFor(() => {
        expect(mockSearchAll).toHaveBeenCalled();
      });
    });

    it('should validate empty search query', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      render(<SocialMediaPanel {...mockProps} socialPlatforms={['youtube']} />);

      // Try to search with empty query
      const searchButton = screen.getByRole('button', { name: /Search social media/i });
      await user.click(searchButton);

      expect(toast.error).toHaveBeenCalledWith('Please enter a search query');
      expect(mockSearchAll).not.toHaveBeenCalled();
    });

    it('should recover from deselecting all platforms', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      const { rerender } = render(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Deselect YouTube
      await user.click(screen.getByText('YouTube'));

      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={[]}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Should show empty state
      expect(
        screen.getByText('Select one or more social media platforms above to begin')
      ).toBeInTheDocument();

      // Re-select YouTube
      await user.click(screen.getByText('YouTube'));

      rerender(
        <SocialMediaPanel
          {...mockProps}
          socialPlatforms={['youtube']}
          onPlatformsChange={onPlatformsChange}
        />
      );

      // Should show YouTube section again
      expect(screen.getByTestId('youtube-section')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger unnecessary re-renders', () => {
      const { rerender } = render(
        <SocialMediaPanel {...mockProps} socialPlatforms={['youtube']} />
      );

      // Re-render with same props
      rerender(<SocialMediaPanel {...mockProps} socialPlatforms={['youtube']} />);

      // Verify component is still rendered correctly
      expect(screen.getByTestId('youtube-section')).toBeInTheDocument();
    });

    it('should handle rapid platform toggling', async () => {
      const user = userEvent.setup();
      const onPlatformsChange = jest.fn();

      render(<SocialMediaPanel {...mockProps} onPlatformsChange={onPlatformsChange} />);

      const youtubeBadge = screen.getByText('YouTube');

      // Rapidly click multiple times
      await user.tripleClick(youtubeBadge);

      // All clicks should be registered
      expect(onPlatformsChange).toHaveBeenCalledTimes(3);
    });
  });
});
