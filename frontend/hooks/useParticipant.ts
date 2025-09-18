import { useState, useEffect, useCallback } from 'react';
import {
  participantService,
  ParticipantSession,
  ParticipantRegistration,
  QSortData,
  GridPosition,
  SortingState,
} from '@/lib/api/services';
import { toast } from 'sonner';

interface UseParticipantOptions {
  sessionId?: string;
  accessCode?: string;
  autoStart?: boolean;
}

export function useParticipant(options: UseParticipantOptions = {}) {
  const {
    sessionId: initialSessionId,
    accessCode,
    autoStart = false,
  } = options;

  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [sortingState, setSortingState] = useState<SortingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Start a new session
  const startSession = useCallback(async (data: ParticipantRegistration) => {
    setLoading(true);
    setError(null);

    try {
      const newSession = await participantService.startSession(data);
      setSession(newSession);

      // Store session ID in localStorage for resume capability
      localStorage.setItem('participant_session_id', newSession.id);

      toast.success('Session started successfully');
      return newSession;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to start session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Resume an existing session
  const resumeSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const resumedSession = await participantService.resumeSession(sessionId);
      setSession(resumedSession);

      // Update progress
      if (resumedSession.responses) {
        const calculatedProgress = participantService.calculateProgress(
          resumedSession.responses
        );
        setProgress(calculatedProgress);
      }

      toast.success('Session resumed successfully');
      return resumedSession;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resume session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit consent
  const submitConsent = useCallback(
    async (agreed: boolean, signature?: string) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        await participantService.submitConsent(session.id, agreed, signature);

        // Update local session state
        setSession(prev =>
          prev
            ? {
                ...prev,
                responses: {
                  ...prev.responses,
                  consent: {
                    agreed,
                    timestamp: new Date().toISOString(),
                  },
                },
              }
            : null
        );

        setProgress(prev => prev + 100 / 6); // 6 steps total
        toast.success('Consent submitted');
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to submit consent';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Submit demographics
  const submitDemographics = useCallback(
    async (demographics: Record<string, any>) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        await participantService.submitDemographics(session.id, demographics);

        // Update local session state
        setSession(prev =>
          prev
            ? {
                ...prev,
                responses: {
                  ...prev.responses,
                  demographics,
                },
              }
            : null
        );

        setProgress(prev => prev + 100 / 6);
        toast.success('Demographics submitted');
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to submit demographics';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Initialize sorting
  const initializeSorting = useCallback(async () => {
    if (!session) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      const state = await participantService.getSortingState(session.id);
      setSortingState(state);
      return state;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to initialize sorting';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Place a statement on the grid
  const placeStatement = useCallback(
    async (statementId: string, position: { column: number; row: number }) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        const newState = await participantService.placeStatement(
          session.id,
          statementId,
          position
        );
        setSortingState(newState);
        return newState;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to place statement';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Remove a statement from the grid
  const removeStatement = useCallback(
    async (statementId: string) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        const newState = await participantService.removeStatement(
          session.id,
          statementId
        );
        setSortingState(newState);
        return newState;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to remove statement';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Undo last action
  const undo = useCallback(async () => {
    if (!session || !sortingState?.canUndo) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newState = await participantService.undoAction(session.id);
      setSortingState(newState);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to undo';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [session, sortingState]);

  // Redo last undone action
  const redo = useCallback(async () => {
    if (!session || !sortingState?.canRedo) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newState = await participantService.redoAction(session.id);
      setSortingState(newState);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to redo';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [session, sortingState]);

  // Submit the Q-sort
  const submitSort = useCallback(
    async (sortData: QSortData) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        await participantService.submitQSort(session.id, sortData);

        // Update local session state
        setSession(prev =>
          prev
            ? {
                ...prev,
                responses: {
                  ...prev.responses,
                  qSort: sortData,
                },
              }
            : null
        );

        setProgress(prev => prev + 100 / 6);
        toast.success('Q-sort submitted successfully');
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to submit Q-sort';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Submit post-sort feedback
  const submitFeedback = useCallback(
    async (feedback: any) => {
      if (!session) {
        throw new Error('No active session');
      }

      setLoading(true);
      setError(null);

      try {
        await participantService.submitFeedback(session.id, feedback);

        // Update local session state
        setSession(prev =>
          prev
            ? {
                ...prev,
                responses: {
                  ...prev.responses,
                  feedback: {
                    ...feedback,
                    timestamp: new Date().toISOString(),
                  },
                },
              }
            : null
        );

        setProgress(100);
        toast.success('Feedback submitted');
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to submit feedback';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Complete the session
  const completeSession = useCallback(async () => {
    if (!session) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await participantService.completeSession(session.id);

      // Clear session from localStorage
      localStorage.removeItem('participant_session_id');

      toast.success('Thank you for participating!');
      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to complete session';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Auto-start or resume session on mount
  useEffect(() => {
    if (autoStart) {
      if (initialSessionId) {
        resumeSession(initialSessionId);
      } else if (accessCode) {
        // Check for existing session in localStorage
        const storedSessionId = localStorage.getItem('participant_session_id');
        if (storedSessionId) {
          resumeSession(storedSessionId);
        }
      }
    }
  }, [autoStart, initialSessionId, accessCode, resumeSession]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!session) return;

    const unsubscribe = participantService.subscribeToSessionUpdates(
      session.id,
      update => {
        // Handle real-time updates
        if (update.type === 'progress') {
          setProgress(update.progress);
        } else if (update.type === 'state') {
          setSortingState(update.state);
        }
      }
    );

    return unsubscribe;
  }, [session]);

  return {
    session,
    sortingState,
    loading,
    error,
    progress,
    startSession,
    resumeSession,
    submitConsent,
    submitDemographics,
    initializeSorting,
    placeStatement,
    removeStatement,
    undo,
    redo,
    submitSort,
    submitFeedback,
    completeSession,
  };
}

// Hook for Q-sort grid management
export function useQSortGrid(_sessionId: string) {
  const [grid, setGrid] = useState<GridPosition[]>([]);
  const [unsorted, setUnsorted] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Move statement between positions
  const moveStatement = useCallback(
    (
      statementId: string,
      from: { column: number; row: number } | null,
      to: { column: number; row: number }
    ) => {
      setGrid(prev => {
        const newGrid = prev.filter((p: any) => p.statementId !== statementId);

        // Add to new position
        newGrid.push({
          statementId,
          position: to,
          value: to.column,
          timestamp: new Date().toISOString(),
        });

        return newGrid;
      });

      // Update unsorted list
      if (!from) {
        setUnsorted(prev => prev.filter((id: any) => id !== statementId));
      }
    },
    []
  );

  // Remove statement from grid
  const removeFromGrid = useCallback((statementId: string) => {
    setGrid(prev => prev.filter((p: any) => p.statementId !== statementId));
    setUnsorted(prev => [...prev, statementId]);
  }, []);

  // Check if position is occupied
  const isPositionOccupied = useCallback(
    (column: number, row: number) => {
      return grid.some(
        p => p.position.column === column && p.position.row === row
      );
    },
    [grid]
  );

  // Get statement at position
  const getStatementAtPosition = useCallback(
    (column: number, row: number) => {
      return grid.find(
        p => p.position.column === column && p.position.row === row
      )?.statementId;
    },
    [grid]
  );

  // Validate grid completeness
  const isGridComplete = useCallback(() => {
    return unsorted.length === 0;
  }, [unsorted]);

  return {
    grid,
    unsorted,
    canUndo,
    canRedo,
    moveStatement,
    removeFromGrid,
    isPositionOccupied,
    getStatementAtPosition,
    isGridComplete,
    setGrid,
    setUnsorted,
  };
}
