'use client';

import React, { useMemo } from 'react';
import { ParticipantFlowStage } from '@/hooks/useParticipantFlow';
import { 
  CheckCircle, 
  Circle, 
  XCircle, 
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * World-class Flow Progress Tracker
 * Visual representation of participant journey with advanced features
 */

interface StageInfo {
  stage: ParticipantFlowStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: number; // minutes
}

interface FlowProgressTrackerProps {
  currentStage: ParticipantFlowStage;
  completedStages: ParticipantFlowStage[];
  progress: {
    percentage: number;
    stagesCompleted: number;
    totalStages: number;
    estimatedTimeRemaining: number;
  };
  navigation?: {
    canGoBack: boolean;
    canSkip: boolean;
  };
  onGoBack?: () => void;
  onSkip?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date;
  variant?: 'horizontal' | 'vertical' | 'minimal';
  showTimeEstimates?: boolean;
  showNavigation?: boolean;
  className?: string;
}

const STAGE_INFO: StageInfo[] = [
  {
    stage: ParticipantFlowStage.PRE_SCREENING,
    label: 'Screening',
    description: 'Answer qualifying questions',
    icon: <AlertCircle className="w-5 h-5" />,
    estimatedTime: 5
  },
  {
    stage: ParticipantFlowStage.CONSENT,
    label: 'Consent',
    description: 'Review and accept terms',
    icon: <CheckCircle className="w-5 h-5" />,
    estimatedTime: 2
  },
  {
    stage: ParticipantFlowStage.INSTRUCTIONS,
    label: 'Instructions',
    description: 'Learn how to complete the study',
    icon: <AlertCircle className="w-5 h-5" />,
    estimatedTime: 3
  },
  {
    stage: ParticipantFlowStage.Q_SORT,
    label: 'Q-Sort',
    description: 'Sort statements by agreement',
    icon: <Circle className="w-5 h-5" />,
    estimatedTime: 20
  },
  {
    stage: ParticipantFlowStage.POST_SURVEY,
    label: 'Survey',
    description: 'Answer follow-up questions',
    icon: <CheckCircle className="w-5 h-5" />,
    estimatedTime: 10
  }
];

export function FlowProgressTracker({
  currentStage,
  completedStages,
  progress,
  navigation,
  onGoBack,
  onSkip,
  onSave,
  isSaving = false,
  lastSaved,
  variant = 'horizontal',
  showTimeEstimates = true,
  showNavigation = true,
  className
}: FlowProgressTrackerProps) {
  const currentStageIndex = useMemo(() => {
    return STAGE_INFO.findIndex(info => info.stage === currentStage);
  }, [currentStage]);

  if (variant === 'minimal') {
    return (
      <MinimalProgressTracker
        progress={progress}
        currentStage={currentStage}
        onSave={onSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        className={className}
      />
    );
  }

  if (variant === 'vertical') {
    return (
      <VerticalProgressTracker
        stages={STAGE_INFO}
        currentStage={currentStage}
        currentStageIndex={currentStageIndex}
        completedStages={completedStages}
        progress={progress}
        navigation={navigation}
        onGoBack={onGoBack}
        onSkip={onSkip}
        onSave={onSave}
        isSaving={isSaving}
        showTimeEstimates={showTimeEstimates}
        showNavigation={showNavigation}
        className={className}
      />
    );
  }

  return (
    <HorizontalProgressTracker
      stages={STAGE_INFO}
      currentStage={currentStage}
      currentStageIndex={currentStageIndex}
      completedStages={completedStages}
      progress={progress}
      navigation={navigation}
      onGoBack={onGoBack}
      onSkip={onSkip}
      onSave={onSave}
      isSaving={isSaving}
      lastSaved={lastSaved}
      showTimeEstimates={showTimeEstimates}
      showNavigation={showNavigation}
      className={className}
    />
  );
}

/**
 * Horizontal progress tracker (default)
 */
function HorizontalProgressTracker({
  stages,
  currentStage,
  currentStageIndex: _currentStageIndex,
  completedStages,
  progress,
  navigation,
  onGoBack,
  onSkip,
  onSave,
  isSaving,
  lastSaved,
  showTimeEstimates,
  showNavigation,
  className
}: any) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {progress.percentage}%
          </span>
          {showTimeEstimates && (
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              ~{progress.estimatedTimeRemaining} min remaining
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          {stages.map((stage: StageInfo, index: number) => {
            const isCompleted = completedStages.includes(stage.stage);
            const isCurrent = stage.stage === currentStage;
            const isFailed = stage.stage === ParticipantFlowStage.PRE_SCREENING_FAILED;
            
            return (
              <React.Fragment key={stage.stage}>
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all',
                      {
                        'bg-green-100 text-green-600': isCompleted && !isCurrent,
                        'bg-blue-600 text-white ring-4 ring-blue-100': isCurrent,
                        'bg-gray-100 text-gray-400': !isCompleted && !isCurrent,
                        'bg-red-100 text-red-600': isFailed
                      }
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center',
                    isCurrent ? 'text-blue-600' : 'text-gray-600'
                  )}>
                    {stage.label}
                  </span>
                  {isCurrent && showTimeEstimates && (
                    <span className="text-xs text-gray-500 mt-1">
                      ~{stage.estimatedTime} min
                    </span>
                  )}
                </div>
                {index < stages.length - 1 && (
                  <div className="flex-1 px-2">
                    <div 
                      className={cn(
                        'h-0.5 transition-all',
                        isCompleted ? 'bg-green-400' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Navigation controls */}
      {showNavigation && (
        <div className="px-6 pb-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            {navigation?.canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
            {navigation?.canSkip && onSkip && (
              <button
                onClick={onSkip}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Skip
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={cn(
                  'flex items-center px-3 py-1.5 text-sm rounded-md transition-colors',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  isSaving && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Progress
                  </>
                )}
              </button>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {formatTimeAgo(lastSaved)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Vertical progress tracker
 */
function VerticalProgressTracker({
  stages,
  currentStage,
  currentStageIndex,
  completedStages,
  progress,
  navigation,
  onGoBack,
  onSkip,
  onSave,
  isSaving,
  showTimeEstimates,
  showNavigation,
  className
}: any) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Progress</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Step {currentStageIndex + 1} of {stages.length}
          </span>
          <span className="font-medium text-blue-600">
            {progress.percentage}% Complete
          </span>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage: StageInfo, index: number) => {
          const isCompleted = completedStages.includes(stage.stage);
          const isCurrent = stage.stage === currentStage;
          const isPending = !isCompleted && !isCurrent;
          
          return (
            <div 
              key={stage.stage}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all',
                isCurrent && 'bg-blue-50 border border-blue-200',
                isCompleted && !isCurrent && 'opacity-60'
              )}
            >
              <div 
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  {
                    'bg-green-100 text-green-600': isCompleted,
                    'bg-blue-600 text-white': isCurrent,
                    'bg-gray-100 text-gray-400': isPending
                  }
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    'font-medium',
                    isCurrent ? 'text-blue-900' : 'text-gray-900'
                  )}>
                    {stage.label}
                  </h4>
                  {showTimeEstimates && !isCompleted && (
                    <span className="text-xs text-gray-500">
                      ~{stage.estimatedTime} min
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      {showNavigation && (navigation?.canGoBack || navigation?.canSkip || onSave) && (
        <div className="mt-6 pt-6 border-t space-y-2">
          {navigation?.canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Go Back
            </button>
          )}
          {navigation?.canSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              Skip This Step
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className={cn(
                'w-full flex items-center justify-center px-4 py-2 text-sm rounded-md transition-colors',
                'bg-gray-800 text-white hover:bg-gray-900',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save & Continue Later
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal progress tracker
 */
function MinimalProgressTracker({
  progress,
  currentStage,
  onSave,
  isSaving,
  lastSaved,
  className
}: any) {
  const currentStageInfo = STAGE_INFO.find(info => info.stage === currentStage);
  
  return (
    <div className={cn('flex items-center justify-between bg-white px-4 py-2 rounded-md shadow-sm', className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-32 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {progress.percentage}%
          </span>
        </div>
        
        {currentStageInfo && (
          <span className="text-sm text-gray-700">
            {currentStageInfo.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lastSaved && (
          <span className="text-xs text-gray-500">
            Saved {formatTimeAgo(lastSaved)}
          </span>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              'hover:bg-gray-100',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <RotateCcw className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <Save className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Format time ago helper
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}