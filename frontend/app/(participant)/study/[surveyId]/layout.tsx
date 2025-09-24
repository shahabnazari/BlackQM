'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useParticipantFlow, ParticipantFlowStage } from '@/hooks/useParticipantFlow';
import { FlowGuard } from '@/components/participant/FlowGuard';
import { FlowProgressTracker } from '@/components/participant/FlowProgressTracker';
import { toast } from 'sonner';

/**
 * World-class Participant Study Layout
 * Orchestrates the complete participant journey with flow management
 */

interface StudyLayoutProps {
  children: React.ReactNode;
}

export default function StudyLayout({ children }: StudyLayoutProps) {
  const params = useParams();
  const surveyId = params.surveyId as string;
  const [isMobile, setIsMobile] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize participant flow
  const {
    flowState,
    navigationGuards,
    isLoading,
    isSaving,
    error,
    goNext,
    goBack,
    skipStage,
    saveProgress,
    abandonFlow,
    trackMetrics,
    canProceed,
    canGoBack,
    canSkip,
    progress,
    currentStage,
    completedStages
  } = useParticipantFlow({
    surveyId,
    autoSave: true,
    autoSaveInterval: 60000, // Auto-save every minute
    onStageComplete: (stage) => {
      toast.success(`${getStageLabel(stage)} completed!`);
      trackMetrics({ interactions: 1 });
    },
    onFlowComplete: () => {
      toast.success('Study completed! Thank you for your participation.');
      setHasUnsavedChanges(false);
    },
    onFlowAbandoned: () => {
      toast.info('You can resume your progress later.');
    }
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track page visibility for auto-save
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        saveProgress(flowState?.stageData || {}, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasUnsavedChanges, flowState, saveProgress]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProgress();
      }
      // Alt + ← to go back
      if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        goBack();
      }
      // Alt + → to go next
      if (e.altKey && e.key === 'ArrowRight' && canProceed) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canGoBack, canProceed, goBack, goNext]);

  // Handle save progress
  const handleSaveProgress = async () => {
    if (!flowState) return;
    
    try {
      const savePoint = await saveProgress(flowState.stageData, false);
      setHasUnsavedChanges(false);
      
      // Store save point reference in localStorage
      if (savePoint) {
        localStorage.setItem(
          `flow_savepoint_${surveyId}`,
          JSON.stringify({
            timestamp: savePoint.timestamp,
            stage: savePoint.stageId
          })
        );
      }
    } catch (error) {
      toast.error('Failed to save progress');
    }
  };

  // Handle navigation
  const handleGoNext = async (stageData?: any) => {
    if (hasUnsavedChanges) {
      await handleSaveProgress();
    }
    goNext(stageData);
  };

  const handleGoBack = async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Do you want to save before going back?'
      );
      if (confirm) {
        await handleSaveProgress();
      }
    }
    goBack();
  };

  const handleSkip = async () => {
    const confirm = window.confirm(
      'Are you sure you want to skip this step? You may not be able to return to it.'
    );
    if (confirm) {
      skipStage();
    }
  };

  // Handle abandonment
  const handleAbandon = async () => {
    const confirm = window.confirm(
      'Are you sure you want to leave? Your progress will be saved and you can resume later.'
    );
    if (confirm) {
      await handleSaveProgress();
      abandonFlow('User requested to leave');
    }
  };

  // Loading state
  if (isLoading && !flowState) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
  }

  // No flow state
  if (!flowState) {
    return <ErrorScreen error="Unable to initialize study flow" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress tracker */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FlowProgressTracker
            currentStage={currentStage || ParticipantFlowStage.NOT_STARTED}
            completedStages={completedStages}
            progress={progress || {
              percentage: 0,
              stagesCompleted: 0,
              totalStages: 5,
              estimatedTimeRemaining: 40
            }}
            navigation={{
              canGoBack,
              canSkip
            }}
            onGoBack={canGoBack ? () => { handleGoBack() } : () => {}}
            onSkip={canSkip ? handleSkip : () => {}}
            onSave={handleSaveProgress}
            isSaving={isSaving}
            lastSaved={flowState.lastActivity}
            variant={isMobile ? 'minimal' : 'horizontal'}
            showTimeEstimates={!isMobile}
            showNavigation={true}
          />
        </div>
      </div>

      {/* Main content with flow guard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlowGuard
          requiredStage={currentStage || ParticipantFlowStage.NOT_STARTED}
          flowState={{
            currentStage: currentStage || ParticipantFlowStage.NOT_STARTED,
            completedStages,
            canProceed
          }}
          fallbackRoute={`/study/${surveyId}/welcome`}
        >
          {/* Context provider for child components */}
          <FlowContext.Provider
            value={{
              flowState,
              navigationGuards,
              isLoading,
              isSaving,
              goNext: handleGoNext,
              goBack: handleGoBack,
              skipStage: handleSkip,
              saveProgress: handleSaveProgress,
              abandonFlow: handleAbandon,
              trackMetrics,
              setHasUnsavedChanges
            }}
          >
            {children}
          </FlowContext.Provider>
        </FlowGuard>
      </div>

      {/* Mobile navigation bar */}
      {isMobile && (
        <MobileNavigationBar
          canGoBack={canGoBack}
          canProceed={canProceed}
          onGoBack={handleGoBack}
          onGoNext={handleGoNext}
          onSave={handleSaveProgress}
          isSaving={isSaving}
        />
      )}

      {/* Exit confirmation modal */}
      <ExitConfirmationModal
        isOpen={hasUnsavedChanges}
        onSave={handleSaveProgress}
        onAbandon={handleAbandon}
      />
    </div>
  );
}

