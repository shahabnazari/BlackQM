/**
 * Video Management Store Unit Tests
 * Phase 10.1 Day 1 - Enterprise-Grade Testing
 *
 * @module video-management.store.test
 */

import { renderHook, act } from '@testing-library/react';
import {
  useVideoManagementStore,
  YouTubeVideo,
  Transcription,
} from '../video-management.store';

// Mock video data
const mockVideo1: YouTubeVideo = {
  id: 'video1',
  title: 'Test Video 1',
  description: 'Test description 1',
  channelTitle: 'Test Channel',
  channelId: 'channel1',
  publishedAt: '2024-01-01',
  thumbnailUrl: 'https://example.com/thumb1.jpg',
  duration: '10:00',
  viewCount: 1000,
  likeCount: 50,
  relevanceScore: 0.95,
};

const mockVideo2: YouTubeVideo = {
  id: 'video2',
  title: 'Test Video 2',
  description: 'Test description 2',
  channelTitle: 'Test Channel 2',
  channelId: 'channel2',
  publishedAt: '2024-01-02',
  thumbnailUrl: 'https://example.com/thumb2.jpg',
  duration: '15:00',
  viewCount: 2000,
  likeCount: 100,
  relevanceScore: 0.87,
};

const mockTranscription: Transcription = {
  videoId: 'video1',
  text: 'This is a test transcription',
  segments: [
    { start: 0, end: 5, text: 'This is a' },
    { start: 5, end: 10, text: 'test transcription' },
  ],
  language: 'en',
  generatedAt: '2024-01-01T12:00:00Z',
};

