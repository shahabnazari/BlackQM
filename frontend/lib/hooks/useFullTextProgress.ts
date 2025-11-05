import { useEffect, useState, useCallback } from 'react';

/**
 * Phase 10 Day 5.15: Real-Time Full-Text Progress Hook
 *
 * Subscribes to Server-Sent Events (SSE) for real-time PDF processing updates.
 *
 * Usage:
 * ```tsx
 * const { status, progress, error } = useFullTextProgress(paperId);
 * ```
 */

export interface FullTextProgressState {
  status: 'not_fetched' | 'queued' | 'processing' | 'success' | 'failed';
  progress: number; // 0-100
  wordCount?: number;
  error?: string;
  message?: string;
}

export function useFullTextProgress(paperId: string | null): FullTextProgressState {
  const [state, setState] = useState<FullTextProgressState>({
    status: 'not_fetched',
    progress: 0,
  });

  useEffect(() => {
    if (!paperId) {
      return;
    }

    // Set up Server-Sent Events connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const eventSource = new EventSource(
      `${apiUrl}/pdf/events/${paperId}`,
      {
        withCredentials: true,
      }
    );

    // Handle incoming events
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'queued':
            setState({
              status: 'queued',
              progress: 0,
              message: data.message || 'Full-text fetch queued',
            });
            break;

          case 'processing':
            setState({
              status: 'processing',
              progress: data.progress || 10,
              message: data.message || 'Downloading PDF...',
            });
            break;

          case 'progress':
            setState((prev) => ({
              ...prev,
              status: 'processing',
              progress: data.progress,
              message: data.message,
            }));
            break;

          case 'completed':
            setState({
              status: 'success',
              progress: 100,
              wordCount: data.wordCount,
              message: data.message || 'Full-text ready',
            });
            // Close connection after success
            eventSource.close();
            break;

          case 'failed':
            setState({
              status: 'failed',
              progress: 0,
              error: data.error,
              message: data.message || 'Full-text unavailable',
            });
            // Close connection after failure
            eventSource.close();
            break;

          case 'retry':
            setState((prev) => ({
              ...prev,
              status: 'queued',
              progress: 0,
              message: data.message || `Retrying (attempt ${data.attempt})...`,
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [paperId]);

  return state;
}

/**
 * Hook for fetching bulk full-text status
 */
export function useFullTextBulkStatus(paperIds: string[]) {
  const [status, setStatus] = useState<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  }>({
    ready: [],
    fetching: [],
    failed: [],
    not_fetched: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (paperIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(
        `${apiUrl}/pdf/bulk-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ paperIds }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching bulk status:', error);
    } finally {
      setLoading(false);
    }
  }, [paperIds]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, refresh: fetchStatus };
}

/**
 * Hook for triggering full-text fetch
 */
export function useTriggerFullTextFetch() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (paperId: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(
        `${apiUrl}/pdf/fetch/${paperId}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, jobId: data.jobId };
      } else {
        return { success: false, error: 'Failed to trigger fetch' };
      }
    } catch (error) {
      console.error('Error triggering full-text fetch:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}
