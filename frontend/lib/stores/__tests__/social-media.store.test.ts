/**
 * Social Media Store Unit Tests
 * Phase 10.1 Day 1 - Enterprise-Grade Testing
 *
 * @module social-media.store.test
 */

import { renderHook, act } from '@testing-library/react';
import {
  useSocialMediaStore,
  SocialPost,
  SocialPlatform,
  CrossPlatformInsights,
} from '../social-media.store';

// Mock social post data
const mockInstagramPost: SocialPost = {
  id: 'insta1',
  platform: 'instagram',
  author: 'testuser',
  authorId: 'user1',
  content: 'Test Instagram post',
  timestamp: '2024-01-01T12:00:00Z',
  likes: 100,
  shares: 10,
  comments: 5,
  url: 'https://instagram.com/p/test1',
  media: [{ type: 'image', url: 'https://example.com/image1.jpg' }],
  relevanceScore: 0.92,
};

const mockTikTokPost: SocialPost = {
  id: 'tiktok1',
  platform: 'tiktok',
  author: 'tiktokuser',
  authorId: 'user2',
  content: 'Test TikTok video',
  timestamp: '2024-01-02T12:00:00Z',
  likes: 500,
  shares: 50,
  comments: 25,
  url: 'https://tiktok.com/@test/video/123',
  media: [{ type: 'video', url: 'https://example.com/video1.mp4' }],
  relevanceScore: 0.88,
};

const mockInsights: CrossPlatformInsights = {
  totalPosts: 2,
  platformBreakdown: {
    instagram: 1,
    tiktok: 1,
    twitter: 0,
    reddit: 0,
    linkedin: 0,
    facebook: 0,
  },
  topThemes: ['climate change', 'sustainability'],
  sentiment: {
    positive: 60,
    neutral: 30,
    negative: 10,
  },
  trendingTopics: ['climate action', 'green energy'],
  influencers: [
    {
      name: 'testuser',
      platform: 'instagram',
      followers: 10000,
    },
  ],
};

