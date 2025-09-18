import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WebSocketOptions {
  url?: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  shouldReconnect?: (closeEvent: CloseEvent) => boolean;
}

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: MessageEvent | null;
  lastJsonMessage: any;
  sendMessage: (message: string | WebSocketMessage) => void;
  sendJsonMessage: (message: any) => void;
  reconnect: () => void;
  disconnect: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

/**
 * Enhanced WebSocket hook with React Query integration for real-time updates
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - React Query cache integration
 * - Channel-based subscriptions
 * - Live participant tracking
 * - Connection status monitoring
 */
export function useWebSocket(options: WebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3334',
    protocols = [],
    reconnectInterval = 1000,
    maxReconnectAttempts = 5,
    onOpen,
    onMessage,
    onError,
    onClose,
    shouldReconnect = () => true,
  } = options;

  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [lastJsonMessage, setLastJsonMessage] = useState<any>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const socket = new WebSocket(url, protocols);
      socketRef.current = socket;

      socket.addEventListener('open', (event: any) => {
        console.log('WebSocket connected:', url);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Re-subscribe to channels after reconnection
        subscribedChannelsRef.current.forEach(channel => {
          socket.send(JSON.stringify({
            type: 'subscribe',
            channel,
            timestamp: Date.now(),
          }));
        });

        onOpen?.(event);
      });

      socket.addEventListener('message', (event: any) => {
        setLastMessage(event);
        
        try {
          const parsedMessage = JSON.parse(event.data);
          setLastJsonMessage(parsedMessage);
          
          // Handle system messages
          if (parsedMessage.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            return;
          }

          // Update React Query cache for data messages
          if (parsedMessage.type === 'data' && parsedMessage.channel) {
            const queryKey = [`realtime-${parsedMessage.channel}`];
            queryClient.setQueryData(queryKey, (oldData: any) => {
              // Merge or replace data based on message type
              if (parsedMessage.operation === 'merge' && oldData) {
                return { ...oldData, ...parsedMessage.data };
              }
              return parsedMessage.data;
            });

            // Invalidate related queries to trigger refetch
            queryClient.invalidateQueries({ 
              queryKey: [parsedMessage.channel.split('-')[0]] 
            });
          }

          // Handle participant tracking updates
          if (parsedMessage.type === 'participant_update') {
            queryClient.setQueryData(['participants'], (oldData: any) => {
              if (!oldData) return parsedMessage.data;
              
              const participants = Array.isArray(oldData) ? oldData : oldData.participants || [];
              const updatedParticipant = parsedMessage.data;
              
              const index = participants.findIndex((p: any) => p.id === updatedParticipant.id);
              if (index >= 0) {
                participants[index] = { ...participants[index], ...updatedParticipant };
              } else {
                participants.push(updatedParticipant);
              }
              
              return Array.isArray(oldData) ? participants : { ...oldData, participants };
            });
          }

          // Handle analysis updates
          if (parsedMessage.type === 'analysis_update') {
            const analysisType = parsedMessage.analysisType || 'general';
            queryClient.setQueryData([`analysis-${analysisType}`], parsedMessage.data);
            
            // Trigger related chart updates
            queryClient.invalidateQueries({ queryKey: ['visualization'] });
          }

        } catch (error: any) {
          console.warn('Failed to parse WebSocket message as JSON:', error);
        }

        onMessage?.(event);
      });

      socket.addEventListener('error', (event: any) => {
        console.error('WebSocket error:', event);
        setConnectionStatus('error');
        onError?.(event);
      });

      socket.addEventListener('close', (event: any) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        socketRef.current = null;

        // Attempt reconnection if conditions are met
        if (
          shouldReconnect(event) &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000 // Normal closure
        ) {
          const backoffDelay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds
          );
          
          reconnectAttemptsRef.current++;
          console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${backoffDelay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, backoffDelay);
        }

        onClose?.(event);
      });

    } catch (error: any) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, onOpen, onMessage, onError, onClose, shouldReconnect, queryClient]);

  // Send message as string
  const sendMessage = useCallback((message: string | WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' 
        ? message 
        : JSON.stringify({ ...message, timestamp: Date.now() });
      
      socketRef.current.send(messageStr);
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  // Send JSON message
  const sendJsonMessage = useCallback((message: any) => {
    sendMessage({ ...message, timestamp: Date.now() });
  }, [sendMessage]);

  // Subscribe to channel
  const subscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.add(channel);
    sendJsonMessage({
      type: 'subscribe',
      channel,
    });
  }, [sendJsonMessage]);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.delete(channel);
    sendJsonMessage({
      type: 'unsubscribe',
      channel,
    });
  }, [sendJsonMessage]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect');
    }
    
    subscribedChannelsRef.current.clear();
    setConnectionStatus('disconnected');
  }, []);

  // Setup connection on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmount');
      }
    };
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    connectionStatus,
    lastMessage,
    lastJsonMessage,
    sendMessage,
    sendJsonMessage,
    reconnect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for participant tracking with real-time updates
 */
export function useParticipantTracking(studyId?: string) {
  const webSocket = useWebSocket({
    onOpen: () => {
      console.log('Participant tracking WebSocket connected');
    },
  });

  // Subscribe to participant updates for specific study
  useEffect(() => {
    if (webSocket.connectionStatus === 'connected' && studyId) {
      webSocket.subscribe(`participants-${studyId}`);
      webSocket.subscribe(`study-progress-${studyId}`);
    }

    return () => {
      if (studyId) {
        webSocket.unsubscribe(`participants-${studyId}`);
        webSocket.unsubscribe(`study-progress-${studyId}`);
      }
    };
  }, [webSocket.connectionStatus, studyId, webSocket]);

  return {
    ...webSocket,
    trackParticipant: (participantId: string, status: string) => {
      webSocket.sendJsonMessage({
        type: 'participant_status',
        participantId,
        studyId,
        status,
        timestamp: Date.now(),
      });
    },
  };
}

/**
 * Hook for live analysis updates
 */
export function useLiveAnalysis(analysisId?: string) {
  const webSocket = useWebSocket();

  useEffect(() => {
    if (webSocket.connectionStatus === 'connected' && analysisId) {
      webSocket.subscribe(`analysis-${analysisId}`);
      webSocket.subscribe(`analysis-progress-${analysisId}`);
    }

    return () => {
      if (analysisId) {
        webSocket.unsubscribe(`analysis-${analysisId}`);
        webSocket.unsubscribe(`analysis-progress-${analysisId}`);
      }
    };
  }, [webSocket.connectionStatus, analysisId, webSocket]);

  return {
    ...webSocket,
    triggerAnalysis: (type: string, parameters?: any) => {
      webSocket.sendJsonMessage({
        type: 'trigger_analysis',
        analysisType: type,
        analysisId,
        parameters,
      });
    },
  };
}