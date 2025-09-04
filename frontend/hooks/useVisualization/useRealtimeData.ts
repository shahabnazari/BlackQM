import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

interface RealtimeDataOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  websocketUrl?: string;
  channel?: string;
  refetchInterval?: number;
  onUpdate?: (data: T) => void;
  queryKey?: string[];
}

interface WebSocketMessage<T> {
  type: string;
  channel: string;
  data: T;
  timestamp: number;
}

export function useRealtimeData<T = any>(
  endpoint: string,
  options: RealtimeDataOptions<T> = { queryKey: [endpoint] }
) {
  const {
    websocketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    channel,
    refetchInterval = 5000,
    onUpdate,
    queryKey = [endpoint],
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // Query for initial data
  const queryResult = useQuery<T>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`);
      }
      return response.json();
    },
    refetchInterval,
    ...queryOptions,
  });

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to channel
        if (channel) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data);
          
          if (message.channel === channel || message.channel === `data:${endpoint}`) {
            const newData = message.data;
            setData(newData);
            
            // Update React Query cache
            queryClient.setQueryData([endpoint], newData);
            
            // Call update callback if provided
            if (onUpdate) {
              onUpdate(newData);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Implement exponential backoff for reconnection
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to establish WebSocket connection');
    }
  }, [websocketUrl, channel, endpoint, queryClient, onUpdate]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (channel || endpoint.includes('realtime')) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, channel, endpoint]);

  // Merge query data with realtime updates
  const mergedData = data || queryResult.data;

  return {
    data: mergedData,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError || !!error,
    error: queryResult.error || error,
    isConnected,
    refetch: queryResult.refetch,
    sendMessage,
    // Additional metadata
    metadata: {
      lastUpdated: new Date(),
      source: data ? 'websocket' : 'http',
      connectionStatus: isConnected ? 'connected' : 'disconnected',
    },
  };
}

/**
 * Hook for subscribing to multiple data channels
 */
export function useMultiChannelRealtimeData<T = any>(
  channels: string[],
  options: Omit<RealtimeDataOptions<T>, 'channel'> = { queryKey: ['multi-channel'] }
) {
  const [channelData, setChannelData] = useState<Record<string, T>>({});
  const results = channels.map(channel => 
    useRealtimeData<T>(channel, { ...options, channel })
  );

  useEffect(() => {
    const newData: Record<string, T> = {};
    channels.forEach((channel, index) => {
      if (results[index].data) {
        newData[channel] = results[index].data;
      }
    });
    setChannelData(newData);
  }, [channels, results]);

  return {
    data: channelData,
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    isConnected: results.every(r => r.isConnected),
    channels: results,
  };
}

/**
 * Hook for dashboard metrics with automatic aggregation
 */
export function useDashboardMetrics(
  endpoints: string[],
  aggregateFunction?: (data: any[]) => any
) {
  const { data, isLoading, isError } = useMultiChannelRealtimeData(endpoints);
  
  const aggregatedData = aggregateFunction 
    ? aggregateFunction(Object.values(data))
    : data;

  return {
    metrics: aggregatedData,
    isLoading,
    isError,
    rawData: data,
  };
}