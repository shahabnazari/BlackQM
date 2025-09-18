import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { apiClient } from '@/lib/api/config';

interface RealtimeDataOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  channel?: string;
  refetchInterval?: number;
  onUpdate?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  websocketEnabled?: boolean;
  mergeStrategy?: 'replace' | 'merge' | 'append';
  transformData?: (data: any) => T;
}

interface RealtimeMetadata {
  lastUpdated: Date;
  source: 'websocket' | 'http' | 'cache';
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  updateCount: number;
  subscriptionActive: boolean;
}

/**
 * Enhanced real-time data hook with WebSocket integration
 * 
 * Features:
 * - Seamless WebSocket and HTTP data fetching
 * - Smart caching with React Query
 * - Configurable merge strategies for real-time updates
 * - Live participant tracking and analysis updates
 * - Automatic fallback to polling when WebSocket unavailable
 */
export function useRealtimeData<T = any>(
  endpoint: string,
  options: RealtimeDataOptions<T> = {}
) {
  const {
    channel,
    refetchInterval = 30000, // Default to 30 seconds for HTTP fallback
    onUpdate,
    onError,
    enabled = true,
    websocketEnabled = true,
    mergeStrategy = 'replace',
    transformData,
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const [updateCount, setUpdateCount] = useState(0);
  const [lastWebSocketUpdate, setLastWebSocketUpdate] = useState<Date | null>(null);

  // Channel name generation
  const channelName = channel || `data:${endpoint}`;

  // WebSocket integration
  const webSocket = useWebSocket({
    onMessage: useCallback((event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle data updates for this specific channel
        if (message.channel === channelName && message.type === 'data') {
          let newData = message.data;
          
          // Apply data transformation if provided
          if (transformData) {
            newData = transformData(newData);
          }

          // Update based on merge strategy
          queryClient.setQueryData([endpoint], (oldData: T | undefined) => {
            switch (mergeStrategy) {
              case 'merge':
                return oldData && typeof oldData === 'object' 
                  ? { ...oldData as any, ...newData }
                  : newData;
              
              case 'append':
                return Array.isArray(oldData) && Array.isArray(newData)
                  ? [...oldData, ...newData]
                  : Array.isArray(oldData) && !Array.isArray(newData)
                  ? [...oldData, newData]
                  : newData;
              
              default: // 'replace'
                return newData;
            }
          });

          setUpdateCount(prev => prev + 1);
          setLastWebSocketUpdate(new Date());

          // Trigger update callback
          onUpdate?.(newData);
        }
      } catch (error: any) {
        console.error('Error processing WebSocket message:', error);
        onError?.(error as Error);
      }
    }, [channelName, endpoint, queryClient, mergeStrategy, transformData, onUpdate, onError])
  });

  // Subscribe to channel when connected
  useEffect(() => {
    if (
      enabled && 
      websocketEnabled && 
      webSocket.connectionStatus === 'connected' && 
      channelName
    ) {
      webSocket.subscribe(channelName);
      console.log(`Subscribed to channel: ${channelName}`);
    }

    return () => {
      if (channelName && webSocket.connectionStatus === 'connected') {
        webSocket.unsubscribe(channelName);
        console.log(`Unsubscribed from channel: ${channelName}`);
      }
    };
  }, [enabled, websocketEnabled, webSocket.connectionStatus, channelName, webSocket]);

  // HTTP query for initial data and fallback
  const queryResult = useQuery<T>({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/${endpoint}`);
        let data = response.data;
        
        // Apply data transformation if provided
        if (transformData) {
          data = transformData(data);
        }
        
        return data;
      } catch (error: any) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
      }
    },
    enabled,
    refetchInterval: websocketEnabled && webSocket.connectionStatus === 'connected' 
      ? false // Disable polling when WebSocket is active
      : refetchInterval,
    staleTime: websocketEnabled ? 5 * 60 * 1000 : 30 * 1000, // 5 min if WS, 30 sec if not
    ...queryOptions,
  });

  // Send data through WebSocket
  const sendRealtimeMessage = useCallback((data: any) => {
    if (webSocket.connectionStatus === 'connected') {
      webSocket.sendJsonMessage({
        type: 'data',
        channel: channelName,
        data,
      });
    } else {
      console.warn('Cannot send real-time message: WebSocket not connected');
    }
  }, [webSocket, channelName]);

  // Force refresh data
  const refresh = useCallback(() => {
    queryResult.refetch();
    if (websocketEnabled && webSocket.connectionStatus === 'connected') {
      webSocket.sendJsonMessage({
        type: 'refresh',
        channel: channelName,
      });
    }
  }, [queryResult, websocketEnabled, webSocket, channelName]);

  // Metadata
  const metadata: RealtimeMetadata = useMemo(() => {
    const isWebSocketActive = websocketEnabled && webSocket.connectionStatus === 'connected';
    
    return {
      lastUpdated: lastWebSocketUpdate || new Date(queryResult.dataUpdatedAt || Date.now()),
      source: lastWebSocketUpdate ? 'websocket' : 'http',
      connectionStatus: websocketEnabled ? webSocket.connectionStatus : 'disconnected',
      updateCount,
      subscriptionActive: isWebSocketActive && !!channelName,
    };
  }, [
    websocketEnabled,
    webSocket.connectionStatus,
    lastWebSocketUpdate,
    queryResult.dataUpdatedAt,
    updateCount,
    channelName,
  ]);

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    isConnected: webSocket.connectionStatus === 'connected',
    isFetching: queryResult.isFetching,
    refetch: refresh,
    sendMessage: sendRealtimeMessage,
    metadata,
    // WebSocket specific methods
    reconnectWebSocket: webSocket.reconnect,
    disconnectWebSocket: webSocket.disconnect,
  };
}

/**
 * Hook for subscribing to multiple data channels
 */
export function useMultiChannelRealtimeData<T = any>(
  channels: string[],
  options: Omit<RealtimeDataOptions<T>, 'channel'> = {}
) {
  const [channelData, setChannelData] = useState<Record<string, T>>({});
  const results = channels.map((channel: any) => 
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

/**
 * Hook for live participant tracking in Q-methodology studies
 */
export function useParticipantRealtimeTracking(studyId: string) {
  const { data, isConnected, sendMessage, metadata } = useRealtimeData<{
    participants: Array<{
      id: string;
      status: 'welcome' | 'familiarization' | 'sorting' | 'commentary' | 'survey' | 'complete';
      progress: number;
      lastActivity: string;
      currentStep?: string;
    }>;
    totalParticipants: number;
    completedCount: number;
    activeCount: number;
  }>(`studies/${studyId}/participants`, {
    channel: `study-${studyId}-participants`,
    websocketEnabled: true,
    refetchInterval: 15000, // Fallback every 15 seconds
  });

  const updateParticipantStatus = useCallback((participantId: string, status: string, progress?: number) => {
    sendMessage({
      type: 'participant_status_update',
      participantId,
      studyId,
      status,
      progress,
      timestamp: Date.now(),
    });
  }, [sendMessage, studyId]);

  const trackActivity = useCallback((participantId: string, activity: string, metadata?: any) => {
    sendMessage({
      type: 'participant_activity',
      participantId,
      studyId,
      activity,
      metadata,
      timestamp: Date.now(),
    });
  }, [sendMessage, studyId]);

  return {
    participants: data?.participants || [],
    totalParticipants: data?.totalParticipants || 0,
    completedCount: data?.completedCount || 0,
    activeCount: data?.activeCount || 0,
    isConnected,
    metadata,
    updateParticipantStatus,
    trackActivity,
  };
}

/**
 * Hook for live Q-methodology analysis updates
 */
export function useAnalysisRealtimeUpdates(studyId: string, analysisId?: string) {
  const endpoint = analysisId 
    ? `studies/${studyId}/analyses/${analysisId}`
    : `studies/${studyId}/analyses/current`;

  const { data, isConnected, sendMessage, metadata } = useRealtimeData<{
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
    currentStep: string;
    results?: {
      eigenvalues?: any[];
      factorLoadings?: any[];
      factorArrays?: any[];
      correlationMatrix?: any[];
      distinguishingStatements?: any[];
    };
    error?: string;
    completedAt?: string;
  }>(endpoint, {
    channel: `analysis-${studyId}-${analysisId || 'current'}`,
    websocketEnabled: true,
    refetchInterval: 10000,
  });

  const triggerAnalysis = useCallback((parameters?: any) => {
    sendMessage({
      type: 'trigger_analysis',
      studyId,
      analysisId,
      parameters,
      timestamp: Date.now(),
    });
  }, [sendMessage, studyId, analysisId]);

  const cancelAnalysis = useCallback(() => {
    sendMessage({
      type: 'cancel_analysis',
      studyId,
      analysisId,
      timestamp: Date.now(),
    });
  }, [sendMessage, studyId, analysisId]);

  return {
    status: data?.status || 'pending',
    progress: data?.progress || 0,
    currentStep: data?.currentStep || 'Initializing',
    results: data?.results,
    error: data?.error,
    completedAt: data?.completedAt,
    isConnected,
    metadata,
    triggerAnalysis,
    cancelAnalysis,
  };
}