/**
 * Flow context for child components
 */
export const FlowContext = React.createContext<any>(null);

export function useFlowContext() {
  const context = React.useContext(FlowContext);
  if (!context) {
    throw new Error('useFlowContext must be used within FlowContext.Provider');
  }
  return context;
}

/**
 * Loading screen component
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Study...
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your experience
        </p>
      </div>
    </div>
  );
}

/**
 * Error screen component
 */
function ErrorScreen({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile navigation bar
 */
function MobileNavigationBar({
  canGoBack,
  canProceed,
  onGoBack,
  onGoNext,
  onSave,
  isSaving
}: any) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50">
      <button
        onClick={onGoBack}
        disabled={!canGoBack}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          canGoBack
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
      >
        Back
      </button>
      
      <button
        onClick={onSave}
        disabled={isSaving}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
        </svg>
      </button>
      
      <button
        onClick={onGoNext}
        disabled={!canProceed}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          canProceed
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </div>
  );
}

/**
 * Exit confirmation modal
 */
function ExitConfirmationModal({
  isOpen,
  onSave: _onSave,
  onAbandon: _onAbandon
}: {
  isOpen: boolean;
  onSave: () => void;
  onAbandon: () => void;
}) {
  if (!isOpen) return null;

  return null; // Implementation would go here
}

/**
 * Get stage label helper
 */
function getStageLabel(stage: ParticipantFlowStage): string {
  const labels: Record<ParticipantFlowStage, string> = {
    [ParticipantFlowStage.NOT_STARTED]: 'Welcome',
    [ParticipantFlowStage.PRE_SCREENING]: 'Screening',
    [ParticipantFlowStage.PRE_SCREENING_FAILED]: 'Screening',
    [ParticipantFlowStage.CONSENT]: 'Consent',
    [ParticipantFlowStage.INSTRUCTIONS]: 'Instructions',
    [ParticipantFlowStage.Q_SORT]: 'Q-Sort',
    [ParticipantFlowStage.POST_SURVEY]: 'Survey',
    [ParticipantFlowStage.COMPLETED]: 'Complete',
    [ParticipantFlowStage.ABANDONED]: 'Paused'
  };
  return labels[stage] || stage;
}