describe('SocialMediaStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useSocialMediaStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      expect(result.current.platforms).toHaveLength(6);
      expect(result.current.platformConfigs.size).toBe(6);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.results.size).toBe(0);
      expect(result.current.loading.size).toBe(0);
      expect(result.current.errors.size).toBe(0);
      expect(result.current.insights).toBeNull();
      expect(result.current.analyzingInsights).toBe(false);
      expect(result.current.insightsError).toBeNull();
      expect(result.current.selectedPosts.size).toBe(0);
    });

    it('should have all platforms enabled by default', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const enabledPlatforms = result.current.getEnabledPlatforms();

      expect(enabledPlatforms).toHaveLength(6);
    });
  });

  describe('Platform Configuration Actions', () => {
    it('should toggle platform enabled state', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const platform: SocialPlatform = 'instagram';

      // Disable platform
      act(() => {
        result.current.togglePlatform(platform);
      });

      const config = result.current.platformConfigs.get(platform);
      expect(config?.enabled).toBe(false);

      // Enable platform
      act(() => {
        result.current.togglePlatform(platform);
      });

      const configAfter = result.current.platformConfigs.get(platform);
      expect(configAfter?.enabled).toBe(true);
    });

    it('should set platform configuration', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const platform: SocialPlatform = 'tiktok';

      act(() => {
        result.current.setPlatformConfig(platform, {
          searchQuery: 'test query',
          maxResults: 100,
        });
      });

      const config = result.current.platformConfigs.get(platform);

      expect(config?.searchQuery).toBe('test query');
      expect(config?.maxResults).toBe(100);
      expect(config?.enabled).toBe(true); // Should preserve enabled state
    });

    it('should enable all platforms', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      // Disable all platforms first
      act(() => {
        result.current.disableAllPlatforms();
      });

      expect(result.current.getEnabledPlatforms()).toHaveLength(0);

      // Enable all platforms
      act(() => {
        result.current.enableAllPlatforms();
      });

      expect(result.current.getEnabledPlatforms()).toHaveLength(6);
    });

    it('should disable all platforms', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      expect(result.current.getEnabledPlatforms()).toHaveLength(6);

      act(() => {
        result.current.disableAllPlatforms();
      });

      expect(result.current.getEnabledPlatforms()).toHaveLength(0);
    });
  });

  describe('Search Actions', () => {
    it('should set search query', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setSearchQuery('climate change');
      });

      expect(result.current.searchQuery).toBe('climate change');
    });

    it('should set results for platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
      });

      const instagramPosts = result.current.getPostsByPlatform('instagram');

      expect(instagramPosts).toHaveLength(1);
      expect(instagramPosts[0].id).toBe('insta1');
    });

    it('should add results for platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
      });

      expect(result.current.getPostsByPlatform('instagram')).toHaveLength(1);

      const newPost: SocialPost = { ...mockInstagramPost, id: 'insta2' };

      act(() => {
        result.current.addResults('instagram', [newPost]);
      });

      expect(result.current.getPostsByPlatform('instagram')).toHaveLength(2);
    });

    it('should clear results for specific platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setResults('tiktok', [mockTikTokPost]);
      });

      expect(result.current.results.size).toBe(2);

      act(() => {
        result.current.clearResults('instagram');
      });

      expect(result.current.results.size).toBe(1);
      expect(result.current.getPostsByPlatform('instagram')).toHaveLength(0);
      expect(result.current.getPostsByPlatform('tiktok')).toHaveLength(1);
    });

    it('should clear all results', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setResults('tiktok', [mockTikTokPost]);
        result.current.togglePostSelection('insta1');
      });

      expect(result.current.results.size).toBe(2);
      expect(result.current.selectedPosts.size).toBe(1);

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results.size).toBe(0);
      expect(result.current.selectedPosts.size).toBe(0);
    });

    it('should set loading state for platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setLoading('instagram', true);
      });

      expect(result.current.loading.get('instagram')).toBe(true);

      act(() => {
        result.current.setLoading('instagram', false);
      });

      expect(result.current.loading.get('instagram')).toBe(false);
    });

    it('should set error state for platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const error = new Error('Instagram API failed');

      act(() => {
        result.current.setError('instagram', error);
      });

      expect(result.current.errors.get('instagram')).toBe(error);

      act(() => {
        result.current.setError('instagram', null);
      });

      expect(result.current.errors.get('instagram')).toBeNull();
    });
  });

  describe('Insights Actions', () => {
    it('should set insights', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setInsights(mockInsights);
      });

      expect(result.current.insights).toEqual(mockInsights);
      expect(result.current.insights?.totalPosts).toBe(2);
    });

    it('should set analyzing insights state', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setAnalyzingInsights(true);
      });

      expect(result.current.analyzingInsights).toBe(true);

      act(() => {
        result.current.setAnalyzingInsights(false);
      });

      expect(result.current.analyzingInsights).toBe(false);
    });

    it('should set insights error', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const error = new Error('Failed to generate insights');

      act(() => {
        result.current.setInsightsError(error);
      });

      expect(result.current.insightsError).toBe(error);

      act(() => {
        result.current.setInsightsError(null);
      });

      expect(result.current.insightsError).toBeNull();
    });
  });

  describe('Selection Actions', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSocialMediaStore());
      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setResults('tiktok', [mockTikTokPost]);
      });
    });

    it('should toggle post selection', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      // Select post
      act(() => {
        result.current.togglePostSelection('insta1');
      });

      expect(result.current.selectedPosts.has('insta1')).toBe(true);
      expect(result.current.isSelected('insta1')).toBe(true);

      // Deselect post
      act(() => {
        result.current.togglePostSelection('insta1');
      });

      expect(result.current.selectedPosts.has('insta1')).toBe(false);
      expect(result.current.isSelected('insta1')).toBe(false);
    });

    it('should select all posts', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.selectAllPosts();
      });

      expect(result.current.selectedPosts.size).toBe(2);
      expect(result.current.isSelected('insta1')).toBe(true);
      expect(result.current.isSelected('tiktok1')).toBe(true);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.selectAllPosts();
      });

      expect(result.current.selectedPosts.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedPosts.size).toBe(0);
    });

    it('should get selected posts', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.togglePostSelection('insta1');
      });

      const selectedPosts = result.current.getSelectedPosts();

      expect(selectedPosts).toHaveLength(1);
      expect(selectedPosts[0].id).toBe('insta1');
      expect(selectedPosts[0].platform).toBe('instagram');
    });
  });

  describe('Utility Actions', () => {
    it('should get all posts across platforms', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setResults('tiktok', [mockTikTokPost]);
      });

      const allPosts = result.current.getAllPosts();

      expect(allPosts).toHaveLength(2);
    });

    it('should get posts by platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setResults('tiktok', [mockTikTokPost]);
      });

      const instagramPosts = result.current.getPostsByPlatform('instagram');
      const tiktokPosts = result.current.getPostsByPlatform('tiktok');
      const twitterPosts = result.current.getPostsByPlatform('twitter');

      expect(instagramPosts).toHaveLength(1);
      expect(tiktokPosts).toHaveLength(1);
      expect(twitterPosts).toHaveLength(0);
    });

    it('should get enabled platforms', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      // First, ensure all platforms are enabled
      act(() => {
        result.current.enableAllPlatforms();
      });

      const initialEnabled = result.current.getEnabledPlatforms();
      expect(initialEnabled).toHaveLength(6);

      // Toggle off instagram and tiktok
      act(() => {
        result.current.togglePlatform('instagram');
        result.current.togglePlatform('tiktok');
      });

      const enabledPlatforms = result.current.getEnabledPlatforms();

      expect(enabledPlatforms).toHaveLength(4);
      expect(enabledPlatforms).not.toContain('instagram');
      expect(enabledPlatforms).not.toContain('tiktok');
    });
  });

  describe('Reset Action', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      // Set some state
      act(() => {
        result.current.setSearchQuery('test query');
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.setLoading('instagram', true);
        result.current.setError('instagram', new Error('test'));
        result.current.setInsights(mockInsights);
        result.current.setAnalyzingInsights(true);
        result.current.togglePostSelection('insta1');
      });

      // Verify state is set
      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.results.size).toBe(1);
      expect(result.current.loading.size).toBe(1);
      expect(result.current.errors.size).toBe(1);
      expect(result.current.insights).toBeTruthy();
      expect(result.current.analyzingInsights).toBe(true);
      expect(result.current.selectedPosts.size).toBe(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset
      expect(result.current.searchQuery).toBe('');
      expect(result.current.results.size).toBe(0);
      expect(result.current.loading.size).toBe(0);
      expect(result.current.errors.size).toBe(0);
      expect(result.current.insights).toBeNull();
      expect(result.current.analyzingInsights).toBe(false);
      expect(result.current.selectedPosts.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle toggling non-existent platform', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const platform = 'nonexistent' as SocialPlatform;

      act(() => {
        result.current.togglePlatform(platform);
      });

      // Should not throw error
      expect(result.current.platformConfigs.has(platform)).toBe(false);
    });

    it('should handle selecting non-existent post', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setResults('instagram', [mockInstagramPost]);
        result.current.togglePostSelection('nonexistent');
      });

      const selectedPosts = result.current.getSelectedPosts();

      expect(selectedPosts).toHaveLength(0);
    });

    it('should handle getting posts from platform with no results', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      const posts = result.current.getPostsByPlatform('instagram');

      expect(posts).toHaveLength(0);
    });

    it('should handle multiple loading states', () => {
      const { result } = renderHook(() => useSocialMediaStore());

      act(() => {
        result.current.setLoading('instagram', true);
        result.current.setLoading('tiktok', true);
        result.current.setLoading('twitter', false);
      });

      expect(result.current.loading.get('instagram')).toBe(true);
      expect(result.current.loading.get('tiktok')).toBe(true);
      expect(result.current.loading.get('twitter')).toBe(false);
    });
  });
});
