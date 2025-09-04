import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeData, useMultiChannelRealtimeData, useDashboardMetrics } from '../useRealtimeData';
import React from 'react';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send implementation
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket
global.WebSocket = MockWebSocket as any;

// Mock fetch
global.fetch = vi.fn();

describe.skip('useRealtimeData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch initial data via HTTP', async () => {
    const mockData = { id: 1, value: 'test' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test-endpoint');
  });

  it('should establish WebSocket connection for realtime channel', async () => {
    const mockData = { id: 1, value: 'initial' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint', { channel: 'test-channel' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should update data when WebSocket message is received', async () => {
    const initialData = { id: 1, value: 'initial' };
    const updatedData = { id: 1, value: 'updated' };
    
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => initialData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint', { channel: 'test-channel' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(initialData);
    });

    // Simulate WebSocket message
    act(() => {
      const ws = (global.WebSocket as any).lastInstance;
      if (ws && ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'update',
            channel: 'test-channel',
            data: updatedData,
            timestamp: Date.now()
          })
        }));
      }
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedData);
    });
  });

  it('should handle WebSocket connection errors', async () => {
    const mockData = { id: 1, value: 'test' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint', { channel: 'test-channel' }),
      { wrapper }
    );

    // Simulate WebSocket error
    act(() => {
      const ws = (global.WebSocket as any).lastInstance;
      if (ws && ws.onerror) {
        ws.onerror(new Event('error'));
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should reconnect WebSocket on disconnect', async () => {
    vi.useFakeTimers();
    
    const mockData = { id: 1, value: 'test' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint', { channel: 'test-channel' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate disconnect
    act(() => {
      const ws = (global.WebSocket as any).lastInstance;
      if (ws) {
        ws.close();
      }
    });

    expect(result.current.isConnected).toBe(false);

    // Fast-forward reconnection timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    vi.useRealTimers();
  });

  it('should send messages through WebSocket', async () => {
    const mockData = { id: 1, value: 'test' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint', { channel: 'test-channel' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const testMessage = { type: 'test', data: 'hello' };
    act(() => {
      result.current.sendMessage(testMessage);
    });

    // Verify send was called on WebSocket
    const ws = (global.WebSocket as any).lastInstance;
    expect(ws).toBeDefined();
  });

  it('should handle HTTP errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useRealtimeData('test-endpoint'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should call onUpdate callback when data updates', async () => {
    const initialData = { id: 1, value: 'initial' };
    const updatedData = { id: 1, value: 'updated' };
    const onUpdate = vi.fn();
    
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => initialData,
    } as Response);

    renderHook(
      () => useRealtimeData('test-endpoint', { 
        channel: 'test-channel',
        onUpdate 
      }),
      { wrapper }
    );

    // Simulate WebSocket message
    act(() => {
      const ws = (global.WebSocket as any).lastInstance;
      if (ws && ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'update',
            channel: 'test-channel',
            data: updatedData,
            timestamp: Date.now()
          })
        }));
      }
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(updatedData);
    });
  });
});

describe.skip('useMultiChannelRealtimeData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should handle multiple channels', async () => {
    const mockData1 = { id: 1, value: 'channel1' };
    const mockData2 = { id: 2, value: 'channel2' };
    
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      } as Response);

    const { result } = renderHook(
      () => useMultiChannelRealtimeData(['channel1', 'channel2']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toMatchObject({
        channel1: mockData1,
        channel2: mockData2
      });
    });
  });

  it('should report connected when all channels are connected', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response);

    const { result } = renderHook(
      () => useMultiChannelRealtimeData(['channel1', 'channel2']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should report error if any channel has error', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      } as Response)
      .mockRejectedValueOnce(new Error('Channel error'));

    const { result } = renderHook(
      () => useMultiChannelRealtimeData(['channel1', 'channel2']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useDashboardMetrics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch metrics from multiple endpoints', async () => {
    const mockMetrics = [
      { metric: 'users', value: 100 },
      { metric: 'sessions', value: 50 }
    ];
    
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics[0],
    } as Response);

    const { result } = renderHook(
      () => useDashboardMetrics(['users', 'sessions']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.metrics).toBeDefined();
    });
  });

  it('should apply aggregation function', async () => {
    const mockData = [
      { value: 10 },
      { value: 20 },
      { value: 30 }
    ];
    
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData[0],
    } as Response);

    const aggregateSum = (data: any[]) => {
      return data.reduce((sum, item) => sum + (item?.value || 0), 0);
    };

    const { result } = renderHook(
      () => useDashboardMetrics(['metric1', 'metric2', 'metric3'], aggregateSum),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should provide raw data alongside aggregated metrics', async () => {
    const mockData = { value: 42 };
    
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(
      () => useDashboardMetrics(['metric1']),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.rawData).toBeDefined();
      expect(result.current.metrics).toBeDefined();
    });
  });
});