describe('VideoManagementStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useVideoManagementStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      expect(result.current.searchQuery).toBe('');
      expect(result.current.videos).toEqual([]);
      expect(result.current.selectedVideos.size).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.transcriptionQueue.size).toBe(0);
      expect(result.current.transcribedVideos.size).toBe(0);
      expect(result.current.transcriptionProgress.size).toBe(0);
      expect(result.current.transcriptionOptions).toEqual({
        language: 'en',
        timestamps: true,
        speakerLabels: false,
        autoDetectLanguage: true,
      });
    });
  });

  describe('Search Actions', () => {
    it('should set search query', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setSearchQuery('climate change');
      });

      expect(result.current.searchQuery).toBe('climate change');
    });

    it('should set videos', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setVideos([mockVideo1, mockVideo2]);
      });

      expect(result.current.videos).toHaveLength(2);
      expect(result.current.videos[0].id).toBe('video1');
      expect(result.current.videos[1].id).toBe('video2');
    });

    it('should add videos to existing list', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setVideos([mockVideo1]);
      });

      expect(result.current.videos).toHaveLength(1);

      act(() => {
        result.current.addVideos([mockVideo2]);
      });

      expect(result.current.videos).toHaveLength(2);
    });

    it('should clear videos and selection', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setVideos([mockVideo1, mockVideo2]);
        result.current.toggleVideoSelection('video1');
      });

      expect(result.current.videos).toHaveLength(2);
      expect(result.current.selectedVideos.size).toBe(1);

      act(() => {
        result.current.clearVideos();
      });

      expect(result.current.videos).toHaveLength(0);
      expect(result.current.selectedVideos.size).toBe(0);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useVideoManagementStore());
      const error = new Error('Search failed');

      act(() => {
        result.current.setError(error);
      });

      expect(result.current.error).toBe(error);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Selection Actions', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useVideoManagementStore());
      act(() => {
        result.current.setVideos([mockVideo1, mockVideo2]);
      });
    });

    it('should toggle video selection', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      // Select video
      act(() => {
        result.current.toggleVideoSelection('video1');
      });

      expect(result.current.selectedVideos.has('video1')).toBe(true);
      expect(result.current.isSelected('video1')).toBe(true);

      // Deselect video
      act(() => {
        result.current.toggleVideoSelection('video1');
      });

      expect(result.current.selectedVideos.has('video1')).toBe(false);
      expect(result.current.isSelected('video1')).toBe(false);
    });

    it('should select all videos', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.selectAllVideos();
      });

      expect(result.current.selectedVideos.size).toBe(2);
      expect(result.current.isSelected('video1')).toBe(true);
      expect(result.current.isSelected('video2')).toBe(true);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.selectAllVideos();
      });

      expect(result.current.selectedVideos.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedVideos.size).toBe(0);
    });

    it('should get selected videos', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.toggleVideoSelection('video1');
      });

      const selectedVideos = result.current.getSelectedVideos();

      expect(selectedVideos).toHaveLength(1);
      expect(selectedVideos[0].id).toBe('video1');
    });
  });

  describe('Transcription Actions', () => {
    it('should add video to transcription queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
      });

      expect(result.current.transcriptionQueue.has('video1')).toBe(true);
    });

    it('should remove video from transcription queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
        result.current.addToQueue('video2');
      });

      expect(result.current.transcriptionQueue.size).toBe(2);

      act(() => {
        result.current.removeFromQueue('video1');
      });

      expect(result.current.transcriptionQueue.size).toBe(1);
      expect(result.current.transcriptionQueue.has('video2')).toBe(true);
    });

    it('should clear transcription queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
        result.current.addToQueue('video2');
      });

      expect(result.current.transcriptionQueue.size).toBe(2);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.transcriptionQueue.size).toBe(0);
    });

    it('should set transcription and remove from queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
      });

      expect(result.current.transcriptionQueue.has('video1')).toBe(true);

      act(() => {
        result.current.setTranscription('video1', mockTranscription);
      });

      expect(result.current.transcribedVideos.has('video1')).toBe(true);
      expect(result.current.transcriptionQueue.has('video1')).toBe(false);

      const transcription = result.current.getTranscription('video1');
      expect(transcription).toEqual(mockTranscription);
    });

    it('should get transcription', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setTranscription('video1', mockTranscription);
      });

      const transcription = result.current.getTranscription('video1');

      expect(transcription).toBeDefined();
      expect(transcription?.videoId).toBe('video1');
      expect(transcription?.text).toBe('This is a test transcription');
    });

    it('should return undefined for non-existent transcription', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      const transcription = result.current.getTranscription('nonexistent');

      expect(transcription).toBeUndefined();
    });

    it('should set transcription progress', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setTranscriptionProgress('video1', 50);
      });

      expect(result.current.transcriptionProgress.get('video1')).toBe(50);

      act(() => {
        result.current.setTranscriptionProgress('video1', 100);
      });

      expect(result.current.transcriptionProgress.get('video1')).toBe(100);
    });

    it('should set transcription options', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setTranscriptionOptions({
          language: 'es',
          speakerLabels: true,
        });
      });

      expect(result.current.transcriptionOptions.language).toBe('es');
      expect(result.current.transcriptionOptions.speakerLabels).toBe(true);
      expect(result.current.transcriptionOptions.timestamps).toBe(true); // unchanged
    });
  });

  describe('Reset Action', () => {
    it('should reset all state except transcriptions', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      // Set some state
      act(() => {
        result.current.setSearchQuery('test query');
        result.current.setVideos([mockVideo1, mockVideo2]);
        result.current.toggleVideoSelection('video1');
        result.current.setLoading(true);
        result.current.setError(new Error('test error'));
        result.current.addToQueue('video1');
        result.current.setTranscriptionProgress('video1', 50);
      });

      // Verify state is set
      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.videos).toHaveLength(2);
      expect(result.current.selectedVideos.size).toBe(1);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.transcriptionQueue.size).toBe(1);
      expect(result.current.transcriptionProgress.size).toBe(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset
      expect(result.current.searchQuery).toBe('');
      expect(result.current.videos).toHaveLength(0);
      expect(result.current.selectedVideos.size).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.transcriptionQueue.size).toBe(0);
      expect(result.current.transcriptionProgress.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting video that does not exist', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setVideos([mockVideo1]);
        result.current.toggleVideoSelection('nonexistent');
      });

      const selectedVideos = result.current.getSelectedVideos();
      expect(selectedVideos).toHaveLength(0);
    });

    it('should handle adding duplicate videos to queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
        result.current.addToQueue('video1');
      });

      expect(result.current.transcriptionQueue.size).toBe(1);
    });

    it('should handle removing non-existent video from queue', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.addToQueue('video1');
        result.current.removeFromQueue('nonexistent');
      });

      expect(result.current.transcriptionQueue.size).toBe(1);
    });

    it('should handle setting progress for multiple videos', () => {
      const { result } = renderHook(() => useVideoManagementStore());

      act(() => {
        result.current.setTranscriptionProgress('video1', 25);
        result.current.setTranscriptionProgress('video2', 75);
        result.current.setTranscriptionProgress('video1', 50);
      });

      expect(result.current.transcriptionProgress.get('video1')).toBe(50);
      expect(result.current.transcriptionProgress.get('video2')).toBe(75);
    });
  });
});
