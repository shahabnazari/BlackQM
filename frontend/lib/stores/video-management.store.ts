/**
 * Video Management Zustand Store
 * Centralized state management for YouTube videos and transcription
 * Phase 10.1 Day 1 - Enterprise-Grade Refactoring
 *
 * @module video-management.store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  relevanceScore?: number;
}

export interface Transcription {
  videoId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  generatedAt: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionOptions {
  language: string;
  timestamps: boolean;
  speakerLabels: boolean;
  autoDetectLanguage: boolean;
}

// ============================================================================
// Store Interface
// ============================================================================

interface VideoManagementState {
  // Video search state
  searchQuery: string;
  videos: YouTubeVideo[];
  selectedVideos: Set<string>;
  loading: boolean;
  error: Error | null;

  // Transcription state
  transcriptionQueue: Set<string>;
  transcribedVideos: Map<string, Transcription>;
  transcriptionProgress: Map<string, number>; // videoId -> progress %
  transcriptionOptions: TranscriptionOptions;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  setVideos: (videos: YouTubeVideo[]) => void;
  addVideos: (videos: YouTubeVideo[]) => void;
  clearVideos: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  // Actions - Selection
  toggleVideoSelection: (videoId: string) => void;
  selectAllVideos: () => void;
  clearSelection: () => void;
  isSelected: (videoId: string) => boolean;
  getSelectedVideos: () => YouTubeVideo[];

  // Actions - Transcription
  addToQueue: (videoId: string) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
  setTranscription: (videoId: string, transcription: Transcription) => void;
  getTranscription: (videoId: string) => Transcription | undefined;
  setTranscriptionProgress: (videoId: string, progress: number) => void;
  setTranscriptionOptions: (options: Partial<TranscriptionOptions>) => void;

  // Actions - Utility
  reset: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultTranscriptionOptions: TranscriptionOptions = {
  language: 'en',
  timestamps: true,
  speakerLabels: false,
  autoDetectLanguage: true,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useVideoManagementStore = create<VideoManagementState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        searchQuery: '',
        videos: [],
        selectedVideos: new Set(),
        loading: false,
        error: null,
        transcriptionQueue: new Set(),
        transcribedVideos: new Map(),
        transcriptionProgress: new Map(),
        transcriptionOptions: defaultTranscriptionOptions,

        // Search actions
        setSearchQuery: (searchQuery) => set({ searchQuery }),

        setVideos: (videos) => set({ videos }),

        addVideos: (videos) =>
          set((state) => ({
            videos: [...state.videos, ...videos],
          })),

        clearVideos: () => set({ videos: [], selectedVideos: new Set() }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        // Selection actions
        toggleVideoSelection: (videoId) =>
          set((state) => {
            const newSet = new Set(state.selectedVideos);
            if (newSet.has(videoId)) {
              newSet.delete(videoId);
            } else {
              newSet.add(videoId);
            }
            return { selectedVideos: newSet };
          }),

        selectAllVideos: () =>
          set((state) => ({
            selectedVideos: new Set(state.videos.map((v) => v.id)),
          })),

        clearSelection: () => set({ selectedVideos: new Set() }),

        isSelected: (videoId) => get().selectedVideos.has(videoId),

        getSelectedVideos: () => {
          const { videos, selectedVideos } = get();
          return videos.filter((v) => selectedVideos.has(v.id));
        },

        // Transcription actions
        addToQueue: (videoId) =>
          set((state) => {
            const newQueue = new Set(state.transcriptionQueue);
            newQueue.add(videoId);
            return { transcriptionQueue: newQueue };
          }),

        removeFromQueue: (videoId) =>
          set((state) => {
            const newQueue = new Set(state.transcriptionQueue);
            newQueue.delete(videoId);
            return { transcriptionQueue: newQueue };
          }),

        clearQueue: () => set({ transcriptionQueue: new Set() }),

        setTranscription: (videoId, transcription) =>
          set((state) => {
            const newMap = new Map(state.transcribedVideos);
            newMap.set(videoId, transcription);

            // Remove from queue when transcription complete
            const newQueue = new Set(state.transcriptionQueue);
            newQueue.delete(videoId);

            return {
              transcribedVideos: newMap,
              transcriptionQueue: newQueue,
            };
          }),

        getTranscription: (videoId) => get().transcribedVideos.get(videoId),

        setTranscriptionProgress: (videoId, progress) =>
          set((state) => {
            const newProgress = new Map(state.transcriptionProgress);
            newProgress.set(videoId, progress);
            return { transcriptionProgress: newProgress };
          }),

        setTranscriptionOptions: (options) =>
          set((state) => ({
            transcriptionOptions: { ...state.transcriptionOptions, ...options },
          })),

        // Reset action
        reset: () =>
          set({
            searchQuery: '',
            videos: [],
            selectedVideos: new Set(),
            loading: false,
            error: null,
            transcriptionQueue: new Set(),
            transcriptionProgress: new Map(),
          }),
      }),
      {
        name: 'video-management-store',
        // Persist transcriptions and options
        partialize: (state) => ({
          transcribedVideos: Array.from(state.transcribedVideos.entries()),
          transcriptionOptions: state.transcriptionOptions,
        }),
        // Convert Map back from array on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.transcribedVideos = new Map(
              state.transcribedVideos as unknown as [string, Transcription][]
            );
          }
        },
      }
    ),
    { name: 'VideoManagement' }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectVideoSearchState = (state: VideoManagementState) => ({
  searchQuery: state.searchQuery,
  videos: state.videos,
  loading: state.loading,
  error: state.error,
});

export const selectTranscriptionState = (state: VideoManagementState) => ({
  queue: state.transcriptionQueue,
  transcribedVideos: state.transcribedVideos,
  progress: state.transcriptionProgress,
  options: state.transcriptionOptions,
});

export const selectVideoSelectionState = (state: VideoManagementState) => ({
  selectedVideos: state.selectedVideos,
  selectedCount: state.selectedVideos.size,
  getSelectedVideos: state.getSelectedVideos,
});
