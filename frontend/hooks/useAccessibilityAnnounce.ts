import { useCallback, useRef, useEffect } from 'react';
import {
  announceToScreenReader,
  debounce,
} from '@/lib/accessibility/accessibility-utils';

/**
 * Hook for announcing messages to screen readers
 * Provides debounced announcements to prevent overwhelming users
 */
export const useAccessibilityAnnounce = (debounceMs: number = 500) => {
  const announcementQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  // Process announcement queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current || announcementQueue.current.length === 0) return;

    isProcessing.current = true;
    const message = announcementQueue.current.shift();

    if (message) {
      announceToScreenReader(message);
      // Wait a bit before processing next announcement
      await new Promise(resolve => setTimeout(resolve, 750));
    }

    isProcessing.current = false;

    // Process next item if queue has more
    if (announcementQueue.current.length > 0) {
      processQueue();
    }
  }, []);

  // Debounced announce function
  const debouncedAnnounce = useRef(
    debounce((message: string, priority?: 'polite' | 'assertive') => {
      if (priority === 'assertive') {
        // Assertive messages jump to front of queue
        announcementQueue.current.unshift(message);
      } else {
        announcementQueue.current.push(message);
      }
      processQueue();
    }, debounceMs)
  );

  // Immediate announce (no debounce)
  const announceImmediately = useCallback(
    (message: string, priority?: 'polite' | 'assertive') => {
      announceToScreenReader(message, priority);
    },
    []
  );

  // Clear announcement queue
  const clearQueue = useCallback(() => {
    announcementQueue.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearQueue();
    };
  }, [clearQueue]);

  return {
    announce: debouncedAnnounce.current,
    announceImmediately,
    clearQueue,
  };
};

export default useAccessibilityAnnounce;
