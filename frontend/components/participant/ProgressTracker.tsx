'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export type ParticipantStep =
  | 'pre-screening'
  | 'welcome'
  | 'consent'
  | 'familiarization'
  | 'pre-sorting'
  | 'q-sort'
  | 'commentary'
  | 'post-survey'
  | 'thank-you';

interface ProgressTrackerProps {
  currentStep: ParticipantStep;
  completedSteps: ParticipantStep[];
}

const stepLabels: Record<ParticipantStep, string> = {
  'pre-screening': 'Screening',
  'welcome': 'Welcome',
  'consent': 'Consent',
  'familiarization': 'Review',
  'pre-sorting': 'Pre-Sort',
  'q-sort': 'Q-Sort',
  'commentary': 'Comments',
  'post-survey': 'Survey',
  'thank-you': 'Complete',
};

const stepOrder: ParticipantStep[] = [
  'pre-screening',
  'welcome',
  'consent',
  'familiarization',
  'pre-sorting',
  'q-sort',
  'commentary',
  'post-survey',
  'thank-you',
];

export function ProgressTracker({ currentStep, completedSteps }: ProgressTrackerProps) {
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((completedSteps.length / stepOrder.length) * 100).toFixed(0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-label">Progress</span>
          <span className="text-sm font-medium text-secondary-label">{progress}%</span>
        </div>
        <div className="h-1 bg-quaternary-fill rounded-full overflow-hidden">
          <div
            className="h-full bg-system-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="hidden md:flex items-center justify-between">
        {stepOrder.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = currentStep === step;
          // const isPast = index < currentStepIndex;

          return (
            <div key={step} className="flex flex-col items-center space-y-2">
              {/* Step Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isCurrent && 'bg-system-blue text-white scale-110',
                  isCompleted && !isCurrent && 'bg-system-green text-white',
                  !isCompleted && !isCurrent && 'bg-quaternary-fill text-tertiary-label'
                )}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-xs font-medium text-center max-w-16',
                  isCurrent && 'text-system-blue',
                  isCompleted && !isCurrent && 'text-system-green',
                  !isCompleted && !isCurrent && 'text-tertiary-label'
                )}
              >
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden text-center">
        <span className="text-sm font-medium text-secondary-label">
          Step {currentStepIndex + 1} of {stepOrder.length}
        </span>
        <h2 className="text-lg font-semibold text-label mt-1">
          {stepLabels[currentStep]}
        </h2>
      </div>
    </div>
  );
}
