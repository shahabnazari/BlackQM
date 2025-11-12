'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { ResearchPhase } from '@/components/navigation/PrimaryToolbar';
// import { io, Socket } from 'socket.io-client'; // TODO: Install socket.io-client

interface NavigationState {
  currentPhase: ResearchPhase;
  currentTool?: string;
  phaseProgress: Record<ResearchPhase, number>;
  completedPhases: ResearchPhase[];
  availablePhases: ResearchPhase[];
  studyId?: string;
  preferences: {
    compactMode: boolean;
    showShortcuts: boolean;
    theme: string;
  };
}

interface NavigationContextType extends NavigationState {
  setCurrentPhase: (phase: ResearchPhase) => void;
  setCurrentTool: (tool: string) => void;
  trackAction: (phase: ResearchPhase, action: string) => void;
  refreshState: () => void;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
  studyId,
}: {
  children: React.ReactNode;
  studyId?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPhase: 'discover',
    currentTool: '',
    phaseProgress: {
      discover: 0,
      design: 0,
      build: 0,
      recruit: 0,
      collect: 0,
      analyze: 0,
      visualize: 0,
      interpret: 0,
      report: 0,
      archive: 0,
    },
    completedPhases: [],
    availablePhases: ['discover', 'design'],
    ...(studyId && { studyId }),
    preferences: {
      compactMode: false,
      showShortcuts: true,
      theme: 'light',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  // const [socket, setSocket] = useState<Socket | null>(null); // TODO: Implement WebSocket

  // Fetch navigation state from backend
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchNavigationState = async () => {
      try {
        const params = studyId ? `?studyId=${studyId}` : '';
        // Get token from correct localStorage key
        const token =
          localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch(`/api/navigation/state${params}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNavigationState({
            currentPhase: data.currentPhase,
            currentTool: data.currentTool,
            phaseProgress: data.phaseProgress,
            completedPhases: data.completedPhases,
            availablePhases: data.availablePhases,
            studyId: data.studyId,
            preferences: data.preferences,
          });
        }
      } catch (error) {
        console.error('Failed to fetch navigation state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigationState();
  }, [isAuthenticated, user, studyId]);

  // Setup WebSocket connection for real-time updates
  // TODO: Implement WebSocket after installing socket.io-client
  /*
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io(`${process.env['NEXT_PUBLIC_WS_URL'] || 'http://localhost:4000'}/navigation`, {
      auth: {
        token: localStorage.getItem('access_token') || localStorage.getItem('token'),
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to navigation WebSocket');
    });

    newSocket.on('stateUpdated', (state: NavigationState) => {
      setNavigationState(state);
    });

    newSocket.on('phaseChanged', (data: { phase: ResearchPhase }) => {
      setNavigationState(prev => ({
        ...prev,
        currentPhase: data.phase,
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);
  */

  const setCurrentPhase = async (phase: ResearchPhase) => {
    if (!availablePhases.includes(phase)) return;

    // Update local state immediately for responsiveness
    setNavigationState(prev => ({
      ...prev,
      currentPhase: phase,
    }));

    // Update backend
    try {
      await fetch('/api/navigation/phase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ phase, studyId }),
      });
    } catch (error) {
      console.error('Failed to update phase:', error);
    }
  };

  const setCurrentTool = (tool: string) => {
    setNavigationState(prev => ({
      ...prev,
      currentTool: tool,
    }));
  };

  const trackAction = async (phase: ResearchPhase, action: string) => {
    if (!studyId) return;

    try {
      await fetch('/api/navigation/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ studyId, phase, action }),
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  const refreshState = async () => {
    setIsLoading(true);
    try {
      const params = studyId ? `?studyId=${studyId}` : '';
      const response = await fetch(`/api/navigation/state${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNavigationState({
          currentPhase: data.currentPhase,
          currentTool: data.currentTool,
          phaseProgress: data.phaseProgress,
          completedPhases: data.completedPhases,
          availablePhases: data.availablePhases,
          studyId: data.studyId,
          preferences: data.preferences,
        });
      }
    } catch (error) {
      console.error('Failed to refresh navigation state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { availablePhases } = navigationState;

  return (
    <NavigationContext.Provider
      value={{
        ...navigationState,
        setCurrentPhase,
        setCurrentTool,
        trackAction,
        refreshState,
        isLoading,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationState() {
  const context = useContext(NavigationContext);
  if (!context) {
    // Return default values when not in provider
    return {
      currentPhase: 'discover' as ResearchPhase,
      currentTool: undefined,
      phaseProgress: {
        discover: 0,
        design: 0,
        build: 0,
        recruit: 0,
        collect: 0,
        analyze: 0,
        visualize: 0,
        interpret: 0,
        report: 0,
        archive: 0,
      },
      completedPhases: [] as ResearchPhase[],
      availablePhases: ['discover', 'design'] as ResearchPhase[],
      studyId: undefined,
      preferences: {
        compactMode: false,
        showShortcuts: true,
        theme: 'light',
      },
      setCurrentPhase: (_phase: ResearchPhase) => {},
      setCurrentTool: (_tool: string) => {},
      trackAction: (_phase: ResearchPhase, _action: string) => {},
      refreshState: () => {},
      isLoading: false,
    };
  }
  return context;
}
