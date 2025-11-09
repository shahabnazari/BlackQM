/**
 * Social Media Zustand Store
 * Centralized state management for multi-platform social media research
 * Phase 10.1 Day 1 - Enterprise-Grade Refactoring
 *
 * @module social-media.store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'reddit'
  | 'linkedin'
  | 'facebook';

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  author: string;
  authorId: string;
  content: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
  url: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  relevanceScore?: number;
}

export interface CrossPlatformInsights {
  totalPosts: number;
  platformBreakdown: Record<SocialPlatform, number>;
  topThemes: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendingTopics: string[];
  influencers: {
    name: string;
    platform: SocialPlatform;
    followers: number;
  }[];
}

export interface PlatformConfig {
  enabled: boolean;
  searchQuery: string;
  maxResults: number;
}

// ============================================================================
// Store Interface
// ============================================================================

interface SocialMediaState {
  // Platform configuration
  platforms: SocialPlatform[];
  platformConfigs: Map<SocialPlatform, PlatformConfig>;

  // Search state
  searchQuery: string;
  results: Map<SocialPlatform, SocialPost[]>;
  loading: Map<SocialPlatform, boolean>;
  errors: Map<SocialPlatform, Error | null>;

  // Insights state
  insights: CrossPlatformInsights | null;
  analyzingInsights: boolean;
  insightsError: Error | null;

  // Selection state
  selectedPosts: Set<string>;

  // Actions - Platform configuration
  togglePlatform: (platform: SocialPlatform) => void;
  setPlatformConfig: (platform: SocialPlatform, config: Partial<PlatformConfig>) => void;
  enableAllPlatforms: () => void;
  disableAllPlatforms: () => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  setResults: (platform: SocialPlatform, posts: SocialPost[]) => void;
  addResults: (platform: SocialPlatform, posts: SocialPost[]) => void;
  clearResults: (platform?: SocialPlatform) => void;
  setLoading: (platform: SocialPlatform, loading: boolean) => void;
  setError: (platform: SocialPlatform, error: Error | null) => void;

  // Actions - Insights
  setInsights: (insights: CrossPlatformInsights | null) => void;
  setAnalyzingInsights: (analyzing: boolean) => void;
  setInsightsError: (error: Error | null) => void;

  // Actions - Selection
  togglePostSelection: (postId: string) => void;
  selectAllPosts: () => void;
  clearSelection: () => void;
  isSelected: (postId: string) => boolean;
  getSelectedPosts: () => SocialPost[];

  // Actions - Utility
  getEnabledPlatforms: () => SocialPlatform[];
  getAllPosts: () => SocialPost[];
  getPostsByPlatform: (platform: SocialPlatform) => SocialPost[];
  reset: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultPlatforms: SocialPlatform[] = [
  'instagram',
  'tiktok',
  'twitter',
  'reddit',
  'linkedin',
  'facebook',
];

const defaultPlatformConfig: PlatformConfig = {
  enabled: true,
  searchQuery: '',
  maxResults: 50,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useSocialMediaStore = create<SocialMediaState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        platforms: defaultPlatforms,
        platformConfigs: new Map(
          defaultPlatforms.map((p) => [p, { ...defaultPlatformConfig }])
        ),
        searchQuery: '',
        results: new Map(),
        loading: new Map(),
        errors: new Map(),
        insights: null,
        analyzingInsights: false,
        insightsError: null,
        selectedPosts: new Set(),

        // Platform configuration actions
        togglePlatform: (platform) =>
          set((state) => {
            const newConfigs = new Map(state.platformConfigs);
            const config = newConfigs.get(platform);
            if (config) {
              newConfigs.set(platform, { ...config, enabled: !config.enabled });
            }
            return { platformConfigs: newConfigs };
          }),

        setPlatformConfig: (platform, config) =>
          set((state) => {
            const newConfigs = new Map(state.platformConfigs);
            const existingConfig = newConfigs.get(platform) || defaultPlatformConfig;
            newConfigs.set(platform, { ...existingConfig, ...config });
            return { platformConfigs: newConfigs };
          }),

        enableAllPlatforms: () =>
          set((state) => {
            const newConfigs = new Map(state.platformConfigs);
            state.platforms.forEach((platform) => {
              const config = newConfigs.get(platform);
              if (config) {
                newConfigs.set(platform, { ...config, enabled: true });
              }
            });
            return { platformConfigs: newConfigs };
          }),

        disableAllPlatforms: () =>
          set((state) => {
            const newConfigs = new Map(state.platformConfigs);
            state.platforms.forEach((platform) => {
              const config = newConfigs.get(platform);
              if (config) {
                newConfigs.set(platform, { ...config, enabled: false });
              }
            });
            return { platformConfigs: newConfigs };
          }),

        // Search actions
        setSearchQuery: (searchQuery) => set({ searchQuery }),

        setResults: (platform, posts) =>
          set((state) => {
            const newResults = new Map(state.results);
            newResults.set(platform, posts);
            return { results: newResults };
          }),

        addResults: (platform, posts) =>
          set((state) => {
            const newResults = new Map(state.results);
            const existing = newResults.get(platform) || [];
            newResults.set(platform, [...existing, ...posts]);
            return { results: newResults };
          }),

        clearResults: (platform) =>
          set((state) => {
            if (platform) {
              const newResults = new Map(state.results);
              newResults.delete(platform);
              return { results: newResults };
            }
            return { results: new Map(), selectedPosts: new Set() };
          }),

        setLoading: (platform, loading) =>
          set((state) => {
            const newLoading = new Map(state.loading);
            newLoading.set(platform, loading);
            return { loading: newLoading };
          }),

        setError: (platform, error) =>
          set((state) => {
            const newErrors = new Map(state.errors);
            newErrors.set(platform, error);
            return { errors: newErrors };
          }),

        // Insights actions
        setInsights: (insights) => set({ insights }),

        setAnalyzingInsights: (analyzingInsights) => set({ analyzingInsights }),

        setInsightsError: (insightsError) => set({ insightsError }),

        // Selection actions
        togglePostSelection: (postId) =>
          set((state) => {
            const newSet = new Set(state.selectedPosts);
            if (newSet.has(postId)) {
              newSet.delete(postId);
            } else {
              newSet.add(postId);
            }
            return { selectedPosts: newSet };
          }),

        selectAllPosts: () =>
          set(() => {
            const allPosts = get().getAllPosts();
            return { selectedPosts: new Set(allPosts.map((p) => p.id)) };
          }),

        clearSelection: () => set({ selectedPosts: new Set() }),

        isSelected: (postId) => get().selectedPosts.has(postId),

        getSelectedPosts: () => {
          const allPosts = get().getAllPosts();
          const { selectedPosts } = get();
          return allPosts.filter((p) => selectedPosts.has(p.id));
        },

        // Utility actions
        getEnabledPlatforms: () => {
          const { platforms, platformConfigs } = get();
          return platforms.filter((p) => platformConfigs.get(p)?.enabled);
        },

        getAllPosts: () => {
          const { results } = get();
          const allPosts: SocialPost[] = [];
          results.forEach((posts) => allPosts.push(...posts));
          return allPosts;
        },

        getPostsByPlatform: (platform) => {
          return get().results.get(platform) || [];
        },

        // Reset action
        reset: () =>
          set({
            searchQuery: '',
            results: new Map(),
            loading: new Map(),
            errors: new Map(),
            insights: null,
            analyzingInsights: false,
            insightsError: null,
            selectedPosts: new Set(),
          }),
      }),
      {
        name: 'social-media-store',
        // Persist platform configurations
        partialize: (state) => ({
          platformConfigs: Array.from(state.platformConfigs.entries()),
        }),
        // Convert Map back from array on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.platformConfigs = new Map(
              state.platformConfigs as unknown as [SocialPlatform, PlatformConfig][]
            );
          }
        },
      }
    ),
    { name: 'SocialMedia' }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectPlatformState = (state: SocialMediaState) => ({
  platforms: state.platforms,
  platformConfigs: state.platformConfigs,
  enabledPlatforms: state.getEnabledPlatforms(),
});

export const selectSearchState = (state: SocialMediaState) => ({
  searchQuery: state.searchQuery,
  results: state.results,
  loading: state.loading,
  errors: state.errors,
  allPosts: state.getAllPosts(),
});

export const selectInsightsState = (state: SocialMediaState) => ({
  insights: state.insights,
  analyzingInsights: state.analyzingInsights,
  insightsError: state.insightsError,
});

export const selectSelectionState = (state: SocialMediaState) => ({
  selectedPosts: state.selectedPosts,
  selectedCount: state.selectedPosts.size,
  getSelectedPosts: state.getSelectedPosts,
});
