import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * World-class Participant Flow Hook
 * Manages the complete participant journey with advanced state management
 */

export enum ParticipantFlowStage {
  NOT_STARTED = 'NOT_STARTED',
  PRE_SCREENING = 'PRE_SCREENING',
  PRE_SCREENING_FAILED = 'PRE_SCREENING_FAILED',
  CONSENT = 'CONSENT',
  INSTRUCTIONS = 'INSTRUCTIONS',
  Q_SORT = 'Q_SORT',
  POST_SURVEY = 'POST_SURVEY',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface FlowState {
  currentStage: ParticipantFlowStage;
  completedStages: ParticipantFlowStage[];
  stageData: Record<string, any>;
  lastActivity: Date;
  sessionId: string;
  participantId: string;
  surveyId: string;
  canProceed: boolean;
  requiredActions: string[];
  progress: {
    percentage: number;
    stagesCompleted: number;
    totalStages: number;
    estimatedTimeRemaining: number;
  };
  navigation: {
    nextStage: ParticipantFlowStage | null;
    previousStage: ParticipantFlowStage | null;
    canGoBack: boolean;
    canSkip: boolean;
  };
  metadata: {
    startTime: Date;
    device: string;
    browser: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
}

interface NavigationGuards {
  canProceed: boolean;
  canGoBack: boolean;
  canSkip: boolean;
  blockers: string[];
  warnings: string[];
}

interface UseParticipantFlowOptions {
  surveyId: string;
  participantId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onStageComplete?: (stage: ParticipantFlowStage) => void;
  onFlowComplete?: () => void;
  onFlowAbandoned?: (reason: string) => void;
}

const STAGE_ROUTES: Record<ParticipantFlowStage, string> = {
  [ParticipantFlowStage.NOT_STARTED]: '/study/welcome',
  [ParticipantFlowStage.PRE_SCREENING]: '/study/pre-screening',
  [ParticipantFlowStage.PRE_SCREENING_FAILED]: '/study/disqualified',
  [ParticipantFlowStage.CONSENT]: '/study/consent',
  [ParticipantFlowStage.INSTRUCTIONS]: '/study/instructions',
  [ParticipantFlowStage.Q_SORT]: '/study/q-sort',
  [ParticipantFlowStage.POST_SURVEY]: '/study/post-survey',
  [ParticipantFlowStage.COMPLETED]: '/study/thank-you',
  [ParticipantFlowStage.ABANDONED]: '/study/abandoned',
};

export function useParticipantFlow({
  surveyId,
  participantId,
  autoSave = true,
  autoSaveInterval = 60000, // 1 minute
  onStageComplete,
  onFlowComplete,
  onFlowAbandoned,
}: UseParticipantFlowOptions) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [navigationGuards, setNavigationGuards] =
    useState<NavigationGuards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date>(new Date());
  const activityRef = useRef<NodeJS.Timeout | null>(null);
  const beforeUnloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  /**
   * Initialize flow state
   */
  const initializeFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const metadata = {
        device: detectDevice(),
        browser: detectBrowser(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      };

      const response = await fetch('/api/participant-flow/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          participantId: participantId || generateParticipantId(),
          sessionId: generateSessionId(),
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize flow');
      }

      const state = await response.json();
      setFlowState(state);

      // Navigate to current stage
      const route =
        state.currentStage in STAGE_ROUTES
          ? STAGE_ROUTES[state.currentStage as ParticipantFlowStage]
          : undefined;
      if (route && window.location.pathname !== route) {
        router.push(route);
      }

      // Load navigation guards
      await loadNavigationGuards(state.surveyId, state.participantId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initialize flow'
      );
      console.error('Flow initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, participantId, router]);

  /**
   * Transition to next stage with validation
   */
  const transitionToStage = useCallback(
    async (targetStage: ParticipantFlowStage, stageData?: any) => {
      if (!flowState) return;

      try {
        setIsLoading(true);

        // Check navigation guards first
        if (navigationGuards && !navigationGuards.canProceed) {
          toast.error('Cannot proceed', {
            description: navigationGuards.blockers.join(', '),
          });
          return;
        }

        const response = await fetch(
          `/api/participant-flow/${flowState.surveyId}/${flowState.participantId}/transition`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetStage, stageData }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Transition failed');
        }

        const newState = await response.json();
        setFlowState(newState);

        // Navigate to new stage
        const route = STAGE_ROUTES[targetStage];
        router.push(route);

        // Trigger callbacks
        if (
          onStageComplete &&
          flowState.currentStage !== ParticipantFlowStage.NOT_STARTED
        ) {
          onStageComplete(flowState.currentStage);
        }

        if (targetStage === ParticipantFlowStage.COMPLETED && onFlowComplete) {
          onFlowComplete();
        }

        // Update guards for new stage
        await loadNavigationGuards(newState.surveyId, newState.participantId);

        toast.success('Progress saved');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Transition failed';
        setError(message);
        toast.error('Navigation failed', { description: message });
      } finally {
        setIsLoading(false);
      }
    },
    [flowState, navigationGuards, router, onStageComplete, onFlowComplete]
  );

  /**
   * Save current progress
   */
  const saveProgress = useCallback(
    async (data: any, isPartial = false) => {
      if (!flowState || isSaving) return;

      try {
        setIsSaving(true);

        const response = await fetch(
          `/api/participant-flow/${flowState.surveyId}/${flowState.participantId}/save`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, isPartial }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save progress');
        }

        const savePoint = await response.json();
        lastSaveRef.current = new Date();

        // Update local state
        setFlowState(prev =>
          prev
            ? {
                ...prev,
                stageData: {
                  ...prev.stageData,
                  [`${prev.currentStage}_savepoint`]: savePoint,
                },
              }
            : null
        );

        if (!isPartial) {
          toast.success('Progress saved');
        }

        return savePoint;
      } catch (err) {
        console.error('Save progress error:', err);
        toast.error('Failed to save progress');
      } finally {
        setIsSaving(false);
      }
    },
    [flowState, isSaving]
  );

  /**
   * Resume from saved progress
   */
  const resumeFromSavePoint = useCallback(async () => {
    if (!flowState) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/participant-flow/${flowState.surveyId}/${flowState.participantId}/resume`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: flowState.sessionId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resume progress');
      }

      const resumedState = await response.json();
      setFlowState(resumedState);

      // Navigate to resumed stage
      const route =
        resumedState.currentStage in STAGE_ROUTES
          ? STAGE_ROUTES[resumedState.currentStage as ParticipantFlowStage]
          : undefined;
      if (route) {
        router.push(route);
      }

      toast.success('Progress restored');
    } catch (err) {
      setError('Failed to resume progress');
      console.error('Resume error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [flowState, router]);

  /**
   * Navigate to previous stage
   */
  const goBack = useCallback(async () => {
    if (!flowState || !navigationGuards?.canGoBack) return;

    const previousStage = flowState.navigation.previousStage;
    if (previousStage) {
      await transitionToStage(previousStage);
    }
  }, [flowState, navigationGuards, transitionToStage]);

  /**
   * Navigate to next stage
   */
  const goNext = useCallback(
    async (stageData?: any) => {
      if (!flowState || !navigationGuards?.canProceed) return;

      const nextStage = flowState.navigation.nextStage;
      if (nextStage) {
        await transitionToStage(nextStage, stageData);
      }
    },
    [flowState, navigationGuards, transitionToStage]
  );

  /**
   * Skip current stage if allowed
   */
  const skipStage = useCallback(async () => {
    if (!flowState || !navigationGuards?.canSkip) return;

    const nextStage = flowState.navigation.nextStage;
    if (nextStage) {
      await transitionToStage(nextStage, { skipped: true });
    }
  }, [flowState, navigationGuards, transitionToStage]);

  /**
   * Handle flow abandonment
   */
  const abandonFlow = useCallback(
    async (reason?: string) => {
      if (!flowState) return;

      try {
        await fetch(
          `/api/participant-flow/${flowState.surveyId}/${flowState.participantId}/abandon`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          }
        );

        if (onFlowAbandoned) {
          onFlowAbandoned(reason || 'User abandoned flow');
        }

        router.push('/study/abandoned');
      } catch (err) {
        console.error('Abandon flow error:', err);
      }
    },
    [flowState, router, onFlowAbandoned]
  );

  /**
   * Track stage metrics
   */
  const trackMetrics = useCallback(
    async (metrics: {
      interactions?: number;
      errors?: number;
      helperUsage?: boolean;
      deviceChanges?: boolean;
    }) => {
      if (!flowState) return;

      try {
        await fetch(
          `/api/participant-flow/${flowState.surveyId}/${flowState.participantId}/metrics`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metrics),
          }
        );
      } catch (err) {
        console.error('Track metrics error:', err);
      }
    },
    [flowState]
  );

  /**
   * Load navigation guards for current stage
   */
  const loadNavigationGuards = useCallback(
    async (surveyId: string, participantId: string) => {
      try {
        const response = await fetch(
          `/api/participant-flow/${surveyId}/${participantId}/guards`
        );

        if (response.ok) {
          const guards = await response.json();
          setNavigationGuards(guards);
        }
      } catch (err) {
        console.error('Load guards error:', err);
      }
    },
    []
  );

  /**
   * Set up auto-save interval
   */
  useEffect(() => {
    if (!autoSave || !flowState) return;

    autoSaveRef.current = setInterval(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current.getTime();
      if (timeSinceLastSave >= autoSaveInterval) {
        saveProgress(flowState.stageData, true);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, flowState, saveProgress]);

  /**
   * Set up activity tracking
   */
  useEffect(() => {
    if (!flowState) return;

    const handleActivity = () => {
      if (activityRef.current) {
        clearTimeout(activityRef.current);
      }

      activityRef.current = setTimeout(() => {
        toast.warning('Your session will expire soon due to inactivity');
      }, 1800000); // 30 minutes
    };

    // Track various activities
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityRef.current) {
        clearTimeout(activityRef.current);
      }
    };
  }, [flowState]);

  /**
   * Set up beforeunload handler
   */
  useEffect(() => {
    if (!flowState) return;

    beforeUnloadRef.current = (e: BeforeUnloadEvent) => {
      if (
        flowState.currentStage !== ParticipantFlowStage.COMPLETED &&
        flowState.currentStage !== ParticipantFlowStage.NOT_STARTED
      ) {
        e.preventDefault();
        e.returnValue =
          'Your progress will be saved. Are you sure you want to leave?';

        // Save progress before leaving
        saveProgress(flowState.stageData, true);
      }
    };

    window.addEventListener('beforeunload', beforeUnloadRef.current);

    return () => {
      if (beforeUnloadRef.current) {
        window.removeEventListener('beforeunload', beforeUnloadRef.current);
      }
    };
  }, [flowState, saveProgress]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeFlow();
  }, [initializeFlow]);

  /**
   * Check for save points on mount
   */
  useEffect(() => {
    const checkSavePoints = async () => {
      const hasSavePoint = localStorage.getItem(`flow_savepoint_${surveyId}`);
      if (hasSavePoint && flowState) {
        const shouldResume = confirm(
          'You have saved progress. Would you like to continue where you left off?'
        );
        if (shouldResume) {
          await resumeFromSavePoint();
        }
        localStorage.removeItem(`flow_savepoint_${surveyId}`);
      }
    };

    if (flowState) {
      checkSavePoints();
    }
  }, [flowState, surveyId, resumeFromSavePoint]);

  return {
    // State
    flowState,
    navigationGuards,
    isLoading,
    isSaving,
    error,

    // Navigation
    goNext,
    goBack,
    skipStage,
    transitionToStage,

    // Progress management
    saveProgress,
    resumeFromSavePoint,
    abandonFlow,

    // Metrics
    trackMetrics,

    // Computed properties
    canProceed: navigationGuards?.canProceed || false,
    canGoBack: navigationGuards?.canGoBack || false,
    canSkip: navigationGuards?.canSkip || false,
    progress: flowState?.progress,
    currentStage: flowState?.currentStage,
    completedStages: flowState?.completedStages || [],
  };
}

// Helper functions
function generateParticipantId(): string {
  return `participant_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function detectDevice(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

function detectBrowser(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('safari') > -1) return 'Safari';
  if (userAgent.indexOf('firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('edge') > -1) return 'Edge';
  return 'Unknown';
}
